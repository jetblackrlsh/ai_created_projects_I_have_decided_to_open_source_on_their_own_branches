#!/usr/bin/env python3
"""Generate Stable Audio Small Music (`sa3-sm-music`) & SFX (`sa3-sm-sfx`), layer non-dissonant
procedural Anime Combat/Magic/VN transients, align SFX to estimated within-page cue positions, and mix 48 kHz
stereo stems.

Enforces:
1. Per-Scene Original Music (`scenes[].music_prompt` or top-level `music_cues`) generated via
   local `sa3-sm-music` (`stabilityai/stable-audio-3-optimized` w8a8 LiteRT), cleaned with
   `clean_and_warm_music_clip` (`30.0s` diffusion tail trim + warm mastering EQ), verified for
   harmonic consonance (`max_flatness <= 0.05`, `max_clash_ratio <= 0.45`), and transitioned across
   scenes with smooth **non-overlapping** cosine fade-out to fade-in transitions (`music_overlap_sec == 0.0`).
2. Per-Shot / Per-Event Sound Effects (`sa3-sm-sfx`) layered with non-pitched percussive procedural
   transients (`transformation`, `solar_gunshot`, `beam_blast`, `fire_blast`, `attack_swing`,
   `claw_slash`, `barrier_shatter`, `heavy_impact`, `vn_text_blip`), aligned to estimated spoken `"cue"`
   phrases (`sfx_cue`) or timestamps (`at`/`line_id`), and strictly clamped to their scene boundary
   (`no_cross_scene_sfx_bleed: true`).
3. Clean Opening Rule: No disruptive SFX in the first `2.5` seconds of the video.
4. Strict Audio Loudness Hierarchy:
   - Voices (`voice_stem.wav`): `~ -13.5 dBFS` active RMS.
   - SFX (`sfx_stem.wav`): `~ -14.5 to -16.5 dBFS` active RMS (`~ -3.0 to -5.5 dBFS` peak).
   - Background Music (`music_stem.wav`): `-21.0 dBFS` RMS unducked, sidechain-ducked to `~ -27.5 dBFS`
     RMS under active speech/SFX so music stays continuously audible (`> -34.0 dBFS`) while
     `voice_over_music_margin_db >= 8.0 dB` and `sfx_over_music_margin_db >= 6.0 dB`.
"""
import argparse
import hashlib
import json
import math
import os
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
from scipy import signal
import soundfile as sf

SR = 48000


def db(val: float) -> float:
    return round(20.0 * math.log10(max(float(val), 1e-12)), 2)


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


