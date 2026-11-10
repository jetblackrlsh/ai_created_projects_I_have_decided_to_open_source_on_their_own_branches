#!/usr/bin/env python3
import unittest
import numpy as np
from sfx_comfort import soften_sfx

class SfxComfortTests(unittest.TestCase):
    def test_bright_static_attenuates(self):
        sr=48000; t=np.arange(sr)/sr
        x=np.column_stack([.2*np.sin(2*np.pi*4500*t)]*2)
        y,r=soften_sfx(x,sr)
        self.assertLess(np.sqrt(np.mean(y*y)),np.sqrt(np.mean(x*x))*.65)
        self.assertLessEqual(r['maximum_applied_attenuation_db'],6)
        self.assertEqual(x.shape,y.shape)
    def test_low_body_preserved(self):
        t=np.arange(48000)/48000;x=np.column_stack([.2*np.sin(2*np.pi*200*t)]*2)
        y,r=soften_sfx(x);np.testing.assert_allclose(y,x,atol=1e-9)
    def test_silence_and_short_inputs(self):
        for n in [0,7,50,48000]:
            x=np.zeros((n,2));y,r=soften_sfx(x);self.assertEqual(y.shape,x.shape);self.assertTrue(np.all(np.isfinite(y)))
    def test_finite_noise_and_no_mutation(self):
        x=np.random.default_rng(5).normal(0,.15,(96001,2)); original=x.copy();y,r=soften_sfx(x)
        np.testing.assert_array_equal(x,original);self.assertTrue(np.all(np.isfinite(y)));self.assertLessEqual(r['maximum_applied_attenuation_db'],6)
    def test_invalid_input(self):
        with self.assertRaises(ValueError):soften_sfx(np.array([[float('nan'),0]]))

if __name__=='__main__':unittest.main()
