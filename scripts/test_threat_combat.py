import unittest
from copy import deepcopy
from threat_combat import create_state,step_round,defeated,living

class ThreatCombatTests(unittest.TestCase):
    def roster(self):
        return [{'id':'v','team':'villain','powers':['Strength','Durability','Lightning','Time Slowing','Resolve']}, {'id':'a','team':'heroes','powers':['Shadow Blasts','Invisibility','Shadow Clones','Fear Influence','Tactical Analysis']}, {'id':'b','team':'heroes','powers':['Telepathic Link','Telepathy','Flight','Cybernetics','Analytical Vision','Space Adaptation']}]
    def test_determinism_and_input_immutable(self):
        roster=self.roster(); original=deepcopy(roster);a=create_state(roster);b=create_state(list(reversed(roster)))
        for turn in range(1,9):self.assertEqual(step_round(a,9,turn),step_round(b,9,turn))
        self.assertEqual(roster,original)
    def test_team_and_bounded_resources(self):
        s=create_state(self.roster())
        for turn in range(1,50):
            for event in step_round(s,2,turn):
                if event['target_id']:
                    rows={x['id']:x for x in event['before']}
                    self.assertNotEqual(rows[event['actor_id']]['team'],rows[event['target_id']]['team'])
            for f in s['fighters']:
                for k in ('vigor','resolve','energy'):self.assertTrue(0<=f[k]<=100)
        self.assertTrue(defeated(s,'villain') or defeated(s,'heroes'))
    def test_skip_no_attack(self):
        s=create_state(self.roster());events=step_round(s,1,1,{'v':'devastation','a':'rescue'})
        for e in events:
            if e['actor_id'] in ('v','a'):self.assertIsNone(e['power']);self.assertEqual(e['damage'],0)
    def test_stun_prevents_devastation(self):
        s=create_state(self.roster());v=next(f for f in s['fighters'] if f['id']=='v');v['statuses']['stunned']=1
        e=next(e for e in step_round(s,1,1,{'v':'devastation'}) if e['actor_id']=='v')
        self.assertEqual(e['action'],'stunned')
    def test_independent_mastery(self):
        r=self.roster();r[0]['power_mastery']={'Strength':{'xp':40,'level':4,'uses':0,'last_use_year':0}}
        # Proper skill configure API fills state; independent levels survive.
        from power_mastery import configure_mastery
        configure_mastery(r[0],{'Strength':4,'Durability':1},0)
        s=create_state(r);v=next(f for f in s['fighters'] if f['id']=='v')
        self.assertEqual(v['power_levels']['Strength'],4);self.assertEqual(v['power_levels']['Durability'],1)
    def test_team_link_real_effect(self):
        s=create_state(self.roster());ev=step_round(s,7,1)
        b=next(e for e in ev if e['actor_id']=='b')
        self.assertIn('coordinated ally a',b['notes'])
    def test_no_defender_control(self):
        s=create_state([self.roster()[0]])
        for t in range(1,40):
            ev=step_round(s,9,t,{'v':'devastation'})
            self.assertEqual(len(ev),1);self.assertEqual(ev[0]['action'],'devastation')
        s['fighters'][0]['energy']=0
        step_round(s,9,40)
        self.assertEqual(s['fighters'][0]['energy'],3)
    def test_validation(self):
        with self.assertRaises(ValueError):create_state(self.roster()+[self.roster()[0]])
        s=create_state(self.roster())
        with self.assertRaises(ValueError):step_round(s,0,2)
        with self.assertRaises(ValueError):step_round(s,0,1,{'unknown':'x'})

if __name__=='__main__':unittest.main()
