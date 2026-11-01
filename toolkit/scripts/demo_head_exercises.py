from heads import render_head
from pathlib import Path
import json
p=Path(__file__).resolve().parents[1];parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1500"><rect width="1600" height="1500" fill="#fbf8f0"/>'];examples=[]
def text(x,y,t,size=19):parts.append(f'<text x="{x}" y="{y}" font-family="sans-serif" font-size="{size}">{t}</text>')
text(40,45,'HEAD LAB • Original applications of scans 74–92',30)
text(40,78,'Construction progression, acting, distinct designs; not copied book characters.')
for row,(view,n) in enumerate([('front',6),('profile',5)]):
 text(40,115+row*280,'FRONT: SIX STAGES' if row==0 else 'PROFILE: FIVE STAGES',21)
 for i in range(n):
  o=dict(id=f'progress-{view}-{i}',x=135+i*260,y=215+row*280,scale=1.65,view=view,identity=dict(jaw='narrow',hair='long'),stage=i if row==0 else [0,1,2,3,5][i],guides=i<n-1)
  examples.append(o);parts.append(render_head(o));text(80+i*260,335+row*280,['volume','eyes + ear','nose plane','brow + lips','jaw planes','finished ink'][o['stage']])
text(40,700,'ACTING: ONE DESIGN / SIX EMOTIONS',21)
for i,e in enumerate(['neutral','angry','fear','smile','shout','sad']):
 o=dict(id='acting-'+e,x=135+i*260,y=805,scale=1.6,expression=e,identity=dict(jaw='narrow',hair='long'));examples.append(o);parts.append(render_head(o));text(90+i*260,920,e)
text(40,980,'IDENTITY VARIATIONS: SHAPE, AGE, HAIR AND REGALIA',21)
ids=[dict(shape='square',hair='bald'),dict(shape='pear',hair='short'),dict(jaw='narrow',hair='forelock',age='child'),dict(hair='long',age='elder'),dict(hair='short',beard='short'),dict(hair='long',beard='long',crown=True)]
for i,ident in enumerate(ids):
 o=dict(id='identity-'+str(i),x=135+i*260,y=1090,scale=1.6,identity=ident);examples.append(o);parts.append(render_head(o));text(65+i*260,1230,['square','pear','young forelock','older scholar','broad + beard','crowned sage'][i])
text(40,1310,'Limits: authored five-view silhouettes, not continuous 3D rotation. Hair/planes need per-view refinement.',20)
text(40,1345,'Book mirror exercise cannot be literally performed by an AI; these expressions are constructed applications.',18)
text(40,1380,'Hands are an independent extension, not claimed as exercises in this head chapter.',18)
parts.append('</svg>');(p/'outputs/head-exercises.svg').write_text(''.join(parts));(p/'assets/examples/head-exercises.json').write_text(json.dumps(examples,indent=2))
