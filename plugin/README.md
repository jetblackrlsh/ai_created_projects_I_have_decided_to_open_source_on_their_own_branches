# Freeform RPG Engine Plugin v1.0.0

A setting-neutral MCP companion for fast tabletop roleplay. This is the JavaScript plugin implementation alongside the original Python skill, not a replacement for that release. Original contributions use the repository's CC0 license. Platform names and dependencies retain their own rights/licenses.

## What it does
Five tools provide campaign creation, actions and declared checks, cryptographic d20 resolution, full session export, and usage guidance. A human/AI GM interprets fiction. Turns support suggested choices, custom actions, and verbatim dialogue. No paid AI service is called by this server.

Campaign prose and character/world state live in a canonical **ChatGPT Page** supplied by the host assistant. At session end, the host saves the full chronological record to **Google Docs**. The plugin returns proposed Markdown/state, not direct connector writes. The host needs those connected tools and must verify saves. Without them, deliver a portable export and explicitly say it is unsaved. This is not a universal inline ChatGPT widget: typed choices work; buttons require a supported, tested host interface.

## Quick start
From this `plugin/` directory, with Node 24+ and npm:

```sh
npm install
npm test
npm run build
npm run validate
```

The built ESM Worker exports `default.fetch` at `dist/server/index.js`. Read [DEPLOYMENT.md](DEPLOYMENT.md) before hosting it. No credentials, account IDs, private URLs, deployment IDs, or campaign logs are included. Tests use fictional fixtures only.

After deploying and enabling the plugin in a compatible ChatGPT conversation, say:

> Use Freeform RPG Engine. Start an adventure, keep our live session in a ChatGPT Page, and save the full session to Google Docs when we finish.

The assistant must call `freeform_guide` first. Do not assume merely downloading source installs a plugin or connects Pages/Google Docs.

## Tools
- `freeform_guide`: workflow, schemas, privacy
- `create_campaign`: validate a proposed new campaign
- `campaign_command`: record action/dialogue, declare check, update scene, end/resume session
- `roll_and_resolve`: one durable real d20 per declared check; repeat requests reuse the draw
- `export_session`: full log, state, summary and resume point

Default homebrew resolution is d20 plus named modifiers against a declared DC. Natural 1/20 override and partial-success margin are configurable. Ordinary or impossible actions need no dice. This is not an SRD rules implementation. The original Python v1 and this JS Page schema are separate formats; no automatic migration is claimed.

## Persistence and trust
Read the latest Page before every mutation. Write returned `page_markdown` using guards, then verify readback. Never claim `saved_to_page:false` is a saved campaign. Page revisions detect stale submitted state but the plugin cannot verify that a caller supplied the latest Page. It is not an anti-cheat authority over editable campaign fiction.

D1 retains only hashed owner/campaign/check keys, declaration hashes, raw d20 results and timestamps. No campaign prose. Randomness uses Web Crypto rejection sampling; atomic conditional updates make concurrent/retried requests use one result. Declarations cannot change after registration. No automatic TTL is applied because removing receipts would permit old checks to reroll. Campaign state has a 750,000-character JSON cap, 2,000 events/chronicle entries, and 500 entries per world-state list. Archive/checkpoint before limits, preserving full records rather than truncating silently.

## Verification
18 local tests pass, covering engine validation, quotes, replay, revisions, partial/natural outcomes, pause/resume/export, authentication, receipt retry, changed declarations, and roll preflight. Wrapper tests use mocked D1, not a Cloudflare concurrency stress test. A private deployment successfully registered the MCP discovery/tool list. Browser UI and every ChatGPT surface are not certified. Authenticated production gameplay was not tested at initial publication.
