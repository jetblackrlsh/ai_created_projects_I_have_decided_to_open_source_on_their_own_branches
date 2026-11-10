"""Original non-electoral succession rules; no real politics or external network."""
from combat_sim import simulate_tournament


def available(a,year,arena=False):
    return (a.get('alive',False) and a.get('age',0)>=18 and
            all(a.get(k,0)<year for k in ('imprisoned_until','hospitalized_until','quarantined_until','stasis_until')) and
            (not arena or (a.get('injury',0)<.65 and a.get('energy',100)>=30)))


def select_leadership(state,agents,rng,year):
    system=state.get('leadership_system','elections')
    if system=='elections':return None
    if system not in ('rank','tournament'):raise ValueError('Unknown leadership system')
    old=state.get('leader_id');winner=None;reason='no eligible candidates';evidence={}
    candidates=sorted((a for a in agents.values() if available(a,year,system=='tournament')),key=lambda a:a['id'])
    if system=='rank':
        candidates=[a for a in candidates if a.get('has_phone') and state.get('laws',{}).get('ranking_app',True)]
        if candidates:
            highest=max(a.get('app_score',0) for a in candidates)
            tied=[a for a in candidates if a.get('app_score',0)==highest]
            winner=next((a['id'] for a in tied if a['id']==old),tied[0]['id'])
            reason='highest public app score; exact ties retain eligible incumbent, otherwise lowest ID'
            evidence={'score':highest,'tied_ids':[a['id'] for a in tied]}
        elif not state.get('laws',{}).get('ranking_app',True):reason='ranking app banned; rank government has no authorized ranking'
    else:
        ids={a['id'] for a in candidates}
        interval=state.get('leadership_interval',4)
        due=year==1 or (year-1)%interval==0 or old not in ids
        if not due:return None
        if len(candidates)==1:
            winner=candidates[0]['id'];reason='sole eligible adult accession, not a tournament win'
        elif len(candidates)>1:
            limit=state.get('government_tournament_size',64)
            if len(candidates)>limit:
                # Incumbent has a guaranteed defense slot; others enter a seeded public lottery.
                incumbent=[a for a in candidates if a['id']==old]
                others=[a for a in candidates if a['id']!=old]
                candidates=incumbent+rng.sample(others,limit-len(incumbent))
            seed=rng.getrandbits(63)
            result=simulate_tournament(candidates,seed=seed,max_rounds=state.get('government_tournament_rounds',30))
            winner=next(a['id'] for a in candidates if str(a['id'])==result['champion_id'])
            agents[winner]['government_tournament_wins']=agents[winner].get('government_tournament_wins',0)+1
            state['government_tournaments_held']=state.get('government_tournaments_held',0)+1
            record={'year':year,'seed':seed,'eligible_population':len(ids),'entrant_ids':[a['id'] for a in candidates],'result':result}
            state.setdefault('government_tournaments',[]).append(record)
            state['government_tournaments']=state['government_tournaments'][-64:]
            reason='nonlethal leadership tournament champion';evidence={'seed':seed,'entrant_ids':record['entrant_ids']}
    state['leader_id']=winner
    if old==winner:return None
    state['leadership_changes']=state.get('leadership_changes',0)+1
    if old is not None and winner is not None:state['peaceful_transfers']=state.get('peaceful_transfers',0)+1
    state.setdefault('leadership_history',[]).append({'year':year,'system':system,'old_leader_id':old,'leader_id':winner,'reason':reason,'evidence':evidence})
    state['leadership_history']=state['leadership_history'][-512:]
    name=agents[winner]['name'] if winner is not None else 'No eligible leader'
    return f'{system.title()} government: {name}. {reason}.'
