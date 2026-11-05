# Runtime setup

The skill package does not include model weights, a model downloader or the Stable Audio runtime. Installation of the skill does not mean these large dependencies are provisioned.

## Python and media dependencies

Use Python 3.10+ in an isolated environment. Install `requirements.txt` from standard package registries and provide FFmpeg/ffprobe on PATH. Kokoro may additionally require the platform's eSpeak NG library. Use official vendor sources and verify current model licenses before downloading or accepting any terms. Do not use paid APIs or personal computers implicitly.

## Kokoro

The `kokoro-onnx` runtime expects this cache layout (override with `--cache-dir`):

```
~/.cache/story-animation-models/kokoro/kokoro-v1.0.onnx
~/.cache/story-animation-models/kokoro/voices-v1.0.bin
```

Use the official `thewh1teagle/kokoro-onnx` project distribution and its documented model sources. Do not substitute renamed incompatible model files. The scripts run inference offline after models are provisioned.

## Stable Audio

Use the official Stability AI `stable-audio-3` optimized LiteRT runtime, with the `stabilityai/stable-audio-3-optimized` model distribution. Follow that runtime's current installation, model-cache and license instructions; this skill does not redistribute or relicense it.

Default runtime script location:

```
~/.cache/story-animation-models/stable-audio-3/optimized/tflite/scripts/sa3_tflite.py
```

The audio script passes `--dit sa3-sm-music` or `sa3-sm-sfx`, `--decoder same-s`, `--dit-precision w8a8`, `--decoder-precision w8a8`, and prompt/seconds/steps/seed/cfg/threads/out arguments. Its runtime environment must have the compatible model caches, including text encoder dependencies, available offline. Check the official runtime's `--help` before a production run; upstream compatibility can change.

Pass `--sa3-python /path/to/python` and `--sa3-script /path/to/sa3_tflite.py` when installed elsewhere. The current Python interpreter is used by default. Missing models or incompatible upstream flags are setup blockers, not permission to silently substitute other audio systems.

## Images and fonts

Use your assistant's supported image-generation and image-viewing tools; no `invoke_subagent` API is required. Image queue entries specify the prompts and target filenames. Supply images before `--mode finalize`.

Install a licensed DejaVu font on Linux, use supported Windows system fonts, or set `VN_FONT_PATH` to a local TrueType font. Font files are not bundled.
