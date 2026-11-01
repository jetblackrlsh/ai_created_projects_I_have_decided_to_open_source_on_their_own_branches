"""Original manga character geometry. 2D view-specific drawings, not a 3D head model."""
import math
INK='#202029'
BLUE='#5f9fc8'
KINDS={'portrait_v2','figure','hand','chibi'}
VIEWS={'front','threequarter','profile'}
EXPRESSIONS={'calm','smile','angry','surprised','closed','worried'}
HAIR={'short','bob','long'}
GESTURES={'open','fist','point','peace','grip'}
POSES={'stand','run','reach','sit','guard'}
JOINTS={'left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'}
def validate_object(o):
    k=o.get('kind')
    if k not in KINDS:return False
    allowed={'id','kind','position','scale','mirror'}
    if k=='hand':allowed|={'gesture','angle'}
    else:allowed|={'view','expression','hair','gaze','face_style','head_angle','brow_expression','mouth_expression'}
    if k in {'figure','chibi'}:allowed|={'pose','joints','gesture'}
    if set(o)-allowed:raise ValueError('Unknown character field: '+str(set(o)-allowed))
    def number(v):return type(v) in (int,float) and math.isfinite(v)
    if 'position' in o and (not isinstance(o['position'],list) or len(o['position'])!=2 or not all(number(v) for v in o['position'])):raise ValueError('position requires two finite numbers')
    if 'scale' in o and (not number(o['scale']) or not .05<=o['scale']<=10):raise ValueError('scale must be 0.05..10')
    if 'angle' in o and (not number(o['angle']) or abs(o['angle'])>360):raise ValueError('angle must be -360..360')
    if 'mirror' in o and type(o['mirror']) is not bool:raise ValueError('mirror must be boolean')
    for key,choices in [('view',VIEWS),('expression',EXPRESSIONS),('hair',HAIR),('gesture',GESTURES),('pose',POSES),('face_style',{'classic','expressive'}),('brow_expression',EXPRESSIONS),('mouth_expression',EXPRESSIONS)]:
        if key in o and (not isinstance(o[key],str) or o[key] not in choices):raise ValueError('Unsupported '+key)
    if 'gaze' in o and (not isinstance(o['gaze'],list) or len(o['gaze'])!=2 or not all(number(v) and -1<=v<=1 for v in o['gaze'])):raise ValueError('gaze must be normalized finite pair')
    if 'head_angle' in o and (not number(o['head_angle']) or not -45<=o['head_angle']<=45):raise ValueError('head_angle -45..45')
    if 'joints' in o:
        j=o['joints']
        if not isinstance(j,dict) or set(j)-JOINTS:raise ValueError('Unknown joint')
        if any(not isinstance(p,list) or len(p)!=2 or not all(number(v) and abs(v)<=2000 for v in p) for p in j.values()):raise ValueError('Joint positions must be finite [x,y] within 2000 units')
    return True

def scope(d,suffix):
    old=d.prefix;d.prefix=old+'-'+suffix;return old

def eye_classic(d,x,y,sx=1,expr='calm',side=1):
    d.parts.append(f'<g transform="translate({x} {y}) scale({sx} 1)">')
    if expr=='closed':d.path('M -15,0 Q 0,11 15,0',width=3,id='lid')
    else:
        top='M -16,0 Q -4,-12 14,-2'
        if expr=='angry':top='M -16,-5 L 14,0'
        d.path(top+' Q 11,15 -1,15 Q -12,13 -16,0 Z','white',1.2,'white')
        d.ellipse(1,5,7,10,INK,0,'iris');d.ellipse(2,8,3.3,4.5,'#737381',0,'iris-light');d.ellipse(-2,1,2.6,3.2,'white',0,'shine')
        d.path(top,width=3.3,id='lid');d.path('M -10,13 Q 0,18 10,12',width=.8,id='lower-lid')
    brow='M -14,-17 Q 0,-24 12,-17'
    if expr=='angry':brow='M -14,-23 L 12,-12' if side<0 else 'M -14,-12 L 12,-23'
    if expr=='worried':brow='M -14,-13 L 12,-26' if side<0 else 'M -14,-26 L 12,-13'
    if expr=='surprised':brow='M -14,-25 Q 0,-33 12,-25'
    d.path(brow,width=1.5,id='brow');d.parts.append('</g>')

