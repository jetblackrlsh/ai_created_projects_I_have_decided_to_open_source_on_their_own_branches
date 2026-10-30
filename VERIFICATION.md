# Verification

Tests distinguish actual model generation, audio decode and DOM handlers from unavailable real-browser checks. No personal computer was used.

- Private integration: all six bundled voices generated real WAVs and FFmpeg decoded them fully. Existing full parity DOM/native-canvas UI tests passed (still/comic edits, voice embed, art catalog, bitmap safety).
- Kokoro API test passed new defaults, legacy nonmutation, WAV parsing, mismatched settings rejection, measured clip timing, cast locks and portable JSON.
- Kokoro UI DOM/native-canvas integration passed provider switching, legacy preservation, actual WAV+sidecar file import handlers, per-speaker embedded audio, roundtrip, stale-clip and conflicting-cast rejection.
- Real local Kokoro 1.0 model / kokoro-onnx 0.6.1 generated neutral speech with af_heart. The headless project CLI synthesized, measured and embedded the actual WAV.
- Mixed 24k Kokoro and 44.1k narration exported to a 48k stereo stem of exactly eight seconds and fully decoded with FFmpeg.
- Stagecraft regression passed views, travel, visibility, paired carry and voice consistency.
- Sandboxed real Chromium could not start under the cloud process sandbox. An attempted execution permission override also failed before launch. No real-browser or auditory-listening certification is claimed.

Staged public source:

- Fresh `npm ci --cache /tmp/npm-cache`, `npm run build` and `npm run test:kokoro` passed.
- `test:voice`, `test:ui`, `test:catalog`, `test:puppet`, `test:actions`, stagecraft and scene-library API/UI regressions passed (58 actions / 1,824 motion samples; 72 props / 42 backgrounds / 22 effects / 488 raster samples).
- All six sanitized generic standalone demonstration projects validate; all 182 reusable template/project files are retained.
- All ten original thematic music files and seven original SFX have exact SHA-256/embedded-byte equality and fully decode with FFmpeg.
- Adapter's five no-network setup/status/negative tests pass.
- Final proposed source scan found no private Drive IDs/URLs, personal machine paths, personal names/likeness descriptors, private narrative titles, credential patterns or symlinks. This is a scoped audit, not a guarantee against every possible secret.
