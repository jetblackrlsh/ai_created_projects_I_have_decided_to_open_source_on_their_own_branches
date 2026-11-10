"""Bounded, deterministic actions for the expanded fictional power catalogue.

These hooks mutate JSON-safe simulation state only. The core engine owns action
eligibility, ward interception, energy, cooldown, XP and event accounting. Expired
conditions are tested by year rather than deleted, preserving checkpoint replay.
"""

MAX_POWERS = 3
RESOURCE_CAP = 10000.0
POWER_ALIASES = {'Luck': 'Fortune'}
HOSTILE_EXPANDED = frozenset({'Time Stop', 'Steam', 'Power Suppression', 'Charm',
    'Hurricane Breath', 'Rot', 'Siphon', 'Sparks', 'Starlight'})


def canonical_power(name):
    return POWER_ALIASES.get(name, name)
EXPANDED_EFFECTS = {
    'Psychometry': 'Read an object trace to reveal an existing recorded secret.',
    'Fortune': 'Grant an ally a bounded lucky combat opportunity.',
    'Bubbles': 'Enclose an ally in a protective rescue bubble.',
    'Rapid Construction': 'Consume material to construct infrastructure rapidly.',
    'Perfect Memory': 'Record a witnessed event and recover useful technical knowledge.',
    'Time Rewind': 'Rewind a recent injury without resurrecting the dead or rewinding the world.',
    'Time Stop': 'Briefly stop a hostile person in stasis, interrupting actions and aging.',
    'Tide Control': 'Irrigate crops and transport emergency food by water.',
    'Steam': 'Scald and obscure a hostile person.',
    'Alchemy': 'Convert construction material into medicine.',
    'Starlight': 'Blast a hostile person with starlight and protect an ally with a luminous ward.',
    'Empathy': 'Calm a hostile person and improve civic trust.',
    'Power Suppression': 'Temporarily suppress a hostile person\'s power actions.',
    'Charm': 'Temporarily sway a hostile person\'s allegiance.',
    'Precognition': 'Expose hostile tactics and prepare a defensive advantage.',
    'Stone Skin': 'Harden the caster\'s body into protective stone armor.',
    'Invulnerability': 'Protect the caster against one incoming power attack.',
    'Shrinking': 'Shrink to escape confinement and conceal the caster.',
    'Hurricane Breath': 'Disarm a hostile person and clear salvageable debris.',
    'Rot': 'Inflict a persistent decay injury on a hostile person.',
    'Siphon': 'Permanently transfer one power from a hostile person; capacity is three.',
    'Adrenaline': 'Boost initiative and recover a bounded amount of usable energy.',
    'Smoke': 'Conceal the caster and confuse a hostile person.',
    'Sparks': 'Deliver a small electrical injury and stun a hostile person.',
}

# Conservative multipliers: expanded abilities do not introduce infinite age,
# resources, recursive copying or unlimited combat multipliers.
EXPANDED_POWER_TREE = {
    name: {'category': 'Expanded', 'mutations': [name], 'combat': 1.2,
           'survival': 1.1, 'longevity': 1.0, 'stealth': 1.0,
           'hero_prefix': [name.split()[0]], 'counter_tech': 'Power Dampeners'}
    for name in EXPANDED_EFFECTS
}


def powers_of(agent):
    """Read legacy primary plus repertoire, in stable order, without mutating."""
    values = [agent.get('power')] + list(agent.get('powers') or [])
    result = []
    for value in values:
        if isinstance(value, str):
            value = canonical_power(value)
        if isinstance(value, str) and value and value not in result:
            result.append(value)
    return result[:MAX_POWERS]


def set_powers(agent, names):
    unique = []
    for name in names:
        if isinstance(name, str):
            name = canonical_power(name)
        if isinstance(name, str) and name and name not in unique:
            unique.append(name)
        if len(unique) == MAX_POWERS:
            break
    agent['powers'] = unique
    agent['power'] = unique[0] if unique else None
    return unique


def has_power(agent, name):
    return canonical_power(name) in powers_of(agent)


def inherit_powers(parent_a, parent_b, rng, mutation_rate, mutator):
    """78% awakening gate, then a primary and independent secondary inheritance.

Each remaining parental power has a 35% chance to join the repertoire, up to
three total; each selected power is mutated by the caller's seeded mutator.
Siphoned powers are ordinary permanent powers and can therefore be inherited.
"""
    pool = list(dict.fromkeys(powers_of(parent_a) + powers_of(parent_b)))
    if not pool or rng.random() >= .78:
        return []
    primary = rng.choice(pool)
    others = [power for power in pool if power != primary]
    rng.shuffle(others)
    selected = [primary]
    for power in others:
        if len(selected) >= MAX_POWERS:
            break
        if rng.random() < .35:
            selected.append(power)
    result = []
    for power in selected:
        mutated = mutator(power, rng, mutation_rate)
        if mutated and mutated not in result:
            result.append(mutated)
    return result


