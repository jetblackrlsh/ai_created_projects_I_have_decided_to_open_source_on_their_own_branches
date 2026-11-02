# Crossovers and amalgam worlds

`crossover` creates a **new** world in a fresh store from 2–8 full exported worlds. It never rewrites the original stores or packages. No model is bundled: the calling agent authors the combined state and explains conflicts, omitted entities and optional character fusions. This is not automatic semantic merging.

Request:

```json
{"op":"crossover","packages":["FULL_EXPORT_A_OBJECT","FULL_EXPORT_B_OBJECT"],"state":"FULL_NEW_PORTABLE_STATE_OBJECT","turn_budget":8,"plan":{"entity_map":[],"laws_decision":"Which laws coexist or change?","time_decision":"How do the source timelines align?","history_decision":"Which events are combined, reinterpreted or remain contradictory?","conflicts":[{"topic":"Example contradictory claim","resolution":"Explicit chosen treatment"}]}}
```

Placeholders are explanatory, not executable JSON inputs. Use the complete source envelopes and candidate state objects. All source states are validated before the new store commits. The new state must start at turn0, with its own explicit simulated time. Source turns/times remain intact in source provenance.

`entity_map` must contain exactly one entry for **every** source player, NPC, item, place, clock and meter:

```json
{"export_id":"SOURCE_EXPORT_UUID","source_id":"keeper","target_id":"fused_keeper","decision":"Fuse the two keepers into one person with explicitly reconciled memories."}
```

- IDs are scoped by source export UUID, so two sources can both contain `keeper` safely.
- Multiple character mappings to one target character explicitly create an amalgam.
- Use `target_id:null` and an explanation to omit a source entity.
- Targets must exist in the candidate and preserve entity kind. Player/NPC are both characters.
- Candidate inventory quantities, locations and holder references must be consistent. The engine does not add duplicate possessions automatically.
- Laws/time/history decisions are mandatory. `conflicts:[]` means the author reviewed and declared none; the engine cannot discover semantic contradictions in prose.

The mapping/decisions are preserved under `extensions.crossover_plan` and cannot silently change in subsequent resolutions. Ordinary new characters/objects may be authored in the new state, but should be explained in the story.

## Multi-parent lineage and privacy

The new world receives its own world/run/branch UUIDs. `lineage.origins` retains the **complete source export packages**, including exact export UUID, source world/run/branch, revision/event/turn/time, state hash, source histories and prior ancestry. Imported continuations retain these source packages. This preserves multi-parent history without falsely pretending unrelated worlds share one original world ID. An ordinary continuation still uses `parent_export`/`ancestors`.

Origins can contain narrator secrets and private source data. Never publish/share the resulting crossover without reviewing all inherited source packages. The CLI does not transmit it. Existing 4 MB request/store limit still applies; up to8 nested crossover generations are supported. Large source **documents** use the separate staged ingestion tool, not giant full-text world envelopes. Checksums and claimed lineage are not authenticated authorship.

V3 exports add origins and compact narrated chronicles; v2 exports remain accepted as sources. A v2 export without full recorded prose can only contribute its available canon/recaps; never invent missing history and call it recovered.
