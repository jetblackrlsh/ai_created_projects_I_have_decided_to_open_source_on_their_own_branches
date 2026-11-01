# Production rules

## Stage contracts

Keep one authoritative project manifest with relative paths and explicit role, shot, cue, and provenance records. Validate before any expensive generation. Keep generated assets immutable or versioned; capture seeds, prompts, settings, durations, and content hashes. Distinguish provided assets, local model generations, programmatic assets, and placeholder test signals.

Treat the comic as the visual source of truth, while adapting text into an audio-complete script. Narrate invisible assumptions, entrances, departures, locations, attack attempts, impacts, consequences, and transformations. Give character speech to the character's own stable voice; use narration to attribute it rather than speaking every line in the narrator's voice. Avoid repeated introductions that damage pacing, but never let the listener lose the speaker.

Use a shot ledger mapping every source panel to output time and framing. Preserve reading order unless a deliberate adaptation improves clarity without changing events. Allow a held image while dialogue finishes. Avoid arbitrary reuse where new source panels exist, excessive zoom, tiny unreadable whole pages, rapid flashes, and crops that hide the story. Never infer a whole-page montage counts as individually checked panels.

## Local model handling

Read the tool's dependency/model manifest and notices. Prefer existing validated installations. Restore only official pinned artifacts under the applicable user authority, verify length and cryptographic hash before use, and record the exact runtime. A dependency/version change requires revalidation; a new provider or paid route needs authorization. Keep model weights outside the distributable skill/tool. Do not auto-download executable code from unknown repositories or enable remote model code without review.

Kokoro provides narration and distinct stock character voices. Stable Audio supplies instrumental score and action SFX when available and authorized. Describe the exact tested backend and settings, not an umbrella model name. Fail explicitly if the configured backend is absent; do not quietly replace model-generated music/SFX with tones or speech with another TTS engine.

## Timing and mix

Measure decoded voice audio, normalize to a shared 48 kHz PCM rate, and place events at integer sample positions. Derive image durations and subtitle boundaries from these placements. Avoid cumulative AAC padding from concatenated compressed clips; encode the final complete soundtrack once. Mux the same encoded audio into both the motion video and static audio drama.

Map audible events to actions: footsteps, cloth movement, launch/whoosh, contact, dropped objects, machinery, weather, power release, and environmental consequences. Create variations rather than mechanically repeating every sword or impact. Use transient placement and level automation deliberately. Prioritize clear words but retain meaningful SFX presence; duck music first and lower conflicting effects only during measured overlaps. Inspect isolated voices as well as full mix, since loud music/effects can hide alignment or masking defects.

## Delivery and honesty

Keep an editable manifest, original art, crop ledger, captions, voice map, dialogue clips, score/SFX sources, timing/cue sheets, PCM master, exact AAC, videos, package hashes, rights/model notices, and QA reports. Preserve raw failed reports when fixing defects. Validate ZIP CRCs and content hashes after packaging and read back persisted copies where possible.

Provide a fitting static background/title/credits image for the audio drama with the entire film soundtrack. Do not make an audio-only variant with missing cues or a separately timed narration. Report any unperformed human/listening review plainly. Browserless rendering reduces browser dependency; it does not remove model, codec, filesystem, CPU, memory, or audio-quality limits.
