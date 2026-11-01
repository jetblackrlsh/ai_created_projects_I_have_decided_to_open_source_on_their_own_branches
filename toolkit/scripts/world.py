"""Original editable perspective constructions. Right handed y-up world; painter SVG renderer."""
import math,html,json
from dataclasses import dataclass

def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def norm(a):
 l=math.sqrt(dot(a,a));return tuple(x/l for x in a)
@dataclass
class Camera:
 eye:tuple=(12,9,17)
 target:tuple=(0,2,0)
 width:float=800
 height:float=500
 fov:float=55
 def __post_init__(self):
  self.forward=norm(sub(self.target,self.eye));self.right=norm(cross(self.forward,(0,1,0)));self.up=cross(self.right,self.forward);self.focal=self.height/2/math.tan(math.radians(self.fov/2))
 def project(self,p):
  v=sub(p,self.eye);z=dot(v,self.forward)
  if z<=.01:raise ValueError('Point behind camera; choose a wider stage or farther camera')
  return (self.width/2+self.focal*dot(v,self.right)/z,self.height/2-self.focal*dot(v,self.up)/z,z)
 def vanishing(self,d):
  z=dot(d,self.forward)
  return None if abs(z)<1e-9 else (self.width/2+self.focal*dot(d,self.right)/z,self.height/2-self.focal*dot(d,self.up)/z)

def box(id,center,size,fill='#d5d4c9',yaw=0):
 x,y,z=center;w,h,d=size;a=math.radians(yaw);c,s=math.cos(a),math.sin(a)
 ps=[(x+xx*c-zz*s,y+yy,z+xx*s+zz*c)for xx,yy,zz in [(-w/2,-h/2,-d/2),(w/2,-h/2,-d/2),(w/2,h/2,-d/2),(-w/2,h/2,-d/2),(-w/2,-h/2,d/2),(w/2,-h/2,d/2),(w/2,h/2,d/2),(-w/2,h/2,d/2)]]
 return [{'id':id+'-'+str(i),'points':[ps[k]for k in f],'fill':fill}for i,f in enumerate([(0,3,2,1),(4,5,6,7),(0,4,7,3),(1,2,6,5),(3,7,6,2),(0,1,5,4)])]
def cylinder(id,center,radius,height,fill='#d2b98a',axis='y',segments=24):
 x,y,z=center; rings=[]
 for end in [-height/2,height/2]:
  ring=[]
  for i in range(segments):
   a=2*math.pi*i/segments;u,v=radius*math.cos(a),radius*math.sin(a)
   ring.append((x+u,y+end,z+v) if axis=='y' else (x+end,y+u,z+v) if axis=='x' else (x+u,y+v,z+end))
  rings.append(ring)
 faces=[{'id':id+'-cap-a','points':rings[0],'fill':fill},{'id':id+'-cap-b','points':list(reversed(rings[1])),'fill':fill}]
 for i in range(segments):
  j=(i+1)%segments;faces.append({'id':id+'-side-'+str(i),'points':[rings[0][i],rings[1][i],rings[1][j],rings[0][j]],'fill':fill,'stroke':'none'})
 if axis!='y':
  for f in faces:f['points'].reverse()
 return faces

def sphere(id,center,radius,fill='#ddbd80',segments=24):
 x,y,z=center;faces=[]
 def p(a,b):return(x+radius*math.cos(a)*math.cos(b),y+radius*math.sin(a),z+radius*math.cos(a)*math.sin(b))
 for j in range(12):
  a=-math.pi/2+j*math.pi/12;b=a+math.pi/12
  for i in range(segments):
   u=i*2*math.pi/segments;v=(i+1)*2*math.pi/segments
   faces.append({'id':f'{id}-{j}-{i}','points':[p(a,u),p(b,u),p(b,v),p(a,v)],'fill':fill,'stroke':'none'})
 return faces

