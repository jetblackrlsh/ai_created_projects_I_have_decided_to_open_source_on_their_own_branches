import unittest,copy,json
from pathlib import Path
from threat_campaign import validate,run,batch,summarize

class ThreatTests(unittest.TestCase):
 def setUp(self):self.c=json.loads((Path(__file__).resolve().parents[1]/'assets/scenarios/world-threat.json').read_text())
 def test_repeat(self):self.assertEqual(run(self.c,71),run(self.c,71))
 def test_resume(self):
  full=run(self.c,3);partial=run(self.c,3,stop_at=2)
  self.assertEqual(full,run(state=json.loads(json.dumps(partial))))
 def test_no_mutation(self):
  c=copy.deepcopy(self.c);run(self.c,1);self.assertEqual(c,self.c)
 def test_conservation(self):
  for seed in range(10):
   s=run(self.c,seed);self.assertEqual(s['dead']+sum(r['population'] for r in s['regions'])+s['sheltered'],12000)
 def test_zero_scale(self):
  self.c['world']['devastation_scale']=0
  self.assertEqual(run(self.c,42)['dead'],0)
 def test_alert(self):
  self.c['world']['initial_alert']=True
  s=run(self.c,42);self.assertEqual(s['detected_at'],0);self.assertEqual(s['engaged_at'],1)
 def test_batch(self):
  b=batch(self.c,3,7);self.assertEqual([r['seed'] for r in b['results']],[7,104,201])
  self.assertEqual(sum(v['count'] for v in b['aggregate_stats']['outcomes'].values()),3)
 def test_horizon(self):
  self.c['world']['horizon']=1;s=run(self.c,1);self.assertEqual(s['outcome'],'unresolved_at_horizon')
 def test_validation(self):
  for k,v in [('population',-1),('horizon',False),('detection_base',float('nan'))]:
   c=copy.deepcopy(self.c);c['world'][k]=v
   with self.assertRaises(ValueError):validate(c)
 def test_false_mastery(self):
  self.c['fighters'][0]['power_mastery']['Fire']=5
  with self.assertRaises(ValueError):validate(self.c)
 def test_no_hero_control(self):
  self.c['fighters']=[f for f in self.c['fighters'] if f['team']=='threat']
  s=run(self.c,42);self.assertEqual(s['outcome'],'world_population_destroyed');self.assertEqual(s['dead'],12000)
 def test_hero_incapacity_not_death(self):
  s=run(self.c,42);r=summarize(s);self.assertNotIn('dead_heroes',r)
if __name__=='__main__':unittest.main()
