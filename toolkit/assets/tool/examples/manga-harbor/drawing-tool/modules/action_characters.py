"""Original articulated 2D action drawings; authored poses, no 3D anatomy solver."""
import math
from . import characters as ch
KINDS={'action_figure'}
POSES={'punch','kick','dodge','land'}
JOINTS=ch.JOINTS
INK=ch.INK
BLUE='#5f9fc8'

def skeleton(pose):
    # Shoulder and hip axes genuinely change with each gesture.
    raw={
      'punch':[(-52,-30),(32,-55),(-110,24),(65,-10),(-67,-20),(105,-40),(-8,106),(62,132),(-83,231),(136,209),(-142,320),(197,278)],
      'kick':[(-46,-69),(24,-96),(-103,-120),(85,-78),(-86,-186),(113,-131),(6,60),(67,82),(-38,207),(152,-15),(-60,340),(245,-160)],
      'dodge':[(-100,-15),(-39,-61),(-162,28),(2,-113),(-186,-25),(57,-151),(30,89),(88,110),(-34,225),(150,198),(-141,291),(235,278)],
      'land':[(-52,27),(19,0),(-113,122),(96,93),(-172,221),(174,177),(18,147),(79,166),(-103,185),(184,181),(-151,292),(209,289)]
    }
    keys=['left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle']
    return dict(zip(keys,raw[pose]))

def validate_object(o):
    if o.get('kind') not in KINDS:return False
    allowed={'id','kind','position','scale','mirror','pose','joints','limb_width','foreshortening','head_angle','hair','expression','outfit','finish'}
    if set(o)-allowed:raise ValueError('Unknown action_figure fields: '+str(set(o)-allowed))
    num=lambda v:type(v) in (int,float) and math.isfinite(v)
    pair=lambda p:isinstance(p,list) and len(p)==2 and all(num(x) and abs(x)<=10000 for x in p)
    for k,choices in [('pose',POSES),('hair',ch.HAIR),('expression',ch.EXPRESSIONS),('outfit',{'tunic','sportswear'}),('finish',{'ink','cel','gradient'})]:
        if k in o and (not isinstance(o[k],str) or o[k] not in choices):raise ValueError('Invalid '+k)
    if 'position' in o and not pair(o['position']):raise ValueError('position must be finite [x,y]')
    for k,lo,hi in [('scale',.05,10),('limb_width',.5,2),('head_angle',-90,90)]:
        if k in o and (not num(o[k]) or not lo<=o[k]<=hi):raise ValueError('Invalid '+k)
    if 'mirror' in o and type(o['mirror']) is not bool:raise ValueError('mirror must be boolean')
    if 'joints' in o and (not isinstance(o['joints'],dict) or set(o['joints'])-JOINTS or not all(pair(v) for v in o['joints'].values())):raise ValueError('Invalid joints')
    f=o.get('foreshortening',{})
    if not isinstance(f,dict) or set(f)-{'left_arm','right_arm','left_leg','right_leg'} or not all(num(v) and .5<=v<=3 for v in f.values()):raise ValueError('foreshortening factors must be 0.5..3')
    return True

def joint_data(o):
    j=skeleton(o.get('pose','punch'));j.update(o.get('joints',{}));return j

def contact_points(o):
    """Screen-space on-outline knuckle, palm center, boot toe/sole corner and elbow points.
    Points follow the exact render transforms, including widths and depth scaling.
    """
    validate_object(o);j=joint_data(o);x,y=o.get('position',[400,400]);s=o.get('scale',1);m=-1 if o.get('mirror',False) else 1
    pose=o.get('pose','punch');width=o.get('limb_width',1);fs=o.get('foreshortening',{});result={}
    def world(p):return [x+s*m*p[0],y+s*p[1]]
    def transformed(p,origin,angle,scale):
        c=math.cos(angle);sn=math.sin(angle)
        return (origin[0]+scale*(p[0]*c-p[1]*sn),origin[1]+scale*(p[0]*sn+p[1]*c))
    for side in ['left','right']:
        wrist,elbow,knee,ankle=[j[side+'_'+n] for n in ['wrist','elbow','knee','ankle']]
        af=fs.get(side+'_arm',2.6 if pose=='punch' and side=='right' else 1)
        angle=math.atan2(wrist[1]-elbow[1],wrist[0]-elbow[0])+math.pi/2
        result[side+'_fist']=world(transformed((-.75,-57.25),wrist,angle,.65*af*width))
        result[side+'_palm']=world(transformed((0,-24),wrist,angle,.65*af*width))
        result[side+'_wrist']=world(wrist);result[side+'_elbow']=world(elbow)
        angle=math.atan2(ankle[1]-knee[1],ankle[0]-knee[0])-math.pi/2
        result[side+'_boot']=world(transformed((42,25),ankle,angle,width*fs.get(side+'_leg',1)))
    return result

