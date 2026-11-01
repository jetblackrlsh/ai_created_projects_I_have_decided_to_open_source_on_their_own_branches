"""Original geometric fantasy props; authored forms, not generated/borrowed images.
Local coordinate drawing makes geometry editable. Decorative glyphs are invented.
Magic ring exercise adapts https://tips.clip-studio.com/en-us/articles/1910
(rings, radial repetition, invented glyphs, glow). Props are transfer studies,
not claims of literal source exercises; layered materials are informed by
https://tips.clip-studio.com/en-us/articles/1638.
"""
import math
KINDS={'fantasy_prop','magic_sigil'}
TYPES={'grimoire','staff','crystal','shield','potion','archway'}
INK='#24232d'
def number(v):return type(v) in (int,float) and math.isfinite(v)
def validate_object(o):
 if o.get('kind') not in KINDS:raise ValueError('Unknown fantasy kind')
 if not isinstance(o.get('position'),list) or len(o['position'])!=2 or not all(number(v) and abs(v)<=100000 for v in o['position']):raise ValueError('Position needs two finite coordinates')
 allowed={'id','kind','position','angle'}
 if not number(o.get('angle',0)) or not -180<=o.get('angle',0)<=180:raise ValueError('Angle must be -180..180')
 if o['kind']=='fantasy_prop':
  allowed|={'subtype','scale','detail'}
  if not isinstance(o.get('subtype'),str) or o['subtype'] not in TYPES:raise ValueError('Unsupported fantasy prop')
  if not number(o.get('scale',1)) or not .05<=o.get('scale',1)<=8:raise ValueError('Scale must be .05..8')
  if o.get('detail','ornate') not in ['simple','ornate']:raise ValueError('Detail simple/ornate only')
 else:
  allowed|={'radius','spokes','glow'}
  if not number(o.get('radius',100)) or not 20<=o.get('radius',100)<=500:raise ValueError('Sigil radius must be20..500')
  if type(o.get('spokes',8)) is not int or not 3<=o.get('spokes',8)<=24:raise ValueError('Spokes integer3..24')
  if type(o.get('glow',False)) is not bool:raise ValueError('Glow must be boolean')
 if set(o)-allowed:raise ValueError('Unknown fantasy field')
 return o

def crystal(d,cx=0,cy=0,s=1,p='crystal'):
 def pts(v):return [(cx+x*s,cy+y*s) for x,y in v]
 d.poly(pts([(0,-85),(37,-35),(29,65),(0,91),(-32,56),(-37,-31)]),'white',2.5,p+'-outer')
 d.poly(pts([(0,-85),(5,-20),(0,91),(-32,56),(-37,-31)]),'#dddde5',1,p+'-shade')
 d.poly(pts([(0,-85),(37,-35),(5,-20)]),'#f4f4f8',1,p+'-cap')
 d.path(f'M {cx+5*s},{cy-20*s} L {cx+29*s},{cy+65*s} M {cx+16*s},{cy-17*s} L {cx+13*s},{cy+37*s}',width=1,id=p+'-facets')

