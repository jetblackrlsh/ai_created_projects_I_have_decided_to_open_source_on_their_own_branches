# Harbor at Dawn — neutral drawing showcase

Two original 1400×900 vector panels for a 12-second motion-comics demonstration. The first panel holds a closed gate; the second opens it 35 degrees around a fixed right-hand hinge. The keeper has a consistent elderly face, cap, raincoat, articulated fingers and a deliberately changed sleeve pose reaching the projected latch.

**Status: the two original neutral panels were visually reviewed and approved for this public example. This is acceptance of this bounded example, not a claim of publisher-equivalent artistic mastery.**

## Reproduce

Python standard library plus Inkscape CLI are required. Obtain the `heads.py`, `figures.py`, `world.py`, and `inks.py` modules from the Heroic Comics Drawing toolkit. Run:

```sh
python build.py --modules /path/to/heroic-comics-drawing/scripts
```

`scene.json` controls camera, character identity, gate geometry, panel states and timing. `build.py` contains the editable original garment, harbor, lighthouse, ink and caption paths. SVGs remain directly editable. Construction overlays show the actual head guides, sleeve landmark chains, and projected gate hinge. `construction-receipt.json` binds source, modules, SVGs and PNGs to SHA-256 digests.

## Shared code actually producing geometry

- `world.Camera`, `box`, `cylinder`, `render_faces`, `line3`: projected pier paving, curbs, bollards, gate rails/slats/posts, cylindrical hinges and hinge straps. Both panels use the same camera and gate pivot.
- `heads.render_head`: three-quarter elderly adult face, ears, eye/nose/jaw planes, beard and expression. `heads.render_hand`: gripping latch and resting fingers.
- `figures.limb`: tangent-connected coat-sleeve contours derived from shoulder/elbow/wrist coordinates, rather than stick limbs or mascot shapes.
- `inks.feather`: tapered coat-side hatching.
- Bespoke paths: coat lapels/pockets/folds/shadow planes, cap, lighthouse and environmental accents; no source-book tracing or imported private geometry.

## Honest scope

Stylized vector/cel comic illustration, not a claim to naturalistic brush-ink mastery. These are two keyframes, not continuous character animation. Both use one camera for mechanical continuity. For a longer story, varied camera shots and additional poses are still needed. Rain and sunrise intentionally coexist as a passing dawn shower.

No image-generation service, private story artwork, paid model, user computer, copyrighted book scan, or model checkpoint is used or included.
