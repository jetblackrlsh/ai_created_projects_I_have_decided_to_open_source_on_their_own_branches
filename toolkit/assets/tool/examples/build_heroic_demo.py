"""Rebuild neutral art with an explicitly supplied heroic drawing tool scripts directory."""
import argparse,json,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--drawing-scripts',required=True);a=p.parse_args();sys.path.insert(0,a.drawing_scripts)
from heroic import export
root=Path(__file__).parent/'heroic-harbor';root.mkdir(exist_ok=True)
page={'version':1,'width':1080,'height':700,'background':'#eee4cc','objects':[]}
for i in range(2):
 objects=[{'kind':'rect','id':'sky','x':0,'y':0,'width':510,'height':640,'fill':'#a7c3d2'},{'kind':'rect','id':'sea','x':0,'y':360,'width':510,'height':280,'fill':'#37617f'},{'kind':'path','id':'pier','d':'M0 640 L200 370 L330 370 L510 640 Z','fill':'#c0a682'}, {'kind':'path','id':'tower','d':'M50 360 L70 100 L145 100 L165 360 Z','fill':'#e8debf'}, {'kind':'rect','id':'lamp','x':60,'y':65,'width':95,'height':40,'fill':'#e8c567'}, {'kind':'figure','id':'keeper','x':315,'y':150,'scale':.65,'pose':'stand','skin':'#ad7859','suit':'#235877'}, {'kind':'path','id':'gate','d':('M200 500 L200 340 L470 340 L470 500 M200 420 L470 420' if i==0 else 'M460 500 L460 340 L500 315 L500 475 M460 420 L500 395'),'stroke':'#252b30','width':12}, {'kind':'caption','id':'caption','text':('At dawn, the keeper opens the gate.' if i==0 else 'The harbor is safe.'),'x':15,'y':15,'width':470,'size':22}]
 page['objects'].append({'kind':'panel','id':'dawn' if i==0 else 'gate','x':20+i*530,'y':30,'width':510,'height':640,'background':'#b7c4d5','objects':objects})
export(page,root/'page')
(root/'import.json').write_text(json.dumps({'pages':[{'json':'page.json','image':'page.png'}],'output':'panels'},indent=2))
