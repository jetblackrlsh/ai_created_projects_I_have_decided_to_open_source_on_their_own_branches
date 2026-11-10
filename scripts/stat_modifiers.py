"""Bounded, reversible snapshot stat powers; time is caller's turns or years.

Numeric identity/counters/timestamps are deliberately not character attributes.
The ledger records actual installed deltas, not hypothetical unclipped bonuses.
"""
from copy import deepcopy
import math

BOUNDS={k:(0.,1.) for k in ('ambition','compassion','greed','curiosity','charisma','persuasiveness','susceptibility','morality','injury')}
BOUNDS.update({k:(0.,100.) for k in ('energy','vigor','resolve','reputation','knowledge_points','healer_burnout')})
BOUNDS.update(age=(0.,10000.),guard=(0.,35.),wealth=(0.,10000.),income=(0.,1000.),followers=(0.,100000.))
COMBAT_BOUNDS={k:(-100.,100.) for k in ('damage','guard','heal','control','initiative')}
COMBAT_BOUNDS.update(accuracy=(-1.,1.),evade=(-1.,1.))
MAX_ACTIVE=128


def _number(x,name,lo=-1000000,hi=1000000):
    if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x) or not lo<=x<=hi:raise ValueError('Invalid '+name)
    return x


def _integer(x,name,lo,hi):
    if type(x) is not int or not lo<=x<=hi:raise ValueError('Invalid '+name)
    return x


def _text(x,name):
    if not isinstance(x,str) or not x.strip() or len(x)>160:raise ValueError('Invalid '+name)
    return x


def stat_bounds(path):
    _text(path,'stat path')
    if path in BOUNDS:return BOUNDS[path]
    parts=path.split('.')
    if len(parts)==2 and parts[0]=='combat_stats' and parts[1] in COMBAT_BOUNDS:return COMBAT_BOUNDS[parts[1]]
    if len(parts)==2 and parts[0]=='power_levels' and parts[1].strip():return (0.,5.)
    if len(parts)==3 and parts[0]=='power_mastery' and parts[1].strip() and parts[2]=='xp':return (0.,100000.)
    raise ValueError('Unsupported character stat: '+path)


def validate_effect(spec):
    if not isinstance(spec,dict) or set(spec)-{'path','operation','value','duration','stack_key','stacking','max_stacks'}:raise ValueError('Invalid stat effect')
    s=deepcopy(spec);stat_bounds(s.get('path'))
    if s.get('operation') not in ('add','multiply','set'):raise ValueError('Invalid stat operation')
    _number(s.get('value'),'stat value')
    if s['operation']=='multiply' and not 0<=s['value']<=100:raise ValueError('Multiplier must be0..100')
    s['duration']=_integer(s.get('duration',1),'duration',1,10000)
    s['stack_key']=_text(s.get('stack_key',s['path']),'stack key')
    s['stacking']=s.get('stacking','replace')
    if s['stacking'] not in ('replace','refresh','stack'):raise ValueError('Invalid stacking')
    s['max_stacks']=_integer(s.get('max_stacks',4),'max stacks',1,32)
    return s


def validate_stat_powers(powers):
    if not isinstance(powers,list) or len(powers)>32:raise ValueError('Use at most32 stat abilities')
    out=[];ids=set()
    for raw in powers:
        if not isinstance(raw,dict) or set(raw)-{'id','scope','target_id','relation','energy_cost','cooldown','target_limit','effect'}:raise ValueError('Invalid stat ability')
        p=deepcopy(raw);ident=_text(p.get('id'),'ability id')
        if ident in ids:raise ValueError('Duplicate stat ability id')
        ids.add(ident)
        p['scope']=p.get('scope','self')
        if p['scope'] not in ('self','other','local'):raise ValueError('Invalid scope')
        p['relation']=p.get('relation','any')
        if p['relation'] not in ('any','ally','enemy'):raise ValueError('Invalid relation')
        if 'target_id' in p:p['target_id']=str(_text(str(p['target_id']),'target id'))
        if p['scope']=='self' and ('target_id' in p or p['relation']=='enemy'):raise ValueError('Self scope cannot name another target or enemy')
        p['energy_cost']=_number(p.get('energy_cost',10),'energy cost',0,100)
        p['cooldown']=_integer(p.get('cooldown',3),'cooldown',1,10000)
        p['target_limit']=_integer(p.get('target_limit',16),'target limit',1,64)
        p['effect']=validate_effect(p.get('effect'));out.append(p)
    return out


