# Original sequential-composition studies

Source close inspection: *How to Draw Comics the Marvel Way*, Stan Lee and John Buscema, PDF scans96–106,109–114,118–121. Source illustrations are not included. The drawings are original adaptations, not literal copying of the supplied characters or panels. The rooftop solution had already been viewed; **this is not claimed as a blind assignment**.

## Exercise map

- **C09-01**, scans96–100: `06-three-mass-compositions` makes original triangle, diagonal and circular organizing masses, then removes small detail. Three value families separate focal dark/light figures from a middle-value shape and light ground. This is a limited analytical counterpart to the source's many finished-panel analyses, not a reproduction of each source panel.
- **C09-02**, scans101–102: `07-camera-pairs` compares doorway, phone and threatening figure scenes. Backgrounds use projected set cameras; the figures themselves remain authored 2D silhouettes/heads. A larger figure is not asserted to be true 3D foreshortening. Close phone framing reveals expression; a large foreground figure and angled doorway increase urgency.
- **C09-03**, scans103–104: `01-rooftop-plain` versus `02-rooftop-dramatic` preserves a six-beat action story but varies scale, placement and pose. An original rooftop confrontation replaces the source's intruder sequence. This adapted application should not be mislabeled a literal completion of every source panel.
- **C09-04**, scans105–106: `04-conversation-restrained` versus `05-conversation-urgent` tells an original relay warning: messenger arrives, question, explanation, alarm, decision, departure. The alarm is an original added causal transition. Both versions retain the same narrative order.
- **C10-01**, scans109–111: `10-rescue-page-stages` shows the whole original relay-rescue page as sticks, solid masses, then finished analytical ink. The captor is red, technician green, rescuers gold/dark; this corrects an initial identity ambiguity. `03-whole-page-stages` is a supplementary rooftop progression.
- **C10-02**, scans112–114: Original analogous rooftop warning, blast, recoil, cable and fall beats. The black/gold pair are new designs. No source art traced. The source solution was already known, so no blind-test claim.
- **C11-01**, scan118: `08-cover-thumbnails` compares four original covers: undersized figures; one dominant figure but weak relationship; missing opponent/dead space; selected diagonal two-person conflict. The critique is a design judgment, not a universal ranking.
- **C11-02**, scans119–121: `09-cover-development` carries the selected concept through rough, finish and safe-area overlay. Logo space is reserved. The 20-pixel demonstration safe margin is an implementation choice, **not a print-provider specification**. For print, obtain the actual trim/bleed template.

## Observed repairs and limits

Initial projected sets were too small beneath screen-space characters, creating a toy-room/floating-stage effect. Sets were rescaled after visual inspection. The rooftop tether initially missed an ankle and was repositioned around both feet. Artwork initially extended beyond several panel/cover borders; explicit clip paths now contain it. Captioning and color identities help explain sequence, but no independent blind-reader test has yet proven comprehension without them.

These are **composition and storyboard exercises**, with deliberately simplified humanoid silhouettes. They are not equivalent to the source's mature anatomy, naturalistic interaction or richly rendered comic pages. Character-floor contact remains hand-staged rather than solved from a 3D rig. The capstone should use refined character anatomy and more scene-specific geometry, not treat these silhouettes as the finished artistic ceiling.

## Reuse

Run `python scripts/story_studies.py` to regenerate ten sheets with SVG, PNG and provenance/beat JSON. Stable IDs isolate major actors and panels. `tests/test_story_studies.py` checks XML/ID uniqueness, differing panels, deterministic actors, staging transforms, cover clipping and absence of raster embeddings. Tests do not establish artistic merit.
