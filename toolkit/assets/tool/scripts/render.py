"""Headless full-panel motion comic and matching static audio-drama export."""
from pathlib import Path
import json,subprocess
from PIL import Image,ImageDraw,ImageFont,ImageEnhance
from project import validate,need

def render(path,mode='both'):
 path=Path(path).resolve();base=path.parent;c=validate(path);out=base/'out';mix=json.loads((out/'mix.json').read_text());W=c.get('size',1080);fps=c['fps'];D=c['duration'];fontroot=Path(c.get('fontDir','/usr/share/fonts/truetype/dejavu'))
 def font(px,bold=False):return ImageFont.truetype(str(fontroot/('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')),max(10,round(px*W/1080)))
 f=font(29);sm=font(23);head=font(40,True)
 def wrap(s,width,ft):
  lines=[];line=''
  for word in s.split():
   nxt=(line+' '+word).strip()
   if ft.getlength(nxt)>width and line:lines.append(line);line=word
   else:line=nxt
  if line:lines.append(line)
  return lines
 def center(d,text,y,ft,fill='#f4f1ea'):d.text(((W-ft.getlength(text))/2,y),text,font=ft,fill=fill)
 def fit(im,w,h):
  s=min(w/im.width,h/im.height);return im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.Resampling.LANCZOS)
 images={x['id']:Image.open(base/x['image']).convert('RGB') for x in c['shots']}
 bg=Image.open(base/c.get('background',c['shots'][0]['image'])).convert('RGB')
 def card(label):
  im=Image.new('RGB',(W,W),'#10131a');a=fit(bg,W,W);im.paste(a,((W-a.width)//2,(W-a.height)//2));im=ImageEnhance.Brightness(im).enhance(.17);d=ImageDraw.Draw(im);y=int(W*.08)
  lines=[(c['title'],head),(c.get('subtitle',''),f),(label,head)]+[(x,sm) for x in c['credits']]+[(c.get('voiceCredit','Kokoro stock synthetic voices'),sm)]+[(f'{k}: {v}',sm) for k,v in c['cast'].items()]+[(c.get('audioCredit','Local AI music and SFX: Stable Audio 3 Small'),sm),('Illustrated motion comic — not articulated animation',sm)]
  laid=[(line,ft) for text,ft in lines for line in wrap(text,W*.9,ft)]
  total=sum(ft.size*1.5 for _,ft in laid);need(total<W*.86,'Title/credits overflow: shorten credits or split into fewer lines')
  for line,ft in laid:center(d,line,y,ft);y+=ft.size*1.5
  return im
 def command(dest):return ['ffmpeg','-v','error','-n','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{W}','-framerate',str(fps),'-i','pipe:0','-i',str(out/'master.m4a'),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','copy','-t',str(D),'-movflags','+faststart',str(dest)]
 if mode in ['both','card']:
  dest=out/'audio-drama.mp4';need(not dest.exists(),'Refuse video overwrite');im=card('AUDIO DRAMA');im.save(out/'audio-drama-title-card.png')
  subprocess.run(['ffmpeg','-v','error','-n','-loop','1','-framerate',str(fps),'-i',str(out/'audio-drama-title-card.png'),'-i',str(out/'master.m4a'),'-c:v','libx264','-preset','fast','-crf','19','-tune','stillimage','-pix_fmt','yuv420p','-c:a','copy','-t',str(D),'-movflags','+faststart',str(dest)],check=True)
 if mode in ['both','film']:
  dest=out/'film.mp4';need(not dest.exists(),'Refuse video overwrite');intro=card(c.get('editionLabel','HEROIC MOTION COMIC'));end=card('THE END');proc=subprocess.Popen(command(dest),stdin=subprocess.PIPE);cache={};last=None
  try:
   for frame in range(round(D*fps)):
    t=frame/fps;shot=next((x for x in c['shots'] if x['start']<=t<x['end']),None)
    if shot:
     if last!=shot['id']:cache={};last=shot['id']
     step=round(15*(t-shot['start'])/(shot['end']-shot['start']))
     if step not in cache:cache[step]=fit(images[shot['id']],W*(.92+.0009*step),W*(.72+.0007*step))
     art=cache[step];im=Image.new('RGB',(W,W),'#151820');im.paste(art,((W-art.width)//2,int(W*.1)+(int(W*.74)-art.height)//2));d=ImageDraw.Draw(im)
     title=c['title'];need(f.getlength(title)<W*.96,'Title too long for panel header');center(d,title,W*.025,f)
    else:im=(intro if t<c['shots'][0]['start'] else end).copy()
    active=next((x for x in mix['speech'] if x['start']<=t<x['end']),None)
    if active:
     d=ImageDraw.Draw(im);lines=wrap(f"{active['speaker']}: {active['text']}",W*.92,f);lineh=f.size*1.35;h=len(lines)*lineh+W*.02;need(h<W*.22,'Caption too long: split utterance before render');top=W*.98-h;d.rectangle((W*.01,top,W*.99,W*.99),fill='#10131a')
     for j,line in enumerate(lines):center(d,line,top+W*.01+j*lineh,f)
    proc.stdin.write(im.tobytes())
   proc.stdin.close();need(proc.wait()==0,'FFmpeg render failed')
  except BaseException:
   proc.kill();proc.wait();raise
 return {'duration':D,'fps':fps,'size':W,'mode':mode,'listeningVerified':False}
