# CRPG Forge engine API and authoring contract

`engine.js` exposes `CRPG` in a browser and `require('./engine.js')` in Node. No DOM, network, evaluation, or dependency is used. All adventure and character input is data, never JavaScript. Engine version 1.

## Rules

Six integer scores STR, DEX, CON, INT, WIS, CHA, each 6–18, total at most 78. Suggested array: 15, 14, 13, 12, 10, 8. Modifier is floor((score−10)/2). Character maximum health = 20 + 2×base CON modifier; energy = 12 + max(0,base WIS modifier). Temporary score boosts affect checks and DEX defense, not maximum health/energy, avoiding recovery loops. Character names and powers are custom. No free innate capability tags: species traits must also be costed powers. This is an original ruleset using familiar ability-score conventions, not 5e compatibility.

Every uncertain action rolls a generated d20 + actual relevant ability modifier + authored situation modifier + active applicable power bonus against its announced DC. Ties succeed; natural 1/20 have no special rule. Damage is flat. Powers do not create guaranteed successful checks. Failed actions can injure, spend time and resources, change branches, or lose the adventure. Costs apply whether a check succeeds or fails.

Seeded xorshift32 randomness is saved and restored, allowing repeatable headless tests. Start normal games with a fresh seed; specify a seed to compare builds. It is not cryptographic randomness and is not intended for gambling or adversarial competitive play.

A turn is one committed action, power use, or rest, not an arbitrary unit of story time. Timed effects expire on committed turns. A duration-1 standalone protective effect protects against that turn's enemy response; duration-1 attached check assistance affects the chosen action. Cooldown 1 blocks reuse until one other committed action advances time. Cooldown 0 allows reuse while energy remains. Rest requires `scene.rest:true`, can be used once per location, restores all energy and 6 health and clears conditions. Authors should not provide an unlimited chain of trivial rest locations. Global optional turnLimit ends an unfinished adventure in defeat.

## Character data

```
{"name":"Aster Vale","stats":{"STR":12,"DEX":14,"CON":13,"INT":15,"WIS":10,"CHA":8},"powers":[
 {"id":"insight","name":"Pattern Sight","description":"Analyze faint connections","cost":2,"cooldown":0,"effects":[{"type":"check_bonus","stat":"INT","tags":["investigation"],"amount":3,"duration":2}]}
]}
```

Maximum 8 powers. IDs are short safe identifiers. Score allocation, effect costs, and all validation errors are checked by the canonical validators. Character-import identity and mechanical definitions are preserved or explicitly rejected, not silently weakened.

## Closed composable power system

Every power is custom data inside these existing primitives. Do not modify engine code to implement a requested character power. Approximate it with supported effects and disclose what the approximation cannot do.

Each power needs id, name, cost 1–12, effects (1–5). Optional description, `stat` for standalone offense (default INT), cooldown 0–10. Effects have amount (default1), duration (default1, maximum10), and type-specific fields below. Numerical amounts must be positive integers. A single effect's bonus/resistance/stat adjustment is at most4; damage/healing/shields are at most12. Matching tags on check assistance do not grant capabilities; only grant_tag and transform do. Combined positive check bonuses cap at8.

Power construction budget: each damage/heal/shield/drain effect costs ceil(amount/3) points; other effect amounts cost amount points. Each duration turn after the first costs one more point. Capability/transform effects also pay one point per capability after the first. Total construction points cannot exceed 3×activation energy cost. Cooldowns never discount the budget. Energy regeneration cannot be placed on custom powers, avoiding free-energy cycles.

