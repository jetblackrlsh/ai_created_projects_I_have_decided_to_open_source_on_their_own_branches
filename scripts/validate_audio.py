#!/usr/bin/env python3
"""Validate encoded pair against canonical PCM, source anchors and exact SFX rebuild."""
import argparse,hashlib,json,subprocess,tempfile
from pathlib import Path
import numpy as np
from scipy import signal
from mix_audio import RATE,load,build,require

def run(args):return subprocess.run(args,check=True,capture_output=True)
def match(ref,dec,start,span):
    n=round(span*RATE);a=round(start*RATE);pad=round(.12*RATE)
    lo=max(0,a-pad);hi=min(len(dec),a+n+pad)
    r=ref[a:a+n];w=dec[lo:hi];require(len(r)==n and len(w)>=n and np.std(r)>1e-7,'No usable waveform anchor')
    k=int(np.argmax(signal.correlate(w,r,mode='valid',method='fft')))
    return dict(lagMs=(lo+k-a)*1000/RATE,correlation=float(np.corrcoef(r,w[k:k+n])[0,1]))
def validate(project):
    project=Path(project).resolve();base=project.parent;out=base/'out';cfg=json.loads(project.read_text());report=json.loads((out/'mix.json').read_text())
    master=load(out/'master-48k.wav');N=round(cfg['duration']*RATE);require(len(master)==N and abs(master).max()<1,'Master sample count/clipping')
    rebuilt,mix,fx=build(project,False);require(np.array_equal(np.round(mix*32767).astype(np.int16),np.round(master*32768).astype(np.int16)),'Master does not match current source/config')
    require(np.allclose(load(out/'sfx-stem-48k.wav'),fx,atol=1e-7),'SFX reconstruction mismatch')
    voice=load(out/'voice-stem-48k.wav').mean(axis=1);ref=master.mean(axis=1);results=[]
    with tempfile.TemporaryDirectory() as tmp:
      for name in ['film','audio-drama']:
        path=out/(name+'.mp4');p=json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(path)]).stdout)
        v=next(x for x in p['streams'] if x['codec_type']=='video');a=next(x for x in p['streams'] if x['codec_type']=='audio');fps=cfg.get('fps',24)
        require(a['codec_name']=='aac' and int(a['sample_rate'])==RATE,'Expected 48k AAC')
        require(abs(float(v['duration'])-cfg['duration'])<=1/fps and abs(float(a['duration'])-cfg['duration'])<.025,'Stream duration mismatch')
        require(int(v['nb_frames'])==round(cfg['duration']*fps),'Frame count mismatch')
        require(abs(float(v.get('start_time',0)))<.001 and abs(float(a.get('start_time',0)))<.001,'Stream starts shifted')
        run(['ffmpeg','-v','error','-xerror','-i',str(path),'-f','null','-'])
        packets=json.loads(run(['ffprobe','-v','error','-select_streams','a:0','-show_packets','-show_entries','packet=pts,dts,duration','-of','json',str(path)]).stdout)['packets']
        require(all(int(y['dts'])>int(x['dts']) and int(y['pts'])==int(x['pts'])+int(x['duration']) for x,y in zip(packets,packets[1:])),'Noncontiguous audio packets')
        wav=Path(tmp)/(name+'.wav');run(['ffmpeg','-v','error','-y','-i',str(path),'-vn','-c:a','pcm_f32le',str(wav)])
        stereo=load(wav);require(abs(len(stereo)-N)<=1024 and abs(stereo).max()<1,'Decoded clipping or sample count')
        dec=stereo.mean(axis=1);bad=np.concatenate([np.zeros(2400),dec]);anchors=[]
        for q in report['speech']:
          span=min(.55,(q['end']-q['start'])*.4)
          for label,at in [('start',q['start']+.03),('end',q['end']-span-.03)]:
            m=match(ref,dec,at,span);neg=match(ref,bad,at,span);iso=match(voice,dec,at,span)
            require(abs(m['lagMs'])<25 and m['correlation']>.98,'Encoded master sync failed')
            require(abs(neg['lagMs']-m['lagMs']-50)<1,'50ms negative control failed')
            anchors.append(dict(id=q['id'],anchor=label,master=m,negative50ms=neg,isolatedVoice=iso,isolatedCriterionPass=abs(iso['lagMs'])<25 and iso['correlation']>.94))
        encoded=run(['ffmpeg','-v','error','-i',str(path),'-map','0:a:0','-c','copy','-f','adts','-']).stdout
        results.append(dict(file=path.name,aacSha256=hashlib.sha256(encoded).hexdigest(),anchors=anchors,decodedPeak=float(abs(stereo).max()),fullDecodePass=True,packetContinuityPass=True))
    require(results[0]['aacSha256']==results[1]['aacSha256'],'Pair soundtrack differs')
    result=dict(variants=results,exactSFXReconstruction=True,masterReconstruction=True,listeningVerified=False,visualReviewVerified=False)
    (out/'audio-validation.json').write_text(json.dumps(result,indent=2));return result
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('project');print(json.dumps(validate(p.parse_args().project),indent=2))
