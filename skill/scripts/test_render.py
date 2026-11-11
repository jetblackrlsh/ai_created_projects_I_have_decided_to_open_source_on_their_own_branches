import unittest,tempfile,json,hashlib
from pathlib import Path
from PIL import Image
from render import validate,frame
class Tests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.p=Path(self.tmp.name)
  Image.new('RGBA',(50,50),(0,0,0,0)).save(self.p/'host.png')
  Image.new('RGB',(300,200),'blue').save(self.p/'e.png')
  self.m={'scenes':[{'id':'a','duration':2,'host':'host.png','title':'Test','bullets':['Readable'],'speech':[{'start':.1,'end':1.8,'subtitle':'Hello'}]}]}
 def test_valid(self):self.assertTrue(validate(self.m,self.p))
 def test_frames(self):self.assertEqual(frame(self.m['scenes'][0],1,640,360,self.p,{}).size,(640,360))
 def test_dense(self):
  self.m['scenes'][0]['bullets']=['x'*100]
  with self.assertRaises(ValueError):validate(self.m,self.p)
 def test_timing(self):
  self.m['scenes'][0]['speech'][0]['end']=3
  with self.assertRaises(ValueError):validate(self.m,self.p)
 def test_duplicate(self):
  self.m['scenes']*=2
  with self.assertRaises(ValueError):validate(self.m,self.p)
 def test_hash(self):
  self.m['scenes'][0].update(image='e.png',image_sha256='bad',source_kind='original')
  with self.assertRaises(ValueError):validate(self.m,self.p)
 def test_source(self):
  self.m['scenes'][0].update(image='e.png',image_sha256=hashlib.sha256((self.p/'e.png').read_bytes()).hexdigest(),source_kind='screenshot')
  with self.assertRaises(ValueError):validate(self.m,self.p)
 def test_resolution(self):
  self.m['width']=1280
  with self.assertRaises(ValueError):validate(self.m,self.p)
if __name__=='__main__':unittest.main()
