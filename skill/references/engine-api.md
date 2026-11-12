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

## Auto mode (release 1.1.0)

Auto mode uses the exact normal action, power, rest, check, energy, cooldown, enemy-response and ending rules. It is a random legal player, not an optimizer. `listAutoOptions()` returns every currently allowed ordinary action, action with one legal attached power, standalone power, and unspent rest. Each concrete option has equal selection probability, so an action with more legal power combinations has more entries. There is no lookahead at future scenes or outcomes; legal but unwise choices remain possible.

- `autoStep()` commits at most one randomly selected option; returns `{choice?, stopped, status}`. Reasons are `ended`, `no-valid-options`, or null. Inspect `choice.kind`, `actionId`, and `powerId` as applicable.
- `runAuto(maxSteps=200)` is a bounded headless run (integer 1–1000). Returns final result plus `steps`; `step-limit` means paused, not defeat or an invented ending. A deadlocked adventure stops without changing its status.
- Auto choices use a separate seeded RNG stored as optional `state.autoRng`. Old version-1 saves remain compatible. Same initial seed/character and same sequence of manual/auto calls reproduces results; a saved run resumes exactly. Starting a new game in the UI generates a new seed, editable before play.
- `exportLog()` retains all normal events plus `auto_choice` (chosen option, scene and count of legal options) and `auto_arrival` narrative events. UI **Export log** remains readable text; raw JSONL is available through CLI.
- CLI commands: `autoOptions`, `autoStep`, and `auto` with optional `maxSteps`. Use `new` with a validated `character` before auto play, or `importSave` to continue any existing run.
- Browser: start any default/custom/imported character, then **Start auto**, **Pause auto**, or **One auto turn**. Speed is 1.5 seconds or 0.25 seconds per turn. Auto pauses after 200 turns; resume explicitly. Manual choice/power/rest controls pause auto before acting. New game/import also pause it. Imported saves never silently enable auto.
- `window.CRPG_GAME` also exposes `listAutoOptions`, `autoStep`, `startAuto`, `stopAuto`, and `exportLog`. Normal save/export surfaces remain available.

Existing distributed standalone HTML games must be rebuilt from their adventure JSON using this runtime to gain the new UI. Any valid adventure can use auto mode; reaching an ending is not guaranteed for authored loops or deadlocks. These stop safely with the current log and save intact.

## Seeded procedural generation (v1.2.0)

`require('./generators')` (browser `CRPG_GENERATORS`) exposes `generateCharacter(seed, options)` and `generateAdventure(seed, options)`. Seed must be an integer 1–4294967295. Options `genre` is `fantasy`, `science_fiction`, `superhero`, `weird_west`, `cyberpunk`, `horror`, `post_apocalyptic`, or `noir`; omitted genre is selected from the seed. Adventure `stages` is 3–8 (default 4–6). Same generator version, seed and options reproduce identical data. This is a finite template grammar, not unrestricted AI storytelling or generation of new rules.

Curated characters use the full 78-point score budget, scores 6–18, and 3–5 powers composed from supported effects with normal budgets, cost, duration and cooldown. Names and prose grant no extra effects. Generation selects and varies effect recipes, not arbitrary scripts. Players can review/edit the result or import it normally.

Adventures have 3 nodes per stage (route choice and two obstacle routes), a finale, and two ending scenes. A global deadline and ordinary health loss allow defeat. Routes include checked nonpowered solutions and bounded capability bonuses. The branch graph is forward-moving, both success and failure advance, and every non-ending scene has a zero-energy nonpowered action. That guarantees an available attempt, not survival or victory. Evidence and completed variant preparation unlock easier finale approaches. Patrols can retaliate; powers and resources obey the same core rules. Rest is limited to one midpoint opportunity. The template library currently has eight genre vocabularies and six side obstacles, so motifs can repeat.

UI: enter generation seed and genre; Generate character fills the custom editor, Generate adventure replaces the setup world without starting play. Choose default/custom/imported character, then play normally or Start auto. Export adventure JSON preserves the generated world for `node build.js world.json World.html`. Generated saves embed the adventure data; the UI and CLI restore it before importing state. The same launch HTML's autosave slot retains the most recent generated run. Export saves before starting another run. Old authored saves still work in their original launch HTML.

CLI JSON-lines commands: `{"command":"generateCharacter","seed":42,"options":{"genre":"superhero"}}` returns character data without changing the active run; `{"command":"generateAdventure","seed":42,"options":{"genre":"superhero","stages":5},"character":OPTIONAL_CHARACTER,"playSeed":OPTIONAL_ROLL_SEED}` starts that generated world; `exportAdventure` returns its JSON. Use `auto`, `exportSave`, and `exportLog` normally. A generated save can be imported even when the CLI started with another world. The low-level Engine still requires constructing it with the saved adventure before `importSave`.

