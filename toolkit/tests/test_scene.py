import sys,pathlib,unittest,copy,xml.etree.ElementTree as ET, tempfile
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from heroic import *
class SceneTests(unittest.TestCase):
 def scene(self):return {'version':1,'width':500,'height':400,'objects':[{'id':'left','kind':'rect','x':10,'y':10,'width':90,'height':80,'fill':'#ffffff'},{'id':'right','kind':'rect','x':250,'y':20,'width':100,'height':100,'fill':'#222222'}]}
 def test_valid_xml(self):ET.fromstring(render(self.scene()))
 def test_unique_ids(self):
  s=self.scene();s['objects'][1]['id']='left'
  with self.assertRaises(AssertionError):validate(s)
 def test_nan(self):
  s=self.scene();s['objects'][0]['x']=float('nan')
  with self.assertRaises(ValueError):validate(s)
 def test_patch_does_not_mutate(self):
  s=self.scene();old=copy.deepcopy(s);n=patch(s,'left',{'fill':'#ff0000'});self.assertEqual(s,old);self.assertNotEqual(s,n)
 def test_patch_unchanged_geometry(self):
  s=self.scene();n=patch(s,'left',{'fill':'#ff0000'});self.assertEqual(hashes(s)['right'],hashes(n)['right']);self.assertNotEqual(hashes(s)['left'],hashes(n)['left'])
 def test_unknown_patch(self):
  with self.assertRaises(KeyError):patch(self.scene(),'absent',{})
 def test_text_escaped(self):
  s=self.scene();s['objects'].append(dict(id='t',kind='text',x=0,y=0,text='<script>&"'));self.assertIn('&lt;script&gt;&amp;',render(s))
 def test_pixel_patch(self):
  from PIL import Image,ImageChops
  with tempfile.TemporaryDirectory()as t:
   s=self.scene();n=patch(s,'left',{'fill':'#ff0000'});export(s,pathlib.Path(t)/'a');export(n,pathlib.Path(t)/'b');a=Image.open(pathlib.Path(t)/'a.png');b=Image.open(pathlib.Path(t)/'b.png');self.assertIsNone(ImageChops.difference(a.crop((120,0,500,400)),b.crop((120,0,500,400))).getbbox())
 def test_deterministic(self):self.assertEqual(render(self.scene()),render(self.scene()))
if __name__=='__main__':unittest.main()
