# Create Anime ASCII Story

An AI-assisted, browser-independent short-film workflow: generate anime stills, convert every shot into detailed colored ASCII, make small local repairs without redrawing, and combine distinct character voices with music and foreground action effects. Export an illustrated film **and** a static-title-card audio-drama video sharing exactly the same soundtrack.

This is an agent skill plus working Python command-line helpers, not a one-click model installer or articulated-animation system. Models, model weights, runtime binaries, personal stories and production media are deliberately excluded.

## Get this project branch

This project lives on `project/create-anime-ascii-story`, not `main`:

```sh
git clone --branch project/create-anime-ascii-story --single-branch \
  https://github.com/jetblackrlsh/ai_created_projects_I_have_decided_to_open_source_on_their_own_branches.git
cd ai_created_projects_I_have_decided_to_open_source_on_their_own_branches
```

Alternatively select that branch on GitHub, then **Code → Download ZIP**.

## Core setup and offline smoke test

Tested on Linux, Python 3.12, FFmpeg/ffprobe 7.1.5, and DejaVu Sans Mono Bold. Install FFmpeg and a licensed monospace font separately. These commands install Python dependencies, but never download AI models:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
python tests/smoke_fixture.py /tmp/ascii-story-example
```

The test creates a five-second, two-shot geometric/test-tone fixture, applies a one-cell ASCII repair, and produces `out/film.mp4` and `out/audio-drama.mp4`. **It is not AI anime, synthesized speech, generated music or a perceptually validated drama.** The script rejects an existing output directory to preserve prior runs.

## Create a real story

Read [SKILL.md](SKILL.md), then [model setup](references/models.md), [project schema and production checks](references/production.md), and [ASCII conversion/repair](references/visuals.md). Provision and verify the official pinned local runtimes/models explicitly after reviewing their licenses. Keep large model environments separate from the core environment; the audio model's tested dependency versions differ. There is no paid API or browser requirement.

1. Write a script that is understandable without visuals; identify actions and speakers. Cast a distinct stock Kokoro voice for every speaker and narrator.
2. Generate a fresh anime image per shot, individual voice clips, music and varied meaningful effects. Record prompts, seeds, hashes and timings. Inspect output and select effect transient offsets.
3. Convert images with `scripts/ascii_art.py convert`; use only bounded, declared patch cells. Never redraw ASCII. Supply a supported licensed font with `--font` where necessary.
4. Put sources and `project.json` in a fresh project directory. Measure voice durations before assigning the timeline.
5. Run:

```sh
python scripts/mix_audio.py /path/to/project/project.json
python scripts/render_pair.py /path/to/project/project.json
python scripts/validate_audio.py /path/to/project/project.json
```

Scripts fail with a nonzero exit on invalid inputs/invariants. Paths in the project JSON are relative to that file. The default renderer expects 120×60 ASCII cells rendered at 8×16 pixels (960×960 art) and creates 1080×1080 films. Use `--help` on helpers for their CLI. Preserve versions rather than overwriting outputs.

## What is enforced

- Automatic printable-ASCII text and RGB sidecars with exact roundtrip.
- Predeclared local repairs, aggregate ROI and changed-cell budgets, immutable baseline and exact outside-region character/color/pixel preservation.
- Fresh-source uniqueness, native glyph size and cell-aligned motion.
- Canonical 48 kHz PCM, fixed sample placement, no overlapping speech, consistent distinct declared voice IDs, meaningful effect placement, separate buses and one shared AAC encode.
- Full decode, stream/frame/packet checks, exact source/mix reconstruction, start/end waveform anchors and injected 50 ms error detection.

The mixer cannot establish that a submitted WAV actually came from its declared voice; use synthesis provenance. Technical checks do not replace listening, image inspection, speaker clarity or license review. Some generated anatomy/action defects remain; local patches intentionally cannot solve everything. Resource monitoring is sampled/advisory, not a kernel memory limit.

## Structure and licensing

`SKILL.md` is the agent router; `scripts/` contains seven reusable helpers; `references/` contains the model manifest and workflow contracts; `tests/` contains the synthetic model-free smoke test. No CI/deployment or external service is configured.

Original project contributions are offered under the repository's [CC0](LICENSE), only to the extent of the contributor's rights. Dependencies and model weights retain their own licenses; **CC0 does not relicense them or establish unrestricted commercial rights to model outputs**. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Review current model terms before obtaining, using or redistributing models or generated media.
