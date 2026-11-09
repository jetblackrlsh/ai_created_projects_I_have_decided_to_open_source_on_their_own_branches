#!/usr/bin/env python3
"""Deterministic synthetic fixtures validate real effects for every defined power."""
from copy import deepcopy
import json
from pathlib import Path
import random
import sys
import unittest

sys.path.insert(0, str(Path(__file__).parent))
from power_effects import POWER_EFFECTS, WorldPowers, BASE_POWER_NAMES
import simulate_world as engine


def agent(i, power=None, role='citizen', alive=True):
    return {'id': i, 'name': f'Person {i}', 'last_name': 'Test', 'power': power,
            'role': role, 'alive': alive, 'age': 25, 'children': [], 'spouse': None,
            'imprisoned_until': 0, 'death_year': None if alive else 9,
            'death_cause': None if alive else 'battle', 'royal_blood': False}


def fixture(power):
    agents = {1: agent(1, power, 'hero'), 2: agent(2, 'Fire', 'villain'),
              3: agent(3, 'Water', 'hero'), 4: agent(4, alive=False)}
    def create(birth_year, age=0, power=None, last_name=None):
        a = agent(max(agents) + 1, power)
        a['age'] = age
        agents[a['id']] = a
        return a
    world = WorldPowers(agents, random.Random(42))
    world.year = 10
    world.create_agent = create
    world.towns = ['Ashford', 'Lakeside']
    world.living = [a for a in agents.values() if a['alive']]
    world.chronicle = [{'true_event': 'A hidden crime', 'public_belief': 'Unknown', 'secret': True}]
    for a in agents.values(): world.setup_agent(a)
    agents[1]['injury'] = .6
    agents[1]['poisoned_until'] = 12
    agents[3]['injury'] = .8
    agents[3]['burning_until'] = 12
    agents[3]['poisoned_until'] = 12
    return world


