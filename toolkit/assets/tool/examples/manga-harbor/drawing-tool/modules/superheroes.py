"""Original compass-themed superhero. Screen-space construction, not a 3D rig."""
import math
from . import characters as ch
INK=ch.INK;BLUE='#5f9fc8';KINDS={'hero'}
def validate_object(o):
    if o.get('kind')!='hero':return False
    allowed={'id','kind','position','scale','mirror','pose','palette','cape','wind','inking','emblem'}
    if set(o)-allowed:raise ValueError('Unknown hero fields')
    num=lambda v:type(v) in (int,float) and math.isfinite(v)
    if 'position' in o and (not isinstance(o['position'],list) or len(o['position'])!=2 or not all(num(v) and abs(v)<=10000 for v in o['position'])):raise ValueError('position requires finite [x,y]')
    for k,lo,hi in [('scale',.05,10),('wind',-1,1)]:
        if k in o and (not num(o[k]) or not lo<=o[k]<=hi):raise ValueError('Invalid '+k)
    for k in ['mirror','cape','emblem']:
        if k in o and type(o[k]) is not bool:raise ValueError(k+' must be boolean')
    for k,choices in [('pose',{'heroic','flight','landing'}),('palette',{'ink','cel'}),('inking',{'fine','bold'})]:
        if k in o and (not isinstance(o[k],str) or o[k] not in choices):raise ValueError('Invalid '+k)
    return True

def joints(pose):
    names=['left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle']
    pts={'heroic':[(-54,0),(54,0),(-90,91),(90,91),(-111,174),(111,174),(-30,170),(30,170),(-40,304),(50,300),(-58,435),(70,435)],'flight':[(-50,0),(50,-15),(-95,-65),(83,-90),(-115,-151),(105,-195),(-20,162),(39,150),(-25,277),(103,246),(-83,354),(69,376)],'landing':[(-52,22),(20,0),(-109,123),(94,95),(-153,220),(169,190),(0,158),(65,154),(-102,206),(168,221),(-145,327),(198,327)]}[pose]
    return dict(zip(names,pts))
def contact_points(o):
    validate_object(o);pose=o.get('pose','heroic');j=joints(pose);angle=math.radians(48 if pose=='flight' else 0);c,sn=math.cos(angle),math.sin(angle);x,y=o.get('position',[400,300]);s=o.get('scale',1);m=-1 if o.get('mirror',False) else 1
    def world(p):return [x+m*s*(p[0]*c-p[1]*sn),y+s*(p[0]*sn+p[1]*c)]
    result={}
    for side in ['left','right']:
        result[side+'_power']=world(j[side+'_wrist']);a=j[side+'_ankle'];result[side+'_boot']=world((a[0]+28,a[1]+22))
    return result

