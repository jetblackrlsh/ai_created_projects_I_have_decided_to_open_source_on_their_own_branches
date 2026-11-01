"""Screen-composed destination windows. Not a physically recursive 3D portal."""
import math
from . import cinematic_stage as stage
KINDS={'cinematic_portal'}
def validate_object(o):
 if o.get('kind')not in KINDS:return False
 if set(o)-{'id','kind','position','size','destination','shot'}:raise ValueError('Unknown portal field')
 for k in ['position','size']:
  if not isinstance(o.get(k),list)or len(o[k])!=2 or not all(type(v)in(int,float)and math.isfinite(v)and abs(v)<=10000 for v in o[k]):raise ValueError('Finite pair required: '+k)
 if any(v<30 or v>2000 for v in o['size']):raise ValueError('Portal size30..2000')
 for k,choices,default in [('destination',stage.LOCATIONS,'greenhouse'),('shot',stage.SHOTS,'wide')]:
  if not isinstance(o.get(k,default),str)or o.get(k,default)not in choices:raise ValueError('Invalid '+k)
 return True

def render(d,o,camera=None,guides=False):
 validate_object(o);x,y=o['position'];w,h=o['size'];ident=d.prefix
 d.parts.append(f'<defs><clipPath id="{ident}-window-clip"><ellipse cx="{w/2}" cy="{h/2}" rx="{w/2-6}" ry="{h/2-6}"/></clipPath></defs><g transform="translate({x} {y})"><g clip-path="url(#{ident}-window-clip)">')
 old=d.prefix;d.prefix=ident+'-destination';stage.render(d,{'kind':'cinematic_stage','location':o.get('destination','greenhouse'),'shot':o.get('shot','wide'),'size':[w,h],'foreground':False},None,False);d.prefix=old;d.parts.append('</g>')
 d.ellipse(w/2,h/2,w/2-5,h/2-5,'none',5,'outer-rim');d.ellipse(w/2,h/2,w/2-11,h/2-11,'none',1,'inner-rim')
 for i in range(8):
  a=i*math.pi/4;px=w/2+(w/2-2)*math.cos(a);py=h/2+(h/2-2)*math.sin(a);d.path(f'M {px-3},{py} L {px},{py-7} L {px+3},{py} L {px},{py+7} Z','#d9c8ef',1,f'rune{i}')
 if guides:d.line((w/2,0),(w/2,h),.7,'#5899b5','axis')
 d.parts.append('</g>')
