import json,pathlib,subprocess
from inks import *
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'outputs/inking';OUT.mkdir(exist_ok=True)
def txt(x,y,t,size=18):return f'<text x="{x}" y="{y}" font-family="DejaVu Sans" font-size="{size}" fill="#10131c">{html.escape(t)}</text>'
def save(name,w,h,body,meta):
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><rect width="100%" height="100%" fill="#fffdf7"/>{body}</svg>'
 (OUT/(name+'.svg')).write_text(svg);(ROOT/'assets/examples'/('inking-'+name+'.json')).write_text(json.dumps(meta,indent=2));subprocess.run(['inkscape',str(OUT/(name+'.svg')),'--export-type=png','--export-filename='+str(OUT/(name+'.png'))],check=True,capture_output=True)
labels=['fine feather','thick-to-thin','shadow feather','curved feather','broad sweep','reversed sweep','stacked side marks','curved side marks','ruled taper','broken texture','cross-hatching','white scratch','pressure variant','white correction']
s=txt(35,45,'DIGITAL INK LAB | 12 source-inspired families + 2 original variants',26)+txt(35,75,'Original vector stroke designs; digital analogs, not claims of physical pen or brush practice.',16)
for i in range(14):
 x=35+(i%7)*178;y=110+(i//7)*225;s+=f'<rect x="{x}" y="{y}" width="155" height="150" fill="white" stroke="#c5c4be"/>'+swatch(i,x,y,'swatch'+str(i))+txt(x,y+176,f'{i+1:02} {labels[i]}',13)
s+=txt(35,585,'Lesson: shape and direction matter more than adding texture everywhere. White correction remains editable.',16)
save('01-stroke-laboratory',1280,630,s,{'coverage':['C12-01','C12-02'],'scan':[124,125],'adaptation':'Original analog stroke families, not traced copies','swatches':labels})
s=txt(35,45,'INKING A HARBOR WATCH | Same scene, three treatments',27)
for i,mode in enumerate(['uniform','balanced','overworked']):
 x=35+i*510;s+=f'<g transform="translate({x} 105)">'+scene(mode,id=mode)+'</g>'+txt(x,85,mode.upper(),18)
 s+=f'<g transform="translate({x+125} 465) scale(.48)">'+scene(mode,id=mode+'-thumb')+'</g>'
s+=txt(35,670,'At thumbnail scale: uniform contours flatten the focus; excess texture obscures the figure; grouped blacks preserve it.',18)
save('02-ink-balance',1580,720,s,{'coverage':['C12-03'],'scan':[126,127,128],'scene':'Original harbor lookout','variants':['uniform','balanced','overworked'],'thumbnail_scale':.48})
s=txt(35,45,'BLACK MASSES | Focus, counterbalance and directional mood',27)
for i,(abstract,balance,label) in enumerate([(False,True,'Rendered: left light / face window'),(True,True,'Value grouping: counterweight present'),(True,False,'Counterweight removed')]):
 x=35+i*510;s+=f'<g transform="translate({x} 105)">'+scene('balanced',abstract,balance,'focus'+str(i))+'</g>'+txt(x,85,label,16)
for i,kind in enumerate(['calm','chaos','horror','action']):
 x=35+i*385;s+=txt(x,460,kind.upper(),18)+f'<g transform="translate({x} 480) scale(.80)">'+mood(kind,False,kind)+'</g>'+f'<g transform="translate({x} 714) scale(.80)">'+mood(kind,True,kind+'-abstract')+'</g>'
s+=txt(35,955,'Top: light-facing opening concentrates attention. Bottom: full panels above their abstract black-mass reductions.',17)
save('03-mood-and-masses',1580,1000,s,{'coverage':['C12-04','C12-05','C12-06'],'scan':[129,130,131,132,133],'original_scenes':['harbor watcher','quiet colonnade','shattered vortex','dark threshold','leaping messenger'],'note':'Graphical value design, not simulated illumination'})
from heads import render_head
from figures import render_figure
s=txt(35,45,'FOCAL LIGHT | Figure, menace silhouette and grouped faces',27)
# White body framed by dark drapery; graphical side illumination, not ray tracing.
s+=f'<g transform="translate(35 95)">'+path('M0,0 H470 V620 H0 Z','#fff',INK,2)+path('M0,0 H90 L40,620 H0 Z')+render_figure({'id':'lit-figure','x':238,'y':70,'scale':.80,'pose':'brace','skin':'#fff','suit':'#fff','shadow':INK,'identity':{'build':'athletic','jaw':'broad','hair':'short'}})+path('M292,170 Q326,191 313,257 L284,282 L276,237 Z')+feather(340,320,15,55,6,2,5,'lit-ground')+'</g>'
s+=f'<g transform="translate(535 95)">'+path('M0,0 H470 V620 H0 Z','#fff',INK,2)+path('M0,0 H470 V620 H320 L295,173 Q220,140 160,220 L100,620 H0 Z')+silhouette(238,235,1.65,'menace')+path('M174,194 Q223,164 271,192 L255,217 Q223,205 185,220 Z','#fff')+path('M187,203 l25,-3 M236,199 l22,5','none',INK,3)+'</g>'
s+=f'<g transform="translate(1035 95)">'+path('M0,0 H470 V620 H0 Z','#fff',INK,2)
s+=path('M0,88 L193,204 L0,163 Z M470,95 L287,217 L470,176 Z M0,190 L161,240 L0,225 Z M470,208 L359,242 L470,248 Z')
for i,(x,y,sc,ident) in enumerate([(102,253,1.15,{'age':'adult','jaw':'narrow','hair':'long'}),(350,270,1.2,{'age':'elder','jaw':'broad','hair':'bald','beard':'short'}),(231,325,1.6,{'age':'adult','jaw':'broad','hair':'short'})]):
 s+=path(f'M{x-55*sc},{y+45*sc} Q{x},{y+20*sc} {x+55*sc},{y+45*sc} L{x+90*sc},620 H{x-90*sc} Z')+render_head({'id':'group-head-'+str(i),'x':x,'y':y,'scale':sc,'view':'threequarter','identity':dict(ident,skin='#fff')})
s+='</g>'
s+=txt(35,753,'Upper-left light / quiet white face',18)+txt(535,753,'A narrow face opening in a large mass',18)+txt(1035,753,'Three faces linked by one dark field',18)
s+=txt(35,800,'The figure uses shared anatomy landmarks. Shadow shapes are authored design choices, not physically simulated light.',18)
save('04-light-and-group',1540,845,s,{'coverage':['C12-04'],'scan':[129,130],'subjects':['side-lit figure','menace silhouette','three-person face group'],'limits':'Authored graphical illumination; stylized faces and anatomy remain bounded'})
