"""Original authored head/hand geometry. Bounded 2D views, not a 3D rig.
Applied study of book scans 74–92; no traced or embedded source artwork.
"""
from html import escape
import math
INK='#17202b'
class Draw:
 def __init__(self,prefix):self.prefix=prefix;self.parts=[];self.i=0
 def path(self,d,fill='none',width=1.4,name=None,stroke=INK):
  self.i+=1;self.parts.append(f'<path id="{escape(self.prefix)}-{name or self.i}" d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>')
 def ellipse(self,x,y,rx,ry,fill='none',width=1,name=None,stroke=INK):
  self.i+=1;self.parts.append(f'<ellipse id="{escape(self.prefix)}-{name or self.i}" cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}" stroke-width="{width}"/>')
 def out(self):return ''.join(self.parts)
def validate(o):
 for k in ['x','y','scale','rotation']:
  if k in o and (type(o[k])not in (int,float) or not math.isfinite(o[k])):raise ValueError('Nonfinite transform')
 if o.get('scale',1)<=0:raise ValueError('Scale must be positive')
 if not isinstance(o.get('id','head'),str):raise ValueError('ID must be text')
def render_head(o):
 validate(o);p=o.get('id','head');d=Draw(p);v=o.get('view','front');e=o.get('expression','neutral');I=o.get('identity',{});age=I.get('age','adult');soft=I.get('jaw','broad')=='narrow';skin=I.get('skin','#f5e6d3');hair=I.get('hair','short');hc=I.get('hair_color','#17202b');beard=I.get('beard','none');child=age=='child'
 if v not in {'front','threequarter','profile','up','down'}:raise ValueError('Unsupported view')
 if e not in {'neutral','angry','fear','smile','shout','sad'}:raise ValueError('Unsupported expression')
 nose=I.get('nose','small' if child else 'medium');brow=I.get('brow','fine' if child else 'medium');eyes=I.get('eyes','open' if child else 'medium')
 # Each view has independent silhouette and facial plane coordinates.
 if v=='profile':
  d.path('M -22,25 Q -27,42 -37,47 L -10,58 16,49 Q 5,38 9,24',skin,1.7,'neck')
  profile_outline='M -26,-10 C -41,-37 -22,-55 4,-49 Q 29,-47 27,-20 L 23,-10 36,7 Q 39,11 27,12 L 28,19 32,24 29,29 32,35 Q 24,44 5,43 L -17,30 -25,7 Z'
  if child:profile_outline='M -27,-9 Q -40,-39 -9,-51 Q 23,-57 29,-29 L 26,-12 33,5 Q 36,9 27,12 L 29,21 31,26 28,31 Q 27,42 9,44 Q -8,42 -20,27 L -25,8 Z'
  if nose=='long':profile_outline=profile_outline.replace('36,7 Q 39,11','44,9 Q 46,14').replace('33,5 Q 36,9','40,7 Q 42,12')
  elif nose=='small':profile_outline=profile_outline.replace('36,7 Q 39,11','31,5 Q 33,9')
  elif nose=='broad':profile_outline=profile_outline.replace('36,7 Q 39,11 27,12','39,7 Q 43,16 27,16')
  d.path(profile_outline,skin,2,'outline')
  d.path('M -19,1 Q -31,-10 -32,3 Q -32,17 -21,17 M -25,2 Q -19,-3 -21,10',skin,1.2,'ear')
  d.path('M 7,-11 Q 15,-17 23,-11 L 13,-8 Z',INK,.35 if brow=='fine' else 2 if brow=='heavy' else .7,'brow');d.path('M 10,-5 Q 16,-9 23,-4 L 17,-1 Z','white',1,'eye');d.ellipse(19,-4,1.6,2.3,INK,0,'pupil')
  d.path('M 26,11 l 4,-1 M 9,25 Q 18,22 28,24 M 18,29 l 8,0 M -17,19 L -2,33 16,37',width=1,name='planes')
  mouth=(22,24);axis=18
 elif v in {'front','threequarter','up','down'}:
  q=v=='threequarter';up=v=='up';down=v=='down';jaw=18 if soft or child else 23;cx=8 if q else 0
  d.path('M -16,28 L -18,42 -34,50 Q 0,63 35,50 L 18,41 16,28',skin,1.7,'neck')
  if up: outline=f'M -31,-24 Q -29,-42 0,-43 Q 29,-42 31,-24 L 34,2 30,22 {jaw},37 0,49 {-jaw},37 -30,22 -34,2 Z'
  elif down:outline=f'M -35,-5 C -42,-44 -16,-61 8,-57 Q 39,-52 36,-9 L 29,23 16,39 0,46 -17,38 -29,22 Z'
  elif q:outline=f'M -32,-12 Q -38,-43 -9,-49 Q 18,-53 31,-30 L 34,-5 30,23 16,43 2,47 -23,31 -32,10 Z'
  else:outline=f'M -32,-12 Q -36,-49 0,-50 Q 36,-49 32,-12 L 30,17 {jaw},36 9,47 -9,47 {-jaw},36 -30,17 Z'
  if child and v=='front':outline='M -33,-10 C -39,-43 -18,-53 0,-52 C 22,-53 38,-39 33,-9 L 31,16 Q 27,35 10,44 Q 0,49 -10,44 Q -27,35 -31,16 Z'
  elif child and v=='threequarter':outline='M -33,-10 Q -39,-41 -14,-51 Q 16,-56 31,-34 L 33,-10 30,17 Q 26,37 10,45 Q 0,49 -13,39 L -26,25 Z'
  if (I.get('shape')=='square' or I.get('build') in {'broad','stocky'}) and v=='front':outline='M -37,-13 Q -37,-50 0,-50 Q 37,-50 37,-13 L 37,29 27,45 -27,45 -37,29 Z'
  elif I.get('shape')=='pear':outline='M -25,-13 Q -30,-49 0,-49 Q 30,-49 25,-13 Q 45,20 26,40 Q 0,54 -26,40 Q -45,20 -25,-13 Z'
  d.path(outline,skin,2,'outline')
  for side in [-1,1]:
   if q and side==1:continue
   x=side*32;d.path(f'M {x},-8 C {x+side*13},-17 {x+side*10},15 {x},18 M {x+side*3},-3 q {side*5},2 0,9',skin,1.3,'ear'+str(side))
  eyeY=11 if down else -19 if up else -5
  positions=[(-14,9),(14,9)] if not q else [(-9,10),(21,4)]
  if down:positions=[(-14,8),(14,8)]
  if child:positions=[(x,w*1.05)for x,w in positions]
  for idx,(x,w) in enumerate(positions):
   y=eyeY+(1 if q and idx==0 else 0);outer=-1 if idx==0 else 1
   browY=y-6
   bd=1 if brow=='fine' else 5 if brow=='heavy' else 3
   if e=='angry':d.path(f'M {x-w},{browY+outer*3} L {x+w},{browY-outer*3} L {x+w},{browY-outer*3+3} Z',INK,.4,'brow'+str(idx))
   elif e in {'sad','fear'}:d.path(f'M {x-w},{browY-outer*4} Q {x},{browY-3} {x+w},{browY+outer*4}',width=2.1,name='brow'+str(idx))
   else:d.path(f'M {x-w},{browY} Q {x},{browY-3} {x+w},{browY+1} L {x+w-2},{browY+bd} Q {x},{browY} {x-w},{browY+1} Z',INK,.3,'brow'+str(idx))
   h=4.5 if e in {'fear','shout'} else 3.5 if child else 2.5
   if eyes=='open':h*=1.3
   elif eyes=='narrow':h*=.62
   if down:h*=.72
   if up:h*=.85
   d.path(f'M {x-w},{y} Q {x},{y-h} {x+w},{y} Q {x},{y+h} {x-w},{y} Z','white',1,'eye'+str(idx));d.ellipse(x+(2 if q else 0),y,1.8,h*.88,INK,0,'iris'+str(idx))
  nx=12 if q else 0;ny=22 if down else 0 if up else 9 if child else 12
  nw=3 if nose=='small' else 8 if nose=='broad' else 4 if nose=='long' else 5
  if nose=='long':ny+=5
  if nose=='small':ny-=2
  if up:d.path(f'M {-nw*.8},-5 L {-nw*1.4},2 Q 0,5 {nw*1.4},2 L {nw*.8},-5 M {-nw*.8},3 l 2,-1 M {nw*.6},2 l 2,1',width=.85 if nose=='small' else 1.1,name='nose');d.path('M -28,24 Q -9,33 0,29 Q 12,33 28,24 L 17,36 0,47 -17,36 Z','#d9c4ae',0,'under-chin')
  else:d.path(f'M {nx-nw*.6},{eyeY+(5 if nose=="small" else 1)} L {nx-nw},{ny} Q {nx},{ny+(2 if nose=="small" else 5)} {nx+nw},{ny} M {nx+nw*.8},{ny} l {nw*.6},2 M {nx-nw*1.3},{ny} l -2,2',width=.85 if nose=='small' else 1.1,name='nose')
  if not child and not soft:
   d.path(f'M -27,{eyeY+9} l 9,9 6,1 M 28,{eyeY+10} l -7,9 -3,0',width=.8,name='cheek-planes')
   d.path(f'M -26,18 l 4,10 7,5 M 25,20 l -4,9',width=.7,name='jaw-planes')
  mouth=(nx-2,33 if down else 21 if up else 23 if child else 25);axis=nx
 mx,my=mouth
 if v=='profile' and e in {'fear','shout'}:
  d.path('M 27,19 Q 35,21 30,32 L 24,31 24,23 Z',INK,.7,'mouth')
 elif e=='shout':
  d.path(f'M {mx-10},{my-5} Q {mx},{my-10} {mx+11},{my-5} L {mx+8},{my+12} Q {mx},{my+18} {mx-8},{my+10} Z',INK,1,'mouth');d.path(f'M {mx-8},{my-4} Q {mx},{my-7} {mx+9},{my-4} L {mx+7},{my} {mx-7},{my} Z','white',.4,'teeth')
 elif e=='smile':
  d.path(f'M {mx-12},{my-1} Q {mx},{my+4} {mx+12},{my-1} Q {mx},{my+14} {mx-12},{my-1} Z','white',1,'mouth')
 elif e=='fear':d.ellipse(mx,my+2,5,6,INK,.6,'mouth')
 else:
  bend=-3 if e=='sad' else 1;d.path(f'M {mx-11},{my} Q {mx-3},{my+bend} {mx},{my+1} Q {mx+5},{my+bend} {mx+10},{my} M {mx-4},{my+5} l 8,0',width=1,name='mouth')
 if v=='up':d.path(outline,'none',2,'outline-reinforce')
 if age=='elder':d.path('M -20,-24 Q -4,-29 15,-25 M -18,-20 Q -2,-24 14,-21 M -25,5 l 5,2 M 23,7 l 5,-1 M -13,17 l -3,5 M 16,17 l 3,5',width=.65,name='age-lines')
 if I.get('build') in {'broad','stocky'} and v in {'front','threequarter'}:
  d.path('M -22,4 l 13,2 M 15,6 l 8,-2',width=1.2,name='heavy-orbit')
 if beard!='none':
  end=70 if beard=='long' else 45
  d.path(f'M -22,23 Q -14,32 {mx-8},{my+3} Q {mx},{my+10} {mx+9},{my+3} L 25,23 Q 23,49 2,{end} Q -22,49 -22,23 Z',hc,.8,'beard')
  for z in range(5):d.path(f'M {-13+z*7},38 q 1,10 5,{14 if beard=='long' else 4}',width=.6,name='beard-hatch'+str(z),stroke='#87929f')
 if hair!='bald':
  if hair=='long' and v=='profile':d.path('M -30,2 Q -47,-20 -31,-42 Q -4,-63 23,-43 L 30,-30 Q 15,-25 8,-33 Q -7,-22 -21,-19 L -21,8 -14,34 -32,52 -44,48 Q -34,23 -30,2 Z',hc,1.2,'hair')
  elif hair=='long':d.path('M -33,-5 Q -55,-37 -19,-54 Q 15,-64 35,-36 Q 43,-13 36,9 L 46,54 24,45 Q 30,8 22,-28 Q -2,-41 -26,-21 L -30,43 -47,49 Q -38,20 -33,-5 Z',hc,1.2,'hair')
  elif v=='down':d.path('M -35,6 Q -43,-36 -20,-54 Q 12,-68 33,-43 L 38,-16 31,5 27,-16 18,-9 18,-23 0,-11 3,-27 -15,-17 -24,-8 -25,11 Z',hc,1,'hair')
  elif v=='up':d.path('M -32,-5 L -37,-23 Q -32,-47 -12,-49 L -15,-55 3,-49 Q 25,-49 34,-32 L 33,-7 27,-16 25,-31 10,-25 13,-37 -8,-27 -20,-26 -26,-7 Z',hc,1,'hair')
  elif v=='profile':d.path('M -30,4 Q -44,-14 -35,-33 L -39,-43 -25,-41 Q -8,-59 16,-48 L 31,-39 Q 25,-22 10,-25 L 15,-36 Q -4,-20 -20,-20 L -20,5 Z',hc,1,'hair')
  else:d.path('M -33,4 L -38,-17 -34,-29 -40,-38 -25,-35 Q -11,-57 5,-53 L 2,-58 21,-49 34,-36 35,-8 28,2 26,-25 Q 12,-19 17,-35 Q -2,-24 -10,-29 L -24,-19 -25,4 -31,12 Z',hc,1,'hair')
  d.path('M -27,-31 Q -11,-45 4,-45 M -21,-23 Q -8,-34 2,-35 M 8,-44 Q 18,-43 24,-36',width=.8,name='hair-sheen',stroke='#677280')
  if hair=='forelock':d.path('M -10,-48 Q 2,-55 10,-49 L 2,-35 -8,-25 -4,-39 Z','#f4f1df',.6,'forelock')
 if I.get('crown'):d.path('M -31,-27 L -31,-46 -21,-46 -21,-39 -12,-39 -12,-56 -3,-56 -3,-42 5,-42 5,-56 14,-56 14,-39 23,-39 23,-46 32,-46 31,-27 Z','#d3ae57',1.5,'crown');d.path('M -29,-32 L 29,-32',width=1,name='crown-band')
 if o.get('guides'):
  d.ellipse(-4 if v=='profile' else 0,-17,34,33,'none',.6,'skull-guide','#2c9fb4')
  axis=18 if v=='profile' else 12 if v=='threequarter' else 0
  ey=11 if v=='down' else -16 if v=='up' else -5
  d.path(f'M {axis},-49 Q {axis+7 if v=="threequarter" else axis},{ey} {axis},45 M -39,{ey} Q {axis},{ey+4 if v=="up" else ey} 36,{ey} M -32,14 L 32,14',width=.6,name='landmarks',stroke='#2c9fb4')
 if o.get('neck',True) is False:d.parts=[a for a in d.parts if f'{p}-neck' not in a]
 if o.get('stage')==4:d.path('M -25,23 L -18,34 -8,42 M 25,23 L 18,34 8,42',width=.55,name='jaw-planes')
 if 'stage' in o:
  stage=o['stage'];allowed=['outline','neck','skull-guide','landmarks']
  if stage>=1:allowed+=['ear','eye','iris']
  if stage>=2:allowed+=['nose','nostril']
  if stage>=3:allowed+=['brow','mouth','teeth']
  if stage>=4:allowed+=['planes','chin','age-lines']
  if stage<5:d.parts=[a for a in d.parts if any(f'{p}-{k}' in a for k in allowed)]
 return f'<g id="{escape(p)}" transform="translate({o.get("x",0)} {o.get("y",0)}) rotate({o.get("rotation",0)}) scale({o.get("scale",1)})">'+d.out()+'</g>'
