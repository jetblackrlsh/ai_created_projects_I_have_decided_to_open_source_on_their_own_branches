"""Original annual society model, not a reconstruction of a creator's hidden code.

Phones, rankings, elections and media are simulated state, never real accounts,
network calls, communications or predictions about actual people/governments.
"""
import math
import random
from government_systems import select_leadership
from power_mastery import ensure_mastery,sync_mastery,mastery_distribution
from power_effects import WorldPowers, POWER_EFFECTS
from story_setup import init_story, tick_story, export_story, prepare_story, MAX_YEARS
from scenario_customization import apply_world
from expanded_powers import powers_of, set_powers, has_power, inherit_powers
from modern_media import tick as internet_tick
from modern_institutions import tick as institutions_tick

JOBS = {'unemployed': 0, 'farmer': 12, 'teacher': 16, 'journalist': 17,
        'medic': 22, 'engineer': 24, 'civil_servant': 20, 'security': 19,
        'entrepreneur': 26, 'hero_contractor': 30}
SOCIAL_POLICIES = ['civil_rights_act', 'free_press', 'emergency_powers',
                   'election_protection', 'ban_ranking_app', 'restore_ranking_app']
SUPPORT_POWERS = {'Water', 'Weather', 'Earth', 'Wind', 'Plant Control', 'Flight',
                 'Strength', 'Giant Size', 'Speed', 'Healing', 'Regeneration',
                 'Immortal', 'Magic', 'Necromancy', 'Portals'}


def clamp(value, lo=0.0, hi=100.0):
    return min(hi, max(lo, value))


def as_tuple(value):
    return tuple(as_tuple(x) for x in value) if isinstance(value, list) else value


def society_state():
    return {'freedom': 80.0, 'integrity': 80.0, 'press_freedom': 80.0,
            'regime': 'democracy', 'leadership_system': 'elections', 'leader_id': None, 'year': 0,
            'laws': {'free_press': True, 'ranking_app': True},
            'terms': {}, 'elections': [], 'democratic_years': 0,
            'democratic_breakdowns': 0, 'democratic_recoveries': 0,
            'peaceful_transfers': 0, 'min_freedom': 80.0,
            'job_promotions': 0, 'media_reports': 0, 'app_opportunities': 0,
            'suppressed_elections': 0, 'counter_tech': [], 'networking_invitations': 0}


def setup_citizen(a, rng):
    if a.get('modern_initialized'):
        return
    a.update({'modern_initialized': True, 'job': 'unemployed', 'income': 0.0,
              'wealth': round(rng.uniform(10, 50), 2), 'has_phone': rng.random() < .8,
              'reputation': 50.0, 'followers': 0.0, 'app_score': 0.0, 'app_rank': 'Unranked', 'networking_invites': 0,
              'party': 'pluralist' if a['compassion'] >= .55 else
                       ('security' if a['ambition'] >= .6 else 'populist')})


def rank_for_score(score):
    return next((label for threshold,label in [(85,'S'),(70,'A'),(55,'B'),(40,'C'),(25,'D'),(10,'E')] if score>=threshold),'F')


def update_rankings(state, agents):
    """Public reputation and demonstrated mastery affect visibility and opportunity."""
    for a in agents.values():
        if not a['alive']:
            continue
        ensure_mastery(a,state.get('year',0))
        if state['laws'].get('ranking_app') and a.get('has_phone'):
            a['app_score'] = clamp(a.get('mastery_level', 0) * 10 +
                                   a.get('reputation', 50) * .45 +
                                   min(20, math.log1p(a.get('followers', 0)) * 3))
        else:
            a['app_score'] = 0.0
        a['app_rank'] = rank_for_score(a['app_score']) if state['laws'].get('ranking_app') and a.get('has_phone') else 'Unranked'


def job_score(a):
    return a['curiosity'] * 30 + a['compassion'] * 10 + a.get('reputation', 50) * .25 + a.get('app_score', 0) * .35 + min(10, a.get('knowledge_points',0)*.2) + (5 if a.get('goal_directives',{}).get('desired_job') else 0)


