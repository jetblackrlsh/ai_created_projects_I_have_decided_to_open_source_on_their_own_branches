---
name: create-spread-motion-comic
description: Create a voiced motion-comic video from an existing single-image eight-page comic spread, or create a new spread first. Focus on each actual panel in reading order, preserve the story, assign distinct Kokoro narrator and character voices, and generate fitting Stable Audio Small music and sound effects. Use for single-spread panel-zoom videos and adaptations, not articulated character animation.
---

# Create Spread Motion Comic

Turn ONE accepted spread into a complete panel-focused film. Reuse the source art rather than generating a new image per shot. Eight pages can contain many panels: identify actual panel boundaries instead of assuming eight shots or an equal grid. Keep all production files outside this skill.

## Establish and preserve the source

1. Materialize and inspect the supplied original at full resolution. Retain its original bytes and SHA-256. Never fetch a Library file through a Sediment-only downloader. If no image was supplied, resolve and run `create-eight-page-comic-spreads` by exact frontmatter name, preserving its whole-spread generation and inspection requirements. Do not redraw a supplied comic unless asked.
2. Inspect enlarged page and panel crops. Establish page order, internal reading order, exact visible captions/dialogue, cast identities and action beats. Record pixel rectangles relative to the unmodified source. Read text visually; OCR is assistance, not evidence that ambiguous text was read correctly. Ask about unreadable material that changes the story rather than inventing it.
3. Preserve every substantive line, speaker and story beat. Add only necessary visual description for audio-only comprehension, marked as adaptation narration. Do not voice a character's text as narrator because attribution was overlooked. Retain a transcript-to-panel table, cast map and any unresolved ambiguity.
4. Briefly show the cast/shot plan when a material ambiguity needs a decision. Otherwise continue without unnecessary approval gates.

## Build the measured soundtrack first

Read [audio production](references/audio.md), [runtime setup](references/runtime-setup.md), [story/audio schema](references/vn_spec_schema.md), and [mixing](references/audio-mixing.md). This public package includes the required local audio adapters and pinned runtime recipe; it does not require private skills or model weights.

Use Kokoro for ALL spoken lines with one stable, distinct stock voice per narrator/character. Record actual voice IDs, speed and per-utterance files. Generate suitable instrumental music and motivated sound effects with the documented Stable Audio Small model, not synthesized beeps, stock placeholder tones, or an unannounced provider. A prompt is not a generated audio asset. If the required local generation cannot run, preserve the plan and report the exact blocker rather than calling silent or substitute audio a successful test.

Keep measured speech placement on a canonical 48 kHz sample clock. Derive each shot's duration from its actual audio lines plus intentional pauses and effect tails. Give short panels enough dwell time; do not speed through speech to fit an arbitrary video length. Never overlap dialogue accidentally. Mix from stems, then render one master rather than concatenating separately encoded clips.

## Plan and render the camera

Use **640 × 360 at 24 fps** as the default production and delivery resolution. Leave manifest width/height/fps omitted to use these defaults, or record them explicitly as 640/360/24. Do not silently override them to 1280 × 720 or 1920 × 1080 for a full-quality or primary copy. Use a higher resolution only when the user requests it; the renderer supports explicit width/height overrides.

1. Use a short full-spread establishing view, then sequential page/panel closeups in the verified reading order. Visit EVERY panel. Use cuts or brief transitions; avoid long flights across unrelated panels while a line is being spoken.
2. Keep each focused panel visible through all its dialogue and narration. Favor restrained pans/zooms within that panel, not random crops, artificial limb movement or regenerated scenery. Include complete caption boxes and faces. A static readable hold is preferable to a zoom that clips words.
3. Adapt aspect ratio to panel shape. Contain and letterbox rather than stretch, crop away essential art, or claim that upscaling restores absent detail. Record original panel resolution and disclose source-text limitations.
4. For a reproducible baseline use `scripts/render_spread.py manifest.json output.mp4`. Read [manifest schema](references/manifest.md). The helper renders verified source rectangles, optional safe end rectangles, measured durations and a supplied final master. It does not synthesize audio, infer panels or approve the transcript. For polished transitions use an appropriate existing renderer while retaining the same manifest and checks.
5. Optional subtitles may be added separately, but never erase or rewrite source lettering silently. Export a complete SRT/VTT transcript with speaker names.

## Verify before claiming completion

- Check source SHA-256, in-bounds panel rectangles, no missing/duplicate panels, coverage of all transcript lines, unique stable cast voices, measured shot timing and intentional pauses.
- Inspect every final panel and transition at output size, including first/last frames. Verify no clipped captions, distorted art, reordered events or accidental gutter-only shots. Confirm video/audio duration and full decode with ffprobe/ffmpeg.
- Verify final AAC/master alignment and clipping/headroom using the audio backend's real checks. Record provenance for Kokoro and Stable Audio models, stems, seeds, prompts and generated file hashes.
- Check final encoded speech, foreground effects and audible music. Record quantitative level diagnostics and their limitations. If no actual listening surface exists, keep `listeningVerified: false`, disclose that missing check, and invite review of a mixed preview. Do not equate technical validation with perceptual approval.
- A test means an actual rendered video made from the requested image with the requested synthesized voices/music/SFX. Distinguish plan-only, renderer smoke tests, blocked audio, and complete production honestly.

## Checkpoint and deliver

At meaningful milestones save durable private checkpoints when requested: original/manifest/transcript, synthesized stems, and final deliverables. Checkpoint before lengthy synthesis/rendering. Respect the user's requested progress cadence without claiming a timed monitor exists unless configured.

Deliver full-quality videos through the user's authorized destination. Upload to private Drive only when the user has authorized that upload and account. Preserve default private permissions and verify them; never enable link sharing. Deliver a verified Drive viewer link plus native video attachment when feasible. Also deliver transcript/captions and a compact QA receipt; preserve the editable manifest and audio provenance in the checkpoint package. Make a companion static-title audio-drama video only when requested, and deliver it through the authorized destination too.

Install the two bundled skill directories through the host’s supported skill installer. Public publication, additional uploads and paid services require the applicable user authorization.
