"""Opt-in bounded world-threat campaigns, separate from annual worlds and arenas.

A finite population lives in abstract regions. Devastation explicitly removes
population; combat incapacitates characters, never silently labels them dead.
No planet-destruction physics, automatic resurrection, or unrecorded hero feats.
"""
import argparse, copy, hashlib, json, math, random
from collections import Counter
from pathlib import Path
from combat_sim import POWER_PROFILES, _rng
from power_mastery import configure_mastery
from threat_combat import create_state, step_round, living, defeated, active

VERSION='4.5'


def number(v, lo, hi, name, integer=False):
    if isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v) or not lo<=v<=hi or (integer and type(v) is not int):
        raise ValueError(f'{name} must be {lo}..{hi}')
    return v


def validate(config):
    c=copy.deepcopy(config)
    if set(c)-{'name','description','fighters','world','rules'}: raise ValueError('Unknown campaign fields')
    if not isinstance(c.get('fighters'),list) or not 1<=len(c['fighters'])<=16: raise ValueError('1..16 fighters required')
    ids=set(); villains=0
    for f in c['fighters']:
        if set(f)-{'id','name','team','powers','power_mastery','energy'}: raise ValueError('Unknown fighter field')
        if not isinstance(f.get('id'),str) or not f['id'] or f['id'] in ids: raise ValueError('Unique nonempty string fighter ids required')
        ids.add(f['id'])
        if f.get('team') not in ('threat','heroes'): raise ValueError('Team must be threat or heroes')
        villains+=f['team']=='threat'
        ps=f.get('powers',[])
        if not isinstance(ps,list) or len(ps)>64 or len(set(ps))!=len(ps) or any(p not in POWER_PROFILES for p in ps): raise ValueError('Invalid powers')
        if not isinstance(f.get('power_mastery',{}),dict) or set(f.get('power_mastery',{}))-set(ps): raise ValueError('Mastery must refer to held powers')
        for p,l in f.get('power_mastery',{}).items(): number(l,0,5,p,True)
        number(f.get('energy',100),0,100,'energy')
    if villains!=1: raise ValueError('Exactly one threat required')
    w=c.setdefault('world',{})
    if set(w)-{'population','regions','horizon','initial_alert','detection_base','devastation_scale'}: raise ValueError('Unknown world field')
    for k,d,lo,hi in [('population',12000,1,1000000000),('regions',12,1,100),('horizon',120,1,1000)]:
        w[k]=number(w.get(k,d),lo,hi,k,True)
    if w['population']<w['regions']:raise ValueError('Population must cover every region')
    if type(w.setdefault('initial_alert',False)) is not bool:raise ValueError('initial_alert must be boolean')
    for k,d,lo,hi in [('detection_base',.12,0,1),('devastation_scale',25,0,10000)]:w[k]=number(w.get(k,d),lo,hi,k)
    r=c.setdefault('rules',{})
    if set(r)-{'fight_priority','rescue_chance','travel_steps','devastation_power'}:raise ValueError('Unknown rule field')
    r['fight_priority']=number(r.get('fight_priority',.75),0,1,'fight_priority')
    r['rescue_chance']=number(r.get('rescue_chance',.15),0,1,'rescue_chance')
    r['travel_steps']=number(r.get('travel_steps',2),0,20,'travel_steps',True)
    r['devastation_power']=r.get('devastation_power','Strength')
    villain=next(f for f in c['fighters'] if f['team']=='threat')
    if r['devastation_power'] not in villain['powers'] or POWER_PROFILES[r['devastation_power']]['damage']<=0:raise ValueError('Threat must hold damaging devastation power')
    return c


def initialize(config,seed):
    c=validate(config); fs=[]
    for spec in c['fighters']:
        f=copy.deepcopy(spec); levels=f.pop('power_mastery',{})
        configure_mastery(f,levels,0); fs.append(f)
    combat=create_state(fs)
    n=c['world']['regions'];q,rem=divmod(c['world']['population'],n)
    return {'schema_version':1,'engine_version':VERSION,'config':c,'seed':seed,'step':0,'combat':combat,
            'regions':[{'id':i,'population':q+(i<rem),'initial_population':q+(i<rem),'integrity':100.0} for i in range(n)],
            'dead':0,'sheltered':0,'shelter_breached':False,'detected_at':0 if c['world']['initial_alert'] else None,
            'engaged_at':None,'outcome':None,'trace':[]}


