# Expanded powers, institutions and simulated media

These are original bounded game mechanics inspired by narrative possibilities, not a reconstruction or verification of another creator's hidden simulator. No real people, accounts, phones, courts or internet services are involved.

## 24 added powers (53 distinct catalog entries total)

The original 29 actions remain. The added concrete actions are:

- **Psychometry:** Read an object trace to reveal an existing recorded secret.
- **Fortune:** Grant an ally a bounded lucky combat opportunity.
- **Bubbles:** Enclose an ally in a protective rescue bubble.
- **Rapid Construction:** Consume material to construct infrastructure rapidly.
- **Perfect Memory:** Record a witnessed event and recover useful technical knowledge.
- **Time Rewind:** Rewind a recent injury without resurrecting the dead or rewinding the world.
- **Time Stop:** Briefly stop a hostile person in stasis, interrupting actions and aging.
- **Tide Control:** Irrigate crops and transport emergency food by water.
- **Steam:** Scald and obscure a hostile person.
- **Alchemy:** Convert construction material into medicine.
- **Starlight:** Blast a hostile person with starlight and protect an ally with a luminous ward.
- **Empathy:** Calm a hostile person and improve civic trust.
- **Power Suppression:** Temporarily suppress a hostile person's power actions.
- **Charm:** Temporarily sway a hostile person's allegiance.
- **Precognition:** Expose hostile tactics and prepare a defensive advantage.
- **Stone Skin:** Harden the caster's body into protective stone armor.
- **Invulnerability:** Protect the caster against one incoming power attack.
- **Shrinking:** Shrink to escape confinement and conceal the caster.
- **Hurricane Breath:** Disarm a hostile person and clear salvageable debris.
- **Rot:** Inflict a persistent decay injury on a hostile person.
- **Siphon:** Permanently transfer one power from a hostile person; capacity is three.
- **Adrenaline:** Boost initiative and recover a bounded amount of usable energy.
- **Smoke:** Conceal the caster and confuse a hostile person.
- **Sparks:** Deliver a small electrical injury and stun a hostile person.

Luck is an alias for Fortune, not a duplicate power. Infinite Speed is represented by the existing bounded Speed ability; no infinities enter arithmetic. Time Rewind reverses a bounded recent injury, not the complete world's history. Malicious Rot can seed a real modeled infection; Suppression can injure a genuinely airborne Flight holder. Perfect Memory also earns bounded knowledge that improves job selection. Invulnerability is a bounded protective ward, not universal immunity to every possible hazard. Context and resource/energy limits still apply. These powers are original interpretations of the named narrative abilities; where the transcript gives only a name, the concrete action and its limits are our design. Exact behavior is in scripts/expanded_powers.py and --list-powers.

People may inherit up to three powers. Mastery currently represents the individual's overall practiced control of their repertoire, not a separate level tree for every held ability. The normal 78% inheritance gate remains; additional parental abilities have independent 35% inheritance opportunities, with configured mutation. Combined repertoires such as Giant Size + Stone Skin or Invulnerability affect actual actions and defensive traits. Actions select one held ability at a time and use the same bounded annual budget; combinations do not multiply unlimited turns. Primary power stays available for legacy interfaces, while powers stores the repertoire. Siphon permanently removes a transferable ability from its target and adds it to the thief, respecting capacity and excluding recursive Siphon theft. Acquisition provenance is saved.

## Mastery, growth and disuse

Successful actions earn current practice XP plus a lifetime use counter. Every ten practice XP yields a mastery level, to five. Prolonged disuse loses five practice XP after ten inactive years and every five inactive years thereafter. Lifetime uses are not erased. Mastery affects costs, cooldowns and selected effect magnitudes, so both growth and decay change future outcomes. Newborns/clones do not inherit free practice, and migration does not invent historical uses.

## S–F public rankings and social consequences

Public app score thresholds are S>=85, A>=70, B>=55, C>=40, D>=25, E>=10, otherwise F. No phone or disabled app means Unranked. Scores combine demonstrated mastery, reputation and follower visibility under explicit fictional rules. Scores/labels affect scarce work opportunities, campaign visibility, networking invitations and adult partnership matching. Low-rank children can experience bullying that affects wellbeing and grievance. These are simulation assumptions, not endorsements of discrimination or real social predictions.

Adult partnerships can form through the app or offline when it is disabled; close kin are excluded, existing living partners are respected, and clones cannot reproduce. Births follow actual eligible couples rather than arbitrary unrelated annual pairings. Networking opportunities change simulated wealth/standing. Bullying and false accusations may create delayed grievances; turning to revenge is conditional, not predetermined for every victim.

## Phone/app/internet and evidence

The simulated feed stores at most 200 recent post records plus cumulative counts. Public power incidents can be filmed, gain bounded impression counts and go viral, changing followers/reputation and consequently jobs/electoral prospects. Impressions are abstract reach, not unique agents. No real video, image, account or social post is created.

A face-changing actor can spend a real Shapeshifting action to impersonate another person in a recorded fictional accusation. Skilled engineers can fabricate AI-edited clips without that power. Records distinguish engine truth from public belief. Psychometry, retained records and independent journalism can expose fakes; corrections repair some public standing, identify the creator for fraud proceedings and may temporarily suspend the account. They do not erase every personal grievance. A humiliated hero may choose revenge years after a correction, while another does not.

Villain motives include money, local control, fame, revenge and rarer national power. Motives affect theft, guard pressure, self-publicity, targeted retaliation and political intimidation. The model does not assume every villain wants to rule the country.

## Courts, licenses, accidents and healthcare

Modern institutions issue licenses based on adulthood/mastery and suspend them after sanctions. Licensed status affects professional hero opportunities and power-use risk. Evidence-based case queues distinguish accidents/juvenile safety training, supported self-defense, unlicensed vigilantism, assault, fraud and murder; rights rules affect evidence thresholds. Fraud can produce six-year sentences, intentional murder fifteen and severe murder twenty-five under these fictional bands. Public offense observations are bounded and require event/target evidence, not merely a villain label. Findings and sentence records are bounded and stored. A public reputation score alone is not proof of guilt.

Children can have uncontrolled power accidents before the normal age for intentional actions. Accidents can injure people and damage infrastructure. Bounded collateral chains include Sparks/gas ignition, Tide flooding/food loss and suppression of an airborne flyer. The model is not a full gas/fluid/flight physics engine. Hospital capacity, staff, medicine and power healers determine triage; injured people can wait for treatment. Outbreaks spread, quarantine restricts work/actions, and healer workload can cause burnout and required rest. Effects persist through saves. Treat these as fictional health mechanics, not medical advice.

Powered and ordinary sports competitions are separate. Rank/civil-liberty grievances can generate protests; democratic and authoritarian governments respond differently. Documented corruption, institutional independence and sufficient support can lead to actual impeachment and a replacement election. Freedom at the end and uninterrupted democratic survival remain separate metrics.

## Scope and verification

All state uses the passed world's RNG, JSON-safe records and bounded queues. Full v1/v2 saves remain supported in their original modes; newly introduced mechanics initialize at migration and change future rules. Same-version replay remains deterministic. Tests cover power actions, combinations/theft, fakes/corrections/grievances, ballots, social outcomes, institutions, clinical capacity and save/resume. Multi-seed sweeps check invariants and scenario consequences, not real-world validity, equal power strength, exact video outcomes or source-code parity.
