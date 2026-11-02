import copy,json,pathlib,subprocess,sys,tempfile,unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
import sources,worldsim as w
from test_worldsim import seed
class Integration(unittest.TestCase):
    def test_sources_create_provenance_atomic(self):
        with tempfile.TemporaryDirectory() as path:
            root=pathlib.Path(path);src=root/'book.txt';src.write_text('The keeper is a patient guardian.\n'+'unused page\n'*1000)
            workspace=root/'sources';sources.transact(workspace,{'op':'init'})
            sources.transact(workspace,{'op':'add_document','revision':0,'path':str(src)})
            cid=sources.transact(workspace,{'op':'chunks','limit':1})['chunks'][0]['id']
            sources.transact(workspace,{'op':'record_extract','revision':1,'chunk_id':cid,'reviewed':True,'disposition':'extracted','summary':'Keeper role.','claims':[{'id':'keeper_role','text':'Keeper is a patient guardian.','quote':'patient guardian','kind':'fact'}]})
            package=sources.transact(workspace,{'op':'export_initialization','allow_partial':True,'scope_note':'First chunk only; remaining pages not reviewed.'})
            def run(obj):return subprocess.run([sys.executable,w.__file__,'--store',str(root/'world')],input=json.dumps(obj),text=True,capture_output=True)
            r=run({'op':'create_from_sources','state':seed(),'source_package':package,'turn_budget':3});self.assertEqual(r.returncode,0,r.stdout+r.stderr)
            d=w.parse((root/'world/session.json').read_bytes());self.assertEqual(d['state']['extensions']['source_initialization'],package)
            self.assertTrue(package['incomplete']);self.assertFalse(package['coverage']['ready'])
            run({'op':'action','revision':0,'request_id':'a','text':'wait'})
            d=w.parse((root/'world/session.json').read_bytes());state=copy.deepcopy(d['state']);state['turn']=1;state['extensions'].pop('source_initialization')
            before=(root/'world/session.json').read_bytes();r=run({'op':'resolve','revision':1,'request_id':'b','state':state,'narrative':'wait'})
            self.assertEqual(r.returncode,1);self.assertEqual(before,(root/'world/session.json').read_bytes())
