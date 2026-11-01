import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import numpy as np
from scipy.io import wavfile

SCRIPTS=Path(__file__).resolve().parents[1]/'scripts'
sys.path.insert(0,str(SCRIPTS))
import verify

class VerificationTests(unittest.TestCase):
    def setUp(self):
        self.rng=np.random.default_rng(42)
        self.voice=self.rng.normal(0,.08,verify.RATE*3)
        self.speech=[dict(id='line-a',start=.5,end=2.5)]

    def test_good_audio_and_negative_controls(self):
        result=verify.check_anchors(self.voice,self.voice,self.voice,self.speech)
        self.assertEqual(len(result),2)
        for row in result:
            self.assertAlmostEqual(row['fullMixNegative50ms']['lagMs'],50)
            self.assertAlmostEqual(row['isolatedVoiceNegative50ms']['lagMs'],50)

    def test_drift_fails_closed(self):
        shifted=np.concatenate([np.zeros(2400),self.voice])[:len(self.voice)]
        with self.assertRaisesRegex(ValueError,'sync/prominence failed'):
            verify.check_anchors(self.voice,self.voice,shifted,self.speech)

    def test_masking_fails_despite_perfect_full_mix(self):
        mix=self.voice+self.rng.normal(0,.1,len(self.voice))
        with self.assertRaisesRegex(ValueError,'isolatedVoice'):
            verify.check_anchors(mix,self.voice,mix,self.speech)

    def test_wrong_output_sample_rate(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'audio.wav';wavfile.write(p,44100,np.ones(100,dtype=np.float32)*.1)
            with self.assertRaisesRegex(ValueError,'incorrect sample rate'):
                verify.read_pcm(p,48000)

    def test_silent_voice_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            b=Path(tmp);wavfile.write(b/'voice.wav',24000,np.zeros(1000,dtype=np.int16))
            q=dict(id='a',file='voice.wav',text='Hello',speaker='Narrator',voice='af_heart',start=0)
            with self.assertRaisesRegex(ValueError,'silent voice source'):
                verify.verify_speech(b,dict(speech=[q],cast={'Narrator':'af_heart'}),np.zeros((2000,2)))

    def test_missing_voice_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            q=dict(id='a',file='missing.wav',text='Hello',speaker='Narrator',voice='af_heart',start=0)
            with self.assertRaises(FileNotFoundError):
                verify.verify_speech(Path(tmp),dict(speech=[q],cast={'Narrator':'af_heart'}),np.zeros((2000,2)))

    def test_missing_cast_voice_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            q=dict(id='a',file='voice.wav',text='Hello',speaker='Narrator',voice='af_heart',start=0)
            with self.assertRaisesRegex(ValueError,'Missing/wrong cast voice'):
                verify.verify_speech(Path(tmp),dict(speech=[q],cast={'Other':'am_puck'}),np.zeros((2000,2)))

    def test_clipping_nonfinite_fail(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'audio.wav'
            for value in [1.0,float('nan')]:
                wavfile.write(p,48000,np.full(20,value,dtype=np.float32))
                with self.assertRaises(ValueError):verify.read_pcm(p,48000)

if __name__=='__main__':unittest.main()