def eye(d,x,y,sx=1,expr='calm',side=1,gaze=(0,0),style='expressive',brow_expression=None):
    if style=='classic':return eye_classic(d,x,y,sx,expr,side)
    d.parts.append(f'<g transform="translate({x} {y}) scale({sx} 1)">')
    if expr=='closed':d.path('M -15,1 Q 0,10 15,0',width=2.8,id='lid')
    else:
        top='M -16,1 Q -3,-10 15,0';bottom=' Q 12,12 0,13 Q -12,12 -16,1 Z';rx,ry=6,8
        if expr=='smile':top='M -16,2 Q -2,-8 15,1';bottom=' Q 9,9 0,9 Q -10,10 -16,2 Z';ry=7
        elif expr=='surprised':top='M -16,0 Q -4,-16 14,-2';bottom=' Q 17,15 1,17 Q -13,17 -16,0 Z';rx,ry=4.5,6.5
        elif expr=='angry':
            top='M -16,-3 L 14,3' if side<0 else 'M -16,3 L 14,-3';bottom=' Q 10,11 0,12 Q -11,11 -16,1 Z';ry=7
        elif expr=='worried':top='M -16,3 Q -5,-10 15,-1';bottom=' Q 12,13 0,14 Q -12,13 -16,3 Z';rx,ry=5.5,8
        outline=top+bottom;d.path(outline,'white',1.1,'white');clip=d.prefix+'-eye-clip'
        d.parts.append(f'<defs><clipPath id="{clip}"><path d="{outline}"/></clipPath></defs><g clip-path="url(#{clip})">')
        gx,gy=gaze[0]*5,gaze[1]*3;d.ellipse(1+gx,5+gy,rx,ry,INK,0,'iris');d.ellipse(2+gx,8+gy,rx*.48,ry*.4,'#747787',0,'iris-light');d.ellipse(-1+gx,1+gy,2.2,2.6,'white',0,'shine');d.parts.append('</g>')
        d.path(top,width=2.8,id='lid');d.path('M -10,13 Q 0,16 10,12',width=.65,id='lower-lid')
    be=brow_expression or expr
    brow='M -14,-15 Q 0,-22 13,-16'
    if be=='angry':brow='M -16,-24 Q -4,-20 13,-10' if side<0 else 'M -16,-10 Q 1,-20 13,-24'
    elif be=='worried':brow='M -16,-14 Q -1,-13 13,-26' if side<0 else 'M -16,-26 Q 0,-13 13,-14'
    elif be=='surprised':brow='M -15,-28 Q 0,-37 13,-28'
    elif be=='smile':brow='M -14,-19 Q 1,-27 13,-19'
    d.path(brow,width=1.8,id='brow');d.parts.append('</g>')

