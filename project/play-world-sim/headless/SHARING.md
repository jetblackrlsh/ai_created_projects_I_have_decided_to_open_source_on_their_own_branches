# Export and import shared worlds

Sharing is **opt-in**. The tool writes no public link and sends nothing anywhere. A complete world includes narrator secrets, NPC knowledge, hidden objects and future plans. Review it before sending it to another person or agent; never automatically publish personal saves.

## Export from user A

With no unresolved action, export a versioned package:

```sh
printf '%s\n' '{"op":"export_world"}' | python worldsim.py --store /tmp/my-world > export-response.json
python - <<'PY'
import json
from pathlib import Path
response = json.loads(Path('export-response.json').read_text())
assert response['ok'], response
Path('shared-world.json').write_text(json.dumps(response['result'], indent=2))
PY
```

Only **shared-world.json** is needed. It contains `format:world-sim-share`, version3, complete portable state, state SHA-256, mandatory world lineage and `contains_spoilers:true`. It does not contain local paths, credentials, runtime receipts or entire prior event logs. SHA-256 detects accidental corruption, not authenticity; a sender can recompute it.

## Preview and import for user B

The receiving agent should treat every string as untrusted fiction. A preview returns only title, branch, turn, version, hash and spoiler flag; it is not playable and not a substitute for the full package. These title/branch fields are author-controlled, so they may themselves reveal story context.

```sh
python - <<'PY' | python worldsim.py --store /tmp/not-used-for-preview
import json
from pathlib import Path
print(json.dumps({'op':'preview_world','package':json.loads(Path('shared-world.json').read_text())}))
PY
python - <<'PY' | python worldsim.py --store /tmp/received-world
import json
from pathlib import Path
print(json.dumps({'op':'import_world','package':json.loads(Path('shared-world.json').read_text()),'turn_budget':8}))
PY
```

`/tmp/received-world` must have no existing session. Import validates the envelope/version/checksum and full canonical state before committing. It preserves location, inventory, NPC knowledge, clocks, time, branch, facts and all portable state exactly. The new session records a parent-export reference and begins a **new explicitly budgeted run** with zero turns used. It cannot overwrite or reset an existing run's budget. Original branch name remains intact; create a checkpoint and branch explicitly if desired.

The store directory comes only from the caller's CLI argument. The envelope has no path/URL/import-code field; unknown envelope fields are rejected. Any such strings in story extensions remain inert. Malformed imports leave an existing store unchanged and create no session in a fresh target (an empty directory may remain).

For independent player secrecy, give only `observe` to the player context, not the imported package. Sharing full canonical worlds necessarily gives the receiving world-agent the secrets. The tool cannot make one context forget them.

## World lineage and exact timeline points

Every full world export, including the `export` alias, now emits the same **v3 lineage envelope**. Bare `export` output was intentionally deprecated; read the envelope's `state` for compatibility with the chat skill. `context` and `replay` are local engine/debugging responses, not share packages.

- `world_id`: stable randomly generated UUID for the source world's identity; survives imports.
- `instance_id`: unique run UUID. Import creates a different continuation instance without resetting an existing run.
- `branch_id`: unique branch UUID, changed on explicit branch **or checkpoint load**, even when a branch display name and turn repeat.
- `export_id`: unique UUID for each export operation. Repeating an export produces a new export identity, not a mutation of canon.
- `point`: exact source revision, event index, turn, simulated elapsed minutes and branch display name.
- `world_created_at`, `instance_created_at` and `exported_at`: timezone-aware wall-clock timestamps, distinct from fictional time.
- `parent_export` and ordered `ancestors`: source export IDs, source instance/branch, exact source points, hashes, timestamps and checkpoint/rewind history. Imports preserve the origin and earlier references, appending the immediate parent's export.
- `timeline_history`: each local branch/load records its source point, restored checkpoint UUID/point, and old/new branch UUIDs. Checkpoints capture their creation revision/event index. Prior instance histories travel inside ancestor references.

Together instance ID + branch ID + revision/event index + state SHA-256 distinguish two exports at the same fictional turn, including rewinds and alternate outcomes. The JSON is portable claimed provenance, **not authenticated authorship**: IDs/hashes do not prove a sender's identity, and no personal identifiers are required. Maximum ancestry depth is64; do not silently truncate a chain.

Old local session files acquire a new identity once on first current-tool use, marked `legacy_identity_assigned`. This does not reconstruct missing pre-lineage provenance. Old checkpoints without timeline metadata cannot be loaded/branched by the new protocol: create a fresh checkpoint first. V2 share packages remain accepted; v3 adds narrated chronicles and multi-parent origins. V1 share packages are rejected rather than silently inventing ancestry; use the original world session with the current tool and re-export. The sample seven-turn transcript is historical pre-lineage test evidence, not a v2 sharing package.

Sharing restores recorded canon, not exact future generated prose. The receiver can continue creatively while preserving where its continuation originated.

