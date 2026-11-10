#!/usr/bin/env python3
"""Fast deterministic tests; no models, media generation, or network needed."""
import unittest
import numpy as np
from priority_audio_mix import mix_priority

class PriorityMixTests(unittest.TestCase):
    def setUp(self):
        self.sr = 8000
        self.t = np.arange(self.sr * 2) / self.sr
        self.voice = np.column_stack([.25*np.sin(2*np.pi*220*self.t)]*2)
        self.sfx = np.column_stack([.6*np.sin(2*np.pi*880*self.t)]*2)
        self.music = np.column_stack([.08*np.sin(2*np.pi*110*self.t)]*2)

    def assert_hierarchy(self, report):
        for key in ("voice_over_sfx", "voice_over_music", "sfx_over_music"):
            self.assertEqual(report[key]["violations"], 0, (key, report[key]))
        self.assertLessEqual(report["master_peak_dbfs"], -1.499)
        self.assertLessEqual(report["sfx_peak_dbfs"], -8.999)

    def test_overlapping_sfx_sum(self):
        v, s, m, master, report = mix_priority(self.voice, self.sfx * 4, self.music, self.sr)
        self.assert_hierarchy(report)
        np.testing.assert_allclose(master, v+s+m, atol=1e-14)

    def test_quiet_voice_then_gap_then_return(self):
        self.voice[:4000] *= .25
        self.voice[4000:9000] = 0
        self.voice[9000:] *= .4
        result = mix_priority(self.voice, self.sfx, self.music, self.sr)
        self.assert_hierarchy(result[-1])
        self.assertGreater(result[-1]["music_below_floor_windows"], 0)
        self.assertEqual(result[-1]["music_floor_status"], "review_required")

    def test_stereo_antiphase_not_silence(self):
        self.voice[:,1] *= -1
        report = mix_priority(self.voice, self.sfx, self.music, self.sr)[-1]
        self.assert_hierarchy(report)
        self.assertGreater(report["voice_over_sfx"]["compared_windows"], 0)

    def test_absent_buses_not_fake_success(self):
        z = np.zeros_like(self.voice)
        result = mix_priority(z, z, self.music, self.sr)
        self.assertEqual(result[-1]["voice_over_sfx"]["status"], "not_applicable")
        np.testing.assert_array_equal(result[2], self.music)
        self.assertEqual(mix_priority(z,z,z,self.sr)[-1]["music_floor_status"], "not_applicable")

    def test_short_input(self):
        self.assert_hierarchy(mix_priority(self.voice[:13],self.sfx[:13],self.music[:13],self.sr)[-1])

    def test_random_transients_and_boundaries(self):
        rng = np.random.default_rng(7)
        for n in (401, 803, 16137):
            voice = rng.normal(0,.2,(n,2))
            sfx = rng.normal(0,.8,(n,2))
            music = rng.normal(0,.05,(n,2))
            voice[n//4:n//2] *= .02
            sfx[399::400] += 4
            self.assert_hierarchy(mix_priority(voice,sfx,music,self.sr)[-1])

    def test_reject_nonfinite_empty_mismatch(self):
        with self.assertRaises(ValueError):
            mix_priority(self.voice[:0],self.sfx[:0],self.music[:0],self.sr)
        with self.assertRaises(ValueError):
            mix_priority(self.voice,self.sfx[:-1],self.music,self.sr)
        self.voice[0,0] = np.nan
        with self.assertRaises(ValueError):
            mix_priority(self.voice,self.sfx,self.music,self.sr)

if __name__ == "__main__":
    unittest.main()

