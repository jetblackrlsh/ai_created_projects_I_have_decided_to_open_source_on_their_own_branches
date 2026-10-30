#!/usr/bin/env python3
"""Offline pinned CPU Kokoro synthesis, no downloader or voice cloning."""
import argparse,hashlib,json,os,wave
from pathlib import Path

def main():
 p=argparse.ArgumentParser();p.add_argument('--model',required=True);p.add_argument('--voices',required=True);p.add_argument('--voice',required=True);p.add_argument('--text-file',required=True);p.add_argument('--output',required=True);a=p.parse_args()
 dest=Path(a.output)
 if dest.exists() or dest.with_suffix('.json').exists():raise ValueError('Preserve versions: output exists')
 for path,sha,size in [(a.model,'7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5',325532387),(a.voices,'bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d',28214398)]:
  f=Path(path)
  if f.stat().st_size!=size or hashlib.sha256(f.read_bytes()).hexdigest()!=sha:raise ValueError('Pinned file integrity mismatch: '+str(f))
 text=Path(a.text_file).read_text()
 if not text.strip() or len(text)>5000:raise ValueError('Use short separate utterances, maximum5000characters')
 os.environ.update(HF_HUB_OFFLINE='1',HF_HUB_DISABLE_IMPLICIT_TOKEN='1')
 import numpy as np
 import onnxruntime as ort
 from kokoro_onnx import Kokoro
 ort.disable_telemetry_events();opts=ort.SessionOptions();opts.intra_op_num_threads=2;opts.inter_op_num_threads=1
 session=ort.InferenceSession(a.model,sess_options=opts,providers=['CPUExecutionProvider']);engine=Kokoro.from_session(session,a.voices)
 if a.voice not in engine.get_voices():raise ValueError('Unknown stock voice')
 samples,rate=engine.create(text,voice=a.voice,speed=1.0,lang='en-us');samples=np.asarray(samples)
 if not len(samples) or not np.isfinite(samples).all() or abs(samples).max()>=1:raise ValueError('Empty/nonfinite/clipped synthesis')
 dest.parent.mkdir(parents=True,exist_ok=True)
 with wave.open(str(dest),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(np.round(samples*32767).astype('<i2').tobytes())
 dest.with_suffix('.json').write_text(json.dumps(dict(text=text,voice=a.voice,speed=1,lang='en-us',sampleRate=rate,samples=len(samples),duration=len(samples)/rate,sha256=hashlib.sha256(dest.read_bytes()).hexdigest(),provider='kokoro-onnx',synthetic=True),indent=2))
if __name__=='__main__':main()
