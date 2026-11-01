"""Bounded original palm/shaft/finger layering studies, not finger inverse kinematics."""
import math
KINDS={'held_prop'}
def validate_object(o):
 if set(o)-{'id','kind','position','scale','angle','prop'}:raise ValueError('Unknown held_prop field')
 num=lambda v:type(v) in (int,float) and math.isfinite(v)
 if not isinstance(o.get('position'),list) or len(o['position'])!=2 or not all(num(x) for x in o['position']):raise ValueError('position finite pair required')
 if not isinstance(o.get('prop','staff'),str) or o.get('prop','staff') not in {'staff','sword'}:raise ValueError('prop staff/sword only')
 for k,lo,hi in [('scale',.05,6),('angle',-180,180)]:
  if not num(o.get(k,1 if k=='scale' else 0)) or not lo<=o.get(k,1 if k=='scale' else 0)<=hi:raise ValueError('Invalid '+k)
 return True

def render(d,o,camera=None,guides=False):
 validate_object(o);x,y=o['position'];s=o.get('scale',1);angle=o.get('angle',0)
 d.parts.append(f'<g transform="translate({x} {y}) rotate({angle}) scale({s})">')
 # Palm is behind the cylinder; four curled fingers and crossing thumb are in front.
 d.path('M -24,45 L -31,-5 Q -46,-29 -31,-64 Q -14,-76 16,-65 L 29,-22 L 17,42 Z','white',2.2,'palm-back')
 d.path('M -8,-170 L 8,-170 L 8,73 Q 0,79 -8,73 Z','#a9a9b8',2,'shaft')
 d.path('M -3,-166 L -3,70',width=1,id='shaft-highlight',stroke='white')
 if o.get('prop','staff')=='sword':
  d.path('M -26,-112 L 27,-112 L 31,-102 L -30,-102 Z','#727482',2,'guard')
  d.path('M -9,-113 L -9,-226 L 0,-247 L 10,-225 L 10,-113 Z','white',2,'blade');d.line((0,-240),(0,-116),1,id='blade-center')
 else:
  d.path('M -9,-164 Q -32,-184 -5,-207 Q 15,-217 27,-193 Q 32,-170 8,-164 Z','white',2,'staff-crown');d.ellipse(5,-187,10,14,'#b4c6d3',1.4,'gem')
 for i in range(4):
  yy=-51+i*15;left=-28+i*2;right=17-i*.8
  d.path(f'M {left},{yy} Q {left-7},{yy+7} {left},{yy+13} L {right},{yy+12} Q {right+9},{yy+5} {right},{yy-1} Z','white',1.6,f'finger-{i}')
  d.line((right-5,yy+3),(right-5,yy+9),.7,id=f'finger-joint-{i}')
 d.path('M -25,-43 Q -36,-55 -31,-64 Q -26,-69 -19,-62 L 17,-37 Q 25,-26 16,-22 Q 10,-20 2,-28 Z','white',1.8,'thumb-front')
 d.path('M 7,-34 l 7,5 M -18,29 Q -5,35 11,29',width=.8,id='creases')
 if guides:
  d.rect(-30,-65,56,98,'none',1,id='palm-box');d.line((0,-250),(0,85),1,'#70a0c8','shaft-axis')
  for i in range(4):d.ellipse(14-i*.8,-45+i*15,4,5,'none',.7,f'joint-guide-{i}')
 d.parts.append('</g>')

# v0.6 five original imagined hand studies, built from a palm mass and narrow wrist.
OLD_VALIDATE=validate_object
OLD_RENDER=render
KINDS.add('expressive_hand')
HAND_POSES={'offer','pinch','support','cup','grip'}
def validate_object(o):
 if o.get('kind')!='expressive_hand':return OLD_VALIDATE(o)
 if set(o)-{'id','kind','position','scale','angle','pose'}:raise ValueError('Unknown expressive_hand field')
 if not isinstance(o.get('pose'),str) or o['pose'] not in HAND_POSES:raise ValueError('Unsupported hand pose')
 return OLD_VALIDATE({k:v for k,v in o.items() if k!='pose'}|{'kind':'held_prop'})

