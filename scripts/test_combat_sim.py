import copy
import json
import unittest
from combat_sim import simulate_fight, simulate_tournament, POWER_PROFILES
from simulate_world import POWER_TREE


def fighter(id,power=None,**kw):
    return dict(id=id,power=power,**kw)

class CombatTests(unittest.TestCase):
    def test_catalog(self):
        self.assertEqual(set(POWER_PROFILES),set(POWER_TREE))
        self.assertEqual(len(POWER_PROFILES),53)

    def test_every_power_changes_state(self):
        for name in POWER_PROFILES:
            with self.subTest(power=name):
                powered=simulate_fight(fighter('a',name),fighter('b'),seed=73,max_rounds=12)
                blank=simulate_fight(fighter('a'),fighter('b'),seed=73,max_rounds=12)
                self.assertNotEqual(powered['final_state'],blank['final_state'])
                # Compare mechanical state, not power names or trace labels.
                get=lambda r:[(f['vigor'],f['resolve'],f['guard'],f['statuses']) for f in r['final_state']]
                self.assertNotEqual(get(powered),get(blank))
                json.dumps(powered,allow_nan=False)

    def test_side_neutral_replay_purity(self):
        a=fighter('42','Siphon',powers=['Siphon','Speed']); b=fighter(9,'Time Stop')
        old=copy.deepcopy([a,b])
        first=simulate_fight(a,b,99)
        self.assertEqual(first,simulate_fight(b,a,99))
        self.assertEqual(first,simulate_fight(a,b,99))
        self.assertEqual([a,b],old)
        self.assertFalse(first['world_mutated'])

    def test_siphon_bout_only(self):
        a=fighter('a','Siphon'); b=fighter('b','Fire')
        result=simulate_fight(a,b,1,max_rounds=1)
        self.assertEqual(result['final_state'][0]['copied'],'Fire')
        self.assertEqual(b['power'],'Fire')
        self.assertEqual(a['power'],'Siphon')

    def test_tournament_byes_counts_replay(self):
        for count in (2,3,5,8,17,53,64):
            roster=[fighter(str(i),'Fire') for i in range(count)]
            old=copy.deepcopy(roster)
            result=simulate_tournament(roster,9,max_rounds=2)
            self.assertEqual(len(result['matches']),count-1)
            self.assertEqual(result,simulate_tournament(list(reversed(roster)),9,max_rounds=2))
            self.assertEqual(roster,old)
            self.assertIn(result['champion_id'],[str(i) for i in range(count)])

    def test_caps_invalid(self):
        for rounds in (0,201,True,1.5):
            with self.assertRaises(ValueError): simulate_fight(fighter('a'),fighter('b'),max_rounds=rounds)
        for bad in ('Unlisted',):
            with self.assertRaises(ValueError): simulate_fight(fighter('a',bad),fighter('b'))
        with self.assertRaises(ValueError): simulate_fight(fighter('a'),fighter('a'))
        with self.assertRaises(ValueError): simulate_fight(fighter('a'),fighter('b'),rules={'nonlethal':False})
        with self.assertRaises(ValueError): simulate_tournament([fighter('a')])

    def test_nonlethal_bounded_states(self):
        for index,power in enumerate(POWER_PROFILES):
            result=simulate_fight(fighter('a',power,mastery_level=5),fighter('b','Invulnerability'),index)
            self.assertLessEqual(result['rounds'],30)
            for f in result['final_state']:
                for field in ('vigor','resolve','energy'):
                    self.assertGreaterEqual(f[field],0); self.assertLessEqual(f[field],100)
            self.assertTrue(result['nonlethal'])

    def test_actual_outcomes_differ(self):
        # Not merely different labels: powers change the aggregate winning record.
        normal=sum(simulate_fight(fighter('a'),fighter('b'),s)['winner_id']=='a' for s in range(20))
        strong=sum(simulate_fight(fighter('a','Strength'),fighter('b'),s)['winner_id']=='a' for s in range(20))
        self.assertGreater(strong,normal)

if __name__=='__main__': unittest.main()
