import unittest, tempfile, pathlib, json, sys, hashlib, copy
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from project import validate_art
class ArtContractTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.base=pathlib.Path(self.tmp.name)
  (self.base/'evidence').write_text('test-only evidence, not an actual visual review')
  h=hashlib.sha256((self.base/'evidence').read_bytes()).hexdigest()
  self.c={'panels':[{'id':'x','source':'evidence','sha256':'panel-hash','sourceSha256':h}], 'artContract':{'mode':'manga','notes':'synthetic schema test only','origin':'draw-headless-manga','evidence':[{'file':'evidence','sha256':h,'role':r} for r in ('source-page','editable-scene','drawing-tool','drawing-receipt')],'visualReview':{'reviewer':'TEST','method':'synthetic metadata test; NOT artistic QA','sequenceNotes':'test','panels':[dict(id='x',sha256='panel-hash',sourceSha256=h,accepted=True,**{k:'test-only' for k in ('form','perspective','actingContact','lineTone','readability','limitations')})]}}}
 def tearDown(self):self.tmp.cleanup()
 def test_schema_complete(self):validate_art(self.base,self.c)
 def test_missing_contract(self):
  with self.assertRaises(ValueError):validate_art(self.base,{})
 def test_missing_tool_receipt(self):
  self.c['artContract']['evidence'].pop()
  with self.assertRaises(ValueError):validate_art(self.base,self.c)
 def test_changed_evidence(self):
  (self.base/'evidence').write_text('changed')
  with self.assertRaises(ValueError):validate_art(self.base,self.c)
 def test_stale_review(self):
  self.c['panels'][0]['sha256']='changed'
  with self.assertRaises(ValueError):validate_art(self.base,self.c)
 def test_rejected_panel(self):
  self.c['artContract']['visualReview']['panels'][0]['accepted']=False
  with self.assertRaises(ValueError):validate_art(self.base,self.c)
 def test_missing_observations(self):
  self.c['artContract']['visualReview']['panels'][0].pop('actingContact')
  with self.assertRaises(ValueError):validate_art(self.base,self.c)
 def test_generic_must_be_explicit_fixture(self):
  self.c['artContract']={'mode':'generic-comic','notes':'test'}
  with self.assertRaises(ValueError):validate_art(self.base,self.c)
 def test_supplied_requires_permission(self):
  self.c['artContract']['origin']='supplied-manga'
  with self.assertRaises(ValueError):validate_art(self.base,self.c)

 def test_supplied_missing_actual_source(self):
  self.c['artContract']['origin']='supplied-manga';self.c['artContract']['permissionNotes']='test'
  self.c['artContract']['evidence']=[e for e in self.c['artContract']['evidence'] if e['role']!='source-page']
  with self.assertRaises(ValueError):validate_art(self.base,self.c)
 def test_source_change_without_crop_change(self):
  self.c['panels'][0]['sourceSha256']='changed-source'
  with self.assertRaises(ValueError):validate_art(self.base,self.c)