def portrait(d,o,guides=False):
    view=o.get('view','front');expr=o.get('expression','calm');hair=o.get('hair','short');style=o.get('face_style','expressive');gaze=o.get('gaze',[0,0]);brow_expr=o.get('brow_expression',expr);mouth_expr=o.get('mouth_expression',expr)
    d.parts.append(f'<g transform="rotate({o.get("head_angle",0)} 0 85)">')
    # Neck and hair are layered behind the deliberately different head contours.
    if hair=='long':d.path('M -44,38 C -70,67 -50,142 -70,176 Q 0,202 61,170 C 49,137 75,64 38,33 Z',INK,2,'hair-back')
    d.path('M -17,111 L -18,145 Q 0,157 21,141 L 17,107 Z','white',2,'neck')
    d.path('M -17,114 Q 0,134 18,112 L 18,129 Q 0,142 -17,126 Z','url(#tone)',0,'neck-shadow')
    if view=='front':
        d.ellipse(-47,83,8,15,'white',1.7,'ear-l');d.ellipse(47,83,8,15,'white',1.7,'ear-r')
        contour='M -44,70 C -47,36 -25,18 0,18 C 32,18 48,38 44,71 L 38,99 Q 18,121 0,130 Q -23,116 -39,96 Z'
        d.path(contour,'white',2.3,'face')
        for side,x in [(-1,-23),(1,23)]:
            old=scope(d,'eye-l' if side<0 else 'eye-r');eye(d,x,78,1,expr,side,gaze,style,brow_expr);d.prefix=old
        d.path('M 1,88 l -3,12 5,2',width=1.1,id='nose');mouthx=0
    elif view=='threequarter':
        d.ellipse(-42,84,8,15,'white',1.7,'ear-l')
        contour='M -43,68 C -48,40 -20,17 9,19 C 34,20 48,38 43,63 L 46,81 L 52,88 L 42,94 Q 35,117 16,130 Q -19,121 -37,100 Z'
        d.path(contour,'white',2.3,'face')
        old=scope(d,'eye-near');eye(d,-11,78,1.05,expr,-1,gaze,style,brow_expr);d.prefix=old
        old=scope(d,'eye-far');eye(d,29,76,.62,expr,1,gaze,style,brow_expr);d.prefix=old
        d.path('M 27,85 Q 29,94 34,98 L 27,101',width=1.1,id='nose');mouthx=20
    else:
        # A true side silhouette, visible nose/lips/chin projection and one eye.
        contour='M -39,80 C -53,48 -31,19 0,18 C 28,15 42,34 37,58 L 33,74 L 48,88 Q 50,92 36,94 L 36,104 L 42,108 L 35,114 Q 33,127 17,132 L -8,119 Q -37,112 -39,80 Z'
        d.path(contour,'white',2.3,'face');d.ellipse(-19,86,9,15,'white',1.5,'ear')
        old=scope(d,'eye-profile');eye(d,23,77,.47,expr,1,gaze,style,brow_expr);d.prefix=old
        d.path('M -22,80 q 10,-7 5,13 M 33,98 l 5,0',width=1,id='profile-details');mouthx=34
    if style=='expressive':
        if view=='threequarter':d.path('M 42,95 Q 35,116 16,130 Q 33,113 33,104 Z','#e7e7ee',0,'cheek-plane')
        elif view=='front':d.path('M 37,96 Q 22,119 0,130 Q 21,114 25,104 Z','#eeeeF3',0,'cheek-plane')
        if expr=='smile':d.path('M -30,100 q 6,-2 10,1 M 22,100 q 6,-2 11,0',width=.55,id='cheek-lift')
        elif expr=='worried':d.path('M -27,102 l 10,2 M 22,103 l 8,-2',width=.55,id='cheek-tension')
    if view=='profile':
        d.path('M 35,107 l 7,1' if mouth_expr!='smile' else 'M 33,106 q 6,7 10,2',width=1.2,id='mouth')
    elif mouth_expr=='worried':d.path(f'M {mouthx-10},116 Q {mouthx},106 {mouthx+12},116',width=1.4,id='mouth')
    elif mouth_expr=='surprised':d.ellipse(mouthx,113,6,9,'#484956',1.2,'mouth')
    elif mouth_expr=='smile':d.path(f'M {mouthx-10},109 Q {mouthx+1},122 {mouthx+14},107 Q {mouthx+2},112 {mouthx-10},109 Z','white',1.3,'mouth')
    elif mouth_expr=='angry':d.path(f'M {mouthx-9},112 q 9,-5 18,0',width=1.3,id='mouth')
    else:d.path(f'M {mouthx-9},111 q 9,4 18,-1',width=1.1,id='mouth')
    if style=='expressive' and mouth_expr in ['surprised','worried']:d.path(f'M {mouthx-5},124 q 5,2 10,-1',width=.6,id='lower-lip')
    if view=='profile':
        h='M -39,96 L -53,72 L -46,43 L -57,40 L -39,25 L -46,16 L -16,18 Q 2,0 22,13 L 17,20 Q 39,20 45,40 L 37,67 L 24,48 L 15,69 L 3,43 L -14,67 L -27,64 Z'
    elif hair=='bob':h='M -45,92 L -56,113 Q -62,59 -49,36 Q -30,7 6,14 Q 48,12 56,56 L 55,117 L 40,109 L 42,64 Q 18,61 0,34 Q -15,64 -43,70 Z'
    else:h='M -44,94 L -56,67 L -49,43 L -61,47 L -41,27 L -48,18 L -21,20 Q -3,0 21,12 L 14,22 Q 42,17 53,37 L 47,69 L 39,87 L 35,55 L 21,67 L 18,36 Q 2,64 -19,78 L -10,42 Q -27,65 -42,66 Z'
    if view=='profile' and hair=='bob':h='M -49,116 Q -58,73 -48,42 Q -31,10 4,15 Q 36,14 43,41 Q 30,45 18,32 Q 5,59 -17,69 Q -31,80 -30,113 Z'
    if view=='profile' and hair=='long':h='M -43,126 Q -58,75 -46,42 Q -30,10 4,15 Q 36,14 43,41 Q 30,45 18,32 Q 6,55 -15,67 Q -34,94 -30,144 Z'
    d.path(h,INK,2,'hair-front')
    for j,p in enumerate(['M -39,40 Q -26,28 -13,29','M -28,55 Q -16,37 -7,29','M 1,26 Q 11,18 21,21','M 31,31 Q 41,36 43,46']):d.path(p,width=.9,id=f'hair-highlight-{j}',stroke='#aaaab9')
    if guides:
        d.path('M -55,78 H 55 M 0,12 V 135',width=.7,id='landmarks',stroke=BLUE)
        d.emit('ellipse',{'cx':0,'cy':66,'rx':46,'ry':52,'fill':'none','stroke':BLUE,'stroke-width':.7},id='cranium-guide')
    d.parts.append('</g>')

