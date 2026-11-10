import copy,json,unittest
from unittest.mock import patch
from threat_combat import create_state,step_round
from tactical_social import *

class Rng:
 def __init__(self,roll):self.roll=roll
 def random(self):return self.roll

class TacticalSocialTests(unittest.TestCase):
 def setUp(self):
  self.combat=create_state([{'id':'bad','team':'threat','powers':['Strength']},{'id':'good','team':'heroes','powers':['Shadow Blasts']},{'id':'ally','team':'heroes','powers':['Flight']}])
  for f in self.combat['fighters']:
   f.update(persuasiveness=.6,susceptibility=.5,morality=.1 if f['team']=='threat' else .95,goal_positions={'destruction':1 if f['team']=='threat' else -1})
  self.config={'offer_rate':1,'cooperate_rate':0,'team_objectives':{'heroes':{'objective':'destruction','stance':-1,'harmfulness':0},'threat':{'objective':'destruction','stance':1,'harmfulness':1}}}
  self.state=init_tactical_social(self.config,self.combat,77)
 def resolve(self,actor,target,roll=0,turn=1):
  intent={'actor_id':actor,'target_id':target,'team':next(f['team'] for f in self.combat['fighters'] if f['id']==actor),'action':'social_offer'}
  with patch('tactical_social._rng',return_value=Rng(roll)):
   return resolve_tactical_social(self.state,self.combat,turn,[{'actor_id':actor,'action':'social_offer'}],[intent])
 def test_acceptance_switches_preserves_identity(self):
  f=next(f for f in self.combat['fighters'] if f['id']=='good');before=copy.deepcopy(f)
  events=self.resolve('bad','good')
  self.assertEqual(f['team'],'threat')
  for key in ('powers','goal_positions','morality','power_levels'):self.assertEqual(f[key],before[key])
  self.assertTrue(any(e['event']=='social_alliance_broken' for e in events))
 def test_reject_is_not_team_change(self):
  self.resolve('bad','good',1);self.assertEqual(next(f['team'] for f in self.combat['fighters'] if f['id']=='good'),'heroes')
 def test_budget_includes_prelude(self):
  prelude={'original_teams':{'bad':'threat','good':'heroes','ally':'heroes'},'trace':[{'target_id':'good','trust':.1}]}
  self.state=init_tactical_social(self.config,self.combat,77,prelude)
  self.assertEqual(self.resolve('bad','good'),[])
 def test_cannot_persuade_after_incapacity(self):
  next(f for f in self.combat['fighters'] if f['id']=='bad')['vigor']=0
  self.assertEqual(self.resolve('bad','good'),[])
 def test_failed_action_cannot_persuade(self):
  ev=resolve_tactical_social(self.state,self.combat,1,[{'actor_id':'bad','action':'stunned'}],[{'actor_id':'bad','target_id':'good','team':'threat','action':'social_offer'}])
  self.assertEqual(ev,[]);self.assertEqual(self.state['offer_counts'],{})
 def test_bounded_one_per_team(self):
  skip,intents=plan_tactical_social(self.state,self.combat,1)
  self.assertLessEqual(len(intents),2);self.assertEqual(len({i['team'] for i in intents}),len(intents))
 def test_no_unengaged_social(self):self.assertEqual(plan_tactical_social(self.state,self.combat,1,False),({},[]))
 def test_real_costed_cooperation(self):
  good=next(f for f in self.combat['fighters'] if f['id']=='good');ally=next(f for f in self.combat['fighters'] if f['id']=='ally')
  intents=[{'actor_id':'good','target_id':'ally','team':'heroes','action':'social_cooperate'}]
  ev=resolve_tactical_social(self.state,self.combat,1,[{'actor_id':'good','action':'social_cooperate'}],intents)
  self.assertEqual(good['energy'],95);self.assertEqual(ally['guard'],5);self.assertEqual(ev[0]['event'],'social_cooperation')
 def test_attack_and_devastation_change_trust(self):
  rel=self.state['relationships'][pair_key('good','bad')];before=rel['trust']
  observe_tactical_social(self.state,self.combat,1,[{'actor_id':'bad','target_id':'good','action':'attack','hit':True}],[{'event':'devastation','actor_id':'bad','people_killed':100}])
  self.assertLess(rel['trust'],before)
 def test_no_new_fighters(self):
  self.resolve('bad','good');self.assertEqual(len(self.combat['fighters']),3)
 def test_repeat_no_duplicate_cost(self):
  self.resolve('bad','good',1);before=copy.deepcopy(self.combat);self.assertEqual(self.resolve('bad','good',1),[]);self.assertEqual(before,self.combat)
 def test_return_to_heroes_possible(self):
  self.resolve('bad','good');self.resolve('ally','good',turn=2)
  self.assertEqual(next(f['team'] for f in self.combat['fighters'] if f['id']=='good'),'heroes')
 def test_seeded_plan_json_resume(self):
  a=plan_tactical_social(self.state,self.combat,1);s=json.loads(json.dumps(self.state));b=plan_tactical_social(s,self.combat,1);self.assertEqual(a,b)
 def test_validate(self):
  with self.assertRaises(ValueError):validate_tactical_social(dict(self.config,offer_rate=float('nan')))
  with self.assertRaises(ValueError):validate_tactical_social(dict(self.config,max_offers_per_pair=4))

if __name__=='__main__':unittest.main()
