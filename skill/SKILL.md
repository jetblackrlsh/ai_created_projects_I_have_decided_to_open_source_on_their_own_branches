---
name: create-offline-crpg
description: Create and playtest complete offline text CRPG adventures for desktop browsers using CRPG Forge, with branching stories, real d20 checks, custom characters and powers, saves, and headless agent play. Use for new CRPG sessions or adventures and compatible character/power packs and optional illustrated character sheets, not live freeform chat GMing.
---
# Create Offline CRPG

Copy `assets/runtime/` to a working project, then use the bundled CRPG Forge runtime unchanged. Author adventures and characters as data, then build a self-contained HTML game. Target current Chrome-class browsers on Windows, macOS and Linux; mobile support is not a requirement. Do not create a hosted Site or require servers, online AI, CDNs, accounts, or installation to play.

## Rules and power boundaries

Read `references/engine-api.md` and `references/power-design.md` before authoring. All checks use actual `1d20 + floor((ability_score-10)/2) + explicit situational modifiers >= DC`. Use STR, DEX, CON, INT, WIS, CHA. Damage is fixed. This is a distinct system, not D&D compatibility; do not import spell lists or other SRD subsystems.

Every power is a composition of supported engine effects and parameters. Explain the mechanical implementation of a requested power, including cost, duration, limits and approximation. Never extend the engine, inject arbitrary JavaScript, invent an unsupported effect, or treat a descriptive name as automatic mechanical permission in order to satisfy a power request. Use the nearest supported composition. If no useful approximation exists, say so and offer compatible alternatives. Explicit engine-development requests are a separate task.

Powers must support investigation, traversal, crafting, social interaction, perception and other noncombat checks, not just combat. An unrestricted claim such as 'control reality' must become bounded effects; never grant automatic success merely from flavor. Capability tags have specific authored consequences and must be connected to actions in the adventure. Imported characters retain their identity, but must pass the same validation as new ones; disclose incompatible effects or power budgets rather than silently removing or scaling them.

## Author an adventure

1. Establish the premise, stakes, player objective and genre. Make routine choices yourself. Include a fitting ready-to-play default character and allow custom or imported characters before play begins.
2. Author the complete adventure JSON against the runtime schema. Include a clear opening, developed scenes, meaningful branches, consequences and distinct endings. Keep private real-life content out of public sample games.
3. Give every important obstacle several viable approaches, including nonpowered approaches. Viable does not mean guaranteed; disclose DC, modifiers, costs and stakes before a roll. Failed checks must change the situation or consume a meaningful finite resource, not endlessly retry for free.
4. Build opportunities for diverse stats and powers. Preserve resource scarcity, bounded rests and genuine loss conditions. Branches should affect later opportunities or endings, not merely provide interchangeable prose.
5. Validate all targets, effects, flags, checks and characters. Run the engine and adventure tests; play several successful and losing routes headlessly. Test custom characters without powers as well as powered characters. Verify import/export continuation including RNG state and complete log.
6. Build using `node build.js adventure.json Adventure.html` from that working runtime copy; open the produced HTML from disk in a cloud browser. Verify setup, choices, power builder, displayed math, saves, character imports, endings and log downloads. Do not use a personal computer without explicit authorization. Clearly disclose browser/platform checks not actually performed.

## Auto play

Keep the runtime’s Auto mode controls in every generated adventure. The player chooses or imports a character normally, then starts random legal CPU play, pauses to take over, or advances one auto turn. Do not substitute a scripted winning route, privileged foresight, or invented actions. Legal options include available power assistance, standalone powers and rest, with all normal checks and costs enforced. Export the full normal chronicle and saves. Explain that auto play can lose, and that a deadlock or safety step limit pauses without fabricating an ending. Existing HTML games need rebuilding with this runtime.

Use `autoOptions`, `autoStep`, and bounded `auto` CLI commands, or `Engine.listAutoOptions()`, `autoStep()`, `runAuto(maxSteps)`. Test new adventures under several seeds with default, custom, imported and nonpowered characters; verify every selected option was valid and save/import preserves continuation. Read the auto-mode section in `references/engine-api.md` for exact behavior and limits.