def segment(d,a,b,ra,rb,fill,id):
    dx,dy=b[0]-a[0],b[1]-a[1];ln=max(math.hypot(dx,dy),1);nx,ny=-dy/ln,dx/ln
    def pt(t,r):return (a[0]+dx*t+nx*r,a[1]+dy*t+ny*r)
    def xy(p):return f'{p[0]},{p[1]}'
    # Fabric bulges at upper arm, then follows a tapered forearm curve.
    aa,bb,cc,dd=pt(0,ra),pt(1,rb),pt(1,-rb),pt(0,-ra)
    d.path(f'M {xy(aa)} C {xy(pt(.3,ra*1.12))} {xy(pt(.7,rb*1.1))} {xy(bb)} Q {xy(pt(1.05,0))} {xy(cc)} C {xy(pt(.65,-rb*.95))} {xy(pt(.25,-ra*1.05))} {xy(dd)} Q {xy(pt(-.1,0))} {xy(aa)} Z',fill,2,id)

def render(d,o,camera=None,guides=False):
    validate_object(o);j=joint_data(o);pose=o.get('pose','punch');x,y=o.get('position',[400,400]);s=o.get('scale',1);m=-1 if o.get('mirror',False) else 1
    d.parts.append(f'<g transform="translate({x} {y}) scale({s*m} {s})">')
    finish=o.get('finish','ink');cloth='white';skin='#faf8f5'
    if finish=='cel':cloth='#e2aa75';skin='#f5d4b6'
    elif finish=='gradient':
        gradient=d.prefix+'-cloth-gradient'
        d.parts.append(f'<defs><linearGradient id="{gradient}" x1="0" y1="0" x2="1" y2=".5"><stop offset="0" stop-color="#f6d9ad"/><stop offset=".5" stop-color="#d69e67"/><stop offset="1" stop-color="#895d51"/></linearGradient></defs>')
        cloth='url(#'+gradient+')';skin='#f5d4b6'
    widths=o.get('limb_width',1);fs=o.get('foreshortening',{})
    def limb(side,part):
        names=['hip','knee','ankle'] if part=='leg' else ['shoulder','elbow','wrist'];a,b,c=[j[side+'_'+n] for n in names]
        f=fs.get(side+'_'+part,2.6 if pose=='punch' and side=='right' and part=='arm' else 1)
        w=(25 if part=='leg' else 20)*widths
        fill='url(#tone)' if side=='left' else '#737584'
        if part=='arm':
            segment(d,a,b,w,w*.8,cloth,side+'-upper-arm')
            segment(d,b,c,w*.8,w*.62*f,skin,side+'-forearm')
            # Wrist wrap follows forearm axis, expanding with depth cue.
            dx,dy=c[0]-b[0],c[1]-b[1];ln=max(math.hypot(dx,dy),1);nx,ny=-dy/ln,dx/ln
            for q in [.75,.82,.89,.96]:
                xx,yy=b[0]+dx*q,b[1]+dy*q;rr=w*(.8*(1-q)+.62*f*q)
                d.line((xx-nx*rr,yy-ny*rr),(xx+nx*rr,yy+ny*rr),1.1,id=side+'-wrap-'+str(q))
            angle=math.degrees(math.atan2(dy,dx))+90
            old=ch.scope(d,side+'-fist');d.parts.append(f'<g transform="translate({c[0]} {c[1]}) rotate({angle}) scale({.65*f*widths})">');ch.hand(d,'fist');d.parts.append('</g>');d.prefix=old
        else:
            ch.bent_limb(d,a,b,c,w*1.2,w*.95,w*.62*f,fill,side+'-trouser')
            # Boot points along the shin rather than staying horizontal.
            angle=math.degrees(math.atan2(c[1]-b[1],c[0]-b[0]))-90
            d.parts.append(f'<g transform="translate({c[0]} {c[1]}) rotate({angle}) scale({widths*f})">')
            d.path('M -17,-22 L 17,-22 L 21,4 Q 46,10 42,25 L -20,25 Q -25,14 -17,-22 Z',INK,2,side+'-boot')
            d.path('M -17,19 L 40,19 M -10,-9 L 13,-9 M -12,-1 L 15,-1',width=1,id=side+'-boot-seams',stroke='#d7d7df');d.parts.append('</g>')
            d.line((a[0]+8,a[1]+20),(b[0]+5,b[1]-12),1,id=side+'-trouser-fold')
    limb('left','leg');limb('right','leg');limb('left','arm')
    ls,rs,lh,rh=[j[n] for n in ['left_shoulder','right_shoulder','left_hip','right_hip']]
    mid=lambda a,b:((a[0]+b[0])/2,(a[1]+b[1])/2)
    sh=mid(ls,rs);hp=mid(lh,rh);wa=mid(sh,hp)
    # Curved asymmetrical torso; changing hip/shoulder axes changes silhouette and folds.
    d.path(f'M {ls[0]},{ls[1]} Q {sh[0]},{sh[1]-18} {rs[0]},{rs[1]} Q {wa[0]+31},{wa[1]} {rh[0]+8},{rh[1]+14} Q {hp[0]},{hp[1]+35} {lh[0]-12},{lh[1]+13} Q {wa[0]-30},{wa[1]} {ls[0]},{ls[1]} Z',cloth,2.8,'torso')
    if finish=='cel':
        d.path(f'M {rs[0]},{rs[1]+6} Q {wa[0]+31},{wa[1]} {rh[0]+8},{rh[1]+14} L {rh[0]-8},{rh[1]+17} Q {wa[0]+6},{wa[1]} {rs[0]-13},{rs[1]+18} Z','#af785a',0,'cel-shadow')
    if o.get('outfit','tunic')=='tunic':
        d.path(f'M {sh[0]-17},{sh[1]-7} L {wa[0]+13},{wa[1]+14} L {rh[0]-2},{rh[1]+12} M {sh[0]+16},{sh[1]-9} L {wa[0]-14},{wa[1]+8}',width=3,id='cross-collar')
    else:
        d.path(f'M {ls[0]+9},{ls[1]} Q {sh[0]},{sh[1]+30} {rs[0]-9},{rs[1]} M {wa[0]},{wa[1]-20} L {hp[0]},{hp[1]}',width=3,id='sports-seams')
    d.poly([(lh[0]-10,lh[1]-7),(rh[0]+10,rh[1]-7),(rh[0]+10,rh[1]+10),(lh[0]-10,lh[1]+10)],INK,1,id='sash')
    d.path(f'M {hp[0]},{hp[1]} Q {hp[0]-50},{hp[1]+30} {hp[0]-105},{hp[1]+5} L {hp[0]-82},{hp[1]+30} Q {hp[0]-30},{hp[1]+44} {hp[0]+10},{hp[1]+8} Z',INK,1.2,'sash-tail')
    for n,t in enumerate([.35,.55,.73]):
        xx=ls[0]*(1-t)+lh[0]*t;yy=ls[1]*(1-t)+lh[1]*t
        d.path(f'M {xx+4},{yy} Q {wa[0]-7},{yy+8} {wa[0]+10},{yy+2}',width=1,id='torso-fold-'+str(n))
    angle=o.get('head_angle',{'punch':-12,'kick':-20,'dodge':-38,'land':15}[pose])
    old=ch.scope(d,'head');d.parts.append(f'<g transform="translate({sh[0]-5} {sh[1]-112}) rotate({angle} 0 105) scale(.78)">')
    ch.portrait(d,{'view':'threequarter','hair':o.get('hair','short'),'expression':o.get('expression','angry')});d.parts.append('</g>');d.prefix=old
    limb('right','arm')
    if guides:
        d.line(ls,rs,2,BLUE,id='shoulder-axis');d.line(lh,rh,2,BLUE,id='hip-axis')
        for side in ['left','right']:
            for chain in [('shoulder','elbow','wrist'),('hip','knee','ankle')]:
                for a,b in zip(chain,chain[1:]):d.line(j[side+'_'+a],j[side+'_'+b],1.5,BLUE,id='guide-'+side+'-'+a)
        d.path(f'M {sh[0]},{sh[1]-105} Q {wa[0]-30},{wa[1]} {hp[0]},{hp[1]+25}',width=2,id='line-of-action',stroke=BLUE)
        for name,(xx,yy) in j.items():d.ellipse(xx,yy,4,4,'white',1,id='joint-'+name)
    d.parts.append('</g>')