Run `node generators.test.js` for 500 seeded worlds/characters, 1,500 complete default/custom/nonpowered auto playthroughs, graph reachability, legality, budget limits, exact continuation, portable saves, invalid inputs and outcome variation. UI tests use a DOM harness, not actual browser rendering.

Mission option `mission`: `recovery`, `investigation`, `escort`, `sabotage`, `reconciliation`, or `containment`; omission selects from the seed. UI exposes the same selector. Objectives, finale check stats, stakes and ending text vary by mission, while route topology remains shared. Eight genre vocabularies use descriptive locations, roles and objects, not recurring named NPCs/artifacts. Players can imagine different people behind the same role. This is variety within templates, not a claim that every generated story has a unique plot structure.

## Expanded missions, generator version 2

Ten mission IDs are exported in `G.missions`; `G.variants[mission]` lists the three valid variant IDs. Option `variant` selects one explicitly; omission selects from the seed. For example `generateAdventure(42,{mission:'evacuation',variant:'flood',genre:'superhero'})`. Invalid cross-mission variants are rejected. Generator version 2 and variant are included in world identity and metadata. Existing version-1 generated saves remain playable because they embed their original world rather than regenerating it.

An optional first-route preparation encounter changes its stat, capability bonus, deadline multiplier, reward and failure effects for the chosen variant. Four shared profiles represent time pressure, energy depletion, wounds or distraction. Completing preparation unlocks `prepared` at the finale; alternate attempts and a compromise remain available. This is bounded variation on the route graph, not thirty wholly unrelated engines.

## Hex sandbox module

`require('./sandbox')` / browser `CRPG_SANDBOX` exports `generateSandbox(seed, {sandboxVariant, radius, genre})`, `SandboxEngine`, `createEngine(adventure, character, rollSeed)`, `variants` and six axial-coordinate `directions`. Variations: `frontier`, `ruin_scavenging`, `island_hopping`, `haunted_wilds`. Radius must be 2–6, default 3. Seed follows the normal integer limits. Genre affects the default character, not terrain.

Use `createEngine` for mixed mission/sandbox code. It selects the existing Engine for missions and SandboxEngine for sandbox metadata. SandboxEngine materializes a coordinate’s scene on first entry, from a coordinate-derived seed independent of visit order; the unvisited map initially contains only placeholder coordinates. Directions outside the finite hex boundary are absent. Discoveries, one-time activities, surveys, rest use, enemy health and ordinary actions persist. `getState().map` lists only discovered coordinates. New action requirement `enemyAlive:true` restricts hostile patrol attacks to living opponents.

The sandbox has no mandatory goal or global deadline; camp offers a voluntary `finish` action after travel. Local actions can hurt, consume energy, distract, heal, grant items or affect enemies. Travel is otherwise free, so wandering does not guarantee eventual death or a completed story. Auto uses canonical legal previews and the existing bounded run limit. An auto step-limit is a pause, not a simulated ending.

Save/import: generated saves embed world data including placeholders and discovered scenes. Construct with `createEngine(saved.adventure)` then `importSave(raw)`; browser and CLI do this automatically. Exported sandbox JSON must be built with this version’s build script and sandbox module, not an old standalone runtime. CLI commands: `generateSandbox` (seed/options/optional character/playSeed), `map`, `exportAdventure`, then ordinary auto/save/log commands.

Tests: 500 characters/worlds, 1,500 mission playthroughs, 960 auto runs spanning every genre/type/variant combination, and sandbox lazy discovery, revisits, coordinate reachability, persistence and legal roaming. UI tests are a DOM harness, not browser visual QA. Sandbox tests explicitly label test-only healing used to isolate complete-map graph reachability from combat survival.


Character option `characterMode` is `broad` (default) or `curated`. Broad uses bounded rejection sampling against `validatePower` without changing manual validation: 0–8 powers, 1–5 effects each, 6–18 scores with total ≤78, all allowed effect types and their full bounded numeric ranges. Custom effect types exclude `restore_energy` as before. Each power has at most 200 candidate attempts before a small valid fallback. Tags are sampled from canonical capabilities and common action tags, not arbitrary strings. These samples are nonuniform and not guaranteed to be balanced or useful in every adventure. Finite 32-bit seeds do not enumerate the entire manual possibility space; do not claim every legal character is reachable.
