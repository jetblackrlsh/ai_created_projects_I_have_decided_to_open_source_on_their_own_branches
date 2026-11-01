"""Original reusable location geometry and explicit camera presets.
Environment camera is genuinely projective. OTS foreground is an authored 2D
silhouette, not a projected actor. Rendering uses bounded face-depth sorting.
"""
import math,random
from . import perspective as p
KINDS={'cinematic_stage'}
LOCATIONS={'bridge','greenhouse','ravine'}
SHOTS={'wide','medium','close','high','low','ots'}
INK='#253347'
def landmarks(location):
    if location not in LOCATIONS:raise ValueError('Unknown location')
    return {'hero':[0,0,0],'partner':[-1.5,0,1.5],'opponent':[0,0,4],'gate':[0,0,7],'beacon':[2.7,0,4.5],'near_gap':[0,0,2.5],'far_gap':[0,0,6]}
def camera_for(location,shot='wide',size=(800,480)):
    if location not in LOCATIONS or shot not in SHOTS:raise ValueError('Unknown camera preset')
    positions={'wide':[12,8,-17],'medium':[6,4.3,-9],'close':[3.4,2.6,-3.8],'high':[8,15,-9],'low':[4,.7,-8],'ots':[-2.6,2.1,-5.5]}
    targets={'wide':[0,1,3],'medium':[0,1.5,2],'close':[0,1.5,1],'high':[0,0,2],'low':[0,2.8,4],'ots':[0,1.8,4]}
    return {'position':positions[shot][:],'target':targets[shot][:],'focal':min(size[0]*.88,size[1]*1.65),'center':[size[0]*.5,size[1]*.53],'near':.15}
def project_anchor(location,name,shot='wide',size=(800,480),camera=None):
    return p.project(landmarks(location)[name],camera or camera_for(location,shot,size))
def validate_object(o):
    if o.get('kind')!='cinematic_stage':return False
    if set(o)-{'id','kind','location','shot','size','camera','foreground','state'}:raise ValueError('Unknown cinematic stage field')
    for key,choices in [('location',LOCATIONS),('shot',SHOTS),('state',{'intact','damaged'})]:
        if key in o and(not isinstance(o[key],str)or o[key]not in choices):raise ValueError('Invalid '+key)
    sz=o.get('size',[800,480])
    if not isinstance(sz,list)or len(sz)!=2 or not all(type(v)in(int,float)and math.isfinite(v)and 50<=v<=8192 for v in sz):raise ValueError('size requires two finite dimensions')
    if 'foreground'in o and type(o['foreground'])is not bool:raise ValueError('foreground requires boolean')
    if 'camera'in o:p.validate_object({'kind':'world','camera':o['camera'],'items':[]})
    return True

def beam(w,a,b,r,id,fill):
    axis=p.unit(p.sub(b,a));ref=(0,1,0)if abs(axis[1])<.9 else(1,0,0);u=p.mul(p.unit(p.cross(axis,ref)),r);v=p.mul(p.cross(axis,p.unit(u)),r)
    ring=lambda c:[p.add(c,p.add(p.mul(u,x),p.mul(v,y)))for x,y in [(-1,-1),(1,-1),(1,1),(-1,1)]]
    aa,bb=ring(a),ring(b)
    for i in range(4):w.face([aa[i],aa[(i+1)%4],bb[(i+1)%4],bb[i]],fill,1,id+'-side'+str(i))
    w.face(aa[::-1],fill,1,id+'-cap0');w.face(bb,fill,1,id+'-cap1')
def shard(w,x,y,z,sx,sy,sz,id,fill='#d7f0ed'):
    base=[(x-sx,y,z-sz),(x+sx,y,z-sz*.7),(x+sx*.8,y,z+sz),(x-sx*.8,y,z+sz*.7)];tip=(x+sx*.25,y+sy,z)
    for i in range(4):w.face([base[i],base[(i+1)%4],tip],[fill,'#86bdca','#effafa','#acd5dc'][i],1.2,id+'-facet'+str(i))
