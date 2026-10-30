#!/usr/bin/env python3
"""Mix sample-placed speech, action SFX and music; never stretch speech to fit."""
import argparse, hashlib, json, math, subprocess
from pathlib import Path
import numpy as np
from scipy import signal
from scipy.io import wavfile
RATE=48000

def require(ok,message):
    if not ok: raise ValueError(message)
def load(path):
    rate,a=wavfile.read(path)
    if a.dtype==np.uint8: a=(a.astype(float)-128)/128
    elif np.issubdtype(a.dtype,np.integer): a=a.astype(float)/(2**(np.iinfo(a.dtype).bits-1))
    else:a=a.astype(float)
    require(np.isfinite(a).all() and len(a)>0,'Invalid/empty PCM')
    if a.ndim==1:a=np.repeat(a[:,None],2,axis=1)
    require(a.ndim==2 and a.shape[1]==2,'Use mono or stereo WAV')
    if rate!=RATE:
        g=math.gcd(rate,RATE);a=signal.resample_poly(a,RATE//g,rate//g)
    return a

def smooth(a,seconds):
    n=max(1,round(RATE*seconds));return np.convolve(np.pad(a,(n//2,n-1-n//2),mode='edge'),np.ones(n)/n,'valid') if n<10 else signal.fftconvolve(np.pad(a,(n//2,n-1-n//2),mode='edge'),np.ones(n)/n,mode='valid')

def build(config,write=True):
    config=Path(config).resolve();base=config.parent;c=json.loads(config.read_text());N=round(float(c['duration'])*RATE)
    require(0<N<=RATE*300,'Duration must be positive and <=5 minutes')
    out=base/'out';out.mkdir(exist_ok=True)
    if write: require(not any((out/name).exists() for name in ['master-48k.wav','master.m4a','mix.json','voice-stem-48k.wav','music-stem-48k.wav','sfx-stem-48k.wav']),'Preserve versions: mix outputs exist')
    voice=np.zeros((N,2));fx=voice.copy();music=voice.copy();occupied=np.zeros(N,bool);speech=[];events=[];cast={}
    for item in c['speech']:
        q=dict(item);path=base/q['file'];a=load(path);start=round(q['start']*RATE);end=start+len(a)
        require(0<=start<end<=N,'Speech extends beyond timeline')
        require(not occupied[start:end].any(),'Speech overlap')
        require(q.get('text') and q.get('speaker') and q.get('voice'),'Speech requires text, speaker, stock voice')
        require(q['speaker'] not in cast or cast[q['speaker']]==q['voice'],'Inconsistent casting')
        cast[q['speaker']]=q['voice'];occupied[start:end]=True
        gain=float(q.get('gain',.86));require(0<gain<=2,'Speech gain outside supported range')
        voice[start:end]+=a*gain
        q.update(end=end/RATE,samples=len(a),gain=gain,sha256=hashlib.sha256(path.read_bytes()).hexdigest());speech.append(q)
    require(len(cast)==len(set(cast.values())),'Each speaking character and narrator needs a distinct stock voice')
    speechmask=smooth(occupied.astype(float),.05)
    fxmask=np.ones(N)
    for item in c.get('effects',[]):
        q=dict(item);path=base/q['file'];a=load(path);duration=q.get('duration',len(a)/RATE);a=a[:round(duration*RATE)]
        offset=float(q['offset']);at=float(q['at']);start=round((at-offset)*RATE);end=start+len(a)
        require(q.get('action'),'Effect requires action description')
        require(0<=offset<len(a)/RATE and 0<=start<end<=N,'Effect transient/placement outside timeline; do not silently clamp')
        peak=float(q.get('peak',.25));require(0<peak<.9,'Invalid effect peak target')
        require(np.max(abs(a))>1e-8,'Silent effect')
        a=a*peak/np.max(abs(a));n=len(a)
        a*= (np.minimum(1,np.arange(n)/(RATE*.012))*np.minimum(1,(n-1-np.arange(n))/(RATE*.16)))[:,None]
        duck=float(q.get('speech_gain',.65));require(.5<=duck<=1,'Avoid blanket deep SFX ducking; supported range .5..1')
        a*=(1-(1-duck)*speechmask[start:end])[:,None];fx[start:end]+=a
        fxmask[max(0,start-round(.08*RATE)):min(N,end+round(.12*RATE))]=.22
        q.update(placementStart=start/RATE,placementEnd=end/RATE,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),speech_gain=duck,actualPeak=float(abs(a).max()));events.append(q)
    if c.get('music'):
        q=c['music'];a=load(base/q['file']);require(len(a)>=N,'Score must cover complete timeline; no implicit loop')
        a=a[:N];require(np.max(abs(a))>1e-8,'Silent score');a*=float(q.get('peak',.24))/np.max(abs(a))
        env=.82-(.82-.08)*speechmask
        fade=np.minimum(1,np.arange(N)/(RATE*.65))*np.minimum(1,(N-1-np.arange(N))/(RATE*1.1))
        music=a*(env*smooth(fxmask,.1)*fade)[:,None]
    master=voice+fx+music;gain=min(1,.89/max(float(abs(master).max()),1e-9));master*=gain
    report=dict(duration=N/RATE,sampleRate=RATE,sampleCount=N,globalGain=gain,peak=float(abs(master).max()),speech=speech,effects=events,cast=cast,listeningVerified=False)
    if write:
        for name,a in [('voice-stem',voice),('sfx-stem',fx),('music-stem',music)]:wavfile.write(out/(name+'-48k.wav'),RATE,a.astype(np.float32))
        wavfile.write(out/'master-48k.wav',RATE,np.round(master*32767).astype(np.int16));(out/'mix.json').write_text(json.dumps(report,indent=2))
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(out/'master-48k.wav'),'-c:a','aac','-b:a','192k','-ar',str(RATE),str(out/'master.m4a')],check=True)
    return report,master,fx
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('project');a=p.parse_args();r,*_=build(a.project);print(json.dumps(r,indent=2))
