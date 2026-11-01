"""Original staged power geometry with explicit contact anchors; no dynamics simulation."""
import math
KINDS={'cinematic_power'};INK='#24232e'
def validate_object(o):
    if o.get('kind')not in KINDS:return False
    allowed={'id','kind','form','position','target','scale','angle','stage','palette'}
    if set(o)-allowed:raise ValueError('Unknown cinematic_power field')
    num=lambda v:type(v)in(int,float)and math.isfinite(v)
    for k in ['position','target']:
        if k in o and (not isinstance(o[k],list)or len(o[k])!=2 or not all(num(v)and abs(v)<=10000 for v in o[k])):raise ValueError(k+' requires finite [x,y]')
    target=o.get('target',[220,-120])
    if math.hypot(*target)<20:raise ValueError('target must be at least 20 local units from source')
    for k,lo,hi,default in [('scale',.05,10,1),('angle',-180,180,0)]:
        v=o.get(k,default)
        if not num(v)or not lo<=v<=hi:raise ValueError('Invalid '+k)
    if type(o.get('stage',4))is not int or not 1<=o.get('stage',4)<=4:raise ValueError('stage integer 1..4 required')
    for k,choices,default in [('form',{'root','ice','force'},'root'),('palette',{'ink','cel'},'ink')]:
        if not isinstance(o.get(k,default),str)or o.get(k,default)not in choices:raise ValueError('Invalid '+k)
    return True

def transform(o,p):
    x,y=o.get('position',[300,400]);a=math.radians(o.get('angle',0));s=o.get('scale',1);c,n=math.cos(a),math.sin(a);return [x+s*(p[0]*c-p[1]*n),y+s*(p[0]*n+p[1]*c)]

def contact_points(o):
    # source/tip are authored staging markers; only root support is an exact load surface.
    validate_object(o);stage=o.get('stage',4);tx,ty=o.get('target',[220,-120]);form=o.get('form','root');amount=[.12,.5,1,1][stage-1]if form=='root'else [.15,.45,.75,1][stage-1]
    out={'source':transform(o,[0,0]),'tip':transform(o,[tx*amount,ty*amount])}
    if form=='root'and stage>=3:out['support']=transform(o,[tx,ty])
    return out

def root(d,o):
    stage=o.get('stage',4);tx,ty=o.get('target',[220,-120]);amount=[.12,.5,1,1][stage-1];x,y=tx*amount,ty*amount;cel=o.get('palette','ink')=='cel';fill='#879b7d'if cel else 'url(#tone)';shade='#394d42'if cel else INK
    # A load-bearing arch widens into two ground roots and a flat upper bearing pad.
    d.path(f'M -25,4 C {x*.05},{y*.6} {x*.48},{y-47} {x},{y+8} L {x},{y+26} C {x*.5},{y-12} {x*.12},{y*.5} 24,7 L 73,17 Q 24,18 5,10 Q -35,24 -72,15 Z',fill,2.3,'root-arch')
    d.path(f'M -21,5 C {x*.08},{y*.4} {x*.49},{y-24} {x-7},{y+16}',width=1.2,id='grain-main')
    for i in range(3):d.path(f'M {-11+i*10},8 Q {-30+i*30},15 {-62+i*59},15',width=1,id='ground-root'+str(i))
    if stage>=3:
        d.path(f'M {x-42},{y} L {x+42},{y} L {x+32},{y+14} L {x-29},{y+14} Z',fill,2,'bearing-pad')
        d.path(f'M {x-28},{y+13} Q {x-45},{y+46} {x*.51},{y*.56} Q {x*.56},{y*.31} 28,9',width=5,id='support-strut',stroke=shade)
    if stage==4:
        for i in range(5):
            xx=x*(.2+i*.14);yy=y*(.6+i*.04)-9
            d.path(f'M {xx},{yy} q -17,-20 -30,-8 q 9,21 30,8 M {xx},{yy} q 18,-23 29,-10 q -7,21 -29,10',fill,1,id='leaves'+str(i))
        d.path('M -90,19 l -18,9 15,2 M 75,18 l 17,8 -12,4',width=1.4,id='ground-splits')

def ice(d,o):
    stage=o.get('stage',4);tx,ty=o.get('target',[220,-120]);a=[.15,.45,.75,1][stage-1];x,y=tx*a,ty*a;ln=math.hypot(tx,ty);nx,ny=-ty/ln,tx/ln;w=45*a+9;cel=o.get('palette','ink')=='cel';fill='#c5e6ee'if cel else 'white';shade='#6e9fae'if cel else 'url(#tone)'
    p1=(-nx*w,-ny*w);p2=(nx*w,ny*w);mid=(x*.38+nx*w*.35,y*.38+ny*w*.35)
    d.poly([p1,(x,y),p2],fill,2.4,'ice-wedge');d.poly([(0,0),(x,y),p2,mid],shade,1.2,'ice-facet');d.line(p1,mid,1,id='facet-base');d.line(mid,(x,y),1,id='facet-edge')
    if stage>=3:
        for i in [-1,1]:
            bx=nx*w*i*.9;by=ny*w*i*.9;tip=(x*.5+nx*w*i*1.3,y*.5+ny*w*i*1.3)
            d.poly([(bx-12,by+8),tip,(bx+15,by+8)],fill,1.5,'side-crystal'+str(i));d.line((bx,by+7),tip,.8,id='side-facet'+str(i))
    d.path('M -52,18 l 17,-7 14,8 23,-15 17,11 28,-4 22,14 M -20,20 l -11,15 M 36,21 l 11,13',width=1.4,id='ground-fractures')
    if stage==4:
        for i in range(4):
            bx=-72+i*49;by=35+(i%2)*11;d.poly([(bx,by),(bx+11,by-8),(bx+17,by+3),(bx+5,by+8)],shade,1,'ice-chip'+str(i))

