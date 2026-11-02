import unittest,tempfile,pathlib,json,sys,copy
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from project import validate,local
from crop import crop
class ManifestTests(unittest.TestCase):
 def setUp(self):
  self.source=pathlib.Path(__file__).resolve().parents[1]/'examples/harbor/project.json';self.c=json.loads(self.source.read_text())
 def bad(self,edit):
  edit(self.c)
  with tempfile.TemporaryDirectory() as td:
   p=pathlib.Path(td)/'project.json';p.write_text(json.dumps(self.c))
   with self.assertRaises((ValueError,KeyError)):validate(p,assets=False)
 def test_long_form_manifest(self):
  self.c['duration']=1000
  with tempfile.TemporaryDirectory() as td:
   p=pathlib.Path(td)/'project.json';p.write_text(json.dumps(self.c));self.assertEqual(validate(p,assets=False)['duration'],1000)
 def test_over_one_hour_rejected(self):self.bad(lambda c:c.update(duration=3601))
 def test_missing_voice(self):self.bad(lambda c:c['speech'][0].pop('voice'))
 def test_duplicate_cast(self):self.bad(lambda c:c['cast'].update(Keeper='af_heart'))
 def test_missing_panel(self):self.bad(lambda c:c['panels'].append(dict(id='missing',image='x',source='x',sha256='x')))
 def test_unreviewed_script(self):self.bad(lambda c:c['audioOnlyReview'].update(approved=False))
 def test_shot_drift(self):self.bad(lambda c:c['shots'][0].update(start=1.001))
 def test_escape_path(self):
  with self.assertRaises(ValueError):local(pathlib.Path('/tmp'), '../etc/passwd')
 def test_external_svg_rejected(self):
  with tempfile.TemporaryDirectory() as td:
   r=pathlib.Path(td);(r/'bad.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.com/a.png"/></svg>');(r/'crop.json').write_text(json.dumps({'crops':[{'id':'x','source':'bad.svg','output':'out.png','rect':[0,0,1,1]}]}))
   with self.assertRaises(ValueError):crop(r/'crop.json')
if __name__=='__main__':unittest.main()
