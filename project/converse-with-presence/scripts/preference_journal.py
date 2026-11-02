#!/usr/bin/env python3
"""Explicit private preference ledger. JSON stdin, JSON stdout; local path on CLI."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import tempfile
import uuid
from presence_review import unique_object

FIELDS = {'topic', 'choice', 'reasons', 'context', 'source', 'scope', 'strength'}

def validate_entry(entry):
    if not isinstance(entry, dict) or set(entry) != FIELDS:
        raise ValueError('entry requires exactly topic, choice, reasons, context, source, scope, strength')
    for field in FIELDS:
        if not isinstance(entry[field], str) or not entry[field].strip() or len(entry[field]) > 4000:
            raise ValueError('entry fields must be nonempty strings of at most 4000 code points')
    if entry['scope'] != 'assistant_evaluative_preference':
        raise ValueError('scope must be assistant_evaluative_preference, not a user preference or subjective experience claim')
    if entry['strength'] not in {'tentative', 'moderate', 'strong'}:
        raise ValueError('invalid strength')


def load(path):
    if not path.exists():
        return {'schema_version': 1, 'revision': 0, 'entries': []}
    if path.is_symlink() or path.stat().st_size > 5_000_000:
        raise ValueError('symlink or oversized ledger rejected')
    data = json.loads(path.read_text(encoding='utf-8'), object_pairs_hook=unique_object)
    if not isinstance(data, dict) or set(data) != {'schema_version', 'revision', 'entries'} or data['schema_version'] != 1 or type(data['revision']) is not int or not isinstance(data['entries'], list):
        raise ValueError('invalid ledger schema')
    return data


def norm(text):
    return ' '.join(text.casefold().split())


def conflicts(data, entry, ignore=None):
    # Exact normalized topic/context only; never claim semantic completeness.
    return [item['id'] for item in data['entries'] if item['id'] != ignore and item['active'] and norm(item['topic']) == norm(entry['topic']) and norm(item['context']) == norm(entry['context']) and norm(item['choice']) != norm(entry['choice'])]


def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix='.' + path.name + '.', dir=str(path.parent))
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, 'w', encoding='utf-8') as handle:
            json.dump(data, handle, ensure_ascii=True, indent=2)
            handle.write('\n')
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name): os.unlink(name)


def operate(path, request):
    if not isinstance(request, dict): raise ValueError('request must be an object')
    action = request.get('action')
    allowed = {'read': {'action'}, 'search': {'action', 'query'}, 'propose': {'action', 'entry'}, 'record': {'action', 'entry', 'expected_revision'}, 'revise': {'action', 'entry', 'expected_revision', 'id', 'revision_reason', 'revision_source'}}
    if action not in allowed or set(request) != allowed[action]: raise ValueError('unknown action or wrong fields')
    # Exclusive advisory lock serializes these tool instances; never delete a stale lock automatically.
    path.parent.mkdir(parents=True, exist_ok=True)
    lock = path.with_name(path.name + '.lock')
    try:
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        raise ValueError('ledger locked; check for another writer or stale lock before retrying')
    try:
        os.close(fd)
        data = load(path)
        if action == 'read': return {'ok': True, 'ledger': data}
        if action == 'search':
            query = request['query']
            if not isinstance(query, str) or len(query) > 4000: raise ValueError('invalid query')
            result = [e for e in data['entries'] if norm(query) in norm(' '.join(e[f] for f in FIELDS))]
            return {'ok': True, 'revision': data['revision'], 'entries': result, 'note': 'Literal normalized search; inspect related topics and contexts manually.'}
        entry = request['entry']
        validate_entry(entry)
        ignore = request.get('id') if action == 'revise' else None
        flags = conflicts(data, entry, ignore)
        if action == 'propose':
            return {'ok': True, 'revision': data['revision'], 'conflicting_entry_ids': flags, 'written': False, 'note': 'Exact topic/context comparison only. Agent must inspect semantic differences and provenance.'}
        if type(request['expected_revision']) is not int or request['expected_revision'] != data['revision']:
            raise ValueError('stale expected_revision; reread before writing')
        if flags: raise ValueError('conflicting active choice in same topic/context; inspect and revise existing entry instead')
        timestamp = datetime.now(timezone.utc).isoformat()
        new = dict(entry, id=str(uuid.uuid4()), recorded_at=timestamp, active=True, supersedes=None)
        if action == 'revise':
            for field in ('revision_reason', 'revision_source'):
                if not isinstance(request[field], str) or not request[field].strip() or len(request[field]) > 4000: raise ValueError('revision needs a nonempty reason and source')
            old = next((e for e in data['entries'] if e['id'] == request['id'] and e['active']), None)
            if old is None: raise ValueError('active revision target not found')
            if norm(old['topic']) != norm(entry['topic']) or norm(old['context']) != norm(entry['context']): raise ValueError('revision must preserve topic/context; record contextual preference separately')
            old['active'] = False
            new.update(supersedes=old['id'], revision_reason=request['revision_reason'], revision_source=request['revision_source'])
        data['entries'].append(new)
        data['revision'] += 1
        save(path, data)
        return {'ok': True, 'revision': data['revision'], 'entry': new}
    finally:
        lock.unlink()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--journal', required=True, help='Explicit private ledger path outside the reusable skill package')
    args = parser.parse_args()
    try:
        raw = __import__('sys').stdin.buffer.read(100001)
        if len(raw) > 100000: raise ValueError('request too large')
        request = json.loads(raw.decode('utf-8'), object_pairs_hook=unique_object)
        result = operate(Path(args.journal).expanduser().absolute(), request)
    except (ValueError, OSError, TypeError, KeyError, UnicodeError) as exc:
        print(json.dumps({'ok': False, 'error': str(exc)}))
        return 2
    print(json.dumps(result))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
