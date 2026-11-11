# Freeform RPG Engine private plugin

A private Sites MCP plugin for fast, narrative tabletop play. Campaign JSON is supplied by the hosting assistant from a canonical ChatGPT Page, never stored in this plugin. Google Docs exports are returned as Markdown for the assistant to save through its connected Google Docs tools. No direct Page/Drive access or universal inline button compatibility is claimed.

## Invoke
Enable Freeform RPG Engine in your ChatGPT conversation, then ask: “Use Freeform RPG Engine. Start a campaign, keep our live session in a ChatGPT Page, and save the full record to Google Docs when we finish.” The conversation needs Pages and Google Docs tools. Typed choices and custom dialogue work even when interactive widgets do not.

## Tools
- freeform_guide: workflow, schemas and privacy
- create_campaign: initialize a proposed Page record
- campaign_command: declare checks, record actions/dialogue, change scenes, end/resume sessions
- roll_and_resolve: real d20, once per declared check, idempotent receipt
- export_session: full chronological Markdown export

Before each state update, read the latest Page. Apply guarded updates and verify by readback. Do not claim a proposed state has been saved until the connector confirms it. Use the current sharded-history contract: keep compact state and a verified manifest on the canonical Page, with append-only history chunks on separate Pages. Verify contiguous sequence coverage and hashes before marking a save complete. Never silently truncate logs.

The plugin stores only SHA-256 owner/campaign/check identifiers, declaration hashes, d20 results, and timestamps in D1. It does not retain campaign prose, contacts, or session files. Randomness uses Web Crypto with rejection sampling. Repeated calls and concurrent rolls reuse the same result. Do not reuse check IDs for different checks. Local stale Page detection uses revisions; host readback is essential because the plugin is deliberately not a campaign database.

## Development
Node 24; esbuild bundles worker/index.js and engine.mjs. `npm run build`; `npm run validate`; `node --test test-*.mjs`. Install esbuild and drizzle-kit from npm for a fresh checkout. D1 migrations are in drizzle/. Site access remains owner-private.

## Character-first setup and auditable checks (2026-11-11)
New campaigns return a setup prompt and block play until `confirm_character_setup` records explicit player confirmation. Ask whether the player has an existing character or wants an interactive creation form. The host renders the form where available; otherwise use a fill-in text form. Preserve imported attribute names/values. Agree on allocation and math before confirming.

`rules.check_math` supports `{mode:"attributes",formula:"direct"}` (saved value is the bonus), `formula:"d20"` (floor((score-10)/2)), or explicitly chosen `mode:"narrative"` for unstattted play. Optional `point_buy:{budget,min,max}` validates the sum of attribute values and every bound. Do not apply default budgets to imported characters without agreement. `confirm_character_setup` accepts `confirmed:true`, `player_characters:[{id,attributes:{...}}]`, and `check_math`; no confirmation during a pending check.

Configured `declare_check.check` uses `actor_id`, `attribute`, and `circumstance_modifiers:[{name,value,reason}]`. Do not send `modifiers`; the engine derives them from the saved character, freezes an `attribute_snapshot` and labels attribute/circumstance bonuses. Display the full equation and DC before rolling. No double counting. Powers, weaknesses and equipment still guide permission, attribute selection and separately justified circumstances, not arbitrary extra stat bonuses.

Legacy campaigns lacking `check_math` retain their exact old declarations and manual modifier behavior. Migration is opt-in with no pending check. Do not rewrite historical results. No extra campaign storage or sharing added. Engine/worker regression plus setup/stat tests: `node --test test-*.mjs`.
