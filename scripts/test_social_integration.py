import copy,json,random,unittest
import simulate_world as engine
from modern_society import run_modern
from story_setup import validate_scenario,init_story,tick_story,prepare_story
from goal_engine import validate_goals,evaluate_goals,resolve_goals

class SocialIntegrationTests(unittest.TestCase):
 def scenario(self):
  return validate_scenario({'characters':[
   {'key':'a','name':'Ada','age':25,'persuasiveness':.9,'susceptibility':.4,'morality':.8,'main_character':True,'goals':[{'type':'form_alliance','target':'b'},{'type':'cooperate','count':2}]},
   {'key':'b','name':'Bo','age':25,'persuasiveness':.6,'susceptibility':.7,'morality':.8,'main_character':True,'goals':[{'type':'resolve_conflict','target':'a'}]}],
   'encounters':{'enabled':False},'world':{'social_dynamics':{}}},engine.POWER_TREE)
 def world(self,mode,years,state=None):
  cfg=None if state else self.scenario()
  if mode=='modern':return run_modern(713,years,10,.1,.01,engine.POWER_TREE,engine.pick_power_mutation,resume_state=state,scenario=cfg)
  return engine.run_single_world_evolution_or_monarch_or_wheel(mode,713,years,10,.1,.01,resume_state=state,scenario=cfg,total_years=15)
 def test_stats_validated(self):
  for key in ('persuasiveness','susceptibility','morality'):
   for bad in (-.1,1.1,True,float('nan')):
    with self.subTest(key=key,bad=bad),self.assertRaises(ValueError):validate_scenario({'characters':[{'key':'a',key:bad}]},engine.POWER_TREE)
 def test_stats_stored_and_tracked(self):
  out=self.world('modern',0)
  a=out['_state']['agents'][1]
  self.assertEqual(a['persuasiveness'],.9)
  self.assertEqual(a['susceptibility'],.4)
  self.assertEqual(a['morality'],.8)
  self.assertEqual(out['story']['main_characters']['1']['timeline'][0]['persuasiveness'],.9)
 def test_resume_all_modes(self):
  for mode in ['modern','evolution','monarch','wheel']:
   with self.subTest(mode=mode):
    full=self.world(mode,8)
    for stop in [0,3,7]:
     part=self.world(mode,stop);resumed=self.world(mode,8,json.loads(json.dumps(part['_state'])))
     self.assertEqual(json.loads(json.dumps(full)),json.loads(json.dumps(resumed)))
 def test_social_goal_measurements(self):
  agents={1:{'id':1,'alive':True},2:{'id':2,'alive':True}}
  goals=resolve_goals(validate_goals([{'type':'form_alliance','target':2},{'type':'resolve_conflict','target':2},{'type':'cooperate','count':2}],engine.POWER_TREE),{},agents)
  ctx={'agents':agents,'story':{'social_dynamics':{'pairs':{'1:2':{'a':1,'b':2,'status':'allied','resolution_count':1}},'agent_stats':{'1':{'cooperations':2}}}}}
  self.assertTrue(all(g['state']['status']=='completed' for g in evaluate_goals(goals,agents[1],ctx,1)))
  blocked=evaluate_goals(goals,agents[1],{'agents':agents},1)
  self.assertTrue(all(g['state']['status']=='blocked' for g in blocked))
 def test_no_social_legacy_field_absent(self):
  cfg=validate_scenario({'characters':[{'key':'a','main_character':True}]},engine.POWER_TREE)
  a={1:{'id':1,'name':'A','age':25,'alive':True}}
  story=init_story(a,cfg)
  self.assertNotIn('social_dynamics',story)
  self.assertNotIn('persuasiveness',a[1])

if __name__=='__main__':unittest.main()
