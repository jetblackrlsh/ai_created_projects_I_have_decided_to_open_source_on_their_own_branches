"""Original landmark-driven figure contours. Authored 2D anatomy, not a biomechanical simulation."""
import math,html,copy
INK='#121a2b'
def xy(p):return f'{p[0]:.2f},{p[1]:.2f}'
def mix(a,b,t):return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]
def norm(a,b):
 d=[b[0]-a[0],b[1]-a[1]];l=max(math.hypot(*d),.001);return [-d[1]/l,d[0]/l]
def off(p,n,r):return [p[0]+n[0]*r,p[1]+n[1]*r]
def path(d,fill='none',w=2,stroke=INK):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def line(a,b,w=1,stroke=INK):return path(f'M {xy(a)} L {xy(b)}',w=w,stroke=stroke)
BASE={'neck':[0,58],'ls':[-63,86],'rs':[63,86],'le':[-81,205],'re':[81,205],'lw':[-79,302],'rw':[79,302],'lh':[-32,278],'rh':[32,278],'lk':[-38,442],'rk':[40,442],'la':[-42,610],'ra':[45,610]}
POSES={
 'stand':{},
 'brace':{'ls':[-65,93],'rs':[57,70],'le':[-128,172],'lw':[-112,267],'re':[121,144],'rw':[112,242],'lh':[-24,277],'rh':[40,262],'lk':[-114,411],'rk':[135,394],'la':[-143,591],'ra':[169,585]},
 'run':{'neck':[8,57],'ls':[-50,85],'rs':[62,100],'le':[-102,170],'lw':[-54,210],'re':[128,58],'rw':[112,-24],'lh':[-38,272],'rh':[21,283],'lk':[-135,384],'rk':[106,398],'la':[-60,505],'ra':[168,561]},
 'strike':{'neck':[-12,64],'ls':[-72,89],'rs':[47,98],'le':[-133,166],'lw':[-56,190],'re':[163,89],'rw':[272,62],'lh':[-9,280],'rh':[51,268],'lk':[-89,414],'rk':[150,378],'la':[-134,578],'ra':[198,534]},
 'lift':{'ls':[-66,87],'rs':[65,86],'le':[-113,-13],'re':[118,-8],'lw':[-92,-125],'rw':[97,-119],'lh':[-34,281],'rh':[35,281],'lk':[-80,438],'rk':[88,436],'la':[-112,599],'ra':[120,600]},
 'leap':{'neck':[0,57],'ls':[-64,85],'rs':[60,81],'le':[-120,11],'re':[110,5],'lw':[-150,-87],'rw':[160,-62],'lh':[-20,273],'rh':[42,261],'lk':[-102,351],'rk':[135,307],'la':[-162,456],'ra':[170,414]},
 'crouch':{'neck':[-30,65],'ls':[-90,92],'rs':[35,105],'le':[-120,196],'lw':[-110,283],'re':[97,185],'rw':[113,276],'lh':[-21,263],'rh':[45,249],'lk':[-153,291],'rk':[157,277],'la':[-141,449],'ra':[180,433]},
 'fall':{'neck':[0,60],'ls':[-66,88],'rs':[62,82],'le':[-126,18],'lw':[-167,87],'re':[140,32],'rw':[174,106],'lh':[-18,278],'rh':[45,266],'lk':[-91,383],'rk':[131,353],'la':[-39,494],'ra':[172,465]}}
def joints(o):
 j=copy.deepcopy(BASE);j.update(copy.deepcopy(POSES[o.get('pose','stand')]));j.update(o.get('joints',{}));return j

