#!/usr/bin/env python3
"""Build measured local Kokoro + Stable Audio stems from explicit speaker spans.
Run with the pinned runtime's Python. No network, credentials or paid fallback.
"""
import argparse, hashlib, json, math, os, subprocess, textwrap
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
from scipy.ndimage import gaussian_filter1d
from audio_pronunciation import phonemize_for_kokoro, PRONUNCIATION_VERSION
from audio_comfort import soften_sfx
from audio_presence import audit
SR=48000
VERSION='pngtuber-audio-v1'
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def save(p,x): p.write_text(json.dumps(x,indent=2)+'\n')
def db(x): return 20*math.log10(max(1e-12,float(np.sqrt(np.mean(x*x)))))
def read48(p):
 x,sr=sf.read(p,always_2d=True)
 if not len(x) or not np.isfinite(x).all(): raise ValueError('Invalid audio '+str(p))
 x=resample_poly(x,SR//math.gcd(SR,sr),sr//math.gcd(SR,sr),axis=0)
 return np.repeat(x,2,axis=1) if x.shape[1]==1 else x[:,:2]
def normalize(x,target):
 mask=np.max(np.abs(x),axis=1)>max(1e-8,np.max(np.abs(x))*.08)
 if not mask.any(): raise ValueError('Silent source')
 return x*10**((target-db(x[mask]))/20)
def validate(m):
 if not m.get('scenes'): raise ValueError('scenes required')
 ids=set();cast={};voices={}
 for scene in m['scenes']:
  if scene.get('id') in ids or not isinstance(scene.get('id'),str):raise ValueError('Unique scene IDs required')
  ids.add(scene['id'])
  for u in scene.get('utterances',[]):
   if not all(isinstance(u.get(k),str) and u[k].strip() for k in ['text','speaker','voice']):raise ValueError('Explicit text/speaker/voice required for every span')
   if u['speaker'] in cast and cast[u['speaker']]!=u['voice']:raise ValueError('Unstable voice assignment')
   if u['voice'] in voices and voices[u['voice']]!=u['speaker']:raise ValueError('Distinct speakers require distinct voices')
   cast[u['speaker']]=u['voice'];voices[u['voice']]=u['speaker']
  if scene.get('caption') and ''.join(u['text'] for u in scene['utterances'])!=scene['caption']:raise ValueError('Utterances must concatenate exactly to caption, including punctuation/spacing')
 return cast

def build(manifest,runtime,out):
 m=json.loads(manifest.read_text());cast=validate(m);out.mkdir(parents=True,exist_ok=True)
 runtime=runtime.resolve();os.environ.update(HF_HUB_OFFLINE='1',HF_HUB_DISABLE_IMPLICIT_TOKEN='1',OMP_NUM_THREADS='2',OPENBLAS_NUM_THREADS='1')
 import onnxruntime as ort
 from kokoro_onnx import Kokoro
 opts=ort.SessionOptions();opts.intra_op_num_threads=2;opts.inter_op_num_threads=1
 model=runtime/'cache/kokoro/kokoro-v1.0.onnx';voices=runtime/'cache/kokoro/voices-v1.0.bin'
 engine=Kokoro.from_session(ort.InferenceSession(str(model),sess_options=opts,providers=['CPUExecutionProvider']),str(voices))
 model_hash=sha(model);voice_hash=sha(voices);spans=[];scenes=[];cursor=0.;fps=int(m.get('fps',24));generated=[]
 for scene in m['scenes']:
  start=cursor;cursor+=.25
  for i,u in enumerate(scene.get('utterances',[])):
   lang=u.get('lang','en-us');speed=float(u.get('speed',1))
   if not .8<=speed<=1.2:raise ValueError('Use natural speed .8–1.2')
   ph=phonemize_for_kokoro(u['text'],engine.tokenizer,lang)
   key=hashlib.sha256(json.dumps([VERSION,PRONUNCIATION_VERSION,model_hash,voice_hash,u['text'],u['voice'],lang,speed,ph]).encode()).hexdigest()
   path=out/('speech-'+key+'.wav')
   if not path.exists():
    x,sr=engine.create(ph,voice=u['voice'],speed=speed,lang=lang,is_phonemes=True,trim=False)
    if len(x)==0 or not np.isfinite(x).all():raise ValueError('Invalid Kokoro result')
    sf.write(path,x,sr,subtype='FLOAT')
   x=read48(path);seconds=len(x)/SR
   spans.append(dict(u,scene=scene['id'],start=cursor,end=cursor+seconds,file=path.name,sha256=sha(path),phonemes=ph,cache_key=key))
   cursor+=seconds+.12
  duration=max(float(scene.get('min_duration',1)),cursor-start+.5);duration=math.ceil(duration*fps)/fps
  scenes.append(dict(scene,start=start,duration=duration));cursor=start+duration
 del engine
 n=round(cursor*SR);v=np.zeros((n,2));s=np.zeros_like(v);music=np.zeros_like(v)
 for u in spans:
  x=normalize(read48(out/u['file']),-18);st=round(u['start']*SR);v[st:st+len(x)]+=x
 def generate(kind,prompt,seconds,seed):
  key=hashlib.sha256(json.dumps([VERSION,sha(Path(__file__).resolve().parents[1]/'references/audio-runtime-manifest.json'),kind,prompt,seconds,seed,8]).encode()).hexdigest();p=out/(kind+'-'+key+'.wav')
  cmd=[str(runtime/'venv/bin/python'),'-I',str(runtime/'stable-audio-3/optimized/tflite/scripts/sa3_tflite.py'),'--prompt',prompt,'--dit',kind,'--decoder','same-s','--dit-precision','w8a8','--decoder-precision','w8a8','--seconds',str(seconds),'--steps','8','--seed',str(seed),'--cfg','1','--threads','4','--out',str(p)]
  if not p.exists():
   with (out/(key+'.log')).open('w') as log:subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=600)
  x=read48(p)
  if db(x)<-60:raise ValueError('Silent generated source')
  generated.append(dict(kind=kind,prompt=prompt,seconds=seconds,seed=seed,steps=8,file=p.name,sha256=sha(p),provider='Stable Audio 3 Small'))
  return x
 mus=m.get('music',{});x=generate('sm-music',mus.get('prompt','Warm uplifting instrumental electronic music, gentle piano, steady continuous texture, no singing, no speech.'),max(20,min(90,int(math.ceil(cursor)+4))),int(mus.get('seed',42)))
 # Level broad one-second phrases, not syllables. Reject weak passages instead of amplifying silence.
 rms=np.array([10**(db(x[i:i+SR])/20) for i in range(0,len(x),SR)])
 if np.any(rms<1e-5):raise ValueError('Music has silent source passages: regenerate/edit cue')
 gain=np.clip(10**(-26/20)/rms,.1,20)
 x*=np.interp(np.arange(len(x)),np.arange(len(gain))*SR+SR/2,gain)[:,None]
 if len(x)<n:
  base=x.copy();fade=min(2*SR,len(x)//4)
  while len(x)<n:x=np.concatenate([x[:-fade],x[-fade:]*np.linspace(1,0,fade)[:,None]+base[:fade]*np.linspace(0,1,fade)[:,None],base[fade:]])
 music[:]=x[:n]
 env=np.ones(n)
 for u in spans:env[round(u['start']*SR):round(u['end']*SR)]=10**(-3/20)
 env=gaussian_filter1d(env[::480],20);music*=np.interp(np.arange(n),np.arange(len(env))*480,env)[:,None]
 effect_events=[]
 for i,e in enumerate(m.get('effects',[])):
  scene=next(z for z in scenes if z['id']==e['scene']);st=scene['start']+float(e.get('offset',0))
  x=normalize(generate('sm-sfx',e['prompt'],float(e.get('seconds',2)),int(e.get('seed',100+i))),-23)
  x,comfort=soften_sfx(x);x=normalize(x,-23)
  a=round(st*SR);b=min(n,a+len(x))
  if a<0 or a>=n:raise ValueError('Effect outside timeline')
  s[a:b]+=x[:b-a];effect_events.append(dict(e,start=st,end=b/SR,comfort=comfort))
 fade=min(SR//2,n//4);music[:fade]*=np.linspace(0,1,fade)[:,None];music[-fade:]*=np.linspace(1,0,fade)[:,None]
 master=v+s+music;scale=min(1,.84/max(1e-8,np.max(np.abs(master))))
 v*=scale;s*=scale;music*=scale;master*=scale
 def active_margin(fg,start,end):
  a=round(start*SR);b=round(end*SR);x=fg[a:b];mask=np.max(np.abs(x),axis=1)>max(1e-8,np.max(np.abs(x))*.08)
  if not mask.any():raise ValueError('Missing active foreground')
  return db(x[mask])-db(music[a:b][mask])
 presence=audit(music,SR);voice_margins=[active_margin(v,u['start'],u['end']) for u in spans]
 effects_margins=[active_margin(s,e['start'],e['end']) for e in effect_events]
 voice_effects_margins=[]
 for u in spans:
  for e in effect_events:
   a=round(max(u['start'],e['start'])*SR);b=round(min(u['end'],e['end'])*SR)
   if b-a<SR//4:continue
   vv=v[a:b];ss=s[a:b];mask=(np.max(np.abs(vv),axis=1)>np.max(np.abs(vv))*.08)&(np.max(np.abs(ss),axis=1)>np.max(np.abs(ss))*.08)
   if mask.sum()>SR//10:voice_effects_margins.append(db(vv[mask])-db(ss[mask]))
 report=dict(version=VERSION,voice_effects_margins_db=voice_effects_margins,pass_=min(voice_effects_margins,default=99)>=3 and presence['pass'] and min(voice_margins,default=99)>=6 and min(effects_margins,default=99)>=3,peak=float(np.max(np.abs(master))),common_gain=float(scale),voice_music_margins_db=voice_margins,effects_music_margins_db=effects_margins,music_presence=presence,listeningVerified=False,limitation='RMS diagnostics do not establish perceived audibility or true-peak headroom. Listen and inspect encoded master.')
 for name,x in [('voice',v),('effects',s),('music',music),('master',master)]:sf.write(out/(name+'.wav'),x,SR,subtype='FLOAT')
 for scene in scenes:
  scene['speech']=[]
  for u in spans:
   if u['scene']!=scene['id']:continue
   chunks=textwrap.wrap(u['text'],width=70,break_long_words=False,break_on_hyphens=False)
   weight=sum(len(c) for c in chunks);pos=u['start']
   for c in chunks:
    end=pos+(u['end']-u['start'])*len(c)/weight
    scene['speech'].append(dict(start=pos-scene['start'],end=end-scene['start'],subtitle=c,speaker=u['speaker']))
    pos=end
 save(out/'timeline.json',dict(width=m.get('width',640),height=m.get('height',360),fps=fps,duration=cursor,audio='master.wav',scenes=scenes,spans=spans,effects=effect_events,cast=cast))
 save(out/'audio-provenance.json',dict(version=VERSION,kokoro_model_sha256=model_hash,kokoro_voices_sha256=voice_hash,pronunciation=PRONUNCIATION_VERSION,generated=generated));save(out/'audio-qa.json',report)
 if not report['pass_']:raise ValueError('Audio mix gate failed; inspect audio-qa.json and repair')
 print(json.dumps({'timeline':str(out/'timeline.json'),'seconds':cursor,'pass':True}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('manifest',type=Path);p.add_argument('--runtime',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();build(a.manifest,a.runtime,a.out.resolve())
