from power_mastery import configure_mastery
"""CLI adapter for pure arena experiments and explicit saved-world consequences."""
from collections import Counter
from copy import deepcopy
import json
from combat_sim import simulate_fight,simulate_tournament
from scenario_customization import apply_character
from story_setup import validate_scenario,init_story,_ref,commit_bout,track,MAX_ENCOUNTERS,eligible


def load_scenario(value,catalog):
    if value is None:return None
    if isinstance(value,str):
        with open(value,encoding='utf-8') as f:value=json.load(f)
    return validate_scenario(value,catalog)


def roster_for(scenario,loaded):
    if loaded:
        state=loaded['state'];raw=state.get('agents') or state.get('variables',{}).get('agents')
        if raw is None:raise ValueError('This save has no individual agents; aggregate versus tribes cannot enter an arena')
        agents={int(k):deepcopy(a) for k,a in raw.items()}
        keys=state.get('story',{}).get('keys',{}) if state.get('story') else {}
        if scenario and scenario['characters']:raise ValueError('A saved-world arena uses existing people, not replacement character definitions')
        return agents,keys
    if not scenario or len(scenario['characters'])<2:raise ValueError('A fresh arena requires a scenario defining at least two characters')
    agents={};keys={};used=set();reserved={c['id'] for c in scenario['characters'] if 'id' in c}
    next_id=1
    for c in scenario['characters']:
        if 'id' in c:aid=c['id']
        else:
            while next_id in used or next_id in reserved:next_id+=1
            aid=next_id;next_id+=1
        used.add(aid);keys[c['key']]=aid
        agents[aid]={'id':aid,'name':c.get('name',c['key']),'powers':c['powers'],
                     'power':c['powers'][0] if c['powers'] else None,'alive':True,
                     'energy':100,'mastery_level':c.get('mastery_level',0),'age':c.get('age',25)}
        apply_character(agents[aid],c,0)
        levels={p:c.get('mastery_level',0) for p in c['powers']};levels.update(c.get('power_mastery',{}))
        configure_mastery(agents[aid],levels,0)
    return agents,keys


def format_report(payload):
    f=payload['featured_world'];lines=['# Arena experiment',f"- Mode: {payload['mode']}",f"- Runs: {payload['runs']}",
        '- Nonlethal, standalone unless explicitly committed to a saved world.',
        f"- World consequences committed: {payload['world_committed']}",'','## Aggregate statistics']
    lines += [f'- {k}: {v}' for k,v in payload['aggregate_stats'].items()]
    lines += ['',f"## Featured result, seed {f['seed']}"]
    fights=[f['result']] if payload['mode']=='duel' else [m['result'] for m in f['result']['matches']]
    if payload['mode']=='tournament':
        lines.append(f"Champion id: {f['result']['champion_id']}")
        lines.append('Byes: '+json.dumps(f['result']['byes']))
    for bout in fights:
        lines += [f"### Bout winner: {bout['winner_id'] or 'draw'}, {bout['rounds']} rounds ({bout['reason']})"]
        for action in bout['trace']:
            before={a['id']:a for a in action['before']};after={a['id']:a for a in action['after']}
            target=action['target_id'];actor=action['actor_id']
            lines.append(f"- Round {action['round']}: {actor} used {action['power'] or 'ordinary technique'} on {target}; target vigor {before[target]['vigor']:.2f}→{after[target]['vigor']:.2f}, resolve {before[target]['resolve']:.2f}→{after[target]['resolve']:.2f}. {'; '.join(action['notes'])}")
    return '\n'.join(lines)+'\n'


