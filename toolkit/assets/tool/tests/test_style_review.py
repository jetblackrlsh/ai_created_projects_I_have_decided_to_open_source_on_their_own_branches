"""Synthetic review records test validation only, never artistic acceptance."""
import unittest,tempfile,json,hashlib,copy,sys,shutil
from pathlib import Path
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from style_review import require_style_review
class StyleReviewTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.base=Path(self.tmp.name)
  Image.new('RGB',(8,8),'white').save(self.base/'fixture.png')
  self.asset={'file':'fixture.png','sha256':hashlib.sha256((self.base/'fixture.png').read_bytes()).hexdigest()}
  self.row={'status':'accepted','image':self.asset,'source':self.asset,'construction':self.asset,'observations':{t:'Synthetic test observation only' for t in ['proportionsIdentity','connectedFormsContacts','gestureExpression','inkFormShadows','perspectiveDepth','speciesDesign','storyTone']},'drawingProvenance':{'method':'bespoke-paths','visibleGeometry':'Synthetic validator fixture only','functionsAndParametersOrPaths':'Synthetic validator fixture only'},'unresolvedIssues':[]}
  self.review={'schemaVersion':1,'status':'accepted','reviewer':'TEST FIXTURE','reviewedAt':'not an actual review','brief':'Synthetic','referenceObservations':'Synthetic','limitations':'No artistic review performed','reference':self.asset,'representative':self.row,'panels':[self.row]}
  self.c={'shots':[{'image':'fixture.png'}],'styleReview':'review.json'}
 def tearDown(self):self.tmp.cleanup()
 def write(self):
  p=self.base/'review.json';p.write_text(json.dumps(self.review));self.c['styleReviewSha256']=hashlib.sha256(p.read_bytes()).hexdigest()
 def test_default_requires_review(self):
  with self.assertRaises(ValueError):require_style_review(self.base,{'shots':[]})
 def test_generic_not_heroic_label(self):
  r=require_style_review(self.base,{'visualTreatment':'generic-panel','genericPanelReason':'Engineering fixture only not art benchmark'})
  self.assertEqual(r['label'],'PANEL MOTION COMIC');self.assertFalse(r['styleCertified'])
 def test_record_not_style_certificate(self):
  self.write();self.assertFalse(require_style_review(self.base,self.c)['styleCertified'])
 def test_rejected(self):
  self.review['status']='rejected';self.write()
  with self.assertRaises(ValueError):require_style_review(self.base,self.c)
 def test_stale_image(self):
  self.write();(self.base/'fixture.png').write_text('changed')
  with self.assertRaises(ValueError):require_style_review(self.base,self.c)
 def test_stale_review(self):
  self.write();(self.base/'review.json').write_text('{}')
  with self.assertRaises(ValueError):require_style_review(self.base,self.c)
 def test_missing_final_panel(self):
  self.review['panels']=[];self.write()
  with self.assertRaises(ValueError):require_style_review(self.base,self.c)
 def test_no_bool_only_observation(self):
  self.row['observations']['inkFormShadows']=True;self.write()
  with self.assertRaises(ValueError):require_style_review(self.base,self.c)
 def test_missing_construction(self):
  self.row.pop('construction');self.write()
  with self.assertRaises(ValueError):require_style_review(self.base,self.c)
 def test_user_rejection_requires_resolution(self):
  self.review['previouslyRejectedByUser']=True;self.write()
  with self.assertRaises(ValueError):require_style_review(self.base,self.c)
 def test_unresolved_issues(self):
  self.row['unresolvedIssues']=['wrong style'];self.write()
  with self.assertRaises(ValueError):require_style_review(self.base,self.c)
class RenderGateTests(unittest.TestCase):
 def test_new_audio_render_rejects_missing_style_before_output(self):
  import render
  root=Path(__file__).resolve().parents[1]/'examples/harbor'
  with tempfile.TemporaryDirectory() as d:
   b=Path(d);shutil.copytree(root/'assets',b/'assets');c=json.loads((root/'project.json').read_text());c.pop('visualTreatment');(b/'project.json').write_text(json.dumps(c))
   with self.assertRaisesRegex(ValueError,'hash-bound styleReview'):render.render(b/'project.json')
   self.assertFalse((b/'out').exists())
 def test_exact_render_rejects_missing_style_before_output(self):
  sys.path.insert(0,str(Path(__file__).resolve().parents[1]));import heroic_motion
  root=Path(__file__).resolve().parents[1]/'examples/heroic-harbor'
  with tempfile.TemporaryDirectory() as d:
   b=Path(d);shutil.copytree(root/'panels',b/'panels');shutil.copy(root/'master.m4a',b/'master.m4a');c=json.loads((root/'project.json').read_text());c.pop('visualTreatment');(b/'project.json').write_text(json.dumps(c))
   with self.assertRaisesRegex(ValueError,'hash-bound styleReview'):heroic_motion.render_exact(b/'project.json')
   self.assertFalse((b/'out').exists())
if __name__=='__main__':unittest.main()
