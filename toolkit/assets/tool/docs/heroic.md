# Heroic Motion Comics

This frontend adapts editable heroic American-comics pages without converting them to ASCII or redrawing them. It supports a **locked soundtrack mode** as well as the inherited local Kokoro / Stable Audio production pipeline. Camera moves are restrained full-panel fits; this is a motion comic, not articulated character animation.

Read [the required style-review evidence contract](style-review.md) before production. Heroic is the default and fails closed without reviewed drawing evidence. Existing examples explicitly use generic compatibility as engineering fixtures, not style demonstrations.

## Import existing pages

Render final page JSON with the separately installed `draw-heroic-comics` skill/tool. Copy JSON and same-size PNGs into your project. Import plan:

```json
{"pages":[{"json":"page.json","image":"page.png"}],"output":"panels"}
```

`python heroic_motion.py import-page import.json` copies every top-level panel rectangle exactly. It does not infer reading order: review the pages-array and object-array order. Output refuses existing directories, checks bounds and duplicate IDs, and records source JSON/raster hashes and crop rectangles. No PDF scan, book art, or hidden OCR is needed. The standalone drawing dependency is needed only to author/rerender pages; importing supplied JSON/PNGs does not require it.

## Preserve an existing complete soundtrack

```sh
python heroic_motion.py extract-master old-film.mp4 master.m4a
python heroic_motion.py validate-exact project.json
python heroic_motion.py render-exact project.json
python heroic_motion.py verify-master old-film.mp4 out/film.mp4
```

Extraction accepts AAC only and copies it without decoding/re-encoding. Verification compares **every encoded packet hash, timestamp, duration and size** plus stream timebase. A mismatch fails rather than silently substituting sound. The rendered film and static title-card audio drama use the same master. Source narration, dialogue, score and SFX are not regenerated or remixed.

Exact-mode manifest: `title`, optional `subtitle`, `credits` string array, optional `cast` role/voice map, `audioReviewNotes` documenting actual audio-only script review, `master` project-relative AAC M4A, `duration` (<=3600s), integer `fps`1–60, even square `size`256–1920, `shots` with unique `id`, relative `image`, `sha256`, frame-aligned `start/end`, and `captions` with `speaker,text,start,end`. Optional `background` is project-relative; otherwise first panel. Optional `expectedPanels` lists intended panel IDs; each shot's `panel` field or default `id` must cover it exactly. Optional truthful `voiceCredit` and `audioCredit` override stock credits. Shots/captions must be sorted and non-overlapping. Master must be48kHz AAC and duration within100ms; this tolerance accommodates container rounding, **not** timing drift. Exact packet verification remains zero-tolerance.

Review semantic mapping of every panel to audio. Software cannot know that an image actually depicts a named action. A caption can cross a shot boundary when an utterance spans multiple images. Keep captions from the existing voice clock, not estimated text length. Short intro/outro gaps show title/credits. Never use these gaps to hide omitted source panels. `render-exact` refuses an existing `out` directory. Preserve a failed output for diagnosis; deliberately choose a fresh work directory when retrying.

## New soundtrack

Use `motion_manga.py` and `docs/commands.md`, `docs/schema.md`, `references/models.md`. This retained backend name is provenance, not an instruction to switch visual aesthetics. It supports distinct local Kokoro voices, local generated music/SFX, canonical48k mixing, per-utterance verification, negative controls, and paired exports. No models download automatically. Backend tests are retained under MIT, with attribution. Do not replace missing local AI assets with synthetic tones while claiming a production run.

## Rebuild demo and test

`examples/heroic-harbor` contains simplistic original tool art and a preserved neutral demo soundtrack. It is an engineering fixture, not evidence that the art satisfies a heroic-style brief. Source art can be regenerated using `python examples/build_heroic_demo.py --drawing-scripts /path/to/drawing-tool/scripts`. That command is optional; rendered source art is bundled. To rerender, copy the demo into a fresh directory and move its existing `out` aside, then run `render-exact` there. Importing again requires moving `panels` aside first. Run `python -m unittest discover -s tests -v` in the tool root; the fixture outputs are intentional test dependencies. Tests include a50ms audio-shift negative control.

Inspect output frames at start/end and each shot and caption. Run full FFmpeg decode. Packet identity is strong evidence of unchanged sound and timing, not independent listening, source legality, story fidelity or caption correctness. If unable to audition audio, say so. Keep public tool/demo packages separate from private films and conversation provenance.
