"""Opt-in, bounded goal-driven social interactions with explicit fictional odds.

Not empirical psychology. Stateful relationships affect actual ally/enemy targeting
and costed aid; conflict is not an invented fight, alliance is not a faction coup.
"""
from copy import deepcopy
import math
from combat_sim import _rng

MAX_HISTORY=512
STATS=('persuasiveness','susceptibility','morality')


def _unit(value,name,lo=0,hi=1):
    if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or not lo<=value<=hi:raise ValueError(name+' outside supported range')
    return float(value)


def persuasion_probability(persuasion,susceptibility,morality,trust,alignment,harm):
    """Explicit fictional response odds, no mind control or magical consent."""
    p=_unit(persuasion,'persuasion');s=_unit(susceptibility,'susceptibility');m=_unit(morality,'morality')
    t=_unit(trust,'trust');a=_unit(alignment,'alignment',-1,1);h=_unit(harm,'harm')
    logit=-2+2*p+2*(s-.5)+t+2*a-4*m*h
    return 1/(1+math.exp(-logit))


def validate_social_dynamics(config):
    if config is None:return None
    if not isinstance(config,dict) or set(config)-{'max_pairs','max_interactions','encounter_rate','history_limit'}:raise ValueError('Invalid social dynamics config')
    c=deepcopy(config)
    for key,default,hi in [('max_pairs',256,1024),('max_interactions',32,128),('history_limit',256,MAX_HISTORY)]:
        value=c.get(key,default)
        if type(value) is not int or not 1<=value<=hi:raise ValueError('Invalid '+key)
        c[key]=value
    c['encounter_rate']=_unit(c.get('encounter_rate',.6),'encounter_rate')
    return c


def pair_key(a,b):return '|'.join(sorted([str(a),str(b)]))


def _rows(agents):return {str(a['id']):a for a in agents.values()}


def _stats(a):
    defaults={'persuasiveness':a.get('charisma',.5),'susceptibility':.5,'morality':a.get('compassion',.5)}
    for key in STATS:a[key]=_unit(a.get(key,defaults[key]),key)


def _counter():return {'alliances_formed':0,'conflicts_resolved':0,'cooperations':0}


def init_social_dynamics(story,agents,config,seed,year=0):
    c=validate_social_dynamics(config)
    if c is None:return None
    if type(seed) is not int:raise ValueError('Social seed must be integer')
    state={'version':1,'seed':seed,'config':c,'last_year':year,'pairs':{},'history':[], 'agent_stats':{},'event_counts':{}}
    for a in agents.values():_stats(a);state['agent_stats'][str(a['id'])]=_counter()
    rows=_rows(agents);declared=set()
    for aid,a in rows.items():
        refs=list(a.get('ally_ids',[]))+list(a.get('enemy_ids',[]))
        refs += [g.get('target_id',g.get('target')) for g in _goals(story,aid) if g['type'] in ('form_alliance','resolve_conflict')]
        for ref in refs:
            bid=str(ref)
            if bid in rows and bid!=aid:declared.add(pair_key(aid,bid))
    if len(declared)>c['max_pairs']:raise ValueError('Declared relationships exceed social max_pairs; increase the cap')
    for key in sorted(declared):
        aid,bid=key.split('|');state['pairs'][key]=_new_pair(rows[aid],rows[bid],year)
    story['social_dynamics']=state
    return state


def _goals(story,aid):
    return [g for g in story.get('goals',{}).get(str(aid),[]) if g.get('state',{}).get('status') not in ('completed','failed')]


def goal_relation(story,a,b):
    """Return alignment, explicit reasons; only typed goals affect this score."""
    ga,gb=_goals(story,a['id']),_goals(story,b['id']);same=[];opposed=[]
    for left,other,othergoals in [(ga,b,gb),(gb,a,ga)]:
        for g in left:
            kind=g['type'];target=str(g.get('target_id',g.get('target','')))
            if kind=='defeat_character' and target==str(other['id']):opposed.append('goal to defeat counterpart')
            if kind=='protect_character' and target==str(other['id']):same.append('goal to protect counterpart')
            if kind in ('form_alliance','resolve_conflict') and target==str(other['id']):same.append('goal to '+kind+' with counterpart')
            for h in othergoals:
                htarget=str(h.get('target_id',h.get('target','')))
                if {kind,h['type']}=={'defeat_character','protect_character'} and target and target==htarget:opposed.append('defeat versus protect same target')
                if kind==h['type'] and kind in ('become_leader','win_elections','win_tournaments'):opposed.append('competing exclusive achievement')
                if kind==h['type'] and kind in ('protect_character','improve_society','expose_fakes','treat_injuries','reach_mastery','obtain_power','cooperate'):
                    fields=('target_id','metric','power')
                    if all(g.get(k)==h.get(k) for k in fields):same.append('shared '+kind)
    alignment=max(-1.,min(1.,.4*len(set(same))-.7*len(set(opposed))))
    return alignment,sorted(set(same+opposed))


