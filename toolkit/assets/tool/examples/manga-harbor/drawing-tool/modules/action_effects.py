"""Original deterministic action marks. Geometric exclusion masks preserve subject clarity.
Lesson principles: MediBang Beginner 13 (focus, motion, masked lettering).
No bundled artwork, fonts, browser, network or image generator.
"""
import math,random,html
KINDS={'action_effect','action_sound'}
TYPES={'impactstar','curvedslash','motiontrail','debris','burst','speed'}
INK='#202029'
def number(v):return type(v) in (int,float) and math.isfinite(v)
def vec(v,n):return isinstance(v,list) and len(v)==n and all(number(x) and abs(x)<=100000 for x in v)
def rect(v):return vec(v,4) and 0<v[2]<=8192 and 0<v[3]<=8192
def validate_object(o):
 if o.get('kind')=='action_sound':
  allowed={'id','kind','text','position','size','angle','skew','style','halo'}
  if not isinstance(o.get('text'),str) or not 1<=len(o['text'])<=24 or any(ord(c)<32 or ord(c)>126 for c in o['text']):raise ValueError('Sound text requires 1..24 printable ASCII characters')
  if not vec(o.get('position'),2):raise ValueError('Sound position requires [x,y]')
  if o.get('style','heavy') not in ['heavy','outline']:raise ValueError('Sound style heavy/outline only')
  for k,lo,hi,default in [('size',8,200,64),('angle',-180,180,0),('skew',-40,40,-12),('halo',0,20,5)]:
   if not number(o.get(k,default)) or not lo<=o.get(k,default)<=hi:raise ValueError('Invalid sound '+k)
 elif o.get('kind')=='action_effect':
  subtype=o.get('subtype')
  if not isinstance(subtype,str) or subtype not in TYPES:raise ValueError('Unsupported action effect')
  allowed={'id','kind','subtype','bounds','safe_regions'}
  if subtype!='curvedslash':allowed.add('density')
  if subtype not in ['curvedslash','motiontrail']:allowed.add('seed')
  allowed|=({'points','width'} if subtype in ['curvedslash','motiontrail'] else {'angle'} if subtype=='speed' else {'center','radius'})
  if not rect(o.get('bounds')):raise ValueError('Action bounds must be bounded positive rectangle')
  if type(o.get('seed',0)) is not int or abs(o.get('seed',0))>2**32:raise ValueError('Invalid seed')
  default_density=6 if subtype=='motiontrail' else 24
  if type(o.get('density',default_density)) is not int or not 3<=o.get('density',default_density)<=(12 if subtype=='motiontrail' else 160):raise ValueError('Density must be integer 3..160 (motiontrail: 3..12)')
  regions=o.get('safe_regions',[])
  if not isinstance(regions,list) or len(regions)>16 or not all(rect(r) for r in regions):raise ValueError('safe_regions must contain up to16 rectangles')
  if subtype in ['curvedslash','motiontrail']:
   if not isinstance(o.get('points'),list) or len(o['points'])!=3 or not all(vec(p,2) for p in o['points']):raise ValueError('Curve needs three points: start/control/end')
   if not number(o.get('width',18)) or not 1<=o.get('width',18)<=100:raise ValueError('Width must be 1..100')
  elif subtype=='speed':
   if not number(o.get('angle',0)) or not -180<=o.get('angle',0)<=180:raise ValueError('Invalid speed angle')
  else:
   if not vec(o.get('center'),2):raise ValueError('Contact/focus center required')
   if not number(o.get('radius',70)) or not 1<=o.get('radius',70)<=4096:raise ValueError('Radius must be 1..4096')
 else:raise ValueError('Unsupported action kind')
 if set(o)-allowed:raise ValueError('Unknown or inapplicable action field')
 return o

