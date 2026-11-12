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
