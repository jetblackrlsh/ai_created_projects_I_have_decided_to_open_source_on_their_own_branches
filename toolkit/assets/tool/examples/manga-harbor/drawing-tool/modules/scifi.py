"""Original bounded mechanical character construction from projected primitives.

Torso armor, spherical joints, cylinder limb masses, stable wide feet, optional
claws. Source principles: Michael88's 'Designing Giant Robots', CSP 3765.
No photo collage, source illustration, kinematic solver or collision engine.
"""
import math
from . import perspective as p
from .fantasy_world import profile,branch

def validate_object(o):
 if not isinstance(o,dict) or set(o)-{'id','kind','camera','position','scale','stance','head','hand'}:raise ValueError('Unknown mecha field')
 p.validate_object({'id':'c','kind':'world','camera':o.get('camera',{}),'items':[]})
 v=o.get('position',[0,0,0])
 if not isinstance(v,list) or len(v)!=3 or not all(type(x) in [int,float] and math.isfinite(x) for x in v):raise ValueError('Mecha position needs three finite numbers')
 scale=o.get('scale',1)
 if type(scale) not in [int,float] or not math.isfinite(scale) or not 0<scale<=10:raise ValueError('Mecha scale must be positive, at most 10')
 for field,values,default in [('stance',['neutral','braced'],'neutral'),('head',['visor','round'],'visor'),('hand',['claw','block'],'claw')]:
  if o.get(field,default) not in values:raise ValueError('Invalid mecha '+field)
 return True

