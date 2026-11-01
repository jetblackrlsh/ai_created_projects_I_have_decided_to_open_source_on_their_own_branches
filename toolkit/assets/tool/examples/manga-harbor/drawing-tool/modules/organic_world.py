"""Layered organic environments and small spatial clutter; authored geometry.

Natural shapes are bounded construction helpers, not a terrain/anatomy model.
Foliage uses curved camera-facing world-space masses; roots, rocks, containers
and furniture clutter use projected solids. Rain and texture are depth-sorted
surfaces, never a global hidden-line-ignoring overlay pass.
"""
import math,re,hashlib,random
from . import perspective as p
from .fantasy_world import branch,profile
PALETTES={'light':('#f3f3f6','#d5d5df','#b9b9c8'),'mid':('#c7c7d3','#9898ad','#68687d'),'dark':('#75758a','#45455b','#27273a')}
VARIANTS={'tree':{'leafy','bare','fallen'},'grass':{'tuft','fern'},'rock':{'rough'},'water':{'calm','rain','flow','splash','settle'},'cave':{'mouth'},'rubble':{'stones'},'clutter':{'books','jars','crates'}}
DEFAULT={'tree':'leafy','grass':'tuft','rock':'rough','water':'calm','cave':'mouth','rubble':'stones','clutter':'books'}

def validate_object(o):
 if not isinstance(o,dict) or set(o)-{'id','kind','camera','items'}:raise ValueError('Unknown organic world field')
 p.validate_object({'id':'camera','kind':'world','camera':o.get('camera',{}),'items':[]})
 if not isinstance(o.get('items'),list) or len(o['items'])>120:raise ValueError('Organic items must be array, at most 120')
 ids=set()
 for it in o['items']:
  if not isinstance(it,dict) or set(it)-{'id','shape','position','size','tone','variant'}:raise ValueError('Unknown organic item field')
  if not isinstance(it.get('id'),str) or not re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]*',it['id']) or it['id'] in ids:raise ValueError('Invalid/duplicate organic ID')
  ids.add(it['id']);shape=it.get('shape')
  if not isinstance(shape,str) or shape not in VARIANTS:raise ValueError('Unknown organic shape')
  if not isinstance(it.get('variant',DEFAULT[shape]),str) or it.get('variant',DEFAULT[shape]) not in VARIANTS[shape]:raise ValueError('Unsupported shape variant')
  if not isinstance(it.get('tone','mid'),str) or it.get('tone','mid') not in PALETTES:raise ValueError('Unsupported organic tone')
  for key in ['position','size']:
   v=it.get(key)
   if not isinstance(v,list) or len(v)!=3 or not all(type(x) in [int,float] and math.isfinite(x) for x in v):raise ValueError('Organic vectors require three finite numbers')
  if any(not 0<v<=100 for v in it['size']):raise ValueError('Organic size must be positive and at most 100')
 return True

def rng(id):return random.Random(int(hashlib.sha256(id.encode()).hexdigest()[:16],16))

def blob(w,center,rx,ry,id,color):
 _,right,up,_=p.camera_basis(w.camera);pts=[]
 for i in range(32):
  a=2*math.pi*i/32;r=1+.12*math.sin(i*2.3)+.055*math.sin(i*4.1)
  pts.append(p.add(center,p.add(p.mul(right,rx*r*math.cos(a)),p.mul(up,ry*r*math.sin(a)))))
 w.face(pts,color,.8,id+'-foliage')

def rock(w,pos,size,id,col):
 x,y,z=pos;sx,h,sz=size;rr=rng(id);n=9
 bottom=[(x+sx*.5*math.cos(i*math.tau/n),y,z+sz*.5*math.sin(i*math.tau/n)) for i in range(n)]
 rim=[(x+sx*(.35+rr.random()*.13)*math.cos(i*math.tau/n),y+h*(.5+rr.random()*.2),z+sz*(.35+rr.random()*.13)*math.sin(i*math.tau/n)) for i in range(n)]
 top=(x+sx*.08,y+h,z-sz*.06)
 for i in range(n):
  j=(i+1)%n;w.face([rim[i],rim[j],bottom[j],bottom[i]],col[1+i%2],.9,id+'-side-'+str(i),cull=True);w.face([rim[i],rim[j],top],col[i%2],1,id+'-top-'+str(i))

