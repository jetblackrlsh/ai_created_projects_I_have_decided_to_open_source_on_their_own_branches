"""Bounded voluntary social choices during a threat encounter.

Planning reserves one real action; only a successful combat skip/action followed
by eligibility allows execution. No actor spawning or mind control. Allegiance
changes preserve identity, goals, powers, injury and expenditure.
"""
from copy import deepcopy
from combat_sim import _rng
from social_dynamics import persuasion_probability, _unit, pair_key
from threat_combat import active


def validate_tactical_social(config):
    if config is None:return None
    if not isinstance(config,dict) or set(config)-{'offer_rate','cooperate_rate','max_offers_per_pair','offer_interval','history_limit','team_objectives','devastation_powers'}:raise ValueError('Invalid tactical social config')
    c=deepcopy(config)
    for key,d in [('offer_rate',.15),('cooperate_rate',.2)]:c[key]=_unit(c.get(key,d),key)
    for key,d,hi in [('max_offers_per_pair',1,3),('offer_interval',5,100),('history_limit',256,1024)]:
        x=c.get(key,d)
        if type(x) is not int or not 1<=x<=hi:raise ValueError('Invalid '+key)
        c[key]=x
    devastation=c.setdefault('devastation_powers',{})
    if not isinstance(devastation,dict) or any(not isinstance(k,str) or not isinstance(v,str) for k,v in devastation.items()):raise ValueError('Invalid devastation power map')
    goals=c.get('team_objectives')
    if not isinstance(goals,dict) or set(goals)!={'heroes','threat'}:raise ValueError('Both team objectives required')
    for value in goals.values():
        if not isinstance(value,dict) or set(value)!={'objective','stance','harmfulness'}:raise ValueError('Objective needs name,stance,harmfulness')
        if not isinstance(value['objective'],str) or not value['objective'].strip() or len(value['objective'])>80:raise ValueError('Invalid objective')
        if type(value['stance']) is not int or value['stance'] not in (-1,1):raise ValueError('Stance must be-1or1')
        _unit(value['harmfulness'],'harmfulness')
    return c


def init_tactical_social(config,combat,seed,prelude=None):
    c=validate_tactical_social(config)
    if c is None:return None
    state={'version':1,'seed':seed,'config':c,'relationships':{},'offer_counts':{},'last_offer':{},'history':[], 'event_counts':{},'last_observed_round':0,'last_resolved_round':0}
    rows=combat['fighters']
    for f in rows:
        for k in ('persuasiveness','susceptibility','morality'):
            if k not in f:raise ValueError('Tactical social needs explicit '+k)
            _unit(f[k],k)
        positions=f.get('goal_positions',{})
        if not isinstance(positions,dict):raise ValueError('Goal positions must be a map')
        for v in positions.values():_unit(v,'goal stance',-1,1)
    for i,a in enumerate(rows):
        for b in rows[i+1:]:
            allies=a['team']==b['team'];state['relationships'][pair_key(a['id'],b['id'])]={'a':a['id'],'b':b['id'],'trust':.7 if allies else .15,'tension':.1 if allies else .6,'status':'allied' if allies else 'conflict'}
    if prelude:
        initial_threat=[i for i,t in prelude.get('original_teams',{}).items() if t=='threat']
        if len(initial_threat)==1:
            actor=initial_threat[0]
            for t in prelude.get('trace',[]):
                key=actor+'>'+t['target_id'];state['offer_counts'][key]=1;state['last_offer'][key]=0
                pair=state['relationships'].get(pair_key(actor,t['target_id']))
                if pair:pair['trust']=max(0,min(1,t.get('trust',pair['trust'])))
    return state


def _eligible(f,turn):
    return active(f) and f['energy']>=5 and f['statuses'].get('stunned',0)<turn


def _relation(s,a,b):return s['relationships'][pair_key(a['id'],b['id'])]

def _alignment(s,f,team):
    proposal=s['config']['team_objectives'][team]
    return f.get('goal_positions',{}).get(proposal['objective'],0)*proposal['stance']


def plan_tactical_social(state,combat,turn,engaged=True,blocked_ids=()):
    if state is None or not engaged:return {},[]
    c=state['config'];rows=sorted(combat['fighters'],key=lambda f:f['id']);blocked=set(map(str,blocked_ids));skip={};intents=[]
    for team in ('heroes','threat'):
        actors=[f for f in rows if f['team']==team and _eligible(f,turn) and f['id'] not in blocked]
        _rng(state['seed'],'social_actor_order',turn,team).shuffle(actors)
        for actor in actors:
            rng=_rng(state['seed'],'social_plan',turn,actor['id']);enemies=[f for f in rows if f['team']!=team and _eligible(f,turn)]
            can_offer=[f for f in enemies if state['offer_counts'].get(actor['id']+'>'+f['id'],0)<c['max_offers_per_pair'] and turn-state['last_offer'].get(actor['id']+'>'+f['id'],-c['offer_interval'])>=c['offer_interval']]
            # Characters who oppose their coalition's stated objective do not
            # try to recruit others into it. They can be recruited back.
            if can_offer and _alignment(state,actor,team)>=0 and rng.random()<c['offer_rate']:
                target=can_offer[rng.randrange(len(can_offer))];skip[actor['id']]='social_offer';intents.append({'actor_id':actor['id'],'target_id':target['id'],'action':'social_offer','team':team});break
            allies=[f for f in rows if f['team']==team and f['id']!=actor['id'] and active(f)]
            if allies and _alignment(state,actor,team)>=0 and rng.random()<c['cooperate_rate']:
                target=min(allies,key=lambda f:(f['vigor']+f['guard'],f['id']));skip[actor['id']]='social_cooperate';intents.append({'actor_id':actor['id'],'target_id':target['id'],'action':'social_cooperate','team':team});break
    return skip,intents


