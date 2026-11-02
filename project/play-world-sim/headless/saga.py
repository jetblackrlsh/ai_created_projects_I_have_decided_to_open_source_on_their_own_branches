"""Validated character sagas. Dates are fictional minutes, never wall-clock time."""
import copy
import worldsim as w

KINDS={'biological_parent','adoptive_parent','mentor','partner'}
CATEGORIES={'birth','death','adventure','relationship','achievement','turning_point','quiet_change'}

def text(v):
    w.require(isinstance(v,str) and 0<len(v)<=10000,'saga text must be nonempty and bounded')

def ident(v):
    w.require(isinstance(v,str) and w.ID.fullmatch(v),'invalid saga ID')

def provenance(p):
    w.require(isinstance(p,dict) and set(p)=={'kind','refs'} and p['kind'] in ('source_canon','generated_continuation'),'invalid saga provenance')
    w.require(isinstance(p['refs'],list) and 1<=len(p['refs'])<=20,'saga provenance needs1..20 source/event references')
    for ref in p['refs']:text(ref)

def rows(value,fields,limit):
    w.require(isinstance(value,list) and len(value)<=limit,'saga collection limit/type')
    seen=set()
    for row in value:
        w.require(isinstance(row,dict) and set(row)==set(fields.split()),'invalid saga record fields')
        ident(row['id']);w.require(row['id'] not in seen,'duplicate saga record ID');seen.add(row['id'])
    return seen

