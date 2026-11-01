"""Original camera-space perspective drawing helpers. Standard library only.

No source artwork is embedded. Lessons informed the shared horizon/vanishing
point construction; actual geometry and camera mathematics are authored here.
"""
import math,re
INK='#202029'

def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def add(a,b):return tuple(x+y for x,y in zip(a,b))
def mul(a,k):return tuple(x*k for x in a)
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def unit(a):
 n=math.sqrt(dot(a,a))
 if n<1e-9:raise ValueError('Degenerate camera direction')
 return mul(a,1/n)

def camera_basis(c):
 target=c.get('target',[0,2,0])
 if 'position' in c:eye=c['position']
 else:
  yaw=math.radians(c.get('yaw',35));pitch=math.radians(c.get('pitch',0));distance=c.get('distance',18)
  eye=add(target,(distance*math.sin(yaw)*math.cos(pitch),distance*math.sin(pitch),-distance*math.cos(yaw)*math.cos(pitch)))
 f=unit(sub(target,eye));r=unit(cross(f,(0,1,0)));u=cross(r,f)
 return eye,r,u,f

def camera_point(p,c):
 eye,r,u,f=camera_basis(c);v=sub(p,eye)
 return dot(v,r),dot(v,u),dot(v,f)

def project(p,c):
 x,y,z=camera_point(p,c)
 if z<=c.get('near',.1):raise ValueError('Geometry is behind or on camera near plane')
 f=c.get('focal',850);cx,cy=c.get('center',[600,450]);q=(cx+f*x/z,cy-f*y/z)
 if any(abs(v)>1e7 or not math.isfinite(v) for v in q):raise ValueError('Projection outside safe numeric bounds')
 return q

def vanishing_point(axis,c):
 _,r,u,f=camera_basis(c);z=dot(axis,f)
 if abs(z)<1e-9:return None # parallel image-plane lines remain parallel
 focal=c.get('focal',850);cx,cy=c.get('center',[600,450])
 return cx+focal*dot(axis,r)/z,cy-focal*dot(axis,u)/z

def clip_near(pts,c):
 """Clip a world-space convex polygon against the camera near plane."""
 near=c.get('near',.1)*1.000001
 out=[]
 for a,b in zip(pts,pts[1:]+pts[:1]):
  za=camera_point(a,c)[2];zb=camera_point(b,c)[2]
  inside_a=za>=near;inside_b=zb>=near
  if inside_a:out.append(a)
  if inside_a!=inside_b:
   t=(near-za)/(zb-za);out.append(add(a,mul(sub(b,a),t)))
 return out

