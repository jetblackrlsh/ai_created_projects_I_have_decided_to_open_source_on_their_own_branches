#!/usr/bin/env python3
"""Check or restore a pinned cloud-local audio runtime; never accept terms or use tokens.

Default: read-only check. --restore permits provisioning only when authorized by the
caller. --test generates three fresh offline WAVs and validates their signal. JSON
reports distinguish readiness from inference testing. No model weights are bundled.
"""
from __future__ import annotations
import argparse
import contextlib
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'references/audio-runtime-manifest.json'
REQUIREMENTS = ROOT / 'references/audio-runtime-requirements.txt'


class SetupError(RuntimeError):
    pass


def sha256(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(4 * 1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def valid_file(path, entry):
    return path.is_file() and path.stat().st_size == entry['bytes'] and sha256(path) == entry['sha256']


def safe_target(root, relative):
    target = root / relative
    if not target.resolve().is_relative_to(root.resolve()):
        raise SetupError(f'Refusing a path outside the selected runtime root: {relative}')
    return target


def clean_env(offline=False):
    env = dict(os.environ)
    for key in list(env):
        if key in {'HF_TOKEN', 'HUGGING_FACE_HUB_TOKEN', 'HUGGINGFACE_TOKEN', 'GITHUB_TOKEN', 'GH_TOKEN', 'PYTHONPATH', 'PYTHONHOME'} or key.startswith('PIP_'):
            env.pop(key, None)
    env.update(HF_HUB_DISABLE_IMPLICIT_TOKEN='1', HF_HUB_DISABLE_TELEMETRY='1',
               HF_HUB_OFFLINE='1' if offline else '0', GIT_TERMINAL_PROMPT='0',
               GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL=os.devnull,
               OPENBLAS_NUM_THREADS='1', MKL_NUM_THREADS='1', OMP_NUM_THREADS='2',
               PYTHONDONTWRITEBYTECODE='1', PIP_CONFIG_FILE=os.devnull)
    return env


def run(command, *, timeout=300, env=None, cwd=None):
    try:
        result = subprocess.run([str(x) for x in command], env=env or clean_env(), cwd=cwd,
                                stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT, text=True, errors='replace', timeout=timeout)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise SetupError(f'Command failed or timed out: {command[0]} ({exc})') from exc
    if result.returncode:
        raise SetupError(f'Command failed ({result.returncode}): {command[0]}\n{result.stdout[-4000:]}')
    return result.stdout


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile('w', dir=path.parent, suffix='.tmp', delete=False) as f:
        temp = Path(f.name)
        json.dump(value, f, indent=2)
        f.write('\n')
    os.replace(temp, path)


def download(entry, target, timeout):
    """Anonymous HTTPS, bounded retries, hash verification, atomic replacement."""
    if valid_file(target, entry):
        return False
    target.parent.mkdir(parents=True, exist_ok=True)
    free = shutil.disk_usage(target.parent).free
    if free < entry['bytes'] + 256 * 1024**2:
        raise SetupError(f'Insufficient free space for {target.name}; need file size plus 256 MiB.')
    fd, temporary = tempfile.mkstemp(prefix=target.name + '.', suffix='.part', dir=target.parent)
    os.close(fd)
    temporary = Path(temporary)
    try:
        print(f'Restoring {target.name} ({entry["bytes"]:,} bytes); anonymous official source.', flush=True)
        # --disable must come first: do not read a user curlrc or saved authentication.
        run(['curl', '--disable', '--fail', '--location', '--proto', '=https', '--proto-redir', '=https',
             '--connect-timeout', '30', '--max-time', str(timeout), '--retry', '2', '--retry-delay', '5',
             '--retry-max-time', str(timeout), '--silent', '--show-error', '--output', temporary, entry['url']],
            timeout=3 * timeout + 90)
        if not valid_file(temporary, entry):
            raise SetupError(f'Integrity check failed for {target.name}; existing file preserved. No terms or login accepted.')
        if target.exists() or target.is_symlink():
            backup = target.with_name(target.name + f'.invalid-{time.time_ns()}')
            os.replace(target, backup)
        os.replace(temporary, target)
        return True
    finally:
        temporary.unlink(missing_ok=True)


def requirements():
    return dict(line.strip().split('==', 1) for line in REQUIREMENTS.read_text().splitlines()
                if line.strip() and not line.lstrip().startswith('#'))


def package_status(python):
    if not python.is_file():
        return {'ready': False, 'reason': 'Isolated Python environment is missing.'}
    code = "import importlib.metadata as m,json,platform; print(json.dumps({'versions':{d.metadata['Name'].lower().replace('_','-'):d.version for d in m.distributions()},'python':platform.python_version()}))"
    try:
        state = json.loads(run([python, '-I', '-c', code]))
        installed = state['versions']
        missing = {name: {'expected': version, 'found': installed.get(name.lower().replace('_','-'))}
                   for name, version in requirements().items() if installed.get(name.lower().replace('_','-')) != version}
        state['mismatches'] = missing
        state['ready'] = not missing
        if state['ready']:
            run([python, '-I', '-m', 'pip', '--isolated', 'check'])
        return state
    except SetupError as exc:
        return {'ready': False, 'reason': str(exc)}


def ensure_python(root, restore, report):
    python = root / 'venv/bin/python'
    state = package_status(python)
    if not state['ready'] and restore:
        if not python.exists():
            if (root / 'venv').exists():
                raise SetupError('Incomplete venv exists; choose a new runtime root rather than overwrite it.')
            run([sys.executable, '-m', 'venv', root / 'venv'])
        print('Restoring pinned dependencies from PyPI in the isolated venv.', flush=True)
        run([python, '-I', '-m', 'pip', '--isolated', 'install', '--index-url', 'https://pypi.org/simple',
             '--only-binary=:all:', '--disable-pip-version-check', '--no-input', '-r', REQUIREMENTS], timeout=1200)
        report['changes'].append('Installed/repaired pinned Python dependencies')
        state = package_status(python)
    report['python'] = state
    return python


def git(path, *args):
    return run(['git', '-c', 'credential.helper=', '-c', 'core.hooksPath=/dev/null', '-C', path, *args])


def ensure_source(root, manifest, restore, report):
    source = root / 'stable-audio-3'
    expected = manifest['source']
    state = {'ready': False, **expected}
    if not source.exists() and restore:
        # Stage a new checkout separately; never replace an existing or modified repository.
        temporary = Path(tempfile.mkdtemp(prefix='.sa3-source-', dir=root))
        try:
            git(temporary, 'init', '--quiet')
            git(temporary, 'remote', 'add', 'origin', expected['url'])
            git(temporary, 'fetch', '--depth', '1', 'origin', expected['commit'])
            git(temporary, 'checkout', '--detach', 'FETCH_HEAD')
            os.replace(temporary, source)
            report['changes'].append('Restored official Stable Audio source at pinned commit')
        finally:
            if temporary.exists():
                shutil.rmtree(temporary)
    if not source.exists():
        state['reason'] = 'Official Stable Audio checkout is missing.'
    else:
        try:
            commit = git(source, 'rev-parse', 'HEAD').strip()
            origin = git(source, 'remote', 'get-url', 'origin').strip()
            state.update(found_commit=commit, found_origin=origin)
            if commit != expected['commit'] or origin != expected['url']:
                raise SetupError('Runtime checkout differs from pinned official source; use a new runtime root.')
            git(source, 'diff', '--cached', '--quiet', 'HEAD')
            # Restore only missing tracked files. Preserve changed files and stop for review.
            changed = git(source, 'diff', '--name-only', '--diff-filter=ACMRTUXB', 'HEAD').strip()
            missing = git(source, 'ls-files', '--deleted', '-z').split('\0')
            missing = [p for p in missing if p]
            if changed:
                raise SetupError('Tracked runtime files were modified; preserve them and choose a new root: ' + changed[:500])
            if missing and restore:
                git(source, 'restore', '--source=HEAD', '--worktree', '--', *missing)
                report['changes'].append('Restored missing tracked Stable Audio files')
                missing = []
            if missing:
                raise SetupError('Tracked runtime files missing: ' + ', '.join(missing[:5]))
            tokenizer = safe_target(root, manifest['tokenizer']['path'])
            if not valid_file(tokenizer, manifest['tokenizer']):
                raise SetupError('Bundled tokenizer failed its SHA-256 check.')
            state['ready'] = True
        except SetupError as exc:
            state['reason'] = str(exc)
    report['stable_source'] = state
    return source


def ensure_models(root, manifest, restore, timeout, report):
    results = []
    for entry in manifest['files']:
        target = safe_target(root, entry['path'])
        if restore and not valid_file(target, entry):
            if download(entry, target, timeout):
                report['changes'].append('Restored ' + entry['path'])
        results.append({'path': entry['path'], 'ready': valid_file(target, entry),
                        'expected_bytes': entry['bytes'], 'expected_sha256': entry['sha256']})
    report['models'] = results
    # Upstream uses models/tflite/<family>; preserve the older flat layout without duplicate GBs.
    models = root / 'stable-audio-3/optimized/tflite/models'
    links = []
    for family in ('sa3-sm-music', 'sa3-sm-sfx', 'same-s', 't5gemma'):
        alias = safe_target(root, f'stable-audio-3/optimized/tflite/models/tflite/{family}')
        expected = models / family
        good = alias.is_dir() and alias.resolve() == expected.resolve()
        if not good and restore:
            if alias.exists() or alias.is_symlink():
                raise SetupError(f'Unexpected path at {alias}; preserve it and use a new runtime root.')
            alias.parent.mkdir(parents=True, exist_ok=True)
            alias.symlink_to(Path('..') / family, target_is_directory=True)
            good = True
            report['changes'].append('Created model layout alias for ' + family)
        links.append({'path': str(alias.relative_to(root)), 'ready': good})
    report['model_layout'] = links


def test_runtime(python, root, output, threads, timeout):
    output.mkdir(parents=True, exist_ok=True)
    # A fresh subdirectory prevents yesterday's successful files from hiding a failed run.
    run_dir = Path(tempfile.mkdtemp(prefix='offline-smoke-', dir=output))
    env = clean_env(offline=True)
    env['OMP_NUM_THREADS'] = str(threads)
    text = run([python, '-I', ROOT / 'scripts/audio_smoke_runtime.py', '--runtime-root', root,
                '--out-dir', run_dir, '--threads', threads, '--timeout', timeout],
               env=env, timeout=3 * timeout + 60)
    result = json.loads((run_dir / 'smoke-report.json').read_text())
    print(text, end='', flush=True)
    return result


@contextlib.contextmanager
def lock_runtime(root, restore):
    if not restore:
        yield
        return
    import fcntl
    root.mkdir(parents=True, exist_ok=True)
    with (root / '.setup.lock').open('a') as lock:
        try:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise SetupError('Another setup is using this runtime. Wait for it; do not run concurrent repairs.') from exc
        yield


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--runtime-root', type=Path, required=True, help='Dedicated cloud-local writable runtime directory')
    parser.add_argument('--restore', action='store_true', help='Provision missing/invalid known official files; requires existing user authorization')
    parser.add_argument('--test', action='store_true', help='Run fresh offline voice, music and SFX inference')
    parser.add_argument('--report', type=Path, help='Write JSON report; default check otherwise writes nothing')
    parser.add_argument('--test-output', type=Path, help='Parent directory for unique smoke outputs (default: runtime-root/test-results)')
    parser.add_argument('--download-timeout', type=int, default=900)
    parser.add_argument('--inference-timeout', type=int, default=300)
    parser.add_argument('--threads', type=int, default=2)
    args = parser.parse_args()
    if args.download_timeout < 60 or args.inference_timeout < 30 or not 1 <= args.threads <= 32:
        parser.error('Use download timeout >=60, inference timeout >=30 and 1–32 threads.')
    root = args.runtime_root.expanduser().resolve()
    report = {'schema_version': 1, 'mode': 'restore' if args.restore else 'check', 'runtime_root': str(root),
              'ready': False, 'inference': {'status': 'not_run'}, 'changes': [], 'errors': [],
              'manifest_sha256': sha256(MANIFEST), 'requirements_sha256': sha256(REQUIREMENTS)}
    try:
        if platform.system() != 'Linux' or platform.machine() not in ('x86_64', 'AMD64') or sys.version_info[:2] != (3, 12):
            raise SetupError('This pinned setup recipe is validated for Linux x86_64, Python 3.12 only. Use a compatible authorized cloud runtime; do not silently switch computers.')
        for executable in ('git', 'curl'):
            if not shutil.which(executable):
                raise SetupError(f'{executable} is missing. Install it only through an authorized official OS package source.')
        report['media_tools'] = {name: shutil.which(name) for name in ('ffmpeg', 'ffprobe')}
        manifest = json.loads(MANIFEST.read_text())
        with lock_runtime(root, args.restore):
            python = ensure_python(root, args.restore, report)
            ensure_source(root, manifest, args.restore, report)
            if args.restore and not report['stable_source']['ready']:
                raise SetupError(report['stable_source']['reason'])
            ensure_models(root, manifest, args.restore, args.download_timeout, report)
            report['ready'] = report['python']['ready'] and report['stable_source']['ready'] and all(x['ready'] for x in report['models'] + report['model_layout'])
            if args.test:
                if not report['ready']:
                    raise SetupError('Audio setup is not ready; inference not attempted. Review checks and restore only when authorized.')
                report['inference'] = test_runtime(python, root, args.test_output or root / 'test-results', args.threads, args.inference_timeout)
    except (SetupError, OSError, ValueError) as exc:
        report['errors'].append(str(exc))
        if args.test:
            report['inference']['status'] = 'failed_or_not_run'
    if args.report:
        atomic_json(args.report.expanduser().resolve(), report)
    print(json.dumps(report, indent=2))
    return 0 if report['ready'] and not report['errors'] else 1


if __name__ == '__main__':
    sys.exit(main())