| Effect | Real behavior | Extra fields |
|---|---|---|
| check_bonus | Adds applicable bonus to any stat check, combat or noncombat | stat optional; tags optional (any overlap with check tags) |
| check_penalty | Lowers an opposing check's DC when oppositionStat is declared; reduces active enemy attack | optional tags limit opposition checks |
| stat_boost | Raises a raw ability score, then recalculates modifier; raw boosted score capped26 | stat required |
| stat_debuff | Lowers target score for checks with oppositionStat; lowers enemy attack when matching enemy stat (defaultSTR), and DEX debuffs reduce attack DCs | stat required |
| heal | Restore health up to maximum | amount |
| shield | Add ablative HP up to maximumHP | amount |
| damage | Deal fixed damage to current enemy only on successful check | amount |
| drain | Deal fixed damage on success, heal half actual damage rounded up | amount |
| resistance | Reduce incoming flat damage, combined resistance cap8 | optional tags match damage tags, default incoming physical |
| grant_tag | Grant temporary capability; unlocks explicit authored capability routes/check bonuses | tags required |
| transform | Boost one score and grant capabilities for duration | stat, tags required |
| summon | Temporary assistance on matching checks, not a separate autonomous combatant | optional stat/tags |
| inflict_condition | Apply target condition after successful check; weakened/distracted/restrained penalize enemy attacks2, exposed reduces enemy defense2; enemy silencing unsupported | condition |
| remove_condition | Remove one player condition | condition |
| cleanse | Remove all player conditions | no extra fields |

`restore_energy` is reserved for adventure rewards and rejected in custom powers. Target is implicit: enemy for damage, drain, stat_debuff, check_penalty and inflict_condition; self otherwise. Contradictory explicit targets are rejected. Hostile effects are bound to their scene target and do not carry onto unrelated enemies. Condition amounts are fixed rather than potency-scaled. Conditions: weakened (−2 checks), distracted (−2 checks), restrained (enemy attack penalty when inflicted), exposed (−2 player defense), silenced (cannot use powers). They are bounded mechanics, not unrestricted narrative mind control.

Capabilities are closed tags: flight, teleportation, swimming, burrowing, climbing, super_speed, invisibility, disguise, mind_reading, empathy, persuasion, intimidation, animal_speech, spirit_speech, translation, remote_sight, darkvision, tracking, danger_sense, xray_sight, hearing, scent, analysis, hacking, repair, crafting, creation, telekinesis, magnetism, element_control, plant_control, illusion, healing, shapeshift, size_change, intangibility, shielding, summoning, time_sense, luck, strength, precision, memory, survival.

A tag does not execute arbitrary prose. It has consequences only through an authored route, check prerequisite, or capabilityBonus. Flight might unlock an upper window, but cannot automatically invent a route absent from adventure data. Creation is not unlimited inventory fabrication; an authored creation-tag action specifies the item and its effect. Time_sense is not rewriting the whole event log. Summoning grants assistance rather than arbitrary extra turns. The authoring skill must audit each offered power for meaningful supported uses and disclose unmatched imported capabilities.

## Adventure data

```
{
 "id":"example","version":1,"title":"Example","start":"gate",
 "defaultCharacter":{...}, "turnLimit":40, "deadlineText":"The convoy departs.",
 "scenes":{
  "gate":{"title":"The gate","text":"Two guards hold the entrance.","actions":[
   {"id":"talk","label":"Negotiate entry","check":{"stat":"CHA","dc":14,"modifier":0,"tags":["social"],"oppositionStat":"WIS","oppositionScore":12,"capabilityBonus":{"empathy":2}},"success":{"text":"They admit you.","next":"inside","effects":[{"type":"flag","key":"trusted","value":true}]},"failure":{"text":"The delay costs you.","effects":[{"type":"damage","target":"self","amount":2}]}}
  ]},
  "inside":{"text":"You are inside.","ending":"victory"}
 }
}
```

Scenes need text and actions unless an ending; optional title, rest, enemy. Ending values: victory, defeat, escape, mixed. Narrative flow only occurs through explicit next links. Scene action IDs unique within a scene. Actions may have an energy cost, check, requirements and success/failure outcomes. No check means a genuinely certain action, not an invented roll.

