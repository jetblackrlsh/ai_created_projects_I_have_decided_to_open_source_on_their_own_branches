# Freeform RPG Engine v1.0

A setting-neutral, fast-turn AI-GM skill and lightweight reference implementation. Designed for quick, expressive ChatGPT play: suggested choices **and** custom actions, honest dice, continuity, and portable records. Original design by Jet Black with ChatGPT assistance; implementation by Nova. CC0 for this project's own contributions; see repository LICENSE. No private campaign logs, licensed settings or credentials are included.

## Use
- In a skill-capable client, install this folder using its supported personal-skill workflow, then invoke `freeform-rpg-engine`.
- Without skill installation, supply SKILL.md and the relevant references to your assistant. This is guidance, not a way to enable unavailable UI APIs.
- Open `assets/index.html` in a browser for the interactive choices/dice reference. Copy its output into chat unless a documented host adapter is provided.
- Python 3.10+ core demo: `python3 scripts/engine.py new /tmp/campaign.json`, then `python3 scripts/engine.py validate /tmp/campaign.json`; export with `python3 scripts/engine.py export /tmp/campaign.json`.
- Test: `python3 scripts/test_engine.py`.

## Included
SKILL.md, complete default homebrew rules, storage/interface contracts, pure-Python outcome and state helpers, offline UI, synthetic example and tests. No paid services or model upgrade required. No hidden API calls. A human/AI GM still interprets actions and applies narrative consequences; this package is not an autonomous game server.

## Fairness
Declare stakes before rolls; never invent random outcomes. Validate raw dice against stored checks, reject duplicates and stale IDs. Partial success is allowed only when predeclared. Pausing never spends fictional time. Local browser receipts are not tamper-proof or universally durable. Google Drive saves require a connected authorized adapter and verification; no credentials or automatic Drive implementation is bundled.

## Release scope
Version 1 preserves the snappy play loop. User reported Instant widget functionality; this release does not infer support on every interface. See TEST_REPORT.md for actual tests. Source branch is not a hosted service. Download this project branch rather than main.

### Character setup and roll transparency
New campaigns ask for an existing character or offer a character form before opening a scene. `assets/character-builder.html` is a standalone default-allocation form; host interfaces without interactive UI use an equivalent plain-text form. Confirm the sheet and math before play. Imported sheets retain their attributes and system. Stat-aware checks derive bonuses from the sheet and separately label circumstance modifiers. Existing saves and already-declared rolls retain their original mechanics until an explicit migration between checks.

## Invokable plugin
The [plugin/](plugin/) directory contains the self-deployable MCP server, setup documentation, server-generated dice receipts, sharded Page history, and host-assisted Google Docs exports. Deploy your own owner-private instance; this source does not grant access to any existing deployment or campaign. See plugin/DEPLOYMENT.md.
