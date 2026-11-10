# Stat powers in individual annual worlds

Characters hold explicitly configured `stat_powers` abilities. No new ability is silently assigned to random citizens, and no catalog item without an effect definition is created. The same bounded modifier dispatcher is used in tactical campaigns; annual durations and cooldowns are measured in **years**, not turns.

## Live annual attributes

The registered annual numeric gameplay attributes are age; ambition, compassion, greed, curiosity, charisma; persuasiveness, susceptibility, morality; injury, energy; wealth, income, reputation, followers; knowledge_points and healer_burnout. Per-power experience is addressed as `power_mastery.Healing.xp` (substitute an actually held power). XP changes immediately affect that power's derived mastery and usable potency, without awarding invented practice-use history. A temporary bonus's expiry subtracts its installed XP while preserving real intervening practice.

`mastery_level`, `power_xp`, `app_score` and `app_rank` are derived summaries, not independent writable stats. Change their underlying per-power XP, reputation and followers. Combat-only vigor/resolve/guard/power_levels and combat-profile offsets are rejected by annual scenario validation because annual citizens have no corresponding consumer. Social-stat effects require enabled `world.social_dynamics`. An absent stat or unheld power is not created merely by targeting it. Only the tactical adapter gives combat fields their tactical meaning.

Identity IDs, relationship IDs, dates, cooldown clocks, death flags, counters, job/party labels and historical achievements are not numeric character attributes. Powers cannot rewrite those records through arbitrary paths. This is intentionally not arbitrary state editing.

## Real effects and timing

At the start of each year, before goal planning, expired modifiers are removed. Ready stat abilities compete for the normal annual power-action opportunity (at most 24 agents per year, one action per agent); they are tried before that character's ordinary held catalog powers. A successful stat cast uses the opportunity, consumes the configured energy once, and records exact targets/deltas. A failed/unavailable cast may fall back to an ordinary power. Suppression, freezing, stunning, stasis, quarantine, hospitalization, imprisonment and unresisted fear prevent stat casting too.

Targets must be living and in the caster's current named location. Self, one other and bounded local-area scopes are supported; there is no physical-distance map or off-screen unlimited remote targeting. `target_id` in a scenario can name a configured character key and is resolved to their persistent ID. Ally/enemy selectors use actual relationship links. Missing attributes and unsupported targets do not spend energy.

Effects are live: personality stats affect decisions, social stats affect persuasion, injury/energy affect action eligibility, and per-power XP affects mastery. Income is special because employment recalculates ordinary wages: active snapshot income deltas are reapplied to the new job wage before wealth changes. Expiry restores the ordinary wage instead of eroding it. Age changes also shift birth_year so future annual aging does not immediately erase the effect.

The modifier engine uses bounded **snapshot deltas**, not a permanently reevaluated algebraic formula. Multiply captures a percentage of the value at casting; set captures the difference to the requested value. The actual clamped delta is retained and later subtracted. Other real changes, such as earnings or practice, remain; saturation or resource consumption means expiry is not a rewind of history. No effect resurrects a dead person by rewriting a boolean.

State lives on the affected character and caster, so ordinary world checkpoints preserve active effects, expiry clocks and cooldowns. No-stat-power scenarios retain previous RNG behavior. JSON roundtrip/resume is tested in modern, evolution, monarch and wheel modes. Aggregate versus mode has no individually modeled people and does not run these powers.
