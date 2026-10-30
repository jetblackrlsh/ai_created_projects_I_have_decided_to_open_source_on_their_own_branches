#!/usr/bin/env python3
"""Assemble a film's stems and mix them in stages.

Inputs:
- a voice track (the canonical timeline; never modified),
- music cues JSON: [{"file": "cue.wav", "at": 60.0, "fade": 2.0}]
  (each cue RMS-normalized to -19 dBFS, placed at its timestamp,
  crossfaded over whatever is already in the bed),
- sfx events JSON: [{"file": "clash.wav", "at": 66.6, "gain": 0.8,
  "src_off": 0.0}] (one clip reused at several timestamps with different
  source offsets gives natural variation).

Mixing is STAGED through intermediate files, always:
  1. music bed sidechain-ducked under the voice -> music_ducked.wav
  2. voice + ducked music + sfx bed -> alimiter -> master
Never feed one filtergraph output to two downstream filters in a single
graph (a mix used as both sidechain source and amix input can silently
drop a track). Verify the master afterwards: voice RMS in narration
windows should match the voice track's, and cross-correlation against
the voice track should peak strongly at a small lag (filter latency of
a few ms is normal; absence of a peak means the voice is missing).

Usage:
    python3 mix_audio.py --voice voice.wav --music music.json \
        --sfx sfx.json --duration 213 --out final_mix.wav
"""
import argparse
import json
import os
import subprocess

import numpy as np
import soundfile as sf

SR = 48000


def load48(path, cache_dir):
    """Load any WAV as 48 kHz stereo float64 (ffmpeg resample, cached)."""
    base = os.path.splitext(os.path.basename(path))[0]
    dst = os.path.join(cache_dir, base + "_48k.wav")
    if not os.path.exists(dst):
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", path,
                        "-ar", str(SR), "-ac", "2", dst], check=True)
    d, _ = sf.read(dst)
    if d.ndim == 1:
        d = np.stack([d, d], axis=1)
    return d.astype(np.float64)


def place(bed, sig, t0, gain=1.0, src_off=0.0, fade=0.0):
    n = len(bed)
    i = int(t0 * SR)
    if i >= n:
        return
    seg = sig[int(src_off * SR):]
    j = min(n, i + len(seg))
    if j <= i:
        return
    seg = seg[: j - i] * gain
    fn = int(fade * SR)
    if fade and fn > 0 and i > 0:
        ramp = np.linspace(0.0, 1.0, fn)[:, None]
        bed[i:i + fn] = bed[i:i + fn] * (1 - ramp) + seg[:fn] * ramp
        bed[i + fn:j] = seg[fn:]
    else:
        bed[i:j] += seg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", required=True)
    ap.add_argument("--music", required=True, help="music cues JSON")
    ap.add_argument("--sfx", required=True, help="sfx events JSON")
    ap.add_argument("--duration", type=float, required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--music-rms-db", type=float, default=-19.0)
    ap.add_argument("--limit", type=float, default=0.72)
    args = ap.parse_args()

    work = os.path.join(os.path.dirname(os.path.abspath(args.out)), "mix_work")
    os.makedirs(work, exist_ok=True)
    n = int(SR * args.duration)

    with open(args.music) as f:
        cues = json.load(f)
    with open(args.sfx) as f:
        events = json.load(f)

    music = np.zeros((n, 2))
    for cue in cues:
        sig = load48(cue["file"], work)
        rms = np.sqrt((sig ** 2).mean()) + 1e-12
        sig = sig * ((10 ** (args.music_rms_db / 20)) / rms)
        dur = cue.get("dur")
        if dur:
            sig = sig[: int(dur * SR)]
        place(music, sig, cue["at"], gain=cue.get("gain", 1.0),
              fade=cue.get("fade", 0.0))
    music_path = os.path.join(work, "music_bed.wav")
    sf.write(music_path, music.astype(np.float32), SR)

    sfx = np.zeros((n, 2))
    cache = {}
    for ev in events:
        if ev["file"] not in cache:
            cache[ev["file"]] = load48(ev["file"], work)
        place(sfx, cache[ev["file"]], ev["at"], gain=ev.get("gain", 1.0),
              src_off=ev.get("src_off", 0.0))
    sfx_path = os.path.join(work, "sfx_bed.wav")
    sf.write(sfx_path, sfx.astype(np.float32), SR)

    ducked = os.path.join(work, "music_ducked.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error",
                    "-i", music_path, "-i", args.voice,
                    "-filter_complex",
                    "[0:a][1:a]sidechaincompress=threshold=0.02:ratio=8:"
                    "attack=20:release=400[duck]",
                    "-map", "[duck]", ducked], check=True)
    subprocess.run(["ffmpeg", "-y", "-v", "error",
                    "-i", args.voice, "-i", ducked, "-i", sfx_path,
                    "-filter_complex",
                    "[0:a]pan=stereo|c0=c0|c1=c0[v];"
                    "[v][1:a][2:a]amix=inputs=3:normalize=0,"
                    f"alimiter=limit={args.limit}:level=false[master]",
                    "-map", "[master]", "-ar", str(SR), args.out], check=True)
    print(f"MIX_DONE -> {args.out}")
    print("Verify before encoding: voice RMS in narration windows vs the "
          "voice track; cross-correlation peak at a small lag; effect "
          "windows louder than the seconds before them.")


if __name__ == "__main__":
    main()
