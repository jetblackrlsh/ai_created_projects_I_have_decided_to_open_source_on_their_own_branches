# Superpower World Sim v3

An offline, standard-library Python engine and AI-agent skill for fictional superpowered civilizations. Run many seeded worlds, compare their outcomes, and explore one world's named heroes, villains and dynasties. Stop at checkpoints and steer future history through decrees and events.

## Quickstart

Requires Python 3.9 or newer; no package installation, credentials or paid services.

```sh
python3 scripts/simulate_world.py --mode monarch --runs 100 --years 100 --output-json results.json --output-report report.md
python3 scripts/test_simulate_world.py
python3 scripts/test_power_effects.py
```

Open `report.md` for the complete featured-world major-event chronicle and aggregate results. `results.json` includes structured results and, outside versus mode, the featured world's agent/family records.

## What you can do

- **Evolution:** Follow a settlement through 1,000 years of hereditary power mutations, heroes, villains, dynasties, famines and civil wars.
- **Monarch:** Begin as an ordinary ruler of superhumans and see whether the founding dynasty survives.
- **Wheel:** Introduce power meteors, visitors, demon rifts, vampires, immortal tyrants, prophets, famines and other events at regular intervals.
- **Modern:** Follow employment, media, public rankings and democratic institutions in a contemporary superpowered society.
- **Versus:** Compare two distinct speed, strength or intelligence civilizations preparing behind a wall before conflict.
- Run any positive number of Monte Carlo worlds. Feature the highest-drama history automatically or select a world by index.
- Adjust founders, initial power rate, mutation rate, seed, horizon, wheel interval, tribal matchup and wall year.
- Save complete world state, resume later, and branch the same checkpoint into alternative choices.
- Inspect objective secrets versus public beliefs, family relationships, hero mantles, succession, technologies and mortality statistics.

## Mastery and modern society

Successful power use now earns XP and bounded mastery levels that improve costs, cooldowns and supported effects. A new `--mode modern` runs jobs, wages, simulated phones, a public ranking app, media coverage, individual-ballot elections and elected administrations. Reputation/ranking affect employment and campaigns; governing choices change freedom, integrity and democratic-survival outcomes. These are our own explicit toy rules, not a reconstruction of any video creator's hidden simulator.

```sh
python3 scripts/simulate_world.py --mode modern --runs 100 --years 100 --output-json modern.json --output-report modern.md
python3 -m unittest discover -s scripts -p 'test_*.py' -v
```

The release also adds combined inherited powers/permanent siphoning, courts/licensing, pediatric accidents, hospitals/outbreaks/quarantine/burnout, separate sports leagues, protests/impeachment, S–F social ranks and a simulated internet with virality, impersonation/fakes, forensic corrections and lasting grievances. See [expanded systems](references/expanded-systems.md).

Read [the modern-society and mastery guide](references/modern-society.md) for exact rules and limitations.

## Powers now do things

All 53 powers have concrete actions, not only stat bonuses. Necromancers can resurrect recently deceased people; cloners create distinct temporary agents; healers treat injuries; mind controllers change allegiance temporarily; telepaths reveal real recorded secrets. Elemental powers inflict conditions, wards and durability counter injury, stasis pauses aging/actions, and movement/growth/construction powers change supplies, shelter, escape, infrastructure or defenses.

Energy, cooldowns, resources, capped yearly actions and bounded resurrection/cloning prevent unlimited power loops. New settlement resources and power metrics are exported with the world. Run `python3 scripts/simulate_world.py --list-powers` for all 53 action descriptions.

The model contains 53 distinct powers: the original 29 plus 24 transcript-inspired additions, with Luck treated as a Fortune alias. See [the mechanics reference](references/powers_and_mechanics.md) for exact behavior and important simplifications.

## Interactive saved worlds

Choose the full horizon first, then stop at a milestone:

```sh
python3 scripts/simulate_world.py --mode monarch --runs 1 --years 100 --checkpoint-year 25 --save-state world.json --output-json current.json --output-report current.md
python3 scripts/simulate_world.py --load-state world.json --checkpoint-year 50 --policy-override hero_charter --inject-event meteor --save-state world-next.json --output-json next.json --output-report next.md
```

