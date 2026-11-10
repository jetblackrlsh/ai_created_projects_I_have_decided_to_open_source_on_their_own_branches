"""Concrete actions, bounded effects and arena coverage for expanded builds."""
import copy
import random
import unittest
from expanded_powers import activate_expanded, set_powers, canonical_power, powers_of
from power_effects import WorldPowers
from combat_sim import simulate_fight, POWER_PROFILES
from test_expanded_powers import fixture, person

NEW = ['Shadow Blasts','Fear Influence','Shadow Clones','Cybernetics','Analytical Vision','Space Adaptation','Tactical Analysis','Resolve','Telepathic Link']

def cloning_factory(w):
    def create(year, age, power, last_name):
        a=person(max(w.agents)+1,power)
        a['age']=age
        w.agents[a['id']]=a
        return a
    w.create_agent=create
    return w

class BuildPowerTests(unittest.TestCase):
    def test_catalog_profiles_and_actual_actions(self):
        for p in NEW:
            with self.subTest(p=p):
                w=cloning_factory(fixture(p)); a=w.agents[1]
                before=copy.deepcopy((w.agents,w.state))
                self.assertTrue(activate_expanded(w,a,w.agents[2])[0])
                self.assertNotEqual(before,(w.agents,w.state))
                self.assertIn(p,POWER_PROFILES)

    def test_explicit_damage_and_ward(self):
        w=fixture('Shadow Blasts'); a,b=w.agents[1],w.agents[2]
        start=b['injury']; self.assertTrue(w.activate(a)); self.assertGreater(b['injury'],start)
        w=fixture('Shadow Blasts'); a,b=w.agents[1],w.agents[2];b['ward_charges']=1
        start=b['injury']; self.assertFalse(w.activate(a)); self.assertEqual(start,b['injury']);self.assertEqual(b['ward_charges'],0)

    def test_fear_and_resolve_change_eligibility(self):
        w=fixture('Fear Influence');a,b=w.agents[1],w.agents[2]
        self.assertTrue(w.activate(a));self.assertFalse(w.can_act(b))
        set_powers(b,['Resolve']);self.assertTrue(w.can_act(b));self.assertTrue(w.activate(b))
        self.assertEqual(b['frightened_until'],0)
        w.activated_this_year.clear();a['power_ready_year']=0
        self.assertFalse(w.activate(a));self.assertEqual(b['frightened_until'],0)

    def test_clone_has_full_repertoire_but_no_recursion(self):
        w=cloning_factory(fixture('Shadow Clones'));a=w.agents[1]
        set_powers(a,['Shadow Clones','Fire','Flight','Strength','Healing'])
        self.assertTrue(activate_expanded(w,a,w.agents[2])[0]);clone=w.agents[4]
        self.assertEqual(powers_of(clone),powers_of(a));self.assertEqual(clone['clone_of'],1)
        self.assertFalse(activate_expanded(w,clone,w.agents[2])[0]);self.assertEqual(len(w.agents),4)
        self.assertEqual(clone['clone_expires'],13)
        w.year=13
        if clone['clone_expires']<=w.year:w.kill(clone,'clone dissolution')
        self.assertFalse(clone['alive'])

    def test_supply_gate_and_mastery_scaling(self):
        for p in ['Cybernetics','Space Adaptation']:
            w=fixture(p);w.r['materials']=0;before=copy.deepcopy((w.agents,w.r))
            self.assertFalse(activate_expanded(w,w.agents[1],w.agents[2])[0]);self.assertEqual(before,(w.agents,w.r))
        w=fixture('Space Adaptation');before=w.r['materials']
        activate_expanded(w,w.agents[1],w.agents[2]);self.assertEqual(w.r['materials']-before,3)
        self.assertTrue(w.agents[1]['last_space_mission']['returned'])

    def test_scans_and_links_are_actual_state(self):
        w=fixture('Analytical Vision');b=w.agents[2];b['hidden_until']=20
        activate_expanded(w,w.agents[1],b);self.assertEqual(b['hidden_until'],0)
        self.assertEqual(w.agents[1]['last_scan']['powers'],['Fire'])
        w=fixture('Telepathic Link');activate_expanded(w,w.agents[1],w.agents[2])
        self.assertEqual(w.agents[1]['mental_link']['partner_id'],3)
        self.assertGreater(w.combat_multiplier(w.agents[1]),1-w.agents[1]['injury']*.65)
        w.living=[w.agents[1],w.agents[2]]
        self.assertFalse(activate_expanded(w,w.agents[1],w.agents[2])[0])

    def test_aliases_and_arena_determinism(self):
        for alias,power in [('Super Strength','Strength'),('Shadow Blending','Invisibility'),('Combat Virtue','Resolve')]:
            self.assertEqual(canonical_power(alias),power)
        for p in NEW:
            a,b=person(1,p),person(2,'Fire','villain')
            before=copy.deepcopy((a,b));r=simulate_fight(a,b,seed=33)
            self.assertEqual(r,simulate_fight(a,b,seed=33));self.assertEqual(before,(a,b))
            self.assertTrue(any(x['power']==p for x in r['trace']))

if __name__=='__main__':unittest.main()
