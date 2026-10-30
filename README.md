# ASCII Film Maker

A skill + toolchain for producing complete **animated ASCII films** on a
plain CPU machine: detailed color ASCII video converted from shaded raster
art, an **audio-first script**, **Kokoro TTS voices**, and a **fully
generated soundtrack** — Stable Audio 3 Small-Music for the score,
Small-SFX for the effects — mixed and encoded locally. No browser, no
cloud rendering, no per-generation fees.

The reference production is an original 213-second samurai story
(2,556 frames at 1848×1040, 12 fps): a father duels the oathbound
gatekeeper who was once his friend, and wins by cutting the man's
oath-cord instead of his throat. Its soundtrack — three score cues and
twenty effects clips — was generated end-to-end by the models in
`references/models-manifest.json`.

## Why it works

- **Converted, not glyph-drawn.** Characters are drawn as shaded raster
  art by a code pose rig and converted frame-by-frame to color ASCII
  (density + per-cell color). Glyph-drawn figures read as stick figures;
  converted art keeps silhouette, shading and costume.
- **Audio-first.** The narration describes every action and introduces
  each speaker storybook-style; characters speak in their own voices.
  The film is fully understandable with your eyes closed.
- **Generated sound, scored to the timeline.** Music cues follow story
  beats; effects sit on an event score keyed to the narration; the mix
  ducks music under speech in staged FFmpeg passes and is verified by
  cross-correlation, not just levels.

## Quickstart

```bash
# 1. Stable Audio 3 LiteRT runtime + weights (~1.74 GB, hash-verified)
git clone https://github.com/Stability-AI/stable-audio-3
cd stable-audio-3/optimized/tflite
python3 -m venv .venv
.venv/bin/pip install "ai_edge_litert>=2.2.0" "numpy>=1.24" \
    "sentencepiece>=0.2" "soundfile>=0.12" "huggingface_hub>=0.20"
python3 /path/to/ascii-film-maker/scripts/download_sa3.py "$PWD"

# 2. Film pipeline tools
pip install -r requirements.txt   # numpy, soundfile, Pillow (+ kokoro-onnx for TTS)

# 3. Voices (line list -> measured WAVs)
python3 scripts/kokoro_speech.py --model kokoro-v1.0.onnx \
    --voices voices-v1.0.bin --lines lines.json --out audio/

# 4. Soundtrack (clips JSON -> WAVs)
python3 scripts/sa3_generate.py --runtime "$PWD" \
    --clips clips.json --out sa3_clips/

# 5. Frames (raster scenes -> ASCII frames)
python3 scripts/ascii_convert.py frames_raster/ frames_ascii/

# 6. Mix + encode
python3 scripts/mix_audio.py --voice audio/voice.wav --music music.json \
    --sfx sfx.json --duration 213 --out audio/final_mix.wav
ffmpeg -framerate 12 -i frames_ascii/frame_%04d.png -i audio/final_mix.wav \
    -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
    -c:a aac -b:a 192k -movflags +faststart -shortest film.mp4
```

`SKILL.md` is the full playbook; `references/production.md` is the
production checklist with every verification step.

## Layout

```
SKILL.md                  the skill (workflow, rules, pitfalls)
scripts/
  download_sa3.py         pinned, hash-verified SA3 weight downloads
  sa3_generate.py         batch music/SFX generation (LiteRT runtime)
  kokoro_speech.py        line-list TTS + measured durations
  ascii_convert.py        shaded raster -> color ASCII converter
  mix_audio.py            stem assembly + staged ducking mix
references/
  models.md               model facts, routes, measured performance
  models-manifest.json    exact files, sizes, SHA-256, revision
  production.md           the production playbook
  visuals.md              pose-rig + conversion notes
tests/
  smoke_fixture.py        dependency-light end-to-end fixture check
```

## Honest limits

- Timings in the docs are measurements from a 2 vCPU / ~7 GB RAM machine
  (and an independent 9 vCPU report), not guarantees.
- The Stable Audio 3 optimized collection is an experimental publisher
  release; the w8a8 models are the shipped default and sound right, but
  generation quality varies per seed — every clip is level-scanned before
  mixing, and bad generations are re-rolled with a new seed.
- This package contains no model weights, no generated media, and no
  private data. Generated outputs are yours to evaluate under the model
  licenses (see THIRD_PARTY_NOTICES.md).

## License

Code and documentation in this package are released under **CC0 1.0**
(see LICENSE). Model weights and third-party components remain under
their own terms (see THIRD_PARTY_NOTICES.md) — CC0 here covers this
package's own work only.

*Authored by Muse-Nova, an AI agent, at the direction of the repository
owner. The workflow was developed and validated on a real production;
the companion skill by the owner's other AI agent (a different ASCII
approach, image-conversion based) lives on the
`project/create-anime-ascii-story` branch of this repository.*
