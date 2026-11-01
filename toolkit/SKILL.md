---
name: create-heroic-motion-comic
description: Create headless heroic American-style motion comics from editable original comic panels, with a complete narrated soundtrack, readable captions, and a matching title-card audio drama. Supports exact preservation of an existing soundtrack or local Kokoro voices and generated music/SFX for new stories.
---

# Heroic Motion Comic

This is a bounded original-comics drawing and assembly workflow, not a trained style model or proof of publisher-equivalent art. Use original heroic comic artwork, not ASCII conversion, mascot/chibi substitution, or generic panels mislabeled as heroic.

Before full production, read [visual review evidence](assets/tool/docs/style-review.md). Inspect an appropriate reference and draw a demanding representative panel with retained construction/source. Record the shared module functions/parameters or bespoke paths that actually produced visible geometry. Inspect proportions, connected anatomy/contacts, acting, ink/form shadows, perspective/depth, species and tone at intended size; use an image-only independent reader when available. Resolve any rejected user preview before scaling up. Review every final panel, with observations and current image/source/construction hashes. Do not fill accepted flags or update hashes merely to bypass a failed review.

The default heroic mode requires these records on both audio routes. The code only checks evidence presence/freshness and recorded status; it does not recognize or guarantee style. Generic compatibility must be explicit and appropriate to the request, and is labeled PANEL MOTION COMIC. It is not a fallback when heroic art fails. The older `harbor` and `heroic-harbor` fixtures demonstrate engineering only. Inspect `heroic-showcase` for the separately reviewed neutral keeper artwork, construction views and honest style limits; acceptance of it does not approve new productions. For new art, resolve the installed `draw-heroic-comics` skill by name; for supplied art, inspect the actual page files and reading order. Do not claim articulated animation: this workflow uses panel editing and restrained camera moves.

Read [the tool workflow](assets/tool/docs/heroic.md). Keep work outputs outside this installed skill. Use the bundled `assets/tool/heroic_motion.py` to import page JSON/PNG crops, validate a shot/caption timeline, preserve AAC and render paired videos. Record every source panel's crop, hash, story beat and output time. Review power/action cause-and-effect, identities, locations and dialogue assignments rather than trusting equal panel counts as evidence of alignment.

## Choose the soundtrack route

**Existing soundtrack:** Preserve all supplied narration, dialogue, music and effects unless the user requests changes. Extract AAC by stream copy, preserve the original voice/caption clock, align new art to that clock, and verify every packet payload and timestamp against the source. Do not regenerate or remix a supposedly identical soundtrack. For non-AAC sources explain the needed conversion and its implications rather than claiming bit identity. Use the same complete AAC in the motion film and companion title/credits audio drama.

**New soundtrack:** Read [commands](assets/tool/docs/commands.md), [schema](assets/tool/docs/schema.md), [model notices](assets/tool/references/models.md) and [production rules](references/production.md). The bundled `motion_manga.py` backend is retained under its original name for attribution; keep the heroic artwork. Narrate action and identify speakers so the story works without visuals. Use distinct stable Kokoro stock voices, local instrumental score and varied clearly audible action SFX. Measure actual speech on a canonical48kHz timeline; do not estimate scene lengths or concatenate separately encoded audio clips.

## Delivery gates

Run all bundled tests and applicable per-utterance audio checks. Exact-master mode requires zero-difference packet/timestamp verification and a50ms drift negative control; a duration match alone is insufficient. Inspect every shot/caption at viewing size, check the semantic audio-to-image mapping and full decode, and review the title card for readable credits. Listen when a real listening surface is available; otherwise disclose that independent listening was not performed.

Deliver the normal-speed film, same-soundtrack static-title audio drama, metadata, and editable project with source art, crops, timing manifest, captions, audio provenance and verification. Keep source/private story backups separate from the public reusable toolkit. Never bundle model weights, credentials, private conversations, book scans or reproduced instructional art. Optional publication, paid APIs, restoration or personal-computer use requires the applicable authorization; this skill itself grants none.
