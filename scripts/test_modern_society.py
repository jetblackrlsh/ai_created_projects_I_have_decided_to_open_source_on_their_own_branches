#!/usr/bin/env python3
"""Original society/mastery mechanics: causal tests and deterministic roundtrips."""
import copy
import json
from pathlib import Path
import random
import subprocess
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).parent))
import modern_society as m
import simulate_world as engine
from test_power_effects import fixture


class ModernTests(unittest.TestCase):
    def test_mastery_is_earned_and_changes_cost_and_effect(self):
        novice=fixture('Fire'); expert=fixture('Fire')
        expert.agents[1]['mastery_level']=5;expert.agents[1]['power_xp']=50
        novice.activate(novice.agents[1]);expert.activate(expert.agents[1])
        self.assertGreater(expert.agents[2]['injury'],novice.agents[2]['injury'])
        self.assertGreater(expert.agents[1]['energy'],novice.agents[1]['energy'])
        self.assertLess(expert.agents[1]['power_ready_year'],novice.agents[1]['power_ready_year'])
        w=fixture('Earth')
        for i in range(10):
            w.year=10+i*3;w.agents[1]['energy']=100;w.activated_this_year.clear()
            self.assertTrue(w.activate(w.agents[1]))
        self.assertEqual(w.agents[1]['power_xp'],10)
        self.assertEqual(w.agents[1]['mastery_level'],1)
        w=fixture('Healing');w.agents[1]['injury']=0;w.agents[3]['injury']=0
        self.assertFalse(w.activate(w.agents[1]));self.assertEqual(w.agents[1]['power_xp'],0)

    def test_disuse_decay_and_public_rank_labels(self):
        w=fixture('Earth');a=w.agents[1]
        a.update(power_xp=20,mastery_level=2,power_uses_total=20,last_power_use_year=1,power_ready_year=1000)
        w.begin_year(11,w.create_agent,w.towns,[],[])
        self.assertEqual(a['power_xp'],15);self.assertEqual(a['mastery_level'],1)
        self.assertEqual(a['power_uses_total'],20)
        self.assertEqual([m.rank_for_score(x) for x in (100,75,60,45,30,15,0)],list('SABCDEF'))
        agents={1:dict(a)};agents[1].update(alive=True,has_phone=True,reputation=100,mastery_level=5,followers=10000)
        state=m.society_state();m.update_rankings(state,agents)
        self.assertEqual(agents[1]['app_rank'],'S')
        state['laws']['ranking_app']=False;m.update_rankings(state,agents)
        self.assertEqual(agents[1]['app_rank'],'Unranked')

    def run_world(self,seed=42,years=40,policy=None,state=None):
        return m.run_modern(seed,years,60,.35,.35,engine.POWER_TREE,engine.pick_power_mutation,
                            policy_override=policy,resume_state=state)

    def test_modern_save_resume_exactly_matches(self):
        full=self.run_world(years=60)
        first=self.run_world(years=20)
        resumed=self.run_world(years=60,state=json.loads(json.dumps(first['_state'])))
        self.assertEqual(json.loads(json.dumps(full)),json.loads(json.dumps(resumed)))
        self.assertTrue(full['government']['elections'])
        self.assertTrue(full['ranking_leaderboard'])
        self.assertTrue(any(a.get('income',0)>0 for a in full['agents'].values()))

    def test_elections_have_real_ballots_and_replacement(self):
        w=self.run_world(years=25)
        for election in w['government']['elections']:
            self.assertEqual(sum(election['votes'].values()),election['eligible_voters'])
            self.assertIn(str(election['winner_id']),election['votes'])
            self.assertGreater(election['eligible_voters'],0)
        self.assertGreater(w['peaceful_transfers'],0)
        self.assertGreater(w['free_elections'],0)

    def test_rights_and_emergency_policy_change_freedom_and_outcomes(self):
        rights=self.run_world(years=50,policy='civil_rights_act')
        emergency=self.run_world(years=50,policy='emergency_powers')
        self.assertGreater(rights['freedom'],emergency['freedom'])
        self.assertGreater(rights['election_integrity'],emergency['election_integrity'])
        self.assertEqual(emergency['society_outcome'],'authoritarian')
        self.assertFalse(emergency['democracy_survived'])

    def test_ranking_changes_opportunity_and_phones_matter(self):
        w=self.run_world(years=1)
        agents={i:copy.deepcopy(a) for i,a in enumerate(list(w['agents'].values())[:3],1)}
        for i,a in agents.items():
            a.update(id=i,age=30,alive=True,imprisoned_until=0,curiosity=.7,compassion=.6,
                     reputation=50,app_score=0,job='unemployed',power='Fire',mastery_level=2,
                     followers=0,has_phone=True,dream='order',power_license=True,quarantined_until=0,hospitalized_until=0)
        agents[3]['reputation']=100;agents[3]['followers']=1000
        state=m.society_state();m.update_rankings(state,agents)
        self.assertGreater(agents[3]['app_score'],agents[1]['app_score'])
        m.employment(state,agents,random.Random(1))
        self.assertEqual(agents[3]['job'],'hero_contractor')
        agents[3]['has_phone']=False;m.update_rankings(state,agents)
        self.assertEqual(agents[3]['app_score'],0)
        state['laws']['ranking_app']=False;m.update_rankings(state,agents)
        self.assertTrue(all(a['app_score']==0 for a in agents.values()))

    def test_media_public_impact_and_free_press(self):
        w=self.run_world(years=1);agents=w['agents'];a=agents[1]
        a.update(role='hero',has_phone=True,reputation=50,followers=0)
        state=m.society_state()
        ev={'actor_id':1,'power':'Healing','true_event':'healed a citizen','secret':False}
        m.media_effects(state,agents,[ev],random.Random(1))
        self.assertGreater(a['reputation'],50);self.assertGreater(a['followers'],0)
        before=a['reputation'];ev['secret']=True;m.media_effects(state,agents,[ev],random.Random(1))
        self.assertEqual(a['reputation'],before)
        state['leader_id']=1;a['greed']=.9;agents[2]['job']='journalist';state['press_freedom']=100
        class Always:
            def random(self):return 0
        self.assertIsNotNone(m.media_effects(state,agents,[],Always()))
        state['laws']['free_press']=False
        self.assertIsNone(m.media_effects(state,agents,[],Always()))

    def test_cli_batch_political_counts_and_checkpoint(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder);script=Path(__file__).with_name('simulate_world.py')
            def cli(name,*args):
                out=base/(name+'.json')
                r=subprocess.run([sys.executable,str(script),*args,'--output-json',str(out),
                                  '--output-report',str(base/(name+'.md'))],capture_output=True,text=True)
                self.assertEqual(r.returncode,0,r.stderr);return json.loads(out.read_text())
            batch=cli('batch','--mode','modern','--runs','4','--years','20','--pop','40')
            agg=batch['aggregate_stats']
            self.assertEqual(sum(agg[k] for k in ('free_democracy_worlds','constrained_democracy_worlds','authoritarian_worlds','extinct_worlds')),4)
            state=base/'save.json'
            cli('first','--mode','modern','--runs','1','--years','40','--checkpoint-year','10','--save-state',str(state))
            resumed=cli('resumed','--load-state',str(state))
            full=cli('full','--mode','modern','--runs','1','--years','40')
            self.assertEqual(full,resumed)

    def test_version_two_save_migrates_without_losing_history(self):
        w=engine.run_single_world_evolution_or_monarch_or_wheel('monarch',42,10,30,.1,.35,total_years=100)
        old=copy.deepcopy(w['_state'])
        old['powers']['version']=2
        for a in old['variables']['agents'].values():
            a.pop('power_xp',None);a.pop('mastery_level',None)
        resumed=engine.run_single_world_evolution_or_monarch_or_wheel('monarch',42,11,30,.1,.35,resume_state=old,total_years=100)
        self.assertEqual(w['chronicle'],resumed['chronicle'][:len(w['chronicle'])])
        self.assertTrue(all('power_xp' in a for a in resumed['agents'].values()))
        self.assertEqual(resumed['engine_version'],4)


if __name__=='__main__': unittest.main(verbosity=2)
