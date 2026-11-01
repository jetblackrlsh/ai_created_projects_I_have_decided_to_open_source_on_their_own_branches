import sys,pathlib,unittest,xml.etree.ElementTree as ET
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
import inks
class InkTests(unittest.TestCase):
 def test_stroke_nonzero(self):
  with self.assertRaises(ValueError):inks.stroke([0,0],[0,0])
 def test_swatch_determinism(self):
  for k in range(14):self.assertEqual(inks.swatch(k,id='x'),inks.swatch(k,id='x'))
 def test_svg_parse(self):
  for k in range(14):ET.fromstring('<svg>'+inks.swatch(k,id='s'+str(k))+'</svg>')
 def test_local_balance_removal(self):
  a=inks.scene(abstract=True,balance=True);b=inks.scene(abstract=True,balance=False)
  ea=ET.fromstring('<svg>'+a+'</svg>');eb=ET.fromstring('<svg>'+b+'</svg>')
  aa={e.get('id'):ET.tostring(e)for e in ea.iter('path')if e.get('id')};bb={e.get('id'):ET.tostring(e)for e in eb.iter('path')if e.get('id')}
  self.assertEqual(set(aa)-set(bb),{'scene-balancing-blacks'})
  for k in bb:self.assertEqual(aa[k],bb[k])
 def test_no_raster_embedding(self):
  for mode in ['balanced','uniform','overworked']:self.assertNotIn('<image',inks.scene(mode))
if __name__=='__main__':unittest.main()
