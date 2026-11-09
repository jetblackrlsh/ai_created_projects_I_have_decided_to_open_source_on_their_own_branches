"""Deterministic, bounded, state-changing power actions for individual-agent worlds.

All randomness comes from the world's Random instance. JSON-safe state is owned by
WorldPowers; the simulation retains agents, identity, family and succession rules.
"""
from copy import deepcopy

POWER_EFFECTS = {
    'Fire': 'Burn a hostile agent; burns cause injury until treated.',
    'Ice': 'Freeze a hostile agent, interrupting power actions and combat.',
    'Water': 'Cleanse burns/poison and irrigate food supplies.',
    'Weather': 'Improve the annual harvest and reduce famine pressure.',
    'Lightning': 'Stun and injure a hostile agent.',
    'Magnetism': 'Disarm a hostile agent and salvage construction material.',
    'Earth': 'Build durable settlement fortifications.',
    'Wind': 'Transport relief food and shelter an injured citizen.',
    'Plant Control': 'Grow edible crops and medicine stock.',
    'Poison': 'Apply a lingering poison to a hostile agent.',
    'Flight': 'Evacuate an injured citizen to another town and shelter them.',
    'Strength': 'Haul material and repair damaged infrastructure.',
    'Giant Size': 'Build infrastructure and guard the settlement.',
    'Durability': 'Form protective armor; also reduce incoming power damage.',
    'Speed': 'Deliver food/material and gain a temporary combat initiative boost.',
    'Shapeshifting': 'Adopt an animal form, forage and escape confinement.',
    'Cloning': 'Create a distinct, short-lived, non-reproducing clone.',
    'Invisibility': 'Hide and covertly free a prisoner.',
    'Illusions': 'Confuse a hostile agent with combat-decoy visions.',
    'Shadow': 'Frighten a hostile agent and infiltrate prison to free someone.',
    'Mind Control': 'Temporarily change an opponent role/allegiance.',
    'Telepathy': 'Expose a recorded secret and identify a hostile mind.',
    'Portals': 'Transfer a household between towns and deliver relief supplies.',
    'Time Slowing': 'Place a hostile agent in stasis, preventing aging/actions briefly.',
    'Magic': 'Ward an ally against the next power attack.',
    'Healing': 'Treat an injured citizen using medicine.',
    'Regeneration': 'Restore the caster own injuries and remove poison.',
    'Immortal': 'Recover from wounds slowly; cannot die from old age.',
    'Necromancy': 'Revive one recently dead person with identity and family intact.',
}


def initial_state(population):
    return {'version': 2, 'resources': {'food': 2.0 * population, 'materials': 20.0,
            'medicine': 5.0, 'fortifications': 0.0, 'infrastructure': 1.0,
            'guard': 0.0, 'harvest_bonus': 0.0}, 'usage': {}, 'revivals': 0,
            'clones_created': 0, 'deaths': 0, 'last_year': 0, 'revealed_events': []}


