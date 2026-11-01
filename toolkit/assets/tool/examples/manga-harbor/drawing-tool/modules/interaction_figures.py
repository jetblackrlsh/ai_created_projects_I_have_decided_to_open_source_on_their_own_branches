"""Authored 2D interaction figures: identity, articulated contacts and explicit layering."""
import copy,math
from . import characters as ch
from .action_characters import segment
KINDS={'interaction_figure'};INK=ch.INK;BLUE='#5f9fc8'
JOINTS=ch.JOINTS
IDENTITY={'hair':{'short','bob','locs','none'},'beard':{'none','short','full'},'age':{'child','adult','older'},'build':{'slim','broad'},'outfit':{'casual','coat','tunic'},'loc_style':{'loose','side','updo'}}
def validate_object(o):
    if o.get('kind') not in KINDS:return False
    allowed={'id','kind','position','scale','mirror','rotation','pose','joints','identity','view','expression','left_hand','right_hand','hand_angles','depth','layer','head_scale','contour','head_angle','gaze','face_style'}
    if set(o)-allowed:raise ValueError('Unknown interaction_figure field: '+str(set(o)-allowed))
    num=lambda v:type(v) in (int,float) and math.isfinite(v)
    pair=lambda v:isinstance(v,list) and len(v)==2 and all(num(n) and abs(n)<=10000 for n in v)
    if 'position'in o and not pair(o['position']):raise ValueError('position requires finite [x,y]')
    for k,lo,hi in [('scale',.05,10),('rotation',-180,180),('head_scale',.5,1.4),('head_angle',-45,45)]:
        if k in o and (not num(o[k]) or not lo<=o[k]<=hi):raise ValueError('Invalid '+k)
    if 'mirror'in o and type(o['mirror'])is not bool:raise ValueError('mirror must be boolean')
    for k,choices in [('contour',{'organic','classic'}),('face_style',{'expressive','classic'}),('pose',{'stand','crouch','sit','reach','flight'}),('view',ch.VIEWS),('expression',ch.EXPRESSIONS),('left_hand',{'open','grip','fist','support'}),('right_hand',{'open','grip','fist','support'}),('layer',{'all','back','body','front'})]:
        if k in o and (not isinstance(o[k],str)or o[k]not in choices):raise ValueError('Invalid '+k)
    if 'gaze'in o and (not pair(o['gaze'])or any(abs(n)>1 for n in o['gaze'])):raise ValueError('gaze requires normalized [x,y]')
    ident=o.get('identity',{})
    if not isinstance(ident,dict)or set(ident)-set(IDENTITY):raise ValueError('Invalid identity fields')
    if 'loc_style'in ident and ident.get('hair')!='locs':raise ValueError('loc_style requires locs hair')
    for k,v in ident.items():
        if not isinstance(v,str)or v not in IDENTITY[k]:raise ValueError('Invalid identity '+k)
    js=o.get('joints',{})
    if not isinstance(js,dict)or set(js)-JOINTS or not all(pair(v)for v in js.values()):raise ValueError('Invalid joints')
    for k,keys,lo,hi in [('hand_angles',{'left','right'},-360,360),('depth',{'left_arm','right_arm','left_leg','right_leg'},.5,3)]:
        value=o.get(k,{})
        if not isinstance(value,dict)or set(value)-keys or not all(num(v)and lo<=v<=hi for v in value.values()):raise ValueError('Invalid '+k)
    return True

