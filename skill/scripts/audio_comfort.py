#!/usr/bin/env python3
"""Bounded, offline SFX-only harsh-band control; not a comfort guarantee."""
import numpy as np
from scipy.signal import butter, sosfiltfilt
from audio_priority import _stats, _gain_curve


def soften_sfx(audio, sample_rate=48000):
    """Return conditioned stereo SFX and a transparent processing report.

    Keep source files, duration, voices and music unchanged. Attenuate only
    the 2.5-8 kHz band, by at most 6 dB, when it dominates a 100 ms window.
    This is a gentle heuristic, not a loudness or hearing-safety standard.
    """
    audio = np.asarray(audio, dtype=np.float64)
    if audio.ndim != 2 or audio.shape[1] != 2 or not np.all(np.isfinite(audio)):
        raise ValueError("Expected finite stereo N x 2 audio")
    if sample_rate <= 0:
        raise ValueError("sample_rate must be positive")
    report = {"processor": "bounded_sfx_harsh_band_v1", "band_hz": [2500, min(8000, sample_rate * .45)],
              "window_sec": .1, "maximum_allowed_attenuation_db": 6.0,
              "maximum_applied_attenuation_db": 0.0, "affected_duration_sec": 0.0,
              "limitations": "A spectral heuristic cannot guarantee listening comfort or hearing safety. Natural electricity/static remains recognizable; review on intended playback devices."}
    if len(audio) < 32 or sample_rate <= 5600:
        report["status"] = "bypassed_short_or_low_rate"
        return audio.copy(), report
    sos = butter(2, report["band_hz"], btype="bandpass", fs=sample_rate, output="sos")
    band = sosfiltfilt(sos, audio, axis=0)
    window = max(1, round(sample_rate * .1))
    full_rms, _ = _stats(audio, window)
    band_rms, _ = _stats(band, window)
    ratio = band_rms / np.maximum(full_rms, 1e-12)
    reduction_db = np.clip((ratio - .25) / .40, 0, 1) * 6.0
    reduction_db[full_rms < 10**(-60/20)] = 0
    gain = _gain_curve(10**(-reduction_db/20), len(audio), window)
    output = audio - band * (1 - gain[:, None])
    report.update(status="processed", maximum_applied_attenuation_db=float(np.max(reduction_db)),
                  affected_duration_sec=float(np.sum(gain < .999) / sample_rate),
                  input_peak=float(np.max(np.abs(audio))), output_peak=float(np.max(np.abs(output))))
    return output, report
