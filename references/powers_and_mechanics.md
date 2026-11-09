# Powers, mechanics and supported customization

## Power model

The engine defines 29 powers: Fire, Ice, Water, Weather, Lightning, Magnetism, Earth, Wind, Plant Control, Poison, Flight, Strength, Giant Size, Durability, Speed, Shapeshifting, Cloning, Invisibility, Illusions, Shadow, Mind Control, Telepathy, Portals, Time Slowing, Magic, Healing, Regeneration, Immortal and Necromancy.

A child of a powered parent has a 78% chance to inherit a parent's power. The mutation probability defaults to 0.35. Mutations choose from the source power's adjacency list; candidates absent from POWER_TREE leave the original power unchanged. No unsupported variant should be narrated as implemented. Unpowered parents have a smaller spontaneous-awakening chance tied to the configured power rate.

POWER_TREE in scripts/simulate_world.py is authoritative for exact adjacency lists and combat, survival and longevity multipliers. Immortal skips natural old-age death but remains vulnerable to other hazards. Most powers are scalar modifiers and narrative labels, not fully simulated physics. For example, Necromancy does not implement resurrection, and Time Slowing does not manipulate an actual time field.

## People and chronicles

Evolution, monarch and wheel modes track named agents, ages, parents, children, spouses, personality values, powers, roles, mentorships, imprisonment and deaths. Heroes may train pupils; successors may inherit hero mantles. Revenge targets and some legacy reconciliations are tracked. Do not claim a comprehensive grief or psychological model: some stored personality fields have limited or no causal use.

Each major event records year, category, true_event, public_belief and secret. Assassinations can have concealed perpetrators, and mind-reading heroes can sometimes expose them. Investigation is not a general-purpose detective system. Family relationships are exported in featured_world.agents, keyed by agent ID. They are raw relationships, not a rendered family-tree graphic.

## Policies

Use --policy-override with one of:

- royal_guard: enable the guard; an ordinary ruler has a probabilistic guard defense against direct throne challenges.
- hero_charter or gifted_draft: enable the corresponding institution and increase the likelihood that available heroes intercept challengers.
- registration_act or power_ban: record the law flag. These are coarse institutions, not comprehensive enforcement or political-economy models. A naturally triggered Registration Act also marks powered citizens as registered probabilistically; a manual decree does not duplicate that entire event.
- royal_amnesty: release living imprisoned agents immediately at the intervention boundary and log how many were freed. Later arrests remain possible.
- build_collars or build_mechs: add counter-tech. Counter-tech currently contributes a generic hero combat bonus; these items are not separately simulated machines or prisons.
- build_cannons: enable cannons and record the technology; later qualifying civil wars can cause cannon deaths.

Fresh-run decrees occur in year 1. Resume decrees occur at the next year. These controls apply only to evolution, monarch and wheel.

## Wheel and injected events

Use --inject-event with meteor, visitors, demon_rift, vampires, famine, golden_age, gifted_generation, villain_awakens, immortal_tyrant, prophet or nothing.

- meteor: awaken powers in selected unpowered survivors; the prose's selected-survivor count can exceed the number newly awakened.
- visitors: kill a sample of citizens.
- demon_rift: log the crisis and enable the Gifted Draft; no separate demon agents are simulated.
- vampires: create a Necromancy villain and kill a sample of other citizens.
- famine: kill approximately one-third of the living population, counted as famine deaths.
- golden_age: log the event and possibly repeal registration after year 200; it does not independently boost harvests or births despite flavorful event prose.
- gifted_generation: awaken powers in children under 12.
- villain_awakens: turn a chosen living agent into an ambitious, low-compassion powered villain.
- immortal_tyrant: make a chosen agent an Immortal villain.
- prophet: raise a chosen agent's charisma; cult conflict is mostly narrative rather than a separate faith-agent system.
- nothing: log a quiet outcome.

Injected events happen in year 5 on fresh runs and in the next year on resume. A wheel-mode scheduled spin and an injection may coincide; the existing midpoint double-spin rule still applies. Automatic wheel intervals default to 50 years. After the original final horizon's midpoint, two outcomes are drawn per spin. Only one forced-event type may be supplied per invocation.

## Population and logistics

Evolution uses a carrying-capacity threshold of 1,900; monarch and wheel use 900. Birth probabilities depend on population bands. Evolution also schedules famine opportunities in years 615 and 740. Wheel mode has additional random famine opportunities. These three modes do not have a measured food-store balance; do not report one. Famine survival is affected by power multipliers and age.

Versus uses aggregate tribal population, food reserves, buildings, casualties and technology lists, not individual family agents. Speed has high work speed, high food demand and evasion; strength has hauling, attack and durability advantages; intelligence has technology-themed advantages. Consumption and production apply exponents to configured multipliers. Reproduction requires roughly 1.6 current annual consumption in reserves. Technology unlocks are scheduled by year, not calculated from research points. research_mult is descriptive and is not consumed by a research subsystem.

Tribal positions A/B are asymmetric: different caps, starting buildings and technology checks apply. Swapping sides can change outcomes. Tests do not establish balance. A tribe can starve before the wall falls; winner labels describe final surviving populations, not necessarily military victory. Combat loss totals and event text should be interpreted within these simplifications.

## Saved worlds, output and limits

Save a version-1 full-state JSON with --save-state. It contains original configuration, current year, RNG state and complete mode-specific mutable state. --load-state restores it; legacy summary snapshots are rejected. To branch history, resume the same original snapshot into different output/state files with different policies or events. Keep the initial horizon fixed to make wheel timing comparable.

Batch runs export aggregate counts plus one featured world's details. --save-state on a batch saves only that featured world; resume becomes a single-world run, not a continuation of all Monte Carlo worlds. Seed replay and checkpoint equivalence are tested in the same Python runtime, not promised across all future Python releases.

There is no custom scenario-JSON loader, arbitrary-power editor, GUI, map renderer, external API, paid dependency or background world service. The Python constants may be edited as a code change, with new tests. Output is fictional, not a calibrated prediction of societies or real people.
