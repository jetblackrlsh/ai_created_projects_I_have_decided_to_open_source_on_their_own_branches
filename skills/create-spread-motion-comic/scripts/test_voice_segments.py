import copy,unittest
from validate_voice_segments import validate
class Tests(unittest.TestCase):
 def fixture(self):
  return {"cast":{"narrator":"am_adam","Mira":"af_heart"},"captions":[{"id":"p1","source_text":"Mira said: Go.","segments":[{"start":0,"end":11,"kind":"narration","speaker":"narrator","text":"Mira said: "},{"start":11,"end":14,"kind":"dialogue","speaker":"Mira","text":"Go."}]}]}
 def test_valid(self): self.assertTrue(validate(self.fixture())["valid"])
 def test_wrong_narrator(self):
  x=self.fixture();x["captions"][0]["segments"][0]["speaker"]="Mira"
  with self.assertRaises(AssertionError):validate(x)
 def test_gap(self):
  x=self.fixture();x["captions"][0]["segments"][1]["start"]=12
  with self.assertRaises(AssertionError):validate(x)
 def test_missing_suffix(self):
  x=self.fixture();x["captions"][0]["segments"].pop()
  with self.assertRaises(AssertionError):validate(x)
 def test_text_change(self):
  x=self.fixture();x["captions"][0]["segments"][1]["text"]="No."
  with self.assertRaises(AssertionError):validate(x)
 def test_duplicate_voice(self):
  x=self.fixture();x["cast"]["Mira"]="am_adam"
  with self.assertRaises(AssertionError):validate(x)
if __name__=="__main__":unittest.main()
