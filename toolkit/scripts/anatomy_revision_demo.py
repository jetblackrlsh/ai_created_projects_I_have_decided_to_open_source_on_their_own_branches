from pathlib import Path
import importlib.util,sys
from figures import render_figure
p=Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('before',p/'outputs/figures-before-anatomy.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
s=['<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1100"><rect width="1500" height="1100" fill="#faf6eb"/><text x="50" y="45" font-size="28" font-family="sans-serif">ANATOMY REVISION • matched poses, unchanged landmark data</text>']
for row,pose in enumerate(['crouch','leap']):
 for col,(label,fun) in enumerate([('BEFORE',m.render_figure),('REVISED',render_figure)]):
  s.append(fun(dict(id=f'{pose}-{col}',pose=pose,x=370+col*750,y=180+row*510,scale=.68,identity=dict(hair='short'))));s.append(f'<text x="{300+col*750}" y="{100+row*510}" font-size="22" font-family="sans-serif">{label}</text>')
s.append('<text x="45" y="1065" font-size="18" font-family="sans-serif">Neck/trapezius integration; softened joints; fuller proximal forearms; asymmetric chest planes. Stylized, not solved anatomy.</text></svg>');(p/'outputs/anatomy-revision.svg').write_text(''.join(s))
