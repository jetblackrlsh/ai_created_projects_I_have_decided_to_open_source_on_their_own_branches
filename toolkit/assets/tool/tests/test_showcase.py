import unittest,pathlib,sys
ROOT=pathlib.Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT));import heroic_motion as h
class ShowcaseTests(unittest.TestCase):
 def test_reviewed_showcase(self):
  c=h.validate_exact(ROOT/'examples/heroic-showcase/project.json');self.assertEqual(c['visualTreatment'],'heroic')
 def test_complete_audio_preserved(self):
  base=ROOT/'examples/heroic-showcase'
  for name in ['film.mp4','audio-drama.mp4']:self.assertTrue(h.verify_master(base/'master.m4a',base/'out'/name)['identicalAACPacketsAndTiming'])
