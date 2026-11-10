import unittest,json
from copy import deepcopy
from stat_modifiers import *


def effect(path='energy',value=10,**kwargs):return dict(path=path,operation='add',value=value,duration=2,**kwargs)
def agent(i=1,**kwargs):return dict(id=i,energy=50.,alive=True,location='A',morality=.8,**kwargs)
def ability(**kwargs):return dict(id='boost',scope='self',effect=effect(),**kwargs)

class StatModifierTests(unittest.TestCase):
    def test_expiry_preserves_damage(self):
        a=agent();apply_modifier(a,effect(),1,2,'a');a['energy']-=7
        expire_modifiers(a,2);self.assertEqual(a['energy'],53)
        expire_modifiers(a,3);self.assertEqual(a['energy'],43)
    def test_actual_delta_clipping(self):
        a=agent();a['energy']=95
        self.assertEqual(apply_modifier(a,effect(),0,2,'a')['delta'],5)
        expire_modifiers(a,2);self.assertEqual(a['energy'],95)
    def test_clipping_loss_explicit(self):
        a=agent();apply_modifier(a,effect(),0,2,'a');a['energy']=0
        expire_modifiers(a,2);self.assertEqual(a['energy'],0)
    def test_replace_refresh_stack(self):
        a=agent();s=effect(stack_key='x')
        apply_modifier(a,s,0,1,'a');apply_modifier(a,s,1,2,'b');self.assertEqual(a['energy'],60)
        s['stacking']='refresh';apply_modifier(a,s,2,1,'c');self.assertEqual(a['energy'],60)
        expire_modifiers(a,3);self.assertEqual(a['energy'],60)
        expire_modifiers(a,4);self.assertEqual(a['energy'],50)
        s['stacking']='stack';s['max_stacks']=2
        apply_modifier(a,s,5,1,'d');apply_modifier(a,s,5,2,'e')
        self.assertFalse(apply_modifier(a,s,5,3,'f')['applied']);self.assertEqual(a['energy'],70)
    def test_snapshot_multiply_set(self):
        a=agent();s=effect();s.update(operation='multiply',value=1.5)
        apply_modifier(a,s,0,1,'x');self.assertEqual(a['energy'],75)
        a['energy']-=10;expire_modifiers(a,2);self.assertEqual(a['energy'],40)
        s.update(operation='set',value=20);apply_modifier(a,s,3,1,'y');expire_modifiers(a,5);self.assertEqual(a['energy'],40)
    def test_invalid_paths_and_values(self):
        for p in ['id','alive','birth_year','role','power_xp','mastery_level','app_score','power_mastery.X.level','statuses.stunned','__class__']:
            with self.assertRaises(ValueError):validate_effect(effect(p))
        for v in [True,float('nan'),float('inf')]:
            with self.assertRaises(ValueError):validate_effect(effect(value=v))
    def test_power_level_existing_only(self):
        a=agent(powers=['Strength'],power_levels={'Strength':2})
        apply_modifier(a,effect('power_levels.Strength',2),0,1,'a');self.assertEqual(a['power_levels']['Strength'],4)
        with self.assertRaises(ValueError):apply_modifier(a,effect('power_levels.Speed',2),0,1,'b')
        a['powers']=[];expire_modifiers(a,2);self.assertEqual(active_modifiers(a),[]);self.assertEqual(a['power_levels']['Strength'],2);self.assertEqual(a['powers'],[])
    def test_power_xp_sync(self):
        from power_mastery import ensure_mastery
        a=agent(powers=['Strength']);ensure_mastery(a)
        apply_modifier(a,effect('power_mastery.Strength.xp',20),0,1,'a');self.assertEqual(a['mastery_level'],2)
        a['power_mastery']['Strength']['xp']+=3;expire_modifiers(a,2)
        self.assertEqual(a['power_mastery']['Strength']['xp'],3);self.assertEqual(a['mastery_level'],0)
    def test_age_birth_year(self):
        a=agent(age=30,birth_year=-30);apply_modifier(a,effect('age',-5),0,1,'a')
        self.assertEqual((a['age'],a['birth_year']),(25,-25))
        a['age']+=2;expire_modifiers(a,2);self.assertEqual((a['age'],a['birth_year']),(32,-30))
    def test_combat_offsets(self):
        a=agent(vigor=100,resolve=100,power_levels={});apply_modifier(a,effect('combat_stats.damage',20),0,1,'a')
        self.assertEqual(a['combat_stats']['damage'],20);expire_modifiers(a,2);self.assertEqual(a['combat_stats']['damage'],0)
    def test_annual_cannot_receive_combat_offset(self):
        a=agent(stat_powers=[dict(id='fake',effect=effect('combat_stats.damage',20))])
        with self.assertRaises(ValueError):apply_modifier(a,effect('combat_stats.damage',20),0,1,'a')
        self.assertIsNone(stat_power_action(a,[a],0))
        self.assertNotIn('combat_stats',a)
    def test_cooldown_cost_and_idempotence(self):
        a=agent(stat_powers=[ability()]);e=stat_power_action(a,[a],0)
        self.assertEqual(a['energy'],50);self.assertEqual(e['targets'][0]['delta'],10)
        self.assertIsNone(stat_power_action(a,[a],0));self.assertIsNone(stat_power_action(a,[a],1))
        expire_modifiers(a,2);self.assertEqual(a['energy'],40)
        self.assertIsNotNone(stat_power_action(a,[a],3))
    def test_local_scope_and_relations(self):
        a=agent(1,team='a');b=agent(2,team='a');c=agent(3,team='b');d=agent(4,team='b');d['location']='B'
        self.assertEqual([t['id'] for t in select_targets(a,[d,c,b,a],'local',relation='enemy')],[3])
        self.assertEqual([t['id'] for t in select_targets(a,[d,c,b,a],'other',relation='ally')],[2])
        del a['location'];self.assertEqual(select_targets(a,[a,b,c],'local'),[])
    def test_area_cost_once_and_limits(self):
        a=agent(1);b=agent(2);c=agent(3)
        a['stat_powers']=[dict(id='aura',scope='local',target_limit=2,effect=effect('morality',-.1))]
        e=stat_power_action(a,[c,b,a],1);self.assertEqual(len(e['targets']),2);self.assertEqual(a['energy'],40)
        self.assertAlmostEqual(b['morality'],.7);self.assertEqual(c['morality'],.8)
    def test_no_targets_no_cost(self):
        a=agent(stat_powers=[dict(id='other',scope='other',effect=effect())]);self.assertIsNone(stat_power_action(a,[a],0));self.assertEqual(a['energy'],50)
    def test_save_resume(self):
        a=agent(stat_powers=[ability()]);stat_power_action(a,[a],0);b=json.loads(json.dumps(a))
        for t in range(1,10):
            expire_modifiers(a,t);expire_modifiers(b,t);self.assertEqual(stat_power_action(a,[a],t),stat_power_action(b,[b],t))
        self.assertEqual(a,b)
    def test_invalid_ability_schema(self):
        with self.assertRaises(ValueError):validate_stat_powers([dict(id='x',scope='planet',effect=effect())])
        with self.assertRaises(ValueError):validate_stat_powers([ability(),ability()])
    def test_time_reversal(self):
        a=agent();apply_modifier(a,effect(),4,1,'a')
        with self.assertRaises(ValueError):expire_modifiers(a,3)
    def test_active_cap(self):
        a=agent()
        for i in range(128):apply_modifier(a,effect(stack_key=str(i)),0,1,str(i))
        self.assertFalse(apply_modifier(a,effect(stack_key='last'),0,1,'last')['applied'])
    def test_no_revive_or_identity_mutation(self):
        a=agent();a['alive']=False;a['stat_powers']=[ability()]
        self.assertIsNone(stat_power_action(a,[a],0));self.assertEqual(a['id'],1)
    def test_duplicate_effect_no_extra_delta(self):
        a=agent();apply_modifier(a,effect(),0,1,'x');self.assertFalse(apply_modifier(a,effect(),0,1,'x')['applied']);self.assertEqual(a['energy'],60)

if __name__=='__main__':unittest.main()
