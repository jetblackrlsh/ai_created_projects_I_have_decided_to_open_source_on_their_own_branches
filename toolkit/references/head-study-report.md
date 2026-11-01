# Head module evidence and limits

Studied the accessible source PDF's scan pages 74–92 (the numbering is scan-page numbering, not printed pagination), including the head-placement diagrams, variations, profile/front stages, expressions, older-face changes and feature cautions. Original SVG paths were authored from principles; no book art was traced or embedded.

## Original application coverage
- Scan74: front/profile placement and sloped jaw -> head-study first row. Half-height eye rule approximated. Guides are visible overlays, not a full parametric skull model.
- Scan75,77,92: direction and planes -> five distinct authored views. Profile uses independently drawn outline, not a squeezed front view; up/down are limited schematic studies.
- Scan76: eye spacing, strong chin, simple features, hair volume -> adult construction row.
- Scans79–80: variable head silhouette -> square and pear examples in head-exercises; these are original designs, not the book's franchise characters. Moral character is not inferred from face shape.
- Scans82–85: staged profile/front -> five/six original construction stages in head-exercises. These are adapted progressions and not identical step-order reproductions. Female-head lesson applied through softer jaw and cleaner planes, not a claim that all women share one face type.
- Scans86–87: expression changes -> six expressions of one identity, adjusted eyebrows, lid opening and mouth.
- Scans88–89: age/design variation -> older scholar, child and bearded/crowned adults. No claim of full age spectrum mastery.
- Scans90–91: feature economy -> narrow eyes and restrained nose/lip marks; no raster reference embedded.
- Scan93: illustration gallery only, not copied.

## Literal exercise limitation
The mirror/self-observation instruction cannot be literally completed by an AI. Constructed expression studies are an adapted substitute. There is no claim of personal anatomical experience, trained model weights or mastering all anatomy.

## Quality review
Actual PNGs inspected. Corrected inverted angry/sad brow slopes, profile long-hair occlusion, construction centerline alignment and overlarge up-view nostrils. These remain clean vector cartoons rather than the book's skilled naturalistic brush drawing. Rear head view, continuous camera orbit, varied nose/ethnicity feature families, subtle lip/cheek motion and realistic hands remain limited. Eyes in the five-view set are more similar than ideal. Profile expressions are weaker than frontal expressions. Hands are three independent schematic extensions, not a claimed head-chapter exercise.

## API
`render_head(o)` returns SVG group. `id,x,y,scale,rotation,view,expression,identity,guides,stage`. Views front/threequarter/profile/up/down. Expressions neutral/angry/fear/smile/shout/sad. Identity supports age child/adult/elder, jaw broad/narrow, hair short/forelock/bald/long, beard none/short/long, crown boolean, skin and hair_color hex colors, shape square/pear or default. Head skull approximately y[-50,47], portrait neck down to58. `render_hand(o)` returns SVG group with pose fist/open/grip, same transform fields and skin.

Seven structural tests passed; these are not proof of aesthetic mastery.

## Second inspection/refinement pass
Following independent critique, the original image is not treated as final-quality proof. New `cast-head-study.png` demonstrates separate rounded child front/three-quarter/profile contours, a broad adult front jaw, older-face planes, long sage beard and stepped crown. Three-quarter far eye was narrowed and moved inward to fit its visible plane. Down-view features were lowered and compressed beneath an enlarged cranium; up-view features shift toward the dome while the chin underside becomes visible. Head silhouette and hair now change with tilt. These are authored foreshortening approximations, not a continuous 3D projection. `neck:false` removes the portrait collar when integrating a head with a whole figure.

The figure module's second pass replaces the rectangular neck/collar with a tapered neck and trapezius connection, smooths joint tangents, gives forearms/calves fuller proximal masses and adds asymmetric chest landmarks. Matched before/revised image: `anatomy-revision.png`. The figure's pose landmarks and existing pose catalog were not changed. This improves contour flow but does not solve the stylized torso or biomechanical realism.

## Identity controls added after cast review
Engineering extension: `identity.nose` supports small/medium/broad/long, `identity.brow` fine/medium/heavy, and `identity.eyes` open/medium/narrow. These alter authored feature geometry rather than only costume or hair. Nose contour changes also affect the profile silhouette; frontal/three-quarter eyes use variable aperture. Profile eye aperture remains a fixed approximation. This control system is an original implementation, not something the source book specifies as a programmatic API.