def joint_data(o):
    pose=o.get('pose','stand')
    j={'left_shoulder':[-48,0],'right_shoulder':[48,0],'left_elbow':[-65,91],'right_elbow':[65,91],'left_wrist':[-63,169],'right_wrist':[63,169],'left_hip':[-27,165],'right_hip':[27,165],'left_knee':[-35,285],'right_knee':[35,285],'left_ankle':[-42,405],'right_ankle':[42,405]}
    if pose=='crouch':j.update(left_shoulder=[-46,30],right_shoulder=[23,5],left_hip=[0,150],right_hip=[57,140],left_knee=[-93,175],right_knee=[148,178],left_ankle=[-120,295],right_ankle=[176,295])
    if pose=='sit':j.update(left_knee=[-108,178],right_knee=[108,178],left_ankle=[-108,290],right_ankle=[108,290])
    if pose=='reach':j.update(right_elbow=[91,-70],right_wrist=[125,-153])
    if pose=='flight':j.update(left_shoulder=[-40,8],right_shoulder=[42,-17],left_elbow=[-95,-40],left_wrist=[-140,-77],right_elbow=[85,-20],right_wrist=[117,-55],left_hip=[-8,121],right_hip=[37,114],left_knee=[-40,174],right_knee=[79,160],left_ankle=[-70,214],right_ankle=[78,227])
    if o.get('view')=='profile':j={k:[v[0]*.35,v[1]]for k,v in j.items()}
    ident=o.get('identity',{})
    if ident.get('age')=='child':j={k:[v[0]*.75,v[1]*.68]for k,v in j.items()}
    if ident.get('build')=='broad':j={k:[v[0]*1.16,v[1]]for k,v in j.items()}
    j.update(o.get('joints',{}));return j

def transform(o,p,inverse=False):
    x,y=o.get('position',[400,300]);sc=o.get('scale',1);m=-1 if o.get('mirror',False)else 1;a=math.radians(o.get('rotation',0));c,s=math.cos(a),math.sin(a)
    if inverse:
        xx=(p[0]-x)/sc*m;yy=(p[1]-y)/sc;return [xx*c+yy*s,-xx*s+yy*c]
    return [x+sc*m*(p[0]*c-p[1]*s),y+sc*(p[0]*s+p[1]*c)]

def hand_geometry(o,side,j=None):
    j=j or joint_data(o);e,w=j[side+'_elbow'],j[side+'_wrist'];angle=o.get('hand_angles',{}).get(side,math.degrees(math.atan2(w[1]-e[1],w[0]-e[0]))+90);sc=.57*o.get('depth',{}).get(side+'_arm',1)
    return w,math.radians(angle),sc

def contact_points(o):
    validate_object(o);j=joint_data(o);out={k:transform(o,v)for k,v in j.items()}
    for side in ['left','right']:
        w,a,sc=hand_geometry(o,side,j);offset=20 if o.get(side+'_hand')=='support'else 25;out[side+'_palm']=transform(o,[w[0]+math.sin(a)*offset*sc,w[1]-math.cos(a)*offset*sc])
        hip=j[side+'_hip'];out[side+'_support']=transform(o,[hip[0],hip[1]+10])
    return out

def set_hand_target(o,side,target,elbow=None):
    """Return copy with palm-center coincident with scene target; no whole-body IK.
    An explicit elbow chooses the bend; hand auto-orients from elbow to contact.
    """
    if side not in {'left','right'}:raise ValueError('side must be left or right')
    for value in [target]+([] if elbow is None else [elbow]):
        if not isinstance(value,(list,tuple))or len(value)!=2 or not all(type(v)in(int,float)and math.isfinite(v) for v in value):raise ValueError('target and elbow require finite [x,y]')
    result=copy.deepcopy(o);validate_object(result);j=joint_data(result);e=elbow if elbow is not None else j[side+'_elbow'];t=transform(result,target,True);dx,dy=t[0]-e[0],t[1]-e[1];ln=math.hypot(dx,dy)
    if ln<1e-6:raise ValueError('elbow and contact cannot coincide')
    length=(20 if result.get(side+'_hand')=='support'else 25)*.57*result.get('depth',{}).get(side+'_arm',1)
    result.setdefault('joints',{})[side+'_elbow']=list(e);result['joints'][side+'_wrist']=[t[0]-dx/ln*length,t[1]-dy/ln*length]
    result.setdefault('hand_angles',{})[side]=math.degrees(math.atan2(dy,dx))+90
    return result

