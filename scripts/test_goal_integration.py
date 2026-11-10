"""Goal intentions must affect real hooks without directly awarding successes."""
import json
from pathlib import Path
import random
import unittest
from goal_engine import evaluate_goals,validate_goals
from story_setup import init_story,validate_scenario,prepare_story,tick_story
from simulate_world import POWER_TREE
from test_story_setup import agents,Always
from test_power_effects import fixture

class GoalIntegrationTests(unittest.TestCase):
    def test_untargeted_goal_creates_real_encounter(self):
        people=agents()
        cfg=validate_scenario({'characters':[{'key':'challenger','powers':['Strength'],'main_character':True,'goals':[{'type':'win_duels'}]}]},POWER_TREE)
        story=init_story(people,cfg)
        prepare_story(story,people,1)
        self.assertTrue(story['rivalries'])
        self.assertEqual(story['goals']['1'][0]['state']['progress'],0)
        tick_story(story,people,Always(7),1)
        self.assertTrue(story['encounters'])
        actual=story['encounters'][0]['result']['winner_id']=='1'
        self.assertEqual(story['goals']['1'][0]['state']['progress'],int(actual))
        self.assertFalse(story['encounters'][0]['committed'])
    def test_healing_counter_requires_real_paid_treatment(self):
        world=fixture('Healing');healer=world.agents[1]
        goals=validate_goals([{'type':'treat_injuries'}],POWER_TREE)
        context={'agents':world.agents,'story':{}}
        before=evaluate_goals(goals,healer,context,10)
        self.assertEqual(before[0]['state']['progress'],0)
        medicine=world.r['medicine']
        healer['goal_directives']={'prefer_power':'Healing'}
        self.assertTrue(world.activate(healer))
        self.assertEqual(world.r['medicine'],medicine-1)
        after=evaluate_goals(before,healer,context,10)
        self.assertEqual(after[0]['state']['status'],'completed')
    def test_example_resolves_family_and_goals(self):
        path=Path(__file__).parents[1]/'assets/scenarios/custom-goal-driven-world.json'
        cfg=validate_scenario(json.loads(path.read_text()),POWER_TREE)
        people=agents();story=init_story(people,cfg,mode='modern')
        self.assertEqual(len(story['main_ids']),2)
        self.assertEqual(set(people[4]['children']),{1,2})
        self.assertEqual(story['goals']['2'][0]['target_id'],3)
        prepare_story(story,people,1,society={'freedom':72,'integrity':68,'press_freedom':80},mode='modern')
        self.assertEqual(people[2]['goal_directives']['civic_focus'],'pluralist')
        self.assertEqual(people[2]['goal_directives']['seek_rival_id'],3)

if __name__=='__main__':unittest.main()
