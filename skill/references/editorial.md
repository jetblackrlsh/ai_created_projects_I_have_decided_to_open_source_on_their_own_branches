# Editorial voice and evidence

## Adaptation contract

Use the user's document as the idea/script source. Unless asked for analysis of the document, the audience should experience a standalone video, not hear about a hidden source document. Preserve host identity, opinions, emphasis and call to action. “I want you to try making your own character” fits personal commentary; “the author wants readers to consider character creation” does not. Never invent first-person anecdotes to sound natural. Quotes and guests retain their own attribution.

Build editorial_review.json with `mode` (host_video, document_review, behind_the_scenes), `host`, `thesis`, `audience`, `takeaway`, `must_preserve` (list), `script` (complete spoken text), `claims` (list), `checks`, and `review_notes`. Checks require true after substantive review: intent_preserved, host_voice, source_conflicts_resolved, visuals_and_metadata_aligned, no_unnecessary_hedging, no_obvious_explanations, speaker_certainty_preserved. Notes explain evidence for each. Any exceptional production-reference phrase requires an exact `allowed_phrases` entry and a nonempty `exception_reason`; do not use exceptions to evade the requested voice.

## Source conflict protocol

For each disputed/time-sensitive claim record `id`, `statement`, `status` (verified, attributed, creative, unresolved), `source`, `observed_at`, and `reasoning`. For availability claims also record `kind: availability` and `evidence_type` (access_verified, official_release, firsthand_report, marketing_cta, or none). Access verification may be unavailable: do not invent downloads or bypass accounts. A CTA proves only the promise displayed, not the item being accessible. A later official announcement can contradict a stale CTA. A user's report can accurately be voiced as “I joined expecting the PDF, then saw the announcement for December 2.” It does not alone prove that nobody anywhere had access. If available evidence genuinely contradicts a firsthand claim, resolve scope/time and ask when the central premise depends on it. Do not invent deception or motives. Preserve an explicitly supplied personal judgment in the speaker’s voice; distinguish it from an unsupported assertion of someone else’s hidden intent.

If timing is material, distinguish promised, announced, released, accessible, and personally tested. Avoid relative dates that will mislead later. Do not hard-code the example's date into future videos. Cite sources in credits/metadata without narrating the research process unnecessarily.

## Regression scenarios

- Pending RPG guide: user reports joining Discord for promised PDF, learns a December date; site CTA says “Get the Quickstart.” Preserve the user's start-playing-now thesis; do not announce availability on CTA evidence. First-person experience is acceptable with attribution. Use announced timing and preserve the speaker’s stated reaction without inventing intent.
- Mixed evidence: user says their invite failed, verified status page says service works. State their failed attempt without claiming a global outage. Ask only if the disputed claim is central.
- Document critique explicitly requested: explaining what a document argues is allowed. The host-video default must not erase this request.
- Established fact: state it directly. Homebrew design: identify it as the host's idea, then discuss it confidently without repetitive “may/might/not official” disclaimers.
- Personal story: preserve supplied experiences but do not invent actions, membership, purchases or opinions to fill transitions.

## Whole-output review

Check the hook and closing preserve the same purpose. Read every line aloud as a host: remove report-like phrasing and production references. Verify no screenshot label/CTA contradicts narration; use a clearly labelled original timeline graphic rather than falsifying a source screenshot. Check captions and metadata too. Revisit the review whenever research or user corrections change a material fact. Numerical/render tests cannot establish editorial fidelity.

## Human-voice pass: confidence without invention

A human host is telling a story or making an argument, not delivering an assistant’s evidence audit. Preserve the speaker’s degree of certainty and emotional force. Personal experiences, preferences and judgments do not need a hedge simply because they are personal. State documented events directly. Keep source analysis and production notes in private project records, not narration.

- Delete statements whose only purpose is to explain the obvious: “these are my illustrations, not screenshots of the argument,” “this is an image,” or “the screenshot shows text.” Show the art while discussing the ideas behind it. Add a label only when a viewer could materially mistake a reconstruction for evidence.
- Remove unsolicited courtroom/report framing: “this is not a moderator ruling,” “the screenshots do not settle the debate,” or “this should not be taken as proof” unless that distinction answers an actual claim the video makes. Do not insert a rebuttal to a position the speaker never took.
- Do not flatten a stated judgment into uncertain perception. If the user says “They insulted me,” and the record supports the insult, say it directly. If they say “I’m glad moderators stepped in,” preserve that instead of “moderation may have been beneficial.”
- Keep real unresolved facts narrow: “The policy has not been announced yet” is useful if the outcome is pending. Repeating “potentially,” “arguably,” “it could be perceived,” or “from my perspective” before established events is not. Do not strip genuine uncertainty from predictions or disputed factual allegations.
- No new autobiographical claims, fabricated quotes, exaggerated outcomes or invented motives. If a material factual conflict remains, resolve it before recording rather than filling the video with generic caveats.

For each qualifier, disclaimer, contrast or visual explanation ask: What misunderstanding does this prevent? Is that misunderstanding plausible here? Does it matter to the thesis? Would this speaker actually say it? Delete the line if it has no concrete audience benefit. Apply the same pass to narration, on-screen text, captions, title, description and tags. If a phrase is intentionally needed, record that exact phrase and its specific reason in the private editorial receipt; an exception must not become a blanket waiver. Automated phrase checks are prompts for review, never a substitute for reading the full script.

### Transfer examples

- Product review: “The hinge broke on day two.” Do not add “This is only one person’s experience and may not represent everyone” without a relevant broader claim. Do not change it into “The hinge may have malfunctioned.”
- Art showcase: “I gave the knight crystal armor because I love the way it catches the light.” Do not explain that the artwork is not a photograph.
- Community dispute: state what was posted, the response, the speaker’s judgment and the actual moderation outcome. Do not add an imaginary tribunal or insist that every screenshot fails to prove a universal conclusion nobody asserted.
- Forecast: retain “I hope this feature arrives next month” when timing is unknown; confidence preservation does not mean changing hopes into facts.
