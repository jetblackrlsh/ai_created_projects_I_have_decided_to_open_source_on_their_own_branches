#!/usr/bin/env python3
"""Manga construction workbench: deterministic, editable SVG; no generative model."""
import argparse, copy, hashlib, html, json, math, pathlib, re, subprocess, time, importlib, textwrap
VERSION='0.8.0'
INK='#202029'
# DejaVu Sans advance-width ratios; numeric metrics only, no font asset bundled.
TEXT_WIDTHS={' ': 0.31788, '!': 0.40087, '"': 0.45997, '#': 0.83789, '$': 0.63623, '%': 0.9502, '&': 0.77978, "'": 0.27491, '(': 0.39014, ')': 0.39014, '*': 0.5, '+': 0.83789, ',': 0.31788, '-': 0.36084, '.': 0.31788, '/': 0.33692, '0': 0.63623, '1': 0.63623, '2': 0.63623, '3': 0.63623, '4': 0.63623, '5': 0.63623, '6': 0.63623, '7': 0.63623, '8': 0.63623, '9': 0.63623, ':': 0.33692, ';': 0.33692, '<': 0.83789, '=': 0.83789, '>': 0.83789, '?': 0.53077, '@': 1.0, 'A': 0.68408, 'B': 0.68603, 'C': 0.69825, 'D': 0.77002, 'E': 0.63184, 'F': 0.5752, 'G': 0.77491, 'H': 0.75195, 'I': 0.29492, 'J': 0.29492, 'K': 0.65577, 'L': 0.55712, 'M': 0.8628, 'N': 0.74805, 'O': 0.78711, 'P': 0.60303, 'Q': 0.78711, 'R': 0.69483, 'S': 0.63477, 'T': 0.61084, 'U': 0.73194, 'V': 0.68408, 'W': 0.98877, 'X': 0.68506, 'Y': 0.61084, 'Z': 0.68506, '[': 0.39014, '\\': 0.33692, ']': 0.39014, '^': 0.83789, '_': 0.5, '`': 0.5, 'a': 0.6128, 'b': 0.63477, 'c': 0.54981, 'd': 0.63477, 'e': 0.61523, 'f': 0.35205, 'g': 0.63477, 'h': 0.6338, 'i': 0.27783, 'j': 0.27783, 'k': 0.57911, 'l': 0.27783, 'm': 0.97413, 'n': 0.6338, 'o': 0.61181, 'p': 0.63477, 'q': 0.63477, 'r': 0.41114, 's': 0.521, 't': 0.39209, 'u': 0.6338, 'v': 0.5918, 'w': 0.81788, 'x': 0.5918, 'y': 0.5918, 'z': 0.52491, '{': 0.63623, '|': 0.33692, '}': 0.63623, '~': 0.83789}
def text_width(text,size):return sum(TEXT_WIDTHS.get(c,1.0) for c in text)*size

def wrap_caption(text,maximum,size):
    lines=[]
    for paragraph in text.split('\n'):
        line=''
        for word in paragraph.split():
            trial=(line+' '+word).strip()
            if text_width(trial,size)<=maximum:
                line=trial
            else:
                if line:lines.append(line)
                line=''
                for char in word:
                    if line and text_width(line+char,size)>maximum:lines.append(line);line=''
                    line+=char
        lines.append(line)
    return lines

