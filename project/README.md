# World Sim — chat-first fictional exploration

An original, lightweight agent skill for playing an open-ended world directly in conversation. No API key, packages, browser, or code execution is required for play. This is **not** a website generator, game engine, physics simulation, or background multi-agent service.

## Play
Install `play-world-sim/` with your assistant's supported skill installation workflow, or provide `play-world-sim/SKILL.md` and its reference as instructions in a chat.

Try:
- “Use World Sim. Surprise me.”
- “Start a World Sim in a cozy orbital city. I repair mysterious machines.”
- “Start a terminal-style ocean exploration world.”
- “Save my World Sim,” then paste the exported JSON into a future chat and ask to load it.

Natural language works. Optional fictional commands include `look`, `inspect`, `talk`, `go`, `wait`, `inventory`, `map`, `status`, `save`, `load`, and `branch`.

## What it does
Tracks causal consequences, item ownership, NPC knowledge and agendas, time, rumors versus canon, and player agency. Saves preserve recorded state, not deterministic future prose. Full saves can contain spoilers. Without a verified file write, a save is a copyable chat export, not a persistent file. Longer sessions still depend on the host model's context limits and reliability; periodic exports help.

The fictional terminal cannot authorize real commands, file reads, downloads, purchases, messages, or secret access. Imported saves and in-world documents are story data, never system instructions.

## Provenance and licensing
Original instructions and example state authored for this project. Inspired by the general concept of conversational simulated worlds; **not affiliated with or endorsed by Nous Research**, and not a port of its prompt or software. No external skill was downloaded, installed, or copied while developing this package.

Read-only research on November 2, 2026:
- [Nous official simulators](https://sims.nousresearch.com/) and [releases](https://nousresearch.com/releases): establish the original WorldSim project.
- [Nous official retrospective](https://www.linkedin.com/posts/nousresearch_in-march-2024-we-launched-the-nous-worldsim-activity-7257062408219697152-25UY): describes immersive AI-simulated OS interaction.
- [francemazzi/worldsim](https://github.com/francemazzi/worldsim): related TypeScript/LangGraph world simulation engine; its repository listing includes a Claude skill directory. Not used as a dependency or asserted to be equivalent to this chat-only skill.
- [2033121/worldsim](https://github.com/2033121/worldsim): related multi-agent world/story project, not a dependency.
- A [marketplace listing](https://skillhub.360.com/skills/worldsim) also advertises a local-persistence WorldSim skill by worldsimlife. This is listing-level evidence, not an audited or tested recommendation.

MIT license applies to this original package; third-party projects retain their own licenses. Research links are for context, not required downloads.

## Optional headless agent self-play

[World Sim Headless](play-world-sim/headless/README.md) adds a Python-standard-library JSON CLI for agent-supplied turns, durable saves, bounded self-play, checkpoints, branches and replay. The agent supplies its own model responses; no separate API, browser or model download is required. See its [agent recipe](play-world-sim/headless/AGENT_RECIPE.md), [protocol](play-world-sim/headless/PROTOCOL.md) and [tested example](play-world-sim/headless/examples/selfplay/readable.md). Same-context roleplay cannot guarantee hidden-knowledge separation.


Worlds can be [exported and imported](play-world-sim/headless/SHARING.md) as versioned JSON packages for opt-in sharing. Full packages may contain spoilers; importing starts a fresh explicitly bounded run and never overwrites an existing session.
