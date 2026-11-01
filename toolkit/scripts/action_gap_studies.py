"""Original rear-view and physical-contact applications of scans63–64.
No source art embedded; explicit authored action layouts, not physics simulation.
"""
from pathlib import Path
import json,subprocess,math
from figures import path,line,limb,render_figure
from heads import render_head,render_hand
P=Path(__file__).resolve().parents[1];INK='#17202b'
J={'n':[0,40],'ls':[-48,75],'rs':[49,79],'le':[-97,17],'re':[112,48],'lw':[-90,-67],'rw':[164,-2],'lh':[-24,230],'rh':[35,227],'lk':[-93,281],'rk':[111,299],'la':[-110,393],'ra':[145,420]}
def rear(o):
 j=o.get('joints',J);stage=o.get('stage',4);s='';pre=o.get('id','rear');edges=[('n','ls'),('n','rs'),('ls','le'),('le','lw'),('rs','re'),('re','rw'),('lh','rh'),('lh','lk'),('lk','la'),('rh','rk'),('rk','ra')]
 if stage<3:
  s+=path('M 0,0 Q 31,130 4,230 Q -60,291 -110,393',w=2.5,stroke='#ca6951')
  for a,b in edges:s+=line(j[a],j[b],1.3,'#578a9d')
  s+=f'<ellipse cx="0" cy="13" rx="24" ry="30" fill="none" stroke="#578a9d"/>'
  if stage>=1:
   for side in ['l','r']:
    for a,b,c,ww in [(j[side+'s'],j[side+'e'],j[side+'w'],[17,12,8]),(j[side+'h'],j[side+'k'],j[side+'a'],[24,16,9])]:s+=limb(a,b,c,ww,'none',pre+side+('arm' if a==j[side+'s'] else 'leg'),False)
   s+='<ellipse cx="0" cy="130" rx="48" ry="76" fill="none" stroke="#578a9d"/><ellipse cx="5" cy="228" rx="33" ry="29" fill="none" stroke="#578a9d"/>'
  if stage==2:s+=path('M -40,92 Q 0,110 40,93 M -43,123 Q 0,140 43,123 M -32,174 Q 0,185 32,175 M -20,211 Q 3,227 30,212 M 1,61 Q 10,138 3,214 M -44,86 L -18,132 -29,153 M 43,87 L 21,130 30,152',w=1.1,stroke='#52788d')
 else:
  for side in ['l','r']:
   s+=limb(j[side+'h'],j[side+'k'],j[side+'a'],[24,16,9],'#637d88',pre+side+'leg');a=j[side+'a'];s+=path(f'M {a[0]-10},{a[1]-4} L {a[0]+11},{a[1]-4} {a[0]+14},{a[1]+17} {a[0]-15},{a[1]+17} Z',INK,2)
  for side in ['l','r']:s+=limb(j[side+'s'],j[side+'e'],j[side+'w'],[20,13,8],'#edcfb5',pre+side+'arm')
  s+=path('M -12,35 L -15,52 -48,73 Q -55,107 -40,145 L -24,205 -31,233 Q 3,257 39,231 L 31,206 47,145 Q 62,112 49,77 L 16,53 13,35 Z','#88a0aa',2.3)
  s+=path('M -12,35 L -15,52 0,69 16,53 13,35 Z','#edcfb5',1.2)
  # genuine rear-specific scapular ridges, latissimus and spine
  s+=path('M -40,84 Q -12,86 -16,113 L -29,143 M 40,86 Q 12,89 17,115 L 31,145 M 1,69 Q 7,131 3,204 M -37,145 Q -20,155 -19,190 M 35,147 Q 20,165 23,192 M -26,217 Q 4,227 33,218',w=1.4)
  s+=path('M -22,4 Q -19,-23 2,-22 Q 28,-19 25,10 L 20,36 0,47 -20,35 Z','#edcfb5',2)
  s+=path('M -22,21 Q -29,-15 -8,-25 Q 22,-30 29,-5 L 25,24 15,35 8,29 0,37 -7,31 -17,37 Z',INK,1)
  for side in ['l','r']:
   a=j[side+'w'];s+=render_hand(dict(id=pre+side+'hand',x=a[0],y=a[1]-5,scale=.46,pose='grip',rotation=-10 if side=='l' else 60))
  if stage==4:
   s+=path('M -45,92 Q -34,99 -28,117 L -36,136 -42,117 Z M 46,96 Q 34,104 29,119 L 37,139 44,118 Z M -28,166 L -21,204 -11,216 -14,187 Z M 29,167 L 25,203 14,216 17,187 Z',INK,0)
 return f'<g id="{pre}" transform="translate({o.get("x",0)} {o.get("y",0)}) scale({o.get("scale",1)})">{s}</g>'
