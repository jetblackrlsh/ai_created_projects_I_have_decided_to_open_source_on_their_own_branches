---
name: create-pngtuber-video
description: Create complete faceless commentary, explainer and video-essay videos from a topic, notes or document, using a pose-changing transparent PNG host, motion graphics, verified source screenshots, Kokoro narration and Stable Audio Small music/SFX. Use for PNGTuber-hosted videos, not fully articulated animation or comic-panel adaptations.
---

# Create PNGTuber Video

Produce a coherent, sourced video with a reusable host rather than a slideshow of dense text. Default to **640×360, 24fps**, private Google Drive delivery and a copy-ready YouTube description. Keep project assets outside this skill. Do not upload to YouTube without explicit authorization.

## Establish the argument and source

1. Read the complete supplied document or clarify an ambiguous core thesis. For a topic alone, research enough to write a grounded script. Preserve the user's actual opinions; do not invent personal experiences or present inference as a sourced fact. Separate quotations, commentary and narration.
2. Write a hook, brief context, ordered claims with supporting visuals, and a useful closing. Match length to the material, not a fixed template. Present consequential factual uncertainty plainly. Record each external claim's exact source and access date in `sources.json`.
3. Read [sources and visual planning](references/sources-and-visuals.md). Inspect actual screenshots and book excerpts before using them. Never generate a fake screenshot, logo, headline, quote or evidence chart. Use short necessary excerpts with attribution; do not reproduce whole books or bypass access controls. Never expose private tabs, account data, contacts, tokens or unrelated content in screenshots.
4. Build a scene plan tying each spoken beat to a purposeful visual: highlight/crop a source, animate an accurately labelled comparison, reveal a short diagram, show an original illustration, or cut to a host reaction. Do not use invented numbers for real comparisons. Keep evidence visible long enough to understand.

## Prepare the reusable host

- Reuse the user's explicitly selected saved reference, preserving identity. If Jet is host, resolve `generate-jet-style-images` and read/inspect his relevant canon before generation. Do not substitute a generic avatar for a real person. Ask only if no available reference supports the requested identity.
- Use built-in image generation for new bitmap host art, with transparent background. Make a consistent pose/expression pack: neutral, talking, explaining, curious, surprised, concerned, pleased, pointing left/right. A simple closed/open mouth pair is optional, not phoneme lip sync. Inspect each pose and all anatomy, alpha edges, clothing and face continuity.
- Keep canvases and visual anchors consistent; crop only after inspecting originals. Bundle private host art in the project, not in an open-source skill release. Never reuse personal photographs or personal likenesses as public test fixtures without authority.
- Select expression and position based on the line's meaning. Use purposeful pose changes, modest motion and occasional full-screen evidence. Keep host away from source text and captions. Do not animate every word or imply fully animated characters.

## Produce audio and measured timing

Read [audio workflow](references/audio.md) before synthesis. Use the bundled audio adapter and official runtime setup path. Generate **Kokoro** speech, **Stable Audio Small Music** instrumental beds, and motivated **Stable Audio Small SFX**. Restore official model/runtime files in the cloud when authorized; no paid API, personal computer, new legal agreement or credentials are implied.

- Split each line into speaker spans before synthesis. “The narrator explains: [character quote]” is two spans, not one voice. Labels and stage directions are not spoken unless intentional. Keep display text separate from pronunciation-normalized TTS text; pronounce AI as initials. Stable voices, sample-rate, model version, normalized text and speaker mapping must enter cache keys.
- Build and retain separate speech, effect and music stems on the same sample clock. Measure actual speech duration, add natural pauses, then align scene ends to frames. Never truncate words or accelerate speech to satisfy a guessed runtime.
- Voices must remain clearer/louder than foreground SFX, which remain louder than **audible** music while overlapping. Silence between motivated effects is normal; do not silence music just because no effect is playing. Use gentle SFX processing and bounded phrase-level ducking, not repeated attenuation around every syllable. Check final post-master stems and encoded audio, not just source gains.
- Run the music-presence validator and inspect its diagnostics; failed checks require repair before “complete.” Numerical ratios are not a listening test. Listen to representative speech+music, effects, transitions, quiet passages, and start/end when a listening surface is available. If not, disclose `listeningVerified:false` and deliver a mixed preview for the user to judge without claiming perceptual approval.

## Render and verify

Read [manifest and renderer](references/manifest.md). Use `python scripts/render.py manifest.json video.mp4` for the bundled deterministic baseline. It supports PNG pose swaps, small speech-reactive bob/mouth toggling, left/right host placement, source crops/highlights, animated bars, text reveals and full-screen evidence. It does not synthesize audio, scrape websites, infer a script or perform semantic QA.

1. Render directly at 360p24 unless an explicit different resolution is requested. At 360p, crop and focus source details instead of showing a whole tiny webpage. Limit text to a few large lines. Split a dense scene rather than shrinking fonts. Static holds are preferable to illegibility.
2. Review every scene and boundary at actual output size; inspect start/end and all pose changes. Check no covered source attribution, unreadable labels, warped faces, clipped limbs, misleading charts or captions. Compare with the full script for omissions and speaker attribution.
3. Run full ffmpeg decode, ffprobe dimensions/duration and speech-placement validation after AAC encoding. Verify final music floor, voice/effect hierarchy and peak headroom from final stems. Preserve quantitative receipts and listening limitations.
4. Retain measured timeline, original sources and hashes, source ledger, voice map, prompts/seeds/model hashes, stems, captions and edit scripts. Save a private Drive checkpoint after script/assets and after audio so a workspace reset does not erase progress. Give progress at milestones and at least every 15 minutes during active work, with grounded estimates only.

## Deliver

- Upload the completed video at its chosen production resolution to owner-only Google Drive; verify bytes/metadata and permissions. Provide the direct video link and `youtube_metadata.md` link. Do not enable public sharing or publish the user's content by default.
- Write an immediately copyable public YouTube description: exact title first, useful description and source credits, comma-separated tags last. Keep private links, delivery notes, QA caveats and placeholders out of the public description. Include separate Title/Tags fields too. Resolve `write-youtube-description-tags` when needed.
- Provide SRT/VTT and editable project checkpoint, including the host pack. State runtime and any actual QA limitation. A renderer-only test, silent sample or placeholder audio is not a completed production test.
- For a requested public skill release, publish only generic code/docs and synthetic fixtures with licenses. Do not include Jet's avatar, scripts, source screenshots, private links, models, voice weights or credentials. Audio models retain their own licenses and are fetched separately.
