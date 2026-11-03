#!/usr/bin/env python3
"""Reassemble the original example video losslessly, verifying every part."""
from pathlib import Path
import hashlib,json,os
root=Path(__file__).resolve().parents[1]/"examples/dream-journal-2026-11-03"
manifest=json.loads((root/"video-parts/manifest.json").read_text())
target=root/manifest["output"]
if target.exists():
    if target.stat().st_size == manifest["bytes"] and hashlib.sha256(target.read_bytes()).hexdigest() == manifest["sha256"]:
        print("Verified existing", target); raise SystemExit(0)
    raise SystemExit("Existing animation.mp4 differs; move it aside before reconstructing.")
partial=target.with_suffix(".mp4.partial")
full=hashlib.sha256(); size=0
try:
    with partial.open("xb") as dest:
        for part in manifest["parts"]:
            data=(root/"video-parts"/part["name"]).read_bytes()
            if len(data)!=part["bytes"] or hashlib.sha256(data).hexdigest()!=part["sha256"]:
                raise ValueError("Invalid part: "+part["name"])
            dest.write(data); full.update(data); size+=len(data)
    if size!=manifest["bytes"] or full.hexdigest()!=manifest["sha256"]:
        raise ValueError("Combined checksum mismatch")
    os.rename(partial,target)
except Exception:
    if partial.exists(): partial.unlink()
    raise
print("Reassembled and verified",target)