Requirements: `{flag:'name',value:true|false|scalar}` (absent counts false), `{item:'key'}`, `{tag:'flight'}`, `{energy:3}`, or `{enemyDefeated:true}`. Arrays mean AND. Unmet actions are filtered from listActions; preactivate a capability power to reveal a capability-only route. For a route that can be previewed with a power, use `check.requiresTag` instead. Authors must ensure several mundane approaches remain viable without a power.

Check fields: stat, dc (1–40), modifier, tags; optional requiresTag, capabilityBonus mapping capability tag to bonus. Optional oppositionStat/oppositionScore allows debuffs to reduce the DC by the change in opposing ability modifier. Combined positive power bonus caps8. Show DC and full modifiers *before* confirmation.

Outcome fields: text, next, effects. Narrative effects include all applicable built-in effects plus:
- flag {key,value} (default true)
- item {item,remove?}
- resource {amount} (positive or negative energy, clamped0..max)
- damage {target:'self',amount} for player consequences
- condition {condition}
- next {scene}

Use explicit target for damage consequences: default damage target is enemy. Unknown effects and next IDs fail validation.

An encounter is a scene with `enemy:{name,hp,attack,damage,defense,stat?,tags?}`. Enemy health tracks independently per scene. After a committed action/power, a surviving enemy rolls d20 + attack (minus applicable debuffs) against player defense10+DEX modifier (−2 if exposed), and deals fixed damage on a hit. Attack is a bonus, defense defaults12 for standalone powers, stat defaultsSTR, damage tags defaultphysical. Authors provide normal attack actions as checks with fixed-damage success effects and enemyDefeated exits. Enemies respond automatically so skipped enemy turns cannot depend on narration. Leaving to a nonterminal scene can still trigger that encounter's response; terminal outcomes end the exchange. Healing and waiting in combat also incur response risk. HP0 always means defeat.

## API

```
const {Engine,validateAdventure}=require('./engine.js');
const engine=new Engine(adventure, null, 12345);
console.log(engine.listActions());
console.log(engine.preview('talk','insight'));
engine.act('talk','insight');
const save=engine.exportSave();
engine.importSave(save);
console.log(engine.exportLog());
```

- `validateAdventure`, `validateCharacter`, `validatePower`: arrays of errors, empty means accepted.
- `getState()`: detached snapshot of state, plus character, sceneData, capabilities, enemyHp.
- `listActions()`: available action definitions with `preview` added; empty after ending.
- `preview(actionId,powerId?)`: allowed/reasons, cost, success/failure text, enemyResponse, check or null. Check includes stat, score, effectiveScore, statModifier, situationalModifier, powerBonus, baseDc, dc and totalModifier.
- `act(actionId,powerId?)`: validate before mutation, commit roll and costs, apply consequences, advance time, enemy response; returns snapshot. Attached harmful power effects require a checked action and apply only when it succeeds. Damage/drain additionally require an attack-tagged check and live enemy; they cannot turn a trivial social check into an attack. Stat debuffs/check penalties may instead attach to an authored oppositionStat check without an enemy encounter.
- `previewPower(id)`: standalone power allowed/reasons/cost/check. Harmful standalone powers require live enemy and roll power stat versus defense. Helpful powers do not need an uncertainty roll.
- `usePower(id)`, `rest()`: commit and return snapshot.
- `exportSave()`: JSON including adventure ID/version, character, full world state, RNG and full log.
- `importSave(text)`: validates format/version, adventure compatibility, character, resource limits, IDs, effects and collections before replacement. Throws on invalid data without modifying current game.
- `exportCharacter()`: character JSON.
- `exportLog()`: one full JSON event per line, with all actual checks, rolls, costs and results.

Saves are user-editable files, not anti-cheat signatures. Import validation rejects malformed or incompatible states, not every deliberate fictional edit. UI must treat names/text as text, never executable HTML. Browser autosave is convenience; explicit exported saves are the portable source of truth.