def esc(x): return html.escape(str(x),quote=True)
def num(x): return f'{float(x):.3f}'.rstrip('0').rstrip('.')
class Drawing:
 def __init__(self): self.parts=[];self.prefix='';self.i=0
 def emit(self,tag,attrs,content=None,id=None):
  attrs=dict(attrs)
  for paint in ['fill','stroke']:
   value=attrs.get(paint)
   if isinstance(value,str) and re.fullmatch(r'#[0-9A-Fa-f]{8}',value):
    attrs[paint]=value[:7];key=paint+'-opacity';attrs[key]=float(attrs.get(key,1))*int(value[7:9],16)/255
  self.i+=1; attrs={'id':self.prefix+'-'+(id or str(self.i)),**attrs}
  s='<'+tag+' '+' '.join(f'{k}="{esc(num(v) if isinstance(v,(int,float)) else v)}"' for k,v in attrs.items())
  self.parts.append(s+('/>' if content is None else '>'+content+'</'+tag+'>'))
 def path(self,d,fill='none',width=2,id=None,stroke=INK): self.emit('path',{'d':d,'fill':fill,'stroke':stroke,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'},id=id)
 def line(self,a,b,width=1,stroke=INK,id=None): self.path(f'M {num(a[0])},{num(a[1])} L {num(b[0])},{num(b[1])}',width=width,stroke=stroke,id=id)
 def poly(self,pts,fill='white',width=1.5,id=None): self.path('M '+' L '.join(f'{num(x)},{num(y)}' for x,y in pts)+' Z',fill,width,id)
 def ellipse(self,x,y,rx,ry,fill='white',width=2,id=None): self.emit('ellipse',{'cx':x,'cy':y,'rx':rx,'ry':ry,'fill':fill,'stroke':INK,'stroke-width':width},id=id)
 def rect(self,x,y,w,h,fill='white',width=1.5,r=0,id=None): self.emit('rect',{'x':x,'y':y,'width':w,'height':h,'rx':r,'fill':fill,'stroke':INK,'stroke-width':width},id=id)
 def text(self,x,y,t,size=16,fill=INK,id=None): self.emit('text',{'x':x,'y':y,'font-family':'DejaVu Sans,sans-serif','font-size':size,'fill':fill},esc(t),id=id)

def project(p,c):
 x,y,z=p; f=c.get('focal',650);d=z+c.get('distance',7)
 if d<=0: raise ValueError('Geometry behind the camera')
 return (c.get('cx',600)+f*x/d,c.get('horizon',340)-f*(y-c.get('eye',1.6))/d)

def box(d,c,x,y,z,w,h,depth,tone='url(#tone)',id='box'):
 # Front z plane, right side and top. Painter order is explicit scene ordering.
 p=lambda a,b,k:project((a,b,k),c)
 d.poly([p(x,y+h,z),p(x+w,y+h,z),p(x+w,y+h,z+depth),p(x,y+h,z+depth)],'white',1.6,id+'-top')
 d.poly([p(x+w,y,z),p(x+w,y+h,z),p(x+w,y+h,z+depth),p(x+w,y,z+depth)],'#d9d9df',1.6,id+'-side')
 d.poly([p(x,y,z),p(x+w,y,z),p(x+w,y+h,z),p(x,y+h,z)],tone,1.6,id+'-front')

def room(d,o,c,guides):
 p=lambda x,y,z:project((x,y,z),c)
 # Back wall, side planes, floor tile guides; all share camera.
 d.poly([p(-5,0,8),p(5,0,8),p(5,5,8),p(-5,5,8)],'#fbfbfd',2,'back-wall')
 for x in [-5,5]: d.line(p(x,0,-2),p(x,0,8),2);d.line(p(x,5,-2),p(x,5,8),1.8)
 for x in range(-5,6): d.line(p(x,0,-2),p(x,0,8),.6,'#9999a3')
 for z in [-2,0,2,4,6,8]: d.line(p(-5,0,z),p(5,0,z),.6,'#9999a3')
 # Large window, generated mullions, leafy silhouette outside.
 a,b=p(-4.5,4.35,7.95),p(-1.25,1.65,7.95)
 d.rect(a[0],a[1],b[0]-a[0],b[1]-a[1],'white',2,id='window')
 for i in [1,2]:d.line((a[0]+(b[0]-a[0])*i/3,a[1]),(a[0]+(b[0]-a[0])*i/3,b[1]),1)
 d.line((a[0],(a[1]+b[1])/2),(b[0],(a[1]+b[1])/2),1)
 # Windowsill.
 box(d,c,-4.65,1.55,7.5,3.55,.12,.5,'white','sill')
 # Wall poster original abstract botanical shapes.
 a,b=p(2,4.1,7.9),p(4,2.1,7.9);d.rect(a[0],a[1],b[0]-a[0],b[1]-a[1],'url(#tone)',1.5,id='poster')
 d.ellipse((a[0]+b[0])/2,a[1]+25,12,12,INK,0)
 if guides:
  vx,vy=c.get('cx',600),c.get('horizon',340)
  d.line((0,vy),(1200,vy),1,'#73a6d4','horizon')
  for pt in [(0,0),(1200,0),(0,900),(1200,900)]:d.line(pt,(vx,vy),.8,'#73a6d4')
  d.ellipse(vx,vy,5,5,'#73a6d4',0,'vp')

def furniture(d,o,c,guides):
 x,y,z=o.get('position',[-3,0,2]);k=o['kind'];w=o.get('width',2)
 if k=='desk':
  for xx in [x+.1,x+w-.2]:
   for zz in [z+.1,z+1.1]:box(d,c,xx,0,zz,.12,1.5,.12,'white','leg'+str(xx)+str(zz))
  box(d,c,x,1.5,z,w,.13,1.4,'white','table')
  for i in range(3):box(d,c,x+.2,1.65+i*.12,z+.2,.7,.1,.55,['white','url(#tone)',INK][i],'book'+str(i))
 elif k=='shelf':
  box(d,c,x,0,z,w,3.8,.55,'url(#tone)','shelf')
  for row in range(3):
   yy=.35+row*1.05
   box(d,c,x+.12,yy,z-.025,w-.24,.08,.55,'white','shelfboard'+str(row))
   for j in range(7):
    ht=.55+(.13*((j+row)%3));box(d,c,x+.2+j*.23,yy+.08,z-.05,.17,ht,.3,('white' if j%3 else '#858591'),f'book{row}-{j}')
 elif k=='chair':
  for xx in [x,x+.9]:
   for zz in [z,z+.8]:box(d,c,xx,0,zz,.1,.9,.1,'white',f'leg{xx}-{zz}')
  box(d,c,x,.85,z,1,.1,.9,'url(#tone)','seat');box(d,c,x,.9,z+.8,1,1,.08,'white','back')
 elif k=='box':box(d,c,x,y,z,w,o.get('height',1),o.get('depth',1),o.get('fill','url(#tone)'))

def phone(d,x,y,w=28,h=51,angle=-10,id='phone'):
 d.parts.append(f'<g id="{d.prefix}-{id}" transform="rotate({angle} {x} {y})">')
 d.rect(x-w/2,y-h/2,w,h,INK,1.8,4,'body');d.rect(x-w/2+3,y-h/2+6,w-6,h-11,'#e9e9ef',.8,1,'screen')
 d.line((x-4,y-h/2+3),(x+4,y-h/2+3),.7,'white','speaker');d.ellipse(x,y+h/2-2,1,1,'white',0,'home');d.parts.append('</g>')

def head(d,o,guides):
 turn=o.get('turn',0);expr=o.get('expression','calm');hair=o.get('hair','swept')
 # Original silhouette; facial landmark displacement is a limited pseudo-three-quarter approximation.
 if hair=='long':d.path('M -43,46 C -66,75 -58,146 -69,180 Q -24,198 42,180 C 64,141 59,85 42,46 Z',INK,2,'hair-back')
 d.path('M -16,111 L -16,139 Q 0,151 19,137 L 16,110','white',2,'neck')
 d.path('M -16,113 Q 0,131 17,114 L 16,129 Q 0,140 -16,126 Z','url(#tone)',0,'neck-shadow')
 d.ellipse(-45,81,8,14,'white',1.7,'ear-left');d.ellipse(45,81,8,14,'white',1.7,'ear-right')
 d.path('M -44,69 C -45,33 -21,18 4,20 C 39,21 47,42 44,73 L 37,98 Q 23,117 0,128 Q -27,112 -38,95 Z','white',2.5,'face')
 for x in [-46,46]:d.path(f'M {x},75 q {-5 if x>0 else 5},1 0,14',width=1,id='ear-detail'+str(x))
 # Eyes have white mass, dark upper lids, pupils/highlights. Relative shift gives a turn cue.
 for side in [-1,1]:
  saved_prefix=d.prefix;d.prefix=saved_prefix+('-left' if side<0 else '-right')
  x=side*22+turn*8; narrow=1-abs(turn)*(.22 if side*turn<0 else .05)
  d.parts.append(f'<g id="{d.prefix}-eye-{side}" transform="translate({x} 77) scale({narrow} 1)">')
  if expr=='closed': d.path('M -13,0 Q 0,9 13,0',width=3,id='closed-lid')
  else:
   d.path('M -14,0 Q -3,-10 12,-2 Q 10,12 -2,12 Q -11,10 -14,0 Z','white',1,'eye-white')
   d.ellipse(1+turn*2,3,6.5,9,INK,0,'iris');d.ellipse(2,6,3,4,'#777780',0,'iris-light');d.ellipse(-1,-1,2.5,3,'white',0,'catchlight')
   d.path('M -15,0 Q -2,-11 13,-2',width=3.4,id='upper-lid');d.path('M -9,11 Q -1,14 7,10',width=.8,id='lower-lid')
  d.path('M -13,-15 Q 0,-21 12,-15' if expr!='serious' else ('M -13,-20 L 12,-12' if side<0 else 'M -13,-12 L 12,-20'),width=1.7,id='brow')
  d.parts.append('</g>');d.prefix=saved_prefix
 d.path(f'M {turn*11+2},84 l -3,12 5,2',width=1.1,id='nose')
 if expr=='smile':d.path('M -10,107 Q 2,119 13,105 Q 1,111 -10,107 Z','white',1.3,'mouth')
 elif expr=='surprised':d.ellipse(turn*5,110,4,6,'white',1.3,'mouth')
 else:d.path(f'M {-7+turn*5},109 q 8,{-2 if expr=="serious" else 3} 16,-1',width=1.2,id='mouth')
 for side in [-1,1]:
  for j in range(3):d.line((side*30+j*3,95),(side*30+j*3-1,99),.65,'#777780')
 if hair=='bob':
  d.path('M -43,89 L -53,109 Q -63,53 -34,27 Q 2,3 35,27 Q 62,49 52,111 L 37,102 L 42,64 Q 13,64 -3,38 Q -9,65 -44,73 Z',INK,2,'hair')
  for x in [-42,-32,35,44]:d.path(f'M {x},45 Q {x-6},72 {x},96',width=.8,stroke='#b6b6c0')
 else:
  d.path('M -44,91 L -54,71 L -48,46 L -60,50 L -42,30 L -48,20 L -18,21 Q -6,1 20,11 L 14,21 Q 41,15 53,37 L 49,65 L 39,85 L 35,53 L 22,65 L 19,36 Q 2,62 -17,76 L -9,42 Q -27,65 -42,64 Z',INK,2,'hair')
  for path in ['M -38,38 Q -27,29 -14,30','M -28,51 Q -14,37 -7,28','M 1,28 Q 9,20 19,20','M 31,29 Q 40,33 43,44'] :d.path(path,width=1,stroke='#aaaab4')
 if guides:
  d.ellipse(0,66,45,52,'none',.9,'cranium-guide');d.path('M 0,15 L 0,130 M -52,77 L 52,77',width=1,stroke='#4c94c6',id='face-guides')

def character(d,o,guides):
 x,y=o.get('position',[600,160]);scale=o.get('scale',1);pose=o.get('pose','phone')
 d.parts.append(f'<g transform="translate({x} {y}) scale({scale})">')
 # Six head units, with asymmetrical stance. Limbs built from joint positions and tapered envelopes.
 d.ellipse(4,616,88,13,'#dedee4',0,'ground-shadow')
 d.path('M -45,345 L -49,454 L -38,579 L -7,579 L 6,461 L 12,359 Z','url(#tone)',2.4,'left-trouser')
 d.path('M 5,355 L 8,461 L 29,579 L 61,575 L 53,447 L 48,345 Z','#555562',2.4,'right-trouser')
 for p in ['M -33,365 L -20,449 L -28,543','M 24,375 L 30,450 L 47,551','M -42,466 L -28,479','M 20,468 L 37,478']:d.path(p,width=1.2)
 d.path('M -39,572 L -6,572 L -3,596 Q -10,611 -58,607 L -65,599 Z','white',2.3,'left-shoe')
 d.path('M 27,571 L 57,570 L 71,595 Q 71,608 29,608 L 17,599 Z','white',2.3,'right-shoe')
 for xx in [-37,30]:
  for yy in [583,589,595]:d.line((xx,yy),(xx+18,yy-2),1)
 d.path('M -64,160 Q -34,140 -18,137 L 18,137 Q 43,142 63,162 L 47,247 L 53,360 Q 1,382 -53,358 L -45,245 Z','white',2.8,'torso')
 d.path('M -17,139 L 0,159 L 19,138 L 30,163 L 17,207 L -10,204 L -30,163 Z','url(#tone)',1.6,'collar')
 d.path('M -12,166 L -15,361 M 19,176 L 23,362',width=1.2,id='jacket-seams')
 for yy in [221,267,312]:d.ellipse(13,yy,2,2,INK,0)
 for p in ['M -45,248 l 14,13 -17,7','M 41,267 l -11,11 14,8','M -37,329 l 16,-7','M 28,330 l 16,7'] :d.path(p,width=1.2)
 d.path('M -64,161 Q -84,169 -87,209 L -91,291 L -75,350 L -50,342 L -61,285 L -45,213 Z','white',2.5,'left-sleeve')
 d.path('M -75,341 L -75,367 Q -70,386 -61,382 L -55,370 L -54,345 Z','white',1.7,'left-hand')
 for xx in [-69,-64,-59]:d.line((xx,360),(xx,374),.8)
 if pose=='phone':
  d.path('M 58,160 Q 79,164 85,201 L 98,259 Q 98,277 82,278 L 29,235 L 41,214 L 71,236 L 57,198 Z','white',2.5,'right-sleeve')
  phone(d,28,204,28,53,-15)
  d.path('M 30,223 Q 17,221 16,211 L 21,200 Q 24,198 27,202 L 28,212 L 38,204 Q 45,204 43,213 L 39,229 Z','white',1.6,'right-hand')
  for j in range(3):d.path(f'M {26+j*3},{211+j*3} l 10,-4',width=.8)
 elif pose=='wave':
  d.path('M 60,159 Q 83,161 91,187 L 110,159 L 122,120 L 145,126 L 132,183 Q 113,227 90,226 Q 70,224 56,199 Z','white',2.5,'right-sleeve')
  d.path('M 124,122 L 118,105 Q 112,91 118,87 L 126,99 L 124,72 Q 127,65 131,73 L 135,96 L 138,66 Q 142,61 145,69 L 146,97 L 153,75 Q 158,71 159,80 L 155,103 Q 166,87 169,94 L 160,115 L 144,129 Z','white',1.5,'right-hand')
 else:
  d.path('M 60,159 Q 88,165 89,208 L 79,293 L 61,347 L 37,339 L 55,285 L 49,212 Z','white',2.5,'right-sleeve')
  d.path('M 39,338 L 37,363 Q 40,382 49,380 L 59,363 L 62,343 Z','white',1.6,'right-hand')
 head(d,o,guides)
 if guides:
  for yy in range(0,601,100):d.line((-100,yy),(100,yy),.7,'#70a5d2')
  right_joints={'phone':[(60,180),(88,264),(34,223)],'wave':[(60,175),(98,205),(134,122)],'rest':[(60,180),(70,285),(50,360)]}[pose]
  bones=[((0,135),(0,355)),((-60,163),(-75,285)),((-75,285),(-63,360)),((0,355),(-24,455)),((-24,455),(-24,578)),((0,355),(30,450)),((30,450),(43,578))]
  bones.extend(zip(right_joints,right_joints[1:]))
  for j,(a,b) in enumerate(bones):d.line(a,b,1,'#4c94c6',id='bone-'+str(j))
 d.parts.append('</g>')

def pressure_stroke(d,o):
    """Piecewise-smooth Catmull-Rom centerline with an explicit width envelope."""
    pts=o['points']; samples=[]
    for i in range(len(pts)-1):
        p0,p1,p2,p3=pts[max(0,i-1)],pts[i],pts[i+1],pts[min(len(pts)-1,i+2)]
        for j in range(16):
            t=j/16
            xy=[.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t*t+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t*t*t) for k in [0,1]]
            samples.append((*xy,p1[2]*(1-t)+p2[2]*t))
    samples.append(tuple(pts[-1]));left=[];right=[]
    for i,(x,y,w) in enumerate(samples):
        a=samples[max(0,i-1)];b=samples[min(len(samples)-1,i+1)];dx=b[0]-a[0];dy=b[1]-a[1];length=math.hypot(dx,dy) or 1
        nx,ny=-dy/length*w/2,dx/length*w/2;left.append((x+nx,y+ny));right.append((x-nx,y-ny))
    d.poly(left+right[::-1],o.get('fill',INK),0,'pressure-contour')

def module_for(kind):
    names={'cinematic_portal':'cinematic_composition','cinematic_stage':'cinematic_stage','cinematic_power':'cinematic_action','magical_focus':'transformation_props','magical_energy':'transformation_props','transformation_hero':'transformation_heroes','team_helmet':'sentai_design','team_suit':'sentai_design','portrait_v2':'characters','figure':'characters','hand':'characters','chibi':'characters','world':'perspective','prop':'ink_props','effect':'ink_props','action_figure':'action_characters','action_effect':'action_effects','action_sound':'action_effects','action_prop':'action_camera','creature':'creatures','fantasy_prop':'fantasy_props','magic_sigil':'fantasy_props','fantasy_world':'fantasy_world','cloth':'cloth','hero':'superheroes','mecha':'scifi','expressive_hand':'grips','held_prop':'grips','power_form':'transform_effects','interaction_figure':'interaction_figures','organic_world':'organic_world'}
    return importlib.import_module('modules.'+names[kind]) if kind in names else None

def walk_objects(objects):
    for obj in objects:
        yield obj
        if obj.get('kind')=='panel':
            yield from walk_objects(obj.get('objects',[]))

def validate(s,_depth=0,_ids=None):
    if _depth>4: raise ValueError("Panels may nest at most four levels")
    def number(v):
        return type(v) in (int,float) and math.isfinite(v)
    def vector(v,n):
        return isinstance(v,list) and len(v)==n and all(number(x) for x in v)
    if not isinstance(s,dict) or type(s.get('version')) is not int or s['version']!=1:
        raise ValueError('version must equal integer 1')
    if set(s)-{'version','canvas','camera','objects'}:
        raise ValueError('Unknown scene field')
    canvas=s.get('canvas',[1200,900])
    if not isinstance(canvas,list) or len(canvas)!=2 or any(type(v) is not int or not 64<=v<=8192 for v in canvas):
        raise ValueError('Canvas requires two integer dimensions, each 64..8192')
    camera=s.get('camera',{})
    if not isinstance(camera,dict) or set(camera)-{'cx','horizon','focal','distance','eye'} or any(not number(v) for v in camera.values()):
        raise ValueError('Invalid camera fields')
    if camera.get('focal',650)<=0 or camera.get('distance',7)<=2:
        raise ValueError('Camera focal must be positive and distance greater than 2')
    if not isinstance(s.get('objects'),list) or len(s['objects'])>1000:
        raise ValueError('objects must be an array of at most 1000 elements')
    spec={
        'room':set(), 'desk':{'position','width'}, 'chair':{'position'},
        'shelf':{'position','width'}, 'box':{'position','width','height','depth','fill'},
        'character':{'position','scale','pose','hair','expression','turn'},
        'head':{'position','scale','hair','expression','turn'},
        'phone':{'position','width','height','angle'},
        'path':{'d','fill','stroke','width'},
        'ellipse':{'position','radii','fill','width'},
        'text':{'position','text','size'},
        'panel':{'position','size','viewbox','objects','border','corners'},
        'balloon':{'position','size','text','font_size','tail'},
        'caption':{'position','size','text','font_size'},
        'brush':{'points','fill'},
    }
    ids={'tone','page'} if _ids is None else _ids
    for o in s['objects']:
        if not isinstance(o,dict) or not isinstance(o.get('id'),str) or not re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]*',o['id']):
            raise ValueError('Object requires a safe string id')
        if o['id'] in ids: raise ValueError('Duplicate or reserved object id')
        ids.add(o['id'])
        kind=o.get('kind')
        if not isinstance(kind,str): raise ValueError('Unsupported object kind')
        module=module_for(kind)
        if module is not None:
            module.validate_object(o)
            continue
        if kind not in spec: raise ValueError('Unsupported object kind')
        if set(o)-spec[kind]-{'id','kind'}: raise ValueError('Unknown or unsupported field on '+o['id'])
        if kind=='brush':
            pts=o.get('points')
            if not isinstance(pts,list) or not 2<=len(pts)<=1000 or any(not vector(p,3) or not 0<=p[2]<=100 for p in pts):raise ValueError('Brush requires 2..1000 [x,y,width] points with nonnegative widths <=100')
        if kind in ['panel','balloon','caption']:
            if not vector(o.get('position'),2) or not vector(o.get('size'),2) or any(v<=0 or v>8192 for v in o['size']):raise ValueError('Positive panel/text-box size and position required')
            if kind=='panel':
                view=o.get('viewbox',o['size'])
                if not vector(view,2) or min(view)<=0:raise ValueError('Invalid panel viewbox')
                if 'border' in o and (not number(o['border']) or not 0<=o['border']<=20):raise ValueError('Invalid border')
                if 'corners' in o:
                    pts=o['corners']
                    if not isinstance(pts,list) or not 3<=len(pts)<=8 or any(not vector(p,2) or not 0<=p[0]<=o['size'][0] or not 0<=p[1]<=o['size'][1] for p in pts):raise ValueError('Panel corners require 3..8 local points within panel size')
                    area=sum(pts[i][0]*pts[(i+1)%len(pts)][1]-pts[(i+1)%len(pts)][0]*pts[i][1] for i in range(len(pts)))
                    if abs(area)<1:raise ValueError('Panel polygon has zero area')
                validate({'version':1,'objects':o.get('objects')},_depth+1,ids)
            else:
                if not isinstance(o.get('text'),str) or len(o['text'])>2000:raise ValueError('Short text required')
                if 'font_size' in o and (not number(o['font_size']) or not 6<=o['font_size']<=100):raise ValueError('Invalid font size')
                if 'tail' in o and not vector(o['tail'],2):raise ValueError('Invalid balloon tail')
            continue
        n=3 if kind in ['desk','chair','shelf','box'] else 2
        if 'position' in o and not vector(o['position'],n): raise ValueError('Invalid position')
        if kind in ['text','ellipse'] and 'position' not in o: raise ValueError('Position required')
        for key in ['width','height','depth','scale','size','angle','turn']:
            if key in o and not number(o[key]): raise ValueError('Invalid numeric field '+key)
        if 'scale' in o and not .05<=o['scale']<=10: raise ValueError('Scale must be 0.05..10')
        for key in ['width','height','depth','size']:
            if key in o and not 0<o[key]<=8192: raise ValueError('Invalid '+key)
        if 'turn' in o and not -1<=o['turn']<=1: raise ValueError('Turn must be -1..1')
        for key,choices in [('pose',['phone','wave','rest']),('hair',['swept','bob','long']),('expression',['calm','smile','serious','surprised','closed'])]:
            if key in o and o[key] not in choices: raise ValueError('Unsupported '+key)
        for key in ['fill','stroke']:
            if key in o and (not isinstance(o[key],str) or not re.fullmatch(r'(none|white|black|#[0-9A-Fa-f]{3}|#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|url\(#tone\))',o[key])):
                raise ValueError('Unsupported paint value')
        if kind=='path' and (not isinstance(o.get('d'),str) or not re.fullmatch(r'[Mm][MmLlHhVvCcSsQqTtAaZz0-9.,eE+\-\s]+',o['d'])):
            raise ValueError('Path must be SVG path syntax beginning with M/m')
        if kind=='ellipse' and (not vector(o.get('radii'),2) or any(v<=0 for v in o['radii'])): raise ValueError('Positive radii required')
        if kind=='text' and (not isinstance(o.get('text'),str) or len(o['text'])>10000): raise ValueError('Text string required, max 10000 characters')
    return s

