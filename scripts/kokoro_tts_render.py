#!/usr/bin/env python3
"""Render Kokoro TTS narration & character dialogue and build the canonical timeline.

Enforces:
1. Every speaking character + Narrator has a unique stock voice ID.
2. Strict UTF-8 file I/O and TTS text sanitization (`sanitize_text_for_tts`):
   - Strips/replaces all hyphens (`-`), en-dashes (`–`), em-dashes (`—`), and Windows-1252
     mojibake (`â€”`, `€`) so TTS NEVER pronounces hyphens/dashes as "Euros" or symbols.
3. Narration includes descriptive audio cues.
4. Each line is synthesized at 24 kHz, loudness-leveled to a consistent speech RMS,
   resampled to 48 kHz stereo, and assembled into `voice_stem.wav`, `timeline.json`,
   and `captions.vtt`.
"""
import argparse
import hashlib
import json
import math
import os
import re
from pathlib import Path

import numpy as np
import onnxruntime as ort
from kokoro_onnx import Kokoro
from scipy import signal
import soundfile as sf

CANONICAL_SR = 48000
TARGET_VOICE_RMS_DB = -13.5


def sanitize_text_for_tts(text: str) -> str:
    """Sanitize narrative/dialogue text for Kokoro TTS so hyphens/dashes are never spoken as 'Euros' or symbols."""
    s = text.strip()
    # 1. Repair any accidental cp1252/utf-8 mojibake sequences
    mojibake_map = {
        "â€”": ", ",
        "â€“": ", ",
        "â€™": "'",
        "â€˜": "'",
        "â€œ": '"',
        "â€\x9d": '"',
        "â€": '"',
        "€": " ",
    }
    for bad, good in mojibake_map.items():
        s = s.replace(bad, good)

    # 2. Replace em-dashes, en-dashes, horizontal bars, and double-hyphens with natural comma pauses
    s = re.sub(r"\s*[—–―‒]\s*", ", ", s)
    s = re.sub(r"\s*--+\s*", ", ", s)
    s = re.sub(r"\s+-\s+", ", ", s)

    # 3. Replace all remaining hyphens (including compound-word hyphens like 'five-star' or 'sleep-debt')
    # with spaces so the phonemizer never sees a '-' character
    s = re.sub(r"[-‐‑‒]", " ", s)

    # 4. Clean up any double commas or redundant whitespace created by replacements
    s = re.sub(r",\s*,+", ",", s)
    s = re.sub(r"([.!?])\s*,", r"\1", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def clean_caption_text(text: str) -> str:
    """Ensure display caption text is clean UTF-8 with zero mojibake."""
    s = text.strip()
    mojibake_map = {
        "â€”": " — ",
        "â€“": " – ",
        "â€™": "’",
        "â€˜": "‘",
        "â€œ": "“",
        "â€\x9d": "”",
        "€": "",
    }
    for bad, good in mojibake_map.items():
        s = s.replace(bad, good)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def format_vtt_time(seconds: float) -> str:
    ms = int(round((seconds - int(seconds)) * 1000))
    total_s = int(seconds)
    s = total_s % 60
    m = (total_s // 60) % 60
    h = total_s // 3600
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def normalize_utterance(samples: np.ndarray, target_rms_db: float = TARGET_VOICE_RMS_DB) -> np.ndarray:
    samples = np.asarray(samples, dtype=np.float64)
    rms = np.sqrt(np.mean(samples ** 2)) + 1e-12
    target_rms = 10.0 ** (target_rms_db / 20.0)
    scaled = samples * (target_rms / rms)
    peak = np.max(np.abs(scaled)) + 1e-12
    if peak > 0.84:
        # Soft tanh saturation above 0.75 so peaks never exceed 0.85 (-1.4 dBFS)
        scaled = np.tanh(scaled / 0.84) * 0.84
    return scaled


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lines", required=True, help="Path to script/lines.json")
    ap.add_argument("--out-dir", required=True, help="Path to audio output directory")
    ap.add_argument("--cache-dir", default="~/.cache/story-animation-models")
    args = ap.parse_args()

    cache_root = Path(args.cache_dir).expanduser().resolve()
    model_path = cache_root / "kokoro" / "kokoro-v1.0.onnx"
    voices_path = cache_root / "kokoro" / "voices-v1.0.bin"

    out_dir = Path(args.out_dir).resolve()
    lines_dir = out_dir / "lines"
    lines_dir.mkdir(parents=True, exist_ok=True)

    spec = json.loads(Path(args.lines).read_text(encoding="utf-8"))
    cast = spec["cast"]
    utterances = spec["lines"]
    scenes_meta = spec.get("scenes", [])

    # 1. Verify unique voice per speaking character
    assigned_voices = {}
    for speaker, info in cast.items():
        v = info["voice"]
        if v in assigned_voices:
            raise ValueError(
                f"Duplicate Kokoro voice '{v}' shared by '{speaker}' and '{assigned_voices[v]}'. "
                "Every speaking character must have a unique voice!"
            )
        assigned_voices[v] = speaker

    os.environ.update(HF_HUB_OFFLINE="1", HF_HUB_DISABLE_IMPLICIT_TOKEN="1")
    ort.disable_telemetry_events()
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 4
    opts.inter_op_num_threads = 1
    session = ort.InferenceSession(str(model_path), sess_options=opts, providers=["CPUExecutionProvider"])
    engine = Kokoro.from_session(session, str(voices_path))
    available_voices = set(engine.get_voices())

    for speaker, info in cast.items():
        if info["voice"] not in available_voices:
            raise ValueError(f"Unknown Kokoro stock voice '{info['voice']}' for speaker '{speaker}'")

    # 2. Synthesize each utterance and measure exact duration
    current_t = 0.65  # Opening breathing room
    timeline_lines = []
    prev_scene = None

    for idx, item in enumerate(utterances):
        line_id = item["id"]
        speaker = item["speaker"]
        scene_id = item["scene"]
        role_type = item.get("type", "dialogue" if speaker != "Narrator" else "narration")
        raw_text = clean_caption_text(item["text"])
        tts_text = sanitize_text_for_tts(raw_text)
        caption_text = clean_caption_text(item.get("caption", raw_text))

        if speaker not in cast:
            raise ValueError(f"Line {line_id} references uncast speaker '{speaker}'")

        voice_id = cast[speaker]["voice"]
        speed = float(item.get("speed", cast[speaker].get("speed", 1.0)))
        lang = cast[speaker].get("lang", "en-us")

        if prev_scene is not None and scene_id != prev_scene:
            current_t += float(item.get("scene_gap", 0.50))
        elif idx > 0:
            current_t += float(item.get("pause_before", 0.18))
        prev_scene = scene_id

        wav_path = lines_dir / f"{line_id}.wav"
        meta_path = lines_dir / f"{line_id}.json"

        raw_samples, sr = engine.create(tts_text, voice=voice_id, speed=speed, lang=lang)
        leveled = normalize_utterance(raw_samples)

        # Save 24kHz mono WAV and provenance JSON
        sf.write(str(wav_path), leveled.astype(np.float32), sr, subtype="PCM_16")
        dur = len(leveled) / float(sr)

        # Compute 20Hz envelope for lip-sync / visor reactivity in WebGL & 2D Canvas
        env_step = max(1, int(sr / 20))
        envelope = [
            round(float(np.sqrt(np.mean(leveled[i:i + env_step] ** 2)) * 3.5), 3)
            for i in range(0, len(leveled), env_step)
        ]

        start_t = round(current_t, 4)
        end_t = round(current_t + dur, 4)
        current_t = end_t

        line_record = {
            "id": line_id,
            "scene": scene_id,
            "speaker": speaker,
            "voice": voice_id,
            "speed": speed,
            "type": role_type,
            "shot": item.get("shot", "medium"),
            "camera_pan": item.get("camera_pan", [0.0, 0.0]),
            "camera_zoom": float(item.get("camera_zoom", 1.0)),
            "focal_subject": item.get("focal_subject", speaker),
            "implied_adaptation": bool(item.get("implied_adaptation", False)),
            "visual_description_cue": item.get("visual_description_cue", ""),
            "text": raw_text,
            "tts_text": tts_text,
            "caption": caption_text,
            "start": start_t,
            "end": end_t,
            "duration": round(dur, 4),
            "file": f"lines/{line_id}.wav",
            "sha256": hashlib.sha256(wav_path.read_bytes()).hexdigest(),
            "envelope_20hz": envelope,
        }
        meta_path.write_text(json.dumps(line_record, indent=2, ensure_ascii=False), encoding="utf-8")
        timeline_lines.append(line_record)
        print(f"[TTS] {line_id} ({speaker} / {voice_id}) [{start_t:.2f}s - {end_t:.2f}s] ({dur:.2f}s): {tts_text[:64]}...", flush=True)

    total_duration = round(current_t + 1.5, 3)

    # 3. Compute scene boundaries from line spans
    scene_map = {}
    for l in timeline_lines:
        sid = l["scene"]
        if sid not in scene_map:
            scene_map[sid] = {"start": l["start"], "end": l["end"], "lines": []}
        scene_map[sid]["start"] = min(scene_map[sid]["start"], l["start"])
        scene_map[sid]["end"] = max(scene_map[sid]["end"], l["end"])
        scene_map[sid]["lines"].append(l["id"])

    ordered_scenes = []
    scene_keys = [s["id"] for s in scenes_meta] if scenes_meta else list(scene_map.keys())
    meta_by_id = {s["id"]: s for s in scenes_meta}
    for i, sid in enumerate(scene_keys):
        if sid not in scene_map:
            continue
        s_start = 0.0 if i == 0 else round((ordered_scenes[-1]["end"] + scene_map[sid]["start"]) / 2.0, 3)
        if i > 0:
            ordered_scenes[-1]["end"] = s_start
            ordered_scenes[-1]["duration"] = round(ordered_scenes[-1]["end"] - ordered_scenes[-1]["start"], 3)
        s_end = total_duration if i == len(scene_keys) - 1 else round(scene_map[sid]["end"] + 0.35, 3)
        s_info = dict(meta_by_id.get(sid, {"id": sid, "title": sid}))
        s_info.update({
            "index": i,
            "start": s_start,
            "end": s_end,
            "duration": round(s_end - s_start, 3),
            "line_ids": scene_map[sid]["lines"],
        })
        ordered_scenes.append(s_info)

    # 4. Assemble 48 kHz stereo voice_stem.wav
    total_samples = int(round(total_duration * CANONICAL_SR))
    voice_stem = np.zeros((total_samples, 2), dtype=np.float64)

    for l in timeline_lines:
        wav_p = out_dir / l["file"]
        data, sr = sf.read(str(wav_p), dtype="float64")
        if sr != CANONICAL_SR:
            g = math.gcd(int(sr), CANONICAL_SR)
            data = signal.resample_poly(data, CANONICAL_SR // g, int(sr) // g)
        start_idx = int(round(l["start"] * CANONICAL_SR))
        end_idx = min(total_samples, start_idx + len(data))
        seg = data[: end_idx - start_idx]
        # Slight stereo pan by speaker role for spatial clarity while keeping center strong
        pan = float(cast[l["speaker"]].get("pan", 0.0))  # -0.20 .. +0.20
        left_gain = math.cos((pan + 1.0) * math.pi / 4.0) * math.sqrt(2.0)
        right_gain = math.sin((pan + 1.0) * math.pi / 4.0) * math.sqrt(2.0)
        voice_stem[start_idx:end_idx, 0] += seg * left_gain
        voice_stem[start_idx:end_idx, 1] += seg * right_gain

    voice_stem_path = out_dir / "voice_stem.wav"
    sf.write(str(voice_stem_path), voice_stem.astype(np.float32), CANONICAL_SR, subtype="PCM_16")

    # 5. Write WebVTT captions (captions.vtt)
    vtt_lines = ["WEBVTT", "Kind: captions", "Language: en", ""]
    for idx, l in enumerate(timeline_lines, 1):
        vtt_lines.append(str(idx))
        vtt_lines.append(f"{format_vtt_time(l['start'])} --> {format_vtt_time(l['end'])}")
        prefix = f"[{l['speaker']}] " if l["speaker"] != "Narrator" else "[Narrator] "
        vtt_lines.append(f"{prefix}{l['caption']}")
        vtt_lines.append("")
    (out_dir / "captions.vtt").write_text("\n".join(vtt_lines), encoding="utf-8")

    timeline_doc = {
        "title": spec.get("title", "Story Animation"),
        "subtitle": spec.get("subtitle", ""),
        "sample_rate": CANONICAL_SR,
        "total_duration": total_duration,
        "cast": cast,
        "scenes": ordered_scenes,
        "lines": timeline_lines,
    }
    (out_dir / "timeline.json").write_text(json.dumps(timeline_doc, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"TIMELINE_READY duration={total_duration:.2f}s scenes={len(ordered_scenes)} lines={len(timeline_lines)}", flush=True)


if __name__ == "__main__":
    main()