def head(d,o,j):
    identity=o.get('identity',{});hair=identity.get('hair','short');beard=identity.get('beard','none');age=identity.get('age','adult')
    ls,rs=j['left_shoulder'],j['right_shoulder'];x=(ls[0]+rs[0])/2;y=(ls[1]+rs[1])/2-104
    sc=o.get('head_scale',.78 if age!='child' else .86);old=ch.scope(d,'head');d.parts.append(f'<g transform="translate({x} {y}) rotate({o.get('head_angle',0)}) scale({sc})">')
    ch.portrait(d,{'view':o.get('view','threequarter'),'hair':'bob' if hair=='bob'else 'short','expression':o.get('expression','calm'),'gaze':o.get('gaze',[0,0]),'face_style':o.get('face_style','expressive')})
    # Replace hair shapes only by removing their just-created elements for bald/loc styles.
    if hair in {'none','locs'}:
        d.parts=[s for s in d.parts if not any(('id="'+d.prefix+'-'+k)in s for k in ['hair-front','hair-highlight'])]
    if hair=='locs':
        d.path('M -46,68 Q -62,20 -21,13 Q 31,-4 49,37 L 37,63 Q 7,39 -16,51 Z',INK,1.5,'loc-cap')
        style=identity.get('loc_style','loose')
        if style=='updo':
            d.ellipse(7,3,31,26,INK,1,'loc-bun')
            for k in range(5):d.path(f'M {-18+k*10},-13 q -4,16 1,34',width=.75,id='bun-rope'+str(k),stroke='#a9a9b6')
        xs=[-50,-40,-30,32,42,52] if style=='loose' else [30,40,50,60,70,80] if style=='side' else [-48,-37,42]
        if o.get('view')=='profile':xs=[-53,-43,-33,-23]
        for i,xx in enumerate(xs):
            yy=16+(i%3)*4;end=(101+abs(xx)*.3+(i%3)*9) if style!='updo' else 83
            d.path(f'M {xx*.3},{yy} C {xx-12},{yy-5} {xx-16},{yy+39} {xx-9},{end-25} Q {xx-5},{end+18} {xx+4},{end} Q {xx+6},{end-35} {xx+2},{yy+41} Q {xx-1},{yy+14} {xx*.3+8},{yy+4} Z',INK,1,'loc'+str(i))
            d.path(f'M {xx*.3+3},{yy+5} Q {xx-7},{yy+21} {xx-5},{yy+54} Q {xx-2},{end-25} {xx},{end-5}',width=.65,id='loc-highlight'+str(i),stroke='#a9a9b6')
        # A swept central opening leaves the eyes visible.
    if beard!='none':
        view=o.get('view','threequarter');xx=13 if view=='threequarter'else 0
        d.path(f'M {xx-36},103 Q {xx-20},121 {xx},112 Q {xx+19},120 {xx+31},102 Q {xx+35},132 {xx+2},{154 if beard=='full' else 133} Q {xx-33},132 {xx-36},103 Z',INK,1.2,'beard')
        expression=o.get('expression','calm');curve=121 if expression in {'smile','closed'}else 110 if expression in {'angry','worried'}else 115
        if expression=='surprised':d.path(f'M {xx-3},116 a 5,7 0 1,0 10,0 a 5,7 0 1,0 -10,0',width=1.2,id='beard-mouth',stroke='white')
        else:d.path(f'M {xx-9},114 Q {xx+2},{curve} {xx+13},114',width=1.2,id='beard-mouth',stroke='white')
        if beard=='full':
            for i in range(5):d.path(f'M {xx-19+i*9},125 l 3,12',width=.7,id='beard-strand'+str(i),stroke='#90909e')
    if age=='older':
        d.path('M -35,98 l 8,3 M 27,98 l 7,-2 M -25,47 q 22,-7 39,-1 M -25,53 q 19,-6 35,-1',width=.7,id='age-lines')
    d.parts.append('</g>');d.prefix=old


