"""Original nonhuman 2D body plans with explicit painter layering and ground contacts."""
import math
from .characters import bent_limb
INK='#202029';BLUE='#5f9fc8';KINDS={'creature'}
def validate_object(o):
    if o.get('kind')!='creature':return False
    species=o.get('species','dragon')
    if not isinstance(species,str) or species not in {'dragon','insect','slime'}:raise ValueError('Unsupported creature species')
    allowed={'id','kind','species','position','scale','mirror','pose','finish','detail'}
    allowed|={'dragon':{'wings','wing_span','wing_pose','tail_curve','horns'},'insect':{'antennae'},'slime':{'lobes','tentacles','expression'}}[species]
    if set(o)-allowed:raise ValueError('Unknown or species-incompatible creature fields: '+str(set(o)-allowed))
    num=lambda v:type(v) in (int,float) and math.isfinite(v)
    if 'position' in o and (not isinstance(o['position'],list) or len(o['position'])!=2 or not all(num(v) and abs(v)<=10000 for v in o['position'])):raise ValueError('position must be finite [x,y]')
    for k,lo,hi in [('scale',.05,10),('wing_span',.5,1.5),('tail_curve',-.5,1.5)]:
        if k in o and (not num(o[k]) or not lo<=o[k]<=hi):raise ValueError('Invalid '+k)
    for k in ['mirror','wings','antennae','tentacles']:
        if k in o and type(o[k]) is not bool:raise ValueError(k+' must be boolean')
    for k,choices in [('pose',{'stand','crouch','prowl'}),('finish',{'ink','cel'}),('wing_pose',{'open','folded'}),('detail',{'simple','manga'}),('expression',{'happy','worried','curious'})]:
        if k in o and (not isinstance(o[k],str) or o[k] not in choices):raise ValueError('Invalid '+k)
    for k,lo,hi in [('horns',0,3),('lobes',3,7)]:
        if k in o and (type(o[k]) is not int or not lo<=o[k]<=hi):raise ValueError('Invalid '+k)
    return True

def dragon_legs(pose):
    if pose=='crouch':return {'far_hind':[(75,28),(125,91),(142,150)],'far_fore':[(-80,20),(-126,77),(-144,150)],'near_hind':[(72,35),(21,87),(70,150)],'near_fore':[(-81,24),(-53,88),(-105,150)]}
    if pose=='prowl':return {'far_hind':[(75,5),(135,63),(173,150)],'far_fore':[(-80,-5),(-125,63),(-155,150)],'near_hind':[(72,15),(35,83),(40,150)],'near_fore':[(-81,4),(-49,71),(-37,150)]}
    return {'far_hind':[(75,5),(108,70),(130,150)],'far_fore':[(-80,-5),(-95,70),(-105,150)],'near_hind':[(72,15),(34,80),(70,150)],'near_fore':[(-81,4),(-62,77),(-72,150)]}

def insect_legs(pose):
    spread=1.2 if pose=='crouch' else 1;lean=24 if pose=='prowl' else 0
    result={}
    for near in [False,True]:
        for i,(root,knee,tip) in enumerate([((-45,-12),(-124,44),(-159,150)),((0,5),(-38,87),(-26,150)),((49,13),(118,70),(164,150))]):
            shift=-30 if not near else 0
            result[('near' if near else 'far')+'_leg'+str(i)]=[(root[0],root[1]+(12 if pose=='crouch' else 0)),(knee[0]*spread+shift,knee[1]),(tip[0]*spread+shift+lean,tip[1])]
    return result

def contact_points(o):
    validate_object(o);species=o.get('species','dragon');pose=o.get('pose','stand')
    if species=='dragon':pts={k:(v[2][0]+11,168) for k,v in dragon_legs(pose).items()}
    elif species=='insect':pts={k:tuple(v[2]) for k,v in insect_legs(pose).items()}
    else:pts={'ground_left':(-90,150),'ground_center':(0,150),'ground_right':(90,150)}
    x,y=o.get('position',[400,400]);s=o.get('scale',1);m=-1 if o.get('mirror',False) else 1
    return {k:[x+s*m*p[0],y+s*p[1]] for k,p in pts.items()}