def validate(state):
    saga=state['extensions'].get('character_saga')
    if saga is None:return
    w.require(isinstance(saga,dict) and set(saga)=={'version','calendar','plan','characters','relationships','milestones','bridges','threads'},'invalid character_saga fields')
    w.require(type(saga['version']) is int and saga['version']==1,'unsupported saga version')
    text(saga['calendar'])
    now=state['time']['elapsed_minutes']
    ids=rows(saga['characters'],'id name entity_id birth death provenance',200)
    w.require(bool(ids),'saga requires characters')
    entities={state['player']['id']}|{n['id'] for n in state['npcs']}
    chars={c['id']:c for c in saga['characters']};linked=set()
    for c in chars.values():
        text(c['name']);provenance(c['provenance'])
        e=c['entity_id'];w.require(e is None or (isinstance(e,str) and e in entities and e not in linked),'unknown/duplicate saga entity link')
        if e is not None:linked.add(e)
        for key in ('birth','death'):
            w.require(c[key] is None or (w.number(c[key]) and c[key]<=now),'life date must be known past/current or null')
        w.require(c['birth'] is None or c['death'] is None or c['birth']<=c['death'],'death precedes birth')
    p=saga['plan']
    w.require(isinstance(p,dict) and set(p)=={'roots','include_descendants','start','end','max_jump','max_milestones_per_step','focus','boundaries'},'invalid saga plan')
    w.require(isinstance(p['roots'],list) and p['roots'] and all(isinstance(x,str) and x in ids for x in p['roots']) and len(set(p['roots']))==len(p['roots']),'invalid follow roots')
    w.require(type(p['include_descendants']) is bool,'include_descendants must be boolean')
    w.require(all(w.number(p[k]) for k in ('start','end','max_jump')) and 0<=p['start']<=now<=p['end'] and p['max_jump']>0 and p['end']>p['start'],'invalid saga horizon/jump')
    w.require(type(p['max_milestones_per_step']) is int and 1<=p['max_milestones_per_step']<=20,'milestone step budget1..20')
    w.require(isinstance(p['focus'],list) and 1<=len(p['focus'])<=10,'focus needs1..10 themes')
    for f in p['focus']:text(f)
    text(p['boundaries'])
    rows(saga['relationships'],'id kind from to start end provenance',500)
    graph={c:set() for c in ids}
    for r in saga['relationships']:
        w.require(r['kind'] in KINDS and isinstance(r['from'],str) and isinstance(r['to'],str) and r['from'] in ids and r['to'] in ids and r['from']!=r['to'],'invalid character relationship')
        w.require(w.number(r['start']) and r['start']<=now and (r['end'] is None or (w.number(r['end']) and r['start']<=r['end']<=now)),'invalid relationship dates')
        provenance(r['provenance'])
        for who in (r['from'],r['to']):
            born=chars[who]['birth'];w.require(born is None or r['start']>=born,'relationship begins before birth')
        if r['kind'] in ('biological_parent','adoptive_parent'):
            graph[r['from']].add(r['to'])
            a,b=chars[r['from']]['birth'],chars[r['to']]['birth']
            w.require(a is None or b is None or a<b,'parent must precede child birth; fused identities need explicit resolution')
    visiting=set();done=set()
    def visit(node):
        w.require(node not in visiting,'character parent cycle')
        if node in done:return
        visiting.add(node)
        for child in graph[node]:visit(child)
        visiting.remove(node);done.add(node)
    for c in ids:visit(c)
    rows(saga['milestones'],'id at characters category summary provenance',500)
    for m in saga['milestones']:
        w.require(w.number(m['at']) and m['at']<=now,'milestone cannot be in unprocessed future')
        w.require(isinstance(m['characters'],list) and m['characters'] and all(isinstance(x,str) and x in ids for x in m['characters']) and len(set(m['characters']))==len(m['characters']),'invalid milestone characters')
        w.require(m['category'] in CATEGORIES,'invalid milestone category');text(m['summary']);provenance(m['provenance'])
        if m['category'] in ('birth','death'):
            w.require(any(chars[x][m['category']]==m['at'] for x in m['characters']),'life milestone needs a matching character life date')
        for who in m['characters']:
            c=chars[who];w.require(c['birth'] is None or m['at']>=c['birth'],'milestone precedes character birth')
            w.require(c['death'] is None or m['at']<=c['death'],'living-character milestone after death; use surviving characters for legacy events')
    rows(saga['bridges'],'id start end summary coverage provenance',200)
    previous=p['start']
    for b in saga['bridges']:
        w.require(w.number(b['start']) and w.number(b['end']) and b['start']==previous and b['start']<b['end']<=now and b['end']-b['start']<=p['max_jump'],'gap bridges must form bounded contiguous processed intervals')
        w.require(b['coverage']=='selected_milestones','bridge must acknowledge selected, not exhaustive, coverage')
        text(b['summary']);provenance(b['provenance']);previous=b['end']
    w.require(previous==now,'saga needs a bridge for every processed time interval')
    rows(saga['threads'],'id characters opened closed summary outcome provenance',200)
    for t in saga['threads']:
        w.require(isinstance(t['characters'],list) and t['characters'] and all(isinstance(x,str) and x in ids for x in t['characters']),'invalid thread characters')
        w.require(w.number(t['opened']) and t['opened']<=now and (t['closed'] is None or (w.number(t['closed']) and t['opened']<=t['closed']<=now)),'invalid thread dates')
        text(t['summary']);provenance(t['provenance'])
        w.require((t['closed'] is None and t['outcome'] is None) or (t['closed'] is not None and isinstance(t['outcome'],str) and 0<len(t['outcome'])<=10000),'thread closure needs outcome')

def followed(saga):
    result=set(saga['plan']['roots'])
    if saga['plan']['include_descendants']:
        changed=True
        while changed:
            old=len(result)
            for r in saga['relationships']:
                if r['kind'] in ('biological_parent','adoptive_parent') and r['from'] in result:result.add(r['to'])
            changed=len(result)!=old
    return result

