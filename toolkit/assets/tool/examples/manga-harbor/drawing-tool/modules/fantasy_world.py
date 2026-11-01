"""Original fantasy terrain/architecture solids with shared perspective.

Lesson-derived choices: impossible floating mass, altered natural scale,
logical ruin fragments, separated value/depth planes and readable focal gaps.
No source artwork, external assets, stochastic generation or anatomy solver.
"""
import math,re
from . import perspective as p
from .action_camera import frame,ring
TONES={'light':['#f6f6fa','#ddddE6','#c8c8d6'],'mid':['#dedee8','#a7a7bb','#818199'],'dark':['#727286','#46465d','#29293d']}
SHAPES={'arch','island','mushroom','tree','spire','stone'}
def anchor(point,camera):return p.project(point,camera)
def validate_object(o):
 if not isinstance(o,dict) or set(o)-{'id','kind','camera','items'}:raise ValueError('Unknown fantasy world field')
 p.validate_object({'id':'camera','kind':'world','camera':o.get('camera',{}),'items':[]})
 if not isinstance(o.get('items'),list) or len(o['items'])>80:raise ValueError('Fantasy items must be an array, maximum 80')
 ids=set()
 for it in o['items']:
  if not isinstance(it,dict) or set(it)-{'id','shape','position','size','tone','broken'}:raise ValueError('Unknown fantasy item field')
  if not isinstance(it.get('id'),str) or not re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]*',it['id']) or it['id'] in ids:raise ValueError('Invalid/duplicate fantasy item ID')
  ids.add(it['id'])
  if not isinstance(it.get('shape'),str) or it['shape'] not in SHAPES:raise ValueError('Unsupported fantasy shape')
  for key in ['position','size']:
   v=it.get(key)
   if not isinstance(v,list) or len(v)!=3 or not all(type(x) in [int,float] and math.isfinite(x) for x in v):raise ValueError('Fantasy vectors require three finite numbers')
  if any(not 0<x<=100 for x in it['size']):raise ValueError('Fantasy size must be positive, maximum 100')
  if it['shape']=='arch' and it['size'][1]<=it['size'][0]*.5:raise ValueError('Arch height must exceed half its width')
  if it.get('tone','mid') not in TONES:raise ValueError('Invalid fantasy tone')
  if 'broken' in it and (type(it['broken']) is not bool or it['shape']!='arch'):raise ValueError('broken is an arch-only boolean')
 return True

def profile(w,pos,rx,rz,height,rings,id,colors,n=24):
 """Lathed organic profile in normalized height/radius pairs."""
 x,y,z=pos;levels=[]
 for h,r in rings:levels.append([(x+rx*r*math.cos(i*2*math.pi/n),y+height*h,z+rz*r*math.sin(i*2*math.pi/n)) for i in range(n)])
 for j in range(len(levels)-1):
  for i in range(n):
   k=(i+1)%n;shade=colors[0 if math.cos(i*2*math.pi/n)>.15 else 1]
   w.face([levels[j][i],levels[j][k],levels[j+1][k],levels[j+1][i]],shade,.65,f'{id}-{j}-{i}')
 w.face(levels[-1],colors[0],1.1,id+'-top')

def branch(w,a,b,ra,rb,id,colors):
 axis,u,v=frame(a,b);aa=ring(a,u,v,ra,ra,8);bb=ring(b,u,v,rb,rb,8)
 for i in range(8):w.face([aa[i],aa[(i+1)%8],bb[(i+1)%8],bb[i]],colors[i%2],.9,id+'-'+str(i))
 w.face(bb,colors[0],1,id+'-end')

