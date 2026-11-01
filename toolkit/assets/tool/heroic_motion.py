#!/usr/bin/env python3
"""Heroic Motion Comics: original panel import and exact soundtrack adaptation."""
import argparse, hashlib, json, math, subprocess, sys
from pathlib import Path
from PIL import Image
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE/'scripts'))
def need(ok,msg):
 if not ok: raise ValueError(msg)
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def local(base,p):
 q=(base/p).resolve();need(q.is_relative_to(base.resolve()),'Path escapes project');return q
def probe(p):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
def packet_signature(p):
 data=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_packets','-show_data_hash','sha256','-show_entries','packet=pts,dts,duration,size,data_hash','-of','json',str(p)]))
 return data['packets']
def verify_master(source,target):
 a,b=probe(source),probe(target)
 sa=next(s for s in a['streams'] if s['codec_type']=='audio');sb=next(s for s in b['streams'] if s['codec_type']=='audio')
 need(sa['codec_name']==sb['codec_name']=='aac','AAC master required')
 need(sa['time_base']==sb['time_base'],'Audio timebase changed')
 x,y=packet_signature(source),packet_signature(target);need(x==y,'Encoded audio packets or timestamps differ')
 return {'identicalAACPacketsAndTiming':True,'packets':len(x),'sourceSha256':sha(source),'targetSha256':sha(target),'sampleRate':sa['sample_rate']}
def extract_master(source,target):
 target=Path(target);need(not target.exists(),'Refuse overwrite');s=next(x for x in probe(source)['streams'] if x['codec_type']=='audio');need(s['codec_name']=='aac','Source must contain AAC, no silent re-encoding')
 target.parent.mkdir(parents=True,exist_ok=True)
 subprocess.run(['ffmpeg','-v','error','-n','-i',str(source),'-map','0:a:0','-c:a','copy',str(target)],check=True)
 return verify_master(source,target)
def import_page(manifest):
 path=Path(manifest).resolve();base=path.parent;c=json.loads(path.read_text());out=local(base,c['output']);need(not out.exists(),'Refuse existing output directory');results=[]
 for page in c['pages']:
  src=local(base,page['json']);png=local(base,page['image']);data=json.loads(src.read_text());im=Image.open(png).convert('RGB');W,H=data['width'],data['height'];need(im.width==W and im.height==H,'Page raster dimensions must match logical JSON dimensions')
  panels=[o for o in data['objects'] if o['kind']=='panel'];need(panels,'Page has no top-level panels');ids=[p['id'] for p in panels];need(len(set(ids))==len(ids),'Duplicate panel IDs')
  for p in panels:
   x,y,w,h=[p[k] for k in ('x','y','width','height')];need(all(isinstance(v,int) for v in (x,y,w,h)),'Integer panel bounds required');need(x>=0 and y>=0 and w>0 and h>0 and x+w<=W and y+h<=H,'Panel outside page')
   ident=src.stem+'-'+p['id'];need(all(v.isalnum() or v in '-_' for v in ident),'Unsafe panel identifier');results.append((ident,im.crop((x,y,x+w,y+h)),{'id':ident,'image':ident+'.png','source':page['image'],'sourceJSON':page['json'],'rect':[x,y,w,h],'sourceSha256':sha(png),'sourceJSONSha256':sha(src)}))
 need(len({r[0] for r in results})==len(results),'Duplicate output panel IDs');out.mkdir(parents=True)
 for ident,im,r in results:im.save(out/(ident+'.png'));r['sha256']=sha(out/(ident+'.png'))
 ledger={'readingOrder':'pages array, then top-level panel object order (review explicitly)','panels':[r for _,_,r in results]};(out/'panel-ledger.json').write_text(json.dumps(ledger,indent=2));return ledger

