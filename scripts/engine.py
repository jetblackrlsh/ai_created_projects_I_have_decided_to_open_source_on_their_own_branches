"""Freeform RPG Engine v1.0: deterministic validation, not an AI narrator."""
import argparse, copy, datetime, hashlib, json, os, tempfile
from pathlib import Path

def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def integer(v, low=None, high=None):
    if type(v) is not int or (low is not None and v<low) or (high is not None and v>high): raise ValueError('invalid integer')
    return v

def new_campaign(cid, title):
    s={k:[] for k in ('player_characters','companions','inventory','abilities','transformations','factions','npcs','relationships','locations','quests','clues','world_clocks','chronicle','continuity_flags','open_threads','resolved_check_ids')}
    s.update(schema_version=1,campaign_id=cid,title=title,system='Freeform homebrew d20',created_at=now(),updated_at=now(),setting='',tone='',rules={'natural_override':True},resources={},current_scene={'id':'scene-1'},pending_check=None,turn_index=0,session_index=1,revision=0,next_scene_prompt='Begin at the damaged skybridge.')
    return s

def validate(s):
    if s.get('schema_version')!=1 or not isinstance(s.get('campaign_id'),str) or not s['campaign_id']: raise ValueError('invalid campaign')
    integer(s['revision'],0);integer(s['turn_index'],0)
    if len(set(s['resolved_check_ids']))!=len(s['resolved_check_ids']): raise ValueError('duplicate ledger')
    if s.get('pending_check'): validate_check(s['pending_check'])
    return s

def validate_check(c):
    for k in ('id','scene_id','action','success','failure'):
        if not isinstance(c.get(k),str) or not c[k].strip(): raise ValueError('missing '+k)
    integer(c['dc'],1,100)
    if not isinstance(c['modifiers'],dict): raise ValueError('modifiers must be named')
    for v in c['modifiers'].values(): integer(v,-100,100)
    integer(c.get('partial_margin',0),0,20)
    if c.get('partial_margin') and not c.get('partial'): raise ValueError('declare partial consequence')
    if type(c.get('natural_override',True)) is not bool: raise ValueError('natural rule must be boolean')
    return c

def declare(s,c):
    validate(s);validate_check(c)
    if s['pending_check']: raise ValueError('resolve existing check first')
    if c['id'] in s['resolved_check_ids'] or c['scene_id']!=s['current_scene']['id']: raise ValueError('stale check')
    n=copy.deepcopy(s);n['pending_check']=copy.deepcopy(c);return n

def outcome(c,raw):
    integer(raw,1,20); total=raw+sum(c['modifiers'].values())
    if c.get('natural_override',True) and raw==1: result='failure'
    elif c.get('natural_override',True) and raw==20: result='success'
    elif total>=c['dc']: result='success'
    elif c.get('partial_margin',0) and total>=c['dc']-c['partial_margin']: result='partial'
    else: result='failure'
    return {'raw_d20':raw,'modifier':sum(c['modifiers'].values()),'total':total,'dc':c['dc'],'outcome':result}

def resolve(s,submitted,narration,state_changes=None):
    validate(s)
    if submitted.get('check_id') in s['resolved_check_ids']: raise ValueError('already resolved')
    c=s['pending_check']
    if not c or submitted.get('campaign_id')!=s['campaign_id'] or submitted.get('scene_id')!=c['scene_id'] or submitted.get('check_id')!=c['id']: raise ValueError('wrong campaign/scene/check')
    result=outcome(c,submitted.get('raw_d20')) # Ignore claimed total/DC/outcome.
    n=copy.deepcopy(s)
    allowed={'resources','inventory','relationships','quests','current_scene','world_clocks','next_scene_prompt','open_threads','continuity_flags','npcs','abilities'}
    for k,v in (state_changes or {}).items():
        if k not in allowed: raise ValueError('unsupported state change '+k)
        n[k]=copy.deepcopy(v)
    n['turn_index']+=1;n['resolved_check_ids'].append(c['id']);n['pending_check']=None
    n['chronicle'].append({'sequence':n['turn_index'],'player_action_verbatim':c['action'],'player_addendum_verbatim':submitted.get('extra_text',''),'check':copy.deepcopy(c),'roll':result,'narration':narration,'declared_consequence':c[result['outcome']],'state_changes':copy.deepcopy(state_changes or {}),'provenance':'resolved player-reported roll; not cryptographically authenticated'})
    return n

def action(selection,text,options):
    if selection not in options: raise ValueError('unknown choice')
    if selection=='Custom action' and not text.strip(): raise ValueError('custom action needs text')
    return {'selection':selection,'extra_text':text}

def advance_clock(s,name,minutes):
    integer(minutes,0); n=copy.deepcopy(s)
    clock=next(x for x in n['world_clocks'] if x['name']==name)
    clock['remaining']=max(0,clock['remaining']-minutes);return n

def digest(s): return hashlib.sha256(json.dumps(s,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
def save(path,s,expected_revision=None):
    """Atomic local save with optimistic concurrency. Drive revision checks belong to adapter."""
    validate(s); path=Path(path);lock=Path(str(path)+'.lock')
    fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    tmp=None
    try:
        current=json.loads(path.read_text()) if path.exists() else None
        actual=current['revision'] if current else None
        if actual!=expected_revision: raise ValueError('stale revision')
        n=copy.deepcopy(s);n['revision']=(actual+1) if current else 0;n['updated_at']=now()
        with tempfile.NamedTemporaryFile('w',dir=path.parent,delete=False,encoding='utf8') as f:
            tmp=f.name;json.dump(n,f,indent=2,ensure_ascii=False);f.flush();os.fsync(f.fileno())
        os.replace(tmp,path);tmp=None;return n
    finally:
        os.close(fd);lock.unlink()
        if tmp: os.unlink(tmp)

def export_log(s,summary):
    lines=['# '+s['title']]
    for e in s['chronicle']:
        lines += ['\n## Turn '+str(e['sequence']), e['player_action_verbatim'],e.get('player_addendum_verbatim',''),e['narration'],json.dumps(e.get('roll'),ensure_ascii=False)]
    for title,key in [('Character sheet','player_characters'),('Companions','companions'),('NPC index','npcs'),('Factions','factions'),('Inventory','inventory'),('Abilities','abilities'),('Open quests','quests'),('Open threads','open_threads'),('World clocks','world_clocks')]:
        lines+=['\n## '+title,json.dumps(s.get(key,[]),ensure_ascii=False,indent=2)]
    lines+=['\n## Session summary',summary,'\n## Exact resume point',s['next_scene_prompt'],'Pending check: '+json.dumps(s['pending_check'],ensure_ascii=False)]
    return '\n\n'.join(lines)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('command',choices=['new','validate','export']);p.add_argument('path');p.add_argument('--title',default='Skybridge Rescue');p.add_argument('--summary',default='Session paused; no ending invented.');a=p.parse_args()
    if a.command=='new': print(json.dumps(save(a.path,new_campaign('skybridge-demo',a.title))))
    else:
        s=validate(json.loads(Path(a.path).read_text()))
        print(export_log(s,a.summary) if a.command=='export' else digest(s))
