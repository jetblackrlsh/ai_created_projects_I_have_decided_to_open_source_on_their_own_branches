"""Original bellflower transformation costumes over an articulated 2D figure.
Design synthesis from fashion principles, not a franchise copy or cloth simulation.
"""
import copy,math
from . import interaction_figures as fig
from . import characters as ch
KINDS={'transformation_hero'};INK=ch.INK
BODY_KEYS={'position','scale','mirror','rotation','pose','joints','view','expression','gaze','head_angle','hand_angles','left_hand','right_hand'}
def body_object(o):
    b={k:copy.deepcopy(v)for k,v in o.items()if k in BODY_KEYS};b.update(kind='interaction_figure',id=o.get('id','hero'),identity={'hair':o.get('hair','bob'),'outfit':'tunic','build':'slim','age':'adult'},contour='organic');return b

def validate_object(o):
    if o.get('kind')not in KINDS:return False
    allowed=BODY_KEYS|{'id','kind','role','motif','palette','cape','wind','hair','stage','fabric'}
    if set(o)-allowed:raise ValueError('Unknown transformation_hero fields: '+str(set(o)-allowed))
    for k,choices in [('role',{'mage','knight'}),('motif',{'bellflower','comet','crystal'}),('palette',{'ink','cel'}),('hair',{'short','bob','long'}),('stage',{'base','tailored','finished'}),('fabric',{'pleated','gathered'})]:
        if k in o and (not isinstance(o[k],str)or o[k]not in choices):raise ValueError('Invalid '+k)
    if 'cape'in o and type(o['cape'])is not bool:raise ValueError('cape must be boolean')
    if 'wind'in o and (type(o['wind'])not in (int,float)or not math.isfinite(o['wind'])or not -1<=o['wind']<=1):raise ValueError('wind requires -1..1')
    b=body_object(o)
    # Existing body identity does not expose long hair, but its portrait renderer does.
    b['identity']['hair']='bob' if o.get('hair')=='long'else o.get('hair','bob')
    fig.validate_object(b);return True

def contact_points(o):
    validate_object(o);b=body_object(o);b['identity']['hair']='bob';return fig.contact_points(b)

def set_hand_target(o,side,target,elbow=None):
    validate_object(o);b=body_object(o);b['identity']['hair']='bob';q=fig.set_hand_target(b,side,target,elbow);r=copy.deepcopy(o)
    for k in ['joints','hand_angles']:r[k]=q[k]
    return r

def crest(d,x,y,motif,fill,scale=1,id='crest'):
    old=ch.scope(d,id);d.parts.append(f'<g transform="translate({x} {y}) scale({scale})">')
    from .transformation_props import emblem
    emblem(d,motif,0,0,21,fill,prefix='shared')
    d.parts.append('</g>');d.prefix=old

def bow(d,x,y,wind,fill,trim,id='bow'):
    old=ch.scope(d,id);d.parts.append(f'<g transform="translate({x} {y})">');w=wind*24
    d.path(f'M -5,2 Q -38,{-25-w*.3} -45,-12 Q -52,7 -35,22 L -3,10 Z M 5,2 Q 35,{-27+w*.3} 46,-11 Q 52,8 34,22 L 3,10 Z',fill,1.6,'loops')
    d.path(f'M -7,9 Q {-18+w},36 {-25+w},58 L {-10+w},53 L {-1+w},63 Q {6+w},35 5,10 M 5,9 Q {24+w},30 {32+w},51 L {18+w},48 L {12+w},58 Q {5+w},35 -3,10',fill,1.4,'tails')
    d.path('M -36,-8 Q -17,0 -7,6 M 35,-8 Q 18,0 7,6',width=1,id='tension-folds');d.ellipse(0,7,9,10,trim,1.5,'knot');d.parts.append('</g>');d.prefix=old

