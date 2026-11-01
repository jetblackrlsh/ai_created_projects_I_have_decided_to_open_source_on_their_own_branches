from heroic import export
from figures import POSES,joints
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def text(id,x,y,t,z=18):return dict(id=id,kind='text',x=x,y=y,text=t,size=z)
def sheet(title,subtitle,w=1600,h=1200):return {'version':1,'width':w,'height':h,'objects':[text('title',40,48,title,29),text('sub',40,80,subtitle,16)]}
s=sheet('POSE LAB | Gesture before detail','Applied practice: standing, bracing, running, striking, lifting, leaping, crouching, falling, sitting, kicking, climbing and throwing.');names=['stand','brace','run','strike','lift','leap','crouch','fall','sit','kick','climb','throw']
for i,p in enumerate(names):
 x=135+(i%6)*260;y=220+(i//6)*490;s['objects']+=[dict(id='pose'+str(i),kind='construction',pose=p,x=x,y=y,scale=.54,stage='volumes' if i%2 else 'stick'),text('label'+str(i),x-70,y+365,p.upper())]
export(s,R/'outputs/figure-gesture-library')
s=sheet('BUILD, THEN INK | Same landmarks across four stages','Crouch and leap: action line -> volumes/draw-through -> selected contour -> ink and form accents.',1600,1320)
for row,p in enumerate(['crouch','leap']):
 for col,stage in enumerate(['stick','volumes','contour','ink']):
  o=dict(id=f'figure{row}{col}',kind='construction' if col<2 else 'figure',pose=p,x=200+col*390,y=250+row*580,scale=.69,stage=stage,identity={'build':'athletic'},guides=col==2,suit='#d9e3e6' if col==2 else '#a9becb');s['objects']+=[o,text(f'label{row}{col}',80+col*390,720+row*580,stage.upper())]
export(s,R/'outputs/figure-four-stage')
s=sheet('LOOSE MASS TO CHOSEN CONTOUR','Seeded exploratory marks are digital analogs of pencil searching; the selected outline retains the same underlying pose.',1600,1000)
for i,(p,stage) in enumerate([('run','scribble'),('run','ink'),('stand','scribble'),('stand','ink')]):
 s['objects']+=[dict(id='figure'+str(i),kind='construction' if stage=='scribble' else 'figure',x=200+i*390,y=220,scale=.85,pose=p,stage=stage,identity={'build':'slim'}),text('label'+str(i),70+i*390,940,stage.upper())]
export(s,R/'outputs/figure-exploratory-contour')
