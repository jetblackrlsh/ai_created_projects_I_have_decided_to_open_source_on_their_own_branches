"""Per-ability progression with explicit, non-destructive legacy migration.

Compatibility scalar mastery is the strongest CURRENT power, not a shared pool.
Historical records for lost powers remain but do not contribute while unheld.
"""

def _name(value):return 'Fortune' if value=='Luck' else value


def held_powers(agent):
    values=[agent.get('power')]+list(agent.get('powers') or [])
    return list(dict.fromkeys(_name(p) for p in values if isinstance(p,str) and p))[:3]


def ensure_mastery(agent,year=0):
    held=held_powers(agent)
    if 'power_mastery' not in agent:
        xp=max(0,int(agent.get('power_xp',10*agent.get('mastery_level',0))))
        # Some older callers supplied level without consistent XP. Preserve the higher entitlement.
        xp=max(xp,10*max(0,min(5,int(agent.get('mastery_level',0)))))
        last=agent.get('last_power_use_year',max(0,agent.get('birth_year',year)))
        agent['power_mastery']={p:{'xp':xp,'level':min(5,xp//10),'last_use_year':last,'uses_total':0,'acquired_year':year} for p in held}
        if xp and held:agent['mastery_migration']='Legacy shared experience credited once to each then-held power; historical per-power use counts unknown.'
    records=agent['power_mastery']
    # Canonical alias, retaining the better record if an old producer wrote both.
    if 'Luck' in records:
        legacy=records.pop('Luck')
        if legacy.get('xp',0)>records.get('Fortune',{}).get('xp',-1):records['Fortune']=legacy
    for power in held:
        records.setdefault(power,{'xp':0,'level':0,'last_use_year':year,'uses_total':0,'acquired_year':year})
    agent['_mastery_year']=max(year,agent.get('_mastery_year',year))
    sync_mastery(agent)
    return records


def sync_mastery(agent):
    records=agent.get('power_mastery',{})
    for rec in records.values():rec['level']=min(5,max(0,int(rec.get('xp',0)))//10)
    current=[records[p] for p in held_powers(agent) if p in records]
    agent['mastery_level']=max((r['level'] for r in current),default=0)
    agent['power_xp']=max((r['xp'] for r in current),default=0)
    if current:agent['last_power_use_year']=max(r['last_use_year'] for r in current)
    return agent['mastery_level']


def level_for(agent,power):
    # Read-only so goal evaluation and previews never mutate source state.
    power=_name(power)
    if power not in held_powers(agent):return 0
    if 'power_mastery' in agent:
        rec=agent['power_mastery'].get(power,{})
        return min(5,max(0,int(rec.get('xp',0)))//10)
    return min(5,max(0,int(agent.get('mastery_level',0)),int(agent.get('power_xp',0))//10))


def award_use(agent,power,year):
    records=ensure_mastery(agent,year);power=_name(power)
    if power not in held_powers(agent):return False
    rec=records[power];rec['xp']+=1;rec['uses_total']+=1;rec['last_use_year']=year
    agent['power_uses_total']=agent.get('power_uses_total',0)+1
    sync_mastery(agent);return True


def decay_mastery(agent,year):
    records=ensure_mastery(agent,year);changed=[]
    for power,rec in records.items():
        inactive=year-rec['last_use_year']
        if inactive>=10 and (inactive-10)%5==0 and rec['xp']>0 and rec.get('last_decay_year')!=year:
            rec['xp']=max(0,rec['xp']-5);rec['last_decay_year']=year;changed.append(power)
    sync_mastery(agent);return changed


def configure_mastery(agent,levels,year):
    records=ensure_mastery(agent,year)
    for power,level in levels.items():
        records[_name(power)]={'xp':10*level,'level':level,'uses_total':0,'last_use_year':year,'acquired_year':year}
    sync_mastery(agent)


def mastery_distribution(agents):
    return {str(level):sum(level_for(a,p)==level for a in agents for p in held_powers(a)) for level in range(6)}
