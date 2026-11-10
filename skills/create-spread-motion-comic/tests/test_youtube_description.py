import importlib.util
from pathlib import Path
import unittest
p=Path(__file__).resolve().parents[1]/"scripts/check_youtube_description.py"
spec=importlib.util.spec_from_file_location("check_description",p)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class DescriptionTests(unittest.TestCase):
    def test_public(self):
        self.assertEqual(m.errors("Dream City\n\nA hero faces a city of living dreams. A narrated motion comic.\n\nmotion comic, dream story"),[])
    def test_bad(self):
        for text in ["", "x"*5001, "TODO: add credits", "[insert link]", "https://drive.google.com/file/d/private/view", "/workspace/private/audio.wav", "Description: story", "```text", "[Story](https://example.com)"]:
            with self.subTest(text=text[:30]): self.assertTrue(m.errors(text))
class ExportTests(unittest.TestCase):
    def test_export(self):
        import sys
        sys.path.insert(0,str(p.parent))
        from write_youtube_metadata import render
        desc,md=render({"title":"Dream City","description":"A hero explores a living dream.","tags":["motion comic","dream story"]})
        self.assertEqual(desc.splitlines()[0],"Dream City")
        self.assertEqual(desc.splitlines()[-1],"motion comic, dream story")
        self.assertIn(desc,md)
    def test_no_tag_list(self):
        self.assertTrue(m.errors("Dream City\n\nA hero explores a living dream."))
if __name__=="__main__":unittest.main()
