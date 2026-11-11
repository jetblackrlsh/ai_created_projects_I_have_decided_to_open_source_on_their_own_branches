"""End-to-end contract test: JS produces submissions; Python validates each."""
import importlib.util,json,subprocess,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('engine',ROOT/'scripts'/'engine.py');engine=importlib.util.module_from_spec(spec);spec.loader.exec_module(engine)
class Contract(unittest.TestCase):
 def test_all_rolls(self):
  fixture=json.loads(subprocess.check_output(['node',str(ROOT/'tests'/'test-ui.js'),'--fixtures'],text=True))
  c=fixture['check'];engine.validate_check(c)
  for p in fixture['payloads']:
   with self.subTest(raw=p['raw_d20']):
    s=engine.new_campaign(c['campaign_id'],'Test');s.pop('character_setup'); # explicit legacy fixture
    s['current_scene']={'id':c['scene_id']};s=engine.declare(s,c)
    resolved=engine.resolve(s,p,'Test narration')
    self.assertEqual(resolved['chronicle'][-1]['roll'],{k:p[k] for k in ['raw_d20','modifier','total','dc','outcome']})
    with self.assertRaises(ValueError):engine.resolve(resolved,p,'Duplicate')
if __name__=='__main__':unittest.main()
