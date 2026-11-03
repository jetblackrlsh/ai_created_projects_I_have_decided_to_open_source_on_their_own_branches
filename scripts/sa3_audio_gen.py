#!/usr/bin/env python3
"""Batch-generate Stable Audio 3 Small-Music and Small-SFX clips on CPU via LiteRT.

Uses `stabilityai/stable-audio-3-optimized` (`sa3-sm-music` and `sa3-sm-sfx` w8a8 DiTs)
and records full provenance (prompt, seed, model, RMS, peak, transient offset) for every clip.
"""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf


def analyze_audio(wav_path: Path) -> dict:
    data, sr = sf.read(str(wav_path), dtype="float64")
    if data.ndim > 1:
        mono = np.mean(data, axis=1)
    else:
        mono = data
    peak = float(np.max(np.abs(data))) + 1e-12
    rms = float(np.sqrt(np.mean(data ** 2))) + 1e-12
    peak_db = round(20.0 * np.log10(peak), 2)
    rms_db = round(20.0 * np.log10(rms), 2)

    # Locate peak energy 150ms transient window for accurate SFX alignment
    win = max(1, int(0.15 * sr))
    if len(mono) > win:
        energy = np.convolve(mono ** 2, np.ones(win) / win, mode="valid")
        best_idx = int(np.argmax(energy))
        transient_offset = round(max(0.0, (best_idx / float(sr)) - 0.04), 3)
    else:
        transient_offset = 0.0

    return {
        "sample_rate": int(sr),
        "duration": round(len(data) / float(sr), 3),
        "peak": round(peak, 4),
        "peak_db": peak_db,
        "rms": round(rms, 4),
        "rms_db": rms_db,
        "transient_offset": transient_offset,
        "sha256": hashlib.sha256(wav_path.read_bytes()).hexdigest(),
    }


def generate_clip(py_bin: Path, sa3_script: Path, dit: str, name: str, prompt: str,
                  seconds: float, seed: int, out_wav: Path, threads: int, steps: int = 8):
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    meta_path = out_wav.with_suffix(".json")
    if out_wav.exists() and out_wav.stat().st_size > 16000 and meta_path.exists():
        print(f"[SKIP] {dit}:{name} already generated ({out_wav.name})", flush=True)
        return json.loads(meta_path.read_text())

    env = dict(os.environ)
    env.update(
        HF_HUB_OFFLINE="1",
        HF_HUB_DISABLE_IMPLICIT_TOKEN="1",
        OMP_NUM_THREADS=str(threads),
        OPENBLAS_NUM_THREADS="1",
        MKL_NUM_THREADS="1",
    )
    cmd = [
        str(py_bin),
        str(sa3_script),
        "--prompt", prompt,
        "--dit", dit,
        "--decoder", "same-s",
        "--dit-precision", "w8a8",
        "--decoder-precision", "w8a8",
        "--seconds", str(seconds),
        "--steps", str(steps),
        "--seed", str(seed),
        "--cfg", "1",
        "--threads", str(threads),
        "--out", str(out_wav),
    ]
    t0 = time.time()
    res = subprocess.run(cmd, env=env, capture_output=True, text=True)
    elapsed = round(time.time() - t0, 2)
    if res.returncode != 0:
        raise RuntimeError(
            f"Stable Audio 3 failed on {dit}:{name} after {elapsed}s:\n"
            f"STDOUT:\n{res.stdout[-800:]}\nSTDERR:\n{res.stderr[-800:]}"
        )

    stats = analyze_audio(out_wav)
    record = {
        "name": name,
        "model": f"stabilityai/stable-audio-3-optimized ({dit} w8a8 LiteRT)",
        "dit": dit,
        "prompt": prompt,
        "seconds": seconds,
        "seed": seed,
        "steps": steps,
        "elapsed_sec": elapsed,
        "file": out_wav.name,
        **stats,
    }
    meta_path.write_text(json.dumps(record, indent=2))
    print(
        f"[SA3 OK] {dit}:{name} ({seconds}s) in {elapsed:.1f}s | "
        f"peak={stats['peak_db']} dBFS rms={stats['rms_db']} dBFS offset={stats['transient_offset']}s",
        flush=True,
    )
    return record


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--music", required=True, help="Path to script/music_cues.json")
    ap.add_argument("--sfx", required=True, help="Path to script/sfx_score.json")
    ap.add_argument("--out-dir", required=True, help="Path to project audio directory")
    ap.add_argument("--cache-dir", default="~/.cache/story-animation-models")
    ap.add_argument("--threads", type=int, default=min(8, os.cpu_count() or 4))
    args = ap.parse_args()

    cache_root = Path(args.cache_dir).expanduser().resolve()
    py_bin = cache_root / "venv" / "bin" / "python"
    if not py_bin.exists():
        py_bin = Path(sys.executable)
    sa3_script = cache_root / "stable-audio-3" / "optimized" / "tflite" / "scripts" / "sa3_tflite.py"
    if not sa3_script.exists():
        raise FileNotFoundError(f"Missing Stable Audio 3 runtime script at {sa3_script}")

    out_dir = Path(args.out_dir).resolve()
    music_dir = out_dir / "music"
    sfx_dir = out_dir / "sfx"

    music_spec = json.loads(Path(args.music).read_text())
    sfx_spec = json.loads(Path(args.sfx).read_text())

    music_records = []
    for cue in music_spec.get("cues", []):
        rec = generate_clip(
            py_bin=py_bin,
            sa3_script=sa3_script,
            dit="sm-music",
            name=cue["name"],
            prompt=cue["prompt"],
            seconds=float(cue["seconds"]),
            seed=int(cue["seed"]),
            out_wav=music_dir / f"{cue['name']}.wav",
            threads=args.threads,
            steps=int(cue.get("steps", 8)),
        )
        music_records.append(rec)

    sfx_records = []
    for clip in sfx_spec.get("clips", []):
        rec = generate_clip(
            py_bin=py_bin,
            sa3_script=sa3_script,
            dit="sm-sfx",
            name=clip["name"],
            prompt=clip["prompt"],
            seconds=float(clip.get("seconds", 4.0)),
            seed=int(clip["seed"]),
            out_wav=sfx_dir / f"{clip['name']}.wav",
            threads=args.threads,
            steps=int(clip.get("steps", 8)),
        )
        sfx_records.append(rec)

    manifest = {
        "generator": "Stable Audio 3 LiteRT (sm-music + sm-sfx)",
        "music_cues": music_records,
        "sfx_clips": sfx_records,
    }
    (out_dir / "sa3_manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"SA3_GENERATION_COMPLETE music={len(music_records)} sfx={len(sfx_records)}", flush=True)


if __name__ == "__main__":
    main()