class World:
 def __init__(self,c):self.camera=c;self.surfaces=[];self.lines=[]
 def face(self,pts,fill='white',width=1.4,id='face',cull=False,depth=None):
  if cull:
   n=cross(sub(pts[1],pts[0]),sub(pts[2],pts[0]));center=tuple(sum(p[i] for p in pts)/len(pts) for i in range(3))
   if dot(n,sub(camera_basis(self.camera)[0],center))<=0:return
  self.surfaces.append((pts,fill,width,id,depth))
 def line(self,a,b,width=1,color=INK,id='line'):self.lines.append((a,b,width,color,id))
 def box(self,p,size,id,fill='white',details=None):
  x,y,z=p;w,h,dep=size
  # Face vertices ordered outwards. Frontal is -Z; all six are valid.
  faces=[([(x,y,z),(x,y+h,z),(x+w,y+h,z),(x+w,y,z)],(0,0,-1),'front',fill),
         ([(x+w,y,z),(x+w,y+h,z),(x+w,y+h,z+dep),(x+w,y,z+dep)],(1,0,0),'right','#e4e4eb'),
         ([(x,y,z+dep),(x+w,y,z+dep),(x+w,y+h,z+dep),(x,y+h,z+dep)],(0,0,1),'back','#dedee7'),
         ([(x,y,z),(x,y,z+dep),(x,y+h,z+dep),(x,y+h,z)],(-1,0,0),'left','url(#tone)'),
         ([(x,y+h,z),(x,y+h,z+dep),(x+w,y+h,z+dep),(x+w,y+h,z)],(0,1,0),'top','white'),
         ([(x,y,z),(x+w,y,z),(x+w,y,z+dep),(x,y,z+dep)],(0,-1,0),'bottom','#a6a6b4')]
  eye=camera_basis(self.camera)[0]
  for pts,n,name,shade in faces:
   center=tuple(sum(a[i] for a in pts)/4 for i in range(3))
   if dot(n,sub(eye,center))<=0:continue
   surface_depth=camera_point(center,self.camera)[2]
   self.face(pts,shade,0 if 'grid' in id else 1.6,id+'-'+name,depth=surface_depth)
   if details and name in ['front','back','right','left']:
    # Inset facade details remain coplanar but shifted outward slightly to avoid
    # painter-depth ties. Their four vertices share the same projective camera.
    cols,rows=details
    origin=pts[0];up=sub(pts[1],pts[0]);right=sub(pts[3],pts[0])
    if name in ['back','left']:origin=pts[0];right=sub(pts[1],pts[0]);up=sub(pts[3],pts[0])
    for rr in range(rows):
     for cc in range(cols):
      # Rows from bottom, generous margins reveal wall surface.
      xx=(cc+.22)/cols;yy=(rr+.2)/rows;ww=.55/cols;hh=.58/rows
      p0=add(add(add(origin,mul(right,xx)),mul(up,yy)),mul(n,.008))
      quad=[p0,add(p0,mul(up,hh)),add(add(p0,mul(up,hh)),mul(right,ww)),add(p0,mul(right,ww))]
      self.face(quad,'#fafafd',.8,f'{id}-{name}-window-{rr}-{cc}',depth=surface_depth)
      # One dark transom stripe per window, actual plane geometry.
      mid=add(p0,mul(up,hh*.56));bar=[mid,add(mid,mul(up,hh*.055)),add(add(mid,mul(up,hh*.055)),mul(right,ww)),add(mid,mul(right,ww))]
      self.face([add(a,mul(n,.002)) for a in bar],INK,0,f'{id}-{name}-transom-{rr}-{cc}',depth=surface_depth)
 def draw(self,d,guides=False):
  c=self.camera
  # Individual face sort handles furniture better than sorting whole objects.
  valid=[]
  for pts,fill,width,id,depth_override in self.surfaces:
   clipped=clip_near(pts,c)
   if len(clipped)<3:continue
   screen=[project(p,c) for p in clipped]
   depth=depth_override if depth_override is not None else sum(camera_point(p,c)[2] for p in pts)/len(pts)
   valid.append((depth,id,screen,fill,width))
  for _,id,screen,fill,width in sorted(valid,key=lambda q:-q[0]):d.poly(screen,fill,width,id=id)
  for a,b,width,color,id in self.lines:
   try:d.line(project(a,c),project(b,c),width,color,id=id)
   except ValueError:continue
  if guides:
   # Long projected world-axis guide segments; no assumption that VPs lie inside canvas.
   for j,axis in enumerate([(1,0,0),(0,1,0),(0,0,1)]):
    vp=vanishing_point(axis,c)
    if vp is not None and all(abs(v)<5000 for v in vp):
     for i,p in enumerate([(0,0,0),(0,3,0),(2,0,2)]):
      try:d.line(project(p,c),vp,.7,'#73a6d4',id=f'guide-{j}-{i}')
      except ValueError:pass
     d.ellipse(*vp,4,4,'#73a6d4',0,id=f'vp-{j}')

