#!/usr/bin/env python3
"""Download the Stable Audio 3 LiteRT weights — only the files you need.

Fetches four (plus one optional) .tflite files from Stability AI's official
optimized collection at a PINNED revision, using plain urllib streaming —
no Hugging Face Hub, no Xet, no token, no browser. Each file is renamed
into place only after its exact size and publisher SHA-256 match.

Why not hf_hub_download? In the reference environment the Hub/Xet route
stalled at 0 bytes for minutes on these files while direct HTTPS worked.

Usage:
    python3 download_sa3.py <path-to-stable-audio-3/optimized/tflite>

Files land in <dir>/models/tflite/... which is where the runtime expects
them (see scripts/weights.py in the runtime). The collection is public and
ungated; the model licenses (Stability AI Community License + Gemma Terms)
still apply to the weights and their use.
"""
import hashlib
import sys
import time
import urllib.request
from pathlib import Path

REV = "30cb2644da54bfa63275d1bc7f1fa67fc718680f"
BASE = f"https://huggingface.co/stabilityai/stable-audio-3-optimized/resolve/{REV}"

# (hf relative path, expected bytes, expected sha256 or None)
FILES = [
    ("tflite/sa3-sm-music/dit_w8a8.tflite", 539350360,
     "1d8ef99bf10f51cc52b68f7b527d3773828e700758b253edd8a8e088a906e241"),
    ("tflite/sa3-sm-sfx/dit_w8a8.tflite", 539350360,
     "d3f99409f446eff9a625768ba2ee09a2347ea90c4897c1662fbcd8837fae3045"),
    ("tflite/same-s/dec_w8a8.tflite", 94092016,
     "2fc31cdc42a54342233fb8c6da636565b1191d97002665e21812e981490434a6"),
    ("tflite/t5gemma/encoder_fp16.tflite", 563818608,
     "8530d0b3e6b9b9dcf1239145c2a853fb749708eaddbb472ff8f0802b50059372"),
    # SAME-S encoder: only needed for audio-to-audio / inpainting. No
    # reference hash was published in our notes; size + local hash reported.
    ("tflite/same-s/enc_w8a8.tflite", 66416616, None),
]


def download(dest_root: Path, rel: str, expected_size, expected_sha):
    dest = dest_root / "models" / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size == expected_size:
        if expected_sha is None:
            print(f"SKIP already present: {rel}", flush=True)
            return
        h = hashlib.sha256()
        with open(dest, "rb") as f:
            for chunk in iter(lambda: f.read(4 * 1024 * 1024), b""):
                h.update(chunk)
        if h.hexdigest() == expected_sha:
            print(f"SKIP already present+verified: {rel}", flush=True)
            return
    partial = dest.with_suffix(dest.suffix + ".partial")
    url = f"{BASE}/{rel}"
    t0 = time.time()
    h = hashlib.sha256()
    got = 0
    req = urllib.request.Request(url, headers={"User-Agent": "sa3-direct/1.0"})
    with urllib.request.urlopen(req) as resp, open(partial, "wb") as f:
        while True:
            chunk = resp.read(4 * 1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
            h.update(chunk)
            got += len(chunk)
    dt = time.time() - t0
    sha = h.hexdigest()
    if got != expected_size:
        print(f"FAIL size {rel}: got {got}, expected {expected_size}", flush=True)
        sys.exit(1)
    if expected_sha is not None and sha != expected_sha:
        print(f"FAIL sha {rel}: got {sha}", flush=True)
        sys.exit(1)
    partial.rename(dest)
    print(f"OK {rel}  {got} bytes  sha256={sha}  {dt:.1f}s", flush=True)


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    root = Path(sys.argv[1]).expanduser().resolve()
    for rel, size, sha in FILES:
        download(root, rel, size, sha)
    print("ALL_DOWNLOADS_VERIFIED", flush=True)


if __name__ == "__main__":
    main()
