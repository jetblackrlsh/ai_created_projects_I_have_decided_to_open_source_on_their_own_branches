#!/usr/bin/env python3
"""Headless original heroic-comics scene renderer; no image model or browser required."""
import json,html,hashlib,copy,argparse,subprocess,pathlib,math
from figures import render_figure

def render_object(o):
 k=o['kind']
 if k=='panel':
  children=[]
  for child in o['objects']:
   c=copy.deepcopy(child);c['id']=o['id']+'-'+c['id'];children.append(render_object(c))
  return f'<g id="{o["id"]}" transform="translate({o.get("x",0)} {o.get("y",0)})"><defs><clipPath id="{o["id"]}-clip"><rect width="{o["width"]}" height="{o["height"]}"/></clipPath></defs><g clip-path="url(#{o["id"]}-clip)"><rect width="{o["width"]}" height="{o["height"]}" fill="{o.get("background","#e4d9c8")}"/>{"".join(children)}</g><rect width="{o["width"]}" height="{o["height"]}" fill="none" stroke="#121a2b" stroke-width="4"/></g>'
 if k=='caption':
  import textwrap
  size=o.get('size',19);w=o.get('width',400);x=o.get('x',12);y=o.get('y',12);rows=textwrap.wrap(o['text'],width=max(8,int((w-24)/(size*.56))));h=len(rows)*size*1.30+18
  lines=''.join(f'<tspan x="{x+12}" y="{y+size+7+i*size*1.3}">{html.escape(t)}</tspan>'for i,t in enumerate(rows))
  return f'<g id="{o["id"]}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{12 if o.get("bubble") else 0}" fill="{o.get("fill","#fff8dc")}" stroke="#121a2b" stroke-width="1.5"/><text font-family="DejaVu Sans" font-size="{size}" fill="#121a2b">{lines}</text></g>'
 if k=='figure':return render_figure(o)
 if k=='construction':
  from figures import render_construction
  return render_construction(o)
 if k=='hand':
  from heads import render_hand
  return render_hand(o)
 if k=='head':
  from heads import render_head
  return render_head(o)
 if k=='world':
  from world import render_world
  return render_world(o)
 if k in ['portal','ghost','lightning']:
  import effects
  return getattr(effects,'render_'+k)(o)
 if k=='path':return f'<path id="{o["id"]}" d="{html.escape(o["d"])}" fill="{o.get("fill","none")}" stroke="{o.get("stroke","#121a2b")}" stroke-width="{o.get("width",2)}"/>'
 if k=='text':return f'<text id="{o["id"]}" x="{o["x"]}" y="{o["y"]}" font-family="DejaVu Sans" font-size="{o.get("size",20)}" font-weight="{o.get("weight","normal")}" fill="{o.get("fill","#121a2b")}">{html.escape(o["text"])}</text>'
 if k=='rect':return f'<rect id="{o["id"]}" x="{o["x"]}" y="{o["y"]}" width="{o["width"]}" height="{o["height"]}" fill="{o.get("fill","none")}" stroke="{o.get("stroke","#121a2b")}" stroke-width="{o.get("stroke_width",2)}"/>'
 raise ValueError('Unknown object kind: '+k)
def validate(s):
 assert isinstance(s,dict) and s.get('version')==1,'version must be1'
 assert all(type(s[k]) in (int,float) and 0<s[k]<=10000 for k in ['width','height'])
 ids=[]
 for o in s['objects']:
  assert isinstance(o.get('id'),str) and o['id'].replace('-','').replace('_','').isalnum(),'stable alphanumeric IDs required'
  assert o['id'] not in ids,'duplicate ID';ids.append(o['id'])
  json.dumps(o,allow_nan=False)
 return True
def render(s):
 validate(s);w,h=s['width'],s['height'];body=''.join(render_object(o)for o in s['objects'])
 return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><rect width="100%" height="100%" fill="{s.get("background","#fffdf5")}"/>{body}</svg>'
def patch(s,object_id,updates):
 n=copy.deepcopy(s);found=False
 for o in n['objects']:
  if o['id']==object_id:o.update(updates);found=True
 if not found:raise KeyError(object_id)
 validate(n);return n
def hashes(s):return {o['id']:hashlib.sha256(render_object(o).encode()).hexdigest()for o in s['objects']}
def export(s,out):
 out=pathlib.Path(out);out.parent.mkdir(parents=True,exist_ok=True);out.with_suffix('.svg').write_text(render(s));out.with_suffix('.json').write_text(json.dumps(s,indent=2));subprocess.run(['inkscape',str(out.with_suffix('.svg')),'--export-type=png','--export-filename='+str(out.with_suffix('.png'))],check=True,capture_output=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('scene');p.add_argument('--out',required=True);a=p.parse_args();export(json.loads(pathlib.Path(a.scene).read_text()),a.out)
