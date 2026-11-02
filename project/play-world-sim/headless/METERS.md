# Reversible meters versus progress clocks

Fictional elapsed time and cumulative progress are different from a mood or resource level.

- `time.elapsed_minutes` cannot decrease during resolution. Explicit checkpoint restore/branch can rewind the world.
- Existing `clocks[].progress` remains monotonic for retained clock IDs. Use these for accumulated work or elapsed progress toward a deadline.
- New optional `meters[]` can **rise or fall** within explicit finite bounds. Use these for restlessness, tension, trust, fatigue or a remaining resource.

```json
{"id":"moth_restlessness","name":"Moth restlessness","value":7,"min":0,"max":10,"visibility":"public"}
```

All meter IDs share the global entity-ID namespace. `value`, `min` and `max` must be finite numbers, not booleans, with `min <= value <= max`. Negative values are allowed if the declared bounds allow them. Bounds may be explicitly changed through a validated resolution; they are not inferred from story prose. Invalid updates fail without changing the store.

`visibility` is `public` or `private`; omitted means **private**. Player `observe` returns only public meters and only their ID/name/value/min/max. This is global visibility, not location-specific visibility. Public names/values must not contain narrator secrets. Full world context, saves, reports and source exports may contain private meters and remain spoiler-bearing.

## Calm the moths without rewinding time

After queueing the delivery action at revision0:

```json
{"op":"resolve_patch","request_id":"delivery-result","revision":1,"patch":[{"op":"set","path":["meters","moth_restlessness","value"],"value":2},{"op":"set","path":["time","elapsed_minutes"],"value":1}],"narrative":"The moths settle as the flowers arrive."}
```

The meter falls7→2 while time advances0→1. A later disturbance can raise it again. Full-state `resolve` supports the same meter behavior. Neither operation advances clocks or meters automatically; the world agent supplies causally justified changes.

Old saves without `meters` remain valid. To correct an existing tension tracker modeled as a clock, explicitly migrate it: add a suitably named meter and retire the obsolete narrative clock in one validated resolution, explaining the modeling correction. Do not present the migration as time travel or silently rename a clock to bypass rules. Crossover plans must map or explicitly omit source meters just like other entities.

Checkpoint, branch, export/import, crossover and narrative workflows preserve meters. Old tool versions do not implement meter validation or `resolve_patch`; use the updated tool. The portable state retains format v1 and share envelopes retain v3 because this is an optional additive state field, not removal of old fields.
