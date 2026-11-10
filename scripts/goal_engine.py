from power_mastery import level_for
"""Measurable character goals. Planning advises; evaluation never grants outcomes.

Persist the list returned by evaluate_goals. All functions are pure with respect
to inputs. Bounded 64-entry history retains latest yearly changes. Completed
achievements stay complete; survival/protection failure is permanent. Social
metrics require a modern society. Exposure requires named investigator evidence,
never the global number of corrections. A tournament draw advancement is not a
won duel. Counts include recorded encounters in this simulation, not invented lore.
"""
from copy import deepcopy
import math
from expanded_powers import canonical_power, powers_of

MAX_GOALS=8
HISTORY_LIMIT=64
RANKS=('Unranked','F','E','D','C','B','A','S')
JOBS=('unemployed','farmer','teacher','journalist','medic','engineer','civil_servant','security','entrepreneur','hero_contractor')
SPECS={
 'win_elections':('count',1,1000), 'improve_society':('value',0,100),
 'treat_injuries':('count',1,100000),
 'survive_until':('year',1,10000), 'reach_age':('value',1,10000),
 'reach_mastery':('value',0,5), 'win_duels':('count',1,1000),
 'defeat_character':('count',1,1000), 'win_tournaments':('count',1,1000),
 'reach_rank':('rank',None,None), 'earn_wealth':('value',0,1000000000),
 'get_job':('job',None,None), 'become_leader':(None,None,None),
 'gain_followers':('value',1,100000), 'protect_character':('year',1,10000),
 'have_descendants':('count',1,10000), 'expose_fakes':('count',1,100000),
 'obtain_power':('power',None,None), 'recover_health':('value',0,1),
}
SOCIAL={'win_elections','improve_society','reach_rank','earn_wealth','get_job','become_leader','gain_followers','expose_fakes'}


def validate_goals(goals,catalog):
    if not isinstance(goals,list) or len(goals)>MAX_GOALS:
        raise ValueError('Use a list of at most eight goals per character')
    result=[];seen=set()
    for index,raw in enumerate(goals):
        if not isinstance(raw,dict) or not isinstance(raw.get('type'),str) or raw.get('type') not in SPECS:
            raise ValueError('Unknown goal type')
        kind=raw['type']; field,lo,hi=SPECS[kind]
        allowed={'id','type'} | ({field} if field else set())
        if kind in ('defeat_character','protect_character'):allowed.add('target')
        if kind=='improve_society':allowed.add('metric')
        if kind=='reach_mastery':allowed.add('power')
        if set(raw)-allowed:raise ValueError('Unsupported fields for '+kind)
        goal=deepcopy(raw);goal.setdefault('id',f'goal_{index+1}')
        if not isinstance(goal['id'],str) or not goal['id'].strip() or len(goal['id'])>80 or goal['id'] in seen:
            raise ValueError('Goal ids must be unique nonempty strings up to80 characters')
        seen.add(goal['id'])
        if kind=='improve_society' and goal.get('metric') not in ('freedom','election_integrity','press_freedom'):raise ValueError('Unknown society metric')
        if field=='count':goal.setdefault(field,1)
        if field=='value' and kind=='recover_health':goal.setdefault(field,0)
        if field and field not in goal:raise ValueError('Missing '+field+' for '+kind)
        if lo is not None:
            value=goal[field]
            if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or not lo<=value<=hi:
                raise ValueError('Invalid '+field+' for '+kind)
            if field in ('year','count') or kind in ('reach_age','reach_mastery','gain_followers'):
                if type(value) is not int:raise ValueError('Goal '+field+' must be an integer')
        if field=='rank' and goal[field] not in RANKS[1:]:raise ValueError('Rank must be F..S')
        if field=='job' and goal[field] not in JOBS:raise ValueError('Unknown job')
        if field=='power' or kind=='reach_mastery' and 'power' in goal:
            power_field='power' if kind=='reach_mastery' else field
            if not isinstance(goal[power_field],str):raise ValueError('Power must be a catalog name')
            goal[power_field]=canonical_power(goal[power_field])
            if goal[power_field] not in catalog:raise ValueError('Unknown goal power')
        if 'target' in allowed:
            target=goal.get('target')
            if isinstance(target,bool) or not isinstance(target,(str,int)) or (isinstance(target,str) and not target.strip()):
                raise ValueError('Target must reference a character key or id')
        goal['state']={'status':'pending','progress':0,'history':[]}
        result.append(goal)
    return result