def grass(w,pos,size,id,col,fern=False):
 x,y,z=pos;sx,h,sz=size
 for i in range(9):
  a=i*math.tau/9;tip=(x+sx*.5*math.cos(a),y+h*(.5+.5*math.sin(i*2.4)**2),z+sz*.5*math.sin(a));base=(x,y,z);mid=(x+(tip[0]-x)*.18,y+h*.5,z+(tip[2]-z)*.18)
  w.face([base,p.add(mid,(.035,0,.015)),tip,p.add(mid,(-.035,0,-.015))],col[i%3],.7,id+'-blade-'+str(i))
  if fern:
   for j in range(1,5):
    t=j/5;point=p.add(base,p.mul(p.sub(tip,base),t));spread=sx*.13*(1-t)
    for side in [-1,1]:w.face([point,p.add(point,(side*spread,h*.12,side*spread*.4)),p.add(point,(0,h*.13,0))],col[i%2],.4,f'{id}-leaf-{i}-{j}-{side}')

def tree(w,it):
 x,y,z=it['position'];sx,h,sz=it['size'];id=it['id'];col=PALETTES[it.get('tone','mid')];variant=it.get('variant','leafy')
 if variant=='fallen':
  branch(w,(x-sx*.5,y+h*.35,z),(x+sx*.5,y+h*.55,z+sz*.35),h*.4,h*.27,id+'-log',col)
  for i in range(3):branch(w,(x+sx*(i-1)*.2,y+h*.5,z+sz*.2),(x+sx*(i-1)*.3,y+h*1.2,z-sz*.4),h*.1,.015,id+'-broken-'+str(i),col)
  return
 base=(x,y,z);bend=(x+sx*.09,y+h*.38,z+sz*.09);fork=(x-sx*.06,y+h*.68,z)
 branch(w,base,bend,sx*.12,sx*.09,id+'-trunk-low',col);branch(w,bend,fork,sx*.09,sx*.055,id+'-trunk-high',col)
 for i in range(7):
  a=i*math.tau/7;rootend=(x+sx*.43*math.cos(a),y+.015,z+sz*.43*math.sin(a));mid=(x+sx*.18*math.cos(a),y+h*.05,z+sz*.18*math.sin(a))
  branch(w,base,mid,sx*.065,sx*.045,id+'-root-a-'+str(i),col);branch(w,mid,rootend,sx*.045,.008,id+'-root-b-'+str(i),col)
 for i in range(8):
  a=i*2.4;root=(x,y+h*(.38+i*.035),z);tip=(x+sx*.36*math.cos(a),y+h*(.65+.25*(i%3)/2),z+sz*.4*math.sin(a));elbow=p.add(p.mul(p.add(root,tip),.5),(0,-h*.04,0))
  branch(w,root,elbow,sx*.045,sx*.028,id+'-branch-a-'+str(i),col);branch(w,elbow,tip,sx*.028,.01,id+'-branch-b-'+str(i),col)
  if variant=='leafy':
   blob(w,tip,sx*.27,h*.17,id+'-crown-'+str(i),col[i%2])
   for j in range(3):
    q=p.add(tip,(sx*.14*math.sin(i+j*2),h*.05*math.cos(j),sz*.09*math.cos(i+j)))
    blob(w,q,sx*.115,h*.065,id+f'-leaf-mass-{i}-{j}',col[(i+j)%3])
 if variant=='leafy':blob(w,(x,y+h*.92,z),sx*.27,h*.17,id+'-top',col[0])

