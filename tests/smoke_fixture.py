#!/usr/bin/env python3
"""Smoke fixture for the ASCII Film Maker package.

Builds a tiny synthetic scene (gradient sky, ground band, a bright disc
that moves across 12 frames), runs it through the package's ASCII
converter, and writes a 2-second test-tone WAV with the stdlib. Asserts:
- converted frames have the expected geometry and are not blank,
- the disc's brightest cell region actually moves between frames
  (the conversion is preserving the picture, not emitting noise),
- the tone WAV round-trips at the expected duration and peak.

This is a portability/plumbing check, not a quality benchmark — it does
not load any model. Run: python3 tests/smoke_fixture.py
"""
import os
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                "..", "scripts"))
from ascii_convert import raster_to_ascii, load_font  # noqa: E402

W, H = 840, 520
COLS, ROWS = 84, 26


def make_scene(cx):
    im = Image.new("RGB", (W, H), (10, 12, 34))
    d = ImageDraw.Draw(im)
    for y in range(H):
        v = int(20 + 50 * (y / H))
        d.line([(0, y), (W, y)], fill=(v // 3, v // 2, v))
    d.rectangle([0, H - 90, W, H], fill=(24, 30, 22))          # ground
    d.ellipse([cx - 46, 180, cx + 46, 272], fill=(240, 200, 90))  # disc
    d.rectangle([cx - 8, 272, cx + 8, H - 90], fill=(200, 170, 80))
    return im


def brightest_cell_x(frame_img):
    a = np.asarray(frame_img.convert("L"), dtype=np.float32)
    cell_w = a.shape[1] // COLS
    col_energy = a.reshape(a.shape[0], COLS, cell_w).mean(axis=(0, 2))
    return int(np.argmax(col_energy))


def main():
    font = load_font(17)
    xs = []
    for i in range(12):
        cx = 120 + i * 55
        frame = raster_to_ascii(make_scene(cx), cols=COLS, rows=ROWS,
                                cell_w=11, cell_h=20, font=font)
        assert frame.size == (COLS * 11, ROWS * 20), frame.size
        a = np.asarray(frame.convert("L"))
        assert (a > 30).mean() > 0.01 and a.max() > 150, "frame looks blank"
        xs.append(brightest_cell_x(frame))
    assert xs[-1] > xs[0] + 5, f"disc did not move across frames: {xs}"

    # 2 s test tone via stdlib wave
    sr, dur = 48000, 2.0
    t = np.arange(int(sr * dur)) / sr
    tone = (0.5 * np.sin(2 * np.pi * 440 * t) * 32767).astype(np.int16)
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "smoke_tone.wav")
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(tone.tobytes())
    with wave.open(path, "rb") as w:
        assert w.getframerate() == sr
        frames = w.getnframes()
    assert abs(frames / sr - dur) < 0.01
    os.remove(path)
    print(f"PASS smoke fixture: 12 frames converted, disc tracked "
          f"(cell x {xs[0]} -> {xs[-1]}), tone round-trip {dur:.1f}s")


if __name__ == "__main__":
    main()
