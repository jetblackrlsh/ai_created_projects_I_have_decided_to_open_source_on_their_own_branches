import unittest,sys,tempfile,json,subprocess,copy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import heroic_motion as h
ROOT=Path(__file__).resolve().parents[1];DEMO=ROOT/'examples/heroic-harbor'
class HeroicTests(unittest.TestCase):
 def test_demo_contract(self):self.assertEqual(h.validate_exact(DEMO/'project.json')['duration'],12)
 def test_master_identity(self):self.assertTrue(h.verify_master(DEMO/'master.m4a',DEMO/'out/film.mp4')['identicalAACPacketsAndTiming'])
 def test_drama_identity(self):self.assertTrue(h.verify_master(DEMO/'master.m4a',DEMO/'out/audio-drama.mp4')['identicalAACPacketsAndTiming'])
 def test_50ms_drift_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   target=Path(d)/'shifted.mp4';subprocess.run(['ffmpeg','-v','error','-itsoffset','0.05','-i',str(DEMO/'master.m4a'),'-c','copy',str(target)],check=True)
   with self.assertRaises(ValueError):h.verify_master(DEMO/'master.m4a',target)
 def test_escape(self):
  with self.assertRaises(ValueError):h.local(DEMO,'../outside')
 def test_import_crop_exact(self):
  from PIL import Image,ImageChops
  page=Image.open(DEMO/'page.png').convert('RGB');ledger=json.loads((DEMO/'panels/panel-ledger.json').read_text())
  for p in ledger['panels']:
   x,y,w,ht=p['rect'];self.assertIsNone(ImageChops.difference(page.crop((x,y,x+w,y+ht)),Image.open(DEMO/'panels'/p['image']).convert('RGB')).getbbox())
 def test_import_overwrite_refused(self):
  with self.assertRaises(ValueError):h.import_page(DEMO/'import.json')
 def test_full_decode(self):
  for f in ['film.mp4','audio-drama.mp4']:subprocess.run(['ffmpeg','-v','error','-i',str(DEMO/'out'/f),'-f','null','-'],check=True)
if __name__=='__main__':unittest.main()
