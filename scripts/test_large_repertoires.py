"""Large builds preserve every ability, progression and saved state."""
import copy,json,random,unittest
from expanded_powers import powers_of,set_powers,inherit_powers,MAX_POWERS,INHERITED_POWER_LIMIT
from power_mastery import configure_mastery,award_use,level_for,ensure_mastery
from story_setup import validate_scenario
from simulate_world import POWER_TREE
from modern_society import run_modern
from combat_sim import simulate_fight

class LargeRepertoireTests(unittest.TestCase):
    def names(self):return list(POWER_TREE)[:12]
    def scenario(self):
        p=self.names()
        return validate_scenario({'characters':[{'key':'many','powers':p,'power_mastery':{x:i%6 for i,x in enumerate(p)},'main_character':True},{'key':'other','powers':['Durability']}],'fight':{'a':'many','b':'other'}},POWER_TREE)
    def test_twelve_powers_and_separate_progression(self):
        a={};p=self.names();set_powers(a,p);configure_mastery(a,{x:i%6 for i,x in enumerate(p)},0)
        self.assertEqual(powers_of(a),p)
        before=copy.deepcopy(a['power_mastery']);award_use(a,p[-1],1)
        for power in p[:-1]:self.assertEqual(a['power_mastery'][power],before[power])
        self.assertEqual(a['power_mastery'][p[-1]]['xp'],before[p[-1]]['xp']+1)
    def test_all_catalog_powers_accepted_not_truncated(self):
        a={};set_powers(a,list(POWER_TREE));self.assertEqual(powers_of(a),list(POWER_TREE))
        self.assertLessEqual(len(POWER_TREE),MAX_POWERS)
    def test_over_capacity_rejected(self):
        with self.assertRaises(ValueError):set_powers({},['P'+str(i) for i in range(MAX_POWERS+1)])
        with self.assertRaises(ValueError):powers_of({'powers':['P'+str(i) for i in range(MAX_POWERS+1)]})
        with self.assertRaises(ValueError):validate_scenario({'characters':[{'key':'x','powers':['P'+str(i) for i in range(MAX_POWERS+1)]}]},POWER_TREE)
    def test_arena_preserves_all_powers(self):
        a={'id':'a','powers':self.names()};b={'id':'b','powers':['Durability']}
        result=simulate_fight(a,b,seed=44)
        self.assertEqual(result['starting_state'][0]['powers'],self.names())
        self.assertEqual(a,{'id':'a','powers':self.names()})
    def test_inheritance_stays_bounded(self):
        a={'powers':self.names()};b={'powers':list(POWER_TREE)[12:24]};rng=random.Random(1)
        for i in range(100):self.assertLessEqual(len(inherit_powers(a,b,rng,0,lambda p,r,m:p)),INHERITED_POWER_LIMIT)
    def test_alias_mastery_migrates_without_losing_training(self):
        a={'powers':['Super Strength'],'power_mastery':{'Super Strength':{'xp':40,'last_use_year':2,'uses_total':4,'acquired_year':0}}}
        set_powers(a,a['powers']);ensure_mastery(a,3)
        self.assertEqual(level_for(a,'Strength'),4)
        self.assertEqual(a['power_mastery']['Strength']['uses_total'],4)
        self.assertNotIn('Super Strength',a['power_mastery'])
    def test_world_checkpoint_keeps_large_build(self):
        cfg=self.scenario()
        def run(y,s=None):return run_modern(414,y,12,.2,.05,POWER_TREE,lambda p,r,m:p,resume_state=s,scenario=None if s else copy.deepcopy(cfg))
        fresh=run(0);self.assertEqual(fresh['agents'][1]['powers'],self.names())
        full=run(6);part=run(2);resume=run(6,json.loads(json.dumps(part['_state'])))
        self.assertEqual(json.loads(json.dumps(full)),json.loads(json.dumps(resume)))
if __name__=='__main__':unittest.main()
