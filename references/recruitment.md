# Voluntary recruitment before a world-threat campaign

Version4.6 adds an optional `recruitment` prelude to `threat_campaign.py`. It is not mind control. Each targeted original hero receives one truthful proposal to join the deliberate destruction of the world population. Their decision is a seeded model of voluntary persuasion, not a claim about real psychology or a guarantee that a heroic character would betray their values. No speech is generated or presumed successful. No powers bypass consent and no repeated attempts grind toward a guaranteed conversion.

## Configuration

```json
"recruitment": {
  "persuasion": 0.6,
  "mode": "persuasion",
  "targets": [
    {"id":"vesper", "trust":0.15, "goal_alignment":0.0, "moral_resistance":0.95, "devastation_power":"Shadow Blasts"},
    {"id":"cipher", "trust":0.10, "goal_alignment":0.0, "moral_resistance":0.95, "devastation_power":"Cybernetics"}
  ]
}
```

Traits are explicit assumptions on a0..1scale, not inferred canonical facts. The default pitch skill0.6 is moderate; defenders'0.95moral resistance is high, trust is low, and their goals do not align with destroying the population. Their willingness is consequently very low, not tuned after inspecting output. For each target:

`logit = -2 + 2*persuasion + trust + 2*goal_alignment - 4*moral_resistance`

`acceptance_probability = 1/(1+exp(-logit))`

The example gives Vesper approximately1.154% and Cipher approximately1.099% acceptance per attempt. Each hero gets an independent ID-keyed seeded roll. This does not imply zero moral resistance; the nonzero tail is a declared fictional uncertainty assumption. `mode:"refusal_control"` fixes acceptance probability at0 for every target to isolate the early-warning benefit of a failed pitch. That is a control experiment, not a persuasion result. Omitting the entire prelude preserves baseline gameplay and randomness exactly.

## Consequences and outputs

Accepted targets retain identity, abilities and independent mastery but join the threat coalition. They really attack remaining heroes and may use their configured damaging power to devastate population, consuming10energy. The original villain keeps the original decision and devastation RNG streams; supporters use ID-keyed separate streams. If the original threat falls, active supporters continue. Stopping the threat means incapacitating the entire active threat coalition, not merely the original attacker. If both defenders join there is no remaining hero and all three can devastate.

Rejection warns the defending side before turn1 (`detected_at:0`), but normal travel delay still applies. The truthful pitch does not magically teleport defenders. At least one rejection is required for this alert; both acceptance creates no defending team. Non-targeted defenders share their team's alert.

The saved `recruitment` block contains original allegiances and a trace with every trait, probability, draw, decision and new allegiance. Summary fields distinguish original heroes' incapacitation from current defenders, list recruited/rejected IDs, and identify original-threat incapacitation. Defection is not a hero death. Saving/resuming never repeats recruitment. Population conservation, bounded combat, and honest uncertainty conventions remain those of the world-threat mode. This is not a model of betrayal reversals, persuasion during combat, or arbitrary diplomacy.

## Character-owned persuasion (v4.7)

Use `assets/scenarios/character-recruitment.json` and set recruitment `mode:"character"`. Each fighter must declare its own `persuasiveness`, `susceptibility`, and `morality` (0..1). The recruiter’s persuasiveness and target’s susceptibility/morality are read directly, not supplied as target-specific scenario overrides. Each fighter may have `goal_positions`, mapping up to16 named objectives to stances -1..1. These are explicit preferences, not completed-goal awards. The proposal names one objective and harmfulness0..1; missing objective stance is neutral0. Target entries only supply relationship trust and an actual held devastation ability. Legacy target goal_alignment/moral_resistance or scenario persuasion overrides are rejected in this mode.

The common annual/tactical persuasion formula is `sigmoid(-2 + 2*persuasiveness + 2*(susceptibility-.5) + trust + 2*alignment - 4*morality*harmfulness)`. Higher morality reduces acceptance of harmful proposals; neither morality1 nor susceptibility0 is a hard veto. The nonzero probability tail is an explicit fictional assumption, not a claim that anyone can be talked into anything. No dialogue-content evaluation or empirical psychological calibration is performed.

The old `persuasion` and `refusal_control` modes remain byte-compatible for reproducing the4.6study. New example uses the existing hero powers and character-owned opposition to destruction; it does not overwrite old experimental results. The annual relationship engine is not secretly inserted into tactical campaign rounds. Recruitment alone remains one informed prelude. Explicitly enabling `tactical_social` adds the separate bounded ongoing adapter, including offers to recruit a former ally back; see `social-dynamics.md`.
