"""Original staged sequential-composition applications. Screen figures over projected sets."""
import pathlib,subprocess,json,math,html
from inks import path,stroke
from world import Camera,box,render_faces,line3
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'outputs/story-studies';OUT.mkdir(exist_ok=True,parents=True)
INK='#131c2b';GOLD='#d5a53d';BLUE='#66879d'
def text(x,y,t,size=17,color=INK):return f'<text x="{x}" y="{y}" font-family="DejaVu Sans" font-size="{size}" fill="{color}">{html.escape(t)}</text>'
def save(name,w,h,body,meta):
 p=OUT/name;p.with_suffix('.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}"><rect width="100%" height="100%" fill="#fffdf6"/>{body}</svg>');p.with_suffix('.json').write_text(json.dumps(meta,indent=2));subprocess.run(['inkscape',str(p.with_suffix('.svg')),'--export-type=png','--export-filename='+str(p.with_suffix('.png'))],check=True,capture_output=True)
def actor(x,y,scale=1,pose='stand',kind='beacon',stage='ink',angle=0,mirror=False,id='actor'):
 j={'ls':[-14,17],'rs':[14,17],'le':[-21,40],'re':[21,40],'lw':[-20,60],'rw':[20,60],'lh':[-8,51],'rh':[8,51],'lk':[-10,78],'rk':[10,78],'la':[-12,105],'ra':[14,105]}
 poses={'warn':{'re':[36,28],'rw':[51,12]},'blast':{'rs':[14,20],'re':[41,21],'rw':[63,19],'ls':[-13,17],'le':[-29,37],'lw':[-19,52]},'recoil':{'ls':[-15,20],'rs':[12,20],'le':[-36,3],'lw':[-51,18],'re':[30,-3],'rw':[43,10],'lh':[-9,52],'rh':[8,54],'lk':[-23,77],'rk':[28,75],'la':[-7,108],'ra':[45,94]},'tether':{'ls':[-15,16],'rs':[15,17],'le':[-26,34],'lw':[-13,38],'re':[41,37],'rw':[62,47],'lh':[-8,50],'rh':[9,47],'lk':[-30,72],'rk':[32,67],'la':[-38,104],'ra':[50,93]},'fall':{'ls':[-15,17],'rs':[15,17],'le':[-36,-2],'lw':[-44,-22],'re':[36,0],'rw':[44,-22],'lh':[-8,51],'rh':[8,51],'lk':[-26,74],'rk':[28,75],'la':[-12,105],'ra':[14,105]},'run':{'le':[-28,33],'lw':[-14,44],'re':[30,8],'rw':[35,-10],'lk':[-23,73],'la':[-7,95],'rk':[32,74],'ra':[50,100]},'reach':{'re':[33,-8],'rw':[39,-33],'le':[-30,24],'lw':[-42,36]},'sit':{'lh':[-8,51],'rh':[8,51],'lk':[-26,54],'rk':[30,55],'la':[-28,88],'ra':[32,91]}}
 j.update(poses.get(pose,{}));fill={'beacon':GOLD,'warden':INK,'captor':'#98544c','technician':'#82947d'}.get(kind,INK)
 s='';pairs=[('ls','le'),('le','lw'),('rs','re'),('re','rw'),('lh','lk'),('lk','la'),('rh','rk'),('rk','ra')]
 if stage=='stick':
  s+=f'<circle cy="0" r="7" fill="none" stroke="#bf5a45"/>'+path('M0,8 L0,52 M-14,17 H14 M-8,51 H8','none','#bf5a45',1.2)
  for a,b in pairs:s+=path(f'M{j[a][0]},{j[a][1]} L{j[b][0]},{j[b][1]}','none','#bf5a45',1.2)
 else:
  for i,(a,b) in enumerate(pairs):
   aa,bb=j[a],j[b];ww=(9 if i%2==0 else 6.5);s+=path(f'M{aa[0]},{aa[1]} L{bb[0]},{bb[1]}','none',fill,ww)
  s+=path('M-14,16 Q0,10 14,16 L12,35 8,52 H-8 L-12,35 Z',fill,INK,.8)+f'<ellipse cy="0" rx="7.2" ry="9" fill="{fill}" stroke="{INK}" stroke-width=".8"/>'+path('M-4,7 H4 V16 H-4 Z',fill)
  for a in ['la','ra']:x1,y1=j[a];s+=path(f'M{x1-4},{y1-3} L{x1+8},{y1+2} L{x1+8},{y1+5} H{x1-5} Z',fill)
  for a in ['lw','rw']:x1,y1=j[a];s+=f'<ellipse cx="{x1}" cy="{y1}" rx="4" ry="4.5" fill="{fill}"/>'
  if stage=='ink':
   s+=path('M-6,-2 H6 L4,1 H-4 Z','#fff')+path('M-9,23 L0,18 9,23 0,31 Z','#fff' if kind=='beacon' else GOLD)
   s+=path('M-9,35 Q0,39 9,35 M-6,48 H6','none','#fff' if kind=='warden' else INK,.8)
 return f'<g id="{id}" transform="translate({x} {y}) rotate({angle}) scale({-scale if mirror else scale} {scale})">{s}</g>'
