"""Persistent team combat for threat campaigns.

Vigor/resolve depletion means incapacitation, never a character death. Uses the
existing bounded arena profiles rather than claiming literal unbounded physics.
Each combatant gets at most one action per round; temporary shadow copies are
abstract attack/guard/evade bonuses, not extra turns. No XP or world mutation.
"""
from copy import deepcopy
from combat_sim import _fighter, _profile, _rng, POWER_PROFILES


def create_state(fighters):
    if not isinstance(fighters, list) or not 1 <= len(fighters) <= 64:
        raise ValueError('A combat needs 1..64 fighters')
    rows=[]
    for source in fighters:
        if not isinstance(source.get('team'),str) or not source['team']:
            raise ValueError('Each fighter requires a team')
        row=_fighter(source); row['team']=source['team'];rows.append(row)
    if len({r['id'] for r in rows})!=len(rows):raise ValueError('Duplicate combat id')
    if not 1<=len({r['team'] for r in rows})<=2:raise ValueError('One or two teams required')
    return {'fighters':sorted(rows,key=lambda x:x['id']),'last_round':0}


def active(f):
    return f['vigor']>0 and f['resolve']>0


def living(state,team):
    """Compatibility name: active combatants, NOT proof of biological survival."""
    return [f for f in state['fighters'] if f['team']==team and active(f)]


def defeated(state,team):
    return not living(state,team)


def step_round(state, seed, round_number, skip_actions=None):
    if type(round_number) is not int or round_number!=state['last_round']+1:
        raise ValueError('Combat rounds must advance exactly once')
    skip_actions=skip_actions or {}
    if not isinstance(skip_actions,dict) or set(skip_actions)-{f['id'] for f in state['fighters']}:
        raise ValueError('Unknown skipped combatant')
    if any(not isinstance(v,str) or not v for v in skip_actions.values()):raise ValueError('Skip reason required')
    state['last_round']=round_number; turn=round_number; traces=[]
    order=sorted(state['fighters'],key=lambda f:(_profile(f,turn)[1]['initiative']-(6 if f['statuses'].get('slow',0)>=turn else 0)+_rng(seed,'initiative',turn,f['id']).random()*12,f['id']),reverse=True)
    for actor in order:
        if not active(actor):continue
        enemies=[f for f in state['fighters'] if f['team']!=actor['team'] and active(f)]
        before=deepcopy(state['fighters']); notes=[]; rng=_rng(seed,'action',turn,actor['id'])
        target=sorted(enemies,key=lambda f:f['id'])[rng.randrange(len(enemies))] if enemies else None
        power,p=_profile(actor,turn); mastery=actor['power_levels'].get(power,0) if power else 0
        damage=0.;spent=0;hit=False;action='attack';special=p['special']
        dot=sum(n for tag,n in [('burn',3),('poison',4),('rot',5)] if actor['statuses'].get(tag,0)>=turn)
        actor['vigor']=max(0.,actor['vigor']-dot)
        stunned=actor['statuses'].get('stunned',0)>=turn
        if not active(actor):action='incapacitated_by_effect'
        elif stunned:action='stunned';notes.append('activation skipped')
        elif actor['id'] in skip_actions:action=skip_actions[actor['id']]
        elif target is None:action='no opponents'
        else:
            if power:spent=10;actor['energy']-=spent
            factor=1+mastery*.06
            if special=='copy' and actor['copied'] is None:
                eligible=sorted(x for x in target['powers'] if x!='Siphon')
                if eligible:actor['copied']=eligible[0]
            if special=='copy' and actor['copied']:
                p=POWER_PROFILES[actor['copied']].copy();special=p['special'];notes.append('encounter-only copy: '+actor['copied'])
            heal=p['heal']*factor
            if special=='rewind':heal=min(heal,actor['last_damage'])
            if special=='recover' and actor['vigor']<35 and not actor['recovery_used']:
                heal+=25;actor['recovery_used']=True
            actor['vigor']=min(100.,actor['vigor']+heal)
            actor['guard']=min(35.,actor['guard']+p['guard']*factor)
            if special=='ward':actor['ward']=True
            if special=='energize':actor['energy']=min(100.,actor['energy']+7)
            if special=='resolve':
                actor['resolve']=min(100.,actor['resolve']+18*factor)
                actor['statuses'].pop('frightened',None);actor['statuses']['resolute']=turn+2
            if special=='cleanse':
                for tag in ('burn','poison','rot'):actor['statuses'].pop(tag,None)
            # Actual team benefit from strategic analysis or a mental link. A
            # modest temporary accuracy bonus is assigned to an active ally.
            if power in ('Telepathic Link','Tactical Analysis'):
                allies=sorted((f for f in state['fighters'] if f['team']==actor['team'] and f['id']!=actor['id'] and active(f)),key=lambda f:f['id'])
                if allies:
                    ally=allies[0];ally['statuses']['coordinated']=turn+1
                    notes.append('coordinated ally '+ally['id'])
            defense=_profile(target,turn)[1]
            accuracy=p['accuracy']+(min(.15,turn*.02) if special=='learn' else 0)
            if actor['statuses'].get('coordinated',0)>=turn:accuracy+=.08
            evade=0 if target['statuses'].get('revealed',0)>=turn else defense['evade']
            chance=max(.2,min(.95,.75+accuracy-evade));hit=rng.random()<chance
            if hit:
                damage=p['damage']*factor*(.85+rng.random()*.3)
                if actor['statuses'].get('disarmed',0)>=turn:damage*=.7
                if actor['statuses'].get('frightened',0)>=turn and actor['statuses'].get('resolute',0)<turn:damage*=.65
                if target['ward'] and power:
                    damage=0.;target['ward']=False;notes.append('ward blocked power')
                else:
                    soak=min(target['guard'],damage*.75);target['guard']-=soak;damage-=soak
                    target['resolve']=max(0.,target['resolve']-p['control']*factor*(.4 if target['statuses'].get('resolute',0)>=turn else 1))
                    if special=='fear' and target['statuses'].get('resolute',0)<turn:target['statuses']['frightened']=turn+2
                    tags={'burn':'burn','poison':'poison','rot':'rot','slow':'slow','disarm':'disarmed','suppress':'suppressed','reveal':'revealed'}
                    if special in tags:target['statuses'][tags[special]]=turn+2
                    if special=='stun' and rng.random()<.35:target['statuses']['stunned']=turn+1
                target['last_damage']=damage;target['vigor']=max(0.,target['vigor']-damage)
            else:notes.append('miss')
        actor['energy']=min(100.,actor['energy']+3)
        traces.append({'round':turn,'actor_id':actor['id'],'target_id':target['id'] if action=='attack' else None,'action':action,'power':power if action=='attack' else None,'action_mastery':mastery if action=='attack' else 0,'energy_spent':spent,'hit':hit,'damage':damage,'notes':notes,'before':before,'after':deepcopy(state['fighters'])})
    return traces