def validate_exact(path):
 path=Path(path).resolve();base=path.parent;c=json.loads(path.read_text());D=c['duration'];fps=c['fps'];need(isinstance(fps,int) and 1<=fps<=60,'Invalid fps');need(math.isfinite(D) and 0<D<=3600,'Duration bound 1 hour');need(abs(D*fps-round(D*fps))<1e-5,'Duration not frame aligned');need(256<=c.get('size',1080)<=1920 and c.get('size',1080)%2==0,'Invalid square size')
 master=local(base,c['master']);s=next(s for s in probe(master)['streams'] if s['codec_type']=='audio');need(s['codec_name']=='aac' and int(s['sample_rate'])==48000,'48k AAC required');need(abs(float(s.get('duration',D))-D)<.1,'Master duration differs from timeline');need(c.get('audioReviewNotes'),'Document actual audio-only review');last=0;ids=set()
 for shot in c['shots']:
  need(shot['id'] not in ids,'Duplicate shot id');ids.add(shot['id']);a,b=shot['start'],shot['end'];need(all(math.isfinite(x) for x in (a,b)) and a>=last and b>a and b<=D,'Invalid overlapping shot bounds');need(all(abs(x*fps-round(x*fps))<1e-5 for x in (a,b)),'Shot boundary not frame aligned');last=b;im=local(base,shot['image']);need(sha(im)==shot['sha256'],'Panel hash changed');Image.open(im).verify()
 last_caption=0
 for cap in c.get('captions',[]):
  need(all(math.isfinite(cap[k]) for k in ['start','end']) and last_caption<=cap['start']<cap['end']<=D,'Caption outside timeline or overlapping');need(cap.get('text') and cap.get('speaker'),'Missing caption attribution');last_caption=cap['end']
 need(c['shots'],'No shots');need(c.get('credits'),'Credits required')
 from style_review import require_style_review
 require_style_review(base,c)
 if c.get('background'):Image.open(local(base,c['background'])).verify()
 if c.get('expectedPanels'):need(set(c['expectedPanels'])=={s.get('panel',s['id']) for s in c['shots']},'Declared panel coverage mismatch')
 return c

def render_exact(path):
 """Use inherited renderer only for layout; never mix/re-encode the supplied AAC."""
 import tempfile,shutil
 import render as backend
 c=validate_exact(path);base=Path(path).resolve().parent;out=base/'out';need(not out.exists(),'Refuse existing out directory');out.mkdir()
 shutil.copyfile(local(base,c['master']),out/'master.m4a')
 (out/'mix.json').write_text(json.dumps({'speech':c.get('captions',[])}))
 # The backend's rendering function uses only this validated layout/timeline contract.
 render_config=dict(c);render_config.setdefault('cast',{});render_config['visualMode']='comic-panels';render_config['editionLabel']=__import__('style_review').require_style_review(base,c)['label'];render_config['audioCredit']=c.get('audioCredit','Supplied complete soundtrack — preserved without re-encoding')
 prior=backend.validate
 try:
  backend.validate=lambda _:render_config
  result=backend.render(path,'both')
 finally:backend.validate=prior
 result['filmAudio']=verify_master(out/'master.m4a',out/'film.mp4');result['dramaAudio']=verify_master(out/'master.m4a',out/'audio-drama.mp4')
 (out/'exact-master-qa.json').write_text(json.dumps(result,indent=2));return result

def main():
 p=argparse.ArgumentParser(description=__doc__);s=p.add_subparsers(dest='cmd',required=True)
 for n in ['import-page','validate-exact','render-exact']:s.add_parser(n).add_argument('manifest')
 for n in ['extract-master','verify-master']:
  q=s.add_parser(n);q.add_argument('source');q.add_argument('target')
 a=p.parse_args()
 result={'import-page':lambda:import_page(a.manifest),'validate-exact':lambda:validate_exact(a.manifest),'render-exact':lambda:render_exact(a.manifest),'extract-master':lambda:extract_master(a.source,a.target),'verify-master':lambda:verify_master(a.source,a.target)}[a.cmd]()
 print(json.dumps(result,indent=2))
if __name__=='__main__':
 try:main()
 except (ValueError,KeyError,FileNotFoundError,subprocess.CalledProcessError) as e:sys.exit('ERROR: '+str(e))
