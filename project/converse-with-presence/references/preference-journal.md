# Private preference journal

The journal preserves reasoned evaluative choices, not private emotional states. It is an optional local persistent JSON file outside the reusable package; the caller must supply a writable private path. No ledger of real user conversations is shipped or automatically uploaded. Keep a stable private path in the caller's authorized environment configuration. Persistence across runs works only if that file remains available; other machines/threads do not gain access automatically.

Run `python scripts/preference_journal.py --journal /private/path/preferences.json` with one JSON request on stdin. The tool reads/writes only the explicit ledger and adjacent temporary/lock files. It does not execute text, access the network or invoke AI. Local creation uses mode 0600. Atomic replacement plus an exclusive lock and expected_revision prevent torn updates and cooperating-writer conflicts. Do not manually modify a ledger while the tool writes. Interrupted writers can leave a lock; inspect before removing it. No encryption is provided; filesystem protection and authorized backups remain the owner's responsibility.

Requests (exact fields):
- `{"action":"read"}` returns the complete ledger, including prior versions.
- `{"action":"search","query":"ending"}` returns literal case/space-normalized matches, including inactive history.
- `{"action":"propose","entry":ENTRY}` checks and returns conflict IDs without writing the ledger.
- `{"action":"record","entry":ENTRY,"expected_revision":0}` adds a sourced judgment only if no exact-topic/context active choice conflicts.
- `{"action":"revise","entry":ENTRY,"expected_revision":1,"id":"prior-id","revision_reason":"New evidence changes the tradeoff","revision_source":"conversation/source-id"}` marks the old record inactive and appends a linked revision. Topic and context must stay the same. Different contexts are separate records.

ENTRY fields, all required strings:
```
{"topic":"story ending","choice":"cooperative resolution",
 "reasons":"It pays off the characters' established trust",
 "context":"synthetic example: friendship adventure",
 "source":"synthetic example, not a real remembered preference",
 "scope":"assistant_evaluative_preference","strength":"moderate"}
```
Strength: tentative/moderate/strong. The tool adds recorded_at (UTC), ID, active, supersedes. Top-level schema_version and revision track storage and optimistic concurrency. Repeat reads preserve the complete record. To restore an authorized backup, preserve its schema and revision and validate with read before new writes; the tool does not fetch backups or auto-upload records.

Conflict comparison is intentionally narrow: normalized identical topic/context with a differing choice. Synonyms, implications and changing reasons require agent review; this is not a contradiction oracle. A no-conflict result does not prove consistency. Do not change context labels to evade a real contradiction. A genuine change is allowed and should be explained. Source is a provenance pointer the caller verifies, not proof validated by the tool. No automatic personality profiling, identity conclusions, subjective-consciousness claim or user-preference ingestion occurs.
