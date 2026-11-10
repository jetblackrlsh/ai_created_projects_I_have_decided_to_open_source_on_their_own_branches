#!/usr/bin/env python3
import json
import random
import unittest
import simulate_world as engine
from power_effects import POWER_EFFECTS
from expanded_powers import set_powers,has_power
from test_power_effects import fixture

class ChooseSiphon(random.Random):
    def choice(self,seq):
        if 'Siphon' in seq:return 'Siphon'
        return seq[0]

class CatalogIntegrationTests(unittest.TestCase):
    def test_catalog_is_complete_and_alias_not_duplicated(self):
        self.assertEqual(len(engine.POWER_TREE),53)
        self.assertEqual(set(engine.POWER_TREE),set(POWER_EFFECTS))
        self.assertNotIn('Luck',engine.POWER_TREE)
        self.assertIn('Fortune',engine.POWER_TREE)

    def test_secondary_siphon_wrapper_preserves_primary_and_accounts_action(self):
        w=fixture('Fire');w.rng=ChooseSiphon(42)
        set_powers(w.agents[1],['Fire','Siphon']);set_powers(w.agents[2],['Ice'])
        self.assertTrue(w.activate(w.agents[1]))
        self.assertEqual(w.agents[1]['power'],'Fire')
        self.assertTrue(has_power(w.agents[1],'Ice'))
        self.assertFalse(has_power(w.agents[2],'Ice'))
        self.assertEqual(w.state['usage']['Siphon'],1)
        self.assertEqual(w.events[-1]['power'],'Siphon')
        self.assertEqual(w.agents[1]['power_xp'],1)
        self.assertNotIn('_active_power',w.agents[1])
        restored=json.loads(json.dumps(w.agents[1]))
        self.assertTrue(has_power(restored,'Ice'))

    def test_combined_immortality_preserves_aging_contract(self):
        full=engine.run_single_world_evolution_or_monarch_or_wheel('monarch',42,10,10,.1,.35,total_years=100)
        state=json.loads(json.dumps(full['_state']))
        a=state['variables']['agents']['1'];set_powers(a,['Giant Size','Immortal'])
        a['age']=10000;a['alive']=True;state['terminal']=False
        resumed=engine.run_single_world_evolution_or_monarch_or_wheel('monarch',42,11,10,.1,.35,resume_state=state,total_years=100)
        self.assertTrue(resumed['agents'][1]['alive'])
        self.assertTrue(has_power(resumed['agents'][1],'Immortal'))

if __name__=='__main__':unittest.main(verbosity=2)