def hand(d,gesture='open',guides=False):
    # Local wrist is (0,0); palm upward. Fingers are outlined original silhouettes.
    outlines={
      'open':'M -15,0 L -21,-25 L -39,-48 Q -42,-56 -35,-57 L -21,-43 L -23,-78 Q -22,-87 -16,-84 L -10,-49 L -8,-91 Q -6,-99 0,-93 L 2,-49 L 8,-87 Q 11,-95 16,-87 L 13,-46 L 23,-72 Q 28,-78 31,-70 L 23,-33 L 15,-4 L 13,0 Z',
      'fist':'M -17,0 L -23,-23 L -20,-51 Q -14,-60 -7,-52 Q -1,-62 6,-53 Q 14,-60 21,-48 L 25,-30 Q 24,-13 14,0 Z',
      'point':'M -16,0 L -23,-28 L -19,-82 Q -16,-93 -10,-85 L -8,-43 Q 0,-53 7,-44 Q 15,-49 20,-40 L 24,-24 L 14,0 Z',
      'peace':'M -16,0 L -24,-28 L -34,-81 Q -33,-91 -26,-86 L -9,-47 L 1,-91 Q 6,-100 11,-91 L 6,-43 Q 13,-52 19,-42 L 24,-22 L 14,0 Z',
      'grip':'M -15,0 L -23,-25 L -22,-53 Q -18,-64 -11,-58 L -4,-40 L 12,-48 Q 23,-48 25,-38 L 20,-15 L 13,0 Z'}
    d.path(outlines[gesture],'white',1.7,'silhouette')
    d.path('M -14,-28 Q -3,-15 11,-26 M -10,-4 L 9,-5',width=.8,id='palm-creases')
    if gesture=='fist':
        d.path('M -17,-42 L -13,-27 M -7,-46 L -4,-31 M 5,-46 L 7,-31 M 15,-42 L 17,-30 M -20,-22 Q -2,-45 14,-25',width=1,id='knuckles')
    elif gesture in ['point','peace','grip']:
        d.path('M -7,-33 Q 3,-40 16,-32 M -4,-26 Q 5,-33 18,-25',width=.9,id='curled-fingers')
    else:
        for i,(x,y) in enumerate([(-17,-62),(-3,-69),(12,-64),(23,-52)]):d.line((x-3,y),(x+3,y+1),.7,id='joint-'+str(i))
    if guides:d.rect(-18,-45,36,42,'none',.6,id='palm-guide')