def render(d,o,camera=None,guides=False):
 if o.get('kind')!='expressive_hand':return OLD_RENDER(d,o,camera,guides)
 validate_object(o)
 if o['pose']=='grip':return OLD_RENDER(d,{k:v for k,v in o.items() if k!='pose'}|{'kind':'held_prop','prop':'staff'},camera,guides)
 x,y=o['position'];sc=o.get('scale',1);a=o.get('angle',0);pose=o['pose']
 d.parts.append(f'<g transform="translate({x} {y}) rotate({a}) scale({sc})">')
 if pose=='offer':
  d.path('M -79,20 L -76,-5 Q -52,-6 -37,-22 Q -21,-36 1,-29 L 57,-32 Q 72,-32 73,-25 Q 72,-18 57,-17 L 25,-13 L 75,-13 Q 86,-10 80,-3 Q 76,1 58,2 L 29,3 L 70,6 Q 81,10 73,16 L 57,20 L 25,19 L 58,24 Q 65,31 53,35 L 19,33 Q -14,43 -40,21 Z','white',2,'contour')
  d.path('M -39,-20 Q -32,-45 -17,-45 Q 1,-44 14,-33 Q 20,-24 12,-21 Q 3,-17 -13,-26 Q -23,-9 -36,-3','white',1.7,'thumb')
  d.path('M -30,17 Q -11,4 14,7 M -27,-5 Q -15,-14 -5,-10 M -61,0 l -3,18',width=.8,id='palm-lines')
  d.path('M 29,3 Q 44,6 58,2 M 25,19 Q 38,24 57,20',width=.65,id='finger-folds')
 elif pose=='pinch':
  d.path('M -24,54 L -30,11 Q -36,-15 -20,-34 L -15,-65 Q -11,-88 7,-94 Q 27,-97 41,-75 Q 48,-61 38,-56 Q 30,-54 27,-67 Q 18,-82 8,-74 Q 1,-66 4,-39 L 28,-31 Q 45,-25 42,-7 L 26,30 L 19,52 Z','white',2,'contour')
  for i in range(3):
   yy=-21+i*15;d.path(f'M -5,{yy} Q 10,{yy-13} 31,{yy-6} Q 41,{yy+1} 31,{yy+9} L 1,{yy+12} Q -10,{yy+8} -5,{yy} Z','white',1.4,f'curled-finger-{i}')
  d.path('M -24,13 Q -43,-5 -27,-27 L 16,-62 Q 26,-67 29,-59 Q 31,-53 23,-48 L -1,-24 Q 11,-12 7,0 Q -4,19 -24,13 Z','white',1.8,'thumb')
  d.ellipse(29,-72,6,8,'#a4a6b5',1,'held-seed');d.path('M 19,-57 l 5,4 M 31,-73 l 5,2 M -15,40 l 23,-2',width=.7,id='nail-wrist')
 elif pose=='support':
  d.path('M -81,21 L -77,-2 Q -48,-12 -20,-14 L 58,-19 Q 75,-20 77,-11 Q 76,-5 61,-3 L 13,1 L 66,1 Q 78,3 73,11 L 54,15 L 12,15 Q -6,26 -30,23 Z','white',2,'contour')
  d.path('M -31,-12 Q -27,-28 -12,-29 L 25,-23 Q 35,-18 28,-12 Q 24,-9 13,-12 L -8,-14 Q -14,-1 -25,5','white',1.7,'thumb')
  d.path('M 15,8 L 56,8 M -26,12 Q -7,7 11,13 M -65,2 l -3,15',width=.7,id='folds')
  d.path('M 58,-13 l 10,0 M 58,6 l 9,0',width=.6,id='nails')
 elif pose=='cup':
  d.path('M -31,52 L -40,20 Q -58,1 -51,-29 Q -48,-47 -39,-44 Q -32,-41 -35,-24 Q -35,-11 -26,-4 Q -13,-35 -14,-58 Q -15,-72 -6,-72 Q 3,-70 2,-54 L 4,-18 Q 12,-37 10,-64 Q 10,-78 18,-77 Q 27,-73 25,-54 L 24,-15 Q 34,-32 33,-54 Q 34,-67 42,-63 Q 49,-57 45,-39 L 41,-7 Q 47,-20 48,-35 Q 50,-46 57,-41 Q 63,-35 57,-18 Q 52,11 24,35 L 19,53 Z','white',2,'contour')
  d.path('M -33,-2 Q -13,15 10,10 Q 24,4 37,-7 M -24,20 Q -10,27 9,22 M -22,43 l 29,1',width=.85,id='palm-lines')
  d.path('M -24,-2 Q -9,-5 4,-18 Q 0,-1 -5,8 Q -18,10 -24,-2 Z','#e6e6ed',0,'palm-plane')
 if guides:
  d.path('M -34,-27 L 19,-30 L 25,25 L -30,30 Z',width=.7,id='palm-guide',stroke='#70a0c8');d.line((-26,36),(18,36),.7,'#70a0c8','wrist-guide')
 d.parts.append('</g>')
