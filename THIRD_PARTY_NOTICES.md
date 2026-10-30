# Third-party provenance and license scope

The bundled Python helpers, workflow text and synthetic fixture are original AI-assisted project contributions, developed from this project's tested implementation. No third-party runtime source, fonts, model tensors, production images/audio, datasets or private project history are included. Model identifiers, official source URLs and integrity hashes are retained as provenance facts, not redistributed model content.

The repository CC0 dedication applies only to rights in the original project contributions. It does not waive third-party rights or replace applicable notices, terms, patents, publicity/privacy rights or model-use restrictions. The platform-generated skill icon and platform metadata are omitted from this public package.

External dependencies used or described (obtain separately and preserve their own notices when redistributing):

| Component | Official source | License/conditions to review |
|---|---|---|
| Pillow | https://github.com/python-pillow/Pillow | HPND/Pillow license and bundled library notices |
| NumPy | https://github.com/numpy/numpy | BSD-3-Clause; binary distributions include additional notices |
| SciPy | https://github.com/scipy/scipy | BSD-3-Clause; binary distributions include additional notices |
| FFmpeg/ffprobe | https://ffmpeg.org/legal.html | LGPL/GPL depends on build; libx264-enabled builds have GPL implications |
| DejaVu fonts | https://dejavu-fonts.github.io/License.html | DejaVu/Bitstream Vera font terms; no font bundled |
| stable-diffusion.cpp | https://github.com/leejet/stable-diffusion.cpp | MIT runtime, separately licensed dependencies |
| SDXS-DreamShaper / Anime adapter | https://huggingface.co/IDKiro | Model-card OpenRAIL++ metadata plus upstream DreamShaper OpenRAIL-M conditions; verify full model chain |
| Stable Audio 3 runtime/checkpoints | https://github.com/Stability-AI/stable-audio-3 | Runtime and checkpoint terms are separate; Stability Community and Gemma conditions apply to described model route |
| Kokoro model/voices | https://huggingface.co/hexgrad/Kokoro-82M | Apache-2.0 model terms; verify selected release files |
| kokoro-onnx | https://github.com/thewh1teagle/kokoro-onnx | MIT wrapper; phonemizer/espeak-ng dependencies have GPL terms |
| ONNX Runtime | https://github.com/microsoft/onnxruntime | MIT and component notices |
| Whisper.cpp | https://github.com/ggml-org/whisper.cpp | MIT runtime; selected model terms separate |
| U²-Net / rembg | https://github.com/xuebinqin/U-2-Net and https://github.com/danielgatis/rembg | Apache-2.0 original model / MIT wrapper; optional, not bundled |

`references/models-manifest.json` records exact tested official artifacts; `references/models.md` records setup gates, tested versions and limitations. Pinning and hashes help provenance/integrity, not absolute safety or permission. Do not replace the strict pinned adapter converter with unrestricted pickle loading, and do not relax its hash to accept a different checkpoint without a new review.