def draw_objects(d,objects,camera,guides):
    for o in objects:
        d.prefix=o['id'];d.i=0
        d.parts.append(f'<g id="{esc(o["id"])}" data-kind="{o["kind"]}">')
        k=o['kind'];module=module_for(k)
        if module is not None:module.render(d,o,camera,guides)
        elif k=='panel':
            x,y=o['position'];w,h=o['size'];vw,vh=o.get('viewbox',[w,h]);ident=o['id']
            pts=[(x+p[0],y+p[1]) for p in o.get('corners',[[0,0],[w,0],[w,h],[0,h]])]
            poly=' '.join(f'{px},{py}' for px,py in pts)
            d.parts.append(f'<defs><clipPath id="{ident}-clip"><polygon points="{poly}"/></clipPath></defs>')
            d.poly(pts,'white',0,id='paper')
            d.parts.append(f'<g clip-path="url(#{ident}-clip)"><g transform="translate({x} {y}) scale({w/vw} {h/vh})">')
            draw_objects(d,o['objects'],camera,guides)
            d.parts.append('</g></g>');d.prefix=ident;d.poly(pts,'none',o.get('border',2),id='frame')
        elif k in ['balloon','caption']:
            x,y=o['position'];w,h=o['size'];fs=o.get('font_size',18)
            usable=w*.68 if k=='balloon' else w-30
            lines=wrap_caption(o['text'],usable,fs)
            if len(lines)*fs*1.3>(h*.65 if k=='balloon' else h-16):raise ValueError('Text does not fit box; enlarge it or shorten text')
            if k=='balloon':
                if 'tail' in o:
                    tx,ty=o['tail'];cx=x+w/2;cy=y+h/2
                    ang=math.atan2((ty-cy)/(h/2),(tx-cx)/(w/2))
                    bx=cx+math.cos(ang)*w*.42;by=cy+math.sin(ang)*h*.42
                    d.path(f'M {bx-12},{by} L {tx},{ty} L {bx+12},{by} Z','white',1.8,'tail')
                d.ellipse(x+w/2,y+h/2,w/2,h/2,'white',1.8,'outline')
            else:d.rect(x,y,w,h,'white',1.7,id='outline')
            for j,t in enumerate(lines):
                tx=x+(w-text_width(t,fs))/2 if k=='balloon' else x+15
                ty=y+h/2-(len(lines)-1)*fs*.65+fs*.35+j*fs*1.3 if k=='balloon' else y+fs+9+j*fs*1.3
                d.text(tx,ty,t,fs,id='line-'+str(j))
        elif k=='brush':pressure_stroke(d,o)
        elif k=='room':room(d,o,camera,guides)
        elif k in ['desk','shelf','chair','box']:furniture(d,o,camera,guides)
        elif k=='character':character(d,o,guides)
        elif k=='head':
            x,y=o.get('position',[200,100]);sc=o.get('scale',2);d.parts.append(f'<g transform="translate({x} {y}) scale({sc})">');head(d,o,guides);d.parts.append('</g>')
        elif k=='phone':phone(d,*o.get('position',[100,100]),o.get('width',80),o.get('height',150),o.get('angle',0))
        elif k=='path':d.path(o['d'],o.get('fill','none'),o.get('width',2),'stroke',o.get('stroke',INK))
        elif k=='ellipse':d.ellipse(*o['position'],*o['radii'],o.get('fill','white'),o.get('width',2),'ellipse')
        elif k=='text':d.text(*o['position'],o['text'],o.get('size',20),id='text')
        d.parts.append('</g>')

