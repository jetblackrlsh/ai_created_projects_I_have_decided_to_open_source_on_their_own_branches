"""Detached nonlethal arena model, not the world's annual combat approximation.

All 62 powers have explicit bounded arena adaptations in POWER_PROFILES. Vigor is
bout stamina, NOT world health. No deaths, aging, permanent theft, resurrection,
legal effects or source mutation occur here. Siphon copies a technique for this
bout only; Necromancy uses an inert spectral sparring construct (not resurrection).
World consequences require the scenario caller's separate explicit commit step.
"""
import argparse
import copy
import hashlib
import json
import math
import random
from expanded_powers import powers_of
from power_mastery import ensure_mastery, level_for

# damage, guard, heal, accuracy, evade, control, initiative, special
_FIELDS = ('damage', 'guard', 'heal', 'accuracy', 'evade', 'control', 'initiative', 'special')
_RAW = {
 'Shadow Blasts': (24,0,0,0,0,0,0,''),
 'Fear Influence': (4,0,0,.08,0,22,1,'fear'),
 'Shadow Clones': (19,7,0,.10,.08,0,1,'shadow_duplicate'),
 'Cybernetics': (17,11,3,0,0,0,3,'interface'),
 'Analytical Vision': (10,0,0,.24,0,0,2,'reveal'),
 'Space Adaptation': (10,10,0,0,.08,0,1,'cleanse'),
 'Tactical Analysis': (12,6,0,.15,.05,0,5,'insight'),
 'Resolve': (8,8,0,0,0,0,1,'resolve'),
 'Telepathic Link': (9,5,0,.18,.08,5,3,'insight'),
 'Fire': (20,0,0,0,0,0,0,'burn'),
 'Ice': (12,5,0,0,0,0,0,'slow'),
 'Water': (11,7,0,0,0,0,1,'cleanse'),
 'Weather': (17,0,0,0,0,0,2,'slow'),
 'Lightning': (18,0,0,0,0,0,3,'stun'),
 'Magnetism': (12,8,0,0,0,0,0,'disarm'),
 'Earth': (15,12,0,0,0,0,-2,''),
 'Wind': (11,0,0,0,.12,0,4,'disarm'),
 'Plant Control': (8,8,4,0,0,0,0,'slow'),
 'Poison': (10,0,0,0,0,0,0,'poison'),
 'Flight': (12,0,0,.05,.18,0,5,''),
 'Strength': (25,0,0,0,0,0,0,''),
 'Giant Size': (28,5,0,-.05,-.08,0,-3,''),
 'Durability': (8,18,0,0,0,0,-1,''),
 'Speed': (15,0,0,.08,.12,0,8,''),
 'Shapeshifting': (14,5,4,0,.05,0,1,''),
 'Cloning': (19,6,0,.10,0,0,0,''),
 'Invisibility': (13,0,0,.15,.22,0,2,''),
 'Illusions': (9,0,0,.10,.15,10,0,''),
 'Shadow': (14,0,0,0,.16,0,2,''),
 'Mind Control': (5,0,0,.05,0,20,0,''),
 'Telepathy': (9,0,0,.20,.08,7,1,''),
 'Portals': (12,8,0,.10,.12,0,4,''),
 'Time Slowing': (10,0,0,.12,.08,0,6,'slow'),
 'Magic': (16,7,3,0,0,0,0,''),
 'Healing': (4,0,19,0,0,0,0,'cleanse'),
 'Regeneration': (8,0,14,0,0,0,0,'cleanse'),
 'Immortal': (8,0,3,0,0,0,0,'recover'),
 'Necromancy': (16,9,0,0,0,0,-1,'spectral_construct'),
 'Psychometry': (8,0,0,.23,.04,0,1,'insight'),
 'Fortune': (14,0,0,.17,.17,0,2,''),
 'Bubbles': (6,22,0,0,0,4,0,''),
 'Rapid Construction': (9,19,0,0,0,0,-2,'barricade'),
 'Perfect Memory': (10,0,0,.18,.06,0,0,'learn'),
 'Time Rewind': (5,0,21,0,0,0,-1,'rewind'),
 'Time Stop': (11,0,0,0,0,0,7,'stun'),
 'Tide Control': (15,5,0,0,0,0,0,'slow'),
 'Steam': (16,0,0,0,.10,0,0,'burn'),
 'Alchemy': (6,6,13,0,0,0,0,'cleanse'),
 'Starlight': (16,9,0,.08,0,0,0,'reveal'),
 'Empathy': (3,0,0,.15,0,18,0,'calm'),
 'Power Suppression': (8,0,0,0,0,0,3,'suppress'),
 'Charm': (6,0,0,.12,0,16,0,''),
 'Precognition': (10,0,0,.12,.20,0,7,''),
 'Stone Skin': (13,16,0,0,0,0,-3,''),
 'Invulnerability': (7,0,0,0,0,0,0,'ward'),
 'Shrinking': (8,0,0,0,.28,0,3,''),
 'Hurricane Breath': (18,0,0,0,0,0,0,'disarm'),
 'Rot': (9,0,0,0,0,0,0,'rot'),
 'Siphon': (8,0,0,0,0,0,0,'copy'),
 'Adrenaline': (18,0,0,0,0,0,6,'energize'),
 'Smoke': (7,0,0,0,.24,0,0,'conceal'),
 'Sparks': (11,0,0,.05,0,0,2,'stun'),
}
POWER_PROFILES = {name: dict(zip(_FIELDS, values)) for name, values in _RAW.items()}
SUPPORTED_POWERS = tuple(sorted(POWER_PROFILES))


