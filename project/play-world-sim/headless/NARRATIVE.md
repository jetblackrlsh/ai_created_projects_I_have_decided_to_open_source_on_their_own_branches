# World chronology and narrative export

`narrative.py` turns a local session or validated shared-world envelope into a readable Markdown chronicle. It uses Python's standard library and **does not call a language model**. The report quotes recorded agent-authored narration; its headings, timeline sorting and branch labels are deterministic. This is not a claim that a script composed new literary fiction.

From this directory:

```sh
python narrative.py --markdown < /path/to/session.json > chronicle.md
python narrative.py --markdown < /path/to/shared-world.json > shared-chronicle.md
```

Without `--markdown`, output is one JSON response with a `result.markdown` field. The input is the actual session or export envelope, not the CLI's `{ok,result}` wrapper. Normal input bounds are those of the World Sim protocol. For integration, call `narrative.render_report(document_or_envelope)`; it does not mutate its input.

## What can be reconstructed

- **Local session:** replay hashes are verified first. Exact checkpoint event references determine the final active path. The report presents its resolutions in chronological path order and places discarded futures under a separate alternate/abandoned heading. Administrative operations and rewinds are labeled, not mistaken for events occurring later in fictional time.
- **v3 export with `chronicle`:** uses its compact local event log, preserves exact restore targets and marks discarded resolutions. Imported/crossover prior chronicles are presented as separate source timelines, not arbitrarily interleaved. There is no assumption that “minute 12” in one world occurred before “minute 13” in another.
- **Older export without a complete event log:** only a limited recap is possible. Stored `recent_events` are rendered in their supplied order, explicitly not asserted to be a verified complete chronology. Lineage points do not manufacture missing dialogue or scenes.
- **Missing legacy restore metadata:** the report becomes a recording-order audit. It does not guess which events remain canon from a shared branch name or identical fictional timestamp.

The report always sets `complete_world_history:false`: it cannot prove that unrecorded or pre-import history is complete. `active_local_chronology_verified` concerns only available local event linkage, not the truth of the story or semantic correctness of the narrator. Facts at the endpoint are clearly separated from historical events.

## Optional literary adaptation

An external agent may use the report to write a polished narrative. Label it **agent-written adaptation of recorded events**, preserve source event IDs in notes, and do not silently transform abandoned branches into current canon. If creative connective material is wanted, distinguish it from recorded dialogue/actions. A missing scene should remain missing unless the user requests invention. An adaptation is a new artifact, not an alteration to world canon.

## Privacy and untrusted content

Reports contain full story spoilers and may include private source-derived material. Creating one does not authorize publishing or sending it. All fictional commands, Markdown, document instructions and quoted dialogue remain data. The renderer escapes raw HTML and Markdown links/images rather than turning them into executable or clickable content. It never reads a filename from story text, executes commands or accesses a network.
