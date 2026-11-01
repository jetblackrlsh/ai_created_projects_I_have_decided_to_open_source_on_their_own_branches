from pathlib import Path
import json,subprocess
from body_types import render_body
from figures import render_figure,path
p=Path(__file__).resolve().parents[1]
def start(title,w=1600,h=1100):return [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}"><rect width="100%" height="100%" fill="#faf7ee"/><text x="45" y="48" font-family="sans-serif" font-size="28">{title}</text>']
def text(s,x,y,t,size=18):s.append(f'<text x="{x}" y="{y}" font-family="sans-serif" font-size="{size}">{t}</text>')
def save(name,s,objs):
 s.append('</svg>');(p/'outputs'/f'{name}.svg').write_text(''.join(s));(p/'assets/examples'/f'{name}.json').write_text(json.dumps(objs,indent=2));subprocess.run(['inkscape',str(p/'outputs'/f'{name}.svg'),'-o',str(p/'outputs'/f'{name}.png')],capture_output=True,check=True)
s=start('C04-01 • Heroic proportions / front and genuine side construction');objs=[]
for i,(kind,v) in enumerate([('guard','front'),('guard','profile'),('heroine','front'),('heroine','profile')]):
 o=dict(id=f'proportion-{i}',body=kind,view=v,x=205+390*i,y=150,scale=1.04,guides=True);objs.append(o);s.append(render_body(o));text(s,100+i*390,940,kind+' / '+v,21)
text(s,45,100,'Original guard and heroine designs. 80-unit head target; 700-unit height = 8.75 heads.')
text(s,45,1010,'Historical heroic stylization—not an anatomical standard or a rule about gender. Bodies have differing contours.',19)
text(s,45,1045,'Profiles are independent sagittal chest/seat/leg paths, not horizontally compressed frontal figures.',19)
save('body-front-profile',s,objs)
s=start('C04-02 • Ordinary, heroic and theatrical emphasis',1600,1100);objs=[]
for i,kind in enumerate(['ordinary','guard']):
 o=dict(id='contrast-'+kind,body=kind,view='front',x=200+i*365,y=145,scale=1.05);objs.append(o);s.append(render_body(o));text(s,95+i*365,930,'Ordinary build'if i==0 else'Heroic exaggeration',21)
# Original antagonist theatrical cloak: comparison in equivalent stance, not franchise costume.
for i,build in enumerate(['slim','broad']):
 x=965+i*390;sc=1.06;pose='stand';o=dict(id='theatrical-'+str(i),pose=pose,x=x,y=180,scale=sc,identity=dict(build=build,hair='long',age='adult'),suit='#624f6d',shadow='#3e344d');objs.append(o)
 s.append(f'<g transform="translate({x} 180) scale({sc})">'+path('M -66,88 Q -124,251 -127,574 L -75,549 -45,590 -15,562 20,594 58,560 106,586 129,571 Q 122,242 67,87 Z','#51455a',3)+'</g>');s.append(render_figure(o));text(s,x-140,930,'Subdued cloak / slim'if i==0 else'Expanded silhouette / broad',19)
text(s,45,100,'Matched standing pose: changing muscle mass, shoulder width, costume sweep and overall emphasis.')
text(s,45,1010,'The theatrical costume marks a story role; body shape itself does not establish morality.',20)
text(s,45,1050,'Application of scan39–40 comparison principles, not copies of the source characters.',18)
save('body-exaggeration',s,objs)
s=start('C04-03 • Compact mass / two genuinely different constructions',1500,1000);objs=[]
for i,kind in enumerate(['rock','heavy']):
 o=dict(id='mass-'+kind,body=kind,x=390+i*720,y=155,scale=1.3);objs.append(o);s.append(render_body(o));text(s,200+i*720,915,'Rock guardian / angular plates'if i==0 else'Heavy civilian / soft volume and jacket',21)
text(s,45,100,'Rock guardian uses compressed segmented masses; civilian uses continuous belly, fabric and broad stance.')
text(s,45,960,'Original silhouettes, no source-character likenesses or embedded book artwork.',18)
save('body-compact-mass',s,objs)
