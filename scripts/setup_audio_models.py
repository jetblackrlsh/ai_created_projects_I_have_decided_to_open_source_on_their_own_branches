#!/usr/bin/env python3
"""Provision and verify Kokoro TTS (ONNX) and Stable Audio 3 (LiteRT) weights.

Downloads only missing or unverified files to ~/.cache/story-animation-models
and verifies exact byte counts and SHA-256 hashes.
"""
import argparse
import hashlib
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

KOKORO_BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"
KOKORO_FILES = [
    ("kokoro-v1.0.onnx", 325532387, "7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5"),
    ("voices-v1.0.bin", 28214398, "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d"),
]

SA3_REV = "30cb2644da54bfa63275d1bc7f1fa67fc718680f"
SA3_BASE = f"https://huggingface.co/stabilityai/stable-audio-3-optimized/resolve/{SA3_REV}"
SA3_FILES = [
    ("tflite/sa3-sm-music/dit_w8a8.tflite", 539350360,
     "1d8ef99bf10f51cc52b68f7b527d3773828e700758b253edd8a8e088a906e241"),
    ("tflite/sa3-sm-sfx/dit_w8a8.tflite", 539350360,
     "d3f99409f446eff9a625768ba2ee09a2347ea90c4897c1662fbcd8837fae3045"),
    ("tflite/same-s/dec_w8a8.tflite", 94092016,
     "2fc31cdc42a54342233fb8c6da636565b1191d97002665e21812e981490434a6"),
    ("tflite/t5gemma/encoder_fp16.tflite", 563818608,
     "8530d0b3e6b9b9dcf1239145c2a853fb749708eaddbb472ff8f0802b50059372"),
]


def verify_or_download(url: str, dest: Path, expected_size: int, expected_sha: str):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size == expected_size:
        h = hashlib.sha256()
        with open(dest, "rb") as f:
            for chunk in iter(lambda: f.read(4 * 1024 * 1024), b""):
                h.update(chunk)
        if h.hexdigest() == expected_sha:
            print(f"[OK] Verified {dest.name} ({expected_size} bytes)", flush=True)
            return
    partial = dest.with_suffix(dest.suffix + ".partial")
    t0 = time.time()
    h = hashlib.sha256()
    got = 0
    req = urllib.request.Request(url, headers={"User-Agent": "story-animator/1.0"})
    with urllib.request.urlopen(req) as resp, open(partial, "wb") as f:
        while True:
            chunk = resp.read(4 * 1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
            h.update(chunk)
            got += len(chunk)
    sha = h.hexdigest()
    if got != expected_size or sha != expected_sha:
        raise RuntimeError(f"Integrity failure for {dest}: size={got} sha={sha}")
    partial.rename(dest)
    print(f"[DOWNLOADED] {dest.name} in {time.time() - t0:.1f}s", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache-dir", default="~/.cache/story-animation-models")
    args = ap.parse_args()

    root = Path(args.cache_dir).expanduser().resolve()
    root.mkdir(parents=True, exist_ok=True)

    kokoro_dir = root / "kokoro"
    for fname, size, sha in KOKORO_FILES:
        verify_or_download(f"{KOKORO_BASE}/{fname}", kokoro_dir / fname, size, sha)

    sa3_repo = root / "stable-audio-3"
    if not sa3_repo.exists():
        subprocess.run(["git", "clone", "https://github.com/Stability-AI/stable-audio-3", str(sa3_repo)], check=True)
        subprocess.run(["git", "-C", str(sa3_repo), "checkout", "5f5e6ac21ae9ff78a6e8847eb7a1dcbe969ffb84"], check=True)

    tflite_root = sa3_repo / "optimized" / "tflite"
    for rel, size, sha in SA3_FILES:
        verify_or_download(f"{SA3_BASE}/{rel}", tflite_root / "models" / rel, size, sha)

    print("MODELS_READY", str(root))


if __name__ == "__main__":
    main()
