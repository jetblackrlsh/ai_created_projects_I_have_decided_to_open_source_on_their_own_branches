import copy,json,pathlib,subprocess,sys,tempfile,unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
import worldsim as w
from test_worldsim import seed
from crossover import build

class Crossovers(unittest.TestCase):
    def inputs(self):
        a=w.export_world(w.fresh(seed(),3));b=w.export_world(w.fresh(seed(),3))
        b['state']['world']['title']='Forest Ferry';b['state_sha256']=w.digest(b['state'])
        state=seed();state['world']['title']='Glass Forest';state['recent_events']=['Two ferry histories converge.']
        mapping=[]
        for p in [a,b]:
            for entity in [p['state']['player']]+p['state']['places']+p['state']['npcs']+p['state']['items']+p['state']['clocks']:
                mapping.append({'export_id':p['lineage']['export_id'],'source_id':entity['id'],'target_id':entity['id'],'decision':'Explicitly fuse corresponding counterparts; keep one canonical instance.'})
        return {'op':'crossover','packages':[a,b],'state':state,'turn_budget':4,'plan':{'entity_map':mapping,'laws_decision':'Glass and forest magic coexist.','time_decision':'Reset to origin at dusk.','history_decision':'Both remembered histories are claims of the fused keeper.','conflicts':[{'topic':'two coins','resolution':'one fused coin, not double inventory'}]}}
    def test_fusion_lineage_immutable_roundtrip(self):
        req=self.inputs();before=copy.deepcopy(req);d=build(req)
        self.assertEqual(req,before)
        self.assertNotIn(d['lineage']['world_id'],[p['lineage']['world_id'] for p in req['packages']])
        p=w.export_world(d);self.assertEqual(w.import_world(p),d['state'])
        self.assertEqual(p['lineage']['origins'],req['packages'])
        imported=w.fresh(w.import_world(p),2);imported['lineage']=w.continuation_lineage(p)
        again=w.export_world(imported);self.assertEqual(again['lineage']['origins'],req['packages'])
        self.assertEqual(again['lineage']['parent_export']['export_id'],p['lineage']['export_id'])
    def test_rejections(self):
        for mutate in [lambda x:x['plan']['entity_map'].pop(),lambda x:x['plan']['entity_map'][0].update(target_id='absent'),lambda x:x['plan'].update(laws_decision=''),lambda x:x['packages'].append(x['packages'][0])]:
            req=self.inputs();mutate(req)
            with self.assertRaises(w.Invalid):build(req)
    def test_cli_fresh_only_and_errors_json(self):
        with tempfile.TemporaryDirectory() as path:
            def run(req):return subprocess.run([sys.executable,w.__file__,'--store',path],input=json.dumps(req),text=True,capture_output=True)
            req=self.inputs();r=run(req);self.assertEqual(r.returncode,0,r.stdout+r.stderr)
            before=pathlib.Path(path,'session.json').read_bytes();r=run(req)
            self.assertEqual(r.returncode,1);self.assertFalse(json.loads(r.stdout)['ok']);self.assertEqual(before,pathlib.Path(path,'session.json').read_bytes())
        with tempfile.TemporaryDirectory() as path:
            req=self.inputs();req['plan']['entity_map'].pop();r=subprocess.run([sys.executable,w.__file__,'--store',path],input=json.dumps(req),text=True,capture_output=True)
            self.assertEqual(r.returncode,1);self.assertFalse(json.loads(r.stdout)['ok']);self.assertFalse(pathlib.Path(path,'session.json').exists())
