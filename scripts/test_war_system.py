import unittest,random,copy,json,tempfile,subprocess,sys
from pathlib import Path
from war_system import init_warfare,tick_warfare,validate_warfare

def scenario():
 return {'world':{'warfare':{'factions':[{'id':'crown','nation':'Italy','army':100},{'id':'rebels','nation':'Italy','army':100}], 'territories':[{'id':'capital','owner':'crown','neighbors':['valley']},{'id':'valley','owner':'rebels','neighbors':['capital']}], 'wars':[{'id':'civil-war','kind':'civil','side_a':'crown','side_b':'rebels','objectives':{'rebels':['capital'],'crown':['valley']}}]}}}
class WarTests(unittest.TestCase):
 def test_opt_in(self):self.assertIsNone(init_warfare(None))
 def test_start_active(self):self.assertEqual(init_warfare(scenario())['wars'][0]['status'],'active')
 def test_validation(self):
  for mutation in [lambda v:v['wars'][0].update(kind='international'),lambda v:v['factions'][0].update(army=float('nan')),lambda v:v['territories'][0].update(owner='missing'),lambda v:v['territories'][0].update(neighbors=[]),lambda v:v['wars'][0].update(objectives={'rebels':['missing']})]:
   v=scenario()['world']['warfare'];mutation(v)
   with self.assertRaises(ValueError):validate_warfare(v)
 def test_capture_and_end(self):
  x=scenario();x['world']['warfare']['factions'][0]['army']=500;s=init_warfare(x)
  for y in range(1,31):tick_warfare(s,{},random.Random(y),y)
  self.assertEqual(s['wars'][0]['winner'],'crown');self.assertTrue(any(e['details'].get('captured') for e in s['history']))
 def test_delayed_and_ceasefire(self):
  x=scenario();w=x['world']['warfare']['wars'][0];w.update(start_year=4,peace_after=1,max_years=2)
  for t in x['world']['warfare']['territories']:t['neighbors']=[]
  s=init_warfare(x);self.assertEqual(tick_warfare(s,{},random.Random(1),1),[])
  tick_warfare(s,{},random.Random(1),5);self.assertEqual(s['wars'][0]['status'],'ended');self.assertIsNone(s['wars'][0]['winner'])
 def test_power_support(self):
  s=init_warfare(scenario());a={1:dict(id=1,age=30,alive=True,faction='crown',powers=['Strength'],power='Strength',energy=100)}
  events=tick_warfare(s,a,random.Random(2),1);self.assertTrue(events[0]['details']['power_support']);self.assertEqual(a[1]['energy'],92)
 def test_powered_champion_not_blocked_by_civilians(self):
  state=init_warfare(scenario());agents={i:dict(id=i,age=30,alive=True,faction='crown',power=None) for i in range(1,17)};agents[17]=dict(id=17,age=30,alive=True,faction='crown',power='Strength',powers=['Strength'])
  events=tick_warfare(state,agents,random.Random(2),1);self.assertEqual(events[0]['details']['power_support'][0]['id'],17)
 def test_bad_id_types(self):
  for mutate in [lambda v:v['wars'][0].update(side_a=[]),lambda v:v['territories'][0].update(owner=[])]:
   v=scenario()['world']['warfare'];mutate(v)
   with self.assertRaises(ValueError):validate_warfare(v)
 def test_disabled_champions(self):
  for flag in ['imprisoned_until','hospitalized_until','quarantined_until','stasis_until','frozen_until','stunned_until','frightened_until','suppressed_until']:
   state=init_warfare(scenario());a={1:dict(id=1,age=30,alive=True,faction='crown',powers=['Strength'],power='Strength',energy=100)};a[1][flag]=1
   events=tick_warfare(state,a,random.Random(2),1);self.assertEqual(events[0]['details']['power_support'],[]);self.assertEqual(a[1]['energy'],100)
 def test_resume_and_idempotence(self):
  s=init_warfare(scenario());r=random.Random(42);tick_warfare(s,{},r,1);saved=copy.deepcopy(s);rs=r.getstate()
  for y in range(2,20):tick_warfare(s,{},r,y)
  r.setstate(rs)
  for y in range(2,20):tick_warfare(saved,{},r,y)
  self.assertEqual(s,saved);self.assertEqual(tick_warfare(s,{},r,19),[])
 def test_all_modes_cli_resume(self):
  root=Path(__file__).parent
  for mode in ['modern','evolution','monarch','wheel']:
   with tempfile.TemporaryDirectory() as d:
    d=Path(d);sc=scenario();sc['settings']={'mode':mode,'years':6,'pop':30,'seed':21};(d/'s.json').write_text(json.dumps(sc))
    base=[sys.executable,str(root/'simulate_world.py'),'--runs','1','--output-report',str(d/'r.md')]
    subprocess.run(base+['--scenario',str(d/'s.json'),'--checkpoint-year','3','--save-state',str(d/'state.json'),'--output-json',str(d/'a.json')],check=True,stdout=subprocess.DEVNULL)
    subprocess.run(base+['--load-state',str(d/'state.json'),'--output-json',str(d/'b.json')],check=True,stdout=subprocess.DEVNULL)
    subprocess.run(base+['--scenario',str(d/'s.json'),'--output-json',str(d/'c.json')],check=True,stdout=subprocess.DEVNULL)
    b=json.loads((d/'b.json').read_text());c=json.loads((d/'c.json').read_text());self.assertEqual(b['featured_world']['warfare'],c['featured_world']['warfare'])
if __name__=='__main__':unittest.main()
