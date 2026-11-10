"""End-to-end scenario initial state, measurement, and checkpoint regressions."""
import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import simulate_world as engine
from modern_society import run_modern
from story_setup import validate_scenario

ROOT=Path(__file__).parents[1]

class CustomizationIntegrationTests(unittest.TestCase):
    def example(self):
        return validate_scenario(json.loads((ROOT/'assets/scenarios/custom-goal-driven-world.json').read_text()),engine.POWER_TREE)
    def run_world(self,scenario,years,state=None):
        return run_modern(2088,years,20,.65,.08,engine.POWER_TREE,engine.pick_power_mutation,resume_state=state,scenario=scenario)
    def test_fresh_custom_actor_and_world_values(self):
        cfg=self.example()
        cfg['characters'][0].update(last_name='Vale',faction='Rescue Union',injury=.3,energy=45,healer_burnout=20,hospitalized_years=2,quarantined_years=1)
        out=self.run_world(cfg,0)
        a=out['agents'][1]
        for field in ('name','last_name','faction','description','injury','energy','healer_burnout','wealth','followers','has_phone','job','income'):
            if field in cfg['characters'][0]:self.assertEqual(a[field],cfg['characters'][0][field],field)
        self.assertEqual(a['hospitalized_until'],2)
        self.assertEqual(a['quarantined_until'],1)
        self.assertEqual(a['goal'],'fame')
        self.assertEqual(a['powers'],['Healing','Flight'])
        self.assertEqual(a['mastery_level'],1)
        for field,value in cfg['world']['resources'].items():self.assertEqual(out['world_resources'][field],value)
        for field,value in cfg['world']['society'].items():self.assertEqual(out['government'][field],value)
        for field,value in cfg['world']['laws'].items():self.assertEqual(out['government']['laws'][field],value)
    def test_measurable_goals_roundtrip_and_exact_resume(self):
        cfg=self.example()
        full=self.run_world(copy.deepcopy(cfg),12)
        first=self.run_world(copy.deepcopy(cfg),4)
        state=json.loads(json.dumps(first['_state']))
        resumed=self.run_world(None,12,state)
        self.assertEqual(json.loads(json.dumps(full)),json.loads(json.dumps(resumed)))
        goals=resumed['story']['goals']
        self.assertEqual(set(goals),{'1','2'})
        for aid,records in goals.items():
            self.assertTrue(records)
            for record in records:
                self.assertIn(record['state']['status'],('pending','active','blocked','completed','failed'))
        for main in resumed['story']['main_characters'].values():
            self.assertTrue(any(row.get('goal_progress') for row in main['timeline']))
    def test_cli_scenario_settings_and_explicit_override(self):
        cfg=self.example();cfg['settings'].update(years=2,pop=8,seed=907)
        with tempfile.TemporaryDirectory() as folder:
            p=Path(folder);scenario=p/'scenario.json';scenario.write_text(json.dumps(cfg))
            def invoke(name,*extra):
                save=p/(name+'.state.json')
                process=subprocess.run([sys.executable,str(ROOT/'scripts/simulate_world.py'),'--scenario',str(scenario),'--runs','1','--save-state',str(save),'--output-json',str(p/(name+'.json')),'--output-report',str(p/(name+'.md')),*extra],capture_output=True,text=True)
                self.assertEqual(process.returncode,0,process.stderr)
                return json.loads(save.read_text())
            automatic=invoke('auto')
            self.assertEqual(automatic['config']['mode'],'modern')
            self.assertEqual(automatic['config']['pop'],8)
            self.assertEqual(automatic['config']['seed'],907)
            self.assertEqual(automatic['state']['year'],2)
            overridden=invoke('override','--years','1','--seed','908')
            self.assertEqual(overridden['state']['year'],1)
            self.assertEqual(overridden['config']['seed'],908)

if __name__=='__main__':unittest.main()
