#!/usr/bin/env python3
"""Offline pinned Kokoro stock-voice adapter; use an existing Kokoro venv Python."""
import argparse, hashlib, importlib.metadata, json, math, os, pathlib, re, time, wave
from generate_audio import sha, number, output_path, pcm_info, save_new
PINS={'model':'7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5','voices':'bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d'}

def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('project');ap.add_argument('--model',required=True);ap.add_argument('--voices',required=True);ap.add_argument('--validate-only',action='store_true');ap.add_argument('--receipt');ap.add_argument('--only',nargs='+');ap.add_argument('--speed',type=float,default=1.0);ap.add_argument('--lang',choices=['en-us','en-gb'],default='en-us');a=ap.parse_args()
 number(a.speed,'speed',.5,2)
 source=pathlib.Path(a.project).resolve();project_hash=sha(source);project=json.loads(source.read_text());cast=project.get('cast');lines=project.get('speech')
 if not isinstance(cast,dict) or not cast or not isinstance(lines,list) or not lines:raise ValueError('Nonempty cast and speech required')
 for key in ('model','voices'):
  p=pathlib.Path(getattr(a,key))
  if not p.is_file() or sha(p)!=PINS[key]:raise ValueError('Missing or changed pinned '+key)
 import numpy as np
 # NPZ voice data only; never pickle.
 with np.load(a.voices,allow_pickle=False) as v:stock=set(v.files)
 castvoices={}
 for speaker,value in cast.items():
  voice=value.get('voice') if isinstance(value,dict) else value
  if not isinstance(voice,str) or voice not in stock:raise ValueError('Unknown stock voice in cast: '+str(speaker))
  castvoices[speaker]=voice
 ids=set();outputs=set();prepared=[]
 for line in lines:
  if not isinstance(line,dict):raise ValueError('Speech entry must be an object')
  id=line.get('id');speaker=line.get('speaker');voice=line.get('voice');text=line.get('text')
  if not isinstance(id,str) or not re.fullmatch(r'[A-Za-z0-9_-]+',id) or id in ids:raise ValueError('Invalid/duplicate utterance id')
  ids.add(id)
  if line.get('provider','kokoro-onnx')!='kokoro-onnx':raise ValueError('Unsupported speech provider; no fallback')
  if speaker not in castvoices or voice!=castvoices[speaker]:raise ValueError('Speaker/voice differs from cast: '+id)
  if not isinstance(text,str) or not text.strip() or len(text)>5000:raise ValueError('Invalid text')
  if 'start' in line:number(line['start'],'start')
  dest=output_path(source.parent,line.get('file'))
  if dest in outputs:raise ValueError('Duplicate speech output')
  outputs.add(dest);prepared.append((line,dest))
 if a.only:
  if not set(a.only)<=ids:raise ValueError('Unknown --only id')
  prepared=[x for x in prepared if x[0]['id'] in a.only]
 versions={x:importlib.metadata.version(x) for x in ['kokoro-onnx','onnxruntime','numpy']}
 if versions['kokoro-onnx']!='0.6.1':raise ValueError('Unverified Kokoro version; expected0.6.1')
 report={'provider':'kokoro-onnx','modelRelease':'v1.0','modelSha256':PINS['model'],'voicesSha256':PINS['voices'],'versions':versions,'projectSha256':project_hash,'validateOnly':a.validate_only,'utterances':[],'listeningPerformed':False}
 if a.receipt and pathlib.Path(a.receipt).exists():raise FileExistsError(a.receipt)
 if not a.validate_only:
  os.environ.update(HF_HUB_OFFLINE='1',HF_HUB_DISABLE_IMPLICIT_TOKEN='1')
  import onnxruntime as ort
  from kokoro_onnx import Kokoro
  ort.disable_telemetry_events();options=ort.SessionOptions();options.intra_op_num_threads=2;options.inter_op_num_threads=1
  session=ort.InferenceSession(a.model,sess_options=options,providers=['CPUExecutionProvider']);engine=Kokoro.from_session(session,a.voices)
  for line,dest in prepared:
   if sha(source)!=project_hash:raise ValueError('Project changed during generation')
   start=time.monotonic();samples,rate=engine.create(line['text'],voice=line['voice'],speed=a.speed,lang=a.lang);samples=np.asarray(samples,dtype=np.float32)
   if samples.ndim!=1 or not len(samples) or not np.isfinite(samples).all() or not isinstance(rate,int) or rate<=0:raise ValueError('Empty/nonfinite/invalid synthesis')
   peak=float(np.max(np.abs(samples)))
   if peak==0:raise ValueError('Silent synthesis')
   gain=min(1,.90/peak) if peak>=1 else 1.0
   samples=samples*gain
   dest.parent.mkdir(parents=True,exist_ok=True)
   with dest.open('xb') as f:
    with wave.open(f,'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(np.round(samples*32767).astype('<i2').tobytes())
   info=pcm_info(dest);receipt={**line,**info,'provider':'kokoro-onnx','synthetic':True,'modelSha256':PINS['model'],'voicesSha256':PINS['voices'],'versions':versions,'projectSha256':project_hash,'speed':a.speed,'lang':a.lang,'originalFloatPeak':peak,'linearGainBeforePCM':gain,'elapsedSeconds':time.monotonic()-start,'listeningPerformed':False}
   save_new(dest.with_suffix('.receipt.json'),receipt);report['utterances'].append(receipt)
 if a.receipt:save_new(a.receipt,report)
 print(json.dumps(report,indent=2))
if __name__=='__main__':main()
