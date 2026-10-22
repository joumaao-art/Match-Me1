---
name: seedance-video-generation
description: For standalone video requests, use when the user explicitly requests Seedance (SD in a clear Seedance video context) or continues that explicit choice from earlier turns. Covers prompts, generation, image/video/audio references, keyframes, editing, extension, generated audio and search for Seedance 2.0/2.5. Takes precedence over video-generation and video-editing for these requests. Source clips inside promo-video-production / Remotion keep the legacy video-generation workflow, including Seedance. Defaults, configuration, asset paths and negated mentions do not select this Skill.
alwaysApply: false
roles:
  - Alex
---

# Seedance Video Generation

Use this Skill as one atomic native Seedance 2.0/2.5 capability: compile the user's request and references into one effective prompt and one official Create Task JSON object, then run the bundled script. Optimize the single request before submission, but do not add a multi-request prompt-optimization pipeline, shot planner, automatic retake loop, or MGX request wrapper.

## When to use

Use this Skill for the user's explicit Seedance choice in standalone video requests, including generation, editing and extension. Carry that choice into follow-ups such as “make it portrait” until the user changes or rejects it. Interpret “SD” as Seedance only when the video context establishes that meaning; if it could mean Stable Diffusion or standard-definition resolution, clarify first.

A mention such as “do not use Seedance” is not a selection; honor that model exclusion in the legacy workflow. Without an explicit user choice of Seedance, keep the existing `video-generation` / `video-editing` workflow, with `promo-video-production` for composition. Those legacy Skills still support Seedance through their configured models. A legacy run automatically using Seedance does not establish a user choice for later turns. Model defaults, endpoint configuration, asset paths, filenames and quoted documentation are not user choices; an explicit request to use a native Seedance endpoint is. If native access is unavailable for an explicit choice, explain the dependency rather than silently changing interfaces.

A single Seedance clip may include generated dialogue, sound or audio references; these alone do not require Remotion. For a complete edited deliverable with a separate narration track, timeline or overlays, use `promo-video-production` and its legacy `video-generation` source-clip workflow, even when the user selects Seedance. Keep Remotion source clips on that legacy interface; do not switch them to this native Skill.

## Choose the model first

Preserve the user-selected version. On the platform OneAPI gateway (`/ark`, including the injected `METAGPT_MULTIMODAL_*` configuration), use `seedance-2.5` for Seedance 2.5 and `seedance-2.0` for Seedance 2.0; use other variants only with a platform-authorized alias. Official `doubao-*` IDs below are for direct Ark, not OneAPI defaults. Preserve an explicitly supplied Model ID or Endpoint ID verbatim and report unavailable routing rather than silently replacing it. Default to 2.5 only when no version or endpoint was specified; do not infer the version of an opaque Endpoint ID.

