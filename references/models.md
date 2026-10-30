# Pinned local model route

Contents: safety/setup; image runtime and adapter; Stable Audio3; Kokoro; optional Whisper/U²-Netp.

## Safety and setup gate

Reuse already verified local runtimes first. This skill includes no weights or automatic installer. Before first setup, disclose disk/memory/network needs and model terms; obtain any required permission for downloads, new license acceptance, credentials, paid APIs or personal-computer use. Never treat private benchmark approval as blanket commercial/public redistribution approval. Use an isolated Python environment, trusted package indexes and pinned reviewed source; do not use curl-to-shell, remote-code trust flags or unrestricted pickle/Torch loading. Run heavy inference serially with a wall timeout and RSS monitor; use `python SKILL/scripts/run_bounded.py --report RUN/job.json --seconds 600 --rss-mib 4500 -- COMMAND ARGS...`. It samples the Linux process group, terminates on limits, saves logs/metrics, and is advisory rather than a kernel hard cap; abort before memory exhaustion. No cloud browser is required.

Use `models-manifest.json` for exact revisions, byte sizes and SHA-256 values. For Hugging Face files, form `REPOSITORY/resolve/REVISION/SOURCE`; retain the directory structure. Verify size and SHA-256 before loading, including locally cached files. Preserve a per-production manifest with hashes, prompts, seeds, runtime/dependency versions, timings, rejected attempts and actual device. No weights or runtime binaries belong in exported skill/process bundles. Sources/format restrictions reduce specific risks, not absolute safety guarantees.

## Images: SDXS-DreamShaper + official anime adapter

- Runtime: https://github.com/leejet/stable-diffusion.cpp at `e239e4b0fd3de49834cec67031a44796ca465abc`.
- Build CPU Release with `GGML_LLAMAFILE=ON`, `GGML_NATIVE=ON`, `GGML_OPENMP=ON`; use two compile jobs. Adapt compiler CPU flags to host, not copied binary assumptions. The standard build produces `build/bin/sd-cli`; the tested optimized copy was named `llamafile-sd-cli`.
- Official base: https://huggingface.co/IDKiro/sdxs-512-dreamshaper at `76f720262bb051da75666b22c902a78c8e16c763` (~1.77 GB selected data). Use listed model_index, scheduler/text_encoder/unet/vae configs and weights.
- Official adapter: https://huggingface.co/IDKiro/SDXS-512-DreamShaper-Anime at `2faf8a65496cf66f3927ec48ae0f2ba7dd943e39`. Do NOT load its original pickle directly.

After explicitly provisioning the pinned source and its pinned submodules, build locally (do not execute an unreviewed install script):

```sh
cmake -S "$SD_SOURCE" -B "$SD_BUILD" -DCMAKE_BUILD_TYPE=Release \
 -DSD_WEBP=OFF -DSD_WEBM=OFF -DSD_BUILD_EXAMPLES=ON -DSD_BUILD_SHARED_LIBS=OFF \
 -DGGML_LLAMAFILE=ON -DGGML_NATIVE=ON -DGGML_OPENMP=ON \
 -DGGML_CUDA=OFF -DGGML_METAL=OFF -DGGML_VULKAN=OFF
cmake --build "$SD_BUILD" --target sd-cli -j2
```

Convert only the exact pinned adapter:

```sh
python "$SKILL/scripts/convert_anime_adapter.py" "$SOURCE/adapter_model.bin" "$LORA/anime.safetensors" "$RUN/adapter-conversion.json"
```

The helper checks the exact 108,366,210-byte SHA-256 before parsing, interprets only a bounded symbolic protocol-2 subset, never invokes file-specified globals, and rejects unknown opcodes, types, offsets, noncontiguous layouts and nonfinite arrays. It emits 222 tensors; rank64/alpha8 means **0.125 is already baked into B matrices**. Use runtime adapter strength1, not0.125 again. Expected converted SHA-256: `6ab30c9665f5aa7dc6f4be15e6f3874dfdf7fb3b011fdbf5658db24efb7b9956`. This is deliberately not a general pickle converter; a changed upstream file requires new review, not relaxing the hash.

```sh
"$SD_CLI" -m "$BASE" --taesd "$BASE/vae/diffusion_pytorch_model.safetensors" \
  --tensor-type-rules '^tae\.=f32' --lora-model-dir "$LORA" \
  -p 'anime illustration, one clearly posed character, scene-specific details, no lettering<lora:anime:1>' \
  -o "$RUN/shot-01.png" --seed 2100 --steps 1 --cfg-scale 1 \
  --sampling-method euler --scheduler discrete --width 512 --height 512 \
  --threads 8 --type q8_0
```

The explicit tiny-decoder `--taesd` matters. Use a separate prompt/seed/output for every shot. Read logs to verify all222 LoRA tensors applied; do not silently fall back to base. Single-character coverage/cuts are more reliable than intricate multi-character combat, but anatomical/weapon continuity is still imperfect. On one CPU host, DreamShaper fresh-process median3.52s; anime mean~4.14s in matched tests, production~4.54s. Not a speed guarantee or proof anime improves action accuracy. Benchmark whole process, RSS, attempts and usable-image ratings on each new host.

Licenses: SDXS/adapter metadata uses OpenRAIL++; DreamShaper upstream has OpenRAIL-M conditions. Read all relevant model cards/terms; not CC0 and not an unrestricted redistribution grant. Runtime license is separate from model/output rights.

