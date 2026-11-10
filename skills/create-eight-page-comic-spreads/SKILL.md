---
name: create-eight-page-comic-spreads
description: Create anime-style comics as single-image spreads containing up to eight comic pages each. Use when the user asks for eight-page spreads, caption-only comic spreads, or invokes this skill. Generate longer comics as sequential spread images, inspect every spread, and regenerate the entire affected spread when errors are found.
---

# Create Eight-Page Comic Spreads

## Plan the comic

1. Use the visual style below and any character references explicitly supplied by the user. Inspect those references before generation. Use original characters for a new original story unless a cast is specified. Do not assume access or rights to any private character canon.
2. Honor the requested premise, length, audience, and supplied reference format. Default to a complete eight-page original story for an unspecified test. Give it an opening, developing conflict, decisive action, and satisfying ending. Do not replace a complete story with a teaser.
3. Divide the story into ordered batches of eight pages. For N pages, create ceiling(N/8) spread images. Never put more than eight pages in one image. Keep the final batch at its actual page count: 9 pages means 8+1; 16 means 8+8; 18 means 8+8+2. Maintain continuous page numbering across images.
4. Treat a page as a distinct bordered portrait page, not merely one panel in an eight-panel comic. Default to two simple panels per page, but use a deliberate full-page splash when the story benefits. Keep panel counts restrained to protect lettering size.
5. For eight pages, use a flat landscape contact sheet of four columns by two rows, pages 1–4 above 5–8. Use clean, generous gutters separating pages and thinner dividers inside each page. Adapt smaller final batches without blank or duplicate filler pages. Follow an explicit user reference layout instead when provided. Never simulate a photographed book or add perspective distortion.
6. Write exact short captions and a visual beat for each panel. Aim for 4–10 words per caption, one caption per panel, and fewer words rather than smaller lettering. Record recurring characters' physical traits, clothing, props, and location designs to keep them consistent between pages and spreads.

## Generate one whole spread

1. Use the built-in image-generation tool to generate every page in the batch together as ONE image in ONE generation. Do not generate pages separately and stitch them together. Do not substitute HTML, SVG, a PDF, or code-drawn art for the image.
2. Request the largest supported landscape image appropriate to the page grid. Do not claim a pixel size that the tool does not provide. A dense eight-page image may need zooming on a phone; prioritize large lettering and disclose any remaining readability limit.
3. Put these requirements explicitly in every self-contained image prompt:
   - Colorful, highly saturated, dynamic modern anime artwork; razor-sharp details; strong contrast; bright glow; luminous rim lighting; vivid neon, prismatic, cosmic, or scene-appropriate lighting; expressive faces; purposeful poses; accurate anatomy and hands; polished cinematic compositions.
   - Exact number of distinct portrait pages, grid positions, page numbers, and unambiguous left-to-right then top-to-bottom reading order. Put page labels and any title in rectangular caption boxes too.
   - NO speech bubbles and NO thought balloons. Put ALL story text, dialogue, thoughts, narration, and any sound-effect words inside rectangular caption boxes with no tails. Prefer visual effects over sound-effect words.
   - Large, heavy bold, clear sans-serif lettering. High-contrast text on solid caption backgrounds; ample padding; no tiny print, script fonts, clipped text, decorative text, or lettering over busy art. Preserve exact wording and spelling. Attribute dialogue or thoughts by name when needed.
   - Full character and location descriptions, exact caption strings, and the action for every panel on every page. No extra characters, limbs, unsupported props, duplicate pages, watermark, or unrequested text.
4. End reusable or external prompts with `LANDSCAPE ASPECT RATIO` when using the default spread grid. Honor explicit orientation requests.
5. For later spreads, restate the complete visual descriptions and continuity state. If supported, use an inspected accepted earlier spread as a visual reference, not as a spot-edit target.

## Inspect and regenerate

1. Visually inspect EVERY generated spread, both as a whole and zoomed to each page. Read every caption and compare with the planned text. Inspection-only crops or zooms are acceptable; do not modify the deliverable.
2. Check page count, order, page boundaries, internal panel flow, story completeness, continuity, repeated or omitted beats, anatomy, hands, faces, clothing, props, architecture, unintended objects, caption spelling, bold font size, contrast, clipping, and the total absence of speech/thought balloons.
3. If ANY issue is found, regenerate the ENTIRE affected spread from its complete prompt with explicit corrective constraints. Do not perform spot edits, inpainting, caption overlays, panel replacements, or pasted fixes. Keep unaffected accepted spreads intact.
4. Reinspect every replacement with the same checks. Never describe an uninspected result as checked, perfect, or fixed. After repeated failure, simplify captions or compositions without changing the story and regenerate again. If a tool limit prevents an acceptable result, report the exact unresolved limit rather than silently delivering it as final.

## Deliver

Attach every accepted full-resolution spread image in story order, labeled with its page range. Use native file attachments where available. Include a concise title and note any real readability limitations. Provide a PDF or separate page exports only when requested; never replace the primary spread images with those extras. Do not publish externally or add unrelated backups unless requested or independently authorized.
