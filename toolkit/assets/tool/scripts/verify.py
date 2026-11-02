#!/usr/bin/env python3
"""Fail-closed, model-independent verification of a Motion Manga export pair.

Run after rendering: python scripts/verify.py project.json
No success report is produced on failed timing/integrity checks. Voice prominence
is a separate listening-review warning, never an automatic claim of drift.
"""
import argparse
import gc
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile

RATE = 48000

def sha256_file(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for chunk in iter(lambda: f.read(1024*1024), b""):
            h.update(chunk)
    return h.hexdigest()

def require(condition, message):
    if not condition:
        raise ValueError(message)

def read_pcm(path, require_rate=None):
    rate, a = wavfile.read(path)
    require(require_rate is None or rate == require_rate, f'{path}: incorrect sample rate {rate}')
    if a.dtype == np.uint8:
        a = (a.astype(np.float32)-128)/128
    elif np.issubdtype(a.dtype, np.integer):
        a = a.astype(np.float32)/(2**(np.iinfo(a.dtype).bits-1))
    else:
        a = a.astype(np.float32)
    require(a.size > 0 and np.isfinite(a).all(), f'{path}: empty/nonfinite audio')
    if a.ndim == 1:
        a = np.repeat(a[:, None], 2, axis=1)
    require(a.ndim == 2 and a.shape[1] == 2, f'{path}: expected mono/stereo')
    require(np.max(np.abs(a)) < 1, f'{path}: clipped audio')
    return rate, a

def match(ref, decoded, start, span):
    n = round(span*RATE); at = round(start*RATE); pad = round(.12*RATE)
    lo = max(0, at-pad); hi = min(len(decoded), at+n+pad)
    r = ref[at:at+n]; window = decoded[lo:hi]
    require(len(r) == n and len(window) >= n and np.std(r) > 1e-7, 'No usable waveform anchor')
    k = int(np.argmax(signal.correlate(window, r, mode='valid', method='fft')))
    return {'lagMs': (lo+k-at)*1000/RATE, 'correlation': float(np.corrcoef(r, window[k:k+n])[0, 1])}

def check_anchors(master, voice, decoded, speech):
    bad = np.concatenate([np.zeros(2400), decoded]); anchors = []
    require(bool(speech), 'No speech anchors')
    for q in speech:
        duration = q['end']-q['start']; span = min(.55, duration*.4)
        require(duration > .1, f"{q['id']}: utterance too short for boundary anchors")
        for label, at in [('start', q['start']+.03), ('end', q['end']-span-.03)]:
            row = {'id': q['id'], 'anchor': label}
            for name, ref, threshold in [('fullMix', master, .98), ('isolatedVoice', voice, .94)]:
                good = match(ref, decoded, at, span); negative = match(ref, bad, at, span)
                require(abs(good['lagMs']) < 25 and good['correlation'] > threshold,
                        f"{q['id']} {label} {name}: sync/prominence failed: {good}; threshold {threshold}")
                require(abs(negative['lagMs']-good['lagMs']-50) < 1, f'{name}: 50ms negative control failed')
                row[name] = good; row[name+'Negative50ms'] = negative
            anchors.append(row)
    return anchors

def check_timing_and_report_prominence(master, voice, decoded, speech):
    """Timing is tested against the actual full mix. Isolated voice correlation
    is diagnostic only: audible music legitimately reduces source correlation.
    verify_speech separately verifies exact per-utterance placement in its stem.
    """
    bad = np.concatenate([np.zeros(2400, dtype=decoded.dtype), decoded]); anchors=[]
    require(bool(speech), 'No speech anchors')
    for q in speech:
        duration=q['end']-q['start'];span=min(.55,duration*.4)
        require(duration>.1, f"{q['id']}: utterance too short for boundary anchors")
        for label,at in [('start',q['start']+.03),('end',q['end']-span-.03)]:
            good=match(master,decoded,at,span);negative=match(master,bad,at,span)
            require(abs(good['lagMs'])<25 and good['correlation']>.98,
                    f"{q['id']} {label} fullMix timing failed: {good}")
            require(abs(negative['lagMs']-good['lagMs']-50)<1,'fullMix 50ms negative control failed')
            try:
                prominence=match(voice,decoded,at,span)
            except ValueError as exc:
                # Quiet boundaries may carry no useful isolated voice anchor.
                # Only this diagnostic is optional; full-mix timing above is strict.
                prominence={'lagMs':None,'correlation':None,'diagnosticUnavailable':str(exc)}
            anchors.append({'id':q['id'],'anchor':label,'fullMix':good,
                            'fullMixNegative50ms':negative,'isolatedVoiceDiagnostic':prominence,
                            'prominenceNeedsListeningReview':prominence['correlation'] is None or prominence['correlation']<=.94,
                            'timingMethod':'Full expected mix plus separately verified exact source speech placement; isolated voice correlation is not a timing verdict.'})
    return anchors

def verify_speech(base, cfg, stem):
    import mix_audio
    speech = cfg.get('speech', []); cast = cfg.get('cast', {})
    require(bool(speech) and bool(cast), 'Missing speech/cast')
    require(len(set(cast.values())) == len(cast), 'Stock voice IDs must be distinct per speaker')
    ids = set(); occupied = np.zeros(len(stem), bool); rows = []
    for q in speech:
        require(all(q.get(k) for k in ['id', 'file', 'text', 'speaker', 'voice']), 'Incomplete speech metadata')
        require(q['id'] not in ids, 'Duplicate speech ID'); ids.add(q['id'])
        require(cast.get(q['speaker']) == q['voice'], 'Missing/wrong cast voice')
        p = base/q['file']; _, raw = read_pcm(p)
        require(np.max(np.abs(raw)) > 1e-7, f"{q['id']}: silent voice source")
        a = mix_audio.load(p)*float(q.get('gain', .86))
        start = round(q['start']*RATE); end = start+len(a)
        require(0 <= start < end <= len(stem) and not occupied[start:end].any(), 'Speech overlap/outside timeline')
        require(np.array_equal(stem[start:end].astype(np.float32), a.astype(np.float32)), 'Voice source placement mismatch')
        occupied[start:end] = True
        rows.append({'id': q['id'], 'start': start/RATE, 'end': end/RATE, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()})
    require(np.count_nonzero(stem[~occupied]) == 0, 'Unexpected voice outside utterances')
    return rows

def run(args):
    return subprocess.run(args, check=True, capture_output=True)

def validate(project):
    import mix_audio
    project = Path(project).resolve(); base = project.parent; out = base/'out'
    destination = out/'verification.json'
    require(not destination.exists(), 'Preserve previous verification: output report already exists')
    cfg = json.loads(project.read_text()); n = round(cfg['duration']*RATE); fps = cfg.get('fps', 24)
    require(n > 0 and fps > 0, 'Invalid duration/fps')
    _, master = read_pcm(out/'master-48k.wav', RATE)
    require(len(master) == n, 'Canonical master sample count mismatch')
    _, voice_stem = read_pcm(out/'voice-stem-48k.wav', RATE)
    require(len(voice_stem) == n, 'Voice stem duration mismatch')
    speech = verify_speech(base, cfg, voice_stem); voice = voice_stem.mean(axis=1); del voice_stem
    rebuilt_report, rebuilt, fx = mix_audio.build(project, False)
    require(np.array_equal(np.round(rebuilt*32767).astype(np.int16), np.round(master*32768).astype(np.int16)), 'Canonical master reconstruction mismatch')
    _, stored_fx = read_pcm(out/'sfx-stem-48k.wav', RATE)
    require(np.array_equal(stored_fx.astype(np.float32), fx.astype(np.float32)), 'SFX reconstruction mismatch')
    del rebuilt, fx, stored_fx; gc.collect(); ref = master.mean(axis=1); del master
    results = []
    with tempfile.TemporaryDirectory() as tmp:
        for name in ['film', 'audio-drama']:
            path = out/(name+'.mp4')
            probe = json.loads(run(['ffprobe','-v','error','-show_streams','-of','json',str(path)]).stdout)
            videos = [s for s in probe['streams'] if s['codec_type'] == 'video']
            audios = [s for s in probe['streams'] if s['codec_type'] == 'audio']
            require(len(videos) == len(audios) == 1, 'Expected exactly one video/audio stream')
            v, a = videos[0], audios[0]
            require(a['codec_name'] == 'aac' and int(a['sample_rate']) == RATE, 'Expected 48k AAC')
            num, den = map(int, v['avg_frame_rate'].split('/'))
            require(abs(num/den-fps) < 1e-8 and int(v['nb_frames']) == round(cfg['duration']*fps), 'Frame clock/count mismatch')
            require(abs(float(v['duration'])-cfg['duration']) <= 1/fps and abs(float(a['duration'])-cfg['duration']) < .025, 'Stream duration mismatch')
            require(abs(float(v.get('start_time',0))) < .001 and abs(float(a.get('start_time',0))) < .001, 'Shifted stream start')
            run(['ffmpeg','-threads','2','-v','error','-xerror','-i',str(path),'-f','null','-'])
            packets = json.loads(run(['ffprobe','-v','error','-select_streams','a:0','-show_packets','-show_entries','packet=pts,dts,duration','-of','json',str(path)]).stdout)['packets']
            require(len(packets)>1 and all(int(y['dts'])>int(x['dts']) and int(y['pts'])==int(x['pts'])+int(x['duration']) for x,y in zip(packets,packets[1:])), 'Noncontiguous audio packets')
            wav = Path(tmp)/(name+'.wav'); run(['ffmpeg','-v','error','-y','-i',str(path),'-vn','-c:a','pcm_f32le',str(wav)])
            _, stereo = read_pcm(wav, RATE); require(abs(len(stereo)-n) <= 1024, 'Decoded sample count mismatch')
            anchors = check_timing_and_report_prominence(ref, voice, stereo.mean(axis=1), speech)
            encoded = run(['ffmpeg','-v','error','-i',str(path),'-map','0:a:0','-c','copy','-f','adts','-']).stdout
            results.append({'file':path.name,'aacSha256':hashlib.sha256(encoded).hexdigest(),'anchors':anchors,'frames':int(v['nb_frames']),'duration':float(v['duration']),'decodedPeak':float(np.max(np.abs(stereo))),'fullDecodePass':True})
            del stereo; gc.collect()
    require(results[0]['aacSha256'] == results[1]['aacSha256'], 'Paired AAC mismatch')
    paths = [project] + [out/name for name in ['master-48k.wav','master.m4a','mix.json','voice-stem-48k.wav','music-stem-48k.wav','sfx-stem-48k.wav','film.mp4','audio-drama.mp4']]
    paths += [base/q['file'] for q in cfg.get('speech', []) + cfg.get('effects', [])]
    paths += [base/q['image'] for q in cfg.get('shots', [])]
    if cfg.get('music'): paths.append(base/cfg['music']['file'])
    if cfg.get('background'): paths.append(base/cfg['background'])
    paths += [base/q['source'] for q in cfg.get('panels', [])]
    hashes = {str(p.relative_to(base)):sha256_file(p) for p in paths}
    manifest_hash = hashlib.sha256(json.dumps(hashes, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    result = {'passed':True,'pass':True,'projectSha256':sha256_file(project),'hashes':hashes,'manifestHash':manifest_hash,'variants':results,'sourceSpeech':speech,'masterReconstruction':True,'sfxReconstruction':True,'listeningVerified':False,'visualReviewVerified':False,'timingAndProminenceSeparated':True,'prominenceListeningReviewRequired':any(a['prominenceNeedsListeningReview'] for v in results for a in v['anchors'])}
    destination.write_text(json.dumps(result, indent=2)); return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('project'); args = parser.parse_args()
    print(json.dumps(validate(args.project), indent=2))