def _rng(seed, *parts):
    key = json.dumps([seed, *parts], sort_keys=True, separators=(',', ':'))
    return random.Random(int.from_bytes(hashlib.sha256(key.encode()).digest(), 'big'))


def _number(value, default, lo, hi):
    try:
        value = float(value)
        return max(lo, min(hi, value)) if math.isfinite(value) else default
    except (TypeError, ValueError):
        return default


def _fighter(source):
    if not isinstance(source, dict) or source.get('id') is None:
        raise ValueError('Each fighter needs a stable unique id')
    if source.get('alive') is False:
        raise ValueError('Dead world agents cannot enter a nonlethal arena')
    source = copy.deepcopy(source)
    ensure_mastery(source)
    powers = powers_of(source)
    unknown = set(powers) - set(POWER_PROFILES)
    if unknown:
        raise ValueError('Unsupported powers: ' + ', '.join(sorted(unknown)))
    return dict(id=str(source['id']), name=str(source.get('name',source['id'])),
                powers=powers, vigor=100.0, energy=_number(source.get('energy',100),100,0,100),
                mastery=_number(source.get('mastery_level',0),0,0,5),
                power_levels={power:_number(level_for(source,power),0,0,5) for power in powers}, guard=0.0,
                resolve=100.0, statuses={}, ward=False, recovery_used=False,
                last_damage=0.0, copied=None)


def _profile(fighter, turn):
    if fighter['statuses'].get('suppressed',0) >= turn:
        return None, dict(zip(_FIELDS,(7,0,0,0,0,0,0,'')))
    if not fighter['powers'] or fighter['energy'] < 10:
        return None, dict(zip(_FIELDS,(9,0,0,0,0,0,0,'')))
    power = fighter['powers'][(turn-1) % len(fighter['powers'])]
    return power, POWER_PROFILES[power].copy()


