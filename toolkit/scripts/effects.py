"""Original story props and graphic effects: all editable SVG paths."""
import math,random,html
from figures import path
INK='#121a2b'
def render_portal(o):
 w,h=o.get('width',400),o.get('height',160);rng=random.Random(o.get('seed',8));pts=[]
 for i in range(48):
  a=i*2*math.pi/48;r=1+rng.uniform(-.12,.12);pts.append((math.cos(a)*w*.5*r,math.sin(a)*h*.5*r))
 d='M '+' L '.join(f'{x:.1f},{y:.1f}'for x,y in pts)+' Z';s=path(d,'#10142c',6,'#c4a8d2')
 for f,col in [(1.10,'#9c7ab0'),(1.21,'#dbb2b1')]:s+=f'<g transform="scale({f})">'+path(d,'none',1,col)+'</g>'
 for i in range(15):
  a=rng.uniform(-math.pi,math.pi);x,y=math.cos(a)*w*.46,math.sin(a)*h*.38;s+=path(f'M {x},{y} q {-x*.5},{-y*.3} {-x*.8},{-y*.65}',w=.8,stroke='#485678')
 return f'<g id="{o["id"]}" transform="translate({o.get("x",0)} {o.get("y",0)}) rotate({o.get("rotation",0)})">{s}</g>'
def render_ghost(o):
 s=path('M -30,14 C -48,-43 -21,-72 8,-62 C 44,-51 29,-16 45,7 Q 65,29 42,73 Q 15,52 9,90 Q -2,54 -30,64 Q -12,39 -30,14 Z',o.get('fill','#b6d3cd'),2,'#3a6270')
 s+=path('M -20,-25 L -3,-21 -9,-12 -22,-15 Z M 6,-20 L 23,-25 23,-15 12,-11 Z','#173846',0)
 s+=path('M -13,8 Q 0,-6 15,9 L 9,27 Q -1,15 -13,8 Z','#294b58',0)
 s+=path('M -25,8 Q -63,-6 -70,20 M 24,5 Q 58,-6 64,18',w=6,stroke='#73a4aa')
 return f'<g id="{o["id"]}" opacity="{o.get("opacity",.8)}" transform="translate({o.get("x",0)} {o.get("y",0)}) rotate({o.get("rotation",0)}) scale({o.get("scale",1)})">{s}</g>'
def render_lightning(o):
 x,y=o.get('x',0),o.get('y',0);w,h=o.get('width',100),o.get('height',400);d=f'M {x},{y} L {x-w*.45},{y+h*.31} L {x+w*.10},{y+h*.28} L {x-w*.26},{y+h*.64} L {x+w*.26},{y+h*.56} L {x},{y+h}'
 return f'<g id="{o["id"]}">'+path(d,'none',10,'#e2a64d')+path(d,'none',5,'#fff4bd')+'</g>'