def build(o):
 validate_object(o);w=p.World(o.get('camera',{}));origin=o.get('position',[0,0,0]);scale=o.get('scale',1)
 def at(v):return p.add(origin,p.mul(v,scale))
 def box(id,pos,size,fill='white'):w.box(at(pos),p.mul(size,scale),id,fill)
 def ball(id,center,r):
  rings=[((1-math.cos(i*math.pi/8))/2,math.sin(i*math.pi/8)) for i in range(9)]
  profile(w,at((center[0],center[1]-r,center[2])),r*scale,r*scale,2*r*scale,rings,id,['#d9d9e3','#88889b','#505062'],12)
 def limb(id,a,b,r):branch(w,at(a),at(b),r*scale,r*.85*scale,id,['white','#9494a7'])
 # Broad support polygon, short thighs, long reinforced shins.
 for side in [-1,1]:
  x=side*(1.05 if o.get('stance','neutral')=='neutral' else 1.4);hip=(side*.72,3.6,0);knee=(x,2.6,-.12);ankle=(x,.65,0)
  box('boot-'+str(side),(x-.62,0,-1.05),(1.24,.55,1.8),'#d6d6e2')
  ball('ankle-'+str(side),ankle,.29);limb('shin-'+str(side),ankle,knee,.46);ball('knee-'+str(side),knee,.39);limb('thigh-'+str(side),knee,hip,.42);ball('hip-'+str(side),hip,.37)
  box('kneepad-'+str(side),(x-.44,2.28,-.62),(.88,.65,.2),'white')
  for j in range(3):box(f'shin-vent-{side}-{j}',(x-.24,1.1+j*.26,-.47),(.48,.08,.08),'#3a3a4a')
 box('pelvis',(-1,3.5,-.48),(2,.62,.96),'#8c8ca3');ball('waist',(0,4.3,0),.58)
 box('torso',(-1.35,4.5,-.65),(2.7,1.65,1.3),'white')
 # Chest panel and grille are true exterior slabs, not a pasted face graphic.
 box('chest-panel',(-.85,5.15,-.79),(1.7,.65,.12),'#363648')
 for j in range(4):box('chest-grille-'+str(j),(-.7+j*.4,5.3,-.82),(.2,.32,.035),'#dce5ef')
 box('waist-front',(-.7,4.53,-.76),(1.4,.24,.1),'#5e5e76')
 ball('neck',(0,6.35,0),.27)
 if o.get('head','visor')=='round':ball('head',(0,6.96,0),.65)
 else:box('head',(-.68,6.55,-.55),(1.36,.95,1.1),'white')
 box('visor',(-.52,6.94,-.7),(1.04,.25,.15),'#29293d')
 box('chin',(-.34,6.6,-.68),(.68,.2,.12),'#8c8ca3')
 limb('antenna',(0,7.5,0),(0,7.95,0),.045)
 for side in [-1,1]:
  shoulder=(side*1.65,5.8,0)
  if o.get('stance','neutral')=='braced':elbow=(side*2.65,5.35,0);wrist=(side*2.6,6.8,-.3)
  else:elbow=(side*2,4.5,0);wrist=(side*2.05,3.25,-.15)
  ball('shoulder-'+str(side),shoulder,.43);limb('upperarm-'+str(side),shoulder,elbow,.35);ball('elbow-'+str(side),elbow,.32);limb('forearm-'+str(side),elbow,wrist,.47);ball('wrist-'+str(side),wrist,.23)
  box('shoulder-plate-'+str(side),(side*1.65-.52,5.74,-.54),(1.04,.45,1.08),'#e5e5ec')
  x,y,z=wrist;direction=1 if o.get('stance')=='braced' else -1
  if o.get('hand','claw')=='claw':
   for finger in [-1,1]:
    start=(x+finger*.18,y,z);bend=(x+finger*.43,y+direction*.45,z);tip=(x+finger*.18,y+direction*.72,z-.08)
    limb(f'claw-{side}-{finger}-a',start,bend,.11);limb(f'claw-{side}-{finger}-b',bend,tip,.1)
  else:
   box('hand-'+str(side),(x-.38,y+min(0,direction*.55),z-.35),(.76,.55,.7),'white')
   for j in range(3):box(f'knuckle-{side}-{j}',(x-.3+j*.2,y+direction*.3,z-.43),(.16,.2,.1),'#8c8ca3')
 # Coplanar front details share the torso plane's sorting depth, so a large
 # front face cannot paint over its smaller vent plates at oblique views.
 depth=p.camera_point(at((0,5.325,-.65)),w.camera)[2]
 fixed=[]
 for pts,fill,width,id,override in w.surfaces:
  if id=='torso-front':override=depth
  elif id=='chest-panel-front':override=depth-.01
  elif id.startswith('chest-grille-') and id.endswith('-front'):override=depth-.02
  elif id=='waist-front-front':override=depth-.01
  fixed.append((pts,fill,width,id,override))
 w.surfaces=fixed
 return w

def render(d,o,camera=None,guides=False):
 w=build(o);w.draw(d,False)
 if guides:
  pos=o.get('position',[0,0,0]);sc=o.get('scale',1)
  a=p.project(pos,w.camera);b=p.project(p.add(pos,(0,7.9*sc,0)),w.camera)
  d.line(a,b,1,'#75a3cc','balance-axis');d.ellipse(*a,4,4,'#75a3cc',0,'ground-anchor')
  for side in [-1,1]:
   q=p.project(p.add(pos,(side*(1.05 if o.get('stance','neutral')=='neutral' else 1.4)*sc,0,0)),w.camera);d.line(a,q,1,'#75a3cc','support-'+str(side))

def self_test():
 for st in ['neutral','braced']:
  for head in ['round','visor']:
   for hand in ['claw','block']:assert build({'id':'r','kind':'mecha','stance':st,'head':head,'hand':hand}).surfaces
 for bad in [{'scale':True},{'stance':'fly'},{'head':'alien'},{'hand':'tentacle'},{'position':[0,0,float('nan')]},{'unknown':1}]:
  try:validate_object(dict(id='r',kind='mecha',**bad))
  except ValueError:pass
  else:raise AssertionError(bad)
 return {'checks':14,'status':'passed'}