def transition(old,new):
    a=old['extensions'].get('character_saga');b=new['extensions'].get('character_saga')
    if a is None:
        if b is not None:w.require(b['plan']['start']==new['time']['elapsed_minutes'],'new saga starts at current point; seed prior canon separately')
        return
    w.require(b is not None,'saga cannot be silently removed; branch or start an explicit new world')
    w.require(a['plan']==b['plan'] and a['calendar']==b['calendar'],'saga plan/calendar immutable during continuation')
    before=old['time']['elapsed_minutes'];after=new['time']['elapsed_minutes']
    w.require(after-before<=a['plan']['max_jump'],'saga jump exceeds planned bound')
    for key in ('characters','relationships','milestones','bridges','threads'):
        prior={x['id']:x for x in a[key]};current={x['id']:x for x in b[key]}
        w.require(set(prior)<=set(current),'saga history cannot be removed')
        for identity,x in prior.items():
            y=current[identity];allowed={}
            if key=='characters':
                allowed={'entity_id':y['entity_id']}
                if x['death'] is None and y['death'] is not None:
                    w.require(before<=y['death']<=after,'new death date must be within processed step')
                    w.require(any(m['category']=='death' and m['at']==y['death'] and identity in m['characters'] and m['id'] not in {z['id'] for z in a['milestones']} for m in b['milestones']),'new death needs a sourced death milestone')
                    allowed['death']=y['death']
            elif key=='relationships' and x['end'] is None and y['end'] is not None:
                w.require(before<=y['end']<=after,'relationship ends within step');allowed={'end':y['end']}
            elif key=='threads' and x['closed'] is None and y['closed'] is not None:
                w.require(before<=y['closed']<=after,'thread closes within step');allowed={'closed':y['closed'],'outcome':y['outcome']}
            w.require(dict(x,**allowed)==y,'recorded saga history immutable; use explicit branch/retcon outside this continuation')
        added=[x for x in b[key] if x['id'] not in prior]
        if key=='milestones':
            w.require(len(added)<=a['plan']['max_milestones_per_step'],'saga milestone step budget exceeded')
            for m in added:w.require(before<=m['at']<=after,'new milestone must be in this step')
        elif key=='bridges':
            w.require(len(added)==(1 if after>before else 0),'one gap bridge per time jump')
            if added:w.require(added[0]['start']==before and added[0]['end']==after,'bridge must match actual jump')
        elif key=='characters':
            for c in added:w.require(c['birth'] is None or c['birth']<=after,'future child cannot be born yet')
        elif key=='relationships':
            for r in added:w.require(before<=r['start']<=after,'new relationship must begin within step')
        elif key=='threads':
            for t in added:w.require(before<=t['opened']<=after,'new thread must open within step')

def report(state):
    validate(state)
    saga=state['extensions'].get('character_saga');w.require(saga is not None,'no character saga configured')
    from narrative import plain
    selected=followed(saga);p=saga['plan'];now=state['time']['elapsed_minutes']
    lines=['## Character saga — selected recorded milestones',
           'Agent-authored records arranged deterministically. Not an exhaustive life history; unrecorded intervals are not recovered events. Full report contains spoilers.',
           'Calendar: '+plain(saga['calendar']),
           'Processed through {} of planned {} simulated minutes; branch {}.'.format(now,p['end'],plain(state['branch']['name'])),
           'Focus: '+plain(', '.join(p['focus'])), 'Boundaries: '+plain(p['boundaries']),
           '### Followed characters']
    for c in saga['characters']:
        if c['id'] in selected:lines.append('- {} [{}]: birth {}; death {}; identity/birth provenance: {} refs {}. Death-event attribution is recorded in milestones.'.format(plain(c['name']),plain(c['id']),c['birth'],c['death'],c['provenance']['kind'],plain(', '.join(c['provenance']['refs']))))
    lines.append('### Family and other relationships (not world-export ancestry)')
    for r in saga['relationships']:
        if r['from'] in selected or r['to'] in selected:lines.append('- {} → {}: {} from {} to {}; {}.'.format(plain(r['from']),plain(r['to']),r['kind'],r['start'],r['end'],plain(r['provenance'])))
    lines.append('### Chronological milestone story')
    timeline=[(m['at'],1,m['id'],m) for m in saga['milestones'] if selected.intersection(m['characters'])]
    timeline += [(b['end'],0,b['id'],b) for b in saga['bridges']]
    for at,kind,identity,row in sorted(timeline):
        label='Selected gap summary {}–{}'.format(row['start'],row['end']) if kind==0 else '{} at {}'.format(row['category'],at)
        lines += ['#### '+label+' — '+plain(identity), plain(row['summary']), '{}; refs: {}'.format(row['provenance']['kind'],plain(', '.join(row['provenance']['refs'])))]
    lines.append('### Open and resolved threads')
    for t in saga['threads']:
        if selected.intersection(t['characters']):lines.append('- {}: {} (opened {}; closed {}; outcome {}).'.format(plain(t['id']),plain(t['summary']),t['opened'],t['closed'],plain(t['outcome'])))
    return {'format':'world-sim-character-saga-report','version':1,'contains_spoilers':True,'exhaustive_history':False,'horizon_reached':now==p['end'],'followed_character_ids':sorted(selected),'markdown':'\n\n'.join(lines)+'\n'}