def vine(w,points,id):
    for i,(a,b)in enumerate(zip(points,points[1:])):
        beam(w,a,b,.06,id+'-stem'+str(i),'#506b55')
        x,y,z=b;w.face([(x,y,z),(x-.5,y+.15,z+.12),(x-.3,y+.5,z+.12),(x+.05,y+.25,z)],'#728e62',1,id+'-leaf'+str(i))
def build_world(location,camera,state='intact'):
    if state not in {'intact','damaged'}:raise ValueError('Invalid state')
    w=p.World(camera)
    if location=='bridge':
        # City across the canal; fixed geometry persists under all cameras.
        w.box((-20,-2,12),(45,2,22),'far-quay','#b9b7b2')
        w.box((-5,-2,-8),(10,2,5),'near-quay','#b9b7b2')
        for i,(x,z,h)in enumerate([(-10,17,9),(-5,20,15),(0,19,10),(5,23,17),(10,19,12),(14,23,8)]):
            w.box((x,-2,z),(3,h,3),'city'+str(i),'#d1dbe4',(3,max(2,int(h//2))))
        w.face([(-35,-2,-15),(35,-2,-15),(35,-2,40),(-35,-2,40)],'#7896ac',0,'canal')
        for z in range(-3,12):
            if state=='damaged' and 3<=z<=5:continue
            w.box((-3,-.25,z),(6,.25,.98),'deck'+str(z),'#d8d3ce')
        for z in [1,7]:w.box((-2.3,-3,z),(4.6,2.75,1.2),'bridge-pier'+str(z),'#7f8e9c')
        for side in [-1,1]:
            x=side*3
            for z in [-3,0,3,6,9,12]:w.box((x-.12,0,z),(.24,1.2,.24),'railpost'+str(side)+'-'+str(z),INK)
            if state=='damaged':
                beam(w,(x,1.2,-3),(x,1.2,3),.09,'rail-near'+str(side),INK)
                beam(w,(x,1.2,6),(x,1.2,12),.09,'rail-far'+str(side),INK)
            else:beam(w,(x,1.2,-3),(x,1.2,12),.09,'rail'+str(side),INK)
            for z in [3,8]:
                w.box((x-.35,0,z),(.7,5,.7),'tower'+str(side)+'-'+str(z),'#6c869a')
                beam(w,(x,4.8,z),(0,6.3,z),.15,'arch'+str(side)+'-'+str(z),'#aab9c3')
                for zz in [z-2,z-1,z+1,z+2]:beam(w,(x,4.5,z),(x,1.2,zz),.025,'cable'+str(side)+'-'+str(z)+'-'+str(zz),INK)
        w.box((2.5,0,4.3),(.4,1.5,.4),'beacon-post',INK)
        w.box((2.35,1.5,4.15),(.7,.6,.7),'beacon-light','#f4cc8b')
    elif location=='greenhouse':
        w.face([(-7,-.15,-5),(7,-.15,-5),(7,-.15,14),(-7,-.15,14)],'#d6d6c4',0,'ground')
        for z in range(-3,12):
            for x in range(-4,5,2):w.box((x, -.1,z),(1.9,.1,.94),'tile'+str(x)+'-'+str(z),'#c3c8b3')
        for side in [-1,1]:
            x=side*4.5
            w.box((x-.15,0,-3),(.3,.65,14),'wallbase'+str(side),'#8c9481')
            for z in [-3,0,3,6,9,12]:
                beam(w,(x,0,z),(x,4,z),.09,'post'+str(side)+'-'+str(z),INK)
                if not(state=='damaged' and side==-1 and z==3):beam(w,(x,4,z),(0,6,z),.09,'roof'+str(side)+'-'+str(z),INK)
            beam(w,(x,4,-3),(x,4,12),.08,'eave'+str(side),INK)
            for z in [0,3,6,9]:
                if side==1 or z==9:
                    w.face([(x,1,z+.1),(x,3.8,z+.1),(x,3.8,z+2.8),(x,1,z+2.8)],'#c8ddd6',1,'glass'+str(side)+'-'+str(z))
                else:
                    w.face([(x,1,z+.1),(x,2.1,z+.1),(x,1.4,z+.8)],'#dbe9e2',1,'broken-glass'+str(z))
        beam(w,(0,6,-3),(0,6,12),.1,'ridge',INK)
        for z in [-1,4,8]:
            for x in [-3.3,3.3]:
                w.box((x-.65,0,z),(1.3,.7,1.5),'planter'+str(x)+'-'+str(z),'#8c8472')
                for k in range(3):vine(w,[(x,.7,z+.3*k),(x+.3*(-1)**k,1.4+k*.2,z+.2),(x-.25,2+k*.25,z+.3)],'plant'+str(x)+'-'+str(z)+'-'+str(k))
        vine(w,[(-4.5,0,3),(-4.3,1.5,3),(-4.7,3,3),(-4.4,4.2,3),(-2.5,5,3)],'climbing-root')
        for i in range(9):w.box((-2+i*.5,0,7+(i%3)*.35),(.35,.18,.25),'rubble'+str(i),'#a0a28c')
        w.box((2.45,0,4.25),(.5,1.2,.5),'beacon-post','#87795f');shard(w,2.7,1.2,4.5,.35,.7,.3,'beacon','#d0aa6c')
    else:
        w.face([(-25,-9,-20),(25,-9,-20),(25,-9,30),(-25,-9,30)],'#537a99',0,'depth')
        rng=random.Random(18)
        for side in [-1,1]:
            for i in range(8):
                z=-8+i*3;x=side*(4+rng.random()*2)
                # Opposing rugged walls surround the thin central crossing.
                w.face([(x,0,z),(x,0,z+3),(side*2.6,-8,z+3),(side*3.2,-9,z)],'#9fc2d2'if side<0 else'#78a7bc',1,'cliff'+str(side)+'-'+str(i))
                w.face([(x,0,z),(side*17,0,z),(side*17,0,z+3),(x,0,z+3)],'#e1eef1',1,'snow'+str(side)+'-'+str(i))
                shard(w,x,0,z,.5+rng.random(),1.2+rng.random()*3,.6,'ice'+str(side)+'-'+str(i))
        for z in [-8,12]:w.box((-17,-8,z),(34,8,4),'ice-bank'+str(z),'#bed8e2')
        for z in range(-4,12):w.box((-1.3,-.3,z),(2.6,.3,.98),'icepath'+str(z),'#d7ecef')
        for z in [-3,2,7,11]:shard(w,-1.4,0,z,.25,.7,.35,'edge'+str(z))
        shard(w,2.7,0,4.5,.65,3,.7,'beacon')
    return w

def render(d,o,camera=None,guides=False):
    validate_object(o);loc=o.get('location','bridge');shot=o.get('shot','wide');sz=o.get('size',[800,480]);c=o.get('camera',camera_for(loc,shot,sz))
    sky={'bridge':'#e8d9d1','greenhouse':'#e1e9da','ravine':'#d5e3ed'}[loc]
    d.rect(0,0,*sz,sky,0,id='sky')
    world=build_world(loc,c,o.get('state','intact'))
    ground=p.World(c);ground.surfaces=[f for f in world.surfaces if f[3] in {'ground','canal','depth'}]
    world.surfaces=[f for f in world.surfaces if f[3] not in {'ground','canal','depth'}]
    ground.draw(d,False);world.draw(d,False)
    if guides:
        for name,point in landmarks(loc).items():
            try:
                x,y=p.project(point,c);d.ellipse(x,y,4,4,'#d56160',1,id='anchor-'+name);d.text(x+6,y-6,name,10,id='anchor-label-'+name)
            except ValueError:pass
    if shot=='ots' and o.get('foreground',True):
        # Screen-space staging device; do not confuse with world-camera geometry.
        sx,sy=sz[0]/800,sz[1]/480
        d.parts.append(f'<g transform="scale({sx} {sy})">')
        d.path('M -30,480 L -25,338 Q 0,291 86,278 L 102,239 Q 64,220 65,166 Q 60,112 114,99 Q 169,94 184,145 L 181,205 Q 173,230 151,241 L 163,276 Q 242,297 265,370 L 283,480 Z',INK,2,'ots-observer')
        d.path('M 77,154 Q 128,139 177,158 L 170,185 L 87,184 Z','#546477',1,'ots-visor')
        d.parts.append('</g>')
