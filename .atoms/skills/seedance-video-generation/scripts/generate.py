#!/usr/bin/env python3
"""Submit one native Seedance task, poll it, archive the result, and report it to MGX."""

from __future__ import annotations

import argparse
import asyncio
import io
import json
import math
import os
import re
import sys
import tempfile
from fractions import Fraction
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlsplit, urlunsplit

import aiohttp

from metagpt.utils.report import ArtifactsReporter
from metagpt.utils.skill_script import SkillScriptExecution, emit_skill_event, run_skill_script
from metagpt.utils.workspace_media import archive_cdn_media, available_filename, is_overview_asset_context

CREATE_PATH = "/api/v3/contents/generations/tasks"
PENDING_STATUSES = {"queued", "running"}
FAILED_STATUSES = {"cancelled", "failed", "expired"}
QUERY_MAX_ATTEMPTS = 5
QUERY_RETRY_INTERVAL_SECONDS = 15
RETRYABLE_HTTP_STATUSES = {429, 500, 502, 503, 504}
TIMEOUT_ERRORS = (asyncio.TimeoutError, TimeoutError)


class SeedanceAPIError(RuntimeError):
    """Native Seedance HTTP or response error."""

    def __init__(self, message: str, *, status_code: int | None = None, payload: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def _resolve_connection(base_url: str | None, api_key: str | None) -> tuple[str, str, str | None]:
    """Return endpoint, key, and the original platform endpoint when inherited."""
    base = (base_url if base_url is not None else os.getenv("SEEDANCE_BASE_URL", "")).strip()
    key = (api_key if api_key is not None else os.getenv("SEEDANCE_API_KEY", "")).strip()
    if base or key or base_url is not None or api_key is not None:
        # Do not mix an explicit provider/account with the platform's credentials.
        if not base or not key:
            raise ValueError("Configure both SEEDANCE_BASE_URL and SEEDANCE_API_KEY (or both constructor arguments).")
        _validate_api_url(base)
        return base, key, None

    base = _required_env("METAGPT_MULTIMODAL_BASE_URL")
    key = _required_env("METAGPT_MULTIMODAL_API_KEY")
    # The platform already selects this gateway and injects its matching credentials.
    # Preserve that transport policy without requiring an end-user override.
    _validate_api_url(base, platform_base=base)
    parts = urlsplit(base)
    path = parts.path.rstrip("/")
    if path.endswith("/v1"):
        path = path[:-3] + "/ark"
    elif not path:
        path = "/ark"
    elif not path.endswith("/ark"):
        raise ValueError("Expected a OneAPI /v1 or /ark base; configure SEEDANCE_BASE_URL and SEEDANCE_API_KEY.")
    return urlunsplit(parts._replace(path=path)), key, base


def _validate_api_url(url: str, *, platform_base: str | None = None) -> None:
    try:
        parts = urlsplit(url)
        valid = (
            parts.scheme in {"http", "https"} and parts.hostname
            and not (parts.username or parts.password or parts.query or parts.fragment)
        )
    except ValueError:
        valid = False
    if not valid:
        raise ValueError("Invalid Seedance API URL; use an HTTP(S) endpoint without credentials, query or fragment.")
    if parts.scheme == "http" and os.getenv("SEEDANCE_ALLOW_INSECURE_HTTP", "").strip() != "1":
        # Bind the platform exception to the original scheme and authority (host + port).
        # A separate model-list endpoint must not inherit permission for another gateway.
        if platform_base is None or parts[:2] != urlsplit(platform_base)[:2]:
            raise ValueError(
                "Seedance API requires HTTPS outside the configured platform gateway; "
                "dedicated HTTP requires deployment opt-in via SEEDANCE_ALLOW_INSECURE_HTTP=1."
            )


def _positive_float_env(name: str, default: float) -> float:
    raw = os.getenv(name, "").strip()
    try:
        value = float(raw) if raw else default
    except ValueError:
        raise ValueError(f"{name} must be a finite number greater than 0") from None
    if not math.isfinite(value) or value <= 0:
        raise ValueError(f"{name} must be a finite number greater than 0")
    return value


def _build_urls(base_url: str) -> tuple[str, str]:
    base = base_url.strip().rstrip("/")
    if not base:
        raise ValueError("SEEDANCE_BASE_URL must not be empty")
    if base.endswith(CREATE_PATH):
        create_url = base
    elif base.endswith("/api/v3"):
        create_url = f"{base}/contents/generations/tasks"
    else:
        create_url = f"{base}{CREATE_PATH}"
    return create_url, f"{create_url}/{{task_id}}"


def _validate_request(request: dict[str, Any]) -> None:
    model = request.get("model")
    if not isinstance(model, str) or not model.strip():
        raise ValueError("stdin JSON must contain a non-empty string field: model")
    content = request.get("content")
    if not isinstance(content, list) or not content:
        raise ValueError("stdin JSON must contain a non-empty array field: content")


def _error_message(payload: Any, default: str) -> str:
    if isinstance(payload, dict):
        error = payload.get("error")
        if isinstance(error, dict):
            code = error.get("code")
            message = error.get("message")
            if code and message:
                return f"{code}: {message}"
            if message:
                return str(message)
        for key in ("message", "msg"):
            if payload.get(key):
                return str(payload[key])
    return default


async def _run_media_command(*command: str, timeout: float) -> bytes:
    process = await asyncio.create_subprocess_exec(
        *command, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        raise TimeoutError(f"{command[0]} exceeded {timeout} seconds") from None
    finally:
        if process.returncode is None:
            process.kill()
            await process.communicate()
    if process.returncode:
        raise RuntimeError(f"{command[0]} failed: {stderr.decode(errors='replace')[-1000:]}")
    return stdout


async def _probe_media(source: str) -> dict[str, Any]:
    return json.loads(await _run_media_command(
        "ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", source, timeout=30,
    ))


def _is_playback_compatible(metadata: dict[str, Any]) -> bool:
    videos = [s for s in metadata["streams"] if s["codec_type"] == "video"]
    audios = [s for s in metadata["streams"] if s["codec_type"] == "audio"]
    container = metadata["format"]
    return (
        "mp4" in container["format_name"].split(",")
        and container.get("tags", {}).get("major_brand", "").strip() != "qt"
        and len(videos) == 1
        and videos[0]["codec_name"] == "h264"
        and videos[0]["pix_fmt"] == "yuv420p"
        and all(s["codec_name"] == "aac" for s in audios)
    )


async def _prepare_playback(source: str, *, timeout: float) -> tuple[str, str]:
    """Validate a single MP4 delivery file before replacing an incompatible source."""
    original = Path(source)
    metadata = await _probe_media(source)
    if original.suffix.lower() == ".mp4" and _is_playback_compatible(metadata):
        return source, ""
    target = original if original.suffix.lower() == ".mp4" else original.with_name(
        available_filename(f"{original.stem}.mp4", occupied=set(), directory=original.parent)
    )
    with tempfile.TemporaryDirectory(prefix=".seedance-playback-", dir=original.parent) as temp_dir:
        staged = Path(temp_dir) / "playback.mp4"
        await _run_media_command(
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-n", "-xerror",
            "-i", source, "-map", "0:v:0", "-map", "0:a?",
            "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(staged), timeout=timeout,
        )
        if not staged.is_file() or not staged.stat().st_size:
            raise RuntimeError("ffmpeg produced no playable output file")
        prepared = await _probe_media(str(staged))
        before = next(s for s in metadata["streams"] if s["codec_type"] == "video")
        after = next(s for s in prepared["streams"] if s["codec_type"] == "video")
        if (
            not _is_playback_compatible(prepared)
            or (before["width"], before["height"]) != (after["width"], after["height"])
            or Fraction(before["avg_frame_rate"]) != Fraction(after["avg_frame_rate"])
            or abs(float(metadata["format"]["duration"]) - float(prepared["format"]["duration"])) > 0.25
            or sum(s["codec_type"] == "audio" for s in metadata["streams"])
            != sum(s["codec_type"] == "audio" for s in prepared["streams"])
        ):
            raise RuntimeError("Playback conversion changed media properties or produced incompatible output")
        staged.replace(target)
    if target != original:
        original.unlink()
    notice = (
        f"Video was re-encoded from {before['codec_name']}/{before['pix_fmt']} "
        "to MP4/H.264 yuv420p for playback compatibility. Re-encoding is lossy."
    )
    if re.search(r"10(?:le|be)$", before["pix_fmt"]):
        notice += " Color depth was reduced from 10-bit to 8-bit; color gradation may be reduced."
    return str(target), notice


class SeedanceVideoGenerator:
    def __init__(
        self,
        *,
        base_url: str | None = None,
        api_key: str | None = None,
        working_dir: str | Path | None = None,
        poll_interval_seconds: float | None = None,
        max_poll_seconds: float | None = None,
        request_timeout_seconds: float | None = None,
        artifacts_reporter: ArtifactsReporter | None = None,
    ):
        self.base_url, self.api_key, self._platform_base = _resolve_connection(base_url, api_key)
        self.transcode_timeout_seconds = _positive_float_env("SEEDANCE_TRANSCODE_TIMEOUT_SECONDS", 300.0)
        self.create_url, self.get_url_template = _build_urls(self.base_url)
        self.working_dir = str(Path(working_dir or Path.cwd()))
        self.poll_interval_seconds = (
            poll_interval_seconds
            if poll_interval_seconds is not None
            else _positive_float_env("SEEDANCE_POLL_INTERVAL_SECONDS", 15.0)
        )
        self.max_poll_seconds = (
            max_poll_seconds
            if max_poll_seconds is not None
            else _positive_float_env("SEEDANCE_MAX_POLL_SECONDS", 3600.0)
        )
        self.request_timeout_seconds = (
            request_timeout_seconds
            if request_timeout_seconds is not None
            else _positive_float_env("SEEDANCE_REQUEST_TIMEOUT_SECONDS", 60.0)
        )
        if min(self.poll_interval_seconds, self.max_poll_seconds, self.request_timeout_seconds) <= 0:
            raise ValueError("poll interval, poll timeout, and request timeout must be greater than 0")
        self.artifacts_reporter = artifacts_reporter or ArtifactsReporter()
        self.current_task_id = ""
        self.current_filename = ""
        self.last_task: dict[str, Any] = {}

    @property
    def headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def _request_json(
        self,
        method: str,
        url: str,
        *,
        json_body: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        # Also covers the local launcher's independently configured model-list endpoint.
        _validate_api_url(url, platform_base=self._platform_base)
        timeout = aiohttp.ClientTimeout(total=self.request_timeout_seconds)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.request(method, url, headers=self.headers, json=json_body, allow_redirects=False) as response:
                if 300 <= response.status < 400:
                    raise SeedanceAPIError(
                        "Seedance API redirects are not supported; configure the final endpoint.",
                        status_code=response.status,
                    )
                text = await response.text()
                try:
                    payload = json.loads(text) if text else {}
                except json.JSONDecodeError as exc:
                    raise SeedanceAPIError(
                        f"Seedance returned non-JSON HTTP {response.status}",
                        status_code=response.status,
                    ) from exc
                if response.status >= 400:
                    raise SeedanceAPIError(
                        _error_message(payload, f"Seedance HTTP {response.status}"),
                        status_code=response.status,
                        payload=payload,
                    )
                if not isinstance(payload, dict):
                    raise SeedanceAPIError("Seedance response JSON must be an object", payload=payload)
                return payload

    async def create_task(self, request: dict[str, Any]) -> dict[str, Any]:
        return await self._request_json("POST", self.create_url, json_body=request)

    async def get_task(self, task_id: str) -> dict[str, Any]:
        url = self.get_url_template.format(task_id=quote(task_id, safe=""))
        for attempt in range(QUERY_MAX_ATTEMPTS):
            try:
                return await self._request_json("GET", url)
            except (aiohttp.ClientConnectionError, aiohttp.ClientPayloadError, *TIMEOUT_ERRORS) as exc:
                if attempt == QUERY_MAX_ATTEMPTS - 1:
                    if isinstance(exc, TIMEOUT_ERRORS):
                        raise SeedanceAPIError(f"Query timed out after {QUERY_MAX_ATTEMPTS} attempts") from exc
                    raise
            except SeedanceAPIError as exc:
                if exc.status_code not in RETRYABLE_HTTP_STATUSES or attempt == QUERY_MAX_ATTEMPTS - 1:
                    raise
            await asyncio.sleep(max(self.poll_interval_seconds, QUERY_RETRY_INTERVAL_SECONDS))

    async def _archive(self, url: str, *, media_dir: str, fallback_filename: str) -> str:
        archive = await archive_cdn_media(
            working_dir=self.working_dir,
            media_dir=media_dir,
            url=url,
            timeout=max(int(self.request_timeout_seconds), 300),
            fallback_filename=fallback_filename,
            is_overview_asset=is_overview_asset_context(),
        )
        return archive["workspace_absolute_path"]

    def _redact(self, value: Any) -> Any:
        """Sanitize output copies without changing requests or internal task state."""
        if isinstance(value, str):
            return value.replace(self.api_key, "[REDACTED]") if self.api_key else value
        if isinstance(value, dict):
            return {self._redact(key): self._redact(item) for key, item in value.items()}
        if isinstance(value, list):
            return [self._redact(item) for item in value]
        return value

    async def _report_failed(self, filename: str, task_id: str, error: Any) -> None:
        await self.artifacts_reporter.async_report(
            {
                "filename": filename,
                "status": "failed",
                "artifact_type": "video",
                "task_id": task_id,
                "error": self._redact(error),
            },
            "object",
        )

    async def generate(self, request: dict[str, Any]) -> dict[str, Any]:
        _validate_request(request)
        task_dir = Path(self.working_dir) / ".seedance/tasks"
        task_dir.mkdir(parents=True, exist_ok=True)
        created = await self.create_task(request)
        task_id = created.get("id")
        if not isinstance(task_id, str) or not task_id.strip():
            raise SeedanceAPIError("Create Task succeeded but response is missing id", payload=created)

        self.current_task_id = task_id
        record_path = task_dir / f"task-{quote(task_id, safe='')}.json"
        # Emit before disk/reporting work so even a local write failure keeps the ID visible.
        emit_skill_event(SKILL, "submitted", result={"task_id": task_id, "record_path": str(record_path)})
        # Resume uses the configured endpoint/account and needs only the task ID.
        record = json.dumps({"task_id": task_id}, ensure_ascii=False)
        with record_path.open("x", encoding="utf-8") as stream:
            stream.write(record)
            stream.flush()
            os.fsync(stream.fileno())
        return await self._finish_task(created, request.get("output_format", "mp4"))

    async def resume(self, task_id: str) -> dict[str, Any]:
        if not isinstance(task_id, str) or not task_id.strip():
            raise ValueError("task_id must be a non-empty string")
        self.current_task_id = task_id
        return await self._finish_task({"id": task_id}, "mp4")

    async def _poll(self, created: dict[str, Any]) -> dict[str, Any]:
        task_id = created["id"]
        task = created if created.get("status") else await self.get_task(task_id)
        self.last_task = task
        while str(task.get("status", "")).lower() in PENDING_STATUSES:
            await asyncio.sleep(self.poll_interval_seconds)
            task = await self.get_task(task_id)
            self.last_task = task
        return task

    async def _finish_task(self, created: dict[str, Any], output_format: str) -> dict[str, Any]:
        task_id = created["id"]
        safe_task_id = re.sub(r"[^A-Za-z0-9._-]+", "-", task_id).strip("-.") or "task"
        suffix = output_format if output_format in {"mp4", "mov"} else "mp4"
        filename = f"seedance-{safe_task_id}.{suffix}"
        self.current_task_id = task_id
        self.current_filename = filename
        await self.artifacts_reporter.async_report(
            {
                "filename": filename,
                "status": "running",
                "artifact_type": "video",
                "task_id": task_id,
            },
            "object",
        )

        try:
            task = await asyncio.wait_for(self._poll(created), timeout=self.max_poll_seconds)
        except asyncio.TimeoutError:
            error = {
                "code": "LocalPollingTimeout",
                "message": f"Stopped polling after {self.max_poll_seconds:g} seconds; resume using task_id.",
            }
            await self._report_failed(filename, task_id, error)
            return {
                "status": "failed", "task_id": task_id, "recoverable": True, "error": error,
                "task_status": self.last_task.get("status"), "task": self.last_task,
            }

        # A resumed task obtains its format from the server, without needing the original request.
        if task.get("output_format") in {"mp4", "mov"}:
            filename = f"seedance-{safe_task_id}.{task['output_format']}"
            self.current_filename = filename
        task_status = str(task.get("status", "")).lower()
        if task_status in FAILED_STATUSES:
            error = task.get("error") or {"message": f"Seedance task ended with status {task_status}"}
            await self._report_failed(filename, task_id, error)
            return {
                "status": "failed",
                "task_id": task_id,
                "task_status": task_status,
                "error": error,
                "task": task,
            }
        if task_status != "succeeded":
            error = {"message": f"Seedance returned unknown task status: {task_status or 'missing'}"}
            await self._report_failed(filename, task_id, error)
            return {
                "status": "failed",
                "task_id": task_id,
                "task_status": task_status or None,
                "error": error,
                "task": task,
            }

        content = task.get("content")
        if not isinstance(content, dict):
            raise SeedanceAPIError("Succeeded task response is missing content", payload=task)
        video_url = content.get("video_url")
        if not isinstance(video_url, str) or not video_url.startswith(("http://", "https://")):
            raise SeedanceAPIError("Succeeded task response is missing content.video_url", payload=task)

        # Return useful generation metadata, without exposing the upstream original as a delivery URL.
        task_metadata = {key: task[key] for key in (
            "id", "status", "model", "duration", "resolution", "ratio", "framespersecond",
            "output_format", "usage", "tools",
        ) if key in task}
        archive_errors: dict[str, str] = {}
        video_path = ""
        try:
            video_path = await self._archive(video_url, media_dir="videos", fallback_filename=filename)
        except Exception as exc:
            archive_errors["video"] = f"{type(exc).__name__}: {exc}"

        try:
            if not video_path:
                raise RuntimeError("Video archive failed; no local file to prepare for playback")
            video_path, playback_notice = await _prepare_playback(video_path, timeout=self.transcode_timeout_seconds)
        except Exception as exc:
            error = {"code": "PlaybackPreparationFailed", "message": f"{type(exc).__name__}: {exc}"}
            await self._report_failed(filename, task_id, error)
            return {
                "status": "failed", "task_id": task_id, "task_status": task_status,
                "error": error, "playback_error": error["message"], "archive_errors": archive_errors,
                "recovery_path": video_path, "recoverable": isinstance(exc, (OSError, RuntimeError)),
                "task": task_metadata,
                "message": "Video generation succeeded; delivery preparation failed. Fix the local issue, "
                           "then resume this task ID. Do not create another video or offer the original as playable.",
            }

        last_frame_url = content.get("last_frame_url")
        last_frame_path = ""
        if isinstance(last_frame_url, str) and last_frame_url.startswith(("http://", "https://")):
            try:
                last_frame_path = await self._archive(
                    last_frame_url,
                    media_dir="images",
                    fallback_filename=f"seedance-{safe_task_id}-last-frame.png",
                )
            except Exception as exc:
                archive_errors["last_frame"] = f"{type(exc).__name__}: {exc}"

        report = {
            "filename": Path(video_path).name,
            "status": "success",
            "artifact_type": "video",
            "data_name": "inline_video",
            "path": video_path,
            "local_path": video_path,
            "task_id": task_id,
            "playback_notice": playback_notice,
        }
        if archive_errors:
            report["archive_errors"] = archive_errors
        await self.artifacts_reporter.async_report(self._redact(report), "object")

        return {
            "status": "success",
            "task_id": task_id,
            "task_status": task_status,
            "path": video_path,
            "local_path": video_path,
            "playback_error": "",
            "playback_notice": playback_notice,
            "last_frame_url": last_frame_url if isinstance(last_frame_url, str) else "",
            "last_frame_local_path": last_frame_path,
            "archive_errors": archive_errors,
            "task": task_metadata,
            "message": "Use the output file card to preview and download this file. "
                       "No separate public video URL is provided; no backend activation or upload is needed.",
        }

    async def run(self, request: dict[str, Any], *, task_id: str | None = None) -> dict[str, Any]:
        self.current_task_id = ""
        self.current_filename = ""
        self.last_task: dict[str, Any] = {}
        try:
            if task_id is not None:
                result = await self.resume(task_id)
            else:
                result = await self.generate(request)
            return self._redact(result)
        except Exception as exc:
            error = {"message": self._redact(f"{type(exc).__name__}: {exc}")}
            if self.current_task_id:
                if isinstance(exc, SeedanceAPIError):
                    recoverable = exc.status_code in RETRYABLE_HTTP_STATUSES or isinstance(
                        exc.__cause__, TIMEOUT_ERRORS
                    )
                else:
                    recoverable = isinstance(
                        exc, (aiohttp.ClientConnectionError, aiohttp.ClientPayloadError, OSError, *TIMEOUT_ERRORS)
                    )
                try:
                    await self._report_failed(self.current_filename, self.current_task_id, error)
                except Exception:
                    pass
                return {"status": "failed", "task_id": self.current_task_id, "recoverable": recoverable, "error": error}
            # The shared CLI prints tracebacks; suppress the unsanitized exception chain.
            raise SeedanceAPIError(
                error["message"],
                status_code=getattr(exc, "status_code", None),
                payload=self._redact(getattr(exc, "payload", None)),
            ) from None


SKILL = "seedance-video-generation"


def execute(request: dict[str, Any]) -> SkillScriptExecution:
    generator = SeedanceVideoGenerator(working_dir=Path.cwd())
    return SkillScriptExecution.from_runtime(generator, generator.run(request))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--task-id", help="Resume an existing task without submitting a new one.")
    args = parser.parse_args(argv)
    if args.task_id is None:
        return run_skill_script(SKILL, execute)
    if not args.task_id.strip():
        parser.error("--task-id must not be empty")

    def resume_execute(request: dict[str, Any]) -> SkillScriptExecution:
        generator = SeedanceVideoGenerator(working_dir=Path.cwd())
        return SkillScriptExecution.from_runtime(generator, generator.run(request, task_id=args.task_id))

    original_stdin = sys.stdin
    try:
        sys.stdin = io.StringIO("{}")
        return run_skill_script(SKILL, resume_execute)
    finally:
        sys.stdin = original_stdin


if __name__ == "__main__":
    raise SystemExit(main())
