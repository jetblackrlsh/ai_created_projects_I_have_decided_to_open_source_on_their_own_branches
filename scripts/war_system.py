"""Opt-in strategic war model. Armies are abstract units, not extra citizens."""
from copy import deepcopy
import math
from expanded_powers import powers_of
from power_mastery import level_for
from combat_sim import POWER_PROFILES


def validate_warfare(v):
    if v is None:return
    def obj(x,keys):
        if not isinstance(x,dict) or set(x)-set(keys):raise ValueError('Unknown warfare field')
    def num(x,hi=10000):
        if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x) or not 0<=x<=hi:raise ValueError('Invalid war number')
    obj(v,['factions','territories','wars'])
    for name,limit in [('factions',16),('territories',64),('wars',16)]:
        rows=v.get(name)
        if not isinstance(rows,list) or not 1<=len(rows)<=limit:raise ValueError('Invalid '+name)
        if any(not isinstance(x,dict) or not isinstance(x.get('id'),str) or not x['id'].strip() or len(x['id'])>120 for x in rows):raise ValueError('Invalid war id')
        if len({x['id'] for x in rows})!=len(rows):raise ValueError('Duplicate war id')
    fs={f['id']:f for f in v['factions']};ts={t['id']:t for t in v['territories']}
    for f in fs.values():
        obj(f,['id','nation','army','supplies','morale','allies'])
        if not isinstance(f.get('nation'),str) or not f['nation']:raise ValueError('Faction requires nation')
        for k in ('army','supplies'):num(f.get(k,100))
        num(f.get('morale',70),100)
        allies=f.get('allies',[])
        if not isinstance(allies,list) or any(not isinstance(a,str) or a not in fs or a==f['id'] for a in allies) or len(set(allies))!=len(allies):raise ValueError('Invalid allies')
        if any(not isinstance(fs[a].get('allies',[]),list) or f['id'] not in fs[a].get('allies',[]) for a in allies):raise ValueError('Alliances must be mutual')
    for t in ts.values():
        obj(t,['id','owner','neighbors','fortification','production'])
        if not isinstance(t.get('owner'),str) or t['owner'] not in fs:raise ValueError('Invalid territory owner')
        for k in ('fortification','production'):num(t.get(k,0),100)
        ns=t.get('neighbors',[])
        if not isinstance(ns,list) or any(not isinstance(n,str) or n not in ts or n==t['id'] for n in ns) or len(set(ns))!=len(ns):raise ValueError('Invalid border')
        if any(not isinstance(ts[n].get('neighbors',[]),list) or t['id'] not in ts[n].get('neighbors',[]) for n in ns):raise ValueError('Borders must be mutual')
    pairs=set()
    for w in v['wars']:
        obj(w,['id','kind','side_a','side_b','start_year','objectives','peace_after','max_years'])
        a,b=w.get('side_a'),w.get('side_b')
        if not isinstance(a,str) or not isinstance(b,str) or a not in fs or b not in fs or a==b:raise ValueError('Invalid belligerents')
        pair=tuple(sorted([a,b]))
        if pair in pairs:raise ValueError('Duplicate war pair')
        pairs.add(pair)
        if w.get('kind') not in ('civil','international'):raise ValueError('War kind required')
        if (fs[a]['nation']==fs[b]['nation']) != (w['kind']=='civil'):raise ValueError('Civil war requires shared nation; international war requires distinct nations')
        if {a,*fs[a].get('allies',[])} & {b,*fs[b].get('allies',[])}:raise ValueError('Opposing coalitions overlap')
        for k,d in [('start_year',0),('peace_after',10),('max_years',30)]:
            x=w.get(k,d);num(x)
            if type(x) is not int or k!='start_year' and x<1:raise ValueError('Invalid war timing')
        obj(w.get('objectives',{}),[a,b])
        for targets in w.get('objectives',{}).values():
            if not isinstance(targets,list) or not targets or any(not isinstance(t,str) or t not in ts for t in targets):raise ValueError('Invalid capture objective')


def init_warfare(scenario):
    v=(scenario or {}).get('world',{}).get('warfare')
    if v is None:return None
    validate_warfare(v);s=deepcopy(v);s.update(history=[],last_year=0)
    for f in s['factions']:
        for k,d in [('army',100.),('supplies',100.),('morale',70.),('allies',[])]:f.setdefault(k,d)
        f.update(losses=0.,exhaustion=0.)
    for t in s['territories']:t.setdefault('fortification',0.);t.setdefault('production',10.);t.setdefault('neighbors',[])
    for w in s['wars']:
        for k,d in [('start_year',0),('peace_after',10),('max_years',30),('objectives',{})]:w.setdefault(k,d)
        w.update(status='active' if w['start_year']==0 else 'scheduled',winner=None,battles=0,fronts=[])
    return s


