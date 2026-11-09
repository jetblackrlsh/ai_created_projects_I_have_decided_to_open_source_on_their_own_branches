#!/usr/bin/env python3
"""Standard-library regression tests. Run directly from any working directory."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ENGINE = Path(__file__).with_name('simulate_world.py')
spec = importlib.util.spec_from_file_location('world_engine', ENGINE)
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)


class WorldTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.counter = 0

    def cli(self, *args, success=True):
        self.counter += 1
        out = self.root / f'{self.counter}.json'
        report = self.root / f'{self.counter}.md'
        result = subprocess.run([sys.executable, str(ENGINE), *args,
                                 '--output-json', str(out), '--output-report', str(report)],
                                capture_output=True, text=True)
        if not success:
            self.assertNotEqual(result.returncode, 0)
            return result
        self.assertEqual(result.returncode, 0, result.stderr)
        data = json.loads(out.read_text())
        self.assertTrue(data['aggregate_stats'])
        self.assertTrue(data['featured_world'])
        self.assertIn('Macro Statistics', report.read_text())
        for event in data['featured_world']['chronicle']:
            self.assertIn(event['true_event'], report.read_text())
        return data

    def test_full_and_resumed_worlds_match_exactly(self):
        for mode in ('evolution', 'monarch', 'wheel', 'versus'):
            with self.subTest(mode=mode):
                base = ['--mode', mode, '--runs', '1', '--years', '100', '--pop', '50',
                        '--seed', '17', '--wall-year', '70', '--wheel-interval', '10']
                full = self.cli(*base)
                state = self.root / f'{mode}.json'
                self.cli(*base, '--checkpoint-year', '30', '--save-state', str(state))
                resumed = self.cli('--load-state', str(state))
                self.assertEqual(full, resumed)

    def test_all_event_controls(self):
        for mode in ('evolution', 'monarch', 'wheel'):
            for event in engine.EVENTS:
                with self.subTest(mode=mode, event=event):
                    data = self.cli('--mode', mode, '--runs', '1', '--years', '10',
                                    '--pop', '50', '--inject-event', event)
                    self.assertTrue(any(e['year'] == 5 and e['category'] in ('wheel', 'famine')
                                        for e in data['featured_world']['chronicle']))

    def test_policies_and_resume_interventions(self):
        for policy in engine.POLICIES:
            with self.subTest(policy=policy):
                data = self.cli('--mode', 'monarch', '--runs', '1', '--years', '5',
                                '--policy-override', policy)
                self.assertTrue(any(e['category'] in ('law', 'tech')
                                    for e in data['featured_world']['chronicle']))
        state = self.root / 'original.json'
        initial = self.cli('--mode', 'monarch', '--runs', '1', '--years', '100',
                           '--checkpoint-year', '30', '--save-state', str(state))
        snapshot = state.read_bytes()
        changed = self.cli('--load-state', str(state), '--checkpoint-year', '60',
                           '--policy-override', 'build_cannons', '--inject-event', 'villain_awakens')
        self.assertEqual(snapshot, state.read_bytes())
        old_events = initial['featured_world']['chronicle']
        self.assertEqual(old_events, changed['featured_world']['chronicle'][:len(old_events)])
        self.assertTrue(any(e['year'] == 31 and 'awakened as villain' in e['true_event']
                            for e in changed['featured_world']['chronicle']))
        self.assertIn('Siege & Boulder Cannons', changed['featured_world']['counter_tech_invented'])

    def test_amnesty_releases_prisoner(self):
        world = engine.run_single_world_evolution_or_monarch_or_wheel(
            'monarch', 42, 10, 30, .1, .35, total_years=100)
        state = copy.deepcopy(world['_state'])
        prisoner = next(a for a in state['variables']['agents'].values() if a['alive'])
        prisoner_id = prisoner['id']
        prisoner['imprisoned_until'] = 99
        continued = engine.run_single_world_evolution_or_monarch_or_wheel(
            'monarch', 42, 11, 30, .1, .35, policy_override='royal_amnesty',
            resume_state=state, total_years=100)
        self.assertEqual(continued['agents'][prisoner_id]['imprisoned_until'], 0)
        self.assertTrue(any('Royal Amnesty released 1 prisoners' in e['true_event']
                            for e in continued['chronicle']))

    def test_batch_save_only_featured_world(self):
        state = self.root / 'batch.json'
        data = self.cli('--runs', '3', '--years', '40', '--checkpoint-year', '10',
                        '--select-world', '3', '--save-state', str(state))
        self.assertEqual(data['featured_world']['world_index'], 3)
        resumed = self.cli('--load-state', str(state))
        self.assertEqual(resumed['runs'], 1)
        self.assertEqual(resumed['featured_world']['world_index'], 3)
        self.assertEqual(resumed['featured_world']['seed'], 42 + 97 * 2)

    def test_version_one_full_save_migrates(self):
        path = self.root / 'saved.json'
        self.cli('--mode', 'monarch', '--runs', '1', '--years', '40',
                 '--checkpoint-year', '10', '--save-state', str(path))
        save = json.loads(path.read_text())
        save['schema_version'] = 1
        save['state'].pop('powers')
        new_fields = {'_powers_version', 'injury', 'energy', 'power_ready_year', 'location',
                      'resurrections', 'death_history', 'clone_of', '_death_recorded'}
        for a in save['state']['variables']['agents'].values():
            for key in list(a):
                if key in new_fields or key.endswith('_until') and key != 'imprisoned_until':
                    a.pop(key)
        path.write_text(json.dumps(save))
        data = self.cli('--load-state', str(path))
        self.assertEqual(data['featured_world']['engine_version'], 2)
        self.assertIn('world_resources', data['featured_world'])

    def test_invalid_controls_and_legacy_state_rejected(self):
        cases = [('--runs', '0'), ('--pop', '0'), ('--wheel-interval', '0'),
                 ('--power-rate', '2'), ('--policy-override', 'invalid'),
                 ('--select-world', 'invalid'), ('--years', '-1'),
                 ('--years', '10', '--checkpoint-year', '20'),
                 ('--mode', 'versus', '--inject-event', 'meteor'),
                 ('--mode', 'versus', '--tribe-a', 'speed', '--tribe-b', 'speed'),
                 ('--load-state', str(self.root / 'missing.json'))]
        for args in cases:
            with self.subTest(args=args):
                self.cli(*args, success=False)
        old = self.root / 'legacy.json'
        old.write_text('{"seed": 42, "chronicle": []}')
        self.cli('--load-state', str(old), success=False)


if __name__ == '__main__':
    unittest.main(verbosity=2)

