---
name: create-anime-ascii-story
description: Create local AI-assisted anime-to-ASCII illustrated short films and matching audio-drama videos, with distinct Kokoro character voices, generated music, rich action sound effects, patch-only ASCII repairs, and sample-accurate export checks. Use for anime ASCII stories, audio-first illustrated films, or revisions of this workflow; not articulated animation or general cartoon-studio exports.
---

# Create Anime ASCII Story

## Non-negotiable defaults

- Use anime images automatically converted to detailed colored ASCII. Generate a new image for **every shot** in new productions; reframing is not new art. Reuse existing visuals only for an expressly requested revision.
- **Never redraw ASCII.** Make only bounded local cell patches to automatic conversions. Predeclare repair regions; preserve every outside character, color and rendered pixel exactly. Accept defects that cannot be fixed locally.
- Make the complete story understandable with eyes closed: narrate essential action, location, causality and speaker identities. Give the narrator and every speaking character distinct actual stock Kokoro voices. Introduce dialogue, then switch voice for the quoted line.
- Supply varied, clearly audible effects for meaningful actions and consequences. Separate voice, effects and music buses; duck music under speech **and effects**, not all nonvoice sound indiscriminately. Keep action transients and tails present without masking speech.
- Deliver both an illustrated film and a full-length static fitting ASCII title/credits audio-drama video. Copy one encoded AAC soundtrack into both.

## Route and preflight

1. Read [models.md](references/models.md) for verified sources, licenses, resource limits and generation commands. Use existing verified runtimes first. Do not download weights or run unreviewed source merely because a model name appears here. Confirm license/setup authority before new terms, credentials, paid services or large downloads; never accept terms for the user implicitly. No personal computer use without explicit authorization.
2. Read [production.md](references/production.md) for project schema, audio-first planning, rendering and quality gates. Keep each revision in a separate project directory; retain original assets, seeds, hashes, timings, rejected images, cast and cue records.
3. Read [visuals.md](references/visuals.md) before image conversion/patching and native-cell rendering. Use the bundled scripts rather than silently rewriting the process.
4. Confirm tools and available RAM/disk; run heavy inference serially with CPU/thread/time limits. Do a single-shot/voice/effect smoke test before a film. Explain environment limitations; do not silently substitute non-anime art or a different voice model.

## Produce

1. Write an audio-first script and shot/action/cast plan. Audit each action for an effect, including movement, contact and aftermath. Record a distinct stock voice per speaker.
2. Generate individual utterances without speed-up to fit. Measure actual decoded PCM lengths, then place them in a single fixed timeline. Leave room for speaker changes and action sounds. Generate score and varied effects; select source transient offsets by inspection/listening rather than assuming the loudest sample is the intended contact.
3. Generate and inspect fresh anime shots. Prefer single-character reaction/action cuts over unreliable multi-character fights. Record prompt/seed/model/runtime/elapsed time and source hashes. Do not claim still illustrations are articulated animation.
4. Convert every shot automatically to ASCII; spot-patch only where justified. Check saved text/RGB roundtrip, changed-cell count and outside-region pixel equality. Inspect encoded-size legibility.
5. Run `python scripts/mix_audio.py PROJECT/project.json`, then `python scripts/render_pair.py PROJECT/project.json`, then `python scripts/validate_audio.py PROJECT/project.json`. Resolve every error; do not bypass QA by weakening thresholds. Source paths in JSON are relative to its directory. Keep inputs outside the skill package.
6. Listen to the finished audio without pictures when a listening path exists; inspect representative encoded frames, every repair and caption transition. Technical analysis or Whisper transcription is **not** auditory review. Disclose unperformed perceptual checks honestly.

## Deliver and retain

Return both native MP4s, truthful credits and a short account of limitations and checks. Preserve the project manifest, source timings, ASCII text/colors/patches, cue sheet, provenance and validation reports; do not include weights or binaries in process packages. Keep individual delivery archives below roughly 18 MB when the channel requires it. Never publish, message another agent/person, upload to Drive/GitHub, or expand into another tool automatically; use the current request's authority. Give milestone updates and at least approximately every 15 minutes during active production.

## Enforcement boundaries

Bundled tools enforce deterministic geometry/audio invariants, not taste, plot clarity, license eligibility or generated sound realism. Require human/agent review of these separately. A passing technical report does not certify model safety, artistic quality, audibility or independent listening. Consult [production.md](references/production.md) for known limitations and benchmark interpretation.