def water(w,it):
 x,y,z=it['position'];sx,h,sz=it['size'];id=it['id'];col=PALETTES[it.get('tone','light')]
 pts=[(x+sx*.5*math.cos(i*math.tau/24),y,z+sz*.5*math.sin(i*math.tau/24)) for i in range(24)]
 w.face(pts,col[0],1.3,id+'-pool')
 # Ripples are coplanar ribbons rendered with their ground layer, not overlays.
 for j in range(18):
  a=j*2.4;xx=x+sx*.26*math.sin(a);zz=z+sz*.26*math.cos(a*1.3);r=sx*(.025+.012*(j%3));pts=[]
  for k in range(10):
   t=k*math.pi/10;pts.append((xx+r*math.cos(t),y+.003,zz+r*.35*math.sin(t)))
  w.face(pts+[(xx0,yy,zz0+.06) for xx0,yy,zz0 in reversed(pts)],col[2],0,id+'-ripple-'+str(j),depth=p.camera_point((x,y,z),w.camera)[2]-.01)
 if it.get('variant')=='flow':
  # Stream ribbons bend away from a reserved central obstacle footprint.
  for j in [-3,-2,-1,1,2,3]:
   pts=[]
   for k in range(25):
    zz=z+sz*(k/24-.5)*.92*math.sqrt(1-(j*.16)**2);push=math.exp(-((zz-z)/(sz*.18))**2)*sx*.12*(1 if j>0 else -1)
    xx=x+j*sx*.08+push;pts.append((xx,y+.004,zz))
   w.face(pts+[(xx+.035,yy,zz) for xx,yy,zz in reversed(pts)],col[2],0,id+'-current-'+str(j),depth=p.camera_point((x,y,z),w.camera)[2]-.02)


 if it.get('variant') in ['splash','settle']:
  depth=p.camera_point((x,y,z),w.camera)[2]-.03
  for j in range(3):
   radius=sx*(.09+j*.07);pts=[]
   for k in range(40):
    a=k*math.tau/40;r=radius*(1+.05*math.sin(k*2.1));pts.append((x+r*math.cos(a),y+.005,z+r*math.sin(a)))
   inner=[(x+(xx-x)*.96,yy,z+(zz-z)*.96) for xx,yy,zz in reversed(pts)]
   w.face(pts+inner,col[2],0,id+'-settle-ring-'+str(j),depth=depth)
  if it.get('variant')=='splash':
   for j in range(12):
    a=j*math.tau/12;radius=sx*.09;high=h*(.6+.4*math.sin(j*2.3)**2)
    base=(x+radius*math.cos(a),y+.01,z+radius*math.sin(a))
    crest=(x+radius*1.8*math.cos(a),y+high,z+radius*1.8*math.sin(a))
    side=(x+radius*math.cos(a+.27),y+.01,z+radius*math.sin(a+.27))
    w.face([base,crest,side],col[0],1,id+'-splash-crown-'+str(j),depth=depth-.02)
    # Detached droplets continue the outward direction of the crown.
    q=p.add(crest,(radius*.3*math.cos(a),high*.2,radius*.3*math.sin(a)))
    _,right,up,_=p.camera_basis(w.camera);r=.055*max(.5,h)
    w.face([p.add(q,p.mul(up,r*1.6)),p.add(q,p.mul(right,r)),p.add(q,p.mul(up,-r)),p.add(q,p.mul(right,-r))],col[0],.7,id+'-droplet-'+str(j),depth=depth-.03)