def render(d,o,camera=None,guides=False):
 validate_object(o);x,y=o['position'];a=o.get('angle',0);sc=o.get('scale',1);ident=d.prefix
 d.parts.append(f'<g transform="translate({x} {y}) rotate({a}) scale({sc})">')
 if o['kind']=='magic_sigil':
  r=o.get('radius',100);n=o.get('spokes',8)
  if o.get('glow',False):
   d.parts.append(f'<defs><radialGradient id="{ident}-glow"><stop offset="0" stop-color="#b6bedc" stop-opacity="0.42"/><stop offset="0.7" stop-color="#b6bedc" stop-opacity="0.18"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>')
   d.ellipse(0,0,r*1.2,r*1.2,f'url(#{ident}-glow)',0,'halo')
  for j,rr in enumerate([r,r*.91,r*.67]):d.ellipse(0,0,rr,rr,'none',2 if j!=1 else .7,'ring-'+str(j))
  for j in range(n):
   theta=math.tau*j/n;cx,cy=math.cos(theta),math.sin(theta)
   d.line((r*.67*cx,r*.67*cy),(r*.91*cx,r*.91*cy),1,id='spoke-'+str(j))
   # Invented stroke glyph, deliberately not a real alphabet or borrowed symbol.
   ga=theta+math.pi/n;px,py=r*.79*math.cos(ga),r*.79*math.sin(ga);sz=r*.045
   d.path(f'M {px-sz},{py-sz} L {px},{py+sz} L {px+sz},{py-sz} M {px-sz},{py} L {px+sz},{py}',width=1.3,id='glyph-'+str(j))
  tri=[(math.cos(math.tau*j/3-math.pi/2)*r*.62,math.sin(math.tau*j/3-math.pi/2)*r*.62) for j in range(3)]
  d.poly(tri,'none',1.5,'triangle');d.ellipse(0,0,r*.22,r*.22,'white',1.4,'core');crystal(d,0,0,r*.002,'core-gem')
  if guides:d.path(f'M {-r},0 H {r} M 0,{-r} V {r}',width=.7,stroke='#7398b5',id='axes')
  d.parts.append('</g>');return
 typ=o['subtype'];ornate=o.get('detail','ornate')=='ornate'
 if typ=='grimoire':
  d.path('M -76,-104 L 58,-121 L 83,-98 L 83,104 L -54,123 L -76,100 Z','#dddde5',2.5,'book-volume')
  d.path('M -54,-83 L 83,-98 L 83,104 L -54,123 Z','white',2,'page-block')
  for j in range(7):d.path(f'M -49,{92+j*4} L 77,{74+j*4}',width=.6,id='page-'+str(j))
  d.path('M -76,-104 L 58,-121 L 58,78 L -76,100 Z','#35333e',3,'cover')
  d.path('M -64,-91 L 46,-105 L 46,66 L -64,83 Z','none',1, id='cover-border',stroke='#e1dfe9')
  d.path('M -76,-80 L -61,-82 M -76,67 L -61,65',width=4,id='spine-bands',stroke='#aaa8b3')
  d.path('M 40,-5 L 77,-9 L 77,17 L 40,21 Z','url(#tone)',2,'clasp');d.ellipse(57,5,4,4,INK,0,'rivet')
  if ornate:
   d.path('M -11,-55 L 22,-20 L -11,28 L -43,-10 Z','none',2,id='seal',stroke='#eeeef4')
   for j in range(4):d.line((-36,40+j*6),(11,34+j*6),.8,'#bcb9c8','inscription-'+str(j))
 elif typ=='staff':
  d.path('M -7,-10 L -11,158 L 0,171 L 10,157 L 7,-10 Z','url(#tone)',2,'shaft')
  d.path('M -18,-34 Q -73,-61 -37,-117 L -20,-135 L -29,-104 Q -52,-66 -14,-52 M 18,-34 Q 73,-61 37,-117 L 20,-135 L 29,-104 Q 52,-66 14,-52','white',3,'prongs')
  crystal(d,0,-84,.42,'focus-gem')
  d.path('M -18,-35 L 18,-35 L 13,-10 L -13,-10 Z','#35333e',2,'socket')
  for j in range(5):d.path(f'M -9,{70+j*9} L 9,{63+j*9}',width=2,id='grip-'+str(j))
  if ornate:
   d.path('M -20,-25 Q -49,20 -28,50 Q -15,60 -19,18 M 20,-25 Q 45,8 34,28','none',1.5,'ribbons')
   d.ellipse(34,34,6,8,'white',1,'charm')
 elif typ=='crystal':
  d.path('M -64,98 L -80,64 L -48,41 L 55,53 L 76,95 L 27,118 Z','url(#tone)',2,'stone-base')
  crystal(d,-35,35,.55,'small-left');crystal(d,36,22,.7,'small-right');crystal(d,0,-15,1,'main')
  if ornate:
   for j,(px,py) in enumerate([(-65,-50),(60,-75),(62,0)]):d.path(f'M {px-7},{py} H {px+7} M {px},{py-10} V {py+10}',width=1.2,id='glint-'+str(j))
 elif typ=='shield':
  d.path('M -91,-109 Q 0,-150 91,-109 L 82,20 Q 65,93 0,132 Q -65,93 -82,20 Z','#34313d',3,'rim')
  d.path('M -76,-97 Q 0,-128 76,-97 L 67,17 Q 52,78 0,113 Q -52,78 -67,17 Z','white',2,'plate')
  d.path('M 0,-112 L 0,113 Q -52,78 -67,17 L -76,-97 Q -40,-110 0,-112 Z','url(#tone)',0,'plate-shade')
  if ornate:d.path('M 0,-72 L 17,-17 L 49,-27 L 26,8 L 41,50 L 0,29 L -41,50 L -26,8 L -49,-27 L -17,-17 Z','#34313d',2,'crest')
  for j,(px,py) in enumerate([(-75,-101),(75,-101),(-64,30),(64,30),(0,115)]):d.ellipse(px,py,4,4,'white',1,'rivet-'+str(j))
 elif typ=='potion':
  d.path('M -26,-91 L -27,-38 Q -92,-12 -81,62 Q -73,110 0,113 Q 73,110 81,62 Q 92,-12 27,-38 L 26,-91 Z','white',2.5,'glass')
  d.path('M -75,28 Q 0,52 75,28 Q 82,102 0,105 Q -82,102 -75,28 Z','url(#tone)',1,'liquid')
  d.path('M -59,10 Q -76,56 -49,78 M -49,-12 L -44,-21','none',5,'glass-highlight',stroke='#d5d5df')
  d.path('M -32,-94 L 32,-94 L 29,-68 L -29,-68 Z','#aaa7b3',2,'cork')
  d.ellipse(0,-94,32,7,'url(#tone)',1.3,'cork-top')
  if ornate:
   d.path('M -35,-58 Q 0,-48 35,-58 M 12,-54 L 45,-12','none',2,'neck-cord')
   d.path('M 36,-17 L 61,-11 L 56,15 L 31,9 Z','white',1.5,'tag');d.path('M 41,-6 L 51,4 M 51,-4 L 40,3',width=1,id='tag-mark')
 elif typ=='archway':
  d.path('M -110,145 L -110,-30 Q -110,-150 0,-150 Q 110,-150 110,-30 L 110,145 L 75,145 L 75,-30 Q 75,-112 0,-112 Q -75,-112 -75,-30 L -75,145 Z','url(#tone)',2.5,'arch-stones')
  for j in range(5):
   yy=-20+j*34;d.path(f'M -110,{yy} L -75,{yy} M 75,{yy} L 110,{yy}',width=1.2,id='block-'+str(j))
  for j in range(7):
   theta=math.pi+math.pi*j/6;d.line((math.cos(theta)*75,-30+math.sin(theta)*82),(math.cos(theta)*110,-30+math.sin(theta)*120),1.2,id='arch-joint-'+str(j))
  d.path('M -123,145 H 123 M -125,151 H 125',width=2,id='threshold')
  if ornate:
   d.path('M -102,10 L -91,28 L -100,49 L -89,78 M 87,-5 L 100,18 L 91,46',width=1,id='weather-cracks')
   d.path('M -111,128 Q -149,101 -133,62 Q -109,42 -119,5','none',2,'vine')
   for j,(px,py) in enumerate([(-130,91),(-130,64),(-119,33)]):d.path(f'M {px},{py} q -25,-30 -26,-4 q 9,16 26,4 Z','white',1,id='leaf-'+str(j))
 if guides:
  bounds={'grimoire':(-76,-121,159,244),'staff':(-55,-135,110,306),'crystal':(-80,-100,160,218),'shield':(-91,-150,182,282),'potion':(-81,-101,162,214),'archway':(-110,-150,220,295)}[typ]
  bx,by,bw,bh=bounds;d.path(f'M {bx},{by} h {bw} v {bh} h {-bw} Z M 0,{by} V {by+bh}',width=.6,stroke='#7398b5',id='construction-box')
  if typ in ['potion','shield','crystal']:d.path(f'M {bx},0 H {bx+bw}',width=.6,stroke='#7398b5',id='cross-axis')
 d.parts.append('</g>')
