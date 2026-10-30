# Visuals: shaded raster → color ASCII

## Why conversion beats drawing in glyphs

Characters drawn directly from ASCII characters read as stick figures —
flat, sparse, and crude next to scenes converted from shaded art. The
reference production's first cut used glyph-drawn figures and was
rebuilt; the converted second cut is the one that works. Conversion keeps
silhouette, shading and costume detail; glyphs only quantize it.

## The pose rig

Draw each character with a dedicated function:

- Fixed proportions and palette per character (record them in one place —
  a `PALETTES` dict — so every pose matches).
- Named poses as the choreography vocabulary: `idle`, `walk`, `strike`,
  `block`, `charge` (weapon gathering light), `hit` (stagger), `kneel`,
  `freeze` (blade held at a throat). A duel is a sequence of pose +
  position + facing keyframes, interpolated by the stage code.
- Signature props are part of the character drawing, not set dressing:
  if a story object hangs on a character's chest, the rig draws it in
  every pose, and the stage keeps its state changes visible (intact →
  cut → fallen).
- supporting characters get the same treatment at smaller scale (the
  reference film's daughter has her own mini-rig: standing, running,
  arms-open).

Draw at scene resolution (reference: 1680×1040) with soft shading —
radial gradients for ground shadows, layered shapes for robes and hair.
Flat vector-bright palettes convert best; if a first conversion looks
sparse, brighten the palette and increase shading contrast **before**
touching the converter. One brightening pass fixed the reference film.

## The conversion (exact recipe)

Implemented in `scripts/ascii_convert.py`:

1. Downscale the composed scene to the grid with LANCZOS
   (168×52 cells over a 1680×1040 scene in the reference).
2. `norm = clip((lum − 10) / 245, 0, 1) ** 0.7` — the 0.7 gamma lifts
   mid-tones so shaded figures keep their modeling.
3. Glyph = `RAMP[norm × 10]`, `RAMP = " .·:;+*x%#@"`.
4. Color = cell-mean RGB × 1.4, clipped; if a cell is lit (lum > 26) but
   its brightest channel is under 46, scale the color up so the max
   channel is 46 — dark blue/black costumes stay distinguishable from
   the background.
5. Render glyphs in a bold monospace font (DejaVu Sans Mono Bold 17 px)
   into 11×20 px cells on a near-black blue background `(6, 5, 12)`.

Output at 12 fps is enough motion for the aesthetic and halves both
render and encode time versus 24 fps.

## Scene composition notes

- One ground line, kept constant (`GROUND_Y`); all actors' feet anchor
  to it. Teleports and leaps are vertical offsets from it.
- Effects as raster shapes before conversion: crescent arcs, fan-blade
  wedges, ground cracks (jagged polylines), petal particles. Drawn
  effects convert into textured ASCII effects for free.
- A held moment reads better than constant motion: the reference film
  freezes both fighters for the blade-at-throat beat and lets the
  narration carry it.

## Captions and faces

- Subtitles sit in a fixed band; before shipping, check caption geometry
  against face positions at full size on every captioned beat.
- Contact sheets are not sufficient evidence. This failure has happened:
  every story panel in a comic passed contact-sheet review while a
  caption covered a face in each one. Full-size, per-beat checks (or a
  geometric caption-vs-face test) are the standard.
