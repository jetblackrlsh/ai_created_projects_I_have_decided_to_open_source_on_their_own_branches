"""Per-power progression must remain independent across migration and world saves."""
import copy
import json
import unittest
from power_mastery import ensure_mastery,award_use,decay_mastery,level_for,sync_mastery
from expanded_powers import set_powers
from goal_engine import validate_goals,evaluate_goals
from story_setup import validate_scenario,commit_bout
from combat_sim import simulate_fight
import simulate_world as engine
from modern_society import run_modern


def person(power='Fire',powers=None):
    return {'id':1,'name':'Tester','alive':True,'age':25,'power':power,'powers':powers or [power],
            'mastery_level':0,'power_xp':0,'energy':100,'injury':0,'children':[]}

class PowerMasteryTests(unittest.TestCase):
    def test_shared_migration_once_and_no_new_acquisition_boost(self):
        a=person(powers=['Fire','Ice']);a.update(power_xp=25,mastery_level=3)
        ensure_mastery(a,10)
        self.assertEqual([a['power_mastery'][p]['xp'] for p in ('Fire','Ice')],[30,30])
        self.assertIn('Legacy',a['mastery_migration'])
        set_powers(a,['Fire','Ice','Speed']);ensure_mastery(a,11)
        self.assertEqual(a['power_mastery']['Speed']['xp'],0)
        before=copy.deepcopy(a);ensure_mastery(a,11);self.assertEqual(a,before)
    def test_independent_growth_rust_and_decay_idempotence(self):
        a=person(powers=['Fire','Ice']);a.update(power_xp=20,mastery_level=2)
        ensure_mastery(a,0)
        for _ in range(10):award_use(a,'Fire',9)
        self.assertEqual(a['power_mastery']['Fire']['xp'],30)
        self.assertEqual(a['power_mastery']['Ice']['xp'],20)
        self.assertEqual(decay_mastery(a,10),['Ice'])
        self.assertEqual(a['power_mastery']['Ice']['xp'],15)
        before=copy.deepcopy(a);self.assertEqual(decay_mastery(a,10),[]);self.assertEqual(a,before)
        self.assertEqual(a['mastery_level'],3)
    def test_lost_archived_excluded_and_reacquired_own_skill(self):
        a=person(powers=['Fire','Ice']);ensure_mastery(a,0)
        a['power_mastery']['Fire']['xp']=50;a['power_mastery']['Ice']['xp']=10;sync_mastery(a)
        set_powers(a,['Ice']);ensure_mastery(a,1)
        self.assertEqual(a['mastery_level'],1);self.assertEqual(level_for(a,'Fire'),0)
        self.assertEqual(a['power_mastery']['Fire']['xp'],50)
        set_powers(a,['Fire','Ice']);ensure_mastery(a,2)
        self.assertEqual(level_for(a,'Fire'),5);self.assertEqual(level_for(a,'Ice'),1)
    def test_named_goal_pure_and_default_best(self):
        a=person(powers=['Fire','Ice']);ensure_mastery(a)
        a['power_mastery']['Fire']['xp']=50;sync_mastery(a)
        goals=validate_goals([{'type':'reach_mastery','value':4},{'type':'reach_mastery','power':'Ice','value':4}],engine.POWER_TREE)
        before=copy.deepcopy((a,goals))
        out=evaluate_goals(goals,a,{'agents':{1:a}},1)
        self.assertEqual((a,goals),before)
        self.assertEqual(out[0]['state']['status'],'completed')
        self.assertEqual(out[1]['state']['progress'],0)
        old=person();old.update(mastery_level=3,power_xp=30);prior=copy.deepcopy(old)
        self.assertEqual(level_for(old,'Fire'),3);self.assertEqual(old,prior)
    def test_config_named_goal_exact_world_checkpoint(self):
        cfg=validate_scenario({'characters':[{'key':'student','powers':['Fire','Healing'],'age':25,'power_mastery':{'Fire':4,'Healing':0},'main_character':True,'goals':[{'type':'reach_mastery','power':'Healing','value':3}]}]},engine.POWER_TREE)
        def run(years,saved=None):
            return run_modern(411,years,15,.5,.1,engine.POWER_TREE,engine.pick_power_mutation,scenario=cfg if saved is None else None,resume_state=saved)
        zero=run(0)
        self.assertEqual(level_for(zero['agents'][1],'Fire'),4)
        self.assertEqual(level_for(zero['agents'][1],'Healing'),0)
        full=run(10);partial=run(4)
        resumed=run(10,json.loads(json.dumps(partial['_state'])))
        self.assertEqual(json.loads(json.dumps(full)),json.loads(json.dumps(resumed)))
        self.assertEqual(resumed['story']['goals']['1'][0]['power'],'Healing')
    def test_commit_only_used_power_not_unused_secondary(self):
        a=person(powers=['Fire','Ice']);ensure_mastery(a)
        b=person('Durability');b['id']=2;ensure_mastery(b)
        result=simulate_fight(a,b,seed=7,max_rounds=1)
        commit_bout(result,{1:a,2:b},1,{'practice_awards':0})
        self.assertEqual(a['power_mastery']['Fire']['xp'],1)
        self.assertEqual(a['power_mastery']['Ice']['xp'],0)
    def test_refunded_adrenaline_still_is_paid_activation(self):
        a=person('Adrenaline');ensure_mastery(a)
        b=person('Durability');b['id']=2;ensure_mastery(b)
        result=simulate_fight(a,b,seed=7,max_rounds=1)
        event=next(e for e in result['trace'] if e['actor_id']=='1')
        self.assertNotIn('stunned; activation skipped',event['notes'])
        commit_bout(result,{1:a,2:b},1,{'practice_awards':0})
        self.assertEqual(a['power_mastery']['Adrenaline']['xp'],1)

if __name__=='__main__':unittest.main()
