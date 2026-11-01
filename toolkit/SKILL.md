---
name: create-motion-manga
description: Create headless motion manga from an original story or existing comic panels, with distinct local Kokoro voices, narrated action, locally generated music and rich sound effects, synchronized captions, and a matching title-card audio drama. Use for motion manga, animated comic adaptations, or comic-to-video requests; preserve the supplied artwork rather than converting it to ASCII.
---

# Motion Manga

## Establish the source

- Adapt an existing comic when supplied. Inspect its actual pages, reading order, panels, dialogue, credits, and cropping rights before planning shots. Preserve the supplied art; do not silently redraw, use generative image substitutes, or convert to ASCII.
- For a new story, use the installed `draw-headless-manga` skill to create an original, editable comic first. Resolve that skill by name in the user's installed skills; do not assume a machine-specific path or silently substitute another drawing workflow. If unavailable, explain the dependency and continue only with supplied panels or authorized installation.
- Record story beats, identities, panel order, locations, power/action cause-and-effect, and narrator/character roles. Explicitly identify scene changes and speakers in the audio, so the story works without seeing a frame.
- Describe the output accurately as a motion comic: panel editing, restrained camera movement, captions, and sound design, not newly animated character performances.

## Enforce the manga source and visual gate

Read `assets/tool/docs/art-contract.md`. For new stories, use `draw-headless-manga` and retain editable scenes, the actual renderer and command receipt. Inspect every resulting panel at full size and thumbnail size; record hash-bound notes for form, perspective, acting/contact, line/tone and readability, plus sequence continuity and remaining limitations. Do not stamp approvals to satisfy a schema. Supplied manga may use the supplied-source route with permission/provenance notes. Source hashes alone do not establish manga quality.

Use `examples/manga-harbor` for an actual bounded manga source-to-film example; inspect its art and limitations rather than assuming it proves every drawing task. The legacy harbor example is a **technical audio/timing fixture with pictograms, not a manga showcase**. Never use it as a visual starting point for a manga request. Its explicitly generic fixture mode is not permission to downgrade a requested manga adaptation. A style gate validates evidence and review freshness, not aesthetic quality; actual image inspection remains mandatory. Missing evidence or an unacceptable panel blocks manga export.

## Run the portable tool

Use the bundled `assets/tool` as the tool root. Read [command recipes](assets/tool/docs/commands.md), [manifest schema](assets/tool/docs/schema.md), and [model/runtime notices](assets/tool/references/models.md) before authoring a project manifest. The `generate-audio` command accepts a separate audio jobs-plan, not the film manifest. Native source voice sample rates may differ; the mixer must explicitly resample them to the canonical output rate. Resolve assets relative to the project, never against historical `/tmp` or another user's job. Keep work outputs outside the installed skill. Respect the tool’s documented runtime/size bounds; do not silently truncate a longer story. Plan a multi-part adaptation or explain the required extension.

Read [production rules](references/production.md) for staging, permissions, audio design, and delivery gates. Use the bundled neutral example only to understand timing/schema structure, never as manga art. Keep editable scene/shot manifests, dialogue, voice maps, cue sheets, source art and crops, model receipts, generated audio, commands, and QA reports.

1. Complete the audio-only script review: confirm that the text identifies the actions and speakers without images. Record the actual review notes; never set an approval field merely to bypass validation. Validate the manifest and source assets; fail rather than invent missing panels, roles, audio, or provenance.
2. Export verified panel crops from the final source art. Inspect every crop for clipped faces, dialogue, feet, and important action. Prefer a full-panel view with deliberate framing over destructive fill-cropping.
3. Generate normal-speed Kokoro dialogue with a stable, distinct stock voice for every character and a separate narrator. Record exact model/voice versions and measured durations.
4. Plan scenes from the actual decoded speech durations on a canonical 48,000 Hz PCM timeline. Align action cues and captions to that same timeline, not estimated reading time or compressed segment lengths.
5. Generate local instrumental music and varied, meaningful action SFX. Keep important effects audible; favor music ducking and narrowly targeted SFX dips over blanket suppression. Never mask the words to make a dramatic effect louder.
6. Render a motion manga video plus a static title/credits-card audio-drama video using the **same complete soundtrack**. Encode that soundtrack once, reuse the identical AAC stream, and preserve its PCM master.
7. Run all bundled tests and verification gates. Inspect encoded frames and read captions at viewing size. Listen to representative dense action/dialogue sections if an actual listening surface is available; otherwise report that listening remains unverified, not that technical checks establish artistic quality.
8. Deliver the verified videos and editable project package with credits/provenance and concise limits. Report milestones and roughly 15-minute progress updates during long runs.

## Non-negotiable verification

- Verify beginning/end alignment of every decoded voice utterance against the canonical timeline in both exported videos; use the tool's full-mix and isolated-voice checks. Do not rely on one global duration or subtitle alignment.
- Keep drift-detection negative controls that deliberately misalign audio; a check unable to reject the control cannot certify a render.
- Check clipping, silence, sample rate, cue bounds, dialogue masking, source hashes, and exact soundtrack identity across paired videos. Never weaken thresholds to make a failed export pass. Correct the mix/timeline, regenerate reports, and preserve failures in provenance.
- Treat a failed/missing test, missing voice, substitute backend, or incomplete generated audio as a blocker to claiming a finished production. A dry-run or fixture test is not a real generated-media run.
- Preserve all characters, major actions, causal beats, and conclusions from the source. Do not quietly shorten the story to fit a runtime.

## Authority and persistence

Use the selected cloud workspace. Do not use a personal computer, a paid API, a different model/provider, external publication, or public sharing without applicable explicit authorization. Verify pinned official model/runtime sources, checksums, licenses, disk requirements, and restore receipts; do not infer blanket installation permission from an earlier narrowly authorized restore. Never bypass a model access gate or bundle model weights, keys, private conversations, or another project's personal assets.

Save only what the user authorized to the requested destination. An adaptation request is not permission to publish it. Keep source/private story packages separate from reusable public tool/skill releases; audit the exact public tree before upload.
