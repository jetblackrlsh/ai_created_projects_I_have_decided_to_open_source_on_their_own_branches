# WebGL & 2D Canvas Painterly Anime Story Animator (`webgl-canvas-story-animator` — Antigravity-High Detail Edition v1)

An agent skill and complete offline toolchain (**Antigravity-High Detail Edition v1**) for adapting narrative stories into **Studio Ghibli / Makoto Shinkai style high-detail painterly anime 2D animations**, rendered with custom **WebGL GLSL atmospheric scattering shaders** and a deterministic **gouache bristle-brush & 3-tone cel-shaded 2D Canvas engine (`painterly-anime-engine.js`)**, complete with:

- **Moss-Keeper Painterly Gouache & Bristle-Brush Visual Engine (`scripts/painterly-anime-engine.js`)**:
  - **Scalloped Bristle-Brush Foliage (`traceScallopedBrushBlob`, `fillBristleCluster`, `drawMossCluster`)**: Deterministic (`mulberry32`) multi-tiered gouache foliage across 6 tonal steps (`#193b22` deep forest shadow up to `#e2e685` sunlit crown tips), topped with swaying grass blades and 5-petal wildflowers (`drawFivePetalFlower`).
  - **Curved 3-Tone Cel-Shaded & Botanical-Overgrown Rigs (`drawMossKeeperTitanRig`, `drawWeatheredPlate`)**: Outward-curved bezier domes and cylinders with clipped opaque 3-tone cel zones, gouache rust/patina flakes, chipped terracotta regalia stripes, rotating pinwheel turbine medallions (`drawPinwheelMedallion`), living shoulder sapling trees (`drawShoulderSapling`), and hand-inked charcoal outlines.
  - **Multi-Shot Anime Cinematography**: Aerial forest canopy vistas with bird flocks (`drawForestCanopyVista`), framed sunlit forest glades with gnarled bark trunks and hanging vines (`drawSunlitForestGladeStage`), shallow-DOF bokeh cutaways with a cel-shaded Bluebird (`drawCelShadedBluebird`), top-down pond mirror reflections with expanding water ripples (`drawTopDownPondReflectionScene`), extreme close-up optic awakenings with anamorphic 4-point star glints (`drawAnamorphicStarGlint`), low-angle dust-billowing ascents (`drawBillowingDustPlumes`), and overhead canopy wind-ring shockwaves (`drawAerodynamicWindRings`).
  - **Live 6-Frame Procedural Film Grain & Theater Presentation**: Includes both an interactive studio player (`index.html` with Pure Cinema Mode) and a standalone minimalist theater (`cinema.html`) with live `<canvas id="grain">` (`mix-blend-mode: overlay`), `<img id="poster">` fade-out, and classic serif typography.
- **Pre-Adaptation Story Clarity Audits (`script/story_clarity_audit.md`)**: Diagnoses source-story ambiguities, causal leaps, and unexplained stakes before writing a single line, adding explicit clarifying bridges so viewers never get lost.
- **Zero-Repetition Screenplay Pacing**: Eliminates narrator-dialogue echoing (narration sets the physical stage and visual action; character dialogue delivers discoveries, motives, and plans in brisk chronological lockstep).
- **Implied-to-Direct Character Dialogue**: Converts narrative summaries of conversations into natural, in-character spoken exchanges.
- **Kokoro TTS Multi-Voice Acting (`kokoro-onnx`)**: Every speaking character and the Narrator receives a unique stock voice (`af_heart`, `am_adam`, `af_nicole`, `af_sky`, `bf_emma`, `bm_george`, `am_michael`, `bm_lewis`, `af_bella`), plus 20 Hz speech envelopes for real-time jaw/visor animation.
- **Eyes-Closed Descriptive Audio Accessibility**: Narration includes vivid descriptive audio cues so the animation works equally well watched on screen or listened to with eyes closed.
- **Stable Audio 3 Small-Music & Small-SFX (`ai-edge-litert`)**: Generates original multi-section musical scores and bespoke foley/SFX locally on CPU.
- **Verified Sidechain-Ducked Loudness Hierarchy**: Automatically mixes and verifies that **Dialogue & Narration (`-14.6 dBFS`)** and **SFX (`-21.1 dBFS` active RMS / `-4.3 dBFS` peak)** sit clearly above **Background Music (`-28.0 dBFS` ducked)** while keeping the music continuously audible.
- **Dual Deliverables + YouTube Metadata**: Produces an interactive WebGL+Canvas studio player (`index.html`), a standalone theater view (`cinema.html`), a 24 fps `1920x1080` H.264/AAC video (`animation.mp4`), and ready-to-paste YouTube upload metadata (`youtube_metadata.md`).

