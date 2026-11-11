#!/usr/bin/env python3
"""Render measured PNG host + motion graphics scenes from a portable manifest."""
import argparse,hashlib,json,math,subprocess
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont

def validate(m,root):
 if (m.get('width',640),m.get('height',360))!=(640,360) and not m.get('explicit_resolution_override'): raise ValueError('Non-default resolution requires explicit override')
 if m.get('fps',24)<=0:raise ValueError('Invalid fps')
 if not m.get('scenes'):raise ValueError('No scenes')
 seen=set()
 for s in m['scenes']:
  if s['id'] in seen:raise ValueError('Duplicate scene id')
  seen.add(s['id'])
  if s['duration']<=0:raise ValueError('Invalid duration')
  if s.get('layout','host-right') not in ('host-right','host-left','full'):raise ValueError('Unknown layout')
  if len(s.get('title',''))>66:raise ValueError('Title too dense')
  if len(s.get('bullets',[]))>3 or any(len(x)>72 for x in s.get('bullets',[])):raise ValueError('Split dense bullets into scenes')
  if s.get('image'):
   p=root/s['image']; h=hashlib.sha256(p.read_bytes()).hexdigest()
   if h!=s.get('image_sha256'):raise ValueError('Image source hash mismatch')
   if s.get('source_kind') not in ('original','generated','screenshot','licensed'):raise ValueError('Record image provenance')
   if s['source_kind']=='screenshot' and not all(s.get(k) for k in ('source_url','captured_at','source_label')):raise ValueError('Screenshot requires source URL, label, capture date')
   if 'crop' in s:
    w,h=Image.open(p).size;x,y,r,b=s['crop']
    if not 0<=x<r<=w or not 0<=y<b<=h:raise ValueError('Invalid crop')
  if s.get('host'):
   hp=root/s['host']
   im=Image.open(hp)
   if im.mode!='RGBA':raise ValueError('Host must be transparent RGBA PNG')
   if im.getextrema()[3][0]==255:raise ValueError('Host needs transparency')
   if s.get('host_talking'):
    talk=Image.open(root/s['host_talking'])
    if talk.mode!='RGBA' or talk.size!=im.size or talk.getextrema()[3][0]==255:raise ValueError('Talking pose needs matching RGBA canvas')
  for bar in s.get('bars',[]):
   if not 0<=bar['value']<=1:raise ValueError('Bar value must be normalized 0..1')
  for u in s.get('speech',[]):
   if not 0<=u['start']<u['end']<=s['duration']+.001:raise ValueError('Speech outside scene')
 return True

def font(n):
 return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',n)
def wrap(d,txt,f,w):
 rows=[];line=''
 for word in txt.split():
  trial=(line+' '+word).strip()
  if d.textbbox((0,0),trial,font=f)[2]>w and line:rows.append(line);line=word
  else:line=trial
 if line:rows.append(line)
 return rows