def render_hand(o):
 validate(o);d=Draw(o.get('id','hand'));pose=o.get('pose','fist');skin=o.get('skin','#f5e6d3')
 if pose=='fist':
  d.path('M -16,25 L -19,7 -25,-4 Q -28,-14 -20,-18 L -16,-27 Q -11,-34 -5,-27 Q 2,-35 8,-27 Q 16,-32 21,-23 Q 30,-23 29,-13 L 25,12 15,24 Z',skin,1.8,'outline');d.path('M -20,-18 L -11,-10 5,-8 Q 14,-4 9,4 L -6,3 -14,10 M -14,-24 l 1,13 M -3,-26 l 0,14 M 9,-24 l 0,15 M 20,-21 l -2,14 M -10,18 Q 1,23 14,17',width=1.1,name='fingers')
 elif pose=='open':
  d.path('M -14,29 L -19,8 -28,-3 Q -35,-15 -28,-16 L -14,-2 -16,-32 Q -16,-43 -10,-40 L -5,-16 -4,-44 Q -3,-53 3,-46 L 5,-15 9,-41 Q 12,-49 17,-40 L 15,-12 21,-30 Q 27,-38 29,-28 L 23,3 15,28 Z',skin,1.7,'outline');d.path('M -14,-2 Q -2,1 3,12 M -6,19 Q 5,14 14,17 M -10,-22 l 5,-1 M -3,-29 l 6,0 M 10,-25 l 5,1 M 22,-17 l 4,1',width=.8,name='creases')
 elif pose=='grip':
  d.path('M -15,29 L -20,13 Q -28,0 -24,-15 Q -21,-24 -14,-18 L -9,-5 0,-9 4,-26 Q 8,-33 14,-27 L 17,-9 Q 27,-8 29,0 L 23,23 12,29 Z',skin,1.7,'outline');d.path('M -14,-18 Q -4,-23 2,-16 L 7,0 Q 6,8 -1,6 L -12,-5 M 14,-6 Q 23,-7 25,1 M 11,3 Q 23,1 25,9 M 9,11 Q 21,9 23,17',width=1.1,name='fingers')
 else:raise ValueError('Unsupported hand pose')
 return f'<g id="{escape(o.get("id","hand"))}" transform="translate({o.get("x",0)} {o.get("y",0)}) rotate({o.get("rotation",0)}) scale({o.get("scale",1)})">'+d.out()+'</g>'
