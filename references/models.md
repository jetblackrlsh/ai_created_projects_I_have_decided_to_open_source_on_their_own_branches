# Models

## Stable Audio 3 — which distribution, and why

Stable Audio 3 (Stability AI, May 2026) is a family of latent-diffusion
audio models. The two small variants are single-purpose:

- **Small-SFX** — sound effects only.
- **Small-Music** — music only.
- Both: 459M-parameter DiT + SAME-S autoencoder, up to 120 s per generation,
  44.1 kHz stereo, 8-step ping-pong sampling.

They are distributed two ways:

| Route | Files | Runtime | Verdict |
| --- | --- | --- | --- |
| Gated HF repos (`stable-audio-3-small-sfx`, `-small-music`) | ~3.49 GB each, PyTorch safetensors + T5Gemma folder | PyTorch (torch 2.7.1) | Works, but heavy; download needs a license-gated account flow |
| **Optimized collection (`stable-audio-3-optimized`)** | **~1.74 GB total for both models** | **LiteRT (`ai_edge_litert`) + XNNPACK, no PyTorch** | **Use this one** |

The optimized collection is public and ungated; the models' licenses
(Stability AI Community License, plus Gemma Terms for the text encoder)
apply regardless of route. The optimized release is described by its
publisher as experimental.

### The four files (plus one optional)

See `models-manifest.json` for exact paths, sizes and SHA-256 hashes at the
pinned revision `30cb2644da54bfa63275d1bc7f1fa67fc718680f`:

- `sa3-sm-music/dit_w8a8.tflite` (539 MB)
- `sa3-sm-sfx/dit_w8a8.tflite` (539 MB)
- `same-s/dec_w8a8.tflite` (94 MB, shared decoder)
- `t5gemma/encoder_fp16.tflite` (564 MB, shared text encoder)
- optional: `same-s/enc_w8a8.tflite` (66 MB; audio-to-audio/inpainting only)

Download with `scripts/download_sa3.py` (direct HTTPS, hash-verified).
**Practical warning:** the Hugging Face Hub/Xet download path stalled at
0 bytes in the reference environment; the direct route fetched everything
in minutes. If a download stalls, change route — don't wait it out.

### Runtime setup

```bash
git clone https://github.com/Stability-AI/stable-audio-3
cd stable-audio-3/optimized/tflite
python3 -m venv .venv
.venv/bin/pip install "ai_edge_litert>=2.2.0" "numpy>=1.24" \
    "sentencepiece>=0.2" "soundfile>=0.12" "huggingface_hub>=0.20"
python3 /path/to/download_sa3.py "$PWD"
```

Weights live under `models/tflite/...` inside that directory; the runtime
finds them there and skips its own downloader. Run with
`HF_HUB_OFFLINE=1` to guarantee no network calls.

### Generation settings used in production

```
--dit sm-music|sm-sfx --decoder same-s
--dit-precision w8a8 --decoder-precision w8a8
--steps 8 --cfg 1 --threads <vCPUs> --seed <fixed per clip>
```

- The w8a8 rung DiTs hold ~0.8 GB RAM flat at any length and are the shipped
  default; int8 changes *which* sample you get, not (audibly) its quality.
- Prompts on this runtime are **plain descriptions**. (The `TrackType: SFX,`
  / `TrackType: Music, VocalType: Instrumental,` prefixes belong to the
  PyTorch distribution's prompting convention.) For score cues, descriptive
  prompts naming instrumentation + mood + dramatic function, ending in
  `instrumental, no vocals`, worked reliably.
- Fixed seeds make a soundtrack reproducible; vary the seed when a clip
  comes back wrong rather than re-rolling blindly.

### Measured performance (reference machine: 2 vCPU, ~7 GB RAM)

- Cold start (first ever run, XNNPACK cache build): 2 s effect ≈ 23 s.
- Warm: short effects ≈ 5 s each; 64 s music cue ≈ 29 s; 100 s cue ≈ 43 s.
- A 20-clip soundtrack (3 cues + 17 effects) generated in ≈ 3.5 minutes.
- On a 9-vCPU machine the same runtime produced 34 s of music in ≈ 16 s
  and a 3 s effect in ≈ 7 s (independent report).

Audio quality varies per generation — **scan every clip's peak and RMS**
before mixing (production clips ranged from peak 0.10 to 0.98) and set
mix gains from the measurements.

## Kokoro TTS

Kokoro-82M via `kokoro-onnx`. Voices used in the reference production:
narrator `af_heart`, father `am_michael`, gatekeeper `bm_george` at speed
0.95. Voice files are a separate download from the Kokoro project; the
model is Apache-2.0 licensed (see THIRD_PARTY_NOTICES.md).

Speech is fast (seconds per line) and its measured durations define the
film's canonical timeline.
