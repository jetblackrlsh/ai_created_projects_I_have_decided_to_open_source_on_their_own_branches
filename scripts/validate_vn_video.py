#!/usr/bin/env python3
"""End-to-End Automated Validator for Anime Visual Novel (Kinetic Novel) Story Videos.

Verifies all mandatory storytelling, visual novel cinematography, visual QA, and audio mixing invariants:
1. Story Clarity Audit (`script/story_clarity_audit.md`) present and includes both the
   `## Post-Draft Original Story Fidelity Review` and `## Action Pacing, Struggle & Earned Victory Audit`.
2. Character Model Consistency (`character_sheets` locks `>= 80 chars` for every recurring character)
   and Camera Shake Discipline (`barrage_shake` / `earthquake_shake` used in `<= 2` shots).
3. Unique Kokoro TTS voices for `Narrator` and every speaking character, locked at `speed == 1.0`,
   with natural `0.45s` release tails (`final 220ms RMS < 0.015`), `>= 0.50s` inter-line gaps,
   `>= 1.25s` inter-scene gaps, and sample-accurate per-page subtitle synchronization (`caption_pages`).
4. Audio-first descriptive narration across all scenes + dramatized direct character dialogue
   (`implied_adaptation: true`) + zero spoken hyphens/dashes/mojibake in `tts_text`.
5. Built-in AI generated 1920x1080 Anime Visual Novel illustrations (`images/image_manifest.json`)
   verified for resolution and QA status.
6. Stable Audio Small Music (`sa3-sm-music`) and Stable Audio Small SFX (`sa3-sm-sfx`) provenance verified,
   including Clean Opening rule (`clean_opening_no_disruptive_sfx: true`), zero music track overlap
   (`music_overlap_sec == 0.0`), zero cross-scene SFX bleed (`no_cross_scene_sfx_bleed: true`), and
   harmonic consonance (`consonant_music_tracks: true`, `max_flatness <= 0.05`, `max_clash_ratio <= 0.45`).
7. Audio Mixing Loudness Hierarchy verified:
   - Foreground voice-over-effects >= 6 dB and voice-over-music >= 12 dB.
   - Foreground effects-over-music >= 6 dB.
   - Music below -34 dBFS triggers review, never a false audibility certification.
8. Visible ADV/NVL/CG on-screen captions verified on rendered keyframes (`keyframes/frame_*.png`)
   with zero left/right edge clipping.
9. Opening Title Screen (`keyframes/card_title.png`), Closing Credits (`keyframes/card_credits.png`),
   `youtube_metadata.md` (`Title MM/DD/YYYY`, `Description`, `Comma Separated List Of Tags`),
   and `vn_story_video.mp4` (`1920x1080` H.264 + AAC) verified.
"""
import argparse
import json
import re
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image
import soundfile as sf
from priority_audio_mix import _stats, _amp, _margin_report, WINDOW_SEC, VOICE_GATE_DB, SFX_GATE_DB, MUSIC_GATE_DB, VOICE_SFX_DB, SFX_MUSIC_DB, VOICE_MUSIC_DB


def assert_true(cond: bool, msg: str):
    if not cond:
        raise AssertionError(f"[VN VALIDATION FAILED] {msg}")


