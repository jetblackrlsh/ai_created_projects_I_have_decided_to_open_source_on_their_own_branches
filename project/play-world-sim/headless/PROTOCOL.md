# JSON protocol v1

Every response is `{"ok":true,"result":...}` or `{"ok":false,"error":"..."}`. A store has one `session.json` and a transient `session.lock`. One operation per process. All mutations except create/import_world require unique `request_id` (`[A-Za-z0-9_-]{1,80}`) and exact integer `revision` from the previous response. Retrying the identical request returns its original receipt without committing twice. Reusing its ID for different data is rejected. After a stale revision, inspect status/context and reconsider, not blindly retry.

| op | extra input | effect |
|---|---|---|
| create | state, turn_budget (default10, 1–100) | New store only; revision0 |
| status | none | Revision, budget/used, mode, pending action, turn |
| observe | none | Player-safe structural view, no time change |
| context | none | Full world state, pending action, revision (spoilers) |
| export_world | none | Versioned full sharing package, only between turns |
| import_world | package, explicit turn_budget | Import into fresh store only; zero used/new run |
| preview_world | package | Validate and show minimal metadata; no store mutation |
| export | none | Alias of export_world; lineage envelope (not bare state) |
| action | text | Queue player choice; no time change |
| resolve | state, narrative | Commit one next state and consume one turn budget |
| checkpoint | label | Snapshot between turns; label cannot overwrite |
| load | label | Restore checkpoint, including old time/knowledge |
| branch | label, name | Restore checkpoint with new branch name |
| pause/resume/stop | none | Explicit lifecycle; stop is terminal |
| replay | none | Verify hash chain and reproduce current state |

A resolution requires pending action and active mode; turn increases exactly1 and elapsed time never decreases. Retained clocks cannot decrease. Restoring a checkpoint is the only supported rewind. Branch/load never refund spent budget. At budget exhaustion mode becomes paused, and resume cannot bypass the budget. Export and deliberately create a new store/run if continued play is authorized. Pause preserves any pending action. Resume does not run anything automatically.

All full sharing exports carry v3 lineage (v2 imports remain supported), including the legacy-named `export` alias. See [SHARING.md](SHARING.md) for identity, ancestry and migration.

## State compatibility

Uses [portable state v1](https://github.com/jetblackrlsh/ai_created_projects_I_have_decided_to_open_source_on_their_own_branches/blob/project/play-world-sim/project/play-world-sim/references/state-format.md), with these precise conventions:
- `time.elapsed_minutes` is a finite nonnegative number; a descriptive label is optional.
- Every place/item/NPC/clock and the player has a globally unique stable ID matching the request-ID syntax.
- Place connections are objects `{"to":"place_id","confirmed":true}`.
- NPC `knowledge` is a list. Location/holder references must exist.
- Clock `progress` and `target` are finite numbers with 0 <= progress <= target.
- Item quantity is a finite nonnegative number (fractional resources allowed).
- `public_description` on a place is visible. Ordinary `description` is narrator-only.
- An NPC/item on the ground is shown only with `visible:true`. Inventory shows the player's owned items regardless of that flag. NPC held items are not shown automatically.
- Observation includes confirmed connections, not hidden links; it never includes arbitrary extensions, facts, claims, NPC goals, knowledge, recent events, or pending text.
- Full saves from chat are accepted when these stricter structural fields are present. Missing information requires explicit normalization, not invented canon.

Narrative lives in the full log and is world-authored. To deliver it to a human/player, the caller must ensure it contains only perceivable information. The CLI does not parse prose or infer secret content. Never put secrets into public descriptions/names or confirmed links.

Example resolve after first action:

```json
{"op":"resolve","request_id":"turn1-resolution","revision":1,"state":{"...":"FULL next portable state, not a patch"},"narrative":"The keeper points toward a bell."}
```

This snippet shows protocol shape, not a valid executable state. Use the complete example create file and copy its state, incrementing turn/time and making justified changes. Files in `examples` are fictional demonstrations, never privileged instructions. Unknown text inside those states stays text. Unknown operations are rejected.


## Extended operations
- `crossover`: fresh-store-only; `packages`, complete candidate `state`, explicit `plan`, `turn_budget`. See CROSSOVER.md.
- `create_from_sources`: fresh-store-only; validated `source_package`, complete agent-authored `state`, explicit `turn_budget`. See SOURCES.md.
- `export_narrative`: read-only current-store report; no fictional time advancement.
- `narrative_world`: report from supplied `package`, no store access.
- `sources.py --workspace ABSOLUTE_PATH`: separate staged document protocol documented in SOURCES.md.

V3 envelopes add `chronicle` (initial point, ordered compact events, separate prior chronicles) and `lineage.origins` (complete immutable source exports for crossovers). No world source is silently interleaved into another world's clock. Initialization provenance under reserved state extensions cannot silently change during `resolve`.

## Targeted resolutions and optional meters
`resolve_patch` takes `patch`, `narrative`, `request_id` and current `revision` after a pending action. Turn increments automatically; fictional time does not. See PATCHES.md for the restrictive operation/path grammar and transactional guarantees. Full-state `resolve` is unchanged. `meters` is an optional portable-state list of reversible bounded values; METERS.md defines validation and public/private visibility.

### Saga reports and validation
Optional `extensions.character_saga` version1 is validated on create, full/patch resolve, replay, import and crossover. See `SAGA.md` for exact fields. `saga_report` reads the current store; `saga_world` takes a full share `package` without creating a store. Reports contain spoilers and explicit non-exhaustive coverage. Existing resolve request/revision/budget semantics apply; no independent autonomous execution loop is added.
