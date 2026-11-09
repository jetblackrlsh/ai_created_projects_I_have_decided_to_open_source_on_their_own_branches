# Superpower World Sim v2: implemented mechanics

## Every defined power has an action

The individual-agent engine (evolution, monarch and wheel) has the following 29 concrete effects. Outcomes require an eligible target and available energy/resources. A power is not guaranteed to trigger every year. The engine's --list-powers option prints this same action catalog.

- **Fire:** Burn a hostile agent; burns cause injury until treated.
- **Ice:** Freeze a hostile agent, interrupting power actions and combat.
- **Water:** Cleanse burns/poison and irrigate food supplies.
- **Weather:** Improve the annual harvest and reduce famine pressure.
- **Lightning:** Stun and injure a hostile agent.
- **Magnetism:** Disarm a hostile agent and salvage construction material.
- **Earth:** Build durable settlement fortifications.
- **Wind:** Transport relief food and shelter an injured citizen.
- **Plant Control:** Grow edible crops and medicine stock.
- **Poison:** Apply a lingering poison to a hostile agent.
- **Flight:** Evacuate an injured citizen to another town and shelter them.
- **Strength:** Haul material and repair damaged infrastructure.
- **Giant Size:** Build infrastructure and guard the settlement.
- **Durability:** Form protective armor; also reduce incoming power damage.
- **Speed:** Deliver food/material and gain a temporary combat initiative boost.
- **Shapeshifting:** Adopt an animal form, forage and escape confinement.
- **Cloning:** Create a distinct, short-lived, non-reproducing clone.
- **Invisibility:** Hide and covertly free a prisoner.
- **Illusions:** Confuse a hostile agent with combat-decoy visions.
- **Shadow:** Frighten a hostile agent and infiltrate prison to free someone.
- **Mind Control:** Temporarily change an opponent role/allegiance.
- **Telepathy:** Expose a recorded secret and identify a hostile mind.
- **Portals:** Transfer a household between towns and deliver relief supplies.
- **Time Slowing:** Place a hostile agent in stasis, preventing aging/actions briefly.
- **Magic:** Ward an ally against the next power attack.
- **Healing:** Treat an injured citizen using medicine.
- **Regeneration:** Restore the caster own injuries and remove poison.
- **Immortal:** Recover from wounds slowly; cannot die from old age.
- **Necromancy:** Revive one recently dead person with identity and family intact.

## Shared rules and interactions

Agents have injury (0–1), energy (0–100), a cooldown, location, temporary conditions and a death history. Injury affects combat performance; power damage reaching 1 can kill. Natural recovery removes 0.025 injury/year. A usable power normally costs 25 energy and is ready again after three years. Cloning and Necromancy cost 60 energy and have an eight-year cooldown. Energy recovers by 18/year, to 100. Agents may begin using powers at age 12. A world-seeded, shuffled opportunity pool and 35% annual attempt chance govern use, with at most 24 resolved power actions per world-year. These are simulation-year abstractions, not realtime combat.

Fire burns and Poison poisons cause continuing injury. Water cleanses these conditions, Healing treats another agent using medicine, and Regeneration treats its own injuries and poison. Ice, Lightning, Shadow and Time Slowing can interrupt actions. Stasis also pauses aging. A magic ward absorbs one hostile power attack; it does not grant immunity to old age, famine or every ordinary combat death. Durability and temporary armor reduce power injuries. Disarming, confusion, exposure, hiding, haste and armor change combat performance. Counter-tech collars/suppressors prevent incarcerated agents from activating powers; existing counter-tech still gives a generic combat bonus rather than a complete item-by-item equipment model.

Mind Control temporarily changes an opposing agent's role/allegiance. It expires after the recorded duration, restoring the original role unless a different event changed that role in the meantime. It is not a general-purpose constitutional succession system. Telepathy reveals an existing secret through a new chronicle event, preserving what was believed at the original event's date.

## Resurrection and cloning guardrails

Necromancy restores the same deceased agent, preserving identity, power, age, relatives, memories represented by recorded history, and previous death episodes. Revival requires death within three years, excludes old-age deaths and dissolved clones, costs two medicine and five food, and is limited to one revival per individual. The revived person returns injured, with low energy and as a citizen; a returning monarch does not automatically unseat the current ruler. No new parent-child identity is invented.

