# World-threat campaigns (v4.5)

Use `scripts/threat_campaign.py`, a separate opt-in tactical/aggregate mode. It does not replace or secretly mutate annual worlds or arena rules.

```
python3 scripts/threat_campaign.py --scenario assets/scenarios/world-threat.json --runs 100 --seed 10101 --output-json threat-results.json
```

The output includes every seed, full traces, final state, summaries and aggregate counts. Seeds increase by97. There are no sampled narrative endings: actions alter combat resources and population, and terminal states determine the outcome. No outcome probabilities are tuned to create dramatic variety. Save/load a single campaign using `--runs 1 --stop-at 3 --save-state state.json`; resume with `--runs 1 --load-state state.json`. A completed save is immutable. A configuration hash supports reproducibility.

## Configuration

The synthetic example contains Thunderfall (strength, durability, lightning, time slowing, resolve), Vesper (shadow blasts, blending/invisibility, clones, fear, tactics) and Cipher Marshal (mental link, limited telepathy, flight, cybernetics, analysis and space adaptation). These are original archetypes, not canonical licensed characters. Every ability starts at mastery3 because no specific training levels were supplied. Origin and moral virtue do not add infinite power; the threat's stated annihilation goal overrides heroic flavor.

`fighters` has1..16 unique string IDs, exactly one `threat`, and zero or more `heroes`; supported power names and mastery0..5 must be explicit. `world` sets finite population, regions, horizon in abstract action steps, initial alert, detection base and devastation scale. `rules` controls fight priority, evacuation probability, response travel and a held damaging devastation power. Unknown fields fail rather than become unsupported flavor. Default example:12,000 abstract people,12regions,120steps; not a calibrated Earth model. No extra heroes, military or reinforcement factions spawn.

Before interception, heroes search using detection probabilities affected by Analytical Vision, Telepathy and Tactical Analysis. Flight/Speed reduces the response delay. Each combatant gets at most one action per step. Vigor, resolve, energy, statuses and guard persist. Hero teams actually act together, rather than run sequential fresh1v1 bouts. Mental link/tactics can aid an ally. An eligible flyer/portal user sometimes sacrifices a combat action to evacuate civilians into an abstract shelter. Shelter is not permanent immunity: if all regional residents are gone, the threat can attack sheltered survivors. No off-world escape is silently awarded.

Threat devastation uses an explicitly held damaging ability, its individual mastery and energy, multiplied by the configured population scale and seeded variation. It kills only people actually present in its target region. Combat resolves before external consequences; a threat incapacitated later in the same step cannot complete devastation. The same final-active/status check applies to evacuation. This is a deliberate hero-favorable abstraction, not a physics claim. Population is conserved as regional residents + sheltered survivors + recorded deaths. Fighters are tracked separately from this civilian population.

## Exclusive outcomes and side measures

- `threat_stopped`: threat vigor or resolve reaches zero; incapacitation/capture, NOT implied death or permanent lifetime imprisonment.
- `world_population_destroyed`: all modeled civilians are killed, NOT the planet physically exploded.
- `unresolved_at_horizon`: neither terminal event occurred before the configured horizon.

Report losses, surviving population, hero incapacitations, detection/interception delay and shelter survivors separately. A world saved from extinction may still suffer catastrophe. Hero incapacitation is not mortality. Finite-energy recovery continues even after all defenders fall; no-defender controls can reach extinction.

## Critical model limits

The combat layer reuses the bounded arena profiles and rotates powers by action step. A larger repertoire is not simultaneous omnipotence. Durability generates finite guard when activated, not permanent invulnerability. Time Slowing changes initiative; it does not rewrite history. Shadow clones provide attack/guard/evasion benefits, not autonomous full-power duplicate turns. Space Adaptation provides bounded combat protection, not a fully simulated galaxy. Analysis and coordination help but do not invent a special weakness. There is no environmental cover map, optimal planner, physics, long-term villain reoffending or postwar rebuilding. Exposing a weakness in this abstraction is a reason for a future model change, not a reason to reroll until a preferred result appears.

Percentages describe the specified model and assumptions, not real-world or canonical comic odds. For100/100 wins, report100% observed and optionally Wilson95% interval96.3–100%, not guaranteed victory. Distinguish requested runs from any separately labeled controls.