def tick_warfare(s,agents,rng,year):
    if s is None or year<=s['last_year']:return []
    s['last_year']=year;events=[];fs={f['id']:f for f in s['factions']};ts={t['id']:t for t in s['territories']}
    def coalition(f):return {f,*fs[f]['allies']}
    def army(f):return sum(fs[x]['army'] for x in coalition(f))
    def emit(text,**details):
        e=dict(year=year,category='war',true_event=text,public_belief=text,secret=False,details=details);events.append(e);s['history'].append(deepcopy(e))
    def finish(w,winner,why):
        w.update(status='ended',winner=winner,end_year=year,end_reason=why);emit(w['id']+' ended: '+why,war=w['id'],winner=winner)
    def strength(f,defense=False):
        val=sum(fs[x]['army']*(.4+.006*fs[x]['morale'])*(.3+.7*min(1,fs[x]['supplies']/20))*(1-fs[x]['exhaustion']/150) for x in sorted(coalition(f)));uses=[]
        eligible=[a for a in agents.values() if a.get('alive',True) and powers_of(a) and a.get('faction') in coalition(f) and a.get('age',0)>=18 and a.get('injury',0)<.8 and a.get('energy',100)>=10 and all(a.get(k,0)<year for k in ('imprisoned_until','hospitalized_until','quarantined_until','stasis_until','frozen_until','stunned_until','suppressed_until')) and (a.get('frightened_until',0)<year or a.get('resolute_until',0)>=year)]
        for a in sorted(eligible,key=lambda a:a['id'])[:16]:
            candidates=[]
            for p in powers_of(a):
                q=POWER_PROFILES[p];score=(q['guard']+q['heal'] if defense else q['damage']+q['control'])+10*(q['accuracy']+q['evade'])+q['initiative'];candidates.append((max(1,score)*(1+.15*level_for(a,p)),p))
            if candidates:
                value,p=max(candidates);val+=value;uses.append(dict(id=a['id'],power=p,contribution=round(value,3)))
        return max(1.,val),uses
    def lose(f,n):
        total=army(f)
        for x in sorted(coalition(f)):
            row=fs[x];lost=min(row['army'],n*row['army']/max(total,1));row['army']-=lost;row['losses']+=lost;row['exhaustion']=min(100.,row['exhaustion']+3);row['supplies']=max(0.,row['supplies']-5)
    for f in fs.values():f['supplies']=min(10000.,f['supplies']+sum(t['production'] for t in ts.values() if t['owner']==f['id']))
    for w in s['wars']:
        if w['status']=='ended' or year<w['start_year']:continue
        if w['status']=='scheduled':w['status']='active';emit(w['id']+' began.',war=w['id'])
        a,b=w['side_a'],w['side_b'];ca,cb=coalition(a),coalition(b)
        winners=[f for f in (a,b) if w['objectives'].get(f) and all(ts[t]['owner'] in coalition(f) for t in w['objectives'][f])]
        defeated=[f for f in (a,b) if army(f)<1 or not any(t['owner'] in coalition(f) for t in ts.values())]
        if winners:finish(w,winners[0] if len(winners)==1 else None,'capture objectives achieved');continue
        if defeated:finish(w,None if len(defeated)==2 else (b if defeated[0]==a else a),'military collapse');continue
        fronts=[(t,n) for t in sorted(ts) for n in sorted(ts[t]['neighbors']) if ts[t]['owner'] in ca and ts[n]['owner'] in cb];w['fronts']=[list(x) for x in fronts]
        if fronts:
            left,right=rng.choice(fronts);att,deff=(a,b) if rng.random()<.5 else (b,a);target=right if att==a else left;previous_owner=ts[target]['owner']
            av,au=strength(att);dv,du=strength(deff,True);dv+=ts[target]['fortification'];won=av*rng.uniform(.75,1.25)>dv*rng.uniform(.75,1.25)
            al=min(army(att),max(1,army(deff)*(.04 if won else .10)));dl=min(army(deff),max(1,army(att)*(.10 if won else .04)));lose(att,al);lose(deff,dl)
            for u in au+du:
                p=agents[u['id']];p['energy']=max(0.,p.get('energy',100)-8);p['injury']=min(.95,p.get('injury',0)+.015)
            if won:ts[target]['owner']=att;ts[target]['fortification']*=.75;fs[att]['morale']=min(100.,fs[att]['morale']+3);fs[deff]['morale']=max(0.,fs[deff]['morale']-5)
            w['battles']+=1
            emit(f"{w['id']}: {att} {'captured' if won else 'failed to capture'} {target} from {previous_owner}.",war=w['id'],target=target,previous_owner=previous_owner,attacker=att,defender=deff,captured=won,attack_strength=round(av,3),defense_strength=round(dv,3),army_losses={att:round(al,3),deff:round(dl,3)},power_support=au+du)
        winners=[f for f in (a,b) if w['objectives'].get(f) and all(ts[t]['owner'] in coalition(f) for t in w['objectives'][f])]
        if winners:finish(w,winners[0] if len(winners)==1 else None,'capture objectives achieved');continue
        defeated=[f for f in (a,b) if army(f)<1 or not any(t['owner'] in coalition(f) for t in ts.values())]
        if defeated:finish(w,None if len(defeated)==2 else (b if defeated[0]==a else a),'military collapse');continue
        elapsed=year-w['start_year']
        if elapsed>=w['max_years'] or elapsed>=w['peace_after'] and (not fronts or min(fs[a]['exhaustion'],fs[b]['exhaustion'])>=60):finish(w,None,'negotiated ceasefire; territorial control retained')
    return events
