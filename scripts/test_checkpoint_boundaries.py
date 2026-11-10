"""Final output must not introduce checkpoint-dependent state transitions."""
import json
import unittest
import modern_society
import simulate_world as engine

class CheckpointBoundaryTests(unittest.TestCase):
    def test_modern_newborn_and_ranking_boundary(self):
        def run(years,state=None):
            return modern_society.run_modern(42,years,60,.35,.35,engine.POWER_TREE,engine.pick_power_mutation,resume_state=state)
        full=run(22)
        for stop in (0,19,20,21):
            with self.subTest(stop=stop):
                part=run(stop)
                resumed=run(22,json.loads(json.dumps(part['_state'])))
                self.assertEqual(json.loads(json.dumps(full)),json.loads(json.dumps(resumed)))

    def test_wheel_granted_power_boundary(self):
        def run(years,state=None):
            return engine.run_single_world_evolution_or_monarch_or_wheel('wheel',17,years,50,.1,.1,wheel_interval=10,resume_state=state,total_years=100)
        full=run(31)
        for stop in (0,29,30):
            with self.subTest(stop=stop):
                partial=run(stop)
                resumed=run(31,json.loads(json.dumps(partial['_state'])))
                self.assertEqual(json.loads(json.dumps(full)),json.loads(json.dumps(resumed)))

if __name__=='__main__':unittest.main()