def _slot(target,path,create=False):
    stat_bounds(path);parts=path.split('.')
    if len(parts)==1:
        if path not in target:raise ValueError('Target lacks stat: '+path)
        obj,key=target,path
    elif parts[0]=='combat_stats':
        if not ('vigor' in target and 'resolve' in target and 'power_levels' in target):raise ValueError('Combat offsets require a combat fighter')
        if create:target.setdefault('combat_stats',{}).setdefault(parts[1],0.)
        obj,key=target.get('combat_stats',{}),parts[1]
        if key not in obj:raise ValueError('Target lacks stat: '+path)
    elif parts[0]=='power_levels':
        if parts[1] not in target.get('powers',[]):raise ValueError('Target does not hold power: '+parts[1])
        obj,key=target.get('power_levels',{}),parts[1]
        if key not in obj:raise ValueError('Target lacks stat: '+path)
    else:
        from expanded_powers import powers_of
        if parts[1] not in powers_of(target):raise ValueError('Target does not hold power: '+parts[1])
        obj,key=target.get('power_mastery',{}).get(parts[1],{}),'xp'
        if key not in obj:raise ValueError('Target lacks stat: '+path)
    _number(obj[key],'existing stat',-1e12,1e12)
    return obj,key


def _write(target,path,value):
    obj,key=_slot(target,path,True);lo,hi=stat_bounds(path);value=max(lo,min(hi,value))
    if path=='age' or path.startswith('power_mastery.'):value=int(value)
    old=obj[key];obj[key]=value
    if path=='age' and 'birth_year' in target:target['birth_year']-=value-old
    if path.startswith('power_mastery.'):
        from power_mastery import sync_mastery
        sync_mastery(target)
    return value-old


def _remove(target,record):
    try:
        obj,key=_slot(target,record['path']);delta=_write(target,record['path'],obj[key]-record['delta'])
        return {'effect_id':record['effect_id'],'path':record['path'],'removed_delta':delta}
    except ValueError:
        # Remove bonuses from a retained historical record without regranting
        # a lost power, so reacquiring it cannot make a temporary bonus permanent.
        parts=record['path'].split('.')
        if parts[0] in ('power_levels','power_mastery'):
            obj=target.get(parts[0],{}) if parts[0]=='power_levels' else target.get('power_mastery',{}).get(parts[1],{})
            key=parts[1] if parts[0]=='power_levels' else 'xp'
            removed=0
            if key in obj:
                old=obj[key];lo,hi=stat_bounds(record['path']);value=max(lo,min(hi,old-record['delta']))
                obj[key]=int(value) if parts[0]=='power_mastery' else value;removed=obj[key]-old
                if parts[0]=='power_mastery':
                    from power_mastery import sync_mastery
                    sync_mastery(target)
            return {'effect_id':record['effect_id'],'path':record['path'],'removed_delta':removed,'reason':'power no longer held; historical record only'}
        raise


def expire_modifiers(target,now):
    _integer(now,'time',0,100000000)
    ledger=target.get('stat_modifiers')
    if ledger is None:return []
    if now<ledger['last_time']:raise ValueError('Modifier clock cannot go backwards')
    ledger['last_time']=now;events=[];keep=[]
    for rec in ledger['active']:
        if rec['expires_at']<=now:events.append(_remove(target,rec))
        else:keep.append(rec)
    ledger['active']=keep
    return events


