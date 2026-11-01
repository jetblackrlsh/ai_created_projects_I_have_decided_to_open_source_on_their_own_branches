"""Alternate-body digital loose-mass analogy. Original heroine contours, not source tracing."""
from body_types import render_body
from figures import path
from pathlib import Path
import json,subprocess,random,re
R=Path(__file__).resolve().parents[1];rng=random.Random(42)
body=dict(id='heroine',body='heroine',view='front',x=0,y=0,scale=1)
final=render_body(body);guide=''
# Original loose-mass landmarks for the independently constructed heroine silhouette.
for x,y,rx,ry in [(0,40,30,39),(0,175,49,74),(0,295,51,41)]:
 for k in range(6):guide+=f'<ellipse cx="{x+rng.uniform(-4,4)}" cy="{y+rng.uniform(-5,5)}" rx="{rx+rng.uniform(-5,5)}" ry="{ry+rng.uniform(-4,4)}" fill="none" stroke="#6d8798" stroke-width=".8"/>'
for sg in [-1,1]:
 for k in range(7):
  q=rng.uniform(-10,10);guide+=path(f'M {sg*43+q},119 Q {sg*72+q},198 {sg*53+q},340 M{sg*31+q},310 Q {sg*49+q},475 {sg*39+q},674',w=.9,stroke='#6d8798')
for a,b in [((0,0),(0,700)),((-43,119),(43,119)),((-51,295),(51,295))]:guide+=path(f'M{a[0]},{a[1]} L{b[0]},{b[1]}',w=1.5,stroke='#bc6c52')
svg='<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1050"><rect width="100%" height="100%" fill="#f8f4e9"/><g font-family="DejaVu Sans" fill="#192335"><text x="40" y="48" font-size="28">ALTERNATE BODY | Loose mass to selected contour</text><text x="40" y="82" font-size="16">Original heroine silhouette; digital exploratory strokes are an analogy, not physical pencil practice.</text>'
for i,(name,art) in enumerate([('LOOSE MASS',guide),('CHOSEN CONTOUR + GUIDES',final+f'<g opacity=".35">{guide}</g>'),('FINISHED APPLICATION',final)]):
 svg+=f'<g transform="translate({240+i*460},150) scale(1.03)">{art}</g><text x="{55+i*460}" y="970" font-size="18">{name}</text>'
svg+='</g></svg>';o=R/'outputs/alternate-body-construction';o.with_suffix('.svg').write_text(svg);o.with_suffix('.json').write_text(json.dumps({'body':body,'seed':42,'source_scans':[49,50],'adaptation':'Separate heroine geometry and digital exploratory marks; no physical drawing claim'},indent=2));subprocess.run(['inkscape',str(o.with_suffix('.svg')),'--export-type=png','--export-filename='+str(o.with_suffix('.png'))],check=True,capture_output=True)
