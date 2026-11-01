"""Original neutral harbor drawing. Source geometry, not imagegen or tracing.
Run python build.py --modules /path/to/drawing/scripts
"""
import sys,json,math,hashlib,argparse
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--modules',required=True);a=p.parse_args();sys.path.insert(0,a.modules)
import world,figures,heads,inks
import subprocess
D=Path(__file__).parent; S=json.loads((D/'scene.json').read_text());W,H=S['width'],S['height'];C=world.Camera(tuple(S['camera']['eye']),tuple(S['camera']['target']),W,H,S['camera']['fov'])
I='#17232f';parts=[]
def path(d,fill='none',w=2,stroke=I):return figures.path(d,fill,w,stroke)
def line(x,y,X,Y,w=2,col=I):return path(f'M{x},{y}L{X},{Y}',w=w,stroke=col)
def poly(ps,fill,w=2):return path('M'+' L'.join(f'{x},{y}' for x,y in ps)+'Z',fill,w)
def project(p):return C.project(p)[:2]
def environment():
 s='<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#677b8b"/><stop offset="1" stop-color="#e8d9b0"/></linearGradient><linearGradient id="sea" x2="0" y2="1"><stop stop-color="#738e98"/><stop offset="1" stop-color="#233f50"/></linearGradient></defs><rect width="1400" height="900" fill="url(#sky)"/>'
 s+=path('M0,230 Q150,195 260,221 T560,202 T850,226 T1400,179 L1400,258 L0,288Z','#91a1a6',0)
 s+='<circle cx="1110" cy="247" r="72" fill="#efcd8e"/>'
 s+='<path d="M0,318 L1400,266 L1400,900 L0,900Z" fill="url(#sea)"/>'
 # Original distant lighthouse: tapered tower, glass room, gallery, sea wall.
 s+=path('M1072,290 L1090,143 L1119,143 L1136,286Z','#d8d5bd',2)
 s+=path('M1109,145 L1119,143 L1136,286 L1118,286Z','#7d9293',0)
 s+=path('M1085,143 L1085,112 L1124,112 L1124,143Z','#d8b466',2)
 s+=path('M1075,113 L1104,91 L1135,113Z','#344b58',2)
 s+=path('M1074,146 L1135,146 M1075,141 L1134,141 M1083,141 L1083,150 M1128,141 L1128,150 M1104,114 L1104,141',w=2)
 s+=path('M1097,195 L1107,195 L1110,218 L1096,218Z','#293d4b',1)
 s+=path('M994,292 L1050,277 L1150,280 L1210,305 L1400,299 L1400,327Z','#3d5260',1)
 for k in range(16):
  x=750+(k*83)%650;y=330+k*22
  s+=line(x,y,x+30+(k%4)*12,y-2,1,'#a2b1ac')
 faces=world.box('stone-floor',(0,-.22,-6),(7,.4,35),'#b7a991')
 for x in [-3.6,3.6]:faces+=world.box('curb',(x,.02,-6),(.3,.45,35),'#c7bda6')
 for z in [1,-4,-9,-14,-19]:
  for x in [-3.7,3.7]:faces+=world.box('bollard',(x,.6,z),(.4,1.2,.4),'#657b83')
 s+=world.render_faces(faces,C)
 for z in range(-20,9,2):s+=world.line3('paving-joint'+str(z),(-3.4,.01,z),(3.4,.01,z),C,'#596d73',1)
 for x in [-2,0,2]:s+=world.line3('long-joint'+str(x),(x,.01,-22),(x,.01,8),C,'#596d73',1)
 for x in [-3.7,3.7]:
  for z in [-19,-14,-9,-4]:s+=world.line3('chain', (x,.82,z),(x,.82,z+5),C,'#263d48',3)
 # Weather strokes remain behind character and gate, keeping contact readable.
 for k in range(45):
  x=(k*113)%1400;y=(k*73)%800;s+=line(x,y,x-9,y+32,1,'#9caeb3')
 return s

