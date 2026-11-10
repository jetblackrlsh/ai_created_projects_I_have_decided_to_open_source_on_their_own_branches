import unittest,copy,json
from social_dynamics import *

class SocialTests(unittest.TestCase):
 def setUp(self):
  self.agents={1:{'id':1,'name':'Ada','age':30,'alive':True,'charisma':.8,'compassion':.8,'energy':100,'role':'hero'},2:{'id':2,'name':'Bea','age':30,'alive':True,'charisma':.6,'compassion':.9,'energy':100,'role':'hero'}}
  self.story={'goals':{'1':[{'type':'protect_character','target_id':3}], '2':[{'type':'protect_character','target_id':3}]}}
 def init(self):return init_social_dynamics(self.story,self.agents,{'encounter_rate':1},19)
 def test_declared_relationship_exists_at_year_zero(self):
  self.agents[1]['ally_ids']=[2];state=self.init()
  self.assertEqual(state['pairs']['1|2']['status'],'allied')
 def test_dead_pairs_release_capacity(self):
  state=init_social_dynamics(self.story,self.agents,{'max_pairs':1,'encounter_rate':1},19)
  tick_social_dynamics(self.story,self.agents,1);self.agents[2]['alive']=False
  self.agents[3]={'id':3,'name':'Cee','age':30,'alive':True,'energy':100}
  tick_social_dynamics(self.story,self.agents,2)
  self.assertNotIn('1|2',state['pairs']);self.assertIn('1|3',state['pairs'])
 def test_failed_proposals_recorded(self):
  state=self.init()
  for y in range(1,6):tick_social_dynamics(self.story,self.agents,y)
  attempts=[e for e in state['history'] if e['kind']=='alliance_proposal']
  self.assertTrue(attempts)
  for e in attempts:self.assertEqual(e['details']['accepted'],e['details']['roll']<e['details']['probability'])
 def test_disabled_noop(self):
  a=copy.deepcopy(self.agents);s=copy.deepcopy(self.story)
  self.assertIsNone(init_social_dynamics(self.story,self.agents,None,19));self.assertEqual(tick_social_dynamics(self.story,self.agents,1),[])
  self.assertEqual(a,self.agents);self.assertEqual(s,self.story)
 def test_own_stats_default_and_override(self):
  self.agents[1]['morality']=.2;self.init();self.assertEqual(self.agents[1]['morality'],.2);self.assertEqual(self.agents[2]['morality'],.9);self.assertEqual(self.agents[1]['susceptibility'],.5)
 def test_shared_goals_create_alliance_and_actual_aid(self):
  state=self.init()
  for y in range(1,25):tick_social_dynamics(self.story,self.agents,y)
  pair=state['pairs']['1|2'];self.assertEqual(pair['status'],'allied');self.assertIn(2,self.agents[1]['ally_ids']);self.assertGreater(pair['cooperation_count'],0)
  self.assertLess(sum(a['energy'] for a in self.agents.values()),200);self.assertGreater(sum(a.get('knowledge_points',0) for a in self.agents.values()),0)
 def test_goal_opposition_breaks_alliance(self):
  self.agents[1]['ally_ids']=[2];self.agents[2]['ally_ids']=[1];state=self.init()
  self.story['goals']={'1':[{'type':'defeat_character','target_id':2}]}
  for y in range(1,15):tick_social_dynamics(self.story,self.agents,y)
  self.assertEqual(state['pairs']['1|2']['status'],'conflict');self.assertIn(2,self.agents[1]['enemy_ids']);self.assertNotIn(2,self.agents[1]['ally_ids'])
 def test_conflict_resolution_when_goals_change(self):
  self.agents[1]['enemy_ids']=[2];self.agents[2]['enemy_ids']=[1];state=self.init()
  for y in range(1,50):tick_social_dynamics(self.story,self.agents,y)
  self.assertGreater(state['pairs']['1|2']['resolution_count'],0);self.assertNotIn(2,self.agents[1]['enemy_ids'])
 def test_opposed_goals_block_resolution(self):
  self.agents[1]['enemy_ids']=[2];self.agents[2]['enemy_ids']=[1];self.story['goals']={'1':[{'type':'defeat_character','target_id':2}]};state=self.init()
  for y in range(1,50):tick_social_dynamics(self.story,self.agents,y)
  self.assertEqual(state['pairs']['1|2']['resolution_count'],0)
 def test_stats_actual_probability_effect(self):
  base=persuasion_probability(.5,.5,.8,.4,.4,1)
  self.assertGreater(persuasion_probability(.9,.5,.8,.4,.4,1),base)
  self.assertGreater(persuasion_probability(.5,.9,.8,.4,.4,1),base)
  self.assertGreater(persuasion_probability(.5,.5,.1,.4,.4,1),base)
 def test_idempotency_and_resume(self):
  self.init()
  for y in range(1,5):tick_social_dynamics(self.story,self.agents,y)
  a=copy.deepcopy(self.agents);s=copy.deepcopy(self.story);self.assertEqual(tick_social_dynamics(self.story,self.agents,4),[]);self.assertEqual(a,self.agents)
  s2=json.loads(json.dumps(s));a2=json.loads(json.dumps(a))
  for y in range(5,20):self.assertEqual(tick_social_dynamics(s,a,y),tick_social_dynamics(s2,a2,y))
  self.assertEqual(s,s2)
 def test_bounded_and_malformed(self):
  with self.assertRaises(ValueError):validate_social_dynamics({'max_pairs':True})
  with self.assertRaises(ValueError):persuasion_probability(.5,float('nan'),.5,.5,0,0)
  state=init_social_dynamics(self.story,self.agents,{'history_limit':2,'encounter_rate':1},19)
  for y in range(1,25):tick_social_dynamics(self.story,self.agents,y)
  self.assertLessEqual(len(state['history']),2)
 def test_goal_target_opportunity(self):
  self.story['goals']={'1':[{'type':'form_alliance','target_id':2}]};state=self.init()
  for y in range(1,30):tick_social_dynamics(self.story,self.agents,y)
  self.assertGreater(state['pairs']['1|2']['alliance_count'],0)
 def test_completed_goal_not_active(self):
  self.story['goals']={'1':[{'type':'defeat_character','target_id':2,'state':{'status':'completed'}}]}
  self.assertEqual(goal_relation(self.story,self.agents[1],self.agents[2]),(0,[]))

if __name__=='__main__':unittest.main()