## Audio: Stable Audio3 Small

- Source: https://github.com/Stability-AI/stable-audio-3 at `5f5e6ac21ae9ff78a6e8847eb7a1dcbe969ffb84`.
- Models: https://huggingface.co/stabilityai/stable-audio-3-optimized at `30cb2644da54bfa63275d1bc7f1fa67fc718680f`.
- Python3.12 tested, `ai-edge-litert==2.2.0`, `numpy==2.2.6`, `sentencepiece==0.2.1`, `soundfile==0.13.1`, `huggingface-hub==0.35.3`. Resolve/install binary wheels in isolation; save a complete platform-specific dependency lock. Do not blindly reuse a foreign-platform environment.
- Four selected TFLite graphs total **1,736,611,344 bytes**: music DiT, SFX DiT, common T5Gemma encoder, SAME-S decoder. Also use source-pinned bundled `models/tokenizer.model`, SHA-256 `61a7b147390c64585d6c3543dd6fc636906c9af3865a5548f27f31aee1d4c8e2` (4,241,003 bytes). Audio-to-audio encoder is unnecessary.
- Place each graph at its listed relative path beneath runtime `models/`. Ensure files exist before inference so the runtime downloader is not invoked. Set `HF_HUB_OFFLINE=1 HF_HUB_DISABLE_IMPLICIT_TOKEN=1`. Avoid `--play`/Gradio and any LoRA code path.

```sh
HF_HUB_OFFLINE=1 HF_HUB_DISABLE_IMPLICIT_TOKEN=1 "$AUDIO_PY" "$SA3/scripts/sa3_tflite.py" \
 --prompt 'Instrumental cinematic scene score, restrained, no vocals' \
 --dit sm-music --decoder same-s --dit-precision w8a8 --decoder-precision w8a8 \
 --seconds 34 --steps 8 --seed 1030 --cfg 1 --threads 4 --out "$RUN/music.wav"
# SFX: change --dit to sm-sfx, use a specific action/material prompt, ~3 seconds,
# distinct seeds/sources for meaningfully different attacks and impacts.
```

Output is44.1kHz stereo; resample PCM once to canonical48kHz before mixing. Measured example34s music16.26s/1.86GiB;3s effect7.02s/1.99GiB, not guarantees. Effects may be quiet or imperfect: inspect/listen, select transient offsets, gain each event, preserve meaningful attacks/tails, duck music rather than bury effects. Publisher optimized checkpoints are experimental. **Stability Community and Gemma terms apply**; commercial registration/revenue/attribution conditions need review. Setup is not implied license acceptance.

## Speech: Kokoro stock voices

`kokoro-onnx==0.6.1`, Python3.12 CPU tested. Explicit upstream release model-files-v1.0 files/hashes appear in the manifest (~354MB). Both must pass hash/size checks before synthesis. The voices `.bin` contains NumPy data, not an invitation to unpickle arbitrary files; use only pinned upstream data and reviewed runtime. No real-person cloning. Keep a narrator and distinct stable stock ID for every speaking role; e.g. af_heart, am_adam, bm_george, af_bella. Validate voice availability. Stock af_bella is not a real child's performance. Engine outputs24kHz mono; resample before canonical placement, use measured sample durations, never accelerate dialogue to fit.

Bundled synthesis: `TTS_PY SKILL/scripts/kokoro_speech.py --model MODEL --voices VOICES --voice af_heart --text-file LINE.txt --output LINE.wav`. It verifies pinned files, uses CPU-only inference with two threads, disables telemetry, refuses overwrite, and writes sample-count provenance without downloads.

Minimal tested API after offline provisioning: `from kokoro_onnx import Kokoro`; construct `Kokoro(model_path, voices_path)`; call `samples, rate = kokoro.create(text, voice=voice_id, speed=1.0, lang='en-us')`. Save PCM WAV plus text/voice/settings/hash/sample-count provenance. Missing models/voices are a blocker, not permission for silent fallback.

Kokoro weights/voices Apache2.0; kokoro-onnx MIT; phonemizer GPL3 and espeak-ng GPL3-or-later, loader wrapper MIT. Respect each component's notices when distributing. No startup or synthesis downloads should occur.

## Optional utilities, not default requirements

Whisper.cpp https://github.com/ggml-org/whisper.cpp v1.8.2 commit `4979e04f5dcaccb36057e059bbaed8a2f5288315`, CPU build with two compile jobs and curl disabled. `base.en` model URL/hash in manifest (147,964,211bytes). Runtime/model MIT. Convert isolated narration to16kHz mono then run:

```sh
ffmpeg -i narration.wav -ar 16000 -ac 1 -c:a pcm_s16le narration-16k.wav
"$WHISPER_CLI" -m "$WHISPER_MODEL" -f narration-16k.wav -t 2 -l en -oj -osrt -of "$RUN/asr"
```

ASR checks words, not definitive sync. Segment timestamps drifted even when transcript was right; use source PCM anchors/timeline for captions and final sync.

U²-Netp is optional cutout only: official rembg lightweight ONNX URL/hash in manifest,4,574,861bytes; original U-2-Net Apache2.0, rembg2.0.67 MIT. Use explicit CPUExecutionProvider/two threads and local model; no default BRIA checkpoint or automatic download. Inspect masks for lost fine details. Avoid installing its larger dependency stack unless a cutout is actually useful; ASCII films normally need no segmentation.
