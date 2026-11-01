"""Original sequenced motion diagrams applying open-ended action practice."""
from heroic import export
from figures import joints,BASE,POSES
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def txt(i,x,y,t,size=18):return dict(id=i,kind='text',x=x,y=y,text=t,size=size)
def sheet(t,sub,w=1600,h=1550):return {'version':1,'width':w,'height':h,'objects':[txt('title',40,45,t,28),txt('sub',40,78,sub,15)]}
def blend(a,b,t):return {k:[a[k][q]*(1-t)+b[k][q]*t for q in [0,1]]for k in a}
s=sheet('ACTION LAB | Four motions, four beats','Original walking, running, throwing and punching studies. Anticipation and consequence are explicit, not random pose selection.')
for row,(name,p) in enumerate([('WALK','walk'),('RUN','run'),('THROW','throw'),('PUNCH','strike')]):
 start=joints({'pose':'stand'});end=joints({'pose':p}); phases=[blend(start,end,.25),blend(start,end,.65),end,blend(start,end,.5)]
 if name in ['WALK','RUN']:
  # Opposite phase swaps arm/leg offsets around the torso center, retaining named joints.
  rev={k:list(v) for k,v in end.items()}
  for part in ['s','e','w','h','k','a']:
   rev['l'+part]=[-end['r'+part][0],end['r'+part][1]];rev['r'+part]=[-end['l'+part][0],end['l'+part][1]]
  phases=[end,blend(end,rev,.4),rev,blend(rev,end,.4)]
 if name=='WALK':
  for q,j in enumerate(phases):
   j.update(neck=[14,56],ls=[-15,85],rs=[25,85],lh=[-10,274],rh=[10,274])
  phases[0].update(lk=[-52,437],la=[-102,605],rk=[62,435],ra=[105,605],le=[-55,190],lw=[-84,290],re=[65,180],rw=[96,265])
  phases[1].update(lk=[-35,442],la=[-25,605],rk=[75,405],ra=[38,536],le=[-32,193],lw=[-15,300],re=[40,188],rw=[24,285])
  phases[2].update(lk=[65,435],la=[105,605],rk=[-55,438],ra=[-100,605],le=[50,180],lw=[90,265],re=[-40,193],rw=[-68,290])
  phases[3].update(lk=[70,405],la=[35,536],rk=[-30,442],ra=[-20,605],le=[40,188],lw=[22,285],re=[-25,195],rw=[-10,300])
 if name=='RUN':
  for q,j in enumerate(phases):j.update(neck=[55,55],ls=[22,83],rs=[65,93],lh=[-10,270],rh=[23,280])
  phases[0].update(lk=[-110,394],la=[-30,493],rk=[110,376],ra=[175,550])
  phases[1].update(lk=[-67,368],la=[-154,443],rk=[136,325],ra=[176,442])
  phases[2].update(lk=[110,398],la=[154,581],rk=[-75,389],ra=[-20,480])
  phases[3].update(lk=[68,418],la=[43,592],rk=[43,340],ra=[-61,394])
 if name=='THROW':phases[0].update(lw=[-77,-40],le=[-127,56],rw=[145,182],re=[93,181])
 if name=='THROW':
  phases[1].update(lw=[-110,-60],le=[-145,30])
  phases[2].update(lw=[225,68],le=[125,80],rw=[-20,225],re=[70,180])
  phases[3].update(lw=[260,170],le=[140,130],rw=[-10,230],re=[67,188])
 if name=='PUNCH':phases[0].update(rw=[34,145],re=[96,175]);phases[3].update(rw=[176,142],re=[110,140])
 for col,j in enumerate(phases):
  x=170+col*390;y=165+row*350;s['objects']+=[dict(id=f'{row}-{col}',kind='construction',x=x,y=y,scale=.38,pose='stand',joints=j,stage='volumes'),txt(f'label{row}{col}',65+col*390,y+256,name+' / '+(['CONTACT','PASSING','CONTACT','PASSING'][col] if name=='WALK' else ['DRIVE','FLIGHT','LAND','RECOVER'][col] if name=='RUN' else ['ANTICIPATE','TRANSFER','RELEASE','FOLLOW-THROUGH'][col]),15)]
# A ball tracks the throwing hand, then separates after release.
for col in range(4):
 x=170+col*390;y=165+2*350;bx,by=[(-77,-40),(-110,-60),(275,50),(360,160)][col];X=x+.38*bx;Y=y+.38*by
 s['objects'].append(dict(id='ball'+str(col),kind='path',d=f'M {X-6},{Y} a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0',fill='#b78143',width=1))
export(s,R/'outputs/action-phases')
s=sheet('DRAMA WITHOUT NOISE | Restrained versus exaggerated','Pose exaggeration changes support, gesture and reach; no speed lines are needed to identify the difference.',1600,1300)
for row,(p,label) in enumerate([('run','RUNNING'),('fall','REACTION'),('brace','STANDING')]):
 base=joints({'pose':p});tame=blend(joints({'pose':'stand'}),base,.25)
 for col,j in enumerate([tame,base]):
  s['objects'] += [dict(id=f'fig{row}{col}',kind='figure',pose=p,joints=j,x=360+col*770,y=160+row*385,scale=.45,identity={'build':'athletic'},expression='fear' if row==1 else 'neutral'),txt(f'label{row}{col}',70+col*770,475+row*385,label+(' / RESTRAINED' if col==0 else ' / EXAGGERATED'),18)]
export(s,R/'outputs/action-exaggeration')
s=sheet('CONTOUR FROM A DIAGRAM | Six original applications','Impact reaction / seated pause / leap / kick / climb / rear reach. Last pose is a diagram-only back-view limitation study.',1600,1200)
for i,p in enumerate(['fall','sit','leap','kick','climb','lift']):
 s['objects'] += [dict(id=f'fig{i}',kind='figure' if i<5 else 'construction',stage='volumes',pose=p,x=210+(i%3)*520,y=240+(i//3)*500,scale=.57,identity={'build':'athletic'},view='profile' if i==1 else 'threequarter',expression='shout' if i in [0,2,3] else 'neutral'),txt(f'label{i}',50+(i%3)*520,650+(i//3)*500,p.upper()+(' / REAR VOLUME PLAN' if i==5 else ''),18)]
export(s,R/'outputs/action-diagram-applications')
