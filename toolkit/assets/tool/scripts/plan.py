"""Assign measured speech timing to panel shots; never stretch generated speech."""
import json,math
from pathlib import Path
from scipy.io import wavfile
from project import local,need

def plan(path):
 path=Path(path).resolve();base=path.parent;c=json.loads(path.read_text());fps=c.get('fps',24);t=c.get('intro',1);gap=c.get('speechGap',.25)
 for shot in c['shots']:
  shot['start']=math.ceil(t*fps)/fps;t=shot['start']+.2
  rows=[x for x in c['speech'] if x['shot']==shot['id']];need(rows,'Each planned shot needs speech; manually time silent shots instead')
  for row in rows:
   rate,a=wavfile.read(local(base,row['file']));row['start']=round(t*48000)/48000;t=row['start']+len(a)/rate+gap
  shot['end']=math.ceil((t+.2)*fps)/fps;t=shot['end']
 c['duration']=math.ceil((t+c.get('outro',2))*fps)/fps
 dest=path.with_name(path.stem+'-planned.json');need(not dest.exists(),'Refuse planned manifest overwrite');dest.write_text(json.dumps(c,indent=2));return str(dest)
