"""Original Prism Wardens design studies. Authored 2D views, not franchise replicas or a 3D rig."""
import math,re
KINDS={'team_helmet','team_suit'}
INK='#202637';PAPER='#f5eee1';GUIDE='#6594ab'
def validate_object(o):
    if o.get('kind') not in KINDS:return False
    allowed={'id','kind','position','scale','motif','color','silhouette'}|({'view','stage'} if o['kind']=='team_helmet' else {'pose'})
    if set(o)-allowed:raise ValueError('Unknown team design field')
    num=lambda v:type(v) in (int,float) and math.isfinite(v)
    if 'position'in o and(not isinstance(o['position'],list)or len(o['position'])!=2 or not all(num(n)and abs(n)<=10000 for n in o['position'])):raise ValueError('position requires finite pair')
    if 'scale'in o and(not num(o['scale'])or not .05<=o['scale']<=10):raise ValueError('scale out of range')
    for key,choices in [('motif',{'comet','wave','leaf'}),('view',{'front','three_quarter','profile'}),('stage',{'skull','shell','finish'}),('pose',{'stand','guard','lunge'})]:
        if key in o and(not isinstance(o[key],str)or o[key]not in choices):raise ValueError('Invalid '+key)
    if 'color'in o and(not isinstance(o['color'],str)or not re.fullmatch('#[0-9a-fA-F]{6}',o['color'])):raise ValueError('color must be hex RGB')
    if 'silhouette'in o and type(o['silhouette'])is not bool:raise ValueError('silhouette must be boolean')
    return True

def helmet(d,o,guides=False):
    view=o.get('view','front');stage=o.get('stage','finish');motif=o.get('motif','comet');sil=o.get('silhouette',False);c=INK if sil else o.get('color','#c74d4c');white=INK if sil else PAPER
    shells={'front':'M -48,-35 C -51,-87 -28,-111 0,-111 C 35,-111 52,-82 49,-35 L 38,-8 Q 0,13 -38,-8 Z','three_quarter':'M -50,-36 C -57,-84 -29,-114 4,-109 C 40,-106 52,-80 51,-49 L 60,-28 L 39,0 Q 5,13 -34,-9 Z','profile':'M -46,-31 C -62,-65 -41,-108 -10,-109 C 23,-113 42,-87 39,-61 L 56,-39 L 49,-21 L 29,-12 L 17,3 L -22,-3 Z'}
    if stage!='skull':d.path(shells[view],c,2.6,'shell')
    if stage=='skull' or guides:
        d.ellipse(-3,-62,35,39,'none',1,'cranial-vault')
        if view=='front':
            jaw='M -36,-52 L -32,-28 L -20,-11 Q 0,1 19,-11 L 31,-28 L 33,-52'
            sockets='M -27,-57 Q -17,-66 -7,-57 L -9,-46 Q -19,-42 -27,-49 Z M 5,-57 Q 16,-66 26,-57 L 25,-49 Q 16,-42 7,-46 Z'
            nose='M -1,-54 L -5,-34 L 4,-34 M -13,-23 Q 0,-18 13,-23'
            ears='M -35,-54 Q -46,-57 -42,-42 L -35,-35 M 33,-54 Q 43,-57 41,-42 L 33,-35'
        elif view=='three_quarter':
            jaw='M -35,-52 L -30,-25 L -8,-6 L 18,-6 L 38,-25 L 39,-45'
            sockets='M -25,-57 Q -14,-64 0,-56 L -1,-45 Q -15,-41 -24,-48 Z M 15,-57 Q 25,-61 32,-54 L 32,-45 L 19,-44 Z'
            nose='M 10,-55 L 21,-33 L 10,-31 M 1,-22 Q 14,-17 26,-23'
            ears='M -34,-53 Q -45,-55 -41,-39 L -32,-32'
        else:
            jaw='M -34,-49 L -27,-23 L -11,-8 L 15,-8 L 29,-22 L 29,-35'
            sockets='M 10,-61 Q 24,-65 30,-56 L 23,-48 L 12,-49 Z'
            nose='M 29,-56 L 42,-38 L 30,-35 M 23,-27 L 32,-25'
            ears='M -17,-56 Q -30,-63 -29,-47 Q -26,-33 -16,-41 M -21,-53 L -24,-44'
        d.path(jaw,width=1.3,stroke=GUIDE,id='jaw-cheek-chin')
        d.path(sockets,width=1,stroke=GUIDE,id='brow-eye-sockets')
        d.path(nose,width=1,stroke=GUIDE,id='nose-mouth-landmarks')
        d.path(ears,width=1,stroke=GUIDE,id='ear-landmarks')
        d.line((-41,-55),(42,-55),1,GUIDE,'brow-axis');d.path('M 0,-102 Q 18,-58 0,-7',width=1,stroke=GUIDE,id='skull-meridian')
    if stage=='skull':return
    if stage=='shell':
        d.path('M -40,-26 Q 0,-7 39,-25',width=2,stroke=white,id='rim-thickness');return
    if view=='front':
        visor='M -43,-65 Q 0,-77 43,-65 L 35,-40 L 8,-32 L 0,-40 L -8,-32 L -35,-40 Z';rim='M -36,-27 Q 0,-8 36,-27 L 30,-11 Q 0,4 -30,-11 Z';shine='M -33,-83 Q -21,-100 -3,-101 L -8,-94 Q -24,-91 -30,-78 Z'
    elif view=='three_quarter':
        visor='M -43,-65 Q -4,-78 42,-61 L 51,-39 L 22,-31 L 11,-39 L -30,-38 Z';rim='M -31,-24 Q 8,-9 43,-27 L 35,-10 Q 5,5 -27,-10 Z';shine='M -35,-83 Q -20,-101 -1,-100 L -7,-92 Q -23,-88 -31,-77 Z'
    else:
        visor='M -8,-74 Q 19,-75 36,-61 L 49,-40 L 28,-33 L 14,-40 L -4,-42 Z';rim='M -18,-22 L 28,-22 L 18,-6 L -18,-9 Z';shine='M -36,-78 Q -30,-99 -12,-101 L -17,-92 L -30,-74 Z'
    d.path(visor,INK,1.6,'visor');d.path(rim,white,1.5,'chin-rim');d.path(shine,white,.5,'curved-reflection',stroke=white)
    d.path('M -32,-57 Q -13,-66 6,-62',width=2,stroke=white,id='visor-reflection') if view!='profile' else d.path('M 4,-65 L 26,-56',width=2,stroke=white,id='visor-reflection')
    if motif=='comet':crest='M -8,-104 L -2,-133 L 14,-112 L 6,-83 Z'
    elif motif=='wave':crest='M -25,-100 Q -24,-125 -4,-126 Q 17,-129 24,-111 Q 4,-122 4,-101 L -5,-85 Z'
    else:crest='M -8,-100 Q -37,-129 -22,-139 Q -1,-133 1,-110 Q 14,-137 30,-128 Q 29,-108 8,-98 L 0,-82 Z'
    d.path(crest,white,2,'crest')
    if not sil:d.path('M -26,-18 L -14,-14 M 16,-14 L 26,-18',width=1.2,id='chin-vents')

