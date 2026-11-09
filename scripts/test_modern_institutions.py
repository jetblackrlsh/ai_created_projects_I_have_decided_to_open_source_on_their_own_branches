#!/usr/bin/env python3
"""Causal and replay coverage for original, fictional civic institutions."""
import copy
import json
import random
import unittest
from modern_institutions import (setup, tick, queue_case, licensing_and_courts,
    accidents_and_offenses, hospitals_and_epidemics, sports_and_civic_action,
    observe_public_offenses, HISTORY_LIMIT, CASE_LIMIT)
from power_effects import WorldPowers
from test_power_effects import agent


class ZeroRandom(random.Random):
    def random(self):
        return 0.0


def world(n=12):
    agents = {i: agent(i, 'Healing' if i == 1 else ('Fire' if i % 2 == 0 else None))
              for i in range(1, n + 1)}
    for a in agents.values():
        a.update(compassion=.8, charisma=.5, greed=.3, ambition=.5,
                 reputation=50., wealth=20., mastery_level=1)
    powers = WorldPowers(agents, random.Random(42))
    powers.year = 1
    powers.living = list(agents.values())
    for a in agents.values():
        powers.setup_agent(a)
    state = {'year': 1, 'laws': {}, 'freedom': 80., 'integrity': 80.,
             'regime': 'democracy', 'leader_id': 2}
    setup(state, agents)
    return agents, state, powers


