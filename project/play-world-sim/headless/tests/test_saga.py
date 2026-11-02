import copy
import json
import tempfile
import unittest
import worldsim as w
from test_worldsim import seed
from saga import report

P={'kind':'source_canon','refs':['synthetic seed:1']}
G={'kind':'generated_continuation','refs':['synthetic step:1']}

def saga_seed():
    s=seed()
    s['extensions']['character_saga']={'version':1,'calendar':'One test year is10minutes',
        'plan':{'roots':['ada'],'include_descendants':True,'start':0,'end':500,'max_jump':200,'max_milestones_per_step':4,'focus':['family','adventure'],'boundaries':'No forced tragedy'},
        'characters':[{'id':'ada','name':'Ada','entity_id':'p','birth':-200,'death':None,'provenance':copy.deepcopy(P)}],
        'relationships':[],'milestones':[],'bridges':[],'threads':[]}
    return s

def jump(d,end=100):
    n=copy.deepcopy(d['state']);n['turn']+=1;old=n['time']['elapsed_minutes'];n['time']['elapsed_minutes']=end
    n['extensions']['character_saga']['bridges'].append({'id':'bridge'+str(end),'start':old,'end':end,'summary':'Selected uneventful years, not every event reconstructed.','coverage':'selected_milestones','provenance':copy.deepcopy(G)})
    return n

def pending(d):
    return w.apply(d,{'op':'action','request_id':'a'+str(d['revision']),'revision':d['revision'],'text':'Follow the family through the next interval.'})[0]

def resolve(d,s,patch=False):
    req={'op':'resolve_patch' if patch else 'resolve','request_id':'r'+str(d['revision']),'revision':d['revision'],'narrative':'The family continues.'}
    if patch:req['patch']=[{'op':'set','path':['time','elapsed_minutes'],'value':s['time']['elapsed_minutes']},{'op':'set','path':['extensions','character_saga'],'value':s['extensions']['character_saga']}]
    else:req['state']=s
    return w.apply(d,req)[0]

