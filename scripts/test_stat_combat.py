import copy,json,unittest,subprocess,sys,tempfile
from pathlib import Path
from combat_sim import simulate_fight,_profile
from threat_combat import create_state,step_round
from threat_campaign import run


def ability(path,value,scope='self',**kw):
    out={'id':'alter','scope':scope,'energy_cost':10,'cooldown':4,'effect':{'path':path,'operation':'add','value':value,'duration':2,'stacking':'replace','stack_key':'alter'}}
    out.update(kw);return out

def fighter(id,**kw):
    return dict(id=id,powers=['Strength'],**kw)

class StatCombatTests(unittest.TestCase):
    def test_profile_offsets_live(self):
        f={'powers':['Strength'],'energy':100,'statuses':{},'combat_stats':{'damage':15,'accuracy':.2,'initiative':12}}
        p,stats=_profile(f,1)
        self.assertEqual(stats['damage'],40);self.assertEqual(stats['accuracy'],.2);self.assertEqual(stats['initiative'],12)
    def test_cast_costs_action(self):
        a=fighter('a',stat_powers=[ability('combat_stats.damage',20)])
        result=simulate_fight(a,fighter('b'),seed=7,max_rounds=3)
        first=next(t for t in result['trace'] if t['actor_id']=='a')
        self.assertIsNone(first['power']);self.assertTrue(first['notes'])
        self.assertEqual(a['stat_powers'][0]['effect']['value'],20)
        self.assertNotIn('combat_stats',a)
    def test_enemy_resource_effect(self):
        s=create_state([fighter('a',team='heroes',stat_powers=[ability('energy',-80,'other',target_id='b')]),fighter('b',team='threat')])
        trace=step_round(s,1,1)
        self.assertTrue(any(x['action']=='stat_power' for x in trace))
        self.assertLess(next(f for f in s['fighters'] if f['id']=='b')['energy'],30)
    def test_local_hits_only_encounter(self):
        s=create_state([fighter('a',team='heroes',stat_powers=[ability('guard',15,'local',relation='ally')]),fighter('b',team='heroes'),fighter('c',team='threat')])
        trace=step_round(s,3,1)
        cast=next(x for x in trace if x['action']=='stat_power')
        targets=cast['notes'][0]['targets']
        self.assertEqual({x['target_id'] for x in targets},{'a','b'})
        self.assertTrue(all(x['delta']==15 for x in targets))
    def test_campaign_save_resume(self):
        c={'fighters':[fighter('a',team='heroes',stat_powers=[ability('power_levels.Strength',2)]),fighter('b',team='threat')],'world':{'initial_alert':True,'horizon':20},'rules':{'travel_steps':0}}
        whole=run(c,seed=13);partial=run(c,seed=13,stop_at=2)
        self.assertEqual(whole,run(state=json.loads(json.dumps(partial))))
    def test_arena_cli_custom_stats(self):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d);scenario={'characters':[{'key':'a','powers':['Strength'],'stat_powers':[ability('combat_stats.damage',20)]},{'key':'b','powers':['Strength']}]}
            (d/'scenario.json').write_text(json.dumps(scenario))
            script=Path(__file__).with_name('simulate_world.py')
            result=subprocess.run([sys.executable,str(script),'--mode','duel','--scenario',str(d/'scenario.json'),'--fighter-a','a','--fighter-b','b','--runs','1','--output-json',str(d/'result.json'),'--output-report',str(d/'report.md')],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            self.assertIn('stat_power',(d/'report.md').read_text())
    def test_bad_path_rejected(self):
        with self.assertRaises(ValueError):simulate_fight(fighter('a',stat_powers=[ability('id',10)]),fighter('b'))
    def test_social_stat_live(self):
        s=create_state([fighter('a',team='heroes',persuasiveness=.2,stat_powers=[ability('persuasiveness',.7)]),fighter('b',team='threat')])
        step_round(s,1,1)
        self.assertAlmostEqual(s['fighters'][0]['persuasiveness'],.9)

if __name__=='__main__':unittest.main()
