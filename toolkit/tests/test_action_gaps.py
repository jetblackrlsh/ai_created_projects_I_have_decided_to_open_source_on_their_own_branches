import sys,unittest,json,xml.etree.ElementTree as E
from pathlib import Path
P=Path(__file__).resolve().parents[1];sys.path.insert(0,str(P/'scripts'))
from action_gap_studies import rear,J
class ActionGaps(unittest.TestCase):
 def test_rear_stages(self):
  out=[rear({'id':'test','stage':i})for i in range(5)];self.assertEqual(len(set(out)),5)
  for x in out:E.fromstring(x)
 def test_no_face_on_back(self):
  s=rear({'id':'test'});self.assertNotIn('eye',s);self.assertIn('M -40,84',s)
 def test_contact_mask_evidence(self):
  import tempfile,subprocess
  from PIL import Image
  with tempfile.TemporaryDirectory() as t:
   t=Path(t)
   def raster(name,body):
    f=t/(name+'.svg');f.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000">'+body+'</svg>');subprocess.run(['inkscape',str(f),'-o',str(t/(name+'.png'))],check=True,capture_output=True);return Image.open(t/(name+'.png')).convert('RGBA').getchannel('A')
   a=raster('actor',rear(dict(id='actor',x=440,y=250,scale=1.25)))
   for key,foot in [('lw',False),('rw',False),('la',True),('ra',True)]:
    x=440+J[key][0]*1.25;y=250+J[key][1]*1.25+(17*1.25 if foot else -3)
    b=raster(key,f'<rect x="{x-30}" y="{y-3}" width="60" height="13" fill="black"/>');roi=(int(x-35),int(y-25),int(x+35),int(y+25));count=sum(1 for av,bv in zip(a.crop(roi).getdata(),b.crop(roi).getdata())if av>128 and bv>128);self.assertGreater(count,10)
 def test_world_grip_anchors(self):
  data=json.loads((P/'assets/examples/rear-wall-climb.json').read_text())
  for item in data['contacts']:
   x,y=item['point'];self.assertAlmostEqual(x,440+J[item['joint']][0]*1.25)
if __name__=='__main__':unittest.main()
