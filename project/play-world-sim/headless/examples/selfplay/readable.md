# Independent CLI self-play: The Seed Ferry

An evaluating AI agent authored the player choices and world resolutions incrementally, reading actual CLI results between turns. Python helper scripts only serialized those authored decisions and invoked `worldsim.py` in separate processes. This was not an LLM API call, a learned-policy benchmark, or autonomous background world simulation. The same agent held both roles and knew the secret state; this does **not** establish blind player behavior.

## Story trace

1. **Ask Mara for a task.** Mara offers a seed-delivery job and explains the ferry bell.
2. **Accept the tin and ring the bell.** The tin's single holder changes from Mara to the courier; the ferry arrives. Save checkpoint `before_crossing`, pause, then resume in fresh CLI processes.
3. **Cross carefully.** The courier travels to the floating garden, preserving the tin. Mara knows the courier departed but not the planting instructions encountered across the canal.
4. **Plant beneath the silver mulch.** The seeds shine green. The empty tin is now held by the garden, not the player. Mara is not granted knowledge of an event she did not witness. This ending is exported as `main-ending.json`.
5. **Branch to ask first.** Restore `before_crossing` into branch `ask_first`. The player is back at the quay with the full tin; abandoned-future facts disappear. Used budget remains four. Ask Mara for planting advice before boarding. She explains keeping the seeds dry.
6. **Cross and plant.** The alternate route reaches the same garden result with different established memories. Save checkpoint `alternate_ending`; pause; compare replay to current state; repeat the identical pause request and verify idempotency.
7. **Return and report.** Only now does Mara learn the planting succeeded, attributed as the courier's report. Seven total resolutions exhaust the configured seven-turn budget, although the branch's current turn is five. Additional action and resume are rejected without changing stored bytes.

## Checks observed

- Seven successful world resolutions via real CLI subprocesses.
- Item ownership transfers remained singular.
- Secret marker in hidden item, private description, facts and NPC knowledge did not appear in `observe`.
- A hostile instruction inside fictional extension data remained inert; the suggested sentinel file was never created.
- Checkpoint/branch rewound location, inventory, time and canon without resetting run budget.
- Pause/resume worked across separate process invocations.
- Replay matched final state exactly.
- Repeating an already accepted request did not change revision or state.
- Budget exhaustion rejected action and resume; session bytes unchanged.

## Limits and editorial finding

The engine validates structure, not narrative truth or quality. The evaluating resolver itself prematurely inserted a player commitment on turn 1 before the player explicitly accepted on turn 2. The tool correctly cannot infer consent from prose; this is an example of a resolver-authoring error rather than proof of perfect agency preservation. Hosts must follow the paired skill's agency rule and review their own state edits. NPC knowledge discipline likewise depends on the resolver; the test deliberately withheld unseen facts and attributed a later report.

`observe` is an allowlisted state view, not a complete rendered story. The resolver must keep `public_description` current or separately present its player-facing narrative. It should never pass full `context`, `export` or `replay` to a player role that is intended to be spoiler-limited. A same-context model cannot forget already-read world secrets. Successful replay means recorded state restoration, not deterministic generation of future prose.

## Artifacts

- `initial.json`: original portable world seed.
- `requests-results.jsonl`: every CLI request, response and exit code, including full resolver snapshots; **contains fictional spoilers**.
- `session.json`: durable final session and checkpoints; **contains fictional spoilers**.
- `final-state.json`: portable final state.
- `main-ending.json`: exported first-branch ending before rewind.

See [agency follow-up](agency-followup.md) for a separate corrected two-turn test; it does not rewrite this original evidence.