---

## Included Complete Reference Examples (`examples/`)

The skill packages the reference production in [`examples/`](./examples/) showcasing the full v3 Painterly Anime Engine (`painterly-anime-engine.js`), 11-shot camera grammar (`computeCinematicShot`, `applyCameraTransform`, `drawDepthOfFieldBokeh`), detailed anime & felt-puppet character rigs (`drawMasterAnimeCharacter`, `drawMasterMuppetCharacter`), indoor/outdoor painterly architectural builders, title-safe paginated captions, hyphen-sanitized Kokoro TTS, and sidechain-ducked 3-stem audio:

### 1. *Echoes in the Static & The Unfinished Bite* (`examples/dream-journal-2026-11-03/`)
A 6-scene painterly anime adaptation of a multi-part dream journal entry featuring cosmic Storyverse projections, a timber hunting lodge with felt Muppet guests, an antique pop-up grimoire, a twilight European corner café-hotel, and a golden chandelier banquet hall:
- **Original video (`1920x1080`, 24 fps, 5m 32.94s, 7,991 frames; reconstruct first)**: [`examples/dream-journal-2026-11-03/animation.mp4`](./examples/dream-journal-2026-11-03/video-parts/)
- **Interactive Studio Player**: [`examples/dream-journal-2026-11-03/index.html`](./examples/dream-journal-2026-11-03/index.html)
- **Standalone Theater View (`moss-keeper` style)**: [`examples/dream-journal-2026-11-03/cinema.html`](./examples/dream-journal-2026-11-03/cinema.html)
- **Scene Renderer & Multi-Shot Cinematography**: [`examples/dream-journal-2026-11-03/src/scene-renderer.js`](./examples/dream-journal-2026-11-03/src/scene-renderer.js)
- **Painterly Anime Engine (v3)**: [`examples/dream-journal-2026-11-03/src/painterly-anime-engine.js`](./examples/dream-journal-2026-11-03/src/painterly-anime-engine.js)
- **Story Clarity Audit**: [`examples/dream-journal-2026-11-03/script/story_clarity_audit.md`](./examples/dream-journal-2026-11-03/script/story_clarity_audit.md)
- **Screenplay & Shot-Annotated Lines JSON**: [`examples/dream-journal-2026-11-03/script/lines.json`](./examples/dream-journal-2026-11-03/script/lines.json)
- **YouTube Upload Metadata**: [`examples/dream-journal-2026-11-03/youtube_metadata.md`](./examples/dream-journal-2026-11-03/youtube_metadata.md)
- **Full-Resolution 1080p Scene & Sub-Shot Keyframes**: [`examples/dream-journal-2026-11-03/keyframes/`](./examples/dream-journal-2026-11-03/keyframes/)

### Preview the Example Interactive Player Locally

```bash
python3 scripts/reassemble_video.py  # Verify and restore the original MP4
cd examples/dream-journal-2026-11-03
python3 -m http.server 8420
# Open http://localhost:8420/index.html (Studio) or http://localhost:8420/cinema.html (Theater)
```

---

## Quickstart (Full Pipeline Setup)

### 1. Provision Local Audio Models (Kokoro TTS + Stable Audio 3 LiteRT)

Requires Python 3.11/3.12, Node.js 20+, and `ffmpeg`.

```bash
python3 -m venv ~/.cache/story-animation-models/venv
~/.cache/story-animation-models/venv/bin/pip install -r requirements.txt

# Download & SHA-256 verify Kokoro v1.0 ONNX weights + Stable Audio 3 LiteRT w8a8 weights
~/.cache/story-animation-models/venv/bin/python scripts/setup_audio_models.py \
  --cache-dir ~/.cache/story-animation-models
```

### 2. Synthesize Voices, Generate Music/SFX, Mix & Verify Loudness

