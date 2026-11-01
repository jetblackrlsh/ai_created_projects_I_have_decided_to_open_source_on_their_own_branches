"""Original constructed props and deterministic manga ink effects.

No source artwork, image model or browser is used. Local prop coordinates occupy
roughly 200x240 around the origin; position/scale/angle compose them in a scene.
"""
import math
import random

KINDS = {'prop', 'effect'}
PROP_TYPES = {'sword','umbrella','lantern','plant','book','cup','backpack'}
EFFECT_TYPES = {'speedlines','radialburst','hatching','screentone','smoke'}
INK = '#202029'


def _number(v):
    return type(v) in (int, float) and math.isfinite(v)


def validate_object(o):
    kind=o.get('kind')
    if kind not in KINDS:
        raise ValueError('Not an ink/prop object')
    fields=({'subtype','position','scale','angle','shading','light'} if kind=='prop' else
            {'subtype','bounds','center','density','seed','angle','tone','inner_radius'})
    if set(o)-fields-{'id','kind'}:
        raise ValueError('Unknown ink/prop field')
    choices=PROP_TYPES if kind=='prop' else EFFECT_TYPES
    if not isinstance(o.get('subtype'),str) or o['subtype'] not in choices:
        raise ValueError('Unsupported '+kind+' subtype')
    if kind=='prop':
        if any(k in o for k in ['shading','light']) and o['subtype']!='cup':raise ValueError('shading/light currently supported only on cup')
        if o.get('shading','tone') not in ['flat','tone','hatch']:raise ValueError('Unsupported shading')
        if o.get('light','left') not in ['left','right']:raise ValueError('Unsupported light direction')
        if not isinstance(o.get('position'),list) or len(o['position'])!=2 or not all(_number(x) for x in o['position']):
            raise ValueError('Prop position requires two finite numbers')
    else:
        if not isinstance(o.get('bounds'),list) or len(o['bounds'])!=4 or not all(_number(x) for x in o['bounds']) or o['bounds'][2]<=0 or o['bounds'][3]<=0:
            raise ValueError('Effect bounds require [x,y,width,height] with positive dimensions')
        if o['bounds'][2]>8192 or o['bounds'][3]>8192:
            raise ValueError('Effect bounds too large')
    for key in ['scale','angle','density','inner_radius']:
        if key in o and not _number(o[key]):raise ValueError('Invalid '+key)
    if not .05<=o.get('scale',1)<=10:raise ValueError('Scale must be .05..10')
    if not 1<=o.get('density',35)<=300:raise ValueError('Density must be 1..300')
    if kind=='effect' and o['subtype']=='hatching' and not -80<=o.get('angle',-50)<=80:raise ValueError('Hatching angle must be -80..80 degrees')
    if o.get('inner_radius',80)<0:raise ValueError('Radius must be nonnegative')
    if 'center' in o and (not isinstance(o['center'],list) or len(o['center'])!=2 or not all(_number(v) for v in o['center'])):raise ValueError('Invalid center')
    if type(o.get('seed',0)) is not int:raise ValueError('Seed must be integer')
    if o.get('tone','medium') not in ['light','medium','dark']:raise ValueError('Tone must be light, medium, or dark')
    return True


def _guide(d,kind):
    color='#68a2cf'
    shapes={
        'sword':'M 0,-165 V 148 M -16,-125 H 16 V 66 H -16 Z M -45,73 H 45',
        'umbrella':'M -120,0 H 120 M 0,-130 V 140 M -112,-8 Q -94,-95 0,-112 Q 93,-95 112,-8',
        'lantern':'M -60,-96 H 60 V 101 H -60 Z M 0,-150 V 115 M -60,0 H 60',
        'plant':'M -64,40 H 64 L 44,122 H -44 Z M 0,-140 V 140 M -102,-20 H 102',
        'book':'M -103,-89 H 96 V 110 H -103 Z M -9,-96 V 120 M -103,0 H 96',
        'cup':'M -65,-36 H 65 V 95 H -65 Z M 0,-50 V 116 M -70,28 H 75',
        'backpack':'M -78,-101 H 78 V 112 H -78 Z M 0,-140 V 130 M -90,0 H 90',
    }
    d.path(shapes[kind],width=.8,stroke=color,id='construction-scaffold')
    if kind in ['cup','plant']:
        y=-36 if kind=='cup' else 41
        d.emit('ellipse',{'cx':0,'cy':y,'rx':65,'ry':18,'fill':'none','stroke':color,'stroke-width':.8},id='construction-ellipse')


