import unittest,tempfile,json
from pathlib import Path
from engine import *
class TestEngine(unittest.TestCase):
 def setUp(self):
  self.s=new_campaign('demo','Demo');self.c=dict(id='check-1',scene_id='scene-1',action='I catch the falling pilot. "Hold on!"',dc=18,modifiers={'agility':3,'rope':2},success='Pilot safe',failure='Pilot stranded lower down',partial='Pilot safe, rope lost',partial_margin=3,natural_override=True)
 def test_choice(self): self.assertEqual(action('Climb','I use a rope',['Climb','Custom action'])['extra_text'],'I use a rope')
 def test_empty_custom(self):
  with self.assertRaises(ValueError): action('Custom action',' ',['Custom action'])
 def test_roll(self): self.assertEqual(outcome(self.c,5)['outcome'],'failure');self.assertEqual(outcome(self.c,5)['total'],10)
 def test_partial(self): self.assertEqual(outcome(self.c,10)['outcome'],'partial')
 def test_naturals(self): self.assertEqual(outcome(self.c,1)['outcome'],'failure');self.assertEqual(outcome(self.c,20)['outcome'],'success')
 def test_bad_roll(self):
  for x in [True,0,21,1.5,'20']:
   with self.assertRaises(ValueError): outcome(self.c,x)
 def test_resolve_exactly_once(self):
  s=declare(self.s,self.c);r={'campaign_id':'demo','scene_id':'scene-1','check_id':'check-1','raw_d20':5,'outcome':'success','dc':1}
  n=resolve(s,r,'The pilot lands on a lower ledge.');self.assertEqual(n['chronicle'][0]['roll']['outcome'],'failure')
  with self.assertRaises(ValueError):resolve(n,r,'Again')
 def test_wrong_id(self):
  with self.assertRaises(ValueError): resolve(declare(self.s,self.c),dict(campaign_id='other',check_id='check-1',scene_id='scene-1',raw_d20=5),'Bad')
 def test_pause_resume(self):
  s=declare(self.s,self.c);s['world_clocks']=[{'name':'collapse','remaining':8}]
  r=json.loads(json.dumps(s));self.assertEqual(r['world_clocks'][0]['remaining'],8);self.assertEqual(r['pending_check'],self.c)
 def test_save(self):
  with tempfile.TemporaryDirectory() as d:
   path=Path(d)/'campaign.json';n=save(path,self.s);n=save(path,n,0);self.assertEqual(n['revision'],1)
   with self.assertRaises(ValueError):save(path,n,0)
 def test_export(self):
  s=resolve(declare(self.s,self.c),dict(campaign_id='demo',scene_id='scene-1',check_id='check-1',raw_d20=5),'A ledge catches them.')
  text=export_log(s,'Paused.');self.assertIn(self.c['action'],text);self.assertLess(text.index('Turn 1'),text.index('Session summary'))
 def test_no_second_pending(self):
  with self.assertRaises(ValueError):declare(declare(self.s,self.c),self.c)
if __name__=='__main__':unittest.main()
