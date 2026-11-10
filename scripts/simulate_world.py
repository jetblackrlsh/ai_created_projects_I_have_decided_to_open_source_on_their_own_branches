#!/usr/bin/env python3
"""
Superpower World Simulation Engine (Original Agent-Based & Monte Carlo Simulator)
Supports 5 simulation modes:
  - evolution: 1,000-year hereditary power evolution in a settlement (Ashford valley)
  - monarch: Non-powered ruler dynasty governing superhumans over 100+ years
  - wheel: Spinning a Superpower & Cataclysm Wheel on humanity every N years
  - versus: Asymmetric superpower civilizations separated by a wall (speed, strength, intelligence)
  - modern: Employment, ranking apps, media, elections and democratic institutions

Requires only the Python 3 standard library.
"""

import argparse
import json
import math
import random
import sys
from typing import Any, Dict, List, Optional, Tuple
from power_effects import WorldPowers, POWER_EFFECTS
from power_mastery import ensure_mastery,mastery_distribution
from expanded_powers import EXPANDED_POWER_TREE, powers_of, set_powers, has_power, inherit_powers
from modern_society import run_modern, SOCIAL_POLICIES
from story_setup import init_story, tick_story, export_story, prepare_story, MAX_YEARS
from scenario_customization import apply_world
from arena_runner import run_cli as run_arena_cli, load_scenario

FIRST_NAMES = [
    "Aspen", "Jesse", "Cody", "Lennon", "Mel", "Leslie", "Darby", "Mason", "Alex",
    "Lee", "Skyler", "Terry", "Kel", "Hail", "Ellery", "Cory", "Randy", "Joey",
    "Kennedy", "Val", "Remington", "Casey", "Pat", "Jordan", "Emory", "Dana", "Noel",
    "Flynn", "Shelby", "Charlie", "Salem", "Devon", "Lane", "Campbell", "Kit", "Keegan",
    "Paris", "Zion", "Ainsley", "Tegan", "Cassidy", "Scotty", "Oakley", "Cameron",
    "Dale", "Dusty", "Rowan", "Parker", "Jay", "Payton", "Carson", "River", "Sutton",
    "Nova", "Dax", "Ren", "Quill", "Gorm", "Tova", "Halvar", "Vaxo", "Kino", "Bjorka",
    "Skurva", "Morgan", "Raleigh", "Jaime", "Gray", "Sterling", "Elliot", "Ramsay"
]

LAST_NAMES = [
    "Carroll", "Hill", "Stewart", "Wright", "West", "Barnes", "Green", "Quinlan",
    "Jackson", "Parker", "Torres", "Baker", "Walker", "Pierce", "Ward", "Matthews",
    "Sharp", "Ortiz", "Hamilton", "Morris", "Stone", "Ramos", "Henderson", "Carter",
    "Garner", "Kane", "Riley", "Howard", "Tucker", "Patel", "Church", "Harris",
    "Rhodes", "Wheeler", "Daniels", "Porter", "Edwards", "Lucas", "Ramirez", "Hudson",
    "Meyer", "Payne", "Conrad", "Doyle", "Boone"
]

SETTLEMENT_NAMES = [
    "Ashford", "Dunmore", "Lakeside", "Cedar Falls", "Brightwater", "Pinecrest",
    "Stillwater", "Amber Falls", "Cold Harbor", "Highgate"
]

POWER_TREE: Dict[str, Dict[str, Any]] = {
    "Fire": {
        "category": "Elemental",
        "mutations": ["Magma", "Plasma", "Smoke", "Solar Flare"],
        "combat": 1.45,
        "survival": 1.0,
        "longevity": 1.0,
        "stealth": 0.9,
        "hero_prefix": ["Flame", "Pyro", "Ember", "Solar"],
        "counter_tech": "Thermal Shields"
    },
    "Ice": {
        "category": "Elemental",
        "mutations": ["Water", "Weather", "Frost Armor", "Cryo-Stasis"],
        "combat": 1.35,
        "survival": 1.15,
        "longevity": 1.1,
        "stealth": 1.0,
        "hero_prefix": ["Chill", "Frost", "Glacier", "Winter"],
        "counter_tech": "Thermal Wards"
    },
    "Water": {
        "category": "Elemental",
        "mutations": ["Ice", "Weather", "Plant Control", "Healing"],
        "combat": 1.25,
        "survival": 1.35,
        "longevity": 1.05,
        "stealth": 1.0,
        "hero_prefix": ["Tide", "Wave", "River", "Aqua"],
        "counter_tech": "Desiccation Traps"
    },
    "Weather": {
        "category": "Elemental",
        "mutations": ["Lightning", "Wind", "Water", "Flight"],
        "combat": 1.45,
        "survival": 1.25,
        "longevity": 1.0,
        "stealth": 0.9,
        "hero_prefix": ["Twister", "Storm", "Gale", "Tempest"],
        "counter_tech": "Atmospheric Anchors"
    },
    "Lightning": {
        "category": "Elemental",
        "mutations": ["Magnetism", "Speed", "Weather", "Electromagnetism"],
        "combat": 1.50,
        "survival": 1.0,
        "longevity": 0.95,
        "stealth": 0.85,
        "hero_prefix": ["Volt", "Spark", "Thunder", "Shock"],
        "counter_tech": "Grounding Collars"
    },
    "Magnetism": {
        "category": "Elemental",
        "mutations": ["Metal", "Lightning", "Gravity", "Forcefields"],
        "combat": 1.48,
        "survival": 1.1,
        "longevity": 1.0,
        "stealth": 0.95,
        "hero_prefix": ["Magnet", "Iron", "Polar", "Lodestone"],
        "counter_tech": "Non-Ferrous Suppression Collars"
    },
    "Earth": {
        "category": "Elemental",
        "mutations": ["Metal", "Plant Control", "Durability", "Gravity"],
        "combat": 1.40,
        "survival": 1.30,
        "longevity": 1.1,
        "stealth": 0.9,
        "hero_prefix": ["Quake", "Stone", "Terra", "Crag"],
        "counter_tech": "Sonic Resonators"
    },
    "Wind": {
        "category": "Elemental",
        "mutations": ["Flight", "Weather", "Speed", "Sound"],
        "combat": 1.30,
        "survival": 1.15,
        "longevity": 1.0,
        "stealth": 1.15,
        "hero_prefix": ["Breeze", "Zephyr", "Aero", "Gale"],
        "counter_tech": "Vortex Nets"
    },
    "Plant Control": {
        "category": "Elemental",
        "mutations": ["Healing", "Poison", "Earth", "Regeneration"],
        "combat": 1.20,
        "survival": 1.65,
        "longevity": 1.15,
        "stealth": 1.1,
        "hero_prefix": ["Thorn", "Briar", "Grove", "Verdant"],
        "counter_tech": "Defoliant Sprayers"
    },
    "Poison": {
        "category": "Elemental",
        "mutations": ["Acid", "Plant Control", "Shadow", "Regeneration"],
        "combat": 1.42,
        "survival": 1.25,
        "longevity": 1.05,
        "stealth": 1.35,
        "hero_prefix": ["Venom", "Blight", "Toxin", "Viper"],
        "counter_tech": "Antitoxin Filters"
    },
    "Flight": {
        "category": "Physical",
        "mutations": ["Wind", "Speed", "Portals", "Telekinesis"],
        "combat": 1.35,
        "survival": 1.20,
        "longevity": 1.0,
        "stealth": 1.1,
        "hero_prefix": ["Sky", "Wing", "Hawk", "Cloud"],
        "counter_tech": "Long-Range Anti-Air Ballistae"
    },
    "Strength": {
        "category": "Physical",
        "mutations": ["Giant Size", "Durability", "Regeneration", "Shockwaves"],
        "combat": 1.60,
        "survival": 1.40,
        "longevity": 1.1,
        "stealth": 0.8,
        "hero_prefix": ["Brute", "Titan", "Might", "Iron"],
        "counter_tech": "Heavy Restraint Shackles"
    },
    "Giant Size": {
        "category": "Physical",
        "mutations": ["Strength", "Durability", "Earth", "Immortal"],
        "combat": 1.75,
        "survival": 1.35,
        "longevity": 1.05,
        "stealth": 0.5,
        "hero_prefix": ["Tower", "Colossus", "Atlas", "Peak"],
        "counter_tech": "Armored Anti-Giant Mech Suits"
    },
    "Durability": {
        "category": "Physical",
        "mutations": ["Regeneration", "Strength", "Immortal", "Metal"],
        "combat": 1.45,
        "survival": 1.60,
        "longevity": 1.25,
        "stealth": 0.9,
        "hero_prefix": ["Shield", "Bastion", "Granite", "Aegis"],
        "counter_tech": "Armor-Piercing Cannons"
    },
    "Speed": {
        "category": "Physical",
        "mutations": ["Time Slowing", "Lightning", "Phasing", "Flight"],
        "combat": 1.50,
        "survival": 1.25,
        "longevity": 0.95,
        "stealth": 1.25,
        "hero_prefix": ["Fast", "Flash", "Blur", "Dash"],
        "counter_tech": "Kinetic Trip-Fields"
    },
    "Shapeshifting": {
        "category": "Physical",
        "mutations": ["Animal Form", "Cloning", "Regeneration", "Invisibility"],
        "combat": 1.40,
        "survival": 1.45,
        "longevity": 1.15,
        "stealth": 1.40,
        "hero_prefix": ["Claw", "Morph", "Beast", "Shift"],
        "counter_tech": "Bio-Signature Scanners"
    },
    "Cloning": {
        "category": "Physical",
        "mutations": ["Shapeshifting", "Illusions", "Speed", "Telepathy"],
        "combat": 1.42,
        "survival": 1.30,
        "longevity": 1.0,
        "stealth": 1.20,
        "hero_prefix": ["Echo", "Mirror", "Double", "Legion"],
        "counter_tech": "Neural Sync Disruptors"
    },
    "Invisibility": {
        "category": "Mental",
        "mutations": ["Shadow", "Illusions", "Phasing", "Portals"],
        "combat": 1.25,
        "survival": 1.35,
        "longevity": 1.0,
        "stealth": 1.65,
        "hero_prefix": ["Ghost", "Fade", "Veil", "Phantom"],
        "counter_tech": "Infrared Illusion Detectors"
    },
    "Illusions": {
        "category": "Mental",
        "mutations": ["Mind Control", "Invisibility", "Shadow", "Telepathy"],
        "combat": 1.30,
        "survival": 1.25,
        "longevity": 1.0,
        "stealth": 1.55,
        "hero_prefix": ["Mirage", "Dream", "Trick", "Haze"],
        "counter_tech": "Optical Truth Detectors"
    },
    "Shadow": {
        "category": "Mental",
        "mutations": ["Invisibility", "Portals", "Necromancy", "Mind Control"],
        "combat": 1.42,
        "survival": 1.30,
        "longevity": 1.05,
        "stealth": 1.50,
        "hero_prefix": ["Dusk", "Night", "Umbra", "Shade"],
        "counter_tech": "High-Lumen Flood Arrays"
    },
    "Mind Control": {
        "category": "Mental",
        "mutations": ["Telepathy", "Illusions", "Empathy", "Shadow"],
        "combat": 1.55,
        "survival": 1.30,
        "longevity": 1.0,
        "stealth": 1.45,
        "hero_prefix": ["Mind", "Sovereign", "Will", "Crown"],
        "counter_tech": "Psionic Shielding Helmets"
    },
    "Telepathy": {
        "category": "Mental",
        "mutations": ["Mind Control", "Foresight", "Empathy", "Illusions"],
        "combat": 1.35,
        "survival": 1.40,
        "longevity": 1.05,
        "stealth": 1.50,
        "hero_prefix": ["Thought", "Mind", "Whisper", "Insight"],
        "counter_tech": "White-Noise Dampeners"
    },
    "Portals": {
        "category": "Arcane",
        "mutations": ["Time Slowing", "Flight", "Shadow", "Magic"],
        "combat": 1.48,
        "survival": 1.50,
        "longevity": 1.0,
        "stealth": 1.45,
        "hero_prefix": ["Rift", "Gate", "Warp", "Step"],
        "counter_tech": "Dimensional Anchors"
    },
    "Time Slowing": {
        "category": "Arcane",
        "mutations": ["Speed", "Immortal", "Portals", "Foresight"],
        "combat": 1.65,
        "survival": 1.55,
        "longevity": 1.35,
        "stealth": 1.30,
        "hero_prefix": ["Chrono", "Clock", "Hour", "Still"],
        "counter_tech": "Temporal Stasis Cells"
    },
    "Magic": {
        "category": "Arcane",
        "mutations": ["Necromancy", "Healing", "Portals", "Illusions"],
        "combat": 1.52,
        "survival": 1.40,
        "longevity": 1.15,
        "stealth": 1.20,
        "hero_prefix": ["Spell", "Rune", "Hex", "Arcane"],
        "counter_tech": "Runic Dampening Collars"
    },
    "Healing": {
        "category": "Vitality",
        "mutations": ["Regeneration", "Immortal", "Necromancy", "Plant Control"],
        "combat": 1.15,
        "survival": 1.75,
        "longevity": 1.30,
        "stealth": 1.0,
        "hero_prefix": ["Patch", "Mend", "Life", "Grace"],
        "counter_tech": "Biostatic Suppressors"
    },
    "Regeneration": {
        "category": "Vitality",
        "mutations": ["Immortal", "Durability", "Healing", "Necromancy"],
        "combat": 1.45,
        "survival": 1.85,
        "longevity": 1.60,
        "stealth": 1.0,
        "hero_prefix": ["Pulse", "Vital", "Ever", "Scar"],
        "counter_tech": "Cellular Inhibitor Cuffs"
    },
    "Immortal": {
        "category": "Vitality",
        "mutations": ["Regeneration", "Time Slowing", "Necromancy", "Durability"],
        "combat": 1.40,
        "survival": 1.95,
        "longevity": 10.0,
        "stealth": 1.0,
        "hero_prefix": ["Eternal", "Aeon", "Undying", "Crown"],
        "counter_tech": "Deep Vault Containment"
    },
    "Necromancy": {
        "category": "Vitality",
        "mutations": ["Magic", "Shadow", "Immortal", "Healing"],
        "combat": 1.58,
        "survival": 1.70,
        "longevity": 1.40,
        "stealth": 1.15,
        "hero_prefix": ["Bone", "Grave", "Soul", "Crypt"],
        "counter_tech": "Sanctified Iron Wards"
    }
}

