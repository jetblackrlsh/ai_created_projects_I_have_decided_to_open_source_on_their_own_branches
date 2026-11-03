# Third-Party Notices

This package (code, skill instructions, and documentation) is released under **CC0 1.0 Universal** (see [LICENSE](./LICENSE)). The third-party components and models below are **not** covered by that dedication; each remains under its own license terms. No model weights are redistributed in this repository.

## 1. Stable Audio 3 Models (`sm-music` & `sm-sfx`)
- **Publisher**: Stability AI (`stabilityai/stable-audio-3-optimized` on Hugging Face).
- **License**: **Stability AI Community License** (and **Gemma Terms of Use** for the `t5gemma` text encoder).
- **Reference Runtime**: `github.com/Stability-AI/stable-audio-3` (`optimized/tflite`), cloned separately into your local cache during setup (`scripts/download_models.py`).
- **Generated Audio**: Under the Stability AI Community License, users own their generated outputs to the extent permitted by law, subject to the license terms.

## 2. Kokoro TTS (`kokoro-v1.0.onnx` & `voices-v1.0.bin`)
- **Kokoro-82M Model**: Apache License 2.0.
- **`kokoro-onnx` Python Runtime**: MIT License.
- Model and voice weights are downloaded locally by `scripts/download_models.py` and are not bundled in this repository.

## 3. LiteRT (`ai-edge-litert`)
- **Publisher**: Google (`ai-edge-litert` Python wheel with XNNPACK delegate).
- **License**: Apache License 2.0.

## 4. Node.js & Python Libraries
- **`@napi-rs/canvas`**: MIT License (used for deterministic 24 fps 1080p headless frame rendering).
- **`numpy` / `scipy` / `soundfile` / `Pillow` / `sentencepiece` / `huggingface_hub`**: BSD / LGPL / HPND / Apache-2.0 licenses respectively.

## 5. FFmpeg
- Used for audio resampling, sidechain ducking verification, and H.264/AAC MP4 encoding. Licensed under LGPL/GPL depending on build configuration (see https://ffmpeg.org).
