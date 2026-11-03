#!/usr/bin/env python3
"""Generate YouTube upload metadata markdown (`youtube_metadata.md`) for an animated story.

Produces a copy-paste-ready Markdown document containing:
1. Title MM/DD/YYYY
2. Description (narrative synopsis, auto-generated YouTube chapter timestamps from
   `audio/timeline.json`, full Kokoro TTS voice cast, Stable Audio 3 credits, and
   descriptive-audio accessibility note)
3. Tags (Comma Separated List)
"""
import argparse
from datetime import datetime
import json
from pathlib import Path


def fmt_yt_timestamp(seconds: float) -> str:
    total_s = max(0, int(round(seconds)))
    m = (total_s // 60) % 60
    s = total_s % 60
    h = total_s // 3600
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--timeline", required=True, help="Path to audio/timeline.json")
    ap.add_argument("--out", required=True, help="Output path for youtube_metadata.md")
    ap.add_argument("--date", default=datetime.now().strftime("%m/%d/%Y"),
                    help="Date string formatted as MM/DD/YYYY (defaults to today)")
    ap.add_argument("--title", default=None, help="Optional custom title prefix before MM/DD/YYYY")
    ap.add_argument("--synopsis", default=None, help="Optional custom synopsis paragraph")
    ap.add_argument("--tags", default=None, help="Optional custom comma-separated tags list")
    args = ap.parse_args()

    timeline_path = Path(args.timeline).resolve()
    tl = json.loads(timeline_path.read_text(encoding="utf-8"))

    base_title = args.title or tl.get("title", "Animated Story")
    subtitle = tl.get("subtitle", "")
    full_title = f"{base_title} {args.date}"

    scenes = tl.get("scenes", [])
    cast = tl.get("cast", {})

    # Build YouTube Chapters block (YouTube requires first chapter at 00:00)
    chapter_lines = []
    for idx, sc in enumerate(scenes):
        ts = "00:00" if idx == 0 else fmt_yt_timestamp(sc.get("start", 0.0))
        clean_title = sc.get("title", f"Scene {idx + 1}")
        loc = sc.get("location", "")
        if loc:
            chapter_lines.append(f"{ts} {clean_title} ({loc})")
        else:
            chapter_lines.append(f"{ts} {clean_title}")

    # Build Voice Cast block
    cast_lines = []
    for speaker, info in cast.items():
        role = info.get("role", "Character")
        voice = info.get("voice", "kokoro")
        cast_lines.append(f"- {speaker} ({role}) — Voice: Kokoro TTS `{voice}`")

    default_synopsis = (
        f"{base_title}{(' — ' + subtitle) if subtitle else ''} is an original 2D painterly anime "
        f"adventure rendered with custom WebGL GLSL shaders and articulated 2D gouache Canvas rigs. "
        f"Featuring full descriptive audio narration for eyes-closed accessibility, multi-character "
        f"voice acting powered by Kokoro TTS, and an original sidechain-ducked soundtrack and sound "
        f"effects generated with Stable Audio 3."
    )
    synopsis = args.synopsis or default_synopsis

    default_tags = [
        base_title,
        "2D Animation",
        "Painterly Anime",
        "WebGL Shaders",
        "HTML5 Canvas Animation",
        "Dream Journal Animation",
        "Storyverse",
        "Audio Drama",
        "Descriptive Audio",
        "Kokoro TTS",
        "Stable Audio",
        "Animated Story",
        "Indie Animation",
        "Procedural Animation",
    ]
    tags_str = args.tags if args.tags else ", ".join(default_tags)

    md = f"""# YouTube Upload Metadata

## Title MM/DD/YYYY
{full_title}

## Description
{synopsis}

### Chapters
{chr(10).join(chapter_lines)}

### Voice Cast (Kokoro TTS — Unique Character Voices)
{chr(10).join(cast_lines)}

### Production & Accessibility Notes
- Visual Engine: Moss-Keeper Painterly Anime Engine — Custom WebGL GLSL Shaders + 2D Gouache & Bristle-Brush Canvas Rigs (`1920x1080` H.264 MP4)
- Music & Sound Effects: Stability AI Stable Audio 3 (`sm-music` & `sm-sfx` LiteRT) with sidechain-ducked background score
- Accessibility: Includes full descriptive audio narration and synchronized captions so the story can be enjoyed both visually and eyes-closed.

#2DAnimation #PainterlyAnime #WebGL #IndieAnimation #AudioDrama #DreamJournal

## Tags (Comma Separated List)
{tags_str}
"""

    out_path = Path(args.out).resolve()
    out_path.write_text(md, encoding="utf-8")
    print(f"[YOUTUBE METADATA] Wrote {out_path} (Title: '{full_title}')", flush=True)


if __name__ == "__main__":
    main()