def limb(a,b,c,width,fill,side,detail=True):
 # Tangent-connected contours soften elbow/knee transitions; asymmetric masses
 # distinguish upper muscle belly, joint and forearm/calf taper.
 u,v=norm(a,b),norm(b,c);n=[u[0]+v[0],u[1]+v[1]];ln=max(math.hypot(*n),.1);n=[z/ln for z in n];r0,r1,r2=width
 tangent=mix(a,c,.5);t=[c[0]-a[0],c[1]-a[1]];tl=max(math.hypot(*t),.01);t=[z/tl for z in t]
 def along(p,k):return [p[0]+t[0]*k,p[1]+t[1]*k]
 A,B,C=[off(p,q,r)for p,q,r in [(a,u,r0),(b,n,r1),(c,v,r2)]];D,E,F=[off(p,q,-r)for p,q,r in [(c,v,r2),(b,n,r1),(a,u,r0)]]
 blend=min(math.dist(a,b),math.dist(b,c))*.13
 s=path(f'M {xy(A)} C {xy(off(mix(a,b,.22),u,r0*1.48))} {xy(off(mix(a,b,.58),u,r0*.96))} {xy(along(B,-blend))} Q {xy(B)} {xy(along(B,blend))} C {xy(off(mix(b,c,.35),v,r1*1.65))} {xy(off(mix(b,c,.76),v,r2*1.06))} {xy(C)} L {xy(D)} C {xy(off(mix(b,c,.75),v,-r2*.92))} {xy(off(mix(b,c,.31),v,-r1*1.23))} {xy(along(E,blend))} Q {xy(E)} {xy(along(E,-blend))} C {xy(off(mix(a,b,.62),u,-r1*.9))} {xy(off(mix(a,b,.26),u,-r0*1.25))} {xy(F)} C {xy(off(mix(a,b,-.17),u,-r0*.65))} {xy(off(mix(a,b,-.17),u,r0*.65))} {xy(A)} Z',fill,3)
 if detail:
  s+=path(f'M {xy(off(mix(a,b,.15),u,r0*.38))} Q {xy(off(mix(a,b,.47),u,r0*.94))} {xy(off(mix(a,b,.74),u,r1*.20))}',w=1.6)
  s+=path(f'M {xy(off(mix(b,c,.15),v,-r1*.45))} Q {xy(off(mix(b,c,.42),v,-r1*.67))} {xy(off(mix(b,c,.81),v,-r2*.23))}',w=1.3)
  s+=path(f'M {xy(off(b,n,-r1*.55))} Q {xy(mix(b,c,.08))} {xy(off(mix(b,c,.08),n,r1*.48))}',w=1.2)
  s+=path(f'M {xy(off(mix(a,b,.24),u,-r0*.86))} Q {xy(off(mix(a,b,.48),u,-r0*.78))} {xy(off(mix(a,b,.70),u,-r1*.72))} L {xy(off(mix(a,b,.53),u,-r0*.44))} Z',INK,0)
 return f'<g id="{side}">{s}</g>'

