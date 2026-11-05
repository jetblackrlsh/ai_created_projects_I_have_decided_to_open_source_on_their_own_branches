import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]

def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / (name + '.py'))
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj

class PortabilityTests(unittest.TestCase):
    def test_all_scripts_help(self):
        for path in sorted((ROOT / 'scripts').glob('*.py')):
            with self.subTest(script=path.name):
                subprocess.run([sys.executable, str(path), '--help'], check=True, capture_output=True)

    def test_font_scales(self):
        render = module('render_vn_video')
        small = render.load_font(18).getbbox('Testing title')
        large = render.load_font(62).getbbox('Testing title')
        self.assertGreater(large[2] - large[0], (small[2] - small[0]) * 2)

    def test_theater_escapes_story(self):
        render = module('render_vn_video')
        payload = '</script><script>alert(1)</script><img src=x onerror=alert(1)>'
        timeline = {'title': payload, 'subtitle': payload, 'credits_card': {'start': 5},
                    'scenes': [{'id': 'S1', 'title': payload, 'start': 1}],
                    'lines': [{'id': 'L1', 'speaker': payload, 'text': payload, 'start': 1}]}
        with tempfile.TemporaryDirectory() as tmp:
            render.generate_vn_web_theater(Path(tmp), timeline)
            html = (Path(tmp) / 'index.html').read_text()
            self.assertNotIn(payload, html)
            self.assertNotIn('innerHTML', html)
            self.assertIn('speaker.textContent', html)
            self.assertIn('\\u003c/script\\u003e', html)
            self.assertEqual(html.count('<script>'), 1)

    def test_schema_queue(self):
        images = module('prepare_vn_image_manifest')
        schema = (ROOT / 'references/vn_spec_schema.md').read_text()
        spec = json.loads(re.search(r'```json\n(.*?)\n```', schema, re.S).group(1))
        with tempfile.TemporaryDirectory() as tmp:
            entries = images.collect_required_images(spec, Path(tmp))
            self.assertEqual(len(entries), 7)
            shot = next(e for e in entries if e['id'] == 'shot_L02_b')
            self.assertIn('Character Model Lock (Elena', shot['prompt'])
            self.assertIn('midnight', shot['prompt'])

    def test_caption_sanitization(self):
        tts = module('kokoro_tts_vn')
        result = tts.sanitize_text_for_tts('On 11/04/2026, well-known heroes—returned.')
        for mark in '-—–':
            self.assertNotIn(mark, result)
        self.assertIn('November fourth', result)

    def test_dsp_preserves_length(self):
        import numpy as np
        tts = module('kokoro_tts_vn')
        samples = np.sin(2 * np.pi * 200 * np.arange(24000) / 24000)
        import inspect
        parameters = inspect.signature(tts.wsola_pitch_shift)
        # Function signature itself is checked by the direct call.
        shifted = tts.wsola_pitch_shift(samples, semitones=2.0, sample_rate=24000)
        self.assertEqual(len(shifted), len(samples))
        self.assertTrue(np.isfinite(shifted).all())

if __name__ == '__main__':
    unittest.main()
