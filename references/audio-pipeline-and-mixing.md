# Kokoro TTS, Stable Audio 3 LiteRT & Loudness Hierarchy Mixing

## 1. Local Model Provisioning (`~/.cache/story-animation-models`)

All speech, music, and sound effects run 100% locally on CPU without cloud API keys:

- **Kokoro TTS (`kokoro-onnx`)**:
  - `kokoro-v1.0.onnx` (325,532,387 bytes, SHA-256: `7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5`)
  - `voices-v1.0.bin` (28,214,398 bytes, SHA-256: `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d`)
- **Stable Audio 3 Optimized (`stabilityai/stable-audio-3-optimized` rev `30cb2644da54bfa63275d1bc7f1fa67fc718680f`)**:
  - Runtime: `https://github.com/Stability-AI/stable-audio-3` (`optimized/tflite/scripts/sa3_tflite.py`)
  - `tflite/sa3-sm-music/dit_w8a8.tflite` (539,350,360 bytes, SHA-256: `1d8ef99bf10f51cc52b68f7b527d3773828e700758b253edd8a8e088a906e241`)
  - `tflite/sa3-sm-sfx/dit_w8a8.tflite` (539,350,360 bytes, SHA-256: `d3f99409f446eff9a625768ba2ee09a2347ea90c4897c1662fbcd8837fae3045`)
  - `tflite/same-s/dec_w8a8.tflite` (94,092,016 bytes, SHA-256: `2fc31cdc42a54342233fb8c6da636565b1191d97002665e21812e981490434a6`)
  - `tflite/t5gemma/encoder_fp16.tflite` (563,818,608 bytes, SHA-256: `8530d0b3e6b9b9dcf1239145c2a853fb749708eaddbb472ff8f0802b50059372`)

Always run Stable Audio 3 inference with `HF_HUB_OFFLINE=1 HF_HUB_DISABLE_IMPLICIT_TOKEN=1` once weights are verified.

---

## 2. Prompting Stable Audio 3 (`sm-music` & `sm-sfx`)

On the LiteRT runtime, use plain descriptive prompts:

- **Music (`--dit sm-music --decoder same-s --dit-precision w8a8 --decoder-precision w8a8 --steps 8 --cfg 1`)**:
  - Name the instrumentation, tempo, emotional mood, and dramatic role, always ending with `instrumental, no vocals`.
  - Generate one cue per major dramatic act (e.g., 45–90 seconds per cue) and crossfade cues smoothly (`2.0s` linear or equal-power crossfade) across scene boundaries.
- **SFX (`--dit sm-sfx --decoder same-s --dit-precision w8a8 --decoder-precision w8a8 --steps 8 --cfg 1`)**:
  - Generate 3–6 second clips per physical sound archetype (e.g., `"deep ancient stone and bronze mechanism grinding rotation rumble"`, `"high voltage electric speedster sprint whoosh crackle"`, `"heavy metallic hydraulic exosuit servo lock and power up"`, `"resonant energy sphere catch and kinetic pulse impact"`, `"warm crystalline chime harmonic awakening"`).
  - Because diffusion SFX outputs vary in peak amplitude (`0.08` to `0.98`) and attack timing, automatically detect the peak transient window of each generated clip and normalize each event's peak before placing it on `sfx_stem.wav`.

---

## 3. Loudness Hierarchy & Envelope Ducking Specification

The user requirement is explicit:
> **"Dialogue and SFX should be louder than the background music, but the background music should still be audible."**

To guarantee this mathematically and perceptually across every scene:

1. **Canonical Sample Rate**: Resample all stems to `48,000 Hz` stereo float64 before mixing.
2. **Voice Stem (`voice_stem.wav`)**:
   - Normalize each utterance to a consistent target RMS of `-13.5 dBFS` (with soft peak ceiling at `-1.5 dBFS`) so quiet voices (`bm_lewis`, `bf_emma`) and bright voices (`af_sky`, `af_bella`) sit at equal intelligibility.
3. **SFX Stem (`sfx_stem.wav`)**:
   - Normalize each placed sound effect event to a target peak between `-5.5 dBFS` and `-3.0 dBFS` (RMS around `-16.5 to -13.5 dBFS` over the active transient window).
   - When an SFX event overlaps active speech, apply a gentle `0.72` speech-protection multiplier to the mid-band or envelope so speech remains crystal clear while the SFX transient still punches far above the background music.
4. **Background Music Stem (`music_stem.wav`)**:
   - Normalize each raw music cue to a base RMS of `-21.5 dBFS` (audible, warm bed in non-speech/non-SFX gaps).
   - Compute a smooth **dual ducking envelope** `env(t)` from `speech_activity(t)` (smoothed with a `180 ms` window) and `sfx_activity(t)` (smoothed with a `120 ms` window):
     $$\text{gain}_{\text{music}}(t) = 1.0 - 0.52 \cdot \max\big(\text{speech\_env}(t),\, 0.75 \cdot \text{sfx\_env}(t)\big)$$
   - Under active dialogue or narration, the music bed ducks by approximately `6.5 dB` to `-28.0 dBFS` RMS—meaning **Dialogue is ~14.5 dB louder than the background music**, **SFX events are ~11 to 14 dB louder than the background music**, and **the background music stays continuously audible at `-28 dBFS` to `-21.5 dBFS` RMS** (never dropping below `-34 dBFS`).
5. **Automated Verification (`audio_verification.json`)**:
   - Measure and record:
     - `voice_active_rms_db` (must be $\ge -16.0\text{ dBFS}$)
     - `sfx_active_rms_db` (must be $\ge -19.5\text{ dBFS}$ and peak $\ge -8.0\text{ dBFS}$)
     - `music_ducked_rms_db` (must be between $-33.0\text{ dBFS}$ and $-21.0\text{ dBFS}$)
     - `music_unducked_rms_db` (must be between $-26.0\text{ dBFS}$ and $-17.0\text{ dBFS}$)
     - `voice_over_music_margin_db = voice_active_rms_db - music_ducked_rms_db` (must be $\ge 8.0\text{ dB}$)
     - `sfx_over_music_margin_db = sfx_active_rms_db - music_ducked_rms_db` (must be $\ge 6.0\text{ dB}$)