def limb(d,a,b,ra,rb,fill,id):
    dx,dy=b[0]-a[0],b[1]-a[1];ln=max(math.hypot(dx,dy),.01);nx,ny=-dy/ln,dx/ln
    p=lambda q,r:(q[0]+nx*r,q[1]+ny*r)
    aa,ab,bb,ba=p(a,ra),p(a,-ra),p(b,-rb),p(b,rb)
    d.path(f'M {aa[0]},{aa[1]} Q {a[0]-dx*.08},{a[1]-dy*.08} {ab[0]},{ab[1]} L {bb[0]},{bb[1]} Q {b[0]+dx*.06},{b[1]+dy*.06} {ba[0]},{ba[1]} Z',fill,2,id)

def bent_limb(d,a,b,c,ra,rb,rc,fill,id):
    def normal(p,q):
        dx,dy=q[0]-p[0],q[1]-p[1];length=max(math.hypot(dx,dy),.001);return (-dy/length,dx/length)
    n1,n2=normal(a,b),normal(b,c)
    nm=(n1[0]+n2[0],n1[1]+n2[1]);ln=max(math.hypot(*nm),.1);nm=(nm[0]/ln,nm[1]/ln)
    joint_radius=min(rb/max(abs(nm[0]*n1[0]+nm[1]*n1[1]),.5),rb*1.65)
    pts=[]
    for sign in [1,-1]:
        chain=[(a,n1,ra),(b,nm,joint_radius),(c,n2,rc)]
        if sign<0:chain.reverse()
        pts += [(p[0]+n[0]*r*sign,p[1]+n[1]*r*sign) for p,n,r in chain]
    rounded=[]
    for i,p in enumerate(pts):
        prev,nxt=pts[i-1],pts[(i+1)%len(pts)]
        def towards(q):
            ln=max(math.dist(p,q),.001);t=min(.2,7/ln);return (p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t)
        rounded.append((towards(prev),p,towards(nxt)))
    start=rounded[0][0];path=f'M {start[0]},{start[1]}'
    for before,corner,after in rounded:path+=f' L {before[0]},{before[1]} Q {corner[0]},{corner[1]} {after[0]},{after[1]}'
    d.path(path+' Z',fill,2,id)

def skeleton(pose,chibi=False):
    j={'left_shoulder':[-49,162],'right_shoulder':[49,162],'left_elbow':[-66,265],'right_elbow':[68,265],'left_wrist':[-65,355],'right_wrist':[66,355],'left_hip':[-27,340],'right_hip':[27,340],'left_knee':[-34,463],'right_knee':[39,458],'left_ankle':[-38,590],'right_ankle':[48,590]}
    if pose=='run':j.update(left_elbow=[-97,226],left_wrist=[-43,281],right_elbow=[96,215],right_wrist=[67,137],left_knee=[-93,423],left_ankle=[-171,469],right_knee=[79,446],right_ankle=[19,531])
    if pose=='reach':j.update(right_elbow=[91,84],right_wrist=[120,9],left_elbow=[-75,248],left_wrist=[-123,302],right_ankle=[77,581])
    if pose=='sit':j.update(left_knee=[-115,374],left_ankle=[-115,500],right_knee=[103,385],right_ankle=[118,512],left_elbow=[-65,267],left_wrist=[-104,341],right_elbow=[69,266],right_wrist=[98,348])
    if pose=='guard':j.update(left_elbow=[-97,233],left_wrist=[-52,129],right_elbow=[96,240],right_wrist=[52,135],left_knee=[-69,463],left_ankle=[-110,577],right_knee=[73,460],right_ankle=[111,577])
    if chibi:j={k:[v[0]*.62,130+(v[1]-130)*.34] for k,v in j.items()}
    return j