def shade(color,n):
 if not color.startswith('#') or len(color)!=7:return color
 light=norm((-2,4,3));factor=.60+.4*max(0,dot(n,light))
 return '#'+''.join(f'{round(int(color[i:i+2],16)*factor):02x}'for i in (1,3,5))
def render_faces(faces,camera,guides=False):
 result=[]
 for f in faces:
  ps=f['points'];normal=cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]));length=math.sqrt(dot(normal,normal))
  if length<1e-10:
   normal=cross(sub(ps[2],ps[0]),sub(ps[3],ps[0]));length=math.sqrt(dot(normal,normal))
   if length<1e-10:continue
  normal=norm(normal)
  if not f.get('double') and dot(normal,sub(camera.eye,ps[0]))<=0:continue
  points=[camera.project(p)for p in ps];depth=sum(p[2]for p in points)/len(points)
  if any(k in f['id'] for k in ['stone-floor','car-floor','station-platform','floor-joint']):depth+=10000
  coords=' '.join(f'{p[0]:.2f},{p[1]:.2f}'for p in points)
  result.append((depth,f'<polygon id="{html.escape(f["id"])}" points="{coords}" fill="{shade(f.get("fill","#ddd8ce"),normal)}" stroke="{(shade(f.get('fill','#ddd8ce'),normal) if f.get('stroke')=='none' else f.get('stroke','#161c28'))}" stroke-width="1.15" stroke-linejoin="round"/>'))
 return ''.join(x[1]for x in sorted(result,key=lambda x:-x[0]))

def line3(id,a,b,camera,color='#647f90',width=1,dash=''):
 a,b=camera.project(a),camera.project(b)
 return f'<path id="{id}" d="M{a[0]:.2f},{a[1]:.2f} L{b[0]:.2f},{b[1]:.2f}" fill="none" stroke="{color}" stroke-width="{width}" stroke-dasharray="{dash}"/>'

def stage_objects(scene):
 faces=[]
 def B(id,c,s,f='#e0dacb',yaw=0):faces.extend(box(id,c,s,f,yaw))
 def C(id,c,r,h,f='#d3af70',axis='y'):faces.extend(cylinder(id,c,r,h,f,axis))
 if scene in ('street','stairs','transit'):
  B('road',(0,-.15,0),(15,.3,32),'#a5a7ae');B('walk-left',(-7.7,.1,0),(3.2,.3,32));B('walk-right',(7.7,.1,0),(3.2,.3,32))
  for side in [-1,1]:
   for k,z in enumerate([-12,-5,3,11]):
    h=[6,10,8,12][k];x=side*10
    B(f'building-{side}-{k}',(x,h/2,z),(6,h,5),'#b8c8d0')
    B(f'cornice-{side}-{k}',(x,h,z),(6.3,.3,5.3),'#e7dfcf')
    # Facade windows are actual shallow boxes, consistently projected.
    for row in range(1,int(h/2)):
     for col in [-1.4,1.4]:B(f'window-{side}-{k}-{row}-{col}',(x+col,row*2,z+2.55),(1.1,1.25,.05),'#343f58')
  for z in [-9,0,9]:
   C(f'lamppost-{z}',(-5.5,2.2,z),.09,4.4,'#485360');C(f'lantern-{z}',(-5.5,4.5,z),.27,.55,'#f4d293')
  if scene=='stairs':
   for i in range(9):B(f'step-{i}',(0,(i+1)*.21,3-i*.65),(4,(i+1)*.42,.65),'#aeb4be')
   for side in [-1,1]:
    for i in [0,3,6,8]:C(f'rail-post-{side}-{i}',(side*2.15,(i+1)*.42+.6,3-i*.65),.06,1.2,'#455362')
  if scene=='transit':
   B('train-body',(0,1.5,0),(4.8,2.6,13),'#a8bfc6');B('train-roof',(0,2.9,0),(4.6,.3,12.8),'#4b6471')
   for z in [-4,-1,2,5]:B(f'train-window-{z}',(2.43,1.9,z),(.06,.9,1.8),'#263847')
   for x in [-2.5,2.5]:
    for z in [-4,4]:C(f'train-wheel-{x}-{z}',(x,.5,z),.48,.25,'#303640','x')
 elif scene=='interior':
  B('floor',(0,-.15,0),(12,.3,12),'#c3bdb1');B('back-wall',(0,3,-6),(12,6,.2),'#c0ced2');B('side-wall',(-6,3,0),(.2,6,12),'#9aaeb8')
  B('window',(-2.5,3.7,-5.85),(3.5,2.8,.1),'#e5eef2')
  for x in [-4.25,-2.5,-.75]:B(f'window-bar-{x}',(x,3.7,-5.75),(.08,2.8,.12),'#425563')
  B('desk-top',(1.5,2,0),(5,.2,2.8),'#b5875d')
  for x in [-.6,3.6]:
   for z in [-1,1]:B(f'desk-leg-{x}-{z}',(x,1,z),(.15,2,.15),'#403b3a')
  B('chair-seat',(1.5,1.1,2.5),(1.5,.18,1.5),'#68768a',25);B('chair-back',(1.8,2.1,3.1),(1.5,2,.15),'#68768a',25)
  for x,z in [(1,2),(2,2),(1,3),(2,3)]:B(f'chair-leg-{x}-{z}',(x,.5,z),(.1,1,.1),'#39434d')
  B('bookcase',(4.8,2.6,-4.8),(2,5.2,1),'#b99f7f')
  for y in [1,2,3,4]:B(f'shelf-{y}',(4.8,y,-4.2),(1.85,.12,.15),'#263544')
  C('lamp-pedestal',(0,2.2,0),.3,.12);C('lamp-stem',(0,2.8,0),.05,1);C('lamp-shade',(0,3.4,0),.5,.5,'#f1d196')
 return faces

def story_objects(scene):
 faces=[]
 def B(id,c,s,f='#aaa9a2',yaw=0):faces.extend(box(id,c,s,f,yaw))
 def C(id,c,r,h,f='#9b8c75',axis='y'):faces.extend(cylinder(id,c,r,h,f,axis))
 def P(id,points,fill):faces.append({'id':id,'points':points,'fill':fill,'double':True})
 if scene=='subwayinterior':
  B('car-floor',(0,-.1,0),(6,.2,22),'#9babb0');B('ceiling',(0,4.7,0),(6,.15,22),'#d0d5ca')
  for side in [-1,1]:
   B(f'wall-{side}',(side*3,2.3,0),(.15,4.6,22),'#b3c6c8')
   for k,z in enumerate([-7,-2,3,8]):
    B(f'window-{side}-{k}',(side*2.9,2.8,z),(.08,1.4,3.1),'#293e58')
    B(f'bench-seat-{side}-{k}',(side*2.3,1,z),(1.2,.22,3.5),'#526f80');B(f'bench-back-{side}-{k}',(side*2.85,1.7,z),(.15,1.35,3.5),'#526f80')
    for zz in [z-1.3,z+1.3]:B(f'bench-leg-{side}-{k}-{zz}',(side*2.3,.5,zz),(.1,1,.12),'#5e646b')
   B(f'ceiling-light-{side}',(side*1.3,4.58,0),(.22,.08,20),'#efe8bf')
  for k,z in enumerate([-7,-1,5]):C(f'pole-{k}',(.7,2.3,z),.055,4.6,'#d0c6ad')
  # Open end doorway reveals a differently scaled tiled station.
  B('door-frame-left',(-2,2.3,-10.8),(2,4.6,.25),'#8c9da5');B('door-frame-right',(2,2.3,-10.8),(2,4.6,.25),'#8c9da5');B('door-lintel',(0,4.2,-10.8),(2, .8,.25),'#8c9da5')
  B('station-platform',(0,-.05,-16),(13,.2,10),'#b9b7a6');B('station-backwall',(0,3,-20),(13,6,.2),'#cbbf9f')
  for x in range(-6,7):B(f'station-tile-x{x}',(x,3,-19.85),(.035,5.7,.025),'#7e8991')
  for y in range(1,6):B(f'station-tile-y{y}',(0,y,-19.85),(12,.035,.025),'#7e8991')
  B('station-sign',(0,4.1,-19.7),(5,.6,.08),'#233b52')
  for z in range(-9,11,2):B(f'floor-seam-{z}',(0,.015,z),(5.8,.015,.025),'#566876')
 elif scene=='sanctuary':
  B('stone-floor',(0,-.1,0),(16,.2,20),'#88899a')
  for x in range(-8,9,2):B(f'floor-joint-x{x}',(x,.015,0),(.035,.02,19.8),'#444c60')
  for z in range(-9,10,2):B(f'floor-joint-z{z}',(0,.015,z),(15.8,.02,.035),'#444c60')
  for z in [-7,-1,5]:
   for side in [-1,1]:
    B(f'column-{side}-{z}',(side*5,2.5,z),(.9,5,.9),'#a8a2a1');B(f'column-base-{side}-{z}',(side*5,.3,z),(1.25,.6,1.25),'#b4aaa3')
   # voussoir segments form real arch, each independent editable stone.
   for k in range(12):
    a=k*math.pi/12;b=(k+1)*math.pi/12;inner=4.6;outer=5.4
    q=[(inner*math.cos(a),4.7+inner*math.sin(a),z),(inner*math.cos(b),4.7+inner*math.sin(b),z),(outer*math.cos(b),4.7+outer*math.sin(b),z),(outer*math.cos(a),4.7+outer*math.sin(a),z)]
    front=[(x,y,zz+.45)for x,y,zz in q];back=[(x,y,zz-.45)for x,y,zz in q]
    P(f'arch-{z}-{k}-front',front,'#aaa5a0');P(f'arch-{z}-{k}-back',back,'#9a9594')
    for i in range(4):P(f'arch-{z}-{k}-edge{i}',[front[i],front[(i+1)%4],back[(i+1)%4],back[i]],'#8a8890')
  C('artifact-dais',(0,.45,-4),2.6,.9,'#a39e9a');C('artifact-plinth',(0,1.35,-4),1.15,.9,'#c1b298');C('artifact-table',(0,1.9,-4),1.45,.2,'#d3c096')
  for i in range(5):B(f'stair-{i}',(0,(i+1)*.12,-.8-i*.45),(3.2,(i+1)*.24,.45),'#aaa4a0')
  for side in [-1,1]:C(f'brazier-base-{side}',(side*3,1.1,-4),.12,2.2,'#6f6b75');C(f'brazier-bowl-{side}',(side*3,2.3,-4),.5,.35,'#d5b374');faces.extend(sphere(f'brazier-flame-{side}',(side*3,2.8,-4),.35,'#ffe0a0'))
 elif scene=='market':
  faces=stage_objects('street')
  for side in [-1,1]:
   x=side*3.8;z=5 if side<0 else 0
   B(f'stall-counter-{side}',(x,.9,z),(2.7,1.8,2.7),'#977756')
   for xx in [x-1.25,x+1.25]:
    for zz in [z-1.2,z+1.2]:B(f'stall-post-{side}-{xx}-{zz}',(xx,1.9,zz),(.1,3.8,.1),'#665c50')
   for i in range(8):
    xx=x-1.6+i*.4;P(f'awning-{side}-{i}',[(xx,3.1,z+1.6),(xx+.4,3.1,z+1.6),(xx+.4,3.85,z-1.5),(xx,3.85,z-1.5)],'#b45e4e'if i%2 else '#e2cba2')
    P(f'awning-fringe-{side}-{i}',[(xx,3.1,z+1.6),(xx+.4,3.1,z+1.6),(xx+.4,2.8,z+1.6),(xx,2.8,z+1.6)],'#b45e4e'if i%2 else '#e2cba2')
   B(f'shop-sign-{side}',(x,2.35,z+1.4),(1.8,.55,.08),'#344b60')
   for k in range(5):faces.extend(sphere(f'produce-{side}-{k}',(x-1+k*.5,1.98,z+.5),.18,'#d49846'))
  B('cart-tray',(0,1.05,5),(1.8,.3,2.5),'#a17b55')
  for x in [-1,1]:
   for z in [4.2,5.8]:C(f'cart-wheel-{x}-{z}',(x,.55,z),.5,.15,'#48505a','x')
  for x in [-.7,0,.7]:C(f'pumpkin-{x}',(x,1.45,5),.3,.5,'#d89b4a')
 elif scene=='skyline':
  for i,(x,z,h) in enumerate([(-8,-6,14),(-3,-8,19),(3,-9,13),(8,-5,17),(-7,3,10),(0,1,9),(7,3,12)]):
   B(f'tower-{i}',(x,h/2,z),(4,h,4),'#8fa4b8');B(f'roof-{i}',(x,h,z),(4.3,.3,4.3),'#bac1bd')
   for row in range(1,h):
    for dx in [-1.15,0,1.15]:B(f'window-{i}-{row}-{dx}',(x+dx,row,z+2.03),(.55,.6,.04),'#e1c183')
   B(f'roof-hut-{i}',(x,h+.7,z),(1.7,1.4,1.7),'#667d91')
   C(f'antenna-{i}',(x,h+2,z),.035,2.5,'#344958')
 return faces

def render_world(o):
 id=o.get('id','world');w=o.get('width',800);h=o.get('height',500);cfg=o.get('camera',{});scene=o.get('scene','street')
 defaults={'street':((4,6,26),(0,3,0)),'interior':((14,10,18),(0,2,0)),'stairs':((5,7,26),(0,2,0)),'transit':((5,7,26),(0,2,0))}
 defaults.update({'subwayinterior':((.3,2.5,14),(0,2,-5)),'sanctuary':((7,6,13),(0,3,-3)),'market':((3,5.5,19),(0,2.2,2)),'skyline':((20,25,27),(0,8,0))})
 eye,target=defaults.get(scene,defaults['street']);cam=Camera(tuple(cfg.get('eye',eye)),tuple(cfg.get('target',target)),w,h,cfg.get('fov',38 if scene=='interior' else 55))
 faces=[dict(f,id=id+'-'+f['id']) for f in o.get('faces',story_objects(scene) if scene in {'subwayinterior','sanctuary','market','skyline'} else stage_objects(scene))]
 if o.get('palette')=='night':
  for f in faces:
   name=f['id'];f['fill']='#e6c682' if any(k in name for k in ['window','light','flame']) else '#738097' if any(k in name for k in ['floor','road','roof']) else '#53687d' if any(k in name for k in ['wall','building','tower','column','arch']) else f.get('fill','#a4aab1')
 art=render_faces(faces,cam)
 if o.get('guides'):
  for i in range(-6,7):art+=line3(f'{id}-grid-x-{i}',(-6,0,i),(6,0,i),cam,'#5e8f9c',.6)+line3(f'{id}-grid-z-{i}',(i,0,-6),(i,0,6),cam,'#5e8f9c',.6)
 return f'<g id="{id}" transform="translate({o.get("x",0)} {o.get("y",0)})"><defs><clipPath id="{id}-clip"><rect width="{w}" height="{h}"/></clipPath></defs><g clip-path="url(#{id}-clip)"><rect width="{w}" height="{h}" fill="{o.get("background","#202d46" if o.get('palette')=='night' else "#eef0eb")}"/>{art}</g></g>'