def tail_spines(low,curve):
    """Five spike triangles with both base vertices on the actual tail cubic."""
    topy=-48-80*curve
    p0,p1,p2,p3=(84,low-10),(154,low+15),(209,topy+95),(260,topy)
    def point(t):
        u=1-t
        return tuple(u*u*u*p0[k]+3*u*u*t*p1[k]+3*u*t*t*p2[k]+t*t*t*p3[k] for k in (0,1))
    result=[]
    for i in range(5):
        t=.24+i*.14;u=1-t;a=point(t-.035);b=point(t+.035);m=point(t)
        dx,dy=(3*u*u*(p1[k]-p0[k])+6*u*t*(p2[k]-p1[k])+3*t*t*(p3[k]-p2[k]) for k in (0,1))
        length=max(math.hypot(dx,dy),1e-9)
        tip=(m[0]+dy/length*15,m[1]-dx/length*15)
        result.append((a,tip,b))
    return result

def dragon(d,o,guides):
    pose=o.get('pose','stand');low=24 if pose=='crouch' else 0;main='#afd2bd' if o.get('finish')=='cel' else 'white';shade='#7c9f92' if o.get('finish')=='cel' else '#9395a2';membrane='#d0c4df' if o.get('finish')=='cel' else 'url(#tone)'
    legs=dragon_legs(pose);detailed=o.get('detail','simple')=='manga'
    def leg(name):
        a,b,c=legs[name];far=name.startswith('far');fill=shade if far else main
        bent_limb(d,a,b,c,18,12,8,fill,name+'-limb')
        x,y=c;d.path(f'M {x-9},{y-6} Q {x-26},{y+1} {x-25},{y+15} L {x+11},{y+18} Q {x+14},{y+6} {x+6},{y-7} Z',fill,2,name+'-foot')
        for n in range(3):d.path(f'M {x-22+n*10},{y+12} l -4,5 8,-1',fill,1,id=name+'-claw'+str(n))
        if detailed:
            ax,ay=a;bx,by=b;cx,cy=c
            d.path(f'M {ax+8},{ay+7} Q {bx+11},{by-4} {bx+6},{by+7} L {cx+6},{cy-4} L {cx},{cy-5} L {bx-1},{by+7} Q {ax+9},{ay+35} {ax+8},{ay+7} Z',INK,0,name+'-core-shadow')
            for k in range(4):d.path(f'M {bx-6+k*3},{by-6+k*2} l -6,7',width=.7,id=name+'-joint-hatch'+str(k))
    # Far appendages first; near wing root sits over the scapular mass later.
    leg('far_hind');leg('far_fore')
    span=o.get('wing_span',1)
    def wing(near):
        prefix='near-wing' if near else 'far-wing';dx=0 if near else 44;dy=low if near else low-12;sf=span*(1 if near else .82)
        d.parts.append(f'<g transform="translate({dx-69+69*sf} {dy-24+24*sf}) scale({sf})">')
        if o.get('wing_pose','open')=='folded':
            d.path('M -69,-24 Q -44,-102 -10,-133 Q 47,-131 98,-83 L 40,-22 Q 4,-40 -17,-10 Z',membrane if near else shade,2.2,prefix+'-membrane')
            d.path('M -69,-24 L -10,-133 L 98,-83 M -10,-133 L 40,-22 M -10,-133 L -17,-10',width=3,id=prefix+'-bones');d.parts.append('</g>');return
        d.path('M -69,-24 Q -41,-111 16,-198 L 42,-248 Q 99,-203 173,-184 Q 122,-166 104,-118 Q 66,-137 42,-88 Q -4,-105 -22,-58 Z',membrane if near else shade,2.2,prefix+'-membrane')
        d.path('M -69,-24 Q -41,-111 16,-198 L 42,-248 M 16,-198 L 173,-184 M 16,-198 L 104,-118 M 16,-198 L 42,-88 M 16,-198 L -22,-58',width=3,id=prefix+'-bones')
        d.path('M 42,-248 l -2,-18 12,14',main,1.5,prefix+'-thumb');d.parts.append('</g>')
    if o.get('wings',True):wing(False)
    curve=o.get('tail_curve',.7);topy=-48-80*curve
    d.path(f'M 84,{low-10} C 154,{low+15} 209,{topy+95} 260,{topy} Q 244,{topy+99} 192,{low+72} Q 135,{low+79} 83,{low+45} Z',main,2.5,'tail')
    for i,vertices in enumerate(tail_spines(low,curve)):
        d.poly(vertices,shade,1.2,'tail-spine'+str(i))
    d.path(f'M -116,{low+6} C -117,{low-65} -30,{low-73} 63,{low-43} C 122,{low-22} 121,{low+35} 79,{low+56} Q -3,{low+86} -96,{low+42} Z',main,2.5,'body')
    d.path(f'M -92,{low+39} Q -5,{low+74} 79,{low+41} Q 41,{low+77} -34,{low+64} Z',membrane,0,'belly')
    if detailed:
        d.path(f'M -80,{low+24} Q -4,{low+65} 87,{low+22} Q 75,{low+61} -4,{low+67} Q -61,{low+63} -80,{low+24} Z',INK,0,'belly-core-shadow')
        d.path(f'M -45,{low-28} Q -17,{low-48} 20,{low-28} M 50,{low-24} Q 97,{low-13} 86,{low+28}',width=1.3,id='rib-haunch-contours')
        for row in range(3):
            for col in range(5-row):
                xx=-42+col*22+row*7;yy=low-15+row*15
                d.path(f'M {xx},{yy} q 7,10 14,0',width=.75,id=f'flank-scale-{row}-{col}')
        for i in range(7):d.path(f'M {-38+i*9},{low+34+i%2*3} l 6,-9',width=.8,id='belly-hatch'+str(i))
    # Raised serpentine neck continuous into a crocodilian muzzle.
    d.path(f'M -95,{low+35} Q -148,{low+8} -151,{low-55} L -200,{low-74} Q -223,{low-79} -217,{low-101} L -168,{low-117} Q -154,{low-156} -125,{low-135} L -99,{low-118} Q -121,{low-63} -67,{low-32} Z',main,2.5,'neck-head')
    d.path(f'M -207,{low-82} Q -171,{low-76} -154,{low-88}',width=1.7,id='mouth')
    d.ellipse(-202,low-99,3,2,INK,0,'nostril');d.path(f'M -155,{low-112} Q -141,{low-124} -128,{low-113} Q -140,{low-100} -155,{low-112} Z','white',1.8,'eye');d.ellipse(-141,low-112,2.8,7,INK,0,'pupil');d.ellipse(-142,low-115,1.2,1.8,'white',0,'eye-light')
    for i in range(o.get('horns',2)):
        x=-129+i*16;y=low-131+i*7;d.path(f'M {x},{y} Q {x+15},{y-25} {x+32},{y-26} L {x+14},{y+8} Z',shade,1.7,'horn'+str(i))
    if detailed:
        d.path(f'M -121,{low-113} Q -122,{low-71} -100,{low-49} Q -81,{low-22} -76,{low-14} L -88,{low+9} Q -125,{low-40} -131,{low-80} Z',INK,0,'neck-core-shadow')
        d.path(f'M -211,{low-77} Q -179,{low-67} -154,{low-81} Q -170,{low-67} -192,{low-70} Z',INK,0,'jaw-shadow')
        for i in range(5):d.path(f'M {-157+i*4},{low-72+i*8} l 8,-7',width=.8,id='throat-hatch'+str(i))
        d.path(f'M -155,{low-116} Q -141,{low-130} -127,{low-117}',width=3.1,id='brow-weight')
    for i in range(6):
        x=-58+i*22;y=low-40+(i-2)**2*1.1;d.path(f'M {x},{y} l 10,-18 12,22',shade,1.3,'dorsal-plate'+str(i))
    if o.get('wings',True):wing(True)
    leg('near_hind');leg('near_fore')
    for i in range(5):d.path(f'M {-124+i*6},{low-49+i*12} q 12,0 19,-8',width=.8,id='neck-scale'+str(i))
    if guides:
        d.ellipse(-8,low,105,58,'none',.8,'ribcage-guide');d.ellipse(-157,low-111,38,28,'none',.8,'skull-guide');d.ellipse(73,low+8,43,45,'none',.8,'hip-guide');d.ellipse(-198,low-94,25,18,'none',.8,'muzzle-guide')
        for name,pts in legs.items():d.path('M '+' L '.join(f'{x},{y}' for x,y in pts),width=1.3,id=name+'-guide',stroke=BLUE)