def skirt(d,hx,hy,wind,fabric,fill,trim):
    shift=wind*37;left=hx-85+shift;right=hx+85+shift;top=hy-14;bottom=hy+72
    if fabric=='pleated':
        hem=[(left+i*17,bottom+(-5 if i%2==0 else 5))for i in range(11)]
        d.poly([(hx-34,top),(hx+34,top)]+list(reversed(hem)),fill,2,'skirt')
        for i in range(1,10):
            xx=left+i*17;tx=hx-34+i*6.8
            if i%2==0:d.path(f'M {tx},{top+5} L {xx},{bottom-5} L {xx-8},{bottom+5} Z',trim,0,'pleat-shadow'+str(i))
            else:d.path(f'M {tx},{top+4} L {xx},{bottom+5}',width=1,id='pleat'+str(i))
    else:
        path=f'M {hx-34},{top} L {hx+34},{top} Q {right-7},{bottom-32} {right},{bottom}'
        for i in range(10,0,-1):
            xx=left+i*17;path+=f' Q {xx-8},{bottom+(11 if i%2 else -11)} {xx-17},{bottom}'
        path+=f' Q {left+7},{bottom-32} {hx-34},{top} Z';d.path(path,fill,2,'skirt')
        for i in range(1,10):
            xx=left+i*17;tx=hx-30+i*6
            if i%2:d.path(f'M {tx},{top+6} Q {(xx+tx)/2},{bottom-30} {xx},{bottom-3}',width=.9,id='gather'+str(i))
            else:
                d.path(f'M {xx-5},{bottom-18} Q {xx+1},{bottom-4} {xx},{bottom+3}',width=.9,id='gather-hidden'+str(i))
                d.path(f'M {xx-8},{bottom} Q {xx-2},{bottom+11} {xx+8},{bottom} Q {xx},{bottom+3} {xx-8},{bottom} Z',trim,0,'frill-underside'+str(i))
    d.path(f'M {hx-34},{top} Q {hx},{top+8} {hx+34},{top}',width=3,id='waist-seam',stroke=trim)

