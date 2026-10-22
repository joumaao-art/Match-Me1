# Seedance 2.0/2.5 Prompt Craft

Read this file only for a complex advertisement, several references, several shots, dialogue, editing, extension, or an underspecified creative request. Compile one final prompt for one Create Task request. Treat the official Seedance 2.0/2.5 guides and API as the parameter authority; use prompt methods as writing heuristics and never transfer one model's limits to the other. Do not create a planning pipeline, hidden project state, automatic retakes, or extra generation calls.

Parameter reminder: omit `omni_reference_task_type` for Seedance 2.0. For Seedance 2.5, the main Skill's `adaptive` and `duration: -1` rules for edit, extension, and keyframe tasks take precedence over generic prompt templates.

## Compile the prompt

1. Extract the user's non-negotiables: subject or product, desired event, duration, output use, references, dialogue or sound, and preserved details. Do not invent brand copy, dialogue, logos, characters, or plot beats.
2. Choose the one outcome the viewer must see by the end. Put the subject and main action in the first clause.
3. Assign every reference a narrow job. Use references for dense identity, product, environment, motion, camera rhythm, voice texture, or sound; use text for the requested changes, timing, endpoint, and constraints.
4. Allocate feasible actions to the available seconds. Use one continuous timeline only when it improves control.
5. Write a camera contract: starting composition, shot size or angle, one principal movement and speed, and ending composition.
6. Add only useful sound direction. Resolve conflicts between reference audio, source-video audio, generated dialogue, music, and sound effects.
7. Compress repeated descriptions and replace abstract praise with visible or audible facts.
8. Run the final checks at the end of this file, then place the prompt in the text item of the official JSON request.

## Bind reference roles

Number images, videos, and audios independently by their order among the same media type in `content[]`. Refer to them as `@Image 1`, `@Video 1`, and `@Audio 1`.

Use this structure for every relevant source:

`@Image 1 provides only [specific role]; retain/adopt [relevant details], and exclude [unwanted details].` Use the corresponding type and number for each source.

Common roles:

| Source | Useful roles | Typical exclusions |
|---|---|---|
| Image | subject identity, product shape and label, wardrobe, location, composition, visual style | background, pose, text, unrelated people |
| Video | source to edit/extend, action, blocking, camera path, cut rhythm, effects | performer identity, wardrobe, location, logo, source audio |
| Audio | dialogue, voice texture, tempo, music mood, ambience, beat timing | identity imitation, unrelated lyrics, a second timing system |

- If one source contains several subjects, identify the intended subject by position, clothing, or visible feature.
- If a reference is already precise, bind its role instead of retelling every detail. For example: `Follow the action sequence and camera movement in @Video 1; exclude its characters, clothing, and setting.`
- If two references compete, state priority. For example: `Use @Video 1 only for action and camera movement, ignoring its audio; use @Audio 1 for rhythm and align action beats with its strong beats.`
- Do not rely on names or labels drawn inside an image to map subjects. State the mapping in the prompt.

## Control action, time, and ending

Treat one generation as one coherent visible progression. A short clip normally supports one main action and one changed endpoint. Reduce density when the request combines several locations, several major actions, long dialogue, complex physical interaction, and a final product shot.

Use a timeline for a long clip, requested cuts, an advertisement, or explicit synchronization:

```text
One-sentence summary: [subject, location, main event, and style]
[0-3 s] [image, action, camera, sound]
[3-7 s] [next change and visible outcome]
[7-10 s] [ending or held product shot]
Throughout: [consistent identity, composition, lighting, sound, or subtitle constraints]
```

- Keep intervals continuous and within `duration`; do not leave accidental gaps.
- Assign enough time for each action. Do not express mechanical frequency such as “shake the head three times per second”.
- Tie one important audio beat to one visible event. Do not stack several actions on the same beat.
- For a standalone clip, end with the result settled and readable. For a product, hold the product, label, or material detail unobstructed. For extension, keep only the motion that the requested continuation needs.