def joints(pose):
    return {'stand':[(-48,0),(48,0),(-69,76),(74,73),(-74,141),(78,137),(-25,153),(27,153),(-36,256),(44,256),(-45,357),(58,357)],'guard':[(-47,4),(43,-5),(-89,64),(87,27),(-47,36),(107,-42),(-21,155),(29,148),(-60,249),(79,238),(-87,357),(118,357)],'lunge':[(-44,5),(38,-15),(-100,44),(101,-44),(-143,21),(166,-52),(-9,138),(39,126),(-75,224),(128,194),(-119,336),(176,336)]}[pose]

def segment(d,a,b,ra,rb,fill,id):
    dx,dy=b[0]-a[0],b[1]-a[1];ln=math.hypot(dx,dy);nx,ny=-dy/ln,dx/ln
    p=lambda t,r,sgn:(a[0]+dx*t+nx*r*sgn,a[1]+dy*t+ny*r*sgn)
    pts=[p(0,ra,1),p(.5,(ra+rb)*.53,1),p(1,rb,1),p(1,rb,-1),p(.5,(ra+rb)*.53,-1),p(0,ra,-1)]
    d.path(f'M {pts[0][0]},{pts[0][1]} Q {pts[1][0]},{pts[1][1]} {pts[2][0]},{pts[2][1]} L {pts[3][0]},{pts[3][1]} Q {pts[4][0]},{pts[4][1]} {pts[5][0]},{pts[5][1]} Z',fill,2,id)

