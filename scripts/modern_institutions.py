"""Bounded, original annual civic systems for fictional modern societies.

No external accounts or real-world predictions. All randomness is supplied by the
caller. Persistent state contains only JSON types and resumes without reseeding.
"""

from expanded_powers import powers_of, has_power

HISTORY_LIMIT = 80
CASE_LIMIT = 120
HEALERS = {'Healing', 'Regeneration', 'Magic'}
DANGEROUS = {'Fire', 'Lightning', 'Strength', 'Giant Size', 'Telekinesis', 'Magic',
             'Sparks', 'Tide Control', 'Power Suppression'}
HOSTILE = {'Fire', 'Ice', 'Lightning', 'Magnetism', 'Poison', 'Illusions',
           'Shadow', 'Mind Control', 'Time Slowing', 'Time Stop', 'Steam',
           'Power Suppression', 'Charm', 'Hurricane Breath', 'Rot', 'Siphon',
           'Sparks', 'Starlight'}


def clamp(value, lo=0.0, hi=100.0):
    return min(hi, max(lo, value))


def setup(state, agents):
    defaults = {'cases': [], 'next_case_id': 1, 'trials': 0, 'convictions': 0,
                'acquittals': 0, 'self_defense_acquittals': 0, 'juvenile_diversions': 0,
                'vigilantism_sentences': 0, 'outbreaks_seeded': 0, 'rank_protests': 0,
                'observed_incidents': 0, 'licenses_issued': 0,
                'child_accidents': 0, 'collateral_damage': 0.0, 'hospital_admissions': 0,
                'hospital_waitlisted': 0, 'epidemic_years': 0, 'infections': 0,
                'quarantines': 0, 'healer_burnouts': 0, 'sports_events': 0,
                'sports_history': [], 'protests': 0, 'impeachments': 0,
                'history': [], 'last_year': None}
    inst = state.setdefault('institutions', {})
    for key, value in defaults.items():
        inst.setdefault(key, value)
    state.setdefault('laws', {})
    for a in agents.values():
        for key, value in {'power_license': False, 'license_suspended_until': 0,
                           'community_service': 0, 'safety_compliance': 0.0, 'healer_burnout': 0.0,
                           'infected_until': 0, 'immune_until': 0,
                           'quarantined_until': 0, 'corruption_evidence': 0.0,
                           'hospitalized_until': 0}.items():
            a.setdefault(key, value)
    return inst


def record(inst, year, kind, **fields):
    inst['history'].append(dict(year=year, kind=kind, **fields))
    del inst['history'][:-HISTORY_LIMIT]


def available(a, year):
    return (a.get('alive', False) and a.get('imprisoned_until', 0) <= year
            and a.get('quarantined_until', 0) < year
            and a.get('hospitalized_until', 0) < year
            and a.get('stasis_until', 0) < year)


def queue_case(state, agents, actor_id, offense, severity=1, evidence=.7,
               victim_id=None, accidental=False, self_defense=False):
    """Only an observed offense should be submitted. Allegations may be acquitted."""
    inst = setup(state, agents)
    actor = agents.get(actor_id)
    if actor is None or not actor.get('alive') or len(inst['cases']) >= CASE_LIMIT:
        return None
    case = {'id': inst['next_case_id'], 'actor_id': actor_id, 'offense': str(offense),
            'severity': int(clamp(severity, 1, 5)), 'evidence': clamp(evidence, 0, 1),
            'victim_id': victim_id, 'accidental': bool(accidental),
            'self_defense': bool(self_defense),
            'filed_year': state.get('year', 0)}
    inst['next_case_id'] += 1
    inst['cases'].append(case)
    return case


