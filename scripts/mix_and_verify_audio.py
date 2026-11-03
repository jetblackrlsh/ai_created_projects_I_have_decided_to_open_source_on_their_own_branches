#!/usr/bin/env python3
"""Mix Kokoro TTS Voice Stem, Stable Audio 3 SFX Stem, and Stable Audio 3 Music Stem.

Enforces the strict loudness hierarchy and clean SFX rules required by the skill:
- Dialogue & Narration (`voice_stem.wav`) and SFX (`sfx_stem.wav`) are significantly
  louder than the background music (`music_stem.wav`).
- Clean Opening Rule: Never place a disruptive SFX in the first 2.5s of the animation
  while the viewer settles into the opening narration.
- Natural Attack Preservation: SFX clips play from `src_offset = 0.0` by default (never
  chopping into the middle of a waveform) with smooth cosine fade-in (120ms) and fade-out (350ms).
- Background music is sidechain/envelope ducked under speech and SFX, yet remains
  clearly audible throughout every scene.
"""
import argparse
import json
import math
import subprocess
from pathlib import Path

import numpy as np
from scipy import signal
import soundfile as sf

SR = 48000


def load_48k_stereo(path: Path) -> np.ndarray:
    data, sr = sf.read(str(path), dtype="float64")
    if data.ndim == 1:
        data = np.stack([data, data], axis=1)
    elif data.shape[1] > 2:
        data = data[:, :2]
    if int(sr) != SR:
        g = math.gcd(int(sr), SR)
        data = signal.resample_poly(data, SR // g, int(sr) // g, axis=0)
    return data


def db(val: float) -> float:
    return round(20.0 * math.log10(max(float(val), 1e-12)), 2)


def smooth_envelope(mask: np.ndarray, window_sec: float) -> np.ndarray:
    n = max(1, int(round(window_sec * SR)))
    kernel = np.ones(n, dtype=np.float64) / float(n)
    return signal.fftconvolve(np.pad(mask, (n // 2, n - 1 - n // 2), mode="edge"), kernel, mode="valid")


def format_vtt_time(seconds: float) -> str:
    ms = int(round((seconds - int(seconds)) * 1000))
    total_s = int(seconds)
    s = total_s % 60
    m = (total_s // 60) % 60
    h = total_s // 3600
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def resolve_anchor_time(ev: dict, lines_by_id: dict, scenes_by_id: dict) -> float:
    if "at" in ev:
        t = float(ev["at"])
    elif "line_id" in ev:
        line = lines_by_id[ev["line_id"]]
        anchor = ev.get("anchor", "end")
        base = line["start"] if anchor == "start" else (
            line["end"] if anchor == "end" else (line["start"] + line["end"]) * 0.5
        )
        t = base + float(ev.get("offset_sec", 0.0))
    elif "scene_id" in ev:
        sc = scenes_by_id[ev["scene_id"]]
        frac = float(ev.get("scene_progress", 0.25))
        t = sc["start"] + sc["duration"] * frac + float(ev.get("offset_sec", 0.0))
    else:
        t = 3.5
    # Enforce Clean Opening Rule: never place an SFX earlier than 2.6s into the video
    return max(2.6, t)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--timeline", required=True, help="Path to audio/timeline.json")
    ap.add_argument("--music", required=True, help="Path to script/music_cues.json")
    ap.add_argument("--sfx", required=True, help="Path to script/sfx_score.json")
    ap.add_argument("--audio-dir", required=True, help="Path to project audio directory")
    args = ap.parse_args()

    audio_dir = Path(args.audio_dir).resolve()
    timeline = json.loads(Path(args.timeline).read_text(encoding="utf-8"))
    music_spec = json.loads(Path(args.music).read_text(encoding="utf-8"))
    sfx_spec = json.loads(Path(args.sfx).read_text(encoding="utf-8"))

    total_dur = float(timeline["total_duration"])
    total_samples = int(round(total_dur * SR))

    voice_stem = load_48k_stereo(audio_dir / "voice_stem.wav")
    if len(voice_stem) < total_samples:
        voice_stem = np.pad(voice_stem, ((0, total_samples - len(voice_stem)), (0, 0)))
    else:
        voice_stem = voice_stem[:total_samples]

    lines_by_id = {l["id"]: l for l in timeline["lines"]}
    scenes_by_id = {s["id"]: s for s in timeline["scenes"]}

    # Build speech occupancy mask
    speech_occupied = np.zeros(total_samples, dtype=np.float64)
    for l in timeline["lines"]:
        i0 = max(0, int(round(l["start"] * SR)))
        i1 = min(total_samples, int(round(l["end"] * SR)))
        speech_occupied[i0:i1] = 1.0
    speech_env = np.clip(smooth_envelope(speech_occupied, 0.22), 0.0, 1.0)

    # 1. Build SFX Stem (sfx_stem.wav)
    sfx_stem = np.zeros((total_samples, 2), dtype=np.float64)
    sfx_activity = np.zeros(total_samples, dtype=np.float64)
    sfx_cache = {}
    placed_sfx_events = []

    for ev_idx, ev in enumerate(sfx_spec.get("events", [])):
        clip_name = ev["clip"]
        wav_path = audio_dir / "sfx" / f"{clip_name}.wav"
        if clip_name not in sfx_cache:
            sfx_cache[clip_name] = load_48k_stereo(wav_path)

        raw_clip = sfx_cache[clip_name]
        at_sec = resolve_anchor_time(ev, lines_by_id, scenes_by_id)
        # Always start from 0.0 unless src_offset is explicitly specified in sfx_score.json
        src_off = float(ev.get("src_offset", 0.0))
        dur_sec = float(ev.get("duration", min(3.2, len(raw_clip) / float(SR) - src_off)))

        s0 = max(0, int(round(src_off * SR)))
        seg = raw_clip[s0: s0 + int(round(dur_sec * SR))].copy()
        if len(seg) < int(0.25 * SR):
            seg = raw_clip[: int(round(min(2.8, len(raw_clip) / float(SR)) * SR))].copy()

        # Normalize clip to target peak (-5.2 dBFS default, i.e. peak ~ 0.55)
        peak_target = float(ev.get("target_peak", 0.55))
        cur_peak = float(np.max(np.abs(seg))) + 1e-12
        seg = seg * (peak_target / cur_peak)

        # Apply smooth raised-cosine fade-in (120ms default) and fade-out (350ms default)
        n_seg = len(seg)
        fi_len = min(n_seg // 3, max(1, int(round(float(ev.get("fade_in_sec", 0.12)) * SR))))
        fo_len = min(n_seg // 2, max(1, int(round(float(ev.get("fade_out_sec", 0.35)) * SR))))
        env = np.ones(n_seg, dtype=np.float64)
        if fi_len > 1:
            env[:fi_len] = 0.5 * (1.0 - np.cos(np.linspace(0.0, math.pi, fi_len)))
        if fo_len > 1:
            env[-fo_len:] *= 0.5 * (1.0 + np.cos(np.linspace(0.0, math.pi, fo_len)))
        seg *= env[:, None]

        dst_start = max(int(2.6 * SR), min(total_samples - n_seg, int(round(at_sec * SR))))
        dst_end = dst_start + n_seg

        # Duck SFX slightly (0.78x) on samples where speech is actively peaking so voice stays crystal clear
        local_speech = speech_env[dst_start:dst_end]
        speech_duck_factor = 1.0 - 0.22 * local_speech
        seg *= speech_duck_factor[:, None]

        sfx_stem[dst_start:dst_end] += seg
        sfx_activity[dst_start:dst_end] = np.maximum(sfx_activity[dst_start:dst_end], 1.0)

        ev_rms_db = db(np.sqrt(np.mean(seg ** 2)))
        ev_peak_db = db(np.max(np.abs(seg)))
        placed_sfx_events.append({
            "id": ev.get("id", f"sfx_{ev_idx + 1:02d}"),
            "clip": clip_name,
            "description": ev.get("description", clip_name.replace("_", " ")),
            "start": round(dst_start / float(SR), 3),
            "end": round(dst_end / float(SR), 3),
            "duration": round(n_seg / float(SR), 3),
            "peak_db": ev_peak_db,
            "rms_db": ev_rms_db,
        })

    # Soft ceiling on SFX stem at 0.76 (-2.4 dBFS)
    sfx_peak = np.max(np.abs(sfx_stem)) + 1e-12
    if sfx_peak > 0.76:
        sfx_stem = np.tanh(sfx_stem / 0.76) * 0.76

    sf.write(str(audio_dir / "sfx_stem.wav"), sfx_stem.astype(np.float32), SR, subtype="PCM_16")

    # 2. Build Background Music Stem (music_stem.wav)
    music_bed = np.zeros((total_samples, 2), dtype=np.float64)
    base_music_rms = 10.0 ** (-21.5 / 20.0)
    cues = music_spec.get("cues", [])

    for idx, cue in enumerate(cues):
        wav_path = audio_dir / "music" / f"{cue['name']}.wav"
        raw_music = load_48k_stereo(wav_path)
        cur_rms = float(np.sqrt(np.mean(raw_music ** 2))) + 1e-12
        norm_music = raw_music * (base_music_rms / cur_rms)

        if "start_scene" in cue and "end_scene" in cue:
            t_start = scenes_by_id[cue["start_scene"]]["start"]
            t_end = scenes_by_id[cue["end_scene"]]["end"]
        else:
            t_start = float(cue.get("at", 0.0))
            t_end = float(cue.get("end", total_dur))

        if idx > 0:
            t_start = max(0.0, t_start - 1.5)
        if idx < len(cues) - 1:
            t_end = min(total_dur, t_end + 1.5)

        i_start = int(round(t_start * SR))
        i_end = min(total_samples, int(round(t_end * SR)))
        span_len = i_end - i_start
        if span_len <= 0:
            continue

        if len(norm_music) < span_len:
            tiled = np.zeros((span_len, 2), dtype=np.float64)
            pos = 0
            xf = int(1.5 * SR)
            while pos < span_len:
                take = min(len(norm_music), span_len - pos)
                chunk = norm_music[:take].copy()
                if pos > 0 and take > xf:
                    ramp = np.linspace(0.0, 1.0, xf)[:, None]
                    tiled[pos:pos + xf] = tiled[pos:pos + xf] * (1.0 - ramp) + chunk[:xf] * ramp
                    tiled[pos + xf:pos + take] = chunk[xf:]
                else:
                    tiled[pos:pos + take] = chunk
                pos += len(norm_music) - xf
            seg = tiled
        else:
            seg = norm_music[:span_len].copy()

        xf_in = min(span_len // 3, int(1.8 * SR))
        xf_out = min(span_len // 3, int(2.0 * SR))
        if xf_in > 0:
            seg[:xf_in] *= np.linspace(0.0, 1.0, xf_in)[:, None]
        if xf_out > 0:
            seg[-xf_out:] *= np.linspace(1.0, 0.0, xf_out)[:, None]

        music_bed[i_start:i_end] += seg

    sfx_env = np.clip(smooth_envelope(sfx_activity, 0.14), 0.0, 1.0)
    combined_activity = np.maximum(speech_env, 0.80 * sfx_env)
    music_gain_env = 1.0 - 0.52 * combined_activity
    music_stem = music_bed * music_gain_env[:, None]

    sf.write(str(audio_dir / "music_stem.wav"), music_stem.astype(np.float32), SR, subtype="PCM_16")

    # 3. Combine Stems into Master Mix (master.wav & master.m4a)
    master = voice_stem + sfx_stem + music_stem
    master_peak = float(np.max(np.abs(master))) + 1e-12
    if master_peak > 0.89:
        master = np.tanh(master / 0.89) * 0.89

    master_path = audio_dir / "master.wav"
    sf.write(str(master_path), master.astype(np.float32), SR, subtype="PCM_16")
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(master_path), "-c:a", "aac", "-b:a", "192k", "-ar", str(SR),
         str(audio_dir / "master.m4a")],
        check=True,
    )

    # 4. Update timeline.json and captions.vtt with placed SFX events
    timeline["sfx_events"] = placed_sfx_events
    timeline["music_cues"] = cues
    Path(args.timeline).write_text(json.dumps(timeline, indent=2, ensure_ascii=False), encoding="utf-8")

    vtt_entries = []
    for l in timeline["lines"]:
        tag = f"[{l['speaker']}]"
        vtt_entries.append((l["start"], l["end"], f"{tag} {l['caption']}"))
    for ev in placed_sfx_events:
        vtt_entries.append((ev["start"], min(ev["end"], ev["start"] + 2.2), f"[SFX: {ev['description']}]"))
    vtt_entries.sort(key=lambda x: (x[0], x[1]))

    vtt_out = ["WEBVTT", "Kind: captions", "Language: en", ""]
    for idx, (st, et, txt) in enumerate(vtt_entries, 1):
        vtt_out.append(str(idx))
        vtt_out.append(f"{format_vtt_time(st)} --> {format_vtt_time(et)}")
        vtt_out.append(txt)
        vtt_out.append("")
    (audio_dir / "captions.vtt").write_text("\n".join(vtt_out), encoding="utf-8")

    # 5. Quantitative Loudness Hierarchy & Clean Opening Verification
    speech_idx = speech_occupied > 0.5
    non_speech_idx = speech_occupied <= 0.1
    sfx_idx = sfx_activity > 0.5

    voice_active_rms_db = db(np.sqrt(np.mean(voice_stem[speech_idx] ** 2)))
    music_ducked_rms_db = db(np.sqrt(np.mean(music_stem[speech_idx] ** 2)))
    music_unducked_rms_db = db(np.sqrt(np.mean(music_stem[non_speech_idx] ** 2))) if np.any(non_speech_idx) else music_ducked_rms_db
    sfx_active_rms_db = db(np.sqrt(np.mean(sfx_stem[sfx_idx] ** 2))) if np.any(sfx_idx) else -20.0
    sfx_peak_db = db(np.max(np.abs(sfx_stem)))

    voice_over_music_db = round(voice_active_rms_db - music_ducked_rms_db, 2)
    sfx_over_music_db = round(sfx_active_rms_db - music_ducked_rms_db, 2)
    opening_sfx_peak = float(np.max(np.abs(sfx_stem[:int(2.5 * SR)]))) if total_samples > int(2.5 * SR) else 0.0

    verification = {
        "sample_rate": SR,
        "duration_sec": total_dur,
        "master_peak_db": db(np.max(np.abs(master))),
        "master_rms_db": db(np.sqrt(np.mean(master ** 2))),
        "voice_active_rms_db": voice_active_rms_db,
        "sfx_active_rms_db": sfx_active_rms_db,
        "sfx_peak_db": sfx_peak_db,
        "music_ducked_rms_db": music_ducked_rms_db,
        "music_unducked_rms_db": music_unducked_rms_db,
        "voice_over_music_margin_db": voice_over_music_db,
        "sfx_over_music_margin_db": sfx_over_music_db,
        "opening_2_5s_sfx_peak": round(opening_sfx_peak, 5),
        "checks": {
            "dialogue_louder_than_music": bool(voice_over_music_db >= 8.0),
            "sfx_louder_than_music": bool(sfx_over_music_db >= 6.0),
            "music_remains_audible": bool(-34.0 <= music_ducked_rms_db <= -18.0),
            "unique_voices_verified": len(timeline["cast"]) == len({v["voice"] for v in timeline["cast"].values()}),
            "clean_opening_no_disruptive_sfx": bool(opening_sfx_peak < 0.02),
        },
    }
    (audio_dir / "audio_verification.json").write_text(json.dumps(verification, indent=2), encoding="utf-8")
    print(json.dumps(verification, indent=2), flush=True)


if __name__ == "__main__":
    main()
