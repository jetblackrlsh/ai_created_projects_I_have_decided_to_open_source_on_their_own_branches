# CRPG Forge

A reusable, offline, text-first CRPG engine for authored adventures with branching choices, visible dice checks, custom characters, and composable powers. It runs without an account, subscription, server, or online AI.

## Play

Download the complete project or its packaged HTML adventure. Open **Adventure.html** in a current desktop Chrome browser. It contains the rules, interface, and adventure in one file; no installation is required to play. Choose the prepared protagonist or build/import your own character before starting.

The target platforms are current Linux, Windows, and macOS computers with Chrome. The engine and headless interface are tested in Linux. Interactive browser testing could not be completed: the cloud browser disallowed local-file URLs and could not reach the workspace HTTP preview. This is not a claim of hands-on testing on Windows, macOS, or Linux browser UI.

Use **Export save** to keep portable checkpoints outside the browser. Import the save into the same adventure/version on another computer to continue. Browser autosaves are convenient, but can be cleared or behave differently for local files. Keep explicit exports. Character and adventure-log exports are available too.

## Auto mode

Start with the prepared character, create one, or import a character, then choose **Start auto**. The CPU randomly chooses among actions it can currently perform, including power-assisted actions, powers and rests. It follows the same rules and can win, lose, or reach a mixed ending. **Pause auto** lets you take over; **One auto turn** advances one choice. Choose Watch or Fast pacing. Export the usual readable adventure log and portable save at any time.

No online AI or adventure-specific scripting is required. The CPU does not strategize, invent actions, or guarantee victory. It pauses on no legal options or after 200 auto turns to avoid an infinite loop; the game is preserved, not marked defeated. Resume if desired. The saved random state makes continuation reproducible; a fresh new game starts with a fresh seed.

For headless play: `{"command":"auto","maxSteps":200}`. Use `autoStep` for one turn and `autoOptions` to inspect current legal options. Export logs with `exportLog` and saves with `exportSave`. All valid adventures built with the updated runtime support this feature. Previously downloaded HTML games need rebuilding to gain it.

## Rules and powers

- Checks resolve as **1d20 + ability modifier + situational modifiers versus DC**. The modifier is `floor((score - 10) / 2)`.
- The six abilities are Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma. This is an independent game, **not D&D-compatible**.
- Attack damage is fixed. Resources, cooldowns, conditions, enemy responses, deadlines, and authored consequences make choices matter.
- Every power is a custom composition of supported effects. Names and fiction do not silently grant extra mechanics.
- Effects cover checks, stat changes, healing, defense, damage, control, transformations, capability tags, and summons. Capability tags can support movement, perception, social, technical, investigative, and other noncombat approaches when an adventure explicitly recognizes them.
- Summoning and transformation use bounded mechanical effects rather than a separate fully simulated world. Arbitrary free-text powers are not automatically interpreted.
- Ordinary, nonpowered approaches should remain viable in authored adventures. Viable does not mean guaranteed: failed rolls, resource exhaustion, and defeat are part of play.

The engine uses seeded pseudorandom dice. Identical state, seed, and actions reproduce results, which supports debugging and agent tests. It is not a cryptographically secure dice service.

## Build an adventure

Install a maintained Node.js release to author or test projects. Playing the already-built HTML does not require Node.js. There are no npm runtime dependencies.

```sh
node build.js adventure.json Adventure.html
npm test
```

The builder validates the adventure and embeds `engine.js`, `app.js`, and the adventure JSON in the `ui.html` template. Do not open `ui.html` itself as the finished game; it is a build template.

Author new settings, scenes, choices, enemies, characters, and powers as data. Use the supplied creation skill and API/reference documentation. If a requested power exceeds supported mechanics, choose the nearest honest approximation and explain the difference. **Do not modify the rules engine to accommodate individual adventure or power requests.** General engine maintenance belongs in a separately reviewed version update.

## Headless play

The same engine can be played through newline-delimited JSON commands without a browser:

