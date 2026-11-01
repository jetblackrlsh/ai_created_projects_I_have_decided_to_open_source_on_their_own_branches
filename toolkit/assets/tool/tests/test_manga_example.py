import unittest,pathlib,sys,json,copy
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from project import validate,validate_art
class RealMangaExampleTests(unittest.TestCase):
 def setUp(self):self.p=pathlib.Path(__file__).resolve().parents[1]/'examples/manga-harbor/project.json'
 def test_real_source_pipeline_passes(self):
  c=validate(self.p);self.assertEqual(c['artContract']['origin'],'draw-headless-manga')
 def test_changed_scene_receipt_fails(self):
  c=json.loads(self.p.read_text());c['artContract']['evidence'][2]['sha256']='bad'
  with self.assertRaises(ValueError):validate_art(self.p.parent,c)
