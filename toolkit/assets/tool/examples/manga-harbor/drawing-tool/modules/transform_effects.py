"""Original staged transformation drawings. Explicit 2D silhouettes, not physical simulation."""
import math
KINDS={'power_form'}
EFFECTS={'liquid','resize','fracture','phase','portal','growth','fire','lightning','water'}
INK='#24232d'
def validate_object(o):
 allowed={'id','kind','position','scale','effect','stage','subject','direction','tone'}
 if set(o)-allowed:raise ValueError('Unknown power_form field')
 num=lambda v:type(v) in (int,float) and math.isfinite(v)
 for k,values in [('effect',EFFECTS),('subject',{'crystal','figure'}),('tone',{'ink','blue'})]:
  if k in o and (not isinstance(o[k],str) or o[k] not in values):raise ValueError('Invalid '+k)
 if not isinstance(o.get('effect'),str) or o.get('effect') not in EFFECTS:raise ValueError('effect required')
 if not isinstance(o.get('position'),list) or len(o['position'])!=2 or not all(num(v) for v in o['position']):raise ValueError('position finite pair required')
 for k,lo,hi in [('scale',.05,8),('stage',0,1)]:
  if not num(o.get(k,1 if k=='scale' else 0)) or not lo<=o.get(k,1 if k=='scale' else 0)<=hi:raise ValueError('Invalid '+k)
 if 'direction' in o:raise ValueError('direction is not supported; order stages explicitly')
 return True

def outline(subject):
 if subject=='crystal':return [(0,-165),(52,-113),(45,-29),(0,0),(-47,-28),(-54,-112)]
 # Original bounded human silhouette: head, neck, open arms, torso, separated legs.
 return [(-20,-210),(-28,-193),(-27,-171),(-13,-158),(-13,-148),(-40,-141),(-71,-112),(-84,-76),(-68,-69),(-51,-100),(-31,-111),(-26,-66),(-35,-8),(-27,0),(-8,0),(0,-59),(8,0),(27,0),(35,-8),(26,-66),(31,-111),(51,-100),(68,-69),(84,-76),(71,-112),(40,-141),(13,-148),(13,-158),(27,-171),(28,-193),(20,-210)]

def perimeter_samples(poly,n=64):
 seg=[math.dist(poly[i],poly[(i+1)%len(poly)]) for i in range(len(poly))];total=sum(seg);out=[]
 for k in range(n):
  distance=k*total/n;i=0
  while distance>seg[i] and i<len(seg)-1:distance-=seg[i];i+=1
  a,b=poly[i],poly[(i+1)%len(poly)];t=distance/seg[i];out.append((a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t))
 return out

def liquid_points(subject,t):
 pts=perimeter_samples(outline(subject));out=[]
 for x,y in pts:
  # Monotonic squash keeps topology and avoids correspondence crossings.
  out.append((x*(1+.7*t),y*(1-t)**2-4*t))
 return out

