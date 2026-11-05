# Anime Visual Novel Adapter

Adapt authorized narrative text into 1080p, 24 fps kinetic-novel videos with ADV/NVL/CG presentation, character-consistent artwork, Kokoro voice acting, local Stable Audio music/SFX, captions, a browser theater and YouTube metadata.

This portable edition preserves the source package's five production scripts and two cinematography/schema references, while replacing personal machine paths and host-specific tool assumptions. It is an assistant skill and production toolkit, not a one-command autonomous video generator.

## Quickstart

Use Python 3.10+ and FFmpeg/ffprobe. From this branch's root:

```sh
python -m venv .venv
# Activate .venv using your platform's normal activation command.
python -m pip install -r requirements.txt
python scripts/prepare_vn_image_manifest.py --help
python scripts/render_vn_video.py --help
python -m unittest discover -s tests -v
```

Install this directory as a skill in your assistant's supported skill manager, or read `SKILL.md` and follow its production workflow. Copy the JSON example from `references/vn_spec_schema.md` into a project spec and replace it with your authorized story; the abbreviated example is a field reference, not a finished production.

Read `references/runtime-setup.md` before audio generation. Model weights, the official Stable Audio runtime, image generation and FFmpeg are external dependencies, not bundled assets. No credentials or private story material are included.

## Production

1. Audit story clarity and fidelity; write the storyboard specification.
2. Build the image prompt queue; generate images using your host's supported tool.
3. Inspect all five visual-QA pillars and finalize images at 1920×1080.
4. Generate unique Kokoro voices at speed 1.0, with duration-preserving DSP and per-page captions.
5. Generate scene music and cue-aligned SFX. Music transitions use non-overlapping fade-out/fade-in, not crossfades; SFX are clamped to scene boundaries.
6. Render the video, browser theater and metadata. Run the validator and inspect/listen to the finished output.

Only `queue` and `finalize` are image-script modes. It does not implement an offline SDXL generator. Audio pages use sample-derived timestamps; 24 fps display timing and within-page cue estimates are not a guarantee of zero drift or exact word alignment.

## Portability and safety

Linux DejaVu and Windows system fonts are supported; `VN_FONT_PATH` selects a licensed local font. Stable Audio accepts `--sa3-python` and `--sa3-script` for your environment. Browser theater story text is escaped and inserted as text rather than executable HTML.

Use trusted, reviewed specs and unique filename-safe IDs (letters, digits, underscores and hyphens). Do not use path separators or traversal sequences in character, scene, line or sound IDs. Work in a dedicated project directory: generation overwrites outputs there. Only publish source stories or rendered media when separately authorized. Respect model, voice, font, source-story and image-provider rights and terms.

## Release and license

This project lives on `project/anime-visual-novel-adapter`, not `main`. Select that branch before downloading the ZIP.

Original project contributions are offered under the repository's CC0 1.0 terms, only to the extent the contributor holds those rights. External dependencies retain their own licenses. See `THIRD_PARTY_NOTICES.md`, `PROVENANCE.md` and `TEST_REPORT.md`.
