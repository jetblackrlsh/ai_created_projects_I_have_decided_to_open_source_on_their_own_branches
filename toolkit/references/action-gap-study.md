# C06 action gap applications

Source scans63–64 inspected at readable resolution. Original analogues, no copying of franchise figures or source artwork.

- `front-five-stage.png` and `rear-five-stage.png`: separate line, volume, draw-through detail, contour selection and black-mass decisions. Front uses shared run landmarks; rear has custom nape, rear hair/skull, scapulae, spine and latissimus, not a front face with a rear label. Five-stage staging is an original pedagogical breakdown of the action/construction principles rather than a claim those two scan pages prescribe this exact process.
- `rear-wall-climb.png`: actual wall grips under both hands and boots, authored joints/holds sharing measured coordinates. Fingers cross the holds; soles meet lower holds.
- `paired-support-impact.png`: one two-arm carry and one blocked strike. Child/back and knee/leg zones overlap carrier grips; striker fist meets defender forearm. Deliberate part layering keeps ownership visible. The supported rather than restrained counterpart applies the source's two-person construction family without copying its characters.

## Pixel/numerical evidence
`check_action_contacts.py` independently rasterizes actual actor and grip geometry, intersects alpha masks within fixed contact regions, and writes `outputs/action-contact-evidence.json`. Climb intersections381/383/152/190pixels; blocked-strike147pixels; two support-grip intersections196/820pixels. Coordinates are also checked in tests. This shows rendered geometric overlap, not physically correct pressure, mass or biomechanics. Actual complete PNGs inspected. Front-sheet cropping caught and corrected by reducing scene scale while preserving all landmarks.

## Limits
Fixed original choreography, not a reusable inverse-kinematics or collision solver. Rear arm orientation remains schematic, carry wrists are simplified, and blocked strike is still posed rather than naturally fluid. These studies demonstrate finite lesson families, not all possible action anatomy.