class InstitutionTests(unittest.TestCase):
    def test_licensing_age_mastery_and_suspension(self):
        a, s, p = world()
        a[1]['age'] = 12
        a[2]['mastery_level'] = 0
        licensing_and_courts(s, a, random.Random(1), lambda *x: None)
        self.assertFalse(a[1]['power_license'])
        self.assertFalse(a[2]['power_license'])
        self.assertTrue(a[4]['power_license'])
        a[4]['license_suspended_until'] = 3
        licensing_and_courts(s, a, random.Random(1), lambda *x: None)
        self.assertFalse(a[4]['power_license'])

    def test_evidence_verdicts_sentences_and_compensation(self):
        a, s, p = world()
        queue_case(s, a, 2, 'assault', 3, .9, victim_id=3)
        licensing_and_courts(s, a, random.Random(1), lambda *x: None)
        self.assertEqual(a[2]['imprisoned_until'], 6)
        self.assertEqual(a[2]['wealth'], 11)
        self.assertEqual(a[3]['wealth'], 29)
        queue_case(s, a, 4, 'unsupported allegation', 5, .1)
        licensing_and_courts(s, a, random.Random(1), lambda *x: None)
        self.assertEqual(s['institutions']['acquittals'], 1)
        self.assertEqual(a[4]['imprisoned_until'], 0)

    def test_forensic_fraud_charges_creator_once_not_victim(self):
        a, s, p = world()
        a[2].update(proven_fraud_until=4, fraud_victim_id=3)
        licensing_and_courts(s, a, random.Random(1), lambda *x: None)
        self.assertGreater(a[2]['imprisoned_until'], 1)
        self.assertEqual(a[3]['imprisoned_until'], 0)
        s['year'] = 2
        licensing_and_courts(s, a, random.Random(1), lambda *x: None)
        self.assertEqual(s['institutions']['trials'], 1)

    def test_children_and_accidents_get_training_not_prison(self):
        a, s, p = world(2)
        a[1].update(age=9, power='Fire', mastery_level=0)
        a[2]['power'] = None
        before = p.r['infrastructure']
        accidents_and_offenses(s, a, p, ZeroRandom(1), lambda *x: None)
        self.assertEqual(s['institutions']['child_accidents'], 1)
        self.assertGreater(a[2]['injury'], 0)
        self.assertLess(p.r['infrastructure'], before)
        licensing_and_courts(s, a, ZeroRandom(1), lambda *x: None)
        self.assertEqual(a[1]['imprisoned_until'], 0)
        self.assertGreater(a[1]['community_service'], 0)
        self.assertGreater(a[1]['safety_compliance'], 0)
        self.assertEqual(a[1]['power_xp'], 0)

    def test_hospital_capacity_triage_medicine_and_burnout(self):
        a, s, p = world(24)
        for person in a.values():
            person['injury'] = .5
        a[2]['injury'] = .9
        a[1]['healer_burnout'] = 10
        p.r['medicine'] = 10
        hospitals_and_epidemics(s, a, p, random.Random(9), lambda *x: None)
        self.assertLess(a[2]['injury'], .9)
        self.assertGreater(s['institutions']['hospital_waitlisted'], 0)
        self.assertGreater(a[1]['healer_burnout'], 60)
        self.assertEqual(s['institutions']['healer_burnouts'], 1)
        self.assertLess(a[1]['energy'], 100)
        self.assertLess(p.r['medicine'], 10)

    def test_quarantine_reduces_spread_and_lasts_beyond_current_tick(self):
        a, s, p = world()
        a[1]['infected_until'] = 2
        b, t, q = world()
        b[1]['infected_until'] = 2
        t['laws']['public_health_act'] = False
        hospitals_and_epidemics(s, a, p, ZeroRandom(1), lambda *x: None)
        hospitals_and_epidemics(t, b, q, ZeroRandom(1), lambda *x: None)
        self.assertGreater(t['institutions']['infections'], s['institutions']['infections'])
        self.assertEqual(a[1]['quarantined_until'], 2)
        self.assertGreater(a[1]['injury'], 0)
        self.assertEqual(b[1]['quarantined_until'], 0)

    def test_sports_have_separate_licensed_leagues(self):
        a, s, p = world()
        s['year'] = 2
        licensing_and_courts(s, a, random.Random(1), lambda *x: None)
        sports_and_civic_action(s, a, random.Random(1), lambda *x: None)
        self.assertEqual(s['institutions']['sports_events'], 2)
        for competition in s['institutions']['sports_history']:
            winner = a[competition['winner_id']]
            self.assertEqual(bool(winner['power']), competition['league'] == 'powered')
            if winner['power']:
                self.assertTrue(winner['power_license'])

    def test_impeachment_needs_evidence_independence_and_votes(self):
        a, s, p = world()
        s['freedom'] = 30
        events = []
        sports_and_civic_action(s, a, ZeroRandom(1), lambda *x: events.append(x))
        self.assertEqual(s['leader_id'], 2)
        self.assertEqual(s['institutions']['protests'], 1)
        a[2]['corruption_evidence'] = .95
        s['integrity'] = 20
        sports_and_civic_action(s, a, ZeroRandom(1), lambda *x: None)
        self.assertEqual(s['leader_id'], 2)
        s['integrity'] = 80
        sports_and_civic_action(s, a, ZeroRandom(1), lambda *x: None)
        self.assertIsNone(s['leader_id'])
        self.assertEqual(s['institutions']['impeachments'], 1)
        self.assertEqual(s['institutions']['cases'][0]['offense'], 'documented public corruption')

    def test_json_roundtrip_rng_replay_and_tick_idempotence(self):
        a, s, p = world()
        rng = random.Random(73)
        tick(a, s, p, rng, 1)
        saved_a, saved_s = json.loads(json.dumps(a)), json.loads(json.dumps(s))
        b = {int(k): v for k, v in saved_a.items()}
        t = saved_s
        q = WorldPowers(b, random.Random(42), json.loads(json.dumps(p.state)))
        other = random.Random()
        other.setstate(rng.getstate())
        p.year = q.year = 2
        self.assertEqual(tick(a, s, p, rng, 2), tick(b, t, q, other, 2))
        self.assertEqual(json.loads(json.dumps(a)), json.loads(json.dumps(b)))
        self.assertEqual(s, t)
        before = copy.deepcopy(s)
        self.assertEqual(tick(a, s, p, rng, 2), [])
        self.assertEqual(s, before)
        json.dumps(s, allow_nan=False)

    def test_combined_repertoire_healers_and_child_accidents(self):
        a, s, p = world(2)
        a[1].update(power='Strength', powers=['Healing'], healer_burnout=0)
        a[2]['injury'] = .9
        hospitals_and_epidemics(s, a, p, random.Random(1), lambda *x: None)
        self.assertLess(a[2]['injury'], .9)
        a, s, p = world(2)
        a[1].update(power='Strength', powers=['Sparks'], age=9)
        a[2]['power'] = None
        accidents_and_offenses(s, a, p, ZeroRandom(1), lambda *x: None)
        self.assertIn('gas leak', s['institutions']['history'][-1]['mechanism'])

    def test_sentence_bands_and_self_defense(self):
        for offense, severity, expected in [('fraud', 2, 6), ('murder', 4, 15),
                                              ('severe murder', 5, 25), ('vigilantism', 1, 1)]:
            a, s, p = world()
            queue_case(s, a, 2, offense, severity, .9)
            licensing_and_courts(s, a, random.Random(1), lambda *x: None)
            self.assertEqual(a[2]['imprisoned_until'], 1 + expected)
        a, s, p = world()
        queue_case(s, a, 2, 'self-defense', 3, .9, self_defense=True)
        licensing_and_courts(s, a, random.Random(1), lambda *x: None)
        self.assertEqual(a[2]['imprisoned_until'], 0)
        self.assertEqual(s['institutions']['self_defense_acquittals'], 1)

    def test_public_hostile_events_observed_private_and_support_ignored(self):
        a, s, p = world()
        a[2]['role'] = 'villain'
        p.events = [dict(year=1, actor_id=2, target_id=3, power='Fire', secret=False),
                    dict(year=1, actor_id=3, target_id=2, power='Ice', secret=False),
                    dict(year=1, actor_id=4, target_id=3, power='Fire', secret=True),
                    dict(year=1, actor_id=1, target_id=3, power='Healing', secret=False)]
        observe_public_offenses(s, a, p)
        self.assertEqual(len(s['institutions']['cases']), 2)
        self.assertFalse(s['institutions']['cases'][0]['self_defense'])
        self.assertTrue(s['institutions']['cases'][1]['self_defense'])
        observe_public_offenses(s, a, p)
        self.assertEqual(len(s['institutions']['cases']), 2)

    def test_power_specific_child_collateral_chains(self):
        for power in ('Sparks', 'Tide Control', 'Power Suppression'):
            a, s, p = world(2)
            a[1].update(age=8, power=power, mastery_level=0)
            a[2].update(power=None, airborne_until=2)
            accidents_and_offenses(s, a, p, ZeroRandom(1), lambda *x: None)
            history = s['institutions']['history']
            self.assertEqual(history[-1]['kind'], 'collateral_chain')
            self.assertGreaterEqual(a[2]['injury'], .2)

    def test_ranking_protest_in_free_society_and_ban_stops_it(self):
        a, s, p = world()
        s['freedom'] = 100
        for person in a.values():
            person.update(app_rank='F', grievance=70)
        sports_and_civic_action(s, a, ZeroRandom(1), lambda *x: None)
        self.assertEqual(s['institutions']['rank_protests'], 1)
        s['laws']['ranking_app'] = False
        sports_and_civic_action(s, a, ZeroRandom(1), lambda *x: None)
        self.assertEqual(s['institutions']['rank_protests'], 1)

    def test_severe_hospitalization_blocks_following_year(self):
        a, s, p = world(2)
        a[2]['injury'] = .9
        hospitals_and_epidemics(s, a, p, random.Random(1), lambda *x: None)
        self.assertEqual(a[2]['hospitalized_until'], 2)

    def test_dockets_and_histories_are_bounded(self):
        a, s, p = world()
        for i in range(300):
            queue_case(s, a, 2, 'allegation', evidence=.1)
        self.assertEqual(len(s['institutions']['cases']), CASE_LIMIT)
        for year in range(1, 150):
            s['year'] = year
            queue_case(s, a, 2, 'allegation', evidence=.1)
            licensing_and_courts(s, a, random.Random(year), lambda *x: None)
        self.assertLessEqual(len(s['institutions']['history']), HISTORY_LIMIT)


if __name__ == '__main__':
    unittest.main(verbosity=2)