def render_figure(o):
 ident=o.get('identity',{});build=ident.get('build','athletic');b={'athletic':1,'slim':.72,'broad':1.4,'stocky':1.55}[build];j=joints(o);prefix=o['id'];skin=o.get('skin','#f4d6b7');suit=o.get('suit','#b8cbd4');shadow=o.get('shadow','#516e80');age=ident.get('age','adult');ratio=.76 if age=='child' else 1
 if age=='child':j={k:[v[0]*.77,v[1]*.72]for k,v in j.items()}
 else:
  sx={'athletic':1,'slim':.90,'broad':1.15,'stocky':1.30}[build];sy=.82 if build=='stocky' else 1
  j={k:[v[0]*sx,v[1]*sy]for k,v in j.items()}
 # Anatomy retains same landmarks for guide and finish passes.
 s='';arms='';ls,rs,lh,rh=[j[k]for k in ['ls','rs','lh','rh']];top=mix(ls,rs,.5);hip=mix(lh,rh,.5);u=norm(top,hip)
 for side in ['l','r']:
  a,k,c=[j[side+key]for key in ['h','k','a']];s+=limb(a,k,c,[30*b*ratio,19*b*ratio,12*ratio],suit,prefix+'-'+side+'leg')
  s+=path(f'M {c[0]-14},{c[1]-8} Q {c[0]+8},{c[1]-5} {c[0]+26},{c[1]+13} L {c[0]+28},{c[1]+24} L {c[0]-22},{c[1]+24} L {c[0]-20},{c[1]+8} Z',shadow,3)
  s+=line([c[0]-20,c[1]+18],[c[0]+24,c[1]+18],1)
 # Arms behind torso; occlude shoulder root seams.
 for side in ['l','r']:
  a,k,c=[j[side+key]for key in ['s','e','w']];s+=limb(a,k,c,[23*b*ratio,15*b*ratio,10*ratio],skin,prefix+'-'+side+'arm')
 # pelvis & anatomical torso: separate ribcage and pelvic tilt.
 s+=path(f'M {xy(off(lh,u,8*b))} Q {xy(mix(top,hip,.70))} {xy(off(rh,u,-8*b))} L {rh[0]+10},{rh[1]+35} L {hip[0]},{hip[1]+48} L {lh[0]-10},{lh[1]+35} Z',shadow,3)
 n=j['neck'];
 # Integrated trapezius and visible neck taper replace the long rectangular collar.
 s+=path(f'M {n[0]-13*ratio},{n[1]-22*ratio} Q {n[0]-12*ratio},{n[1]+3} {ls[0]+11},{ls[1]-3} L {ls[0]+13},{ls[1]+20} Q {top[0]},{top[1]+29} {rs[0]-13},{rs[1]+20} L {rs[0]-11},{rs[1]-3} Q {n[0]+12*ratio},{n[1]+3} {n[0]+13*ratio},{n[1]-22*ratio} Z',skin,2.5)
 s+=path(f'M {xy(ls)} Q {n[0]-22},{top[1]-6} {n[0]-12},{top[1]+5} Q {n[0]},{top[1]+18} {n[0]+13},{top[1]+5} Q {n[0]+25},{top[1]-6} {xy(rs)} C {rs[0]+6*b},{rs[1]+29} {rs[0]-14},{rs[1]+75} {rh[0]+1},{rh[1]-18} Q {hip[0]},{hip[1]+7} {lh[0]-1},{lh[1]-18} C {ls[0]+14},{ls[1]+75} {ls[0]-6*b},{ls[1]+29} {xy(ls)} Z',suit,3)
 s+=path(f'M {n[0]-10},{n[1]-6} Q {n[0]-6},{n[1]+10} {n[0]},{top[1]+6} M {n[0]+10},{n[1]-6} Q {n[0]+6},{n[1]+10} {n[0]},{top[1]+6}',w=1.2)
 # Rounded deltoid wedges overlap torso naturally rather than floating as joints.
 for side in ['l','r']:
  a,k=j[side+'s'],j[side+'e'];v=norm(a,k);r=23*b*ratio
  outer=-1 if side=='r' else 1
  A=off(a,v,r*outer);B=off(mix(a,k,.30),v,r*.55*outer);C=off(mix(a,k,.15),v,-r*.38*outer)
  s+=path(f'M {xy(A)} Q {xy(off(mix(a,k,-.14),v,r*.7*outer))} {xy(C)} Q {xy(mix(a,k,.37))} {xy(B)}','none',1.8)

 # muscle landmarks expressed in rib coordinate frame, not a pasted body rectangle.
 def P(t,r):
  # Three-quarter chest shifts sternum and compresses far pectoral plane.
  turn=.17 if o.get('view','threequarter')=='threequarter' else .30 if o.get('view')=='profile' else 0
  width=(.70 if r<0 and turn else 1.05 if turn else 1)
  center=mix(mix(top,hip,t),mix(rs,rh,t),turn)
  return off(center,u,r*b*ratio*width)
 for sg in [-1,1]:
  s+=path(f'M {xy(P(.04,sg*8))} Q {xy(P(.08,sg*43))} {xy(P(.20,sg*49))} Q {xy(P(.36,sg*42))} {xy(P(.31,sg*4))}',w=2.3)
  s+=path(f'M {xy(P(.33,sg*36))} Q {xy(P(.48,sg*29))} {xy(P(.59,sg*22))}',w=1.6)
  s+=path(f'M {xy(P(.38,sg*38))} L {xy(P(.50,sg*32))} L {xy(P(.43,sg*26))} Z',INK,0)
  for t in [.44,.57,.70]:s+=path(f'M {xy(P(t,sg*4))} Q {xy(P(t-.03,sg*17))} {xy(P(t+.05,sg*20))}',w=1.3)
 s+=path(f'M {xy(P(.05,0))} L {xy(P(.32,0))} M {xy(P(.42,0))} L {xy(P(.80,0))}',w=1.1)
 # arms, hands ordered after torso; explicit per-object layer option available through raw shapes.
 for side in ['l','r']:
  a,k,c=[j[side+key]for key in ['s','e','w']]
  angle=math.degrees(math.atan2(c[1]-k[1],c[0]-k[0]))-90
  try:
   from heads import render_hand
   s+=render_hand({'id':prefix+'-'+side+'hand','x':c[0],'y':c[1],'scale':.52*ratio,'rotation':angle,'pose':o.get(side+'hand','fist')})
  except ImportError:s+=f'<ellipse cx="{c[0]}" cy="{c[1]+12}" rx="14" ry="18" fill="{skin}" stroke="{INK}" stroke-width="2"/>'
 # same frame head; module owns differentiated cranial construction
 try:
  from heads import render_head
  s+=render_head({'id':prefix+'-head','x':n[0],'y':n[1]-48,'scale':.78 if age!='child' else .85,'view':o.get('view','threequarter'),'expression':o.get('expression','neutral'),'identity':ident,'neck':False})
 except ImportError:s+=f'<ellipse cx="{n[0]}" cy="{n[1]-55}" rx="28" ry="39" fill="{skin}" stroke="{INK}" stroke-width="3"/>'
 if o.get('guides'):
  g=''
  for a,bk in [('ls','rs'),('ls','le'),('le','lw'),('rs','re'),('re','rw'),('lh','rh'),('lh','lk'),('lk','la'),('rh','rk'),('rk','ra')]:g+=line(j[a],j[bk],1,'#e35c45')
  for p in j.values():g+=f'<circle cx="{p[0]}" cy="{p[1]}" r="5" fill="none" stroke="#e35c45"/>'
  s+=f'<g id="{prefix}-guides">{g}</g>'
 return f'<g id="{prefix}" transform="translate({o.get("x",0)} {o.get("y",0)}) rotate({o.get("rotation",0)}) scale({o.get("scale",1)})">{s}</g>'

