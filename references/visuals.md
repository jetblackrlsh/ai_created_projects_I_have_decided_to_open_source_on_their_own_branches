# ASCII visuals and paired rendering

Use a new generated source for each shot, then convert each automatically. Preserve originals and immutable versions. Dependencies: Python, NumPy, Pillow, licensed monospace TTF; FFmpeg/ffprobe for movies. Pass `--font` if DejaVuSansMono-Bold is not installed.

```sh
python scripts/ascii_art.py convert source.png project/art/shot01
# produces .txt, .colors.json, .png and .report.json
python scripts/ascii_art.py patch project/art/shot01 local-patch.json project/art/shot01-v2
python scripts/ascii_art.py render project/art/shot01-v2 roundtrip.png
python scripts/render_pair.py project/project.json
```

Default 120×60 glyphs, 8×16 cells, native 960×960 art in 1080×1080 video. Brightness-ramp conversion preserves source detail. Each glyph is clipped within its cell; the movie moves in 8px horizontal steps, never fractional scaling or zoom. The renderer accepts this default size; another size requires an explicitly reviewed renderer adaptation, not silent resizing.

## Local patches only

Inspect the automatic conversion and declare a small repair region before editing. Never reconstruct a subject or redraw. Keep exact character/color data outside that region; accept remaining deformities if correction requires a redraw. A local patch JSON is:

```json
{"before_txt_sha256":"actual hash", "before_colors_sha256":"actual hash", "rois":[[4,33,26,37]], "cells":[{"x":5,"y":34,"char":";","rgb":[50,80,90]}]}
```

ROIs are half-open `[x0,y0,x1,y1]`. Obtain hashes with `sha256sum`. The helper enforces union ROI ≤5% and actual changes ≤2% of cells, input hashes, ASCII/RGB ranges, and exact outside-ROI character/RGB/pixel identity. These caps are guardrails, not permission to redraw within them. The helper retains a hashed immutable baseline and checks aggregate ROI and changed-cell budgets across successive patches; keep baseline TXT/color files with the project. Do not defeat these checks by modifying provenance. Record the reason for every patch, changed count and before/after comparison. The report propagates original image hash. Inspect rendered output at full size and verify text/RGB roundtrip.

## Renderer contract

Paths are relative to `project.json`. Use `title`, `credits` (truthful string list), `duration` (seconds), optional `fps` (24), optional `font`, and `shots` with unique `id`, contiguous `start`,`end`, and `image` pointing to an ASCII PNG. Keep adjacent `.report.json` for original source hash uniqueness. Without reports the renderer can detect only exact duplicate PNGs, not recrops of the same source; manually verify fresh-source provenance. Captions come from `out/mix.json` `speech` entries with speaker/text/start/end. `out/master.m4a` must be the single canonical 48kHz AAC master matching duration.

The renderer creates `out/film.mp4`, `out/audio-drama.mp4`, `out/title-card.png`. Both copy the SAME AAC stream; the companion uses one fitting ASCII background and title/credits throughout. Outputs may not exist: use a new project/version folder for revisions. Render does not certify timing, audibility, text legibility or clipping: run audio/video QA and inspect encoded representative frames separately. Never claim a waveform check is listening.
