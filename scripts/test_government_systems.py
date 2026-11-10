"""Alternative leadership is real stateful selection, not narrative decoration."""
import copy
import json
import random
import unittest
import simulate_world as engine
import modern_society as modern
from government_systems import select_leadership
from story_setup import validate_scenario


def people():
    return {i:{'id':i,'name':f'Citizen {i}','alive':True,'age':25,
               'power':'Strength' if i==1 else 'Speed','powers':['Strength' if i==1 else 'Speed'],
               'mastery_level':1,'energy':100,'injury':0,'has_phone':True,
               'app_score':60,'reputation':50,'ambition':.5,'compassion':.5,
               'greed':.2,'charisma':.5,'party':'pluralist'} for i in range(1,5)}


def state(system):
    s=modern.society_state();s['leadership_system']=system
    return s

class GovernmentSystemTests(unittest.TestCase):
    def test_rank_tie_incumbent_then_id_and_death(self):
        agents=people();s=state('rank');s['leader_id']=3
        select_leadership(s,agents,random.Random(42),1)
        self.assertEqual(s['leader_id'],3)
        agents[3]['alive']=False
        select_leadership(s,agents,random.Random(42),2)
        self.assertEqual(s['leader_id'],1)
        agents[2]['app_score']=95
        select_leadership(s,agents,random.Random(42),3)
        self.assertEqual(s['leader_id'],2)
    def test_rank_eligibility_and_app_ban(self):
        agents=people();s=state('rank')
        agents[1].update(app_score=100,imprisoned_until=10)
        agents[2].update(app_score=99,has_phone=False)
        agents[3].update(app_score=98,age=17)
        select_leadership(s,agents,random.Random(3),1)
        self.assertEqual(s['leader_id'],4)
        s['laws']['ranking_app']=False
        select_leadership(s,agents,random.Random(3),2)
        self.assertIsNone(s['leader_id'])
    def test_tournament_seeded_pure_agents_and_champion_trace(self):
        agents=people();before=copy.deepcopy(agents)
        s=state('tournament');s['laws']['ranking_app']=False
        first=select_leadership(s,agents,random.Random(73),1)
        duplicate=state('tournament');duplicate['laws']['ranking_app']=False
        second=select_leadership(duplicate,copy.deepcopy(before),random.Random(73),1)
        self.assertEqual(s,duplicate);self.assertEqual(first,second)
        stripped=copy.deepcopy(agents)
        for a in stripped.values():a.pop('government_tournament_wins',None)
        self.assertEqual(stripped,before)
        self.assertEqual(agents[s['leader_id']]['government_tournament_wins'],1)
        from goal_engine import validate_goals,evaluate_goals
        goal=validate_goals([{'type':'win_tournaments'}],engine.POWER_TREE)
        progress=evaluate_goals(goal,agents[s['leader_id']],{'agents':agents,'society':s},1)
        self.assertEqual(progress[0]['state']['status'],'completed')
        self.assertIn(s['leader_id'],agents)
        # Recursively locate a genuine bracket; storage keys are adapter-owned.
        def brackets(node):
            if isinstance(node,dict):
                if 'matches' in node and 'champion_id' in node:yield node
                for value in node.values():yield from brackets(value)
            elif isinstance(node,list):
                for value in node:yield from brackets(value)
        records=list(brackets(s))
        self.assertTrue(records,'Governance must retain a real tournament bracket')
        bracket=records[-1]
        self.assertEqual(str(s['leader_id']),str(bracket['champion_id']))
        self.assertEqual(len(bracket['matches']),3)
        self.assertTrue(all(match['result']['trace'] for match in bracket['matches']))
        for match in bracket['matches']:
            self.assertTrue(match['result']['nonlethal'])
            self.assertLessEqual(match['result']['rounds'],30)
        json.dumps(s,allow_nan=False)
    def test_tournament_ineligible_vacancy_and_sole_accession(self):
        agents=people();s=state('tournament')
        for a in agents.values():a['injury']=.8
        select_leadership(s,agents,random.Random(5),1)
        self.assertIsNone(s['leader_id'])
        agents[2]['injury']=0
        select_leadership(s,agents,random.Random(5),2)
        self.assertEqual(s['leader_id'],2)
        agents[2]['alive']=False
        select_leadership(s,agents,random.Random(5),3)
        self.assertIsNone(s['leader_id'])
    def test_tournament_population_cap_and_offcycle(self):
        base=people()[1]
        agents={i:dict(base,id=i,name=str(i)) for i in range(1,71)}
        s=state('tournament');s['leader_id']=70
        select_leadership(s,agents,random.Random(9),1)
        record=s['government_tournaments'][-1]
        self.assertEqual(len(record['entrant_ids']),64)
        self.assertIn(70,record['entrant_ids'])
        self.assertEqual(len(record['result']['matches']),63)
        before=copy.deepcopy((s,agents))
        select_leadership(s,agents,random.Random(9),2)
        self.assertEqual((s,agents),before)

    def test_old_default_remains_elections(self):
        s=modern.society_state();agents=people();before=copy.deepcopy(s)
        self.assertEqual(s.get('leadership_system','elections'),'elections')
        select_leadership(s,agents,random.Random(1),1)
        self.assertEqual(s.get('leader_id'),before.get('leader_id'))
    def test_world_seeded_resume_for_both_systems(self):
        for system in ('rank','tournament'):
            with self.subTest(system=system):
                cfg=validate_scenario({'world':{'society':{'leadership_system':system}},'characters':[{'key':'main','age':24,'powers':['Immortal'],'main_character':True,'goals':[{'type':'become_leader'}]}]},engine.POWER_TREE)
                def run(years,checkpoint=None):
                    return modern.run_modern(144,years,12,.5,.1,engine.POWER_TREE,engine.pick_power_mutation,scenario=cfg if checkpoint is None else None,resume_state=checkpoint)
                full=run(9);partial=run(3)
                resumed=run(9,json.loads(json.dumps(partial['_state'])))
                self.assertEqual(json.loads(json.dumps(full)),json.loads(json.dumps(resumed)))
                self.assertFalse(full['democracy_survived'])
                if full['final_population']:
                    self.assertEqual(full['society_outcome'],system+'_government')
                    self.assertEqual(full['government']['regime'],system+'_rule')

if __name__=='__main__':unittest.main()
