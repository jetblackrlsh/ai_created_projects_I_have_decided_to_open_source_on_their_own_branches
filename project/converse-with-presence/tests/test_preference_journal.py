import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / 'scripts'
sys.path.insert(0, str(SCRIPTS))
import preference_journal as journal

ENTRY = {'topic': 'ending', 'choice': 'cooperation', 'reasons': 'Pays off trust', 'context': 'friendship story', 'source': 'synthetic test only', 'scope': 'assistant_evaluative_preference', 'strength': 'moderate'}

class JournalTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / 'private.json'
    def tearDown(self): self.temp.cleanup()
    def call(self, **data): return journal.operate(self.path, data)
    def record(self, entry=None, rev=0): return self.call(action='record', entry=entry or ENTRY, expected_revision=rev)
    def test_propose_no_ledger_write(self):
        self.call(action='propose', entry=ENTRY)
        self.assertFalse(self.path.exists())
    def test_roundtrip_and_private_mode(self):
        result = self.record()
        self.assertEqual(self.call(action='read')['ledger']['entries'][0], result['entry'])
        self.assertEqual(self.path.stat().st_mode & 0o777, 0o600)
    def test_conflict(self):
        self.record()
        other = dict(ENTRY, choice='isolation')
        self.assertTrue(self.call(action='propose', entry=other)['conflicting_entry_ids'])
        with self.assertRaises(ValueError): self.record(other, 1)
    def test_context_distinction(self):
        self.record()
        self.record(dict(ENTRY, choice='isolation', context='horror story'), 1)
        self.assertEqual(len(self.call(action='read')['ledger']['entries']), 2)
    def test_revision_preserves_history(self):
        old = self.record()['entry']
        new = self.call(action='revise', entry=dict(ENTRY, choice='uncertain reunion'), expected_revision=1, id=old['id'], revision_reason='A revised outline earns ambiguity', revision_source='synthetic test revision')['entry']
        data = self.call(action='read')['ledger']
        self.assertFalse(data['entries'][0]['active'])
        self.assertEqual(new['supersedes'], old['id'])
        self.assertEqual(data['entries'][0]['choice'], 'cooperation')
    def test_revision_requires_reason(self):
        old = self.record()['entry']
        with self.assertRaises(ValueError): self.call(action='revise', entry=ENTRY, expected_revision=1, id=old['id'], revision_reason='', revision_source='test')
    def test_stale_revision(self):
        self.record()
        with self.assertRaises(ValueError): self.record(rev=0)
    def test_source_required(self):
        with self.assertRaises(ValueError): self.record(dict(ENTRY, source=''))
    def test_no_user_scope(self):
        with self.assertRaises(ValueError): self.record(dict(ENTRY, scope='user_preference'))
    def test_search(self):
        self.record()
        self.assertEqual(len(self.call(action='search', query='ENDING')['entries']), 1)
    def test_lock(self):
        self.path.with_name('private.json.lock').touch()
        with self.assertRaises(ValueError): self.call(action='read')
    def test_restore_across_processes(self):
        self.record()
        backup = self.path.read_bytes()
        restored = Path(self.temp.name) / 'restored.json'
        restored.write_bytes(backup)
        result = subprocess.run([sys.executable, str(SCRIPTS / 'preference_journal.py'), '--journal', str(restored)], input=b'{"action":"read"}', capture_output=True)
        self.assertEqual(result.returncode, 0)
        self.assertEqual(json.loads(result.stdout)['ledger']['entries'][0]['choice'], 'cooperation')
    def test_symlink_rejected(self):
        target = Path(self.temp.name) / 'target.json'
        target.write_text('{}')
        self.path.symlink_to(target)
        with self.assertRaises(ValueError): self.call(action='read')
    def test_unknown_fields(self):
        with self.assertRaises(ValueError): self.call(action='read', extra=True)

if __name__ == '__main__': unittest.main()
