import sys,unittest,xml.etree.ElementTree as E
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from body_types import render_body
class Bodies(unittest.TestCase):
 def test_all_parse(self):
  for kind in ['guard','heroine','ordinary','rock','heavy']:
   for view in ['front','profile']:E.fromstring(render_body({'body':kind,'view':view}))
 def test_profile_not_scaled_front(self):
  a=render_body({'body':'guard'});b=render_body({'body':'guard','view':'profile'});self.assertNotEqual(a,b);self.assertIn('Q -45,377',b);self.assertEqual(E.fromstring(b).attrib['transform'],'translate(0 0) scale(1)')
 def test_distinct_silhouette(self):
  self.assertNotEqual(render_body({'body':'rock'}),render_body({'body':'heavy'}))
if __name__=='__main__':unittest.main()
