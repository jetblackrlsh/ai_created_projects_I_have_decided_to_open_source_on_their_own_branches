#!/usr/bin/env python3
"""Mechanical checks for public-ready descriptions; human accuracy/privacy review required."""
import re
import sys
from pathlib import Path

def errors(text):
    result = []
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if len(lines) < 3: result.append("requires title, body, and final tag list")
    if lines and ("," not in lines[-1] or any(not tag.strip() for tag in lines[-1].split(","))):
        result.append("last line must be comma-separated tags")
    if not text.strip(): result.append("empty description")
    if len(text) > 5000: result.append("description exceeds 5000 characters")
    patterns = {
        "placeholder": r"\b(?:TODO|TBD|FIXME)\b|<[^>]*(?:insert|add|your)[^>]*>|\[(?:insert|add|your|link here)[^]]*\]",
        "private delivery link": r"(?:drive|docs)\.google\.com|sandbox:|library_file|libfile_",
        "internal path": r"/(?:workspace|tmp|home/agent|root/\.codex)/",
        "metadata field label": r"(?im)^\s*(?:#+\s*)?(?:title|description|tags|QA receipt|production notes)\s*:",
        "code fence": r"```",
        "Markdown link": r"\[[^]]+\]\(https?://",
    }
    for label, pattern in patterns.items():
        if re.search(pattern, text, re.I): result.append(label)
    return result

if __name__ == "__main__":
    findings = errors(Path(sys.argv[1]).read_text(encoding="utf-8"))
    print("\n".join(findings) if findings else "PASS: mechanical checks; manual review still required")
    sys.exit(bool(findings))