def force(d,o):
    stage=o.get('stage',4);tx,ty=o.get('target',[220,-120]);ln=math.hypot(tx,ty);ux,uy=tx/ln,ty/ln;nx,ny=-uy,ux;cel=o.get('palette','ink')=='cel';color='#8c70a8'if cel else INK;amount=[.15,.45,.75,1][stage-1];x,y=tx*amount,ty*amount
    for i in range(3):
        dist=ln*amount-i*18;r=(18+stage*10)*(1-i*.15);cx,cy=ux*dist,uy*dist
        d.path(f'M {cx+nx*r-ux*14},{cy+ny*r-uy*14} Q {cx+ux*r*.9},{cy+uy*r*.9} {cx-nx*r-ux*14},{cy-ny*r-uy*14}',width=3-i*.65,id='pressure-arc'+str(i),stroke=color)
    if stage>=2:
        for i in [-1,1]:d.path(f'M {nx*i*8},{ny*i*8} Q {x*.5+nx*i*14},{y*.5+ny*i*14} {x-ux*25+nx*i*20},{y-uy*25+ny*i*20}',width=1.3,id='travel-rail'+str(i),stroke=color)
    if stage==4:
        for i in range(5):
            dd=ln+28+i*14;side=(-1 if i%2 else 1)*(20+i*7);bx=ux*dd+nx*side;by=uy*dd+ny*side
            d.poly([(bx-6,by-4),(bx+8,by-9),(bx+13,by+4),(bx,by+8)],'url(#tone)',1.4,'displaced-rubble'+str(i));d.line((bx-ux*29,by-uy*29),(bx-ux*13,by-uy*13),1,id='rubble-trail'+str(i))
    if stage==1:d.ellipse(0,0,11,11,'none',1.5,'source-pulse')

def render(d,o,camera=None,guides=False):
    validate_object(o);x,y=o.get('position',[300,400]);sc=o.get('scale',1);angle=o.get('angle',0);d.parts.append(f'<g transform="translate({x} {y}) rotate({angle}) scale({sc})">')
    {'root':root,'ice':ice,'force':force}[o.get('form','root')](d,o)
    if guides:
        tx,ty=o.get('target',[220,-120]);d.line((0,0),(tx,ty),.7,'#519ac0',id='power-direction')
    d.parts.append('</g>')

# Original reusable local joint studies: pass to action_figure.joints.
windup={'left_shoulder':[-45,-20],'right_shoulder':[38,-50],'left_elbow':[-80,45],'left_wrist':[-45,6],'right_elbow':[-20,15],'right_wrist':[-70,-36],'left_hip':[-22,130],'right_hip':[45,146],'left_knee':[-105,235],'right_knee':[95,252],'left_ankle':[-160,330],'right_ankle':[100,335]}
extend={'left_shoulder':[-38,-30],'right_shoulder':[45,-47],'left_elbow':[-80,36],'left_wrist':[-24,49],'right_elbow':[125,-57],'right_wrist':[206,-65],'left_hip':[-15,120],'right_hip':[48,144],'left_knee':[-95,220],'right_knee':[124,240],'left_ankle':[-160,330],'right_ankle':[155,325]}
guard={'left_shoulder':[-45,-35],'right_shoulder':[40,-35],'left_elbow':[-88,0],'left_wrist':[-45,-65],'right_elbow':[75,25],'right_wrist':[100,-62],'left_hip':[-28,135],'right_hip':[31,135],'left_knee':[-48,245],'right_knee':[66,245],'left_ankle':[-80,335],'right_ankle':[99,335]}
recoil={'left_shoulder':[-112,-36],'right_shoulder':[-30,-82],'left_elbow':[-145,13],'left_wrist':[-127,-46],'right_elbow':[23,-35],'right_wrist':[57,-75],'left_hip':[-25,119],'right_hip':[36,139],'left_knee':[-70,221],'right_knee':[110,211],'left_ankle':[-123,326],'right_ankle':[153,322]}
land={'left_shoulder':[-86,23],'right_shoulder':[-9,-12],'left_elbow':[-134,89],'left_wrist':[-178,148],'right_elbow':[64,56],'right_wrist':[95,9],'left_hip':[-4,147],'right_hip':[64,137],'left_knee':[-91,207],'right_knee':[155,187],'left_ankle':[-133,326],'right_ankle':[180,326]}

def combat_joints(actor,beat):
    import copy
    if not isinstance(actor,str)or actor not in {"lead","receiver"}or type(beat)is not int or not 1<=beat<=4:raise ValueError("actor lead|receiver and beat integer1..4 required")
    return copy.deepcopy((windup if beat==1 else extend)if actor=="lead"else (guard if beat<3 else recoil if beat==3 else land))
