from action_gap_studies import rear,J,P
from PIL import Image
import subprocess,json
out=P/'outputs';measure=[]
def render(name,svg):
 p=out/(name+'.svg');p.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000">'+svg+'</svg>');subprocess.run(['inkscape',str(p),'-o',str(out/(name+'.png'))],capture_output=True,check=True);return Image.open(out/(name+'.png')).convert('RGBA')
a=render('contact-actor-mask',rear(dict(id='climber',x=440,y=250,scale=1.25)))
for key,typ in [('lw','hand'),('rw','hand'),('la','foot'),('ra','foot')]:
 x=440+J[key][0]*1.25;y=250+J[key][1]*1.25+(17*1.25 if typ=='foot'else-3)
 b=render('contact-'+key+'-mask',f'<rect x="{x-30}" y="{y-3}" width="60" height="13" fill="black"/>')
 box=(int(x-35),int(y-25),int(x+35),int(y+25));aa=a.crop(box).getchannel('A');bb=b.crop(box).getchannel('A');count=sum(1 for av,bv in zip(aa.getdata(),bb.getdata())if av>128 and bv>128)
 measure.append(dict(joint=key,world_anchor=[x,y],hold_top=y-3,overlap_pixels=count,roi=list(box)));assert count>10
report=dict(method='Independent transparent SVG renders of actual actor and each hold; intersect alpha masks in fixed contact ROIs. Shows geometric/pixel overlap, not physical loading.',contacts=measure)
(out/'action-contact-evidence.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
import xml.etree.ElementTree as ET
root=ET.parse(out/'paired-support-impact.svg').getroot();ns='{http://www.w3.org/2000/svg}'
def node(id):return next(n for n in root.iter()if n.attrib.get('id')==id)
def serial(n):return ET.tostring(n,encoding='unicode')
def pairrender(name,svg):
 p=out/(name+'.svg');p.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="950">'+svg+'</svg>');subprocess.run(['inkscape',str(p),'-o',str(out/(name+'.png'))],capture_output=True,check=True);return Image.open(out/(name+'.png')).convert('RGBA')
def overlap(a,b,box):return sum(1 for x,y in zip(a.crop(box).getchannel('A').getdata(),b.crop(box).getchannel('A').getdata())if x>128 and y>128)
bridge=next(n for n in root.iter()if n.attrib.get('d','').startswith('M 1197,253'))
a=pairrender('impact-striker-mask',serial(node('striker'))+serial(bridge));b=pairrender('impact-defender-mask',serial(node('defender')));count=overlap(a,b,(1190,245,1245,290));assert count>0
pair=[dict(type='block',roi=[1190,245,1245,290],overlap_pixels=count)]
body=next(n for n in root.iter()if n.attrib.get('d','').startswith('M 355,370'));supportbody=serial(body)+serial(node('child-legA'))+serial(node('child-legB'));b=pairrender('supported-body-mask',supportbody)
for i,box in enumerate([(340,385,390,430),(475,410,530,460)]):
 a=pairrender('support-palm-'+str(i)+'-mask',serial(node('support-grip'+str(i))));count=overlap(a,b,box);assert count>0;pair.append(dict(type='support'+str(i),roi=list(box),overlap_pixels=count))
report['pair_contacts']=pair;(out/'action-contact-evidence.json').write_text(json.dumps(report,indent=2));print(json.dumps(pair))
