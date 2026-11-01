"""Finite original action-family gap studies, explicitly authored and inspected."""
import json,pathlib,subprocess,html
from figures import render_figure,limb,joints,path
from heads import render_head
R=pathlib.Path(__file__).resolve().parents[1];W,H=1600,1250
cases=[
 dict(id='horizontal',pose='leap',rotation=-85,x=110,y=345,scale=.63,title='HORIZONTAL LEAP',lesson='A curved gesture remains readable when the body is horizontal.'),
 dict(id='inverted',pose='crouch',rotation=165,x=800,y=540,scale=.58,title='INVERTED / TUMBLING',lesson='Head, ribcage and pelvis share the same tumbling gesture.'),
 dict(id='folded',pose='stand',x=1330,y=190,scale=.57,joints={'le':[-96,186],'lw':[54,158],'re':[98,186],'rw':[-42,165]},title='FOLDED ARMS',lesson='Foreground forearms occlude torso; named wrists retain ownership.'),
 dict(id='staff',pose='brace',x=230,y=790,scale=.57,joints={'le':[8,185],'lw':[104,194],'re':[124,134],'rw':[210,113]},title='TWO-HAND STAFF THRUST',lesson='Both grips contact the same staff axis.'),
 dict(id='kneel',pose='stand',x=800,y=660,scale=.68,joints={'neck':[15,219],'ls':[-46,248],'rs':[73,238],'le':[-88,338],'lw':[-90,414],'re':[111,322],'rw':[61,395],'lh':[-10,420],'rh':[40,420],'lk':[-100,420],'la':[-100,580],'rk':[65,580],'ra':[210,580]},title='ONE-KNEE SUPPORT',lesson='One knee and the opposite foot share a ground plane.'),
 dict(id='recline',pose='stand',rotation=-90,x=1130,y=1035,scale=.62,joints={'le':[-50,190],'lw':[-45,290],'re':[45,190],'rw':[40,280],'lk':[-25,442],'la':[-25,610],'rk':[10,442],'ra':[10,610]},title='RECLINED / RECOVERY',lesson='The figure extends across the surface rather than hovering upright.')]
parts=[]
for i,o in enumerate(cases):
 x=25+(i%3)*525;y=110+(i//3)*555;parts.append(f'<rect x="{x}" y="{y}" width="505" height="530" rx="3" fill="#fbf8ed" stroke="#c7c3b8"/><text x="{x+16}" y="{y+30}" font-size="19" font-weight="bold">{o["title"]}</text>')
 draw={k:v for k,v in o.items()if k not in ['title','lesson']};draw.update(identity={'build':'athletic'},expression='angry' if i in [0,1,3]else 'neutral')
 if i==5:parts.append('<rect x="1090" y="1074" width="440" height="35" rx="15" fill="#c8d2d5" stroke="#334452"/><ellipse cx="1130" cy="1055" rx="43" ry="20" fill="#e1e5dc" stroke="#334452"/>')
 if i!=5:parts.append(render_figure(draw))
 else:
  parts.append(limb([1315,1055],[1410,1035],[1500,1070],[23,17,10],'#9fb5c3','recline-farleg'))
  parts.append(limb([1320,1040],[1400,970],[1500,1045],[25,18,11],'#bacbd2','recline-nearleg'))
  parts.append(path('M1160,1003 Q1200,988 1240,1012 L1290,1020 Q1320,1019 1340,1040 L1322,1080 Q1260,1073 1200,1080 L1150,1050 Z','#a8bcc9',3))
  parts.append(path('M1180,1006 Q1230,1012 1246,1043 M1210,1070 Q1250,1054 1290,1067',w=1.7))
  parts.append(limb([1180,1030],[1240,1060],[1270,1015],[18,12,8],'#efcfb0','recline-arm'))
  parts.append(render_head(dict(id='recline-head',x=1138,y=1025,rotation=-80,scale=.72,view='profile',neck=False,identity={'hair':'short'})))
 if i==2:
  j=joints(o);arms=''
  for side in ['l','r']:arms+=limb(j[side+'s'],j[side+'e'],j[side+'w'],[23,15,10],'#efcfb0',o['id']+'-'+side+'front')
  parts.append(f'<g transform="translate({o["x"]} {o["y"]}) scale({o["scale"]})">{arms}</g>')
 if i==3:
  # Staff follows actual hand positions after palm offsets; broad haft makes contact explicit.
  parts.append(f'<g transform="translate({o["x"]} {o["y"]}) scale({o["scale"]})"><path d="M 62,233 L 280,53" fill="none" stroke="#2c3440" stroke-width="13"/><path d="M 62,233 L 280,53" fill="none" stroke="#b89057" stroke-width="7"/><path d="M 93,203 l 13,12 M 200,120 l 12,14" stroke="#edcdb1" stroke-width="10"/></g>')
 if i==4:parts.append('<path d="M 690,1060 H 970" stroke="#334452" stroke-width="2"/>')
 if i==5:parts.append('<path d="M 1115,1110 V1140 M1500,1110 V1140" stroke="#334452" stroke-width="5"/>')
 parts.append(f'<text x="{x+16}" y="{y+505}" font-size="12">{html.escape(o["lesson"])}</text>')
svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}"><rect width="100%" height="100%" fill="#f1eee5"/><g font-family="DejaVu Sans" fill="#172231"><text x="30" y="45" font-size="29">ACTION FAMILIES | Original supplemental studies</text><text x="30" y="78" font-size="15">Applied scope: horizontal / inverted / crossed arms / held prop / kneeling / reclining. Bounded 2D contour constructions.</text>{"".join(parts)}</g></svg>'
out=R/'outputs/action-family-gaps';out.with_suffix('.svg').write_text(svg);out.with_suffix('.json').write_text(json.dumps(cases,indent=2));subprocess.run(['inkscape',str(out.with_suffix('.svg')),'--export-type=png','--export-filename='+str(out.with_suffix('.png'))],check=True,capture_output=True)
