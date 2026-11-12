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

Use the **Seeded generator** section before starting. Enter a seed and choose Fantasy, Science fiction, Superhero, Weird west, Cyberpunk, Horror, Post-apocalyptic or Noir. **Generate character** fills the editable sheet with legal stats and 3–5 custom powers. **Generate adventure** creates a branching world and its own default hero; you can instead use your custom/imported character. Then play yourself or press **Start auto**.

The same seed and genre reproduce the same content. Change the seed for another variation. This uses a bounded library of scene and power templates, not online AI or limitless new mechanics. Defaults produce 4–6 stages, with two routes per stage, a finale and meaningful victory/mixed/defeat outcomes. Every obstacle has a legal nonpowered approach, but attempts can fail. Evidence and rescues open finale opportunities.

**Export adventure JSON** saves the generated setting for rebuilding a standalone HTML. Generated saves include their world, so they can travel to another copy of the game. Export your save and chronicle before starting a new run. Character export remains independent of the adventure.

For agents, see `engine-api.md` and the `generateCharacter`, `generateAdventure`, `exportAdventure` CLI commands. `generators.js` is a pure seeded data generator using the existing rules. Generator version 1 is recorded with each world and character.

Choose a mission type or let the seed pick: recovery, investigation, escort, sabotage, reconciliation or containment. Locations, opposition and items are generic descriptive roles rather than recurring proper nouns. Mission goals and finale checks change; the underlying two-route stage structure is shared and some obstacle text will recur.