def activate_expanded(context, caster, target):
    """Return None for core powers, otherwise (actual_change, event_text).

The caller must select a held power before calling and perform the common
eligibility/ward checks. No effect silently spends energy on failed actions.
Siphon changes primary identities; wrappers must not restore a stolen primary.
"""
    p = canonical_power(caster.get('power'))
    if p not in EXPANDED_EFFECTS:
        return None
    c, year = context, context.year
    potency = 1 + .1 * min(5, max(0, caster.get('mastery_level', 0)))
    allies = c.allies(caster)
    patient = c.priority_patient(caster,allies) if hasattr(c,'priority_patient') else max(allies,key=lambda a:a.get('injury',0),default=caster)

    def resource(name, amount):
        c.r[name] = min(RESOURCE_CAP, max(0.0, c.r.get(name, 0) + amount))

    def flag(agent, name, until):
        if agent.get(name, 0) >= until:
            return False
        agent[name] = until
        return True

    hostile = {'Time Stop', 'Steam', 'Power Suppression', 'Charm',
               'Hurricane Breath', 'Rot', 'Siphon', 'Sparks'}
    if p in hostile and (not target or not target.get('alive', False)):
        return False, 'No eligible hostile target.'
    if p == 'Psychometry':
        revealed = c.state.setdefault('revealed_events', [])
        secrets = [(i, event) for i, event in enumerate(c.chronicle)
                   if event.get('secret') and i not in revealed]
        if not secrets:
            return False, 'No unrevealed object trace.'
        index, event = c.rng.choice(secrets)
        revealed.append(index)
        return True, 'read an object trace revealing: ' + event['true_event']
    if p in ('Fortune', 'Luck'):
        return flag(patient, 'lucky_until', year + 2), f"granted {patient['name']} a lucky opportunity."
    if p == 'Bubbles':
        changed = flag(patient, 'sheltered_until', year + 2)
        changed = flag(patient, 'armored_until', year + 1) or changed
        return changed, f"sheltered {patient['name']} in a rescue bubble."
    if p == 'Rapid Construction':
        if c.r.get('materials', 0) < 4:
            return False, 'Insufficient construction material.'
        resource('materials', -4)
        resource('infrastructure', .8 * potency)
        return True, 'converted 4 material into rapid infrastructure construction.'
    if p == 'Perfect Memory':
        # One retained chronicle index per user, overwritten rather than growing.
        index = len(c.chronicle) - 1
        if index < 0 or caster.get('remembered_event_index') == index:
            return False, 'No new witnessed event to remember.'
        caster['remembered_event_index'] = index
        caster['knowledge_points'] = min(100, max(0, caster.get('knowledge_points', 0)) + 1)
        resource('materials', 2 * potency)
        return True, 'retained a witnessed event and recovered technical knowledge.'
    if p == 'Time Rewind':
        if patient.get('injury', 0) <= 0 or not patient.get('alive'):
            return False, 'No living injured person to rewind.'
        patient['injury'] = max(0.0, patient.get('injury', 0) - .2 * potency)
        return True, f"rewound a recent injury of {patient['name']}; identity and history remained intact."
    if p == 'Time Stop':
        return flag(target, 'stasis_until', year + 1), f"stopped {target['name']} in brief stasis."
    if p == 'Tide Control':
        resource('food', 7 * potency)
        flag(patient, 'sheltered_until', year + 1)
        return True, 'controlled the tide to deliver food and protect a waterborne rescue.'
    if p in ('Steam', 'Sparks'):
        changed = c.damage(target, (.12 if p == 'Steam' else .08) * potency, p.lower())
        if changed:
            flag(target, 'confused_until' if p == 'Steam' else 'stunned_until', year + 1)
        return changed, f"struck {target['name']} with {p.lower()}."
    if p == 'Alchemy':
        if c.r.get('materials', 0) < 3:
            return False, 'Insufficient alchemical material.'
        resource('materials', -3)
        resource('medicine', 2 * potency)
        return True, 'transmuted 3 material into medicine.'
    if p in ('Starlight', 'Invulnerability'):
        recipient = caster if p == 'Invulnerability' else patient
        changed = recipient.get('ward_charges', 0) < 1
        recipient['ward_charges'] = 1
        if p == 'Starlight' and target and target.get('alive'):
            changed = c.damage(target, .14 * potency, 'starlight') or changed
            if target.get('alive'):
                changed = flag(target, 'exposed_until', year + 2) or changed
        return changed, f"granted {recipient['name']} one protective ward."
    if p == 'Empathy':
        changed = flag(caster, 'sheltered_until', year + 1)
        if target:
            changed = flag(target, 'calmed_until', year + 2) or changed
            changed = flag(target, 'confused_until', year + 1) or changed
        # Civic trust is a simulated scalar, not access to real minds.
        caster['civic_trust'] = min(1.0, caster.get('civic_trust', .5) + .05)
        return changed, 'calmed hostility and strengthened civic trust.'
    if p == 'Power Suppression':
        changed = flag(target, 'suppressed_until', year + 2)
        falling = has_power(target, 'Flight') and target.get('airborne_until', 0) >= year
        if falling:
            target['airborne_until'] = 0
            c.damage(target, .12, 'suppressed flight fall')
            changed = True
        suffix = ' and caused a fall from interrupted flight' if falling else ''
        return changed, f"suppressed {target['name']}'s power actions temporarily{suffix}."
    if p == 'Charm':
        if target.get('controlled_by') is not None:
            return False, 'Target is already controlled.'
        target['original_role'] = target['role']
        target['role'] = 'villain' if caster['role'] == 'villain' else 'citizen'
        target['controlled_role'] = target['role']
        target['controlled_by'], target['controlled_until'] = caster['id'], year + 1
        return True, f"charmed {target['name']} into a temporary allegiance."
    if p == 'Precognition':
        changed = flag(caster, 'armored_until', year + 2)
        if target:
            changed = flag(target, 'exposed_until', year + 2) or changed
        return changed, 'foresaw a hostile tactic and prepared a defense.'
    if p == 'Stone Skin':
        return flag(caster, 'armored_until', year + 3), 'formed protective stone skin.'
    if p == 'Shrinking':
        changed = caster.get('imprisoned_until', 0) > 0
        caster['imprisoned_until'] = 0
        changed = flag(caster, 'hidden_until', year + 2) or changed
        return changed, 'shrank to escape confinement and hide.'
    if p == 'Hurricane Breath':
        changed = flag(target, 'disarmed_until', year + 2)
        resource('materials', 2)
        return True, f"disarmed {target['name']} and cleared useful debris."
    if p == 'Rot':
        # Decay uses the existing injury loop; deliberate pathogen use also
        # enters the institutions model's finite infection/quarantine cycle.
        changed = flag(target, 'poisoned_until', year + 3)
        malicious = caster.get('role') == 'villain' or caster.get('goal') == 'revenge'
        if malicious:
            changed = flag(target, 'infected_until', year + 1) or changed
        suffix = ' and seeded an infection' if malicious else ''
        return changed, f"inflicted lingering decay on {target['name']}{suffix}."
    if p == 'Siphon':
        # The wrapper can temporarily select Siphon while a different primary
        # remains first in the durable repertoire. Preserve that primary order.
        own = list(dict.fromkeys(caster.get('powers') or powers_of(caster)))[:MAX_POWERS]
        available = [power for power in powers_of(target) if power not in own and power != 'Siphon']
        if len(own) >= MAX_POWERS or not available:
            return False, 'No transferable power or repertoire capacity.'
        stolen = c.rng.choice(available)
        set_powers(target, [power for power in powers_of(target) if power != stolen])
        set_powers(caster, own + [stolen])
        # Bounded provenance, no copied bodies, temporary expiry or automatic return.
        records = caster.setdefault('siphon_acquisitions', [])
        records.append({'power': stolen, 'from_id': target['id'], 'year': year})
        del records[:-MAX_POWERS]
        return True, f"permanently siphoned {stolen} from {target['name']}."
    if p == 'Adrenaline':
        changed = flag(caster, 'hasted_until', year + 2)
        # The common 25-energy cost exceeds this refund; no energy farming.
        caster['energy'] = min(100.0, caster.get('energy', 0) + 5)
        return changed, 'surged with adrenaline, gaining initiative and 5 energy before action cost.'
    if p == 'Smoke':
        changed = flag(caster, 'hidden_until', year + 2)
        if target:
            changed = flag(target, 'confused_until', year + 1) or changed
        return changed, 'hid in smoke and obscured hostile vision.'
    raise AssertionError('Expanded power lacks an implemented action: ' + p)
