# Stat manipulation powers

Custom `stat_powers` definitions are held abilities that change real character values read by the simulation. They are not prose-only powers or permission to edit arbitrary JSON. The annual and combat integrations activate them through their existing action budgets; the core dispatcher does not itself decide whether an actor has a turn.

## Definition

```json
{
  "id": "dampen-confidence",
  "scope": "other",
  "relation": "enemy",
  "energy_cost": 10,
  "cooldown": 3,
  "target_limit": 16,
  "effect": {
    "path": "persuasiveness",
    "operation": "add",
    "value": -0.25,
    "duration": 2,
    "stack_key": "confidence-dampening",
    "stacking": "replace",
    "max_stacks": 4
  }
}
```

Place up to 32 definitions in a character's `stat_powers` list, with unique `id` values. `scope` is `self`, `other` (one other character), or `local` (bounded area). Optional `target_id` names a particular character. `relation` is `any`, `ally`, or `enemy`. The dispatcher tries definitions in their configured order and uses stable sorted character IDs for selection, without random draws. An ineligible ability falls through to the next. A completed cast consumes the configured energy cost once, even for an area effect. A wholly unavailable or stack-capped cast costs nothing. The integration also consumes a real activation/action, so definitions do not create extra turns.

A cooldown of 3 permits the next cast at time `t+3`; duration 2 applies at time `t` and `t+1`, expiring before actions at `t+2`. Time is rounds in combat and years in the annual world. One character cannot cast twice at the same time. Cooldown, active modifier records, and actual changed values are serialized on the character, preserving JSON save/resume behavior.

## Supported attributes and real consumers

Annual numeric attributes:

- Age (0–10,000), with corresponding birth-year adjustment so subsequent aging does not undo the effect.
- Ambition, compassion, greed, curiosity, charisma, persuasiveness, susceptibility, morality, injury (0–1).
- Energy, reputation, knowledge points, healer burnout (0–100).
- Wealth (0–10,000), income (0–1,000), followers (0–100,000).
- `power_mastery.<held power>.xp` (0–100,000). Derived levels and compatibility XP are synchronized from the individual power record. This is the annual route to changing mastery; directly editing `mastery_level` would be overwritten by progression and is therefore rejected.

Combat numeric attributes:

- Vigor, energy, resolve (0–100), guard (0–35).
- Present character social attributes, where the encounter actually uses them.
- `power_levels.<held power>` (0–5) for encounter-specific mastery.
- `combat_stats.damage`, `.guard`, `.heal`, `.control`, `.initiative` are signed profile offsets bounded to −100 through 100. `.accuracy` and `.evade` offsets are bounded to −1 through 1. Missing offsets initialize to zero. Combat integration applies them to actual selected ability profiles and clamps the resulting mechanics sensibly. A multiplier applied to a zero offset remains zero; use an additive offset for profile boosts.

A target must actually possess the requested attribute. Combat offsets require a real combat fighter and cannot silently add decorative damage fields to an annual citizen. Per-power paths must name a held power and an existing corresponding mastery record. Loss of a power during an effect does not cause expiry to restore the lost power.

IDs, names, roles, teams, booleans, death state, historical counters, timestamps, and raw state bookkeeping are not numeric character attributes and cannot be changed through this engine. Rankings/app scores and compatibility mastery are derived measurements: manipulate their genuine inputs instead. No field allows arbitrary path traversal or executable expressions. Each mode should reject unsupported definition paths during its own configuration validation.

## Operations and stacking

`add` installs a signed amount. `multiply` scales the current value once (factor 0–100); it is a snapshot operation, not an ongoing multiplier on all future changes. `set` moves the current value toward a configured number. Every operation clamps to the stat's bounds and records only the **actual installed delta**.

Effects group by `path` plus `stack_key`, across sources:

- `replace`: removes the prior group's installed deltas, then installs the new effect.
- `refresh`: extends existing group expirations without reapplying the magnitude or changing its source/magnitude.
- `stack`: adds effects up to `max_stacks` (1–32).

At expiry, the engine subtracts only the installed delta from the then-current stat. Intervening damage, resource spending, progression, and ordinary changes remain. Example: energy 50 receives +10, then spends 7; expiration returns 43, not 50. A +10 effect at energy 95 installs only +5 and later removes only 5.

**Clipping is intentionally lossy, not an invisible reserve of health or energy.** If a boosted resource is reduced to zero, expiration cannot subtract below zero or restore the damage. Opposing modifiers and simultaneous expirations are processed in saved application order, with bounds applied at each step. Reversible deltas do not promise mathematically reversible results after clipping. `set` is also temporary delta installation, not a lock that prevents later changes.

## Scope and safety limits

The caller supplies spatially valid candidates. `local` additionally requires matching nonmissing `location` (annual) or `region` (encounter) values; an absent location never means everyone in the world. `other` cannot select the caster. Team equality determines combat allies; explicit ally/enemy relationships determine annual relations. Dead or incapacitated targets are not selected; no resurrection is implied.

Area effects select at most `target_limit` (1–64, default 16) people. Each character stores at most 128 active effects. Duration/cooldown are bounded to 1–10,000 native time units. Nonfinite numbers, booleans masquerading as numbers, unknown fields, invalid paths, duplicate ability IDs, and backward modifier clocks are rejected. Casts are validated on copies before committing, avoiding partial application after a validation error. These bounded assumptions keep the system deterministic and auditable rather than claiming unrestricted reality alteration.

## Core API

- `validate_effect(spec)` and `validate_stat_powers(definitions)` return normalized copies.
- `apply_modifier(target, spec, now, source_id, effect_id)` installs a directly authorized effect and returns actual delta details.
- `expire_modifiers(target, now)` removes expired deltas before that time's actions.
- `active_modifiers(target)` returns a copied active ledger.
- `select_targets(source, candidates, scope, target_id=None, limit=16, relation='any')` returns stable bounded targets.
- `stat_power_action(source, candidates, now)` performs one available configured cast and returns an event with target results, or `None`.