def build_item(w,o):
 p=o.get('position',[0,0,0]);s=o.get('size',[2,2,2]);x,y,z=p;dx,dy,dz=s;k=o['shape'];id=o['id'];fill=o.get('fill','white')
 if k=='box':w.box(p,s,id,fill)
 elif k=='building':
  w.box(p,s,id,fill,(o.get('columns',3),o.get('rows',4)))
  w.box((x-.12,y+dy,z-.12),(dx+.24,.18,dz+.24),id+'-cornice',INK)
  w.box((x-.08,y+.15,z-.08),(dx+.16,.18,dz+.16),id+'-base',INK)
 elif k=='stairs':
  n=o.get('steps',7)
  for i in range(n):w.box((x,y,z+i*dz/n),(dx,dy*(i+1)/n,dz/n),id+'-step-'+str(i),fill)
  # Thin posts/handrail are explicit cuboids, not screen-space diagonals.
  for side in [0,1]:
   xx=x+.08 if side==0 else x+dx-.15
   for i in [0,n//2,n-1]:w.box((xx,y+dy*(i+1)/n,z+i*dz/n),(.06,.75,.06),f'{id}-railpost-{side}-{i}',INK)
 elif k=='table':
  w.box((x,y+dy-.13,z),(dx,.13,dz),id+'-top',fill)
  for i,xx in enumerate([x+.08,x+dx-.2]):
   for j,zz in enumerate([z+.08,z+dz-.2]):w.box((xx,y,zz),(.12,dy-.13,.12),f'{id}-leg-{i}-{j}',fill)
 elif k=='chair':
  for i,xx in enumerate([x,x+dx-.12]):
   for j,zz in enumerate([z,z+dz-.12]):w.box((xx,y,zz),(.12,dy*.46,.12),f'{id}-leg-{i}-{j}',fill)
  w.box((x,y+dy*.45,z),(dx,.12,dz),id+'-seat','url(#tone)')
  w.box((x,y+dy*.5,z+dz-.1),(dx,dy*.5,.1),id+'-back',fill)
 elif k=='shelf':
  w.box(p,(dx,dy,dz),id+'-back','url(#tone)')
  rows=o.get('rows',3)
  for row in range(rows):
   yy=y+.12+row*(dy-.2)/rows
   w.box((x+.08,yy,z-.08),(dx-.16,.08,dz),id+'-shelf-'+str(row),fill)
   n=o.get('columns',7)
   for i in range(n):
    hh=(dy-.2)/rows*(.5+.12*(i%3));bw=(dx-.3)/n
    w.box((x+.15+i*bw,yy+.08,z-.1),(bw*.72,hh,dz*.8),f'{id}-book-{row}-{i}',INK if i%4==0 else 'white')
 elif k=='room':
  # Open-front cutaway room: floor and two far walls only.
  w.box((x,y-.12,z),(dx,.12,dz),id+'-floor','white')
  w.box((x,y,z+dz),(dx,dy,.12),id+'-back','white')
  w.box((x,y,z),(.12,dy,dz),id+'-side','url(#tone)')
  # Grid as thin floor strips, sorted with surfaces so furniture hides it.
  for j in range(1,10):
   w.box((x+j*dx/10,y+.001,z),(.008,.002,dz),f'{id}-grid-x-{j}','#b6b6c2')
   w.box((x,y+.001,z+j*dz/10),(dx,.002,.008),f'{id}-grid-z-{j}','#b6b6c2')

def render(d,o,camera=None,guides=False):
 validate_object(o);w=World(o.get('camera',{}))
 if o.get('ground',False):
  w.box((-15,-.18,-12),(30,.16,28),'ground','#f5f5f8')
  for z in range(-10,14,2):w.box((-14,0,z),(28,.002,.008),'ground-grid-z-'+str(z),'#c1c1cb')
  for x in range(-14,15,2):w.box((x,0,-10),(.008,.002,24),'ground-grid-x-'+str(x),'#c1c1cb')
 if o.get('ground',False):
  w.draw(d,False);w=World(o.get('camera',{}))
 for item in o['items']:build_item(w,item)
 w.draw(d,guides)

def validate_object(o):
 def num(v):return type(v) in [float,int] and math.isfinite(v)
 def vec(v,n):return isinstance(v,list) and len(v)==n and all(num(a) for a in v)
 if not isinstance(o,dict) or set(o)-{'id','kind','camera','items','ground'}:raise ValueError('Unknown world field')
 c=o.get('camera',{})
 if isinstance(c,dict) and 'position' in c and any(k in c for k in ['yaw','pitch','distance']):raise ValueError('Choose explicit camera position or orbit parameters, not both')
 if not isinstance(c,dict) or set(c)-{'position','target','yaw','pitch','distance','focal','center','near'}:raise ValueError('Unknown perspective camera field')
 for key in ['position','target']:
  if key in c and not vec(c[key],3):raise ValueError('Camera vector must have three finite numbers')
 if 'center' in c and not vec(c['center'],2):raise ValueError('Camera center requires two numbers')
 for key in ['yaw','pitch','distance','focal','near']:
  if key in c and not num(c[key]):raise ValueError('Invalid camera number')
 for key in ['distance','focal','near']:
  if key in c and c[key]<=0:raise ValueError('Camera distance, focal and near must be positive')
 if abs(c.get('pitch',0))>=89:raise ValueError('Pitch must be between -89 and 89 degrees')
 camera_basis(c)
 if 'ground' in o and type(o['ground']) is not bool:raise ValueError('ground must be boolean')
 if not isinstance(o.get('items'),list) or len(o['items'])>100:raise ValueError('world items must be array of at most 100')
 ids={'ground'}
 for it in o['items']:
  if not isinstance(it,dict) or set(it)-{'id','shape','position','size','fill','steps','rows','columns'}:raise ValueError('Unknown world item field')
  if not isinstance(it.get('id'),str) or not re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]*',it['id']) or it['id'] in ids:raise ValueError('Invalid/duplicate world item id')
  ids.add(it['id'])
  if it.get('shape') not in ['box','building','stairs','table','chair','shelf','room']:raise ValueError('Unknown world shape')
  for key in ['position','size']:
   if key in it and not vec(it[key],3):raise ValueError('World vector requires three numbers')
  if any(v<=0 for v in it.get('size',[2,2,2])):raise ValueError('World size must be positive')
  for key in ['steps','rows','columns']:
   if key in it and (type(it[key]) is not int or not 1<=it[key]<=30):raise ValueError('Counts must be integers 1..30')
  if 'fill' in it and not re.fullmatch(r'(white|black|#[A-Fa-f0-9]{6}|url\(#tone\))',str(it['fill'])):raise ValueError('Unsupported world paint')
 return True


def self_test():
 """Numerical regression checks; used by the integrated test suite."""
 c={'position':[10,3,-15],'target':[0,3,0],'focal':700,'center':[600,400]}
 assert vanishing_point((0,1,0),c) is None
 for axis in [(1,0,0),(0,0,1)]:
  vp=vanishing_point(axis,c)
  # Choose a direction going away from the camera, irrespective of axis sign.
  sign=1 if dot(axis,camera_basis(c)[3])>0 else -1
  far=project(mul(axis,sign*1e7),c)
  assert math.dist(vp,far)<.01
 c3={'position':[8,1,-10],'target':[0,8,0]}
 assert vanishing_point((0,1,0),c3) is not None
 a=project((0,0,0),c);b=project((0,3,0),c);assert abs(a[0]-b[0])<1e-9
 try:project(c['position'],c)
 except ValueError:pass
 else:raise AssertionError('Near plane not rejected')
 clipped=clip_near([(-1,0,-20),(1,0,-20),(1,1,0),(-1,1,0)],{'position':[0,0,-10],'target':[0,0,0]})
 assert len(clipped)>=3
 for p in clipped:project(p,{'position':[0,0,-10],'target':[0,0,0]})
 return {'checks':7,'status':'passed'}