def organic_segment(d,a,b,ra,rb,fill,id):
    dx,dy=b[0]-a[0],b[1]-a[1];ln=max(math.hypot(dx,dy),.001);n=(-dy/ln,dx/ln)
    def p(t,r):return f'{a[0]+dx*t+n[0]*r},{a[1]+dy*t+n[1]*r}'
    d.path(f'M {p(0,ra*.8)} C {p(.16,ra*1.17)} {p(.55,ra*.92)} {p(1,rb)} Q {p(1.04,0)} {p(1,-rb)} C {p(.70,-rb*.72)} {p(.28,-ra*.83)} {p(0,-ra*.8)} Q {p(-.12,0)} {p(0,ra*.8)} Z',fill,2,id)

def organic_arm(d,a,b,c,ra,rb,rc,side):
    def normal(p,q):
        dx,dy=q[0]-p[0],q[1]-p[1];ln=max(math.hypot(dx,dy),.001);return [-dy/ln,dx/ln]
    u,v=normal(a,b),normal(b,c);m=[u[0]+v[0],u[1]+v[1]];ln=max(math.hypot(*m),.1);m=[z/ln for z in m]
    def off(p,n,r):return [p[0]+n[0]*r,p[1]+n[1]*r]
    def mix(p,q,t):return [p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]
    def xy(p):return f'{p[0]},{p[1]}'
    ap,an=off(a,u,ra*.75),off(a,u,-ra*.75);bp,bn=off(b,m,rb),off(b,m,-rb);cp,cn=off(c,v,rc),off(c,v,-rc)
    # The convex shoulder/triceps peak sits high; the opposing contour turns later.
    up=f'M {xy(ap)} C {xy(off(mix(a,b,.18),u,ra*2.25))} {xy(off(mix(a,b,.52),u,ra*.42))} {xy(bp)}'
    low=f'C {xy(off(mix(b,c,.23),v,rb*1.18))} {xy(off(mix(b,c,.72),v,rc*.8))} {xy(cp)}'
    inner=f'L {xy(cn)} C {xy(off(mix(b,c,.65),v,-rc*.8))} {xy(off(mix(b,c,.36),v,-rb*.8))} {xy(bn)} C {xy(off(mix(a,b,.72),u,-rb*.66))} {xy(off(mix(a,b,.27),u,-ra*1.4))} {xy(an)}'
    cap=f'Q {xy(mix(a,b,-.13))} {xy(ap)} Z'
    d.path(up+f'L {xy(bn)} C {xy(off(mix(a,b,.72),u,-rb*.66))} {xy(off(mix(a,b,.27),u,-ra*1.4))} {xy(an)}'+cap,'white',0,side+'-sleeve')
    d.path(f'M {xy(bp)} '+low+f'L {xy(cn)} C {xy(off(mix(b,c,.65),v,-rc*.8))} {xy(off(mix(b,c,.36),v,-rb*.8))} {xy(bn)} Z','#f7f7fa',0,side+'-forearm')
    d.path(up+low+inner+cap,'none',2,side+'-arm-contour')
    # A short compression fold replaces a complete rectangular elbow seam.
    fold=off(b,m,-rb*.65);d.path(f'M {xy(fold)} Q {xy(off(mix(b,c,.07),m,-rb*.12))} {xy(off(mix(b,c,.11),m,rb*.34))}',width=1,id=side+'-compression-fold')

def organic_leg(d,a,b,c,ra,rb,rc,fill,id):
    def n(p,q):
        dx,dy=q[0]-p[0],q[1]-p[1];ln=max(math.hypot(dx,dy),.001);return [-dy/ln,dx/ln]
    u,v=n(a,b),n(b,c);m=[u[0]+v[0],u[1]+v[1]];ln=max(math.hypot(*m),.1);m=[z/ln for z in m]
    def pt(p,n,r):return [p[0]+n[0]*r,p[1]+n[1]*r]
    def lerp(p,q,t):return [p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]
    def xy(p):return f'{p[0]},{p[1]}'
    L=[]
    for sg in [1,-1]:L.append([pt(a,u,ra*sg),pt(b,m,rb*sg),pt(c,v,rc*sg)])
    aa,bb,cc=L[0];dd,ee,ff=L[1]
    d.path(f'M {xy(aa)} C {xy(pt(lerp(a,b,.3),u,ra*1.42))} {xy(pt(lerp(a,b,.75),u,rb*.9))} {xy(bb)} C {xy(pt(lerp(b,c,.24),v,rb*1.32))} {xy(pt(lerp(b,c,.74),v,rc*.8))} {xy(cc)} L {xy(ff)} C {xy(pt(lerp(b,c,.72),v,-rc*.78))} {xy(pt(lerp(b,c,.3),v,-rb*.91))} {xy(ee)} C {xy(pt(lerp(a,b,.75),u,-rb*.9))} {xy(pt(lerp(a,b,.22),u,-ra*1.17))} {xy(dd)} Z',fill,2,id)