POWER_TREE.update(EXPANDED_POWER_TREE)

FOUNDER_POWERS_EVOLUTION = [
    "Fire", "Ice", "Flight", "Strength", "Speed", "Invisibility", "Earth", "Lightning", "Water", "Healing"
]

FOUNDER_POWERS_MONARCH = [
    "Magnetism", "Illusions", "Giant Size", "Necromancy", "Poison", "Cloning",
    "Magic", "Mind Control", "Time Slowing", "Shapeshifting"
]


def pick_power_mutation(parent_power: str, rng: random.Random, mutation_rate: float) -> str:
    if parent_power not in POWER_TREE:
        return parent_power
    if rng.random() < mutation_rate:
        candidates = POWER_TREE[parent_power]["mutations"]
        chosen = rng.choice(candidates)
        if chosen in POWER_TREE:
            return chosen
    return parent_power


def generate_moniker(power: Optional[str], is_hero: bool, rng: random.Random) -> str:
    if not power or power not in POWER_TREE:
        prefix = rng.choice(["Iron", "Night", "watch", "Steel", "Crown"])
    else:
        prefix = rng.choice(POWER_TREE[power]["hero_prefix"])
    suffix = rng.choice(["heart", "shield", "guard", "wing"]) if is_hero else rng.choice(["bane", "fang", "claw", "wrath"])
    return f"{prefix}{suffix}"


