#!/usr/bin/env python3
"""Batch-generate Stable Audio 3 music + SFX clips with the LiteRT runtime.

Reads a clips JSON: [{"name": "music_duel", "dit": "sm-music",
"seconds": 100, "seed": 102, "prompt": "..."}] and calls the runtime's
sa3_tflite.py once per clip with the settings that worked in production
(w8a8 everywhere, 8 steps, cfg 1, offline). Existing clips are skipped, so
a batch is safe to re-run after an interruption. Per-clip wall times are
logged — measure your machine, don't guess.

Usage:
    python3 sa3_generate.py --runtime /path/to/stable-audio-3/optimized/tflite \
        --clips clips.json --out ./clips [--threads N]
"""
import argparse
import json
import os
import subprocess
import sys
import time


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runtime", required=True,
                    help="path to stable-audio-3/optimized/tflite")
    ap.add_argument("--clips", required=True, help="clips JSON file")
    ap.add_argument("--out", required=True, help="output directory for WAVs")
    ap.add_argument("--threads", type=int, default=os.cpu_count() or 2)
    args = ap.parse_args()

    runtime = os.path.abspath(args.runtime)
    py = os.path.join(runtime, ".venv/bin/python")
    script = os.path.join(runtime, "scripts/sa3_tflite.py")
    if not os.path.exists(py):
        py = sys.executable
    os.makedirs(args.out, exist_ok=True)

    env = dict(os.environ)
    env["HF_HUB_OFFLINE"] = "1"
    env["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
    env["OMP_NUM_THREADS"] = str(args.threads)
    env["OPENBLAS_NUM_THREADS"] = "1"
    env["MKL_NUM_THREADS"] = "1"

    with open(args.clips) as f:
        clips = json.load(f)
    for clip in clips:
        name = clip["name"]
        out = os.path.join(args.out, name + ".wav")
        if os.path.exists(out) and os.path.getsize(out) > 10000:
            print(f"SKIP {name} (exists)", flush=True)
            continue
        cmd = [py, script,
               "--prompt", clip["prompt"],
               "--dit", clip["dit"], "--decoder", "same-s",
               "--dit-precision", "w8a8", "--decoder-precision", "w8a8",
               "--seconds", str(clip["seconds"]), "--steps", "8",
               "--seed", str(clip["seed"]), "--cfg", "1",
               "--threads", str(args.threads), "--out", out]
        t0 = time.time()
        r = subprocess.run(cmd, env=env, capture_output=True, text=True)
        dt = time.time() - t0
        if r.returncode != 0:
            print(f"FAIL {name} after {dt:.1f}s\n{r.stdout[-800:]}\n{r.stderr[-800:]}",
                  flush=True)
            sys.exit(1)
        print(f"OK {name}: {clip['seconds']}s audio in {dt:.1f}s wall -> {out}",
              flush=True)
    print("BATCH_DONE", flush=True)


if __name__ == "__main__":
    main()