def resolve_goals(goals,keys,agents):
    result=deepcopy(goals)
    for goal in result:
        if 'target' not in goal:continue
        ref=goal['target'];ref=keys.get(ref,ref)
        if isinstance(ref,str) and ref.isdigit():ref=int(ref)
        if ref not in agents:raise ValueError('Unresolved goal target: '+str(goal['target']))
        goal['target_id']=ref
    return result


def _agent(context,id):
    agents=context.get('agents',{})
    return agents.get(id,agents.get(str(id)))


def _bouts(context):
    for event in (context.get('story') or {}).get('encounters',[]):
        result=event.get('result',{})
        if 'matches' in result:
            for match in result['matches']:yield match['result']
        elif 'winner_id' in result:yield result


def _measure(goal,agent,context,year):
    kind=goal['type'];aid=str(agent['id']);society=context.get('society')
    if not agent.get('alive',False) and kind not in ('survive_until','protect_character','have_descendants'):
        return 0,False,'blocked','Character is dead; progress requires resurrection'
    if kind in SOCIAL and society is None:
        return 0,False,'blocked','Requires modern society metrics'
    if kind=='survive_until':
        return year,agent.get('alive',False) and year>=goal['year'],('active' if agent.get('alive') else 'failed'),'Character died before the survival goal' if not agent.get('alive') else None
    if kind=='protect_character':
        target=_agent(context,goal.get('target_id'))
        if target is None:return 0,False,'blocked','Target is not resolved'
        if not target.get('alive'):return year,False,'failed','Protected character died'
        return year,year>=goal['year'],'active',None
    if kind=='win_elections':
        if society.get('leadership_system','elections')!='elections':return 0,False,'blocked','Leadership is not determined by elections'
        value=sum(1 for election in society.get('elections',[]) if str(election.get('winner_id'))==aid);done=value>=goal['count']
    elif kind=='improve_society':
        metric='integrity' if goal['metric']=='election_integrity' else goal['metric']
        if metric not in society:return 0,False,'blocked','Society metric not available'
        value=society[metric];done=value>=goal['value']
    elif kind=='treat_injuries':value=agent.get('patients_treated',0);done=value>=goal['count']
    elif kind=='reach_age':value=agent.get('age',0);done=value>=goal['value']
    elif kind=='reach_mastery':
        if goal.get('power') and goal['power'] not in powers_of(agent):return 0,False,'blocked','Requested mastery power is not held'
        value=level_for(agent,goal['power']) if goal.get('power') else agent.get('mastery_level',0);done=value>=goal['value']
    elif kind in ('win_duels','defeat_character'):
        if kind=='defeat_character' and 'target_id' not in goal:return 0,False,'blocked','Target is not resolved'
        if kind=='defeat_character' and str(goal['target_id'])==aid:return 0,False,'blocked','A character cannot defeat itself'
        value=sum(1 for bout in _bouts(context) if bout.get('winner_id')==aid and
                  (kind=='win_duels' or str(goal['target_id']) in {str(f['id']) for f in bout.get('starting_state',[])}))
        done=value>=goal['count']
    elif kind=='win_tournaments':
        value=agent.get('government_tournament_wins',0)+sum(1 for event in (context.get('story') or {}).get('encounters',[]) if event.get('result',{}).get('champion_id')==aid)
        done=value>=goal['count']
    elif kind=='reach_rank':
        value=agent.get('app_rank','Unranked');done=value in RANKS and RANKS.index(value)>=RANKS.index(goal['rank'])
        if not society.get('laws',{}).get('ranking_app',True) or not agent.get('has_phone',True):return value,False,'blocked','Ranking app disabled or character has no phone'
    elif kind=='earn_wealth':value=agent.get('wealth',0);done=value>=goal['value']
    elif kind=='get_job':value=agent.get('job','unemployed');done=value==goal['job']
    elif kind=='become_leader':value=society.get('leader_id');done=value is not None and str(value)==aid
    elif kind=='gain_followers':value=agent.get('followers',0);done=value>=goal['value']
    elif kind=='have_descendants':
        # Traverse actual stored child links, including deceased descendants.
        visited={aid};pending=list(agent.get('children',[]));value=0
        while pending:
            child=pending.pop();key=str(child)
            if key in visited:continue
            visited.add(key);record=_agent(context,child)
            if record is None:continue
            value+=1;pending.extend(record.get('children',[]))
        done=value>=goal['count']
    elif kind=='expose_fakes':
        posts=society.get('internet',{}).get('posts',[])
        if isinstance(posts,dict):posts=posts.values()
        value=sum(1 for post in posts if post.get('fake') and post.get('corrected') and
                  str(post.get('corrected_by',post.get('investigator_id')))==aid)
        # An explicitly per-agent monotonic counter may survive post pruning.
        value=max(value,agent.get('fraud_exposures',0));done=value>=goal['count']
        if not value:return value,False,'blocked','No investigator-attributed corrections recorded yet'
    elif kind=='obtain_power':value=goal['power'] in powers_of(agent);done=value
    elif kind=='recover_health':
        if not agent.get('alive',False):return agent.get('injury',0),False,'blocked','Health recovery requires a living character'
        value=agent.get('injury',0);done=value<=goal['value']
    else:raise ValueError('Unknown goal type: '+kind)
    return value,done,'active',None


