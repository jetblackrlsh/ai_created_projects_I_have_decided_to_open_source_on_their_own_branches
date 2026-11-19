"""Headless build evidence, GGUF inspection, functional evaluation and comparisons."""

import argparse
from contextlib import contextmanager
from collections import Counter
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import re
import statistics
import struct
import subprocess
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import build_opener, HTTPRedirectHandler, ProxyHandler, Request


def load(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def write(value, path=None):
    data = json.dumps(value, ensure_ascii=True, indent=2) + '\n'
    if path:
        Path(path).write_text(data, encoding='utf-8')
    else:
        print(data, end='')


def artifact(path):
    path = Path(path)
    with path.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    return {'name': path.name, 'bytes': path.stat().st_size, 'sha256': digest}


SCALARS = {0: 'B', 1: 'b', 2: 'H', 3: 'h', 4: 'I', 5: 'i', 6: 'f', 7: '?', 10: 'Q', 11: 'q', 12: 'd'}


def inspect_gguf(path):
    with Path(path).open('rb') as stream:
        size = Path(path).stat().st_size

        def take(count):
            if count > size - stream.tell():
                raise ValueError('Truncated GGUF')
            data = stream.read(count)
            if len(data) != count:
                raise ValueError('Truncated GGUF')
            return data

        def skip(count):
            if count > size - stream.tell():
                raise ValueError('Truncated GGUF')
            stream.seek(count, 1)

        def unpack(kind):
            return struct.unpack('<' + kind, take(struct.calcsize('<' + kind)))[0]

        def string(read=True):
            length = unpack('Q')
            if not read:
                skip(length)
                return None
            if length > 1_000_000:
                raise ValueError('Unexpectedly large GGUF field')
            return take(length).decode('utf-8')

        def value(kind, keep=False):
            if kind in SCALARS:
                if keep:
                    return unpack(SCALARS[kind])
                skip(struct.calcsize('<' + SCALARS[kind]))
            elif kind == 8:
                return string(keep)
            elif kind == 9:
                inner, count = unpack('I'), unpack('Q')
                if inner in SCALARS:
                    skip(count * struct.calcsize('<' + SCALARS[inner]))
                elif inner == 8 and count <= (size - stream.tell()) // 8:
                    for _ in range(count):
                        string(False)
                else:
                    raise ValueError('Unsupported or malformed GGUF array')
            else:
                raise ValueError(f'Unknown GGUF value type {kind}')

        if take(4) != b'GGUF' or (version := unpack('I')) not in (2, 3):
            raise ValueError('Expected little-endian GGUF version 2 or 3')
        tensors, metadata_count = unpack('Q'), unpack('Q')
        meta = {}
        for _ in range(metadata_count):
            name, kind = string(), unpack('I')
            keep = name.startswith('general.') or name.endswith(('context_length', 'embedding_length', 'block_count'))
            result = value(kind, keep)
            if keep and result is not None:
                meta[name] = result
        counts = Counter()
        max_offset = 0
        for _ in range(tensors):
            string(False)
            dimensions = unpack('I')
            if not 1 <= dimensions <= 4:
                raise ValueError('Unexpected GGUF tensor rank')
            shape = [unpack('Q') for _ in range(dimensions)]
            quant_type, offset = unpack('I'), unpack('Q')
            max_offset = max(max_offset, offset)
            counts[str(quant_type)] += math.prod(shape)
        alignment = meta.get('general.alignment', 32)
        data_start = (stream.tell() + alignment - 1) // alignment * alignment
        if tensors and data_start + max_offset >= size:
            raise ValueError('GGUF tensor data is missing')
    return {**artifact(path), 'gguf_version': version, 'tensors': tensors, 'parameters': sum(counts.values()),
            'parameters_by_ggml_type_id': dict(counts), 'metadata': meta}


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


HTTP = build_opener(ProxyHandler({}), NoRedirect())
NO_WINDOW = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0


def origin(base):
    url = urlsplit(base)
    if url.scheme != 'http' or url.hostname not in ('127.0.0.1', 'localhost', '::1') or url.path not in ('', '/') or url.query or url.fragment or url.username:
        raise ValueError('Specify a loopback HTTP origin such as http://127.0.0.1:8080')
    return f'http://{url.netloc}'


def http(base, endpoint, *, body=None, timeout=15):
    route = endpoint['path']
    if not route.startswith('/') or route.startswith('//'):
        raise ValueError('HTTP path must start with one slash')
    encoded = json.dumps(body).encode() if body is not None else None
    req = Request(base + route, encoded, {'Content-Type': 'application/json', 'Origin': base, **endpoint.get('headers', {})},
                  method=endpoint.get('method', 'POST'))
    try:
        with HTTP.open(req, timeout=timeout) as response:
            data = response.read(8_000_001)
    except HTTPError as error:
        raise RuntimeError(f'HTTP {error.code}: {error.read(512).decode(errors="replace")}') from error
    if len(data) > 8_000_000:
        raise ValueError('JSON response exceeded 8 MB')
    return json.loads(data)


def at(data, pointer):
    """Resolve a JSON Pointer, including array indices and escaped key segments."""
    if pointer == '':
        return data
    if not pointer.startswith('/'):
        raise ValueError(f'Use a JSON Pointer such as /world/facts/0: {pointer}')
    for part in pointer[1:].split('/'):
        part = part.replace('~1', '/').replace('~0', '~')
        if isinstance(data, list):
            if not part.isdecimal():
                raise KeyError(part)
            data = data[int(part)]
        else:
            data = data[part]
    return data


def substitute(value, scope):
    if isinstance(value, list):
        return [substitute(entry, scope) for entry in value]
    if isinstance(value, dict):
        if set(value) == {'$ref'}:
            return at(scope, value['$ref'])
        return {key: substitute(entry, scope) for key, entry in value.items()}
    return value


ABSENT = object()


def check(result, rule, scope):
    path = rule['path']
    try:
        actual = at(result, path)
    except (KeyError, IndexError, TypeError):
        actual = ABSENT
    operator = rule['op']
    expected = substitute(rule.get('value'), scope)
    if operator == 'missing':
        return actual is ABSENT
    if actual is ABSENT:
        return False
    if operator == 'exists':
        return True
    if operator == 'eq':
        return actual == expected
    if operator == 'ne':
        return actual != expected
    if operator == 'one_of':
        return actual in expected
    if operator in ('contains', 'excludes'):
        match = expected in actual
        return match if operator == 'contains' else not match
    if operator in ('regex', 'not_regex'):
        match = bool(re.search(expected, actual))
        return match if operator == 'regex' else not match
    if operator == 'min':
        return actual >= expected
    raise ValueError(f'Unknown assertion operator {operator}')


@contextmanager
def server(config, base, timeout, log_path):
    if not config:
        yield None
        return
    ready = config.get('ready', '/health')
    try:
        http(base, {'path': ready, 'method': 'GET'}, timeout=.3)
    except HTTPError:
        raise ValueError(f'An HTTP service is already running at {base}')
    except RuntimeError:
        raise ValueError(f'An HTTP service is already running at {base}')
    except (URLError, TimeoutError):
        pass
    else:
        raise ValueError(f'An HTTP service is already running at {base}; omit --launch to use it')
    started = time.perf_counter()
    with Path(log_path).open('wb') as log:
        proc = subprocess.Popen(config['argv'], cwd=config.get('cwd'), creationflags=NO_WINDOW,
                                stdout=log, stderr=subprocess.STDOUT)
        try:
            deadline = started + timeout
            while True:
                if proc.poll() is not None:
                    raise RuntimeError(f'Server exited {proc.returncode}; see {log_path}')
                try:
                    status = http(base, {'path': ready, 'method': 'GET'}, timeout=.4)
                    if config.get('ready_pointer') and at(status, config['ready_pointer']) is not True:
                        raise RuntimeError('Readiness flag is not true')
                except (OSError, ValueError, RuntimeError, KeyError):
                    if time.perf_counter() >= deadline:
                        raise RuntimeError(f'Readiness timed out; see {log_path}')
                    time.sleep(.1)
                else:
                    break
            yield round((time.perf_counter() - started) * 1000, 2)
        finally:
            if config.get('shutdown') and proc.poll() is None:
                try:
                    http(base, {'path': config['shutdown']}, timeout=2)
                    proc.wait(timeout=3)
                except (OSError, RuntimeError, subprocess.TimeoutExpired):
                    pass
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()
                    proc.wait()


def metrics(samples):
    ordered = sorted(samples)
    if not ordered:
        return None
    return {'n': len(ordered), 'median': round(statistics.median(ordered), 2),
            'p95': round(ordered[math.ceil(.95 * len(ordered)) - 1], 2), 'max': round(ordered[-1], 2)}


def run(args):
    suite = load(args.suite)
    base = origin(args.base)
    cases = suite['cases']
    ids = [case['id'] for case in cases]
    if not ids or len(set(ids)) != len(ids) or any(not case['steps'] for case in cases):
        raise ValueError('Use at least one case, unique case IDs, and nonempty steps')
    results, groups, samples = [], {}, []
    config = load(args.launch) if args.launch else None
    identity = [artifact(path) for path in args.artifact]
    with server(config, base, args.timeout, args.server_log) as startup:
        for _ in range(args.warmups):
            step = suite.get('warmup', cases[0]['steps'][0])
            endpoint = {**suite.get('endpoint', {}), **step.get('endpoint', {})}
            http(base, endpoint, body=substitute(step.get('request'), {'seed': args.seed}), timeout=args.timeout)
        for iteration in range(args.repeats):
            for case in cases:
                scope = {'seed': args.seed + iteration, 'steps': {}, 'previous': None}
                current = []
                group = groups.setdefault(case.get('group', 'default'), Counter())
                for step in case['steps']:
                    label = step['id']
                    if label in scope['steps']:
                        raise ValueError(f'Duplicate step ID in {case["id"]}: {label}')
                    before = time.perf_counter()
                    try:
                        endpoint = {**suite.get('endpoint', {}), **step.get('endpoint', {})}
                        body = substitute(step.get('request'), scope)
                        response = http(base, endpoint, body=body, timeout=args.timeout)
                        elapsed = round((time.perf_counter() - before) * 1000, 2)
                        failures = [rule for rule in step['assert'] if not check(response, rule, scope)]
                    except (OSError, ValueError, TypeError, KeyError, IndexError, RuntimeError) as error:
                        current.append({'id': label, 'error': str(error)})
                        group['error'] += 1
                        break
                    samples.append(elapsed)
                    row = {'id': label, 'ms': elapsed, 'ok': not failures, 'failed_checks': failures}
                    if args.capture or failures:
                        row['response'] = response
                    current.append(row)
                    group['passed' if row['ok'] else 'failed'] += 1
                    scope['steps'][label] = scope['previous'] = response
                results.append({'case': case['id'], 'group': case.get('group', 'default'), 'iteration': iteration, 'steps': current})
    failed = sum(count['failed'] + count['error'] for count in groups.values())
    report = {'schema': 1, 'suite': suite.get('name', Path(args.suite).stem), 'suite_sha256': artifact(args.suite)['sha256'],
              'artifacts': identity, 'runtime': args.runtime, 'host': platform.platform(), 'cpu': platform.processor(),
              'settings': {'repeats': args.repeats, 'warmups': args.warmups, 'seed': args.seed},
              'startup_ms': startup, 'latency_ms': metrics(samples), 'groups': {k: dict(v) for k, v in groups.items()},
              'failed_steps': failed, 'results': results}
    write(report, args.output)
    return int(bool(failed))


def compare(args):
    older, newer = load(args.baseline), load(args.candidate)
    for key in ('suite_sha256', 'settings'):
        if older[key] != newer[key]:
            raise ValueError(f'Align benchmark {key} before comparing')

    def outcomes(report):
        return {(case['case'], case['iteration'], step['id']): step.get('ok', False)
                for case in report['results'] for step in case['steps']}

    old, new = outcomes(older), outcomes(newer)
    regressed = [key for key, result in old.items() if result and not new.get(key)]
    recovered = [key for key, result in new.items() if result and key in old and not old[key]]
    latency = {'baseline': older['latency_ms'], 'candidate': newer['latency_ms']}
    write({'regressed': regressed, 'recovered': recovered, 'latency_ms': latency,
           'same_host': (older['host'], older['cpu']) == (newer['host'], newer['cpu']),
           'runtime': {'baseline': older['runtime'], 'candidate': newer['runtime']}}, args.output)
    return int(bool(regressed))


def build(args):
    config = load(args.recipe)
    cwd = Path(config.get('cwd', '.')).resolve()
    records = []
    for step in config['steps']:
        argv = step['argv']
        before = time.perf_counter()
        subprocess.run(argv, cwd=cwd, check=True, timeout=args.timeout, stdout=sys.stderr, creationflags=NO_WINDOW)
        records.append({'argv': argv, 'ms': round((time.perf_counter() - before) * 1000, 2)})
    write({'cwd': str(cwd), 'commands': records, 'artifacts': [artifact(cwd / path) for path in config['outputs']]}, args.output)
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    inspect = commands.add_parser('inspect', help='Read GGUF tensor shapes and hash checkpoint bytes')
    inspect.add_argument('checkpoint')
    inspect.add_argument('--output')
    compile_cmd = commands.add_parser('build', help='Run a JSON build recipe and hash its outputs')
    compile_cmd.add_argument('recipe')
    compile_cmd.add_argument('--timeout', type=float, default=300)
    compile_cmd.add_argument('--output')
    bench = commands.add_parser('run', help='Evaluate a JSON suite on a loopback endpoint')
    bench.add_argument('suite')
    bench.add_argument('--base', required=True)
    bench.add_argument('--launch', help='JSON process configuration, optional')
    bench.add_argument('--server-log', default='wsp-server.log')
    bench.add_argument('--artifact', action='append', default=[])
    bench.add_argument('--runtime', default='', help='Runtime version, threads, backend and quantization label')
    bench.add_argument('--repeats', type=int, default=1)
    bench.add_argument('--warmups', type=int, default=1)
    bench.add_argument('--seed', type=int, default=42)
    bench.add_argument('--timeout', type=float, default=15)
    bench.add_argument('--capture', action='store_true', help='Include passing responses in the report')
    bench.add_argument('--output')
    diff = commands.add_parser('compare', help='Compare per-step results from identical suites and run settings')
    diff.add_argument('baseline')
    diff.add_argument('candidate')
    diff.add_argument('--output')
    args = parser.parse_args()
    try:
        if args.command == 'inspect':
            write(inspect_gguf(args.checkpoint), args.output)
            return 0
        if args.command == 'run' and (args.repeats < 1 or args.warmups < 0):
            raise ValueError('Repeats must be positive and warmups nonnegative')
        return {'build': build, 'run': run, 'compare': compare}[args.command](args)
    except (ValueError, OSError, TypeError, KeyError, RuntimeError, subprocess.SubprocessError) as error:
        print(f'wsp: {error}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
