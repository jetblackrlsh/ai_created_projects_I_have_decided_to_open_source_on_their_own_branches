# Third-party notices

The toolkit's original orchestration, renderer, examples and documentation are contributed under CC0. Existing original audio helpers were adapted from the author's motion-comic/video toolkit. This grant does not relicense external dependencies or confer rights in user-supplied assets.

No third-party runtime source, fonts, model weights or voice files are distributed in this package. Setup instructions/manifests reference separately downloaded components:

- Kokoro and Kokoro ONNX: https://github.com/hexgrad/kokoro and https://github.com/thewh1teagle/kokoro-onnx . Consult the exact downloaded releases/model cards and their licenses.
- Stable Audio 3 / Small optimized music and SFX: https://github.com/Stability-AI/stable-audio-3 and https://huggingface.co/stabilityai/stable-audio-3-optimized . Their code/model terms apply, including any usage restrictions. CC0 here does not make these models public domain.
- Python packages listed in `skill/requirements.txt` and pinned `skill/references/audio-runtime-requirements.txt` retain their upstream terms (including Pillow, NumPy, SciPy, SoundFile, ONNX Runtime and Kokoro dependencies).
- FFmpeg is an external system dependency, governed by its build's LGPL/GPL terms. DejaVu Sans is an external font dependency governed by the DejaVu font license.

Check applicable terms before downloading, using commercially or redistributing outputs or dependencies. The skill does not authorize accepting new legal agreements on someone else's behalf.
