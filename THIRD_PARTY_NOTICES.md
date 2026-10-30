# Third-party notices

This package (code + documentation) is released under CC0 1.0. The
components below are **not** covered by that dedication; each remains
under its own terms. Nothing in this package redistributes model weights.

## Stable Audio 3 models (Small-Music, Small-SFX)

- Publisher: Stability AI. Distributed via the official Hugging Face
  collection `stabilityai/stable-audio-3-optimized` (public, ungated) and
  the gated repos `stabilityai/stable-audio-3-small-music` /
  `stable-audio-3-small-sfx`.
- License: **Stability AI Community License** (free use, including
  commercial use, under the license's revenue threshold; see the
  `LICENSE.md` shipped in those repos). The T5Gemma text encoder is
  additionally subject to the **Gemma Terms of Use** (`LICENSE_GEMMA.md`
  in the same repos), including its use restrictions.
- The publisher describes the optimized collection as experimental.
- Outputs: per the Community License, users own their generated outputs
  to the extent permitted by law, subject to the license terms. Review
  the licenses before your intended use; code publication in this repo
  does not clear any particular use.

## Stable Audio 3 reference runtime

- `github.com/Stability-AI/stable-audio-3` (the `optimized/tflite`
  runtime this workflow drives). See that repository's own license and
  notices. This package does not vendor the runtime; it is cloned
  separately during setup.

## Kokoro TTS

- Kokoro-82M model: Apache License 2.0 (see the Kokoro project).
- `kokoro-onnx` runtime: MIT License.
- Voice files are distributed with the Kokoro project and are not
  included here.

## LiteRT / ai-edge-litert

- Google's LiteRT runtime (`ai_edge_litert` wheel, XNNPACK delegate):
  Apache License 2.0. See the LiteRT project for full notices.

## Fonts

- DejaVu Sans Mono Bold, the reference ASCII render font: DejaVu Fonts
  License (public-domain-style, permissive). Any bold monospace font can
  be substituted.

## FFmpeg

- Used for resampling, mixing filters and encoding. FFmpeg is licensed
  under LGPL/GPL depending on build configuration; see ffmpeg.org.

## Python libraries

- numpy (BSD), soundfile / libsndfile (BSD / LGPL), Pillow (HPND-style
  permissive), sentencepiece (Apache-2.0), huggingface_hub (Apache-2.0).
  See each project's license file.
