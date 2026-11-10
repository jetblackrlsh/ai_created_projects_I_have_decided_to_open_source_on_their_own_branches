import copy,json,random,unittest
import simulate_world as engine
from modern_society import run_modern
from story_setup import validate_scenario,init_story
from power_effects import WorldPowers,expire_world_modifiers
from power_mastery import level_for,award_use

class StatWorldTests(unittest.TestCase):
 def ability(self,path='charisma',value=.25,scope='self',**kw):
  return dict(id='pulse',scope=scope,energy_cost=10,cooldown=3,effect=dict(path=path,operation='add',value=value,duration=2),**kw)
 def agents(self):
  return {1:{'id':1,'name':'A','alive':True,'age':25,'role':'hero','power':None,'powers':[],'charisma':.4,'energy':50,'location':'Town'},2:{'id':2,'name':'B','alive':True,'age':25,'role':'hero','power':None,'powers':[],'charisma':.3,'energy':50,'location':'Town'},3:{'id':3,'name':'C','alive':True,'age':25,'role':'citizen','power':None,'powers':[],'charisma':.2,'energy':50,'location':'Elsewhere'}}
 def test_unpowered_configured_stat_action_and_expiry(self):
  a=self.agents();a[1]['stat_powers']=[self.ability()];p=WorldPowers(a,random.Random(1));p.year=1
  self.assertTrue(p.activate(a[1]));self.assertAlmostEqual(a[1]['charisma'],.65);self.assertEqual(a[1]['energy'],40)
  self.assertFalse(p.activate(a[1]));a[1]['charisma']+=.1
  expire_world_modifiers(a,2);self.assertAlmostEqual(a[1]['charisma'],.75)
  expire_world_modifiers(a,3);self.assertAlmostEqual(a[1]['charisma'],.5)
 def test_local_effect_and_other_target(self):
  a=self.agents();a[1]['stat_powers']=[self.ability(scope='local')];p=WorldPowers(a,random.Random(1));p.year=1;p.activate(a[1])
  self.assertAlmostEqual(a[1]['charisma'],.65);self.assertAlmostEqual(a[2]['charisma'],.55);self.assertEqual(a[3]['charisma'],.2)
 def test_ineligible_does_not_cast(self):
  for status in ['suppressed_until','stunned_until','frozen_until','imprisoned_until']:
   a=self.agents();a[1]['stat_powers']=[self.ability()];a[1][status]=3;p=WorldPowers(a,random.Random(1));p.year=1
   self.assertFalse(p.activate(a[1]));self.assertEqual(a[1]['energy'],50)
 def scenario(self):
  return validate_scenario({'characters':[{'key':'a','age':25,'persuasiveness':.5,'main_character':True,'stat_powers':[self.ability('persuasiveness',.3)]},{'key':'b','age':25,'powers':['Healing'],'stat_powers':[self.ability('power_mastery.Healing.xp',20)]}], 'world':{'social_dynamics':{}},'encounters':{'enabled':False}},engine.POWER_TREE)
 def runworld(self,mode,years,state=None):
  cfg=None if state else self.scenario()
  if mode=='modern':return run_modern(819,years,8,.1,.01,engine.POWER_TREE,engine.pick_power_mutation,resume_state=state,scenario=cfg)
  return engine.run_single_world_evolution_or_monarch_or_wheel(mode,819,years,8,.1,.01,resume_state=state,scenario=cfg,total_years=12)
 def test_resume_and_live_actions_all_modes(self):
  for mode in ['modern','evolution','monarch','wheel']:
   with self.subTest(mode=mode):
    full=self.runworld(mode,9);self.assertGreater(full['power_usage'].get('Stat Manipulation',0),0)
    for stop in [0,3,8]:
     part=self.runworld(mode,stop);resumed=self.runworld(mode,9,json.loads(json.dumps(part['_state'])))
     self.assertEqual(json.loads(json.dumps(full)),json.loads(json.dumps(resumed)))
 def test_rejects_nonannual_and_unused_social_paths(self):
  for path in ['vigor','resolve','guard','combat_stats.damage','power_levels.Healing','persuasiveness','susceptibility','morality']:
   with self.subTest(path=path),self.assertRaises(ValueError):
    validate_scenario({'characters':[{'key':'a','stat_powers':[self.ability(path)]}]},engine.POWER_TREE)
 def test_named_target_reference_resolved(self):
  c=validate_scenario({'characters':[{'key':'a','stat_powers':[self.ability(scope='other',target_id='b')]},{'key':'b'}]},engine.POWER_TREE)
  a=self.agents();init_story(a,c);self.assertEqual(a[1]['stat_powers'][0]['target_id'],'2')
 def test_income_affects_pay_and_expiry_preserves_wage(self):
  from modern_society import employment,society_state
  from stat_modifiers import apply_modifier
  base=self.runworld('modern',0)['_state']['agents'];boosted=copy.deepcopy(base)
  for a in base.values():a['wealth']=100
  for a in boosted.values():a['wealth']=100
  effect={'path':'income','operation':'add','value':20,'duration':2}
  apply_modifier(boosted[1],effect,1,'1','wage')
  for year in [1,2,3]:
   expire_world_modifiers(boosted,year)
   st=society_state();st['year']=year
   employment(copy.deepcopy(st),base,random.Random(91))
   employment(copy.deepcopy(st),boosted,random.Random(91))
   self.assertEqual(base[1]['job'],boosted[1]['job'])
   self.assertEqual(boosted[1]['income']-base[1]['income'],20 if year<3 else 0)
  self.assertEqual(boosted[1]['wealth']-base[1]['wealth'],40)
 def test_xp_expiry_preserves_real_practice(self):
  a=self.agents();a[1].update(power='Healing',powers=['Healing'],stat_powers=[self.ability('power_mastery.Healing.xp',20)])
  p=WorldPowers(a,random.Random(1));p.year=1;p.activate(a[1]);self.assertEqual(level_for(a[1],'Healing'),2)
  award_use(a[1],'Healing',2);expire_world_modifiers(a,3)
  self.assertEqual(a[1]['power_mastery']['Healing']['xp'],1);self.assertEqual(level_for(a[1],'Healing'),0)

if __name__=='__main__':unittest.main()
