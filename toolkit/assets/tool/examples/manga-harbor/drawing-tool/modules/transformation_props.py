"""Original motif-linked transformation props and layered energy studies.
Drawing principles adapted from CELSYS-hosted4514/4621/1638; no source art.
"""
import math,re
KINDS={'magical_focus','magical_energy'};INK='#272635';MOTIFS={'bellflower','comet','crystal'}
def validate_object(o):
 num=lambda v:type(v)in(int,float)and math.isfinite(v)
 if o.get('kind')not in KINDS:raise ValueError('Unknown transformation prop kind')
 allowed={'id','kind','position','scale','angle','color'}
 if not isinstance(o.get('position'),list)or len(o['position'])!=2 or not all(num(v)and abs(v)<=100000 for v in o['position']):raise ValueError('position finite pair required')
 for k,lo,hi,default in [('scale',.05,8,1),('angle',-180,180,0)]:
  if not num(o.get(k,default))or not lo<=o.get(k,default)<=hi:raise ValueError('Invalid '+k)
 if not isinstance(o.get('color','#8269c7'),str)or not re.fullmatch(r'#[0-9a-fA-F]{6}',o.get('color','#8269c7')):raise ValueError('color must be six-digit hex')
 if o['kind']=='magical_focus':
  allowed|={'subtype','motif','stage'}
  for k,values,default in [('subtype',{'wand','compact','blade'},'wand'),('motif',MOTIFS,'comet'),('stage',{'construction','ink','finish'},'finish')]:
   if not isinstance(o.get(k,default),str)or o.get(k,default)not in values:raise ValueError('Invalid '+k)
 else:
  allowed|={'stage','form'}
  if type(o.get('stage',4))is not int or not 1<=o.get('stage',4)<=4:raise ValueError('stage integer1..4')
  if not isinstance(o.get('form','burst'),str)or o.get('form','burst')not in {'burst','ribbon'}:raise ValueError('Invalid energy form')
 if set(o)-allowed:raise ValueError('Unknown transformation prop field')
 return True

def emblem(d,motif,cx,cy,r,color,prefix='emblem'):
 if motif=='comet':
  pts=[]
  for i in range(10):
   a=-math.pi/2+i*math.pi/5;rr=r if i%2==0 else r*.43;pts.append((cx+rr*math.cos(a),cy+rr*math.sin(a)))
  d.poly(pts,color,1.6,prefix+'-star');d.path(f'M {cx+r*.6},{cy+r*.6} Q {cx+r*1.8},{cy+r*.8} {cx+r*2},{cy+r*1.9} Q {cx+r*.8},{cy+r*1.4} {cx+r*.1},{cy+r*.8}',color,1.3,prefix+'-tail')
 elif motif=='crystal':
  d.poly([(cx,cy-r),(cx+r*.7,cy-r*.1),(cx+r*.45,cy+r*.8),(cx,cy+r),(cx-r*.45,cy+r*.8),(cx-r*.7,cy-r*.1)],color,1.7,prefix+'-crystal');d.path(f'M {cx},{cy-r} L {cx-r*.15},{cy} L {cx},{cy+r} M {cx-r*.15},{cy} L {cx+r*.7},{cy-r*.1}',width=.8,id=prefix+'-facet')
 else:
  for i in range(5):
   a=i*72;d.parts.append(f'<g transform="translate({cx} {cy}) rotate({a})">');d.path(f'M 0,0 Q {-r*.9},{-r*.7} 0,{-r} Q {r*.9},{-r*.7} 0,0 Z',color,1.3,prefix+f'-petal{i}');d.parts.append('</g>')
  d.ellipse(cx,cy,r*.23,r*.23,'#fff5c9',1,prefix+'-center')