Parameter fact sources: [Seedance 2.5 tutorial](https://console.volcengine.com/ark/region:cn-beijing/docs/82379/2607688?lang=zh), [Create Task API](https://console.volcengine.com/ark/region:cn-beijing/docs/82379/1520757?lang=zh), and [Seedance 2.0 tutorial](https://console.volcengine.com/ark/region:cn-beijing/docs/82379/2291680?lang=zh).

| Model | Direct Ark Model ID | Duration | Reference-material limits | Output |
|---|---|---|---|---|
| Seedance 2.5 | `doubao-seedance-2-5-260628` | 4–30 s or `-1` | up to 30 images, 10 videos (2–30 s each; total ≤30 s), and 10 audios (2–30 s each; total ≤30 s); audio-only reference is allowed | 480p/720p/1080p; `mp4`/`mov` |
| Seedance 2.0 | `doubao-seedance-2-0-260128` | 4–15 s or `-1` | up to 9 images, 3 videos (2–15 s each; total ≤15 s), and 3 audios (2–15 s each; total ≤15 s); audio must accompany an image or video | 480p/720p/1080p/4k; `mp4` |
| Seedance 2.0 Fast / Mini | `doubao-seedance-2-0-fast-260128` / `doubao-seedance-2-0-mini-260615` | 4–15 s or `-1` | Same 2.0 input limits | 480p/720p; `mp4` |

Choose 2.5 for up to 30-second output, larger reference sets, standalone audio references, the explicit edit/extend task selector, or `mov` output. Both 2.5 and base 2.0 support 1080p; preserve the requested version. Choose base 2.0 when 4k is required; choose Fast or Mini when the platform prioritizes speed or cost and 720p is sufficient. A 4k request is valid only for base 2.0, not 2.0 Fast/Mini or 2.5. If a requested model cannot meet a hard requirement, explain the conflict and obtain the user’s choice before changing the model or requirement.

Seedance 2.5 1080p and base 2.0 4k outputs use 10bit H.265/HEVC; verify the actual container and codec, as playback support varies. Official support does not guarantee that the current gateway channel enables each resolution.

## Workflow

For prompt-only requests, return the complete prompt and parameter suggestions without running the generator. If including ready-to-use JSON, include the full prompt rather than ellipses or “same as above”.

1. Identify the model version and one of the six task scenes below.
2. Write the final prompt using the prompt rules and bind every reference by ordinal. For a complex advertisement, several references, several shots, dialogue, editing, extension, or an underspecified creative request, first read [references/prompt-craft.md](references/prompt-craft.md). Skip it for a simple request that already specifies one subject, action, scene, and camera behavior.
3. Build one official Create Task JSON object. Preserve any official fields the user supplies. Put all natural-language generation requirements in the text item's `text` field, and use only request fields documented by the API.
4. Check the scene-specific constraints before spending a generation request.
5. Run `scripts/generate.py` through `Terminal.run` with the JSON on stdin and `run_in_background=true`.
6. Continue other useful work. After notification, call `Terminal.read_tab(tab_id)` until `has_more` is false and read the final `completed.result` or `failed.result`. Never rerun the script merely to check progress.

For OneAPI or local reference files, read [references/oneapi-and-media.md](references/oneapi-and-media.md) before forming the request. OneAPI uses the native `/ark` base and authorized aliases, and does not accept `callback_url`. Use explicit media roles; prepare local images/audio with `scripts/prepare_media.py`, and supply a reachable URL for video. The generator itself requires `model` in stdin and does not upload local files.

The script uses the dedicated `SEEDANCE_BASE_URL` / `SEEDANCE_API_KEY` pair when configured. Otherwise it uses the platform-injected `METAGPT_MULTIMODAL_BASE_URL` / `METAGPT_MULTIMODAL_API_KEY` pair, replacing OneAPI's `/v1` path with `/ark` on the same host. A partial dedicated pair is a configuration error. Never put the Key in JSON, command arguments, logs, project files, or replies.

The platform-injected pair follows the deployment's configured transport, including HTTP, only on that exact scheme/host/port; do not ask the user to enable a switch for this path. Dedicated endpoints and other HTTP destinations require deployment opt-in via `SEEDANCE_ALLOW_INSECURE_HTTP=1`; otherwise use HTTPS. The same checks apply to the local launcher's model-list endpoint. HTTP remains plaintext: the deployment owns gateway selection and network protection. Do not change gateway configuration or set the override to bypass errors. API redirects are rejected; configure the final endpoint directly.

## Choose the scene

| Scene | Seedance 2.5 | Seedance 2.0 / Fast / Mini |
|---|---|---|
| Text-to-video | One text item; `ratio`/`duration` explicit or `adaptive`/`-1` | Same, with duration capped at 15 s |
| Reference-to-video | At least one reference item; set `omni_reference_task_type: "reference"`; pure audio is allowed | Omit `omni_reference_task_type`; make the reference intent explicit in the prompt; audio requires an image or video |
| Video editing | At least one `reference_video`; set type `edit`, `ratio: "adaptive"`, `duration: -1`; source video 4–30 s | Omit the type field; say edit/replace/delete/repair in the prompt; use 2.0 duration/input limits and explicit ratio or `adaptive` |
| Video extension | At least one `reference_video`; set type `extend`, `ratio: "adaptive"`; `duration` 4–30 or `-1` | Omit the type field; say forward/backward extension or continuation; up to 3 clips can be joined/bridged; duration 4–15 or `-1` |
| First-frame video | One `first_frame` image; `ratio` must be `adaptive`; duration 4–30 or `-1` | One `first_frame` image; explicit ratio or `adaptive` (use `adaptive` to avoid crop/jump); duration 4–15 or `-1` |
| First/last-frame video | `first_frame` + `last_frame`; `ratio` must be `adaptive`, following the first frame | Same roles; explicit ratio or `adaptive`, with duration 4–15 or `-1` |

First-frame, first/last-frame, and all-modal reference inputs are mutually exclusive. Do not mix `first_frame` or `last_frame` roles with `reference_image`, `reference_video`, or `reference_audio` roles in one request.

## Build prompts for effect

Write the prompt in the user's language as a shooting brief, not a keyword list. Put the subject and primary visible action first:

`subject + action/event + environment + visual style + camera/cuts + sound`

- Give the clip one main visible beat and a readable endpoint. Add a continuous timestamp sequence such as `[0-5 s]`, `[5-10 s]` only when the duration or requested cuts need it.
- Bind references using `@Image 1`, `@Video 1`, and `@Audio 1`, as in the [official English prompt guide](https://docs.byteplus.com/en/docs/ModelArk/2607688). The number is the same-type item's order in `content[]`. Give every reference a specific role; for partial references, say what to adopt and what not to adopt. Let precise references carry appearance and motion details instead of redundantly describing them.
- Describe the camera with a start composition, shot size or angle, one principal movement and speed, then the ending frame. Do not combine incompatible instructions such as a fixed camera and an orbit in the same shot.
- Distinguish sound with the official notation: music `()`, sound effects and ambient noise `<>`, dialogue `{}`, subtitles `【】`. Reserve `()` for music; ambient noise alone does not request a soundtrack. State the language before non-Chinese dialogue.
- For editing, state the exact target and time range, the change from A to B, and what must remain unchanged.
- For extension, state the direction, identify the base video, continue from its actual ending state without replaying completed action, and describe the join and new endpoint.
- Replace empty terms such as `8K`, `masterpiece`, `cinematic`, `epic`, or `premium look` with observable camera, lighting, material, motion, or sound choices.
- Keep Chinese prompts within about 500 Chinese characters and English prompts within about 1000 words. If the request exceeds the duration or event budget, compress secondary detail while preserving the requested main beats instead of silently inventing a multi-request pipeline.
- Keep task type, prompt intent, and parameters consistent. A mismatch can fail asynchronously with `InvalidParameter.TaskTypeMismatch` or `InvalidParameter.TaskTypeConstraint`.
- Do not invent dialogue, subtitles, logos, extra subjects, or reference constraints that the user did not request.

Before submission, confirm that the prompt has a clear subject, one achievable progression, a camera contract, an endpoint, explicit reference roles, and non-conflicting audio/visual instructions. Use the detailed templates and checks in [references/prompt-craft.md](references/prompt-craft.md) when any of those decisions are non-trivial.

## Official native request

The stdin root object is the official body for:

```text
POST /api/v3/contents/generations/tasks
```

The script forwards that object without a field whitelist. It only validates that the root is an object and that non-empty `model` and `content` fields exist. For OneAPI use the authorized alias from “Choose the model first”; do not copy direct Ark IDs into OneAPI requests.

### `content[]`

```json
{"type":"text","text":"..."}
{"type":"image_url","image_url":{"url":"https://..."},"role":"reference_image"}
{"type":"video_url","video_url":{"url":"https://..."},"role":"reference_video"}
{"type":"audio_url","audio_url":{"url":"https://..."},"role":"reference_audio"}
```

For keyframes, use image roles `first_frame` and optionally `last_frame`. Image and audio sources may be public URLs, supported data URIs, or `asset://` IDs. Video sources may be public URLs or `asset://` IDs.

### Shared request fields (Seedance 2.0 and 2.5)

| Field | Rule |
|---|---|
| `model` | Required; use the platform's Model ID or Endpoint ID verbatim. |
| `content` | Required array of text/image/video/audio items; see the roles above. |
| `ratio` | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9`, or `adaptive`; task-specific rules are in the scene table. |
| `generate_audio` | Boolean; default `true`; generated audio is mono. |
| `return_last_frame` | Boolean; default `false`. |
| `watermark` | Boolean; default `false`. |
| `callback_url` | Supported by direct Ark; omit on OneAPI, whose gateway rejects it. |
| `execution_expires_after` | 3600–259200 seconds; default 172800. |
| `priority` | 0–9; default 0; applies within the same Endpoint. |
| `safety_identifier` | Stable privacy-safe end-user identifier, at most 64 English characters. |
| `tools` | Use `[{"type":"web_search"}]` only for a pure-text request. 2.0 explicitly limits search to pure text; the 2.5 tutorial does not promise broader multimodal support. |

### Seedance 2.5 fields

| Field | Values and behavior |
|---|---|
| `resolution` | `480p`, `720p`, or `1080p`; default `720p`. |
| `duration` | Integer 4–30 or `-1`; default `-1`; editing only supports `-1`. |
| `omni_reference_task_type` | `auto`, `reference`, `edit`, or `extend`; default `auto`; omit this 2.5-only field for 2.0. |
| `output_format` | `mp4` or `mov`; default `mp4`; `mov` is useful for editing/extension and professional post-production. |

### Seedance 2.0 fields

| Model | `resolution` | `duration` | Output format |
|---|---|---|---|
| Base 2.0 | `480p`, `720p`, `1080p`, or `4k` (default `720p`) | 4–15 or `-1` | `mp4` |
| 2.0 Fast / Mini | `480p` or `720p` (default `720p`) | 4–15 or `-1` | `mp4` |

Do not send `omni_reference_task_type` or `output_format` to 2.0; task intent comes from the prompt and referenced materials. Base 2.0 4k is H.265/HEVC 10-bit output and may need a compatible player.

The current 2.0/2.5 endpoints do not use the legacy `camera_fixed`, `draft`, `frames`, `seed`, or `service_tier` fields. Do not add them to a normal 2.x request. If the platform explicitly supplies another current official field, preserve it verbatim because the script is a native pass-through.

### Input limits by model

| Input | Seedance 2.5 | Seedance 2.0 series |
|---|---:|---:|
| Full-modal reference images | 1–30 | 1–9 |
| Reference videos | up to 10; each 2–30 s; total ≤30 s | up to 3; each 2–15 s; total ≤15 s |
| Reference audios | up to 10; each 2–30 s; total ≤30 s; audio-only allowed | up to 3; each 2–15 s; total ≤15 s; must accompany an image or video |
| Full-modal reference assets total | ≤50 | ≤15 |

For both models, each image is under 30 MB with dimensions 300–6000 px and width/height ratio 0.4–2.5; each video is at most 200 MB; each audio is at most 15 MB; and the request body is at most 64 MB. Ordinary reference image/video uploads containing a real human face are not accepted; use a trusted model output, preset avatar, or authorized-person asset flow when applicable.

### Model-specific task notes

- **2.5:** `reference` has no task-specific `ratio`/`duration` restriction beyond the general ranges. `edit` requires a `reference_video` of 4–30 seconds, `ratio: "adaptive"`, and `duration: -1`. `extend` requires a `reference_video` and `ratio: "adaptive"`; `duration` is 4–30 or `-1`. Keyframe tasks require `ratio: "adaptive"`, and output ratio follows the first-frame image.
- **2.0 series:** omit `omni_reference_task_type`; make edit/extend intent explicit in the prompt (for example, “replace/delete/repair/extend/continue”). Use duration 4–15 or `-1`; an explicit supported ratio or `adaptive` is accepted. Extension can use up to three video clips to bridge or join a sequence. Base 2.0 4k is H.265/HEVC 10-bit and may need a compatible player. 2.0 accepts Chinese/English plus Spanish, Indonesian, Portuguese, and Japanese prompts; 2.5 additionally accepts Malay, Thai, Arabic, Vietnamese, and Korean.

## Request examples

The examples below use the OneAPI Seedance 2.5 alias. For direct Ark, substitute its authorized Model ID or Endpoint ID from the table above. For a 2.0-family request, replace `model`, remove the 2.5-only `omni_reference_task_type` and `output_format` fields, cap `duration` and reference materials at the 2.0 limits, and choose `resolution` from the selected 2.0 variant's table.

### Text-to-video

```json
{
  "model": "seedance-2.5",
  "content": [{"type": "text", "text": "A red fox moves through mist in a forest at dawn, cool diffuse light illuminating its damp fur. Track slowly from the trail entrance at a low angle, ending in a side-on medium shot as the fox jumps over a fallen log. <Birdsong and rustling leaves>."}],
  "resolution": "720p",
  "ratio": "16:9",
  "duration": 8,
  "generate_audio": true,
  "watermark": false
}
```

### Reference-to-video

```json
{
  "model": "seedance-2.5",
  "content": [
    {"type": "text", "text": "Create a short city-at-night advertisement using the character appearance from @Image 1 and the camera rhythm from @Video 1; do not adopt the character's clothing from @Video 1."},
    {"type": "image_url", "image_url": {"url": "https://example.com/character.png"}, "role": "reference_image"},
    {"type": "video_url", "video_url": {"url": "https://example.com/camera.mp4"}, "role": "reference_video"}
  ],
  "omni_reference_task_type": "reference",
  "resolution": "720p",
  "ratio": "16:9",
  "duration": 10,
  "generate_audio": true
}
```

### Video editing

```json
{
  "model": "seedance-2.5",
  "content": [
    {"type": "text", "text": "Video editing: remove everyone from @Video 1 except the main character."},
    {"type": "video_url", "video_url": {"url": "https://example.com/input.mov"}, "role": "reference_video"}
  ],
  "omni_reference_task_type": "edit",
  "ratio": "adaptive",
  "duration": -1,
  "generate_audio": true,
  "output_format": "mov"
}
```

### Video extension

```json
{
  "model": "seedance-2.5",
  "content": [
    {"type": "text", "text": "Continue after the end of @Video 1: when the window opens, move into the art museum interior from @Video 2, maintaining continuous camera movement and lighting."},
    {"type": "video_url", "video_url": {"url": "https://example.com/source.mov"}, "role": "reference_video"},
    {"type": "video_url", "video_url": {"url": "https://example.com/gallery.mp4"}, "role": "reference_video"}
  ],
  "omni_reference_task_type": "extend",
  "ratio": "adaptive",
  "duration": 11,
  "generate_audio": true,
  "output_format": "mov"
}
```

### First-frame or first/last-frame video

Delete the `last_frame` item for a first-frame-only request.

```json
{
  "model": "seedance-2.5",
  "content": [
    {"type": "text", "text": "The girl looks at the camera, smiles and says in English {Cheese}. Use a smooth 360-degree camera orbit, transitioning naturally from the first frame to the last frame."},
    {"type": "image_url", "image_url": {"url": "https://example.com/first.png"}, "role": "first_frame"},
    {"type": "image_url", "image_url": {"url": "https://example.com/last.png"}, "role": "last_frame"}
  ],
  "ratio": "adaptive",
  "duration": 8,
  "generate_audio": true
}
```

## Run the script

Derive the absolute script path from this `SKILL.md`, keep the current project working directory, and run:

```xml
<Terminal.run>
<cmd>python "/absolute/path/to/.atoms/skills/seedance-video-generation/scripts/generate.py" &lt;&lt;'JSON'
{
  "model": "seedance-2.5",
  "content": [{"type": "text", "text": "A red fox moves through the dawn mist, followed by a slow tracking shot at a low angle."}],
  "resolution": "720p",
  "ratio": "16:9",
  "duration": 8,
  "generate_audio": true
}
JSON</cmd>
<run_in_background>true</run_in_background>
</Terminal.run>
```

Do not prepend environment assignments containing the Key to the command. Use the injected configuration described above; `METAGPT_REPORTER_URL` and `METAGPT_ROLE` provide platform reporting context.

### Resume after interruption

Once Create Task succeeds, the script emits a `submitted` event and saves only the task ID in `.seedance/tasks/task-<encoded-id>.json` under the current working directory. Receipts contain no request, media data, URLs, or credentials. Keep these local receipts out of source control. If saving fails, recover the task ID from the `submitted` event.

To resume polling and archiving, use the same endpoint and account and pass the existing ID; no stdin request is needed:

```bash
python "/absolute/path/to/.atoms/skills/seedance-video-generation/scripts/generate.py" --task-id "<TASK_ID>"
```

This path only queries and downloads; it never calls Create Task. Use it after interruption, local timeout, or archive failure. Do not run it concurrently with a still-running poller. A receipt is useful for recovering the ID, but is not required to resume.

Query connection errors, timeouts, and HTTP 429/500/502/503/504 are retried up to five total attempts, at intervals of at least 15 seconds. Other HTTP errors stop immediately. All polling and query retries share `SEEDANCE_MAX_POLL_SECONDS` (default 3600); an individual request uses `SEEDANCE_REQUEST_TIMEOUT_SECONDS` (default 60). The default polling interval is 15 seconds.

`SEEDANCE_TRANSCODE_TIMEOUT_SECONDS` sets the separate local conversion deadline (default 300 seconds; finite positive number, validated before submission). For 4k, measure representative clips on the deployment hardware and configure sufficient time; the default is not a validated 4k performance guarantee. Resume queries and downloads again, so retained task IDs/local originals do not guarantee recovery after the upstream URL expires.

Create Task is never automatically retried. If submission fails before an ID is received, task creation may be uncertain; inspect the provider's task history before submitting again.

## Result behavior

The script calls Create Task, reports Artifact `running` with the official task ID, and polls:

```text
GET /api/v3/contents/generations/tasks/{task_id}
```

- `queued` or `running`: continue polling.
- `succeeded`: archive and inspect the actual container, video/pixel format and audio codecs at every resolution. Deliver one MP4 with H.264 `yuv420p` and AAC audio (when present). Compatible files pass through; others are converted with `ffmpeg`, checked for dimensions, frame rate, duration and audio preservation, then replace the local original. Any returned last frame is archived separately. The API request remains unchanged; this playback file can differ from the provider's requested MOV output.
- If `playback_notice` is non-empty, explain it briefly in the user's language when delivering the video: conversion is lossy, and 10-bit sources are reduced to 8-bit with possible loss of color gradation. Preserved dimensions/frame rate do not mean unchanged visual quality. Compatible files return an empty notice.
- `failed`, `cancelled`, or `expired`: preserve the official error and report Artifact `failed`.
- Local polling timeout or an error after submission: stop without resubmitting, preserve the task ID and error, and report Artifact `failed` locally. `recoverable: true` permits a later resume after a transient query failure or local I/O issue is resolved; it does not promise server-side success. For `recoverable: false`, fix the reported code, credentials or API issue before trying again; do not repeatedly resume unchanged. A polling timeout also preserves the last observed status when available.
- Archive/probe/conversion failure after task success: report delivery as `failed` with `task_status: succeeded`, the same task ID and a `recovery_path` when available. Keep the original on preparation failure. Fix the local dependency/error before resuming that task; do not regenerate or present an unverified original as playable.

Deliver through the output file card: its preview and download use the same `path` / `local_path`. For a download request, direct the user to that card's download button. The result intentionally provides no public video URL or original-video link; do not reconstruct a CDN address, activate an app backend, or create storage just to deliver this file. `task` contains generation metadata, not raw provider content. For a later edit/extension that needs an upstream video URL, query the existing task as described in [references/oneapi-and-media.md](references/oneapi-and-media.md).

For search requests, inspect `task.usage.tool_usage.web_search` and `task.tools`: a positive count is evidence of executed searches; zero means no search was triggered, and a missing count means no count evidence was returned. Sending `tools` or obtaining a plausible video alone does not prove search ran. Evaluate video quality separately.

Task records last 7 days. Result URLs expire after 24 hours (and have a download limit), so use the archived local path for later project work for either model.