def _living(s,team):return living(s['combat'],team)
def _level(f,p):return f['power_levels'].get(p,0) if p in f['powers'] else 0

def run(config=None,seed=0,state=None,stop_at=None):
    s=copy.deepcopy(state) if state is not None else initialize(config,seed)
    if s.get('schema_version')!=1:raise ValueError('Unsupported campaign save')
    c=validate(s['config']);w=c['world'];r=c['rules'];seed=s['seed']
    end=w['horizon'] if stop_at is None else number(stop_at,s['step'],w['horizon'],'stop_at',True)
    if s['outcome']:return s
    for turn in range(s['step']+1,end+1):
        s['step']=turn; heroes=_living(s,'heroes'); threat=_living(s,'threat')
        if not threat:s['outcome']='threat_stopped';break
        villain=threat[0]; events=[]; skip={}; rescue=None
        # All detecting contributions are explicit abilities, not arbitrary named-character luck.
        if s['detected_at'] is None and heroes:
            bonus=max(sum(_level(h,p)*k for p,k in [('Analytical Vision',.025),('Telepathy',.015),('Tactical Analysis',.02)]) for h in heroes)
            chance=min(.95,w['detection_base']+bonus+min(.3,s['dead']/w['population']))
            if _rng(seed,'detection',turn).random()<chance:
                s['detected_at']=turn;events.append({'event':'threat_detected','probability':chance})
        if s['detected_at'] is not None and s['engaged_at'] is None and heroes:
            travel=max(0,r['travel_steps']-(1 if any('Flight' in h['powers'] or 'Speed' in h['powers'] for h in heroes) else 0))
            if turn>=s['detected_at']+travel:
                s['engaged_at']=turn;events.append({'event':'heroes_intercept'})
        engaged=s['engaged_at'] is not None and bool(heroes)
        if not engaged:
            skip.update({h['id']:'not yet intercepted' for h in heroes})
        elif s['dead']>0:
            # At most one capable hero diverts a combat action into evacuation.
            rescuers=[h for h in heroes if 'Flight' in h['powers'] or 'Portals' in h['powers']]
            if rescuers and _rng(seed,'rescue_choice',turn).random()<r['rescue_chance']:
                h=sorted(rescuers,key=lambda x:x['id'])[0]
                p='Flight' if 'Flight' in h['powers'] else 'Portals'
                if h['energy']>=10:
                    amount=int(100+30*_level(h,p));available=[x for x in s['regions'] if x['population']]
                    if available:
                        target=max(available,key=lambda x:x['population']);amount=min(amount,target['population'])
                        rescue=(h['id'],p,amount,target['id'])
                        skip[h['id']]='evacuation'
        devastate=not engaged or _rng(seed,'threat_choice',turn).random()>=r['fight_priority']
        if devastate:skip[villain['id']]='devastation'
        actions=step_round(s['combat'],seed,turn,skip_actions=skip)
        if rescue:
            hid,p,amount,rid=rescue
            h=next(h for h in s['combat']['fighters'] if h['id']==hid)
            if any(a['actor_id']==hid and a['action']=='evacuation' for a in actions) and active(h) and h['energy']>=10 and h['statuses'].get('suppressed',0)<turn:
                target=s['regions'][rid];amount=min(amount,target['population'])
                target['population']-=amount;s['sheltered']+=amount;h['energy']-=10
                events.append({'event':'evacuation','hero_id':hid,'power':p,'people':amount,'region':rid})
        # Combat resolves first, so an incapacitated threat cannot strike afterward.
        threat=_living(s,'threat')
        if devastate and threat and any(a['actor_id']==villain['id'] and a['action']=='devastation' for a in actions):
            villain=threat[0];p=r['devastation_power']
            if villain['energy']>=10 and villain['statuses'].get('stunned',0)<turn and villain['statuses'].get('suppressed',0)<turn:
                villain['energy']-=10
                base=POWER_PROFILES[p]['damage']*(1+.06*_level(villain,p))*w['devastation_scale']
                if villain['statuses'].get('frightened',0)>=turn and villain['statuses'].get('resolute',0)<turn:base*=.65
                killed=max(1,int(base*_rng(seed,'devastation',turn).uniform(.7,1.3))) if base else 0
                available=[x for x in s['regions'] if x['population']]
                if available:
                    target=_rng(seed,'target_region',turn).choice(available);killed=min(killed,target['population'])
                    target['population']-=killed;target['integrity']=max(0,target['integrity']-100*killed/target['initial_population'])
                    region=target['id']
                else:
                    killed=min(killed,s['sheltered']);s['sheltered']-=killed;s['shelter_breached']=True;region='shelter'
                s['dead']+=killed;events.append({'event':'devastation','power':p,'people_killed':killed,'region':region})
            else:events.append({'event':'devastation_prevented','reason':'energy or status'})
        survivors=sum(x['population'] for x in s['regions'])+s['sheltered']
        assert survivors+s['dead']==w['population']
        if survivors==0:s['outcome']='world_population_destroyed'
        elif defeated(s['combat'],'threat'):s['outcome']='threat_stopped'
        s['trace'].append({'step':turn,'events':events,'combat_actions':actions,'survivors':survivors,'dead':s['dead'],'sheltered':s['sheltered']})
        if s['outcome']:break
    if s['step']==w['horizon'] and s['outcome'] is None:s['outcome']='unresolved_at_horizon'
    return s