class SagaTests(unittest.TestCase):
    def test_jumps_reports_and_descendants(self):
        d=pending(w.fresh(saga_seed(),5));n=jump(d)
        g=n['extensions']['character_saga'];g['characters'].append({'id':'lio','name':'Lio','entity_id':None,'birth':50,'death':None,'provenance':G})
        g['relationships'].append({'id':'parent','kind':'biological_parent','from':'ada','to':'lio','start':50,'end':None,'provenance':G})
        g['milestones'].append({'id':'born','at':50,'characters':['lio','ada'],'category':'birth','summary':'Lio joins the family.','provenance':G})
        d=resolve(d,n,True);r=report(d['state']);self.assertEqual(r['followed_character_ids'],['ada','lio']);self.assertFalse(r['exhaustive_history']);self.assertFalse(r['horizon_reached'])
        self.assertNotIn('character_saga',json.dumps(w.observation(d['state'])))
        p=w.export_world(d);self.assertEqual(w.import_world(p),d['state'])
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(w.transact(tmp,{'op':'saga_world','package':p}),r)
        from narrative import render_report
        self.assertIn('Character saga',render_report(p)['markdown'])
    def test_death_requires_milestone_and_posthumous_actions_reject(self):
        d=pending(w.fresh(saga_seed(),5));n=jump(d);g=n['extensions']['character_saga'];g['characters'][0]['death']=90
        with self.assertRaises(w.Invalid):resolve(d,n)
        g['milestones']=[{'id':'death','at':90,'characters':['ada'],'category':'death','summary':'Ada dies peacefully after a long life.','provenance':G}]
        done=resolve(d,n);self.assertEqual(done['state']['extensions']['character_saga']['characters'][0]['death'],90)
        g['milestones'].append({'id':'after','at':100,'characters':['ada'],'category':'adventure','summary':'Impossible living action','provenance':G})
        with self.assertRaises(w.Invalid):resolve(d,n)
    def test_invalid_chronology_and_ids(self):
        for change in ('future_birth','bad_entity','bool_birth','horizon','cycle','unknown_parent','before_birth'):
            s=saga_seed();g=s['extensions']['character_saga']
            if change=='future_birth':g['characters'][0]['birth']=1
            if change=='bool_birth':g['characters'][0]['birth']=True
            if change=='bad_entity':g['characters'][0]['entity_id']='missing'
            if change=='horizon':g['plan']['end']=False
            if change in ('cycle','unknown_parent','before_birth'):
                g['characters'].append({'id':'lio','name':'Lio','entity_id':None,'birth':None,'death':None,'provenance':P})
                g['relationships']=[{'id':'one','kind':'adoptive_parent','from':'ada','to':'lio','start':0,'end':None,'provenance':P}]
                if change=='cycle':g['relationships'].append(dict(g['relationships'][0],id='two',**{'from':'lio','to':'ada'}))
                if change=='unknown_parent':g['relationships'][0]['from']='missing'
                if change=='before_birth':g['relationships'][0]['start']=-300
            with self.subTest(change=change),self.assertRaises(w.Invalid):w.validate(s)
    def test_jump_budget_bridge_and_history(self):
        d=pending(w.fresh(saga_seed(),5));n=jump(d,201)
        with self.assertRaises(w.Invalid):resolve(d,n)
        n=jump(d);n['extensions']['character_saga']['bridges']=[]
        with self.assertRaises(w.Invalid):resolve(d,n)
        n=jump(d);n['extensions']['character_saga']['characters'][0]['name']='Retconned'
        with self.assertRaises(w.Invalid):resolve(d,n)
        n=jump(d);g=n['extensions']['character_saga'];g['milestones']=[{'id':'m'+str(i),'at':20+i,'characters':['ada'],'category':'adventure','summary':'test','provenance':G} for i in range(5)]
        with self.assertRaises(w.Invalid):resolve(d,n)
    def test_branch_restores_saga_and_budget(self):
        d=w.fresh(saga_seed(),3);d,_=w.apply(d,{'op':'checkpoint','label':'start','request_id':'cp','revision':0})
        d=pending(d);d=resolve(d,jump(d));d,_=w.apply(d,{'op':'branch','label':'start','name':'other','request_id':'branch','revision':d['revision']})
        self.assertEqual(d['state']['extensions']['character_saga']['bridges'],[]);self.assertEqual(d['used'],1);self.assertEqual(w.replay(d),d['state'])
    def test_horizon_and_idempotency(self):
        d=w.fresh(saga_seed(),3)
        for end in (200,400,500):d=pending(d);d=resolve(d,jump(d,end))
        self.assertEqual(d['mode'],'paused');self.assertTrue(report(d['state'])['horizon_reached'])
        bad=copy.deepcopy(d['state']);bad['time']['elapsed_minutes']=501
        with self.assertRaises(w.Invalid):w.validate(bad)
    def test_threads_close_without_rewriting(self):
        s=saga_seed();g=s['extensions']['character_saga'];g['threads']=[{'id':'lost','characters':['ada'],'opened':0,'closed':None,'summary':'Find the lost ferry bell','outcome':None,'provenance':P}]
        d=pending(w.fresh(s,3));n=jump(d);t=n['extensions']['character_saga']['threads'][0];t.update(closed=100,outcome='Recovered in the sand')
        self.assertIn('Recovered',report(resolve(d,n)['state'])['markdown'])
        t['summary']='Different old quest'
        with self.assertRaises(w.Invalid):resolve(d,n)
    def test_adoption_counts_mentorship_does_not(self):
        s=saga_seed();g=s['extensions']['character_saga']
        for who in ('child','student'):
            g['characters'].append({'id':who,'name':who,'entity_id':None,'birth':-10,'death':None,'provenance':P})
            g['relationships'].append({'id':who,'kind':'adoptive_parent' if who=='child' else 'mentor','from':'ada','to':who,'start':0,'end':None,'provenance':P})
        self.assertEqual(report(s)['followed_character_ids'],['ada','child'])
    def test_public_demo_export_validates(self):
        from pathlib import Path
        path=Path(__file__).resolve().parents[1]/'examples/saga/completed-world.json'
        package=json.loads(path.read_text());state=w.import_world(package)
        self.assertTrue(report(state)['horizon_reached'])
        self.assertEqual(len(report(state)['followed_character_ids']),3)
    def test_life_milestone_matches_record(self):
        s=saga_seed();g=s['extensions']['character_saga']
        for category in ('birth','death'):
            g['milestones']=[{'id':'wrong','at':0,'characters':['ada'],'category':category,'summary':'Wrong life date','provenance':P}]
            with self.assertRaises(w.Invalid):w.validate(s)
    def test_crossover_requires_genealogy_mapping(self):
        from crossover import build
        a=w.export_world(w.fresh(saga_seed(),2));b=w.export_world(w.fresh(seed(),2));out=seed()
        mapping=[]
        for p in (a,b):
            for e in [p['state']['player']]+sum([p['state'][k] for k in ('npcs','places','items','clocks')],[]):mapping.append({'export_id':p['lineage']['export_id'],'source_id':e['id'],'target_id':e['id'],'decision':'Same synthetic counterpart'})
        req={'packages':[a,b],'state':out,'turn_budget':2,'plan':{'entity_map':mapping,'laws_decision':'Compatible','time_decision':'Both at zero','history_decision':'Retain source exports','conflicts':[]}}
        with self.assertRaises(w.Invalid):build(req)
        req['plan']['saga_decision']={'history_decision':'Genealogy intentionally remains only in source export','mapping':[{'export_id':a['lineage']['export_id'],'character_id':'ada','target_id':None,'decision':'Explicit omission from new world'}]}
        self.assertEqual(len(build(req)['lineage']['origins']),2)

if __name__=='__main__':unittest.main()