def run_single_world_evolution_or_monarch_or_wheel(
    mode: str,
    seed: int,
    years: int,
    starting_pop: int,
    power_rate: float,
    mutation_rate: float,
    wheel_interval: int = 50,
    policy_override: Optional[str] = None,
    inject_event: Optional[str] = None,
    resume_state: Optional[Dict[str, Any]] = None,
    total_years: Optional[int] = None,
    scenario: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    rng = random.Random(seed)
    founder_pool = FOUNDER_POWERS_MONARCH if mode == "monarch" else FOUNDER_POWERS_EVOLUTION

    agents: Dict[int, Dict[str, Any]] = {}
    next_id = 1

    def create_agent(
        birth_year: int,
        age: int = 0,
        power: Optional[str] = None,
        parent_a: Optional[int] = None,
        parent_b: Optional[int] = None,
        last_name: Optional[str] = None,
        force_royal: bool = False
    ) -> Dict[str, Any]:
        nonlocal next_id
        aid = next_id
        next_id += 1
        fname = rng.choice(FIRST_NAMES)
        lname = last_name if last_name else rng.choice(LAST_NAMES)
        dreams = ["fame", "family", "order", "freedom", "knowledge"]
        agent = {
            "id": aid,
            "name": f"{fname} {lname}",
            "last_name": lname,
            "birth_year": birth_year,
            "age": age,
            "alive": True,
            "death_year": None,
            "death_cause": None,
            "power": power,
            "parent_a": parent_a,
            "parent_b": parent_b,
            "children": [],
            "spouse": None,
            "ambition": round(rng.uniform(0.1, 0.95), 2),
            "compassion": round(rng.uniform(0.1, 0.95), 2),
            "greed": round(rng.uniform(0.05, 0.60), 2),
            "curiosity": round(rng.uniform(0.1, 0.95), 2),
            "charisma": round(rng.uniform(0.1, 0.95), 2),
            "dream": rng.choice(dreams),
            "role": "citizen",
            "moniker": None,
            "mantle_gen": 1,
            "mentor_id": None,
            "pupils": [],
            "registered": False,
            "imprisoned_until": 0,
            "escape_count": 0,
            "arrested_by_id": None,
            "revenge_target_id": None,
            "loves_mentor": False,
            "secret_society": None,
            "royal_blood": force_royal,
            "kills": 0
        }
        ensure_mastery(agent,max(0,birth_year))
        agents[aid] = agent
        return agent

    # Initialize founders
    actual_start_pop = 24 if mode == "wheel" and starting_pop == 300 else starting_pop
    for i in range(actual_start_pop):
        founder_has_power = (mode != "wheel") and (rng.random() < power_rate)
        if mode == "monarch" and i == 0:
            founder_has_power = False
        p = rng.choice(founder_pool) if founder_has_power else None
        ag = create_agent(
            birth_year=-19,
            age=rng.randint(18, 32),
            power=p,
            force_royal=(i == 0)
        )
        if i == 0:
            if mode == "monarch":
                ag["name"] = "Aspen Carroll"
                ag["last_name"] = "Carroll"
                ag["age"] = 19
                ag["compassion"] = 0.72
                ag["ambition"] = 0.65
            ag["role"] = "ruler"

    ruler_id = 1
    initial_royal_family = agents[1]["last_name"]
    royal_family_lost_year: Optional[int] = None

    laws = {
        "royal_guard": (mode == "monarch"),
        "hero_charter": False,
        "registration_act": False,
        "gifted_draft": False,
        "power_ban": False
    }
    counter_tech: List[str] = []
    cannons_invented = False
    cannon_deaths = 0
    famine_deaths = 0
    combat_deaths = 0
    purge_deaths = 0
    active_cult = "Choir of the Dawn" if mode != "monarch" else "The Circle"
    towns = ["Ashford"]
    chronicle: List[Dict[str, Any]] = []
    min_pop = actual_start_pop
    min_pop_year = 0
    max_pop = actual_start_pop
    max_pop_year = 0
    revenge_sworn_count = 0
    revenge_fulfilled_count = 0
    revenge_turned_hero_count = 0
    hero_turned_villain_count = 0
    drama_score = 0

    def log_event(year: int, category: str, true_text: str, public_text: Optional[str] = None, weight: int = 2) -> None:
        nonlocal drama_score
        drama_score += weight
        chronicle.append({
            "year": year,
            "category": category,
            "true_event": true_text,
            "public_belief": public_text if public_text else true_text,
            "secret": public_text is not None and public_text != true_text
        })

    current_year = 0
    terminal = False
    if resume_state:
        saved = resume_state["variables"]
        agents = {int(k): v for k, v in saved["agents"].items()}
        next_id = saved["next_id"]
        ruler_id = saved["ruler_id"]
        initial_royal_family = saved["initial_royal_family"]
        royal_family_lost_year = saved["royal_family_lost_year"]
        laws = saved["laws"]
        counter_tech = saved["counter_tech"]
        cannons_invented = saved["cannons_invented"]
        cannon_deaths = saved["cannon_deaths"]
        famine_deaths = saved["famine_deaths"]
        combat_deaths = saved["combat_deaths"]
        purge_deaths = saved["purge_deaths"]
        active_cult = saved["active_cult"]
        towns = saved["towns"]
        chronicle = saved["chronicle"]
        min_pop = saved["min_pop"]
        min_pop_year = saved["min_pop_year"]
        max_pop = saved["max_pop"]
        max_pop_year = saved["max_pop_year"]
        revenge_sworn_count = saved["revenge_sworn_count"]
        revenge_fulfilled_count = saved["revenge_fulfilled_count"]
        revenge_turned_hero_count = saved["revenge_turned_hero_count"]
        hero_turned_villain_count = saved["hero_turned_villain_count"]
        drama_score = saved["drama_score"]
        current_year = resume_state["year"]
        terminal = resume_state.get("terminal", False)
        rng.setstate(restore_tuples(resume_state["rng_state"]))

    story = resume_state.get("story") if resume_state else init_story(agents, scenario, current_year, mode=mode)
    if scenario is not None and years > MAX_YEARS:
        raise ValueError("Tracked stories support at most10000 years")
    if mode == "monarch" and not resume_state:
        log_event(
            1, "governance",
            f"Monarch {agents[1]['name']} (crowned at {agents[1]['age']} with {agents[1]['power'] or 'no powers'}) established a 9-person non-powered Royal Guard paid from the treasury.",
            weight=3
        )

    # Apply initial policy override or injected event if provided
    if policy_override:
        if policy_override in laws:
            laws[policy_override] = True
            log_event(current_year + 1, "law", f"By decree, the state enacted {policy_override.replace('_', ' ').title()}.", weight=3)
        elif policy_override == "build_collars":
            counter_tech.append("Power-Dampening Collars")
        elif policy_override == "build_mechs":
            counter_tech.append("Armored Anti-Giant Mech Suits")
        elif policy_override == "build_cannons":
            cannons_invented = True
            if "Siege & Boulder Cannons" not in counter_tech:
                counter_tech.append("Siege & Boulder Cannons")
        elif policy_override == "royal_amnesty":
            freed = [a for a in agents.values() if a["alive"] and a["imprisoned_until"] > current_year]
            for a in freed:
                a["imprisoned_until"] = 0
            log_event(current_year + 1, "law", f"By decree, Royal Amnesty released {len(freed)} prisoners.", weight=3)
        if policy_override.startswith("build_"):
            log_event(current_year + 1, "tech", f"By decree, the state completed {policy_override.replace('_', ' ')}.", weight=3)

    powers = WorldPowers(agents, rng, resume_state.get("powers") if resume_state else None)
    if not resume_state:
        apply_world(scenario,powers,laws,counter_tech)
    injection_year = current_year + 1 if resume_state else 5
    for year in range(current_year + 1, years + 1) if not terminal else []:
        current_year = year
        living = [a for a in agents.values() if a["alive"]]
        if not living:
            log_event(year, "extinction", f"All human life in the world went extinct in Year {year}.", weight=10)
            break

        prepare_story(story, agents, year, mode=mode)
        powers.begin_year(year, create_agent, towns, chronicle, counter_tech)
        for event in powers.events:
            drama_score += 2
            chronicle.append(event)
        living = [a for a in agents.values() if a["alive"]]
        if not living:
            break
        pop_count = len(living)
        if pop_count < min_pop:
            min_pop = pop_count
            min_pop_year = year
        if pop_count > max_pop:
            max_pop = pop_count
            max_pop_year = year

        if pop_count > len(towns) * 180 and len(towns) < len(SETTLEMENT_NAMES):
            new_town = SETTLEMENT_NAMES[len(towns)]
            towns.append(new_town)
            log_event(year, "expansion", f"As population reached {pop_count}, settlers founded the new town of {new_town}.", weight=2)

        # Check Wheel spins in wheel mode or injected event
        trigger_wheel = (mode == "wheel" and year % wheel_interval == 0) or (year == injection_year and inject_event is not None)
        if trigger_wheel:
            spins = 2 if (mode == "wheel" and year >= (total_years or years) // 2) else 1
            for _ in range(spins):
                slice_choice = inject_event if (year == injection_year and inject_event) else rng.choice([
                    "meteor", "meteor", "villain_awakens", "gifted_generation",
                    "visitors", "demon_rift", "vampires", "immortal_tyrant",
                    "prophet", "famine", "golden_age", "nothing"
                ])
                if slice_choice == "meteor":
                    targets = rng.sample(living, min(len(living), rng.randint(4, 10)))
                    for t in targets:
                        if not t["power"]:
                            t["power"] = rng.choice(list(POWER_TREE.keys()))
                    log_event(year, "wheel", f"Wheel Spin: The Meteor of Power struck near {rng.choice(towns)}, awakening superpowers in {len(targets)} survivors!", weight=4)
                elif slice_choice == "gifted_generation":
                    for a in living:
                        if a["age"] < 12 and not a["power"]:
                            a["power"] = rng.choice(list(POWER_TREE.keys()))
                    log_event(year, "wheel", "Wheel Spin: A Gifted Generation began! Every child in the realm awakened a superpower.", weight=4)
                elif slice_choice == "visitors":
                    casualties = rng.sample(living, min(len(living) // 4, rng.randint(8, 45)))
                    for c in casualties:
                        c["alive"] = False
                        c["death_year"] = year
                        c["death_cause"] = "alien visitors"
                        combat_deaths += 1
                    log_event(year, "wheel", f"Wheel Spin: Silent craft of the Visitors descended, slaying {len(casualties)} people before turning on each other and collapsing.", weight=5)
                elif slice_choice == "demon_rift":
                    log_event(year, "wheel", f"Wheel Spin: A Demon Rift tore open near {towns[0]}, but the realm's heroes drove the demons back within the year.", weight=4)
                    if not laws["gifted_draft"]:
                        laws["gifted_draft"] = True
                        log_event(year, "law", "In response to the Demon Rift, the crown enacted the Gifted Draft, conscripting all heroes.", weight=3)
                elif slice_choice == "vampires":
                    vamp = rng.choice(living)
                    vamp["power"] = "Necromancy"
                    vamp["role"] = "villain"
                    vamp["moniker"] = "Bloodbane"
                    drained = rng.sample([x for x in living if x["id"] != vamp["id"]], min(len(living) // 5, rng.randint(5, 25)))
                    for d in drained:
                        d["alive"] = False
                        d["death_year"] = year
                        d["death_cause"] = "vampire outbreak"
                    log_event(year, "wheel", f"Wheel Spin: A Vampire strain awakened in {vamp['name']} ({vamp['moniker']}), draining {len(drained)} citizens.", weight=5)
                elif slice_choice == "immortal_tyrant":
                    tyrant = rng.choice(living)
                    tyrant["power"] = "Immortal"
                    tyrant["ambition"] = 0.99
                    tyrant["role"] = "villain"
                    tyrant["moniker"] = "Aeonbane"
                    log_event(year, "wheel", f"Wheel Spin: {tyrant['name']} stopped aging as an Immortal Tyrant ({tyrant['moniker']}) and vowed to rule forever.", weight=5)
                elif slice_choice == "prophet":
                    prophet = rng.choice(living)
                    prophet["charisma"] = 0.98
                    log_event(year, "wheel", f"Wheel Spin: A charismatic prophet ({prophet['name']}) galvanized {active_cult}, intensifying religious clashes.", weight=3)
                elif slice_choice == "golden_age":
                    log_event(year, "wheel", "Wheel Spin: A Golden Age of harvests and peace swept the continent, boosting births and repealing harsh fears.", weight=3)
                    if laws["registration_act"] and year > 200:
                        laws["registration_act"] = False
                        log_event(year, "law", f"During the Golden Age in Year {year}, humanity repealed the Power Registration Act!", weight=4)
                elif slice_choice == "villain_awakens":
                    villain = rng.choice(living)
                    villain["power"] = villain["power"] or rng.choice(list(POWER_TREE))
                    villain["role"] = "villain"
                    villain["ambition"] = 0.99
                    villain["compassion"] = 0.1
                    villain["moniker"] = generate_moniker(villain["power"], False, rng)
                    log_event(year, "wheel", f"Wheel Spin: {villain['name']} awakened as villain {villain['moniker']} ({villain['power']}).", weight=5)
                elif slice_choice == "famine":
                    victims = rng.sample(living, min(len(living), max(1, len(living) // 3)))
                    for victim in victims:
                        victim["alive"] = False
                        victim["death_year"] = year
                        victim["death_cause"] = "injected famine"
                    famine_deaths += len(victims)
                    log_event(year, "famine", f"Wheel Spin: A famine killed {len(victims)} citizens.", weight=5)
                elif slice_choice == "nothing":
                    log_event(year, "wheel", "Wheel Spin: The wheel landed on Nothing, granting humanity a rare breath of quiet.", weight=1)

        living = [a for a in agents.values() if a["alive"]]
        if not living:
            break

        # Ensure there is a living ruler
        if ruler_id not in agents or not agents[ruler_id]["alive"]:
            old_ruler = agents.get(ruler_id)
            heirs = [agents[cid] for cid in (old_ruler["children"] if old_ruler else []) if agents[cid]["alive"]]
            if heirs:
                heirs.sort(key=lambda x: x["age"], reverse=True)
                new_ruler = heirs[0]
            else:
                candidates = sorted(living, key=lambda x: x["charisma"] + x["ambition"], reverse=True)
                new_ruler = candidates[0]
            ruler_id = new_ruler["id"]
            new_ruler["role"] = "ruler"
            if not new_ruler["royal_blood"] and royal_family_lost_year is None:
                royal_family_lost_year = year
            log_event(year, "succession", f"{new_ruler['name']} (power: {new_ruler['power'] or 'None'}) ascended to the seat of {towns[0]}.", weight=2)

        ruler = agents[ruler_id]
        # Power changes people on the throne over decades
        if year % 15 == 0 and ruler["alive"]:
            ruler["greed"] = min(1.0, round(ruler["greed"] + 0.12, 2))
            if ruler["greed"] > 0.65 and any(has_power(a, 'Giant Size') and a["role"] == "hero" and a["alive"] for a in living):
                if "Armored Anti-Giant Mech Suits" not in counter_tech:
                    counter_tech.append("Armored Anti-Giant Mech Suits")
                    log_event(year, "tech", f"Growing wary and greedy on the throne, {ruler['name']} commissioned Armored Anti-Giant Mech Suits ('Hulkbusters') as a safeguard against the kingdom's own giant hero.", weight=5)

        # Age everyone & handle natural deaths / prison releases
        for a in list(living):
            if a.get("stasis_until", 0) < year:
                a["age"] += 1
            if a["imprisoned_until"] and year >= a["imprisoned_until"]:
                a["imprisoned_until"] = 0
            # Prison escape attempt for unregistered speedsters/invisibles
            if a["imprisoned_until"] > year and a["power"] in ("Speed", "Invisibility", "Portals") and rng.random() < 0.35:
                a["escape_count"] += 1
                catcher = agents.get(a["arrested_by_id"]) if a["arrested_by_id"] else None
                if catcher and catcher["alive"] and rng.random() < 0.75:
                    log_event(
                        year, "justice",
                        f"Speedster/escapee {a['name']} broke out of jail for the {a['escape_count']}th time, only to be recaptured again by unpowered officer {catcher['name']}!",
                        weight=4 if a["escape_count"] in (3, 8, 12) else 1
                    )
                else:
                    a["imprisoned_until"] = 0

            longevity_mult = max((POWER_TREE.get(p, {}).get("longevity", 1.0) for p in powers_of(a)), default=1.0)
            max_age = int(rng.randint(64, 84) * longevity_mult)
            if not has_power(a, 'Immortal') and a["age"] >= max_age:
                a["alive"] = False
                a["death_year"] = year
                a["death_cause"] = "old age"
                if a["role"] in ("hero", "villain", "ruler"):
                    log_event(year, "death", f"{a['name']} ({a['moniker'] or a['role']}, power: {a['power'] or 'None'}) died of old age at {a['age']}.", weight=3)
                    # Pass hero mantle if hero dies of old age
                    if a["role"] == "hero" and a["moniker"]:
                        successors = [agents[pid] for pid in a["pupils"] + a["children"] if agents[pid]["alive"] and agents[pid]["power"]]
                        if successors:
                            succ = successors[0]
                            succ["role"] = "hero"
                            succ["mantle_gen"] = a["mantle_gen"] + 1
                            succ["moniker"] = f"{a['moniker'].split(' ')[0]} {['II', 'III', 'IV', 'V'][min(succ['mantle_gen']-2, 3)]}"
                            if succ["revenge_target_id"] == a["id"]:
                                succ["revenge_target_id"] = None
                                revenge_turned_hero_count += 1
                                log_event(year, "legacy", f"Instead of taking vengeance on mentor {a['name']}, pupil {succ['name']} (power: {succ['power']}) took up their shield as {succ['moniker']}!", weight=6)
                            else:
                                log_event(year, "legacy", f"Following the death of {a['name']}, {succ['name']} (power: {succ['power']}) inherited the mantle as {succ['moniker']}.", weight=4)

        living = [a for a in agents.values() if a["alive"]]
        if not living:
            break

        # Role awakening: Heroes, Villains, Secret Societies, Mentorships
        active_heroes = [a for a in living if a["role"] == "hero" and a["imprisoned_until"] == 0 and not any(a.get(flag, 0) >= year for flag in ("stasis_until", "frozen_until", "stunned_until", "frightened_until"))]
        active_villains = [a for a in living if a["role"] == "villain" and a["imprisoned_until"] == 0 and not any(a.get(flag, 0) >= year for flag in ("stasis_until", "frozen_until", "stunned_until", "frightened_until"))]

        for a in living:
            if a["age"] >= 16 and a["role"] == "citizen" and a["imprisoned_until"] == 0:
                if a["power"]:
                    # Check if they become a hero or villain
                    if a["compassion"] >= 0.68 and len(active_heroes) < max(3, len(living) // 40) and rng.random() < 0.25:
                        a["role"] = "hero"
                        a["moniker"] = generate_moniker(a["power"], True, rng)
                        active_heroes.append(a)
                        log_event(year, "hero", f"{a['name']} (born with {a['power']}) began protecting {towns[0]} as the hero {a['moniker']}.", weight=3)
                        if mode == "monarch" and not laws["hero_charter"] and len(active_heroes) >= 2:
                            laws["hero_charter"] = True
                            log_event(year, "law", f"Monarch {ruler['name']} enacted the Hero Corps Charter, licensing and paying heroes like {a['moniker']} to defend the crown.", weight=4)
                    elif a["ambition"] >= 0.75 and a["compassion"] <= 0.45 and len(active_villains) < 4 and rng.random() < 0.18:
                        a["role"] = "villain"
                        a["moniker"] = generate_moniker(a["power"], False, rng)
                        active_villains.append(a)
                        log_event(year, "villain", f"{a['name']} (wielding {a['power']}) rose as the supervillain {a['moniker']}, hungry for {a['dream']}.", weight=3)
                        if a["spouse"] and agents[a["spouse"]]["alive"] and not a["secret_society"]:
                            a["secret_society"] = "The Circle"
                            log_event(
                                year, "secret",
                                f"{a['name']} secretly founded the underground cabal 'The Circle' while married to {agents[a['spouse']]['name']}.",
                                f"Rumors whispered of a shadowy group calling itself 'The Circle' in {towns[0]}.",
                                weight=4
                            )

            # Heroes take teenage pupils
            if a["role"] == "hero" and len(a["pupils"]) < 2 and rng.random() < 0.20:
                teen_candidates = [
                    t for t in living
                    if 13 <= t["age"] <= 19 and t["power"] and t["mentor_id"] is None and t["id"] != a["id"]
                ]
                if teen_candidates:
                    pupil = rng.choice(teen_candidates)
                    pupil["mentor_id"] = a["id"]
                    a["pupils"].append(pupil["id"])
                    pupil["loves_mentor"] = True
                    log_event(year, "mentorship", f"Hero {a['name']} ({a['moniker']}) took teenager {pupil['name']} (power: {pupil['power']}) under their wing as a pupil.", weight=2)

        # Villain / Challenger bids for the throne or rebellions
        if active_villains and rng.random() < 0.45:
            challenger = rng.choice(active_villains)
            # Does a hero intercept, or does the challenger fight the ruler/guard?
            avail_heroes = [h for h in active_heroes if h["imprisoned_until"] == 0 and h["id"] != challenger["id"]]
            if avail_heroes and (laws["hero_charter"] or laws["gifted_draft"] or rng.random() < 0.70):
                defender = max(avail_heroes, key=lambda h: POWER_TREE.get(h["power"], {}).get("combat", 1.0))
                h_score = POWER_TREE.get(defender["power"], {}).get("combat", 1.2) * rng.uniform(0.8, 1.3)
                v_score = POWER_TREE.get(challenger["power"], {}).get("combat", 1.2) * rng.uniform(0.8, 1.25)
                h_score *= powers.combat_multiplier(defender)
                v_score *= powers.combat_multiplier(challenger)
                # Infrastructure and actual fortifications now affect defense, with bounded bonuses.
                h_score *= 1 + min(.25, powers.r["fortifications"] * .01 + powers.r["guard"] * .02)
                if counter_tech:
                    h_score += 0.18
                if abs(h_score - v_score) < 0.12:
                    log_event(year, "battle", f"Hero {defender['name']} ({defender['moniker']}, {defender['power']}) clashed with villain {challenger['name']} ({challenger['moniker']}, {challenger['power']}), fighting to a standstill!", weight=3)
                elif h_score > v_score:
                    # Hero wins: arrest or kill?
                    if rng.random() < 0.45 and ruler["compassion"] > 0.40:
                        challenger["imprisoned_until"] = year + 25
                        challenger["arrested_by_id"] = defender["id"]
                        log_event(year, "justice", f"{defender['name']} ({defender['moniker']}) defeated {challenger['name']} ({challenger['moniker']}, {challenger['power']}) and locked them in a cell for 25 years.", weight=4)
                    else:
                        challenger["alive"] = False
                        challenger["death_year"] = year
                        challenger["death_cause"] = f"slain by hero {defender['moniker']}"
                        defender["kills"] += 1
                        combat_deaths += 1
                        relation_note = ""
                        if defender["spouse"] == challenger["id"]:
                            relation_note = " (their own beloved spouse!)"
                        elif any(pid in challenger["children"] for pid in defender["pupils"]):
                            relation_note = " (the parent of their own pupil!)"
                        log_event(year, "battle", f"Champion {defender['name']} ({defender['moniker']}) hunted down and killed challenger {challenger['name']} ({challenger['moniker']}, {challenger['power']}){relation_note}.", weight=6 if relation_note else 4)
                        # Kids of slain villain react: swear revenge!
                        for cid in challenger["children"]:
                            child = agents[cid]
                            if child["alive"]:
                                child["revenge_target_id"] = defender["id"]
                                revenge_sworn_count += 1
                                both_note = " while still loving them as a teacher" if child["mentor_id"] == defender["id"] else ""
                                log_event(year, "revenge", f"{child['name']} (child of slain {challenger['name']}) swore revenge on {defender['name']} ({defender['moniker']}){both_note}!", weight=5)
                    # Unlock counter-tech against challenger's power
                    ct = POWER_TREE.get(challenger["power"], {}).get("counter_tech")
                    if ct and ct not in counter_tech and powers.r["materials"] >= 5:
                        powers.r["materials"] -= 5
                        counter_tech.append(ct)
                        log_event(year, "tech", f"Studying {challenger['moniker']}'s {challenger['power']} ability, human engineers invented {ct}.", weight=3)
                else:
                    # Villain wins against hero!
                    defender["alive"] = False
                    defender["death_year"] = year
                    defender["death_cause"] = f"slain by {challenger['moniker']}"
                    challenger["kills"] += 1
                    combat_deaths += 1
                    pupil_note = " (their own former teacher!)" if challenger["mentor_id"] == defender["id"] else ""
                    log_event(year, "battle", f"Villain {challenger['name']} ({challenger['moniker']}) slew hero {defender['name']} ({defender['moniker']}){pupil_note} in combat!", weight=5)
                    # Pass hero mantle
                    successors = [agents[pid] for pid in defender["pupils"] + defender["children"] if agents[pid]["alive"] and agents[pid]["power"]]
                    if successors:
                        succ = successors[0]
                        succ["role"] = "hero"
                        succ["mantle_gen"] = defender["mantle_gen"] + 1
                        succ["moniker"] = f"{defender['moniker'].split(' ')[0]} {['II', 'III', 'IV', 'V'][min(succ['mantle_gen']-2, 3)]}"
                        if succ["revenge_target_id"] == defender["id"]:
                            succ["revenge_target_id"] = None
                            revenge_turned_hero_count += 1
                        log_event(year, "legacy", f"{succ['name']} picked up their fallen mentor's mantle as {succ['moniker']}!", weight=4)
            else:
                # Direct challenge against the throne
                if laws["royal_guard"] and not ruler["power"] and rng.random() < 0.72:
                    log_event(year, "battle", f"{challenger['name']} ({challenger['power']}) defeated Monarch {ruler['name']} in personal combat, but the 9 unpowered Royal Guards stood between {challenger['name']} and the throne, forcing them to flee!", weight=5)
                else:
                    # Coup succeeds or mob overthrows
                    old_r = ruler
                    ruler_id = challenger["id"]
                    challenger["role"] = "ruler"
                    if not challenger["royal_blood"] and royal_family_lost_year is None:
                        royal_family_lost_year = year
                    log_event(year, "coup", f"{challenger['name']} ({challenger['moniker']}, power: {challenger['power']}) seized the throne of {towns[0]} from {old_r['name']}!", weight=5)
                    # Registration Act or Power Ban reaction after a tyrant is overthrown by a mob
                    if rng.random() < 0.65 and len(living) > 30:
                        mob_size = min(len(living) - 2, rng.randint(15, 255))
                        challenger["alive"] = False
                        challenger["death_year"] = year
                        challenger["death_cause"] = "overthrown by a citizen mob"
                        combat_deaths += 1
                        log_event(year, "rebellion", f"A mob of {mob_size} citizens turned on tyrant {challenger['name']} ({challenger['moniker']}) and overthrew them within a year!", weight=5)
                        if not laws["registration_act"]:
                            laws["registration_act"] = True
                            log_event(year, "law", f"Following the fall of {challenger['moniker']}, the new leadership passed the Power Registration Act ('Sokovia Accords').", weight=5)
                            for g in living:
                                if g["power"] and g["alive"]:
                                    g["registered"] = (g["dream"] != "freedom" and rng.random() < 0.58)

        # Secret jealousy / unpowered assassination plot (especially in Monarch mode or late dynasties)
        if ruler["alive"] and year > 25 and rng.random() < 0.04:
            unpowered_plotters = [a for a in living if not a["power"] and a["id"] != ruler["id"] and a["age"] >= 18 and a["greed"] + a["ambition"] > 1.1]
            if unpowered_plotters:
                plotter = rng.choice(unpowered_plotters)
                assassin = rng.choice([a for a in living if not a["power"] and a["id"] not in (ruler["id"], plotter["id"])] or [plotter])
                old_ruler_name = ruler["name"]
                ruler["alive"] = False
                ruler["death_year"] = year
                ruler["death_cause"] = "secret assassination"
                combat_deaths += 1
                log_event(
                    year, "assassination",
                    f"Jealous conspirator {plotter['name']} (no powers) secretly hired {assassin['name']} (age {assassin['age']}, no powers) to murder Monarch {old_ruler_name}!",
                    f"Monarch {old_ruler_name} was found murdered by an unknown hand; the kingdom mourned in shock.",
                    weight=8
                )
                # Telepath hero uncovers the truth 2 years later
                telepaths = [a for a in living if a["power"] in ("Telepathy", "Mind Control") and a["role"] == "hero"]
                if telepaths:
                    detective = telepaths[0]
                    plotter["imprisoned_until"] = year + 25
                    log_event(
                        year, "investigation",
                        f"Mind-reading hero {detective['name']} ({detective['moniker']}) uncovered {plotter['name']}'s secret plot behind the murder of {old_ruler_name} and brought them to trial!",
                        weight=7
                    )

        # Royal Amnesty event if ruler has high compassion
        if ruler["alive"] and ruler["compassion"] > 0.78 and any(a["imprisoned_until"] > year for a in living) and rng.random() < 0.08:
            freed = [a for a in living if a["imprisoned_until"] > year]
            for f in freed:
                f["imprisoned_until"] = 0
            log_event(year, "law", f"Moved by mercy, Monarch {ruler['name']} signed a Royal Amnesty freeing all {len(freed)} prisoners in the realm!", weight=5)

        # Civil War & Cannons or Cult Purges (in Evolution and Wheel modes)
        if mode in ("evolution", "wheel") and year > 25 and len(living) > 80 and rng.random() < 0.055:
            if rng.random() < 0.45:
                # Cult Purge
                victims = rng.sample(living, min(len(living) // 5, rng.randint(12, 52)))
                for v in victims:
                    v["alive"] = False
                    v["death_year"] = year
                    v["death_cause"] = "religious purge"
                    purge_deaths += 1
                log_event(year, "purge", f"Sectarian conflict around {active_cult} erupted into a purge in {towns[0]}, claiming {len(victims)} lives.", weight=5)
            else:
                # Secessionist Civil War & Cannons
                rebel = max(living, key=lambda x: x["ambition"] + x["charisma"])
                if not cannons_invented and year > 80:
                    cannons_invented = True
                    counter_tech.append("Siege & Boulder Cannons")
                    log_event(year, "tech", f"When {rebel['name']} broke {rng.choice(towns)} away in a civil war, both sides deployed the first Siege Cannons in world history!", weight=6)
                casualties = rng.sample(living, min(len(living) // 4, rng.randint(10, 65)))
                for c in casualties:
                    c["alive"] = False
                    c["death_year"] = year
                    c["death_cause"] = "cannon fire in civil war" if cannons_invented else "civil war"
                    if cannons_invented:
                        cannon_deaths += 1
                    else:
                        combat_deaths += 1
                log_event(year, "war", f"Rebel leader {rebel['name']} sparked a breakaway civil war ({'fought with cannons' if cannons_invented else 'fought in the streets'}), killing {len(casualties)} people.", weight=4)

        living = [a for a in agents.values() if a["alive"]]
        if not living:
            break

        # Economy, Famine Bottlenecks & Reproduction
        carrying_capacity = 1900 if mode == "evolution" else 900
        famine_triggered = (
            (mode == "evolution" and year in (615, 740) and len(living) > 80)
            or (len(living) > carrying_capacity * 0.85 and rng.random() < 0.25)
            or (mode == "wheel" and rng.random() < 0.025 and len(living) > 60)
        )
        if powers.r["food"] <= 0 and len(living) > 20:
            famine_triggered = True
        if famine_triggered and powers.rng.random() < min(.75, powers.r["harvest_bonus"]):
            famine_triggered = False
        if famine_triggered:
            powers.r["food"] = max(0, powers.r["food"] - len(living) * .25)
            starved_list = []
            for a in living:
                surv_bonus = max((POWER_TREE.get(p, {}).get("survival", 1.0) for p in powers_of(a)), default=.72)
                # Kids and vitality-powered adults survive extreme famines better
                if a["age"] <= 14:
                    surv_bonus *= 1.35
                death_prob = max(0.08, min(0.88, 0.78 / surv_bonus))
                if rng.random() < death_prob and len(living) - len(starved_list) > 19:
                    a["alive"] = False
                    a["death_year"] = year
                    a["death_cause"] = "famine"
                    starved_list.append(a)
                    famine_deaths += 1
            remaining_pop = len(living) - len(starved_list)
            if starved_list:
                log_event(
                    year, "famine",
                    f"A catastrophic famine struck the realm: {len(starved_list)} people starved, reducing humanity to just {remaining_pop} survivors!",
                    weight=8 if remaining_pop <= 35 else 4
                )

        living = [a for a in agents.values() if a["alive"]]
        if not living:
            break

        # Marriage and Births
        eligible_adults = [a for a in living if 18 <= a["age"] <= 50 and a["imprisoned_until"] == 0 and a.get("clone_of") is None]
        unmarried = [a for a in eligible_adults if a["spouse"] is None]
        rng.shuffle(unmarried)
        for idx in range(0, len(unmarried) - 1, 2):
            if rng.random() < 0.35:
                p1, p2 = unmarried[idx], unmarried[idx + 1]
                p1["spouse"] = p2["id"]
                p2["spouse"] = p1["id"]

        birth_prob = 0.24 if len(living) < 250 else (0.14 if len(living) < 800 else 0.06)
        for a in eligible_adults:
            if a["spouse"] and agents[a["spouse"]]["alive"] and a["id"] < a["spouse"]:
                spouse = agents[a["spouse"]]
                if rng.random() < birth_prob:
                    # Determine child power via inheritance & mutation
                    child_power: Optional[str] = None
                    parent_powers = list(dict.fromkeys(powers_of(a) + powers_of(spouse)))
                    inherited = inherit_powers(a, spouse, rng, mutation_rate, pick_power_mutation)
                    if parent_powers:
                        child_power = inherited[0] if inherited else None
                    else:
                        # Spontaneous awakening (rare, e.g. Keegan in Monarch mode)
                        if rng.random() < (power_rate * 0.18):
                            child_power = rng.choice(list(POWER_TREE.keys()))
                    is_royal = a["royal_blood"] or spouse["royal_blood"]
                    inherited_lname = a["last_name"] if a["royal_blood"] else (spouse["last_name"] if spouse["royal_blood"] else a["last_name"])
                    child = create_agent(
                        birth_year=year,
                        age=0,
                        power=child_power,
                        parent_a=a["id"],
                        parent_b=spouse["id"],
                        last_name=inherited_lname,
                        force_royal=is_royal
                    )
                    set_powers(child, inherited if parent_powers else ([child_power] if child_power else []))
                    a["children"].append(child["id"])
                    spouse["children"].append(child["id"])
                    if child_power and child_power not in (a["power"], spouse["power"]):
                        if child_power in ("Immortal", "Necromancy", "Time Slowing", "Telepathy"):
                            log_event(
                                year, "mutation",
                                f"{child['name']} was born to {a['name']} ({a['power'] or 'no power'}) and {spouse['name']} ({spouse['power'] or 'no power'}) with a mutated power: {child_power}!",
                                weight=4
                            )

        arena_events = tick_story(story, agents, rng, year, mode=mode)
        chronicle.extend(arena_events)
        drama_score += len(arena_events) * 3

    powers.observe_deaths()
    if story is not None and story["last_tick"] < current_year:
        chronicle.extend(tick_story(story, agents, rng, current_year, mode=mode))
    living_end = [a for a in agents.values() if a["alive"]]
    powered_end = [a for a in living_end if a["power"]]
    power_share = round(len(powered_end) / len(living_end), 3) if living_end else 0.0

    # Determine outcome classification
    if not living_end:
        outcome = "extinction"
    elif len(powered_end) == 0:
        outcome = "powers_died_out"
    elif power_share >= 0.50:
        outcome = "powered_majority"
    else:
        outcome = "powered_minority"

    royal_kept_crown = (
        len(living_end) > 0
        and ruler_id in agents
        and agents[ruler_id]["alive"]
        and agents[ruler_id]["royal_blood"]
    )

    surviving_powers: Dict[str, int] = {}
    for a in powered_end:
        for p in powers_of(a):
            surviving_powers[p] = surviving_powers.get(p, 0) + 1

    state = {
        "year": current_year,
        "powers": powers.state,
        "story": story,
        "terminal": not living_end,
        "rng_state": rng.getstate(),
        "variables": {'agents': agents, 'next_id': next_id, 'ruler_id': ruler_id, 'initial_royal_family': initial_royal_family, 'royal_family_lost_year': royal_family_lost_year, 'laws': laws, 'counter_tech': counter_tech, 'cannons_invented': cannons_invented, 'cannon_deaths': cannon_deaths, 'famine_deaths': famine_deaths, 'combat_deaths': combat_deaths, 'purge_deaths': purge_deaths, 'active_cult': active_cult, 'towns': towns, 'chronicle': chronicle, 'min_pop': min_pop, 'min_pop_year': min_pop_year, 'max_pop': max_pop, 'max_pop_year': max_pop_year, 'revenge_sworn_count': revenge_sworn_count, 'revenge_fulfilled_count': revenge_fulfilled_count, 'revenge_turned_hero_count': revenge_turned_hero_count, 'hero_turned_villain_count': hero_turned_villain_count, 'drama_score': drama_score}
    }

    # Bonus drama score for wild bottlenecks + recovery + secret plots
    if 0 < min_pop <= 35 and len(living_end) >= 150:
        drama_score += 45
    if any(c["secret"] for c in chronicle):
        drama_score += 25
    if revenge_turned_hero_count >= 2:
        drama_score += 25

    return {
        "seed": seed,
        "mode": mode,
        "years_simulated": current_year,
        "agents": agents,
        "world_resources": powers.r,
        "power_usage": powers.state["usage"],
        "power_mastery_levels": mastery_distribution(living_end),
        "mastery_levels": {str(i): sum(a.get("mastery_level", 0) == i for a in living_end if a["power"]) for i in range(6)},
        "resurrections": powers.state["revivals"],
        "clones_created": powers.state["clones_created"],
        "engine_version": 4,
        "story": export_story(story),
        "_state": state,
        "final_population": len(living_end),
        "final_powered_count": len(powered_end),
        "combined_powered_agents": sum(len(powers_of(a)) > 1 for a in living_end),
        "final_power_share": power_share,
        "outcome": outcome,
        "royal_family_name": initial_royal_family,
        "royal_family_kept_crown": royal_kept_crown,
        "royal_family_lost_year": royal_family_lost_year,
        "min_population": min_pop,
        "min_population_year": min_pop_year,
        "max_population": max_pop,
        "max_population_year": max_pop_year,
        "cannon_deaths": cannon_deaths,
        "famine_deaths": famine_deaths,
        "combat_deaths": combat_deaths,
        "purge_deaths": purge_deaths,
        "laws_enacted": [k for k, v in laws.items() if v],
        "counter_tech_invented": counter_tech,
        "surviving_powers": surviving_powers,
        "revenge_sworn_count": revenge_sworn_count,
        "revenge_turned_hero_count": revenge_turned_hero_count,
        "drama_score": drama_score,
        "chronicle": chronicle
    }


TRIBE_SPECS: Dict[str, Dict[str, Any]] = {
    "speed": {
        "label": "Speedsters",
        "work_mult": 10.0,
        "research_mult": 8.0,
        "haul_mult": 1.5,
        "food_need": 10.0,
        "repro_rate": 0.34,
        "attack": 1.2,
        "hp": 0.5,
        "dodge": 0.70,
        "tech_tree": [
            (8, "Lookout Posts"),
            (15, "Relay Runners"),
            (24, "Kinetic Dynamos"),
            (35, "Speed Rails"),
            (44, "Shockwave Lances"),
            (55, "Storm Engine (Lightning Defense)")
        ]
    },
    "strength": {
        "label": "Brutes",
        "work_mult": 1.0,
        "research_mult": 0.65,
        "haul_mult": 10.0,
        "food_need": 3.0,
        "repro_rate": 0.085,
        "attack": 10.0,
        "hp": 10.0,
        "dodge": 0.05,
        "tech_tree": [
            (16, "Stone Quarries"),
            (110, "Martial Training Halls"),
            (143, "Irrigation Canals"),
            (166, "Iron Forges & Heavy Armor"),
            (168, "Boulder Cannons"),
            (231, "Quake Engine (Area Stomp)")
        ]
    },
    "intelligence": {
        "label": "Geniuses",
        "work_mult": 1.0,
        "research_mult": 10.0,
        "haul_mult": 0.85,
        "food_need": 1.6,
        "repro_rate": 0.14,
        "attack": 9.5,
        "hp": 1.2,
        "dodge": 0.15,
        "tech_tree": [
            (7, "Printing Labs"),
            (10, "Indoor Farms"),
            (19, "Floating Mag-Lev Roads"),
            (28, "Lightning Turrets"),
            (120, "Automated Harvesters"),
            (248, "Orbital Laser")
        ]
    }
}


def run_single_world_versus(
    seed: int,
    years: int,
    starting_pop: int,
    tribe_a_key: str,
    tribe_b_key: str,
    wall_year: int,
    resume_state: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    rng = random.Random(seed)
    spec_a = TRIBE_SPECS.get(tribe_a_key, TRIBE_SPECS["speed"])
    spec_b = TRIBE_SPECS.get(tribe_b_key, TRIBE_SPECS["strength"])

    pop_a = starting_pop
    pop_b = starting_pop
    food_a = starting_pop * 4.0
    food_b = starting_pop * 4.0
    tech_a: List[str] = []
    tech_b: List[str] = []
    buildings_a = 4
    buildings_b = 2
    losses_combat_a = 0
    losses_combat_b = 0
    losses_famine_a = 0
    losses_famine_b = 0
    buildings_burned_a = 0
    buildings_burned_b = 0

    chronicle: List[Dict[str, Any]] = []
    drama_score = 0

    def log_ev(yr: int, cat: str, text: str, w: int = 2) -> None:
        nonlocal drama_score
        drama_score += w
        chronicle.append({"year": yr, "category": cat, "true_event": text, "public_belief": text, "secret": False})

    leader_a = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
    leader_b = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
    log_ev(1, "founding", f"Year 0: {starting_pop} {spec_a['label']} (led by {leader_a}) and {starting_pop} {spec_b['label']} (led by {leader_b}) founded settlements on opposite sides of the Great Wall.", 2)

    war_end_year: Optional[int] = None

    current_year = 0
    terminal = False
    if resume_state:
        saved = resume_state["variables"]
        pop_a, pop_b = saved["pop_a"], saved["pop_b"]
        food_a, food_b = saved["food_a"], saved["food_b"]
        tech_a, tech_b = saved["tech_a"], saved["tech_b"]
        buildings_a, buildings_b = saved["buildings_a"], saved["buildings_b"]
        losses_combat_a, losses_combat_b = saved["losses_combat_a"], saved["losses_combat_b"]
        losses_famine_a, losses_famine_b = saved["losses_famine_a"], saved["losses_famine_b"]
        buildings_burned_a, buildings_burned_b = saved["buildings_burned_a"], saved["buildings_burned_b"]
        chronicle, drama_score = saved["chronicle"], saved["drama_score"]
        war_end_year = saved["war_end_year"]
        current_year = resume_state["year"]
        terminal = resume_state.get("terminal", False)
        rng.setstate(restore_tuples(resume_state["rng_state"]))

    for year in range(current_year + 1, years + 1) if not terminal else []:
        current_year = year
        # Unlock tech
        for req_yr, tname in spec_a["tech_tree"]:
            if year == req_yr and pop_a > 0:
                tech_a.append(tname)
                log_ev(year, "tech", f"{spec_a['label']} invented {tname}.", 3)
        for req_yr, tname in spec_b["tech_tree"]:
            if year == req_yr and pop_b > 0:
                tech_b.append(tname)
                log_ev(year, "tech", f"{spec_b['label']} invented {tname}.", 3)

        # Economy & Food Production
        prod_a = pop_a * (spec_a["work_mult"] ** 0.35) * (spec_a["haul_mult"] ** 0.45) * rng.uniform(0.85, 1.20)
        prod_b = pop_b * (spec_b["work_mult"] ** 0.35) * (spec_b["haul_mult"] ** 0.45) * rng.uniform(0.85, 1.20)
        if "Irrigation Canals" in tech_b:
            prod_b *= 1.35
        if "Indoor Farms" in tech_a and pop_a > 180 and "Automated Harvesters" not in tech_a:
            # Carrying bottleneck for slow geniuses when population blooms
            prod_a *= 0.68

        cons_a = pop_a * (spec_a["food_need"] ** 0.55)
        cons_b = pop_b * (spec_b["food_need"] ** 0.55)
        food_a = max(0.0, food_a + prod_a - cons_a)
        food_b = max(0.0, food_b + prod_b - cons_b)

        # Reproduction (requires 2 years of food reserve) or Famine
        if food_a >= cons_a * 1.6 and pop_a < 480:
            births_a = max(1, int(pop_a * spec_a["repro_rate"] * rng.uniform(0.6, 1.3)))
            pop_a += births_a
            buildings_a += max(0, births_a // 8)
        elif food_a <= 0.1 and pop_a > 0:
            starved = max(1, int(pop_a * rng.uniform(0.08, 0.28)))
            pop_a = max(0, pop_a - starved)
            losses_famine_a += starved
            if starved >= 15 or pop_a == 0:
                log_ev(year, "famine", f"Famine struck the {spec_a['label']}: {starved} starved (remaining: {pop_a}).", 4)

        if food_b >= cons_b * 1.6 and pop_b < 680:
            births_b = max(1, int(pop_b * spec_b["repro_rate"] * rng.uniform(0.6, 1.3)))
            pop_b += births_b
            buildings_b += max(0, births_b // 8)
        elif food_b <= 0.1 and pop_b > 0:
            starved = max(1, int(pop_b * rng.uniform(0.08, 0.28)))
            pop_b = max(0, pop_b - starved)
            losses_famine_b += starved
            if starved >= 15 or pop_b == 0:
                log_ev(year, "famine", f"Famine struck the {spec_b['label']}: {starved} starved (remaining: {pop_b}).", 4)

        if year == wall_year:
            log_ev(year, "war_start", f"Year {wall_year}: THE WALL FELL! {pop_a} {spec_a['label']} faced {pop_b} {spec_b['label']} in total war!", 6)

        if year >= wall_year and pop_a > 0 and pop_b > 0:
            raiders_a = max(1, int(pop_a * rng.uniform(0.10, 0.22)))
            raiders_b = max(1, int(pop_b * rng.uniform(0.10, 0.22)))

            # Combat resolution
            kills_by_a = int(raiders_a * (spec_a["attack"] ** 0.45) * (1.0 - spec_b["dodge"]) / (spec_b["hp"] ** 0.35) * rng.uniform(0.5, 1.4))
            kills_by_b = int(raiders_b * (spec_b["attack"] ** 0.45) * (1.0 - spec_a["dodge"]) / (spec_a["hp"] ** 0.35) * rng.uniform(0.5, 1.4))

            # Defense tech bonuses (Cannons / Quake Engine / Turrets)
            if "Boulder Cannons" in tech_b or "Quake Engine (Area Stomp)" in tech_b:
                kills_by_b += int(raiders_a * rng.uniform(0.25, 0.55))
            if "Lightning Turrets" in tech_a or "Shockwave Lances" in tech_a:
                kills_by_a += int(raiders_b * rng.uniform(0.20, 0.45))

            kills_by_a = min(pop_b, max(0, kills_by_a))
            kills_by_b = min(pop_a, max(0, kills_by_b))

            pop_b -= kills_by_a
            pop_a -= kills_by_b
            losses_combat_b += kills_by_a
            losses_combat_a += kills_by_b

            # Raids burning farm/storehouse buildings
            if spec_a["work_mult"] >= 5.0 or "Lightning Turrets" in tech_a:
                burned = rng.randint(1, 5)
                buildings_b = max(0, buildings_b - burned)
                buildings_burned_b += burned
                food_b = max(0.0, food_b - burned * 12.0)

            if year == wall_year or year % 25 == 0:
                log_ev(
                    year, "battle",
                    f"War Update (Year {year}): {spec_a['label']} ({pop_a} alive) vs {spec_b['label']} ({pop_b} alive). Casualties so far: {losses_combat_a + losses_famine_a} {spec_a['label']}, {losses_combat_b + losses_famine_b} {spec_b['label']}.",
                    3
                )

            if pop_a == 0 or pop_b == 0:
                war_end_year = year
                winner_label = spec_a["label"] if pop_a > 0 else (spec_b["label"] if pop_b > 0 else "Draw")
                log_ev(
                    year, "victory",
                    f"Year {year} ({year - wall_year} years after the wall fell): The war ended! Winner: {winner_label}!",
                    8
                )
                break

    if pop_a > 0 and pop_b == 0:
        winner = tribe_a_key
    elif pop_b > 0 and pop_a == 0:
        winner = tribe_b_key
    else:
        winner = "draw"

    state = {
        "year": current_year,
        "terminal": war_end_year is not None,
        "rng_state": rng.getstate(),
        "variables": {'pop_a': pop_a, 'pop_b': pop_b, 'food_a': food_a, 'food_b': food_b, 'tech_a': tech_a, 'tech_b': tech_b, 'buildings_a': buildings_a, 'buildings_b': buildings_b, 'losses_combat_a': losses_combat_a, 'losses_combat_b': losses_combat_b, 'losses_famine_a': losses_famine_a, 'losses_famine_b': losses_famine_b, 'buildings_burned_a': buildings_burned_a, 'buildings_burned_b': buildings_burned_b, 'chronicle': chronicle, 'drama_score': drama_score, 'war_end_year': war_end_year}
    }
    war_duration = (war_end_year - wall_year) if war_end_year else (current_year - wall_year)
    if war_duration > 90:
        drama_score += 35

    return {
        "seed": seed,
        "mode": "versus",
        "_state": state,
        "years_simulated": current_year,
        "food_reserves": {"a": food_a, "b": food_b},
        "tribe_a": tribe_a_key,
        "tribe_b": tribe_b_key,
        "wall_year": wall_year,
        "war_duration_years": max(0, war_duration),
        "winner": winner,
        "final_pop_a": pop_a,
        "final_pop_b": pop_b,
        "losses_combat_a": losses_combat_a,
        "losses_famine_a": losses_famine_a,
        "losses_combat_b": losses_combat_b,
        "losses_famine_b": losses_famine_b,
        "buildings_burned_a": buildings_burned_a,
        "buildings_burned_b": buildings_burned_b,
        "tech_a": tech_a,
        "tech_b": tech_b,
        "drama_score": drama_score,
        "chronicle": chronicle
    }


def format_markdown_report(summary: Dict[str, Any]) -> str:
    mode = summary["mode"]
    agg = summary["aggregate_stats"]
    feat = summary["featured_world"]
    lines: List[str] = []
    lines.append(f"# Superpower World Simulation Report ({mode.upper()} Mode)")
    lines.append("")
    lines.append(f"- **Monte Carlo Runs Executed**: {summary['runs']}")
    lines.append(f"- **Simulated Years per World**: {summary['years']}")
    lines.append(f"- **Featured World Selected**: World #{feat['world_index']} (Seed `{feat['seed']}`, Drama Score `{feat['drama_score']}`)")
    lines.append("")
    lines.append(f"## 1. {summary['runs']}-World Macro Statistics")
    lines.append("")
    for k, v in agg.items():
        lines.append(f"- **{k.replace('_', ' ').title()}**: {v}")
    lines.append("")
    lines.append(f"## 2. Featured World #{feat['world_index']} Summary")
    lines.append("")
    if mode == "versus":
        lines.append(f"- **Matchup**: {feat['tribe_a'].title()} vs. {feat['tribe_b'].title()} (Wall fell in Year {feat['wall_year']})")
        lines.append(f"- **Winner**: {feat['winner'].title()} (War lasted {feat['war_duration_years']} years)")
        lines.append(f"- **{feat['tribe_a'].title()} Losses**: {feat['losses_combat_a']} combat, {feat['losses_famine_a']} famine (Final pop: {feat['final_pop_a']})")
        lines.append(f"- **{feat['tribe_b'].title()} Losses**: {feat['losses_combat_b']} combat, {feat['losses_famine_b']} famine (Final pop: {feat['final_pop_b']})")
    elif mode == "modern":
        lines.append(f"- **Leadership System**: {feat.get('leadership_system','elections')}")
        lines.append(f"- **Society Outcome**: {feat['society_outcome']}")
        lines.append(f"- **Final Population**: {feat['final_population']} ({feat['final_powered_count']} powered)")
        lines.append(f"- **Freedom / Election Integrity / Press Freedom**: {feat['freedom']:.1f} / {feat['election_integrity']:.1f} / {feat['press_freedom']:.1f}")
        lines.append(f"- **Democracy Survived**: {feat['democracy_survived']}")
        lines.append(f"- **Elections / Free Elections / Peaceful Transfers**: {feat['elections_held']} / {feat['free_elections']} / {feat['peaceful_transfers']}")
        lines.append(f"- **Unemployment / Phone Ownership**: {feat['unemployment_rate']:.1%} / {feat['phone_ownership_rate']:.1%}")
        lines.append(f"- **Ranking-App Opportunities / Media Reports**: {feat['app_opportunities']} / {feat['media_reports']}")
        lines.append(f"- **Ranking Leaderboard**: {json.dumps(feat['ranking_leaderboard'])}")
        lines.append(f"- **Mastery Levels**: {json.dumps(feat['mastery_levels'])}")
        net=feat.get("internet", {}); inst=feat.get("institutions", {})
        lines.append(f"- **Internet Posts / Viral / Fakes / Corrections**: {net.get('posts_created',0)} / {net.get('viral_posts',0)} / {net.get('fakes_created',0)} / {net.get('corrections',0)}")
        lines.append(f"- **Courts / Convictions / Accidents / Hospital Admissions**: {inst.get('trials',0)} / {inst.get('convictions',0)} / {inst.get('child_accidents',0)} / {inst.get('hospital_admissions',0)}")
        lines.append(f"- **Protests / Impeachments**: {inst.get('protests',0)} / {inst.get('impeachments',0)}")
    else:
        lines.append(f"- **Outcome Category**: `{feat['outcome']}`")
        lines.append(f"- **Final Population**: {feat['final_population']} ({feat['final_powered_count']} gifted, {round(feat['final_power_share']*100, 1)}% of humanity)")
        lines.append(f"- **Population Extremes**: Peak of {feat['max_population']} (Year {feat['max_population_year']}), Bottleneck low of {feat['min_population']} (Year {feat['min_population_year']})")
        dynasty_status = "Kept the crown to the end" if feat["royal_family_kept_crown"] else f"Lost the crown in Year {feat['royal_family_lost_year']}"
        lines.append(f"- **Royal Dynasty ({feat['royal_family_name']})**: {dynasty_status}")
        lines.append(f"- **Mortality Breakdown**: {feat['famine_deaths']} famine deaths, {feat['cannon_deaths']} cannon deaths, {feat['combat_deaths']} superhuman combat deaths, {feat['purge_deaths']} purge deaths")
        lines.append(f"- **Laws Enacted**: {', '.join(feat['laws_enacted']) or 'None'}")
        lines.append(f"- **Counter-Tech Invented**: {', '.join(feat['counter_tech_invented']) or 'None'}")
        lines.append(f"- **Revenge & Legacy Arcs**: {feat['revenge_sworn_count']} swore revenge, {feat['revenge_turned_hero_count']} abandoned vengeance to inherit a hero mantle")
        lines.append(f"- **Surviving Powers at Final Year**: {json.dumps(feat['surviving_powers'])}")
        lines.append(f"- **Actual Power Actions**: {json.dumps(feat.get('power_usage', {}))}")
        lines.append(f"- **Resurrections / Clones**: {feat.get('resurrections', 0)} / {feat.get('clones_created', 0)}")
        lines.append(f"- **World Resources**: {json.dumps(feat.get('world_resources', {}))}")
        lines.append(f"- **Mastery Levels**: {json.dumps(feat.get('mastery_levels', {}))}")
    lines.append("")
    story = feat.get("story")
    if story:
        lines.extend(["", "## Main characters and arena events"])
        for record in story["main_characters"].values():
            latest = record["timeline"][-1]
            lines.append(f"- {record['name']} (id {record['id']}): tracked across {len(record['timeline'])} checkpoints; alive={latest['alive']}, age={latest['age']}, role={latest['role']}, powers={latest['powers']}, arena appearances={len(record['encounter_ids'])}.")
            lines.append('  Per-power mastery: '+', '.join(f"{p} level {r['level']} ({r['xp']} XP)" for p,r in latest.get('power_mastery',{}).items() if p in latest['powers']))
        for aid, goals in story.get("goals", {}).items():
            for goal in goals:
                state=goal["state"]
                lines.append(f"- Character {aid} goal {goal['id']} ({goal['type']}): {state['status']}; measured progress={state['progress']}; {state.get('reason') or ''}")
        lines.append(f"- Rival duels/tournaments: {len(story['encounters'])}; explicit practice awards: {story['practice_awards']}. Full annual histories and round traces are in JSON.")
    lines.append(f"## 3. Chronicle of Major Events (World #{feat['world_index']})")
    lines.append("")
    for ev in feat["chronicle"]:
        sec_tag = f" *(Public believed: {ev['public_belief']})*" if ev.get("secret") else ""
        lines.append(f"- **Year {ev['year']} [{ev['category'].upper()}]**: {ev['true_event']}{sec_tag}")
    return "\n".join(lines) + "\n"


POLICIES = ["registration_act", "hero_charter", "gifted_draft", "power_ban", "royal_amnesty", "build_collars", "build_mechs", "build_cannons", "royal_guard"] + SOCIAL_POLICIES
EVENTS = ["meteor", "visitors", "demon_rift", "vampires", "famine", "golden_age", "gifted_generation", "villain_awakens", "immortal_tyrant", "prophet", "nothing"]


def restore_tuples(value: Any) -> Any:
    """Restore the nested tuple structure used by random.Random.setstate."""
    return tuple(restore_tuples(x) for x in value) if isinstance(value, list) else value


def main() -> None:
    parser = argparse.ArgumentParser(description="Run original superpower world simulations.")
    parser.add_argument("--list-powers", action="store_true", help="Print each defined power and its implemented action, then exit")
    parser.add_argument("--mode", choices=["evolution", "monarch", "wheel", "versus", "modern", "duel", "tournament"], default="evolution")
    parser.add_argument("--runs", type=int, default=100)
    parser.add_argument("--years", type=int, default=None)
    parser.add_argument("--pop", type=int, default=None)
    parser.add_argument("--power-rate", type=float, default=0.10)
    parser.add_argument("--mutation-rate", type=float, default=0.35)
    parser.add_argument("--tribe-a", choices=["speed", "strength", "intelligence"], default="speed")
    parser.add_argument("--tribe-b", choices=["speed", "strength", "intelligence"], default="strength")
    parser.add_argument("--wall-year", type=int, default=275)
    parser.add_argument("--wheel-interval", type=int, default=50)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--select-world", default="auto")
    parser.add_argument("--policy-override", choices=POLICIES, default=None)
    parser.add_argument("--inject-event", choices=EVENTS, default=None)
    parser.add_argument("--checkpoint-year", type=int, default=None)
    parser.add_argument("--save-state", default=None)
    parser.add_argument("--load-state", default=None)
    parser.add_argument("--scenario", default=None, help="Validated character/rival/main-character scenario JSON")
    parser.add_argument("--fighter-a", default=None, help="Arena character key or world id")
    parser.add_argument("--fighter-b", default=None, help="Arena character key or world id")
    parser.add_argument("--entrants", nargs="+", default=None, help="Tournament keys or world ids")
    parser.add_argument("--max-rounds", type=int, default=30)
    parser.add_argument("--commit-results", action="store_true", help="Explicitly commit bounded arena consequences to a saved world; requires save-state and one run")
    parser.add_argument("--output-json", default="sim_output.json")
    parser.add_argument("--output-report", default="sim_report.md")
    args = parser.parse_args()

    if args.list_powers:
        print(json.dumps(POWER_EFFECTS, indent=2))
        return
    if args.mode in ("duel", "tournament"):
        try:
            run_arena_cli(args, POWER_TREE)
        except (ValueError, TypeError, KeyError, OSError) as exc:
            parser.error(str(exc))
        return
    if args.commit_results or args.fighter_a is not None or args.fighter_b is not None or args.entrants is not None:
        parser.error("Arena selection/commit options require duel or tournament mode")
    if args.load_state and args.scenario is not None:
        parser.error("A saved world preserves its configured scenario; do not supply a replacement scenario on resume")
    loaded = None
    if args.load_state:
        try:
            with open(args.load_state, encoding="utf-8") as f:
                loaded = json.load(f)
            if loaded.get("schema_version") not in (1, 2, 3, 4) or "config" not in loaded or "state" not in loaded:
                raise ValueError("Expected a version-1 through version-4 full world state; legacy summary snapshots cannot be resumed")
            required = {"mode", "years", "pop", "power_rate", "mutation_rate", "tribe_a", "tribe_b", "wall_year", "wheel_interval", "seed"}
            if not required <= set(loaded["config"]) or set(loaded["config"]) - required - {"scenario"}:
                raise ValueError("Invalid saved configuration fields")
            for key, value in loaded["config"].items():
                setattr(args, key, value)
            args.runs = 1
        except (OSError, ValueError, TypeError) as exc:
            parser.error(f"Cannot load state: {exc}")
    try:
        scenario_data = load_scenario(args.scenario, POWER_TREE)
        if scenario_data is not None and not loaded:
            explicit={token.split("=",1)[0] for token in sys.argv[1:] if token.startswith("--")}
            for key,value in scenario_data.get("settings",{}).items():
                if "--"+key.replace("_","-") not in explicit:
                    setattr(args,key,value)
    except (OSError, ValueError, TypeError) as exc:
        parser.error("Invalid scenario: " + str(exc))
    if args.mode == "versus" and scenario_data is not None:
        parser.error("Individual characters and rivals require an individual-agent mode, not aggregate versus")
    if args.runs < 1 or args.pop is not None and args.pop < 1:
        parser.error("runs and population must be positive")
    if not 0 <= args.power_rate <= 1 or not 0 <= args.mutation_rate <= 1:
        parser.error("power-rate and mutation-rate must be between 0 and 1")
    if args.wheel_interval < 1 or args.wall_year < 1:
        parser.error("wheel-interval and wall-year must be positive")
    if args.mode != "modern" and args.policy_override in SOCIAL_POLICIES:
        parser.error("social policies require modern mode")
    if args.mode == "versus" and (args.policy_override or args.inject_event):
        parser.error("policies and injected events apply only to evolution, monarch, and wheel modes")
    if args.mode == "versus" and args.tribe_a == args.tribe_b:
        parser.error("choose distinct tribes for versus mode")

    default_years = {"evolution": 1000, "monarch": 100, "wheel": 1000, "versus": 450, "modern": 100}[args.mode]
    horizon = args.years if args.years is not None else default_years
    sim_years = args.checkpoint_year if args.checkpoint_year is not None else horizon
    if scenario_data is not None and horizon > MAX_YEARS:
        parser.error("Tracked stories support at most10000 years")
    if sim_years < 1 or horizon < 1 or sim_years > horizon:
        parser.error("years must be positive and checkpoint-year must be within the configured horizon")
    if loaded and sim_years <= loaded["state"]["year"]:
        parser.error("resume checkpoint must be later than the saved year")
    default_pop = 20 if args.mode == "versus" else (24 if args.mode == "wheel" else 300)
    sim_pop = args.pop if args.pop else default_pop

    if scenario_data is not None and not loaded:
        effective_pop = 24 if args.mode == "wheel" and sim_pop == 300 else sim_pop
        try:
            init_story({i:{"id":i,"name":str(i),"age":25,"alive":True,"role":"citizen"} for i in range(1,effective_pop+1)}, scenario_data, mode=args.mode)
        except ValueError as exc:
            parser.error("Invalid scenario references: " + str(exc))
    all_worlds: List[Dict[str, Any]] = []
    selected_payload = None
    try:
        selected_index = None if args.select_world == "auto" else max(1, min(args.runs, int(args.select_world)))
    except ValueError:
        parser.error("select-world must be auto or an integer")
    for i in range(args.runs):
        w_seed = args.seed + i * 97
        if args.mode == "modern":
            res = run_modern(w_seed, sim_years, sim_pop, args.power_rate, args.mutation_rate,
                             POWER_TREE, pick_power_mutation, args.policy_override, args.inject_event,
                             loaded["state"] if loaded else None, scenario=scenario_data)
        elif args.mode == "versus":
            res = run_single_world_versus(
                seed=w_seed,
                years=sim_years,
                starting_pop=sim_pop,
                tribe_a_key=args.tribe_a,
                tribe_b_key=args.tribe_b,
                wall_year=args.wall_year,
                resume_state=loaded["state"] if loaded else None
            )
        else:
            res = run_single_world_evolution_or_monarch_or_wheel(
                mode=args.mode,
                seed=w_seed,
                years=sim_years,
                starting_pop=sim_pop,
                power_rate=args.power_rate,
                mutation_rate=args.mutation_rate,
                wheel_interval=args.wheel_interval,
                policy_override=args.policy_override,
                inject_event=args.inject_event,
                resume_state=loaded["state"] if loaded else None,
                total_years=horizon,
                scenario=scenario_data
            )
        res["world_index"] = loaded.get("world_index", 1) if loaded else i + 1
        if (selected_index == i + 1 or
                selected_index is None and (selected_payload is None or res["drama_score"] > selected_payload["drama_score"])):
            selected_payload = res
        all_worlds.append({k: v for k, v in res.items() if k not in ("agents", "_state", "chronicle")})

    # Compute aggregate stats across all runs
    if args.mode == "versus":
        wins_a = sum(1 for w in all_worlds if w["winner"] == args.tribe_a)
        wins_b = sum(1 for w in all_worlds if w["winner"] == args.tribe_b)
        draws = sum(1 for w in all_worlds if w["winner"] == "draw")
        durations = sorted(w["war_duration_years"] for w in all_worlds)
        median_dur = durations[len(durations) // 2] if durations else 0
        agg_stats = {
            f"{args.tribe_a}_wins": f"{wins_a}/{args.runs} ({round(wins_a*100/args.runs, 1)}%)",
            f"{args.tribe_b}_wins": f"{wins_b}/{args.runs} ({round(wins_b*100/args.runs, 1)}%)",
            "draws_or_frozen_wars": f"{draws}/{args.runs}",
            "median_war_duration_years": median_dur
        }
    elif args.mode == "modern":
        agg_stats = {
            "democracy_survived_worlds": f"{sum(w['democracy_survived'] for w in all_worlds)}/{args.runs}",
            "free_democracy_worlds": sum(w["society_outcome"] == "free_democracy" for w in all_worlds),
            "constrained_democracy_worlds": sum(w["society_outcome"] == "constrained_democracy" for w in all_worlds),
            "authoritarian_worlds": sum(w["society_outcome"] == "authoritarian" for w in all_worlds),
            "rank_government_worlds": sum(w["society_outcome"] == "rank_government" for w in all_worlds),
            "tournament_government_worlds": sum(w["society_outcome"] == "tournament_government" for w in all_worlds),
            "extinct_worlds": sum(w["society_outcome"] == "extinction" for w in all_worlds),
            "mean_final_freedom": round(sum(w["freedom"] for w in all_worlds)/args.runs, 2),
            "mean_election_integrity": round(sum(w["election_integrity"] for w in all_worlds)/args.runs, 2),
            "mean_government_tournaments": round(sum(w["government"].get("government_tournaments_held",0) for w in all_worlds)/args.runs,2),
            "mean_leadership_changes": round(sum(w["government"].get("leadership_changes",0) for w in all_worlds)/args.runs,2),
            "mean_elections_held": round(sum(w["elections_held"] for w in all_worlds)/args.runs, 2),
            "mean_peaceful_transfers": round(sum(w["peaceful_transfers"] for w in all_worlds)/args.runs, 2),
            "mean_unemployment_rate": round(sum(w["unemployment_rate"] for w in all_worlds)/args.runs, 4),
            "mean_app_opportunities": round(sum(w["app_opportunities"] for w in all_worlds)/args.runs, 2)
        }
    else:
        ext_count = sum(1 for w in all_worlds if w["outcome"] == "extinction")
        died_out = sum(1 for w in all_worlds if w["outcome"] == "powers_died_out")
        maj_count = sum(1 for w in all_worlds if w["outcome"] == "powered_majority")
        min_count = sum(1 for w in all_worlds if w["outcome"] == "powered_minority")
        royal_kept = sum(1 for w in all_worlds if w["royal_family_kept_crown"])
        reg_passed = sum(1 for w in all_worlds if "registration_act" in w["laws_enacted"])
        agg_stats = {
            "powers_died_out_worlds": f"{died_out}/{args.runs}",
            "powered_majority_worlds": f"{maj_count}/{args.runs}",
            "powered_minority_worlds": f"{min_count}/{args.runs}",
            "total_extinction_worlds": f"{ext_count}/{args.runs}",
            "founding_royal_family_kept_crown": f"{royal_kept}/{args.runs}",
            "registration_act_passed_worlds": f"{reg_passed}/{args.runs}"
        }

    if args.mode != "versus":
        agg_stats["completed_character_goals"] = sum(sum(g["state"]["status"] == "completed" for goals in (w.get("story") or {}).get("goals", {}).values() for g in goals) for w in all_worlds)
        agg_stats["world_rival_duels"] = sum(sum(e["kind"] == "rival_duel" for e in (w.get("story") or {}).get("encounters", [])) for w in all_worlds)
        agg_stats["world_tournaments"] = sum(sum(e["kind"] == "tournament" for e in (w.get("story") or {}).get("encounters", [])) for w in all_worlds)
        mastery_count = sum(sum(w.get("mastery_levels", {}).values()) for w in all_worlds)
        mastery_sum = sum(sum(int(level) * count for level, count in w.get("mastery_levels", {}).items()) for w in all_worlds)
        agg_stats["mean_combined_powered_agents"] = round(sum(w.get("combined_powered_agents", 0) for w in all_worlds) / args.runs, 3)
        per_power_count=sum(sum(w.get("power_mastery_levels",{}).values()) for w in all_worlds)
        per_power_sum=sum(sum(int(level)*count for level,count in w.get("power_mastery_levels",{}).items()) for w in all_worlds)
        agg_stats["pooled_held_power_mean_mastery"]=round(per_power_sum/per_power_count,3) if per_power_count else 0
        agg_stats["pooled_powered_agent_mean_mastery"] = round(mastery_sum / mastery_count, 3) if mastery_count else 0
    if args.mode == "modern":
        for field in ("posts_created", "viral_posts", "fakes_created", "corrections", "grievance_turns", "dating_matches", "bullying_events"):
            agg_stats["mean_internet_" + field] = round(sum(w.get("internet", {}).get(field, 0) for w in all_worlds) / args.runs, 3)
        for field in ("convictions", "licenses_issued", "child_accidents", "hospital_admissions", "hospital_waitlisted", "epidemic_years", "quarantines", "healer_burnouts", "protests", "rank_protests", "impeachments", "sports_events", "self_defense_acquittals"):
            agg_stats["mean_institutions_" + field] = round(sum(w.get("institutions", {}).get(field, 0) for w in all_worlds) / args.runs, 3)
        for field in ("press_freedom", "phone_ownership_rate", "media_reports", "democratic_years", "networking_invitations"):
            agg_stats["mean_" + field] = round(sum(w[field] for w in all_worlds) / args.runs, 3)
    featured = selected_payload

    summary_payload = {
        "mode": args.mode,
        "runs": args.runs,
        "years": sim_years,
        "aggregate_stats": agg_stats,
        "featured_world": featured
    }

    featured_state = featured.pop("_state")
    if args.save_state:
        config = {k: getattr(args, k) for k in ("mode", "years", "pop", "power_rate", "mutation_rate", "tribe_a", "tribe_b", "wall_year", "wheel_interval")}
        config["seed"] = featured["seed"]
        config["years"] = horizon
        if scenario_data is not None:
            config["scenario"] = scenario_data
        save_payload = {"schema_version": 4, "world_index": featured["world_index"], "config": config, "state": featured_state}
    with open(args.output_json, "w", encoding="utf-8") as f:
        json.dump(summary_payload, f, indent=2)

    if args.save_state:
        with open(args.save_state, "w", encoding="utf-8") as f:
            json.dump(save_payload, f, indent=2)

    report_md = format_markdown_report(summary_payload)
    with open(args.output_report, "w", encoding="utf-8") as f:
        f.write(report_md)

    print(f"Simulation complete: {args.runs} runs in '{args.mode}' mode. Featured World #{featured['world_index']} (Drama Score: {featured['drama_score']}).")


if __name__ == "__main__":
    main()

