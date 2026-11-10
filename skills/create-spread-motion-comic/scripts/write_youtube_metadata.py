#!/usr/bin/env python3
"""Export public copy and full metadata without mixing in private production notes."""
import json
import sys
from pathlib import Path
from check_youtube_description import errors

def render(data):
    title = data["title"].strip()
    body = data["description"].strip()
    tags = data["tags"]
    if not title or "\n" in title or len(title) > 100:
        raise ValueError("title must be one line, 1–100 characters")
    if not isinstance(tags, list) or len(tags) < 2 or any(not isinstance(t, str) or not t.strip() or "," in t or "\n" in t for t in tags):
        raise ValueError("provide at least two nonempty individual tags")
    tag_line = ", ".join(t.strip() for t in tags)
    description = f"{title}\n\n{body}\n\n{tag_line}\n"
    issues = errors(description)
    if issues: raise ValueError("; ".join(issues))
    markdown = f"# Title\n\n{title}\n\n# Description\n\n{description}\n# Tags\n\n{tag_line}\n"
    return description, markdown

if __name__ == "__main__":
    description, markdown = render(json.loads(Path(sys.argv[1]).read_text()))
    out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    (out/"youtube-description.txt").write_text(description)
    (out/"youtube-metadata.md").write_text(markdown)