# Additional independently authored pose diagrams for study and story use.
POSES.update({
 'sit':{'ls':[-62,87],'rs':[61,87],'le':[-70,193],'re':[77,192],'lw':[-115,270],'rw':[125,269],'lh':[-35,273],'rh':[35,273],'lk':[-128,316],'rk':[135,316],'la':[-127,483],'ra':[133,483]},
 'kick':{'ls':[-78,94],'rs':[44,81],'le':[-137,36],'lw':[-183,106],'re':[94,164],'rw':[37,198],'lh':[-27,272],'rh':[40,249],'lk':[-61,429],'rk':[190,265],'la':[-44,586],'ra':[339,199]},
 'climb':{'neck':[0,55],'ls':[-55,87],'rs':[62,84],'le':[-104,20],'lw':[-123,-64],'re':[108,152],'rw':[143,65],'lh':[-28,266],'rh':[33,266],'lk':[-104,349],'rk':[103,386],'la':[-121,486],'ra':[165,511]},
 'walk':{'ls':[-61,88],'rs':[61,83],'le':[-82,195],'lw':[-100,298],'re':[88,182],'rw':[52,281],'lh':[-31,274],'rh':[33,274],'lk':[-66,435],'rk':[73,432],'la':[-115,584],'ra':[107,585]},
 'throw':{'neck':[-6,56],'ls':[-70,81],'rs':[47,103],'le':[-129,22],'lw':[-101,-70],'re':[130,137],'rw':[213,108],'lh':[-10,275],'rh':[54,260],'lk':[-83,412],'rk':[145,387],'la':[-124,576],'ra':[189,535]},
 'recline':{'neck':[-50,66],'ls':[-103,96],'rs':[20,85],'le':[-172,151],'lw':[-215,231],'re':[84,151],'rw':[140,91],'lh':[-2,250],'rh':[58,220],'lk':[-9,420],'rk':[147,322],'la':[85,515],'ra':[268,368]}
})
def render_construction(o):
 j=joints(o);prefix=o['id'];stage=o.get('stage','stick');s='';top=mix(j['ls'],j['rs'],.5);hip=mix(j['lh'],j['rh'],.5);n=j['neck']
 # Action line is the same backbone used to position torso landmarks.
 s+=path(f'M {n[0]},{n[1]-60} Q {top[0]+25},{top[1]+55} {hip[0]},{hip[1]} Q {j["lk"][0]},{j["lk"][1]} {j["la"][0]},{j["la"][1]}',w=3,stroke='#cb553e')
 edges=[('ls','rs'),('ls','le'),('le','lw'),('rs','re'),('re','rw'),('lh','rh'),('lh','lk'),('lk','la'),('rh','rk'),('rk','ra')]
 for a,b in edges:s+=line(j[a],j[b],2,'#31647c')
 for name,p in j.items():s+=f'<circle cx="{p[0]}" cy="{p[1]}" r="5" fill="white" stroke="#31647c"/>'
 s+=f'<ellipse cx="{n[0]}" cy="{n[1]-53}" rx="29" ry="39" fill="none" stroke="#31647c" stroke-width="2"/>'
 if stage in ['volumes','scribble']:
  for a,b,r in [('ls','le',22),('le','lw',15),('rs','re',22),('re','rw',15),('lh','lk',29),('lk','la',18),('rh','rk',29),('rk','ra',18)]:
   A,B=j[a],j[b];u=norm(A,B);s+=path(f'M {xy(off(A,u,r))} L {xy(off(B,u,r*.6))} Q {xy(mix(B,A,-.05))} {xy(off(B,u,-r*.6))} L {xy(off(A,u,-r))} Q {xy(mix(A,B,-.07))} {xy(off(A,u,r))}',w=1.5,stroke='#31647c')
  for p,rx,ry in [(mix(top,hip,.25),61,82),(hip,43,37)]:s+=f'<ellipse cx="{p[0]}" cy="{p[1]}" rx="{rx}" ry="{ry}" fill="none" stroke="#31647c" stroke-width="2"/>'
 if stage=='scribble':
  import random
  rng=random.Random(o.get('seed',11))
  for a,b in edges:
   for i in range(8):
    A,B=j[a],j[b];u=norm(A,B);r=rng.uniform(-17,17);s+=path(f'M {xy(off(A,u,r))} Q {xy(off(mix(A,B,.5),u,r+rng.uniform(-12,12)))} {xy(off(B,u,r*.6))}',w=.7,stroke='#7a93a0')
 return f'<g id="{prefix}" transform="translate({o.get("x",0)} {o.get("y",0)}) rotate({o.get("rotation",0)}) scale({o.get("scale",1)})">{s}</g>'
