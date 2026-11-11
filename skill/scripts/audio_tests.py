import unittest
import numpy as np
from audio_build import validate,normalize,db
from audio_presence import audit
class AudioTests(unittest.TestCase):
 def base(self):return {'scenes':[{'id':'a','caption':'She says: Hello.','utterances':[{'speaker':'Narrator','voice':'af_heart','text':'She says: '},{'speaker':'Host','voice':'am_michael','text':'Hello.'}]}]}
 def test_segments(self):self.assertEqual(len(validate(self.base())),2)
 def test_coverage(self):
  m=self.base();m['scenes'][0]['utterances'][0]['text']='She says'
  with self.assertRaises(ValueError):validate(m)
 def test_cast(self):
  m=self.base();m['scenes'][0]['utterances'][1]['voice']='af_heart'
  with self.assertRaises(ValueError):validate(m)
 def test_duplicates(self):
  m=self.base();m['scenes']*=2
  with self.assertRaises(ValueError):validate(m)
 def test_missing_voice(self):
  m=self.base();del m['scenes'][0]['utterances'][0]['voice']
  with self.assertRaises(ValueError):validate(m)
 def test_music_floor(self):
  self.assertFalse(audit(np.full((48000*4,2),.001),48000)['pass'])
  self.assertTrue(audit(np.full((48000*4,2),.04),48000)['pass'])
 def test_silence(self):
  with self.assertRaises(ValueError):normalize(np.zeros((100,2)),-18)
 def test_nonfinite(self):
  with self.assertRaises(ValueError):audit(np.array([float('nan')]),48000)
if __name__=='__main__':unittest.main()
