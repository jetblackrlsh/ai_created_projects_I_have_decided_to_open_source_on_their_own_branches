from power_mastery import configure_mastery,ensure_mastery,award_use
"""Validated character setup, rivalry encounters and explicit main-character ledger.

World hooks consume the world's RNG and persist all scheduling/tracking state.
Arena mechanics are pure; only this adapter commits bounded declared consequences.
"""
from copy import deepcopy
import json
import math
from expanded_powers import canonical_power, powers_of, set_powers, MAX_POWERS
from combat_sim import simulate_fight, simulate_tournament
from scenario_customization import validate_custom_character, validate_world_settings, apply_character, apply_relationships
from goal_engine import validate_goals, resolve_goals, plan_goals, evaluate_goals

MAX_CHARACTERS=64
MAX_MAINS=16
MAX_ENCOUNTERS=1000
MAX_YEARS=10000

def _catalog():
    from power_effects import POWER_EFFECTS
    return POWER_EFFECTS


def number(x,lo,hi,label):
    if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x) or not lo<=x<=hi:
        raise ValueError(f'{label} must be a finite number in [{lo}, {hi}]')
    return x


def validate_scenario(raw,catalog):
    if raw is None:return None
    if not isinstance(raw,dict):raise ValueError('Scenario must be a JSON object')
    allowed={'version','characters','rivalries','main_characters','encounters','tournaments','fight','settings','world','relationships'}
    if set(raw)-allowed:raise ValueError('Unsupported scenario fields: '+', '.join(sorted(set(raw)-allowed)))
    if raw.get('version',1)!=1:raise ValueError('Unsupported scenario version')
    data=deepcopy(raw);data['version']=1
    chars=data.setdefault('characters',[])
    if not isinstance(chars,list) or len(chars)>MAX_CHARACTERS:raise ValueError('characters must be a list of at most64 records')
    keys=set();ids=set()
    for c in chars:
        if not isinstance(c,dict):raise ValueError('Each character must be an object')
        validate_custom_character(c,catalog)
        key=c.get('key')
        if not isinstance(key,str) or not key.strip() or len(key)>80 or key in keys:raise ValueError('Character keys must be unique nonempty strings up to80 characters')
        keys.add(key)
        if 'id' in c:
            if type(c['id']) is not int or c['id']<1 or c['id'] in ids:raise ValueError('Character ids must be unique positive integers')
            ids.add(c['id'])
        if 'name' in c and (not isinstance(c['name'],str) or not c['name'].strip() or len(c['name'])>120):raise ValueError('Invalid character name')
        powers=c.get('powers',[])
        if not isinstance(powers,list) or len(powers)>MAX_POWERS or any(not isinstance(p,str) for p in powers):raise ValueError('Use at most64 named powers per character')
        c['powers']=[canonical_power(p) for p in powers]
        if len(set(c['powers']))!=len(c['powers']) or any(p not in catalog for p in c['powers']):raise ValueError('Unknown or duplicate character power')
        if 'age' in c:
            number(c['age'],0,10000,'age')
            if type(c['age']) is not int:raise ValueError('Age must be an integer')
        if 'mastery_level' in c:
            number(c['mastery_level'],0,5,'mastery_level')
            if type(c['mastery_level']) is not int:raise ValueError('mastery_level must be an integer')
        if 'main_character' in c and type(c['main_character']) is not bool:raise ValueError('main_character must be boolean')
        traits=c.get('traits',{})
        if not isinstance(traits,dict) or set(traits)-{'ambition','compassion','greed','curiosity','charisma'}:raise ValueError('Unknown character traits')
        for name,value in traits.items():number(value,0,1,name)
    mains=data.setdefault('main_characters',[])
    if not isinstance(mains,list) or len(mains)>MAX_MAINS or sum(c.get('main_character',False) for c in chars)>MAX_MAINS:raise ValueError('Use at most16 main characters')
    for ref in mains:
        if not isinstance(ref,(str,int)) or isinstance(ref,bool):raise ValueError('Main characters must reference a key or numeric id')
    rivals=data.setdefault('rivalries',[])
    if not isinstance(rivals,list) or len(rivals)>128:raise ValueError('Use at most128 rival relationships')
    for rel in rivals:
        if not isinstance(rel,dict) or set(rel)-{'a','b','mutual','intensity','interval'}:raise ValueError('Invalid rivalry record')
        if 'a' not in rel or 'b' not in rel or rel['a']==rel['b']:raise ValueError('Rivalries require two distinct references')
        number(rel.get('intensity',.8),0,1,'rival intensity')
        if type(rel.get('interval',3)) is not int or not 1<=rel.get('interval',3)<=100:raise ValueError('Rival interval must be1..100 years')
        if type(rel.get('mutual',True)) is not bool:raise ValueError('mutual must be boolean')
    opts=data.setdefault('encounters',{})
    if not isinstance(opts,dict) or set(opts)-{'enabled','max_per_year','max_rounds','commit_consequences'}:raise ValueError('Unknown encounter option')
    for field in ('enabled','commit_consequences'):
        if type(opts.get(field,field=='enabled')) is not bool:raise ValueError(field+' must be boolean')
    for field,default,lo,hi in [('max_per_year',2,0,8),('max_rounds',20,1,200)]:
        if type(opts.get(field,default)) is not int or not lo<=opts.get(field,default)<=hi:raise ValueError('Invalid '+field)
    tournaments=data.setdefault('tournaments',[])
    if not isinstance(tournaments,list) or len(tournaments)>32:raise ValueError('Use at most32 scheduled tournaments')
    for t in tournaments:
        if not isinstance(t,dict) or set(t)-{'year','name','entrants'}:raise ValueError('Invalid scheduled tournament')
        if type(t.get('year')) is not int or not 1<=t['year']<=MAX_YEARS:raise ValueError('Tournament year must be1..10000')
        if 'name' in t and (not isinstance(t['name'],str) or not t['name'].strip() or len(t['name'])>120):raise ValueError('Tournament name must be a nonempty string up to120 characters')
        if not isinstance(t.get('entrants'),list) or not 2<=len(t['entrants'])<=64:raise ValueError('Tournament needs2..64 entrant references')
    if 'fight' in data:
        f=data['fight']
        if not isinstance(f,dict) or set(f)-{'a','b'} or 'a' not in f or 'b' not in f or f['a']==f['b']:raise ValueError('fight needs two distinct references a/b')
    validate_world_settings(data)
    return data