def _eligible(a,year):
    return a.get('alive',True) and a.get('age',18)>=16 and a.get('injury',0)<.8 and all(a.get(k,0)<year for k in ('imprisoned_until','hospitalized_until','quarantined_until','stasis_until','frozen_until','stunned_until'))


def _set_status(pair,status,a,b):
    pair['status']=status
    for left,right in [(a,b),(b,a)]:
        for field in ('ally_ids','enemy_ids'):
            old=left.setdefault(field,[]);left[field]=[x for x in old if str(x)!=str(right['id'])]
        if status=='allied':left['ally_ids'].append(right['id'])
        elif status=='conflict':left['enemy_ids'].append(right['id'])


def _new_pair(a,b,year):
    ai,bi=str(a['id']),str(b['id']);allies=bi in map(str,a.get('ally_ids',[])) or ai in map(str,b.get('ally_ids',[]));enemies=bi in map(str,a.get('enemy_ids',[])) or ai in map(str,b.get('enemy_ids',[]))
    status='conflict' if enemies else 'allied' if allies else 'neutral'
    return {'a':ai,'b':bi,'status':status,'trust':.2 if enemies else .75 if allies else .45,'tension':.75 if enemies else .1,
            'alliance_count':0,'resolution_count':0,'cooperation_count':0,'last_interaction':year}


def _aid(a,b):
    """Practical, costed aid. Returns details orNone; never awards a goal directly."""
    donor,target=(a,b) if a.get('energy',100)>=b.get('energy',100) else (b,a)
    available=donor.get('energy',100)
    if available<10:return None
    if target.get('injury',0)>0:
        amount=min(.02,target['injury']);target['injury']-=amount;donor['energy']=available-5
        return {'kind':'first_aid','donor_id':donor['id'],'recipient_id':target['id'],'injury_reduced':amount,'energy_cost':5}
    if target.get('energy',100)<90 and available-target.get('energy',100)>=10:
        amount=min(5,100-target.get('energy',100));donor['energy']=available-amount-1;target['energy']=target.get('energy',100)+amount
        return {'kind':'shared_supplies','donor_id':donor['id'],'recipient_id':target['id'],'energy_transferred':amount,'overhead':1}
    gain=min(.25,100-target.get('knowledge_points',0))
    if gain<=0:return None
    donor['energy']=available-2;target['knowledge_points']=target.get('knowledge_points',0)+gain
    return {'kind':'planning_session','donor_id':donor['id'],'recipient_id':target['id'],'knowledge_gained':gain,'energy_cost':2}


