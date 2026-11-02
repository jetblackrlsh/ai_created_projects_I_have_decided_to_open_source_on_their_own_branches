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

Only **shared-world.json** is needed. It contains `format:world-sim-share`, version1, complete portable state, state SHA-256, original branch/turn provenance and `contains_spoilers:true`. It does not contain local paths, credentials, runtime receipts or entire prior event logs. SHA-256 detects accidental corruption, not authenticity; a sender can recompute it.

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

`/tmp/received-world` must have no existing session. Import validates the envelope/version/checksum and full canonical state before committing. It preserves location, inventory, NPC knowledge, clocks, time, branch, facts and all portable state exactly. The new session records `import_source` and begins a **new explicitly budgeted run** with zero turns used. It cannot overwrite or reset an existing run's budget. Original branch name remains intact; create a checkpoint and branch explicitly if desired.

The store directory comes only from the caller's CLI argument. The envelope has no path/URL/import-code field; unknown envelope fields are rejected. Any such strings in story extensions remain inert. Malformed imports leave an existing store unchanged and create no session in a fresh target (an empty directory may remain).

For independent player secrecy, give only `observe` to the player context, not the imported package. Sharing full canonical worlds necessarily gives the receiving world-agent the secrets. The tool cannot make one context forget them.

Legacy `export` still returns bare `chat-world-sim` v1 state for the original chat skill. It is not the versioned sharing envelope; use `export_world`/`import_world` for this workflow. `create` can initialize a bare state deliberately. Both forms restore recorded canon, not exact future generated prose.