Cloning creates a new agent with clone_of pointing to the original. Clones do not clone or reproduce, do not inherit royal blood and dissolve after at most 15 years. At most roughly 5% of the living population may be clones (with a minimum allowance of one). Each creation costs five food. They are distinct people, not resurrected copies or unlimited recursive duplicates.

## Real but abstract settlement resources

Individual-agent worlds now record food, materials, medicine, fortifications, infrastructure and guard strength. An annual production/consumption step changes food; infrastructure adds a bounded production bonus. Water, Weather, Plant Control, Wind, Speed, Portals and Shapeshifting can improve supplies. Strength and Giant Size improve construction; Earth builds fortifications. Fortifications/guards contribute bounded defense. Invented counter-tech consumes material. Depleted food can trigger famine, and Weather can reduce a year's famine pressure. Resource stocks and action budgets are capped. Locations are named towns, not a simulated distance/terrain map; rescue, supplies, shelter and escape are mechanically meaningful without realtime flight/portal physics.

## Inheritance, people and macro events

The power inheritance chance remains 78% for children of powered parents, followed by the configured mutation probability (default 0.35). POWER_TREE in scripts/simulate_world.py is authoritative for mutation adjacency and basic multipliers. Unknown mutation candidates leave the original power unchanged. Immortal still cannot die of old age but remains vulnerable to other causes. Personality and family relationships continue to shape heroes, villains, mentorships and succession. This is a simplified agent model, not a comprehensive psychology model.

Original population-band birth rules, dynasties, hero/villain clashes, civil wars, scheduled famine opportunities and wheel events remain. Powers add causal actions to that model; they do not make all events unscripted or scientifically calibrated.

## Policies and injected events

Supported decrees: royal_guard, hero_charter, gifted_draft, registration_act, power_ban, royal_amnesty, build_collars, build_mechs and build_cannons. Amnesty releases current prisoners; later arrests are possible. Institutions remain coarse: registration_act and power_ban are recorded laws, not comprehensive enforcement systems. Collars now suppress prisoner power activations. Cannons can change later civil-war mortality.

Supported events: meteor, visitors, demon_rift, vampires, famine, golden_age, gifted_generation, villain_awakens, immortal_tyrant, prophet and nothing. Fresh-run injection occurs in year 5; resumed injection occurs the following year. Some effects are event-specific abstractions: demon_rift enables a draft and narrates a crisis rather than spawning a demon population; golden_age can repeal registration but does not independently increase the new food stock. A wheel spin and an injection can coincide. Wheel intervals and the midpoint double-spin rule remain.

## Versus mode

Versus remains a distinct aggregate tribal model, not a world of individual POWER_TREE agents. Speed, strength and intelligence civilizations have mechanical work, hauling, food demand, combat, evasion and scheduled technology differences. Other individual powers are not inserted into this aggregate model. Its A/B position caps and technology checks remain asymmetric; swapping sides can change outcomes. It is not a balanced fighting-game or scientific matchup predictor.

## Compatibility, reproducibility and output

Version-2 full-state saves include agent power conditions/cooldowns, resources, revival and clone counters, revealed-secret indexes and RNG state. Full version-1 saves are accepted and migrated at the resume boundary: old people/history are preserved, new power fields/resources are initialized then. Such a migration intentionally changes future behavior to the v2 rules; it cannot reproduce a future from the older engine. Legacy summary-only snapshots are still rejected.

Same-version uninterrupted versus checkpoint/resume equality is regression-tested in all four modes, in the same Python runtime. Keep the original final horizon fixed. Saved batches resume only their featured world. JSON includes power usage, resurrections, clones, resources, raw agents/families and full major-event chronicle; Markdown includes power metrics and the full chronicle. Batch aggregates still summarize outcomes rather than exporting every world's detailed people.

Use python3 scripts/test_simulate_world.py and python3 scripts/test_power_effects.py to check regressions and every power's real outcome. Multi-seed stability checks test finite resources, bounded actions/clones, revival limits and population growth; they are not proof of competitive balance. Powers can be impactful without equally strong outcomes.

No GUI, custom scenario-JSON loader, arbitrary-power editor, external API, paid dependency or autonomous background service is bundled. It remains an offline fictional simulation and story laboratory.
