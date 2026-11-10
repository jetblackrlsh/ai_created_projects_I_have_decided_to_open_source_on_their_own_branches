#!/usr/bin/env python3
from copy import deepcopy
import json
import random
from pathlib import Path
import unittest
import simulate_world as engine
from story_setup import validate_scenario,init_story,tick_story,track

class Always(random.Random):
    def random(self):return 0.0

SCENARIO={'characters':[{'key':'a','name':'Aurora','powers':['Ice'],'age':22,'main_character':True},
                        {'key':'b','name':'Granite','powers':['Strength'],'age':24,'main_character':True}],
          'rivalries':[{'a':'a','b':'b','intensity':1,'interval':1}]}

def agents():
    return {i:{'id':i,'name':str(i),'age':25,'alive':True,'role':'citizen','power':None,
               'energy':100,'injury':0,'children':[],'spouse':None} for i in range(1,5)}

class StoryTests(unittest.TestCase):
    def test_configured_rivals_generate_actual_traceable_encounters(self):
        a=agents();s=init_story(a,validate_scenario(SCENARIO,engine.POWER_TREE))
        before=deepcopy(a);events=tick_story(s,a,Always(1),1)
        self.assertEqual(a,before)  # no explicit consequence permission
        self.assertEqual(len(s['encounters']),1);self.assertTrue(events)
        self.assertTrue(s['encounters'][0]['result']['trace'])
        self.assertFalse(s['encounters'][0]['committed'])
        self.assertEqual(a[1]['rival_ids'],[2]);self.assertEqual(a[2]['rival_ids'],[1])
        self.assertEqual(s['main_characters']['1']['encounter_ids'],[1])
        self.assertEqual([x['year'] for x in s['main_characters']['1']['timeline']],[0,1])
        self.assertEqual(tick_story(s,a,Always(1),1),[])

    def test_explicit_commit_is_bounded_nonlethal_and_preserves_powers(self):
        cfg=deepcopy(SCENARIO);cfg['encounters']={'commit_consequences':True}
        a=agents();s=init_story(a,validate_scenario(cfg,engine.POWER_TREE))
        tick_story(s,a,Always(1),1)
        for i in (1,2):
            self.assertTrue(a[i]['alive']);self.assertLessEqual(a[i]['injury'],.75)
            self.assertGreaterEqual(a[i]['energy'],0);self.assertEqual(a[i]['power_xp'],1)
        self.assertEqual(a[1]['powers'],['Ice']);self.assertEqual(a[2]['powers'],['Strength'])
        self.assertEqual(len(s['encounters'][0]['consequences']),2)

    def test_tournament_reserves_entrants_and_has_a_real_bracket(self):
        cfg=deepcopy(SCENARIO);cfg['tournaments']=[{'year':1,'entrants':['a','b',3,4]}]
        a=agents();s=init_story(a,validate_scenario(cfg,engine.POWER_TREE))
        tick_story(s,a,Always(1),1)
        self.assertEqual(len(s['encounters']),1)
        self.assertEqual(s['encounters'][0]['kind'],'tournament')
        self.assertEqual(len(s['encounters'][0]['result']['matches']),3)
        self.assertTrue(s['tournaments'][0]['completed'])

    def test_death_revival_and_unavailability_do_not_grant_plot_armor(self):
        a=agents();s=init_story(a,validate_scenario(SCENARIO,engine.POWER_TREE))
        a[1].update(alive=False,death_year=1,death_cause='test')
        tick_story(s,a,Always(1),1)
        self.assertFalse(s['main_characters']['1']['timeline'][-1]['alive'])
        self.assertFalse(s['encounters'])
        a[1].update(alive=True,death_year=None,death_cause=None,resurrections=1)
        a[2]['hospitalized_until']=2
        tick_story(s,a,Always(1),2);self.assertFalse(s['encounters'])
        tick_story(s,a,Always(1),3);self.assertEqual(len(s['encounters']),1)
        self.assertEqual(s['main_characters']['1']['timeline'][-1]['resurrections'],1)

    def test_json_roundtrip_preserves_pending_schedule_and_rng(self):
        a=agents();cfg=validate_scenario(SCENARIO,engine.POWER_TREE);story=init_story(a,cfg);rng=random.Random(42)
        tick_story(story,a,rng,1)
        a2={int(k):v for k,v in json.loads(json.dumps(a)).items()};s2=json.loads(json.dumps(story));r2=random.Random();r2.setstate(rng.getstate())
        for year in range(2,10):tick_story(story,a,rng,year);tick_story(s2,a2,r2,year)
        self.assertEqual(story,s2);self.assertEqual(a,a2)

    def test_validation_rejects_bad_powers_refs_and_names(self):
        cases=[{'characters':[{'key':'a','powers':['NoSuchPower']}]},
               {'characters':[{'key':'a','powers':['Luck','Fortune']}]},
               {'rivalries':[{'a':1,'b':1}]},
               {'tournaments':[{'year':1,'name':{},'entrants':[1,2]}]},
               {'encounters':{'max_rounds':201}}, {'characters':[{'key':'x','traits':{'greed':float('nan')}}]}]
        for cfg in cases:
            with self.subTest(cfg=cfg):
                with self.assertRaises(ValueError):validate_scenario(cfg,engine.POWER_TREE)
        with self.assertRaises(ValueError):init_story(agents(),validate_scenario({'main_characters':['missing']},engine.POWER_TREE))

    def test_explicit_ids_are_reserved_and_tracking_can_refresh_same_year(self):
        cfg={'characters':[{'key':'a','powers':[],'main_character':True},{'key':'b','id':1,'powers':[]}]}
        a=agents();s=init_story(a,validate_scenario(cfg,engine.POWER_TREE))
        self.assertEqual(s['keys'],{'a':2,'b':1})
        a[2]['injury']=.2;track(s,a,0,replace_current=True)
        self.assertEqual(len(s['main_characters']['2']['timeline']),1)
        self.assertEqual(s['main_characters']['2']['timeline'][0]['injury'],.2)

if __name__=='__main__':unittest.main(verbosity=2)