def _record(state,event):
    state['history'].append(deepcopy(event));state['history']=state['history'][-state['config']['history_limit']:]
    kind=event['event'];state['event_counts'][kind]=state['event_counts'].get(kind,0)+1


def resolve_tactical_social(state,combat,turn,actions,intents):
    if state is None:return []
    if turn<=state['last_resolved_round']:return []
    state['last_resolved_round']=turn;rows={f['id']:f for f in combat['fighters']};events=[]
    for intent in sorted(intents,key=lambda x:x['actor_id']):
        actor=rows.get(intent['actor_id']);target=rows.get(intent['target_id']);kind=intent['action']
        if actor is None or target is None or not _eligible(actor,turn) or not active(target):continue
        if actor['team']!=intent['team']:continue
        if not any(a['actor_id']==actor['id'] and a['action']==kind for a in actions):continue
        rel=_relation(state,actor,target)
        if kind=='social_cooperate':
            if actor['team']!=target['team']:continue
            gain=min(5.,35-target['guard'])
            if gain<=0:continue
            actor['energy']-=5;target['guard']+=gain;rel['trust']=min(1,rel['trust']+.03);rel['tension']=max(0,rel['tension']-.03)
            event={'event':'social_cooperation','actor_id':actor['id'],'target_id':target['id'],'guard_added':gain,'energy_cost':5,'round':turn}
            events.append(event);_record(state,event)
        elif kind=='social_offer':
            if actor['team']==target['team']:continue
            key=actor['id']+'>'+target['id']
            if state['offer_counts'].get(key,0)>=state['config']['max_offers_per_pair']:continue
            if turn-state['last_offer'].get(key,-state['config']['offer_interval'])<state['config']['offer_interval']:continue
            proposal=state['config']['team_objectives'][actor['team']];alignment=_alignment(state,target,actor['team'])
            probability=persuasion_probability(actor['persuasiveness'],target['susceptibility'],target['morality'],rel['trust'],alignment,proposal['harmfulness'])
            roll=_rng(state['seed'],'social_acceptance',turn,actor['id'],target['id']).random();accepted=roll<probability
            actor['energy']-=5;state['offer_counts'][key]=state['offer_counts'].get(key,0)+1;state['last_offer'][key]=turn
            old_team=target['team'];former_allies=[f['id'] for f in rows.values() if f['id']!=target['id'] and f['team']==old_team]
            if accepted:
                target['team']=actor['team']
                for peer in rows.values():
                    if peer['id']==target['id']:continue
                    pair=_relation(state,target,peer);allies=peer['team']==target['team'];pair['status']='allied' if allies else 'conflict'
                    pair['trust']=max(.55,pair['trust']) if allies else max(0,pair['trust']-.4);pair['tension']=min(.25,pair['tension']) if allies else min(1,pair['tension']+.4)
            else:rel['trust']=max(0,rel['trust']-.02);rel['tension']=min(1,rel['tension']+.02)
            event={'event':'social_offer','round':turn,'actor_id':actor['id'],'target_id':target['id'],'proposal':deepcopy(proposal),'informed':True,'coercion':False,'goal_alignment':alignment,'probability':probability,'roll':roll,'accepted':accepted,'old_team':old_team,'new_team':target['team'],'energy_cost':5}
            events.append(event);_record(state,event)
            if accepted:
                event={'event':'social_conflict_resolved','round':turn,'actor_id':actor['id'],'target_id':target['id'],'meaning':'joined same goal coalition; not erased personal morality'};events.append(event);_record(state,event)
                for aid in former_allies:
                    event={'event':'social_alliance_broken','round':turn,'actor_id':target['id'],'target_id':aid,'meaning':'coalition defection'};events.append(event);_record(state,event)
    return events


def observe_tactical_social(state,combat,turn,actions,events):
    if state is None or turn<=state['last_observed_round']:return
    state['last_observed_round']=turn;rows={f['id']:f for f in combat['fighters']}
    for action in actions:
        aid,bid=action['actor_id'],action.get('target_id')
        if action.get('action')=='attack' and bid in rows and aid in rows and action.get('hit',False):
            rel=_relation(state,rows[aid],rows[bid]);rel['trust']=max(0,rel['trust']-.025);rel['tension']=min(1,rel['tension']+.025)
    for event in events:
        if event.get('event')!='devastation' or event.get('people_killed',0)<=0:continue
        actor=rows.get(event.get('actor_id'))
        if actor is None:continue
        for observer in rows.values():
            if observer['id']==actor['id'] or not active(observer):continue
            # Disapproval follows character's own objective and morality, not
            # their current coalition label.
            opposition=max(0,-_alignment(state,observer,'threat'))*observer['morality']
            rel=_relation(state,actor,observer);rel['trust']=max(0,rel['trust']-.05*opposition);rel['tension']=min(1,rel['tension']+.05*opposition)
