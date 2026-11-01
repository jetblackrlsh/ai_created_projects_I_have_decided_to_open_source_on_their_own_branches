import unittest,sys,xml.etree.ElementTree as E
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from heads import render_head,render_hand
class Heads(unittest.TestCase):
 def test_views_unique(self):
  heads=[render_head(dict(id='a',view=v)) for v in ['front','threequarter','profile','up','down']]
  self.assertEqual(len(set(heads)),5)
  for h in heads:E.fromstring(h)
 def test_ids_unique(self):
  for fun,opts in [(render_head,{}),(render_hand,{'pose':'open'})]:
   tree=E.fromstring(fun(dict(id='test',**opts)));ids=[x.attrib['id'] for x in tree.iter() if 'id'in x.attrib];self.assertEqual(len(ids),len(set(ids)))
 def test_expression_local(self):
  a=E.fromstring(render_head({'id':'a'}));b=E.fromstring(render_head({'id':'a','expression':'shout'}));a={n.attrib.get('id'):E.tostring(n)for n in a};b={n.attrib.get('id'):E.tostring(n)for n in b};self.assertEqual(a['a-outline'],b['a-outline']);self.assertEqual(a['a-hair'],b['a-hair']);self.assertNotEqual(a['a-mouth'],b['a-mouth'])
 def test_no_raster(self):self.assertNotIn('<image',render_head({}))
 def test_finite(self):
  with self.assertRaises(ValueError):render_head({'x':float('nan')})
 def test_stage(self):
  a=render_head({'stage':0});b=render_head({'stage':5});self.assertNotIn('-hair"',a);self.assertIn('-hair"',b)
 def test_age_changes_contour(self):
  def outline(age):
   root=E.fromstring(render_head({'id':'x','identity':{'age':age}}));return next(n.attrib['d']for n in root if n.attrib.get('id')=='x-outline')
  self.assertNotEqual(outline('child'),outline('adult'))
 def test_portrait_neck_can_be_disabled(self):
  self.assertNotIn('id="head-neck"',render_head({'neck':False}))
 def test_feature_geometry_changes(self):
  def nose(kind):
   root=E.fromstring(render_head({'id':'x','identity':{'nose':kind}}));return next(n.attrib['d']for n in root if n.attrib.get('id')=='x-nose')
  self.assertEqual(len({nose(x)for x in ['small','medium','broad','long']}),4)
 def test_hand(self):
  for pose in ['open','grip','fist']:E.fromstring(render_hand({'pose':pose}))
if __name__=='__main__':unittest.main()