def _ref(ref,keys,agents):
    if isinstance(ref,bool):raise ValueError('Invalid boolean character reference')
    if isinstance(ref,str) and ref in keys:ref=keys[ref]
    if isinstance(ref,str) and ref.isdigit():ref=int(ref)
    if type(ref) is not int or ref not in agents:raise ValueError('Unresolved character reference: '+str(ref))
    return ref


def init_story(agents,scenario,year=0,mode=None,seed=0):
    if scenario is None:return None
    if mode is not None and mode!='modern' and scenario.get('world',{}).get('society',{}).get('leadership_system','elections')!='elections':raise ValueError('Alternate leadership systems require modern mode')
    keys={};used=set();reserved={c['id'] for c in scenario['characters'] if 'id' in c};free=iter(sorted(agents))
    for c in scenario['characters']:
        aid=c.get('id')
        if aid is None:
            aid=next((i for i in free if i not in used and i not in reserved),None)
        if aid not in agents or aid in used:raise ValueError('Configured characters exceed the founder population or share an id')
        used.add(aid);keys[c['key']]=aid;a=agents[aid]
        a['character_key']=c['key'];a['name']=c.get('name',c['key'])
        if 'age' in c:a['age']=c['age'];a['birth_year']=year-c['age']
        set_powers(a,c.get('powers',[]))
        if 'mastery_level' in c:
            a['mastery_level']=c['mastery_level'];a['power_xp']=10*c['mastery_level']
            a['power_uses_total']=0;a['last_power_use_year']=year
        levels={p:c.get('mastery_level',0) for p in powers_of(a)}
        levels.update(c.get('power_mastery',{}))
        configure_mastery(a,levels,year)
        a.update(c.get('traits',{}))
        apply_character(a,c,year,modern=mode=='modern')
    for aid in used:
        for ability in agents[aid].get('stat_powers',[]):
            if ability.get('target_id') is not None:ability['target_id']=str(_ref(ability['target_id'],keys,agents))
    apply_relationships(agents,scenario.get('relationships',[]),lambda ref:_ref(ref,keys,agents))
    mains=list(scenario.get('main_characters',[]))+[c['key'] for c in scenario['characters'] if c.get('main_character')]
    main_ids=list(dict.fromkeys(_ref(ref,keys,agents) for ref in mains))
    if len(main_ids)>MAX_MAINS:raise ValueError('Use at most16 distinct main characters')
    rels=[];pairs=set()
    for rel in scenario['rivalries']:
        a,b=_ref(rel['a'],keys,agents),_ref(rel['b'],keys,agents)
        if a==b:raise ValueError('A character cannot rival itself')
        pair=(min(a,b),max(a,b))
        if pair in pairs:raise ValueError('Duplicate rival pair')
        pairs.add(pair)
        record={'a_id':a,'b_id':b,'mutual':rel.get('mutual',True),'intensity':rel.get('intensity',.8),'interval':rel.get('interval',3),'last_fight_year':year-rel.get('interval',3)}
        rels.append(record)
        agents[a].setdefault('rival_ids',[]).append(b)
        if record['mutual']:agents[b].setdefault('rival_ids',[]).append(a)
    scheduled=[]
    for index,t in enumerate(scenario['tournaments']):
        ids=[_ref(ref,keys,agents) for ref in t['entrants']]
        if len(ids)!=len(set(ids)):raise ValueError('Duplicate tournament entrant')
        scheduled.append({'id':index+1,'year':t['year'],'name':t.get('name',f'Tournament {index+1}'),'entrant_ids':ids,'completed':False})
    story={'version':1,'config':deepcopy(scenario),'keys':keys,'main_ids':main_ids,
           'rivalries':rels,'tournaments':scheduled,'encounters':[],'main_characters':{},'last_tick':year,
           'practice_awards':0,'trace_actions':0,'skipped_events':[], 'goals':{}, 'mode':mode}
    for c in scenario['characters']:
        if c.get('goals'):
            story['goals'][str(keys[c['key']])]=resolve_goals(validate_goals(c['goals'],_catalog()),keys,agents)
    if scenario.get('world',{}).get('social_dynamics') is not None:
        from social_dynamics import init_social_dynamics
        init_social_dynamics(story,agents,scenario['world']['social_dynamics'],seed,year)
    track(story,agents,year)
    return story


