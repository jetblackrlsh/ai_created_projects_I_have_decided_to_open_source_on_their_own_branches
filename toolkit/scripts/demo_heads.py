from heads import render_head,render_hand
from pathlib import Path
import json
p=Path(__file__).resolve().parents[1];O=[];s=['<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1120" viewBox="0 0 1500 1120"><rect width="1500" height="1120" fill="#f7f4ec"/><text x="50" y="55" font-family="sans-serif" font-size="30" font-weight="bold">HEAD CONSTRUCTION / ORIGINAL HEROIC CAST</text><text x="50" y="84" font-family="sans-serif" font-size="17">Independent vector studies: changing planes, expression and identity—not image generation or tracing</text>']
for row in range(3):
 for col,v in enumerate(['front','threequarter','profile','up','down']):
  o=dict(id=f'head-{row}-{col}',x=150+col*300,y=225+row*290,scale=1.8,view=v,expression=['neutral','angry','fear','smile','shout'][col] if row==1 else 'neutral',identity=[dict(hair='short'),dict(hair='forelock',age='child',jaw='narrow'),dict(hair='long',age='elder',jaw='narrow')][row],guides=row==0)
  O.append(o);s.append(render_head(o));s.append(f'<text x="{col*300+70}" y="{360+row*290}" font-family="sans-serif" font-size="17">{v} / {o["expression"]}</text>')
for i,pose in enumerate(['fist','open','grip']):s.append(render_hand(dict(id='hand-'+pose,x=1080+i*155,y=1015,scale=1.3,pose=pose)))
s.append('<text x="55" y="1015" font-family="sans-serif" font-size="19">Top: construction / Middle: young protagonist acting / Bottom: elder design</text><text x="55" y="1048" font-family="sans-serif" font-size="17">Bounded authored 2D views; not automatic arbitrary-angle anatomy.</text></svg>')
(p/'outputs/head-study.svg').write_text(''.join(s));(p/'assets/examples/head-study.json').write_text(json.dumps(O,indent=2))
