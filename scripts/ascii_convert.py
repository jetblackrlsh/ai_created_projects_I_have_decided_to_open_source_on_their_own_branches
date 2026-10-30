#!/usr/bin/env python3
"""Convert shaded raster art into detailed color ASCII frames.

The method that makes ASCII films look rich instead of stick-figure crude:
compose each frame as shaded raster art (drawn in code — characters from a
pose rig, scenery, effects), then map it cell-by-cell to ASCII density +
color:

- downscale the scene to the cell grid (LANCZOS);
- luminance normalized as clip((lum - 10) / 245, 0, 1) ** gamma (0.7);
- glyph per cell from the density ramp " .·:;+*x%#@";
- glyph color = cell average RGB x 1.4 (clipped), with dark colors lifted
  so their brightest channel reaches ~46 (keeps dark costumes readable
  against a near-black background);
- glyphs drawn in a bold monospace font, one per cell.

Reference geometry: 1680x1040 scene -> 168x52 cells -> 1848x1040 output,
cells 11x20 px, DejaVu Sans Mono Bold at 17 px.

Usage (single image or a folder of frames):
    python3 ascii_convert.py input.png output.png
    python3 ascii_convert.py frames_raster/ frames_ascii/ --cols 168 --rows 52
"""
import argparse
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

RAMP = " .·:;+*x%#@"
DEFAULT_FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSansMono-Bold.ttf",
]


def load_font(size, path=None):
    candidates = [path] if path else []
    candidates += DEFAULT_FONT_CANDIDATES
    for c in candidates:
        if c and os.path.exists(c):
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()


def raster_to_ascii(scene: Image.Image, cols=168, rows=52, cell_w=11,
                    cell_h=20, gamma=0.7, font=None, bg=(6, 5, 12),
                    color_boost=1.4, dark_lift=46):
    """Convert one raster scene (PIL image) to an ASCII frame (PIL image)."""
    if font is None:
        font = load_font(17)
    small = scene.resize((cols, rows), Image.LANCZOS)
    lum = np.asarray(small.convert("L"), dtype=np.float32)
    col = np.asarray(small.convert("RGB"), dtype=np.float32)
    norm = np.clip((lum - 10.0) / 245.0, 0, 1) ** gamma
    idx = np.clip((norm * (len(RAMP) - 1)).astype(int), 0, len(RAMP) - 1)
    out = Image.new("RGB", (cols * cell_w, rows * cell_h), bg)
    od = ImageDraw.Draw(out)
    col = np.clip(col * color_boost, 0, 255)
    for yy in range(rows):
        for xx in range(cols):
            ch = RAMP[idx[yy, xx]]
            if ch == " ":
                continue
            c = col[yy, xx]
            if lum[yy, xx] > 26 and c.max() < dark_lift:
                c = c * (dark_lift / max(c.max(), 1))
            od.text((xx * cell_w, yy * cell_h - 2), ch, font=font,
                    fill=(int(c[0]), int(c[1]), int(c[2])))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--cols", type=int, default=168)
    ap.add_argument("--rows", type=int, default=52)
    ap.add_argument("--cell-w", type=int, default=11)
    ap.add_argument("--cell-h", type=int, default=20)
    ap.add_argument("--gamma", type=float, default=0.7)
    ap.add_argument("--font", default=None)
    ap.add_argument("--font-size", type=int, default=17)
    args = ap.parse_args()

    font = load_font(args.font_size, args.font)
    kw = dict(cols=args.cols, rows=args.rows, cell_w=args.cell_w,
              cell_h=args.cell_h, gamma=args.gamma, font=font)
    if os.path.isdir(args.input):
        os.makedirs(args.output, exist_ok=True)
        names = sorted(n for n in os.listdir(args.input)
                       if n.lower().endswith((".png", ".jpg", ".jpeg")))
        for i, n in enumerate(names):
            frame = raster_to_ascii(Image.open(os.path.join(args.input, n)), **kw)
            frame.save(os.path.join(args.output, os.path.splitext(n)[0] + ".png"))
            if i % 200 == 0:
                print(f"{i}/{len(names)}")
        print(f"converted {len(names)} frames")
    else:
        raster_to_ascii(Image.open(args.input), **kw).save(args.output)
        print(f"wrote {args.output}")


if __name__ == "__main__":
    main()