def render(d,o,camera=None,guides=False):
    validate_object(o);pose=o.get('pose','heroic');j=joints(pose);x,y=o.get('position',[400,300]);s=o.get('scale',1);mirror=-1 if o.get('mirror',False) else 1;angle=48 if pose=='flight' else 0
    d.parts.append(f'<g transform="translate({x} {y}) scale({s*mirror} {s}) rotate({angle})">')
    bold=o.get('inking','bold')=='bold';lw=3 if bold else 1.2;cel=o.get('palette','ink')=='cel';suit='#6a9fab' if cel else 'white';trim='#e7cc87' if cel else 'url(#tone)';shadow='#244957' if cel else INK;cape='#43466e' if cel else '#676a7c'
    ls,rs,lh,rh=[j[k] for k in ['left_shoulder','right_shoulder','left_hip','right_hip']];sh=((ls[0]+rs[0])/2,(ls[1]+rs[1])/2);hp=((lh[0]+rh[0])/2,(lh[1]+rh[1])/2)
    wind=o.get('wind',.7 if pose=='flight' else .3);flow=wind*145
    if o.get('cape',True):
        d.path(f'M {ls[0]-8},{ls[1]-5} Q {ls[0]-82+flow},{ls[1]+84} {-161+flow},340 Q {-72+flow},311 {-7+flow},358 Q {83+flow},315 {155+flow},345 Q {rs[0]+80+flow},{rs[1]+100} {rs[0]+8},{rs[1]-5} Z',cape,lw,'cape')
        for i in range(5):
            startx=ls[0]+i*(rs[0]-ls[0])/4;endx=-130+i*65+flow
            d.path(f'M {startx},{sh[1]+9} Q {endx-flow*.4},{sh[1]+133} {endx},323',width=1.4,id='cape-fold'+str(i),stroke='#d2d0e0' if cel else '#b5b5c2')
    def limb(side,part):
        a,b,c=[j[side+'_'+n] for n in (['hip','knee','ankle'] if part=='leg' else ['shoulder','elbow','wrist'])];w=25 if part=='leg' else 21
        ch.bent_limb(d,a,b,c,w,w*.82,w*.57,suit,side+'-'+part)
        if part=='leg':
            xx,yy=c;d.path(f'M {xx-17},{yy-53} L {xx+15},{yy-53} L {xx+17},{yy+4} Q {xx+35},{yy+10} {xx+28},{yy+22} L {xx-24},{yy+22} Z',shadow,lw,side+'-boot')
            d.path(f'M {xx-16},{yy-47} L {xx+15},{yy-47} M {xx-18},{yy+15} H {xx+27}',width=2,id=side+'-boot-trim',stroke=trim if cel else '#f1f1f5')
        else:
            dx,dy=c[0]-b[0],c[1]-b[1];ang=math.degrees(math.atan2(dy,dx))+90
            d.parts.append(f'<g transform="translate({c[0]} {c[1]}) rotate({ang})">')
            d.path('M -14,4 L -17,37 L 17,37 L 14,4 Z',shadow,lw,side+'-gauntlet');old=ch.scope(d,side+'-glove');ch.hand(d,'fist');d.prefix=old;d.parts.append('</g>')
    limb('left','leg');limb('right','leg');limb('left','arm')
    # Broad pectoral mass, narrowing abdomen, distinct pelvic suit inset.
    d.path(f'M {ls[0]},{ls[1]} Q {sh[0]},{sh[1]-22} {rs[0]},{rs[1]} Q {rs[0]+2},{rs[1]+63} {hp[0]+31},{hp[1]-38} L {rh[0]+4},{rh[1]+17} Q {hp[0]},{hp[1]+34} {lh[0]-4},{lh[1]+17} L {hp[0]-31},{hp[1]-38} Q {ls[0]-2},{ls[1]+63} {ls[0]},{ls[1]} Z',suit,lw,'supersuit')
    d.path(f'M {ls[0]+3},{ls[1]+34} Q {sh[0]-22},{sh[1]+60} {sh[0]},{sh[1]+48} Q {sh[0]+22},{sh[1]+60} {rs[0]-3},{rs[1]+34}',width=1.2,id='chest-masses')
    for i in range(3):
        yy=sh[1]+77+i*24;xx=sh[0]+(hp[0]-sh[0])*(i+1)/4
        d.path(f'M {xx-17},{yy} Q {xx},{yy+10} {xx+17},{yy} M {xx},{yy+3} v 14',width=1,id='abdominal-seam'+str(i))
    d.poly([(lh[0]-4,lh[1]-5),(rh[0]+4,rh[1]-5),(rh[0],rh[1]+13),(lh[0],lh[1]+13)],trim,1.4,'belt')
    if bold:
        d.path(f'M {rs[0]-2},{rs[1]+4} Q {rs[0]+2},{rs[1]+63} {hp[0]+31},{hp[1]-38} L {rh[0]+4},{rh[1]+17} L {rh[0]-8},{rh[1]+20} Q {hp[0]+12},{hp[1]-29} {rs[0]-16},{rs[1]+25} Z',shadow,0,'spotted-side-black')
        # Tapered feather strokes transition from solid side shadow into lighter chest.
        for i in range(6):
            yy=sh[1]+47+i*10;xx=sh[0]+20+i*.5;d.path(f'M {xx+14},{yy} Q {xx-1},{yy+1} {xx-9-i%3*3},{yy-5} Q {xx+4},{yy+8} {xx+15},{yy+6} Z',INK,0,'feather'+str(i))
        d.path(f'M {ls[0]},{ls[1]} Q {ls[0]-2},{ls[1]+63} {hp[0]-31},{hp[1]-38}',width=.8,id='light-side-edge')
    if o.get('emblem',True):
        xx,yy=sh[0],sh[1]+28;d.path(f'M {xx},{yy-23} L {xx+18},{yy} L {xx},{yy+23} L {xx-18},{yy} Z',trim,1.6,'compass-emblem');d.path(f'M {xx},{yy-14} V {yy+14} M {xx-10},{yy} H {xx+10}',width=2,id='emblem-axis')
    # Original face is front-facing in concept pose, 3/4 for action; distinct eye mask.
    hx,hy=sh[0],sh[1]-106
    old=ch.scope(d,'head');d.parts.append(f'<g transform="translate({hx} {hy}) scale(.76)">');ch.portrait(d,{'view':'front' if pose=='heroic' else 'threequarter','hair':'short','expression':'calm' if pose=='heroic' else 'angry'})
    d.path('M -42,65 Q -21,59 0,70 Q 21,59 42,65 L 39,89 Q 20,84 0,99 Q -20,84 -39,89 Z',shadow,1.2,'mask')
    d.path('M -31,72 Q -20,69 -8,76 L -14,82 L -29,78 Z M 9,76 Q 21,69 32,72 L 29,78 L 15,82 Z','white',.6,'mask-eyes');d.parts.append('</g>');d.prefix=old
    limb('right','arm')
    if guides:
        d.line(ls,rs,1.5,BLUE,id='shoulder-axis');d.line(lh,rh,1.5,BLUE,id='pelvis-axis')
        for side in ['left','right']:
            for chain in [('shoulder','elbow','wrist'),('hip','knee','ankle')]:
                for a,b in zip(chain,chain[1:]):d.line(j[side+'_'+a],j[side+'_'+b],1,BLUE,id=side+'-guide-'+a)
    d.parts.append('</g>')