def frame(s,t,w,h,root,cache):
 scale=w/640
 im=Image.new('RGB',(w,h),s.get('background','#101a31'));d=ImageDraw.Draw(im)
 def box(x,y,r,b,fill):d.rounded_rectangle(tuple(int(v*scale) for v in (x,y,r,b)),radius=int(12*scale),fill=fill)
 def text(x,y,txt,size=20,color='white',width=420):
  f=font(max(10,int(size*scale)))
  for line in wrap(d,txt,f,int(width*scale)):
   d.text((int(x*scale),int(y*scale)),line,font=f,fill=color);y+=size+5
  return y
 left=s.get('layout')=='host-left';full=s.get('layout')=='full'; gx=205 if left else 24;gw=410 if not full else 592
 box(gx,64,gx+gw,310,'#1c2d4b')
 text(24,16,s.get('title',''),22,width=592)
 if s.get('image'):
  key=s['image']+str(s.get('crop'))
  if key not in cache:
   a=Image.open(root/s['image']).convert('RGB')
   if 'crop' in s:a=a.crop(s['crop'])
   cache[key]=a
  a=cache[key].copy();a.thumbnail((int((gw-16)*scale),int(210*scale)))
  im.paste(a,(int((gx+gw/2)*scale)-a.width//2,int(173*scale)-a.height//2))
  # highlights stay in normalized displayed-image coordinates
  for q in s.get('highlights',[]):
   if t>=q.get('at',0):
    x,y,r,b=q['rect'];ox=int((gx+gw/2)*scale)-a.width//2;oy=int(173*scale)-a.height//2
    d.rectangle((ox+x*a.width,oy+y*a.height,ox+r*a.width,oy+b*a.height),outline='#ffdb56',width=max(2,int(3*scale)))
 else:
  y=86
  for i,bullet in enumerate(s.get('bullets',[])):
   if t>=i*.4:y=text(gx+16,y,bullet,20,width=gw-32)+12
  for i,bar in enumerate(s.get('bars',[])):
   y=95+i*62;text(gx+16,y,bar['label'],16,width=gw-32)
   progress=min(1,max(0,(t-i*.15)/.65))
   box(gx+16,y+27,gx+gw-16,y+43,'#344867')
   if progress*bar['value']>.01:box(gx+16,y+27,gx+16+(gw-32)*bar['value']*progress,y+43,'#61d8e9')
 if s.get('host') and not full:
  hp=s['host'];active=any(u['start']<=t<u['end'] for u in s.get('speech',[]))
  if active and s.get('host_talking') and int(t*6)%2:hp=s['host_talking']
  if hp not in cache:cache[hp]=Image.open(root/hp).convert('RGBA')
  a=cache[hp].copy();a.thumbnail((int(180*scale),int(266*scale)))
  hx=8 if left else 450; bob=math.sin(t*5)*2 if active else 0
  im.paste(a,(int((hx+90)*scale)-a.width//2,int((310+bob)*scale)-a.height),a)
 if s.get('source_label'):text(gx,296,s['source_label'],12,'#bfd1eb',gw)
 # subtitle area is separate and never crosses evidence/host content
 spoken=next((u for u in s.get('speech',[]) if u['start']<=t<u['end']),None)
 if spoken and spoken.get('subtitle'):
  box(8,318,632,358,'#07101e');text(16,322,spoken['subtitle'],14,'white',608)
 return im

def main():
 p=argparse.ArgumentParser();p.add_argument('manifest');p.add_argument('output');p.add_argument('--frames-only',action='store_true');args=p.parse_args()
 path=Path(args.manifest).resolve();root=path.parent;m=json.loads(path.read_text());validate(m,root)
 w,h,fps=m.get('width',640),m.get('height',360),m.get('fps',24);out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True)
 counts=[math.ceil(s['duration']*fps-1e-8) for s in m['scenes']];duration=sum(counts)/fps
 cmd=['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r',str(fps),'-i','-']
 if m.get('audio'):cmd+=['-i',str(root/m['audio']),'-map','0:v','-map','1:a','-af','apad','-c:a','aac','-b:a','160k']
 cmd+=['-t',str(duration),'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out)]
 cache={};proc=None if args.frames_only else subprocess.Popen(cmd,stdin=subprocess.PIPE)
 try:
  for s,n in zip(m['scenes'],counts):
   mid=frame(s,s['duration']/2,w,h,root,cache);mid.save(out.parent/(s['id']+'-preview.png'))
   if proc:
    for i in range(n):proc.stdin.write(frame(s,i/fps,w,h,root,cache).tobytes())
  if proc:
   proc.stdin.close()
   if proc.wait():raise RuntimeError('ffmpeg failed')
 finally:
  if proc and proc.poll() is None:proc.kill()
 (out.parent/'render-receipt.json').write_text(json.dumps({'width':w,'height':h,'fps':fps,'frames':sum(counts),'duration':duration,'scene_count':len(counts),'listeningVerified':False},indent=2))
if __name__=='__main__':main()