def _sword(d):
    d.path('M 0,-155 L 13,-125 L 13,66 L -13,66 L -13,-125 Z','white',2.4,'blade')
    d.path('M 0,-151 L 2,65 L 12,65 L 12,-124 Z','#d3d3de',0,'blade-facet')
    d.line((-7,-104),(-7,52),.75,'#7c7c89','blade-reflection')
    d.path('M -41,68 Q -28,61 -9,66 L 14,66 Q 34,59 43,69 L 39,79 Q 28,75 13,76 L -10,76 Q -27,72 -39,80 Z',INK,2,'guard')
    d.path('M -10,77 L 12,77 L 14,133 Q 1,144 -13,133 Z','url(#tone)',2,'grip')
    for i in range(5):
        y=80+i*10
        d.path(f'M -10,{y} L 12,{y+9} M 12,{y} L -11,{y+9}',width=1,id=f'wrap-{i}')
    d.ellipse(1,137,15,5,'white',2,'pommel')


def _umbrella(d):
    d.path('M -112,-8 Q -94,-95 0,-112 Q 93,-95 112,-8 Q 87,-25 64,-6 Q 33,-23 0,-4 Q -34,-22 -65,-5 Q -91,-24 -112,-8 Z','white',2.5,'canopy')
    d.path('M 0,-111 Q 42,-88 64,-6 Q 34,-22 0,-4 Z','url(#tone)',.8,'canopy-tone')
    d.path('M -111,-8 Q -93,-95 0,-112 Q -43,-84 -65,-5',width=1.2,id='rib-left')
    d.path('M 0,-112 Q 44,-82 64,-6 M 0,-112 L 0,-4',width=1.2,id='ribs-right')
    d.path('M -3,-2 L -3,104 Q -2,128 18,129 Q 39,129 39,108 L 31,108 Q 30,121 18,121 Q 5,121 5,105 L 5,-3 Z','white',2,'shaft-handle')
    d.line((0,-111),(0,-124),2,INK,'finial')
    for i,x in enumerate([-90,-55,65,95]):d.path(f'M {x},16 l -5,18',width=1,id=f'drop-{i}')


def _lantern(d):
    d.path('M -30,-93 Q -38,-145 0,-145 Q 39,-145 31,-93',width=5,id='handle')
    d.path('M -62,-95 L 62,-95 L 44,-115 L -43,-115 Z',INK,2,'roof')
    d.path('M -57,-92 L -45,85 L 45,85 L 57,-92 Z','white',2.7,'frame')
    d.path('M -42,-78 L -34,70 L 34,70 L 42,-78 Z','url(#tone)',1,'glass')
    d.path('M 0,-77 L 0,70 M -40,-28 L 40,-28 M -37,20 L 37,20',width=2.5,id='bars')
    d.path('M -18,57 Q -30,28 -2,0 Q -8,25 8,16 Q 32,45 18,57 Z','white',1.4,'flame')
    d.path('M -53,84 L 53,84 L 64,101 L -65,101 Z',INK,2,'base')
    d.path('M -31,-66 L -26,-40 M -25,-31 L -21,-2 M 24,31 L 27,52',width=2,stroke='white',id='glass-glints')
    d.ellipse(-51,-88,3,3,'white',0,'rivet-left');d.ellipse(51,-88,3,3,'white',0,'rivet-right')


def _plant(d):
    d.path('M -62,41 L -43,118 Q 0,134 43,118 L 62,41 Z','url(#tone)',2.3,'pot')
    d.ellipse(0,41,63,15,'white',2.2,'rim')
    d.ellipse(0,41,49,8,INK,1,'soil')
    d.path('M -5,42 Q -21,-27 -8,-105 M -3,24 Q 39,-4 60,-54 M -9,4 Q -48,-4 -70,-47 M -13,-42 Q 18,-60 25,-92',width=3,id='stems')
    leaves=[(-9,-101,-23,-137,18,-127),(-16,-64,-66,-110,-49,-51),(-12,-33,37,-73,29,-24),(-47,-22,-97,-62,-89,-15),(40,-22,80,-92,95,-44),(20,-57,65,-94,57,-49),(-5,13,-55,-17,-41,31)]
    for i,(x,y,a,b,c,e) in enumerate(leaves):
        fill='white' if i%2 else INK
        d.path(f'M {x},{y} Q {a},{b} {c},{e} Q {x+5},{y+12} {x},{y} Z',fill,1.6,f'leaf-{i}')
        d.line((x,y),((a+c)/2,(b+e)/2),.7,'white' if fill==INK else '#777784',f'vein-{i}')
    for i in range(5):d.line((-42+i*19,62),(-30+i*14,110),.7,'#777784',f'pot-hatch-{i}')


