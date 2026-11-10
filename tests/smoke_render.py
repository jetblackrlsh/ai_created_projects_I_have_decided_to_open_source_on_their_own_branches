"""Bounded synthetic camera/validation smoke test; no models or private assets."""
from pathlib import Path
import hashlib,json,subprocess,sys,tempfile,wave
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
script=ROOT/'skills/create-spread-motion-comic/scripts/render_spread.py'
with tempfile.TemporaryDirectory(prefix='spread-public-test-') as td:
 p=Path(td);Image.new('RGB',(200,100),'navy').save(p/'source.png')
 with wave.open(str(p/'audio.wav'),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(48000);f.writeframes(b'\0'*48000*4)
 m={'source':'source.png','source_sha256':hashlib.sha256((p/'source.png').read_bytes()).hexdigest(),'audio':'audio.wav','width':320,'height':180,'fps':12,'shots':[{'id':'zoom','rect':[0,0,200,100],'end_rect':[0,0,100,100],'duration':.5},{'id':'hold','rect':[0,0,100,100],'duration':.5}]}
 def execute(spec):
  (p/'manifest.json').write_text(json.dumps(spec));return subprocess.run([sys.executable,str(script),str(p/'manifest.json'),str(p/'out.mp4')],capture_output=True,text=True)
 result=execute(m);assert result.returncode==0,result.stderr
 receipt=json.loads((p/'out.render.json').read_text());assert receipt['frames']==12 and receipt['full_decode'] and receipt['listeningVerified'] is False
 original=m['source_sha256'];m['source_sha256']='0'*64;result=execute(m);assert result.returncode and 'Source hash mismatch' in result.stderr;m['source_sha256']=original
 m['shots'][0]['duration']=3;result=execute(m);assert result.returncode and 'Audio/timeline mismatch' in result.stderr;m['shots'][0]['duration']=.5
 m['shots'][1]['rect']=[0,0,201,100];result=execute(m);assert result.returncode and 'Invalid source rectangle' in result.stderr
 m['shots'][1]['rect']=[0,0,100,100]
 for key in ['width','height','fps']:m.pop(key)
 result=execute(m);assert result.returncode==0,result.stderr
 def dimensions():
  q=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,r_frame_rate','-of','json',str(p/'out.mp4')]))
  return q['streams'][0]
 d=dimensions();assert (d['width'],d['height'],d['r_frame_rate'])==(640,360,'24/1'),d
 m.update(width=1920,height=1080,fps=24)
 result=execute(m);assert result.returncode==0,result.stderr
 d=dimensions();assert (d['width'],d['height'],d['r_frame_rate'])==(1920,1080,'24/1'),d
 print('PASS: zoom, cached hold, full decode, integrity/timing/bounds rejection, omitted-setting 360p24 default and explicit 1080p24 override')
