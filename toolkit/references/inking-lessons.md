# Applied inking studies

Source: *How to Draw Comics the Marvel Way*, Stan Lee and John Buscema, Internet Archive item `HowToDrawComicsTheMarvelWay`, PDF scans 124–133. These are original digital applications of general lessons, not copied illustrations. They do not reproduce the book and do not demonstrate physical ink/brush handling.

## Coverage and evidence

- **C12-01, scans124–125:** Digital pen/brush analogs and white correction. `01-stroke-laboratory` includes ruled/tapered lines and an editable white correction shape. Physical pressure, wet media, paper tooth and real eraser practice remain unperformed.
- **C12-02, scan125:** Twelve original swatches cover four feathering variants, four broad side-sweep variants, ruled taper, broken texture, cross-hatching and white scratches; two further variants cover pressure progression and correction. This is an adaptation of the source's twelve-swatch practice, not a literal duplication of each source stroke.
- **C12-03, scans126–128:** `02-ink-balance` compares the same original harbor scene with uniform contours, grouped black masses and excessive hatching, at full and thumbnail size. The dark face-surrounding field survives reduction; uniform lines provide weaker focus, while excessive hatch lines compete with it.
- **C12-04, scans129–130:** `03-mood-and-masses` and `04-light-and-group` test an illuminated opening around a face, a menace silhouette, a side-lit body and a three-person group linked by a dark field. Grouped heads remain deliberately stylized and near-frontal; shadow geometry is authored, not physically solved illumination.
- **C12-05, scan131:** Toggle two small left balancing shapes in the same original scene. `patch-proof.json` records actual PNG difference bounds `[12,122,73,203]`; every pixel outside that rectangle is unchanged. Unit tests additionally compare unchanged SVG path geometry. Removing a mass changes balance, not underlying scene construction.
- **C12-06, scans132–133:** Four original compositions and matching abstract reductions: calm vertical/horizontal rhythm, circular chaos, threatening narrow light wedge, diagonal action. These show value-direction planning; they are analytical miniatures rather than fully realized sequential scenes.

## Tool interface

`inks.stroke(a,b,width,bend,id)` returns an editable closed quadratic tapered mark. Nonzero length is required. `feather`, `hatch` and `swatch` create deterministic indexed strokes. `scene` and `mood` are original demonstration constructors, not universal scene generators. `silhouette` is one original cloaked figure design.

For new art, author shadow masses around the actual pose and light direction. Do not simply apply the demonstration's cloak or black shapes to every scene. Keep light-facing focal features readable. Test full size and thumbnail. Black masses need a reason: form, focus, grouping, balance or mood. Extra texture is not automatically extra quality.

## Confidence and limits

High confidence in editable SVG stroke construction, deterministic output, structural patch isolation and the demonstrated raster invariant. Moderate confidence in these simple value-composition exercises. Lower confidence in naturalistic brush dynamics, anatomically exact shadow placement and densely populated finished action art; none is established by these tests. The source discusses visual choices more than algorithmic implementations, so deterministic quadratic stroke shapes, seeded textures and pixel-difference validation are implementation decisions, not techniques attributed verbatim to the book.

Reproduce: `python scripts/build_inking.py`. Tests: `python tests/test_inks.py`.
