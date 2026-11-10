import unittest,copy,json
from pathlib import Path
from unittest.mock import patch
from threat_campaign import run,validate,batch,initialize
class Zero:
 def random(self):return 0
class TacticalCampaignTests(unittest.TestCase):
 def setUp(self):
  self.c=json.loads((Path(__file__).resolve().parents[1]/'assets/scenarios/character-recruitment.json').read_text());self.c.pop('recruitment')
  self.c['world']['initial_alert']=True;self.c['rules'].update(fight_priority=1,rescue_chance=0,travel_steps=0)
  self.c['tactical_social']={'offer_rate':1,'cooperate_rate':0,'team_objectives':{'heroes':{'objective':'destroy_population','stance':-1,'harmfulness':0},'threat':{'objective':'destroy_population','stance':1,'harmfulness':1}},'devastation_powers':{'thunderfall':'Strength','vesper':'Shadow Blasts','cipher':'Cybernetics'}}
 def test_resume(self):
  self.assertEqual(run(self.c,42),run(state=json.loads(json.dumps(run(self.c,42,stop_at=2)))))
 def test_refusal_budget(self):
  s=run(self.c,42)
  self.assertTrue(all(n<=1 for n in s['tactical_social']['offer_counts'].values()))
  for t in s['trace']:
   for e in t['events']:
    if e.get('event') in ('social_offer','social_cooperation'):self.assertTrue(any(a['actor_id']==e['actor_id'] and a['action'] in ('social_offer','social_cooperate') for a in t['combat_actions']))
 def test_population(self):
  for seed in range(10):
   s=run(self.c,seed)
   self.assertTrue(all(t['survivors']+t['dead']==12000 for t in s['trace']))
 def test_renunciation(self):
  import tactical_social
  actual=tactical_social._rng
  def rig(seed,label,*args):return Zero() if label=='social_acceptance' else actual(seed,label,*args)
  with patch('tactical_social._rng',side_effect=rig):s=run(self.c,1)
  self.assertEqual(s['outcome'],'threat_renounced');self.assertTrue(any(f['id']=='thunderfall' and f['team']=='heroes' and f['vigor']>0 for f in s['combat']['fighters']))
 def test_defector_cannot_complete_deferred_rescue(self):
  import tactical_social
  self.c['fighters']=[f for f in self.c['fighters'] if f['id']!='vesper'];self.c['tactical_social']['devastation_powers'].pop('vesper');self.c['rules']['rescue_chance']=1
  state=initialize(self.c,5);state['dead']=1;state['regions'][0]['population']-=1
  actual=tactical_social._rng
  def rig(seed,label,*args):return Zero() if label=='social_acceptance' else actual(seed,label,*args)
  with patch('tactical_social._rng',side_effect=rig):result=run(state=state,stop_at=1)
  self.assertEqual(next(f for f in result['combat']['fighters'] if f['id']=='cipher')['team'],'threat')
  self.assertFalse(any(e['event']=='evacuation' for e in result['trace'][0]['events']))
 def test_map_required(self):
  self.c['tactical_social']['devastation_powers'].pop('cipher')
  with self.assertRaises(ValueError):validate(self.c)
 def test_summary_outcomes(self):self.assertIn('threat_renounced',batch(self.c,1)['aggregate_stats']['outcomes'])
if __name__=='__main__':unittest.main()