def smooth_envelope(mask: np.ndarray, window_sec: float) -> np.ndarray:
    n = max(1, int(round(window_sec * SR)))
    kernel = np.ones(n, dtype=np.float64) / float(n)
    return signal.fftconvolve(np.pad(mask, (n // 2, n - 1 - n // 2), mode="edge"), kernel, mode="valid")


def analyze_audio(wav_path: Path) -> dict:
    data, sr = sf.read(str(wav_path), dtype="float64")
    mono = np.mean(data, axis=1) if data.ndim > 1 else data
    peak = float(np.max(np.abs(data))) + 1e-12
    rms = float(np.sqrt(np.mean(data ** 2))) + 1e-12
    win = max(1, int(0.15 * sr))
    if len(mono) > win:
        energy = np.convolve(mono ** 2, np.ones(win) / win, mode="valid")
        best_idx = int(np.argmax(energy))
        transient_offset = round(max(0.0, (best_idx / float(sr)) - 0.04), 3)
    else:
        transient_offset = 0.0
    return {
        "sample_rate": int(sr),
        "duration": round(len(data) / float(sr), 3),
        "peak_db": db(peak),
        "rms_db": db(rms),
        "transient_offset": transient_offset,
        "sha256": hashlib.sha256(wav_path.read_bytes()).hexdigest(),
    }


def generate_sa3_clip(
    py_bin: Path,
    sa3_script: Path,
    dit: str,
    name: str,
    prompt: str,
    seconds: float,
    seed: int,
    out_wav: Path,
    threads: int,
    steps: int = 8,
) -> dict:
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    meta_path = out_wav.with_suffix(".json")
    if out_wav.exists() and out_wav.stat().st_size > 16000 and meta_path.exists():
        print(f"[SA3 SKIP] {dit}:{name} already cached ({out_wav.name})", flush=True)
        return json.loads(meta_path.read_text(encoding="utf-8"))

    env = dict(os.environ)
    env.update(
        HF_HUB_OFFLINE="1",
        HF_HUB_DISABLE_IMPLICIT_TOKEN="1",
        OMP_NUM_THREADS=str(threads),
        OPENBLAS_NUM_THREADS="1",
        MKL_NUM_THREADS="1",
    )
    cmd = [
        str(py_bin),
        str(sa3_script),
        "--prompt", prompt,
        "--dit", dit,
        "--decoder", "same-s",
        "--dit-precision", "w8a8",
        "--decoder-precision", "w8a8",
        "--seconds", str(seconds),
        "--steps", str(steps),
        "--seed", str(seed),
        "--cfg", "1",
        "--threads", str(threads),
        "--out", str(out_wav),
    ]
    t0 = time.time()
    res = subprocess.run(cmd, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace")
    elapsed = round(time.time() - t0, 2)
    if res.returncode != 0:
        raise RuntimeError(
            f"Stable Audio Small failed on {dit}:{name} after {elapsed}s:\n"
            f"STDOUT:\n{res.stdout[-800:]}\nSTDERR:\n{res.stderr[-800:]}"
        )

    stats = analyze_audio(out_wav)
    record = {
        "name": name,
        "model": f"stabilityai/stable-audio-3-optimized ({dit} w8a8 LiteRT)",
        "dit": dit,
        "prompt": prompt,
        "seconds": seconds,
        "seed": seed,
        "steps": steps,
        "elapsed_sec": elapsed,
        "file": out_wav.name,
        **stats,
    }
    meta_path.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[SA3 OK] {dit}:{name} ({seconds}s) in {elapsed:.1f}s | peak={stats['peak_db']} dBFS rms={stats['rms_db']} dBFS", flush=True)
    return record


def infer_sfx_type(prompt: str, explicit_type: str = "") -> str:
    if explicit_type:
        return explicit_type.lower().strip()
    p = (prompt or "").lower()
    if any(w in p for w in ["revolver", "gunshot", "cannon", "solar beam", "blinding beam"]):
        return "solar_gunshot"
    if any(w in p for w in ["shatter", "shield", "barrier", "forcefield", "glass"]):
        return "barrier_shatter"
    if any(w in p for w in ["transform", "morph", "scales", "feline", "clasp"]):
        return "transformation"
    if any(w in p for w in ["blue fire", "flame", "fireball", "burning", "ignite", "explosion"]):
        return "fire_blast"
    if any(w in p for w in ["uppercut", "punch", "crashing", "splinter", "slam", "struck", "hit", "impact"]):
        return "heavy_impact"
    if any(w in p for w in ["vine", "root", "wooden", "earth", "soil", "stone"]):
        return "earth_magic"
    if any(w in p for w in ["slash", "claw", "leap", "pounce", "lunge", "swing", "whoosh", "sword", "blade"]):
        return "attack_swing"
    if any(w in p for w in ["magic", "glow", "surge", "aura", "chime", "power", "crystal", "astral", "ward"]):
        return "power_activation"
    return "none"


def synthesize_battle_sfx_layer(sfx_type: str, duration_sec: float = 2.8, seed: int = 42) -> np.ndarray | None:
    """Generates strictly non-pitched, percussive transient reinforcement (zero continuous midrange sine drones
    that would clash harmonically with background music)."""
    kind = (sfx_type or "none").lower().strip()
    if kind in ("none", "power_activation", "magic_surge", "crystal_ignite", "earth_magic", "roots_erupt"):
        # Pure Stable Audio Small SFX without synthetic sine drones so magical/nature cues never clash with music!
        return None
    rng = np.random.default_rng(seed)
    n = max(int(0.4 * SR), int(round(duration_sec * SR)))
    t = np.linspace(0.0, n / float(SR), n, endpoint=False, dtype=np.float64)
    left = np.zeros(n, dtype=np.float64)
    right = np.zeros(n, dtype=np.float64)

    if kind in ("transformation", "morph"):
        env = np.exp(-t / 0.32) * np.clip(t / 0.03, 0.0, 1.0)
        noise = rng.normal(0.0, 1.0, n)
        b, a = signal.butter(2, [280 / (SR / 2), 2600 / (SR / 2)], btype="band")
        crunch = signal.lfilter(b, a, noise) * env
        f_drop = 120.0 * np.exp(-t / 0.08) + 42.0
        thump = np.sin(2.0 * np.pi * np.cumsum(f_drop) / SR) * np.exp(-t / 0.18)
        left = 0.55 * thump + 0.45 * crunch
        right = 0.55 * thump + 0.45 * np.roll(crunch, 120)

    elif kind in ("solar_gunshot", "beam_blast", "gunshot"):
        crack_env = np.exp(-t / 0.045)
        boom_env = np.exp(-t / 0.24)
        noise = rng.normal(0.0, 1.0, n)
        b_hi, a_hi = signal.butter(2, [900 / (SR / 2), 5200 / (SR / 2)], btype="band")
        crack = signal.lfilter(b_hi, a_hi, noise) * crack_env * 1.2
        f_drop = 150.0 * np.exp(-t / 0.09) + 40.0
        ph_boom = 2.0 * np.pi * np.cumsum(f_drop) / SR
        boom = np.tanh(1.8 * np.sin(ph_boom)) * boom_env * 0.85
        sig = crack + boom
        left, right = sig, np.roll(sig, 65)

    elif kind in ("heavy_impact", "punch_hit", "wooden_impact", "slam"):
        hit_env = np.exp(-t / 0.18)
        f_punch = 140.0 * np.exp(-t / 0.05) + 42.0
        ph = 2.0 * np.pi * np.cumsum(f_punch) / SR
        thump = np.tanh(2.2 * np.sin(ph)) * hit_env
        noise = rng.normal(0.0, 1.0, n)
        b, a = signal.butter(2, [250 / (SR / 2), 3800 / (SR / 2)], btype="band")
        debris = signal.lfilter(b, a, noise) * np.exp(-t / 0.30)
        left = 0.70 * thump + 0.45 * debris
        right = 0.70 * thump + 0.45 * np.roll(debris, 110)

    elif kind in ("attack_swing", "claw_slash", "leap"):
        t0 = min(0.22, duration_sec * 0.30)
        whoosh_env = np.exp(-((t - t0) ** 2) / (2.0 * (0.075 ** 2)))
        noise = rng.normal(0.0, 1.0, n)
        b, a = signal.butter(2, [450 / (SR / 2), 3600 / (SR / 2)], btype="band")
        whoosh = signal.lfilter(b, a, noise) * whoosh_env
        left = 0.85 * whoosh
        right = 0.85 * np.roll(whoosh, 110)

    elif kind in ("barrier_shatter", "defense_shield"):
        shatter_env = np.exp(-t / 0.26)
        noise = rng.normal(0.0, 1.0, n)
        b, a = signal.butter(2, [1800 / (SR / 2), 6800 / (SR / 2)], btype="band")
        shards = signal.lfilter(b, a, noise) * shatter_env
        f_drop = 125.0 * np.exp(-t / 0.06) + 46.0
        boom = 0.60 * np.sin(2 * np.pi * np.cumsum(f_drop) / SR) * np.exp(-t / 0.16)
        left = shards + boom
        right = np.roll(shards, 95) + boom

    elif kind in ("fire_blast", "explosion", "solar_burn"):
        f_drop = 115.0 * np.exp(-t / 0.07) + 44.0
        boom = 0.75 * np.tanh(1.8 * np.sin(2 * np.pi * np.cumsum(f_drop) / SR)) * np.exp(-t / 0.22)
        roar_env = np.clip(t / 0.04, 0.0, 1.0) * np.exp(-t / 0.42)
        noise = rng.normal(0.0, 1.0, n)
        b, a = signal.butter(2, [160 / (SR / 2), 2200 / (SR / 2)], btype="band")
        roar = signal.lfilter(b, a, noise) * roar_env
        left = boom + 0.65 * roar
        right = boom + 0.65 * np.roll(roar, 140)

    else:
        return None

    stereo = np.column_stack([left, right])
    peak = float(np.max(np.abs(stereo))) + 1e-12
    return (stereo / peak) * 0.75


def clean_and_warm_music_clip(raw_music: np.ndarray) -> np.ndarray:
    """Trims the noisy 30-35s diffusion tail from a 35s Stable Audio Small clip and applies a warm
    mastering filter (65 Hz high-pass, -2.5 dB mud cut around 380 Hz, and 6800 Hz smooth low-pass)."""
    # Trim noisy diffusion tail (>29.2s) and initial click (<0.35s) if clip is >= 32s
    if len(raw_music) >= int(32.0 * SR):
        core = raw_music[int(0.35 * SR) : int(29.2 * SR)].copy()
    else:
        core = raw_music.copy()
    b_hp, a_hp = signal.butter(2, 65.0 / (SR / 2.0), btype="high")
    b_lp, a_lp = signal.butter(2, 6800.0 / (SR / 2.0), btype="low")
    b_mud, a_mud = signal.butter(2, [280.0 / (SR / 2.0), 540.0 / (SR / 2.0)], btype="band")
    out = np.zeros_like(core, dtype=np.float64)
    for ch in range(2):
        sig = signal.filtfilt(b_hp, a_hp, core[:, ch])
        sig = signal.filtfilt(b_lp, a_lp, sig)
        mud = signal.filtfilt(b_mud, a_mud, sig)
        out[:, ch] = sig - 0.24 * mud
    # Smooth 0.45s fade-in and 0.65s fade-out on the trimmed core so every loop pass is click-free
    fi = min(len(out) // 4, int(0.45 * SR))
    fo = min(len(out) // 4, int(0.65 * SR))
    if fi > 1:
        out[:fi] *= (0.5 * (1.0 - np.cos(np.linspace(0.0, math.pi, fi))))[:, None]
    if fo > 1:
        out[-fo:] *= (0.5 * (1.0 + np.cos(np.linspace(0.0, math.pi, fo))))[:, None]
    return out


def analyze_music_harmony(audio_stereo: np.ndarray) -> tuple[float, float]:
    """Returns (spectral_flatness, semitone_clash_ratio) in the melodic register (100-1600 Hz)."""
    mono = np.mean(audio_stereo, axis=1) if audio_stereo.ndim > 1 else audio_stereo
    f, _, Zxx = signal.stft(mono, fs=SR, nperseg=8192, noverlap=6144)
    mag = np.abs(Zxx)
    flatness = float(np.mean(np.exp(np.mean(np.log(mag + 1e-12), axis=0)) / (np.mean(mag, axis=0) + 1e-12)))
    mask = (f >= 100.0) & (f <= 1600.0)
    f_m = f[mask]
    mag_m = mag[mask, :]
    clash_frames = 0
    active_frames = 0
    for col in range(mag_m.shape[1]):
        spec = mag_m[:, col]
        if np.max(spec) < 1e-4:
            continue
        active_frames += 1
        peaks, _ = signal.find_peaks(spec, distance=4, prominence=np.max(spec) * 0.20)
        notes = [69.0 + 12.0 * np.log2(f_m[p] / 440.0) for p in peaks]
        has_clash = False
        for i in range(len(notes)):
            for j in range(i + 1, len(notes)):
                diff = abs(notes[i] - notes[j]) % 12.0
                diff = min(diff, 12.0 - diff)
                if 0.55 <= diff <= 1.45:
                    has_clash = True
        if has_clash:
            clash_frames += 1
    clash_ratio = clash_frames / float(max(1, active_frames))
    return round(flatness, 4), round(clash_ratio, 4)


def format_vtt_time(seconds: float) -> str:
    ms = int(round((seconds - int(seconds)) * 1000))
    total_s = int(seconds)
    s = total_s % 60
    m = (total_s // 60) % 60
    h = total_s // 3600
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def collect_music_and_sfx_specs(spec: dict, timeline: dict) -> tuple[list[dict], list[dict], list[dict]]:
    """Supports both unified `scenes[].music_prompt` + `lines[].sfx_events` AND `music_cues` + `sfx_score`."""
    music_cues = list(spec.get("music_cues", []))
    if not music_cues:
        for idx, sc in enumerate(spec.get("scenes", [])):
            mp = sc.get("music_prompt")
            if mp:
                music_cues.append({
                    "name": f"bgm_{sc['id'].lower()}",
                    "prompt": mp,
                    "seed": int(sc.get("music_seed", 101 + idx * 17)),
                    "seconds": float(sc.get("music_seconds", 35.0)),
                    "start_scene": sc["id"],
                    "end_scene": sc["id"],
                })

    sfx_clips_map = {}
    for clip in spec.get("sfx_score", {}).get("clips", []):
        sfx_clips_map[clip["name"]] = clip

    sfx_events = list(spec.get("sfx_score", {}).get("events", []))
    lines_by_id = {l["id"]: l for l in timeline["lines"]}

    for l_idx, raw_line in enumerate(spec.get("lines", [])):
        lid = raw_line["id"]
        line_events = list(raw_line.get("sfx_events", []))
        if not line_events and raw_line.get("sfx_prompt"):
            line_events.append({
                "name": f"sfx_{lid.lower()}",
                "prompt": raw_line["sfx_prompt"],
                "type": raw_line.get("sfx_type", ""),
                "seed": int(raw_line.get("sfx_seed", 300 + l_idx * 7)),
                "seconds": float(raw_line.get("sfx_duration_sec", 3.5)),
                "cue": raw_line.get("sfx_cue", ""),
                "align": raw_line.get("sfx_align", "start"),
                "offset_sec": float(raw_line.get("sfx_offset_sec", 0.0)),
            })
        for ev_i, ev in enumerate(line_events):
            cname = ev.get("clip") or ev.get("name") or f"sfx_{lid.lower()}_{ev_i + 1}"
            if cname not in sfx_clips_map and ev.get("prompt"):
                sfx_clips_map[cname] = {
                    "name": cname,
                    "prompt": ev["prompt"],
                    "seed": int(ev.get("seed", 400 + l_idx * 11 + ev_i)),
                    "seconds": float(ev.get("seconds", 3.5)),
                    "type": ev.get("type", ""),
                }
            sfx_events.append({
                "id": ev.get("id", f"ev_{lid}_{ev_i + 1}"),
                "clip": cname,
                "line_id": lid,
                "type": ev.get("type", sfx_clips_map.get(cname, {}).get("type", "")),
                "cue": ev.get("cue", ""),
                "anchor": ev.get("align", ev.get("anchor", "start")),
                "offset_sec": float(ev.get("offset_sec", 0.0)),
                "duration": float(ev.get("duration", ev.get("seconds", 3.2))),
                "description": ev.get("description") or ev.get("prompt", cname).split(",")[0],
            })

    return music_cues, list(sfx_clips_map.values()), sfx_events


def resolve_sfx_time(ev: dict, lines_by_id: dict, scenes_by_id: dict, title_end: float) -> float:
    if "at" in ev:
        t = float(ev["at"])
    elif "line_id" in ev and ev["line_id"] in lines_by_id:
        line = lines_by_id[ev["line_id"]]
        cue = str(ev.get("cue", "")).strip().lower()
        text_low = line["text"].lower()
        cap_pages = line.get("caption_pages", [])
        matched_page = None
        if cue and cap_pages:
            for cp in cap_pages:
                if cue in cp["text"].lower():
                    matched_page = cp
                    break
        if matched_page is not None:
            p_low = matched_page["text"].lower()
            ratio = p_low.index(cue) / float(max(1, len(p_low)))
            p_speech = float(matched_page.get("speech_duration", max(0.2, matched_page["end"] - matched_page["start"])))
            t = float(matched_page["start"]) + ratio * p_speech + float(ev.get("offset_sec", 0.0))
        elif cue and cue in text_low:
            ratio = text_low.index(cue) / float(max(1, len(text_low)))
            l_speech = float(line.get("speech_duration", line["duration"]))
            t = line["start"] + ratio * l_speech + float(ev.get("offset_sec", 0.0))
        else:
            anchor = str(ev.get("anchor", "start")).lower()
            if anchor == "end":
                base = max(line["start"], line.get("speech_end", line["end"]) - 1.0)
            elif anchor in ("middle", "mid"):
                base = (line["start"] + line.get("speech_end", line["end"])) * 0.5
            else:
                base = line["start"]
            t = base + float(ev.get("offset_sec", 0.0))
    elif "scene_id" in ev and ev["scene_id"] in scenes_by_id:
        sc = scenes_by_id[ev["scene_id"]]
        frac = float(ev.get("scene_progress", 0.25))
        t = sc["start"] + sc["duration"] * frac + float(ev.get("offset_sec", 0.0))
    else:
        t = title_end + 1.0
    # Enforce Clean Opening Rule: never place disruptive SFX in the first 2.5s
    return max(max(2.5, title_end + 0.15), t)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--spec", required=True, help="Path to script/vn_story_spec.json")
    ap.add_argument("--timeline", required=True, help="Path to audio/timeline.json")
    ap.add_argument("--audio-dir", required=True, help="Path to project audio directory")
    ap.add_argument("--cache-dir", default="~/.cache/story-animation-models")
    ap.add_argument("--threads", type=int, default=min(8, os.cpu_count() or 4))
    ap.add_argument("--sa3-python", help="Python executable for the official Stable Audio runtime")
    ap.add_argument("--sa3-script", help="Path to official sa3_tflite.py runtime")
    args = ap.parse_args()

    cache_root = Path(args.cache_dir).expanduser().resolve()
    py_bin = Path(args.sa3_python).expanduser() if args.sa3_python else Path(sys.executable)
    sa3_script = Path(args.sa3_script).expanduser() if args.sa3_script else cache_root / "stable-audio-3" / "optimized" / "tflite" / "scripts" / "sa3_tflite.py"
    if not sa3_script.exists():
        raise FileNotFoundError(f"Missing Stable Audio Small runtime script at {sa3_script}")

    audio_dir = Path(args.audio_dir).resolve()
    music_dir = audio_dir / "music"
    sfx_dir = audio_dir / "sfx"

    spec = json.loads(Path(args.spec).read_text(encoding="utf-8"))
    timeline = json.loads(Path(args.timeline).read_text(encoding="utf-8"))

    music_cues, sfx_clips, sfx_events = collect_music_and_sfx_specs(spec, timeline)

    music_records = []
    for cue in music_cues:
        rec = generate_sa3_clip(
            py_bin=py_bin,
            sa3_script=sa3_script,
            dit="sm-music",
            name=cue["name"],
            prompt=cue["prompt"],
            seconds=float(cue.get("seconds", 35.0)),
            seed=int(cue["seed"]),
            out_wav=music_dir / f"{cue['name']}.wav",
            threads=args.threads,
            steps=int(cue.get("steps", 8)),
        )
        music_records.append(rec)

    sfx_records = []
    for clip in sfx_clips:
        rec = generate_sa3_clip(
            py_bin=py_bin,
            sa3_script=sa3_script,
            dit="sm-sfx",
            name=clip["name"],
            prompt=clip["prompt"],
            seconds=float(clip.get("seconds", 3.5)),
            seed=int(clip["seed"]),
            out_wav=sfx_dir / f"{clip['name']}.wav",
            threads=args.threads,
            steps=int(clip.get("steps", 8)),
        )
        sfx_records.append(rec)

    sa3_manifest = {
        "generator": "Stable Audio Small LiteRT (sa3-sm-music + sa3-sm-sfx) + Procedural Anime Battle Transients",
        "music_cues": music_records,
        "sfx_clips": sfx_records,
    }
    (audio_dir / "sa3_manifest.json").write_text(json.dumps(sa3_manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    # Mix Stems (48 kHz Stereo)
    total_dur = float(timeline["total_duration"])
    total_samples = int(round(total_dur * SR))
    title_end = float(timeline.get("title_card", {}).get("end", 3.5))
    credits_start = float(timeline.get("credits_card", {}).get("start", total_dur - 4.5))

    voice_stem = load_48k_stereo(audio_dir / "voice_stem.wav")
    if len(voice_stem) < total_samples:
        voice_stem = np.pad(voice_stem, ((0, total_samples - len(voice_stem)), (0, 0)))
    else:
        voice_stem = voice_stem[:total_samples]

    lines_by_id = {l["id"]: l for l in timeline["lines"]}
    scenes_by_id = {s["id"]: s for s in timeline["scenes"]}

    speech_occupied = np.zeros(total_samples, dtype=np.float64)
    for l in timeline["lines"]:
        i0 = max(0, int(round(l["start"] * SR)))
        i1 = min(total_samples, int(round(l["end"] * SR)))
        speech_occupied[i0:i1] = 1.0
    speech_env = np.clip(smooth_envelope(speech_occupied, 0.22), 0.0, 1.0)

    sfx_stem = np.zeros((total_samples, 2), dtype=np.float64)
    sfx_activity = np.zeros(total_samples, dtype=np.float64)
    sfx_cache = {}
    placed_sfx_events = []

    for ev_idx, ev in enumerate(sfx_events):
        clip_name = ev["clip"]
        wav_path = sfx_dir / f"{clip_name}.wav"
        if clip_name not in sfx_cache:
            sfx_cache[clip_name] = load_48k_stereo(wav_path)

        raw_clip = sfx_cache[clip_name]
        at_sec = resolve_sfx_time(ev, lines_by_id, scenes_by_id, title_end)
        src_off = float(ev.get("src_offset", 0.0))
        dur_sec = float(ev.get("duration", min(3.0, len(raw_clip) / float(SR) - src_off)))

        s0 = max(0, int(round(src_off * SR)))
        seg = raw_clip[s0 : s0 + int(round(dur_sec * SR))].copy()
        if len(seg) < int(0.25 * SR):
            seg = raw_clip[: int(round(min(2.8, len(raw_clip) / float(SR)) * SR))].copy()

        # Optional non-pitched percussive transient reinforcement
        sfx_type = infer_sfx_type(ev.get("description", ""), ev.get("type", ""))
        if sfx_type == "none":
            # Strip muddy low-frequency diffusion rumble (< 160 Hz) from ambient/foley SFX
            b_hp_sfx, a_hp_sfx = signal.butter(2, 160.0 / (SR / 2.0), btype="high")
            for ch in range(2):
                seg[:, ch] = signal.filtfilt(b_hp_sfx, a_hp_sfx, seg[:, ch])
            default_target_rms = 10.0 ** (-18.5 / 20.0)
            max_boost = 4.0  # Max +12 dB boost so quiet ambient clips never become loud drones over music
        else:
            battle_layer = synthesize_battle_sfx_layer(sfx_type, duration_sec=len(seg) / float(SR), seed=500 + ev_idx)
            if battle_layer is not None:
                m_len = min(len(seg), len(battle_layer))
                seg_rms = float(np.sqrt(np.mean(seg[:m_len] ** 2))) + 1e-12
                bat_rms = float(np.sqrt(np.mean(battle_layer[:m_len] ** 2))) + 1e-12
                seg = 0.82 * (seg[:m_len] / seg_rms) + 0.18 * (battle_layer[:m_len] / bat_rms)
            default_target_rms = 10.0 ** (-14.5 / 20.0)
            max_boost = 12.0

        target_rms = float(ev.get("target_rms", default_target_rms))
        cur_rms = float(np.sqrt(np.mean(seg ** 2))) + 1e-12
        gain = min(max_boost, target_rms / cur_rms)
        seg = seg * gain
        peak_ceiling = float(ev.get("target_peak", 0.72))
        cur_peak = float(np.max(np.abs(seg))) + 1e-12
        if cur_peak > peak_ceiling:
            seg = np.tanh(seg / peak_ceiling) * peak_ceiling

        n_seg = len(seg)
        dst_start = max(int(round(max(2.5, title_end) * SR)), min(total_samples - n_seg, int(round(at_sec * SR))))
        dst_end = dst_start + n_seg

        # Prevent cross-scene SFX bleed: clamp SFX end to its scene boundary (-0.15s) so it never bleeds into the next chapter's opening music!
        ev_scene_id = ev.get("scene_id") or (lines_by_id.get(ev.get("line_id", ""), {}).get("scene"))
        if ev_scene_id and ev_scene_id in scenes_by_id:
            sc_end_sec = float(scenes_by_id[ev_scene_id]["end"])
            max_dst_end = int(round((sc_end_sec - 0.15) * SR))
            if dst_end > max_dst_end and max_dst_end - dst_start >= int(0.45 * SR):
                dst_end = max_dst_end
                n_seg = dst_end - dst_start
                seg = seg[:n_seg].copy()

        fi_len = min(n_seg // 3, max(1, int(round(float(ev.get("fade_in_sec", 0.08)) * SR))))
        fo_len = min(n_seg // 2, max(1, int(round(float(ev.get("fade_out_sec", 0.28)) * SR))))
        env_win = np.ones(n_seg, dtype=np.float64)
        if fi_len > 1:
            env_win[:fi_len] = 0.5 * (1.0 - np.cos(np.linspace(0.0, math.pi, fi_len)))
        if fo_len > 1:
            env_win[-fo_len:] *= 0.5 * (1.0 + np.cos(np.linspace(0.0, math.pi, fo_len)))
        seg *= env_win[:, None]

        local_speech = speech_env[dst_start:dst_end]
        seg *= (1.0 - 0.14 * local_speech)[:, None]

        sfx_stem[dst_start:dst_end] += seg
        seg_mono_env = np.mean(np.abs(seg), axis=1)
        active_mask = (seg_mono_env > 0.025).astype(np.float64)
        if np.sum(active_mask) < int(0.2 * SR):
            active_mask[:] = 1.0
        sfx_activity[dst_start:dst_end] = np.maximum(sfx_activity[dst_start:dst_end], active_mask)

        placed_sfx_events.append({
            "id": ev.get("id", f"sfx_{ev_idx + 1:02d}"),
            "clip": clip_name,
            "scene_id": ev_scene_id or "",
            "type": sfx_type,
            "description": ev.get("description", clip_name.replace("_", " ")),
            "start": round(dst_start / float(SR), 3),
            "end": round(dst_end / float(SR), 3),
            "duration": round(n_seg / float(SR), 3),
            "peak_db": db(np.max(np.abs(seg))),
            "rms_db": db(np.sqrt(np.mean(seg ** 2))),
        })

    sfx_peak = np.max(np.abs(sfx_stem)) + 1e-12
    if sfx_peak > 0.78:
        sfx_stem = np.tanh(sfx_stem / 0.78) * 0.78
    sf.write(str(audio_dir / "sfx_stem.wav"), sfx_stem.astype(np.float32), SR, subtype="PCM_16")

    # Build Background Music Stem (`music_stem.wav`) with Smooth, Non-Overlapping Scene & Loop Transitions
    music_bed = np.zeros((total_samples, 2), dtype=np.float64)
    base_music_rms = 10.0 ** (-21.0 / 20.0)
    placed_music_cues = []

    for idx, cue in enumerate(music_cues):
        wav_path = music_dir / f"{cue['name']}.wav"
        raw_music = load_48k_stereo(wav_path)
        warm_music = clean_and_warm_music_clip(raw_music)
        flatness, clash_ratio = analyze_music_harmony(warm_music)
        cur_rms = float(np.sqrt(np.mean(warm_music ** 2))) + 1e-12
        norm_music = warm_music * (base_music_rms / cur_rms)

        if "start_scene" in cue and "end_scene" in cue and cue["start_scene"] in scenes_by_id:
            t_start = 0.0 if idx == 0 else float(scenes_by_id[cue["start_scene"]]["start"])
            t_end = total_dur if idx == len(music_cues) - 1 else float(scenes_by_id[cue["end_scene"]]["end"])
        else:
            t_start = 0.0 if idx == 0 else float(cue.get("at", 0.0))
            t_end = total_dur if idx == len(music_cues) - 1 else float(cue.get("end", total_dur))

        # Strictly prevent any overlap with the previous music track
        if placed_music_cues and t_start < placed_music_cues[-1]["actual_end"]:
            t_start = placed_music_cues[-1]["actual_end"]

        i_start = int(round(t_start * SR))
        i_end = min(total_samples, int(round(t_end * SR)))
        span_len = i_end - i_start
        if span_len <= 0:
            continue

        if len(norm_music) < span_len:
            tiled = np.zeros((span_len, 2), dtype=np.float64)
            pos = 0
            loop_fade = int(1.1 * SR)
            while pos < span_len:
                rem = span_len - pos
                # If remaining tail is shorter than 5.5s, take a smooth middle phrase from norm_music (never reverse audio!)
                if pos > 0 and rem < int(5.5 * SR):
                    mid_start = min(max(0, len(norm_music) - rem - int(2.0 * SR)), int(4.0 * SR))
                    tail_src = norm_music[mid_start : mid_start + rem].copy()
                    if len(tail_src) > loop_fade:
                        fi_r = 0.5 * (1.0 - np.cos(np.linspace(0.0, math.pi, loop_fade)))[:, None]
                        tail_src[:loop_fade] *= fi_r
                    tiled[pos : pos + len(tail_src)] = tail_src
                    pos += len(tail_src)
                    break
                take = min(len(norm_music), rem)
                chunk = norm_music[:take].copy()
                if pos > 0 and take > loop_fade:
                    fi_r = 0.5 * (1.0 - np.cos(np.linspace(0.0, math.pi, loop_fade)))[:, None]
                    chunk[:loop_fade] *= fi_r
                if pos + take < span_len and take > loop_fade:
                    fo_r = 0.5 * (1.0 + np.cos(np.linspace(0.0, math.pi, loop_fade)))[:, None]
                    chunk[-loop_fade:] *= fo_r
                tiled[pos : pos + take] = chunk
                pos += take
            seg = tiled
        else:
            seg = norm_music[:span_len].copy()

        xf_in_sec = 1.6 if idx == 0 else 1.4
        xf_out_sec = 2.4 if idx == len(music_cues) - 1 else 1.4
        xf_in = min(span_len // 3, int(round(xf_in_sec * SR)))
        xf_out = min(span_len // 3, int(round(xf_out_sec * SR)))
        if xf_in > 0:
            seg[:xf_in] *= (0.5 * (1.0 - np.cos(np.linspace(0.0, math.pi, xf_in))))[:, None]
        if xf_out > 0:
            seg[-xf_out:] *= (0.5 * (1.0 + np.cos(np.linspace(0.0, math.pi, xf_out))))[:, None]

        music_bed[i_start:i_end] += seg
        cue_out = dict(cue)
        cue_out.update({
            "actual_start": round(i_start / float(SR), 3),
            "actual_end": round(i_end / float(SR), 3),
            "fade_in_sec": round(xf_in / float(SR), 3),
            "fade_out_sec": round(xf_out / float(SR), 3),
            "spectral_flatness": flatness,
            "semitone_clash_ratio": clash_ratio,
        })
        placed_music_cues.append(cue_out)

    max_music_overlap_sec = 0.0
    for m_i in range(1, len(placed_music_cues)):
        ov = max(0.0, placed_music_cues[m_i - 1]["actual_end"] - placed_music_cues[m_i]["actual_start"])
        max_music_overlap_sec = max(max_music_overlap_sec, ov)
    max_flatness = max((c.get("spectral_flatness", 0.0) for c in placed_music_cues), default=0.0)
    max_clash_ratio = max((c.get("semitone_clash_ratio", 0.0) for c in placed_music_cues), default=0.0)
    no_cross_scene_sfx = all(
        (not ev.get("scene_id")) or (ev["end"] <= scenes_by_id[ev["scene_id"]]["end"] + 0.01)
        for ev in placed_sfx_events if ev.get("scene_id") in scenes_by_id
    )

    sfx_env = np.clip(smooth_envelope(sfx_activity, 0.14), 0.0, 1.0)
    combined_activity = np.maximum(speech_env, 0.85 * sfx_env)
    music_gain_env = 1.0 - 0.54 * combined_activity
    music_stem = music_bed * music_gain_env[:, None]
    sf.write(str(audio_dir / "music_stem.wav"), music_stem.astype(np.float32), SR, subtype="PCM_16")

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

    timeline["sfx_events"] = placed_sfx_events
    timeline["music_cues"] = placed_music_cues
    Path(args.timeline).write_text(json.dumps(timeline, indent=2, ensure_ascii=False), encoding="utf-8")

    # Update captions.vtt with per-page TTS subtitle cues + placed SFX events
    vtt_entries = [
        (0.2, title_end - 0.2, f"[TITLE CARD] {timeline['title']} — {timeline.get('subtitle', '')}".strip(" —"))
    ]
    for l in timeline["lines"]:
        c_pages = l.get("caption_pages", [])
        if c_pages:
            for cp in c_pages:
                vtt_entries.append((cp["start"], cp["end"], f"[{l['speaker']}] {cp['text']}"))
        else:
            vtt_entries.append((l["start"], l["end"], f"[{l['speaker']}] {l['caption']}"))
    for ev in placed_sfx_events:
        vtt_entries.append((ev["start"], min(ev["end"], ev["start"] + 2.2), f"[SFX: {ev['description']}]"))
    vtt_entries.append((
        credits_start + 0.2,
        total_dur - 0.2,
        "[CREDITS] Voice Cast: Kokoro TTS | Music & SFX: Stable Audio Small | Visuals: Built-In AI Image Generator",
    ))
    vtt_entries.sort(key=lambda x: (x[0], x[1]))

    vtt_out = ["WEBVTT", "Kind: captions", "Language: en", ""]
    for idx, (st, et, txt) in enumerate(vtt_entries, 1):
        vtt_out.extend([str(idx), f"{format_vtt_time(st)} --> {format_vtt_time(et)}", txt, ""])
    (audio_dir / "captions.vtt").write_text("\n".join(vtt_out), encoding="utf-8")

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
        "music_overlap_sec": round(max_music_overlap_sec, 4),
        "music_max_spectral_flatness": round(max_flatness, 4),
        "music_max_semitone_clash_ratio": round(max_clash_ratio, 4),
        "smooth_music_transitions": bool(max_music_overlap_sec == 0.0 and all(c.get("fade_in_sec", 0.0) >= 1.0 and c.get("fade_out_sec", 0.0) >= 1.0 for c in placed_music_cues)),
        "clean_opening_no_disruptive_sfx": all(ev["start"] >= 2.5 for ev in placed_sfx_events),
        "checks": {
            "voices_louder_than_music": bool(voice_over_music_db >= 8.0),
            "sfx_louder_than_music": bool(sfx_over_music_db >= 6.0),
            "music_remains_audible": bool(-33.0 <= music_ducked_rms_db <= -18.0),
            "unique_voices_verified": len(timeline["cast"]) == len({v["voice"] for v in timeline["cast"].values()}),
            "no_overlapping_music_tracks": bool(max_music_overlap_sec == 0.0),
            "no_cross_scene_sfx_bleed": bool(no_cross_scene_sfx),
            "consonant_music_tracks": bool(max_flatness <= 0.05 and max_clash_ratio <= 0.45),
        },
    }
    (audio_dir / "audio_verification.json").write_text(json.dumps(verification, indent=2), encoding="utf-8")
    print(json.dumps(verification, indent=2), flush=True)


if __name__ == "__main__":
    main()
