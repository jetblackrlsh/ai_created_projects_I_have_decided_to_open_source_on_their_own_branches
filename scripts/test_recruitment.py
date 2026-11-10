import copy, json, unittest, hashlib
from pathlib import Path
from unittest.mock import patch
from recruitment import validate_recruitment, acceptance_probability
from threat_campaign import initialize, run, summarize

class FixedRng:
 def __init__(self,x):self.x=x
 def random(self):return self.x

class RecruitmentTests(unittest.TestCase):
 def setUp(self):
  self.c=json.loads((Path(__file__).resolve().parents[1]/'assets/scenarios/world-threat.json').read_text())
  self.c['recruitment']={'persuasion':.6,'targets':[
   {'id':'vesper','trust':.15,'goal_alignment':0,'moral_resistance':.95,'devastation_power':'Shadow Blasts'},
   {'id':'cipher','trust':.1,'goal_alignment':0,'moral_resistance':.95,'devastation_power':'Cybernetics'}]}
 def forced(self, rolls):
  with patch('recruitment._rng',side_effect=lambda seed,label,aid:FixedRng(rolls[aid])):return initialize(self.c,9)
 def test_v45_baseline_fingerprint(self):
  c=copy.deepcopy(self.c);c.pop('recruitment');s=run(c,10101);s.pop('engine_version')
  digest=hashlib.sha256(json.dumps(s,sort_keys=True,separators=(',',':')).encode()).hexdigest()
  self.assertEqual(digest,'9de8a4b7cb1d56fe3fc782edaa942b6b0eb7d9065de4c6af4b7520b522a678cd')
 def test_both_accept(self):
  s=self.forced({'cipher':0,'vesper':0});self.assertEqual(len(s['recruitment']['accepted_ids']),2)
  s=run(state=s);self.assertEqual(s['outcome'],'world_population_destroyed')
  contributions={e['actor_id'] for t in s['trace'] for e in t['events'] if e['event']=='devastation'}
  self.assertEqual(contributions,{'thunderfall','cipher','vesper'})
 def test_both_refuse_alert(self):
  s=self.forced({'cipher':1,'vesper':1});self.assertEqual(s['recruitment']['accepted_ids'],[]);self.assertEqual(s['detected_at'],0)
 def test_one_accept_fights_other_hero(self):
  s=self.forced({'cipher':0,'vesper':1});s=run(state=s)
  actions=[a for t in s['trace'] for a in t['combat_actions'] if a['actor_id']=='cipher' and a['action']=='attack']
  self.assertTrue(actions);self.assertTrue(all(a['target_id']=='vesper' for a in actions))
  self.assertEqual(summarize(s)['recruited_ids'],['cipher'])
 def test_coalition_survives_original_incapacity(self):
  s=self.forced({'cipher':0,'vesper':0})
  next(f for f in s['combat']['fighters'] if f['id']=='thunderfall')['vigor']=0
  s=run(state=s,stop_at=1);self.assertIsNone(s['outcome']);self.assertGreater(s['dead'],0)
  self.assertTrue(summarize(s)['original_threat_incapacitated'])
 def test_resume_no_reroll(self):
  s=self.forced({'cipher':0,'vesper':1});whole=run(state=s);part=run(state=s,stop_at=1)
  self.assertEqual(whole,run(state=json.loads(json.dumps(part))))
 def test_refusal_control(self):
  self.c['recruitment']['mode']='refusal_control'
  s=self.forced({'cipher':0,'vesper':0});self.assertEqual(s['recruitment']['accepted_ids'],[])
  self.assertTrue(all(t['acceptance_probability']==0 for t in s['recruitment']['trace']))
 def test_odds_and_resistance(self):
  t=self.c['recruitment']['targets'][0];self.assertLess(acceptance_probability(.6,t),.02)
  neutral=dict(t,moral_resistance=0);self.assertGreater(acceptance_probability(.6,neutral),acceptance_probability(.6,t))
 def test_invalid_targets(self):
  for key,value in [('moral_resistance',2),('id','thunderfall'),('devastation_power','Fire')]:
   c=copy.deepcopy(self.c['recruitment']);c['targets'][0][key]=value
   with self.assertRaises(ValueError):validate_recruitment(c,self.c['fighters'])
 def test_repeated_target_rejected(self):
  c=copy.deepcopy(self.c['recruitment']);c['targets'].append(c['targets'][0])
  with self.assertRaises(ValueError):validate_recruitment(c,self.c['fighters'])
 def test_original_identity_preserved(self):
  s=self.forced({'cipher':0,'vesper':0});self.assertEqual(s['config']['fighters'][0]['team'],'heroes')
  self.assertEqual(s['recruitment']['original_teams']['cipher'],'heroes')

if __name__=='__main__':unittest.main()
