# Audio generation dependency and safe use

The companion installed skill is **webgl-canvas-story-animator**. Its public reference is:
https://github.com/jetblackrlsh/ai_created_projects_I_have_decided_to_open_source_on_their_own_branches/tree/project/webgl-canvas-story-animator

Inspect its current scripts and references before running them. Do not assume installation creates a working environment. Use a writable cloud cache location; never fall back to a personal computer without authorization. Restore official runtimes/weights only under current permission, and stop for new license acceptance, credentials, paid APIs or access restrictions. This guide does not create new standing authorization.

Expected companion helpers:
- setup_audio_models.py --cache-dir CACHE: missing-file downloads and integrity checks. It does not create/install every Python dependency or tokenizer asset. Verify the actual runtime commit, packages, tokenizer and all model files before inference.
- kokoro_tts_render.py --cache-dir CACHE --lines script/lines.json --out-dir audio: distinct stock voice synthesis, measured line WAVs, timeline, voice stem and captions. Use actual get_voices() results rather than assumed IDs.
- sa3_audio_gen.py --cache-dir CACHE --music script/music_cues.json --sfx script/sfx_score.json --out-dir audio: generated local Small-Music/Small-SFX with per-clip provenance.
- mix_and_verify_audio.py: inspect and adapt in the project before using; known edge cases below must not be silently inherited.

Use environment-local dependencies (kokoro-onnx/onnxruntime, numpy/scipy/soundfile, ai-edge-litert, sentencepiece and the official Stable Audio runtime's requirements). Verify availability with imports and short real inference, not directory existence. Record actual commands, runtime commit, hashes, prompts/seeds and output checksums in audio/provenance.json. Keep secrets out of logs and deliveries.

## Known issues found in the inspected source version

These are concrete checks to re-evaluate if upstream changes, not universal claims about future versions:

- The manifest has both sha256 and verified_sha256 for the SAME-S decoder, with conflicting values. The setup script and audio reference agree on 2fc31cdc42a54342233fb8c6da636565b1191d97002665e21812e981490434a6. Verify against official provider metadata before using; do not accept the conflicting string silently.
- The setup helper clones a pinned runtime but does not verify an already-existing clone is at that revision and does not install its venv. Inspect existing runtime state without overwriting unrelated edits. The tokenizer can require additional official assets beyond the four large TFLite files.
- sa3_audio_gen.py skips a clip if WAV and metadata exist without comparing current prompt/seed/settings or re-hashing bytes. Before reuse verify its generation specification and checksum; changed cues require regeneration.
- The mixer's fixed 1.5-second loop crossfade can fail to advance for clips <=1.5 seconds. Bound crossfade below clip length and require positive progress. Clamp a late SFX at its requested time and trim the tail, never relocate it earlier. Validate nonempty clips and finite times before mixing.
- The mixer's VTT formatter can output .1000 near a second rollover. Convert to rounded integer milliseconds, then divmod for hours/minutes/seconds/milliseconds.
- RMS comparisons made over different activity windows do not establish event-by-event masking. Measure speech versus music during speech and SFX versus music during each SFX window. Empty windows should be marked not applicable, not given fabricated loudness.
- The metadata helper hardcodes an unrelated example plot and unconditional model credits. Write fresh metadata from the current story and verified provenance instead.
- The companion project validator uses source-string/file/count heuristics and does not establish the promised visual quality, actual shader execution, semantic repetition, precise caption sync or complete codec/resolution/frame-rate checks. Use this skill's technical validator plus perceptual reviews. Never add fake cast members, lines, SFX or implied dialogue to satisfy fixed quotas.

Model names belong in delivery credits only after real inference produced the delivered assets. If genuine generation is blocked, report exactly which model/runtime/file/action is blocked and continue independent visual/story preparation. Do not label an alternative as the requested model.