def rooftop(id='roof',high=False,stage='ink'):
 cam=Camera((12,14 if high else 5,20),(0,1,0),440,270,55);faces=[]
 faces+=box(id+'-roof',(0,-.5,0),(16,1,12),'#d7dee0')
 for i in range(6):faces+=box(id+'-building'+str(i),(-10+i*4,-4,-11-i%2),(3,7+i%3*3,3),'#647c8c' if i%2 else '#a5b9c4')
 faces+=box(id+'-vent',(-4,.7,-2),(2,1.4,2),'#8099a7')
 if stage=='stick':
  art=''
  for i in range(-6,7,3):art+=line3(id+str(i),(-8,0,i),(8,0,i),cam,'#b7bdc2',.7)
 else:art=render_faces(faces,cam)
 return '<g transform="translate(-220 -110) scale(2)">'+art+'</g>'

def panel(i,dramatic=True,stage='ink',id='p'):
 s=f'<defs><clipPath id="{id}-clip"><rect width="440" height="270"/></clipPath></defs><g clip-path="url(#{id}-clip)">'+path('M0,0 H440 V270 H0 Z','#edf2f3')
 s+=('<g transform="translate(-100 0)">' if dramatic and i==5 else '')+rooftop(id,dramatic and i in [0,5],stage)+('</g>' if dramatic and i==5 else '')
 # continuity: gold Beacon stays screen-left until final overhead fall; dark Warden right.
 if not dramatic:
  pa=['stand','warn','blast','recoil','tether','fall'][i];s+=actor(125,90,.95,pa,'beacon',stage,id=id+'-a')+actor(310,90,.95,'warn' if i==1 else 'recoil' if i in [2,5] else 'stand','warden',stage,id=id+'-b')
 else:
  if i==0:s+=actor(108,116,.92,'stand','beacon',stage,id=id+'-a')+actor(326,90,1.15,'warn','warden',stage,id=id+'-b')
  if i==1:s+=actor(287,54,2.2,'warn','warden',stage,id=id+'-b')+actor(64,142,.75,'stand','beacon',stage,id=id+'-a')
  if i==2:s+=actor(120,127,1.15,'recoil','beacon',stage,angle=-22,id=id+'-a')+actor(340,70,1.15,'blast','warden',stage,mirror=True,id=id+'-b')
  if i==3:s+=actor(190,88,1.55,'recoil','beacon',stage,angle=-30,id=id+'-a')
  if i==4:s+=actor(100,75,1.40,'tether','beacon',stage,id=id+'-a')+actor(355,100,.95,'stand','warden',stage,id=id+'-b')
  if i==5:s+=actor(120,65,.85,'tether','beacon',stage,id=id+'-a')+actor(331,138,1.1,'fall','warden',stage,angle=110,id=id+'-b')
 if stage=='ink':
  if i==2:s+=path('M270,92 L161,136 L201,147 L255,122 L242,114 Z','#fff',GOLD,3)+text(193,75,'KRAK!',24)
  if i==3:
   for k in range(5):s+=path(f'M{35+k*14},65 l55,35','none',INK,1)
  if i==4:s+=path('M187,141 Q277,90 343,197 Q371,212 377,201 Q370,188 343,197 Q333,205 355,208','none',GOLD,4)
  if i==5:s+=path('M172,106 Q201,126 223,100 Q239,72 228,73 Q211,92 211,114 Q216,126 223,100','none',GOLD,3)
 s+='</g>'+path('M0,0 H440 V270 H0 Z','none',INK,2)
 return s
