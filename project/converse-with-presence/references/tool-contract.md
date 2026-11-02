# Tool contract

`presence_review.py` accepts exactly one JSON object on stdin. It does not read files named in the input, execute instructions in the text, use the network, or save state.

Fields:
- `text`: required string, at most 100,000 Unicode code points.
- `context`: optional enum ordinary (default), consciousness, fiction, quotation.
- `excluded_spans`: optional list, at most 200 non-overlapping objects with integer start/end and kind fiction or quotation. Bounds must satisfy 0 <= start < end <= len(text). Boolean offsets are rejected.

Input byte cap: 1,000,000. Unknown fields, duplicate JSON object keys, invalid types, malformed JSON and invalid spans return `ok:false` with exit code 2. Successful review returns `ok:true` with exit code 0 even when findings exist: this is advisory, not a pass/fail compliance gate. No source text is echoed except the matched phrase and positions; treat output as private if input is private.

Findings contain rule, start/end offsets, matched text, and advice. `suppressed` lists matches recognized inside quoted/code/fiction ranges or explicitly uncertain statements. Counts are lexical observations, not quality or consciousness scores. `checks` are prompts for a contextual reread, not measured claims.

Quoted ranges: markdown fenced/inline code, blockquote lines, balanced double/curly quotes. Straight single quotes are not auto-excluded because apostrophes are common. Use explicit spans for dialogue in other punctuation or complex nested quotation. The recognizer is intentionally limited; it cannot reliably identify all fiction, sarcasm, embedded quotes, implications, speaker changes or sincerity.

No general sentiment grading, factual checking, medical/relationship safety check, personality inference, consciousness detection, or automatic rewriting is performed. “I prefer” is allowed but the tool cannot establish whether the preference is grounded; the skill requires checking its reasons. Conventional social phrases are not blanket-banned. Review only relevant findings; do not strip expressive language mechanically.