class WorldPowers:
    def __init__(self, agents, rng, state=None):
        self.agents = agents
        self.rng = rng
        self.state = state if state is not None else initial_state(sum(a['alive'] for a in agents.values()))
        self.state.setdefault('revealed_events', [])
        self.r = self.state['resources']
        self.year = 0
        self.events = []
        self.create_agent = None
        self.towns = ['Ashford']
        self.chronicle = []
        self.counter_tech = []
        self.activated_this_year = set()
        self.living = []

    def setup_agent(self, a):
        if a.get('_powers_version') == 2:
            return
        defaults = {'injury': 0.0, 'energy': 100.0, 'power_ready_year': 0,
                    'location': 'Ashford', 'resurrections': 0,
                    'death_history': [], 'clone_of': None}
        for k, v in defaults.items():
            if k not in a:
                a[k] = deepcopy(v)
        a['_powers_version'] = 2

    def emit(self, caster, text, secret=False):
        self.events.append({'year': self.year, 'category': 'power',
                            'true_event': f"{caster['name']} [{caster.get('power')}]: {text}",
                            'public_belief': 'An unexplained supernatural incident occurred.' if secret else
                            f"{caster['name']} [{caster.get('power')}]: {text}", 'secret': secret})

    def observe_deaths(self):
        """Capture each death episode without erasing past lives on resurrection."""
        for a in self.agents.values():
            self.setup_agent(a)
            if not a['alive'] and not a.get('_death_recorded', False):
                a['death_history'].append({'year': a.get('death_year'), 'cause': a.get('death_cause')})
                a['_death_recorded'] = True
                self.state['deaths'] += 1

    def begin_year(self, year, create_agent, towns, chronicle, counter_tech):
        self.year = year
        self.events = []
        self.activated_this_year = set()
        self.create_agent, self.towns = create_agent, towns
        self.chronicle, self.counter_tech = chronicle, counter_tech
        self.observe_deaths()
        self.living = [a for a in self.agents.values() if a['alive']]
        population = len(self.living)
        self.r['guard'] = max(0, self.r['guard'] * .7)
        self.r['harvest_bonus'] = 0.0
        # A modest, explicit economy; powered production now has measurable consequences.
        self.r['food'] = max(0, self.r['food'] + population * self.rng.uniform(.85, 1.12) * (1 + min(.12, self.r["infrastructure"] * .003)) - population)
        self.r['fortifications'] *= .98
        for a in self.living:
            self.setup_agent(a)
            a['energy'] = min(100.0, a['energy'] + 18.0)
            if a.get('imprisoned_until', 0) > year and any('Collar' in t or 'Dampen' in t or 'Suppress' in t for t in counter_tech):
                a['suppressed_until'] = year
            if a.get('controlled_until', 0) < year and a.get('controlled_by') is not None:
                if a['role'] == a.get('controlled_role'):
                    a['role'] = a.get('original_role', 'citizen')
                a['controlled_by'] = None
            if a.get('clone_expires', year + 1) <= year:
                self.kill(a, 'clone dissolution')
                continue
            if a.get('poisoned_until', 0) >= year:
                self.damage(a, .12, 'poison')
            if a.get('burning_until', 0) >= year:
                self.damage(a, .09, 'burns')
            # Natural recovery does not invalidate active healing choices.
            a['injury'] = max(0.0, a['injury'] - .025)
        # At most 24 actions per year; rotate the opportunity pool with world-seeded RNG.
        candidates = [a for a in self.living if a['alive'] and a.get('power') in POWER_EFFECTS]
        self.rng.shuffle(candidates)
        for a in candidates:
            if len(self.activated_this_year) >= 24:
                break
            if a['age'] >= 12 and self.rng.random() < .35:
                self.activate(a)
        self.r['food'] = min(self.r['food'], max(20.0, population * 4.0))
        for key in ('materials', 'medicine', 'fortifications', 'infrastructure', 'guard'):
            self.r[key] = min(10000.0, max(0.0, self.r[key]))
        self.observe_deaths()
        self.state['last_year'] = year

    def enemies(self, a):
        return [b for b in self.living if b['alive'] and b['id'] != a['id'] and
                ((a['role'] == 'villain' and b['role'] != 'villain') or
                 (a['role'] != 'villain' and b['role'] == 'villain'))]

    def allies(self, a):
        return [b for b in self.living if b['alive'] and
                ((b['role'] == 'villain') == (a['role'] == 'villain'))]

    def target(self, a):
        targets = self.enemies(a)
        return self.rng.choice(targets) if targets else None

    def damage(self, target, amount, cause):
        self.setup_agent(target)
        if not target['alive']:
            return False
        if target.get('ward_charges', 0) > 0:
            target['ward_charges'] -= 1
            return False
        if target.get('power') == 'Durability':
            amount *= .35
        if target.get('armored_until', 0) >= self.year:
            amount *= .55
        if target.get('sheltered_until', 0) >= self.year:
            amount *= .8
        target['injury'] = min(1.0, target['injury'] + amount)
        if target['injury'] >= 1:
            self.kill(target, cause)
        return True

    def kill(self, target, cause):
        if target['alive']:
            target['alive'] = False
            target['death_year'], target['death_cause'] = self.year, cause
            target['_death_recorded'] = False
            self.emit(target, f"died from {cause}.")

    def can_act(self, a):
        confinement_escape = a.get('power') in ('Shapeshifting', 'Invisibility', 'Portals', 'Shadow')
        return (a['alive'] and a.get('power') in POWER_EFFECTS and
                a.get('power_ready_year', 0) <= self.year and a.get('energy', 0) >= 25 and
                a.get('frozen_until', 0) < self.year and a.get('stunned_until', 0) < self.year and
                a.get('stasis_until', 0) < self.year and a.get('frightened_until', 0) < self.year and
                a.get('suppressed_until', 0) < self.year and
                (a.get('imprisoned_until', 0) <= self.year or confinement_escape))

    def activate(self, a):
        """Try one action. Return success only when its actual effect occurred."""
        self.setup_agent(a)
        if not self.can_act(a) or a['id'] in self.activated_this_year:
            return False
        power = a['power']
        cost = 60 if power in ('Necromancy', 'Cloning') else 25
        if a['energy'] < cost:
            return False
        target = self.target(a)
        changed = False
        message = ''
        if power in ('Fire', 'Lightning', 'Poison', 'Ice', 'Magnetism', 'Illusions', 'Shadow', 'Mind Control', 'Time Slowing') and target:
            if target.get('ward_charges', 0) > 0:
                target['ward_charges'] -= 1
                a['energy'] -= cost
                a['power_ready_year'] = self.year + 3
                self.activated_this_year.add(a['id'])
                self.emit(a, f"an attack on {target['name']} was absorbed by a magic ward.")
                return False
            if power == 'Fire':
                changed = self.damage(target, .25, 'fire')
                if changed: target['burning_until'] = self.year + 2
                message = f"burned {target['name']}; the burns persist unless treated."
            elif power == 'Lightning':
                changed = self.damage(target, .12, 'lightning')
                if changed: target['stunned_until'] = self.year + 1
                message = f"struck and stunned {target['name']}."
            elif power == 'Poison':
                target['poisoned_until'] = self.year + 3
                changed, message = True, f"poisoned {target['name']} for three following years."
            elif power == 'Ice':
                target['frozen_until'] = self.year + 1
                changed, message = True, f"froze {target['name']}, interrupting their actions."
            elif power == 'Magnetism':
                target['disarmed_until'] = self.year + 2
                self.r['materials'] += 3
                changed, message = True, f"disarmed {target['name']} and recovered 3 material."
            elif power == 'Illusions':
                target['confused_until'] = self.year + 2
                changed, message = True, f"trapped {target['name']} in combat-decoy illusions."
            elif power == 'Shadow':
                target['frightened_until'] = self.year + 1
                changed, message = True, f"terrified {target['name']} into hiding."
            elif power == 'Mind Control':
                if target.get('controlled_by') is None:
                    target['original_role'] = target['role']
                    target['role'] = 'villain' if a['role'] == 'villain' else 'citizen'
                    target['controlled_role'] = target['role']
                    target['controlled_by'], target['controlled_until'] = a['id'], self.year + 2
                    changed, message = True, f"controlled {target['name']}, changing their allegiance temporarily."
            elif power == 'Time Slowing':
                target['stasis_until'] = self.year + 1
                changed, message = True, f"slowed {target['name']} into brief stasis; they cannot act or age."
        elif power == 'Water':
            injured = [b for b in self.allies(a) if b.get('burning_until', 0) >= self.year or b.get('poisoned_until', 0) >= self.year]
            if injured:
                patient = max(injured, key=lambda b:b.get('injury', 0))
                patient['burning_until'] = patient['poisoned_until'] = 0
                message = f"cleansed burns and poison from {patient['name']} and irrigated crops."
            else: message = 'irrigated crops with 6 food units of fresh water.'
            self.r['food'] += 6
            changed = True
        elif power == 'Weather':
            self.r['food'] += 8
            self.r['harvest_bonus'] += .04
            changed, message = True, 'brought rain: +8 food and lower famine pressure this year.'
        elif power == 'Earth':
            self.r['fortifications'] += 1
            self.r['materials'] += 2
            changed, message = True, 'raised a stone fortification and 2 material.'
        elif power == 'Plant Control':
            self.r['food'] += 10
            self.r['medicine'] += 1
            changed, message = True, 'grew crops (+10 food) and medicinal plants (+1 medicine).'
        elif power in ('Wind', 'Flight'):
            patients = self.allies(a)
            if patients:
                patient = max(patients, key=lambda b:b.get('injury', 0))
                patient['sheltered_until'] = self.year + 2
                if power == 'Flight':
                    patient['location'] = self.towns[(self.towns.index(patient.get('location', self.towns[0])) + 1) % len(self.towns)] if patient.get('location') in self.towns else self.towns[0]
                    patient['injury'] = max(0.0, patient.get('injury', 0) - .08)
                    message = f"evacuated {patient['name']} to shelter; injury decreased."
                else:
                    self.r['food'] += 5
                    message = f"airlifted relief food (+5) and sheltered {patient['name']}."
                changed = True
        elif power == 'Strength':
            self.r['materials'] += 8
            self.r['infrastructure'] += .25
            changed, message = True, 'hauled 8 material and repaired infrastructure (+0.25).'
        elif power == 'Giant Size':
            self.r['infrastructure'] += .5
            self.r['guard'] += 1
            changed, message = True, 'built infrastructure (+0.5) and stood guard (+1 defense).'
        elif power == 'Durability':
            a['armored_until'] = self.year + 3
            changed, message = True, 'hardened their body, reducing incoming injury and increasing combat defense.'
        elif power == 'Speed':
            a['hasted_until'] = self.year + 2
            self.r['food'] += 4
            self.r['materials'] += 4
            changed, message = True, 'ran supply deliveries (+4 food, +4 material) and gained combat initiative.'
        elif power == 'Shapeshifting':
            a['animal_form_until'] = self.year + 2
            a['imprisoned_until'] = 0
            self.r['food'] += 5
            changed, message = True, 'became a small foraging animal, escaped confinement and gathered 5 food.'
        elif power == 'Cloning':
            living_count = sum(b['alive'] for b in self.agents.values())
            clones = sum(b['alive'] and b.get('clone_of') is not None for b in self.agents.values())
            if a.get('clone_of') is None and clones < max(1, living_count // 20) and self.r['food'] >= 5 and self.create_agent:
                clone = self.create_agent(self.year, age=a['age'], power=a['power'], last_name=a['last_name'])
                clone['name'] = a['name'] + ' (clone ' + str(clone['id']) + ')'
                clone['clone_of'], clone['clone_expires'] = a['id'], self.year + 15
                clone['royal_blood'] = False
                self.setup_agent(clone)
                self.r['food'] -= 5
                self.state['clones_created'] += 1
                changed, message = True, f"created {clone['name']}, a separate person lasting at most 15 years."
        elif power in ('Invisibility', 'Shadow'):
            a['hidden_until'] = self.year + 2
            prisoners = [b for b in self.allies(a) if b.get('imprisoned_until', 0) > self.year]
            if prisoners:
                prisoner = self.rng.choice(prisoners)
                prisoner['imprisoned_until'] = 0
                message = f"infiltrated prison and freed {prisoner['name']}."
            else: message = 'hid from enemies, improving combat evasion.'
            changed = True
        elif power == 'Telepathy':
            secrets = [(i, e) for i, e in enumerate(self.chronicle) if e.get('secret') and i not in self.state['revealed_events']]
            if secrets:
                index, secret = self.rng.choice(secrets)
                self.state['revealed_events'].append(index)
                message = 'publicly revealed a concealed event: ' + secret['true_event']
                changed = True
            elif target:
                target['exposed_until'] = self.year + 3
                changed, message = True, f"read {target['name']}'s hostile intent, exposing their tactics."
        elif power == 'Portals':
            family = [b for b in self.allies(a) if b['id'] in (a['id'], a.get('spouse')) or b.get('id') in a.get('children', [])]
            for b in family:
                b['location'] = self.towns[-1]
                b['imprisoned_until'] = 0
                b['sheltered_until'] = self.year + 2
            self.r['food'] += 7
            changed, message = True, f"ported {len(family)} household members to {self.towns[-1]} and delivered 7 food."
        elif power == 'Magic':
            patient = min(self.allies(a), key=lambda b:b.get('ward_charges', 0), default=a)
            if patient.get('ward_charges', 0) < 1:
                patient['ward_charges'] = 1
                changed, message = True, f"warded {patient['name']} against one power attack."
        elif power == 'Healing':
            patients = [b for b in self.allies(a) if b.get('injury', 0) > .02]
            if patients and self.r['medicine'] >= 1:
                patient = max(patients, key=lambda b:b['injury'])
                patient['injury'] = max(0.0, patient['injury'] - .4)
                patient['poisoned_until'] = 0
                self.r['medicine'] -= 1
                changed, message = True, f"healed {patient['name']}, restoring up to 0.4 injury at a cost of 1 medicine."
        elif power in ('Regeneration', 'Immortal'):
            if a['injury'] > 0 or (power == 'Regeneration' and a.get('poisoned_until', 0) >= self.year):
                a['injury'] = max(0, a['injury'] - (.35 if power == 'Regeneration' else .15))
                if power == 'Regeneration': a['poisoned_until'] = 0
                changed, message = True, 'regrew damaged tissue.' if power == 'Regeneration' else 'recovered wounds through ageless vitality.'
        elif power == 'Necromancy':
            # One true return per individual, recent unnatural death only; no age-death loops.
            eligible = [b for b in self.agents.values() if not b['alive'] and b.get('clone_of') is None and
                        b.get('resurrections', 0) < 1 and b.get('death_year') is not None and
                        0 <= self.year - b['death_year'] <= 3 and b.get('death_cause') not in ('old age', 'clone dissolution')]
            if eligible and self.r['medicine'] >= 2 and self.r['food'] >= 5:
                patient = min(eligible, key=lambda b:(b.get('last_name') != a.get('last_name'), b['id']))
                self.setup_agent(patient)
                self.observe_deaths()
                patient['alive'] = True
                patient['resurrections'] += 1
                patient['death_year'] = patient['death_cause'] = None
                patient['_death_recorded'] = False
                patient['injury'], patient['energy'] = .5, 20
                patient['poisoned_until'] = patient['burning_until'] = 0
                patient['role'] = 'citizen'  # Returning monarchs do not displace current rulers.
                patient['imprisoned_until'] = 0
                self.r['food'] -= 5
                self.r['medicine'] -= 2
                self.state['revivals'] += 1
                changed, message = True, f"resurrected {patient['name']}; their identity and family survived death."
        if changed:
            a['energy'] -= cost
            a['power_ready_year'] = self.year + (8 if power in ('Cloning', 'Necromancy') else 3)
            self.activated_this_year.add(a['id'])
            self.state['usage'][power] = self.state['usage'].get(power, 0) + 1
            self.emit(a, message, secret=power in ('Shadow', 'Invisibility', 'Mind Control'))
        return changed

    def combat_multiplier(self, a):
        self.setup_agent(a)
        if any(a.get(k, 0) >= self.year for k in ('frozen_until', 'stunned_until', 'stasis_until', 'frightened_until')):
            return .2
        result = max(.2, 1 - a['injury'] * .65)
        for flag, factor in (('disarmed_until', .6), ('confused_until', .65), ('exposed_until', .8),
                             ('hasted_until', 1.25), ('hidden_until', 1.2), ('armored_until', 1.2)):
            if a.get(flag, 0) >= self.year: result *= factor
        return result
