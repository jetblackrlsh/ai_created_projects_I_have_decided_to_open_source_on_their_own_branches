# Visual evidence gate (not an artistic classifier)

The default `visualTreatment` is `heroic`. It requires actual drawing evidence and an inspected representative panel before scaling up, followed by review of every final panel. Passing this gate means supplied evidence is present, current, and records acceptance—not that software has recognized a style or certified the honesty of a reviewer.

Inspect an appropriate reference image and record the actual visible target. Retain original drawing source, a corresponding construction view, and a demanding representative finished image. Inspect at intended display size. Name the shared functions/parameters that created visible geometry, or identify bespoke paths and their construction. Merely importing a module is not provenance. Unsupported shapes may use authored paths; those paths must still meet the brief.

After inspecting each final image, write a project-relative review JSON with `schemaVersion:1`, `status:"accepted"`, nonempty `reviewer`, `reviewedAt`, `brief`, `referenceObservations`, and `limitations`. `reference` is an inspected image asset record. `representative` is a panel-review record; `panels` contains exactly one record for every distinct image used by final shots. A rejected or unresolved panel must be revised, not marked accepted to unblock export.

Asset records use `{ "file": "relative/path", "sha256": "actual current digest" }`. Panel-review records contain:
- `status:"accepted"` only after actual inspection.
- `image`, `construction` (both image asset records), and `source` (editable drawing source asset record).
- `drawingProvenance`: `method` is `shared-modules`, `bespoke-paths`, or `mixed`; `visibleGeometry` explains actual produced shapes; `functionsAndParametersOrPaths` identifies their construction/code.
- `observations`: concrete text for `proportionsIdentity`, `connectedFormsContacts`, `gestureExpression`, `inkFormShadows`, `perspectiveDepth`, `speciesDesign`, and `storyTone`. Describe what is visible, including limitations; “true” or a pass checkbox is not an observation.
- `unresolvedIssues`: list of outstanding concerns; it must be empty to render as heroic. Record bounded accepted limitations in the top-level field instead of pretending mastery.

If a user rejected a preview, set `previouslyRejectedByUser:true` and record the actual subsequent resolution in `userResolution`. Do not invent user approval or silently switch style. The skill instructs that a rejected style concern must be resolved before full production.

Bind the review into the project with `styleReview` (relative JSON path) and `styleReviewSha256`. Image, source, construction, reference, or review changes invalidate recorded hashes. Reinspect the changed material; do not just recalculate hashes to bypass review. The gate is shared by exact-soundtrack and new-audio render paths.

## Explicit generic compatibility

Only when generic panel assembly is actually requested/appropriate, set `visualTreatment:"generic-panel"` with a truthful `genericPanelReason` of at least20characters. This labels the output **PANEL MOTION COMIC**, never automatically HEROIC. It is not an implicit fallback for a failed heroic brief. Existing harbor examples are engineering fixtures for sound/timing/crop behavior, not approved style benchmarks. A stronger example will be added only after actual art preview/review, not manufactured review records.

Mechanical text-length checks discourage empty records but do not measure descriptive quality. Hashes bind evidence, not artistic truth. Story readability, style, caption readability, audio listening and codec/timing QA remain distinct judgments.