## Headless authoring and play

Use `node cli.js adventure.json SEED` in the working runtime copy and the API documentation. Read `references/adventure-guide.md` for a complete authored example. `assets/runtime/power-library.json` provides validated composable recipes; they are options, not free innate powers. Inspect state and action previews before acting; never fabricate a roll result or edit state to force a preferred outcome. Seeded tests are reproducible; normal play starts with a fresh seed. Preserve actual events in exported logs. Use synthetic fixtures for public tests.

## Delivery and updating

Deliver a standalone `.html` game plus a source package with adventure data, rules, power documentation, CLI, tests and build tooling. Back up milestones to the user's private Google Drive when authorized; verify file contents and access. Never call a scratch copy installed. Do not silently replace an existing game's saves or overwrite the same Drive file without checking identity. Keep release/version records so future updates target the same project and flag save incompatibility clearly.

Open-source publication requires a user request covering this project. When authorized, follow `publish-ai-project-on-own-branch`, retain licenses and exclude personal data. Update the known project branch rather than creating disconnected duplicate releases.

## Optional illustrated character sheets

Generate a character-sheet image only when requested, not for every adventure or character. Read `references/character-sheet-images.md`. Validate the character JSON first and derive every printed statistic, modifier, resource, power cost and limit from that exact data and the current engine. Keep the importable JSON authoritative; an image is a visual reference, not an import format. Use supplied identity references when available. Deliver the image alongside its matching validated JSON; explicitly disclose unsupported concepts and their bounded implementations. Never change engine rules to match attractive artwork.

## Seeded character and adventure generation

Retain the bundled `generators.js` and its UI controls. Use `generateCharacter(seed, options)` or `generateAdventure(seed, options)` from that module, or the corresponding CLI commands. Explain the bounded eight-genre template library rather than implying unrestricted story generation. Generated powers use existing validated effects and budgets; never extend mechanics to satisfy a generated theme. Let the player review/edit generated characters before play, or use default/imported characters in generated worlds. Preserve world JSON, generation seed/options/version and portable saves. Generated saves embed their adventure; UI and CLI restore it before state. Test deterministic repeatability, graph reachability, nonpowered/zero-energy legal routes, actual outcomes and save continuation. Run `generators.test.js` and the full suite before delivery. Read the generation section in `references/engine-api.md` for options and limitations.


## Mission variants and open hex sandboxes

Use the ten mission types and `variants` exports for goal-driven adventures. Three variations per type change preparation checks, pressure, consequences and finale opportunities; do not call them thirty entirely different plot structures. Preserve generic descriptive roles/items instead of fixing recurring named NPCs into generated worlds.

When the user wants to wander, use `sandbox.js` rather than treating exploration as just another mission. Its four variations provide six-direction travel, seeded first-discovery locations, optional local activities and a discovered map. Use `CRPG_SANDBOX.createEngine` to preserve lazy materialization, and retain the module in standalone builds. Explain the finite radius and template limits. Sandbox auto play can stop at a safety pause without reaching an ending; never force a conclusion. Preserve generated world data and ordinary state in saves, and test save/import continuation, valid nonpowered travel, one-time activities and revisits. Character power diversity is mechanical, not merely different names; report measured samples and which supported effects/capabilities were covered.

Broad mode uses supported-rule sampling; curated recipes are also optional. Explain that the broad generator is nonuniform, may produce weak combinations, and does not enumerate every valid manual build. Validate rather than changing rules to admit a sample. Never claim finite seeded generation covers arbitrary names/descriptions/custom check tags or the entire combinatorial space. Exact character concepts should still use authored JSON and normal validation.

Use `character-builder.js` for the default builder-autopilot mode. It samples successive legal choices rather than fixed recipes; expose the trace when useful. For a claim about whether a particular manual build is supported, call `traceCharacter` and replay the returned choices with its custom-tag vocabulary, then compare canonical mechanics. Distinguish supported builder paths from random-seed coverage. Do not promise that the finite PRNG emits every supported path, uniform sampling or balanced builds. Preserve editable character/power flavor independently of mechanical values.

