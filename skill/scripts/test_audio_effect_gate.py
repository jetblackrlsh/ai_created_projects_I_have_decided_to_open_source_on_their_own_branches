import unittest
from audio_effect_gate import effect_rejection
class GateTests(unittest.TestCase):
 def test_empty(self): self.assertEqual(effect_rejection({},10),'perceptual_review_missing')
 def test_opening(self): self.assertEqual(effect_rejection({},0),'opening_sfx_disabled')
 def receipt(self): return {'audition':{'listening_verified':True,'mixed_preview_verified':True,'reviewer':'tester','reviewed_at':'2026-11-12','notes':'Actually auditioned test fixture','source_sha256':'a'*64}}
 def test_opening_still_blocked(self): self.assertEqual(effect_rejection(self.receipt(),1),'opening_sfx_disabled')
 def test_no_hash_substitution(self): self.assertEqual(effect_rejection(self.receipt(),10,'b'*64),'review_hash_mismatch')
 def test_approved(self): self.assertIsNone(effect_rejection(self.receipt(),10,'a'*64))
 def test_numeric_not_enough(self): self.assertEqual(effect_rejection({'rms_pass':True,'peak_pass':True},10),'perceptual_review_missing')
 def test_mix_required(self):
  e=self.receipt();e['audition']['mixed_preview_verified']=False;self.assertEqual(effect_rejection(e,10),'perceptual_review_missing')
if __name__=='__main__':unittest.main()
