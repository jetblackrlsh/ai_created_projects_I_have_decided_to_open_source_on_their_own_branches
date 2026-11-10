# Characters, measurable goals, and tracked worlds

## Start with a concrete scenario

`assets/scenarios/custom-goal-driven-world.json` defines a modern city with four configured founders and two tracked main characters. Mira pursues medical practice, mastery, wealth and a following. Oren pursues a rematch, an election win and a freer society. Their mother establishes actual parent links, and the siblings begin as mutual allies. Cass is a rival, not a guaranteed villain or loser.

Example explicit invocation from the package root:

```sh
python scripts/simulate_world.py --mode modern --years 30 --pop 80 --seed 2088 \
  --scenario assets/scenarios/custom-goal-driven-world.json \
  --save-state /tmp/goal-world-state.json
```

The scenario's `settings` can also carry supported defaults. CLI flags should be used when deliberately overriding the run. Preserve the saved world to resume its same characters, random state, relationships and goal ledgers; do not provide a replacement scenario while resuming.

## What customization means

Starting conditions are not permanent guarantees. A configured medic may lose or change jobs. A wealthy founder can lose money. A popular hero can lose followers. A main character can die, lose a fight, fail a goal or remain blocked. A `description` is narrative context, not executable instructions. `faction` is a label, not an implicit faction-war engine. Named counter technologies only have effects where the world engine recognizes them.

Limits: **64 configured characters, 16 tracked mains, 8 goals per character, 3 catalog powers per character**. The founder population must accommodate configured characters. Stable `key` strings allow references without guessing numeric IDs; explicit positive founder `id` values are also supported.

Useful character fields:

- Identity/context: `key`, `id`, `name`, `last_name`, `description`, `faction`.
- Powers and biology: `powers`, `age`, `mastery_level`, `injury`, `energy`, `alive`.
- Personality: `traits` containing ambition, compassion, greed, curiosity and charisma (0..1); `dream` family/freedom/knowledge/order/fame; `motive` money/streets/fame/revenge/country.
- Social starting state: `role` citizen/hero/villain; `wealth`, `job`, `income`, `has_phone`, `reputation`, `followers`, `power_license`, `party` pluralist/security/populist.
- Conditions: `healer_burnout`, `imprisoned_years`, `hospitalized_years`, `quarantined_years`, `infected_years`.
- Tracking: `main_character: true`, `goals`; or top-level `main_characters` references.

Not every field is meaningful in every world mode. Modern careers, elections, internet following and rankings require modern society. Conditions use validated bounds, not arbitrary numeric extremes. Age can be unusually high as an initial condition; this does not make the person immortal.

Top-level `relationships` supports parent, spouse, mentor, ally and enemy records with `a`/`b` references. Parent direction is parent to child; mentor direction is mentor to pupil. Parent ages, adult spouses, conflicting spouses and duplicate relationships are validated. `rivalries` is separate: rivals seek bouts, while an ally/enemy relationship alone is not a promise of a fight.

`world` accepts initial `resources`, `laws`, `counter_tech` and `society`. Society initial conditions use **`integrity`**, plus freedom, press_freedom and regime. Resource keys include food, materials, medicine, fortifications, infrastructure, guard and harvest_bonus. Supply recognized fields rather than prose laws with imagined effects.

## Goal schema and evidence

Each goal needs `type`, optionally a unique `id`, and the fields below. Count defaults to one. `recover_health` defaults to zero injury. Target references resolve once to stable agent IDs.