def item(w,it):
 x,y,z=it['position'];sx,h,sz=it['size'];id=it['id'];colors=TONES[it.get('tone','mid')];shape=it['shape']
 if shape in ['mushroom','spire','stone']:
  profiles={'mushroom':[(0,.2),(.08,.28),(.52,.14),(.62,.19),(.63,.96),(.7,1),(.84,.84),(.96,.45),(1,.02)],'spire':[(0,.75),(.1,1),(.18,.75),(.75,.56),(.78,.9),(1,0)],'stone':[(0,.7),(.22,1),(.72,.8),(1,.3)]}
  profile(w,(x,y,z),sx/2,sz/2,h,profiles[shape],id,colors)
  # Deliberately omit decorative gill strokes. World.lines is an overlay
  # pass, not a hidden-line renderer; unoccluded underside lines can bleed
  # across an opaque cap from high viewpoints. The lathed underside faces
  # still provide a readable rim and construction, without false x-rays.
 elif shape=='island':
  n=16;top=[];lower=[]
  for i in range(n):
   a=i*2*math.pi/n;r=1+.12*math.sin(i*2.7)
   top.append((x+sx*.5*r*math.cos(a),y,z+sz*.5*r*math.sin(a)))
   lower.append((x+sx*.46*r*math.cos(a),y-h*(.25+.08*math.sin(i)),z+sz*.46*r*math.sin(a)))
  bottom=(x+sx*.12,y-h,z+sz*.03)
  for i in range(n):
   j=(i+1)%n;w.face([top[i],top[j],lower[j],lower[i]],colors[i%2],1,id+'-rim-'+str(i),cull=True);w.face([lower[i],lower[j],bottom],colors[1+i%2],1,id+'-rock-'+str(i),cull=True)
  w.face(top,colors[0],1.6,id+'-surface')
 elif shape=='tree':
  base=(x,y,z);fork=(x+sx*.08,y+h*.55,z);top=(x-sx*.08,y+h,z)
  branch(w,base,fork,sx*.13,sx*.08,id+'-trunk',colors);branch(w,fork,top,sx*.08,.025,id+'-crown',colors)
  for i in range(5):
   t=.3+i*.11;root=(x+sx*.08*t,y+h*t,z);sgn=(-1)**i
   bend=(x+sgn*sx*.28,y+h*(t+.13),z+sz*.15*math.sin(i));tip=(x+sgn*sx*.48,y+h*(t+.33),z+sz*.3*math.sin(i))
   branch(w,root,bend,sx*.06,sx*.035,id+'-branch-'+str(i),colors);branch(w,bend,tip,sx*.035,.01,id+'-twig-'+str(i),colors)
  for i in range(5):
   a=i*math.pi*.4;branch(w,base,(x+sx*.35*math.cos(a),y,z+sz*.35*math.sin(a)),sx*.09,.015,id+'-root-'+str(i),colors)
 elif shape=='arch':
  radius=sx*.33;thick=sx*.17;cy=y+h-radius-thick
  for side in [-1,1]:
   for j in range(5):
    w.box((x+side*(radius+thick/2)-thick/2,y+(cy-y)*j/5,z-sz/2),(thick,(cy-y)/5*.98,sz),id+f'-pier-{side}-{j}',colors[0])
  for i in range(13):
   if it.get('broken',False) and i in [5,6,7]:continue
   a=i*math.pi/13+.009;b=(i+1)*math.pi/13-.009
   front=[(x+r*math.cos(t),cy+r*math.sin(t),z-sz/2) for r,t in [(radius,a),(radius+thick,a),(radius+thick,b),(radius,b)]]
   back=[(xx,yy,z+sz/2) for xx,yy,zz in front]
   w.face(front,colors[0],1.3,id+'-arch-front-'+str(i));w.face(back,colors[1],1,id+'-arch-back-'+str(i))
   for k in range(4):w.face([front[k],front[(k+1)%4],back[(k+1)%4],back[k]],colors[1+k%2],1,id+f'-arch-edge-{i}-{k}')
  if it.get('broken',False):
   for i in range(3):w.box((x+(i-1)*thick*1.25,y,z-sz*(1.1+i*.2)),(thick*.85,thick*.7,sz*.7),id+'-fallen-'+str(i),colors[0])

def render(d,o,camera=None,guides=False):
 validate_object(o);w=p.World(o.get('camera',{}))
 for it in o['items']:item(w,it)
 w.draw(d,False)
 if guides:
  for it in o['items']:
   x,y,z=it['position'];a=anchor((x,y,z),w.camera);b=anchor((x,y+it['size'][1],z),w.camera)
   d.line(a,b,1,'#70a0c8',it['id']+'-height-guide');d.ellipse(*a,4,4,'#70a0c8',0,it['id']+'-ground-anchor')

def self_test():
 base={'id':'w','kind':'fantasy_world','items':[{'id':'a','shape':'arch','position':[0,0,0],'size':[4,6,1]}]}
 validate_object(base)
 for patch in [{'size':[0,2,3]},{'position':[True,0,0]},{'broken':'yes'},{'tone':'red'},{'shape':'unknown'}]:
  it=dict(base['items'][0]);it.update(patch)
  try:validate_object(dict(base,items=[it]))
  except ValueError:pass
  else:raise AssertionError(patch)
 for shape in SHAPES:
  it=dict(base['items'][0],shape=shape);w=p.World({});item(w,it);assert w.surfaces
 return {'checks':12,'status':'passed'}
