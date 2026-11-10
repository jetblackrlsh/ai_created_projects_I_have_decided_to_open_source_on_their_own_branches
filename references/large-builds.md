# Large and themed builds

Version 4.4 supports up to 64 distinct held abilities, with independent mastery for each. Scenario setup, saved world state, Siphon, arenas, rankings, goal measurement and warfare all read the full repertoire. Duplicate aliases are rejected in scenarios. Repertoire helpers reject overflow instead of silently dropping powers. A legacy save with up to 64 powers retains those powers and its existing mastery records; no extra powers or XP are invented.

Random offspring still inherit at most three abilities under the existing seeded gate. This is a population-generation rule, not the playable build capacity. Designed founders can hold many powers and Siphon can accumulate up to the larger capacity. More powers do not give extra annual actions, an enlarged energy pool or automatic victory. Annual selection and arena rotation still choose one held technique at a time. In large arenas, an early defeat can occur before every technique is used. War support selects a strongest eligible ability, not the sum of all powers.

Use `assets/scenarios/multi-power-builds.json` for synthetic five- and six-ability archetypes resembling a shadow investigator, lightning-powered guardian, and cybernetic detective. These are original testing examples, not claims about a published character's canon.

## Translating a themed character card

Separate capabilities, origins and personality. A divine origin does not imply infinite lightning or moral correctness; a rocket origin does not automatically give interplanetary travel; a combat code is primarily personality. Existing Strength, Durability, Lightning, Time Slowing, Flight, Invisibility and Telepathy already cover bounded physical strength, injury resistance, lightning injury/stun, local stasis, rescue flight, stealth and secret-reading. Give separate abilities when a card actually requests separate effects, for example Telepathic Link and Telepathy for communications plus mind reading.

New abilities are concrete bounded abstractions, not free-form physics or a full space setting. Read the catalog descriptions and actual traces before narrating an outcome. Do not turn a saved resource/shelter effect into an unrecorded galactic expedition or assume a strategy trait guarantees perfect plans. Per-ability mastery improves that ability only, not every other ability in the build.

## Added action catalog

- **Shadow Blasts**: Injure a hostile person with a projected shadow bolt; no automatic fear or invisibility.
- **Fear Influence**: Frighten a hostile person, disrupting their next eligible actions without changing allegiance.
- **Shadow Clones**: Create a finite-lived non-reproducing duplicate with the held repertoire; duplicates cannot clone.
- **Cybernetics**: Spend material to calibrate augmented armor and speed, repair systems and salvage components.
- **Analytical Vision**: Scan a living target, record their current power signatures and expose concealment and tactics.
- **Space Adaptation**: Spend supplies on a bounded off-world salvage expedition, returning samples and environmental protection.
- **Tactical Analysis**: Prepare a tactical advantage for an ally and expose opposing tactics.
- **Resolve**: Recover from fear/confusion and temporarily resist their disruptive effects; not proof of moral goodness.
- **Telepathic Link**: Coordinate with a living ally through a recorded mental link and grant a shared tactical advantage.