def _book(d):
    d.path('M -100,-71 L -12,-53 L 94,-77 L 95,86 L -10,109 L -102,88 Z','white',2.6,'cover')
    d.path('M -91,-84 Q -52,-86 -9,-60 Q 37,-89 86,-88 L 86,75 Q 36,70 -9,99 Q -53,75 -91,76 Z','white',2,'pages')
    d.path('M -9,-60 L -9,99',width=2,id='spine')
    d.path('M -91,69 Q -52,70 -10,94 M 86,68 Q 40,65 -9,94 M -96,81 Q -53,81 -10,103 M 90,81 Q 40,77 -9,103',width=.9,id='page-stack')
    for i in range(7):
        y=-45+i*15
        d.path(f'M -78,{y} Q -46,{y+1} -24,{y+12} M 5,{y+8} Q 41,{y-7} 72,{y-9}',width=.8,stroke='#8a8a96',id=f'texture-{i}')
    d.path('M 39,-84 L 50,-87 L 50,8 L 44,1 L 38,12 Z',INK,1,'bookmark')


def _cup(d,shading='tone',light='left'):
    d.path('M 51,-37 Q 108,-48 107,12 Q 107,67 50,58 L 47,40 Q 90,45 88,11 Q 88,-22 50,-18 Z','white',2.4,'handle')
    d.path('M -65,-36 L -56,79 Q -2,107 53,79 L 64,-36 Z','white',2.5,'body')
    shade=('M 26,-32 L 22,89 Q 40,85 53,78 L 64,-36 Z' if light=='left' else 'M -65,-36 L -56,79 Q -40,89 -23,91 L -27,-33 Z')
    d.path(shade,'#c8c8d2' if shading=='flat' else 'url(#tone)' if shading=='tone' else 'white',0,'shade')
    if shading=='hatch':
        clip=d.prefix+'-cup-shade-clip'
        d.parts.append(f'<defs><clipPath id="{clip}"><path d="{shade}"/></clipPath></defs><g clip-path="url(#{clip})">')
        for j in range(40):d.line((-70,-70+j*5),(70,30+j*5),.7,INK,f'shade-hatch-{j}')
        d.parts.append('</g>')
    d.ellipse(0,-36,65,18,'white',2.3,'lip');d.ellipse(0,-34,54,11,INK,1,'tea')
    d.path('M -29,-59 Q -51,-79 -31,-97 Q -18,-113 -30,-130 M 9,-60 Q -9,-81 11,-99 Q 24,-116 13,-135 M 40,-60 Q 26,-74 41,-88',width=1.7,stroke='#9999a5',id='steam')
    d.path('M -43,-9 L -39,51',width=3,stroke='#eeeeF2',id='glint')
    d.ellipse(0,105,82,12,'url(#tone)',1.5,'saucer')
    # Restore lower body outline above the saucer contact.
    d.path('M -56,79 Q -2,107 53,79',width=2.5,id='base-line')


def _backpack(d):
    d.path('M -26,-97 Q -31,-135 1,-135 Q 33,-135 26,-96',width=6,id='handle')
    d.path('M -60,-70 Q -99,-48 -92,88 L -76,93 Q -73,-8 -42,-45 Z','url(#tone)',2,'strap-left')
    d.path('M 58,-70 Q 99,-45 92,88 L 75,93 Q 75,-8 43,-45 Z','url(#tone)',2,'strap-right')
    d.path('M -61,-87 Q 0,-122 61,-87 Q 82,-47 76,96 Q 0,126 -77,96 Q -82,-48 -61,-87 Z','white',2.7,'body')
    d.path('M -57,-83 Q 0,-110 57,-83 L 62,-22 Q 0,2 -63,-22 Z','url(#tone)',1.6,'lid')
    d.path('M -59,16 Q 0,-1 59,16 L 58,91 Q 0,111 -59,91 Z','white',1.7,'pocket')
    d.path('M -53,29 Q 0,16 52,29',width=2,id='zipper')
    d.rect(37,28,5,15,INK,1,1,'zip-pull')
    for x in [-27,22]:d.rect(x,-21,11,34,'white',1.5,2,id=f'buckle-{x}')
    d.path('M -71,-49 L -68,79 M 68,-48 L 65,78',width=.8,stroke='#777784',id='edge-seams')