def apply_modifier(target,spec,now,source_id,effect_id):
    s=validate_effect(spec);_integer(now,'time',0,100000000);_text(str(effect_id),'effect id')
    # Validate availability before editing existing effects.
    _slot(target,s['path'],True);expire_modifiers(target,now)
    ledger=target.setdefault('stat_modifiers',{'version':1,'last_time':now,'active':[]})
    group=[r for r in ledger['active'] if r['stack_key']==s['stack_key'] and r['path']==s['path']]
    duplicate=next((r for r in ledger['active'] if r['effect_id']==str(effect_id)),None)
    if duplicate:return {'applied':False,'reason':'duplicate effect id','delta':0,'path':s['path']}
    if s['stacking']=='refresh' and group:
        for rec in group:rec['expires_at']=max(rec['expires_at'],now+s['duration'])
        return {'applied':True,'refreshed':True,'delta':0,'path':s['path'],'expires_at':now+s['duration']}
    if s['stacking']=='stack' and len(group)>=s['max_stacks']:return {'applied':False,'reason':'stack cap','delta':0,'path':s['path']}
    if len(ledger['active'])- (len(group) if s['stacking']=='replace' else 0)>=MAX_ACTIVE:return {'applied':False,'reason':'active modifier cap','delta':0,'path':s['path']}
    if s['stacking']=='replace':
        for rec in group:_remove(target,rec)
        ledger['active']=[r for r in ledger['active'] if r not in group]
    obj,key=_slot(target,s['path'],True);before=obj[key]
    desired=before+s['value'] if s['operation']=='add' else before*s['value'] if s['operation']=='multiply' else s['value']
    delta=_write(target,s['path'],desired)
    rec={'effect_id':str(effect_id),'source_id':str(source_id),'path':s['path'],'stack_key':s['stack_key'],'delta':delta,'applied_at':now,'expires_at':now+s['duration']}
    ledger['active'].append(rec)
    return {'applied':True,'path':s['path'],'delta':delta,'before':before,'after':before+delta,'expires_at':rec['expires_at']}


def active_modifiers(target):return deepcopy(target.get('stat_modifiers',{}).get('active',[]))


def _alive(target):
    return target.get('alive',True) and target.get('vigor',1)>0 and target.get('resolve',1)>0


def _allied(a,b):
    if str(a['id'])==str(b['id']):return True
    if 'team' in a and 'team' in b:return a['team']==b['team']
    return str(b['id']) in set(map(str,a.get('ally_ids',[])))


def select_targets(source,agents,scope,target_id=None,limit=16,relation='any'):
    if scope not in ('self','other','local') or relation not in ('any','ally','enemy'):raise ValueError('Invalid target selector')
    _integer(limit,'target limit',1,64)
    rows=list(agents.values()) if isinstance(agents,dict) else list(agents)
    location=source.get('location',source.get('region'))
    candidates=[]
    for t in rows:
        if not _alive(t):continue
        is_self=str(t['id'])==str(source['id'])
        if scope=='self' and not is_self or scope=='other' and is_self:continue
        if target_id is not None and str(t['id'])!=str(target_id):continue
        if scope=='local':
            other_location=t.get('location',t.get('region'))
            if location is None or other_location!=location:continue
        if relation=='ally' and not _allied(source,t):continue
        if relation=='enemy':
            enemy=(source.get('team')!=t.get('team')) if 'team' in source and 'team' in t else str(t['id']) in set(map(str,source.get('enemy_ids',[])))
            if not enemy or is_self:continue
        candidates.append(t)
    return sorted(candidates,key=lambda a:str(a['id']))[:1 if scope in ('self','other') else limit]


def stat_power_action(source,targets,now):
    _integer(now,'time',0,100000000)
    if not source.get('stat_powers') or not _alive(source):return None
    powers=validate_stat_powers(source['stat_powers']);runtime=source.get('stat_power_runtime',{})
    if runtime.get('last_cast_time')==now:return None
    for p in powers:
        if now<runtime.get('ready_at',{}).get(p['id'],0) or source.get('energy',0)<p['energy_cost']:continue
        selected=select_targets(source,targets,p['scope'],p.get('target_id'),p['target_limit'],p['relation'])
        valid=[]
        for t in selected:
            try:_slot(deepcopy(t),p['effect']['path'],True)
            except ValueError:continue
            valid.append(t)
        if not valid:continue
        # Transactional cast: reject malformed effects before spending or partial application.
        trial=deepcopy(valid);results=[]
        for t in trial:results.append(apply_modifier(t,p['effect'],now,source['id'],str(source['id'])+':'+p['id']+':'+str(now)+':'+str(t['id'])))
        if not any(r['applied'] for r in results):continue
        for real,new in zip(valid,trial):real.clear();real.update(new)
        source['energy']=max(0,source['energy']-p['energy_cost'])
        runtime=source.setdefault('stat_power_runtime',{'ready_at':{}});runtime.setdefault('ready_at',{})[p['id']]=now+p['cooldown'];runtime['last_cast_time']=now
        return {'event':'stat_power','actor_id':source['id'],'ability_id':p['id'],'time':now,'energy_cost':p['energy_cost'],'scope':p['scope'],'targets':[{'target_id':t['id'],**r} for t,r in zip(valid,results)]}
    return None