def licensing_and_courts(state, agents, rng, event):
    inst = setup(state, agents)
    year = state.get('year', 0)
    for a in sorted(agents.values(), key=lambda x: x['id']):
        if not a.get('alive'):
            continue
        a['community_service'] = max(0, a['community_service'] - 1)
        eligible = (available(a, year) and a.get('age', 0) >= 18 and powers_of(a)
                    and a.get('mastery_level', 0) >= 1
                    and a['license_suspended_until'] <= year)
        if eligible and not a['power_license']:
            a['power_license'] = True
            inst['licenses_issued'] += 1
        if a['license_suspended_until'] > year:
            a['power_license'] = False
    # Forensics identifies the creator, never the impersonated victim. One case
    # per exposure window prevents repeated charges from a lingering marker.
    for a in sorted(agents.values(), key=lambda x: x['id']):
        exposed_until = a.get('proven_fraud_until', 0)
        if (a.get('alive') and exposed_until >= year and exposed_until > 0
                and a.get('fraud_case_filed_until', 0) != exposed_until):
            case = queue_case(state, agents, a['id'], 'forensically documented impersonation fraud',
                              2, .9, victim_id=a.get('fraud_victim_id'))
            if case is not None:
                a['fraud_case_filed_until'] = exposed_until
    # A bounded annual docket provides explicit verdicts instead of role-based guilt.
    docket = inst['cases'][:max(1, min(12, len(agents) // 15 + 1))]
    del inst['cases'][:len(docket)]
    for case in docket:
        a = agents.get(case['actor_id'])
        if not a or not a.get('alive'):
            continue
        inst['trials'] += 1
        # Rights and independent courts require stronger evidence to convict.
        threshold = .65 if state['laws'].get('civil_rights_act') else .55
        if case.get('self_defense') and case['evidence'] >= threshold:
            inst['acquittals'] += 1
            inst['self_defense_acquittals'] += 1
            verdict = 'acquitted: evidenced self-defense'
        elif case['evidence'] < threshold:
            inst['acquittals'] += 1
            verdict = 'acquitted'
        elif a.get('age', 0) < 18 or case['accidental']:
            a['community_service'] = min(5, a['community_service'] + case['severity'])
            a['safety_compliance'] = clamp(a['safety_compliance'] + .15, 0, .8)
            inst['juvenile_diversions'] += 1
            verdict = 'training and community service'
        else:
            offense = case['offense'].lower()
            if 'murder' in offense:
                sentence = 25 if case['severity'] >= 5 else 15
            elif 'fraud' in offense:
                sentence = 6
            elif 'vigilantism' in offense:
                sentence = 1
                inst['vigilantism_sentences'] += 1
            else:
                sentence = min(10, case['severity'] * 2 - 1)
            a['imprisoned_until'] = max(a.get('imprisoned_until', 0), year + sentence)
            a['license_suspended_until'] = year + sentence + 1
            a['power_license'] = False
            a['reputation'] = clamp(a.get('reputation', 50) - 5 * case['severity'])
            fine = min(a.get('wealth', 0), 3 * case['severity'])
            a['wealth'] = max(0, a.get('wealth', 0) - fine)
            victim = agents.get(case['victim_id'])
            if victim:
                victim['wealth'] = clamp(victim.get('wealth', 0) + fine, 0, 10000)
            inst['convictions'] += 1
            verdict = f'{sentence}-year sentence'
        record(inst, year, 'verdict', actor_id=a['id'], case_id=case['id'], verdict=verdict)
        event('justice', f"Court heard {case['offense']} involving {a['name']}: {verdict}.")


def accidents_and_offenses(state, agents, powers, rng, event):
    inst = setup(state, agents)
    year = state.get('year', 0)
    living = sorted((a for a in agents.values() if a.get('alive')), key=lambda a: a['id'])
    # At most three incidents per year, even in very large societies.
    candidates = [a for a in living if powers_of(a) and available(a, year)]
    for a in rng.sample(candidates, min(3, len(candidates))):
        child = a.get('age', 18) < 18
        chance = .16 / (1 + a.get('mastery_level', 0)) if child else .025
        if DANGEROUS.intersection(powers_of(a)):
            chance *= 1.5
        chance *= 1 - a['safety_compliance']
        if a['power_license']:
            chance *= .4
        crime = not child and a.get('role') == 'villain' and rng.random() < .15
        if not crime and rng.random() >= chance:
            continue
        victims = [v for v in living if v['id'] != a['id'] and v.get('alive')]
        if not victims:
            continue
        victim = rng.choice(victims)
        amount = .12 if child else (.22 if crime else .08)
        chain = None
        if child and has_power(a, 'Sparks'):
            amount = .30
            chain = 'sparks ignited a gas leak, causing an explosion'
        elif child and has_power(a, 'Tide Control'):
            amount = .20
            powers.r['food'] = max(0, powers.r.get('food', 0) - 2)
            chain = 'an uncontrolled tide flooded homes and food stores'
        elif child and has_power(a, 'Power Suppression'):
            flyers = [v for v in victims if v.get('airborne_until', 0) >= year]
            if flyers:
                victim = rng.choice(flyers)
                victim['airborne_until'] = year - 1
                victim['suppressed_until'] = year + 1
                amount = .35
                chain = 'suppression disabled an airborne flyer, causing a fall'
        powers.damage(victim, amount, 'public power offense' if crime else 'power accident collateral')
        powers.r['infrastructure'] = max(0, powers.r.get('infrastructure', 0) - amount)
        inst['collateral_damage'] = round(inst['collateral_damage'] + amount, 6)
        inst['child_accidents'] += int(child)
        if chain:
            record(inst, year, 'collateral_chain', actor_id=a['id'], victim_id=victim['id'], mechanism=chain)
        queue_case(state, agents, a['id'], 'reckless power use' if not crime else 'public power assault',
                   2 if crime else 1, .85, victim['id'], accidental=not crime)
        event('accident' if not crime else 'crime',
              f"{a['name']}'s {'uncontrolled power accident' if not crime else 'public assault'} injured {victim['name']} and damaged infrastructure." + (f' Chain: {chain}.' if chain else ''))


def observe_public_offenses(state, agents, powers):
    """At most eight observed incidents/year; private acts never become evidence.

    Only structured successful hostile events with a real target qualify. A role
    alone cannot establish a crime. Self-defense requires a matching public
    hostile event directed at the defender in this same annual batch.
    """
    inst = setup(state, agents)
    year = state.get('year', 0)
    events = [e for e in powers.events if not e.get('secret') and e.get('year') == year
              and e.get('power') in HOSTILE and e.get('target_id') in agents
              and e.get('actor_id') in agents and 'died from' not in e.get('true_event', '')]
    prior_attacks = set()
    count = 0
    for e in events:
        a, victim = agents[e['actor_id']], agents[e['target_id']]
        if a['id'] == victim['id'] or a.get('court_observed_year') == year:
            continue
        if count >= 8:
            break
        defense = (victim['id'], a['id']) in prior_attacks
        prior_attacks.add((a['id'], victim['id']))
        fatal = (not victim.get('alive') and victim.get('death_year') == year
                 and str(victim.get('death_cause', '')).lower() ==
                 {'Rot': 'decay', 'Sparks': 'sparks', 'Starlight': 'starlight'}.get(
                     e['power'], e['power'].lower()))
        if defense:
            offense, severity = 'self-defense hearing', 1
        elif a.get('role') == 'villain':
            offense, severity = ('public power murder', 4) if fatal else ('public power assault', 2)
        elif not a.get('power_license'):
            offense, severity = 'unlicensed vigilantism', 1
        else:
            continue
        case = queue_case(state, agents, a['id'], offense, severity, .85,
                          victim['id'], self_defense=defense)
        if case is not None:
            a['court_observed_year'] = year
            inst['observed_incidents'] += 1
            count += 1


def hospitals_and_epidemics(state, agents, powers, rng, event):
    inst = setup(state, agents)
    year = state.get('year', 0)
    living = sorted((a for a in agents.values() if a.get('alive')), key=lambda a: a['id'])
    active = [a for a in living if available(a, year)]
    infected = [a for a in living if a['infected_until'] >= year and a['infected_until'] > 0]
    for a in infected:
        if a.get('infection_observed_until', 0) != a['infected_until']:
            inst['infections'] += 1
            inst['outbreaks_seeded'] += 1
            a['infection_observed_until'] = a['infected_until']
    outbreak = not infected and len(living) >= 8 and rng.random() < .06
    if outbreak:
        infected = rng.sample(living, min(3, len(living)))
        for a in infected:
            a['infected_until'] = year + 1
            a['infection_observed_until'] = year + 1
        inst['infections'] += len(infected)
        event('health', f"An epidemic began with {len(infected)} infections.")
    if infected:
        inst['epidemic_years'] += 1
        isolation = state['laws'].get('public_health_act', True)
        infectious = [a for a in infected if a['quarantined_until'] < year]
        susceptible = [a for a in living if a['infected_until'] < year and a['immune_until'] < year]
        spread = min(len(susceptible), len(infectious) * (1 if isolation else 2))
        for a in rng.sample(susceptible, spread):
            if rng.random() < (.22 if isolation else .65):
                a['infected_until'] = year + 1
                a['infection_observed_until'] = year + 1
                infected.append(a)
                inst['infections'] += 1
        for a in infected:
            powers.damage(a, .07, 'epidemic illness')
            if isolation and a['quarantined_until'] < year:
                a['quarantined_until'] = year + 1
                inst['quarantines'] += 1
            a['immune_until'] = max(a['immune_until'], a['infected_until'] + 3)
    # Burnout recovers with rest and lowers effective annual healer capacity.
    # Infection and quarantine can change eligibility during this same tick.
    active = [a for a in living if available(a, year)]
    healers = [a for a in active if HEALERS.intersection(powers_of(a)) and a.get('age', 0) >= 18]
    for a in living:
        a['healer_burnout'] = clamp(a['healer_burnout'] - 12)
    staff = [a for a in active if a.get('job') == 'medic']
    beds = max(1, len(living) // 18 + len(staff) * 2)
    patients = sorted((a for a in living if a.get('alive') and a.get('injury', 0) > .1),
                      key=lambda a: (-a.get('injury', 0), a['id']))
    heal_capacity = sum(max(0, int((100 - a['healer_burnout']) / 30)) for a in healers)
    admitted = patients[:beds + heal_capacity]
    inst['hospital_waitlisted'] += max(0, len(patients) - len(admitted))
    medicine = max(0, powers.r.get('medicine', 0))
    for index, patient in enumerate(admitted):
        treatment = .16 if index < beds else .22
        if index < beds and medicine < .03:
            treatment *= .35
        elif index < beds:
            medicine -= .03
        patient['injury'] = max(0.0, patient.get('injury', 0) - treatment)
        patient['hospitalized_until'] = year + 1 if patient['injury'] >= .25 else year
        inst['hospital_admissions'] += 1
    powers.r['medicine'] = max(0, medicine)
    workload = max(0, len(admitted) - beds)
    for healer in healers:
        assigned = min(max(0, int((100 - healer['healer_burnout']) / 30)), workload)
        workload -= assigned
        before = healer['healer_burnout']
        healer['healer_burnout'] = clamp(before + assigned * 22)
        healer['energy'] = max(0, healer.get('energy', 100) - assigned * 12)
        if before < 65 <= healer['healer_burnout']:
            inst['healer_burnouts'] += 1
            healer['power_ready_year'] = max(healer.get('power_ready_year', 0), year + 2)
            event('health', f"{healer['name']} needs rest after hospital healer burnout.")
    if admitted:
        event('health', f"Hospitals treated {len(admitted)} patients; {max(0, len(patients)-len(admitted))} remain on the waiting list.")


def sports_and_civic_action(state, agents, rng, event):
    inst = setup(state, agents)
    year = state.get('year', 0)
    active = sorted((a for a in agents.values() if available(a, year) and a.get('age', 0) >= 18),
                    key=lambda a: a['id'])
    # Separate leagues mean ordinary people retain a fair opportunity to compete.
    if year % 2 == 0:
        for powered in (False, True):
            entrants = [a for a in active if bool(powers_of(a)) == powered
                        and (not powered or a['power_license'])]
            if len(entrants) < 2:
                continue
            winner = max(entrants, key=lambda a: (rng.random() + a.get('mastery_level', 0)*.04,
                                                  -a['id']))
            winner['wealth'] = clamp(winner.get('wealth', 0) + 4, 0, 10000)
            winner['reputation'] = clamp(winner.get('reputation', 50) + 2)
            winner['followers'] = clamp(winner.get('followers', 0) + 10, 0, 100000)
            inst['sports_events'] += 1
            inst['sports_history'].append({'year': year, 'league': 'powered' if powered else 'ordinary',
                                           'winner_id': winner['id']})
            del inst['sports_history'][:-HISTORY_LIMIT]
            event('sports', f"{winner['name']} won the {'licensed powered' if powered else 'ordinary'} sports league.")
    # Ranking stigma: each living low-ranked phone user contributes up to 1;
    # other grievances contribute up to .5. A mean burden > .15 can mobilize.
    people = [a for a in agents.values() if a.get('alive')]
    if state['laws'].get('ranking_app', True) and people:
        burden = sum((.5 + min(.5, a.get('grievance', 0) / 100))
                     if a.get('app_rank') in ('E', 'F') and a.get('has_phone', True)
                     else min(.5, a.get('grievance', 0) / 200) for a in people) / len(people)
        if burden > .15 and rng.random() < min(.6, burden):
            inst['protests'] += 1
            inst['rank_protests'] += 1
            for a in people:
                a['grievance'] = clamp(a.get('grievance', 0) - 2)
            event('protest', 'Anti-ranking marchers protested app-based stigma, bullying and exclusion.')
    leader = agents.get(state.get('leader_id'))
    if not leader or not leader.get('alive'):
        return
    grievances = (100 - state.get('freedom', 80)) + max(0, 50 - leader.get('reputation', 50))
    if active and grievances > 45 and rng.random() < min(.75, grievances / 180):
        inst['protests'] += 1
        if state.get('regime') == 'authoritarian':
            state['freedom'] = clamp(state.get('freedom', 80) - 1)
            leader['reputation'] = clamp(leader.get('reputation', 50) - 2)
            event('protest', 'Authorities suppressed a civil-rights protest; public trust fell.')
        else:
            state['freedom'] = clamp(state.get('freedom', 80) + 1)
            state['integrity'] = clamp(state.get('integrity', 80) + .5)
            event('protest', 'Peaceful protesters demanded accountability; civic oversight strengthened.')
    # Removal needs documented evidence, institutional independence and a supermajority.
    evidence = leader['corruption_evidence']
    if evidence < .7 or state.get('regime') != 'democracy' or state.get('integrity', 0) < 50:
        return
    voters = [a for a in active if a['id'] != leader['id']]
    support = sum(a.get('compassion', .5) + evidence > 1.1 for a in voters)
    if len(voters) >= 3 and support / len(voters) >= 2/3:
        state['leader_id'] = None  # Existing election hook fills the constitutional vacancy.
        leader['reputation'] = clamp(leader.get('reputation', 50) - 20)
        leader['corruption_evidence'] = 0.0
        inst['impeachments'] += 1
        queue_case(state, agents, leader['id'], 'documented public corruption', 3, evidence)
        event('government', f"{leader['name']} was impeached by a supermajority after documented corruption; a replacement election is required.")


def institutions_year(state, agents, powers, rng, event):
    """Call once per year after powers/aging and before employment/elections.

    ``event(category, text)`` appends to the caller's chronicle. Secret power logs
    never become legal evidence automatically. Caller may queue observed offenses
    and set leader.corruption_evidence after a public journalism investigation.
    """
    inst = setup(state, agents)
    year = state.get('year', 0)
    if inst['last_year'] == year:
        return
    licensing_and_courts(state, agents, rng, event)
    observe_public_offenses(state, agents, powers)
    accidents_and_offenses(state, agents, powers, rng, event)
    hospitals_and_epidemics(state, agents, powers, rng, event)
    sports_and_civic_action(state, agents, rng, event)
    inst['last_year'] = year


def tick(agents, society_state, powers, rng, year):
    """Standard engine adapter; all returned events are public civic observations."""
    society_state['year'] = year
    events = []
    def emit(category, text):
        events.append({'year': year, 'category': category, 'true_event': text,
                       'public_belief': text, 'secret': False})
    institutions_year(society_state, agents, powers, rng, emit)
    return events
