import unittest,json,copy
from pathlib import Path
from threat_campaign import validate,initialize,run
from social_dynamics import persuasion_probability
class CharacterRecruitmentTests(unittest.TestCase):
 def setUp(self):
  self.c=json.loads((Path(__file__).resolve().parents[1]/'assets/scenarios/world-threat.json').read_text())
  for f in self.c['fighters']:
   f.update(persuasiveness=.6,susceptibility=.5,morality=.95,goal_positions={'destroy_population':-1})
  self.c['recruitment']={'mode':'character','proposal':{'objective':'destroy_population','harmfulness':1},'targets':[{'id':'vesper','trust':.15,'devastation_power':'Shadow Blasts'},{'id':'cipher','trust':.1,'devastation_power':'Cybernetics'}]}
 def test_normalization_idempotent(self):self.assertEqual(validate(self.c),validate(validate(self.c)))
 def test_character_trace(self):
  s=initialize(self.c,10101);t=s['recruitment']['trace'][1]
  self.assertEqual(t['goal_alignment'],-1);self.assertEqual(t['susceptibility'],.5);self.assertEqual(t['morality'],.95)
  self.assertEqual(t['acceptance_probability'],persuasion_probability(.6,.5,.95,.15,-1,1))
 def test_resume(self):self.assertEqual(run(self.c,99),run(state=run(self.c,99,stop_at=2)))
 def test_own_stats_matter(self):
  p=initialize(self.c,11)['recruitment']['trace'][1]['acceptance_probability'];c=copy.deepcopy(self.c);c['fighters'][0]['susceptibility']=1
  self.assertGreater(initialize(c,11)['recruitment']['trace'][1]['acceptance_probability'],p)
  c=copy.deepcopy(self.c);c['fighters'][0]['morality']=0
  self.assertGreater(initialize(c,11)['recruitment']['trace'][1]['acceptance_probability'],p)
 def test_no_override(self):
  for field,val in [('goal_alignment',0),('moral_resistance',0)]:
   c=copy.deepcopy(self.c);c['recruitment']['targets'][0][field]=val
   with self.assertRaises(ValueError):validate(c)
 def test_required_stats(self):
  self.c['fighters'][0].pop('morality')
  with self.assertRaises(ValueError):validate(self.c)
 def test_invalid_goal_positions(self):
  self.c['fighters'][0]['goal_positions']['destroy_population']=3
  with self.assertRaises(ValueError):validate(self.c)
if __name__=='__main__':unittest.main()