def render(s,guides=False):
    validate(s);w,h=s.get('canvas',[1200,900]);d=Drawing();camera=s.get('camera',{})
    d.parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">', '<defs><pattern id="tone" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#eeeef2"/><circle cx="1" cy="1" r=".65" fill="#888893"/></pattern></defs>']
    d.prefix='page';d.rect(0,0,w,h,'white',0,id='paper')
    draw_objects(d,s['objects'],camera,guides)
    d.parts.append('</svg>');svg='\n'.join(d.parts)
    ids=re.findall(r'\bid="([^"]+)"',svg)
    if len(ids)!=len(set(ids)):raise ValueError('Generated SVG ID collision; rename conflicting scene object')
    return svg

def export(s,out,guides=False,png=False):
 start=time.perf_counter();svg=render(s,guides);out=pathlib.Path(out);out.parent.mkdir(parents=True,exist_ok=True);out.with_suffix('.svg').write_text(svg)
 svgt=time.perf_counter()-start
 if png:subprocess.run(['inkscape',str(out.with_suffix('.svg')),'--export-type=png','--export-filename='+str(out.with_suffix('.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,timeout=90)
 return {'svg_seconds':svgt,'total_seconds':time.perf_counter()-start,'svg_sha256':hashlib.sha256(svg.encode()).hexdigest()}

def main():
 p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='cmd',required=True)
 r=sub.add_parser('render');r.add_argument('scene');r.add_argument('--out',required=True);r.add_argument('--guides',action='store_true');r.add_argument('--png',action='store_true')
 e=sub.add_parser('patch');e.add_argument('scene');e.add_argument('--object',required=True);e.add_argument('--set',action='append',required=True);e.add_argument('--out',required=True)
 i=sub.add_parser('inspect');i.add_argument('scene')
 a=p.parse_args();s=validate(json.loads(pathlib.Path(a.scene).read_text()))
 if a.cmd=='render':print(json.dumps(export(s,a.out,a.guides,a.png),indent=2))
 elif a.cmd=='inspect':print(json.dumps({'version':VERSION,'objects':[{k:o[k] for k in ['id','kind']} for o in walk_objects(s['objects'])]},indent=2))
 else:
  obj=next((o for o in walk_objects(s['objects']) if o['id']==a.object),None)
  if obj is None:raise ValueError('Unknown object')
  for change in a.set:
   key,val=change.split('=',1)
   if key in ['id','kind']:raise ValueError('Patching id/kind is not supported')
   try:val=json.loads(val)
   except json.JSONDecodeError:pass
   obj[key]=val
  validate(s);pathlib.Path(a.out).write_text(json.dumps(s,indent=2)+'\n')
if __name__=='__main__':main()
