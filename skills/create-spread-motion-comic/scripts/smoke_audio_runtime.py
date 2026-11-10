#!/usr/bin/env python3
"""Generate and measure fresh, non-private offline Kokoro + Stable Audio smoke WAVs."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time


def measure(path, expected_rate, expected_channels, expected_seconds=None):
    import numpy as np
    import soundfile as sf
    audio, rate = sf.read(path, dtype='float64', always_2d=True)
    if rate != expected_rate or audio.shape[1] != expected_channels or not len(audio):
        raise RuntimeError(f'{path.name}: unexpected rate, channels, or empty output')
    if not np.isfinite(audio).all():
        raise RuntimeError(f'{path.name}: nonfinite audio')
    seconds = len(audio) / rate
    peak = float(np.abs(audio).max())
    rms = float(np.sqrt(np.mean(audio ** 2)))
    if seconds < .3 or rms <= 1e-5 or peak > 1.001:
        raise RuntimeError(f'{path.name}: silence, clipping, or invalid duration')
    if expected_seconds is not None and abs(seconds - expected_seconds) > .1:
        raise RuntimeError(f'{path.name}: wrong duration {seconds}')
    return {'file': str(path), 'sample_rate': rate, 'channels': audio.shape[1], 'samples': len(audio),
            'seconds': seconds, 'peak': peak, 'rms': rms, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--runtime-root', type=Path, required=True)
    p.add_argument('--out-dir', type=Path, required=True)
    p.add_argument('--threads', type=int, default=2)
    p.add_argument('--timeout', type=int, default=300)
    args = p.parse_args()
    # No inherited token is used. Upstream downloads must fail rather than start online inference.
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['HF_HUB_DISABLE_IMPLICIT_TOKEN'] = '1'
    for key in ('HF_TOKEN', 'HUGGING_FACE_HUB_TOKEN', 'HUGGINGFACE_TOKEN'):
        os.environ.pop(key, None)
    import numpy as np
    import soundfile as sf
    import onnxruntime as ort
    from kokoro_onnx import Kokoro
    root = args.runtime_root.resolve()
    out = args.out_dir.resolve()
    out.mkdir(parents=True, exist_ok=True)
    results = []
    started = time.monotonic()
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = args.threads
    opts.inter_op_num_threads = 1
    session = ort.InferenceSession(str(root / 'cache/kokoro/kokoro-v1.0.onnx'), sess_options=opts, providers=['CPUExecutionProvider'])
    engine = Kokoro.from_session(session, str(root / 'cache/kokoro/voices-v1.0.bin'))
    samples, rate = engine.create('The lantern glows beside the quiet garden.', voice='af_heart', speed=1.0, lang='en-us', trim=False)
    if not np.isfinite(samples).all():
        raise RuntimeError('Kokoro produced nonfinite values before WAV encoding')
    voice = out / 'kokoro.wav'
    sf.write(voice, samples, rate, subtype='FLOAT')
    results.append({'engine': 'kokoro-onnx', 'speed': 1.0, **measure(voice, 24000, 1)})
    del engine, session
    script = root / 'stable-audio-3/optimized/tflite/scripts/sa3_tflite.py'
    for mode, seconds, prompt in [('sm-music', 4, 'Gentle solo piano, calm C major, warm sustained notes, no vocals.'),
                                   ('sm-sfx', 3, 'A short soft flutter of insect wings, dry close sound, no speech, no music.')]:
        wav = out / f'{mode}.wav'
        command = [sys.executable, '-I', str(script), '--prompt', prompt, '--dit', mode, '--decoder', 'same-s',
                   '--dit-precision', 'w8a8', '--decoder-precision', 'w8a8', '--seconds', str(seconds),
                   '--steps', '8', '--seed', '42', '--cfg', '1', '--threads', str(args.threads), '--out', str(wav)]
        with (out / f'{mode}.log').open('w') as log:
            subprocess.run(command, env=os.environ.copy(), stdin=subprocess.DEVNULL, stdout=log,
                           stderr=subprocess.STDOUT, timeout=args.timeout, check=True)
        results.append({'engine': mode, **measure(wav, 44100, 2, seconds)})
    report = {'status': 'passed', 'offline': True, 'direct_listening_performed': False,
              'quality_claim': 'Inference and numerical signal checks only; not perceptual quality approval.',
              'elapsed_seconds': round(time.monotonic() - started, 2), 'tests': results}
    (out / 'smoke-report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