def simulate_fight(fighter_a, fighter_b, seed=0, max_rounds=30, rules=None):
    """Pure deterministic duel. Swapping arguments preserves exact results.

    Caps: 1..200 rounds, 64 powers, mastery0..5, energy0..100. Fresh arena
    vigor/resolve; supplied energy is respected. Potency uses the selected
    ability's own level, never the maximum compatibility scalar. Siphon copies
    techniques at the caster's Siphon level, not the donor's level. Initiative is rerolled each
    round using ID-keyed randomness. Round limit uses vigor+resolve, ties draw.
    rules supports only {'nonlethal': True}; unknown rules fail rather than lie.
    """
    if type(max_rounds) is not int or not 1 <= max_rounds <= 200:
        raise ValueError('max_rounds must be an integer from 1 to 200')
    rules = rules or {}
    if set(rules) - {'nonlethal'} or rules.get('nonlethal', True) is not True:
        raise ValueError('Only nonlethal arena rules are supported')
    pair = sorted([_fighter(fighter_a), _fighter(fighter_b)], key=lambda x:x['id'])
    if pair[0]['id'] == pair[1]['id']:
        raise ValueError('Fighter ids must be unique')
    starting = copy.deepcopy(pair)
    trace=[]
    winner=None
    reason='round_limit'
    for turn in range(1,max_rounds+1):
        order=sorted(pair,key=lambda f:(_profile(f,turn)[1]['initiative'] -
            (6 if f['statuses'].get('slow',0)>=turn else 0) +
            _rng(seed,'initiative',turn,f['id']).random()*12),reverse=True)
        for actor in order:
            target=pair[1] if actor is pair[0] else pair[0]
            before=copy.deepcopy(pair)
            power,p=_profile(actor,turn)
            action_mastery=actor['power_levels'].get(power,0) if power else 0
            rng=_rng(seed,'action',turn,actor['id'])
            note=[]
            energy_spent=0
            # Damage-over-time is stamina pressure only, and cannot kill.
            dot=sum(amount for tag,amount in [('burn',3),('poison',4),('rot',5)]
                    if actor['statuses'].get(tag,0)>=turn)
            actor['vigor']=max(0,actor['vigor']-dot)
            stunned=actor['statuses'].get('stunned',0)>=turn
            if actor['vigor']>0 and not stunned:
                if power:
                    energy_spent=10
                    actor['energy']-=energy_spent
                factor=1+action_mastery*.06
                special=p['special']
                if special=='copy' and actor['copied'] is None:
                    eligible=[x for x in target['powers'] if x!='Siphon']
                    if eligible:
                        actor['copied']=sorted(eligible)[0]
                if special=='copy' and actor['copied']:
                    p=POWER_PROFILES[actor['copied']].copy()
                    special=p['special']; note.append('bout-only copy: '+actor['copied'])
                heal=p['heal']*factor
                if special=='rewind': heal=min(heal,actor['last_damage'])
                if special=='recover' and actor['vigor']<35 and not actor['recovery_used']:
                    heal+=25; actor['recovery_used']=True
                actor['vigor']=min(100,actor['vigor']+heal)
                actor['guard']=min(35,actor['guard']+p['guard']*factor)
                if special=='ward': actor['ward']=True
                if special=='energize': actor['energy']=min(100,actor['energy']+7)
                if special=='resolve':
                    actor['resolve']=min(100,actor['resolve']+18*factor)
                    actor['statuses'].pop('frightened',None)
                    actor['statuses']['resolute']=turn+2
                if special=='cleanse':
                    for tag in ('poison','burn','rot'): actor['statuses'].pop(tag,None)
                defense=_profile(target,turn)[1]
                accuracy=p['accuracy']+(min(.15,turn*.02) if special=='learn' else 0)
                evade=0 if target['statuses'].get('revealed',0)>=turn else defense['evade']
                chance=max(.20,min(.95,.75+accuracy-evade))
                hit=rng.random()<chance
                if hit:
                    damage=p['damage']*factor*(.85+rng.random()*.3)
                    if actor['statuses'].get('disarmed',0)>=turn: damage*=.7
                    if actor['statuses'].get('frightened',0)>=turn and actor['statuses'].get('resolute',0)<turn: damage*=.65
                    if target['ward'] and power:
                        damage=0; target['ward']=False; note.append('ward blocked power')
                    else:
                        soak=min(target['guard'],damage*.75)
                        target['guard']-=soak; damage-=soak
                        target['resolve']=max(0,target['resolve']-p['control']*factor*(.4 if target['statuses'].get('resolute',0)>=turn else 1))
                        if special=='fear' and target['statuses'].get('resolute',0)<turn:
                            target['statuses']['frightened']=turn+2
                        tags={'burn':'burn','poison':'poison','rot':'rot','slow':'slow',
                              'disarm':'disarmed','suppress':'suppressed','reveal':'revealed'}
                        if special in tags: target['statuses'][tags[special]]=turn+2
                        if special=='stun' and rng.random()<.35:
                            target['statuses']['stunned']=turn+1
                    target['last_damage']=damage
                    target['vigor']=max(0,target['vigor']-damage)
                else: note.append('miss')
            elif stunned: note.append('stunned; activation skipped')
            actor['energy']=min(100,actor['energy']+3)
            trace.append(dict(round=turn,actor_id=actor['id'],target_id=target['id'],
                              power=power,action_mastery=action_mastery,energy_spent=energy_spent,notes=note,before=before,after=copy.deepcopy(pair)))
            defeated=[f for f in pair if f['vigor']<=0 or f['resolve']<=0]
            if defeated:
                winner=next((f['id'] for f in pair if f not in defeated),None)
                reason='nonlethal_stoppage'; break
        if reason=='nonlethal_stoppage': break
    if reason=='round_limit':
        scores=[round(f['vigor']+f['resolve'],6) for f in pair]
        if scores[0]!=scores[1]: winner=pair[scores.index(max(scores))]['id']
    return dict(schema_version=1,seed=seed,winner_id=winner,draw=winner is None,
                rounds=turn,reason=reason,nonlethal=True,world_mutated=False,
                starting_state=starting,final_state=copy.deepcopy(pair),trace=trace)


