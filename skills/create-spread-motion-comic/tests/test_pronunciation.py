import importlib.util
from pathlib import Path
import unittest
p=Path(__file__).resolve().parents[1]/'scripts/kokoro_pronunciation.py'
spec=importlib.util.spec_from_file_location('pronunciation',p)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class FakeTokenizer:
 vocab=dict.fromkeys('ˌeɪˈaɪz')
 def phonemize(self,text,lang='en-us'):return '{'+text.strip()+'}'
class PronunciationTests(unittest.TestCase):
 def test_exact_ai(self):self.assertEqual(m.phonemize_for_kokoro('AI',FakeTokenizer()),m.AI_PHONEMES)
 def test_legacy_spacing(self):self.assertEqual(m.phonemize_for_kokoro('A I',FakeTokenizer()),m.AI_PHONEMES)
 def test_dots(self):self.assertEqual(m.phonemize_for_kokoro('A.I.',FakeTokenizer()),m.AI_PHONEMES)
 def test_plural_possessive(self):
  for x in ['AIs',"AI's",'AI’s']:self.assertEqual(m.phonemize_for_kokoro(x,FakeTokenizer()),m.AI_PHONEMES+'z')
 def test_case_boundaries(self):
  x='rain said OpenAI AIC ai xAI AIx';self.assertEqual(m.phonemize_for_kokoro(x,FakeTokenizer()),'{'+x+'}')
 def test_preserves_source(self):
  x='AI is useful.';self.assertEqual(m.phonemize_for_kokoro(x,FakeTokenizer()),m.AI_PHONEMES+' {is useful.}');self.assertEqual(x,'AI is useful.')
 def test_repeated(self):self.assertEqual(m.phonemize_for_kokoro('AI and AI',FakeTokenizer()),m.AI_PHONEMES+' {and} '+m.AI_PHONEMES)
 def test_non_english(self):
  with self.assertRaises(ValueError):m.phonemize_for_kokoro('AI',FakeTokenizer(),'fr-fr')
 def test_missing_vocab(self):
  t=FakeTokenizer();t.vocab={}
  with self.assertRaises(ValueError):m.phonemize_for_kokoro('AI',t)
if __name__=='__main__':unittest.main()
