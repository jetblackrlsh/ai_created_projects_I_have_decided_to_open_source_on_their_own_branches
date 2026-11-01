# Headless tool contract

Python standard library + installed Inkscape exports SVG to PNG. Pillow is used only by tests and PDF packaging, not to invent or replace drawing geometry. Run:

`python scripts/heroic.py assets/examples/figure-four-stage.json --out /absolute/output/stem`

Scene schema: `version:1`, positive `width`,`height` (maximum10000), optional `background`, `objects` array. Every object needs stable unique alphanumeric/dash/underscore `id` and a supported `kind`. `heroic.render`, `export`, `patch` and `hashes` are Python helpers. `patch` copies the scene, modifies exactly one named object and validates; it does not solve artwork-dependent occlusion.

Objects:
- `figure`: `x,y,scale,rotation`, `pose` stand/brace/run/strike/lift/leap/crouch/fall/sit/kick/climb/walk/throw/recline; optional explicit `joints` pairs (neck,ls,rs,le,re,lw,rw,lh,rh,lk,rk,la,ra), `identity` (build athletic/slim/broad/stocky, age child/adult/elder, head traits), `view`, `expression`, `suit,skin,shadow`, `lhand,rhand`, `guides`. View affects head/chest drawing, not a true body camera. Plain figures are study mannequins; author new clothing paths for actual clothing.
- `construction`: shared pose/joints with `stage:stick/volumes/scribble`; seeded exploratory marks, not simulated physical pencil.
- `head`: see `head-study-report.md` for bounded views/identity/expression and hand API.
- `world`: `x,y,width,height,scene:street/interior/stairs/transit`, `camera:{eye,target,fov}`, optional `faces`, `guides`. `world.Camera` supplies genuine projection; face painter order does not solve intersecting meshes.
- `portal`: `x,y,width,height,rotation,seed`; `ghost`: `x,y,scale,rotation,opacity`; `lightning`: `x,y,width,height`.
- `path`: original SVG `d`, `fill,stroke,width`; `rect`: `x,y,width,height,fill,stroke,stroke_width`; `text`: `x,y,text,size,weight,fill`.

For construction-only articulated3D studies, import `foreshortening.py` separately: oriented tubes and world-space joints, not surface anatomical rendering. Read that module's accompanying coverage/API report. Keep these construction renders distinct from finished anatomy.

SVG source is fully editable; JSON controls parameterized objects. New poses can use explicit landmarks, but credible anatomy, clothing folds, contact and expressive acting still need drawing and inspection. No claim of arbitrary prompt-to-finished-art automation.

Panels and text:
- `panel`: `x,y,width,height,background,objects`. Children are clipped and namespaced under the panel ID; border is drawn last. Panel-local coordinates make camera crops and page rearrangement editable without redrawing subjects.
- `caption`: `x,y,width,text,size,fill,bubble`. Text wraps into an automatically sized box. Inspect actual output: approximate character widths are not a proof against overflow, and no automatic collision solver moves artwork away from text.