## Direct the camera and image

Describe observable choices rather than evaluation words:

`[Shot size/angle]. Start with [opening composition], use [one main camera movement] at [speed] to follow [subject action], and end on [specific frame].`

Useful choices include:

- Shot: extreme wide, wide, medium, medium close-up, close-up, macro.
- Angle: eye level, low angle, high angle, overhead, side view, first-person POV, over the shoulder.
- Movement: locked camera, slow push-in, pullback, lateral tracking, pan, vertical move, orbit, rack focus.
- Physical style: actual light source and direction, palette, material texture, weather, medium, and motion behavior.

Prefer a stable medium or close shot for dialogue, product identity, labels, hands, and precise edits. Use wide moving shots for geography and blocking. Avoid stacking an orbit, zoom, pan, handheld shake, and rapid cuts unless the user explicitly needs that complexity.

Replace weak language:

| Weak | Make it observable |
|---|---|
| `cinematic/premium look` | shot size, camera support and movement, light source, palette |
| `spectacular/epic` | physical scale, speed, crowd or environmental response, reveal |
| `dynamic camera movement` | direction, speed, subject relation, ending frame |
| `hyperrealistic/highly detailed` | the two materials, reflections, textures, or natural motions that matter |
| `8K/high definition/masterpiece` | delete; use the request's `resolution` field |

## Direct sound and dialogue

Use official prompt notation where appropriate: music `()`, sound effects `<>`, dialogue `{}`, subtitles `【】`.

- Keep dialogue short and assign the speaker. State the language before non-Chinese dialogue.
- During lip-sync, keep the face visible, head motion small, framing stable, and competing music quiet.
- Specify ambience plus one or two meaningful action sounds instead of an overloaded mix.
- If `generate_audio` is false, remove requests for generated dialogue, music, sound effects, and ambience from the prompt.
- Use positive descriptions for most visual control. The official guide explicitly supports negative audio and subtitle controls such as `no subtitles`, `no background music; keep only ambience and action sounds`, or `no sound`.

## Templates by task

Adapt these structures; do not copy placeholders or add details the user did not request.

### Text-to-video

```text
[Subject] performs [one main action] in [environment], ending with [visible outcome]. [Visual medium, light source, and materials]. [Shot size/angle]; start with [composition], use [one camera movement and speed], and end on [closing frame]. [Sound direction].
```

### Reference-to-video

```text
@Image 1 provides only [identity, shape, or materials] for [subject/product], excluding its [background/pose]; @Video 1 provides only [action/camera movement/rhythm], excluding its [characters/setting/audio]; @Audio 1 provides only [rhythm/timbre/mood]. [Subject] completes [action and outcome] in [environment]. [Camera contract and sound].
```

### Video editing

```text
Video editing: change only [object, attribute, or specific time interval] in @Video 1 from [A] to [B]. Preserve the source video's [applicable subject identity, motion path, composition, camera position, lighting, rhythm, duration, and audio]; leave everything else unchanged. [Transition and final state].
```

Edit one semantic layer when possible: subject appearance, object, background, visual treatment, action, dialogue, or audio. If several layers must change, list each target and preservation boundary explicitly.

### Video extension

```text
Continue for [N] seconds after the end of @Video 1. Start from its actual final state: [existing subject pose, motion direction, camera movement, and environment]; then [new action], ending at [new outcome]. Maintain continuity of [identity, clothing, scene layout, lighting direction, camera speed, and ambience]; do not replay completed actions or start an unrelated scene.
```

For a lead-in before the source opening, describe what directly precedes it and how it joins that first state. When the actual boundary state cannot be inspected, keep the instruction conservative: `Join naturally at the start/end of @Video 1, maintaining continuity of the subject, motion, camera, lighting, and sound` rather than inventing a pose.

### First-frame and first/last-frame

