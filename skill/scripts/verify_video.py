#!/usr/bin/env python3
"""Check decode, frame count, encoded soundtrack alignment and true peak."""
import argparse,json,subprocess,tempfile,wave,math
from pathlib import Path
import numpy as np

def pcm(path):
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-vn','-f','f32le','-ar','48000','-ac','2','-'])
 return np.frombuffer(raw,dtype='<f4').reshape(-1,2)
def verify(video,manifest,out):
 m=json.loads(Path(manifest).read_text());root=Path(manifest).resolve().parent
 subprocess.run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'],check=True)
 p=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-count_frames','-show_streams','-of','json',str(video)]))
 v=next(s for s in p['streams'] if s['codec_type']=='video');fps=m.get('fps',24)
 expected=sum(math.ceil(s['duration']*fps-1e-8) for s in m['scenes'])
 assert (v['width'],v['height'])==(m.get('width',640),m.get('height',360))
 assert int(v['nb_read_frames'])==expected
 report={'frames':expected,'decode':True,'listeningVerified':False}
 if m.get('audio'):
  a=pcm(video);b=pcm(root/m['audio']);n=min(len(a),len(b));assert abs(len(a)-len(b))<4800
  checks=[];offset=0
  for s in m['scenes']:
   for u in s.get('speech',[]):
    start=round((offset+u['start'])*48000);end=min(n,round((offset+u['end'])*48000))
    x=a[start:end].mean(axis=1);y=b[start:end].mean(axis=1)
    c=float(np.corrcoef(x,y)[0,1]);assert c>.98,(s['id'],c);checks.append(c)
   offset+=math.ceil(s['duration']*fps-1e-8)/fps
  log=subprocess.run(['ffmpeg','-hide_banner','-i',str(video),'-vn','-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,check=True).stderr
  import re
  matches=re.findall(r'Peak:\s+(-?[\d.]+) dBFS',log)
  peak=float(matches[-1]) if matches else None
  if peak is None or peak>-1:raise ValueError(f'True peak fail: {peak}')
  report.update(min_encoded_correlation=min(checks,default=None),true_peak_dbfs=peak,audio_samples=n)
 Path(out).write_text(json.dumps(report,indent=2));print(json.dumps(report))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('video');p.add_argument('manifest');p.add_argument('out');a=p.parse_args();verify(a.video,a.manifest,a.out)
