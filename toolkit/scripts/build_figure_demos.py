from heroic import export
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def title(id,x,y,text,size=20):return dict(id=id,kind='text',x=x,y=y,text=text,size=size)
s={'version':1,'width':1400,'height':1050,'background':'#fffdf5','objects':[title('title',45,52,'HEROIC CONSTRUCTION | Original figure studies',30),title('subtitle',45,86,'Shared joint landmarks drive construction and finished contours. No traced or generated image assets.',17)]}
for i,(pose,build,label) in enumerate([('stand','athletic','ATHLETIC / 8.75-head target'),('brace','broad','BROAD / WIDENED SUPPORT'),('run','slim','LEAN / OPPOSED LIMBS'),('lift','stocky','HEAVY / RAISED LOAD')]):
 x=175+i*342;s['objects'] += [dict(id='hero'+str(i),kind='figure',x=x,y=245,scale=.94,pose=pose,identity={'build':build,'age':'adult'},guides=i==0),title('label'+str(i),45+i*342,952,label,16)]
export(s,ROOT/'outputs/figure-proportions')
