# Character social dynamics (v 4.7)

Enable annual social change with `world.social_dynamics: {}` in an individual-agent world. Omission means exact legacy behavior: no social draws, edits, or automatic new stats. This does not enable the feature in the separate aggregate-versus model.

Characters can explicitly set `persuasiveness`, `susceptibility`, and `morality`, each 0..1. Under the opt-in feature omitted values use charisma,0.5, and compassion respectively. These are fictional behavioral parameters, not moral judgments about real people. High susceptibility means greater openness to proposals, not automatic corruption. High morality reduces willingness to accept modeled harmful proposals; it does not make the probability exactly zero. The stats persist on each character rather than belonging only to a scenario pitch.

## Shared persuasion rule

`logit = -2 + 2*persuasiveness + 2*(susceptibility-.5) + trust + 2*alignment - 4*morality*harm`

`probability = 1/(1+exp(-logit))`

Trust and harm are 0..1; alignment is−1..1. This is an explicit configurable fictional assumption, not empirically calibrated psychology. No ability silently overrides consent.

## Goals, relations and opportunities

The annual module uses actual typed, active goals from the saved story, not free-text descriptions. Shared protection, civic improvement, healing, mastery and cooperation create alignment. Wanting to protect, ally with, or resolve a conflict with the counterpart also creates a positive motive. Wanting to defeat the counterpart, wanting to defeat someone the other protects, and competing exclusive leadership/tournament goals create opposition. Unique shared reasons add 0.4 and unique opposing reasons subtract 0.7, clamped to −1..1. Completed/failed goals no longer drive relations. Opposing goals can block reconciliation until they change or resolve.

Persisted pair state tracks trust, tension, neutral/allied/conflict status, alliance/resolution/cooperation counters, and the last interaction year. Initially existing allies start at trust 0.75, enemies at 0.2, and neutral pairs at 0.45. Each encounter adjusts trust by `0.12*alignment -0.025*morality_gap` and tension by `-0.12*alignment +0.02*morality_gap`. Opposing goals and tension at least 0.42 cause conflict and break an existing alliance. Shared goals permit a voluntary alliance proposal; conflicts with nonnegative alignment permit mediation.

For an annual alliance proposal, a declared villain inviting a non-villain carries a coarse harm assumption of 1; otherwise 0. This is a conservative role-based abstraction, **not evidence that their particular collaboration will harm anyone**. Morality differences also affect trust and tension. The threat-campaign recruitment interface can instead specify a concrete proposal's harmfulness and objective; these should not be conflated.

Both successful and failed persuasion/mediation attempts record probability, random draw, proposer/target, alignment and explicit goal reasons. Actual alliance formation, breakup, conflict resolution and cooperation are separate events. Ally/enemy ID lists change symmetrically, so existing hostile-power target selection responds. This is not mind control, a political-faction transfer, an invented physical fight, or a promise to erase role-based hostility forever. Existing powers and combat still have their own targeting and legality rules.

## Practical cooperation

An eligible active ally pair can perform one costed aid action per interaction:

- First aid reduces up to 0.02 injury and costs the donor 5 energy.
- Shared supplies transfer up to 5 abstract energy with 1 additional donor energy overhead; this is a logistical abstraction, not an energy-transfer superpower.
- Otherwise a planning session adds up to 0.25 knowledge points to a partner and costs the donor 2 energy. Knowledge caps at 100 and actual gain is recorded.

These effects modify actual character state; goal completion is evaluated separately from recorded outcomes. No helper directly marks a goal complete. All actions require living eligible characters; incapacity or confinement blocks interaction.

## Limits and persistence

Configuration fields: `max_pairs` (default 256,1..1024), `max_interactions` (default 32,1..128 per year), `encounter_rate` (default 0.6,0..1), `history_limit` (default 256,1..512). Explicit goal targets get candidate-pair priority. Additional candidates are drawn through a seeded shuffled neighbor pass, avoiding an all-pairs population scan. Stored active pairs persist; dead/missing pairs are pruned to admit newcomers. Their recorded history/counters remain subject to retention limits. At the pair cap, new pairs must wait for capacity; the model is not everyone speaking with everyone every year.

State lives in `story.social_dynamics` inside the world checkpoint. Keyed year/pair RNG never consumes the annual world's main RNG. Repeating a tick for the same or earlier year does nothing. JSON save/resume preserves future social behavior. Agent counters grow only with existing world identities; interaction history and pairs are bounded.

## Opt-in social choices during threat campaigns

`campaign.tactical_social` is a separate, explicitly enabled encounter system. It uses the same persuasion formula but requires each fighter's own explicit `persuasiveness`, `susceptibility`, `morality`, and `goal_positions` preferences. A goal position is a number from -1 to 1 for a named objective; it is not evidence that a measurable campaign goal has been completed. Each team's truthful proposal names its `objective`, `stance` (-1 or 1), and `harmfulness` (0 to 1). Alignment is the target's intrinsic position multiplied by the proposed stance. Accepting a coalition does not erase those intrinsic preferences or change powers, mastery, health, identity, or moral parameters. A later opposing offer can recruit the character back.

Defaults are `offer_rate: 0.15`, `cooperate_rate: 0.2`, `max_offers_per_pair: 1`, `offer_interval: 5`, and `history_limit: 256`. Team objectives must be explicit for both `heroes` and `threat`; the campaign must supply a held `devastation_powers` ability for every fighter who might defect. Offer caps may be configured from 1 to 3 per directed pair, interval from 1 to 100 turns, and history from 1 to 1024 events. These are fictional assumptions, not empirically calibrated psychology or canonical character outcomes.

At most one character per team plans a social action per turn. Social choices require interception/engagement and consume an otherwise available combat action; evacuation or devastation already chosen for that turn takes priority. A character intrinsically opposing its coalition's objective will not recruit others into it or initiate coalition aid, but remains eligible to receive an opposing offer. Offers are voluntary, informed, non-coercive proposals rather than telepathic control.

A completed offer costs 5 energy. A completed cooperation action also costs 5 energy and adds up to 5 guard to an active ally, with total guard capped at 35. These effects occur after combat, so an interrupted, stunned, incapacitated, or newly incompatible actor/target cannot complete the planned action. Unexecuted offers do not consume the finite offer budget. An earlier recruitment prelude consumes one offer in that same directed pair's budget, preventing repeated rolls until a desired result occurs. Failed proposals are recorded with their probability and draw.

Acceptance changes actual combat teams, emits coalition-conflict-resolution and former-alliance-break events, and updates relationship trust/tension. Those labels describe real allegiance changes, not the deletion of all psychological disagreement. Successful attacks reduce trust and increase tension; witnessed devastation reduces trust in its perpetrator according to the observer's own opposition to the objective and morality. Bounded event history and cumulative event counts preserve an explanation of what changed. No additional characters are spawned, including in solo controls.

The campaign distinguishes `threat_renounced` when the original active threat joins the protecting coalition and no active annihilators remain, from physical `threat_stopped`, population destruction, and unresolved-at-horizon. This modeled renunciation does not imply intrinsic beliefs were permanently rewritten. Keyed RNG streams and saved state make the configured behavior reproducible without consuming legacy combat RNG streams. Omit the feature to retain legacy behavior exactly.
