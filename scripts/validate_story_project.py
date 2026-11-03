#!/usr/bin/env python3
"""Technical story-film validation; does not certify art, model inference or listening QA."""
import argparse,hashlib,html,json,math,re,subprocess
from fractions import Fraction
from pathlib import Path

def probe(p, count=False):
    cmd=['ffprobe','-v','error']+(['-count_frames'] if count else [])+['-show_streams','-show_format','-of','json',str(p)]
    return json.loads(subprocess.check_output(cmd))

def main():
    ap=argparse.ArgumentParser();ap.add_argument('project');ap.add_argument('--width',type=int,default=1920);ap.add_argument('--height',type=int,default=1080);ap.add_argument('--fps',type=float,default=24);a=ap.parse_args()
    assert a.width>0 and a.height>0 and a.fps>0,'Positive dimensions and fps required'
    root=Path(a.project).resolve();errors=[];checks=[]
    def check(ok,msg):
        (checks if ok else errors).append(msg)
    def number(x):return isinstance(x,(int,float)) and not isinstance(x,bool) and math.isfinite(x)
    def local(base,p):
        q=(base/p).resolve()
        if not q.is_relative_to(base.resolve()):raise ValueError('Media path escapes project audio directory')
        return q
    required=['index.html','animation.mp4','script/story_clarity_audit.md','script/adaptation_script.md','audio/timeline.json','audio/captions.vtt','audio/master.wav','audio/voice_stem.wav','audio/music_stem.wav','audio/sfx_stem.wav','audio/provenance.json','youtube_metadata.md']
    for f in required:check((root/f).is_file() and (root/f).stat().st_size>0,'Required nonempty artifact: '+f)
    if errors:raise ValueError('; '.join(errors))
    audio=root/'audio';tl=json.loads((audio/'timeline.json').read_text());duration=tl['total_duration'];assert number(duration) and duration>0,'Invalid total duration'
    lines=tl.get('lines',[]);scenes=tl.get('scenes',[]);cast=tl.get('cast',{});check(tl.get('sample_rate')==48000,'Canonical timeline sample rate is 48000')
    sceneids={s['id'] for s in scenes};check(len(sceneids)==len(scenes),'Unique scene IDs');check(bool(scenes),'At least one scene')
    for sc in scenes:
        start,end=sc['start'],sc['end'];assert number(start) and number(end),'Nonfinite scene time'
        check(0<=start<end<=duration+.002,'Scene bounds: '+sc['id'])
    if scenes:
        check(abs(scenes[0]['start'])<.002 and abs(scenes[-1]['end']-duration)<.002,'Scenes span beginning and ending')
        check(all(scenes[i]['start']<=scenes[i+1]['start'] for i in range(len(scenes)-1)),'Scene order')
    voices=[cast[x].get('voice') for x in {l['speaker'] for l in lines} if x in cast]
    check(len(voices)==len(set(voices)) and all(voices),'Distinct named voices for speaking cast')
    check(len({l['id'] for l in lines})==len(lines),'Unique line IDs')
    for l in lines:
        label=l['id'];start,end=l['start'],l['end'];assert number(start) and number(end),'Nonfinite line time'
        check(0<=start<end<=duration+.002,'Line bounds: '+label)
        check(l['scene'] in sceneids and l['speaker'] in cast,'Line references known scene/cast: '+label)
        check(abs(l.get('duration',end-start)-(end-start))<.002,'Line timing arithmetic: '+label)
        if l['speaker'] in cast:check(l.get('voice')==cast[l['speaker']].get('voice'),'Line voice matches cast: '+label)
        p=local(audio,l['file']);check(p.is_file(),'Line audio exists: '+label)
        if p.is_file():
            check(hashlib.sha256(p.read_bytes()).hexdigest()==l.get('sha256'),'Line audio checksum: '+label)
            stream=next(s for s in probe(p)['streams'] if s['codec_type']=='audio');actual=float(stream['duration'])
            check(abs(actual-(end-start))<.05,'Measured line audio duration: '+label)
    for name in ['master','voice_stem','music_stem','sfx_stem']:
        stream=next(s for s in probe(audio/(name+'.wav'))['streams'] if s['codec_type']=='audio')
        check(int(stream['sample_rate'])==48000 and int(stream['channels'])==2,'48k stereo '+name)
        check(abs(float(stream['duration'])-duration)<.01,'Stem length '+name)
    def ts(t):
        h,m,s,ms=map(int,re.fullmatch(r'(\d+):(\d{2}):(\d{2})\.(\d{3})',t).groups());assert m<60 and s<60,'Invalid VTT timestamp';return 3600*h+60*m+s+ms/1000
    vtt=(audio/'captions.vtt').read_text();check(vtt.startswith('WEBVTT'),'VTT header')
    cues=[]
    for match in re.finditer(r'(\d+:\d{2}:\d{2}\.\d{3})\s+-->\s+(\d+:\d{2}:\d{2}\.\d{3})[^\n]*\n([^\n]+(?:\n(?!\s*\n)[^\n]+)*)',vtt):
        st,et=ts(match[1]),ts(match[2]);text=html.unescape(re.sub('<[^>]+>','',match[3]));cues.append((st,et,text));check(0<=st<et<=duration+.002,'Caption cue bounds')
    check(bool(cues) or not lines,'Caption cues exist for speech')
    check(all(cues[i][0]<=cues[i+1][0] for i in range(len(cues)-1)),'Caption start order')
    for l in lines:
        txt=' '.join(l.get('caption',l['text']).split())
        check(any(abs(st-l['start'])<.02 and abs(et-l['end'])<.02 and txt in ' '.join(s.split()) for st,et,s in cues),'Caption timing/text for '+l['id'])
    media=probe(root/'animation.mp4',True);v=next(s for s in media['streams'] if s['codec_type']=='video');sound=next(s for s in media['streams'] if s['codec_type']=='audio')
    check(v['codec_name']=='h264' and v['pix_fmt']=='yuv420p','H264 yuv420p video');check((v['width'],v['height'])==(a.width,a.height),'Video dimensions')
    check(abs(float(Fraction(v['avg_frame_rate']))-a.fps)<1e-6,'Video frame rate');check(int(v['nb_read_frames'])==round(duration*a.fps),'Decoded video frame count')
    check(abs(float(v['duration'])-duration)<=1/a.fps+.002,'Video duration matches timeline')
    check(sound['codec_name']=='aac' and int(sound['sample_rate'])==48000 and int(sound['channels'])==2,'AAC 48k stereo audio')
    check(abs(float(sound['duration'])-duration)<.06,'Encoded audio duration matches timeline')
    provenance=json.loads((audio/'provenance.json').read_text());check(bool(provenance),'Provenance record present (claims require separate review)')
    result={'technical_status':'PASS' if not errors else 'FAIL','passed_checks':len(checks),'failures':errors,'not_certified':['artistic quality','story clarity','actual model inference','browser controls','perceptual audio/caption review']}
    print(json.dumps(result,indent=2));return 1 if errors else 0
if __name__=='__main__':
    try:raise SystemExit(main())
    except (ValueError,KeyError,AssertionError,StopIteration,subprocess.CalledProcessError,OSError) as e:
        print(json.dumps({'technical_status':'FAIL','error':str(e)},indent=2));raise SystemExit(1)