For universal random support over legal finite mechanical paths, use `randomAutopilot` (fresh cryptographic draw per legal choice) and preserve its full `cfb1:` replay seed. Do not substitute the legacy fixed-width `autopilot(seed)` and claim equal coverage. Supply custom-tag vocabulary when required, and distinguish positive probability from uniformity or practical frequency. `seedForCharacter` plus `replaySeed` provides a concrete target witness, while the per-choice positive-probability argument establishes random support under the platform random-source model. No free-text flavor enumeration is promised.

## Solo and party play

Keep `party.js` and its UI controls in new builds. Use `CRPG_PARTY.createEngine` for both solo (a party of one) and explicit 1–8-member rosters; preserve the legacy solo format through its compatibility adapter. Label this local hot-seat play, not online multiplayer. Only the active character's stats, powers and personal state participate; shared story choices move everyone. Passing costs a turn and can provoke enemies. Do not pool powers, heal allies with self-only powers, invent revival abilities or quietly rebalance the adventure. Explain individual incapacitation, full-party/deadline defeat and per-character rest/cooldown timing. Save all members and shared state; roster export is not a progress save. Run party/solo/sandbox regressions and retain v1.5 adventure-data compatibility. Coordinate with other active adventure work rather than modifying its files without a handoff.

## Checked actions, causal scenes and concise prose

Write game-facing prose as clear, direct descriptions of the current situation, relevant objects, threats and available approaches. Do not pad it with metaphors, thematic commentary, novel-style speeches or repeated moral interpretation. Keep character motivation and stakes clear without narrating motives the player has not chosen.

Every consequential adventure action must use a real stat check, including easy opening actions; low difficulty is not automatic success. Give success and failure distinct mechanical or future-option consequences. Roll for execution, not whether a player is allowed to choose a goal. A branch choice can remain the player's decision while a check determines the cost of reaching its destination. Pure UI controls, viewing information and selecting a character are not story actions and need no roll.

Connect descriptive rewards to mechanics. If a success gives cover, information, access, allies or a tool, use that reward in an explicit later option or modifier. Do not award decorative flags that never matter. Clearly preview risks. Failed checks must not simply repeat the success text or silently grant the same reward without a cost.

Narrative and mechanical outcomes must agree. If text says an enemy is defeated, remove its remaining HP or implement the supported defeated state before any response. A flag named defeated does not itself defeat an enemy. A surviving enemy may respond only while the actor remains in its encounter; no attacks after successful escape or arrival elsewhere. Failed escapes should leave the actor in the encounter unless an explicit supported consequence carries them out. Avoid narrating a hit and then independently rolling a second attack as though it were the same event.

Every transition must state how the player reaches the next location. Review success AND failure arrivals, not just graph connectivity. Track who has the child, weapon, key and other critical objects. Do not assume that an optional ally was rescued or a clue obtained in another branch. State generic shared facts only if all inbound routes establish them.

Export the whole played session as a readable chronicle: adventure/character identity, initial scene, each visited scene description, choices and their visible requirements/checks, chosen option, power use, actual die and modifiers versus DC, outcome text, mechanical changes, enemy response where applicable, arrivals and ending. Group all events of one turn beneath one turn heading. Keep raw JSON logs available for automated audit. Never describe an outcome-only export as a full adventure record.

QA must include targeted reproductions, not just thousands of random runs: early easy-action rolls, every authored enemy-defeat action, successful escape with no later enemy attack, failed escape with a single valid response, exact scene/choice preservation in manual and Auto exports, player death without a later fabricated arrival, all endings, custom and no-power characters, and deterministic save/resume. Inspect representative complete exported stories for causal and prose quality. Headless tests do not replace visual review; disclose what was not tested.

Runtime v1.7: exportReadableLog() provides grouped readable chronicles; exportLog() retains raw JSONL. Successful scene departure prevents old-enemy retaliation; failed departures retaliate before arrival, and defeat blocks arrival. Generated mission actions and sandbox travel have explicit checks; ending an expedition is a meta choice. Legacy saves remain loadable; missing historical scene snapshots in old saves cannot be recovered automatically.