def eligible(a,year):
    return a.get('alive',False) and a.get('age',0)>=16 and a.get('injury',0)<.65 and a.get('energy',100)>=30 and all(a.get(k,0)<year for k in ('imprisoned_until','hospitalized_until','quarantined_until','stasis_until'))


def track(story,agents,year,replace_current=False):
    if story is None:return
    for aid in story['main_ids']:
        a=agents[aid];key=str(aid)
        record=story['main_characters'].setdefault(key,{'id':aid,'name':a['name'],'character_key':a.get('character_key'),'timeline':[],'encounter_ids':[]})
        if record['timeline'] and record['timeline'][-1]['year']==year:
            if not replace_current:continue
            record['timeline'].pop()
        row={'year':year,'alive':a['alive'],'age':a['age'],'powers':powers_of(a),'role':a.get('role'),'injury':a.get('injury',0),'energy':a.get('energy',100),'mastery_level':a.get('mastery_level',0),'death_year':a.get('death_year'),'death_cause':a.get('death_cause'),'resurrections':a.get('resurrections',0),'spouse_id':a.get('spouse'),'children_ids':list(a.get('children',[])),'rival_ids':list(a.get('rival_ids',[]))}
        for field in ('job','income','wealth','reputation','app_rank','goal','imprisoned_until'):
            if field in a:row[field]=a[field]
        for stat in ('persuasiveness','susceptibility','morality'):
            if stat in a:row[stat]=a[stat]
        if 'social_dynamics' in story:row['ally_ids']=list(a.get('ally_ids',[]));row['enemy_ids']=list(a.get('enemy_ids',[]))
        row['power_mastery']=deepcopy(ensure_mastery(deepcopy(a),year))
        row['goal_directives']=deepcopy(a.get('goal_directives',{}))
        row['goal_progress']=[{'id':g['id'],'type':g['type'],'status':g['state']['status'],'progress':g['state']['progress'],'reason':g['state'].get('reason'),'target':g.get('target_id'),'threshold':g.get('value',g.get('count',g.get('year',g.get('rank',g.get('power',g.get('job'))))))} for g in story.get('goals',{}).get(str(aid),[])]
        record['timeline'].append(row)


