# WebGL & 2D Canvas Story Animator (`webgl-canvas-story-animator`)

An agent skill and complete offline toolchain for adapting narrative stories into high-clarity, fast-paced, kinetic **2D animations** rendered with custom **WebGL GLSL fragment/vertex shaders** and **5-layer 2D Canvas environments + 14-part/28-piece articulated character rigs**, complete with:

- **Pre-Adaptation Story Clarity Audits (`script/story_clarity_audit.md`)**: Diagnoses source-story ambiguities, causal leaps, and unexplained stakes before writing a single line, adding explicit clarifying bridges so viewers never get lost.
- **Zero-Repetition Screenplay Pacing**: Eliminates narrator-dialogue echoing (narration sets the physical stage and visual action; character dialogue delivers discoveries, motives, and plans in brisk chronological lockstep).
- **Implied-to-Direct Character Dialogue**: Converts narrative summaries of conversations into natural, in-character spoken exchanges.
- **Kokoro TTS Multi-Voice Acting (`kokoro-onnx`)**: Every speaking character and the Narrator receives a unique stock voice (`af_heart`, `am_adam`, `af_nicole`, `af_sky`, `bf_emma`, `bm_george`, `am_michael`, `bm_lewis`, `af_bella`), plus 20 Hz speech envelopes for real-time jaw/visor animation.
- **Eyes-Closed Descriptive Audio Accessibility**: Narration includes vivid descriptive audio cues so the animation works equally well watched on screen or listened to with eyes closed.
- **Stable Audio 3 Small-Music & Small-SFX (`ai-edge-litert`)**: Generates original multi-section musical scores and bespoke foley/SFX locally on CPU.
- **Verified Sidechain-Ducked Loudness Hierarchy**: Automatically mixes and verifies that **Dialogue & Narration (`-14.6 dBFS`)** and **SFX (`-21.1 dBFS` active RMS / `-4.3 dBFS` peak)** sit clearly above **Background Music (`-28.0 dBFS` ducked)** while keeping the music continuously audible.
- **Dual Deliverables + YouTube Metadata**: Produces a standalone interactive WebGL+Canvas web player (`index.html`), a 24 fps `1920x1080` H.264/AAC video (`animation.mp4`), and ready-to-paste YouTube upload metadata (`youtube_metadata.md`).

---

## Included Complete Example: *The Awakening of Mosaic*

The repository includes a full reference production in [`examples/the-awakening-of-mosaic/`](./examples/the-awakening-of-mosaic/):
- **Video (`1920x1080`, 24 fps, 7m 03.5s)**: [`examples/the-awakening-of-mosaic/animation.mp4`](./examples/the-awakening-of-mosaic/animation.mp4)
- **Interactive WebGL + 2D Canvas Player**: [`examples/the-awakening-of-mosaic/index.html`](./examples/the-awakening-of-mosaic/index.html)
- **Story Clarity Audit**: [`examples/the-awakening-of-mosaic/script/story_clarity_audit.md`](./examples/the-awakening-of-mosaic/script/story_clarity_audit.md)
- **Screenplay & Timeline JSON**: [`examples/the-awakening-of-mosaic/script/lines.json`](./examples/the-awakening-of-mosaic/script/lines.json)
- **YouTube Upload Metadata**: [`examples/the-awakening-of-mosaic/youtube_metadata.md`](./examples/the-awakening-of-mosaic/youtube_metadata.md)
- **11 Full-Resolution 1080p Scene Keyframes**: [`examples/the-awakening-of-mosaic/keyframes/`](./examples/the-awakening-of-mosaic/keyframes/)

### Preview the Example Interactive Player Locally

```bash
cd examples/the-awakening-of-mosaic
python3 -m http.server 8420
# Open http://localhost:8420 in any modern browser
```

---

## Quickstart (Full Pipeline Setup)

### 1. Provision Local Audio Models (Kokoro TTS + Stable Audio 3 LiteRT)

Requires Python 3.11/3.12, Node.js 20+, and `ffmpeg`.

```bash
python3 -m venv ~/.cache/story-animation-models/venv
~/.cache/story-animation-models/venv/bin/pip install -r requirements.txt

# Download & SHA-256 verify Kokoro v1.0 ONNX weights + Stable Audio 3 LiteRT w8a8 weights
~/.cache/story-animation-models/venv/bin/python scripts/download_models.py \
  --cache-dir ~/.cache/story-animation-models
```

### 2. Synthesize Voices, Generate Music/SFX, Mix & Verify Loudness

```bash
# 1. Render Kokoro TTS lines, 20Hz lip-sync envelopes, captions.vtt, and timeline.json
~/.cache/story-animation-models/venv/bin/python scripts/kokoro_tts_render.py \
  --lines examples/the-awakening-of-mosaic/script/lines.json \
  --out-dir examples/the-awakening-of-mosaic/audio

# 2. Generate Stable Audio 3 Small-Music cues and Small-SFX clips
~/.cache/story-animation-models/venv/bin/python scripts/sa3_generate.py \
  --music examples/the-awakening-of-mosaic/script/music_cues.json \
  --sfx examples/the-awakening-of-mosaic/script/sfx_score.json \
  --out-dir examples/the-awakening-of-mosaic/audio

# 3. Mix 3 stems with sidechain ducking and verify loudness margins
~/.cache/story-animation-models/venv/bin/python scripts/mix_and_verify_audio.py \
  --timeline examples/the-awakening-of-mosaic/audio/timeline.json \
  --music examples/the-awakening-of-mosaic/script/music_cues.json \
  --sfx examples/the-awakening-of-mosaic/script/sfx_score.json \
  --audio-dir examples/the-awakening-of-mosaic/audio
```

### 3. Render 24 FPS 1080p MP4, YouTube Metadata & Validate

```bash
cd examples/the-awakening-of-mosaic
npm install
npm run render-mp4

~/.cache/story-animation-models/venv/bin/python ../../scripts/generate_youtube_metadata.py \
  --timeline audio/timeline.json \
  --out youtube_metadata.md

~/.cache/story-animation-models/venv/bin/python ../../scripts/validate_project.py .
```

---

## Repository Layout

```text
SKILL.md                        # Complete agent skill instructions & 10-step workflow
README.md                       # Overview & quickstart
THIRD_PARTY_NOTICES.md          # Model & library license notices
requirements.txt                # Python dependencies
references/
  models-manifest.json          # Exact model URLs, sizes, and SHA-256 hashes
  narrative-and-dialogue.md     # Story Clarity Audit & zero-repetition screenplay rules
  audio-and-mixing.md           # Kokoro TTS + Stable Audio 3 + sidechain ducking specs
  webgl-and-canvas-engine.md    # 5-layer environments, 14-part/28-piece rigs, 24fps camera
scripts/
  download_models.py            # Hash-verified downloader for Kokoro TTS & Stable Audio 3
  kokoro_tts_render.py          # Multi-voice TTS synthesis + 20Hz lip-sync envelope builder
  sa3_generate.py               # Batch Stable Audio 3 Small-Music & Small-SFX generator
  mix_and_verify_audio.py       # Sidechain-ducked 3-stem mixer & loudness verifier
  generate_youtube_metadata.py  # Generates Title MM/DD/YYYY, Description, Chapters & Tags
  validate_project.py           # End-to-end automated quality gate validator
examples/
  the-awakening-of-mosaic/      # Full 11-scene reference animation, player, and MP4
```

## License

Code, skill instructions, and documentation in this branch are dedicated to the public domain under **CC0 1.0 Universal** (see [LICENSE](./LICENSE)). Model weights and third-party libraries remain under their respective licenses (see [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)).
