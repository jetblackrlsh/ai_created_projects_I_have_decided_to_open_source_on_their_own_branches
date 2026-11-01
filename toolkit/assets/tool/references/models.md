# Optional local audio models

These adapters use **existing, explicitly configured installations only**. Neither adapter downloads models, installs packages, signs in, creates credentials, accepts a new click-through agreement, starts a server, or substitutes a different provider. A missing runtime, changed pinned file, unknown voice, invalid job, existing output or invalid audio is a hard failure. Review logs and reconcile partial outputs; never silently regenerate over a previous artifact.

Run heavy model inference serially on limited-memory hosts. CPU limits are fixed at four threads for Stable Audio and two for Kokoro. Use the host's resource monitor; runtime duration guards do not themselves cap memory. `--validate-only` checks inputs, hashes and versions without inference. It still reads local models and imports ordinary numerical packages. `--only ID...` selects a bounded fresh smoke test; the complete plan is validated first. Relative output WAV paths must stay inside the plan/project directory.

## Stable Audio 3 Small

Official source: https://github.com/Stability-AI/stable-audio-3

Pinned source revision: `5f5e6ac21ae9ff78a6e8847eb7a1dcbe969ffb84`. The adapter verifies SHA256 for the eleven reviewed runtime/tokenizer files before launching the official CLI.

Official optimized data-only TFLite models: https://huggingface.co/stabilityai/stable-audio-3-optimized

Pinned model revision: `30cb2644da54bfa63275d1bc7f1fa67fc718680f`.

- Small music DiT w8a8: SHA256 `1d8ef99bf10f51cc52b68f7b527d3773828e700758b253edd8a8e088a906e241`
- Small SFX DiT w8a8: SHA256 `d3f99409f446eff9a625768ba2ee09a2347ea90c4897c1662fbcd8837fae3045`
- SAME-S decoder w8a8: SHA256 `2fc31cdc42a54342233fb8c6da636565b1191d97002665e21812e981490434a6`
- T5Gemma encoder fp16: SHA256 `8530d0b3e6b9b9dcf1239145c2a853fb749708eaddbb472ff8f0802b50059372`

Both models plus shared components total1,736,611,344bytes. Dependencies and XNNPACK caches require additional disk. Runtime tested with LiteRT2.2.0, NumPy2.2.6, SentencePiece0.2.1 and SoundFile0.13.1; receipts record actual versions. Explicit w8a8, SAME-S,8steps, CFG1, CPU4threads. Private evaluation generated up to101seconds per clip; public maximum for these small models is120seconds. These optimized publisher checkpoints are experimental, not guaranteed reliable on every CPU.

Licenses: https://stability.ai/license and https://ai.google.dev/gemma/terms. Commercial registration, revenue eligibility, use restrictions and redistribution obligations must be reviewed for the intended use. This tool's license does not relicense model weights. Do not bundle them into an unrestricted project release.

Plan format: an object with `jobs`, each containing unique `id`, `kind` (`music` or `sfx`), `prompt`, finite positive `seconds` up to120, integer `seed`, and relative `output` WAV path. Optional `provider` must be `stable-audio-3-small`. Invoke `scripts/generate_audio.py PLAN --runtime-root DIRECTORY_CONTAINING_SCRIPTS_AND_MODELS --python EXISTING_VENV_PYTHON`. Optional `--receipt` saves the batch report; each generated WAV has its own `.receipt.json` and generation log. Input plan hash, model/runtime hashes, versions, exact command, duration and output hash are recorded. Receipts explicitly do not certify listening quality.

## Kokoro stock voices

Runtime: https://github.com/thewh1teagle/kokoro-onnx ; tested package0.6.1. Model family: https://huggingface.co/hexgrad/Kokoro-82M . Model releasev1.0 uses data-only ONNX and NPZ voice archive; voice archive is opened with `allow_pickle=False`.

- `kokoro-v1.0.onnx`,325,532,387bytes, SHA256 `7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5`
- `voices-v1.0.bin`,28,214,398bytes, SHA256 `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d`

Use an existing Kokoro venv to run `scripts/speech.py PROJECT --model ONNX --voices VOICE_ARCHIVE`. Manifest `cast` maps speakers to stock voice IDs or objects with a `voice` property; each `speech` entry has `id`, `file`, `text`, `speaker`, `voice`, and optional nonnegative `start`. An explicit line voice must match the cast. Optional provider must be `kokoro-onnx`. No voice cloning or narrator substitution.

Finite nonzero synthesis is required. If float output exceeds PCM range, deterministic linear attenuation preserves timing and avoids hard clipping; original peak and gain are disclosed in the receipt. Empty/nonfinite audio fails. Output is PCM16 with exact sample-count duration; intended start remains metadata for the timeline builder. Per-WAV receipts include text, speaker, voice, model hashes, versions, speed, language and output hash. Speech timing must still be validated against the final assembled video.

## Restore boundary

Restoration is a separate, explicit operation. Obtain permission where required, inspect official sources and applicable terms, pin versions and validate data-only weights before use. Prefer isolated binary-wheel installations from known package registries. Never run an unreviewed bootstrap script, enable arbitrary remote Python, load an untrusted pickle, or automatically acquire credentials. A workspace reset is not permission to use a personal computer. Hashes reduce tampering risk; they do not prove software is risk-free.
