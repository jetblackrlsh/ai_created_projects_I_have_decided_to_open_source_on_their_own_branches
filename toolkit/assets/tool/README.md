# Heroic Motion Comics

Headless adaptation of original heroic American-comics panels into narrated motion comics and companion title-card audio dramas. Preserve a supplied complete AAC soundtrack exactly, or use the included MIT-licensed local-audio engine for a new soundtrack.

Start with [the heroic workflow](docs/heroic.md). The original drawing dependency is separate; supplied page JSON/PNG pairs work without it. See [model/runtime terms](references/models.md) before optional local model use.

```sh
pip install -r requirements.txt
python -m unittest discover -s tests -v
python heroic_motion.py validate-exact examples/heroic-showcase/project.json
```

Requires Python, Pillow/NumPy/SciPy and local FFmpeg/ffprobe. Inkscape is needed to rerender vector pages. No browser, online API, credentials or model weights are bundled. No affiliation with any comics publisher. Styles are implemented as original stylized vector art, not a claim of naturalistic drawing mastery.

The default heroic mode now requires [drawing and visual-review evidence](docs/style-review.md). This is a human/agent observation record, not algorithmic style certification. Existing examples explicitly use generic-panel engineering mode; do not cite them as accepted heroic-art benchmarks.

The `examples/heroic-showcase` package is the reviewed original art demonstration. It retains editable drawing source, construction overlays and hash-bound review. `heroic-harbor` and `harbor` are older engineering-only fixtures.