def build_item(w,it):
 shape=it['shape'];x,y,z=it['position'];sx,h,sz=it['size'];id=it['id'];col=PALETTES[it.get('tone','mid')]
 if shape=='tree':tree(w,it)
 elif shape=='grass':grass(w,it['position'],it['size'],id,col,it.get('variant')=='fern')
 elif shape=='rock':rock(w,it['position'],it['size'],id,col)
 elif shape=='water':water(w,it)
 elif shape=='rubble':
  rr=rng(id)
  for i in range(15):rock(w,(x+(rr.random()-.5)*sx,y,z+(rr.random()-.5)*sz),(sx*(.07+rr.random()*.1),h*(.25+rr.random()*.7),sz*(.06+rr.random()*.12)),id+'-fragment-'+str(i),col)
 elif shape=='cave':
  # Uneven enclosing rock arch, with dark facets and a genuinely empty mouth.
  for i in range(15):
   a=i*math.pi/14;pos=(x+sx*.43*math.cos(a),y+h*.3+h*.55*math.sin(a),z+sz*.08*math.sin(i*2))
   rock(w,pos,(sx*.22,h*.3,sz),id+'-roof-'+str(i),col)
  for side in [-1,1]:
   for i in range(3):rock(w,(x+side*sx*.46,y+i*h*.16,z),(sx*.24,h*.25,sz),id+f'-wall-{side}-{i}',col)
 elif shape=='clutter':
  variant=it.get('variant','books')
  if variant=='crates':
   for i in range(3):
    pos=(x+sx*(i%2)*.42,y+h*(i//2)*.55,z+sz*(i%2)*.17);size=(sx*.45,h*.5,sz*.8)
    w.box(pos,size,id+'-crate-'+str(i),col[0]);px,py,pz=pos
    for j in range(3):w.box((px,py+size[1]*(j+.15)/3,pz-.018),(size[0],size[1]*.09,.02),id+f'-slat-{i}-{j}',col[2])
  elif variant=='jars':
   for i in range(4):
    profile(w,(x+sx*(i/4-.35),y,z+sz*.2*math.sin(i)),sx*.12,sz*.2,h*(.65+.1*(i%3)),[(0,.65),(.15,1),(.65,.9),(.83,.45),(1,.45)],id+'-jar-'+str(i),col,14)
  else:
   for i in range(8):
    w.box((x+sx*.07*math.sin(i),y+i*h/8,z+sz*.04*math.cos(i)),(sx*.85,h*.105,sz*.85),id+'-book-'+str(i),col[i%3])

def curved_polygon(d,pts,fill,width,id):
 mid=lambda a,b:((a[0]+b[0])/2,(a[1]+b[1])/2)
 start=mid(pts[-1],pts[0]);path=f'M {start[0]:.3f},{start[1]:.3f}'
 for i,q in enumerate(pts):
  end=mid(q,pts[(i+1)%len(pts)]);path+=f' Q {q[0]:.3f},{q[1]:.3f} {end[0]:.3f},{end[1]:.3f}'
 d.path(path+' Z',fill,width,id)

def draw(w,d):
 faces=[]
 for pts,fill,width,id,override in w.surfaces:
  pts=p.clip_near(pts,w.camera)
  if len(pts)<3:continue
  depth=override if override is not None else sum(p.camera_point(q,w.camera)[2] for q in pts)/len(pts)
  faces.append((depth,[p.project(q,w.camera) for q in pts],fill,width,id))
 for _,pts,fill,width,id in sorted(faces,key=lambda x:-x[0]):
  if id.endswith('-foliage') or '-splash-crown-' in id or '-droplet-' in id:curved_polygon(d,pts,fill,width,id)
  else:d.poly(pts,fill,width,id)

def render(d,o,camera=None,guides=False):
 validate_object(o);c=o.get('camera',{});ground=p.World(c);w=p.World(c)
 for it in o['items']:
  build_item(ground if it['shape']=='water' else w,it)
  if it['shape']=='water' and it.get('variant')=='rain':
   rr=rng(it['id']);x,y,z=it['position'];sx,h,sz=it['size']
   for i in range(90):
    a=(x+(rr.random()-.5)*sx,y+rr.random()*h,z+(rr.random()-.5)*sz);b=p.add(a,(-.08,-.32,0));w.face([a,b,p.add(b,(.035,0,0))],'#73738b',0,it['id']+'-rain-'+str(i))
 draw(ground,d);draw(w,d)
 if guides:
  for it in o['items']:
   q=p.project(it['position'],c);d.ellipse(*q,3,3,'#74a0c7',0,it['id']+'-anchor')

def self_test():
 base={'id':'w','kind':'organic_world','items':[{'id':'t','shape':'tree','position':[0,0,0],'size':[3,6,3]}]}
 validate_object(base)
 for mutation in [{'size':[0,1,1]},{'position':[True,0,0]},{'variant':'ignored'},{'tone':'red'},{'shape':'unknown'}]:
  it=dict(base['items'][0]);it.update(mutation)
  try:validate_object(dict(base,items=[it]))
  except ValueError:pass
  else:raise AssertionError(mutation)
 for shape in VARIANTS:
  for variant in VARIANTS[shape]:
   w=p.World({});build_item(w,dict(base['items'][0],shape=shape,variant=variant));assert w.surfaces and not w.lines
 return {'status':'passed','checks':6+sum(len(v) for v in VARIANTS.values())}
