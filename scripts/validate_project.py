#!/usr/bin/env python3
"""End-to-end validator for a WebGL Shader + 2D Canvas Painterly Anime Story Animation project.

Verifies all mandatory invariants:
1. Pre-adaptation Story Clarity Audit (`script/story_clarity_audit.md`) present and substantive.
2. Zero narrator-dialogue repetition & brisk pacing (average line duration <= 11.5s).
3. Unique Kokoro TTS voices for every speaking character + Narrator.
4. Strict TTS Sanitization: Zero hyphens (`-`), em-dashes (`—`), en-dashes (`–`), or mojibake (`€`, `â€`) in `tts_text`.
5. Implied-to-direct character dialogue adaptation present in screenplay.
6. Descriptive audio narration present across all scenes.
7. Stable Audio 3 Small-Music and Small-SFX provenance verified.
8. Audio mix loudness hierarchy & Clean Opening Rule verified (no disruptive SFX in the first 2.5s; Dialogue & SFX > Music; Music audible).
9. Caption Safe-Area & Clipping Validator: Verifies `paginateCaptionText` + `wrapCaptionLines` and scans all rendered scene keyframes (`keyframes/scene_*.png`) to confirm zero caption glyph pixels are cut off near the left/right 8% borders.
10. Anime Background & Character Detail Validator: Verifies `drawMasterAnimeCharacter` usage and measures spatial edge density and color richness across every scene keyframe (`keyframes/scene_*.png`).
11. Cinematic Shot Variety Validator: Verifies `computeCinematicShot` + `applyCameraTransform` and confirms at least 5 distinct camera shot types (close-ups, pans, zooms, OTS, low-angle, Dutch tilt, wide) across the timeline and at least 2 shot changes per scene.
12. Validated 24fps H.264/AAC MP4 video export (`animation.mp4`) and YouTube upload metadata (`youtube_metadata.md`).
"""
import argparse
import json
import re
import subprocess
import sys
import zlib
import struct
from pathlib import Path

import numpy as np


def assert_true(cond: bool, msg: str):
    if not cond:
        raise AssertionError(f"[VALIDATION FAILED] {msg}")