Version-3 saves preserve mastery and society/election/app state in addition to power conditions, cooldowns, resources and revival/clone counters. Full version-1/2 saves migrate at the resume boundary; old history is retained, but future behavior follows the new rules. The original saved configuration is restored, including mode, seed and final horizon. Resume advances beyond the saved year, without restarting agents or history. New decrees and injected events take effect in the next simulated year. On fresh runs in the original modes injected events happen in year 5; modern-mode injections occur in the next year. Keep separate state files to compare alternate histories. Versus supports checkpoints but not decrees or injected events. A saved Monte Carlo batch resumes only its featured world.

Use `--help` for all options. Missing or legacy summary-only save files are rejected.

## Use as an AI-agent skill

Install the `SKILL.md`, `scripts`, `references` and `agents` files together using your assistant's skill-installation workflow. Ask, for example:

- “Use superpower-world-sim to simulate superpowers evolving for 1,000 years across 100 worlds. Tell me the most dramatic history.”
- “Let me rule a superhuman kingdom without powers. Pause every 25 years for my decisions.”
- “Compare speed versus strength civilizations, then swap their sides and explain the differences.”
- “Branch this saved world: try a royal amnesty in one future and a hero charter in another.”

A compatible assistant interprets the engine output as a story. The repository itself is a headless engine, not an AI model or a graphical game.

## Verification and limitations

The regression suites exercise original and added powers, combined inheritance/permanent theft, practice growth/decay, resurrection/clone limits, virality/fakes/corrections, persistent grievances, ranking/job/phone effects, ballots and political outcomes, evidence-aware courts/licenses, pediatric collateral, hospitals/epidemics/quarantine/burnout, sports/protests/impeachment, old-save migration and exact seeded checkpoint continuity. Reproduce with `python3 -m unittest discover -s scripts -p 'test_*.py' -v`. Use `scripts/check_stability.py` and `scripts/check_modern_stability.py` for multi-world invariant/scenario sweeps. These tests do not establish equal power strength, real-world validity, exact video outcomes or access to another creator's source.

This is a fictional, simplified simulation, not a prediction of real societies. Some famines and technologies are scheduled; event narration is templated. Powers combine explicit causal actions with scalar bonuses, not full physics. Effects are annual abstractions; contextual powers need eligible targets and may not activate every year. Institutional flags and counter-tech are coarse. Tribal A/B economy and combat rules are asymmetric, so versus is not balanced research. There is no GUI, custom scenario-JSON loader, arbitrary-power editor, network service or background simulation. Food/resource stocks are abstract units, not a spatial farming or nutrition model. Versus remains a separate aggregate three-tribe model; the 29 individual-agent actions apply to evolution, monarch, wheel and modern. The modern freedom/economic indices and voting rules are invented simulation assumptions, not empirically validated forecasts. Only one world's detailed history is exported per batch. Legacy summary snapshots cannot be upgraded into full state because the missing agents/RNG were never saved.

Keep generated snapshots and histories private when they contain your own added material. No personal sessions, private journals, credentials or generated user histories are part of this release.

## Provenance and license

Adapted with the project owner's approval from their supplied `superpower-world-sim` package on November 9, 2026. Fixed actual state restoration, added missing events and amnesty control, exported family records, preserved complete report chronicles, added input checks and regression tests, and corrected overstated documentation. The original supplied files were not modified. A subsequent approved v2 upgrade added all 53 power actions, conditions, injury/healing, settlement resources, bounded resurrection/cloning, full-state migration and dedicated power tests. The approved v3 update adds use-earned mastery, a modern-society engine, elections, jobs/phones, app/reputation/media effects, political batch statistics, disuse decay, 24 additional powers, combinations/theft, institutions, healthcare and simulated internet/deception, with deterministic compatibility tests.

Original package file SHA-256 hashes:

- SKILL.md: `449bc3f29d15610efda9af5661719bcacf0241a81357b02600e3730eb085c96a`
- references/powers_and_mechanics.md: `40432c86f22569de6d3f33bf51bc3906f7bfcb45635867a106e3b278e27d964f`
- scripts/simulate_world.py: `a593e18b78fe8f725ab415de6c29b49b605e168dfbaeea35f1a9ba20196cd6b5`

The owner's contributions are released under the repository's [CC0 1.0 Universal dedication](LICENSE), only to the extent of rights they hold. Third-party trademarks and rights are not waived. See [notices](THIRD_PARTY_NOTICES.md) and [release manifest](RELEASE_MANIFEST.json).