def insect(d,o,guides):
    pose=o.get('pose','stand');legs=insect_legs(pose);main='#b0c3df' if o.get('finish')=='cel' else 'white';shade='#788cad' if o.get('finish')=='cel' else '#818591';low=12 if pose=='crouch' else 0
    def leg(name):
        a,b,c=legs[name];near=name.startswith('near');fill=main if near else shade
        bent_limb(d,a,b,c,11,7,1.2,fill,name+'-segments');d.ellipse(*b,7,7,fill,1.2,name+'-joint')
        if o.get('detail','simple')=='manga':
            d.ellipse(b[0]+1,b[1]+2,3.8,3.8,INK,0,name+'-joint-core')
            ax,ay=a;bx,by=b;cx,cy=c
            d.path(f'M {ax+3},{ay+6} L {bx+3},{by-4} L {cx+1},{cy-7}',width=2.2,id=name+'-carapace-edge')
        d.path(f'M {c[0]-1.2},{c[1]-4} L {c[0]},{c[1]} L {c[0]+3},{c[1]-3}',fill,1,name+'-tip')
    for i in range(3):leg('far_leg'+str(i))
    d.ellipse(61,low-27,94,69,shade,2.5,'abdomen');d.path(f'M 18,{low-87} Q 73,{low-58} 145,{low-48} M 5,{low-59} Q 75,{low-29} 151,{low-22} M 2,{low-30} Q 69,{low+1} 147,{low+3} M 11,{low-2} Q 73,{low+27} 129,{low+24}',width=2,id='abdomen-segments')
    if o.get('detail','simple')=='manga':
        d.path(f'M 12,{low+4} Q 91,{low+37} 143,{low-12} Q 124,{low+50} 64,{low+42} Q 22,{low+41} 12,{low+4} Z',INK,0,'abdomen-core-shadow')
        d.path(f'M 33,{low-78} Q 73,{low-70} 112,{low-49} Q 75,{low-51} 35,{low-61} Z','url(#tone)',0,'carapace-tone')
        for i in range(8):d.path(f'M {26+i*11},{low+10+i%3*3} l 8,-10',width=.85,id='abdomen-hatch'+str(i))
    d.path(f'M -78,{low-46} Q -36,{low-92} 14,{low-56} L 32,{low-12} Q 12,{low+42} -29,{low+24} L -74,{low+4} Z',main,2.5,'thorax')
    if o.get('detail','simple')=='manga':
        d.path(f'M -14,{low-56} Q 20,{low-34} 18,{low+4} L -5,{low+20} Q 6,{low-6} -14,{low-56} Z',INK,0,'thorax-shadow')
        d.path(f'M -62,{low-33} L -29,{low-61} L -7,{low-32} L -27,{low-7} Z','url(#tone)',1,'thorax-armor')
        for i in range(4):d.path(f'M {-64+i*8},{low-2+i*3} l 7,-9',width=.9,id='thorax-hatch'+str(i))
    d.path(f'M -82,{low-40} L -131,{low-68} Q -158,{low-87} -132,{low-112} Q -99,{low-138} -65,{low-109} L -46,{low-65} Z',main,2.5,'head')
    d.ellipse(-122,low-96,17,23,INK,1.5,'eye-near');d.ellipse(-75,low-100,11,18,INK,1.5,'eye-far')
    for x,y in [(-129,-105),(-120,-114),(-115,-93),(-127,-87),(-76,-108)]:d.ellipse(x,low+y,3,4,'#d1d7e2',0,'facet'+str(x)+str(y))
    d.path(f'M -127,{low-69} Q -153,{low-54} -143,{low-36} L -116,{low-53} M -96,{low-62} Q -91,{low-40} -112,{low-31} L -112,{low-53}',main,2,'mandibles')
    if o.get('antennae',True):
        d.path(f'M -125,{low-116} Q -177,{low-172} -202,{low-153} M -80,{low-119} Q -91,{low-191} -53,{low-200}',width=3,id='antennae')
        d.ellipse(-202,low-153,5,5,INK,0,'antenna-tip-l');d.ellipse(-53,low-200,5,5,INK,0,'antenna-tip-r')
    for i in range(3):leg('near_leg'+str(i))
    for i in range(3):d.path(f'M {-47+i*18},{low-50+i*6} l 16,20 -13,17',width=1.2,id='thorax-ridge'+str(i))
    if guides:
        d.ellipse(61,low-27,94,69,'none',.8,'abdomen-guide');d.ellipse(-25,low-25,55,47,'none',.8,'thorax-guide')
        for name,pts in legs.items():d.path('M '+' L '.join(f'{x},{y}' for x,y in pts),width=1.3,id=name+'-guide',stroke=BLUE)

