# Editorial voice and evidence

## Adaptation contract

Use the user's document as the idea/script source. Unless asked for analysis of the document, the audience should experience a standalone video, not hear about a hidden source document. Preserve host identity, opinions, emphasis and call to action. “I want you to try making your own character” fits personal commentary; “the author wants readers to consider character creation” does not. Never invent first-person anecdotes to sound natural. Quotes and guests retain their own attribution.

Build editorial_review.json with `mode` (host_video, document_review, behind_the_scenes), `host`, `thesis`, `audience`, `takeaway`, `must_preserve` (list), `script` (complete spoken text), `claims` (list), `checks`, and `review_notes`. Checks require true after substantive review: intent_preserved, host_voice, source_conflicts_resolved, visuals_and_metadata_aligned, no_unnecessary_hedging. Notes explain evidence for each. Any exceptional production-reference phrase requires an exact `allowed_phrases` entry and a nonempty `exception_reason`; do not use exceptions to evade the requested voice.

## Source conflict protocol

For each disputed/time-sensitive claim record `id`, `statement`, `status` (verified, attributed, creative, unresolved), `source`, `observed_at`, and `reasoning`. For availability claims also record `kind: availability` and `evidence_type` (access_verified, official_release, firsthand_report, marketing_cta, or none). Access verification may be unavailable: do not invent downloads or bypass accounts. A CTA proves only the promise displayed, not the item being accessible. A later official announcement can contradict a stale CTA. A user's report can accurately be voiced as “I joined expecting the PDF, then saw the announcement for December 2.” It does not alone prove that nobody anywhere had access. If available evidence genuinely contradicts a firsthand claim, resolve scope/time and ask when the central premise depends on it. Do not accuse deception or invent motives.

If timing is material, distinguish promised, announced, released, accessible, and personally tested. Avoid relative dates that will mislead later. Do not hard-code the example's date into future videos. Cite sources in credits/metadata without narrating the research process unnecessarily.

## Regression scenarios

- Pending RPG guide: user reports joining Discord for promised PDF, learns a December date; site CTA says “Get the Quickstart.” Preserve the user's start-playing-now thesis; do not announce availability on CTA evidence. First-person experience is acceptable with attribution. Use announced timing, not accusations.
- Mixed evidence: user says their invite failed, verified status page says service works. State their failed attempt without claiming a global outage. Ask only if the disputed claim is central.
- Document critique explicitly requested: explaining what a document argues is allowed. The host-video default must not erase this request.
- Established fact: state it directly. Homebrew design: identify it as the host's idea, then discuss it confidently without repetitive “may/might/not official” disclaimers.
- Personal story: preserve supplied experiences but do not invent actions, membership, purchases or opinions to fill transitions.

## Whole-output review

Check the hook and closing preserve the same purpose. Read every line aloud as a host: remove report-like phrasing and production references. Verify no screenshot label/CTA contradicts narration; use a clearly labelled original timeline graphic rather than falsifying a source screenshot. Check captions and metadata too. Revisit the review whenever research or user corrections change a material fact. Numerical/render tests cannot establish editorial fidelity.
