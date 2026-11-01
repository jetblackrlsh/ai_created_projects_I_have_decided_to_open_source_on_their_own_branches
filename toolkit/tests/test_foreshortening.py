import unittest,sys,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from world import *
from foreshortening import *
class ProjectionFigures(unittest.TestCase):
 def test_oriented_tube_endplanes(self):
  a=(1,2,3);b=(4,6,8);axis=norm(sub(b,a));fs=tube('limb',a,b,.4);dots=[dot(sub(p,a),axis)for f in fs for p in f['points']];self.assertAlmostEqual(min(dots),0);self.assertAlmostEqual(max(dots),math.sqrt(dot(sub(b,a),sub(b,a))))
 def test_near_hand_enlarged(self):
  c=Camera((0,6,10),(0,6,0));a=c.project((.5,6,0))[0]-c.project((-.5,6,0))[0];b=c.project((.5,6,3))[0]-c.project((-.5,6,3))[0];self.assertGreater(b,a);self.assertAlmostEqual(b/a,10/7)
 def test_ground_contact(self):
  fs=figure_faces();feet=[p[1]for f in fs if'-foot'in f['id']for p in f['points']];self.assertAlmostEqual(min(feet),0)
 def test_step_contact(self):
  fs=figure_faces(offset=(0,2.52,-.415),scale=.55);feet=[p for f in fs if'-foot'in f['id']for p in f['points']];self.assertAlmostEqual(min(p[1]for p in feet),2.52);self.assertGreaterEqual(min(p[2]for p in feet),-.575);self.assertLessEqual(max(p[2]for p in feet),.075)
 def test_tilt_shortens_axis(self):
  c=Camera((0,0,13),(0,0,0));lengths=[]
  for deg in [0,45,80]:
   a=math.radians(deg);p=c.project((0,-math.cos(a),-math.sin(a)));q=c.project((0,math.cos(a),math.sin(a)));lengths.append(math.hypot(p[0]-q[0],p[1]-q[1]))
  self.assertTrue(lengths[0]>lengths[1]>lengths[2])
if __name__=='__main__':unittest.main()
