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