class PowerTests(unittest.TestCase):
    def test_all_29_powers_have_actual_nonlog_effects(self):
        self.assertTrue(BASE_POWER_NAMES <= set(engine.POWER_TREE))
        for power in sorted(BASE_POWER_NAMES):
            with self.subTest(power=power):
                w = fixture(power)
                before_agents, before_resources = deepcopy(w.agents), deepcopy(w.r)
                before_chronicle = deepcopy(w.chronicle)
                before_revelations = deepcopy(w.state['revealed_events'])
                self.assertTrue(w.activate(w.agents[1]), power)
                # Exclude the generic energy/cooldown fields: action must do something else.
                for a in (before_agents[1], w.agents[1]):
                    a.pop('energy', None)
                    a.pop('power_ready_year', None)
                self.assertTrue(w.agents != before_agents or w.r != before_resources or w.chronicle != before_chronicle or w.state['revealed_events'] != before_revelations)
                self.assertEqual(w.state['usage'][power], 1)
                self.assertTrue(w.events)

    def test_power_specific_contracts(self):
        checks = {
            'Fire': lambda w: w.agents[2]['injury'] > 0 and w.agents[2]['burning_until'] == 12,
            'Ice': lambda w: w.agents[2]['frozen_until'] == 11,
            'Water': lambda w: w.agents[3]['burning_until'] == 0 and w.r['food'] > 6,
            'Weather': lambda w: w.r['harvest_bonus'] > 0,
            'Lightning': lambda w: w.agents[2]['stunned_until'] == 11,
            'Magnetism': lambda w: w.agents[2]['disarmed_until'] == 12,
            'Earth': lambda w: w.r['fortifications'] == 1,
            'Wind': lambda w: w.agents[3]['sheltered_until'] == 12,
            'Plant Control': lambda w: w.r['medicine'] == 6,
            'Poison': lambda w: w.agents[2]['poisoned_until'] == 13,
            'Flight': lambda w: w.agents[3]['location'] == 'Lakeside' and w.agents[3]['injury'] < .8,
            'Strength': lambda w: w.r['materials'] == 28,
            'Giant Size': lambda w: w.r['infrastructure'] == 1.5 and w.r['guard'] == 1,
            'Durability': lambda w: w.agents[1]['armored_until'] == 13,
            'Speed': lambda w: w.agents[1]['hasted_until'] == 12,
            'Shapeshifting': lambda w: w.agents[1]['animal_form_until'] == 12,
            'Cloning': lambda w: w.agents[5]['clone_of'] == 1,
            'Invisibility': lambda w: w.agents[1]['hidden_until'] == 12,
            'Illusions': lambda w: w.agents[2]['confused_until'] == 12,
            'Shadow': lambda w: w.agents[2]['frightened_until'] == 11,
            'Mind Control': lambda w: w.agents[2]['controlled_by'] == 1 and w.agents[2]['role'] == 'citizen',
            'Telepathy': lambda w: w.state['revealed_events'] == [0] and 'A hidden crime' in w.events[-1]['true_event'],
            'Portals': lambda w: w.agents[1]['location'] == 'Lakeside',
            'Time Slowing': lambda w: w.agents[2]['stasis_until'] == 11,
            'Magic': lambda w: w.agents[1]['ward_charges'] == 1,
            'Healing': lambda w: w.agents[3]['injury'] < .8 and w.r['medicine'] == 4,
            'Regeneration': lambda w: w.agents[1]['injury'] < .6 and w.agents[1]['poisoned_until'] == 0,
            'Immortal': lambda w: w.agents[1]['injury'] < .6,
            'Necromancy': lambda w: w.agents[4]['alive'] and w.agents[4]['resurrections'] == 1,
        }
        for power, check in checks.items():
            with self.subTest(power=power):
                w = fixture(power)
                w.activate(w.agents[1])
                self.assertTrue(check(w), power)

    def test_necromancy_preserves_identity_and_cannot_loop(self):
        w = fixture('Necromancy')
        dead = w.agents[4]
        dead['children'], dead['spouse'] = [3], 2
        self.assertTrue(w.activate(w.agents[1]))
        self.assertEqual(dead['children'], [3])
        self.assertEqual(dead['spouse'], 2)
        self.assertEqual(dead['death_history'], [{'year': 9, 'cause': 'battle'}])
        self.assertIsNone(dead['death_cause'])
        w.year = 20
        w.activated_this_year.clear()
        w.agents[1]['energy'] = 100
        dead['alive'], dead['death_year'], dead['death_cause'] = False, 19, 'battle'
        self.assertFalse(w.activate(w.agents[1]))
        w = fixture('Necromancy')
        w.agents[4]['death_cause'] = 'old age'
        self.assertFalse(w.activate(w.agents[1]))

    def test_clones_cannot_clone_or_reproduce_and_expire(self):
        w = fixture('Cloning')
        self.assertTrue(w.activate(w.agents[1]))
        clone = w.agents[5]
        self.assertNotEqual(clone['id'], w.agents[1]['id'])
        self.assertFalse(clone['royal_blood'])
        w.living.append(clone)
        self.assertFalse(w.activate(clone))
        w.begin_year(25, w.create_agent, w.towns, [], [])
        self.assertFalse(clone['alive'])
        self.assertEqual(clone['death_cause'], 'clone dissolution')

    def test_wards_armor_cleansing_and_stun(self):
        w = fixture('Fire')
        w.agents[2]['ward_charges'] = 1
        self.assertFalse(w.activate(w.agents[1]))
        self.assertEqual(w.agents[2]['injury'], 0)
        self.assertEqual(w.agents[2]['ward_charges'], 0)
        self.assertFalse(w.activate(w.agents[1]))
        w = fixture('Fire')
        w.agents[2]['power'] = 'Durability'
        w.activate(w.agents[1])
        self.assertLess(w.agents[2]['injury'], .25)
        w = fixture('Water')
        self.assertTrue(w.activate(w.agents[1]))
        self.assertEqual(w.agents[3]['poisoned_until'], 0)
        w = fixture('Ice')
        w.activate(w.agents[1])
        self.assertFalse(w.can_act(w.agents[2]))
        self.assertLess(w.combat_multiplier(w.agents[2]), 1)

    def test_mind_control_expires_and_collars_suppress(self):
        w = fixture('Mind Control')
        w.activate(w.agents[1])
        w.agents[1]['power'] = None
        w.begin_year(13, w.create_agent, w.towns, [], [])
        self.assertEqual(w.agents[2]['role'], 'villain')
        w = fixture('Portals')
        w.agents[1]['imprisoned_until'] = 30
        w.agents[1]['suppressed_until'] = 10
        self.assertFalse(w.activate(w.agents[1]))
        w.agents[1]['suppressed_until'] = 0
        self.assertTrue(w.activate(w.agents[1]))
        self.assertEqual(w.agents[1]['imprisoned_until'], 0)

    def test_power_budget_resources_and_limits(self):
        w = fixture('Cloning')
        w.agents[1]['energy'] = 20
        self.assertFalse(w.activate(w.agents[1]))
        w.agents[1]['energy'] = 100
        self.assertTrue(w.activate(w.agents[1]))
        self.assertFalse(w.activate(w.agents[1]))
        w.year = 18
        w.activated_this_year.clear()
        w.agents[1]['energy'] = 100
        self.assertFalse(w.activate(w.agents[1]))  # live clone cap
        w = fixture('Necromancy')
        w.r['medicine'] = 0
        self.assertFalse(w.activate(w.agents[1]))
        w = fixture('Magic')
        w.agents[1]['ward_charges'] = w.agents[3]['ward_charges'] = 1
        self.assertFalse(w.activate(w.agents[1]))  # no indefinite ward stacking

    def test_stasis_and_immortality_integrate_with_aging(self):
        original = engine.run_single_world_evolution_or_monarch_or_wheel(
            'monarch', 42, 10, 10, .1, .35, total_years=100)
        state = deepcopy(original['_state'])
        a = state['variables']['agents'][1]
        a['alive'], a['age'], a['stasis_until'] = True, 25, 11
        state['terminal'] = False
        resumed = engine.run_single_world_evolution_or_monarch_or_wheel(
            'monarch', 42, 11, 10, .1, .35, resume_state=state, total_years=100)
        self.assertEqual(resumed['agents'][1]['age'], 25)
        state = deepcopy(original['_state'])
        a = state['variables']['agents'][1]
        a['alive'], a['age'], a['power'] = True, 10000, 'Immortal'
        state['terminal'] = False
        resumed = engine.run_single_world_evolution_or_monarch_or_wheel(
            'monarch', 42, 11, 10, .1, .35, resume_state=state, total_years=100)
        self.assertTrue(resumed['agents'][1]['alive'])
        self.assertEqual(resumed['agents'][1]['age'], 10001)

    def test_state_json_roundtrip_and_migration(self):
        w = fixture('Necromancy')
        w.activate(w.agents[1])
        state = json.loads(json.dumps(w.state))
        clone = WorldPowers(w.agents, random.Random(42), state)
        self.assertEqual(clone.state, w.state)
        world = engine.run_single_world_evolution_or_monarch_or_wheel('monarch', 42, 10, 30, .1, .35, total_years=100)
        old = deepcopy(world['_state'])
        old.pop('powers')
        resumed = engine.run_single_world_evolution_or_monarch_or_wheel('monarch', 42, 11, 30, .1, .35, resume_state=old, total_years=100)
        self.assertIn('world_resources', resumed)
        self.assertEqual(resumed['engine_version'], 3)


if __name__ == '__main__':
    unittest.main(verbosity=2)
