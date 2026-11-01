"""Original feature placement and mark-economy study, not universal beauty rules."""
import pathlib,json,subprocess,html,math
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'outputs'
def p(d,fill='none',w=2,stroke='#17202b',id='shape'):return f'<path id="{id}" d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def t(x,y,s,size=17):return f'<text x="{x}" y="{y}" font-family="DejaVu Sans" font-size="{size}" fill="#17202b">{html.escape(s)}</text>'
def eye(id,dense=False):
 s=p('M0,10 Q45,-15 90,8 Q45,35 0,10 Z','#fff',2,id=id+'-contour')+p('M0,10 Q45,-16 90,8 L78,7 Q45,-7 7,14 Z','#17202b',0,id=id+'-lashmass')+f'<ellipse id="{id}-iris" cx="46" cy="9" rx="10" ry="12" fill="#17202b"/>'+p('M2,-14 Q43,-30 87,-15','none',4,id=id+'-brow')
 if dense:
  for i in range(9):x=7+i*9;s+=p(f'M{x},{3-10*math.sin(i/8*math.pi)} l-5,-12 M{x},{18+9*math.sin(i/8*math.pi)} l-2,10',w=1,id=id+'-extra'+str(i))
 return s
def lips(id,dense=False):
 s=p('M0,0 Q22,-5 43,-1 Q62,-5 90,0 M12,11 Q45,21 78,11',w=2,id=id+'-contour')
 if dense:
  s+=p('M0,0 Q25,-16 44,-8 Q65,-15 90,0 M0,0 Q12,27 46,24 Q80,26 90,0',w=1.4,id=id+'-outline')
  for i in range(11):x=12+i*6;s+=p(f'M{x},3 l-1,8',w=.8,id=id+'-crease'+str(i))
 return s
def profile(id,dense=False):
 s=p('M0,-45 Q5,-28 20,-14 Q27,-7 13,-4 Q8,0 21,4 Q12,10 18,17 Q20,31 0,39 Q-16,41 -24,36',w=2,id=id+'-contour')+p('M10,-5 l5,-1 M9,5 l9,-1',w=1,id=id+'-features')
 if dense:s+=p('M-5,-40 Q-3,-20 8,-12 M-9,-37 Q-8,-20 3,-12 M-4,15 Q0,25 -6,29 M-13,18 Q-8,27 -13,31 M8,10 l8,-1 M6,13 l11,0',w=1,id=id+'-extra')
 return s
s=t(30,40,'FEATURE PLACEMENT & ECONOMY | Historical drawing conventions, original studies',25)
s+=t(30,75,'These are optional stylizations—not universal anatomy, gender, attractiveness or moral rules.',17)
# Authored face specifically constructed to exhibit five equal60-unit spans at the eye line.
s+='<g id="five-eye-study" transform="translate(245 325)">'
s+=p('M-150,-10 Q-165,-190 0,-195 Q165,-190 150,-10 L125,100 66,165 0,190 -66,165 -125,100 Z','#f5e6d3',3,id='head-outline')
s+=p('M-151,-40 Q-155,-160 -53,-185 Q44,-225 132,-150 L150,-67 Q82,-112 16,-126 Q-63,-68 -151,-40 Z','#17202b',2,id='hair')
for j,x in enumerate([-90,30]):
 s+=p(f'M{x},0 Q{x+30},-13 {x+60},0 Q{x+30},15 {x},0 Z','#fff',2,id='eye'+str(j))+f'<ellipse id="pupil{j}" cx="{x+30}" cy="0" rx="5" ry="8" fill="#17202b"/>'+p(f'M{x-2},-24 Q{x+30},-35 {x+62},-23',w=5,id='brow'+str(j))
s+=p('M-7,20 L-14,65 Q0,76 14,65 M-40,110 Q0,104 40,110 M-20,128 Q0,134 20,128',w=2,id='nose-mouth')
for i in range(6):x=-150+i*60;s+=p(f'M{x},-49 V39',w=1,stroke='#b74437',id='division'+str(i))
s+=p('M-150,-45 H150 M-150,0 H150',w=1,stroke='#b74437',id='measure')
s+='<rect x="-150" y="-77" width="300" height="28" fill="#fffdf6"/>'
for i in range(5):s+=t(-130+i*60,-55,str(i+1),16)
s+='</g>'+t(45,564,'Five equal spans × 60 units = 300-unit face width',16)+t(45,590,'Eyes occupy spans 2 and 4; span 3 is the eye gap.',16)+t(45,618,'This demonstration is constructed to fit the rule.',16)+t(45,645,'Real characters may deliberately depart from it.',16)
s+=t(620,135,'RESTRAINED MARKS',19)+t(950,135,'ADDED MARKS',19)
for i,(name,fun,y)in enumerate([('Eye / lash mass',eye,220),('Lip contour',lips,390),('Profile feature',profile,560)]):
 s+=t(610,y-(100 if i==2 else 48),name,17)
 for j,dense in enumerate([False,True]):s+=f'<g id="pair{i}-{j}" transform="translate({650+j*330} {y}) scale(1.8)">'+fun('feature'+str(i)+str(j),dense)+'</g>'
s+=t(610,680,'Same base geometry in each pair; only supplementary marks change.',16)+t(610,708,'At small panel scale, fewer marks can preserve clearer feature shapes.',16)
s+=t(30,770,'Applied study: book scans 76, 90–91. No source art traced; no claim that one facial feature type is objectively better.',16)
svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="810"><rect width="100%" height="100%" fill="#fffdf6"/>{s}</svg>'
pth=OUT/'feature-placement-economy';pth.with_suffix('.svg').write_text(svg);pth.with_suffix('.json').write_text(json.dumps({'source_scans':[76,90,91],'coverage':['C08-02','C08-08'],'five_equal_spans':{'face_width':300,'span_width':60,'boundaries':[-150,-90,-30,30,90,150],'eyes':[[ -90,-30],[30,90]]},'matched_pairs':['eye/lash','lip','profile'],'base_geometry_invariant':True,'historical_convention_not_universal':True},indent=2));subprocess.run(['inkscape',str(pth.with_suffix('.svg')),'--export-type=png','--export-filename='+str(pth.with_suffix('.png'))],check=True,capture_output=True)
