#!/usr/bin/env python3
"""Deterministic fixtures for expanded actions and bounded permanent repertoires."""
from copy import deepcopy
import json
import random
import unittest

from expanded_powers import (EXPANDED_EFFECTS, EXPANDED_POWER_TREE, MAX_POWERS,
    activate_expanded, powers_of, set_powers, has_power, inherit_powers)
from power_effects import WorldPowers


def person(i, power=None, role='hero'):
    return {'id': i, 'name': 'Person ' + str(i), 'last_name': 'Test',
            'power': power, 'role': role, 'alive': True, 'age': 25,
            'spouse': None, 'children': [], 'imprisoned_until': 0,
            'injury': .4, 'energy': 60.0}


def fixture(power, seed=42):
    agents = {1: person(1, power), 2: person(2, 'Fire', 'villain'),
              3: person(3, 'Water')}
    w = WorldPowers(agents, random.Random(seed))
    w.year = 10
    w.living = list(agents.values())
    w.chronicle = [{'true_event': 'A concealed rescue', 'secret': True}]
    for a in w.living:
        w.setup_agent(a)
    return w


class ExpandedPowerTests(unittest.TestCase):
    def test_every_expanded_power_has_real_effect(self):
        self.assertEqual(set(EXPANDED_EFFECTS), set(EXPANDED_POWER_TREE))
        for power in EXPANDED_EFFECTS:
            with self.subTest(power=power):
                w = fixture(power)
                before = deepcopy((w.agents, w.r, w.state))
                result = activate_expanded(w, w.agents[1], w.agents[2])
                self.assertIsNotNone(result)
                self.assertTrue(result[0], power)
                self.assertNotEqual(before, (w.agents, w.r, w.state))
                json.dumps((w.agents, w.r, w.state), allow_nan=False)

    def test_unknown_and_core_powers_delegate(self):
        w = fixture('Fire')
        self.assertIsNone(activate_expanded(w, w.agents[1], w.agents[2]))

    def test_no_target_no_hostile_action(self):
        for power in ('Time Stop', 'Steam', 'Power Suppression', 'Charm',
                      'Hurricane Breath', 'Rot', 'Siphon', 'Sparks'):
            w = fixture(power)
            before = deepcopy(w.agents)
            self.assertFalse(activate_expanded(w, w.agents[1], None)[0])
            self.assertEqual(before, w.agents)

    def test_resources_have_costs_and_caps(self):
        for power, cost in [('Alchemy', 3), ('Rapid Construction', 4)]:
            w = fixture(power)
            w.r['materials'] = cost - 1
            self.assertFalse(activate_expanded(w, w.agents[1], w.agents[2])[0])
            w.r['materials'] = cost
            self.assertTrue(activate_expanded(w, w.agents[1], w.agents[2])[0])
            self.assertEqual(w.r['materials'], 0)
        w = fixture('Tide Control')
        for _ in range(3000):
            activate_expanded(w, w.agents[1], w.agents[2])
        self.assertLessEqual(w.r['food'], 10000)

    def test_siphon_permanently_removes_primary_and_supports_secondary(self):
        w = fixture('Siphon')
        set_powers(w.agents[2], ['Fire', 'Water'])
        self.assertTrue(activate_expanded(w, w.agents[1], w.agents[2])[0])
        acquired = set(powers_of(w.agents[1])) - {'Siphon'}
        self.assertEqual(len(acquired), 1)
        self.assertTrue(acquired.isdisjoint(powers_of(w.agents[2])))
        self.assertEqual(w.agents[2]['power'], w.agents[2]['powers'][0])
        # Crossing years and serializing cannot restore a stolen ability.
        agents = json.loads(json.dumps(w.agents))
        for power in acquired:
            self.assertIn(power, powers_of(agents['1']))
            self.assertNotIn(power, powers_of(agents['2']))
        self.assertEqual(w.agents[1]['siphon_acquisitions'][0]['from_id'], 2)

    def test_secondary_siphon_preserves_primary(self):
        w = fixture('Fire')
        set_powers(w.agents[1], ['Water', 'Siphon'])
        w.agents[1]['power'] = 'Siphon'  # common wrapper selects secondary
        self.assertTrue(activate_expanded(w, w.agents[1], w.agents[2])[0])
        self.assertEqual(w.agents[1]['powers'], ['Water', 'Siphon', 'Fire'])
        self.assertEqual(w.agents[1]['power'], 'Water')

    def test_luck_is_an_alias_not_a_separate_catalogue_power(self):
        self.assertNotIn('Luck', EXPANDED_EFFECTS)
        a = {'power': 'Luck'}
        self.assertEqual(powers_of(a), ['Fortune'])
        self.assertTrue(has_power(a, 'Luck'))

    def test_siphon_can_leave_target_unpowered(self):
        w = fixture('Siphon')
        self.assertTrue(activate_expanded(w, w.agents[1], w.agents[2])[0])
        self.assertIsNone(w.agents[2]['power'])
        self.assertEqual(powers_of(w.agents[2]), [])

    def test_siphon_capacity_and_no_recursive_siphoning(self):
        w = fixture('Siphon')
        set_powers(w.agents[1], ['Siphon', 'Water', 'Ice'])
        before = deepcopy(w.agents)
        self.assertFalse(activate_expanded(w, w.agents[1], w.agents[2])[0])
        self.assertEqual(w.agents, before)
        set_powers(w.agents[1], ['Siphon'])
        set_powers(w.agents[2], ['Siphon'])
        self.assertFalse(activate_expanded(w, w.agents[1], w.agents[2])[0])

    def test_repertoire_migrates_legacy_and_deduplicates(self):
        a = {'power': 'Fire', 'powers': ['Water', 'Fire', 'Ice', 'Speed']}
        self.assertEqual(powers_of(a), ['Fire', 'Water', 'Ice'])
        self.assertEqual(set_powers(a, ['Speed', 'Speed', None, 'Ice']), ['Speed', 'Ice'])
        self.assertTrue(has_power(a, 'Ice'))
        self.assertEqual(a['power'], 'Speed')
        set_powers(a, [])
        self.assertIsNone(a['power'])

    def test_inheritance_multi_power_bounded_and_seeded(self):
        a, b = person(1, 'Fire'), person(2, 'Water')
        set_powers(a, ['Fire', 'Ice', 'Siphon'])
        set_powers(b, ['Water', 'Flight', 'Speed'])
        def mutate(power, rng, rate):
            return 'Stone Skin' if rng.random() < rate else power
        first, second = random.Random(7), random.Random(7)
        samples = [inherit_powers(a, b, first, .1, mutate) for _ in range(500)]
        self.assertEqual(samples, [inherit_powers(a, b, second, .1, mutate) for _ in range(500)])
        self.assertTrue(any(len(result) > 1 for result in samples))
        self.assertTrue(any(not result for result in samples))
        for result in samples:
            self.assertLessEqual(len(result), MAX_POWERS)
            self.assertEqual(len(set(result)), len(result))
        self.assertEqual(inherit_powers({}, {}, first, .1, mutate), [])

    def test_expanded_effect_replay_after_json_checkpoint(self):
        for power in EXPANDED_EFFECTS:
            with self.subTest(power=power):
                first, second = fixture(power, 29), fixture(power, 29)
                # Exercise state through the actual portable JSON representation.
                second.agents = {int(k): v for k, v in json.loads(json.dumps(second.agents)).items()}
                second.living = list(second.agents.values())
                result_a = activate_expanded(first, first.agents[1], first.agents[2])
                result_b = activate_expanded(second, second.agents[1], second.agents[2])
                self.assertEqual(result_a, result_b)
                self.assertEqual(first.agents, second.agents)
                self.assertEqual(first.r, second.r)
                self.assertEqual(first.rng.getstate(), second.rng.getstate())

    def test_suppression_falls_only_for_current_airborne_flight(self):
        for flight, airborne, injury in [('Flight', 11, .12), ('Flight', 9, 0), ('Fire', 11, 0)]:
            w = fixture('Power Suppression')
            set_powers(w.agents[2], [flight])
            w.agents[2]['airborne_until'] = airborne
            before = w.agents[2]['injury']
            self.assertTrue(activate_expanded(w, w.agents[1], w.agents[2])[0])
            self.assertAlmostEqual(w.agents[2]['injury'] - before, injury)
            self.assertEqual(w.agents[2]['suppressed_until'], 12)
            if injury:
                self.assertEqual(w.agents[2]['airborne_until'], 0)

    def test_rot_maliciously_seeds_bounded_infection(self):
        for role, goal, infected in [('villain', None, True), ('hero', 'revenge', True), ('hero', None, False)]:
            w = fixture('Rot')
            w.agents[1]['role'], w.agents[1]['goal'] = role, goal
            self.assertTrue(activate_expanded(w, w.agents[1], w.agents[2])[0])
            self.assertEqual(w.agents[2].get('infected_until'), 11 if infected else None)
            self.assertEqual(w.agents[2]['poisoned_until'], 13)

    def test_perfect_memory_learning_is_bounded_and_requires_new_record(self):
        w = fixture('Perfect Memory')
        caster = w.agents[1]
        caster['knowledge_points'] = 99
        self.assertTrue(activate_expanded(w, caster, w.agents[2])[0])
        self.assertEqual(caster['knowledge_points'], 100)
        self.assertFalse(activate_expanded(w, caster, w.agents[2])[0])
        w.chronicle.append({'true_event': 'Another witnessed event', 'secret': False})
        self.assertTrue(activate_expanded(w, caster, w.agents[2])[0])
        self.assertEqual(caster['knowledge_points'], 100)

    def test_control_and_time_contracts(self):
        w = fixture('Charm')
        activate_expanded(w, w.agents[1], w.agents[2])
        self.assertEqual(w.agents[2]['original_role'], 'villain')
        self.assertEqual(w.agents[2]['controlled_until'], 11)
        self.assertEqual(w.agents[2]['role'], 'citizen')
        w = fixture('Time Stop')
        activate_expanded(w, w.agents[1], w.agents[2])
        self.assertEqual(w.agents[2]['stasis_until'], 11)
        w = fixture('Time Rewind')
        activate_expanded(w, w.agents[1], w.agents[2])
        self.assertLess(w.agents[1]['injury'], .4)
        self.assertEqual(len(w.agents), 3)


if __name__ == '__main__':
    unittest.main()