def commit_bout(result,agents,year,story):
    """Commit declared bounded practice/fatigue only, never arena power transfers/death."""
    winner=result.get('winner_id'); changes=[]
    for state in result['final_state']:
        aid=int(state['id']);a=agents[aid]
        if not a['alive']:raise ValueError('Cannot commit arena results to a dead world agent')
        fields=('alive','energy','injury','power_xp','mastery_level','power_mastery','reputation','arena_practice')
        before={k:deepcopy(a.get(k)) for k in fields};before['powers']=powers_of(a)
        a['arena_practice']=a.get('arena_practice',0)+1
        a['energy']=max(0,a.get('energy',100)-min(35,5+result['rounds']))
        a['injury']=min(.75,a.get('injury',0)+(.08 if str(aid)==winner else .12))
        def paid_activation(event):
            if 'energy_spent' in event:return event['energy_spent']>0
            before_state=next((f for f in event.get('before',[]) if f['id']==str(aid)),{})
            after_state=next((f for f in event.get('after',[]) if f['id']==str(aid)),{})
            return after_state.get('energy',100)<before_state.get('energy',0)
        used={event.get('power') for event in result.get('trace',[]) if event.get('actor_id')==str(aid) and paid_activation(event)} & set(powers_of(a))
        for power in sorted(used):award_use(a,power,year)
        if 'reputation' in a:a['reputation']=max(0,min(100,a['reputation']+(1 if str(aid)==winner else 0)))
        story['practice_awards']+=1
        after={k:deepcopy(a.get(k)) for k in fields};after['powers']=powers_of(a)
        changes.append({'agent_id':aid,'before':before,'after':after})
    return changes


