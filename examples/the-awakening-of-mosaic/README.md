# The Awakening of Mosaic — WebGL Shaders & 2D Canvas Animation

Adapted from **`world_sim_session_1_narrative.md`** (*The Unwritten Frontier — Session One, Day 1, 08:12–11:10*) using the **`webgl-canvas-story-animator`** skill.

---

## 1. Quick Start

- **Interactive WebGL + 2D Canvas Player**: Open [`index.html`](./index.html) in a modern browser (or serve via `npx serve .` / `python3 -m http.server 8080`).
- **Standalone 1080p H.264/AAC Film**: Play [`animation.mp4`](./animation.mp4) (`1920x1080`, `455.09s`, 48 kHz stereo AAC audio + synchronized burned-in captions).
- **Synchronized WebVTT Captions**: [`audio/captions.vtt`](./audio/captions.vtt).
- **Screenplay & Adapted Dialogue**: [`script/adaptation_script.md`](./script/adaptation_script.md).
- **Automated Verification**:
  ```bash
  npm run validate
  ```

---

## 2. Cast & Unique Kokoro-82M Stock Voices

Every speaking character—plus the descriptive audio narrator—is assigned a unique stock voice from **Kokoro TTS (`kokoro-onnx` v1.0)**:

| Character | Kokoro Stock Voice | Speed | Role |
| :--- | :--- | :--- | :--- |
| **Narrator** | `af_heart` | `1.00` | Descriptive Audio Narrator (eyes-closed comprehension) |
| **Traveler** | `am_adam` | `1.00` | Aspiring Hero & Improvised Exosuit Pilot |
| **Astral Warden** | `af_nicole` | `0.95` | Registered Cosmic Sorcerer (Roadside Hologram) |
| **Velocity** | `af_sky` | `1.06` | Registered Speedster Hero |
| **Aegis Prime** | `bf_emma` | `0.97` | Gravitational Armor Engineer |
| **ARCHITECT** | `bm_george` | `0.96` | Laboratory Mainframe AI |
| **ARCHITECT-S1** | `am_michael` | `1.02` | Distilled Offline Wristband Tactical AI |
| **Mosaic** | `bm_lewis` | `0.91` | Awakened Modular Mechanical Giant |
| **ARCHITECT-S2** | `af_bella` | `1.08` | 15 cm Shapeshifting Modular Companion |

---

## 3. Stable Audio 3 Music & Sound Effects + Verified Loudness Hierarchy

Generated locally on CPU using **Stability AI's `stable-audio-3-optimized` (`sm-music` and `sm-sfx` w8a8 LiteRT models)** and verified in [`audio/audio_verification.json`](./audio/audio_verification.json):

- **Dialogue & Descriptive Narration (`voice_stem.wav`)**: `-14.57 dBFS` active RMS (**+13.26 dB louder** than ducked background music).
- **Sound Effects (`sfx_stem.wav`)**: `-3.86 dBFS` peak / `-21.30 dBFS` active RMS (**+6.53 dB louder** than ducked background music).
- **Background Music (`music_stem.wav`)**: `-22.97 dBFS` RMS in transitions, sidechain-ducked to `-27.83 dBFS` RMS under speech and SFX (continuously audible throughout all 11 scenes).
