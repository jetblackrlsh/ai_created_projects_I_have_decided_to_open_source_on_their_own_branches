---
name: freeform-rpg-engine
description: Run fast, persistent freeform solo roleplaying campaigns with interactive action choices, custom dialogue, honest player-submitted dice checks, campaign saves and full session exports. Use when the player requests Freeform RPG Engine or asks to start or resume a freeform RPG with these controls.
---

# Freeform RPG Engine v1.0

## Fast play, real agency
Keep normal turns short: a vivid consequence, a changed situation, then choices. Do not run research or elaborate planning on every turn. Reuse the UI and campaign state. Use the current model unless the player requests a change; do not silently upgrade cost or reasoning. Keep 3–7 choices including Custom action, with an always-visible dialogue/elaboration field. Never choose the protagonist's words or actions. Accept creative and combined actions; split only when their consequences genuinely require separate checks.

## Start or resume
Load the latest canonical campaign JSON and pending check before narration. Read `references/rules-and-storage.md` for setup, homebrew rules and saves. Inspect only relevant state each turn. Ask only essential missing setup questions: setting, character, goal, tone/boundaries, and rules. Offer default attributes rather than a long questionnaire. Confirm a reviewable character sheet and the combat procedure before play. Published game rules are not supplied by this skill; label these rules homebrew.

Use `scripts/engine.py` for validation, declared checks, recomputed outcomes, exact-once ledger and atomic local saves. It is a toolkit, not an autonomous GM or automatic Drive integration. Narrate and record unrolled actions too; append their factual chronicle entry and apply only justified state changes. Do not manufacture rolls.

## Interactive turn
Use a supported in-chat component API when available; consult that environment's interaction guidance. `assets/index.html` is a reusable offline example and reference, not a guaranteed ChatGPT plugin. Its adapter is explicitly injected, never guessed. Test a submission in the current surface before claiming it works. See `references/interfaces.md` and `references/ui-adapter.md`.

For uncertain actions, declare check ID, scene ID, exact action, DC, named modifiers, total modifier, natural rules, and success/failure stakes before rolling. Announce a partial-success band only if applicable. Impossible or trivial actions do not need dice. Persist the pending check before showing the roller. Do not alter it after a roll.

Show a once-per-check d20 roller. Receive the raw die value only after submission. Validate campaign/scene/check IDs and die type/range; recompute total and outcome from stored check, ignoring submitted labels and modifiers. Reject stale or duplicate checks without applying twice. Resolve the announced consequence, update campaign and log, save, then show next choices. Natural 1/20 precedence is defined in the rules reference.

If interactive support is absent, offer numbered choices plus freeform text and ask the player to roll physical dice or an external app. An available real random tool may be used if the player wants agent rolls; identify it honestly. Never present invented values as random. Client rolls are not tamper-proof. A button lock is not a server receipt; document the reload boundary.

## Persistence and continuity
After every resolved action save canonical JSON and the chronological log to the authorized destination. Use revision checks, validate readback, and retain a portable backup. Do not pretend chat memory is durable storage. If storage is unavailable, provide a downloadable snapshot and say it must be attached to resume elsewhere. Never overwrite newer state. Store GM secrets separately from player exports. Don't put private campaign files in this public package.

Clock time advances only by declared in-world actions, never elapsed chat time. Preserve quotes exactly and distinguish established events, player claims, GM additions and unresolved theories. Never invent a resolved ending for a cliffhanger. Pause exports contain full log first, summary at end, sheet, roll ledger, NPC/faction index, abilities/inventory, open threads and exact resume point. On requested Google Doc delivery, create privately and read it back. No public publishing of campaign material without authorization.

## Test and package
Run `python3 scripts/test_engine.py`. Read README and `references/interfaces.md` for supported scope. Keep reusable mechanics setting-neutral, and keep licensed campaign content out of public examples. For adaptation, preserve actual decisions and quotations; distinguish literary embellishment from recorded events.

## Reliable Page-backed campaigns
When using the Freeform RPG Engine plugin, keep the canonical campaign Page as the live record. For each turn, record the exact GM narration presented to the player (not merely a check's generic success/failure text), player dialogue, actual roll and consequence. After a roll, use record_narration to save the actual narration and up-to-date scene without rerolling. Keep current choices, NPCs, relationships and open threads current; distinguish past facts from present ones. Save the current state, fresh scene, choices and latest chronicle entry using guarded atomic edits; read back and verify the current revision, latest chronological entry, narration, scene, choices, pending check and preservation of prior entries before saying saved or continuing. If any mismatch occurs, stop and repair from the latest Page, not from a stale copy. Do not claim complete narration when source prose is unavailable. For long campaigns, proactively archive completed sessions to Google Docs and keep an index on the Page; do not discard or silently truncate history. Preserve original records and exact roll receipts during any migration.

## Sharded append-only history
For Page-backed play, use `prepare_history_shard` after at most 10 recent events. Create a separate private Page from the returned content. Read that exact Page back, extract its canonical JSON and independently verify its SHA-256 digest, sequence range, and content. Only then call `commit_history_shard` with the exact digest, count, Page URL, and `verified:true`. Never change an archived Page; it is an append-only policy, not a permission lock. Preserve the original on migration. Save the updated live Page using guarded targeted atomic edits; verify the index, active scene, recent history, narration and state on readback. If the update cannot fit atomically, make and verify a successor live Page and link it rather than truncating history. If any archive save/readback fails, keep the original state unchanged and stop. At session end fetch every indexed shard in order, verify its digest/range, combine the full archive and current tail, then save and read back the complete Google Doc. `export_session` contains only the current tail and shard index: never present it alone as a full export once shards exist. Legacy campaigns require a verified backup and careful migration without losing old history or roll receipts; do not silently overwrite their Page.