BEATS=['1 ARRIVAL: two figures, one roof','2 WARNING: Warden raises a hand','3 BLAST: force travels right to left','4 RECOIL: Beacon loses his footing','5 TETHER: cable catches both ankles','6 FALL: Warden tips over the edge']
def sixpage(dramatic=True,stage='ink',prefix='page'):
 s=''
 for i in range(6):x=25+(i%2)*465;y=35+(i//2)*310;s+=f'<g transform="translate({x} {y})">'+panel(i,dramatic,stage,prefix+str(i))+'</g>'+text(x,y+293,BEATS[i],13)
 return s

def build_rooftop():
 for dramatic,name in [(False,'01-rooftop-plain'),(True,'02-rooftop-dramatic')]:
  s=text(25,40,'THE ROOFTOP CABLE | '+('Dramatic staging' if dramatic else 'Restrained staging'),27)+f'<g transform="translate(0 50)">'+sixpage(dramatic,prefix=name)+'</g>'
  save(name,955,1040,s,{'coverage':['C09-03','C10-02'],'source_scans':[103,104,112,113,114],'adaptation':'Original six-beat warning/blast/recoil/tether/fall analog; not literal source characters','blind_exercise':False,'beats':BEATS,'mode':'dramatic'if dramatic else'plain'})
 s=text(25,40,'WHOLE PAGE BEFORE DETAIL | Stick → mass → finished',27)
 for i,stage in enumerate(['stick','mass','ink']):s+=text(30+i*490,85,stage.upper(),18)+f'<g transform="translate({i*490} 100) scale(.50)">'+sixpage(True,stage,'stages'+stage)+'</g>'
 save('03-whole-page-stages',1470,650,s,{'coverage':['C10-01'],'source_scans':[109,110,111],'stage_names':['stick','mass','ink'],'all_panels_planned_before_finish':True,'note':'Original analogous rescue/confrontation; 2D figures on projected set'})
if __name__=='__main__':build_rooftop()
from world import render_world
from heads import render_head

def room(id,dramatic=False):
 return '<g transform="translate(-200 -110) scale(2)">'+render_world({'id':id,'width':440,'height':270,'scene':'interior','camera':{'eye':[14,7 if dramatic else 10,18],'target':[0,2,0],'fov':55}})+'</g>'
def convo(i,dramatic=True,id='talk'):
 s=f'<defs><clipPath id="{id}-clip"><rect width="440" height="270"/></clipPath></defs><g clip-path="url(#{id}-clip)">'+room(id+'room',dramatic)
 if not dramatic:
  s+=actor(125,78,1.4,'warn'if i in [1,4]else'run'if i==5 else'stand','beacon',id=id+'a')+actor(295,78,1.4,'warn'if i in [0,2]else'stand','warden',id=id+'b')
 elif i==0:s+=actor(100,100,1.3,'stand','beacon',id=id+'a')+actor(313,60,1.7,'warn','warden',id=id+'b')
 elif i==1:
  s+=path('M10,270 V142 Q100,80 170,150 V270 Z',GOLD)+render_head({'id':id+'face','x':90,'y':93,'scale':1.25,'view':'profile','expression':'fear','identity':{'hair':'short'}})+actor(326,126,.8,'warn','warden',id=id+'b')
 elif i==2:
  s+=path('M125,270 V170 Q242,87 355,171 V270 Z',INK)+render_head({'id':id+'face','x':240,'y':116,'scale':1.75,'view':'threequarter','expression':'angry','identity':{'hair':'bald','beard':'short'}})
 elif i==3:
  s=path('M0,0 H440 V270 H0 Z','#f2e3c5')+path('M70,270 L102,40 350,40 383,270 Z','#9d7471',INK,2)+path('M110,270 V73 H343 V270 Z','#fff',INK,2)+f'<circle cx="225" cy="120" r="43" fill="{GOLD}" stroke="{INK}" stroke-width="4"/>'+path('M225,120 L225,89 M225,120 L249,132','none',INK,4)
  for k in range(8):a=k*math.pi/4;s+=path(f'M{225+math.cos(a)*65},{120+math.sin(a)*65} l{math.cos(a)*24},{math.sin(a)*24}','none',INK,3)
  s+=text(148,228,'ALARM',30)
 elif i==4:s+=actor(95,95,1.7,'warn','beacon',id=id+'a')+actor(330,100,1.2,'recoil','warden',id=id+'b')
 else:s+=actor(225,55,1.9,'run','beacon',angle=10,id=id+'a')+actor(75,100,1.1,'run','warden',angle=10,id=id+'b')
 if i!=3 or not dramatic:s+='</g>'
 s+=path('M0,0 H440 V270 H0 Z','none',INK,2)
 return s
TALK=['1 The messenger arrives at the watch room.','2 “The relay has gone silent?”','3 “And the north gate is unguarded.”','4 The clocktower alarm interrupts them.','5 “Then we go now. Take the east stairs.”','6 Both guardians leave for the gate.']
def build_conversation():
 for dramatic,name in [(False,'04-conversation-restrained'),(True,'05-conversation-urgent')]:
  s=text(25,40,'THE SILENT RELAY | '+('Urgent staging' if dramatic else 'Restrained staging'),27)
  for i in range(6):x=25+(i%2)*465;y=85+(i//2)*310;s+=f'<g transform="translate({x} {y})">'+convo(i,dramatic,name+str(i))+'</g>'+text(x,y+293,TALK[i],13)
  save(name,955,1040,s,{'coverage':['C09-04'],'source_scans':[105,106],'beats':TALK,'mode':'urgent'if dramatic else'restrained','note':'Original conversation-to-action, added alarm transition'})

def composition(kind,abstract=False,id='comp'):
 s=path('M0,0 H440 V270 H0 Z','#edf2f3',INK,2)
 if kind=='triangle':
  s+=path('M220,40 L30,250 H410 Z','#8aa0ae')
  s+=actor(220,70,1.45,'warn','warden','mass' if abstract else'ink',id=id+'a')+actor(96,153,.9,'stand','beacon','mass'if abstract else'ink',id=id+'b')+actor(340,156,.85,'stand','beacon','mass'if abstract else'ink',id=id+'c')
 elif kind=='diagonal':
  s+=path('M0,210 L440,30 V90 L0,270 Z','#8aa0ae')+actor(290,92,1.4,'run','warden','mass'if abstract else'ink',angle=35,id=id+'a')+actor(70,130,.8,'reach','beacon','mass'if abstract else'ink',angle=25,id=id+'b')
 else:
  s+=path('M60,210 Q-10,25 220,20 Q450,30 380,210 L340,195 Q385,70 220,65 Q55,70 100,195 Z','#8aa0ae')+actor(202,110,1.25,'reach','beacon','mass'if abstract else'ink',id=id+'a')
  for i in range(8):a=i*math.pi/4;s+=stroke([220+math.cos(a)*160,135+math.sin(a)*95],[220+math.cos(a+.3)*160,135+math.sin(a+.3)*95],6,id=id+str(i))
 if not abstract:
  for i in range(7):s+=path(f'M{i*70},260 L220,160','none','#bcc8ce',.7)
 return s
def camera_pair(kind,dramatic,id):
 s=room(id,dramatic)
 if kind=='doorway':
  s+=path('M130,260 V40 H320 V260','none',INK,5) if not dramatic else path('M55,270 L125,25 332,0 410,270','none',INK,12)
  s+=actor(230,70,1.6 if not dramatic else 2.0,'stand'if not dramatic else'reach','warden',id=id+'a')
 elif kind=='phone':
  if not dramatic:s+=actor(230,68,1.6,'warn','beacon',id=id+'a')
  else:
   s+=path('M70,270 V163 Q220,90 380,163 V270 Z',GOLD)+render_head({'id':id+'face','x':225,'y':105,'scale':2,'view':'threequarter','expression':'fear','identity':{'hair':'short'}})
   s+=path('M126,69 Q95,120 129,168','none',INK,13)+path('M129,168 Q145,220 99,269','none',INK,2)
 elif kind=='threat':s+=actor(225,65 if not dramatic else 10,1.65 if not dramatic else 2.55,'stand'if not dramatic else'warn','warden',id=id+'a')
 return f'<defs><clipPath id="{id}-pairclip"><rect width="440" height="270"/></clipPath></defs><g clip-path="url(#{id}-pairclip)">'+s+'</g>'+path('M0,0 H440 V270 H0 Z','none',INK,2)
def build_composition():
 s=text(25,40,'COMPOSITION MASSES | Three value families, three paths for the eye',27)
 for i,kind in enumerate(['triangle','diagonal','circular']):
  x=25+i*465;s+=text(x,80,kind.upper(),18)+f'<g transform="translate({x} 100)">'+composition(kind,id=kind)+'</g>'+f'<g transform="translate({x} 405)">'+composition(kind,True,kind+'mass')+'</g>'
 s+=text(25,725,'Dark subject / middle-value organizing mass / light ground. Lower row removes small detail, preserving the grouping.',18)
 save('06-three-mass-compositions',1420,775,s,{'coverage':['C09-01'],'source_scans':[96,97,98,99,100],'mass_designs':['triangle','diagonal','circular'],'values':3})
 s=text(25,40,'CAMERA CHOICES | Neutral versus dramatic framing',27)
 for i,kind in enumerate(['doorway','phone','threat']):
  for j,dramatic in enumerate([False,True]):x=25+j*465;y=100+i*310;s+=f'<g transform="translate({x} {y})">'+camera_pair(kind,dramatic,kind+str(j))+'</g>'+text(x,y-15,kind.upper()+(' / CLOSE, LOW OR OBLIQUE'if dramatic else' / NEUTRAL'),15)
 save('07-camera-pairs',955,1040,s,{'coverage':['C09-02'],'source_scans':[101,102],'pairs':['doorway','phone conversation','threatening figure'],'note':'Projected set camera varies; character silhouettes are authored2D, not full3D camera rotation'})

def cover_art(option=3,guides=False,stage='ink',id='cover'):
 s=path('M0,0 H380 V560 H0 Z','#eef3f3',INK,2)
 s+=path('M0,148 Q190,30 380,145 V0 H0 Z',INK)+text(22,61,'THE SILENT',33,'#fff')+text(22,107,'RELAY',49,GOLD)
 s+=f'<g transform="translate(-65 200) scale(1.3)">'+rooftop(id,True,stage)+'</g>'
 if option==0:s+=actor(160,280,.8,'run','beacon',stage,id=id+'a')+actor(260,265,.8,'warn','warden',stage,id=id+'b')
 if option==1:s+=actor(210,170,2.6,'stand','warden',stage,id=id+'a')+actor(60,360,.7,'run','beacon',stage,id=id+'b')
 if option==2:s+=actor(80,210,2.0,'run','beacon',stage,angle=15,id=id+'a')
 if option==3:s+=actor(120,245,1.7,'tether','beacon',stage,angle=-12,id=id+'a')+actor(280,215,1.55,'fall','warden',stage,angle=72,id=id+'b')+path('M220,299 Q290,330 255,380','none',GOLD,4)
 s+=text(20,537,'AN ORIGINAL COMPOSITION STUDY',12)
 if guides:s+=path('M20,20 H360 V540 H20 Z','none','#c95046',1)+path('M20,130 H360','none','#c95046',1)
 return f'<defs><clipPath id="{id}-coverclip"><rect width="380" height="560"/></clipPath></defs><g clip-path="url(#{id}-coverclip)">'+s+'</g>'
def build_covers():
 s=text(25,40,'COVER LAB | Four thumbnails; choose the strongest story promise',27)
 critiques=['01 Too small: action lacks impact.','02 Clear figure, weak two-character story.','03 Dead space and missing opponent.','04 Selected: clear conflict and diagonal.']
 for i in range(4):x=25+i*315;s+=f'<g transform="translate({x} 90) scale(.76)">'+cover_art(i,id='thumb'+str(i))+'</g>'+text(x,545,critiques[i],11)
 save('08-cover-thumbnails',1290,590,s,{'coverage':['C11-01'],'source_scans':[118],'selection':4,'critiques':critiques})
 s=text(25,40,'SELECTED COVER | Rough → finished → production-safe overlay',27)
 for i,(stage,guides) in enumerate([('stick',False),('ink',False),('ink',True)]):s+=f'<g transform="translate({25+i*405} 90)">'+cover_art(3,guides,stage,'final'+str(i))+'</g>'
 s+=text(25,695,'Logo space stays clear; red guide reserves trim-safe content. Color openness is retained around the action.',17)
 save('09-cover-development',1245,740,s,{'coverage':['C11-02'],'source_scans':[119,120,121],'safe_margin':20,'logo_reserve':130,'dimensions':'demonstration pixels, not claimed print specification','selection':4})
if __name__=='__main__':build_conversation();build_composition();build_covers()
def rescue_panel(i,stage='ink',id='rescue'):
 s=f'<defs><clipPath id="{id}-clip"><rect width="440" height="270"/></clipPath></defs><g clip-path="url(#{id}-clip)">'+room(id+'room',True)
 if i==0:s+=actor(245,70,1.7,'run','beacon',stage,id=id+'a')+actor(80,102,1.2,'run','warden',stage,id=id+'b')
 if i==1:s+=actor(95,95,1.3,'stand','technician',stage,id=id+'c')+actor(310,52,1.8,'blast','captor',stage,mirror=True,id=id+'v')
 if i==2:
  s+=actor(110,90,1.6,'recoil','technician',stage,angle=-30,id=id+'c')+actor(355,72,1.4,'blast','captor',stage,mirror=True,id=id+'v')
  if stage=='ink':s+=path('M263,99 L153,137 L179,150 L267,115 Z','#fff',GOLD,3)
 if i==3:s+=actor(190,200,1.1,'fall','technician',stage,angle=-87,id=id+'c')+actor(335,75,1.6,'run','beacon',stage,mirror=True,id=id+'a')
 if i==4:s+=actor(285,30,2.25,'blast','captor',stage,mirror=True,id=id+'v')+actor(70,150,.8,'recoil','beacon',stage,id=id+'a')
 if i==5:s+=actor(235,50,1.85,'run','warden',stage,angle=24,id=id+'b')+actor(70,108,1.3,'reach','beacon',stage,id=id+'a')
 return s+'</g>'+path('M0,0 H440 V270 H0 Z','none',INK,2)
def build_rescue():
 labels=['1 Two rescuers race down the corridor.','2 A captor threatens the relay technician.','3 The captor fires; the technician recoils.','4 Beacon reaches the fallen technician.','5 The weapon turns toward Beacon.','6 His partner charges to block the attack.']
 s=text(25,40,'RELAY RESCUE | Plan the complete page before rendering a panel',26)
 for col,stage in enumerate(['stick','mass','ink']):
  s+=text(25+col*490,85,stage.upper(),18)
  body=''
  for i in range(6):x=25+(i%2)*465;y=35+(i//2)*310;body+=f'<g transform="translate({x} {y})">'+rescue_panel(i,stage,'rescue'+stage+str(i))+'</g>'+text(x,y+293,labels[i],12)
  s+=f'<g transform="translate({col*490} 100) scale(.50)">'+body+'</g>'
 save('10-rescue-page-stages',1470,650,s,{'coverage':['C10-01'],'source_scans':[109,110,111],'adaptation':'Original relay rescue analog, no source character reproduction','beats':labels,'stages':['stick','mass','ink'],'limits':'Analytical storyboard; intentionally reduced anatomy, no blind-reader certification'})
if __name__=='__main__':build_rescue()
