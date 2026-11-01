# Heroic Comics Drawing

A headless, editable SVG/JSON construction toolkit and agent skill for working toward original stylized American heroic-comic compositions. This is authored vector construction, not an image-generation model, tracing tool, or promise of master-level anatomy.

## Quick start

Requires Python 3.10+ and Inkscape on PATH for PNG export. Install Pillow only for the pixel comparison tests.

```sh
python -m pip install -r requirements-dev.txt
python -m unittest discover -s tests -v
python scripts/heroic.py assets/examples/figure-four-stage.json --out outputs/first-study
```

The export creates editable JSON, SVG and PNG. Read SKILL.md for the agent workflow and references/tool-contract.md for supported objects. The included neutral scene demonstrates gesture, construction, contour and refinement. More study scripts are in scripts/; create an outputs directory before standalone study scripts if necessary. Some assets/examples are module-study data rather than complete scene inputs; only version:1 scene objects are accepted by heroic.py.

## Capabilities and boundaries

Figures, bounded heads and hands, architectural cameras, construction volumes, panels, captions, original path shapes, action phases, generic lightning/portal/ghost effects, inking and composition studies. The private project's character presets, distinctive artifact and story-specific materials are deliberately not bundled; author your own identities and clothing with generic modules and SVG paths.

51 tests passed in the sanitized package, including patch geometry and raster invariance. A fresh quick-start PNG was rendered and inspected. Passing tests prove engineering properties, not artistic mastery. See references/coverage-and-limits.md.

## Agent installation

Copy this directory to the skill location supported by your agent and retain SKILL.md, scripts/, references/, assets/ and tests/ together. No hosted service, account keys, browser or paid API is needed. Installation varies by host; no automatic remote installation is performed.

## License and provenance

MIT for this toolkit's original content; see LICENSE and references/SOURCES-AND-LICENSES.md. Inspired by studying general principles in *How to Draw Comics the Marvel Way*, not a Marvel product or affiliation. No book content is redistributed.

## Visual acceptance is not automatic

The renderer can also draw unrelated flat shapes; it does not enforce a publisher's art style. Follow [the required visual review](references/visual-style-review.md), retain construction evidence and inspect a representative finished panel before a full production. The bundled studies are engineering/construction examples, not a claim that all output meets the requested aesthetic. A reviewed original two-panel [harbor keeper showcase](assets/examples/harbor-showcase/README.md) now demonstrates coat form/shadows, projected depth and a hand tracking a hinged gate. It remains simplified vector art, not publisher-equivalent mastery.
