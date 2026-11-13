# Local audio pipeline

Run `python scripts/audio_setup.py --help`, then read-only preflight with `--runtime-root /chosen/cloud/cache --report /project/setup.json`. Use its `--restore` only under applicable permission for official models and runtimes; never accept new terms, provide credentials, use a personal computer or paid API implicitly. The bundled exact manifest and requirements preserve Kokoro and Stable Audio official source revisions and hashes. No model weights are included. `--test` synthesizes fresh offline speech/music/effect smoke samples; readiness alone is not inference proof.

Execute the production adapter with that runtime's Python:

```
/runtime/venv/bin/python scripts/audio_build.py input.json --runtime /runtime --out /project/audio
```

Input scenes contain explicit `utterances: [{text,speaker,voice}]`; optional `caption` must equal their text concatenated exactly, including whitespace and punctuation. A quote-introducing narration span and the actual quote need separate utterances and distinct stable voices. Do not assign a whole mixed caption to a character. Preserve displayed text, names, attribution and chronology. Stock Kokoro voices only; do not clone an identifiable person's voice. `AI` is phonemized as the letter A followed by eye; other names/acronyms require separate preview review. The cache fingerprints text, voice, language, speed, pronunciation, model and voice-file hashes. A different utterance is not the same cache entry.

Optional `music: {prompt, seed}` generates a Stable Audio Small Music cue. `effects: [{scene,offset,seconds,prompt,seed}]` generates motivated Stable Audio Small SFX. Prompts should ask for smooth, non-grating sounds; bounded 2.5–8kHz attenuation reduces harshness without banning electricity/static. Never replace model failure with silent tracks, beeps or undeclared stock audio. Keep authentic generated originals and provenance.

The adapter writes measured `timeline.json` with frame-aligned scene durations, global voice spans, scene-local `speech` subtitle intervals, and relative `master.wav`; renderer paths must resolve relative to the timeline location. Subtitles longer than 70 characters are split into readable chunks timed proportionally within a measured utterance, not forced-aligned at individual words. If precise word timing is required, add a verified aligner. Retain short inter-speaker gaps. Never speed speech to fit a predetermined duration.

Mix at 48kHz: normalize active speech toward -18dBFS RMS, meaningful foreground SFX -23, a continuous music bed near -26 with a single smooth approximately 3dB phrase duck. Targets are starting points, not loudness guarantees. Level broad music phrases within bounds; reject silence rather than amplifying noise. Do not stack duckers or chase individual syllables. The final-scaled music must pass a -33dBFS 3-second presence floor, active speech/music margin >=6dB, active foreground SFX/music >=3dB, active voice/effects overlap >=3dB. These gates use meaningful active samples, not silent word gaps or fading tails. When they conflict, adjust foreground normalization or cue arrangement, not endless music suppression. Inspect 3-second windows and listen to quiet scenes, transitions, and mixed-speaker lines. Keep voice > foreground SFX > audible music as the perceptual goal.

The adapter fails if quantitative gates fail. Retain voice/effects/music/master stems so repairs do not require new art or resynthesis. Technical pass is not listening approval: record `listeningVerified:false` until a real listening check occurs. Source generation, human attribution review and perception cannot be certified by RMS checks. Probe/decode the final video and measure encoded peak/true peak (target <= -1dBTP) and stem-to-encoded speech timing after AAC encoding; never infer it from uncompressed WAV success. Record the exact speaker/voice, model hashes, cue prompts/seeds, output hashes, final duration and any limitation in the QA receipt.

Run `python scripts/audio_tests.py` using the pinned runtime for deterministic regression checks. The bundled local test does not contact external services.


## Mandatory optional-effect admission gate

Default `effects` to `[]`; commentary does not need an opening sound. The first three seconds prohibit SFX unless `allow_opening_sfx: true` explicitly overrides that default AND the normal audition requirements pass. This is an editorial opt-in, not a substitute for listening.

`audio_build.py` omits every effect lacking an `audition` receipt with `listening_verified: true`, `mixed_preview_verified: true`, nonempty `reviewer`, `reviewed_at`, `notes`, and the exact raw asset `source_sha256`. It checks the generated source hash before admission. A changed source invalidates review. Receipts record actual listening to the isolated sound AND a preview at the intended final mix level, including entry/exit and underlying narration/music. Previously trusted assets need the same hash-bound real review and a mix check; a label saying trusted is insufficient. Never fabricate these fields.

Generate candidates separately for audition, not in a deliverable. If no perceptual listening surface is available, omit all optional SFX. `omitted_effects` in QA/timeline reports records why; report omissions, do not silently claim a full SFX production. Numerical gates remain useful but cannot certify freedom from harsh static, jarring timbre or startle. If a listener reports harshness, remove the offending effect rather than trusting its low RMS or applying repeated EQ. Recheck the encoded opening and every retained effect.