```sh
node cli.js adventure.json 20261112
```

Send one JSON object per line. Each response is a JSON object containing `ok` and either `result` or `error`:

```json
{"command":"state"}
{"command":"actions"}
{"command":"catalog"}
```

Inspect the returned action IDs before choosing one:

```json
{"command":"preview","action":"AN_ACTION_ID"}
{"command":"act","action":"AN_ACTION_ID"}
{"command":"exportSave"}
{"command":"exportLog"}
```

Other commands include `new`, `previewPower`, `power`, `rest`, `importSave`, `exportCharacter`, `validateCharacter`, and `validatePower`. See `cli.js` for the exact command fields and the engine API reference for schemas. Agents should inspect previews, respect failure results, and never fabricate rolls or edit saves to manufacture a successful playthrough.

## Optional illustrated character sheets

The creation skill can generate illustrated character sheets when requested. It validates the character first and checks printed statistics and abilities against the authoritative JSON. The picture is a visual reference, not an import format: import its companion JSON to play. Unsupported concepts are represented only by disclosed, bounded mechanics. Private likeness references and franchise character art are not bundled with this CC0 engine.

## Storage, privacy, and limits

The game makes no network calls. Saves and logs stay on the player’s device unless the player uploads or shares them. Saves and logs are ordinary editable data, **not tamper-proof records or secure against their owner editing them**. Do not use them as competitive anti-cheat evidence or a security boundary.

This is an authored CRPG, not a live generative game master. Branches and recognized capabilities must be authored. Imported data is validated, but do not treat arbitrary downloaded adventures as trusted software: inspect any HTML or JavaScript before opening it.

## License and provenance

The original code, example material, and accompanying skill are released under **CC0 1.0 Universal**, matching this repository’s existing license. See `LICENSE` and `THIRD_PARTY_NOTICES.md`. This project was developed with AI assistance. No private campaign histories, user files, credentials, or third-party franchise assets belong in this distribution.

## Included example and authoring package

**Meridian: Borrowed Dawn** is a complete original adventure with 31 scenes and 10 endings. See `ADVENTURE_GUIDE.md` for spoiler-aware routes and authored consequences. `power-library.json` supplies 20 validated power recipes. `engine-api.md` documents the full data contract; `skill/` is the portable creation skill with its own matching runtime.

Validation: 33 engine tests, 7 independent regression groups, 2,500 seeded demo runs exercising 74 actions and all 31 scenes, and UI DOM-contract tests. Random-policy outcome counts are coverage tests, not measured game balance or typical player odds.

Release 1.1.0 auto-mode validation: 1,000 seeded powered/nonpowered runs produced 147 victories, 445 mixed endings and 408 defeats, with 1,000 distinct choice paths. These are test-policy outcomes, not player win-rate forecasts. Legal selection, bounded loops, deadlock detection, old-save compatibility, RNG continuation, log round-trips, and scheduled UI start/pause/step were tested. Browser visual QA remains unavailable as noted above.

## Seeded character and adventure generator

Use the **Seeded generator** section before starting. Enter a seed and choose Fantasy, Science fiction, Superhero, Weird west, Cyberpunk, Horror, Post-apocalyptic or Noir. **Generate character** fills the editable sheet with legal stats and either broad-rule powers or curated recipes. **Generate adventure** creates a branching world and its own default hero; you can instead use your custom/imported character. Then play yourself or press **Start auto**.

The same seed and genre reproduce the same content. Change the seed for another variation. This uses a bounded library of scene and power templates, not online AI or limitless new mechanics. Defaults produce 4–6 stages, with two routes per stage, a finale and meaningful victory/mixed/defeat outcomes. Every obstacle has a legal nonpowered approach, but attempts can fail. Evidence and variant preparation open finale opportunities.

**Export adventure JSON** saves the generated setting for rebuilding a standalone HTML. Generated saves include their world, so they can travel to another copy of the game. Export your save and chronicle before starting a new run. Character export remains independent of the adventure.