| Type | Fields | Observed success |
| --- | --- | --- |
| `survive_until` | `year` | Alive at the specified simulation year |
| `reach_age` | `value` | Actual age reaches threshold |
| `reach_mastery` | `value` (0..5) | Actual mastery reaches threshold |
| `win_duels` | `count` | Recorded bout victories, including tournament bouts |
| `defeat_character` | `target`, `count` | Recorded victories against that specific character |
| `win_tournaments` | `count` | Recorded tournament championships |
| `reach_rank` | `rank` (F..S) | Current app rank reaches target |
| `earn_wealth` | `value` | Current wealth reaches threshold, not lifetime gross income |
| `get_job` | `job` | Actual current job matches |
| `become_leader` | none | Current society leader ID matches |
| `win_elections` | `count` | Actual election records name this winner; appointment alone is insufficient |
| `gain_followers` | `value` | Current followers reach threshold |
| `protect_character` | `target`, `year` | Target remains alive through observed checks to the target year |
| `have_descendants` | `count` | Distinct real descendants found through stored child links, including deceased descendants |
| `expose_fakes` | `count` | Corrections attributed to this investigator, not global correction totals |
| `obtain_power` | `power` | Actual world repertoire contains the catalog power |
| `recover_health` | `value` (0..1) | Living character's injury is at or below threshold |
| `improve_society` | `metric`, `value` (0..100) | Society reaches freedom, election_integrity or press_freedom target |
| `treat_injuries` | `count` | Actual successful Healing treatments recorded for the character |

There are **19 listed goal types** in this interface. A societal target is an observed outcome, not proof the character personally caused the entire change. Protection is survival tracking, not invulnerability or a guarantee the protector prevented every danger. A tournament can award advancement after a drawn bout; that advances the bracket but does not manufacture a duel victory.

Planning produces bounded preferences for real decisions: practice, suitable jobs, campaigning, media activity, power choice, peer challenges, caution and protection. It does not award free mastery, money, office, powers, medical success or victory. Untargeted duel goals select an eligible adult peer with similar mastery; named defeat goals prioritize the named rival. Health/survival caution takes precedence over seeking fights. Actions remain subject to eligibility, energy, resources, chance, opponents and world conditions.

Concrete hooks bias the normal training chance; prefer an already-held useful power (or an eligible acquisition action); prioritize a protected ally or injury patient; enter qualified job competition rather than assigning the desired job; increase campaign nomination opportunities rather than appointing a leader; and favor real public footage over fabricated fame. Successful Healing increments the healer's patient counter only after the power succeeds and spends medicine. Fake-exposure progress requires investigator-attributed correction records. Civic goals can change the character's voluntary political platform, but not directly raise societal indexes or grant office.

Social goals outside modern society report blocked prerequisites instead of invented progress. Dead characters' non-survival goals are blocked pending possible resurrection, with descendants still able to extend the family record. Survival/protection failure is persistent; later resurrection does not erase a failed survival interval. Achieved goals remain completed as historical achievements even if wealth/rank later falls.

## Tracking and evidence

Persist the updated goal records under `story.goals`, keyed by character ID. Goal states distinguish pending, active, blocked, completed and failed, and record measurable progress and reasons. Each goal's internal yearly history is bounded to the most recent 64 entries. Main-character yearly timelines retain their recorded yearly summaries and encounter references; tracking does not confer special survival odds.

Reports should distinguish starting declarations, actual simulated events, unmet goals and uncertain causation. Do not rewrite an unlucky result to satisfy a desired character arc.

## Duels, tournaments and explicit consequences

Detached arena calls are pure and nonlethal. Each fight uses separate vigor/resolve, seeded initiative and power mechanics, with at most 200 rounds. Tournaments support single elimination with 2..64 entrants, explicit byes and recorded seeded draw advancement. Bouts begin from the supplied roster state rather than carrying injury from the previous arena bout. The source world is not changed by a preview.

World rivalry and scheduled tournament settings use `encounters.commit_consequences`. It defaults to **false**. Set it to true only when the caller requests bounded world consequences. Manual saved-world arena runs use the explicit `--commit-results` option and a saved output state.

Committed bout consequences are bounded practice, fatigue, bruising and reputation, with recorded before/after state. Tournament participants receive consequences per bout, so a champion may accrue more fatigue than a first-round loser. Arena vigor is not direct world health. Arena Siphon is a bout-only copied technique; it does not steal a world power. Arena Necromancy uses a declared spectral sparring construct, not a resurrection. Arena results do not automatically kill, age, imprison or permanently transfer powers.

Separate annual world mechanics can still be dangerous. Nonlethal arena rules do not make the entire world nonlethal.
