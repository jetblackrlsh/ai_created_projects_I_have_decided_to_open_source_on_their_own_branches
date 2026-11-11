# PNGTuber Video Studio

A headless, agent-guided toolkit for faceless explainers and commentary: a transparent PNG host changes pose/expression while motion graphics, legible text and source images support the script. Default output is **640×360 at 24 fps**.

This is a source release, not a hosted service or an automatic fact checker. A human or agent plans the script, attribution, host art and source evidence, reviews the visuals, and judges the finished mix. No personal avatar, private project, voice/model weights or credentials are included.

## Features

- PNG host pose changes, left/right layouts and full-screen evidence
- Restrained speech-reactive bob and optional open/closed mouth switching (not lip sync)
- Text reveals, animated bars, screenshot crops and highlight rectangles
- Kokoro speech with stable speaker voices, mixed narrator/dialogue spans and initialism handling
- Stable Audio Small generated instrumental music and motivated, softened SFX
- Measured timing, separate stems, music-presence and foreground hierarchy checks
- Source hash/provenance validation and documented private delivery/YouTube metadata workflow

## Quick start

Requires Python 3.12 on Linux x86_64, FFmpeg, and DejaVu Sans fonts. Install the lightweight visual dependencies from an official Python registry:

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r skill/requirements.txt
python skill/scripts/test_render.py
```

Read `skill/SKILL.md` and `skill/references/manifest.md`. Supply an editable JSON manifest and transparent PNG poses, then render:

```sh
python skill/scripts/render.py project/manifest.json project/video.mp4
```

`--frames-only` emits preview images for composition review. A manifest without audio is a renderer test, not a complete production video.

## Included synthetic example

`skill/assets/demo` contains an original geometric robot mascot, pose variants and a clearly labelled synthetic evidence card. It does not depict the user. To try layout without models:

```sh
cp -r skill/assets/demo demo
python -c "import json; p='demo/manifest.json'; m=json.load(open(p)); m.pop('audio',None); open(p,'w').write(json.dumps(m))"
python skill/scripts/render.py demo/manifest.json output/silent-layout.mp4
```

This is explicitly a silent renderer test. For the voiced version use the included `audio-input.json` with the audio builder, then follow the timeline merge instructions below. No pre-rendered test audio or video is distributed.

Release validation passed 8 renderer tests and 8 audio tests. A 473-frame synthetic fixture was rendered and decoded with real Kokoro/Stable Audio soundtrack, with encoded speech correlation and peak checks. **Listening verification was not performed**; numerical checks do not establish perceptual quality.

## Local generative audio

Read `skill/references/audio.md` and all relevant upstream model terms before restoration. The setup helper downloads pinned official runtimes and weights into a separate runtime directory; those assets are **not CC0** and are not bundled here.

```sh
python skill/scripts/audio_setup.py --help
python skill/scripts/audio_setup.py --runtime-root /path/to/runtime --report setup.json
# Add --restore only after reviewing applicable source/model terms and authorizing downloads.
/path/to/runtime/venv/bin/python skill/scripts/audio_build.py project/script.json --runtime /path/to/runtime --out project/audio
```

Merge the audio builder's measured scene durations and `speech` arrays into the visual manifest; set its audio path relative to that manifest. Keep exact frame alignment. Run the audio regression tests with the runtime Python. See the audio reference for restoration, script schema, model hashes and limitations.

## Quality and limits

The renderer is intentionally simple and deterministic. It does not create source screenshots, verify claims, infer panel layouts, synthesize audio itself, or animate articulated bodies. Subtitles use measured utterance durations with proportional chunk timing, not word-level forced alignment. Numeric audio diagnostics cannot guarantee that music feels audible or effects feel comfortable. Review every output scene and listen to representative sections before calling a video listening-approved.

Public releases should use original or appropriately licensed visual assets and short, necessary, attributed excerpts. Never create fabricated screenshots as evidence. Personal likenesses, confidential screenshots and private source documents stay in private projects unless separately authorized.

## License

Original toolkit contributions are CC0 1.0 Universal under `LICENSE`. Third-party packages, fonts, models and runtimes retain their own licenses; see `THIRD_PARTY_NOTICES.md`. This branch is the project release; downloading the repository's `main` branch will not retrieve it.