def render(d,o,camera=None,guides=False):
    validate_object(o);b=body_object(o);j=fig.joint_data(b);x,y=o.get('position',[400,300]);sc=o.get('scale',1);m=-1 if o.get('mirror')else 1;role=o.get('role','mage');motif=o.get('motif','bellflower');wind=o.get('wind',0);cel=o.get('palette','cel')=='cel';stage=o.get('stage','finished');finish=stage=='finished';tailor=stage!='base'
    # Violet, pale aqua and warm gold form the bounded main costume palette.
    suit='#a3c7cb'if cel else 'white';dark='#4d416c'if cel else INK;gold='#eddca3'if cel else 'url(#tone)';skin='white'
    ls,rs,lh,rh=[j[k]for k in ['left_shoulder','right_shoulder','left_hip','right_hip']];sx,sy=(ls[0]+rs[0])/2,(ls[1]+rs[1])/2;hx,hy=(lh[0]+rh[0])/2,(lh[1]+rh[1])/2
    d.parts.append(f'<g transform="translate({x} {y}) scale({sc*m} {sc}) rotate({o.get("rotation",0)})">')
    if o.get('cape',role=='knight')and tailor:
        flow=wind*120;d.path(f'M {ls[0]},{ls[1]} Q {ls[0]-55+flow},{sy+80} {hx-100+flow},{hy+160} Q {hx-12+flow},{hy+130} {hx+15+flow},{hy+167} Q {hx+72+flow},{hy+115} {hx+115+flow},{hy+143} Q {rs[0]+30+flow},{sy+75} {rs[0]},{rs[1]} Z',dark,2,'cape')
        for i in range(3):d.path(f'M {sx-25+i*25},{sy+7} Q {hx-42+i*42+flow*.5},{hy-10} {hx-75+i*70+flow},{hy+137}',width=1,id='cape-fold'+str(i),stroke=suit)
    if o.get('hair')=='long':
        old=ch.scope(d,'head');d.parts.append(f'<g transform="translate({sx} {sy-104}) rotate({o.get("head_angle",0)}) scale(.78)">')
        d.path('M -44,38 C -70,67 -50,142 -70,176 Q 0,202 61,170 C 49,137 75,64 38,33 Z',INK,2,'hair-back');d.parts.append('</g>');d.prefix=old
    for side in ['left','right']:
        a,k,c=[j[side+'_'+n]for n in ['hip','knee','ankle']];fig.organic_leg(d,a,k,c,22,17,11,'white'if role=='mage'or not tailor else suit,side+'-leg')
        ax,ay=c;d.path(f'M {ax-13},{ay-66} Q {ax},{ay-51} {ax+13},{ay-66} L {ax+14},{ay+2} Q {ax+31},{ay+7} {ax+27},{ay+16} L {ax-18},{ay+16} Z',dark if tailor else 'white',1.8,side+'-boot')
        if finish:crest(d,ax,ay-48,motif,gold,.32,side+'-boot-crest')
    def arm(side):
        a,e,w=[j[side+'_'+n]for n in ['shoulder','elbow','wrist']];start=len(d.parts);fig.organic_arm(d,a,e,w,17,10.5,8,side)
        if role=='knight'and tailor:
            for i in range(start,len(d.parts)):d.parts[i]=d.parts[i].replace('fill="white"',f'fill="{suit}"').replace('fill="#f7f7fa"',f'fill="{suit}"')
        wrist,angle,hs=fig.hand_geometry(b,side,j);old=ch.scope(d,side+'-hand');d.parts.append(f'<g transform="translate({wrist[0]} {wrist[1]}) rotate({math.degrees(angle)}) scale({hs})">');gesture=o.get(side+'_hand','open')
        if gesture=='open':fig.relaxed_hand(d)
        elif gesture=='support':d.path('M -16,0 L -20,-20 L 48,-20 Q 63,-20 67,-12 Q 49,-7 19,-7 L 16,0 Z','white',1.7,'silhouette')
        else:ch.hand(d,gesture)
        if finish:d.path('M -17,2 L -19,17 L 18,17 L 16,2 Z',gold,1.6,'cuff')
        d.parts.append('</g>');d.prefix=old
    arm('left')
    d.path(f'M {ls[0]},{ls[1]+4} Q {sx-20},{sy-7} {sx-13},{sy-20} L {sx+13},{sy-20} Q {sx+21},{sy-7} {rs[0]},{rs[1]+4} C {rs[0]-8},{sy+53} {hx+29},{hy-48} {rh[0]+5},{rh[1]} Q {hx},{hy+14} {lh[0]-5},{lh[1]} C {hx-29},{hy-48} {ls[0]+8},{sy+53} {ls[0]},{ls[1]+4} Z',suit if tailor else 'white',2.3,'bodice')
    if role=='mage':
        if tailor:skirt(d,hx,hy,wind,o.get('fabric','pleated'),dark,gold if finish else suit)
        else:d.path(f'M {hx-34},{hy-14} L {hx+34},{hy-14} L {hx+85+wind*37},{hy+72} Q {hx+wind*37},{hy+88} {hx-85+wind*37},{hy+72} Z','white',2,'skirt')
        if tailor:
            d.path(f'M {ls[0]+3},{ls[1]+5} Q {sx-27},{sy+24} {sx},{sy+43} Q {sx+27},{sy+24} {rs[0]-3},{rs[1]+5} L {sx+12},{sy-5} L {sx},{sy+15} L {sx-12},{sy-5} Z','white',1.7,'petal-collar')
            bow(d,sx,sy+42,wind,dark,gold,'chest-bow')
    else:
        d.path(f'M {lh[0]-6},{hy-12} Q {hx},{hy+1} {rh[0]+6},{hy-12} L {hx+66+wind*20},{hy+76} L {hx+13},{hy+52} L {hx},{hy+11} L {hx-13},{hy+52} L {hx-66+wind*20},{hy+76} Z',dark if tailor else 'white',2,'split-petal-tunic')
        if tailor:
            d.path(f'M {ls[0]+5},{ls[1]+6} L {sx-18},{sy-7} L {sx},{sy+26} L {sx+18},{sy-7} L {rs[0]-5},{rs[1]+6} L {sx},{sy+57} Z',gold,1.7,'ceremonial-yoke')
            d.path(f'M {sx},{sy+59} Q {sx-16},{sy+99} {hx},{hy-17}',width=2,id='tunic-seam',stroke=dark)
    if finish:
        d.path(f'M {lh[0]-6},{hy-13} Q {hx},{hy-2} {rh[0]+6},{hy-13} L {rh[0]+8},{hy+1} Q {hx},{hy+12} {lh[0]-8},{hy+1} Z',gold,1.5,'waist-band')
        crest(d,sx,sy+(52 if role=='mage'else 28),motif,suit,.63,'transformation-brooch')
        for side,p in [('left',ls),('right',rs)]:
            if role=='knight':d.path(f'M {p[0]-20},{p[1]+8} Q {p[0]},{p[1]-25} {p[0]+20},{p[1]+8} L {p[0]+11},{p[1]+17} Q {p[0]},{p[1]+9} {p[0]-11},{p[1]+17} Z',gold,1.5,side+'-petal-epaulet')
    # Head is whole-head rotated; costume identity remains independent of gaze.
    old=ch.scope(d,'head');d.parts.append(f'<g transform="translate({sx} {sy-104}) rotate({o.get("head_angle",0)}) scale(.78)">');ch.portrait(d,{'view':o.get('view','threequarter'),'hair':'bob' if o.get('hair')=='long'else o.get('hair','bob'),'expression':o.get('expression','calm'),'gaze':o.get('gaze',[0,0]),'face_style':'expressive'})
    if finish:
        d.path('M -40,53 Q 0,35 40,53 L 30,58 Q 0,46 -30,58 Z',gold,1.2,'diadem');crest(d,0,43,motif,suit,.35,'diadem-crest')
    d.parts.append('</g>');d.prefix=old;arm('right')
    if guides:
        d.line(ls,rs,1.3,'#548eac',id='shoulder-guide');d.line(lh,rh,1.3,'#548eac',id='hip-guide')
        for side in ['left','right']:
            for aa,bb in [('shoulder','elbow'),('elbow','wrist'),('hip','knee'),('knee','ankle')]:d.line(j[side+'_'+aa],j[side+'_'+bb],.9,'#548eac',id=side+'-guide-'+aa)
    d.parts.append('</g>')
