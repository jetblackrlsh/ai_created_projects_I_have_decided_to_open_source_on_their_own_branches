#!/usr/bin/env python3
"""Measured, summed-bus priority mixing. No perceptual audibility guarantee.

Compare stereo power (never phase-cancelling mono) in aligned 250 ms windows.
Priority applies only where a meaningful foreground bus is active; silence is not louder
than anything. Natural music fades/rests remain intact. The report describes
the final, jointly scaled stems, not separately normalized source clips.
"""
import numpy as np

WINDOW_SEC = 0.25
VOICE_GATE_DB = -30.0
SFX_GATE_DB = -30.0
MUSIC_GATE_DB = -70.0
VOICE_SFX_DB = 6.0
SFX_MUSIC_DB = 6.0
VOICE_MUSIC_DB = 12.0
MUSIC_FLOOR_DB = -34.0


def _amp(db):
    return 10.0 ** (db / 20.0)


def _db(value):
    return float(20.0 * np.log10(max(float(value), 1e-12)))


def _stats(audio, window):
    starts = range(0, len(audio), window)
    rms, peak = [], []
    for start in starts:
        part = audio[start:start + window]
        rms.append(np.sqrt(np.mean(part ** 2)))
        peak.append(np.max(np.abs(part)))
    return np.asarray(rms), np.asarray(peak)


def _gain_curve(caps, length, window):
    # Each frame's two boundary gains are <= that frame's cap.
    # Linear interpolation is therefore smooth AND never exceeds the cap.
    # This offline look-ahead starts attenuation before a transient arrives.
    nodes = np.r_[caps[0], np.minimum(caps[:-1], caps[1:]), caps[-1]]
    positions = np.r_[np.arange(len(caps)) * window, length]
    return np.interp(np.arange(length), positions, nodes)


def _margin_report(high, low, active, required):
    both = active & (low > 1e-12)
    values = 20.0 * np.log10(np.maximum(high[both], 1e-12) / low[both])
    return {
        "required_db": required,
        "compared_windows": int(np.sum(both)),
        "minimum_db": float(np.min(values)) if len(values) else None,
        "violations": int(np.sum(values < required - 0.02)),
        "status": "pass" if len(values) and np.all(values >= required - 0.02)
                  else ("not_applicable" if not len(values) else "fail"),
    }


def mix_priority(voice, sfx, music, sample_rate=48000):
    """Return final voice, SFX, music, master, and JSON-safe measured audit.

    Inputs are equal-length N x 2 float arrays. Source mix gains remain the
    producer's responsibility. This stage only attenuates lower-priority buses;
    it never amplifies silence/noise to fake an audible music floor.
    """
    tracks = [np.asarray(x, dtype=np.float64).copy() for x in (voice, sfx, music)]
    if sample_rate <= 0:
        raise ValueError("sample_rate must be positive")
    if any(x.ndim != 2 or x.shape[1] != 2 for x in tracks):
        raise ValueError("Expected stereo N x 2 stems")
    if any(x.shape != tracks[0].shape for x in tracks):
        raise ValueError("Stem lengths must match")
    if not len(tracks[0]) or any(not np.all(np.isfinite(x)) for x in tracks):
        raise ValueError("Stems must be nonempty and finite")
    voice, sfx, music = tracks
    window = max(1, round(sample_rate * WINDOW_SEC))
    vr, vp = _stats(voice, window)
    sr, sp = _stats(sfx, window)
    mr, _ = _stats(music, window)
    va, sa, ma = vr >= _amp(VOICE_GATE_DB), sr >= _amp(SFX_GATE_DB), mr >= _amp(MUSIC_GATE_DB)

    # Decay tails below the bed are not foreground effects.
    sa = sa & (sr >= mr * _amp(SFX_MUSIC_DB))

    # Crucially, attenuate the SUM of all overlapping SFX, not each event.
    s_caps = np.minimum(1.0, _amp(-9.0) / np.maximum(sp, 1e-12))
    s_caps[va] = np.minimum(s_caps[va],
        vr[va] / np.maximum(sr[va], 1e-12) / _amp(VOICE_SFX_DB))
    sfx *= _gain_curve(np.clip(s_caps, 0.0, 1.0), len(sfx), window)[:, None]
    sr, sp = _stats(sfx, window)

    m_caps = np.ones_like(mr)
    m_caps[va] = np.minimum(m_caps[va], vr[va] / np.maximum(mr[va], 1e-12) / _amp(VOICE_MUSIC_DB))
    m_caps[sa] = np.minimum(m_caps[sa], sr[sa] / np.maximum(mr[sa], 1e-12) / _amp(SFX_MUSIC_DB))
    music *= _gain_curve(np.clip(m_caps, 0.0, 1.0), len(music), window)[:, None]

    # Common linear headroom retains all bus ratios and avoids tanh masking.
    master = voice + sfx + music
    scale = min(1.0, _amp(-1.5) / max(float(np.max(np.abs(master))), 1e-12))
    voice *= scale
    sfx *= scale
    music *= scale
    master *= scale
    vr, vp = _stats(voice, window)
    sr, sp = _stats(sfx, window)
    mr, _ = _stats(music, window)
    music_below_floor = ma & (mr < _amp(MUSIC_FLOOR_DB))
    report = {
        "version": 1,
        "window_sec": WINDOW_SEC,
        "measurement": "aligned 250 ms stereo-power RMS; foreground voice above -30 dBFS, SFX above -30 dBFS and 6 dB above source music; quiet tails excluded",
        "activity_gates_dbfs": {"voice": VOICE_GATE_DB, "sfx": SFX_GATE_DB, "music": MUSIC_GATE_DB},
        "voice_over_sfx": _margin_report(vr, sr, va & sa, VOICE_SFX_DB),
        "voice_over_music": _margin_report(vr, mr, va & ma, VOICE_MUSIC_DB),
        "sfx_over_music": _margin_report(sr, mr, sa & ma, SFX_MUSIC_DB),
        "sfx_peak_dbfs": _db(np.max(np.abs(sfx))),
        "sfx_peak_ceiling_dbfs": -9.0,
        "master_peak_dbfs": _db(np.max(np.abs(master))),
        "common_headroom_gain_db": _db(scale),
        "music_floor_target_dbfs": MUSIC_FLOOR_DB,
        "music_present_windows": int(np.sum(ma)),
        "music_below_floor_windows": int(np.sum(music_below_floor)),
        "music_below_floor_ranges_sec": [
            [round(i * window / sample_rate, 3), round(min((i + 1) * window, len(music)) / sample_rate, 3)]
            for i in np.flatnonzero(music_below_floor)
        ],
        "music_floor_status": "review_required" if np.any(music_below_floor) else
                             ("pass" if np.any(ma) else "not_applicable"),
        "limitations": "250 ms foreground RMS hierarchy is not instantaneous sample ordering or perceived loudness. Natural rests/fades and quiet foreground may fall below music floor; review those intervals. Playback volume, hearing and masking affect audibility.",
    }
    return voice, sfx, music, master, report

