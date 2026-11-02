import unittest,sys
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from verify import check_timing_and_report_prominence,RATE
class TimingPresenceTests(unittest.TestCase):
 def setUp(self):
  rng=np.random.default_rng(78);self.voice=rng.normal(0,.1,RATE*3);music=rng.normal(0,.08,RATE*3);self.mix=self.voice+music;self.s=[{'id':'line','start':.3,'end':2.5}]
 def test_audible_music_is_not_timing_failure(self):
  r=check_timing_and_report_prominence(self.mix,self.voice,self.mix.copy(),self.s)
  self.assertTrue(all(x['prominenceNeedsListeningReview'] for x in r));self.assertTrue(all(abs(x['fullMix']['lagMs'])<.001 for x in r))
 def test_shifted_mix_still_fails(self):
  with self.assertRaises(ValueError):check_timing_and_report_prominence(self.mix,self.voice,np.r_[np.zeros(2400),self.mix][:-2400],self.s)
 def test_changed_mix_still_fails(self):
  rng=np.random.default_rng(90)
  with self.assertRaises(ValueError):check_timing_and_report_prominence(self.mix,self.voice,rng.normal(0,.1,len(self.mix)),self.s)

 def test_silent_voice_boundary_warns_not_drift(self):
  r=check_timing_and_report_prominence(self.mix,np.zeros_like(self.voice),self.mix.copy(),self.s)
  self.assertTrue(all(x['prominenceNeedsListeningReview'] for x in r))
  self.assertTrue(all(x['isolatedVoiceDiagnostic']['correlation'] is None for x in r))
 def test_stem_shift_and_gain_fail_exact_placement(self):
  import tempfile
  from scipy.io import wavfile
  from verify import verify_speech
  with tempfile.TemporaryDirectory() as td:
   p=Path(td);raw=self.voice[:RATE].astype(np.float32);wavfile.write(p/'v.wav',RATE,raw)
   q={'id':'v','file':'v.wav','speaker':'Narrator','voice':'af_heart','text':'Generic fixture','start':.5,'gain':.86}
   cfg={'speech':[q],'cast':{'Narrator':'af_heart'}}
   from mix_audio import load
   a=load(p/'v.wav')*.86;good=np.zeros((RATE*3,2),np.float32);good[RATE//2:RATE//2+len(a)]=a
   self.assertEqual(len(verify_speech(p,cfg,good)),1)
   for bad in [np.roll(good,2400,axis=0),good*.9]:
    with self.assertRaises(ValueError):verify_speech(p,cfg,bad)
