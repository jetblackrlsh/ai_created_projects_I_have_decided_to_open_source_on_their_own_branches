#!/usr/bin/env python3
"""Render native-cell ASCII film and static-card companion with identical AAC."""
import argparse,json,math,pathlib,subprocess,hashlib
from PIL import Image,ImageDraw,ImageFont,ImageEnhance
from ascii_art import font_path

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('project');v=ap.parse_args();p=pathlib.Path(v.project).resolve();root=p.parent;s=json.loads(p.read_text());out=root/'out';out.mkdir(exist_ok=True)
    duration=float(s['duration']);fps=int(s.get('fps',24)); nframes=round(duration*fps)
    if duration<=0 or duration>3600 or fps not in [12,24,25,30] or abs(nframes/fps-duration)>1e-8: raise ValueError('Positive frame-aligned duration and supported fps required')
    font=font_path(str(root/s['font']) if s.get('font') else None);f=ImageFont.truetype(font,24);tf=ImageFont.truetype(font,30)
    shots=s['shots'];images={};hashes=[];last=0
    for q in shots:
        if not q['start']==last or not q['start']<q['end']<=duration or q['id'] in images: raise ValueError('Unique shot IDs and contiguous exact timeline required')
        last=q['end'];path=root/q['image'];im=Image.open(path).convert('RGB')
        if im.size!=(960,960): raise ValueError('Default renderer requires native 120x60 grid at 8x16 cells (960x960 PNG); do not resize glyphs')
        images[q['id']]=im
        report=path.with_suffix('.report.json')
        provenance=json.loads(report.read_text()) if report.exists() else {}
        hashes.append(provenance.get('source_sha256') or hashlib.sha256(path.read_bytes()).hexdigest())
    if last!=duration: raise ValueError('Shots must cover full duration')
    if len(set(hashes))!=len(hashes): raise ValueError('New stories require a fresh source image per shot')
    timing=json.loads((out/'mix.json').read_text());speech=timing['speech']
    master=out/'master.m4a'
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(master)]))['streams']
    if len(probe)!=1 or probe[0]['codec_name']!='aac' or probe[0]['sample_rate']!='48000': raise ValueError('Require one canonical 48kHz AAC stream')
    if abs(float(probe[0]['duration'])-duration)>.05: raise ValueError('AAC duration differs from timeline')
    for name in ['film.mp4','audio-drama.mp4','title-card.png']:
        if (out/name).exists(): raise ValueError('Preserve versions: '+name+' exists')
    def wrap(text,font,width=1000):
        lines=[];line=''
        for word in text.split():
            new=(line+' '+word).strip()
            if font.getlength(new)>width and line:lines.append(line);line=word
            else:line=new
        if line:lines.append(line)
        if any(font.getlength(x)>width for x in lines):raise ValueError('Unbreakable text too wide')
        return lines
    def centered(draw,text,y,font):draw.text(((1080-font.getlength(text))/2,y),text,font=font,fill='#edf4e8')
    def base(im,dx=0):
        canvas=Image.new('RGB',(1080,1080),'#080c11');canvas.paste(im,(60+dx,60));return canvas
    def cmd(path):return ['ffmpeg','-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','1080x1080','-framerate',str(fps),'-i','pipe:0','-i',str(master),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','copy','-t',str(duration),'-movflags','+faststart',str(path)]
    title=wrap(s['title'],tf)
    if len(title)>1:raise ValueError('Title too long for header')
    process=subprocess.Popen(cmd(out/'film.mp4'),stdin=subprocess.PIPE)
    try:
        for n in range(nframes):
            t=n/fps;q=next(x for x in shots if x['start']<=t<x['end']);u=(t-q['start'])/(q['end']-q['start'])
            # Integer whole-cell motion only; no zoom/resampling.
            frame=base(images[q['id']],(round(u*4)-2)*8);d=ImageDraw.Draw(frame);d.rectangle((0,0,1080,60),fill='#080c11');centered(d,title[0],14,tf)
            active=next((x for x in speech if x['start']<=t<x['end']),None)
            if active:
                lines=wrap(active['speaker']+': '+active['text'],f)
                if len(lines)>5:raise ValueError('Caption too long; split utterance')
                top=1060-(len(lines)*34+24);d.rectangle((15,top,1065,1065),fill='#080c11')
                for i,line in enumerate(lines):centered(d,line,top+12+i*34,f)
            process.stdin.write(frame.tobytes())
    finally:
        process.stdin.close()
    if process.wait():raise RuntimeError('FFmpeg film render failed')
    card=ImageEnhance.Brightness(base(images[shots[0]['id']])).enhance(.30);d=ImageDraw.Draw(card)
    texts=[s['title'],'AUDIO DRAMA']+s['credits'];lines=[]
    for text in texts:lines.extend(wrap(text,f,980));lines.append('')
    if len(lines)*34>900:raise ValueError('Credits too long for static card')
    for i,line in enumerate(lines):centered(d,line,90+i*34,f)
    card.save(out/'title-card.png')
    subprocess.run(['ffmpeg','-v','error','-y','-loop','1','-framerate',str(fps),'-i',str(out/'title-card.png'),'-i',str(master),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-tune','stillimage','-crf','18','-pix_fmt','yuv420p','-c:a','copy','-t',str(duration),'-movflags','+faststart',str(out/'audio-drama.mp4')],check=True)
    print(json.dumps({'film':str(out/'film.mp4'),'audio_drama':str(out/'audio-drama.mp4'),'frames':nframes,'duration':duration,'fresh_source_hashes':hashes,'audition':'not performed by renderer'}))
if __name__=='__main__':main()
