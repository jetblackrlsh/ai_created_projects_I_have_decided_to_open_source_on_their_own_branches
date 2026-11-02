import copy
import json
import pathlib
import subprocess
import sys
import unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
import narrative
import worldsim as w
from test_worldsim import seed

class NarrativeTests(unittest.TestCase):
    def setUp(self):self.d=w.fresh(seed(),8)
    def do(self,op,**kw):
        self.d,_=w.apply(self.d,dict(op=op,revision=self.d['revision'],request_id='r'+str(self.d['revision']),**kw))
    def resolve(self,text):
        self.do('action',text='wait')
        state=copy.deepcopy(self.d['state']);state['turn']+=1;state['time']['elapsed_minutes']+=1
        self.do('resolve',state=state,narrative=text)
    def test_active_and_abandoned(self):
        self.resolve('The boat arrives.')
        self.do('checkpoint',label='dock')
        self.resolve('The boat sinks.')
        self.do('branch',label='dock',name='safer')
        self.resolve('The boat sails safely.')
        r=narrative.render_report(self.d);text=r['markdown']
        self.assertTrue(r['active_local_chronology_verified']);self.assertFalse(r['complete_world_history'])
        active,abandoned=text.split('## Alternate or abandoned resolutions',1)
        self.assertIn('boat arrives',active);self.assertIn('sails safely',active);self.assertNotIn('boat sinks',active);self.assertIn('boat sinks',abandoned)
    def test_missing_legacy_restore_not_guessed(self):
        self.do('checkpoint',label='a');self.resolve('Lost future');self.do('load',label='a')
        self.d['lineage']['timeline_history']=[]
        r=narrative.render_report(self.d)
        self.assertFalse(r['active_local_chronology_verified']);self.assertIn('active chronology unverified',r['markdown'])
    def test_export_sparse_honesty(self):
        package=w.export_world(self.d)
        # Existing v2 exports omit full events; newer exports may carry an empty chronicle.
        r=narrative.render_report(package)
        self.assertFalse(r['complete_world_history']);self.assertNotIn('The boat',r['markdown'])
    def test_sanitizes_story_markup_and_nonmutation(self):
        self.resolve('<script>alert(1)</script> [click](https://evil.invalid) ![x](data:evil)')
        before=copy.deepcopy(self.d);text=narrative.render_report(self.d)['markdown']
        self.assertNotIn('<script>',text);self.assertNotIn('[click](',text);self.assertNotIn('![x](',text);self.assertEqual(self.d,before)
    def test_bad_replay_rejected(self):
        self.resolve('hello');self.d['events'][0]['after']='wrong'
        with self.assertRaises(w.Invalid):narrative.render_report(self.d)
    def test_compact_chronicle_prior_and_rewind(self):
        c={'initial':{'turn':0},'events':[{'event_index':1,'op':'resolve','turn':1,'elapsed_minutes':1,'branch_name':'main','narrative':'FIRST'},{'event_index':2,'op':'resolve','turn':2,'elapsed_minutes':2,'branch_name':'main','narrative':'ABANDONED'},{'event_index':3,'op':'load','turn':1,'elapsed_minutes':1,'branch_name':'main','restore_event_index':1},{'event_index':4,'op':'resolve','turn':2,'elapsed_minutes':2,'branch_name':'main','narrative':'NEW'}],'prior':[{'initial':{'turn':7},'events':[],'prior':[]}]}
        lines=[];self.assertTrue(narrative.compact_chronicle(lines,c));text='\n'.join(lines)
        active,alt=text.split('### Alternate/abandoned resolutions',1)
        self.assertIn('FIRST',active);self.assertIn('NEW',active);self.assertNotIn('ABANDONED',active);self.assertIn('ABANDONED',alt);self.assertIn('separate timeline',alt)
    def test_actual_v3_export_and_crossover_origins(self):
        self.resolve('A prior boat arrives.')
        first=w.export_world(self.d)
        other=w.fresh(seed(),3);other['state']['world']['title']='Other Canal';other['initial']=copy.deepcopy(other['state'])
        second=w.export_world(other)
        merged=w.fresh(seed(),3)
        merged['lineage']['origins']=[first,second]
        merged['prior_chronicles']=[first['chronicle'],second['chronicle']]
        report=narrative.render_report(merged)
        self.assertIn('A prior boat arrives',report['markdown'])
        self.assertIn('Other Canal',report['markdown'])
        self.assertNotIn('SECRET password',report['markdown'])
        exported=w.export_world(merged)
        result=narrative.render_report(exported)
        self.assertIn('A prior boat arrives',result['markdown'])
        self.assertIn('separate timeline',result['markdown'])
        self.assertIn(first['lineage']['export_id'],result['markdown'])

    def test_cli(self):
        script=pathlib.Path(narrative.__file__)
        p=subprocess.run([sys.executable,str(script),'--markdown'],input=json.dumps(self.d),text=True,capture_output=True)
        self.assertEqual(p.returncode,0,p.stdout+p.stderr);self.assertIn('recorded world chronicle',p.stdout)
        p=subprocess.run([sys.executable,str(script)],input='{}',text=True,capture_output=True)
        self.assertEqual(p.returncode,1);self.assertFalse(json.loads(p.stdout)['ok'])

if __name__=='__main__':unittest.main()
