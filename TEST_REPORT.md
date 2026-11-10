# Release tests

Executed from the staged public package on Linux with Python 3.12 on 2026-11-10:

- `python3 tests/smoke_render.py`: PASS. Actual changing-aspect overview-to-panel zoom, cached static hold, 12-frame MP4 encode and full decode. Invalid source hash, source bounds and mismatched audio duration rejected. Audio is an explicitly silent technical fixture, not a soundtrack-quality test.
- `python3 -m unittest discover -s skills/create-spread-motion-comic/tests -p test_audio_setup.py -v`: 10 PASS. Includes verified downloads/atomic replacement, reuse, missing-file no-write behavior, path/symlink boundary checks, concurrency lock, pinned manifest and token-stripped environment. Network/inference are mocked in these regression tests.
- `python3 skills/create-spread-motion-comic/scripts/test_priority_audio_mix.py`: 7 PASS.
- `python3 skills/create-spread-motion-comic/scripts/test_sfx_comfort.py`: 5 PASS.
- Both SKILL.md files passed the available skill frontmatter validator.

No model downloads, fresh full voice/music/SFX production, host image generation or independent listening were performed for this source-packaging release. Earlier private end-to-end production is not included as public test evidence. No CI workflow is added by this release. Final media still needs visual and listening review by its producer.
