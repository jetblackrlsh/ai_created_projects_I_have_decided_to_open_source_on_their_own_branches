# Manga art contract

The software checks evidence completeness and freshness. It cannot determine that a reviewer truly looked, that a receipt is honest, or that art is attractive. Never substitute metadata for actual full-size/thumbnail visual review.

Set `artContract.mode` to `manga`, and `notes` to scope/limitations. Set `origin` to `draw-headless-manga` for newly authored scenes, or `supplied-manga` for existing supplied comic art. Supplied art requires `permissionNotes`. New scenes must use the drawing skill, not a separately drawn mascot placeholder.

`evidence` is a list of `{file, sha256, role}` records using project-local files. Every actual source page must be included as role `source-page`, with the exact path and sourceSha256 recorded for its panels. Drawing-origin projects require roles `editable-scene`, `drawing-tool`, and `drawing-receipt`: keep the actual editable scene, exact drawing script/module version, and receipt of commands/outputs with their hashes. A fabricated receipt or an unrelated tool file is not acceptable. Supplied-origin evidence must establish the actual source pages.

`visualReview` contains `reviewer`, `method` (describe actual image-viewing surface), `sequenceNotes`, and `panels`. Each panel record contains its `id`, exact `sha256` and `sourceSha256`, `accepted: true` only following actual inspection, and substantive strings `form`, `perspective`, `actingContact`, `lineTone`, `readability`, `limitations`. State not-applicable criteria honestly (e.g. no character in an establishing landscape), rather than inventing anatomy claims. Changed artwork invalidates its review. A failed panel must be repaired and re-inspected or its limitations accepted explicitly by the user before export.

For the bundled audio/timing test ONLY: `{ "mode": "generic-comic", "fixtureOnly": true, "notes": "Describe fixture limitations" }`. This exports as TECHNICAL COMIC FIXTURE, not MOTION MANGA. This mode is not an alternate route for fulfilling a manga request. The legacy harbor pictograms demonstrate no manga drawing capability.

Migrate old projects by inspecting real source files and writing truthful evidence. Do not generate successful review records automatically. Timing/audio tests remain mandatory and independent of this gate.
