# Timing and prominence regression evidence

2026-11-02: `python -m unittest discover -s tool/tests -v` — **52 tests passed** in the staged generic toolkit.

New coverage: audible interfering signal keeps zero-lag full-mix timing while triggering prominence-listening review; 50 ms shifted mix fails; unrelated mix fails; silent isolated-voice boundaries warn rather than falsely claiming drift; source stem shifted 50 ms or changed in gain fails exact per-utterance placement. Existing checks retained, including exact AAC identity, negative controls, master reconstruction, clipping/nonfinite PCM, source/cast integrity, style gates and prior music-presence tests.

Only isolated-voice correlation is diagnostic. Hard full-mix correlation >.98, <25 ms offset, negative-control recovery and exact source placement remain. The old strict check_anchors helper is retained for backward compatibility/tests but is not the production timing verdict. Numerical technical success does not establish intelligibility; every prominence warning needs a genuine listening disposition. No auditory listening was performed for these generic synthetic tests. No private story, film, art or source sound assets are in this patch.
