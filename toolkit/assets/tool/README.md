# Motion Manga Tool 0.2.0

Original comic art first, synchronized motion adaptation second. The default manga route requires drawing provenance and hash-bound visual review; supplied manga has an explicit permission/provenance route. The renderer does not itself invent finished art from prose or certify artistic quality.

Start with `examples/manga-harbor` and `docs/commands.md`: two actual original manga panels, editable scenes and a portable drawing renderer, paired12-second video/audio-drama outputs, local Kokoro dialogue, generated music/SFX, source receipts and honest limitations. `examples/harbor` remains an explicitly labeled technical pictogram fixture, not manga art.

# Visual fidelity correction

The legacy `examples/harbor` directory is a pictogram-based technical fixture, not a manga drawing demonstration. Manga exports now require explicit source evidence and hash-bound visual review. See `docs/art-contract.md`. Technical tests cannot certify artistic quality.

# Motion Manga Tool

Turn existing comic panels into an audio-first, locally narrated **motion comic**, plus a matching static-title audio-drama video. Preserve original artwork; use small camera pushes, captions, distinct Kokoro stock voices, locally generated Stable Audio music and varied action effects. **No ASCII conversion; no claim of articulated character animation.**

This is a headless Python/FFmpeg toolkit, not a browser app. It never publishes, calls a paid API, installs models or accesses a personal computer on its own.

## Quick start

Use Python 3.12 with the assembly requirements in `requirements.txt`, FFmpeg/ffprobe, and DejaVu Sans fonts. SVG cropping additionally needs Inkscape. Model generation uses separately verified environments; see `references/models.md`.

```sh
python motion_manga.py validate examples/manga-harbor/project.json
python -m unittest discover -s tests -v
```

The `examples/manga-harbor` demo uses original manga-tool panels with a keeper opening a hinged harbor gate. It reuses the neutral locally generated audio, with verified timing. It is a bounded vector demonstration, not a claim of high-end anatomy. Before rebuilding, preserve/move `examples/manga-harbor/out` and `examples/manga-harbor/delivery`; overwrite refusal is intentional.

```sh
python motion_manga.py mix examples/manga-harbor/project.json
python motion_manga.py render examples/manga-harbor/project.json --mode both
python motion_manga.py verify examples/manga-harbor/project.json
python motion_manga.py package examples/manga-harbor/project.json
```

The separate `examples/harbor` directory is only a pictogram-based engineering fixture. Never use it as the visual default for a manga request.

## Workflow

1. Author/review the complete **audio-only script**: actions and speaker identities must be understandable without images. Assign a different stock voice to every speaking role, including narrator.
2. Intake source pages/panels and record hashes/coverage. `crop crops.json` handles explicit pixel rectangles from PNG or a restricted self-contained SVG. It does not identify panels automatically or redraw them.
3. Generate speech and measured audio. `speech` and `generate-audio` forward options to the local adapters; see `docs/commands.md`. No synthetic beeps or existing clips silently substitute for failed generation.
4. `plan` can write measured shot timing from generated utterances to a NEW manifest; review it and author intentional music/SFX cue placement afterward. `validate` checks coverage, cast, hashes and timing. Every declared source panel must be represented.
5. `mix` writes canonical 48 kHz PCM stems and one AAC master. Music ducks strongly; effects remain present, with local documented `speechFocus` dips only where necessary. Speech is not stretched.
6. `render` produces paired videos with the same encoded audio. `verify` hard-fails missing/silent speech, bad rates, source mismatch, drift, masking, clipping, broken timelines or unequal AAC. It tests deliberate 50 ms delays rather than trusting timestamps alone.
7. Inspect actual rendered frames and listen to the entire pair where available. Technical correlation is not a guarantee of good acting, effect fidelity, accessibility or enjoyable sound. Reports truthfully leave listening/visual review unverified until a separate review is recorded.
8. `package` refuses stale or failed QA and exports original source audio, images, manifest, provenance and verification in ZIP parts below 18 MB. It does not publish them.

See `docs/schema.md`, `docs/commands.md`, `references/models.md`, and `NOTICE.md`. Current bounds: square output 256–1920 pixels, up to five minutes per project, sequential CPU model inference. Longer stories should be intentionally split into independently verified chapters, not silently truncated.

Public distribution omits redundant delivery ZIPs; recreate them with the package command after verifying the retained sources and outputs.

## Drawing dependency for new stories

The bundled generic renderer and editable scenes reproduce this neutral demonstration. New stories require the full `draw-headless-manga` skill/tool or a deliberately selected equivalent drawing workflow, followed by the required visual review. This motion assembler is not that full drawing system and must not silently substitute generic pictograms when the drawing dependency is unavailable. Resolve/install the drawing tool explicitly, or stop and explain the missing dependency. The older drawing branch is not presented here as a verified full public release.