def employment(state, agents, rng):
    for a in agents.values():
        if a['alive'] and (a['age'] < 18 or a['imprisoned_until'] > state.get('year', 0) or a.get('quarantined_until',0)>=max(1,state.get('year',0)) or a.get('hospitalized_until',0)>=max(1,state.get('year',0))):
            a['job'], a['income'] = 'unemployed', 0.0
    adults = [a for a in agents.values() if a['alive'] and a['age'] >= 18 and a['imprisoned_until'] == 0 and a.get('quarantined_until',0)<max(1,state.get('year',0)) and a.get('hospitalized_until',0)<max(1,state.get('year',0))]
    # Scarce paid positions: app visibility influences the real selection order.
    candidates = sorted(adults, key=lambda a: (-(job_score(a) + rng.uniform(-4, 4)), a['id']))
    professional_slots = max(1, len(adults) // 3)
    for index, a in enumerate(candidates):
        previous = a.get('job', 'unemployed')
        if index < professional_slots:
            if a.get('power') and a.get('power_license', False) and a.get('reputation', 50) >= 65 and a.get('mastery_level', 0) >= 1:
                a['job'] = 'hero_contractor'
            elif a['curiosity'] > .7: a['job'] = 'engineer'
            elif a['compassion'] > .7: a['job'] = 'medic'
            elif a['dream'] == 'knowledge': a['job'] = 'journalist'
            else: a['job'] = 'civil_servant'
            if previous not in ('engineer', 'medic', 'journalist', 'civil_servant', 'hero_contractor'):
                state['job_promotions'] += 1
                if a.get('app_score', 0) >= 40:
                    state['app_opportunities'] += 1
        else:
            a['job'] = 'unemployed' if rng.random() < .12 else ('teacher' if a['dream'] == 'knowledge' else 'farmer')
        wanted=a.get('goal_directives',{}).get('desired_job')
        qualified={'medic':a['compassion']>=.55 or a.get('knowledge_points',0)>=25,'engineer':a['curiosity']>=.55 or a.get('knowledge_points',0)>=20,
                   'journalist':a['curiosity']>=.55 or a['dream']=='knowledge' or a.get('knowledge_points',0)>=20,
                   'civil_servant':a['compassion']>=.3,'entrepreneur':a['ambition']+a['greed']>=.8 or a.get('knowledge_points',0)>=15,
                   'hero_contractor':a.get('power_license',False) and a.get('mastery_level',0)>=1 and a['reputation']>=65,
                   'security':True,'teacher':a['curiosity']>=.3,'farmer':True,'unemployed':True}
        if wanted in JOBS and qualified.get(wanted,False) and (index<professional_slots or wanted in ('farmer','teacher','unemployed')):
            a['job']=wanted
        a['income'] = float(JOBS[a['job']])
        a['wealth'] = clamp(a.get('wealth', 0) + a['income'] - 12, 0, 10000)
        if not a.get('has_phone') and a['wealth'] >= 15:
            a['wealth'] -= 5
            a['has_phone'] = True
    return adults


def media_effects(state, agents, events, rng):
    """Only public effects affect reputation; hidden acts are not magically broadcast."""
    for event in events:
        actor = agents.get(event.get('actor_id'))
        if actor is None or event.get('secret'):
            continue
        power = event.get('power')
        if not power:
            continue
        benevolent = power in SUPPORT_POWERS and actor['role'] != 'villain'
        delta = 3 if benevolent else (-4 if actor['role'] == 'villain' else 1)
        if 'died from' in event['true_event']:
            continue
        actor['reputation'] = clamp(actor['reputation'] + delta)
        reach = 1.0 if actor.get('has_phone') else .25
        actor['followers'] = min(100000, actor['followers'] + abs(delta) * reach * (1 + actor.get('mastery_level', 0)))
        state['media_reports'] += 1
    # Journalism exposes corruption only when a press exists and journalists are active.
    leader = agents.get(state.get('leader_id'))
    reporters = [a for a in agents.values() if a['alive'] and a.get('job') == 'journalist']
    if leader and leader['alive'] and reporters and state['laws'].get('free_press') and rng.random() < state['press_freedom'] / 250:
        if leader['greed'] > .55:
            leader['reputation'] = clamp(leader['reputation'] - 8)
            leader['corruption_evidence'] = min(1.0, leader.get('corruption_evidence',0)+.4)
            state['integrity'] = clamp(state['integrity'] + 1)
            state['media_reports'] += 1
            return f"Independent journalists exposed corruption by {leader['name']}; their reputation fell."
    return None


def run_election(state, agents, rng, year):
    electorate = [a for a in agents.values() if a['alive'] and a['age'] >= 18 and a['imprisoned_until'] == 0 and a.get('quarantined_until',0)<max(1,state.get('year',0)) and a.get('hospitalized_until',0)<max(1,state.get('year',0))]
    candidates = [a for a in electorate if a['age'] >= 25 and
                  (state['terms'].get(str(a['id']), 0) < 2 or state['regime'] != 'democracy')]
    if not candidates: candidates = electorate[:]
    if not candidates:
        state['leader_id'] = None
        return None
    candidates.sort(key=lambda a: (-(a['charisma'] * 30 + a['reputation'] * .5 + a['app_score'] * .15 + 25*a.get('goal_directives',{}).get('campaign_bias',0)), a['id']))
    nominees = candidates[:min(3, len(candidates))]
    old = state['leader_id']
    if state['regime'] == 'authoritarian' and old in agents and agents[old]['alive'] and all(a['id'] != old for a in nominees):
        nominees[-1] = agents[old]
    votes = {a['id']: 0 for a in nominees}
    free = state['regime'] == 'democracy' and state['integrity'] >= 40
    for voter in electorate:
        def preference(c):
            alignment = 1 - abs(voter['compassion'] - c['compassion'])
            campaign = c['reputation'] / 100 + (c['app_score'] / 350 if voter.get('has_phone') else 0)
            platform = .2 if voter['dream'] == 'freedom' and c['party'] == 'pluralist' else 0
            rigging = 2 if not free and c['id'] == old else 0
            return alignment + c['charisma'] * .4 + campaign + platform + rigging + rng.uniform(-.4, .4)
        choice = max(nominees, key=preference)
        votes[choice['id']] += 1
    winner = max(nominees, key=lambda a: (votes[a['id']], -a['id']))
    state['leader_id'] = winner['id']
    state['terms'][str(winner['id'])] = state['terms'].get(str(winner['id']), 0) + 1
    if free and old is not None and old != winner['id']:
        state['peaceful_transfers'] += 1
    if not free: state['suppressed_elections'] += 1
    result = {'year': year, 'winner_id': winner['id'], 'winner': winner['name'],
              'party': winner['party'], 'votes': {str(k):v for k,v in votes.items()}, 'eligible_voters': len(electorate),
              'contested': len(nominees) > 1, 'free': free, 'incumbent_id': old}
    state['elections'].append(result)
    return result


def govern(state, leader):
    before = state['regime']
    if leader:
        if leader['party'] == 'pluralist':
            state['freedom'] += 1.5
            state['integrity'] += 1
            state['press_freedom'] += 1
        elif leader['party'] == 'security':
            state['freedom'] -= 2.5
            state['integrity'] -= 1.5
            state['press_freedom'] -= 1
        else:
            state['freedom'] += .3 - leader['greed']
            state['integrity'] -= leader['greed'] * .5
        if state['laws'].get('power_ban'): state['freedom'] -= 1.5
        if state['laws'].get('registration_act'): state['freedom'] -= .4
        if state['laws'].get('emergency_powers'):
            state['freedom'] -= 3
            state['integrity'] -= 2
        if state['laws'].get('civil_rights_act'): state['freedom'] += 1.2
        if state['laws'].get('election_protection'): state['integrity'] += 1.5
        if state['laws'].get('free_press'): state['press_freedom'] += .5
        else: state['press_freedom'] -= 2
    for k in ('freedom', 'integrity', 'press_freedom'): state[k] = clamp(state[k])
    if state.get('leadership_system','elections') != 'elections':
        state['regime'] = state['leadership_system']+'_rule'
        state['min_freedom'] = min(state['min_freedom'], state['freedom'])
        return False
    if state['freedom'] < 35 or state['integrity'] < 30:
        state['regime'] = 'authoritarian'
    elif state['freedom'] >= 55 and state['integrity'] >= 50:
        state['regime'] = 'democracy'
    if state['regime'] != before:
        key = 'democratic_breakdowns' if state['regime'] == 'authoritarian' else 'democratic_recoveries'
        state[key] += 1
    if state['regime'] == 'democracy': state['democratic_years'] += 1
    state['min_freedom'] = min(state['min_freedom'], state['freedom'])
    return before != state['regime']


def run_modern(seed, years, starting_pop, power_rate, mutation_rate, power_tree,
               mutator, policy_override=None, inject_event=None, resume_state=None, scenario=None):
    rng = random.Random(seed)
    agents, next_id, chronicle = {}, 1, []
    state = society_state()
    current_year = 0
    def create_agent(birth_year, age=0, power=None, parent_a=None, parent_b=None,
                     last_name=None, force_royal=False):
        nonlocal next_id
        aid = next_id; next_id += 1
        a = {'id': aid, 'name': f"{rng.choice(['Alex','River','Ash','Sam','Morgan','Kai','Robin','Jules'])} {last_name or rng.choice(['Vale','Stone','Reed','Park','Lane','Harbor'])} {aid}",
             'last_name': last_name or 'Citizen', 'birth_year': birth_year, 'age': age,
             'power': power, 'parent_a': parent_a, 'parent_b': parent_b, 'children': [],
             'spouse': None, 'alive': True, 'death_year': None, 'death_cause': None,
             'role': 'citizen', 'royal_blood': False, 'imprisoned_until': 0,
             'ambition': rng.uniform(.1,.95), 'compassion': rng.uniform(.1,.95),
             'greed': rng.uniform(.05,.7), 'curiosity': rng.uniform(.1,.95),
             'charisma': rng.uniform(.1,.95), 'dream': rng.choice(['family','freedom','knowledge','order','fame'])}
        setup_citizen(a, rng)
        ensure_mastery(a,max(0,birth_year))
        agents[aid] = a
        return a
    def event(category, text):
        chronicle.append({'year': current_year, 'category': category, 'true_event': text,
                          'public_belief': text, 'secret': False})
    if resume_state:
        agents = {int(k): v for k, v in resume_state['agents'].items()}
        next_id = resume_state['next_id']
        chronicle, state = resume_state['chronicle'], resume_state['society']
        current_year = resume_state['year']
        rng.setstate(as_tuple(resume_state['rng_state']))
    else:
        for _ in range(starting_pop):
            power = rng.choice(list(power_tree)) if rng.random() < power_rate else None
            create_agent(-25, age=rng.randint(18,55), power=power)
    story = resume_state.get('story') if resume_state else init_story(agents,scenario,current_year,mode='modern')
    if scenario is not None and years>MAX_YEARS:raise ValueError('Tracked stories support at most10000 years')
    powers = WorldPowers(agents, rng, resume_state.get('powers') if resume_state else None)
    if not resume_state:apply_world(scenario,powers,society=state,counter_tech=state['counter_tech'])
    if state.get('leadership_system','elections') != 'elections':state['regime']=state['leadership_system']+'_rule'
    terminal = resume_state.get('terminal', False) if resume_state else False
    intervention_year = current_year + 1
    if policy_override:
        if policy_override == 'ban_ranking_app': state['laws']['ranking_app'] = False
        elif policy_override == 'restore_ranking_app': state['laws']['ranking_app'] = True
        elif policy_override == 'royal_amnesty':
            for a in agents.values(): a['imprisoned_until'] = 0
        elif policy_override.startswith('build_'):
            state['counter_tech'].append({'build_collars':'Power-Dampening Collars','build_mechs':'Anti-Power Mechs','build_cannons':'Siege Cannons'}[policy_override])
        else: state['laws'][policy_override] = True
        chronicle.append({'year':intervention_year,'category':'policy','true_event':f"The elected administration enacted {policy_override}.",'public_belief':f"The administration enacted {policy_override}.",'secret':False})
    for year in range(current_year + 1, years + 1) if not terminal else []:
        current_year = year
        state['year'] = year
        living = [a for a in agents.values() if a['alive']]
        if not living: break
        for a in living:
            setup_citizen(a, rng)
        if inject_event and year == intervention_year:
            if inject_event in ('meteor','gifted_generation','villain_awakens','immortal_tyrant','vampires'):
                for a in rng.sample(living, min(5,len(living))):
                    a['power'] = 'Immortal' if inject_event=='immortal_tyrant' else ('Necromancy' if inject_event=='vampires' else rng.choice(list(power_tree)))
                    if inject_event in ('villain_awakens','immortal_tyrant','vampires'): a['role']='villain'
            elif inject_event in ('famine','visitors'):
                for a in rng.sample(living,max(1,len(living)//8)):
                    a['alive'],a['death_year'],a['death_cause']=False,year,inject_event
            elif inject_event == 'demon_rift': state['laws']['emergency_powers']=True
            elif inject_event == 'golden_age': powers.r['food'] += len(living)
            elif inject_event == 'prophet': rng.choice(living)['charisma']=.99
            event('intervention',f"Modern society experienced {inject_event}.")
        prepare_story(story,agents,year,society=state,mode='modern')
        powers.begin_year(year, create_agent, ['Central City','Harbor City','North City'], chronicle, state['counter_tech'])
        chronicle.extend(powers.events)
        power_event_cursor=len(powers.events)
        for a in agents.values():
            if a['alive']:
                setup_citizen(a,rng)
                if a.get('stasis_until',0)<year: a['age'] += 1
                if not has_power(a,'Immortal') and a['age'] >= int(80 * power_tree.get(a['power'],{}).get('longevity',1)):
                    a['alive'],a['death_year'],a['death_cause']=False,year,'old age'
                if a['imprisoned_until'] and a['imprisoned_until']<=year:a['imprisoned_until']=0
        living=[a for a in agents.values() if a['alive']]
        if not living:break
        for a in rng.sample(living,min(3,len(living))):
            if a['power'] and a['compassion']<.35 and a['ambition']>.7:a['role']='villain'
            elif a['power'] and a['compassion']>.7 and a.get('power_xp',0)>3:a['role']='hero'
        report=media_effects(state,agents,powers.events,rng)
        if report:event('media',report)
        chronicle.extend(internet_tick(agents,state,powers,rng,year))
        update_rankings(state,agents)
        for person in living:
            if person['age']>=18 and person.get('has_phone') and person.get('app_rank') in ('S','A','B') and rng.random()<.12:
                person['networking_invites']=person.get('networking_invites',0)+1
                person['wealth']=clamp(person.get('wealth',0)+2,0,10000)
                person['reputation']=clamp(person['reputation']+.5)
                state['networking_invitations']+=1
        adults=employment(state,agents,rng)
        powers.r['food'] += sum(a.get('job') == 'farmer' for a in adults) * .08
        powers.r['medicine'] += sum(a.get('job') == 'medic' for a in adults) * .03
        powers.r['infrastructure'] += sum(a.get('job') == 'engineer' for a in adults) * .005
        if powers.r['food'] <= 0:
            for hungry in rng.sample(living, min(5, len(living))):
                powers.damage(hungry, .06, 'food shortage')
            current_leader=agents.get(state['leader_id'])
            if current_leader: current_leader['reputation']=clamp(current_leader['reputation']-2)
            event('economy', 'A food shortage injured citizens and reduced trust in the administration.')
        if state.get('leadership_system','elections') != 'elections':
            accession=select_leadership(state,agents,rng,year)
            if accession:event('government',accession)
        elif year==1 or (year-1)%4==0 or state['leader_id'] is None or not agents.get(state['leader_id'],{}).get('alive',False):
            election=run_election(state,agents,rng,year)
            if election:event('election',f"{'Free' if election['free'] else 'Restricted'} election: {election['winner']} ({election['party']}) won {max(election['votes'].values())} of {election['eligible_voters']} ballots.")
        leader=agents.get(state['leader_id'])
        if govern(state,leader):event('government',f"The government changed to {state['regime']} as freedom reached {state['freedom']:.1f} and integrity {state['integrity']:.1f}.")
        if year%5==0:
            top=max(living,key=lambda a:a.get('app_score',0))
            event('society',f"Ranking app leader: {top['name']} (score {top['app_score']:.1f}, reputation {top['reputation']:.1f}); freedom {state['freedom']:.1f}.")
        chronicle.extend(institutions_tick(agents,state,powers,rng,year))
        chronicle.extend(powers.events[power_event_cursor:])
        # Household formation and moderate population replacement; clones never reproduce.
        parents=[a for a in adults if 18<=a['age']<=45 and a.get('clone_of') is None]
        parent_ids={a['id'] for a in parents}
        couples=[(a,agents[a['spouse']]) for a in parents if a.get('spouse') in parent_ids and a['id']<a['spouse']]
        for a,b in couples:
            if len(living)>900 or rng.random()>(.20 if len(living)<400 else .12):continue
            inherited=inherit_powers(a,b,rng,mutation_rate,mutator)
            if not powers_of(a) and not powers_of(b) and rng.random()<power_rate*.18:
                inherited=[rng.choice(list(power_tree))]
            power=inherited[0] if inherited else None
            child=create_agent(year,power=power,parent_a=a['id'],parent_b=b['id'],last_name=a['last_name'])
            set_powers(child,inherited)
            a['children'].append(child['id']);b['children'].append(child['id'])
        chronicle.extend(tick_story(story,agents,rng,year,society=state,mode='modern'))
        state['year']=year
    powers.observe_deaths()
    if story is not None and story['last_tick']<current_year:chronicle.extend(tick_story(story,agents,rng,current_year,society=state,mode='modern'))
    living=[a for a in agents.values() if a['alive']]
    powered=[a for a in living if a['power']]
    update_rankings(state,agents)
    adults=[a for a in living if a['age']>=18]
    share=len(powered)/len(living) if living else 0
    political='extinction' if not living else ('authoritarian' if state['regime']=='authoritarian' else ('free_democracy' if state['freedom']>=60 else 'constrained_democracy'))
    if living and state.get('leadership_system','elections')!='elections':political=state['leadership_system']+'_government'
    snapshot={'year':current_year,'agents':agents,'next_id':next_id,'society':state,'chronicle':chronicle,
              'powers':powers.state,'story':story,'rng_state':rng.getstate(),'terminal':not living}
    return {'seed':seed,'mode':'modern','engine_version':4,'story':export_story(story),'years_simulated':current_year,
            'outcome':'extinction' if not living else ('powers_died_out' if not powered else ('powered_majority' if share>=.5 else 'powered_minority')),
            'combined_powered_agents':sum(len(powers_of(a))>1 for a in living),
            'surviving_powers':{p:sum(p in powers_of(a) for a in living) for p in power_tree if any(p in powers_of(a) for a in living)},
            'final_population':len(living),'final_powered_count':len(powered),'final_power_share':share,
            'society_outcome':political,'leadership_system':state.get('leadership_system','elections'),'democracy_survived':bool(living) and state.get('leadership_system','elections')=='elections' and state['democratic_breakdowns']==0,
            'freedom':state['freedom'],'election_integrity':state['integrity'],'press_freedom':state['press_freedom'],
            'elections_held':len(state['elections']),'free_elections':sum(e['free'] for e in state['elections']),
            'peaceful_transfers':state['peaceful_transfers'],'democratic_years':state['democratic_years'],
            'democratic_breakdowns':state['democratic_breakdowns'],'democratic_recoveries':state['democratic_recoveries'],
            'unemployment_rate':sum(a.get('job')=='unemployed' for a in adults)/len(adults) if adults else 0,
            'phone_ownership_rate':sum(a.get('has_phone',False) for a in adults)/len(adults) if adults else 0,
            'app_opportunities':state['app_opportunities'],'networking_invitations':state['networking_invitations'],'job_promotions':state['job_promotions'],
            'media_reports':state['media_reports'],'government':state,
            'ranking_leaderboard':[{'id':a['id'],'name':a['name'],'score':a['app_score'],'rank':a.get('app_rank','Unranked'),'reputation':a['reputation'],'job':a['job'],'income':a['income']} for a in sorted(living,key=lambda a:(-a['app_score'],a['id']))[:10]],
            'internet':state.get('internet',{}),'institutions':state.get('institutions',{}),
            'agents':agents,'world_resources':powers.r,'power_usage':powers.state['usage'],
            'resurrections':powers.state['revivals'],'clones_created':powers.state['clones_created'],
            'power_mastery_levels':mastery_distribution(living),
            'mastery_levels':{str(i):sum(a.get('mastery_level',0)==i for a in living if a['power']) for i in range(6)},
            'drama_score':len(chronicle)+state['democratic_breakdowns']*25+state['peaceful_transfers']*5,
            'chronicle':chronicle,'_state':snapshot}
