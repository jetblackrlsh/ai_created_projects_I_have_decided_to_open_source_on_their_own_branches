"""Synthetic signal tests are engineering fixtures, not listening certification."""
import json, pathlib, sys, tempfile, unittest
import numpy as np
from scipy.io import wavfile
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from mix_audio import build, RATE
class MusicPresenceTests(unittest.TestCase):
 def fixture(self, root, effects=True, music=True):
  t=np.arange(RATE*6)/RATE
  score=.15*np.sin(2*np.pi*160*t);score[(t>4)&(t<5)]=0
  voice=.25*np.sin(2*np.pi*410*t[:RATE*3])
  fx=.8*np.sin(2*np.pi*910*t[:RATE//2])
  for name,a in [('voice',voice),('music',score),('fx',fx)]:wavfile.write(root/(name+'.wav'),RATE,a.astype(np.float32))
  c={'duration':6,'speech':[{'id':'v','file':'voice.wav','start':1,'speaker':'narrator','voice':'af_heart','text':'Synthetic fixture, not generated speech.'}]}
  if music:c['music']={'file':'music.wav'}
  if effects:c['effects']=[{'file':'fx.wav','action':'test transient','at':2,'offset':0,'peak':.8}]
  p=root/'project.json';p.write_text(json.dumps(c));return p,c
 def test_presence_action_and_speech(self):
  with tempfile.TemporaryDirectory() as td:
   p,c=self.fixture(pathlib.Path(td));r,m,fx=build(p,write=True)
   _,music=wavfile.read(pathlib.Path(td)/'out/music-stem-48k.wav')
   self.assertLessEqual(r['peak'],.89+1e-8)
   self.assertTrue(np.isfinite(m).all())
   self.assertGreater(r['speechWindowLevels'][0]['musicRelativeToVoiceDb'],-14)
   self.assertLess(r['speechWindowLevels'][0]['musicRelativeToVoiceDb'],-10)
   # SFX do not stack another 13dB cut on already ducked speech.
   rms=lambda a:np.sqrt(np.mean(a*a))
   self.assertGreater(rms(music[2*RATE:round(2.4*RATE)])/rms(music[round(1.4*RATE):round(1.8*RATE)]),.95)
   self.assertEqual(np.count_nonzero(music[round(4.1*RATE):round(4.9*RATE)]),0)
   self.assertGreater(rms(music[round(5.1*RATE):round(5.3*RATE)]),rms(music[2*RATE:round(2.2*RATE)]))
   self.assertFalse(r['listeningVerified'])
 def test_absent_music_remains_absent(self):
  with tempfile.TemporaryDirectory() as td:
   p,c=self.fixture(pathlib.Path(td),music=False);r,*_=build(p,write=False)
   self.assertIsNone(r['music']);self.assertFalse(r['musicReviewRequired'])
 def test_invalid_config(self):
  for key,value in [('speech_gain',.01),('presence_floor',0),('release_seconds',float('nan')),('speech_gap_db',100),('peak',2)]:
   with tempfile.TemporaryDirectory() as td:
    p,c=self.fixture(pathlib.Path(td));c['music'][key]=value;p.write_text(json.dumps(c))
    with self.assertRaises(ValueError):build(p,write=False)
 def test_quiet_score_normalizes_same_as_loud(self):
  with tempfile.TemporaryDirectory() as td:
   root=pathlib.Path(td);p,c=self.fixture(root,effects=False);r1,m1,_=build(p,write=False)
   rate,a=wavfile.read(root/'music.wav');wavfile.write(root/'music.wav',rate,a*.01)
   r2,m2,_=build(p,write=False)
   self.assertTrue(np.allclose(m1,m2,atol=1e-7))
 def test_old_deep_setting_rejected(self):
  with tempfile.TemporaryDirectory() as td:
   p,c=self.fixture(pathlib.Path(td));c['music']['speech_gain']=.08;p.write_text(json.dumps(c))
   with self.assertRaises(ValueError):build(p,write=False)
if __name__=='__main__':unittest.main()
