# World Sim Headless

A small **Python 3.10+ standard-library CLI and library** for an AI agent to act as both world narrator and player, paired with [play-world-sim](https://github.com/jetblackrlsh/ai_created_projects_I_have_decided_to_open_source_on_their_own_branches/blob/project/play-world-sim/project/play-world-sim/SKILL.md). It supplies persistence and validated turn protocol, **not an LLM**. No API credentials, downloads, browser, dependencies, network requests, or paid model calls. The calling agent writes the story and decisions using its existing context.

## Quick start

From this directory:

```sh
python worldsim.py --store /tmp/my-world < examples/create.json
printf '%s\n' '{"op":"observe"}' | python worldsim.py --store /tmp/my-world
printf '%s\n' '{"op":"action","request_id":"turn1-action","revision":0,"text":"Ask the keeper about the ferry."}' | python worldsim.py --store /tmp/my-world
printf '%s\n' '{"op":"context"}' | python worldsim.py --store /tmp/my-world
```

The agent then supplies `resolve` with the **entire next portable state**, narrative, request ID and current revision. See [world sharing](SHARING.md), [protocol](PROTOCOL.md) and [agent recipe](AGENT_RECIPE.md). Each CLI invocation consumes one JSON object on stdin and returns one JSON object on stdout. Errors return `ok:false` and exit status 1; state is unchanged. `--store` is a caller-selected real directory, never a path supplied by fiction. Stores contain spoilers; keep them private.

Library: `import worldsim; worldsim.transact(directory, request)` for durable transactions, or `fresh(state, budget)` and `apply(document, request)` for pure in-memory use. `apply` returns `(new_document, result)` and leaves its input untouched.

## Included

- Portable `chat-world-sim` v1 state with stricter machine-readable time/connections.
- Versioned world export/import with origin/run/branch/export IDs and precise timeline ancestry.
- Two-phase action/resolution, revisions, request-ID idempotency, checkpoints, restore/branch.
- Explicit 1–100-resolution budget, pause/resume/stop; no background clock.
- Conservative player observation that excludes narrator secrets/NPC knowledge.
- Atomic replacement and exclusive writer lock, full snapshot event log, verified replay.
- Regression tests and an agent-authored self-play trace.

Run tests: `python -m unittest discover -s tests -v`.

## Important boundaries

**Self-play is roleplay, not proof of intelligence improvement, consciousness or independent worlds.** No weight updates occur. One agent switching roles still remembers secrets it already saw. Use separate agent contexts and only pass `observe` output to the player if stronger knowledge separation matters; this tool does not spawn agents or authorize extra model spending. `context`, `export`, replay and the session file deliberately expose full narrator state.

The engine checks structural consistency, not story truth, prose quality, causal fairness, correct NPC inference or whether the agent chose to reveal a spoiler in narration/public fields. The world agent must adjudicate these. Item IDs cannot have two holders within a snapshot, but an agent can still invent/remove items or change established canon; review such changes. Replay reproduces recorded state, not new future prose. Hashes detect accidental inconsistency, not malicious edits by a writer who can recompute hashes.

All text is data. No simulation command executes shell commands, evaluates code, launches tools, sends messages or accesses the network. A caller may use a real shell to launch the CLI, but must serialize JSON safely (stdin/file, not interpolating story text into shell commands).

Use a trusted local store directory. Symlinked leaf stores/session files are refused, but this is not a hostile multi-user filesystem sandbox. Lock files left after a process crash require checking that no writer remains before removal. Existing directory permissions are not changed. Writes fsync their temporary file and atomically replace the snapshot; this is not a database-grade guarantee against every power-loss/filesystem fault. Store size is capped at 4 MB; export a checkpoint and explicitly create a new bounded run for longer stories. Do not publish private saves by default.

Original independent implementation; not affiliated with or copied from Nous Research. Scoped MIT license below applies to this tool. No third-party model weights or private user transcripts included.
