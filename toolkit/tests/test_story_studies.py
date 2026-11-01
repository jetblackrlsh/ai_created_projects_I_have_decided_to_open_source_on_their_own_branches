import pathlib,sys,unittest,xml.etree.ElementTree as E,collections
ROOT=pathlib.Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'));import story_studies as s
class StoryTests(unittest.TestCase):
 def test_all_svg_unique_ids(self):
  svg='<svg>'+''.join(s.panel(i,id='p'+str(i))for i in range(6))+'</svg>';r=E.fromstring(svg);ids=[e.get('id')for e in r.iter()if e.get('id')];self.assertEqual(len(ids),len(set(ids)))
 def test_six_different_action_panels(self):self.assertEqual(len(set(s.panel(i,id='x')for i in range(6))),6)
 def test_deterministic_actor(self):self.assertEqual(s.actor(0,0,pose='tether'),s.actor(0,0,pose='tether'))
 def test_stages_share_transform(self):
  for stage in ['stick','mass','ink']:self.assertIn('translate(22 33)',s.actor(22,33,stage=stage))
 def test_cover_clipping(self):self.assertIn('clip-path="url(#x-coverclip)"',s.cover_art(id='x'))
 def test_no_raster(self):
  for i in range(6):self.assertNotIn('<image',s.panel(i,id='p'+str(i)))
if __name__=='__main__':unittest.main()
