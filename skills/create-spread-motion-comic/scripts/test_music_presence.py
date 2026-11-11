import unittest,numpy as np
from check_music_presence import audit
class Tests(unittest.TestCase):
 def test_audible(self):self.assertTrue(audit(np.ones(600)*.035,100)["pass"])
 def test_quiet(self):self.assertFalse(audit(np.ones(600)*.001,100)["pass"])
 def test_rest(self):self.assertFalse(audit(np.r_[np.ones(300)*.035,np.zeros(300)],100)["pass"])
 def test_explicit_rest(self):self.assertTrue(audit(np.r_[np.ones(300)*.035,np.zeros(300)],100,exceptions=[{"start":3,"end":6,"reason":"ending fade"}])["pass"])
 def test_nonfinite(self):
  with self.assertRaises(ValueError):audit([float('nan')]*600,100)
 def test_empty(self):
  with self.assertRaises(ValueError):audit([],100)
if __name__=="__main__":unittest.main()