For agents, see `engine-api.md` and the `generateCharacter`, `generateAdventure`, `exportAdventure` CLI commands. `generators.js` is a pure seeded data generator using the existing rules. Generator version 2 is recorded with each world and character.

Choose a mission type or let the seed pick: recovery, investigation, escort, sabotage, reconciliation, containment, evacuation, rescue, defense or exploration. Locations, opposition and items are generic descriptive roles rather than recurring proper nouns. Mission goals and finale checks change; the underlying two-route stage structure is shared and some obstacle text will recur.

## Mission variations and hex sandbox (v1.3.0)

Each of the 10 mission types has three selectable objective variations. For example, evacuation can involve rising water, a closing siege or an airborne hazard. Their preparation encounters change the ability/capability checks, deadline pressure, failure consequences and preparation rewards. Preparation opens a lower-DC finale approach; skipping or failing it does not block all other approaches. Thirty narrative variations currently use 23 distinct combinations of preparation mechanics, sharing four pressure profiles and the route-stage structure.

For open-ended play choose **Generate hex sandbox**, separately from Generate adventure. Choose Frontier, Ruin scavenging, Island hopping or Haunted wilds. The default world has 37 hexes (radius 3). Travel north, northeast, southeast, south, southwest or northwest. Locations are filled in on first arrival and remain the same when revisited. The discovered-map panel records coordinates and locations. Choose local activities, survey, gather useful records, help people or simply roam. A hostile patrol can make a location risky; ordinary movement has no mandatory resource charge. Return to camp and choose to end when ready. There is no mandatory mission or deadline.

Sandbox saves carry the partially discovered world and character. Auto mode uses the same legal choices; it may finish at camp, lose in danger, or keep roaming until the 200-choice safety pause. This is a bounded map and template-based activities, not infinite terrain or a live AI game master. The API supports radius 2–6 (19–127 hexes). The genre selector determines the generated default character; sandbox variation determines terrain/activities.

Random character powers now cover all 15 currently permitted custom effect families (energy restoration remains an adventure effect, not a power). The generator samples 19 recipes, with legal randomized parameters and occasional composite resistance. In 1,000 seeded characters, tests observed 2,917 distinct mechanical power configurations, all 44 capability tags, energy costs 1–4, durations 1–3 and cooldowns 0–2. These are observed samples, not a claim of unlimited powers or that every capability is useful at every location.


### Broad random character sampling

The optional **Broad rules sampling** mode now samples 0–8 powers, scores 6–18 within the 78-point ceiling (it need not spend every point), all 15 allowed effect types, 1–5 effects per power, full supported magnitude/duration/cost/cooldown ranges, and valid combinations. Rejection sampling enforces the existing validator and power budget. It can produce weak, unusual or poorly synergized builds; review/edit them before play. **Curated recipes** remains available for more directed 3–5-power builds.

This does **not** guarantee that every valid manually authored character can be generated. A 32-bit seed provides a finite output set, while arbitrary names, descriptions, custom check tags and valid combinations are vastly larger. Broad mode samples canonical supported tags and fields, not every possible text string or JSON representation. Existing manual character creation/import remains the way to request an exact build. No manual validity rules were loosened.

## Character-builder autopilot (v1.4.0)

The new default **Builder autopilot** makes a sequence of legal character-building choices instead of selecting a fixed recipe: scores, 0–8 powers, costs/cooldowns, and 1–5 configured effects per power. Every offered choice leaves enough budget to complete the build. Power names and descriptions are editable in the character editor.

The builder can reproduce a manually designed legal mechanical build through a validated choice trace, including custom check tags. The headless `builderTrace` command constructs that witness and `builderReplay` checks it. This is the precise coverage claim: every valid canonical mechanical build has a supported builder path when its tags are supplied. It does **not** mean the finite random seed space is guaranteed to select every path, or that every random build is strong or well matched to a particular adventure.