def tick_social_dynamics(story,agents,year):
    state=story.get('social_dynamics')
    if state is None or year<=state['last_year']:return []
    state['last_year']=year;c=state['config'];seed=state['seed'];rows=_rows(agents);events=[]
    for aid,a in rows.items():_stats(a);state['agent_stats'].setdefault(aid,_counter())
    active=sorted(aid for aid,a in rows.items() if _eligible(a,year))
    # Remove unavailable dead/missing pairs; history and counters retain evidence.
    state['pairs']={k:p for k,p in state['pairs'].items() if p['a'] in rows and p['b'] in rows and rows[p['a']].get('alive',True) and rows[p['b']].get('alive',True)}
    for aid in active:
        for goal in _goals(story,aid):
            target=str(goal.get('target_id',goal.get('target','')))
            if target in active and target!=aid and len(state['pairs'])<c['max_pairs']:
                key=pair_key(aid,target);state['pairs'].setdefault(key,_new_pair(rows[aid],rows[target],year))
    # Neighbor pairing after seeded shuffle is O(n), not an unbounded O(n²) scan.
    shuffled=active[:];_rng(seed,'social_candidates',year).shuffle(shuffled)
    for i in range(len(shuffled)-1):
        if len(state['pairs'])>=c['max_pairs']:break
        a,b=rows[shuffled[i]],rows[shuffled[i+1]];key=pair_key(a['id'],b['id'])
        state['pairs'].setdefault(key,_new_pair(a,b,year))
    eligible=[key for key,p in state['pairs'].items() if p['a'] in rows and p['b'] in rows and _eligible(rows[p['a']],year) and _eligible(rows[p['b']],year)]
    _rng(seed,'social_order',year).shuffle(eligible)
    def emit(pair,kind,details):
        e={'year':year,'category':'social','kind':kind,'agent_ids':[rows[pair['a']]['id'],rows[pair['b']]['id']],'details':details}
        e['true_event']=f"{rows[pair['a']].get('name',pair['a'])} and {rows[pair['b']].get('name',pair['b'])}: {kind.replace('_',' ')}."
        e['public_belief']=e['true_event'];e['secret']=False;events.append(e);state['history'].append(deepcopy(e));state['event_counts'][kind]=state['event_counts'].get(kind,0)+1
    for key in eligible[:c['max_interactions']]:
        pair=state['pairs'][key];rng=_rng(seed,'social_pair',year,key)
        if rng.random()>=c['encounter_rate']:continue
        a,b=rows[pair['a']],rows[pair['b']];alignment,reasons=goal_relation(story,a,b);pair['last_interaction']=year
        gap=abs(a['morality']-b['morality']);pair['trust']=min(1,max(0,pair['trust']+.12*alignment-.025*gap));pair['tension']=min(1,max(0,pair['tension']-.12*alignment+.02*gap))
        base={'alignment':alignment,'goal_reasons':reasons,'trust':pair['trust'],'tension':pair['tension']}
        if alignment<0 and pair['tension']>=.42:
            old=pair['status'];_set_status(pair,'conflict',a,b)
            if old!='conflict':emit(pair,'alliance_broken' if old=='allied' else 'conflict_started',base)
        elif pair['status']=='conflict':
            # Active directly opposed goals block reconciliation until resolved.
            if alignment>=0:
                initiator,target=(a,b) if a['persuasiveness']>=b['persuasiveness'] else (b,a)
                chance=persuasion_probability(initiator['persuasiveness'],target['susceptibility'],target['morality'],pair['trust'],alignment,0)
                roll=rng.random();emit(pair,'mediation_attempt',dict(base,initiator_id=initiator['id'],target_id=target['id'],probability=chance,roll=roll,accepted=roll<chance))
                if roll<chance:
                    _set_status(pair,'neutral',a,b);pair['tension']*=.4;pair['trust']=max(.4,pair['trust']);pair['resolution_count']+=1
                    for aid in (pair['a'],pair['b']):state['agent_stats'][aid]['conflicts_resolved']+=1
                    emit(pair,'conflict_resolved',dict(base,probability=chance))
        elif pair['status']=='neutral' and alignment>0:
            initiator,target=(a,b) if a['persuasiveness']>=b['persuasiveness'] else (b,a)
            harm=1. if initiator.get('role')=='villain' and target.get('role')!='villain' else 0.
            chance=persuasion_probability(initiator['persuasiveness'],target['susceptibility'],target['morality'],pair['trust'],alignment,harm)
            roll=rng.random();emit(pair,'alliance_proposal',dict(base,initiator_id=initiator['id'],target_id=target['id'],probability=chance,roll=roll,accepted=roll<chance,harm_assumption=harm))
            if roll<chance:
                _set_status(pair,'allied',a,b);pair['alliance_count']+=1
                for aid in (pair['a'],pair['b']):state['agent_stats'][aid]['alliances_formed']+=1
                emit(pair,'alliance_formed',dict(base,probability=chance,harm_assumption=harm))
        if pair['status']=='allied' and alignment>=0:
            aid=_aid(a,b)
            if aid:
                pair['cooperation_count']+=1
                for who in (pair['a'],pair['b']):state['agent_stats'][who]['cooperations']+=1
                emit(pair,'cooperation',dict(base,**aid))
    state['history']=state['history'][-c['history_limit']:]
    return events
