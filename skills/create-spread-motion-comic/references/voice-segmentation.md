# Caption-to-voice segmentation

Before TTS, transcribe each caption exactly and segment by speaker, not by caption box. Record `id`, `source_text`, and ordered `segments`, each with Unicode code-point `start`/`end` offsets, `kind` (`narration`, `dialogue`, or `label`), `speaker`, and exact `text`. Review speaker identity from story context. Do not infer identity from a colon alone.

- `Mira warned: "Stay back."` becomes narrator `Mira warned: `, then Mira's dialogue `"Stay back."`.
- `"Stay back," Mira warned, "the floor is weak."` becomes Mira, narrator, Mira.
- `Mira: Stay back.` is an editorial speaker label plus Mira dialogue; preserve the label in source metadata but do not have Mira say her own label. This is different from a narrated phrase such as `Mira warned:`.
- `The answer was simple: leave.` is narrator throughout, not an invented character switch.
- Quoted inscriptions, cited phrases and scare quotes are not automatically character dialogue. Review explicitly. Ambiguity must be resolved before synthesis.

Run `python scripts/validate_voice_segments.py voice-segments.json` before synthesis. Format: `{"cast":{"narrator":"am_adam","Mira":"af_heart"},"captions":[...]}`. The helper verifies coverage and stable cast identity; it cannot determine literary intent. Manually review each mixed caption against the source art and script.

Synthesize each spoken segment separately in the assigned stable voice. Keep label spans unspoken; all other substantive words must be spoken once in order. Apply pronunciation handling per segment. Record the intended speaker, role, source offsets, spoken-text transformation, voice ID, phonemes, WAV hash and measured duration. Cache identity must include segmentation version, speaker/role, voice, exact spoken text, pronunciation version, runtime/model revision and speed. Never reuse an old whole-caption WAV after changing attribution.

Fit the new sequential utterances into the existing panel with natural pauses. Do not overlap voices, speed up speech, or clip lines to preserve old timing. If needed, extend only that panel's hold and rebuild captions/timing while preserving accepted artwork. For audio-only repairs, preserve the encoded video stream when durations fit, otherwise disclose minimal hold-timing changes. Check every voice handoff and caption-to-audio coverage in the final encoded file; transcript labels alone are not verification.