def evaluate_goals(goals,agent,context,year):
    result=deepcopy(goals)
    for goal in result:
        state=goal.setdefault('state',{'status':'pending','progress':0,'history':[]})
        if state.get('status') in ('completed','failed'):continue
        value,done,status,reason=_measure(goal,agent,context,year)
        state.update(status='completed' if done else status,progress=value,last_evaluated_year=year)
        state['reason']=reason
        if done:state['completed_year']=year
        if status=='failed':state['failed_year']=year
        row={'year':year,'status':state['status'],'progress':value,'reason':reason}
        history=state.setdefault('history',[])
        if history and history[-1]['year']==year:history[-1]=row
        else:history.append(row)
        state['history']=history[-HISTORY_LIMIT:]
    return result


def plan_goals(goals,agent,context,year):
    """Advisory bounded biases; caller must implement real eligible, costed actions.

    First requested job/power wins; named rivals override untargeted peers. Safety/health goals
    suppress the rival directive, not simulator danger or world consequences.
    """
    if not agent.get('alive',False):return {}
    directives={}
    evaluated=evaluate_goals(goals,agent,context,year)
    for goal in evaluated:
        if goal['state']['status'] in ('completed','failed'):continue
        kind=goal['type']
        if kind=='reach_mastery' and goal.get('power') and goal['power'] not in powers_of(agent):continue
        if kind in SOCIAL and context.get('society') is None:continue
        if kind in ('reach_mastery','win_duels','win_tournaments','defeat_character'):
            directives['training_bias']=.25
        if kind=='reach_mastery' and goal.get('power') in powers_of(agent):directives.setdefault('prefer_power',goal['power'])
        if kind=='defeat_character' and 'target_id' in goal:directives['seek_rival_id']=goal['target_id']
        if kind=='obtain_power':directives.setdefault('prefer_power',goal['power'])
        if kind=='get_job':directives.setdefault('desired_job',goal['job'])
        if kind=='earn_wealth':directives.setdefault('desired_job','entrepreneur')
        system=(context.get('society') or {}).get('leadership_system','elections')
        if kind in ('become_leader','win_elections','improve_society') and system=='elections':directives['campaign_bias']=.25
        if kind=='become_leader' and system in ('rank','tournament'):
            directives['training_bias']=.25
            if system=='rank':directives['media_bias']=.25
        if kind=='improve_society':
            directives['media_bias']=.25;directives['civic_focus']='pluralist'
        if kind=='treat_injuries':
            directives.setdefault('prefer_power','Healing');directives.setdefault('desired_job','medic')
        if kind=='win_duels' and 'seek_rival_id' not in directives:
            peers=[p for p in context.get('agents',{}).values() if str(p.get('id'))!=str(agent['id']) and p.get('alive',False) and p.get('age',0)>=16 and p.get('injury',0)<.65 and p.get('energy',100)>=30 and all(p.get(k,0)<year for k in ('imprisoned_until','hospitalized_until','quarantined_until','stasis_until'))]
            if peers:directives['seek_rival_id']=min(peers,key=lambda p:(abs(p.get('mastery_level',0)-agent.get('mastery_level',0)),str(p['id'])))['id']
        if kind in ('gain_followers','reach_rank','expose_fakes'):
            directives['media_bias']=.25
            if kind=='expose_fakes':directives.setdefault('desired_job','journalist')
        if kind in ('survive_until','reach_age','recover_health','protect_character'):
            directives['avoid_fights']=True
        if kind=='recover_health':directives.setdefault('prefer_power','Healing')
        if kind=='protect_character' and 'target_id' in goal:directives.setdefault('protect_id',goal['target_id'])
    if directives.get('avoid_fights'):directives.pop('seek_rival_id',None)
    return directives