def suit(d,o,guides=False):
    pose=o.get('pose','stand');j=joints(pose);ls,rs,le,re,lw,rw,lh,rh,lk,rk,la,ra=j;sil=o.get('silhouette',False);motif=o.get('motif','comet');c=INK if sil else o.get('color','#c74d4c');white=INK if sil else PAPER
    if pose!='stand':d.path('M -17,-22 Q -100,-15 -138,-68 L -130,-38 L -173,-45 Q -111,4 -13,-4 Z',c,2,'scarf-secondary')
    for name,h,k,a in [('left',lh,lk,la),('right',rh,rk,ra)]:
        d.ellipse(k[0],k[1],17,17,INK,1,name+'-knee-seal');segment(d,h,k,23,16,c,name+'-thigh');segment(d,k,a,18,11,INK,name+'-shin')
        segment(d,(k[0]+(a[0]-k[0])*.2,k[1]+(a[1]-k[1])*.2),a,17,13,white,name+'-boot')
        d.path(f'M {a[0]-14},{a[1]-7} L {a[0]+13},{a[1]-7} Q {a[0]+20},{a[1]+5} {a[0]+34},{a[1]+9} L {a[0]+36},{a[1]+18} L {a[0]-18},{a[1]+18} Z',white,2,name+'-sole')
    d.path(f'M {ls[0]},{ls[1]} Q 0,-16 {rs[0]},{rs[1]} L {rh[0]+9},{rh[1]} Q 7,178 {lh[0]-9},{lh[1]} Z',c,2.5,'bodysuit')
    d.path(f'M {ls[0]+5},{ls[1]+11} L 0,65 L {rs[0]-4},{rs[1]+11} L {rs[0]-8},{rs[1]+38} L 0,91 L {ls[0]+8},{ls[1]+38} Z',white,1.5,'team-chevron')
    d.path(f'M {lh[0]-8},{lh[1]-12} L {rh[0]+8},{rh[1]-12} L {rh[0]+8},{rh[1]+3} L {lh[0]-8},{lh[1]+3} Z',white,1.5,'belt');d.ellipse(3,149,11,9,c,1.5,'buckle')
    for name,s,e,w in [('left',ls,le,lw),('right',rs,re,rw)]:
        d.ellipse(e[0],e[1],14,14,INK,1,name+'-elbow-seal');segment(d,s,e,22,14,c,name+'-upperarm');segment(d,e,w,15,10,INK,name+'-underarm')
        a=(e[0]+(w[0]-e[0])*.28,e[1]+(w[1]-e[1])*.28);segment(d,a,w,15,11,white,name+'-gauntlet')
        d.ellipse(w[0],w[1],13,16,white,2,name+'-fist')
        if not sil:
            for z in range(3):d.line((w[0]-7+z*5,w[1]-6),(w[0]-7+z*5,w[1]+1),1,INK,name+'-knuckle'+str(z))
        sx,sy=s
        if motif=='comet':d.poly([(sx-25,sy+2),(sx,sy-17),(sx+25,sy+2),(sx+18,sy+23),(sx,sy+12),(sx-18,sy+23)],white,2,name+'-shoulder')
        elif motif=='wave':d.ellipse(sx,sy+3,25,18,white,2,name+'-shoulder')
        else:d.path(f'M {sx-24},{sy+12} Q {sx-34},{sy-20} {sx},{sy-13} Q {sx+34},{sy-20} {sx+24},{sy+12} L {sx},{sy+25} Z',white,2,name+'-shoulder')
    d.path('M -18,-23 L 18,-23 L 21,1 Q 0,13 -21,1 Z',INK,2,'neck-seal')
    d.path('M -28,-10 Q 0,0 28,-10 L 26,1 Q 0,18 -26,1 Z',white,2,'collar')
    d.parts.append('<g transform="translate(0 -18) scale(.78)">');helmet(d,{**o,'view':'front' if pose=='stand' else 'three_quarter','stage':'finish'},guides);d.parts.append('</g>')
    if guides:
        for a,b in [(ls,rs),(lh,rh),(ls,le),(le,lw),(rs,re),(re,rw),(lh,lk),(lk,la),(rh,rk),(rk,ra)]:d.line(a,b,1,GUIDE)
        d.path('M 0,-112 Q 30,80 0,148 Q -35,251 '+str(la[0])+','+str(la[1]),width=1.5,stroke=GUIDE,id='gesture')
        d.line((0,-110),(0,max(la[1],ra[1])+20),1,GUIDE,'support-axis')

def render(d,o,camera=None,guides=False):
    validate_object(o);x,y=o.get('position',[300,250]);s=o.get('scale',1);start=len(d.parts)
    d.parts.append(f'<g transform="translate({x} {y}) scale({s})">')
    (helmet if o['kind']=='team_helmet' else suit)(d,o,guides)
    d.parts.append('</g>')
    if o.get('silhouette',False):
        for i in range(start,len(d.parts)):d.parts[i]=re.sub(r'stroke="[^"]*"',f'stroke="{INK}"',d.parts[i])
