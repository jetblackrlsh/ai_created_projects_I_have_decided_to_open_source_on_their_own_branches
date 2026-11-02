"""Explicit agent-authored crossover plans; no generative model or automatic fusion."""
import copy


def build(request):
    import worldsim as w
    packages=request.get('packages')
    w.require(isinstance(packages,list) and 2<=len(packages)<=8,'crossover needs 2..8 full exports')
    for p in packages:w.import_world(p)
    exports=[p['lineage']['export_id'] for p in packages]
    w.require(len(set(exports))==len(exports),'duplicate source export')
    state=w.validate(request.get('state'))
    w.require(state['turn']==0,'new crossover starts at turn zero; map source time explicitly')
    plan=request.get('plan')
    w.require(isinstance(plan,dict) and set(plan)=={'entity_map','laws_decision','time_decision','history_decision','conflicts'},'crossover needs explicit mapping and decisions')
    for k in ('laws_decision','time_decision','history_decision'):
        w.require(isinstance(plan[k],str) and 0<len(plan[k])<=10000,'missing '+k)
    w.require(isinstance(plan['conflicts'],list),'conflicts must be a reviewed list (empty if none)')
    for c in plan['conflicts']:
        w.require(isinstance(c,dict) and set(c)=={'topic','resolution'} and all(isinstance(c[k],str) and c[k] for k in c),'each conflict needs topic/resolution')
    mapping=plan['entity_map']
    w.require(isinstance(mapping,list),'entity_map must be list')
    sources={}
    for p in packages:
        s=p['state']; ex=p['lineage']['export_id']
        for kind,entities in [('character',[s['player']]+s['npcs']),('place',s['places']),('item',s['items']),('clock',s['clocks'])]:
            for e in entities:sources[(ex,e['id'])]=kind
    targets={}
    for kind,entities in [('character',[state['player']]+state['npcs']),('place',state['places']),('item',state['items']),('clock',state['clocks'])]:
        for e in entities:targets[e['id']]=kind
    seen=set()
    for entry in mapping:
        w.require(isinstance(entry,dict) and set(entry)=={'export_id','source_id','target_id','decision'},'invalid mapping entry')
        key=(entry['export_id'],entry['source_id'])
        w.require(key in sources and key not in seen,'unknown/duplicate source entity')
        seen.add(key)
        target=entry['target_id']
        w.require(target is None or (isinstance(target,str) and targets.get(target)==sources[key]),'target missing or entity kind mismatch')
        w.require(isinstance(entry['decision'],str) and entry['decision'],'each mapping requires explanation, including omissions/fusions')
    w.require(seen==set(sources),'every source entity must be mapped or explicitly omitted')
    # Multiple character sources may map to one character: an explicit amalgam.
    # Result ownership, IDs and references are validated by core, never guessed.
    d=w.fresh(state,request.get('turn_budget'))
    d['lineage']['origins']=copy.deepcopy(packages)
    d['crossover_plan']=copy.deepcopy(plan)
    d['state']['extensions']['crossover_plan']=copy.deepcopy(plan)
    d['initial']=copy.deepcopy(d['state'])
    d['prior_chronicles']=[copy.deepcopy(p['chronicle']) for p in packages if 'chronicle' in p]
    return d
