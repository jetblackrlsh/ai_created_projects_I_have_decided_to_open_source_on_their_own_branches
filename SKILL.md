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