def slime(d,o,guides):
    n=o.get('lobes',5);pose=o.get('pose','stand');h=155 if pose=='stand' else 100 if pose=='crouch' else 125;lean=35 if pose=='prowl' else 0;main='#c5d9c7' if o.get('finish')=='cel' else 'url(#tone)'
    if o.get('tentacles',False):
        for side in [-1,1]:
            d.parts.append(f'<g transform="scale({side} 1)">')
            for i in range(2):
                yy=92+i*23;end=158+i*18
                d.path(f'M 83,{yy} Q 148,{yy+19} {end},{yy-29} Q {end+19},{yy-39} {end+13},{yy-18} Q 152,{yy+52} 91,{yy+21} Z',main,1.5,'tendril-'+str(side)+'-'+str(i))
            d.parts.append('</g>')
    # Scalloped dome generated from lobe count, flat contact span at y=150.
    pts=[]
    for i in range(n+1):
        t=math.pi-i*math.pi/n;pts.append((math.cos(t)*120+lean*math.sin(t),150-h*math.sin(t)))
    p=f'M -120,150';
    for i in range(n):
        a,b=pts[i],pts[i+1];cx=(a[0]+b[0])/2;cy=(a[1]+b[1])/2-24;p+=f' Q {cx},{cy} {b[0]},{b[1]}'
    p+=' L -120,150 Z'
    gradient=d.prefix+'-gel-gradient';color='#8ab7a0' if o.get('finish')=='cel' else '#9ca4b5'
    d.parts.append(f'<defs><linearGradient id="{gradient}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{color}" stop-opacity=".3"/><stop offset="1" stop-color="{color}" stop-opacity=".85"/></linearGradient></defs>')
    d.path(p,'url(#'+gradient+')',2.5,'gel-silhouette')
    d.path(f'M {-74+lean*.4},{150-h*.55} Q {-49+lean*.5},{150-h*.87} {-18+lean*.6},{150-h*.85}',width=9,id='gel-shine',stroke='white')
    ey=150-h*.43
    for side,x in [('left',-38+lean*.5),('right',37+lean*.5)]:d.ellipse(x,ey,8,13,INK,0,'eye-'+side);d.ellipse(x-2,ey-4,2.2,3,'white',0,'shine-'+side)
    expression=o.get('expression','happy')
    if expression=='happy':d.path(f'M {-10+lean*.5},{ey+21} q 11,11 24,-1',width=2,id='smile')
    elif expression=='worried':
        d.path(f'M {-10+lean*.5},{ey+29} q 11,-12 24,-1',width=2,id='smile')
        d.path(f'M {-50+lean*.5},{ey-20} l 19,-8 M {25+lean*.5},{ey-28} l 20,8',width=2,id='brows')
    else:
        d.ellipse(lean*.5+3,ey+26,5,7,INK,1,'smile')
        d.path(f'M {-51+lean*.5},{ey-24} q 12,-10 23,-3 M {27+lean*.5},{ey-24} l 18,0',width=2,id='brows')
    for i in range(n):d.ellipse(-80+i*160/max(n-1,1),135-(i%2)*12,3+i%3,3+i%3,'white',.5,'bubble'+str(i))
    if o.get('detail','simple')=='manga':
        d.path('M -111,142 Q -59,133 -18,141 Q 55,151 109,137 L 118,148 L -118,148 Z',INK,0,'gel-contact-shadow')
        for i in range(5):d.path(f'M {-70+i*31},131 q 5,-3 11,0',width=.8,id='gel-ripple'+str(i))
    if guides:d.line((-125,150),(125,150),1.5,BLUE,id='contact-span');d.line((lean,150-h),(0,150),1,BLUE,id='mass-axis')

def render(d,o,camera=None,guides=False):
    validate_object(o);x,y=o.get('position',[400,400]);s=o.get('scale',1);m=-1 if o.get('mirror',False) else 1
    d.parts.append(f'<g transform="translate({x} {y}) scale({s*m} {s})">')
    {'dragon':dragon,'insect':insect,'slime':slime}[o.get('species','dragon')](d,o,guides)
    d.parts.append('</g>')
