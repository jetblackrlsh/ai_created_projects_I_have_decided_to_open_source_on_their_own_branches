#!/usr/bin/env python3
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT=Path(__file__).with_name('simulate_world.py')
SCENARIO=Path(__file__).parents[1]/'assets/scenarios/rivals-and-main-characters.json'

class ArenaIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
    def cli(self,name,*args,ok=True):
        out=self.root/(name+'.json');report=self.root/(name+'.md')
        r=subprocess.run([sys.executable,str(SCRIPT),*map(str,args),'--output-json',str(out),'--output-report',str(report)],capture_output=True,text=True)
        if not ok:self.assertNotEqual(r.returncode,0);return r
        self.assertEqual(r.returncode,0,r.stderr);self.assertTrue(report.read_text())
        return json.loads(out.read_text())
    def test_scenario_replays_all_individual_modes_exactly(self):
        for mode in ('evolution','monarch','wheel','modern'):
            with self.subTest(mode=mode):
                base=['--mode',mode,'--scenario',SCENARIO,'--runs',1,'--years',12,'--pop',30]
                full=self.cli(mode+'full',*base)
                state=self.root/(mode+'save.json')
                self.cli(mode+'first',*base,'--checkpoint-year',4,'--save-state',state)
                saved=json.loads(state.read_text());self.assertEqual(saved['schema_version'],4)
                self.assertIsInstance(saved['config']['scenario'],dict)
                resumed=self.cli(mode+'resumed','--load-state',state)
                self.assertEqual(full,resumed)
                tracked=full['featured_world']['story']['main_characters']
                self.assertEqual(len(tracked),2)
                for record in tracked.values():self.assertEqual([x['year'] for x in record['timeline']],list(range(13)))
                tournaments=[x for x in full['featured_world']['story']['encounters'] if x['kind']=='tournament']
                self.assertEqual(len(tournaments),1)
    def test_standalone_duels_and_tournaments_are_detached_and_seeded(self):
        first=self.cli('duels','--mode','duel','--scenario',SCENARIO,'--runs',10,'--max-rounds',12)
        repeated=self.cli('duels2','--mode','duel','--scenario',SCENARIO,'--runs',10,'--max-rounds',12)
        self.assertEqual(first,repeated);self.assertFalse(first['world_committed'])
        self.assertEqual(sum(first['aggregate_stats']['wins_or_championships'].values())+first['aggregate_stats']['draws'],10)
        tour=self.cli('tour','--mode','tournament','--scenario',SCENARIO,'--runs',3)
        self.assertEqual(sum(tour['aggregate_stats']['wins_or_championships'].values()),3)
        self.assertEqual(len(tour['featured_world']['result']['matches']),3)
    def test_saved_world_bout_does_not_change_source_and_explicit_commit_resumes(self):
        state=self.root/'world.json'
        self.cli('world','--mode','evolution','--scenario',SCENARIO,'--runs',1,'--years',12,'--checkpoint-year',1,'--pop',30,'--save-state',state)
        before=state.read_bytes()
        result=self.cli('detached','--mode','duel','--load-state',state,'--fighter-a','aurora','--fighter-b','granite','--runs',1)
        self.assertFalse(result['world_committed']);self.assertEqual(state.read_bytes(),before)
        committed=self.root/'committed.json'
        r=self.cli('commit','--mode','duel','--load-state',state,'--fighter-a','aurora','--fighter-b','granite','--runs',1,'--commit-results','--save-state',committed)
        self.assertTrue(r['world_committed']);self.assertEqual(len(r['world_changes']),2)
        new=json.loads(committed.read_text());old=json.loads(before)
        self.assertEqual(new['state']['year'],old['state']['year'])
        self.assertEqual(new['state']['rng_state'],old['state']['rng_state'])
        self.assertEqual(new['config']['mode'],'evolution')
        self.assertEqual(state.read_bytes(),before)
        resumed=self.cli('continued','--load-state',committed,'--checkpoint-year',2)
        self.assertEqual(resumed['years'],2)
        self.assertTrue(any(e['kind']=='manual_duel' for e in resumed['featured_world']['story']['encounters']))
    def test_invalid_options_and_unresolved_references_fail_before_output(self):
        self.cli('badversus','--mode','versus','--scenario',SCENARIO,'--runs',1,ok=False)
        self.cli('badcommit','--mode','duel','--scenario',SCENARIO,'--runs',1,'--commit-results',ok=False)
        self.cli('badsave','--mode','duel','--scenario',SCENARIO,'--runs',1,'--save-state',self.root/'fakeworld.json',ok=False)
        self.cli('badref','--mode','duel','--scenario',SCENARIO,'--fighter-a','missing','--fighter-b','granite',ok=False)
        bad=self.root/'bad.json';bad.write_text(json.dumps({'main_characters':[999]}))
        self.cli('badworld','--mode','modern','--scenario',bad,'--runs',1,'--pop',30,'--years',2,ok=False)
    def test_legacy_full_save_has_no_scenario_reset_or_required_new_field(self):
        state=self.root/'legacy.json'
        self.cli('legacyfirst','--mode','monarch','--runs',1,'--years',10,'--checkpoint-year',3,'--pop',30,'--save-state',state)
        data=json.loads(state.read_text());data['schema_version']=3;data['config'].pop('scenario',None);data['state'].pop('story',None)
        state.write_text(json.dumps(data))
        resumed=self.cli('legacyresume','--load-state',state)
        self.assertIsNone(resumed['featured_world']['story']);self.assertEqual(resumed['featured_world']['engine_version'],4)

if __name__=='__main__':unittest.main(verbosity=2)
