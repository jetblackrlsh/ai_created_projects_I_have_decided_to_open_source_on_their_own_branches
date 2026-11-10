# Ready-to-publish YouTube metadata

Write for the public viewer, not for the person operating the production workflow. The complete description must be immediately pasteable into YouTube without editing.

## Deliverables
- `youtube-description.txt`: only the final public description, plain text. No filename/header wrapper, code fences, instructions, alternative drafts or title/tag field labels.
- `youtube-metadata.md`: one final Title, one Description containing exactly the same text, and one separate comma-separated Tags field. Upload the metadata Markdown to private Drive and deliver its verified link as usual; include the plain-text file in the delivery package.
- Put production diagnostics, listening limitations, provenance details, private delivery links and instructions in the separate QA receipt or chat, never the public description.

## Content
Start with an engaging, accurate hook and concise synopsis grounded in the actual comic. Include useful verified creator credits, source context, and a few relevant hashtags if appropriate. Public-facing AI creation credits are fine when accurate; do not substitute private setup logs for credits. Do not claim authorship, originality, licensing, endorsement or rights that the evidence does not establish. Do not invent channel names, credits, calls to subscribe, facts or public URLs. Include chapters only from verified final timestamps; omit them when they do not add value. Keep below YouTube's 5,000-character description limit.

Use plain text and bare public URLs rather than Markdown link syntax or formatting that will appear literally. Include only verified intentionally public links relevant to this release. Never expose private Drive/Docs links, personal email, folder paths, source identifiers, credentials, unpublished information or production checkpoints. User approval to deliver privately is not approval to disclose private information publicly.

Resolve missing information before writing or omit optional fields cleanly. Never ship placeholders (TBD, TODO, insert link, add credits), editing directions, bracketed prompts, alternatives or notes addressed to the user. The description must remain complete even if copied without its surrounding metadata file.

## Final check
Run `python3 scripts/check_youtube_description.py youtube-description.txt`. This catches common mechanical leaks; it does not prove privacy, accuracy, rights or link accessibility. Read the text as a viewer, check all claims and links, and verify its exact match to the Description section in the Markdown. Preserve the existing upload authorization boundary: preparing metadata does not authorize posting to YouTube.