def summarize(s):
    n=s['config']['world']['population'];heroes=[f for f in s['combat']['fighters'] if f['team']=='heroes']
    disabled=[f['id'] for f in heroes if f['vigor']<=0 or f['resolve']<=0]
    return {'seed':s['seed'],'outcome':s['outcome'],'steps':s['step'],'population':n,'dead':s['dead'],'survivors':n-s['dead'],
            'loss_percent':100*s['dead']/n,'disabled_heroes':disabled,'all_heroes_disabled':bool(heroes) and len(disabled)==len(heroes),
            'detected_at':s['detected_at'],'engaged_at':s['engaged_at'],'sheltered_survivors':s['sheltered']}


def batch(config,runs=100,seed=10101):
    number(runs,1,10000,'runs',True);validate(config)
    worlds=[run(config,seed+97*i) for i in range(runs)];rows=[summarize(x) for x in worlds]
    counts=Counter(x['outcome'] for x in rows)
    return {'engine_version':VERSION,'mode':'world-threat','runs':runs,'seed_base':seed,'seed_stride':97,
            'config':validate(config),'config_sha256':hashlib.sha256(json.dumps(validate(config),sort_keys=True).encode()).hexdigest(),
            'aggregate_stats':{'outcomes':{k:{'count':counts[k],'percent':100*counts[k]/runs} for k in ['threat_stopped','world_population_destroyed','unresolved_at_horizon']},
               'mean_population_loss_percent':sum(x['loss_percent'] for x in rows)/runs,
               'all_heroes_disabled_count':sum(x['all_heroes_disabled'] for x in rows)},'results':rows,'worlds':worlds}


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--scenario');p.add_argument('--runs',type=int,default=100);p.add_argument('--seed',type=int,default=10101)
    p.add_argument('--load-state');p.add_argument('--save-state');p.add_argument('--stop-at',type=int);p.add_argument('--output-json',required=True)
    a=p.parse_args()
    if a.load_state or a.save_state or a.stop_at is not None:
        if a.runs!=1:raise ValueError('Checkpoint runs require --runs1')
        if a.load_state and a.scenario:raise ValueError('Resume uses saved scenario')
        state=json.loads(Path(a.load_state).read_text()) if a.load_state else None
        config=json.loads(Path(a.scenario).read_text()) if a.scenario else None
        result=run(config,a.seed,state,a.stop_at)
        if a.save_state:Path(a.save_state).write_text(json.dumps(result,indent=2))
    else:
        if not a.scenario:raise ValueError('--scenario required')
        result=batch(json.loads(Path(a.scenario).read_text()),a.runs,a.seed)
    Path(a.output_json).write_text(json.dumps(result,indent=2,allow_nan=False))
if __name__=='__main__':main()
