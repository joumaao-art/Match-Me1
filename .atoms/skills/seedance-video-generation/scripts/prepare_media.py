#!/usr/bin/env python3
"""Prepare one local image/audio as a native Seedance content item, without network access."""

from __future__ import annotations

import argparse
import base64
import json
from pathlib import Path
import subprocess
import sys

IMAGE_ROLES = {"first_frame", "last_frame", "reference_image"}
ROLES = IMAGE_ROLES | {"reference_audio"}
IMAGE_MIMES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "image/gif",
    "image/heic",
    "image/heif",
}
AUDIO_MIMES = {"audio/wav", "audio/mp3"}
MIME_ALIASES = {
    "image/x-ms-bmp": "image/bmp",
    "audio/x-wav": "audio/wav",
    "audio/vnd.wave": "audio/wav",
    "audio/mpeg": "audio/mp3",
    "audio/x-mp3": "audio/mp3",
}
# Conservative decimal MB. Images must be strictly below their limit.
IMAGE_MAX_BYTES = 30_000_000
AUDIO_MAX_BYTES = 15_000_000


def detect_mime(data: bytes) -> str:
    try:
        result = subprocess.run(
            ["file", "--brief", "--mime-type", "-"],
            input=data,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            timeout=15,
        )
    except FileNotFoundError as exc:
        raise ValueError(
            "The 'file' MIME detection utility is required; install it or use a verified media URL."
        ) from exc
    except (subprocess.SubprocessError, OSError) as exc:
        raise ValueError(
            "Could not inspect media content with 'file'; inspect the file or use a verified media URL."
        ) from exc
    mime = result.stdout.decode("utf-8").strip()
    return MIME_ALIASES.get(mime, mime)


def prepare_media(path: Path, role: str, output: Path) -> dict:
    if role not in ROLES:
        raise ValueError(f"Unsupported role: {role}")
    path = path.expanduser()
    if not path.is_absolute():
        raise ValueError("--path must be an absolute local file path")
    if not path.is_file():
        raise ValueError(f"Local file does not exist: {path}")
    output = output.expanduser().resolve()
    if output.exists():
        raise FileExistsError(f"Output already exists: {output}")
    is_image = role in IMAGE_ROLES
    limit = IMAGE_MAX_BYTES - 1 if is_image else AUDIO_MAX_BYTES
    if path.stat().st_size > limit:
        raise ValueError(f"File exceeds the limit for {role}: {limit} bytes")
    with path.open("rb") as stream:
        data = stream.read(limit + 1)
    if not data or len(data) > limit:
        raise ValueError(f"File must contain between 1 and {limit} bytes for {role}")
    mime = detect_mime(data)
    allowed = IMAGE_MIMES if is_image else AUDIO_MIMES
    if mime not in allowed:
        raise ValueError(
            f"Detected {mime!r}, which cannot be prepared for {role}. "
            "Use a recognized image or WAV/MP3 audio file, or a verified media URL; "
            "this helper's recognition limit is not a model capability limit."
        )
    kind = "image_url" if is_image else "audio_url"
    item = {
        "type": kind,
        "role": role,
        kind: {"url": f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"},
    }
    # Exclusive creation also protects against another process producing the same output.
    with output.open("x", encoding="utf-8") as stream:
        json.dump(item, stream, ensure_ascii=False)
        stream.write("\n")
    return {
        "output": str(output),
        "type": kind,
        "role": role,
        "mime": mime,
        "source_bytes": len(data),
        "json_bytes": output.stat().st_size,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--path", required=True, type=Path)
    parser.add_argument("--role", required=True, choices=sorted(ROLES))
    parser.add_argument(
        "--output",
        required=True,
        type=Path,
        help="New JSON file; parent directory must exist.",
    )
    args = parser.parse_args(argv)
    try:
        print(
            json.dumps(
                prepare_media(args.path, args.role, args.output), ensure_ascii=False
            )
        )
        return 0
    except (ValueError, OSError) as exc:
        print(f"{type(exc).__name__}: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
