# Music presence regression evidence

2026-11-02 cloud run: `python -m unittest discover -s tool/tests -v`: **47 tests passed**.

New synthetic-signal coverage: speech-heavy score stays approximately 12 dB below voice; concurrent action does not stack deep music cuts; authored score silence stays exactly silent; recovery restores score; no-music projects remain unscored; 100× quieter input score normalizes equivalently; nonfinite/out-of-range/deep-duck settings fail; peak stays <= .89 under a loud transient; metadata remains explicitly not listening-verified. Duration validation accepts 1000-second manifests and rejects >3600 seconds. This is not a full one-hour render or memory benchmark.

Existing suite retained: exact master AAC packet/timestamp identity for film and audio drama, 50 ms negative control, full decode, waveform alignment/masking tests, panel/style/provenance checks, safe paths and packaging. No changes to the exact-master implementation or voice sample placement.

Synthetic tones are explicitly engineering fixtures, not model-generated score/SFX. No independent auditory listening was performed in this test environment. Production still requires a voiced action/quiet dialogue/score-only preview listening check and documented dispositions for level warnings. Numerical RMS and correlation are not guarantees of perceived balance.
