# Voice-first mixing and honest audio QA

Run `scripts/sa3_vn_audio.py` after Kokoro synthesis. It applies `priority_audio_mix.py` to the **summed** effects bus, so overlapping effects cannot evade the priority control. The generated sample uses this same production path.

- Measure stereo power over aligned 250 ms windows, never a phase-cancelling mono fold-down.
- Foreground voices are source windows at or above -30 dBFS RMS. Foreground effects are source windows at or above -30 dBFS RMS and at least 6 dB above the source music bed. Quieter breaths, natural decay tails and rests are not foreground; their ordering is not guaranteed.
- During foreground overlap keep voices at least 6 dB above summed effects and 12 dB above music, and foreground effects at least 6 dB above music. Limit the effects bus to -9 dBFS peak. These are short-time RMS priorities, not every-sample or every-peak ordering.
- Use smooth gain curves with offline look-ahead. Apply common linear headroom so the final master peak is at most -1.5 dBFS and the measured bus ratios remain intact.
- Preserve the music bed rather than chasing inaudible effect tails. Aim for background music around -27.5 dBFS under dialogue, with a review threshold of -34 dBFS. Never amplify silence/noise merely to pass a numerical floor.
- Save the actual final floating-point stems, the premix source stems (`premix_stems.npz`), and `priority_mix_report.json`. The validator independently reloads the saved buses and source activity to measure margins, confirms the master equals their sum, and checks headroom.
- Music-floor exceptions must be reported with their time ranges. Natural fades, rests, quiet foreground and common headroom can put music below the review threshold. A `review_required` flag is not proof of silence, nor permission to claim continuous audibility.
- Inspect rendered frames, decode the entire final video and, when listening is available, listen to representative voice/effects/music overlap and quiet passages. If listening is unavailable, say so and provide a listening sample for the user's judgment. Never claim perceived loudness or audibility is guaranteed by RMS numbers alone.

Run deterministic tests with `python scripts/test_priority_audio_mix.py`. No models or network are needed for these tests. Full production still requires Kokoro, Stable Audio and image generation as documented in the main skill.

## Keep effects expressive without grating harshness

Do not ban electricity, static, alarms, magic crackles or other expressive effects. Before priority mixing, run the summed SFX bus through `sfx_comfort.soften_sfx`. This offline, zero-phase band control measures 100 ms stereo RMS and attenuates only the 2.5–8 kHz band, up to 6 dB, when its RMS-to-full-signal ratio rises from 0.25 to 0.65. Smooth the gain between windows, leave low-frequency body intact, and retain the recognizable texture. Silence, very short clips and unsupported low sample rates bypass safely.

Keep original generated clips and `sfx_unconditioned_stem.wav`. Save `sfx_comfort_report.json` showing the actual maximum attenuation and affected duration. Store the conditioned SFX in `premix_stems.npz` so the independent priority audit uses the same source bus. Voices and music are not passed through this filter. The existing final SFX -9 dBFS peak ceiling and master -1.5 dBFS ceiling remain in force.

Review the result rather than treating this heuristic as a guarantee. If an effect is still grating, use a less abrasive generation prompt, reduce or shorten the particular cue, or apply further selective processing while preserving its intended identity. If it becomes dull or loses its narrative purpose, reduce the processing or regenerate. No blanket effect blacklist and no claims of universal comfort or hearing safety. When requested, deliver a labeled before/after listening example at comparable mix levels.

Run `python scripts/test_sfx_comfort.py` for bright-band attenuation, low-frequency preservation, silence/short-input, finite-noise, no-mutation and invalid-input checks.