def tick_story(story,agents,rng,year,society=None,mode=None):
    if story is None:return []
    if story['last_tick']>=year:return []
    if year>MAX_YEARS:raise ValueError('Tracked stories support at most10000 years')
    opts=story['config']['encounters'];events=[];seen=set();budget=opts.get('max_per_year',2)
    if 'social_dynamics' in story:
        from social_dynamics import tick_social_dynamics
        events.extend(tick_social_dynamics(story,agents,year) or [])
    reserved={i for t in story['tournaments'] if not t['completed'] and t['year']==year for i in t['entrant_ids']}
    def log(text):events.append({'year':year,'category':'arena','true_event':text,'public_belief':text,'secret':False})
    def save(result,kind,ids,seed,label):
        index=len(story['encounters'])+1
        record={'id':index,'year':year,'kind':kind,'agent_ids':ids,'seed':seed,'label':label,'committed':opts.get('commit_consequences',False),'result':result,'consequences':[]}
        story['encounters'].append(record)
        story['trace_actions']=story.get('trace_actions',0)+(len(result['trace']) if kind=='rival_duel' else sum(len(m['result']['trace']) for m in result['matches']))
        if record['committed']:
            if kind=='rival_duel':record['consequences'].extend(commit_bout(result,agents,year,story))
            else:
                for match in result['matches']:record['consequences'].extend(commit_bout(match['result'],agents,year,story))
        for aid in ids:
            if str(aid) in story['main_characters']:story['main_characters'][str(aid)]['encounter_ids'].append(index)
        return record
    if opts.get('enabled',True):
        for rel in story['rivalries']:
            if budget<=0 or len(story['encounters'])>=MAX_ENCOUNTERS or story.get('trace_actions',0)+opts.get('max_rounds',20)*2>30000:break
            a,b=rel['a_id'],rel['b_id']
            if 'social_dynamics' in story and b in agents[a].get('ally_ids',[]):continue
            if a in seen or b in seen or a in reserved or b in reserved or year-rel['last_fight_year']<rel['interval']:continue
            if rel.get('goal_generated') and agents[a].get('goal_directives',{}).get('seek_rival_id')!=b:continue
            if agents[a].get('goal_directives',{}).get('avoid_fights') or agents[b].get('goal_directives',{}).get('avoid_fights'):continue
            if not eligible(agents[a],year) or not eligible(agents[b],year):continue
            if rng.random()>=rel['intensity']*(.35+(.25 if agents[a].get('goal_directives',{}).get('seek_rival_id')==b or agents[b].get('goal_directives',{}).get('seek_rival_id')==a else 0)):continue
            seed=rng.getrandbits(63)
            result=simulate_fight(agents[a],agents[b],seed=seed,max_rounds=opts.get('max_rounds',20))
            rel['last_fight_year']=year;seen.update((a,b));budget-=1
            record=save(result,'rival_duel',[a,b],seed,'Rival encounter')
            record['initiator_id']=a;record['mutual_rivalry']=rel['mutual']
            win=result['winner_id'];winner=agents[int(win)]['name'] if win else 'a draw'
            log(f"{agents[a]['name']} challenged {agents[b]['name']} because of their rivalry; the supervised nonlethal duel ended with {winner}.")
    goal_entrants=[int(aid) for aid,goals in story.get('goals',{}).items() if any(g['type']=='win_tournaments' and g['state']['status'] not in ('completed','failed') for g in goals) and eligible(agents[int(aid)],year)]
    if opts.get('enabled',True) and year%5==0 and goal_entrants and not any(t['year']==year for t in story['tournaments']) and len(story['tournaments'])<32:
        pool=[i for i in sorted(agents) if eligible(agents[i],year) and i not in goal_entrants]
        rng.shuffle(pool);roster=list(dict.fromkeys(goal_entrants+pool))[:8]
        if len(roster)>=2:story['tournaments'].append({'id':len(story['tournaments'])+1,'year':year,'name':f'Open Circuit {year}','entrant_ids':roster,'completed':False,'goal_generated':True})
    for t in story['tournaments']:
        if t['completed'] or t['year']!=year:continue
        t['completed']=True
        ids=[i for i in t['entrant_ids'] if eligible(agents[i],year)]
        if not opts.get('enabled',True) or len(ids)<2 or len(story['encounters'])>=MAX_ENCOUNTERS or story.get('trace_actions',0)+(len(ids)-1)*opts.get('max_rounds',20)*2>30000:
            reason='disabled, fewer than two eligible entrants, or encounter/trace safety cap'
            story['skipped_events'].append({'year':year,'tournament_id':t['id'],'reason':reason});log(t['name']+' was not held: '+reason);continue
        seed=rng.getrandbits(63);result=simulate_tournament([agents[i] for i in ids],seed=seed,max_rounds=opts.get('max_rounds',20))
        save(result,'tournament',ids,seed,t['name'])
        log(f"{t['name']} champion: {agents[int(result['champion_id'])]['name']}.")
    context={'agents':agents,'story':story,'society':society,'year':year,'mode':mode or story.get('mode')}
    for aid,goals in list(story.get('goals',{}).items()):story['goals'][aid]=evaluate_goals(goals,agents[int(aid)],context,year)
    track(story,agents,year);story['last_tick']=year
    return events


def prepare_story(story,agents,year,society=None,mode=None):
    if story is None:return
    context={'agents':agents,'story':story,'society':society,'year':year,'mode':mode or story.get('mode')}
    for aid,goals in list(story.get('goals',{}).items()):
        a=agents[int(aid)]
        story['goals'][aid]=evaluate_goals(goals,a,context,year)
        a['goal_directives']=plan_goals(story['goals'][aid],a,context,year)
        if society is not None and a['goal_directives'].get('civic_focus') in ('pluralist','security','populist'):
            a['party']=a['goal_directives']['civic_focus']
        job=a['goal_directives'].get('desired_job')
        if society is not None and job in ('engineer','medic','journalist','civil_servant','entrepreneur','teacher') and eligible(a,year) and a.get('wealth',0)>=1 and a.get('_goal_study_year')!=year:
            a['energy']=max(0,a.get('energy',100)-5);a['wealth']-=1
            a['knowledge_points']=min(100,a.get('knowledge_points',0)+1)
            a['education_sessions']=a.get('education_sessions',0)+1;a['_goal_study_year']=year
        target=a['goal_directives'].get('seek_rival_id')
        if target is not None and target!=a['id'] and not any({r['a_id'],r['b_id']}=={a['id'],target} for r in story['rivalries']):
            story['rivalries'].append({'a_id':a['id'],'b_id':target,'mutual':False,'intensity':1.0,'interval':2,'last_fight_year':year-2,'goal_generated':True})
            if target not in a.setdefault('rival_ids',[]):a['rival_ids'].append(target)


def export_story(story):
    return deepcopy(story) if story is not None else None
