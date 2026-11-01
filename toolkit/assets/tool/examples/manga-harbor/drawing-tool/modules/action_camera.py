"""Original projected action props and an explicitly schematic punch solid.

Based on compositional principles, not copied diagrams. Coordinates are world
space; start is sword guard/staff end/shoulder, end is tip/staff end/fist centre.
No automatic anatomical rigging or inter-object collision is implied.
"""
import math
from . import perspective as p

def validate_object(o):
    allowed={'id','kind','shape','start','end','radius','camera','roll'}
    if not isinstance(o,dict) or set(o)-allowed:raise ValueError('Unknown action_prop field')
    if o.get('shape') not in ['sword','staff','punch','finger_study']:raise ValueError('Unknown action prop shape')
    for key in ['start','end']:
        v=o.get(key)
        if not isinstance(v,list) or len(v)!=3 or not all(type(x) in [int,float] and math.isfinite(x) for x in v):raise ValueError('Action endpoints need three finite numbers')
    if math.dist(o['start'],o['end'])<.01:raise ValueError('Action endpoints must differ')
    for key,default in [('radius',.12),('roll',0)]:
        v=o.get(key,default)
        if type(v) not in [int,float] or not math.isfinite(v):raise ValueError('Invalid action numeric field')
    if not 0<o.get('radius',.12)<=10:raise ValueError('Action radius must be positive and at most 10')
    p.validate_object({'id':'camera-check','kind':'world','camera':o.get('camera',{}),'items':[]})
    return True

def frame(start,end,roll=0):
    axis=p.unit(p.sub(end,start));ref=(0,1,0) if abs(axis[1])<.95 else (1,0,0)
    u=p.unit(p.cross(axis,ref));v=p.cross(axis,u);a=math.radians(roll)
    return axis,p.add(p.mul(u,math.cos(a)),p.mul(v,math.sin(a))),p.add(p.mul(v,math.cos(a)),p.mul(u,-math.sin(a)))

def ring(center,u,v,ru,rv,n=8):
    return [p.add(center,p.add(p.mul(u,ru*math.cos(2*math.pi*i/n)),p.mul(v,rv*math.sin(2*math.pi*i/n)))) for i in range(n)]

def tube(w,a,b,u,v,ra,rb,id,n=8,flat=.95,fill='white'):
    aa=ring(a,u,v,ra,ra*flat,n);bb=ring(b,u,v,rb,rb*flat,n)
    for i in range(n):
        j=(i+1)%n
        w.face([aa[i],aa[j],bb[j],bb[i]],fill if i%3 else '#b8b8c5',1.3,f'{id}-side-{i}')
    w.face(aa,'url(#tone)',1.6,id+'-back');w.face(bb,fill,1.6,id+'-front')

def build(o):
    validate_object(o);w=p.World(o.get('camera',{}));a=o['start'];b=o['end'];r=o.get('radius',.12)
    axis,u,v=frame(a,b,o.get('roll',0));length=math.dist(a,b);shape=o['shape']
    if shape=='sword':
        # A long flattened bevelled blade: shoulder remains broad, tip tapers.
        shoulder=p.add(a,p.mul(axis,length*.86))
        tube(w,a,shoulder,u,v,r,r*.75,'blade',4,.18)
        rim=ring(shoulder,u,v,r*.75,r*.75*.18,4)
        for i in range(4):w.face([rim[i],rim[(i+1)%4],b],'white' if i%2 else '#b8b8c5',1.3,'point-'+str(i))
        tube(w,p.add(a,p.mul(u,-r*2.8)),p.add(a,p.mul(u,r*2.8)),axis,v,r*.34,r*.34,'guard',4,1,'#444452')
        grip=p.add(a,p.mul(axis,-r*4.5));tube(w,grip,a,u,v,r*.42,r*.42,'grip',8,1,'#535364')
        tube(w,p.add(grip,p.mul(axis,-r*.45)),grip,u,v,r*.62,r*.62,'pommel',8,1,'#a3a3b2')
        for i in range(1,6):
            cen=p.add(grip,p.mul(axis,r*4.5*i/6));pts=ring(cen,u,v,r*.43,r*.43,8)
            # Bands are real projected rings, not a 2D stripe approximation.
            for j in range(8):w.line(pts[j],pts[(j+1)%8],.65,'#e4e4ee',f'wrap-{i}-{j}')
    elif shape=='staff':tube(w,a,b,u,v,r,r,'staff',12,1,'#d6d6df')
    elif shape=='finger_study':
        # Three explicit phalange solids and a block palm: construction only.
        for i,(t0,t1) in enumerate([(0,.43),(.43,.76),(.76,1)]):
            aa=p.add(a,p.mul(axis,length*t0));bb=p.add(a,p.mul(axis,length*t1))
            tube(w,aa,bb,u,v,r*(1-.35*t0),r*(1-.35*t1),'phalange-'+str(i),12,.9)
        back=p.add(a,p.mul(axis,-length*.55))
        tube(w,back,a,u,v,r*2.9,r*2.4,'palm-block',4,.65,'url(#tone)')
    else:
        tube(w,a,b,u,v,r*.62,r,'forearm',12,.85)
        tube(w,b,p.add(b,p.mul(axis,r*1.2)),u,v,r*1.32,r*1.16,'schematic-fist',4,.83,'url(#tone)')
    return w

def render(d,o,camera=None,guides=False):
    w=build(o);w.draw(d,False)
    if guides:
        a=p.project(o['start'],w.camera);b=p.project(o['end'],w.camera)
        d.line(a,b,1.2,'#659acf','axis')
        for label,q in [('start',a),('end',b)]:
            d.ellipse(*q,4,4,'#659acf',0,id=label+'-contact')
            d.text(q[0]+7,q[1]-6,label,12,'#427baa',id=label+'-label')

def self_test():
    """Small numerical/validation suite; integration tests render scene examples."""
    base={'id':'p','kind':'action_prop','shape':'sword','start':[0,0,0],'end':[0,1,0]}
    invalid=[{'start':[0,0,True]},{'end':[0,0,0]},{'radius':0},{'radius':float('inf')},{'roll':False},{'shape':'unknown'},{'camera':{'focal':0}},{'unknown':1}]
    for patch in invalid:
        obj=dict(base);obj.update(patch)
        try:validate_object(obj)
        except ValueError:pass
        else:raise AssertionError('Invalid action prop accepted')
    axis,u,v=frame([0,0,0],[1,2,3],37)
    for x,y in [(axis,u),(u,v),(axis,v)]:assert abs(p.dot(x,y))<1e-12
    c={'position':[0,0,-7],'target':[0,0,0],'focal':600}
    far=math.dist(p.project((-.3,0,1),c),p.project((.3,0,1),c))
    near=math.dist(p.project((-.3,0,-3),c),p.project((.3,0,-3),c))
    assert abs(near/far-2)<1e-9
    for shape in ['sword','staff','punch','finger_study']:
        obj=dict(base,shape=shape);assert build(obj).surfaces
    return {'checks':16,'status':'passed'}
