#!/usr/bin/env python3
"""Headless World Sim: JSON protocol and durable state, not a language model."""
import argparse
from datetime import datetime, timezone
import uuid
import copy
import hashlib
import json
import math
import os
from pathlib import Path
import re
import sys
import tempfile

MAX_BYTES = 4_000_000
ID = re.compile(r'^[A-Za-z0-9_-]{1,80}$')

class Invalid(ValueError):
    pass

def require(ok, message):
    if not ok:
        raise Invalid(message)

def encode(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode()

def digest(value):
    return hashlib.sha256(encode(value)).hexdigest()

def number(value):
    return type(value) in (int, float) and math.isfinite(value)

def validate(s):
    require(isinstance(s, dict), 'state must be an object')
    required = 'format version world branch turn time player places items npcs facts claims clocks recent_events pending preferences extensions'.split()
    require(all(k in s for k in required), 'missing portable state fields')
    require(s['format'] == 'chat-world-sim' and type(s['version']) is int and s['version'] == 1, 'unsupported format/version')
    for k in ('world', 'branch', 'time', 'player', 'preferences', 'extensions'):
        require(isinstance(s[k], dict), k + ' must be object')
    for k in ('places', 'items', 'npcs', 'facts', 'claims', 'clocks', 'recent_events', 'pending'):
        require(isinstance(s[k], list), k + ' must be list')
    require(type(s['turn']) is int and s['turn'] >= 0, 'invalid turn')
    require(number(s['time'].get('elapsed_minutes')) and s['time']['elapsed_minutes'] >= 0, 'time requires nonnegative elapsed_minutes')
    require(isinstance(s['branch'].get('name'), str), 'branch needs name')
    require(isinstance(s['world'].get('title'), str), 'world needs title')
    entities = [s['player']] + s['places'] + s['items'] + s['npcs'] + s['clocks']
    ids = []
    for x in entities:
        require(isinstance(x, dict) and isinstance(x.get('id'), str) and ID.fullmatch(x['id']), 'invalid entity ID')
        ids.append(x['id'])
    require(len(ids) == len(set(ids)), 'duplicate entity ID')
    places = {x['id'] for x in s['places']}
    holders = places | {x['id'] for x in s['npcs']} | {s['player']['id']}
    for x in [s['player']] + s['npcs']:
        require(x.get('location') in places, 'unknown location')
    for p in s['places']:
        require(isinstance(p.get('connections', []), list), 'connections must be list')
        for c in p.get('connections', []):
            require(isinstance(c, dict) and c.get('to') in places and type(c.get('confirmed')) is bool, 'connection needs to and confirmed')
    for x in s['items']:
        require(x.get('holder') in holders, 'unknown item holder')
        require(number(x.get('quantity')) and x['quantity'] >= 0, 'invalid item quantity')
    for x in s['npcs']:
        require(isinstance(x.get('knowledge'), list), 'NPC knowledge must be list')
    for x in s['clocks']:
        require(number(x.get('target')) and number(x.get('progress')) and 0 <= x['progress'] <= x['target'], 'invalid clock')
    encode(s)
    return s

def observation(s):
    """Allowlist: no goals, knowledge, facts, extensions, pending or event payloads."""
    p = s['player']
    loc = next(x for x in s['places'] if x['id'] == p['location'])
    # Authors explicitly mark public entities. Unmarked NPCs/items stay hidden.
    return {'turn': s['turn'], 'time': s['time']['elapsed_minutes'],
            'player': {'id': p['id'], 'location': p['location']},
            'place': {'id': loc['id'], 'name': loc.get('name', loc['id']),
                      'description': loc.get('public_description', ''),
                      'connections': [c['to'] for c in loc.get('connections', []) if c['confirmed']]},
            'inventory': [{'id': x['id'], 'name': x.get('name', x['id']), 'quantity': x['quantity']} for x in s['items'] if x['holder'] == p['id']],
            'visible_items': [{'id': x['id'], 'name': x.get('name', x['id']), 'quantity': x['quantity']} for x in s['items'] if x['holder'] == p['location'] and x.get('visible') is True],
            'people': [{'id': x['id'], 'name': x.get('name', x['id'])} for x in s['npcs'] if x['location'] == p['location'] and x.get('visible') is True]}

def uid():
    return str(uuid.uuid4())

def utcnow():
    return datetime.now(timezone.utc).isoformat()

def point(doc):
    s = doc['state']
    return {'revision': doc['revision'], 'event_index': len(doc['events']),
            'turn': s['turn'], 'elapsed_minutes': s['time']['elapsed_minutes'],
            'branch_name': s['branch']['name']}

def new_lineage():
    created = utcnow()
    return {'world_id': uid(), 'instance_id': uid(), 'branch_id': uid(),
            'world_created_at': created, 'instance_created_at': created, 'parent_export': None,
            'ancestors': [], 'timeline_history': []}

def ensure_lineage(doc):
    # Old local v1 sessions acquire identity once, without claiming lost provenance.
    if 'lineage' not in doc:
        doc['lineage'] = new_lineage()
        doc['lineage']['timeline_history'].append({'kind': 'legacy_identity_assigned', 'point': point(doc)})
    doc.setdefault('checkpoint_metadata', {})

def export_world(doc):
    state = validate(doc['state'])
    ensure_lineage(doc)
    lineage = copy.deepcopy(doc['lineage'])
    lineage.update(export_id=uid(), exported_at=utcnow(), point=point(doc))
    return {'format': 'world-sim-share', 'version': 2,
            'state': copy.deepcopy(state), 'state_sha256': digest(state),
            'lineage': lineage, 'contains_spoilers': True}

def valid_uuid(value):
    try:
        return isinstance(value, str) and str(uuid.UUID(value)) == value
    except (ValueError, AttributeError):
        return False

def valid_stamp(value):
    try:
        return isinstance(value, str) and datetime.fromisoformat(value).utcoffset() is not None
    except (ValueError, TypeError):
        return False

def validate_point(p):
    require(isinstance(p, dict) and set(p) == {'revision','event_index','turn','elapsed_minutes','branch_name'}, 'invalid lineage point')
    for k in ('revision','event_index','turn'):
        require(type(p[k]) is int and p[k] >= 0, 'invalid lineage counter')
    require(number(p['elapsed_minutes']) and p['elapsed_minutes'] >= 0 and isinstance(p['branch_name'], str), 'invalid lineage time/branch')

def validate_history(history):
    require(isinstance(history, list) and len(history) <= 1000, 'invalid timeline history')
    for event in history:
        require(isinstance(event,dict) and event.get('kind') in ('legacy_identity_assigned','load','branch'), 'invalid timeline event')
        validate_point(event['point'])
        if event['kind'] != 'legacy_identity_assigned':
            require(valid_uuid(event.get('checkpoint_id')) and valid_uuid(event.get('from_branch_id')) and valid_uuid(event.get('branch_id')), 'invalid checkpoint ancestry')
            validate_point(event['target_point'])

def import_world(package):
    require(isinstance(package, dict), 'share package must be object')
    require(set(package) == {'format','version','state','state_sha256','lineage','contains_spoilers'}, 'unknown or missing share package fields')
    require(package['format'] == 'world-sim-share' and type(package['version']) is int and package['version'] == 2, 'unsupported share version; re-export old worlds with current tool')
    state = validate(package['state'])
    require(package['state_sha256'] == digest(state), 'share checksum mismatch')
    require(package['contains_spoilers'] is True, 'full share must declare spoilers')
    l = package['lineage']
    require(isinstance(l, dict) and set(l) == {'world_id','instance_id','branch_id','world_created_at','instance_created_at','parent_export','ancestors','timeline_history','export_id','exported_at','point'}, 'invalid lineage fields')
    for k in ('world_id','instance_id','branch_id','export_id'):
        require(valid_uuid(l[k]), 'invalid lineage UUID')
    require(valid_stamp(l['world_created_at']) and valid_stamp(l['instance_created_at']) and valid_stamp(l['exported_at']), 'invalid lineage timestamp')
    validate_point(l['point'])
    require(l['point']['turn'] == state['turn'] and l['point']['elapsed_minutes'] == state['time']['elapsed_minutes'] and l['point']['branch_name'] == state['branch']['name'], 'lineage point/state mismatch')
    require(isinstance(l['ancestors'], list) and len(l['ancestors']) <= 64, 'invalid or excessive ancestry')
    seen = set()
    for ref in l['ancestors']:
        require(isinstance(ref, dict) and set(ref) == {'world_id','instance_id','branch_id','export_id','exported_at','point','state_sha256','timeline_history'}, 'invalid ancestor reference')
        for k in ('world_id','instance_id','branch_id','export_id'):
            require(valid_uuid(ref[k]), 'invalid ancestor UUID')
        require(ref['world_id'] == l['world_id'] and ref['export_id'] not in seen and ref['export_id'] != l['export_id'], 'inconsistent ancestry')
        require(valid_stamp(ref['exported_at']) and isinstance(ref['state_sha256'], str) and re.fullmatch('[a-f0-9]{64}',ref['state_sha256']), 'invalid ancestor metadata')
        validate_point(ref['point']); validate_history(ref['timeline_history']); seen.add(ref['export_id'])
    require(l['parent_export'] == (l['ancestors'][-1] if l['ancestors'] else None), 'parent/ancestry mismatch')
    validate_history(l['timeline_history'])
    return copy.deepcopy(state)

def continuation_lineage(package):
    old = package['lineage']
    require(len(old['ancestors']) < 64, 'ancestry depth limit reached')
    ref = {k:copy.deepcopy(old[k]) for k in ('world_id','instance_id','branch_id','export_id','exported_at','point')}
    ref['state_sha256'] = package['state_sha256']
    ref['timeline_history'] = copy.deepcopy(old['timeline_history'])
    new = new_lineage()
    new.update(world_id=old['world_id'], world_created_at=old['world_created_at'], parent_export=ref, ancestors=copy.deepcopy(old['ancestors'])+[ref])
    return new

def fresh(state, budget):
    validate(state)
    require(type(budget) is int and 1 <= budget <= 100, 'turn_budget must be 1..100')
    return {'engine': 1, 'revision': 0, 'budget': budget, 'used': 0, 'mode': 'active', 'state': copy.deepcopy(state), 'initial': copy.deepcopy(state), 'pending_action': None, 'events': [], 'receipts': {}, 'checkpoints': {}, 'checkpoint_metadata': {}, 'lineage': new_lineage()}

def replay(doc):
    state = copy.deepcopy(doc['initial'])
    validate(state)
    chain = digest(state)
    for e in doc['events']:
        require(e['before'] == chain, 'broken replay chain')
        validate(e['state'])
        require(e['after'] == digest(e['state']), 'bad replay hash')
        state = copy.deepcopy(e['state'])
        chain = e['after']
    require(state == doc['state'], 'replay/state mismatch')
    return state

def apply(doc, request):
    """Pure transaction: return new document, response; never mutate input on failure."""
    require(isinstance(request, dict), 'request must be object')
    d = copy.deepcopy(doc)
    ensure_lineage(d)
    op = request.get('op')
    if op in ('status', 'observe', 'context', 'export', 'export_world', 'replay'):
        if op == 'status':
            out = {k: d[k] for k in ('revision', 'budget', 'used', 'mode', 'pending_action')}
            out['turn'] = d['state']['turn']
        elif op == 'observe': out = observation(d['state'])
        elif op == 'context': out = {'state': d['state'], 'action': d['pending_action'], 'revision': d['revision']}
        elif op in ('export', 'export_world'):
            require(d['pending_action'] is None, 'resolve pending action before sharing')
            out = export_world(d)
        else: out = replay(d)
        return d, out
    rid = request.get('request_id')
    require(isinstance(rid, str) and ID.fullmatch(rid), 'mutation needs safe request_id')
    fingerprint = digest(request)
    if rid in d['receipts']:
        require(d['receipts'][rid]['hash'] == fingerprint, 'request_id reused with different request')
        return d, d['receipts'][rid]['response']
    require(type(request.get('revision')) is int and request['revision'] == d['revision'], 'stale revision')
    before = digest(d['state'])
    if op == 'action':
        require(d['mode'] == 'active' and d['used'] < d['budget'], 'run paused, stopped or budget exhausted')
        require(d['pending_action'] is None, 'resolve pending action first')
        require(isinstance(request.get('text'), str) and 0 < len(request['text']) <= 10000, 'action needs text <=10000 chars')
        d['pending_action'] = request['text']
    elif op == 'resolve':
        require(d['mode'] == 'active' and d['pending_action'] is not None, 'no active pending action')
        new = validate(request.get('state'))
        old = d['state']
        require(new['turn'] == old['turn'] + 1, 'turn must advance exactly one')
        require(new['time']['elapsed_minutes'] >= old['time']['elapsed_minutes'], 'time cannot rewind')
        require(new['branch'] == old['branch'], 'use branch operation to change branch')
        require(new['player']['id'] == old['player']['id'], 'player ID cannot change')
        oldclocks = {x['id']: x for x in old['clocks']}
        for c in new['clocks']:
            if c['id'] in oldclocks:
                require(c['progress'] >= oldclocks[c['id']]['progress'], 'clock cannot rewind')
        require(isinstance(request.get('narrative'), str) and len(request['narrative']) <= 20000, 'resolve needs narrative <=20000 chars')
        d['state'] = copy.deepcopy(new)
        d['used'] += 1
        d['pending_action'] = None
        if d['used'] >= d['budget']: d['mode'] = 'paused'
    elif op == 'checkpoint':
        label = request.get('label')
        require(isinstance(label, str) and ID.fullmatch(label), 'invalid checkpoint label')
        require(label not in d['checkpoints'], 'checkpoint exists')
        require(d['pending_action'] is None, 'checkpoint only between turns')
        d['checkpoints'][label] = copy.deepcopy(d['state'])
        cp = point(d); cp['revision'] += 1; cp['event_index'] += 1
        d['checkpoint_metadata'][label] = {'checkpoint_id': uid(), 'point': cp}
    elif op in ('load', 'branch'):
        require(d['pending_action'] is None, 'resolve pending action before restoring')
        require(request.get('label') in d['checkpoints'], 'unknown checkpoint')
        source_point = point(d)
        old_branch_id = d['lineage']['branch_id']
        d['state'] = copy.deepcopy(d['checkpoints'][request['label']])
        d['lineage']['branch_id'] = uid()
        meta = d['checkpoint_metadata'].get(request['label'])
        require(meta is not None, 'legacy checkpoint has no lineage; create a fresh checkpoint before restoring')
        d['lineage']['timeline_history'].append({'kind': op, 'point': source_point, 'target_point': copy.deepcopy(meta['point']), 'checkpoint_id': meta['checkpoint_id'], 'label': request['label'], 'from_branch_id': old_branch_id, 'branch_id': d['lineage']['branch_id']})
        if op == 'branch':
            name = request.get('name')
            require(isinstance(name, str) and ID.fullmatch(name), 'invalid branch name')
            d['state']['branch'] = {'name': name, 'parent_checkpoint': request['label']}
        # Never reset run budget on rewind.
    elif op in ('pause', 'stop', 'resume'):
        require(d['mode'] != 'stopped', 'stopped run cannot resume')
        if op == 'resume': require(d['used'] < d['budget'], 'budget exhausted; create a new explicitly bounded run')
        d['mode'] = {'pause': 'paused', 'stop': 'stopped', 'resume': 'active'}[op]
    else: raise Invalid('unknown operation')
    d['revision'] += 1
    e = {'op': op, 'request_id': rid, 'before': before, 'after': digest(d['state']), 'state': copy.deepcopy(d['state'])}
    if op == 'resolve': e.update(action=doc['pending_action'], narrative=request['narrative'])
    d['events'].append(e)
    response = {'revision': d['revision'], 'mode': d['mode'], 'used': d['used'], 'turn': d['state']['turn']}
    d['receipts'][rid] = {'hash': fingerprint, 'response': response}
    return d, response

def parse(raw):
    require(len(raw) <= MAX_BYTES, 'JSON size limit exceeded')
    def pairs(xs):
        d = {}
        for k, v in xs:
            require(k not in d, 'duplicate JSON key')
            d[k] = v
        return d
    return json.loads(raw, object_pairs_hook=pairs, parse_constant=lambda x: (_ for _ in ()).throw(Invalid('nonfinite number')))

def transact(directory, request):
    """Single-writer lock plus optimistic revision. Directory is caller-selected, never story-controlled."""
    require(isinstance(request, dict), 'request must be object')
    if request.get('op') == 'preview_world':
        state = import_world(request.get('package'))
        return {'format': 'world-sim-share', 'version': 2, 'title': state['world']['title'], 'branch': state['branch']['name'], 'turn': state['turn'], 'contains_spoilers': True, 'state_sha256': digest(state)}
    root = Path(directory)
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    require(not root.is_symlink(), 'store cannot be symlink')
    file = root / 'session.json'
    lock = root / 'session.lock'
    require(not file.is_symlink(), 'session cannot be symlink')
    try: fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError: raise Invalid('store busy; if writer crashed, inspect before removing session.lock')
    try:
        os.close(fd)
        if request.get('op') in ('create', 'import_world'):
            require(not file.exists(), 'store exists; import never overwrites a run')
            if request['op'] == 'import_world':
                require('turn_budget' in request, 'import requires an explicit new turn_budget')
                state = import_world(request.get('package'))
                d = fresh(state, request['turn_budget'])
                d['lineage'] = continuation_lineage(request['package'])
            else:
                d = fresh(request.get('state'), request.get('turn_budget', 10))
            out = {'revision': 0, 'mode': 'active', 'used': 0}
        else:
            require(file.exists(), 'create store first')
            d = parse(file.read_bytes())
            require(isinstance(d, dict) and d.get('engine') == 1, 'unsupported engine')
            replay(d)
            ensure_lineage(d)
            d, out = apply(d, request)
        payload = encode(d)
        require(len(payload) <= MAX_BYTES, 'store size limit reached; export and start a bounded run')
        tmp = None
        try:
            fd, tmp = tempfile.mkstemp(prefix='.session-', dir=root)
            with os.fdopen(fd, 'wb') as f:
                f.write(payload); f.flush(); os.fsync(f.fileno())
            os.replace(tmp, file)
        finally:
            if tmp and os.path.exists(tmp): os.unlink(tmp)
        return out
    finally: lock.unlink()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--store', required=True, help='local directory; keep private')
    args = parser.parse_args()
    try:
        request = parse(sys.stdin.buffer.read(MAX_BYTES + 1))
        require(isinstance(request, dict), 'request must be object')
        out = transact(args.store, request)
        print(json.dumps({'ok': True, 'result': out}, ensure_ascii=False, allow_nan=False))
    except (Invalid, KeyError, TypeError, ValueError, OSError, RecursionError) as e:
        print(json.dumps({'ok': False, 'error': str(e)}))
        return 1
    return 0

if __name__ == '__main__':
    sys.exit(main())
