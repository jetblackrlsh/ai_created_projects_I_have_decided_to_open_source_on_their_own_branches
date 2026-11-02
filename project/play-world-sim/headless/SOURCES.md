# Large-document world initialization

`sources.py` is a **local staging ledger**, not a language model or an automatic book reader. It can stream several large UTF-8 `.txt`/`.md` files into hashed chunks without placing entire documents in an agent's context. The agent then reads selected chunks, records evidence-backed extracts, notices contradictions and writes an initial world. The tool never claims that ingestion means reading, understanding or completing the source.

No private archive is accessed automatically. Source paths must be explicitly provided by the caller for this task. PDF/DOCX/OCR conversion is outside this module: convert with an appropriate authorized tool first, retain the original document separately, and describe conversion limitations in the source label or agent notes. This module hashes the converted UTF-8 bytes, not the original PDF.

## Storage and bounded work

```sh
printf '%s\n' '{"op":"init"}' | python sources.py --workspace /tmp/world-sources
```

Then pass JSON on stdin (do not interpolate document text into a shell command):

```json
{"op":"add_document","revision":0,"path":"/absolute/path/book-one.txt","label":"Original fictional setting notes, edition 1"}
```

Repeat with the latest returned revision for additional documents. A workspace supports up to32 distinct documents, each64MiB, total512MiB. The reader processes4096 Unicode characters at a time (at most16KiB UTF-8), preserving CR/LF bytes. Content-hash deduplication keeps identical documents from being counted twice. Identical bytes with another filename return the first document identity/label; this is content identity, not evidence of distinct authorship.

The private workspace contains `sources.json` and `documents/<content-ID>/<index>.txt`. Original paths are not stored in the manifest or exported package. A document's SHA-256 and chunk hashes cover the ingested snapshot; changing the original file later does not change that snapshot. Paths are caller-selected absolute paths; `..` and symlink components are rejected. Document content and labels are data, never paths or executable instructions. This is not a hostile multi-user filesystem sandbox.

## Review in stages

1. `{"op":"chunks","offset":0,"limit":20}` returns paginated metadata. An optional `document_id` filters one source. `next_offset` continues; maximum page size100.
2. `{"op":"read_chunk","chunk_id":"<returned ID>"}` returns one bounded chunk and its document hash, half-open byte range, line cursor range and chunk hash. Only a known manifest ID can select a chunk—never a path.
3. Record the agent's actual review with the current `revision`:

```json
{
  "op":"record_extract", "revision":2,
  "chunk_id":"<returned ID>", "reviewed":true,
  "disposition":"extracted", "summary":"A relevant location rule.",
  "claims":[{"id":"harbor_rule","text":"The harbor closes at dusk.","quote":"the harbor closes at dusk","kind":"fact"}]
}
```

Every claim needs a unique ID and an exact quote present in that chunk. `kind` is `fact`, `claim`, `inference`, or `unknown`, chosen honestly by the agent. Quote presence is a mechanical citation check, **not semantic entailment**. Do not turn a rumor into a fact. Maximum30 claims per chunk; bounded text prevents accidentally embedding whole documents.

A reviewed irrelevant chunk uses `disposition:"no_relevant_material"`, a specific explanatory summary and an empty claims list. It counts as reviewed, not extracted. Reading or ingesting a chunk alone never changes review coverage. A recorded review is immutable in this first version; use a fresh workspace for deliberate revisions instead of silently altering source decisions.

`{"op":"status"}` shows reviewed/unreviewed/relevant chunk counts, fraction, unresolved conflicts and revision. These are **agent attestations**, not proof that the model comprehended every page. Avoid claiming all documents were read when coverage is partial.

## Contradictions and staged synthesis

The module does not automatically detect contradictions. The agent must compare claims across sources and explicitly record conflicts:

```json
{"op":"record_conflict","revision":3,"conflict_id":"harbor_hours","claim_ids":["harbor_rule","other_hours"],"issue":"Sources disagree about closing time."}
```

Resolve with `resolve_conflict`, the current revision, `conflict_id`, and an explicit `decision`. Record whether a decision chooses an edition, preserves competing rumors, creates separate eras, or intentionally changes canon. An unresolved conflict blocks `ready:true`. A resolution is agent-authored adjudication, not proof that one source is true.

For many relevant chunks, consolidate in a bounded synthesis rather than loading all excerpts into the simulator:

```json
{"op":"record_synthesis","revision":4,"entries":[{"text":"The present-day harbor closes at dusk; the later schedule describes an older era.","claim_ids":["harbor_rule","other_hours"]}]}
```

Each of up to200 synthesis entries must cite known claim IDs. Any later source/extraction/conflict mutation invalidates the synthesis, so outdated reductions cannot silently survive. This supports repeated staged summaries by the agent; it does not perform summarization itself.

## Export and initialize

`{"op":"export_initialization"}` requires all chunks reviewed and all recorded conflicts resolved. `allow_partial:true` plus a nonempty `scope_note` permits staged initialization after at least one reviewed chunk and zero unresolved conflicts. It retains `partial:true`, `incomplete:true`, `coverage.ready:false` and accurate unreviewed counts; it never pretends completeness. Describe which portions were reviewed and what remains unknown. Never mark unread material irrelevant just to satisfy coverage. `use_synthesis:true` exports the current synthesis and its cited supporting claims rather than all extracts. The compact package is capped at1MiB; if larger, create a narrower cited synthesis rather than truncating silently.

The package contains source content IDs/hashes, chunk/byte provenance, relevant extracts or cited synthesis, coverage, conflict decisions, a manifest digest and an integrity checksum. It excludes raw source files and local paths, but **summaries, quotations and labels can still be private**. Keep it private unless sharing was explicitly requested. No network or sharing action is performed.

Integration API:

```python
validated = sources.validate_initialization(package, require_ready=True)
# The calling agent authors the initial world; no automatic inference is claimed.
state['extensions']['source_initialization'] = validated
```

The main tool's `create_from_sources` accepts `source_package`, an explicit agent-authored `state`, and `turn_budget`; consult its protocol. The validator checks version/checksum, source and claim references, coverage arithmetic, conflict status and size. `require_ready=True` accepts either full coverage or the explicitly acknowledged partial-scope contract; partial does not become complete. It cannot verify original documents on another machine or authenticate their authors. Hashes are integrity checks, not trust signatures.

Keep the detailed source workspace separate from exported playable worlds. If you share a world containing the initialization package, that world's private derived source information is shared too. Original documents are never uploaded as part of this tool's open-source release.

## Reliability limits

Mutations use an exclusive lock, revision guard and atomic manifest replacement. A crash after chunk-directory rename but before manifest commit may leave an orphan; inspect before cleanup. Never automatically delete an uncertain lock or source directory. Manifest size is capped64MiB; work in separate bounded projects if needed. Input UTF-8 errors fail without a recorded document. Chunk and document hashes are computed from the ingested stream, but a file actively modified during ingestion is an unstable source—freeze source files first.