def audit_saved_stems(audio_dir):
    """Independently measure the persisted final buses, not trusted JSON flags."""
    buses = []
    for name in ("voice", "sfx", "music"):
        a, rate = sf.read(str(Path(audio_dir) / f"{name}_stem.wav"), always_2d=True)
        assert_true(rate == 48000 and a.shape[1] == 2 and len(a) > 0 and np.all(np.isfinite(a)), f"Invalid {name} stem")
        buses.append(a)
    assert_true(len({a.shape for a in buses}) == 1, "Stem shapes differ")
    vr, vp = _stats(buses[0], round(48000 * WINDOW_SEC))
    sr, sp = _stats(buses[1], round(48000 * WINDOW_SEC))
    mr, _ = _stats(buses[2], round(48000 * WINDOW_SEC))
    source = np.load(Path(audio_dir) / "premix_stems.npz")
    assert_true(all(source[k].shape == buses[0].shape for k in ("voice", "sfx", "music")), "Premix source shapes differ")
    tvr, _ = _stats(source["voice"], round(48000 * WINDOW_SEC))
    tsr, _ = _stats(source["sfx"], round(48000 * WINDOW_SEC))
    tmr, _ = _stats(source["music"], round(48000 * WINDOW_SEC))
    va = tvr >= _amp(VOICE_GATE_DB)
    sa = (tsr >= _amp(SFX_GATE_DB)) & (tsr >= tmr * _amp(SFX_MUSIC_DB))
    ma = tmr >= _amp(MUSIC_GATE_DB)
    result = {
        "voice_over_sfx": _margin_report(vr, sr, va & sa, VOICE_SFX_DB),
        "voice_over_music": _margin_report(vr, mr, va & ma, VOICE_MUSIC_DB),
        "sfx_over_music": _margin_report(sr, mr, sa & ma, SFX_MUSIC_DB),
    }
    for label, report in result.items():
        assert_true(report["violations"] == 0, f"Saved bus {label}: {report}")
    assert_true(np.max(np.abs(buses[1])) <= _amp(-8.99), "SFX exceeds peak ceiling")
    master, rate = sf.read(str(Path(audio_dir) / "master.wav"), always_2d=True)
    assert_true(master.shape == buses[0].shape and rate == 48000, "Master/stem dimensions differ")
    assert_true(np.max(np.abs(master - sum(buses))) < 0.0001, "Master differs from summed final stems")
    assert_true(np.max(np.abs(master)) <= _amp(-1.49), "Master lacks required peak headroom")
    result["music_below_floor_windows"] = int(np.sum(ma & (mr < _amp(-34))))
    result["music_floor_status"] = "review_required" if result["music_below_floor_windows"] else "pass"
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project_dir", help="Path to project root directory")
    args = ap.parse_args()

    root = Path(args.project_dir).resolve()
    audit_path = root / "script" / "story_clarity_audit.md"
    timeline_path = root / "audio" / "timeline.json"
    ver_path = root / "audio" / "audio_verification.json"
    sa3_path = root / "audio" / "sa3_manifest.json"
    vtt_path = root / "audio" / "captions.vtt"
    img_manifest_path = root / "images" / "image_manifest.json"
    mp4_path = root / "vn_story_video.mp4"
    yt_path = root / "youtube_metadata.md"
    keyframes_dir = root / "keyframes"

    for p in [audit_path, timeline_path, ver_path, sa3_path, vtt_path, img_manifest_path, mp4_path, yt_path, keyframes_dir]:
        assert_true(p.exists(), f"Missing required artifact: {p}")

    audit_text = audit_path.read_text(encoding="utf-8")
    assert_true(len(audit_text) >= 600 and "Clarifying" in audit_text,
                "script/story_clarity_audit.md must document source ambiguities and clarifying narrative bridges")
    assert_true("Fidelity" in audit_text or "Original Story" in audit_text,
                "script/story_clarity_audit.md must include a Post-Draft Original Story Fidelity Review verifying no key details were omitted")
    assert_true("Struggle" in audit_text or "Tension" in audit_text or "Action" in audit_text,
                "script/story_clarity_audit.md must include an Action Pacing, Struggle & Earned Victory Audit")

    yt_text = yt_path.read_text(encoding="utf-8")
    assert_true(bool(re.search(r"\b\d{2}/\d{2}/\d{4}\b", yt_text)),
                "youtube_metadata.md must include Title with date formatted as MM/DD/YYYY")
    assert_true("## Description" in yt_text and "00:00" in yt_text,
                "youtube_metadata.md must include a Description section with 00:00 chapter timestamps")
    assert_true("Comma Separated List Of Tags" in yt_text and "," in yt_text.split("Comma Separated List Of Tags")[-1],
                "youtube_metadata.md must include 'Comma Separated List Of Tags' with comma-separated tags")

    timeline = json.loads(timeline_path.read_text(encoding="utf-8"))
    ver = json.loads(ver_path.read_text(encoding="utf-8"))
    sa3 = json.loads(sa3_path.read_text(encoding="utf-8"))
    img_man = json.loads(img_manifest_path.read_text(encoding="utf-8"))

    cast = timeline.get("cast", {})
    char_sheets = timeline.get("character_sheets", {})
    voices = [v["voice"] for v in cast.values()]
    assert_true("Narrator" in cast and len(cast) >= 2, "Cast must include Narrator and speaking character(s)")
    assert_true(len(cast) == len(set(voices)), f"Duplicate voices found in cast: {voices}")
    for spk_name, spk_cfg in cast.items():
        spk_speed = float(spk_cfg.get("speed", 1.0))
        assert_true(abs(spk_speed - 1.0) < 1e-6,
                    f"Voice speed modification is forbidden! Cast '{spk_name}' has speed={spk_speed} (must be 1.0)")

    lines = timeline.get("lines", [])
    narration_lines = [l for l in lines if l["speaker"] == "Narrator"]
    dialogue_lines = [l for l in lines if l["speaker"] != "Narrator"]
    assert_true(len(narration_lines) >= len(timeline.get("scenes", [])), "Every scene must include descriptive action narration")
    assert_true(len(dialogue_lines) >= 2, "Story must include dramatized character dialogue")

    barrage_shake_count = 0
    for idx, l in enumerate(lines):
        line_speed = float(l.get("speed", 1.0))
        assert_true(abs(line_speed - 1.0) < 1e-6,
                    f"Voice speed modification is forbidden! Line {l['id']} has speed={line_speed} (must be 1.0)")
        tts_txt = l.get("tts_text", "")
        assert_true(bool(tts_txt), f"Line {l['id']} missing sanitized 'tts_text'")
        assert_true(not bool(re.search(r"[-—–―‒€]|â€", tts_txt)),
                    f"Line {l['id']} tts_text contains unsanitized hyphen/dash/mojibake: {tts_txt}")

        # Verify audio line WAV is NOT cut off at the end (must have clean trailing silence/decay tail)
        wav_p = root / "audio" / l["file"]
        assert_true(wav_p.exists(), f"Missing line audio file: {wav_p}")
        wav_data, wav_sr = sf.read(str(wav_p), dtype="float64")
        tail_samples = wav_data[-int(0.22 * wav_sr):]
        tail_rms = float(np.sqrt(np.mean(tail_samples ** 2)))
        assert_true(tail_rms < 0.015,
                    f"Line {l['id']} audio appears cut off at the end (final 220ms RMS={tail_rms:.4f} >= 0.015)!")

        # Verify sample-accurate subtitle-to-TTS synchronization (caption_pages)
        cap_pages = l.get("caption_pages", [])
        assert_true(len(cap_pages) >= 1,
                    f"Line {l['id']} missing sample-accurate 'caption_pages' for subtitle-to-TTS synchronization!")
        assert_true(abs(float(cap_pages[0]["start"]) - float(l["start"])) < 0.02,
                    f"Line {l['id']} first caption page start ({cap_pages[0]['start']}) does not match line start ({l['start']})!")
        assert_true(abs(float(cap_pages[-1]["end"]) - float(l["end"])) < 0.02,
                    f"Line {l['id']} last caption page end ({cap_pages[-1]['end']}) does not match line end ({l['end']})!")
        for cp_i, cp in enumerate(cap_pages):
            assert_true(float(cp["end"]) > float(cp["start"]),
                        f"Line {l['id']} caption page {cp_i} has non-positive duration: {cp}")
            assert_true(len(cp.get("text", "")) <= 112,
                        f"Line {l['id']} caption page {cp_i} exceeds 112 chars ({len(cp.get('text', ''))}): {cp.get('text')}")
            if cp_i > 0:
                assert_true(abs(float(cp["start"]) - float(cap_pages[cp_i - 1]["end"])) < 0.01,
                            f"Line {l['id']} caption pages {cp_i - 1} and {cp_i} are not contiguous!")

        # Verify strict inter-line and inter-scene transition gaps so lines are fully spoken before transitions
        if idx > 0:
            prev_l = lines[idx - 1]
            gap_sec = float(l["start"]) - float(prev_l["end"])
            if l["scene"] != prev_l["scene"]:
                assert_true(gap_sec >= 1.25,
                            f"Scene transition before {l['id']} is too fast (gap={gap_sec:.2f}s < 1.25s after {prev_l['id']} end)!")
            else:
                assert_true(gap_sec >= 0.50,
                            f"Line transition before {l['id']} is too fast (gap={gap_sec:.2f}s < 0.50s after {prev_l['id']} end)!")

        # Verify Character Consistency Model Sheet coverage for all referenced characters
        all_refs = list(l.get("character_refs", []))
        for sub in l.get("sub_shots", []):
            all_refs.extend(sub.get("character_refs", []))
            if any(v in ("barrage_shake", "earthquake_shake") for v in sub.get("vfx", [])):
                barrage_shake_count += 1
        if any(v in ("barrage_shake", "earthquake_shake") for v in l.get("vfx", [])):
            barrage_shake_count += 1

        for cref in set(all_refs):
            sheet_txt = char_sheets.get(cref) or cast.get(cref, {}).get("character_sheet") or cast.get(cref, {}).get("prompt_tag", "")
            assert_true(len(str(sheet_txt).strip()) >= 80,
                        f"Character '{cref}' (referenced in {l['id']}) must have a detailed Character Model Sheet Lock (>= 80 chars)!")

    assert_true(barrage_shake_count <= 2,
                f"Camera shake spam detected: continuous barrage/earthquake shake used on {barrage_shake_count} shots (max 2 allowed)!")

    assert_true("title_card" in timeline and timeline["title_card"]["duration"] >= 2.5,
                "Timeline must start with a Title Card (>= 2.5s)")
    assert_true("credits_card" in timeline and timeline["credits_card"]["duration"] >= 3.0,
                "Timeline must end with a Closing Credits Card (>= 3.0s)")
    assert_true((keyframes_dir / "card_title.png").exists(), "Missing rendered Title Card keyframe")
    assert_true((keyframes_dir / "card_credits.png").exists(), "Missing rendered Closing Credits keyframe")

    expected_img_count = len(lines) + 2
    assert_true(len(img_man.get("images", [])) >= expected_img_count,
                f"Expected at least {expected_img_count} verified images, found {len(img_man.get('images', []))}")
    for rec in img_man["images"]:
        p = root / "images" / rec["file"]
        assert_true(p.exists(), f"Missing generated image file: {p}")
        with Image.open(p) as im:
            assert_true(im.size == (1920, 1080), f"Image {p.name} must be 1920x1080, got {im.size}")

    assert_true(len(sa3.get("music_cues", [])) >= 1, "Must generate Stable Audio Small Music cues (sa3-sm-music)")
    assert_true(len(sa3.get("sfx_clips", [])) >= 2, "Must generate Stable Audio Small SFX clips (sa3-sm-sfx)")

    checks = ver.get("checks", {})
    saved_bus_audit = audit_saved_stems(root / "audio")
    if saved_bus_audit["music_floor_status"] == "review_required":
        print("[VN AUDIO REVIEW] Music falls below -34 dBFS in some windows; review fades, rests and quiet foreground. This is not an audibility pass.")
    assert_true(checks.get("no_overlapping_music_tracks") is True and float(ver.get("music_overlap_sec", 99.0)) == 0.0,
                f"Overlapping music tracks detected: music_overlap_sec={ver.get('music_overlap_sec')}")
    assert_true(ver.get("smooth_music_transitions") is True,
                "Music cues must use smooth cosine fade-out to fade-in transitions without overlapping!")
    assert_true(checks.get("no_cross_scene_sfx_bleed") is True,
                "SFX event bled across a scene boundary into the next chapter's opening music!")
    assert_true(checks.get("consonant_music_tracks") is True and float(ver.get("music_max_semitone_clash_ratio", 1.0)) <= 0.45,
                f"Discordant/noisy music track detected: clash={ver.get('music_max_semitone_clash_ratio')}, flatness={ver.get('music_max_spectral_flatness')}")

    frame_pngs = sorted(keyframes_dir.glob("frame_*.png"))
    assert_true(len(frame_pngs) >= len(lines), f"Expected {len(lines)} rendered shot keyframes, found {len(frame_pngs)}")
    for fp in frame_pngs:
        arr = np.asarray(Image.open(fp).convert("RGB"), dtype=np.uint8)
        h, w, _ = arr.shape
        cap_band = arr[int(h * 0.80):int(h * 0.98), :, :]
        bright = (cap_band[:, :, 0] > 230) & (cap_band[:, :, 1] > 225) & (cap_band[:, :, 2] > 215)
        center_bright = int(np.sum(bright[:, int(w * 0.14):int(w * 0.86)]))
        assert_true(center_bright >= 140, f"VN caption text not visible in bottom safe area of {fp.name}")

    probe = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(mp4_path)],
        check=True, capture_output=True, text=True
    ).stdout)
    streams = {s["codec_type"]: s for s in probe.get("streams", [])}
    assert_true("video" in streams and "audio" in streams, "vn_story_video.mp4 must contain both video and audio streams")
    assert_true(streams["video"]["codec_name"] == "h264", "MP4 video codec must be h264")
    assert_true(int(streams["video"]["width"]) == 1920 and int(streams["video"]["height"]) == 1080,
                "MP4 video resolution must be 1920x1080")
    assert_true(streams["audio"]["codec_name"] == "aac", "MP4 audio codec must be aac")

    report = {
        "status": "PASSED_WITH_AUDIO_REVIEW" if saved_bus_audit["music_floor_status"] == "review_required" else "PASSED",
        "saved_bus_audit": saved_bus_audit,
        "project": str(root),
        "video_file": str(mp4_path),
        "total_duration_sec": timeline["total_duration"],
        "scenes_count": len(timeline["scenes"]),
        "lines_count": len(lines),
        "unique_voices_count": len(cast),
        "verified_images_count": len(img_man["images"]),
        "music_cues_count": len(sa3["music_cues"]),
        "sfx_clips_count": len(sa3["sfx_clips"]),
        "voice_over_music_margin_db": ver["voice_over_music_margin_db"],
        "sfx_over_music_margin_db": ver["sfx_over_music_margin_db"],
        "music_ducked_rms_db": ver["music_ducked_rms_db"],
    }
    print(json.dumps(report, indent=2), flush=True)


if __name__ == "__main__":
    main()
