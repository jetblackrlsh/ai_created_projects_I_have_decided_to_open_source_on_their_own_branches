# Custom powers without extending the engine

## Contract
All powers use the same fixed, documented effect primitives. A power's name and story description never execute code, alter a DC, or grant a capability by themselves. Compose supported effects, show the exact mechanical result, and disclose any approximation. An adventure's author may add data-driven choices responsive to a capability, not new runtime behavior. A player can build powers before play; arbitrary prose is not parsed by an online model during play.

Ability scores use the familiar six names and floor((score-10)/2) modifier formula. The remaining rules are original; do not label games as 5e/5.5e compatible or import SRD spells/classes.

## Effect families and interpretation
Read engine-api.md for the definitive validator ranges. Consider these families when translating an idea:
- Check assistance: concentration, expertise, machine analysis, empathy, precognition or luck become scoped check bonuses for a stat or action tags. This works on noncombat actions as well as attacks.
- Physical and mental augmentation: temporary stat shifts affect subsequent matching checks. Do not assume Strength is always combat or Charisma is always persuasion; map the actual action to the most relevant ability.
- Mobility and access: flight, teleportation, phasing, swimming and climbing become capability tags with explicit routes/access choices. Teleportation does not allow selecting arbitrary nonexistent scenes.
- Perception and knowledge: sensing, mind reading, divination and forensic scanning unlock authored clues or assist checks; they do not invent facts that are absent from the adventure data.
- Social influence: emotional control, camouflage, disguise and illusion assist or unlock authored interactions. They do not make every NPC obey any free-text command.
- Protection and recovery: shielding, resistance, healing and cleansing trade limited energy for survivability.
- Offensive and restrictive effects: direct fixed damage, draining or conditions target the current defined opponent. Noncombat applications need explicit authored actions, not arbitrary destruction of the scene.
- Transformation: stat/capability combinations model different forms. A dragon can combine strength and flight, but does not gain every imagined dragon trait.
- Summoning: the supported ally-assistance effect, not a new autonomous character simulator.
- Creation/manipulation: capability tags such as constructs, repair, telekinesis or fabrication enable defined checks and routes. Do not create untracked unlimited inventory, money or resources.

## Broad examples
A technological hacking power can improve tagged technical checks; an empathic aura can assist CHA checks; a tracking sense can improve WIS investigation checks; a shield spell and a force-field gadget can share shielding mechanics; a medicinal swarm can combine healing and condition removal; an insect transformation can combine an ability adjustment with a traversal tag. Represent strengths and weaknesses through costs, scope, duration, conditions, cooldown and the character's ordinary attributes.

Before promising a power, validate its full object and preview its use on at least one relevant action. If a capability has no matching authored action, tell the player it has no special application there rather than claiming it works invisibly.

## Adventure fairness
Provide several ordinary approaches to every major problem and do not require a specific custom power to finish the default adventure. A specialist can gain different risks/rewards, not an automatic universal win. Build finite resources and failure consequences; avoid free repeat checks until success. Test no-power play, multiple builds, several seeds and genuine defeat. Do not change mechanics to rescue a failed test.
