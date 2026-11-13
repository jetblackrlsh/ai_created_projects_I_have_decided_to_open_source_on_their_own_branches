---
name: create-jet-paint-template-art
description: Create or edit art with built-in image generation in Jet Black's original Microsoft Paint character-template style. Use for old MS Paint-style Jet drawings, reusable character bases, modular character variations, or completed characters based on Jet's seven original reference drawings. Default to finished, fully colored artwork; the uncolored, incomplete references are construction bases, not the final output. Keep distinct from generate-jet-style-images and its modern anime aesthetic.
---

# Jet Paint Template Art

Use built-in image generation, guided by the bundled original drawings, not a generic anime or pixel-art preset. Jet approved the initial goblin example on 2026-11-13 as very accurate and like something he would draw. Preserve that successful interpretation while continuing to use the originals as the source of truth; refine further with specific feedback.

## Finished artwork is the default

Jet clarified on 2026-11-13: the original drawings are reusable construction templates. Choose a suitable template as the starting base, then draw on top of it and color it to create a complete character. Their omissions are not defining features of the finished style.

- Produce finished artwork in flat color by default, including unspecified style tests, named-character references and turnaround sheets. Use supplied character colors when known; otherwise choose a coherent palette. Black outlines do not mean black-and-white output.
- Add the character's hair over the blank head base unless the requested character is intentionally bald. Preserve the broad underlying head and eye proportions, not a permanently exposed flat scalp.
- Complete appropriate arms, hands, legs and feet. Extend tail stubs into full tails when the character has a tail, and finish wings and other requested anatomy. Do not copy missing template parts into a finished character. Respect intentional anatomy differences, framing and natural occlusion rather than inventing visible limbs that should not be there.
- Add clothing, accessories, expressions and poses that realize the requested character. Keep the simple handmade contours and economical detail; “finished” does not mean photorealistic or highly rendered.
- Use monochrome, a coloring page, or an unfinished reusable base only when the user specifically requests that output. The word “template” in this skill's name, a reference attachment, or “reference sheet” is not such a request.

## References first

Read [reference-guide.md](references/reference-guide.md). Open relevant original PNGs in `assets/` with the available image-viewing tool before generation. Use the base plus the nearest variant for a new character; use the exact chosen original for a template edit. Attach the viewed reference paths to the built-in image tool using its supported image-reference parameters. Do not rely on descriptions alone when the originals are available. If tool limits require a subset, prioritize the base and the closest variant; do not silently replace originals with earlier AI samples.

## Preserve the visual identity

- Make the head unusually broad and large: a broad underlying head base with rounded upper corners, simple side contours, rounded cheeks and a small chin. Preserve the reference's actual proportions rather than regularizing them into standard anime anatomy.
- Use oversized expressive eyes with nested outline shapes and small offset highlights. Keep the tiny angular nose and economical mouth marks.
- Use black raster-style outlines enclosing flat color, with slight hand-drawn irregularity and pixel-stepped edges. Keep contours coherent and shapes readable. Do not simulate careless scribbling, distressed paper, or low-resolution game sprites.
- Use simple torso geometry and sparse interior lines. Match the selected reference: original feminine bases have narrow waists and broad hips; approved male bases have flatter chests, broader shoulders and straighter waists/narrower hips. Do not automatically impose feminine contours or sexualize every character.
- For male characters, consult the approved male references in the reference guide. Avoid cleavage-like V marks, curved breast outlines and shapely chest cutouts. Clothing and emblems must not imply cleavage. Keep anatomy economical rather than adding bodybuilding detail.
- Keep areas predominantly closed and easy to flood-fill. Prefer bold silhouette changes, simple facial changes, costume panels, horns, ears, stripes or circuit motifs over dense detailing.
- Keep backgrounds plain unless requested. Do not add gradients, cinematic lighting, rendering, texture, smooth vector perfection, painterly shading, glossy anime finish or unnecessary typography.
- Default to flat color chosen for the subject. The black-and-white references establish shape and line language, not a mandatory palette or a lack of color.

## Choose the requested output

**Reusable base (explicit requests only):** front-facing centered portrait, white background, simplified torso, unfinished arms and lower legs as in the base. Keep enough surrounding space for later additions. Do not finish missing limbs unless asked.

**Finished character (default):** build hair, clothing, limbs and distinctive features around the same visual grammar. Add complete hands/feet when appropriate; do not carry template truncations into an intended finished illustration. Preserve recognizable head and eye construction in a different pose.

**Template edit (explicit requests only):** preserve the supplied base's silhouette, line placement and proportions as closely as possible; alter only requested parts. Do not imply generated edits preserve every pixel exactly.

**Scene or composition:** use the same economical character drawing language. Add only enough setting detail to communicate the action. Do not switch to generic polished anime to make a scene more elaborate.

## Prompt and generate

State the subject, output mode, selected visual anchors, allowed changes and exclusions. For finished art, explicitly state that references are incomplete construction bases, specify flat colors and the character’s completed hair, limbs and other features, and prohibit unfinished-template output. Refer explicitly to the supplied images as the style source. Use the built-in image-generation tool; do not substitute SVG, canvas drawing or another generation service. Follow current tool guidance for references, transparent backgrounds and delivery.

Example for the default finished output:
> Create a finished, fully colored [subject] using the supplied MS Paint templates as construction bases, not as the final drawing. Preserve the broad head proportions, oversized nested eyes, tiny angular nose, simple mouth, stylized torso and slightly irregular pixel-stepped black contours. Add [hair], complete [limbs/hands/feet and any full tail or wings], [clothing/accessories], and use [flat color palette]. Show [pose/composition]. The references are uncolored and may omit body parts because they are templates: do not reproduce those omissions, an accidentally bald head, tail stubs, or monochrome coloring-page art. Use flat closed color shapes with no gradients or texture; retain the handmade MS Paint look rather than vector art or modern anime.

Keep explicit user content and requested colors/poses above defaults. A request for transparency requires genuine transparency, not a checkerboard drawing.

## Review and feedback

Inspect the generated image against the original references, not just the prompt. Check head width/top shape, eyes, face economy, body proportions, line character, detail density, and whether the requested edit or completed anatomy is present. For finished output, also check that it is colored, hair is present when appropriate, all intended anatomy is complete, and no template stubs remain. For turnarounds, check consistent colors, hair, clothing and anatomy across every view. A monochrome or unfinished template fails this check unless expressly requested. Report a mismatch plainly and revise using the image tool when needed. Never describe a text-only prompt review as visual inspection.

Show the example and invite the requested feedback on fidelity. Store confirmed corrections in this skill and relevant references after Jet supplies them; distinguish user-approved changes from agent guesses. Do not make a generated image an authoritative reference until Jet approves its fidelity. Keep original drawings intact.

Preserve recoverable private checkpoints of this skill and reference files when updating it. Update existing backup copies when applicable, but do not publicly release Jet's original art or publish a new open-source copy without authorization.
