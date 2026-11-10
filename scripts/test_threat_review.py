import unittest, json
from unittest.mock import patch
from pathlib import Path
from threat_campaign import initialize, run, summarize

class ReviewTests(unittest.TestCase):
 def setUp(self): self.c=json.loads((Path(__file__).resolve().parents[1]/'assets/scenarios/world-threat.json').read_text())
 def test_stunned_threat_cannot_devastate(self):
  self.c['fighters']=[f for f in self.c['fighters'] if f['team']=='threat']
  s=initialize(self.c,22);s['combat']['fighters'][0]['statuses']['stunned']=2
  s=run(state=s,stop_at=2)
  self.assertEqual(s['dead'],0)
  self.assertFalse(any(e['event']=='devastation' for t in s['trace'] for e in t['events']))
 def test_suppressed_threat_cannot_devastate(self):
  self.c['fighters']=[f for f in self.c['fighters'] if f['team']=='threat']
  s=initialize(self.c,22);s['combat']['fighters'][0]['statuses']['suppressed']=2
  s=run(state=s,stop_at=2);self.assertEqual(s['dead'],0)
 def test_roster_order_does_not_change_outcome(self):
  a=run(self.c,19);self.c['fighters'].reverse();b=run(self.c,19)
  self.assertEqual(summarize(a),summarize(b));self.assertEqual(a['trace'],b['trace'])
 def test_empty_energy_regenerates_in_control(self):
  self.c['fighters']=[f for f in self.c['fighters'] if f['team']=='threat']
  self.c['fighters'][0]['energy']=0
  s=run(self.c,12);self.assertGreater(s['dead'],0)
 def rescue_setup(self):
  self.c['world']['initial_alert']=True;self.c['rules']['travel_steps']=0;self.c['rules']['rescue_chance']=1
  s=initialize(self.c,22);s['dead']=1;s['regions'][0]['population']-=1
  return s
 def test_suppression_blocks_rescue(self):
  s=self.rescue_setup();h=next(f for f in s['combat']['fighters'] if f['id']=='cipher');h['statuses']['suppressed']=2
  s=run(state=s,stop_at=1)
  self.assertEqual(s['sheltered'],0)
 def test_incapacitated_rescuer_cannot_rescue(self):
  s=self.rescue_setup()
  def mocked_round(state,seed,turn,skip_actions):
   self.assertEqual(skip_actions['cipher'],'evacuation')
   next(f for f in state['fighters'] if f['id']=='cipher')['vigor']=0
   state['last_round']=turn
   return [{'actor_id':'cipher','action':'evacuation'}]
  with patch('threat_campaign.step_round',side_effect=mocked_round):s=run(state=s,stop_at=1)
  self.assertEqual(s['sheltered'],0)
 def test_terminal_resume_is_stable(self):
  s=run(self.c,15);self.assertEqual(s,run(state=s))

if __name__=='__main__':unittest.main()