```bash
# 1. Render Kokoro TTS lines, 20Hz lip-sync envelopes, captions.vtt, and timeline.json
~/.cache/story-animation-models/venv/bin/python scripts/kokoro_tts_render.py \
  --lines examples/dream-journal-2026-11-03/script/lines.json \
  --out-dir examples/dream-journal-2026-11-03/audio

# 2. Generate Stable Audio 3 Small-Music cues and Small-SFX clips
~/.cache/story-animation-models/venv/bin/python scripts/sa3_audio_gen.py \
  --music examples/dream-journal-2026-11-03/script/music_cues.json \
  --sfx examples/dream-journal-2026-11-03/script/sfx_score.json \
  --out-dir examples/dream-journal-2026-11-03/audio

# 3. Mix 3 stems with sidechain ducking and verify loudness margins
~/.cache/story-animation-models/venv/bin/python scripts/mix_and_verify_audio.py \
  --timeline examples/dream-journal-2026-11-03/audio/timeline.json \
  --music examples/dream-journal-2026-11-03/script/music_cues.json \
  --sfx examples/dream-journal-2026-11-03/script/sfx_score.json \
  --audio-dir examples/dream-journal-2026-11-03/audio
```

### 3. Render 24 FPS 1080p Painterly Anime MP4, YouTube Metadata & Validate

```bash
cd examples/dream-journal-2026-11-03
npm install
npm run render-mp4

python ../../scripts/generate_youtube_metadata.py \
  --timeline audio/timeline.json \
  --out youtube_metadata.md

python ../../scripts/validate_project.py .
```

---

## Repository Layout

```text
SKILL.md                          # Complete agent skill instructions & 15 invariants
README.md                         # Overview & quickstart
THIRD_PARTY_NOTICES.md            # Model & library license notices
requirements.txt                  # Python dependencies
references/
  models-manifest.json            # Exact model URLs, sizes, and SHA-256 hashes
  narrative-and-dialogue.md       # Story Clarity Audit & zero-repetition screenplay rules
  audio-pipeline-and-mixing.md    # Kokoro TTS + Stable Audio 3 + sidechain ducking specs
  webgl-and-canvas-engine.md      # Moss-Keeper Painterly Anime Engine, rigs & cinematography
scripts/
  painterly-anime-engine.js       # Reusable Ghibli/Shinkai/Moss-Keeper 2D Canvas engine (v3)
  setup_audio_models.py              # Hash-verified downloader for Kokoro TTS & Stable Audio 3
  kokoro_tts_render.py            # Multi-voice TTS synthesis + hyphen sanitizer + 20Hz lip-sync
  sa3_audio_gen.py                 # Batch Stable Audio 3 Small-Music & Small-SFX generator
  mix_and_verify_audio.py         # Sidechain-ducked 3-stem mixer, Clean Opening Rule & verifier
  generate_youtube_metadata.py    # Generates Title MM/DD/YYYY, Description, Chapters & Tags
  validate_project.py             # End-to-end automated quality gate validator (all 15 invariants)
examples/
  dream-journal-2026-11-03/       # Full 6-scene Dream Journal adaptation, players, keyframes & MP4
```

## License

Code, skill instructions, and documentation in this branch are dedicated to the public domain under **CC0 1.0 Universal** (see [LICENSE](./LICENSE)). Model weights and third-party libraries remain under their respective licenses (see [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)).

## Public-release packaging

The approved dream-journal example is preserved, including its story, audio, frames, and original full-quality video. The 127,473,348-byte MP4 exceeds GitHub’s ordinary-file limit, so `video-parts/` contains lossless numbered parts with per-part and combined SHA-256 checksums. Run `python3 scripts/reassemble_video.py` from the repository root before using `cinema.html`. The script restores the exact original bytes, without transcoding. The interactive `index.html` uses the included audio and does not need reconstruction.

This source ZIP contains only the dream-journal example. Stale references to an absent Mosaic example and two renamed setup scripts were corrected in this README. Private source-document URLs and identifiers were removed from the example documentation; the dream narrative and media are unchanged. Other original source files are preserved. Model weights, individual WAV stems, and runtime packages are not bundled. To re-render the MP4 using the supplied renderer, regenerate `audio/master.wav` through the audio pipeline or decode the included master using `ffmpeg -i audio/master.m4a audio/master.wav` from the example folder.

The CC0 dedication applies to the supplied code, skill instructions, and documentation to the extent of the author's rights. Third-party models, libraries, names, and trademarks retain their respective rights; references to artistic styles or fictional characters do not imply affiliation or endorsement.
