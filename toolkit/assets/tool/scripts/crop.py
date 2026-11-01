"""Crop declared PNG/SVG pages without redrawing them; reject external SVG refs."""
import json,subprocess,tempfile,re,xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image
from project import local,need,digest

def crop(path):
 path=Path(path).resolve();base=path.parent;c=json.loads(path.read_text());rows=[]
 for q in c['crops']:
  src=local(base,q['source']);out=local(base,q['output'],False);need(not out.exists(),'Refuse crop overwrite');out.parent.mkdir(parents=True,exist_ok=True)
  with tempfile.TemporaryDirectory() as td:
   raster=src
   if src.suffix.lower()=='.svg':
    text=src.read_text();need('<!DOCTYPE' not in text.upper() and '<!ENTITY' not in text.upper(),'SVG entities forbidden')
    tree=ET.fromstring(text)
    for node in tree.iter():
     need(node.tag.split('}')[-1] not in ['script','foreignObject','style'],'SVG scripts/foreignObject/styles unsupported')
     for key,value in node.attrib.items():
      need(not key.lower().startswith('on'),'SVG event handlers forbidden')
      if key.split('}')[-1]=='href':need(value.startswith('#'),'External SVG references forbidden')
      need(all(u.strip().strip(chr(34)+chr(39)).startswith('#') for u in re.findall(r'url\((.*?)\)',value,re.I)),'External SVG URL forbidden')
    raster=Path(td)/'page.png';subprocess.run(['inkscape',str(src),'--export-type=png',f'--export-filename={raster}','--export-dpi=96'],check=True,capture_output=True)
   im=Image.open(raster);need(im.width*im.height<=40000000,'Source image exceeds40MP bound');im=im.convert('RGB');rect=q['rect'];need(len(rect)==4 and all(isinstance(v,int) for v in rect),'Integer pixel rect x,y,width,height required');x,y,w,h=rect;need(0<=x<x+w<=im.width and 0<=y<y+h<=im.height,'Crop outside page')
   im.crop((x,y,x+w,y+h)).save(out)
  rows.append(dict(id=q['id'],image=q['output'],source=q['source'],sourceSha256=digest(src),sha256=digest(out),rect=rect))
 report=base/'crop-provenance.json';report.write_text(json.dumps(rows,indent=2));return rows