def render(d,o,camera=None,guides=False):
 validate_object(o);x,y=o['position'];sc=o.get('scale',1);angle=o.get('angle',0);color=o.get('color','#8269c7');d.parts.append(f'<g transform="translate({x} {y}) rotate({angle}) scale({sc})">')
 if o['kind']=='magical_energy':
  stage=o.get('stage',4);form=o.get('form','burst');ident=d.prefix
  if stage>=3:
   d.parts.append(f'<defs><radialGradient id="{ident}-halo-gradient"><stop stop-color="{color}" stop-opacity=".55"/><stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient></defs>');d.ellipse(0,0,125,125,f'url(#{ident}-halo-gradient)',0,'halo')
  if stage>=2:
   if form=='burst':d.path('M -91,15 Q -56,-70 -11,-50 Q 51,-89 76,-19 Q 111,39 39,72 Q -33,115 -77,51 Q -111,37 -91,15 Z',color,0,'secondary')
   else:d.path('M -110,61 C -48,-7 64,48 80,-22 Q 85,-63 37,-84 Q 101,-65 104,-25 C 113,66 -23,24 -110,61 Z',color,0,'secondary')
  if form=='burst':d.path('M 0,-91 L 18,-29 L 53,-51 L 31,-14 L 92,3 L 28,20 L 48,58 L 11,34 L -8,91 L -22,32 L -63,50 L -34,9 L -88,-11 L -24,-22 Z','#fff9d8',1,'core',stroke=color)
  else:d.path('M -105,58 C -46,-20 71,30 77,-34 Q 75,-59 46,-75 Q 91,-62 90,-30 C 90,50 -33,6 -105,58 Z','#fff9d8',1,'core',stroke=color)
  if stage>=4:
   for i in range(12):
    a=i*math.tau/12+.2;r=112+(i%3)*13;px,py=math.cos(a)*r,math.sin(a)*r;d.path(f'M {px-3},{py} L {px},{py-7} L {px+3},{py} L {px},{py+7} Z','#fff9d8',.7,f'particle{i}',stroke=color)
 else:
  sub=o.get('subtype','wand');motif=o.get('motif','comet');stage=o.get('stage','finish');ink=stage=='ink';fill='white'if ink else color
  if sub=='compact':
   d.ellipse(0,7,64,59,'#48435e',2,'thickness');d.ellipse(0,0,64,59,'white',2,'shell');d.ellipse(0,0,52,47,fill,1.3,'inset');d.ellipse(0,0,42,38,'#fff5d4'if not ink else'white',1,'border');emblem(d,motif,0,-3,28,fill);d.rect(-12,50,24,14,fill,1.5,id='latch');d.path('M -42,-27 Q -26,-44 -7,-42',width=5,id='reflection',stroke='white')
  elif sub=='wand':
   d.path('M -8,-3 L -7,148 Q 0,160 7,148 L 8,-3 Z','white',2,'shaft');d.path('M -7,75 L 7,83 M -7,91 L 7,99 M -7,107 L 7,115',width=3,id='grip-wrap',stroke=fill);d.ellipse(0,-28,43,43,fill,2,'halo-shell');d.ellipse(0,-28,34,34,'white',1,'halo-inset');emblem(d,motif,-3,-30,24,fill);d.path('M -9,13 Q -47,-2 -42,22 Q -29,42 -9,23 L -24,62 L -7,53 L 0,25 L 12,58 L 27,68 L 13,22 Q 43,36 45,18 Q 47,-1 9,13 Z',fill,1.6,'bow');d.ellipse(0,18,10,8,'#fff5d4'if not ink else'white',1.5,'bow-knot')
  else:
   d.path('M -13,-20 L -20,-151 L 0,-210 L 20,-151 L 13,-20 Z','white',2,'blade');d.path('M 0,-210 L 0,-20 L 13,-20 L 20,-151 Z','#d4d4e2',1,'blade-plane');d.path('M -55,-21 Q -37,-42 -13,-25 L 0,-35 L 13,-25 Q 37,-42 55,-21 L 44,-7 Q 23,-18 13,-10 L -13,-10 Q -23,-18 -44,-7 Z','#494359',2,'guard-thickness');d.path('M -55,-27 Q -37,-48 -13,-31 L 0,-41 L 13,-31 Q 37,-48 55,-27 L 44,-13 Q 23,-24 13,-16 L -13,-16 Q -23,-24 -44,-13 Z',fill,2,'guard-face');d.rect(-9,-13,18,71,'white',1.8,id='grip');d.path('M -9,3 L 9,11 M -9,19 L 9,27 M -9,35 L 9,43',width=3,id='grip-wrap',stroke=fill);emblem(d,motif,0,64,16,fill)
  if guides or stage=='construction':
   d.line((0,-220),(0,170),.8,'#5799bc','axis');d.ellipse(0,-28 if sub=='wand'else 0,65,65,'none',.8,'envelope')
 d.parts.append('</g>')