def render(d,o,camera=None,guides=False):
 validate_object(o);x,y=o['position'];s=o.get('scale',1);t=o.get('stage',0);effect=o['effect'];subject=o.get('subject','crystal');fill='#dce7ee' if o.get('tone')=='blue' else '#e1e1e9';prefix=d.prefix
 d.parts.append(f'<g transform="translate({x} {y}) scale({s})">')
 if effect in ['fire','lightning','water']:
  d.parts.append(f'<g transform="scale({.3+.7*t})">')
  if effect=='fire':
   d.path('M 0,0 C -35,-36 12,-66 -4,-98 Q 33,-82 25,-120 Q 62,-105 43,-157 Q 100,-150 90,-214 Q 130,-182 100,-137 Q 148,-146 117,-101 Q 145,-67 102,-48 Q 93,-8 0,0 Z','#8f91a0',2.5,'flame-outer')
   d.path('M 10,-5 Q 20,-65 49,-72 Q 38,-42 78,-105 Q 106,-125 87,-157 Q 121,-130 85,-81 Q 113,-62 74,-35 Q 52,-12 10,-5 Z','white',1,'flame-core')
   for i,(xx,yy) in enumerate([(110,-185),(139,-122),(57,-198)]):d.path(f'M {xx},{yy} q -8,-12 1,-23 q 13,10 -1,23 Z','#8f91a0',1,f'ember-{i}')
  elif effect=='lightning':
   pts=[(0,0),(29,-55),(11,-56),(57,-97),(41,-105),(91,-159),(77,-165),(121,-215)]
   d.path('M '+' L '.join(f'{x},{y}' for x,y in pts),width=13,id='electric-aura',stroke='#b6b7c8')
   d.path('M '+' L '.join(f'{x},{y}' for x,y in pts),width=4,id='electric-core',stroke='white')
   d.path('M 57,-97 L 100,-86 L 86,-63 L 122,-41 M 91,-159 L 53,-183 L 57,-202',width=2,id='electric-branches')
  else:
   d.path('M 0,0 C 10,-110 64,-185 133,-162 Q 165,-145 145,-104 Q 144,-132 123,-137 Q 131,-111 109,-101 Q 118,-137 97,-139 Q 88,-116 77,-107 Q 93,-154 55,-126 Q 24,-89 21,-1 Z',fill,2.5,'water-stream')
   d.path('M 8,-8 C 22,-98 64,-163 114,-151 M 128,-147 Q 147,-137 143,-121',width=3,id='water-highlight',stroke='white')
   for i,(xx,yy) in enumerate([(141,-80),(116,-68),(89,-94),(163,-104)]):d.ellipse(xx,yy,3,8,fill,1,f'water-drop-{i}')
  d.parts.append('</g>')
 elif effect=='growth':
  # Roots precede the trunk; leaves unfurl along alternating side branches.
  h=20+210*t;w=4+10*t
  for i in range(5):
   end=(-1 if i%2 else 1)*(15+i*10)*t
   d.path(f'M 0,0 Q {end*.4},12 {end},18',width=max(1,w*.25),id=f'root-{i}')
  d.path(f'M {-w},0 Q {-w*.8},{-h*.5} -3,{-h} Q {w*.9},{-h*.55} {w},0 Z',fill,2,'stem')
  for i in range(6):
   u=(i+1)/7;visible=max(0,min(1,(t-u*.45)*2));by=-h*u;sgn=(-1)**i;ex=sgn*(25+45*u)*visible;ey=by-25*visible
   d.path(f'M 0,{by} Q {ex*.45},{by-8} {ex},{ey}',width=2,id=f'branch-{i}')
   if visible>0:
    d.path(f'M {ex},{ey} Q {ex+sgn*30*visible},{ey-34*visible} {ex+sgn*46*visible},{ey-10*visible} Q {ex+sgn*25*visible},{ey+15*visible} {ex},{ey} Z',fill,1.6,f'leaf-{i}')
    d.line((ex,ey),(ex+sgn*40*visible,ey-10*visible),.8,id=f'leaf-vein-{i}')
  d.ellipse(0,4,14,6,'#777887',1,'seed')
 elif effect=='portal':
  r=15+75*t;h=25+130*t
  d.ellipse(0,-h,r,h,'#24232d',3,'portal-dark')
  for i in range(4):
   d.ellipse(0,-h,r+5+i*5,h+5+i*5,'none',1.3,'ring-'+str(i))
  for i in range(12):
   a=i*math.pi/6;u,v=(r+29)*math.cos(a),-h+(h+29)*math.sin(a)
   d.line((u,v),(u+12*math.cos(a+.4),v+12*math.sin(a+.4)),2,id=f'spark-{i}')
 elif effect=='fracture':
  poly=outline(subject);center=(0,-85 if subject=='crystal' else -110)
  for i,a in enumerate(poly):
   b=poly[(i+1)%len(poly)];cx=(a[0]+b[0]+center[0])/3;cy=(a[1]+b[1]+center[1])/3;dx=cx*.8*t;dy=(cy-center[1])*.6*t+70*t*t
   d.poly([(p[0]+dx,p[1]+dy) for p in [center,a,b]],fill if i%2 else '#a5a5b4',1,f'fragment-{i}')
 elif effect=='liquid':
  if t==0:d.poly(outline(subject),fill,2.5,'body')
  elif t>=.99:d.ellipse(0,-4,115,15,fill,2.5,'pool')
  else:
   h=(210 if subject=='figure' else 165)*(1-t);spread=60+55*t;head=19+15*t
   path=f'M {-head},{-h+25} C {-head-9},{-h-8} {head+9},{-h-8} {head},{-h+25} Q {head*.7},{-h+34} {head*.85},{-h+43} C {spread*.45},{-h+44} {spread*.6},{-h*.3} {spread},{-17} Q {spread+24},-10 {spread+3},0 Q 0,25 {-spread-8},0 Q {-spread-27},-14 {-spread},-19 C {-spread*.6},{-h*.3} {-spread*.45},{-h+44} {-head*.85},{-h+43} Q {-head*.7},{-h+34} {-head},{-h+25} Z'
   d.path(path,fill,2.5,'body')
   d.path(f'M {-head*.5},{-h+12} Q {-head*.8},{-h-1} 0,{-h+1} M {-spread*.7},-9 Q 0,4 {spread*.65},-10',width=3,id='surface-highlight',stroke='white')
   for i in range(3):d.ellipse((-1)**i*(spread+12+8*i),-55+i*18,3+4*t,9-4*t,fill,1,f'droplet-{i}')
 else:
  poly=outline(subject)
  if effect=='resize':
   factor=.35+1.15*t;d.parts.append(f'<g transform="scale({factor})">');d.poly(poly,fill,2,'body');d.parts.append('</g>')
  else:
   # Fragmented strip-mask gives a readable loss of solidity; not mere opacity.
   clip=prefix+'-phase-mask';d.parts.append(f'<defs><clipPath id="{clip}">')
   for i in range(24):d.parts.append(f'<rect x="-100" y="{-220+i*10}" width="200" height="{max(.3,10*(1-t))}"/>')
   d.parts.append('</clipPath></defs>');d.parts.append(f'<g clip-path="url(#{clip})">');d.poly(poly,fill,2.5,'body');d.parts.append('</g>')
   for i in range(8):
    a=i*math.pi/4;d.line((70*math.cos(a),-105+100*math.sin(a)),(70*math.cos(a)+25*t,-105+100*math.sin(a)),1,id=f'phase-residue-{i}')
 if effect in ['liquid','resize','phase'] and subject=='figure' and t<.5:
  f=(.35+1.15*t) if effect=='resize' else 1
  ey=-184*f if effect!='liquid' else -210*(1-t)+17
  d.line((-13*f,ey),(-5*f,ey),2,id='eye-left');d.line((5*f,ey),(13*f,ey),2,id='eye-right')
 if guides:d.line((-120,0),(120,0),1,'#70a0c8','contact-guide')
 d.parts.append('</g>')