def relaxed_hand(d):
    # Contact center remains (0,-25); fingertips group softly rather than fan stiffly.
    d.path('M -13,0 Q -18,-12 -18,-29 Q -23,-37 -30,-40 Q -36,-46 -31,-49 Q -27,-51 -17,-41 L -16,-63 Q -16,-71 -11,-68 L -6,-42 L -5,-73 Q -5,-81 1,-76 L 5,-43 L 9,-69 Q 11,-76 15,-69 L 16,-41 L 21,-59 Q 25,-65 28,-59 Q 28,-42 20,-27 Q 17,-12 12,0 Z','white',1.7,'silhouette')
    d.path('M -13,-29 Q -3,-18 11,-28 M -8,-4 L 8,-5 M -13,-52 l 5,-1 M -3,-59 l 5,0 M 10,-54 l 5,1 M 20,-48 l 4,1',width=.75,id='palm-creases')

def render(d,o,camera=None,guides=False):
    validate_object(o);j=joint_data(o);x,y=o.get('position',[400,300]);sc=o.get('scale',1);m=-1 if o.get('mirror',False)else 1;layer=o.get('layer','all');identity=o.get('identity',{});build=identity.get('build','slim');outfit=identity.get('outfit','casual');width=1.2 if build=='broad'else 1;depth=o.get('depth',{});organic=o.get('contour','organic')=='organic'
    d.parts.append(f'<g transform="translate({x} {y}) scale({sc*m} {sc}) rotate({o.get("rotation",0)})">')
    def arm(side):
        a,b,c=[j[side+'_'+k]for k in ['shoulder','elbow','wrist']];f=depth.get(side+'_arm',1);w=18*width
        drawseg=organic_segment if organic else segment
        ew=w*(.6 if organic else .8);ww=w*(.43 if organic else .55)*f
        if organic:organic_arm(d,a,b,c,w,ew,ww,side)
        else:
            drawseg(d,a,b,w,ew,'white',side+'-sleeve');drawseg(d,b,c,ew,ww,'#f7f7fa',side+'-forearm')
        wx,ang,hs=hand_geometry(o,side,j);old=ch.scope(d,side+'-hand');d.parts.append(f'<g transform="translate({wx[0]} {wx[1]}) rotate({math.degrees(ang)}) scale({hs})">');
        if o.get(side+'_hand')=='support':
            d.path('M -16,0 L -20,-20 L 48,-20 Q 63,-20 67,-12 Q 49,-7 19,-7 L 16,0 Z','white',1.7,'silhouette');d.path('M 5,-17 L 47,-17 M 8,-13 L 50,-13',width=.7,id='flat-fingers')
        elif organic and o.get(side+'_hand','open')=='open':relaxed_hand(d)
        else:ch.hand(d,o.get(side+'_hand','open'))
        d.parts.append('</g>');d.prefix=old
        if not organic:d.line((b[0]-6,b[1]-3),(b[0]+6,b[1]+3),1,id=side+'-elbow-fold')
    if layer in {'all','back'}:
        for side in ['left','right']:
            a,b,c=[j[side+'_'+k]for k in ['hip','knee','ankle']];f=depth.get(side+'_leg',1)
            (organic_leg if organic else ch.bent_limb)(d,a,b,c,23*width,18*width,13*f,'url(#tone)'if side=='left'else '#92939f',side+'-leg')
            xx,yy=c;d.path(f'M {xx-14*f},{yy-8} L {xx+13*f},{yy-8} Q {xx+29*f},{yy+4} {xx+27*f},{yy+15} L {xx-19*f},{yy+15} Z','white',2,side+'-shoe')
            d.path(f'M {xx-9*f},{yy+1} H {xx+10*f} M {xx-9*f},{yy+5} H {xx+12*f}',width=.8,id=side+'-laces')
        arm('left')
    if layer in {'all','body'}:
        ls,rs,lh,rh=[j[k]for k in ['left_shoulder','right_shoulder','left_hip','right_hip']];sx,sy=(ls[0]+rs[0])/2,(ls[1]+rs[1])/2;hx,hy=(lh[0]+rh[0])/2,(lh[1]+rh[1])/2
        ext=65 if outfit=='coat'else 15;fill='white'if outfit!='tunic'else 'url(#tone)'
        if organic:
            # Sloping trapezius, inset neck, rib-to-waist taper and flared cloth hem.
            d.path(f'M {ls[0]},{ls[1]+6} Q {sx-30},{sy-6} {sx-14},{sy-14} L {sx-12},{sy-26} L {sx+13},{sy-26} L {sx+15},{sy-14} Q {sx+32},{sy-7} {rs[0]},{rs[1]+6} C {rs[0]-9},{rs[1]+47} {hx+28*width},{hy-54} {rh[0]+7},{rh[1]-6} Q {rh[0]+14},{rh[1]+ext*.5} {rh[0]+17},{rh[1]+ext} Q {hx+8},{hy+ext+15} {lh[0]-17},{lh[1]+ext} Q {lh[0]-12},{lh[1]+ext*.45} {lh[0]-7},{lh[1]-6} C {hx-28*width},{hy-54} {ls[0]+8},{ls[1]+43} {ls[0]},{ls[1]+6} Z',fill,2.4,'torso')
            d.path(f'M {sx-11},{sy-10} Q {sx},{sy+2} {sx+12},{sy-10}',width=1,id='neck-hollow')
        else:
            d.path(f'M {ls[0]},{ls[1]} Q {sx},{sy-15} {rs[0]},{rs[1]} Q {hx+42*width},{hy-45} {rh[0]+10},{rh[1]+ext} Q {hx},{hy+ext+12} {lh[0]-10},{lh[1]+ext} Q {hx-42*width},{hy-45} {ls[0]},{ls[1]} Z',fill,2.4,'torso')
        if outfit=='coat':
            d.path(f'M {sx-17},{sy} L {sx-2},{sy+32} L {sx-21},{sy+51} L {hx},{hy+ext} M {sx+17},{sy} L {sx+2},{sy+32} L {sx+21},{sy+51}',width=1.4,id='coat-lapels');d.rect(hx-33,hy-22,20,29,'white',1,id='coat-pocket')
        elif outfit=='tunic':d.path(f'M {sx-17},{sy} L {hx+20},{hy-6} M {sx+17},{sy} L {sx-10},{sy+44}',width=2,id='tunic-cross')
        else:d.path(f'M {sx-19},{sy+2} Q {sx},{sy+24} {sx+19},{sy+2}',width=2,id='shirt-collar')
        d.path(f'M {rs[0]-3},{rs[1]+13} Q {hx+29},{hy-50} {rh[0]+10},{rh[1]+ext} L {rh[0]},{rh[1]+ext+2} Q {hx+13},{hy-54} {rs[0]-15},{rs[1]+22} Z',INK,0,'torso-shadow')
        for i in range(3):d.path(f'M {hx-22},{hy-40+i*14} q 11,6 21,1',width=.8,id='cloth-fold'+str(i))
        head(d,o,j)
    if layer in {'all','front'}:arm('right')
    if guides and layer in {'all','body'}:
        for side in ['left','right']:
            for a,b in [('shoulder','elbow'),('elbow','wrist'),('hip','knee'),('knee','ankle')]:d.line(j[side+'_'+a],j[side+'_'+b],1,BLUE,id=side+'-guide-'+a)
    d.parts.append('</g>')