def run_cli(args,catalog):
    if args.runs<1:raise ValueError('runs must be positive')
    if not 1<=args.max_rounds<=200:raise ValueError('max-rounds must be1..200')
    if args.checkpoint_year is not None or args.policy_override or args.inject_event:raise ValueError('Arena experiments do not age a world or apply annual policies/events')
    loaded=None
    if args.load_state:
        with open(args.load_state,encoding='utf-8') as f:loaded=json.load(f)
        if loaded.get('schema_version') not in (1,2,3,4) or 'state' not in loaded or 'config' not in loaded:raise ValueError('Expected a full world save')
    if args.commit_results and (not loaded or not args.save_state or args.runs!=1):raise ValueError('Committed arena results require --load-state, --save-state and --runs 1')
    if args.save_state and not args.commit_results:raise ValueError('Standalone arenas write results, not a pretend resumable world; omit --save-state or explicitly --commit-results')
    scenario=load_scenario(args.scenario,catalog)
    agents,keys=roster_for(scenario,loaded)
    if args.mode=='duel':
        configured=(scenario or {}).get('fight',{})
        a=args.fighter_a if args.fighter_a is not None else configured.get('a')
        b=args.fighter_b if args.fighter_b is not None else configured.get('b')
        if a is None and b is None and len(agents)==2:a,b=list(agents)
        ids=[_ref(a,keys,agents),_ref(b,keys,agents)]
        if ids[0]==ids[1]:raise ValueError('Duel fighters must be distinct')
    else:
        refs=args.entrants
        if refs is None:
            configured=(scenario or {}).get('tournaments',[])
            refs=configured[0]['entrants'] if configured else list(keys) if keys else list(agents)
        ids=[_ref(r,keys,agents) for r in refs]
        if len(ids)!=len(set(ids)):raise ValueError('Duplicate entrant reference')
        if not 2<=len(ids)<=64:raise ValueError('Tournament needs2..64 entrants; select them explicitly for a large saved world')
    if args.commit_results and any(not eligible(agents[i],max(1,loaded['state'].get('year',0))) for i in ids):
        raise ValueError('Committed bouts require living age16+ entrants who are healthy, rested and not confined/quarantined/hospitalized')
    counts=Counter();draws=0;featured=None
    for i in range(args.runs):
        seed=args.seed+97*i
        result=simulate_fight(agents[ids[0]],agents[ids[1]],seed,args.max_rounds) if args.mode=='duel' else simulate_tournament([agents[x] for x in ids],seed,args.max_rounds)
        winner=result['winner_id'] if args.mode=='duel' else result['champion_id']
        if winner is None:draws+=1
        else:counts[winner]+=1
        score=result['rounds'] if args.mode=='duel' else sum(m['result']['rounds'] for m in result['matches'])
        if featured is None or score>featured['drama_score']:featured={'seed':seed,'world_index':i+1,'drama_score':score,'result':result}
    payload={'engine_version':4,'mode':args.mode,'runs':args.runs,'aggregate_stats':{'wins_or_championships':dict(counts),'draws':draws},
             'featured_world':featured,'world_committed':False,'nonlethal':True}
    if args.commit_results:
        saved=deepcopy(loaded);state=saved['state'];year=state.get('year',0)
        story=state.get('story')
        if story is None:story=init_story(agents,validate_scenario({},catalog),year)
        if len(story['encounters'])>=MAX_ENCOUNTERS:raise ValueError('Saved world encounter cap reached')
        result=featured['result'];bouts=[result] if args.mode=='duel' else [m['result'] for m in result['matches']]
        traces=sum(len(b['trace']) for b in bouts)
        if story.get('trace_actions',0)+traces>30000:raise ValueError('Saved world trace safety budget reached')
        changes=[]
        for bout in bouts:changes.extend(commit_bout(bout,agents,year,story))
        index=len(story['encounters'])+1
        story['encounters'].append({'id':index,'year':year,'kind':'manual_'+args.mode,'agent_ids':ids,'seed':args.seed,'committed':True,'result':result,'consequences':changes})
        story['trace_actions']=story.get('trace_actions',0)+traces
        for aid in ids:
            if str(aid) in story['main_characters']:story['main_characters'][str(aid)]['encounter_ids'].append(index)
        track(story,agents,year,replace_current=True);state['story']=story
        if 'agents' in state:state['agents']=agents
        else:state['variables']['agents']=agents
        chronicle=state.get('chronicle') if 'chronicle' in state else state['variables']['chronicle']
        text=f"A supervised nonlethal {args.mode} was explicitly committed without advancing the calendar."
        chronicle.append({'year':year,'category':'arena','true_event':text,'public_belief':text,'secret':False})
        saved['schema_version']=4;saved['config']['scenario']=story['config']
        with open(args.save_state,'w',encoding='utf-8') as f:json.dump(saved,f,indent=2,allow_nan=False)
        payload['world_committed']=True
        payload['world_changes']=changes
    with open(args.output_json,'w',encoding='utf-8') as f:json.dump(payload,f,indent=2,allow_nan=False)
    with open(args.output_report,'w',encoding='utf-8') as f:f.write(format_report(payload))
    print(f"Arena experiment complete: {args.runs} {args.mode} runs; world committed={payload['world_committed']}.")
    return payload
