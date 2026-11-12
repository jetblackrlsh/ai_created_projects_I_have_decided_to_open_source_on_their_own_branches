import copy, unittest
from editorial_preflight import validate, CHECKS
BASE={'mode':'host_video','host':'Alex','thesis':'Start experimenting before release','audience':'players','takeaway':'Try a homebrew adventure','must_preserve':['creative freedom'],'script':'I joined expecting a PDF, then saw a December announcement. Let us build characters now.','claims':[{'id':'release','statement':'I saw a December announcement','status':'attributed','source':'user firsthand report','observed_at':'example-date','reasoning':'Personal experience, not universal availability','kind':'availability','evidence_type':'firsthand_report'}],'checks':dict.fromkeys(CHECKS,True),'review_notes':dict.fromkeys(CHECKS,'Compared complete script to brief and source ledger')}
class EditorialTests(unittest.TestCase):
 def test_attributed_rpg_experience(self): self.assertEqual(validate(BASE),[])
 def test_marketing_is_not_availability(self):
  d=copy.deepcopy(BASE);d['claims'][0].update(status='verified',evidence_type='marketing_cta');self.assertTrue(validate(d))
 def test_firsthand_not_universal(self):
  d=copy.deepcopy(BASE);d['claims'][0]['status']='verified';self.assertTrue(validate(d))
 def test_official_release(self):
  d=copy.deepcopy(BASE);d['claims'][0].update(status='verified',evidence_type='official_release');self.assertEqual(validate(d),[])
 def test_underlying_document_leak(self):
  d=copy.deepcopy(BASE);d['script']+=' The document argues for more experiments.';self.assertTrue(validate(d))
 def test_requested_document_review(self):
  d=copy.deepcopy(BASE);d.update(mode='document_review',script='The document argues for more experiments.');self.assertEqual(validate(d),[])
 def test_unresolved_claim(self):
  d=copy.deepcopy(BASE);d['claims'][0]['status']='unresolved';self.assertTrue(validate(d))
 def test_no_rubber_stamp_without_notes(self):
  d=copy.deepcopy(BASE);d['review_notes']={};self.assertTrue(validate(d))
 def test_missing_script(self):
  d=copy.deepcopy(BASE);d['script']='';self.assertTrue(validate(d))
 def test_exception_requires_reason(self):
  d=copy.deepcopy(BASE);d.update(script='The document says hello.',allowed_phrases=['the document says']);self.assertTrue(validate(d))
 def test_obvious_visual_explanation(self):
  d=copy.deepcopy(BASE);d['script']='These are my illustrations, not screenshots of the argument.';self.assertTrue(validate(d))
 def test_unsolicited_procedural_disclaimer(self):
  d=copy.deepcopy(BASE);d['script']='This is not a moderator ruling.';self.assertTrue(validate(d))
 def test_direct_experience(self):
  d=copy.deepcopy(BASE);d['script']='They insulted me. I am glad the moderators stepped in.';self.assertEqual(validate(d),[])
 def test_genuine_uncertainty_not_banned(self):
  d=copy.deepcopy(BASE);d['script']='I hope the new feature arrives soon. The release date is unknown.';self.assertEqual(validate(d),[])
 def test_missing_human_voice_review(self):
  d=copy.deepcopy(BASE);d['checks'].pop('speaker_certainty_preserved');self.assertTrue(validate(d))
 def test_specific_necessary_exception(self):
  d=copy.deepcopy(BASE);d.update(script='This is not a moderator ruling.',allowed_phrases=['this is not a moderator ruling'],exception_reason='The requested video explains how a proposal differs from a formal ruling.');self.assertEqual(validate(d),[])
if __name__=='__main__': unittest.main()
