#!/usr/bin/env python3
"""Synthesize Kokoro TTS Voices with Character Vocal DSP for Anime Visual Novel Adaptations.

Enforces:
1. Unique Kokoro-82M stock voice ID for `Narrator` and every speaking character.
2. Full TTS pronunciation normalization:
   - Expands numeric dates (`MM/DD/YYYY` or `YYYY-MM-DD`) and written dates (`November 4th, 2026`)
     into natural spoken words (`November fourth, twenty twenty six`).
   - Replaces all em-dashes (`—`), en-dashes (`–`), hyphens (`-`), and mojibake so Kokoro never
     triggers its hyphen/"Euro" pronunciation bug.
3. Locked `speed = 1.0` (never altering speaking speed) + Drift-Free WSOLA Pitch-Shifting
   (`wsola_pitch_shift` anchored to `nominal_ana`), `subharmonic_mix`, `bass_boost_db`,
   `treble_boost_db`, `warmth_drive`, stereo `reverb_type` (`dark_lord`, `telepathic`, `ethereal`,
   `monster_raspy`), and `0.45s` natural release tails (`trim=False`, `tail_sec=0.45`) with strict
   inter-line (`>= 0.55s`) and inter-scene (`>= 1.35s`) transition gaps.
4. Sample-accurate per-page subtitle synthesis (`split_caption_into_pages` + `caption_pages`) so
   on-screen subtitles flip in exact lockstep with the spoken TTS audio (audio-derived timing at 24 fps).
5. Computes a 24fps speech amplitude envelope (`speech_env_24fps`) per line so the Anime Visual Novel
   ADV UI box can animate a live voice-reactive indicator while the character speaks.
6. Outputs 48 kHz stereo `voice_stem.wav`, `timeline.json` (with `caption_pages` and `sub_shots`
   timing), `captions.vtt`, and `subtitles.srt`.
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
FPS = 24

MONTH_NAMES = {
    1: "January", 2: "February", 3: "March", 4: "April",
    5: "May", 6: "June", 7: "July", 8: "August",
    9: "September", 10: "October", 11: "November", 12: "December",
}

ORDINAL_WORDS = {
    1: "first", 2: "second", 3: "third", 4: "fourth", 5: "fifth",
    6: "sixth", 7: "seventh", 8: "eighth", 9: "ninth", 10: "tenth",
    11: "eleventh", 12: "twelfth", 13: "thirteenth", 14: "fourteenth",
    15: "fifteenth", 16: "sixteenth", 17: "seventeenth", 18: "eighteenth",
    19: "nineteenth", 20: "twentieth", 21: "twenty first", 22: "twenty second",
    23: "twenty third", 24: "twenty fourth", 25: "twenty fifth",
    26: "twenty sixth", 27: "twenty seventh", 28: "twenty eighth",
    29: "twenty ninth", 30: "thirtieth", 31: "thirty first",
}

ONES_WORDS = [
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
]
TENS_WORDS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]


def two_digit_to_words(n: int) -> str:
    if n == 0:
        return ""
    if n < 20:
        return ONES_WORDS[n]
    tens, ones = divmod(n, 10)
    return f"{TENS_WORDS[tens]} {ONES_WORDS[ones]}".strip()


def year_to_words(year: int) -> str:
    if 2000 <= year <= 2009:
        rem = year - 2000
        return f"two thousand {ONES_WORDS[rem]}".strip()
    if 1900 <= year <= 2099:
        century, rem = divmod(year, 100)
        c_words = two_digit_to_words(century)
        if rem == 0:
            return f"{c_words} hundred"
        if rem < 10:
            return f"{c_words} oh {ONES_WORDS[rem]}"
        return f"{c_words} {two_digit_to_words(rem)}"
    return str(year)


def sanitize_text_for_tts(text: str) -> str:
    s = text.strip()
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

    def _replace_mdy(m: re.Match) -> str:
        mo, day, yr = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if 1 <= mo <= 12 and 1 <= day <= 31:
            return f"{MONTH_NAMES[mo]} {ORDINAL_WORDS[day]}, {year_to_words(yr)}"
        return m.group(0)

    s = re.sub(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b", _replace_mdy, s)

    def _replace_ymd(m: re.Match) -> str:
        yr, mo, day = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if 1 <= mo <= 12 and 1 <= day <= 31:
            return f"{MONTH_NAMES[mo]} {ORDINAL_WORDS[day]}, {year_to_words(yr)}"
        return m.group(0)

    s = re.sub(r"\b(\d{4})-(\d{1,2})-(\d{1,2})\b", _replace_ymd, s)

    month_pattern = "|".join(MONTH_NAMES.values())

    def _replace_written_date(m: re.Match) -> str:
        m_name = m.group(1)
        day = int(m.group(2))
        yr = int(m.group(3))
        if 1 <= day <= 31:
            return f"{m_name} {ORDINAL_WORDS[day]}, {year_to_words(yr)}"
        return m.group(0)

    s = re.sub(
        rf"\b({month_pattern})\s+(\d{{1,2}})(?:st|nd|rd|th)?,?\s+(\d{{4}})\b",
        _replace_written_date,
        s,
        flags=re.IGNORECASE,
    )

    s = re.sub(r"\s*[—–―‒]\s*", ", ", s)
    s = re.sub(r"\s*--+\s*", ", ", s)
    s = re.sub(r"\s+-\s+", ", ", s)
    s = re.sub(r"[-‐‑‒]", " ", s)
    s = re.sub(r",\s*,+", ",", s)
    s = re.sub(r"([.!?])\s*,", r"\1", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def clean_caption_text(text: str) -> str:
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


def _split_words_balanced(text: str, max_chars: int) -> list[str]:
    words = text.strip().split()
    if not words:
        return []
    total_len = len(" ".join(words))
    if total_len <= max_chars:
        return [" ".join(words)]
    n_parts = max(2, math.ceil(total_len / float(max_chars)))
    target_len = total_len / float(n_parts)
    chunks = []
    cur = []
    cur_len = 0
    for idx, w in enumerate(words):
        add = len(w) + (1 if cur else 0)
        rem_words = len(words) - idx
        rem_parts = n_parts - len(chunks)
        if cur and (cur_len + add > max_chars or (cur_len >= target_len and rem_words >= rem_parts and rem_parts > 1)):
            chunks.append(" ".join(cur))
            cur = [w]
            cur_len = len(w)
        else:
            cur.append(w)
            cur_len += add
    if cur:
        chunks.append(" ".join(cur))
    return chunks


def split_caption_into_pages(text: str, max_chars: int = 100) -> list[str]:
    """Splits a caption into balanced, natural clause/sentence subtitle pages (<= max_chars) for sample-accurate TTS sync."""
    clean = re.sub(r"\s+", " ", text.strip())
    if not clean:
        return [""]
    if len(clean) <= max_chars:
        return [clean]

    raw_sentences = [s.strip() for s in re.split(r'(?<=[.!?]["”’\'])\s+|(?<=[.!?])\s+', clean) if s.strip()]
    atomic_segments = []
    for sent in raw_sentences:
        if len(sent) <= max_chars:
            atomic_segments.append(sent)
        else:
            # Normalize em-dashes so the dash stays attached before splitting on clause boundaries
            sent_norm = re.sub(r"\s+([—–])\s+", r"\1 ", sent)
            clauses = [c.strip() for c in re.split(r'(?<=[,;:—–])\s+', sent_norm) if c.strip()]
            for cl in clauses:
                if len(cl) <= max_chars:
                    atomic_segments.append(cl)
                else:
                    atomic_segments.extend(_split_words_balanced(cl, max_chars))

    pages = []
    for seg in atomic_segments:
        if not pages:
            pages.append(seg)
            continue
        prev = pages[-1]
        combined = f"{prev} {seg}"
        prev_ends_sentence = prev.rstrip().endswith((".", "!", "?", '."', '!"', '?"', ".”", "!”", "?”"))
        # Keep distinct sentences on their own page when the previous page is already substantial
        if len(combined) <= max_chars and not (prev_ends_sentence and len(prev) >= 54 and len(seg) >= 36):
            pages[-1] = combined
        else:
            pages.append(seg)

    # Prevent tiny orphan tail pages (< 28 chars) by rebalancing the last two pages
    if len(pages) >= 2 and len(pages[-1]) < 28:
        merged_tail = f"{pages[-2]} {pages[-1]}"
        if len(merged_tail) <= max_chars + 8:
            pages[-2] = merged_tail
            pages.pop()
        else:
            rebalanced = _split_words_balanced(merged_tail, max_chars)
            pages = pages[:-2] + rebalanced

    return pages


def wsola_pitch_shift(audio_1d: np.ndarray, semitones: float, sample_rate: int) -> np.ndarray:
    """Drift-free WSOLA pitch shifter that strictly preserves 100% of the waveform and speed = 1.0."""
    if abs(semitones) < 0.05 or len(audio_1d) < 1024:
        return audio_1d.astype(np.float64)
    pitch_factor = 2.0 ** (semitones / 12.0)
    win_len = int(0.035 * sample_rate)
    if win_len % 2 == 1:
        win_len += 1
    hop_syn = win_len // 2
    hop_ana = float(hop_syn) / pitch_factor
    search_tol = min(win_len // 4, int(0.007 * sample_rate))
    max_drift = int(0.008 * sample_rate)  # Max 8ms local phase adjustment; zero cumulative drift!

    in_len = len(audio_1d)
    target_stretched_len = max(win_len + 1, int(round(in_len * pitch_factor)))
    window = np.hanning(win_len).astype(np.float64)
    out = np.zeros(target_stretched_len + win_len, dtype=np.float64)
    norm = np.zeros(target_stretched_len + win_len, dtype=np.float64)

    syn_pos = 0
    step_idx = 0
    prev_ana = 0

    while syn_pos + win_len <= target_stretched_len:
        nominal_ana = int(round(step_idx * hop_ana))
        if nominal_ana + win_len > in_len:
            break
        expected_ana = nominal_ana if step_idx == 0 else int(round(prev_ana + hop_ana))
        expected_ana = max(nominal_ana - max_drift, min(nominal_ana + max_drift, expected_ana))
        expected_ana = max(0, min(in_len - win_len, expected_ana))

        best_offset = 0
        if syn_pos > 0:
            overlap_ref = out[syn_pos : syn_pos + hop_syn]
            if float(np.dot(overlap_ref, overlap_ref)) > 1e-7:
                min_off = max(-expected_ana, -search_tol, (nominal_ana - max_drift) - expected_ana)
                max_off = min(in_len - win_len - expected_ana, search_tol, (nominal_ana + max_drift) - expected_ana)
                if max_off > min_off:
                    best_corr = -1e12
                    for off in range(int(min_off), int(max_off) + 1, 2):
                        cand = audio_1d[expected_ana + off : expected_ana + off + hop_syn]
                        c = float(np.dot(overlap_ref, cand))
                        if c > best_corr:
                            best_corr = c
                            best_offset = off
        actual_ana = expected_ana + best_offset
        seg = audio_1d[actual_ana : actual_ana + win_len]
        out[syn_pos : syn_pos + win_len] += seg * window
        norm[syn_pos : syn_pos + win_len] += window
        prev_ana = actual_ana
        syn_pos += hop_syn
        step_idx += 1

    valid = norm > 1e-4
    out[valid] /= norm[valid]
    stretched = out[:target_stretched_len]
    return signal.resample(stretched, in_len).astype(np.float64)


def trim_with_natural_release(samples_1d: np.ndarray, sr: int, lead_sec: float = 0.08, tail_sec: float = 0.45) -> tuple[np.ndarray, float]:
    """Trims excessive leading silence while preserving 100% of the final phoneme release + a dedicated
    `tail_sec` post-speech silence buffer so neither WSOLA, reverb, nor scene transitions ever cut off a word."""
    arr = np.asarray(samples_1d, dtype=np.float64).ravel()
    active = np.where(np.abs(arr) > 0.0035)[0]
    if len(active) == 0:
        return np.zeros(int(round(0.5 * sr)), dtype=np.float64), 0.0
    i0 = max(0, int(active[0]) - int(round(lead_sec * sr)))
    # Keep at least 0.14s of natural model release after the last active sample before appending tail_sec
    i1 = min(len(arr), int(active[-1]) + int(round(0.14 * sr)))
    core = arr[i0:i1]
    # Smooth 20ms fade-out on the natural release edge to prevent any DC click
    fade_len = min(len(core) // 4, int(round(0.02 * sr)))
    if fade_len > 1:
        core = core.copy()
        core[-fade_len:] *= np.linspace(1.0, 0.0, fade_len)
    speech_dur_sec = len(core) / float(sr)
    tail_pad = np.zeros(int(round(tail_sec * sr)), dtype=np.float64)
    return np.concatenate([core, tail_pad]), speech_dur_sec


def apply_character_voice_dsp(mono_48k: np.ndarray, spk_info: dict) -> np.ndarray:
    sig = np.asarray(mono_48k, dtype=np.float64).copy()
    pitch_st = float(spk_info.get("pitch_semitones", 0.0))
    if abs(pitch_st) >= 0.05:
        sig = wsola_pitch_shift(sig, pitch_st, CANONICAL_SR)

    sub_mix = float(spk_info.get("subharmonic_mix", 0.0))
    if sub_mix > 0.01 and len(sig) >= 1024:
        sub_oct = wsola_pitch_shift(sig, -12.0, CANONICAL_SR)
        b_lp, a_lp = signal.butter(2, 260.0 / (CANONICAL_SR / 2.0), btype="low")
        sub_low = signal.filtfilt(b_lp, a_lp, sub_oct)
        sig = (1.0 - 0.25 * sub_mix) * sig + sub_mix * sub_low

    bass_db = float(spk_info.get("bass_boost_db", 0.0))
    if abs(bass_db) >= 0.2 and len(sig) >= 256:
        b_b, a_b = signal.butter(2, 240.0 / (CANONICAL_SR / 2.0), btype="low")
        low_band = signal.filtfilt(b_b, a_b, sig)
        gain_b = (10.0 ** (bass_db / 20.0)) - 1.0
        sig = sig + gain_b * low_band

    treble_db = float(spk_info.get("treble_boost_db", 0.0))
    if abs(treble_db) >= 0.2 and len(sig) >= 256:
        b_t, a_t = signal.butter(2, 3000.0 / (CANONICAL_SR / 2.0), btype="high")
        high_band = signal.filtfilt(b_t, a_t, sig)
        gain_t = (10.0 ** (treble_db / 20.0)) - 1.0
        sig = sig + gain_t * high_band

    drive = float(spk_info.get("warmth_drive", 0.0))
    if drive > 0.01:
        k = 1.0 + 2.8 * drive
        sig = np.tanh(k * sig) / np.tanh(k)

    rev_type = str(spk_info.get("reverb_type", "none")).lower().strip()
    left = sig.copy()
    right = sig.copy()
    if rev_type == "dark_lord":
        taps_ms = [(31, 0.20, 0.14), (67, 0.13, 0.19), (113, 0.11, 0.09), (173, 0.07, 0.08)]
        b_r, a_r = signal.butter(2, 1800.0 / (CANONICAL_SR / 2.0), btype="low")
        dark_tail = signal.lfilter(b_r, a_r, sig)
        for ms, gl, gr in taps_ms:
            d = int(ms * CANONICAL_SR / 1000.0)
            if d < len(sig):
                left[d:] += gl * dark_tail[:-d]
                right[d:] += gr * dark_tail[:-d]
    elif rev_type == "telepathic":
        taps_ms = [(23, 0.22, 0.12), (53, 0.12, 0.22), (97, 0.14, 0.10), (149, 0.08, 0.12)]
        for ms, gl, gr in taps_ms:
            d = int(ms * CANONICAL_SR / 1000.0)
            if d < len(sig):
                left[d:] += gl * sig[:-d]
                right[d:] += gr * sig[:-d]
    elif rev_type == "ethereal":
        taps_ms = [(29, 0.16, 0.12), (61, 0.10, 0.15), (109, 0.08, 0.08)]
        for ms, gl, gr in taps_ms:
            d = int(ms * CANONICAL_SR / 1000.0)
            if d < len(sig):
                left[d:] += gl * sig[:-d]
                right[d:] += gr * sig[:-d]
    elif rev_type == "monster_raspy":
        d1 = int(0.014 * CANONICAL_SR)
        d2 = int(0.027 * CANONICAL_SR)
        if d2 < len(sig):
            left[d1:] += 0.22 * sig[:-d1]
            right[d2:] += 0.22 * sig[:-d2]

    pan = float(spk_info.get("pan", 0.0))
    left_gain = math.cos((pan + 1.0) * math.pi / 4.0) * math.sqrt(2.0)
    right_gain = math.sin((pan + 1.0) * math.pi / 4.0) * math.sqrt(2.0)
    stereo = np.column_stack([left * left_gain, right * right_gain])

    rms = np.sqrt(np.mean(stereo ** 2)) + 1e-12
    target_rms = 10.0 ** (TARGET_VOICE_RMS_DB / 20.0)
    scaled = stereo * (target_rms / rms)
    peak = np.max(np.abs(scaled)) + 1e-12
    if peak > 0.84:
        scaled = np.tanh(scaled / 0.84) * 0.84
    return scaled


def compute_24fps_envelope(stereo_48k: np.ndarray) -> list[float]:
    mono = np.mean(np.abs(stereo_48k), axis=1)
    samples_per_frame = CANONICAL_SR // FPS
    n_frames = max(1, int(math.ceil(len(mono) / float(samples_per_frame))))
    env = []
    for i in range(n_frames):
        seg = mono[i * samples_per_frame : (i + 1) * samples_per_frame]
        val = float(np.sqrt(np.mean(seg ** 2))) if len(seg) > 0 else 0.0
        env.append(round(min(1.0, val / 0.22), 3))
    return env


def format_vtt_time(seconds: float) -> str:
    ms = int(round((seconds - int(seconds)) * 1000))
    total_s = int(seconds)
    s = total_s % 60
    m = (total_s // 60) % 60
    h = total_s // 3600
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def format_srt_time(seconds: float) -> str:
    ms = int(round((seconds - int(seconds)) * 1000))
    total_s = int(seconds)
    s = total_s % 60
    m = (total_s // 60) % 60
    h = total_s // 3600
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--spec", required=True, help="Path to script/vn_story_spec.json")
    ap.add_argument("--out-dir", required=True, help="Path to audio output directory")
    ap.add_argument("--cache-dir", default="~/.cache/story-animation-models")
    args = ap.parse_args()

    cache_root = Path(args.cache_dir).expanduser().resolve()
    model_path = cache_root / "kokoro" / "kokoro-v1.0.onnx"
    voices_path = cache_root / "kokoro" / "voices-v1.0.bin"

    out_dir = Path(args.out_dir).resolve()
    lines_dir = out_dir / "lines"
    lines_dir.mkdir(parents=True, exist_ok=True)

    spec = json.loads(Path(args.spec).read_text(encoding="utf-8"))
    cast = spec["cast"]
    utterances = spec["lines"]
    scenes_meta = spec.get("scenes", [])

    title_duration = float(spec.get("title_duration", 3.5))
    credits_duration = float(spec.get("credits_duration", 4.5))

    assigned_voices = {}
    for speaker, info in cast.items():
        v = info["voice"]
        if v in assigned_voices:
            raise ValueError(
                f"Duplicate Kokoro voice '{v}' shared by '{speaker}' and '{assigned_voices[v]}'. "
                "Every speaking character + Narrator must have a unique voice!"
            )
        assigned_voices[v] = speaker

    os.environ.update(HF_HUB_OFFLINE="1", HF_HUB_DISABLE_IMPLICIT_TOKEN="1")
    ort.disable_telemetry_events()
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 6
    opts.inter_op_num_threads = 1
    session = ort.InferenceSession(str(model_path), sess_options=opts, providers=["CPUExecutionProvider"])
    engine = Kokoro.from_session(session, str(voices_path))
    available_voices = set(engine.get_voices())

    for speaker, info in cast.items():
        if info["voice"] not in available_voices:
            raise ValueError(f"Unknown Kokoro stock voice '{info['voice']}' for speaker '{speaker}'")
        # Enforce speed = 1.0 across all cast entries (never modify voice speed)
        info["speed"] = 1.0

    current_t = title_duration + 0.45
    timeline_lines = []
    prev_scene = None

    for idx, item in enumerate(utterances):
        line_id = item["id"]
        speaker = item["speaker"]
        scene_id = item["scene"]
        role_type = item.get("type", "dialogue" if speaker != "Narrator" else "narration")
        default_vn_mode = "NVL" if (speaker == "Narrator" and item.get("is_establishing_shot")) else "ADV"
        vn_mode = item.get("vn_mode", default_vn_mode).upper()

        raw_text = clean_caption_text(item["text"])
        tts_text = sanitize_text_for_tts(item.get("tts_text") or raw_text)
        caption_text = clean_caption_text(item.get("caption", raw_text))

        if speaker not in cast:
            raise ValueError(f"Line {line_id} references uncast speaker '{speaker}'")

        spk_info = dict(cast[speaker])
        # CRITICAL RULE: Never modify the speed of voices!
        # Modifying TTS speed (speed != 1.0) causes unforeseen phoneme/cadence side-effects and mistakes.
        spk_info["speed"] = 1.0

        voice_id = spk_info["voice"]
        speed = 1.0
        lang = spk_info.get("lang", "en-us")

        if prev_scene is not None and scene_id != prev_scene:
            # Strict scene transition rule: allow at least 1.35s gap (on top of the 0.45s tail inside the WAV)
            # so the previous scene's final line is 100% spoken, heard, and held before transitioning!
            current_t += max(1.35, float(item.get("scene_gap", 1.35)))
        elif idx > 0:
            # Strict line transition rule: allow at least 0.55s pause between lines (plus 0.45s tail inside WAV)
            current_t += max(0.55, float(item.get("pause_before", 0.55)))
        prev_scene = scene_id

        wav_path = lines_dir / f"{line_id}.wav"
        meta_path = lines_dir / f"{line_id}.json"

        # Synthesize each subtitle page individually at speed=1.0 with trim=False + trim_with_natural_release
        # so on-screen subtitle pagination is 100% sample-accurate to the spoken TTS audio (zero drift!).
        raw_pages = split_caption_into_pages(caption_text, max_chars=100)
        cached_meta = None
        if wav_path.exists() and meta_path.exists():
            try:
                cand_meta = json.loads(meta_path.read_text(encoding="utf-8"))
                if (
                    cand_meta.get("text") == raw_text
                    and cand_meta.get("voice") == voice_id
                    and abs(float(cand_meta.get("pitch_semitones", 0.0)) - float(spk_info.get("pitch_semitones", 0.0))) < 1e-4
                    and cand_meta.get("reverb_type", "none") == spk_info.get("reverb_type", "none")
                    and [cp.get("text") for cp in cand_meta.get("caption_pages", [])] == raw_pages
                ):
                    cached_meta = cand_meta
            except Exception:
                cached_meta = None

        if cached_meta is not None:
            stereo_48k, _ = sf.read(str(wav_path), dtype="float64")
            dur = len(stereo_48k) / float(CANONICAL_SR)
            speech_dur = float(cached_meta.get("speech_duration", max(0.25, dur - 0.45)))
            env_24fps = cached_meta.get("speech_env_24fps") or compute_24fps_envelope(stereo_48k)
            page_rel_records = cached_meta["caption_pages"]
            tts_text = cached_meta.get("tts_text", " ".join(p["tts_text"] for p in page_rel_records))
        else:
            page_audio_segments = []
            page_rel_records = []
            cum_samples = 0
            sr = 24000

            for p_idx, p_text in enumerate(raw_pages):
                p_tts = sanitize_text_for_tts(p_text)
                raw_p, sr = engine.create(p_tts, voice=voice_id, speed=1.0, lang=lang, trim=False)
                is_last_page = p_idx == len(raw_pages) - 1
                lead_s = 0.07 if p_idx == 0 else 0.03
                if is_last_page:
                    tail_s = 0.45
                else:
                    p_ends_sentence = p_text.rstrip().endswith((".", "!", "?", '."', '!"', '?"', ".”", "!”", "?”"))
                    tail_s = 0.24 if p_ends_sentence else 0.14
                padded_p, speech_dur_p = trim_with_natural_release(raw_p, int(sr), lead_sec=lead_s, tail_sec=tail_s)
                p_rel_start = cum_samples / float(sr)
                cum_samples += len(padded_p)
                p_rel_end = cum_samples / float(sr)
                page_audio_segments.append(padded_p)
                page_rel_records.append({
                    "page_index": p_idx,
                    "text": p_text,
                    "tts_text": p_tts,
                    "rel_start": round(p_rel_start, 4),
                    "rel_end": round(p_rel_end, 4),
                    "speech_duration": round(speech_dur_p, 4),
                })

            padded_raw = np.concatenate(page_audio_segments) if len(page_audio_segments) > 1 else page_audio_segments[0]
            speech_dur_raw = max(0.25, (cum_samples / float(sr)) - 0.45)
            tts_text = " ".join(p["tts_text"] for p in page_rel_records)

            if int(sr) != CANONICAL_SR:
                g = math.gcd(int(sr), CANONICAL_SR)
                mono_48k = signal.resample_poly(np.asarray(padded_raw, dtype=np.float64), CANONICAL_SR // g, int(sr) // g)
            else:
                mono_48k = np.asarray(padded_raw, dtype=np.float64)

            stereo_48k = apply_character_voice_dsp(mono_48k, spk_info)
            assert len(stereo_48k) == len(mono_48k), "Vocal DSP must never alter voice duration or speed!"
            sf.write(str(wav_path), stereo_48k.astype(np.float32), CANONICAL_SR, subtype="PCM_16")
            dur = len(stereo_48k) / float(CANONICAL_SR)
            speech_dur = min(dur, round(speech_dur_raw, 4))
            env_24fps = compute_24fps_envelope(stereo_48k)

        start_t = round(current_t, 4)
        end_t = round(current_t + dur, 4)
        speech_end_t = round(current_t + speech_dur, 4)
        current_t = end_t

        caption_pages_out = []
        for p_rec in page_rel_records:
            p_st = round(start_t + p_rec["rel_start"], 4)
            p_et = round(min(end_t, start_t + p_rec["rel_end"]), 4)
            if p_rec["page_index"] == len(page_rel_records) - 1:
                p_et = end_t
            caption_pages_out.append({
                "page_index": p_rec["page_index"],
                "text": p_rec["text"],
                "tts_text": p_rec["tts_text"],
                "rel_start": p_rec["rel_start"],
                "rel_end": p_rec["rel_end"],
                "start": p_st,
                "end": p_et,
                "speech_duration": p_rec["speech_duration"],
            })

        # Compute sub_shots timing within [start_t, end_t] if present
        sub_shots_out = []
        raw_sub_shots = item.get("sub_shots", [])
        for s_idx, sub in enumerate(raw_sub_shots, 1):
            sub_id = sub.get("id", f"{line_id}_sub{s_idx}")
            frac = min(0.70, max(0.25, float(sub.get("fraction", s_idx / float(len(raw_sub_shots) + 1)))))
            sub_shots_out.append({
                "id": sub_id,
                "fraction": frac,
                "image_file": f"shots/shot_{sub_id}.png",
                "camera_motion": sub.get("camera_motion", "zoom_in"),
                "zoom_amount": float(sub.get("zoom_amount", 0.14)),
                "vfx": sub.get("vfx", item.get("vfx", [])),
                "dof_blur": bool(sub.get("dof_blur", item.get("dof_blur", False))),
                "character_refs": sub.get("character_refs", item.get("character_refs", [] if speaker == "Narrator" else [speaker])),
            })

        line_record = {
            "id": line_id,
            "scene": scene_id,
            "speaker": speaker,
            "voice": voice_id,
            "speed": speed,
            "pitch_semitones": float(spk_info.get("pitch_semitones", 0.0)),
            "reverb_type": spk_info.get("reverb_type", "none"),
            "type": role_type,
            "vn_mode": vn_mode,
            "is_establishing_shot": bool(item.get("is_establishing_shot", False)),
            "shot": item.get("shot", "medium"),
            "camera_motion": item.get("camera_motion", "zoom_in"),
            "zoom_amount": float(item.get("zoom_amount", 0.14)),
            "dof_blur": bool(item.get("dof_blur", False)),
            "vfx": item.get("vfx", []),
            "character_refs": item.get("character_refs", [] if speaker == "Narrator" else [speaker]),
            "implied_adaptation": bool(item.get("implied_adaptation", False)),
            "image_file": f"shots/shot_{line_id}.png",
            "sub_shots": sub_shots_out,
            "text": raw_text,
            "tts_text": tts_text,
            "caption": caption_text,
            "caption_pages": caption_pages_out,
            "start": start_t,
            "speech_end": speech_end_t,
            "end": end_t,
            "speech_duration": round(speech_dur, 4),
            "duration": round(dur, 4),
            "speech_env_24fps": env_24fps,
            "file": f"lines/{line_id}.wav",
            "sha256": hashlib.sha256(wav_path.read_bytes()).hexdigest(),
        }
        meta_path.write_text(json.dumps(line_record, indent=2, ensure_ascii=False), encoding="utf-8")
        timeline_lines.append(line_record)
        print(
            f"[VN-TTS] {line_id} [{vn_mode}] ({speaker}/{voice_id} pitch={line_record['pitch_semitones']:+.1f}st, pages={len(caption_pages_out)}) "
            f"[{start_t:.2f}s - {end_t:.2f}s] (speech={speech_dur:.2f}s, total={dur:.2f}s): {tts_text[:64]}...",
            flush=True,
        )

    story_end_t = round(current_t + 1.15, 3)
    credits_start_t = story_end_t
    total_duration = round(credits_start_t + credits_duration, 3)

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
        # Ensure previous scene holds for at least 0.65s AFTER its final line's end_t before transitioning!
        s_start = round(title_duration, 3) if i == 0 else ordered_scenes[-1]["end"]
        if i == len(scene_keys) - 1:
            s_end = story_end_t
        else:
            next_sid = scene_keys[i + 1]
            next_first_start = scene_map[next_sid]["start"] if next_sid in scene_map else (scene_map[sid]["end"] + 1.35)
            # Hold current scene until at least 0.65s after its last line WAV ends (1.10s after last spoken word!)
            s_end = round(min(next_first_start - 0.25, max(scene_map[sid]["end"] + 0.65, (scene_map[sid]["end"] + next_first_start) * 0.65)), 3)
        s_info = dict(meta_by_id.get(sid, {"id": sid, "title": sid}))
        s_info.update({
            "index": i,
            "start": s_start,
            "end": s_end,
            "duration": round(s_end - s_start, 3),
            "line_ids": scene_map[sid]["lines"],
        })
        ordered_scenes.append(s_info)

    total_samples = int(round(total_duration * CANONICAL_SR))
    voice_stem = np.zeros((total_samples, 2), dtype=np.float64)

    for l in timeline_lines:
        wav_p = out_dir / l["file"]
        data, _ = sf.read(str(wav_p), dtype="float64")
        start_idx = int(round(l["start"] * CANONICAL_SR))
        end_idx = min(total_samples, start_idx + len(data))
        voice_stem[start_idx:end_idx] += data[: end_idx - start_idx]

    sf.write(str(out_dir / "voice_stem.wav"), voice_stem.astype(np.float32), CANONICAL_SR, subtype="PCM_16")

    # Write WebVTT and SRT subtitles using exact per-page TTS timestamps
    vtt_lines = ["WEBVTT", "Kind: captions", "Language: en", ""]
    srt_lines = []

    entries = [
        (0.2, title_duration - 0.2, f"[TITLE CARD] {spec.get('title', 'Anime Visual Novel')} — {spec.get('subtitle', '')}".strip(" —"))
    ]
    for l in timeline_lines:
        c_pages = l.get("caption_pages", [])
        if c_pages:
            for cp in c_pages:
                entries.append((cp["start"], cp["end"], f"[{l['speaker']}] {cp['text']}"))
        else:
            entries.append((l["start"], l["end"], f"[{l['speaker']}] {l['caption']}"))
    entries.append((
        credits_start_t + 0.2,
        total_duration - 0.2,
        "[CREDITS] Voice Cast: Kokoro TTS | Music & SFX: Stable Audio Small | Visuals: Built-in AI Image Generator",
    ))

    for idx, (st, et, txt) in enumerate(entries, 1):
        vtt_lines.extend([str(idx), f"{format_vtt_time(st)} --> {format_vtt_time(et)}", txt, ""])
        srt_lines.extend([str(idx), f"{format_srt_time(st)} --> {format_srt_time(et)}", txt, ""])

    (out_dir / "captions.vtt").write_text("\n".join(vtt_lines), encoding="utf-8")
    (out_dir / "subtitles.srt").write_text("\n".join(srt_lines), encoding="utf-8")

    timeline_doc = {
        "title": spec.get("title", "Anime Visual Novel Adaptation"),
        "subtitle": spec.get("subtitle", "A Kinetic Visual Novel Film"),
        "author_credit": spec.get("author_credit", "Adapted with Antigravity Anime Visual Novel Adapter"),
        "synopsis": spec.get("synopsis", ""),
        "date": spec.get("date", "11/04/2026"),
        "tags": spec.get("tags", []),
        "sample_rate": CANONICAL_SR,
        "title_card": {
            "start": 0.0,
            "end": round(title_duration, 3),
            "duration": round(title_duration, 3),
            "image_file": "title_bg.png",
        },
        "credits_card": {
            "start": credits_start_t,
            "end": total_duration,
            "duration": round(credits_duration, 3),
            "image_file": "credits_bg.png",
        },
        "total_duration": total_duration,
        "cast": cast,
        "character_sheets": spec.get("character_sheets", {}),
        "settings": spec.get("settings", {}),
        "scenes": ordered_scenes,
        "lines": timeline_lines,
    }
    (out_dir / "timeline.json").write_text(json.dumps(timeline_doc, indent=2, ensure_ascii=False), encoding="utf-8")
    print(
        f"VN_TIMELINE_READY total={total_duration:.2f}s (title={title_duration:.1f}s, "
        f"scenes={len(ordered_scenes)}, lines={len(timeline_lines)}, credits={credits_duration:.1f}s)",
        flush=True,
    )


if __name__ == "__main__":
    main()