def figure(d,o,guides=False,chibi=False):
    pose=o.get('pose','stand');j=skeleton(pose,chibi);j.update(o.get('joints',{}));r=.65 if chibi else 1
    # Back limbs then torso then foreground arm, preserving clear joint overlap.
    for side in ['left','right']:
        hip,knee,ankle=[j[side+'_'+n] for n in ['hip','knee','ankle']]
        fill='url(#tone)' if side=='left' else '#747482'
        bent_limb(d,hip,knee,ankle,25*r,21*r,15*r,fill,side+'-leg')
        x,y=ankle;d.path(f'M {x-16*r},{y-9*r} L {x+15*r},{y-9*r} L {x+31*r},{y+12*r} Q {x+20*r},{y+22*r} {x-24*r},{y+17*r} Z','white',2,side+'-shoe')
        for n in range(3):d.line((x-8*r,y+n*4*r),(x+9*r,y+n*4*r),.8,id=side+'-lace-'+str(n))
        for a,b,name in [(hip,knee,'thigh-fold'),(knee,ankle,'shin-fold')]:
            d.line((a[0]+6*r,a[1]+12*r),(b[0]+4*r,b[1]-16*r),.8,id=side+'-'+name)
    ls,rs,lh,rh=[j[k] for k in ['left_shoulder','right_shoulder','left_hip','right_hip']]
    torso=f'M {ls[0]},{ls[1]} Q -25,137 0,141 Q 25,137 {rs[0]},{rs[1]} L {rh[0]+17*r},{rh[1]+13*r} Q 0,{rh[1]+33*r} {lh[0]-17*r},{lh[1]+13*r} Z'
    d.path(torso,'white',2.5,'jacket')
    d.path(f'M -18,139 L 0,159 L 18,139 L {23*r},180 L 0,197 L {-23*r},180 Z','url(#tone)',1.2,'collar')
    d.line((0,197),(0,rh[1]+18*r),1,id='zipper')
    if not chibi:
        d.path('M -37,267 l 22,-7 1,33 -19,5 Z','white',1.1,'left-pocket')
        d.path('M 15,260 l 22,7 -4,31 -19,-5 Z','white',1.1,'right-pocket')
        d.path('M -39,321 l 17,6 M 23,326 l 17,-5 M -26,202 l 9,11 M 26,202 l -9,11',width=.9,id='cloth-folds')
    for n,yy in enumerate([213,247,281] if not chibi else [180,194]):d.ellipse(5*r,yy,1.5*r,1.5*r,INK,0,'button-'+str(n))
    for side in ['left','right']:
        shoulder,elbow,wrist=[j[side+'_'+n] for n in ['shoulder','elbow','wrist']]
        bent_limb(d,shoulder,elbow,wrist,20*r,17*r,11*r,'white',side+'-sleeve')
        d.line((elbow[0]-9*r,elbow[1]+2*r),(elbow[0]+8*r,elbow[1]-3*r),.9,id=side+'-elbow-fold')
        angle=math.degrees(math.atan2(wrist[1]-elbow[1],wrist[0]-elbow[0]))+90
        old=scope(d,side+'-hand');d.parts.append(f'<g transform="translate({wrist[0]} {wrist[1]}) rotate({angle}) scale({.42*r})">')
        hand(d,o.get('gesture','fist' if pose in ['run','guard'] else 'open'));d.parts.append('</g>');d.prefix=old
    portrait(d,o,False)
    if guides:
        for side in ['left','right']:
            for chain in [['shoulder','elbow','wrist'],['hip','knee','ankle']]:
                for a,b in zip(chain,chain[1:]):d.line(j[side+'_'+a],j[side+'_'+b],1,BLUE,id=side+'-guide-'+a+'-'+b)
        for name,(x,y) in j.items():d.emit('circle',{'cx':x,'cy':y,'r':4,'fill':'white','stroke':BLUE,'stroke-width':1},id='joint-'+name)
        for yy in range(0,601 if not chibi else 301,100):d.line((-110,yy),(110,yy),.5,BLUE,id='unit-'+str(yy))

def render(d,o,camera=None,guides=False):
    validate_object(o);x,y=o.get('position',[200,100]);sc=o.get('scale',1);mirror=-1 if o.get('mirror',False) else 1
    d.parts.append(f'<g transform="translate({x} {y}) rotate({o.get("angle",0)}) scale({sc*mirror} {sc})">')
    k=o['kind']
    if k=='portrait_v2':portrait(d,o,guides)
    elif k=='hand':hand(d,o.get('gesture','open'),guides)
    elif k in {'figure','chibi'}:figure(d,o,guides,k=='chibi')
    d.parts.append('</g>')
