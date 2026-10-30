from pathlib import Path
from PIL import Image,ImageDraw
from scipy.io import wavfile
from scipy.signal import chirp
import numpy as np,json,hashlib
import argparse,sys,subprocess
a=argparse.ArgumentParser();a.add_argument('output');args=a.parse_args()
p=Path(args.output).resolve()
if p.exists():raise ValueError('Preserve prior runs: output directory exists')
(p/'art').mkdir(parents=True);(p/'audio').mkdir()
scripts=Path(__file__).resolve().parents[1]/'scripts'
for i in (1,2):
 im=Image.new('RGB',(256,256),(15,25,45));d=ImageDraw.Draw(im)
 d.rectangle((0,210,255,255),fill=(35,65,50)); d.ellipse((185,20,220,55),fill=(160,180,195))
 x=85 if i==1 else 140
 d.rectangle((x,130,x+40,195),fill=(245,170,50));d.rectangle((x+8,140,x+32,185),fill=(255,240,130));d.arc((x+8,110,x+32,145),180,360,fill=(210,160,80),width=4)
 if i==2:d.line((20,210,140,190),fill=(130,170,190),width=12)
 im.save(p/f'art/source-{i}.png')
rate=48000
for name,dur,f0,f1 in [('n1',1.1,280,720),('n2',1.1,750,320),('score',5.,100,180),('step',.45,1200,200),('lift',.65,400,1600)]:
 t=np.arange(round(dur*rate))/rate
 env=np.minimum(1,t/.02)*np.minimum(1,(dur-t)/.03)
 a=.22*env*chirp(t,f0,dur,f1,method='quadratic')
 wavfile.write(p/f'audio/{name}.wav',rate,(a*32767).astype(np.int16))
c={'title':'Lost Lantern - OFFLINE FIXTURE','credits':['Geometric fixture art; not AI anime','Test tones only; no voices or generated music','Two-shot pipeline validation fixture'],'duration':5,'fps':24,'shots':[{'id':'lost','start':0,'end':2.5,'image':'art/shot-1-patched.png'},{'id':'found','start':2.5,'end':5,'image':'art/shot-2.png'}],'speech':[{'id':'n1','speaker':'Fixture narrator','voice':'fixture-tone-narrator-NOT-KOKORO','text':'[TONE FIXTURE] A lantern lies beside the path.','file':'audio/n1.wav','start':.3},{'id':'n2','speaker':'Fixture keeper','voice':'fixture-tone-keeper-NOT-KOKORO','text':'[TONE FIXTURE] The keeper finds and lifts it.','file':'audio/n2.wav','start':2.8}],'music':{'file':'audio/score.wav','peak':.08},'effects':[{'id':'step','file':'audio/step.wav','at':1.8,'offset':.02,'duration':.45,'peak':.2,'action':'Fixture chirp marks approach, not realistic footsteps','offsetEvidence':'Known analytic chirp envelope reaches full gain at 20 ms'},{'id':'lift','file':'audio/lift.wav','at':4.2,'offset':.02,'duration':.65,'peak':.18,'action':'Fixture chirp marks lifting, not realistic foley','offsetEvidence':'Known analytic chirp envelope reaches full gain at 20 ms'}],'fixture':True,'limitations':['No speech synthesis, anime generation, or generated music: explicit offline test assets','Not an eyes-closed intelligible story; captions describe intended story only']}
(p/'project.json').write_text(json.dumps(c,indent=2))
(p/'provenance.json').write_text(json.dumps({'fixture':True,'asset_method':'Pillow geometric primitives and SciPy analytic quadratic chirps','models_used':[],'assets':{str(x.relative_to(p)):hashlib.sha256(x.read_bytes()).hexdigest() for x in list((p/'art').glob('source*'))+list((p/'audio').glob('*'))}},indent=2))


def run(script,*args):
 subprocess.run([sys.executable,str(scripts/script),*map(str,args)],check=True)
for i in (1,2):run('ascii_art.py','convert',p/f'art/source-{i}.png',p/f'art/shot-{i}')
stem=p/'art/shot-1'
h=lambda x:hashlib.sha256(x.read_bytes()).hexdigest()
spec={'before_txt_sha256':h(stem.with_suffix('.txt')),'before_colors_sha256':h(Path(str(stem)+'.colors.json')),'rois':[[1,1,2,2]],'cells':[{'x':1,'y':1,'char':'@','rgb':[180,190,200]}]}
patch=p/'art/patch.json';patch.write_text(json.dumps(spec))
run('ascii_art.py','patch',stem,patch,p/'art/shot-1-patched')
run('mix_audio.py',p/'project.json')
run('render_pair.py',p/'project.json')
run('validate_audio.py',p/'project.json')
print('Model-free fixture passed; output:',p)
