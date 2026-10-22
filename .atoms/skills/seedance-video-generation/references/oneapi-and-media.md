# OneAPI and local reference media

Read for OneAPI endpoints or local reference files. This supplements the main Skill's model and scene rules. Specifications below follow the official documents checked on 2026-09-11; channel access still needs validation.

## OneAPI native requests

- Use the native base URL from the dedicated Seedance configuration or the platform-injected configuration described below. The generator appends `/api/v3/contents/generations/tasks` to the `/ark` base. `/v1` is a separate base for the model listing and other interfaces, not the generator base.
- Without a dedicated Seedance configuration pair, the script reuses the platform's `METAGPT_MULTIMODAL_*` pair and maps its OneAPI `/v1` base to `/ark` on the same host. This does not verify that a sandbox proxy forwards `/ark` or that the account has model access; report gateway/authentication errors without switching models.
- Platform fallback preserves the transport chosen in `METAGPT_MULTIMODAL_BASE_URL`, including HTTP, with the matching injected Key. Its HTTP exception is confined to that scheme/host/port and does not transfer to a dedicated Seedance pair. Dedicated endpoints and other HTTP destinations require deployment opt-in via `SEEDANCE_ALLOW_INSECURE_HTTP=1`; HTTPS works without it. The same policy covers `ONEAPI_BASE_URL` used by the local launcher's `models` command. HTTP credentials remain plaintext; deployment configuration and network protection are the trust boundary. Users should not need to adjust this in conversation. Use the final API endpoint because redirects are rejected.
- For Seedance 2.5 on OneAPI use `seedance-2.5`; for 2.0 use `seedance-2.0`. Direct Ark `doubao-*` version IDs are not OneAPI defaults. Other variants require a platform-authorized alias. Preserve an explicitly requested model; report an unsupported configuration rather than silently changing it.
- `generate.py` requires `model` in stdin. Only the repository's local `examples/seedance/run.py` fills an omitted model from `SEEDANCE_MODEL`; this is not behavior of the deployed Skill script.
- Omit `callback_url` on OneAPI: its native gateway rejects callbacks. The local runner rejects this field before submission; the generic generator passes official fields through and does not identify providers. Direct Ark supports callbacks.
- Set every reference role explicitly. OneAPI's documentation permits an omitted image role as a reference, while Ark also uses omission for first-frame input. Do not depend on this ambiguity.
- Resume with the same endpoint and task-owning account. Use `generate.py --task-id <ID>`; do not create another task to check progress.

## Media sources

| Source | Images | Audio | Video |
|---|---|---|---|
| Accessible HTTP(S) media URL | Supported | Supported | Preferred input path |
| MIME-qualified Data URI | Supported | Supported | OneAPI mentions support, but Ark's video input specification does not; do not assume conversion |
| `asset://` ID | Officially supported | Officially supported | Officially supported; verify upstream account ownership and gateway routing |
| Local file path | Encode first | Encode first | Use an existing platform upload facility or a reachable URL |

URLs must resolve to media accessible by the gateway/upstream without browser login, cookies, or a page redirect. A local absolute path is not a remote media URL. Do not upload media to an arbitrary service to obtain a URL.

For editing and extension, use an accepted source task's upstream video URL. Delivery results expose only the local playback file; obtain the input URL when needed with `SeedanceVideoGenerator.get_task(task_id)` against the same task-owning endpoint/account. This GET creates no video. Keep the upstream URL for the reference request, not as the user's playback/download link. Task records/URLs expire; querying does not guarantee a refreshed usable URL. If only a local video remains and no platform upload path is configured, report that input dependency. Do not substitute an unrelated video or regenerate it without accounting for another task.

## Prepare local images and audio

The helper uses Python's standard library and the system `file` utility to recognize content rather than trusting extensions. It emits one official `content[]` element and never contacts an API or reads a Key.

```bash
python "/absolute/path/to/seedance-video-generation/scripts/prepare_media.py" \
  --path "/absolute/path/to/first.png" --role first_frame \
  --output "/absolute/path/to/workspace/first.content.json"
```

The output directory must exist. Use `reference_image` or `last_frame` for other image roles and `reference_audio` for WAV/MP3. The output is created exclusively: choose a new name if it exists. Only a short metadata summary is printed; Base64 is written to the file. The original bytes are unchanged.

Load prepared files as objects when composing the final request; do not paste file paths into `image_url.url`:

```python
import json
from pathlib import Path

request = {
    "model": "seedance-2.5",  # Replace with the platform-authorized requested model.
    "content": [
        {"type": "text", "text": "Keep the cup upright and move it smoothly from its position in the first frame to its position in the last frame."},
        json.loads(Path("first.content.json").read_text()),
        json.loads(Path("last.content.json").read_text()),
    ],
    "ratio": "adaptive", "duration": 4, "resolution": "480p", "generate_audio": False,
}
payload = json.dumps(request, ensure_ascii=False).encode("utf-8")
if len(payload) > 64_000_000:
    raise ValueError("Combined request exceeds the conservative 64 MB limit; use accessible URLs.")
with Path("request.json").open("xb") as stream:
    stream.write(payload)
```

The example paths are relative to the current project directory. Run the generator with the final JSON on stdin. Prepared files contain the media bytes and may be large; keep them with local task outputs, outside source control.

## Check media before submission

Preparation validates recognized MIME, file size and image/audio role compatibility. It does **not** certify full decoding, image dimensions, duration, reference count, or scenario legality. Inspect images with Pillow or an image viewer, and audio/video with `ffprobe`; perform full decoding where necessary.

| Media | Format and geometry | Size / timing |
|---|---|---|
| Image | JPEG, PNG, WebP, BMP, TIFF, GIF, HEIC/HEIF; sides 300–6000 px; width/height 0.4–2.5 | Each <30 MB; first frame: one image; first/last: two images |
| Video | MP4 or MOV; H.264/H.265; 24–60 FPS; sides 300–6000 px; width/height 0.4–2.5; pixel count 407696–8295044 | Each ≤200 MB; apply version-specific durations and totals from the main Skill |
| Audio | WAV or MP3 | Each ≤15 MB; apply version-specific durations and totals from the main Skill |

MP4 audio is AAC/MP3; MOV also allows PCM. The helper uses conservative decimal MB limits, not MiB. If a format is unrecognized by the local `file` version, inspect/convert it explicitly or use a verified URL; helper failure is not proof the model lacks that format.

Important checks:

- A 2.5 editing source must be 4–30 seconds; its request uses `duration=-1` and `ratio=adaptive`. Other 2.5 reference videos may start at 2 seconds. Sum durations independently for video and audio.
- Do not mix `first_frame`/`last_frame` with full-modal reference roles. A 2.0 audio reference must accompany an image or video; 2.5 permits audio alone.
- Count same-type references in their actual `content[]` order for prompt bindings.
- Base64 increases payload size. Check the final UTF-8 JSON bytes, including all media, against the request limit, even when each file passes its individual limit.
- **Unresolved input specification:** the 2.5 tutorial lists 480p/720p reference video, while Create Task also lists 1080p/4k. Use 480p/720p input for the baseline and verify higher-resolution input separately. This does not negate official support for 2.5 **output** at 1080p.

Sources: [Create Task](https://docs.volcengine.com/docs/82379/1520757?lang=zh), [2.5 tutorial](https://docs.volcengine.com/docs/82379/2607688?lang=zh), [2.0 tutorial](https://docs.volcengine.com/docs/82379/2291680?lang=zh).
