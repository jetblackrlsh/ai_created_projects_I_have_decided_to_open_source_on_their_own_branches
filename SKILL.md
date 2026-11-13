---
name: create-jet-paint-template-art
description: Create or edit art with built-in image generation in Jet Black's original Microsoft Paint character-template style. Use for old MS Paint-style Jet drawings, reusable character bases, modular character variations, or completed characters based on Jet's seven original reference drawings. Keep distinct from generate-jet-style-images and its modern anime aesthetic.
---

# Jet Paint Template Art

Use built-in image generation, guided by the bundled original drawings, not a generic anime or pixel-art preset. Jet approved the initial goblin example on 2026-11-13 as very accurate and like something he would draw. Preserve that successful interpretation while continuing to use the originals as the source of truth; refine further with specific feedback.

## References first

Read [reference-guide.md](references/reference-guide.md). Open relevant original PNGs in `assets/` with the available image-viewing tool before generation. Use the base plus the nearest variant for a new character; use the exact chosen original for a template edit. Attach the viewed reference paths to the built-in image tool using its supported image-reference parameters. Do not rely on descriptions alone when the originals are available. If tool limits require a subset, prioritize the base and the closest variant; do not silently replace originals with earlier AI samples.

## Preserve the visual identity

- Make the head unusually broad and large: nearly flat top, rounded upper corners, simple side contours, rounded cheeks and a small chin. Preserve the reference's actual proportions rather than regularizing them into standard anime anatomy.
- Use oversized expressive eyes with nested outline shapes and small offset highlights. Keep the tiny angular nose and economical mouth marks.
- Use black raster-style outlines on white, with slight hand-drawn irregularity and pixel-stepped edges. Keep contours coherent and shapes readable. Do not simulate careless scribbling, distressed paper, or low-resolution game sprites.
- Use simple torso geometry and sparse interior lines. Match the selected reference: original feminine bases have narrow waists and broad hips; approved male bases have flatter chests, broader shoulders and straighter waists/narrower hips. Do not automatically impose feminine contours or sexualize every character.
- For male characters, consult the approved male references in the reference guide. Avoid cleavage-like V marks, curved breast outlines and shapely chest cutouts. Clothing and emblems must not imply cleavage. Keep anatomy economical rather than adding bodybuilding detail.
- Keep areas predominantly closed and easy to flood-fill. Prefer bold silhouette changes, simple facial changes, costume panels, horns, ears, stripes or circuit motifs over dense detailing.
- Keep backgrounds plain unless requested. Do not add gradients, cinematic lighting, rendering, texture, smooth vector perfection, painterly shading, glossy anime finish or unnecessary typography.
- Default to black-and-white line art for an unspecified style test. Flat coloring is an optional extension because Jet described coloring these templates; do not claim the supplied black-and-white drawings establish a particular palette.

## Choose the requested output

**Reusable base:** front-facing centered portrait, white background, simplified torso, unfinished arms and lower legs as in the base. Keep enough surrounding space for later additions. Do not finish missing limbs unless asked.

**Finished character:** build hair, clothing, limbs and distinctive features around the same visual grammar. Add complete hands/feet when appropriate; do not carry template truncations into an intended finished illustration. Preserve recognizable head and eye construction in a different pose.

**Template edit:** preserve the supplied base's silhouette, line placement and proportions as closely as possible; alter only requested parts. Do not imply generated edits preserve every pixel exactly.

**Scene or composition:** use the same economical character drawing language. Add only enough setting detail to communicate the action. Do not switch to generic polished anime to make a scene more elaborate.

## Prompt and generate

State the subject, output mode, selected visual anchors, allowed changes and exclusions. Refer explicitly to the supplied images as the style source. Use the built-in image-generation tool; do not substitute SVG, canvas drawing or another generation service. Follow current tool guidance for references, transparent backgrounds and delivery.

Example:
> Create an original [subject] based closely on these original MS Paint drawings. Preserve the broad flat-topped head, oversized nested eyes, tiny angular nose, simple mouth, stylized torso and slightly irregular pixel-stepped black contours. [Specify base/edit/finished-character features.] Use flat closed shapes on plain white with no shading or texture. Keep the handmade raster-line-art look; do not polish it into vector art or modern anime.

Keep explicit user content and requested colors/poses above defaults. A request for transparency requires genuine transparency, not a checkerboard drawing.

## Review and feedback

Inspect the generated image against the original references, not just the prompt. Check head width/top shape, eyes, face economy, body proportions, line character, detail density, and whether the requested edit or completed anatomy is present. Report a mismatch plainly and revise using the image tool when needed. Never describe a text-only prompt review as visual inspection.

Show the example and invite the requested feedback on fidelity. Store confirmed corrections in this skill and relevant references after Jet supplies them; distinguish user-approved changes from agent guesses. Do not make a generated image an authoritative reference until Jet approves its fidelity. Keep original drawings intact.

Preserve recoverable private checkpoints of this skill and reference files when updating it. Update existing backup copies when applicable, but do not publicly release Jet's original art or publish a new open-source copy without authorization.
