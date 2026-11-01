# Verified neutral integration run

The fresh `Harbor at Dawn` fixture exercises SVG cropping, project validation, two newly generated Kokoro voices, newly generated Stable Audio score and gate SFX, canonical mixing, paired video rendering, verification, and source packaging. Existing model weights were reused; **no private film media was reused**.

- 12 seconds, 540×540, 24fps, 288frames per export.
- Narrator `af_heart`:2.368s; keeper `bm_george`:1.600s.
- Generated score12s and gate1.5s. Gate's measured10ms-RMS transient1.19s is placed at5.2s, within the gate panel's4–10s shot.
- Both exports fully decode; same encoded AAC; decoded peak0.40996, no clipping.
- Four speech anchors per reference/export align at0ms; every deliberate50ms-delay control is detected. Full-mix and isolated-voice thresholds are unchanged and pass.
- Seventeen automated tests pass: see `latest-test-run.txt`. They cover actual drift, masking, clipping/nonfinite samples, wrong canonical output rate, missing/silent speech, missing/duplicate voices, source coverage, script review, frame alignment, escaping paths, external SVG references, absent QA and stale QA. Adapter smoke report additionally records12 input rejection checks.
- Editable ZIP is CRC-checked, under18MB, and preserves original source WAVs, source SVG/cropped panels, generation receipts, project, code, QA and metadata.

Encoded panel/caption frames and static title card were visually inspected. This fixture deliberately uses simple neutral vector art, not a claim of anime illustration quality. Independent auditory listening was not available; no listening guarantee is asserted. Source generation receipts and final project timing are distinct: the final project is the authoritative edit clock.

The first test edit was revised to place the measured gate transient between utterances and show its panel at the time of the cue. Prior temporary candidates are outside the distributed tool. No test changed or weakened the original QA thresholds.