PROPS={'sword':_sword,'umbrella':_umbrella,'lantern':_lantern,'plant':_plant,'book':_book,'cup':_cup,'backpack':_backpack}


def prop(d,o,guides):
    x,y=o['position'];scale=o.get('scale',1);angle=o.get('angle',0)
    d.parts.append(f'<g transform="translate({x} {y}) rotate({angle}) scale({scale})">')
    if o['subtype']=='cup':_cup(d,o.get('shading','tone'),o.get('light','left'))
    else:PROPS[o['subtype']](d)
    if guides:_guide(d,o['subtype'])
    d.parts.append('</g>')


def effect(d,o):
    x,y,w,h=o['bounds'];kind=o['subtype'];density=int(o.get('density',35));rng=random.Random(o.get('seed',0));cx,cy=o.get('center',[x+w/2,y+h/2]);tone=o.get('tone','medium');clip=d.prefix+'-effect-clip'
    d.parts.append(f'<defs><clipPath id="{clip}"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath></defs><g clip-path="url(#{clip})">')
    if kind=='speedlines':
        a=math.radians(o.get('angle',-12));dx,dy=math.cos(a),math.sin(a);length=math.hypot(w,h)*1.4
        for i in range(density):
            yy=y+(i+.5)*h/density;start=x-rng.random()*w*.6;extent=length*rng.uniform(.35,1)
            d.line((start,yy),(start+dx*extent,yy+dy*extent),rng.uniform(.5,2.5),INK,f'speed-{i}')
    elif kind=='radialburst':
        inner=o.get('inner_radius',min(w,h)*.23);outer=math.hypot(w,h)
        for i in range(density):
            a=(i+rng.uniform(-.18,.18))*math.tau/density;rin=inner*rng.uniform(.9,1.35);thickness=rng.uniform(.001,.006)
            pts=[(cx+math.cos(a)*rin,cy+math.sin(a)*rin),(cx+math.cos(a-thickness)*outer,cy+math.sin(a-thickness)*outer),(cx+math.cos(a+thickness)*outer,cy+math.sin(a+thickness)*outer)]
            d.poly(pts,INK,0,f'ray-{i}')
    elif kind=='hatching':
        gap=max(3,min(w,h)/density);a=math.radians(o.get('angle',-50));dy=math.tan(a)*w
        for i in range(int((h+abs(dy))/gap)+2):
            yy=y-max(dy,0)+i*gap;d.line((x,yy),(x+w,yy+dy),.65 if tone=='light' else 1,INK,f'hatch-{i}')
        if tone=='dark':
            for i in range(int((h+abs(dy))/gap)+2):
                yy=y-max(dy,0)+i*gap;d.line((x+w,yy),(x,yy+dy),.7,INK,f'cross-{i}')
    elif kind=='screentone':
        gap=max(5,min(w,h)/density,math.sqrt(w*h/20000));r={'light':.55,'medium':1.15,'dark':1.8}[tone]
        for row in range(int(h/gap)+2):
            for col in range(int(w/gap)+2):
                d.ellipse(x+col*gap+(row%2)*gap/2,y+row*gap,r,r,INK,0,f'dot-{row}-{col}')
    elif kind=='smoke':
        # Overlapping pale lobes construct a soft plume; an outer broken contour adds ink structure.
        for i in range(density):
            xx=cx+math.sin(i*.8)*w*.22+rng.uniform(-w*.08,w*.08);yy=y+h-i*h/max(1,density-1);rx=w*(.16+.13*i/density);ry=h*.09
            d.ellipse(xx,yy,rx,ry,'white',1.1,f'cloud-{i}')
    d.parts.append('</g>')


def render(d,o,camera=None,guides=False):
    validate_object(o)
    if o['kind']=='prop':prop(d,o,guides)
    else:effect(d,o)