def gate(angle):
 g=S['gate'];hx,hy,hz=g['hinge'];an=math.radians(angle);ca,sa=math.cos(an),math.sin(an)
 def q(t,y,depth=0):return (hx-t*ca+depth*sa,y,hz+t*sa+depth*ca)
 fs=[]
 for x in [-2,4]:fs+=world.box('stone-gatepost',(x,1.7,1),(.46,3.4,.5),'#9da8a5');fs+=world.box('post-cap',(x,3.45,1),(.65,.14,.7),'#c3c4b4')
 # Structural rotating frame, slats, and diagonal brace all share hinge transform.
 for t in [.12,5.88]:fs+=world.box('gate-stile',q(t,1.6),(.16,2.8,.16),'#354c59',-angle)
 for y in [.32,1.55,2.92]:fs+=world.box('gate-rail',q(3,y),(6,.18,.17),'#647d84',-angle)
 for t in [i*.5 for i in range(1,12)]:fs+=world.box('gate-bar',q(t,1.6),(.075,2.65,.075),'#536e79',-angle)
 s=world.render_faces(fs,C)
 s+=world.line3('diagonal-brace',q(.15,.45,-.08),q(5.85,2.8,-.08),C,'#233a48',6)
 for y in [.65,2.55]:
  fs=world.cylinder('hinge-pin',(hx+.03,y,hz+.18),.1,.38,'#b8ac87',segments=12)
  s+=world.render_faces(fs,C)
  s+=world.line3('hinge-strap',(hx,y,hz+.19),q(.65,y,.19),C,'#c7b783',7)
 # Latch at free end; hand wraps this vertical lever, visibly attached to stile.
 grip=project(q(5.8,1.7,.19));x,y=grip
 s+=path(f'M{x-5},{y-27} L{x+6},{y-27} L{x+6},{y+24} L{x-5},{y+24}Z','#ccbb85',2)
 s+=line(x-11,y+25,x+13,y+25,4)
 return s,grip

def keeper(grip,expression):
 x,y=grip;skin=S['keeper']['identity']['skin'];s=''
 # Far arm and weight-bearing lower body, with coat replacing superhero muscle lines.
 s+=path('M246,740 L242,900 L349,900 L370,767 L401,900 L491,900 L460,729Z','#283d4b',5)
 s+=path('M288,806 L278,900 M431,805 L456,900',w=2)
 s+=figures.limb([267,388],[206,582],[242,727],[40,29,21],'#526c76','far-sleeve',False)
 s+=path('M222,475 Q194,568 213,626 L233,632 L230,575 L250,468Z','#293f4b',0)
 s+=heads.render_hand({'id':'resting-hand','x':247,'y':753,'scale':.9,'rotation':-10,'pose':'fist','skin':skin})
 # Asymmetric shoulder girdle, coat lapels, sloping hem, drawn from landmarks.
 s+=path('M268,364 Q301,344 336,340 L385,339 Q418,351 450,375 L464,600 L490,814 Q388,847 246,811 L266,574Z','#586f77',5)
 s+=path('M269,408 L304,432 L305,803 L254,810 L269,574Z','#304955',0)
 s+=path('M422,433 L447,395 L461,600 L482,806 L427,817Z','#324a55',0)
 s+=path('M324,337 L320,316 L384,310 L394,346 L376,385Z',skin,3)
 s+=path('M338,330 L357,365 L380,338 L384,310Z','#946b55',0)
 s+=path('M315,342 L280,368 L308,434 L354,390Z','#819296',3)
 s+=path('M394,342 L440,370 L403,435 L354,390Z','#879998',3)
 s+=path('M354,390 L347,824 M365,413 L368,807',w=2)
 for yy in [464,535,606,677,748]:s+=f'<circle cx="360" cy="{yy}" r="5" fill="#bca67d" stroke="{I}" stroke-width="2"/>'
 s+=path('M276,659 L322,670 L315,735 L273,728Z','#71868a',2)
 s+=path('M391,664 L443,649 L448,716 L397,730Z','#71868a',2)
 s+=path('M279,660 L323,669 L321,681 L278,674Z M391,664 L444,649 L445,663 L394,678Z','#a0adab',2)
 # Near sleeve reaches the actual projected gate latch. Elbow adjusts with opening.
 elbow=[468,493] if x<600 else [572,449]
 wrist=[x-17,y+18]
 s+=figures.limb([432,388],elbow,wrist,[37,29,19],'#6b8187','working-sleeve',False)
 s+=path(f'M447,409 Q{elbow[0]+1},{elbow[1]+5} {x-38},{y+32} L{x-34},{y+48} Q{elbow[0]-5},{elbow[1]+39} 420,426Z','#344e5c',0)
 s+=path(f'M{elbow[0]-22},{elbow[1]-15} Q{elbow[0]-2},{elbow[1]-3} {elbow[0]+15},{elbow[1]-9} M{elbow[0]-18},{elbow[1]+1} Q{elbow[0]},{elbow[1]+13} {elbow[0]+15},{elbow[1]+8}',w=1.7)
 s+=heads.render_hand({'id':'latch-gripping-hand','x':x,'y':y,'scale':.85,'rotation':-12,'pose':'grip','skin':skin})
 # Split lever remains visible above and below fingers, without painting through hand.
 s+=line(x+3,y-28,x+3,y-20,5,'#dfc68e')+line(x+3,y+23,x+3,y+31,5,'#dfc68e')
 s+=heads.render_head({'id':'keeper-head','x':351,'y':244,'scale':1.92,'rotation':5,'view':'threequarter','expression':expression,'identity':S['keeper']['identity'],'neck':False})
 # Face shadow respects left cheek plane; cap has curved crown, bill, band.
 s+=path('M291,249 L311,287 L348,323 L331,318 L304,295Z','#9b7059',0)
 s+=path('M281,209 Q273,161 311,145 Q362,122 403,166 L410,194 Q349,178 281,209Z','#263e4b',4)
 s+=path('M288,183 Q344,160 405,181 L410,198 Q353,182 288,211Z','#536a73',2)
 s+=path('M287,206 Q354,180 413,195 L440,210 Q400,221 357,210 Q323,208 292,220Z','#233946',3)
 s+=path('M304,157 Q347,139 382,158',w=2,stroke='#71868d')
 s+=inks.feather(275,560,count=12,length=26,step=7,width=1.5,curve=2,id='coat-side-hatching')
 s+=path('M381,567 Q401,553 420,525 M380,574 L411,553 M308,510 L332,536 M306,516 L325,545 M380,791 Q399,778 418,780',w=2)
 return s

