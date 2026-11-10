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
        self.assertEqual(len(POWER_PROFILES),62)

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

    def test_per_power_potency_and_detached_migration(self):
        a=fighter('a','Strength',powers=['Strength','Fire'],mastery_level=5,
                  power_mastery={'Strength':{'xp':50,'level':5,'last_use_year':0,'uses_total':50,'acquired_year':0},
                                 'Fire':{'xp':0,'level':0,'last_use_year':0,'uses_total':0,'acquired_year':0}})
        before=copy.deepcopy(a)
        result=simulate_fight(a,fighter('b','Durability'),seed=2,max_rounds=2)
        actions=[row for row in result['trace'] if row['actor_id']=='a']
        self.assertEqual([(row['power'],row['action_mastery']) for row in actions],[('Strength',5),('Fire',0)])
        self.assertEqual(a,before)
        expert=copy.deepcopy(a);expert['power_mastery']['Fire'].update(xp=50,level=5)
        def target_vigor(source,seed):
            return simulate_fight(source,fighter('b','Durability'),seed=seed,max_rounds=2)['final_state'][1]['vigor']
        self.assertLess(sum(target_vigor(expert,s) for s in range(20)),sum(target_vigor(a,s) for s in range(20)))
    def test_single_power_legacy_arena_migration(self):
        old=fighter('a','Fire',mastery_level=3,power_xp=30)
        original=copy.deepcopy(old)
        result=simulate_fight(old,fighter('b'),seed=9,max_rounds=1)
        self.assertEqual(result['starting_state'][0]['power_levels']['Fire'],3)
        self.assertEqual(next(row for row in result['trace'] if row['actor_id']=='a')['action_mastery'],3)
        self.assertEqual(old,original)
    def test_siphon_copy_uses_caster_technique_level(self):
        a=fighter('a','Siphon',mastery_level=1,power_xp=10)
        b=fighter('b','Fire',mastery_level=5,power_xp=50)
        result=simulate_fight(a,b,seed=1,max_rounds=1)
        row=next(row for row in result['trace'] if row['actor_id']=='a')
        self.assertEqual(row['action_mastery'],1)
        self.assertEqual(result['final_state'][0]['copied'],'Fire')
        self.assertEqual(result['final_state'][0]['power_levels'],{'Siphon':1})

if __name__=='__main__': unittest.main()
