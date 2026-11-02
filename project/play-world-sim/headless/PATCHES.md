# Transactional targeted state updates

`resolve_patch` lets an agent submit only intended changes instead of retyping the complete world state. It uses the **same** pending-action, revision, request-ID, budget, clock/time, provenance and full-result validation as `resolve`. It increments `turn` by1 automatically; it does **not** advance fictional minutes automatically.

```json
{"op":"resolve_patch","request_id":"delivery-result","revision":1,"patch":[{"op":"set","path":["meters","moth_restlessness","value"],"value":2},{"op":"set","path":["items","parcel","holder"],"value":"keeper"},{"op":"set","path":["npcs","keeper","knowledge"],"value":["The delivery arrived."]}],"narrative":"The keeper accepts the parcel, and the moths settle."}
```

Paths are arrays of literal keys, **not filesystem paths or JSON Pointer strings**. Collections use stable entity IDs, never array indexes. An unknown ID fails rather than selecting a similarly placed entity. The operation copies current canonical state, applies all changes, validates the complete candidate, then commits once. Any bad edit rejects the whole transaction unchanged.

## Operations

- `set`: exact fields `op`, `path`, `value`. Replaces that field; when setting a list, supply its complete intended new list. Setting optional ordinary fields is allowed.
- `delete`: exact fields `op`, `path`. Only deletes existing ordinary extension keys. It cannot delete canonical required fields or reserved provenance.
- `add_entity`: `op`, `collection`, `value` (complete new entity including ID).
- `remove_entity`: `op`, `collection`, `id`. Dangling holder/location references fail full validation; repair dependent references in the same transaction.

Entity collections: `places`, `items`, `npcs`, `clocks`, `meters`. Identity itself cannot be patched. Entity removal/addition and field edits on the same entity cannot be mixed; send its final object when adding. Duplicate entity mutations and overlapping field paths are rejected. At most128 operations and the existing request-size limit apply.

## Patchable fields

- `player`: location, abilities, conditions, commitments.
- `time`: elapsed_minutes, label.
- `world`: title, premise, laws, seed.
- `preferences`: genre, tone, presentation, boundaries, adjudication.
- Entire lists: facts, claims, recent_events, pending.
- `places/<ID>`: name, description, public_description, connections.
- `items/<ID>`: name, holder, quantity, visible.
- `npcs/<ID>`: name, location, goals, knowledge, memories, relationships, conditions, visible. Nested relationship objects may use literal keys.
- `clocks/<ID>`: name, purpose, progress, target, unit, trigger, consequence.
- `meters/<ID>`: name, value, min, max, visibility.
- `extensions/<ordinary-key>`: custom data; nested object parents must already exist. Reserved `crossover_plan` and `source_initialization` cannot change.

Format/version, branch, player ID, turn, lineage and internal history are engine-controlled and cannot be patched. Unsafe keys (`__proto__`, `constructor`, `prototype`), traversal syntax, integer/index paths, arbitrary operations and unknown operation fields are rejected. Text values may contain fictional commands but remain inert data; nothing executes or follows them.

## Retries and compatibility

Use the revision returned by the preceding action. Repeating the **identical** accepted request ID/body returns the original receipt, without applying it twice. Reusing an ID for a different request or sending a stale revision fails. Inspect current context before reconsidering a rejected stale request; do not silently rebase a creative decision.

Full-state `resolve` remains supported. Supply **either** its `state` or a `resolve_patch` request's `patch`, never both. Patch resolutions are logged as ordinary resolved turns with `input_mode:patch`, so replay and chronological narrative exports retain the same semantics. They carry the complete resulting state in the current log format.

## What this improves—and what it does not

This reduces request payload and authoring burden. **It does not solve snapshot/storage growth.** The engine still deep-copies state and records full state snapshots, retains the existing4MB store/request limits, and requires compact source synthesis for large settings. No sharding, delta-log storage or automatic memory retrieval has been added. Patching one meter in a huge source-derived state is a small request but still produces a large stored snapshot.
