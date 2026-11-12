"""Fail closed for optional SFX; numeric diagnostics never imply listening approval."""
import re

def effect_rejection(effect, start, source_sha256=None):
    if start < 3 and effect.get("allow_opening_sfx") is not True:
        return "opening_sfx_disabled"
    r = effect.get("audition", {})
    if not isinstance(r, dict) or r.get("listening_verified") is not True or r.get("mixed_preview_verified") is not True:
        return "perceptual_review_missing"
    if not all(isinstance(r.get(k), str) and r[k].strip() for k in ("reviewer", "reviewed_at", "notes")):
        return "review_evidence_missing"
    if not re.fullmatch(r"[0-9a-f]{64}", str(r.get("source_sha256", ""))):
        return "review_hash_missing"
    if source_sha256 is not None and r["source_sha256"] != source_sha256:
        return "review_hash_mismatch"
    return None
