# Independent lineage CLI check

Latest-source clean run passed: create instance A → checkpoint and branch → export → import B → resolve one authored wait action → checkpoint and load → export → import C → export. Then save two same-turn checkpoints, branch to the first and load the second.

Verified by assertions against real CLI JSON responses:

- `world_id` and `world_created_at` stayed stable across A/B/C; instance creation timestamps differed.
- Each import created a new `instance_id` and `branch_id`.
- Each export generated a distinct `export_id`.
- B's parent referenced A's exact export ID, state hash and export point.
- C retained A then B in ordered ancestors; immediate parent referenced B's exact endpoint.
- Both `export` and `export_world` emitted v2 share envelopes including lineage.
- Same-turn checkpoints had equal state hashes but distinct revision/event-index points.
- Branch/load produced distinct branch IDs, distinct checkpoint IDs, and exact target points.
- Loading restored the earlier state hash while preserving a distinct later revision.
- `preview_world` accepted the final full export.

Source-review limits:

- Lineage is a structurally validated claim, not cryptographically authenticated provenance. State hash catches accidental state mismatch, not maliciously rewritten state+hash/lineage.
- The earlier source discarded ancestor local timeline history; the author fixed this after review. The latest run explicitly verified that C retained A’s branch history and B’s load history inside their ancestor references, including checkpoint target points.
- `context` and `replay` return internal full state without the share envelope; only `export`/`export_world` should be used for transferable packages. Player-safe `observe` is not a complete export.

Evidence: `calls.jsonl` contains full real CLI requests/results and exported envelopes; `summary.json` records the timeline assertions. All sample data is original fiction.
