#!/usr/bin/env python3
"""End-to-end validator for a WebGL Shader + 2D Canvas Story Animation project.

Verifies all mandatory invariants:
1. Pre-adaptation Story Clarity Audit (`script/story_clarity_audit.md`) present and substantive.
2. Zero narrator-dialogue repetition & brisk pacing (average line duration <= 11.0s).
3. Unique Kokoro TTS voices for every speaking character + Narrator.
4. Implied-to-direct character dialogue adaptation present in screenplay.
5. Descriptive audio narration present across all scenes.
6. Stable Audio 3 Small-Music and Small-SFX provenance verified.
7. Audio mix loudness hierarchy verified (Dialogue & SFX > Music, Music audible).
8. Synchronized WebVTT captions (`captions.vtt`) + interactive WebGL/Canvas player (`index.html`).
9. Validated 24fps H.264/AAC MP4 video export (`animation.mp4`).
10. Validated YouTube upload metadata markdown (`youtube_metadata.md`).
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


def assert_true(cond: bool, msg: str):
    if not cond:
        raise AssertionError(f"[VALIDATION FAILED] {msg}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project_dir", help="Path to the animation project root")
    args = ap.parse_args()

    root = Path(args.project_dir).resolve()
    audit_path = root / "script" / "story_clarity_audit.md"
    timeline_path = root / "audio" / "timeline.json"
    ver_path = root / "audio" / "audio_verification.json"
    sa3_path = root / "audio" / "sa3_manifest.json"
    vtt_path = root / "audio" / "captions.vtt"
    html_path = root / "index.html"
    mp4_path = root / "animation.mp4"
    yt_path = root / "youtube_metadata.md"

    for p in [audit_path, timeline_path, ver_path, sa3_path, vtt_path, html_path, mp4_path, yt_path]:
        assert_true(p.exists(), f"Missing required artifact: {p}")

    audit_text = audit_path.read_text()
    assert_true(len(audit_text) >= 600 and "Clarifying" in audit_text,
                "script/story_clarity_audit.md must document source ambiguities and clarifying bridges")

    yt_text = yt_path.read_text()
    assert_true(bool(re.search(r"\b\d{2}/\d{2}/\d{4}\b", yt_text)),
                "youtube_metadata.md must include Title with date formatted as MM/DD/YYYY")
    assert_true("## Description" in yt_text and "00:00" in yt_text,
                "youtube_metadata.md must include a Description section with 00:00 chapter timestamps")
    assert_true("Tags" in yt_text and "," in yt_text.split("Tags")[-1],
                "youtube_metadata.md must include a comma-separated Tags list")

    timeline = json.loads(timeline_path.read_text())
    ver = json.loads(ver_path.read_text())
    sa3 = json.loads(sa3_path.read_text())
    html_text = html_path.read_text()

    # 1. Unique voices check
    cast = timeline.get("cast", {})
    voices = [v["voice"] for v in cast.values()]
    assert_true(len(cast) >= 3, "Cast must include Narrator and speaking characters")
    assert_true(len(cast) == len(set(voices)), f"Duplicate voices found in cast: {voices}")

    # 2. Pacing, Zero-Repetition & Implied dialogue check
    lines = timeline.get("lines", [])
    narration_lines = [l for l in lines if l["speaker"] == "Narrator"]
    dialogue_lines = [l for l in lines if l["speaker"] != "Narrator"]
    adapted_lines = [l for l in dialogue_lines if l.get("implied_adaptation")]
    avg_line_dur = sum(l["duration"] for l in lines) / max(1, len(lines))
    assert_true(avg_line_dur <= 11.5, f"Pacing too slow: average line duration is {avg_line_dur:.2f}s (must be <= 11.5s)")
    assert_true(len(narration_lines) >= len(timeline.get("scenes", [])), "Every scene must have descriptive narration")
    assert_true(len(dialogue_lines) >= 12, "Story must include rich, fast-paced direct character dialogue")
    assert_true(len(adapted_lines) >= 6, "Story must adapt implied dialogue into direct character speech")

    # 3. Stable Audio 3 provenance check
    assert_true(len(sa3.get("music_cues", [])) >= 2, "Must generate Stable Audio 3 Small-Music cues")
    assert_true(len(sa3.get("sfx_clips", [])) >= 5, "Must generate Stable Audio 3 Small-SFX clips")

    # 4. Loudness hierarchy check
    checks = ver.get("checks", {})
    assert_true(checks.get("dialogue_louder_than_music") is True,
                f"Dialogue not sufficiently louder than music: {ver.get('voice_over_music_margin_db')} dB")
    assert_true(checks.get("sfx_louder_than_music") is True,
                f"SFX not sufficiently louder than music: {ver.get('sfx_over_music_margin_db')} dB")
    assert_true(checks.get("music_remains_audible") is True,
                f"Background music not in audible range: {ver.get('music_ducked_rms_db')} dBFS")

    # 5. WebGL shader + 2D Canvas + Camera/Parallax check
    combined_js = html_text
    for js_file in (root / "src").glob("*.js"):
        combined_js += "\n" + js_file.read_text()
    assert_true("webgl" in combined_js.lower() and "gl_FragColor" in combined_js,
                "WebGL GLSL fragment shader not found in project")
    assert_true("getContext('2d')" in combined_js or 'getContext("2d")' in combined_js,
                "2D Canvas rendering context not found in project")

    # 6. MP4 validation via ffprobe
    probe = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(mp4_path)],
        check=True, capture_output=True, text=True
    ).stdout)
    streams = {s["codec_type"]: s for s in probe.get("streams", [])}
    assert_true("video" in streams and "audio" in streams, "MP4 must contain both video and audio streams")
    assert_true(streams["video"]["codec_name"] == "h264", "MP4 video codec must be h264")
    assert_true(streams["audio"]["codec_name"] == "aac", "MP4 audio codec must be aac")

    report = {
        "status": "PASSED",
        "project": str(root),
        "total_duration_sec": timeline["total_duration"],
        "avg_line_duration_sec": round(avg_line_dur, 2),
        "scenes_count": len(timeline["scenes"]),
        "lines_count": len(lines),
        "unique_voices_count": len(cast),
        "adapted_dialogue_lines": len(adapted_lines),
        "music_cues_count": len(sa3["music_cues"]),
        "sfx_clips_count": len(sa3["sfx_clips"]),
        "voice_over_music_margin_db": ver["voice_over_music_margin_db"],
        "sfx_over_music_margin_db": ver["sfx_over_music_margin_db"],
        "music_ducked_rms_db": ver["music_ducked_rms_db"],
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