receipts=[]
for panel in S['panels']:
 s=environment();g,grip=gate(panel['angle']);s+=g;s+=keeper(grip,panel['expression'])
 # Letterbox-safe ink frame and restrained original caption.
 s+='<rect x="7" y="7" width="1386" height="886" rx="2" fill="none" stroke="#17232f" stroke-width="14"/>'
 s+='<path d="M35,35 H628 L606,91 H35Z" fill="#efe1bb" stroke="#17232f" stroke-width="3"/>'
 s+=f'<text x="57" y="71" font-family="DejaVu Sans" font-weight="bold" font-size="25" fill="#17232f">{panel["caption"]}</text>'
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{s}</svg>'
 f=D/(panel['id']+'.svg');f.write_text(svg);subprocess.run(['inkscape',str(f),'--export-type=png','--export-filename='+str(f.with_suffix('.png'))],check=True,stdout=subprocess.DEVNULL)
 # Honest construction overlay: actual landmark chain and projected hinge/free edge.
 construction=f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><rect width="1400" height="900" fill="#fffdf4"/><g opacity=".2">{s}</g>'
 construction+=heads.render_head({'id':'head-construction','x':351,'y':244,'scale':1.92,'rotation':5,'view':'threequarter','identity':S['keeper']['identity'],'neck':False,'guides':True,'stage':0})
 elbow=[468,493] if grip[0]<600 else [572,449]
 for chain in [[[351,335],[350,390],[360,580],[368,820]],[[267,388],[206,582],[242,727]],[[432,388],elbow,[grip[0]-17,grip[1]+18],grip]]:
  construction+=path('M'+' L'.join(f'{x},{y}'for x,y in chain),w=3,stroke='#c04739')
  for x,y in chain:construction+=f'<circle cx="{x}" cy="{y}" r="7" fill="#fffdf4" stroke="#c04739" stroke-width="2"/>'
 construction+=world.line3('fixed-hinge-axis',(4,0,1),(4,3.7,1),C,'#be423c',4)
 construction+='<text x="610" y="800" font-family="DejaVu Sans" font-size="22" fill="#173f56">Projected gate hinge + actual arm landmarks</text></svg>'
 cf=D/(panel['id']+'-construction.svg');cf.write_text(construction)
 subprocess.run(['inkscape',str(cf),'--export-type=png','--export-filename='+str(cf.with_suffix('.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 receipts.append({'panel':panel['id'],'gate_angle_degrees':panel['angle'],'projected_handle':grip,'hand_center':grip,'contact':'same projected latch point; pin at fixed right post; full gate rotates rigidly about that pin'})
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
r={'construction':'Original hand-authored vector geometry, module-rendered anatomical landmarks and perspective solids. No image generation, tracing, private assets, or imported raster art.','modules':{n:sha(Path(a.modules)/(n+'.py')) for n in ['heads','figures','world','inks']},'inputs':{n:sha(D/n) for n in ['scene.json','build.py']},'outputs':{p.name:sha(p) for p in D.glob('*') if p.suffix in ['.svg','.png']},'panels':receipts,'limits':['Stylized vector/cel illustration, not naturalistic hand-inked comic mastery.','Two poses, not continuous anatomical animation.','Gate movement is rigid projection between two keyframes.']}
(D/'construction-receipt.json').write_text(json.dumps(r,indent=2))
print(json.dumps(receipts))
