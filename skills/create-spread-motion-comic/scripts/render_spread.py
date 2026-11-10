#!/usr/bin/env python3
"""Render reviewed source rectangles with a finished soundtrack. Requires Pillow, ffmpeg."""
import argparse, hashlib, json, math, subprocess, tempfile
from pathlib import Path
from PIL import Image, ImageOps

def run(args, **kw):
    return subprocess.run(args, check=True, **kw)

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('manifest',type=Path); ap.add_argument('output',type=Path)
    a=ap.parse_args(); m=json.loads(a.manifest.read_text()); base=a.manifest.resolve().parent
    source=base/m['source']; audio=base/m['audio']; out=a.output.resolve()
    if out in (source.resolve(),audio.resolve()): raise ValueError('Output would overwrite input')
    if hashlib.sha256(source.read_bytes()).hexdigest()!=m['source_sha256']: raise ValueError('Source hash mismatch')
    im=Image.open(source).convert('RGB'); w=int(m.get('width',640)); h=int(m.get('height',360)); fps=int(m.get('fps',24))
    if min(w,h,fps)<=0 or w%2 or h%2 or fps>120: raise ValueError('Invalid output settings')
    shots=m['shots']; ids=[s['id'] for s in shots]
    if not shots or len(ids)!=len(set(ids)): raise ValueError('Missing shots or duplicate IDs')
    frames=[]
    for s in shots:
        r=s['rect']; e=s.get('end_rect',r)
        for box in (r,e):
            if len(box)!=4 or not all(math.isfinite(x) for x in box) or not (0<=box[0]<box[2]<=im.width and 0<=box[1]<box[3]<=im.height): raise ValueError('Invalid source rectangle')
        if not math.isfinite(s['duration']) or s['duration']<=0: raise ValueError('Invalid shot duration')
        frames.append(max(1,round(s['duration']*fps)))
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(audio)]))
    duration=float(probe['format']['duration']); planned=sum(frames)/fps
    if abs(duration-planned)>1/fps+.025: raise ValueError(f'Audio/timeline mismatch: {duration} vs {planned}')
    out.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='spread-render-') as td:
        silent=Path(td)/'picture.mp4'
        cmd=['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r',str(fps),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',str(silent)]
        proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
        try:
            for s,n in zip(shots,frames):
                start=s['rect']; end=s.get('end_rect',start)
                cached = None
                for i in range(n):
                    if cached is not None:
                        proc.stdin.write(cached)
                        continue
                    t=i/max(1,n-1); t=t*t*(3-2*t)
                    rect=tuple(start[j]+(end[j]-start[j])*t for j in range(4))
                    crop=im.crop(rect); fit=ImageOps.contain(crop,(w,h),Image.Resampling.LANCZOS)
                    canvas=Image.new('RGB',(w,h),'black'); canvas.paste(fit,((w-fit.width)//2,(h-fit.height)//2))
                    payload = canvas.tobytes()
                    if start == end: cached = payload
                    proc.stdin.write(payload)
            proc.stdin.close()
            if proc.wait(): raise RuntimeError('Video encoding failed')
        finally:
            if proc.poll() is None: proc.kill(); proc.wait()
        run(['ffmpeg','-v','error','-y','-i',str(silent),'-i',str(audio),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',str(out)])
        run(['ffmpeg','-v','error','-i',str(out),'-f','null','-'])
    receipt={'source_sha256':m['source_sha256'],'frames':sum(frames),'fps':fps,'picture_seconds':planned,'audio_seconds':duration,'shot_count':len(shots),'output_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'full_decode':True,'listeningVerified':False}
    out.with_suffix('.render.json').write_text(json.dumps(receipt,indent=2))
    print(json.dumps(receipt))
if __name__=='__main__': main()