def start(title,w,h):return [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}"><rect width="100%" height="100%" fill="#faf7ee"/><text x="35" y="45" font-family="sans-serif" font-size="26">{title}</text>']
def txt(s,x,y,t,z=18):s.append(f'<text x="{x}" y="{y}" font-family="sans-serif" font-size="{z}">{t}</text>')
def save(name,s,objs):
 s.append('</svg>');(P/'outputs'/f'{name}.svg').write_text(''.join(s));(P/'assets/examples'/f'{name}.json').write_text(json.dumps(objs,indent=2));subprocess.run(['inkscape',str(P/'outputs'/f'{name}.svg'),'-o',str(P/'outputs'/f'{name}.png')],capture_output=True,check=True)
def main():
 s=start('REAR ACTION • five-stage original construction',1700,850);objs=[]
 for i in range(5):
  o=dict(id='rear-stage'+str(i),stage=i,x=145+i*335,y=240,scale=1.08);objs.append(o);s.append(rear(o));txt(s,60+i*335,760,['action line','solids','draw-through details','selected contours','black masses'][i])
 txt(s,35,95,'Back of skull, nape, scapulae, spine and latissimus; same landmarks across stages.');save('rear-five-stage',s,objs)
 # Front five-stage counterpart with separate mass/detail/selection passes.
 from figures import render_construction
 import xml.etree.ElementTree as E
 s=start('FRONT ACTION • five-stage original construction',1700,1000);objs=[]
 for i in range(5):
  o=dict(id='front-stage'+str(i),pose='run',x=160+i*335,y=190,scale=.94);objs.append(dict(o,stage=i))
  if i<2:s.append(render_construction(dict(o,stage='stick'if i==0 else 'volumes')))
  elif i==2:
   s.append(render_construction(dict(o,stage='volumes')))
   s.append(f'<g transform="translate({o["x"]} {o["y"]}) scale(.94)">'+path('M -47,113 Q 4,128 56,127 M -40,157 Q 3,177 44,172 M -29,217 Q -4,238 28,226 M -35,267 Q -6,288 22,278 M 8,60 Q 12,164 -7,274',w=1.2,stroke='#52788d')+'</g>')
  else:
   art=render_figure(o)
   if i==3:
    tree=E.fromstring(art)
    for node in tree.iter():
     if node.attrib.get('fill') in ['#121a2b','#17202b']:node.set('fill','none')
    art=E.tostring(tree,encoding='unicode')
   s.append(art)
  txt(s,60+i*335,880,['action line','solids','draw-through details','selected contours','black masses'][i])
 txt(s,35,950,'Front and rear share the same five decisions; details are not a substitute for constructing the whole action.',18)
 save('front-five-stage',s,objs)
 # Wall grips and limbs share explicit world-space anchors.
 s=start('REAR CLIMB • four visible load/contact points',1000,1000);ox,oy,sc=440,250,1.25
 s.append('<rect x="130" y="120" width="740" height="780" fill="#ddd7c8" stroke="#17202b" stroke-width="3"/>')
 for y in range(150,900,70):s.append(line([130,y],[870,y],1,'#b4aa96'))
 contacts=[]
 for key,typ in [('lw','hand'),('rw','hand'),('la','foot'),('ra','foot')]:
  a=J[key];x=ox+a[0]*sc;y=oy+a[1]*sc+(17*sc if typ=='foot'else-3);contacts.append(dict(joint=key,type=typ,point=[x,y],grip_rect=[x-30,y-3,60,13]))
  s.append(f'<rect x="{x-30}" y="{y-3}" width="60" height="13" rx="4" fill="#a8764c" stroke="#17202b" stroke-width="2"/>')
 s.append(rear(dict(id='climber',x=ox,y=oy,scale=sc)))
 # Fingers visibly cross over upper edge of each hand hold.
 for c in contacts[:2]:
  x,y=c['point'];s.append(path(f'M {x-10},{y-5} l 0,10 M {x-4},{y-6} l 0,11 M {x+3},{y-5} l 0,10 M {x+9},{y-3} l 0,8',w=3,stroke='#edcfb5'))
 txt(s,40,950,'Hand fingers overlap grips; boot soles rest on lower grips. Authored contact, not simulated weight.');save('rear-wall-climb',s,dict(actor=dict(x=ox,y=oy,scale=sc,joints=J),contacts=contacts))
 # Paired support: carrier, body and grasp layers intentionally separate.
 s=start('PAIRED ACTION • support and contact',1600,950)
 carrier=dict(id='carrier',x=380,y=170,scale=.9,pose='stand',identity=dict(hair='short'),joints={'le':[-100,205],'lw':[-20,260],'re':[140,190],'rw':[130,290]},suit='#6b8796')
 s.append(render_figure(carrier))
 # Child body draped across carrier: distinct yellow silhouette and unsupported legs hang.
 s.append(path('M 355,370 Q 388,356 419,382 L 477,404 Q 505,416 499,445 L 465,456 421,430 373,413 Z','#e9b34e',2.5))
 s.append(limb([476,430],[540,485],[554,550],[22,14,8],'#496375','child-legA'));s.append(limb([467,441],[505,509],[510,567],[21,13,8],'#496375','child-legB'))
 s.append(limb([370,383],[337,428],[344,476],[11,8,6],'#edcfb5','child-armA'));s.append(render_hand(dict(id='child-hand',x=344,y=480,scale=.32,pose='open',rotation=180)))
 s.append(render_head(dict(id='supported-child',x=344,y=351,scale=.65,rotation=-35,identity=dict(age='child',hair='forelock'),expression='sad',neck=False)))
 # Carrier palms overlap underside at exact authored wrist anchors.
 for i,(x,y) in enumerate([(362,404),(497,431)]):s.append(render_hand(dict(id='support-grip'+str(i),x=x,y=y,scale=.62,pose='grip',rotation=90)))
 txt(s,150,825,'Two-arm carry: palms overlap back and knee support zones.',19)
 # Impact pair: left striker extended arm meets right defender forearm, not hidden by burst.
 s.append(render_figure(dict(id='striker',x=995,y=190,scale=.85,pose='strike',suit='#a86c52',identity=dict(hair='forelock'),joints={'re':[158,90],'rw':[246,90]})))
 s.append(render_figure(dict(id='defender',x=1375,y=190,scale=.85,pose='brace',suit='#547a6f',identity=dict(hair='short'),joints={'ls':[-63,86],'le':[-175,160],'lw':[-175,70]})))
 # Contact between striker fist outeredge and defender upper forearm; bridge resolved with authored fist.
 s.append(path('M 1197,253 L 1217,253 Q 1224,261 1218,276 L 1197,275 Z','#edcfb5',2));s.append(path('M 1203,257 l 0,13 M 1209,257 l 0,14 M 1215,258 l 0,11',w=.8))
 s.append(path('M 1221,240 l 6,-12 M 1227,249 l 14,-4 M 1226,277 l 12,6',w=2,stroke='#b75e3c'))
 txt(s,940,825,'Fist meets blocking forearm; ownership remains visible.',19)
 txt(s,40,900,'Original applications of scans63–64. Fixed choreography; no collision/weight simulation or copied characters.',18)
 save('paired-support-impact',s,dict(carrier=carrier,support_contacts=[[362,404],[497,431]],impact=[1218,264]))

if __name__=='__main__':main()