def simulate_tournament(entrants, seed=0, max_rounds=30, format='single_elimination'):
    """2..64 entrants; seeded bracket, explicit byes, fresh bouts, no mutation.

    Drawn bouts advance by a recorded seeded coin toss, never by input ordering.
    This is tournament adjudication, NOT a claimed fight victory.
    """
    if format!='single_elimination': raise ValueError('Unsupported tournament format')
    if not 2<=len(entrants)<=64: raise ValueError('Tournament needs 2..64 entrants')
    roster={_fighter(e)['id']:copy.deepcopy(e) for e in entrants}
    if len(roster)!=len(entrants): raise ValueError('Entrant ids must be unique')
    active=sorted(roster); _rng(seed,'seeding').shuffle(active)
    seeding=active[:]; matches=[]; byes=[]; stage=1
    # Byes only in the opening round, reaching a power-of-two bracket.
    size=1
    while size<len(active): size*=2
    bye_count=size-len(active)
    advanced=active[:bye_count]
    byes=[dict(round=1,fighter_id=x) for x in advanced]
    active=active[bye_count:]
    while active:
        for index in range(0,len(active),2):
            a,b=active[index:index+2]
            fight_seed=_rng(seed,'match',stage,*sorted([a,b])).getrandbits(63)
            result=simulate_fight(roster[a],roster[b],fight_seed,max_rounds)
            advance=result['winner_id']
            adjudication=None
            if advance is None:
                advance=_rng(seed,'draw',stage,*sorted([a,b])).choice(sorted([a,b]))
                adjudication='seeded draw advancement'
            matches.append(dict(round=stage,entrant_ids=[a,b],result=result,
                                advancing_id=advance,adjudication=adjudication))
            advanced.append(advance)
        if len(advanced)==1: break
        active=advanced; advanced=[]; stage+=1
    return dict(schema_version=1,seed=seed,format=format,seeding=seeding,byes=byes,
                matches=matches,champion_id=advanced[0],nonlethal=True,world_mutated=False)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input',help='JSON with fighters (two) or entrants')
    parser.add_argument('--seed',type=int,default=0)
    parser.add_argument('--max-rounds',type=int,default=30)
    args=parser.parse_args()
    with open(args.input) as handle: data=json.load(handle)
    result=(simulate_tournament(data['entrants'],args.seed,args.max_rounds) if 'entrants' in data
            else simulate_fight(*data['fighters'],seed=args.seed,max_rounds=args.max_rounds))
    print(json.dumps(result,indent=2,allow_nan=False))

if __name__=='__main__': main()
