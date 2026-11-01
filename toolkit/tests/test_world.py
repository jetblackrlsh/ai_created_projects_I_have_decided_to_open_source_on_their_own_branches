import unittest,sys,copy,re,xml.etree.ElementTree as ET
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from world import *
class PerspectiveTests(unittest.TestCase):
 def test_center(self):
  c=Camera((0,2,10),(0,2,0));x,y,z=c.project((0,2,0));self.assertAlmostEqual(x,400);self.assertAlmostEqual(y,250)
 def test_distance(self):
  c=Camera((0,2,10),(0,2,0));near=c.project((1,2,0))[0]-400;far=c.project((1,2,-10))[0]-400;self.assertAlmostEqual(near/far,2)
 def test_vanishing_parallel(self):
  c=Camera();vp=c.vanishing((1,0,0));a=c.project((0,0,0));b=c.project((5,0,0));cross2=(b[0]-a[0])*(vp[1]-a[1])-(b[1]-a[1])*(vp[0]-a[0]);self.assertAlmostEqual(cross2,0,places=6)
 def test_ids_unique(self):
  for scene in ['street','interior','stairs','transit','subwayinterior','sanctuary','market','skyline']:
   xml=ET.fromstring('<svg>'+render_world({'scene':scene})+'</svg>');ids=[e.attrib['id']for e in xml.iter()if'id'in e.attrib];self.assertEqual(len(ids),len(set(ids)))
 def test_combined_world_unique(self):
  xml=ET.fromstring('<svg>'+render_world({'id':'a'})+render_world({'id':'b'})+'</svg>');ids=[e.attrib['id']for e in xml.iter()if'id'in e.attrib];self.assertEqual(len(ids),len(set(ids)))
 def test_night_changes_colors_only(self):
  a=ET.fromstring('<svg>'+render_world({'id':'a','scene':'market'})+'</svg>');b=ET.fromstring('<svg>'+render_world({'id':'a','scene':'market','palette':'night'})+'</svg>');self.assertEqual([e.get('points') for e in a.iter('polygon')],[e.get('points') for e in b.iter('polygon')]);self.assertNotEqual([e.get('fill') for e in a.iter('polygon')],[e.get('fill') for e in b.iter('polygon')])
 def test_edit_local(self):
  fs=box('one',(0,1,0),(2,2,2))+box('two',(4,1,0),(2,2,2));c=Camera();before=render_faces(fs,c);changed=copy.deepcopy(fs)
  for f in changed:
   if f['id'].startswith('one'):f['fill']='#ff0000'
  after=render_faces(changed,c)
  self.assertNotEqual(before,after)
  self.assertEqual(re.findall(r'<polygon id="two[^>]+>',before),re.findall(r'<polygon id="two[^>]+>',after))
 def test_behind_rejected(self):
  with self.assertRaises(ValueError):Camera((0,0,10),(0,0,0)).project((0,0,20))
 def test_all_cylinder_axes(self):
  for axis in ['x','y','z']:
   self.assertTrue(render_faces(cylinder('c',(0,0,0),1,2,axis=axis),Camera()))
if __name__=='__main__':unittest.main()
