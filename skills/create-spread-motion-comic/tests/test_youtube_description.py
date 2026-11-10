import importlib.util
from pathlib import Path
import unittest
p=Path(__file__).resolve().parents[1]/"scripts/check_youtube_description.py"
spec=importlib.util.spec_from_file_location("check_description",p)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class DescriptionTests(unittest.TestCase):
    def test_public(self):
        self.assertEqual(m.errors("A hero faces a city of living dreams. A narrated motion comic.\n#MotionComic"),[])
    def test_bad(self):
        for text in ["", "x"*5001, "TODO: add credits", "[insert link]", "https://drive.google.com/file/d/private/view", "/workspace/private/audio.wav", "Description: story", "```text", "[Story](https://example.com)"]:
            with self.subTest(text=text[:30]): self.assertTrue(m.errors(text))
if __name__=="__main__":unittest.main()
