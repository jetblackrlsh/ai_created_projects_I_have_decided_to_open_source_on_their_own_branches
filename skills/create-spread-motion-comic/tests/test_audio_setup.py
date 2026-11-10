import contextlib
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('setup_audio_runtime', ROOT/'scripts/setup_audio_runtime.py')
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)


class AudioSetupTests(unittest.TestCase):
    def entry(self, data=b'verified model'):
        return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
                'url': 'https://github.com/official/release/model'}

    def test_check_integrity(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'model'; p.write_bytes(b'wrong')
            self.assertFalse(setup.valid_file(p,self.entry()))
            p.write_bytes(b'verified model')
            self.assertTrue(setup.valid_file(p,self.entry()))

    def test_valid_download_is_idempotent_and_offline(self):
        with tempfile.TemporaryDirectory() as d, patch.object(setup,'run') as run:
            p=Path(d)/'model'; p.write_bytes(b'verified model')
            original=p.stat().st_mtime_ns
            self.assertFalse(setup.download(self.entry(),p,60))
            self.assertFalse(setup.download(self.entry(),p,60))
            run.assert_not_called()
            self.assertEqual(original,p.stat().st_mtime_ns)

    def fake_download(self, data):
        def run(cmd, **kwargs):
            Path(cmd[cmd.index('--output')+1]).write_bytes(data)
            self.assertEqual(cmd[:2],['curl','--disable'])
            self.assertNotIn('--insecure',cmd)
        return run

    def test_restores_missing_and_replaces_corrupt_atomically(self):
        with tempfile.TemporaryDirectory() as d, patch.object(setup,'run',side_effect=self.fake_download(b'verified model')):
            p=Path(d)/'model'
            self.assertTrue(setup.download(self.entry(),p,60))
            p.write_bytes(b'corrupt')
            self.assertTrue(setup.download(self.entry(),p,60))
            self.assertEqual(p.read_bytes(),b'verified model')
            self.assertEqual(next(Path(d).glob('model.invalid-*')).read_bytes(),b'corrupt')
            self.assertFalse(list(Path(d).glob('*.part')))

    def test_bad_download_preserves_existing(self):
        with tempfile.TemporaryDirectory() as d, patch.object(setup,'run',side_effect=self.fake_download(b'bad response')):
            p=Path(d)/'model'; p.write_bytes(b'original')
            with self.assertRaises(setup.SetupError): setup.download(self.entry(),p,60)
            self.assertEqual(p.read_bytes(),b'original')
            self.assertFalse(list(Path(d).glob('*.part')))

    def test_failed_download_preserves_existing(self):
        with tempfile.TemporaryDirectory() as d, patch.object(setup,'run',side_effect=setup.SetupError('HTTP 403 requires review')):
            p=Path(d)/'model'; p.write_bytes(b'original')
            with self.assertRaises(setup.SetupError): setup.download(self.entry(),p,60)
            self.assertEqual(p.read_bytes(),b'original')
            self.assertFalse(list(Path(d).glob('*.part')))

    def test_root_traversal_and_external_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)/'root'; root.mkdir()
            (root/'escape').symlink_to(Path(d),target_is_directory=True)
            for rel in ('../private','escape/private'):
                with self.assertRaises(setup.SetupError): setup.safe_target(root,rel)

    def test_token_env_removed_and_offline_set(self):
        with patch.dict(setup.os.environ,{'HF_TOKEN':'must-not-leave','PIP_EXTRA_INDEX_URL':'https://invalid.test','PYTHONPATH':'/tmp/arbitrary'}):
            env=setup.clean_env(offline=True)
            for name in ('HF_TOKEN','PIP_EXTRA_INDEX_URL','PYTHONPATH'): self.assertNotIn(name,env)
            self.assertEqual(env['HF_HUB_OFFLINE'],'1')
            self.assertEqual(env['GIT_TERMINAL_PROMPT'],'0')

    def test_missing_models_check_does_not_create_directories(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)/'absent'; report={}
            setup.ensure_models(root,json.loads(setup.MANIFEST.read_text()),False,60,report)
            self.assertFalse(root.exists())
            self.assertFalse(any(x['ready'] for x in report['models']))

    def test_lock_rejects_concurrent_restore(self):
        with tempfile.TemporaryDirectory() as d:
            with setup.lock_runtime(Path(d),True):
                with self.assertRaises(setup.SetupError):
                    with setup.lock_runtime(Path(d),True): pass

    def test_manifest_complete_and_pinned(self):
        m=json.loads(setup.MANIFEST.read_text())
        self.assertEqual(len(m['files']),6)
        self.assertRegex(m['source']['commit'],r'^[a-f0-9]{40}$')
        self.assertRegex(m['model_revision'],r'^[a-f0-9]{40}$')
        for f in m['files']:
            self.assertRegex(f['sha256'],r'^[a-f0-9]{64}$')
            self.assertTrue(f['url'].startswith(('https://github.com/thewh1teagle/kokoro-onnx/releases/',
                                                   'https://huggingface.co/stabilityai/stable-audio-3-optimized/resolve/')))


if __name__ == '__main__':
    unittest.main()
