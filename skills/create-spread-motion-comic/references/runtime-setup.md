# Runtime setup

## Contents
- Check and restore
- Production paths
- Safety and failure handling
- Versions and validation
- Other dependencies

## Check and restore

Use the bundled `scripts/setup_audio_runtime.py` before audio production. The pinned recipe is tested on **Linux x86_64 with Python 3.12** and CPU inference. It does not support other platforms by silently switching computers or changing versions. Production scripts may support other Python versions, but this reproducible setup recipe is narrower.

Resolve `<skill-root>` to this skill directory and `<runtime-root>` to a dedicated writable directory in the authorized cloud workspace. The runtime requires about 2 GB of model weights, plus packages, source, temporary downloads and inference caches; allow at least 5 GB of free space. Supply `git` and `curl`. No weights or third-party runtime source are bundled in the skill.

Run the default check first. It hashes the six required weights and tokenizer, checks pinned packages with `pip check`, and verifies the official runtime commit and model layout. It does not download or repair anything. Omit `--report` for a check with no intentional output writes.

```sh
python3.12 <skill-root>/scripts/setup_audio_runtime.py \
  --runtime-root <runtime-root> \
  --report <project-root>/audio-setup-check.json
```

When provisioning is authorized and the applicable source/model terms have already been checked, restore missing or invalid known dependencies and run fresh inference:

```sh
python3.12 <skill-root>/scripts/setup_audio_runtime.py \
  --runtime-root <runtime-root> --restore --test \
  --report <project-root>/audio-setup-report.json
```

On later runs, use `--test` without `--restore` to verify offline narration, Music and SFX inference again. Every test uses a new output directory; stale WAVs cannot make a failed run pass. Set `--test-output <directory>` to put test artifacts outside the runtime. Inference can create upstream compilation caches even without `--restore`.

Exit code 0 means the checked audio stack is ready and any requested smoke tests passed. A ready check with `inference.status = not_run` is **not** evidence of successful synthesis. Treat nonzero exit, any `errors`, or failed/missing tests as blockers. Inspect the report and per-engine smoke logs before production. The report lists changed items; a repeated restore against a healthy stack should have an empty `changes` list and perform no downloads.

## Production paths

The setup uses the following local layout, compatible with the existing skill flags:

- Python: `<runtime-root>/venv/bin/python`
- Kokoro cache: `<runtime-root>/cache`, containing `kokoro/kokoro-v1.0.onnx` and `kokoro/voices-v1.0.bin`
- Stable Audio CLI: `<runtime-root>/stable-audio-3/optimized/tflite/scripts/sa3_tflite.py`
- Stable models: the runtime's `optimized/tflite/models/<family>` with internal `models/tflite/<family>` aliases

Use the isolated Python to run `kokoro_tts_vn.py`, passing `--cache-dir <runtime-root>/cache`. Run `sa3_vn_audio.py` with `--sa3-python <runtime-root>/venv/bin/python` and `--sa3-script <runtime-root>/stable-audio-3/optimized/tflite/scripts/sa3_tflite.py`. Keep `HF_HUB_OFFLINE=1` and `HF_HUB_DISABLE_IMPLICIT_TOKEN=1` during production inference. Keep Kokoro speed fixed at 1.0.

The stable runtime uses `sm-music` and `sm-sfx`, decoder `same-s`, and `w8a8` precision. Do not invoke upstream interactive auto-installers or substitute a different model/API when a check fails.

## Safety and failure handling

- Follow the current user permissions and confirmation policy. A CLI flag is not user consent. Check the selected executor before running; a connected personal computer or failed cloud setup does not itself authorize switching there.
- Use only the manifest's official Kokoro release, official Stability AI source and model repository, and the standard PyPI registry. The script does not use paid APIs, saved tokens, account creation, login, new credentials, or interactive license acceptance. It strips common authentication environment variables and disables implicit Hugging Face tokens.
- Check applicable licenses before provisioning or distribution: [Kokoro ONNX](https://github.com/thewh1teagle/kokoro-onnx), [Stable Audio source](https://github.com/Stability-AI/stable-audio-3), [optimized model card](https://huggingface.co/stabilityai/stable-audio-3-optimized), and [Stability AI license](https://stability.ai/license). This skill does not grant rights to model weights or outputs. If access introduces new terms, a gate, credentials, payment, or an unrecognized source, stop and obtain the needed approval instead of bypassing it.
- Downloads are anonymous HTTPS with bounded retries, SHA-256/size checks and atomic replacement. A bad download leaves the original file untouched. An invalid old weight is retained with an `.invalid-*` suffix after a verified replacement. Do not delete retained files without authorization.
- Healthy files are reused, not downloaded again. No personal story text is sent to download hosts. Smoke prompts are generic and inference is local/offline.
- Restore missing tracked source files only from the pinned commit. Preserve modified/staged source, foreign repositories, unexpected paths and external symlinks, and report them instead of overwriting. Use a new dedicated root when appropriate. Do not repair an active production runtime concurrently.
- Official downloads can show no output for 45–60 seconds. Defaults allow 900 seconds per download and 300 seconds per engine; do not declare failure merely because a quiet download has not printed progress. Timeouts remain bounded. Do not change proxies, network controls, TLS verification or permissions to bypass restrictions.
- Setup is serialized with a local lock. A killed process releases the lock automatically. Partial download files are never accepted as models; subsequent checks rehash final files.

## Versions and validation

`audio-runtime-manifest.json` pins the official source commit, Hugging Face model revision, six model sizes/hashes and tokenizer hash. `audio-runtime-requirements.txt` pins the validated CPU dependency set, including Kokoro ONNX 0.6.1, ONNX Runtime 1.31.1, LiteRT 2.2.0 and NumPy 2.2.6. Installation is isolated and binary-wheel-only; an unavailable wheel is a blocker, not permission to compile or fetch from an unknown mirror.

`smoke_audio_runtime.py` generates one Kokoro line at 24 kHz mono and short Small Music/SFX clips at 44.1 kHz stereo. It checks finite, nonempty, non-silent signals, expected rates/channels/durations and output hashes. These are functional tests, **not** direct listening or approval of musical quality, intelligibility, comfort or final mix. Perform the skill's production audio QA separately.

Run `python3.12 -m unittest discover -s <skill-root>/tests -p test_audio_setup.py -v` for setup regression tests. Use real `--test` runs for end-to-end validation; mocks do not prove model inference or network access.

## Other dependencies

Provide FFmpeg/ffprobe on PATH for video production. Setup reports them but does not install OS packages. Image generation and viewing remain host-tool steps. Install licensed DejaVu fonts on Linux, use supported system fonts elsewhere, or set `VN_FONT_PATH` to a local licensed TrueType font. No fonts are bundled.