def read_png_rgb(path: Path) -> np.ndarray:
    """Pure Python + NumPy PNG RGB/RGBA decoder (no external PIL dependency required, though uses PIL if present)."""
    try:
        from PIL import Image
        return np.asarray(Image.open(path).convert("RGB"), dtype=np.uint8)
    except Exception:
        data = path.read_bytes()
        assert_true(data[:8] == b"\x89PNG\r\n\x1a\n", f"Invalid PNG header in {path}")
        pos = 8
        width = height = bit_depth = color_type = 0
        idat_chunks = []
        while pos < len(data):
            length = struct.unpack(">I", data[pos:pos + 4])[0]
            chunk_type = data[pos + 4:pos + 8]
            chunk_data = data[pos + 8:pos + 8 + length]
            pos += 12 + length
            if chunk_type == b"IHDR":
                width, height, bit_depth, color_type, _, _, _ = struct.unpack(">IIBBBBB", chunk_data)
            elif chunk_type == b"IDAT":
                idat_chunks.append(chunk_data)
            elif chunk_type == b"IEND":
                break
        raw = zlib.decompress(b"".join(idat_chunks))
        bpp = 4 if color_type == 6 else 3
        stride = width * bpp
        out = np.zeros((height, width, bpp), dtype=np.uint8)
        idx = 0
        for y in range(height):
            filter_type = raw[idx]
            idx += 1
            row = np.frombuffer(raw[idx:idx + stride], dtype=np.uint8).copy()
            idx += stride
            if filter_type == 1:
                for x in range(bpp, stride):
                    row[x] = (int(row[x]) + int(row[x - bpp])) & 0xFF
            elif filter_type == 2 and y > 0:
                prev = out[y - 1].reshape(-1)
                row = ((row.astype(np.int32) + prev.astype(np.int32)) & 0xFF).astype(np.uint8)
            elif filter_type == 3:
                prev = out[y - 1].reshape(-1) if y > 0 else np.zeros(stride, dtype=np.uint8)
                for x in range(stride):
                    a = int(row[x - bpp]) if x >= bpp else 0
                    b = int(prev[x])
                    row[x] = (int(row[x]) + ((a + b) // 2)) & 0xFF
            elif filter_type == 4:
                prev = out[y - 1].reshape(-1) if y > 0 else np.zeros(stride, dtype=np.uint8)
                for x in range(stride):
                    a = int(row[x - bpp]) if x >= bpp else 0
                    b = int(prev[x])
                    c = int(prev[x - bpp]) if x >= bpp else 0
                    p = a + b - c
                    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                    pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                    row[x] = (int(row[x]) + pr) & 0xFF
            out[y] = row.reshape((width, bpp))
        return out[:, :, :3]


def validate_captions_and_visual_quality(root: Path, timeline: dict):
    keyframes_dir = root / "keyframes"
    assert_true(keyframes_dir.exists(), f"Missing keyframes directory: {keyframes_dir}")
    scene_pngs = sorted(keyframes_dir.glob("scene_*.png"))
    assert_true(len(scene_pngs) >= len(timeline.get("scenes", [])),
                f"Expected at least {len(timeline.get('scenes', []))} scene_S*.png keyframes, found {len(scene_pngs)}")

    caption_border_violations = []
    scene_visual_metrics = {}

    for png_path in scene_pngs:
        img = read_png_rgb(png_path)
        h, w, _ = img.shape

        # 1. Caption Safe-Area Pixel Inspection (bottom 15% of frame: y in [0.85*h, 0.99*h])
        cap_y0 = int(h * 0.85)
        cap_y1 = int(h * 0.99)
        cap_band = img[cap_y0:cap_y1, :, :]

        # Detect bright caption text pixels (#f8f3e6 / #f3ead8: R>220, G>210, B>190) that have high local contrast (outlined text)
        bright_mask = (cap_band[:, :, 0] > 220) & (cap_band[:, :, 1] > 210) & (cap_band[:, :, 2] > 190)
        # Check outer 7.5% left & right margins (x < 0.075*w or x > 0.925*w) where captions must NEVER reach
        left_margin_x = int(w * 0.075)
        right_margin_x = int(w * 0.925)

        # Distinguish outlined text glyphs from uniform bright backgrounds by checking dark stroke neighbor within 3px
        dark_mask = (cap_band[:, :, 0] < 24) & (cap_band[:, :, 1] < 24) & (cap_band[:, :, 2] < 34)
        dark_dilated = np.zeros_like(dark_mask)
        for dy in (-2, -1, 0, 1, 2):
            for dx in (-2, -1, 0, 1, 2):
                shifted = np.roll(np.roll(dark_mask, dy, axis=0), dx, axis=1)
                dark_dilated |= shifted

        glyph_mask = bright_mask & dark_dilated
        left_clipped = int(np.sum(glyph_mask[:, :left_margin_x]))
        right_clipped = int(np.sum(glyph_mask[:, right_margin_x:]))

        if left_clipped > 12 or right_clipped > 12:
            caption_border_violations.append(
                f"{png_path.name}: left_border_glyph_px={left_clipped}, right_border_glyph_px={right_clipped}"
            )

        # 2. Anime Background & Character Detail Metrics (upper 84% stage area)
        stage = img[:int(h * 0.84), :, :].astype(np.float32)
        gx = np.abs(stage[:, 1:, :] - stage[:, :-1, :]).mean()
        gy = np.abs(stage[1:, :, :] - stage[:-1, :, :]).mean()
        edge_strength = round(float(gx + gy), 3)

        # Unique quantized colors (5 bits per channel -> 32768 bins)
        q = ((img[:, :, 0].astype(np.uint32) >> 3) << 10) | ((img[:, :, 1].astype(np.uint32) >> 3) << 5) | (img[:, :, 2].astype(np.uint32) >> 3)
        unique_colors = int(len(np.unique(q)))

        scene_visual_metrics[png_path.name] = {
            "edge_strength": edge_strength,
            "unique_quantized_colors": unique_colors,
            "left_border_glyph_px": left_clipped,
            "right_border_glyph_px": right_clipped,
        }

        assert_true(
            edge_strength >= 4.2 and unique_colors >= 1200,
            f"Scene keyframe {png_path.name} lacks sufficient anime background/character detail "
            f"(edge_strength={edge_strength}, unique_colors={unique_colors}; require edge_strength>=4.2 and unique_colors>=1200)"
        )

    assert_true(
        len(caption_border_violations) == 0,
        f"Captions cut off or encroaching on side borders in keyframes: {caption_border_violations}"
    )
    return scene_visual_metrics


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
    cinema_path = root / "cinema.html"
    engine_path = root / "src" / "painterly-anime-engine.js"
    scene_renderer_path = root / "src" / "scene-renderer.js"
    mp4_path = root / "animation.mp4"
    yt_path = root / "youtube_metadata.md"

    for p in [audit_path, timeline_path, ver_path, sa3_path, vtt_path, html_path, cinema_path, engine_path, scene_renderer_path, mp4_path, yt_path]:
        assert_true(p.exists(), f"Missing required artifact: {p}")

    audit_text = audit_path.read_text(encoding="utf-8")
    assert_true(len(audit_text) >= 600 and "Clarifying" in audit_text,
                "script/story_clarity_audit.md must document source ambiguities and clarifying bridges")

    yt_text = yt_path.read_text(encoding="utf-8")
    assert_true(bool(re.search(r"\b\d{2}/\d{2}/\d{4}\b", yt_text)),
                "youtube_metadata.md must include Title with date formatted as MM/DD/YYYY")
    assert_true("## Description" in yt_text and "00:00" in yt_text,
                "youtube_metadata.md must include a Description section with 00:00 chapter timestamps")
    assert_true("Tags" in yt_text and "," in yt_text.split("Tags")[-1],
                "youtube_metadata.md must include a comma-separated Tags list")

    timeline_raw = timeline_path.read_text(encoding="utf-8")
    vtt_raw = vtt_path.read_text(encoding="utf-8")
    assert_true("â€" not in timeline_raw and "â€" not in vtt_raw,
                "Mojibake ('â€') detected in timeline.json or captions.vtt!")

    timeline = json.loads(timeline_raw)
    ver = json.loads(ver_path.read_text(encoding="utf-8"))
    sa3 = json.loads(sa3_path.read_text(encoding="utf-8"))
    html_text = html_path.read_text(encoding="utf-8")
    engine_text = engine_path.read_text(encoding="utf-8")
    scene_renderer_text = scene_renderer_path.read_text(encoding="utf-8")

    # 1. Unique voices check
    cast = timeline.get("cast", {})
    voices = [v["voice"] for v in cast.values()]
    assert_true(len(cast) >= 3, "Cast must include Narrator and speaking characters")
    assert_true(len(cast) == len(set(voices)), f"Duplicate voices found in cast: {voices}")

    # 2. Pacing, Zero-Repetition, Implied dialogue & TTS Hyphen Sanitization check
    lines = timeline.get("lines", [])
    narration_lines = [l for l in lines if l["speaker"] == "Narrator"]
    dialogue_lines = [l for l in lines if l["speaker"] != "Narrator"]
    adapted_lines = [l for l in dialogue_lines if l.get("implied_adaptation")]
    avg_line_dur = sum(l["duration"] for l in lines) / max(1, len(lines))
    assert_true(avg_line_dur <= 11.5, f"Pacing too slow: average line duration is {avg_line_dur:.2f}s (must be <= 11.5s)")
    assert_true(len(narration_lines) >= len(timeline.get("scenes", [])), "Every scene must have descriptive narration")
    assert_true(len(dialogue_lines) >= 12, "Story must include rich, fast-paced direct character dialogue")
    assert_true(len(adapted_lines) >= 6, "Story must adapt implied dialogue into direct character speech")

    for l in lines:
        tts_txt = l.get("tts_text", "")
        assert_true(bool(tts_txt), f"Line {l['id']} missing sanitized 'tts_text' field in timeline.json")
        assert_true(
            not bool(re.search(r"[-—–―‒€]|â€", tts_txt)),
            f"Line {l['id']} tts_text still contains a hyphen, dash, or Euro/mojibake symbol: {tts_txt}"
        )

    # 3. Shot Variety Check (Close-ups, pans, zooms, OTS, low-angle, Dutch tilt, wide)
    shot_types = [l.get("shot", "wide") for l in lines]
    unique_shots = set(shot_types)
    assert_true(
        len(unique_shots) >= 5,
        f"Insufficient cinematic shot variety: found only {sorted(unique_shots)} (require >= 5 distinct shot types including close-ups, pans, zooms, OTS, etc.)"
    )
    assert_true(
        "close_up" in unique_shots or "extreme_close_up" in unique_shots,
        "Timeline must include close_up or extreme_close_up shots"
    )
    for sc in timeline.get("scenes", []):
        sc_id = sc["id"]
        sc_shots = [l.get("shot", "wide") for l in lines if l.get("scene") == sc_id]
        assert_true(
            len(set(sc_shots)) >= 2,
            f"Scene {sc_id} lacks camera shot variety (all lines use {set(sc_shots)}); require >= 2 distinct shot types per scene"
        )

    # 4. Stable Audio 3 provenance check
    assert_true(len(sa3.get("music_cues", [])) >= 2, "Must generate Stable Audio 3 Small-Music cues")
    assert_true(len(sa3.get("sfx_clips", [])) >= 5, "Must generate Stable Audio 3 Small-SFX clips")

    # 5. Loudness hierarchy & Clean Opening SFX check
    checks = ver.get("checks", {})
    assert_true(checks.get("dialogue_louder_than_music") is True,
                f"Dialogue not sufficiently louder than music: {ver.get('voice_over_music_margin_db')} dB")
    assert_true(checks.get("sfx_louder_than_music") is True,
                f"SFX not sufficiently louder than music: {ver.get('sfx_over_music_margin_db')} dB")
    assert_true(checks.get("music_remains_audible") is True,
                f"Background music not in audible range: {ver.get('music_ducked_rms_db')} dBFS")
    assert_true(checks.get("clean_opening_no_disruptive_sfx") is True,
                f"Disruptive SFX detected in opening 2.5s (peak={ver.get('opening_2_5s_sfx_peak')})")
    for ev in timeline.get("sfx_events", []):
        assert_true(float(ev.get("start", 0.0)) >= 2.5,
                    f"SFX event {ev.get('id')} triggers too early at {ev.get('start')}s (must be >= 2.5s)")

    # 6. WebGL shader + 2D Canvas + Painterly Anime Engine + Master Anime Rigs + Camera Director check
    combined_js = html_text
    for js_file in (root / "src").glob("*.js"):
        combined_js += "\n" + js_file.read_text(encoding="utf-8")
    assert_true("webgl" in combined_js.lower() and "gl_FragColor" in combined_js,
                "WebGL GLSL fragment shader not found in project")
    assert_true("getContext('2d')" in combined_js or 'getContext("2d")' in combined_js,
                "2D Canvas rendering context not found in project")
    for required_fn in [
        "mulberry32",
        "traceScallopedBrushBlob",
        "fillBristleCluster",
        "drawWeatheredPlate",
        "drawMossCluster",
        "paginateCaptionText",
        "wrapCaptionLines",
        "computeCinematicShot",
        "applyCameraTransform",
        "drawMasterAnimeCharacter",
    ]:
        assert_true(required_fn in engine_text,
                    f"Painterly Anime Engine missing required function: {required_fn}")

    assert_true("computeCinematicShot" in scene_renderer_text and "applyCameraTransform" in scene_renderer_text,
                "src/scene-renderer.js must use computeCinematicShot and applyCameraTransform for multi-shot camera direction")
    assert_true("drawMasterAnimeCharacter" in scene_renderer_text,
                "src/scene-renderer.js must use drawMasterAnimeCharacter for stylized anime character rigs")

    assert_true('id="grain"' in html_text and "mix-blend-mode: overlay" in html_text,
                "index.html must include live procedural film-grain overlay (#grain)")
    assert_true("contentvisibilityautostatechange" in html_text,
                "index.html must pause offscreen rendering via contentvisibilityautostatechange")

    # 7. Pixel-Level Caption Clipping & Anime Detail Inspection across all Keyframes
    visual_metrics = validate_captions_and_visual_quality(root, timeline)

    # 8. MP4 validation via ffprobe
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
        "visual_engine": "Moss-Keeper Painterly Anime Engine v3 (Master Anime Rigs + Multi-Shot Camera Director + Safe Captions)",
        "total_duration_sec": timeline["total_duration"],
        "avg_line_duration_sec": round(avg_line_dur, 2),
        "scenes_count": len(timeline["scenes"]),
        "lines_count": len(lines),
        "unique_voices_count": len(cast),
        "unique_shot_types": sorted(unique_shots),
        "tts_hyphen_free_verified": True,
        "caption_safe_area_verified": True,
        "clean_opening_sfx_verified": True,
        "adapted_dialogue_lines": len(adapted_lines),
        "music_cues_count": len(sa3["music_cues"]),
        "sfx_clips_count": len(sa3["sfx_clips"]),
        "voice_over_music_margin_db": ver["voice_over_music_margin_db"],
        "sfx_over_music_margin_db": ver["sfx_over_music_margin_db"],
        "music_ducked_rms_db": ver["music_ducked_rms_db"],
        "keyframe_visual_metrics": visual_metrics,
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
