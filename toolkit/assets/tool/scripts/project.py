"""Manifest validation and safe, project-local paths. No external side effects."""
from pathlib import Path
import json,hashlib,math
from scipy.io import wavfile
import numpy as np

def need(ok,msg):
 if not ok:raise ValueError(msg)
def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def local(base,name,exists=True):
 need(isinstance(name,str) and name and not Path(name).is_absolute(),'Asset paths must be relative')
 p=(base/name).resolve();need(p.is_relative_to(base.resolve()),'Asset path escapes project')
 if exists:need(p.is_file(),f'Missing asset: {name}')
 return p
def read(path):
 p=Path(path).resolve();return p.parent,json.loads(p.read_text())
def validate_art(base,c,assets=True):
 contract=c.get('artContract',{})
 mode=contract.get('mode')
 need(mode in ('manga','generic-comic'),'Explicit artContract.mode manga or generic-comic required')
 need(contract.get('notes'),'Art contract requires truthful scope/limitations notes')
 if mode=='generic-comic':
  need(contract.get('fixtureOnly') is True,'Generic mode is only for explicitly identified technical fixtures, not manga requests')
  return
 origin=contract.get('origin')
 need(origin in ('draw-headless-manga','supplied-manga'),'Manga requires drawing-tool origin or supplied manga')
 evidence=contract.get('evidence',[])
 need(evidence,'Manga source evidence required')
 for e in evidence:
  f=local(base,e['file'],assets)
  need(e.get('sha256') and e.get('role'),'Evidence needs file hash and role')
  if assets:need(digest(f)==e['sha256'],'Art evidence changed since review')
 sources={p.get('source') for p in c.get('panels',[])}
 need(sources<=set(e.get('file') for e in evidence),'Evidence must include every actual source page')
 for panel in c.get('panels',[]):
  need(any(e.get('file')==panel.get('source') and e.get('sha256')==panel.get('sourceSha256') and e.get('role')=='source-page' for e in evidence),'Actual source-page role and matching source hash required')
 if origin=='draw-headless-manga':
  need({'editable-scene','drawing-tool','drawing-receipt'}<=set(e['role'] for e in evidence),'Drawing origin requires editable scene, drawing tool, and actual command receipt')
 else:
  need(contract.get('permissionNotes'),'Supplied manga requires provenance/permission notes')
 review=contract.get('visualReview',{})
 need(review.get('reviewer') and review.get('method') and review.get('sequenceNotes'),'Actual visual inspection identity/method and sequence notes required')
 records=review.get('panels',[])
 need(len(records)==len(c.get('panels',[])) and len({r.get('id') for r in records})==len(records),'Each panel needs exactly one visual review')
 for panel in c.get('panels',[]):
  r=next((r for r in records if r.get('id')==panel['id']),{})
  need(r.get('sha256')==panel.get('sha256') and r.get('sourceSha256')==panel.get('sourceSha256'),'Panel visual review is missing or stale')
  need(r.get('accepted') is True and r.get('limitations'),'Panel must be visually accepted with honest limitations')
  for criterion in ('form','perspective','actingContact','lineTone','readability'):
   need(isinstance(r.get(criterion),str) and r[criterion].strip(),'Missing visual inspection notes: '+criterion)
 # This validates evidence completeness/freshness, NOT artistic quality or reviewer truthfulness.

def validate(path,assets=True):
 base,c=read(path);validate_art(base,c,assets);need(c.get('schemaVersion')==1,'schemaVersion must be 1')
 need(c.get('title') and c.get('credits'),'Title and truthful credits are required')
 need(c.get('audioOnlyReview',{}).get('approved') is True and c['audioOnlyReview'].get('notes'),'Audio-only script review required before generation')
 need(c.get('visualMode','comic-panels')=='comic-panels','This tool preserves comic panels; ASCII is not implicit')
 fps=c.get('fps',24);duration=c.get('duration',0)
 need(isinstance(fps,int) and 1<=fps<=60 and 0<duration<=300 and abs(duration*fps-round(duration*fps))<1e-6,'Frame-aligned duration <=300s and fps1..60 required')
 need(256<=c.get('size',1080)<=1920,'Output square size must be256..1920')
 cast=c.get('cast',{});need(cast and len(set(cast.values()))==len(cast),'Distinct narrator and character stock voices required')
 panels=c.get('panels',[]);shots=c.get('shots',[]);speech=c.get('speech',[])
 need(panels and shots and speech,'Panels, shots and speech cannot be empty')
 ids=[x['id'] for x in panels];need(len(ids)==len(set(ids)),'Duplicate panel IDs')
 sid=[x['id'] for x in shots];need(len(sid)==len(set(sid)),'Duplicate shot IDs')
 need(set(x['panel'] for x in shots)==set(ids),'Every declared source panel must appear; undeclared panels rejected')
 catalog={x['id']:x for x in panels};last=0
 for q in shots:
  need(0<=q['start']<q['end']<=duration and q['start']>=last,'Shots overlap or exceed timeline');last=q['end']
  need(q['image']==catalog[q['panel']]['image'],'Shot image differs from source panel')
  for key in ['start','end']:need(abs(q[key]*fps-round(q[key]*fps))<1e-5,'Shot boundaries must align to frames')
  local(base,q['image'],assets)
 for q in panels:
  p=local(base,q['image'],assets)
  need(q.get('source') and q.get('sha256'),'Panel source provenance/hash required')
  if assets:
   need(digest(p)==q['sha256'],'Panel changed since provenance record')
   source=local(base,q['source']);need(q.get('sourceSha256') and digest(source)==q['sourceSha256'],'Source page changed or lacks source hash')
 seen=set();end=0
 for q in speech:
  need(q['id'] not in seen,'Duplicate speech ID');seen.add(q['id'])
  need(q.get('text') and q.get('speaker') in cast and cast[q['speaker']]==q.get('voice'),'Missing text, speaker or assigned stock voice')
  need(q.get('shot') in sid,'Speech needs a declared shot')
  need(math.isfinite(q['start']) and 0<=q['start']<duration,'Invalid speech start')
  p=local(base,q['file'],assets)
  if assets:
   rate,a=wavfile.read(p);need(rate>0 and a.size and np.isfinite(a).all() and np.max(abs(a.astype(float)))>0,'Invalid/silent speech')
   stop=q['start']+len(a)/rate;need(q['start']>=end and stop<=duration,'Speech overlap or out of bounds');end=stop
   shot=next(x for x in shots if x['id']==q['shot']);need(shot['start']<=q['start'] and stop<=shot['end'],'Speech not inside its visual shot')
 for q in c.get('effects',[]):
  local(base,q['file'],assets);need(q.get('action') and math.isfinite(q['at']) and 0<=q['offset']<=q['at']<duration,'Effect needs action and valid transient timing')
 if c.get('music'):local(base,c['music']['file'],assets)
 if c.get('background'):local(base,c['background'],assets)
 return c
