"""Original cloth-plane constructions. Geometric fold studies, not cloth physics."""
import math
KINDS={'cloth'}
MODES={'bend','twist','pipe','single','double'}
def validate_object(o):
 allowed={'id','kind','mode','position','size','variation','tone'}
 if set(o)-allowed:raise ValueError('Unknown cloth field')
 if not isinstance(o.get('mode'),str) or o['mode'] not in MODES:raise ValueError('Unknown cloth mode')
 for k in ['position','size']:
  if not isinstance(o.get(k),list) or len(o[k])!=2 or any(type(v) not in (int,float) or not math.isfinite(v) for v in o[k]):raise ValueError('Cloth position/size need finite pairs')
 if any(v<=0 or v>2000 for v in o['size']):raise ValueError('Cloth size must be 0..2000')
 if type(o.get('variation',0)) is not int or not 0<=o.get('variation',0)<=5:raise ValueError('Cloth variation must be integer0..5')
 if o.get('tone','gray') not in ['ink','gray']:raise ValueError('Cloth tone ink/gray')
 return o

def render(d,o,camera=None,guides=False):
 validate_object(o);x,y=o['position'];w,h=o['size'];v=o.get('variation',0);mode=o['mode'];gray=o.get('tone','gray')=='gray'
 d.parts.append(f'<g transform="translate({x} {y})">')
 if mode in ['bend','twist']:
  upper=[];lower=[];center=[]
  for i in range(81):
   t=i/80;cx=t*w;cy=h*.5+math.sin(t*math.pi*(1+.16*v))*(.13+.025*v)*h*((-1)**v)
   ang=(t*(.9+.12*v)*math.pi+v*.18) if mode=='twist' else (.2+v*.15+t*.35)
   off=h*.19*math.cos(ang);upper.append((cx,cy-off));lower.append((cx,cy+off));center.append((cx,cy))
  start=0;group=0
  for i in range(1,81):
   side=upper[i-1][1]>lower[i-1][1]
   if i==80 or side!=(upper[i][1]>lower[i][1]):
    fill=('#b8b8c9' if side else '#f4f3f8') if gray else 'white'
    d.poly(upper[start:i+1]+list(reversed(lower[start:i+1])),fill,0,id=f'plane-section-{group}')
    start=i;group+=1
  for name,pts in [('edge-top',upper),('edge-bottom',lower)]:d.path('M '+' L '.join(f'{a},{b}' for a,b in pts),width=1.8,id=name)
  d.line(upper[0],lower[0],1.8,id='start-edge');d.line(upper[-1],lower[-1],1.8,id='end-edge')
  if guides:d.path('M '+' L '.join(f'{a},{b}' for a,b in center),width=.8,stroke='#5f9fc8',id='axis')
 else:
  n=5+(v%2);spread={'pipe':.35+.035*v,'single':0,'double':.85}[mode]
  topy=h*.12;bottom=h*.88
  def top(i):return w/2+(i/n-.5)*w*spread
  def bot(i):return w*.05+i/n*w*.9
  def by(i):return bottom+(math.cos(i*math.pi)*.05+.02*math.sin(i+v))*h
  for i in range(n):
   a,b=top(i),top(i+1);c,e=bot(i),bot(i+1);ya,yb=by(i),by(i+1)
   sway=(v-2.5)*w*.025
   path=f'M {a},{topy} C {a+sway},{h*.38} {c-w*.06},{h*.65} {c},{ya} Q {(c+e)/2},{max(ya,yb)+h*.065} {e},{yb} C {e+w*.06},{h*.65} {b+sway},{h*.38} {b},{topy} Z'
   fill=('#e3e2ee' if i%2==0 else '#aaaabd') if gray else 'white'
   d.path(path,fill,1.5,id=f'fold-{i}')
  if mode=='double':
   d.path(f'M {top(0)},{topy} Q {w/2},{h*.4} {top(n)},{topy}',width=2,id='suspended-catenary')
   anchors=[(top(0),topy),(top(n),topy)]
  elif mode=='single':anchors=[(w/2,topy)]
  else:anchors=[(top(0),topy),(top(n),topy)]
  for i,(ax,ay) in enumerate(anchors):d.ellipse(ax,ay,3,3,'#202029',0,id=f'anchor-{i}')
  if guides:
   for i in range(n+1):d.line((top(i),topy),(bot(i),by(i)),.6,'#5f9fc8',f'tension-{i}')
 d.parts.append('</g>')
