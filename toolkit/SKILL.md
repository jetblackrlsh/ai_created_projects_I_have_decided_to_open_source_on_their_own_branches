---
name: draw-heroic-comics
description: Draw and edit original heroic American superhero-style comics with a headless vector drawing tool. Use for authored character construction, projected environments, dramatic action and comic-page layouts, lesson studies, covers and editable story adaptations without image-generation APIs. This is a separate workflow from headless manga; its renderer is a bounded drawing toolkit, not arbitrary text-to-image generation or a general anatomical 3D model.
---

# Draw Heroic Comics

Create original authored vector geometry, render it without a browser, inspect actual pixels and revise the drawing. Keep this tool distinct from the manga tool. Do not substitute generated raster art, tracing, ASCII conversion, or a renamed old preset for drawing with this skill.

## Plan and draw

1. Read `references/tool-contract.md` for supported scene objects and commands. Read `references/drawing-principles.md` before a new composition. Check `references/coverage-and-limits.md` before discussing what the book study established.
2. Write a cast specification: age, head silhouette, feature placement, body proportions, clothing, recurring prop and hand ownership. Decide which traits require newly authored paths rather than existing parameters. Use adult heroic proportions as a stylistic option, not a rule for children or all bodies.
3. Plan each panel's action, location, camera, value masses, focal point and reading order. Establish geography before close-ups; show anticipation, contact and consequence. Preserve screen direction, scale and background landmarks unless the cut clearly re-establishes them.
4. Start with action line and landmarks. Derive solids and contours from the same geometry. Use the shared perspective camera for world objects; do not label screen-space limb enlargement as true 3D foreshortening. Keep center of mass, load-bearing support, overlapping limbs and hand contact legible.
5. Give every scene object a stable ID. Author JSON with `heroic.py` or explicit original SVG paths. Export SVG/PNG and retain editable data. Use only the bundled modules and explicitly supported parameters, extending them when a required drawing is unsupported rather than silently substituting a preset.
6. Inspect full-resolution PNGs and thumbnails. Check neck/trapezius integration, shoulders, elbows, hips, knee ownership, far-eye placement, head angle, distinctive ages, props/hands, floor contact, vanishing points, text clipping and read order. A valid file or passing test is not evidence of good anatomy.
7. Revise the smallest relevant paths or parameters. For local edits, compare untouched object geometry and actual pixels outside the legitimate affected area. Preserve before/after files; do not redraw the whole page while calling it a patch.
8. For a complete comic, obtain an independent image-only reading pass before final delivery. Supply only the images and reading direction, not intended events. Compare that account with the private beat list afterward; repair ambiguous causes, contacts and location changes. Then verify the final PDF and deliver editable sources with the final art as requested.

## Book-based practice

The source study is an application of general construction and storytelling principles from *How to Draw Comics the Marvel Way*, not model training or proof of mastering its artists' execution. The source is primarily demonstrations and open-ended practice, not a finite numbered workbook. Maintain a separate private practice ledger for source evidence, subcases and status. Distinguish direct practice, original analogous applications, digital substitutes for physical experiments, and unsupported/unfinished work. Do not bundle book pages, OCR or copied examples with this tool.

For new lesson requests, inspect the actual supplied source before claiming it was studied. Do not equate one generic gallery with all exercises. Physical brush, glass-tilt and mirror exercises need explicit disclosure when replaced by digital analogs. Never claim a blind-before-solution exercise if the solution was already viewed.

## Test and measure

Run `python -m unittest discover -s "$SKILL_ROOT/tests" -v`, then render a fresh request and inspect its actual output. Separate rendering time from planning, authoring and revision time. When giving confidence, distinguish deterministic export/editability, understandable staging, and still-limited anatomical or stylistic execution.

Use authorized cloud execution. Do not infer personal-computer, paid API or publication permission from a rendering problem. Public release and external sharing are separate from creating a private drawing or skill.