```text
Start naturally from [subject and composition] in the first frame, perform [one continuous action], and use [one main camera movement], ending at [specific outcome]. Keep [identity, clothing, product structure, scene layout, and lighting direction] stable.
```

For first/last-frame generation, describe the transformation or physical path between the supplied endpoints; do not redescribe or contradict the endpoint images.

## Compact scene patterns

### Product advertisement

Prioritize product fidelity, one proof action, and a readable hero ending:

```text
Use @Image 1 for the product's shape, proportions, materials, label, and colors, excluding its background. [0-3 s] [use context or action hook]; [3-7 s] [one visible action and close-up demonstrating texture or function]; [7-10 s] [held product hero shot]. Camera: [one continuous movement or explicit cuts]. Lighting: [actual source and direction]. <Key interaction sound effects>, (background music rhythm). Do not invent brand copy or extra labels.
```

If the label must remain readable, use a stable close shot and small product motion. Do not combine fast 360-degree rotation, disassembly, usage demonstration, several locations, and a packshot in a few seconds.

### Character performance or short scene

Anchor each character, keep one emotional or physical turn, and end on a visible response. For two-person dialogue, assign every line and allow a pause; keep the camera stable while a line is spoken.

### Educational or process demonstration

Show one cause-and-effect chain. Use a wide or medium shot for the process and one detail shot only for the key change. Prefer observable stages over explanatory slogans or generated on-screen text.

### Multi-image montage or storyboard

Map every image to a subject, stage, location, or desired order. If the user allows free ordering, state the organizing idea and final image rather than leaving all sequencing implicit. For a multi-panel storyboard image, treat panels as approximate story, composition, and action guidance; add missing motion, camera, style, and timing in text without promising pixel-level alignment.

### Seamless video transition

Identify what the end of `@Video 1` contributes and what the beginning of `@Video 2` must become. Describe one physical bridge such as an object match, camera-direction match, foreground wipe, light change, or shape transformation; keep movement direction and speed continuous and do not alter the supplied endpoint content.

## Final checks

Before making the paid Create Task call, verify:

- The first clause identifies the subject and main action, not generic quality words.
- The requested events fit the duration and lead to one readable endpoint.
- Every supplied reference has a numbered, explicit role; partial references include exclusions or priority where ambiguity is likely.
- The camera has a clear starting composition and no conflicting movements.
- Editing names the target, time range when relevant, A-to-B change, and preservation boundary.
- Extension continues the source boundary without replaying finished action or inventing an unrelated scene.
- Dialogue, music, sound effects, source audio, and `generate_audio` do not conflict.
- The prompt does not invent copy, subtitles, logos, subjects, dialogue, or constraints.
- Task intent, `omni_reference_task_type`, `ratio`, `duration`, roles, and output settings agree.
- The script will be invoked once. Poll the returned task ID; never resubmit just to check status.

## Precise edits, continuation, and language

- For a time-limited edit, identify the source, interval, target and replacement, then state what to preserve outside that interval. Example: `Make the cup body red only during seconds 1–2 of @Video 1; keep its original color at all other times. Preserve the lid, handle, background, and camera movement.` Observe boundary transitions; do not promise exact frame preservation.
- For sound edits, distinguish keeping source audio, replacing a specific sound, and generating a new soundtrack. Example: `Edit the audio of @Video 1: replace only the final bell with a single wooden-block tap; preserve the original dialogue, timing, and visuals, and add no music.` Use a source that actually contains the specified sound and request audio output; do not promise sample-identical preservation.
- For backward-in-time extension, describe the lead-in ending at the source's actual first frame; for forward continuation, start from its observed final frame. Name the direction explicitly (`before the start` / `after the end`). Do not replay the source action to fill time, and do not silently stitch or trim files to hide a failed extension.
- For non-Chinese dialogue, preserve the requested language, exact short line and speaker. Verify intelligibility, words and timing, not merely audio-track presence; one successful language is not evidence for all languages.
