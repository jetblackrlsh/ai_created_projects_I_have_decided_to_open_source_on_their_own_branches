"""Individual levels reach actual actions, theft and arena scenario boundaries."""
import copy
import unittest
from test_power_effects import fixture
from expanded_powers import set_powers,activate_expanded
from power_mastery import configure_mastery,level_for
from story_setup import validate_scenario
from arena_runner import roster_for
from simulate_world import POWER_TREE

class PowerMasteryWorldTests(unittest.TestCase):
    def test_novice_secondary_cost_and_growth(self):
        world=fixture('Fire');a=world.agents[1]
        set_powers(a,['Fire','Plant Control']);configure_mastery(a,{'Fire':5,'Plant Control':0},10)
        a['goal_directives']={'prefer_power':'Plant Control'}
        food=world.r['food'];energy=a['energy'];fire_xp=a['power_mastery']['Fire']['xp']
        self.assertTrue(world.activate(a))
        self.assertEqual(world.r['food']-food,10)
        self.assertEqual(energy-a['energy'],25)
        self.assertEqual(a['power_mastery']['Fire']['xp'],fire_xp)
        self.assertEqual(a['power_mastery']['Plant Control']['xp'],1)
        self.assertEqual(a['mastery_level'],5)
    def test_expanded_novice_potency(self):
        world=fixture('Sparks');a=world.agents[1]
        set_powers(a,['Fire','Sparks']);configure_mastery(a,{'Fire':5,'Sparks':0},10)
        a['goal_directives']={'prefer_power':'Sparks'}
        self.assertTrue(world.activate(a))
        self.assertAlmostEqual(world.agents[2]['injury'],.08)
        self.assertEqual(a['power_mastery']['Sparks']['xp'],1)
    def test_fresh_arena_config_uses_map(self):
        cfg=validate_scenario({'characters':[{'key':'a','powers':['Fire','Healing'],'power_mastery':{'Fire':4,'Healing':0}},{'key':'b','powers':['Earth']}]},POWER_TREE)
        people,keys=roster_for(cfg,None)
        self.assertEqual(level_for(people[keys['a']],'Fire'),4)
        self.assertEqual(level_for(people[keys['a']],'Healing'),0)

if __name__=='__main__':unittest.main()
