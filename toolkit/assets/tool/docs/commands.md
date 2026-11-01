# Local-audio backend command recipes

Commands below run from the tool root. `PROJECT` is a film manifest; `AUDIO_PLAN` is a **different jobs-plan JSON**, not a film manifest. The CLI's positional argument is generically called `project` in help but interpreted according to its subcommand.

## Engineering fixture, not a style showcase

The `examples/harbor` walkthrough below retains flat pictogram artwork solely to test local Kokoro/Stable Audio generation, mixing and packaging. It is explicitly generic-panel mode, not a heroic drawing example. Do not use it as the visual template for a heroic story. For a new heroic project, complete the drawing and [visual review](style-review.md), then use that project with these same audio commands. The renderer enforces the review evidence before final heroic output; audio generation and planning alone do not certify style.

## Intake, planning, assembly

```sh
python motion_manga.py crop examples/harbor/crops.json
python motion_manga.py validate examples/harbor/project.json --allow-missing-generated-assets
python motion_manga.py plan examples/harbor/project.json
# Review the NEW project-planned.json; transfer/revise effect and score timing intentionally.
python motion_manga.py validate PROJECT.json
python motion_manga.py mix PROJECT.json
python motion_manga.py render PROJECT.json --mode both
python motion_manga.py verify PROJECT.json
python motion_manga.py package PROJECT.json
```

The shipped crop images and audio already exist; the first crop command is for a fresh copy with outputs removed/preserved elsewhere. Do not overwrite evidence. `--allow-missing-generated-assets` is only a schema/planning check, NOT an export or verification pass. Full validation/mix/render require actual audio and images. The mixer resamples inputs, never guesses missing voice data. `plan` is optional and overwrites neither the original manifest nor an existing planned manifest.

`render --mode film` or `card` can render only one variant, but **verify/package require both**. A failed render may leave an incomplete file; preserve or remove that known partial file intentionally before retrying. No automatic retry loop is used.

## Kokoro generation

Set the following variables to already installed, verified local resources; these are illustrative shell variables, not baked-in workspace locations:

```sh
KOKORO_PY=/path/to/kokoro-venv/bin/python
KOKORO_MODEL=/path/to/kokoro-v1.0.onnx
KOKORO_VOICES=/path/to/voices-v1.0.bin
"$KOKORO_PY" scripts/speech.py PROJECT.json --model "$KOKORO_MODEL" --voices "$KOKORO_VOICES" --validate-only
"$KOKORO_PY" scripts/speech.py PROJECT.json --model "$KOKORO_MODEL" --voices "$KOKORO_VOICES"
```

The voices file is verified NPZ data loaded with `allow_pickle=False`, despite the upstream `.bin` filename. Existing WAV outputs are refused. The exact model hashes and versions are in `references/models.md`. The wrapper is equivalent when invoked under the Kokoro Python: `"$KOKORO_PY" motion_manga.py speech PROJECT.json -- --model ... --voices ...`.

## Stable Audio generation

```sh
LITERT_PY=/path/to/litert-venv/bin/python
SA_RUNTIME=/path/to/verified-stable-audio-runtime
python scripts/generate_audio.py AUDIO_PLAN.json --runtime-root "$SA_RUNTIME" --python "$LITERT_PY" --validate-only
python scripts/generate_audio.py AUDIO_PLAN.json --runtime-root "$SA_RUNTIME" --python "$LITERT_PY"
```

`SA_RUNTIME` contains `scripts/sa3_tflite.py` and the pinned `models/` layout. The wrapper is `python motion_manga.py generate-audio AUDIO_PLAN.json -- --runtime-root ... --python ...`. Each batch is serial and bounded; no hosted fallback, no token acquisition or automatic downloads. Runtime receipts describe exact models, prompts, seeds, timing and accepted file hashes.

The neutral fixture was generated from `examples/harbor/speech-jobs.json` and `audio-jobs.json`. Speech-generation starts in its jobs record are historical inputs only; **project.json is the final timing authority**. Its gate source transient was measured at1.19s and placed at5.2s, so source playback begins4.01s.

## Rebuild the included demo

Copy the demo directory to a new working location. Preserve or move its `out` and `delivery` directories, then run mix/render/verify/package with that copy's project.json. Do not regenerate source audio unless desired; original WAVs reproduce the edit without loading models. FFmpeg and floating-point implementation changes may change byte hashes without changing the story; verification always uses the current explicit sources.

Run `python -m unittest discover -s tests -v` for behavioral failure tests. Reports do not certify an auditory audition. View encoded frames and listen when available; if unavailable, state the limit rather than setting review flags true.
