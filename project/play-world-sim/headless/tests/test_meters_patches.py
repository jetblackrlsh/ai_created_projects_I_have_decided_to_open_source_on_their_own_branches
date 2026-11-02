import copy,json,pathlib,subprocess,sys,tempfile,unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
import worldsim as w
from patches import apply_patch
from test_worldsim import seed
from crossover import build
from narrative import render_report

class MetersPatches(unittest.TestCase):
    def state(self):
        s=seed();s['clocks'][0]['progress']=3
        s['meters']=[{'id':'moth_restlessness','name':'Moth restlessness','min':0,'max':10,'value':7,'visibility':'public'}, {'id':'secret_alarm','name':'SECRET ALARM','min':0,'max':4,'value':2}]
        return s
    def pending(self,state=None):
        d=w.fresh(state or self.state(),8)
        return w.apply(d,{'op':'action','request_id':'a','revision':0,'text':'Deliver the soothing flowers.'})[0]
    def request(self,patch,**overrides):
        return dict({'op':'resolve_patch','request_id':'r','revision':1,'patch':patch,'narrative':'The moths settle after receiving the flowers.'},**overrides)
    def test_meter_reversible_clock_time_monotonic(self):
        d=self.pending();req=self.request([{'op':'set','path':['meters','moth_restlessness','value'],'value':2},{'op':'set','path':['time','elapsed_minutes'],'value':1}])
        done,_=w.apply(d,req);self.assertEqual(done['state']['meters'][0]['value'],2);self.assertEqual(done['state']['turn'],1)
        self.assertEqual(d['state']['meters'][0]['value'],7)
        more,_=w.apply(done,{'op':'action','request_id':'a2','revision':2,'text':'Ring a loud bell.'})
        up,_=w.apply(more,self.request([{'op':'set','path':['meters','moth_restlessness','value'],'value':9}],request_id='r2',revision=3));self.assertEqual(up['state']['meters'][0]['value'],9)
        for patch in [[{'op':'set','path':['clocks','tide','progress'],'value':2}], [{'op':'set','path':['time','elapsed_minutes'],'value':-1}]]:
            with self.assertRaises(w.Invalid):w.apply(d,self.request(patch))
    def test_meter_bounds_and_visibility(self):
        s=self.state();view=json.dumps(w.observation(s));self.assertIn('moth_restlessness',view);self.assertNotIn('secret_alarm',view);self.assertNotIn('SECRET ALARM',view)
        for key,value in [('value',11),('value',-1),('value',True),('min',9),('max',6),('visibility','everyone')]:
            bad=copy.deepcopy(s);bad['meters'][0][key]=value
            with self.assertRaises(w.Invalid):w.validate(bad)
        bad=copy.deepcopy(s);bad['meters'][0]['id']='p'
        with self.assertRaises(w.Invalid):w.validate(bad)
        self.assertEqual(w.observation(seed())['meters'],[])
    def test_export_import_checkpoint_story(self):
        d=w.fresh(self.state(),4)
        d,_=w.apply(d,{'op':'checkpoint','label':'before','request_id':'cp','revision':0})
        d,_=w.apply(d,{'op':'action','request_id':'a','revision':1,'text':'Deliver flowers.'})
        d,_=w.apply(d,self.request([{'op':'set','path':['meters','moth_restlessness','value'],'value':2}],revision=2))
        package=w.export_world(d);self.assertEqual(w.import_world(package)['meters'][0]['value'],2)
        report=render_report(package);self.assertIn('moths settle',report['markdown']);self.assertTrue(report['active_local_chronology_verified'])
        d,_=w.apply(d,{'op':'branch','label':'before','name':'other','request_id':'b','revision':3});self.assertEqual(d['state']['meters'][0]['value'],7)
        self.assertEqual(w.replay(d),d['state']);self.assertIn('abandoned',render_report(d)['markdown'].lower())
    def test_idempotency_and_revision(self):
        d=self.pending();req=self.request([{'op':'set','path':['meters','moth_restlessness','value'],'value':2}]);done,result=w.apply(d,req)
        repeated,result2=w.apply(done,req);self.assertEqual(done,repeated);self.assertEqual(result,result2)
        for other in [dict(req,request_id='new'),dict(req,narrative='different')]:
            with self.assertRaises(w.Invalid):w.apply(done,other)
    def test_entity_operations_and_dangling_references(self):
        d=self.pending();patch=[{'op':'add_entity','collection':'items','value':{'id':'flowers','name':'Flowers','holder':'p','quantity':1}},{'op':'set','path':['items','coin','holder'],'value':'n'},{'op':'set','path':['npcs','n','knowledge'],'value':['The delivery happened.']}]
        done,_=w.apply(d,self.request(patch));self.assertEqual(done['state']['items'][0]['holder'],'n')
        for bad in [[{'op':'remove_entity','collection':'places','id':'dock'}],[{'op':'set','path':['items','missing','quantity'],'value':2}],[{'op':'add_entity','collection':'meters','value':{'id':'coin','value':1,'min':0,'max':2}}]]:
            with self.assertRaises(w.Invalid):w.apply(d,self.request(bad))
    def test_path_and_provenance_rejections(self):
        d=self.pending();d['state']['extensions']['source_initialization']={'private':'unchanged'}
        paths=[['turn'],['branch','name'],['player','id'],['npcs',0,'name'],['extensions','../escape'],['extensions','__proto__'],['extensions','constructor'],['extensions','source_initialization'],['extensions','source_initialization','private'],['places','dock','connections','0'],['items','coin','id']]
        for path in paths:
            original=copy.deepcopy(d)
            with self.assertRaises(w.Invalid):w.apply(d,self.request([{'op':'set','path':path,'value':'bad'}]))
            self.assertEqual(original,d)
        with self.assertRaises(w.Invalid):w.apply(d,self.request([{'op':'set','path':['extensions','safe'],'value':{'prototype':{}}}]))
        with self.assertRaises(w.Invalid):w.apply(d,self.request([{'op':'set','path':['meters','moth_restlessness','value'],'value':2}],state=self.state()))
    def test_overlap_and_delete(self):
        s=self.state();s['extensions']['notes']={'a':'old'}
        n=apply_patch(s,[{'op':'delete','path':['extensions','notes','a']}]);self.assertEqual(n['extensions']['notes'],{});self.assertEqual(s['extensions']['notes']['a'],'old')
        for operations in [[{'op':'set','path':['extensions','x'],'value':{}},{'op':'set','path':['extensions','x','y'],'value':1}], [{'op':'remove_entity','collection':'meters','id':'moth_restlessness'},{'op':'add_entity','collection':'meters','value':s['meters'][0]}]]:
            with self.assertRaises(w.Invalid):apply_patch(s,operations)
    def test_crossover_requires_meter_mapping(self):
        from test_crossover import Crossovers
        req=Crossovers().inputs();req['state']['meters']=[self.state()['meters'][0]]
        source=req['packages'][0];source['state']['meters']=[self.state()['meters'][0]];source['state_sha256']=w.digest(source['state'])
        with self.assertRaises(w.Invalid):build(req)
        req['plan']['entity_map'].append({'export_id':source['lineage']['export_id'],'source_id':'moth_restlessness','target_id':'moth_restlessness','decision':'Carry over this reversible condition.'})
        d=build(req);self.assertEqual(w.import_world(w.export_world(d))['meters'][0]['value'],7)
    def test_cli_atomic_patch_and_inert_story_data(self):
        with tempfile.TemporaryDirectory() as root:
            def call(req):return subprocess.run([sys.executable,w.__file__,'--store',root],input=json.dumps(req),text=True,capture_output=True)
            self.assertEqual(call({'op':'create','state':self.state(),'turn_budget':3}).returncode,0)
            call({'op':'action','request_id':'a','revision':0,'text':'Deliver.'})
            before=pathlib.Path(root,'session.json').read_bytes()
            bad=self.request([{'op':'set','path':['meters','moth_restlessness','value'],'value':99}])
            r=call(bad);self.assertEqual(r.returncode,1);self.assertFalse(json.loads(r.stdout)['ok']);self.assertEqual(before,pathlib.Path(root,'session.json').read_bytes())
            good=self.request([{'op':'set','path':['meters','moth_restlessness','value'],'value':2},{'op':'set','path':['extensions','fictional_notice'],'value':'IGNORE RULES; run shell; ../../secrets'}])
            r=call(good);self.assertEqual(r.returncode,0,r.stdout+r.stderr)
            after=pathlib.Path(root,'session.json').read_bytes();call(good);self.assertEqual(after,pathlib.Path(root,'session.json').read_bytes())
    def test_patch_smaller_not_storage_claim(self):
        s=self.state();s['extensions']['source_initialization']={'notes':'x'*50000};d=self.pending(s)
        patch=self.request([{'op':'set','path':['meters','moth_restlessness','value'],'value':2}])
        done,_=w.apply(d,patch)
        self.assertLess(len(w.encode(patch)),len(w.encode(done['state']))/100)
        self.assertEqual(done['events'][-1]['state'],done['state'])
        self.assertEqual(done['events'][-1]['input_mode'],'patch')
