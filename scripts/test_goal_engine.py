import copy
import json
import unittest
from goal_engine import *
from combat_sim import SUPPORTED_POWERS

class GoalTests(unittest.TestCase):
    def setUp(self):
        self.a={'id':1,'alive':True,'age':30,'mastery_level':2,'power':'Fire','injury':.4,'children':[2]}
        self.context={'agents':{1:self.a,2:{'id':2,'alive':True,'children':[]}},'story':{'encounters':[]}}
    def goals(self,*records):return resolve_goals(validate_goals(list(records),SUPPORTED_POWERS),{'rival':2},self.context['agents'])
    def test_strict_validation(self):
        for bad in ([{'type':'invented'}],[{'type':'reach_mastery','value':6}],[{'type':'win_duels','count':True}],[{'type':'obtain_power','power':'Unknown'}],[{'type':'reach_age','value':float('nan')}],[{'type':'get_job','job':'invented'}]):
            with self.assertRaises(ValueError):validate_goals(bad,SUPPORTED_POWERS)
    def test_defaults_alias_and_refs(self):
        goals=self.goals({'type':'defeat_character','target':'rival'},{'type':'obtain_power','power':'Luck'})
        self.assertEqual(goals[0]['target_id'],2);self.assertEqual(goals[0]['count'],1)
        self.assertEqual(goals[1]['power'],'Fortune')
    def test_real_progress_and_purity(self):
        goals=self.goals({'type':'reach_mastery','value':3},{'type':'recover_health','value':.1})
        old=copy.deepcopy((goals,self.a,self.context))
        first=evaluate_goals(goals,self.a,self.context,1)
        self.assertEqual((goals,self.a,self.context),old)
        self.assertEqual(first[0]['state']['status'],'active')
        self.a['mastery_level']=3;self.a['injury']=0
        updated=evaluate_goals(first,self.a,self.context,2)
        self.assertTrue(all(g['state']['status']=='completed' for g in updated))
        json.dumps(updated,allow_nan=False)
    def test_social_blocking(self):
        goal=self.goals({'type':'earn_wealth','value':10})
        self.a['wealth']=999
        self.assertEqual(evaluate_goals(goal,self.a,self.context,1)[0]['state']['status'],'blocked')
        self.context['society']={}
        self.assertEqual(evaluate_goals(goal,self.a,self.context,2)[0]['state']['status'],'completed')
    def test_wins_not_draw_advancement(self):
        goals=self.goals({'type':'win_duels'},{'type':'win_tournaments'},{'type':'defeat_character','target':2})
        self.context['story']['encounters']=[{'result':{'champion_id':'1','matches':[{'advancing_id':'1','result':{'winner_id':None,'starting_state':[{'id':'1'},{'id':'2'}]}}]}}]
        statuses=[g['state']['status'] for g in evaluate_goals(goals,self.a,self.context,1)]
        self.assertEqual(statuses,['active','completed','active'])
        self.context['story']['encounters'][0]['result']['matches'][0]['result']['winner_id']='1'
        self.assertTrue(all(g['state']['status']=='completed' for g in evaluate_goals(goals,self.a,self.context,1)))
    def test_protection_failure_sticky_no_plot_armor(self):
        goals=self.goals({'type':'protect_character','target':2,'year':20})
        self.context['agents'][2]['alive']=False
        goals=evaluate_goals(goals,self.a,self.context,2)
        self.assertEqual(goals[0]['state']['status'],'failed')
        self.context['agents'][2]['alive']=True
        self.assertEqual(evaluate_goals(goals,self.a,self.context,20)[0]['state']['status'],'failed')
    def test_exposure_requires_attribution(self):
        goals=self.goals({'type':'expose_fakes'})
        self.context['society']={'internet':{'fraud_exposures':100,'posts':[{'fake':True,'corrected':True}]}}
        self.assertEqual(evaluate_goals(goals,self.a,self.context,1)[0]['state']['status'],'blocked')
        self.context['society']['internet']['posts'][0]['corrected_by']=1
        self.assertEqual(evaluate_goals(goals,self.a,self.context,2)[0]['state']['status'],'completed')
    def test_planning_no_free_stats(self):
        goals=self.goals({'type':'defeat_character','target':2},{'type':'protect_character','target':2,'year':20})
        old=copy.deepcopy(self.a)
        plan=plan_goals(goals,self.a,self.context,1)
        self.assertTrue(plan['avoid_fights']);self.assertNotIn('seek_rival_id',plan)
        self.assertEqual(plan['protect_id'],2);self.assertEqual(self.a,old)
    def test_history_and_descendants(self):
        goals=self.goals({'type':'reach_age','value':100})
        for year in range(1,101):goals=evaluate_goals(goals,self.a,self.context,year)
        self.assertEqual(len(goals[0]['state']['history']),64)
        goals=evaluate_goals(goals,self.a,self.context,100)
        self.assertEqual(len(goals[0]['state']['history']),64)
        self.context['agents'][2]['children']=[1] # cycle must terminate
        goal=self.goals({'type':'have_descendants','count':1})
        self.assertEqual(evaluate_goals(goal,self.a,self.context,1)[0]['state']['status'],'completed')

    def test_extended_outcomes_and_plans(self):
        goals=self.goals({'type':'win_elections'},{'type':'improve_society','metric':'freedom','value':90},{'type':'treat_injuries','count':2})
        self.context['society']={'leader_id':1,'elections':[], 'freedom':60}
        first=evaluate_goals(goals,self.a,self.context,1)
        self.assertEqual(first[0]['state']['status'],'active') # appointment is not election
        plan=plan_goals(goals,self.a,self.context,1)
        self.assertEqual(plan['civic_focus'],'pluralist')
        self.assertEqual(plan['prefer_power'],'Healing')
        self.assertEqual(plan['desired_job'],'medic')
        self.context['society']['elections']=[{'winner_id':1}]
        self.context['society']['freedom']=90;self.a['patients_treated']=2
        self.assertTrue(all(g['state']['status']=='completed' for g in evaluate_goals(goals,self.a,self.context,2)))
    def test_peer_selection_eligibility_and_dead_block(self):
        self.context['agents'][2].update(age=25,mastery_level=2)
        self.context['agents'][3]={'id':3,'alive':True,'age':25,'mastery_level':4}
        self.context['agents'][4]={'id':4,'alive':True,'age':12,'mastery_level':2}
        goals=self.goals({'type':'win_duels'})
        self.assertEqual(plan_goals(goals,self.a,self.context,1)['seek_rival_id'],2)
        self.context['agents'][2]['hospitalized_until']=2
        self.assertEqual(plan_goals(goals,self.a,self.context,1)['seek_rival_id'],3)
        self.a['alive']=False
        self.assertEqual(plan_goals(goals,self.a,self.context,1),{})
        self.assertEqual(evaluate_goals(goals,self.a,self.context,1)[0]['state']['status'],'blocked')

if __name__=='__main__':unittest.main()
