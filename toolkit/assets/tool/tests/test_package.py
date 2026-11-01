import unittest,tempfile,pathlib,sys,json,shutil
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from package import package
class PackageTests(unittest.TestCase):
 def test_missing_qa_never_exports(self):
  source=pathlib.Path(__file__).resolve().parents[1]/'examples/harbor'
  with tempfile.TemporaryDirectory() as td:
   r=pathlib.Path(td);shutil.copy(source/'project.json',r/'project.json');shutil.copytree(source/'assets',r/'assets')
   with self.assertRaises(ValueError):package(r/'project.json')
   self.assertFalse((r/'delivery').exists())
 def test_stale_qa_never_exports(self):
  source=pathlib.Path(__file__).resolve().parents[1]/'examples/harbor'
  with tempfile.TemporaryDirectory() as td:
   r=pathlib.Path(td);shutil.copy(source/'project.json',r/'project.json');shutil.copytree(source/'assets',r/'assets');(r/'out').mkdir();(r/'out/verification.json').write_text(json.dumps({'passed':True,'projectSha256':'wrong'}))
   with self.assertRaises(ValueError):package(r/'project.json')
   self.assertFalse((r/'delivery').exists())
if __name__=='__main__':unittest.main()