def render(d,o,camera=None,guides=False):
 validate_object(o)
 if o['kind']=='action_sound':
  x,y=o['position'];s=o.get('size',64);a=o.get('angle',0);sk=o.get('skew',-12)
  d.parts.append(f'<g transform="translate({x} {y}) rotate({a}) skewX({sk})">')
  attrs={'x':0,'y':0,'font-family':'DejaVu Sans,sans-serif','font-weight':900,'font-size':s,'fill':INK if o.get('style','heavy')=='heavy' else 'white','stroke':'white','stroke-width':o.get('halo',5),'paint-order':'stroke','stroke-linejoin':'round'}
  d.emit('text',attrs,html.escape(o['text']),id='halo')
  attrs.update({'stroke':INK,'stroke-width':1.5 if o.get('style','heavy')=='outline' else 0})
  d.emit('text',attrs,html.escape(o['text']),id='letters');d.parts.append('</g>');return
 x,y,w,h=o['bounds'];typ=o['subtype'];r=random.Random(o.get('seed',0));n=o.get('density',6 if typ=='motiontrail' else 24);ident=d.prefix
 d.parts.append('<defs>')
 d.parts.append(f'<clipPath id="{ident}-clip"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath>')
 d.parts.append(f'<mask id="{ident}-mask" maskUnits="userSpaceOnUse" x="{x}" y="{y}" width="{w}" height="{h}"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="white"/>')
 for sx,sy,sw,sh in o.get('safe_regions',[]):d.parts.append(f'<rect x="{sx}" y="{sy}" width="{sw}" height="{sh}" rx="{min(sw,sh)*.12}" fill="black"/>')
 d.parts.append(f'</mask></defs><g clip-path="url(#{ident}-clip)" mask="url(#{ident}-mask)">')
 if typ in ['impactstar','debris','burst']:
  cx,cy=o['center'];rad=o.get('radius',70)
  if typ=='impactstar':
   pts=[]
   for i in range(n*2):
    a=i*math.pi/n;rr=rad*r.uniform(.62,1.2) if i%2==0 else rad*r.uniform(.16,.29);pts.append((cx+math.cos(a)*rr,cy+math.sin(a)*rr))
   d.poly(pts,'white',2.5,'contact-star');d.ellipse(cx,cy,rad*.09,rad*.09,INK,0,'contact-core')
  elif typ=='debris':
   for i in range(n):
    a=r.uniform(0,math.tau);rr=r.uniform(rad*.3,rad);px=cx+math.cos(a)*rr;py=cy+math.sin(a)*rr;s=r.uniform(3,10)
    d.poly([(px,py-s),(px+s,py+s*.4),(px-s*.4,py+s)],INK if i%3==0 else 'white',1.2,'fragment-'+str(i))
    d.line((px-math.cos(a)*s*3,py-math.sin(a)*s*3),(px-math.cos(a)*s*1.5,py-math.sin(a)*s*1.5),.7,id='fragment-trail-'+str(i))
  else:
   for i in range(n):
    a=math.tau*(i+r.uniform(-.2,.2))/n;rr=rad*r.uniform(.85,1.2);far=max(w,h)*2;da=r.uniform(.002,.008)
    d.poly([(cx+rr*math.cos(a),cy+rr*math.sin(a)),(cx+far*math.cos(a-da),cy+far*math.sin(a-da)),(cx+far*math.cos(a+da),cy+far*math.sin(a+da))],INK,0,'focus-'+str(i))
 elif typ=='speed':
  a=math.radians(o.get('angle',0));ux,uy=math.cos(a),math.sin(a);vx,vy=-uy,ux;span=math.hypot(w,h)
  for i in range(n):
   off=(i/(n-1)-.5)*span;cx=x+w/2+off*vx;cy=y+h/2+off*vy;start=-span*r.uniform(.6,1);end=span*r.uniform(.2,1);th=r.uniform(.5,2.5)
   d.poly([(cx+start*ux+th*vx,cy+start*uy+th*vy),(cx+end*ux,cy+end*uy),(cx+start*ux-th*vx,cy+start*uy-th*vy)],INK,0,'speed-'+str(i))
 else:
  p,c,q=o['points'];width=o.get('width',18)
  if typ=='curvedslash':
   # A bowed crescent; both tips converge exactly at the authored endpoints.
   dx,dy=q[0]-p[0],q[1]-p[1];length=max(math.hypot(dx,dy),1);nx,ny=-dy/length,dx/length
   d.path(f'M {p[0]},{p[1]} Q {c[0]},{c[1]} {q[0]},{q[1]} Q {c[0]+nx*width},{c[1]+ny*width} {p[0]},{p[1]} Z','white',2,'slash')
  else:
   for i in range(min(n,12)):
    off=(i-(min(n,12)-1)/2)*width*.25
    d.path(f'M {p[0]},{p[1]+off} Q {c[0]},{c[1]+off} {q[0]},{q[1]+off}',width=max(.5,2-i*.12),id='trail-'+str(i))
 d.parts.append('</g>')
 if guides:
  for i,(sx,sy,sw,sh) in enumerate(o.get('safe_regions',[])):d.path(f'M {sx},{sy} h {sw} v {sh} h {-sw} Z',width=.7,stroke='#7398b5',id='safe-guide-'+str(i))
  if 'center'in o:
   cx,cy=o['center'];d.path(f'M {cx-8},{cy} h16 M {cx},{cy-8} v16',width=1,stroke='#7398b5',id='center-guide')
