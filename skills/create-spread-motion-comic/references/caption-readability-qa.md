# Final-video caption readability gate

This is mandatory for every delivered motion comic, including 360p versions, re-encodes, and revised exports. A complete soundtrack does not excuse incomplete readable text. Review the actual final encoded MP4, not only the source spread, crop coordinates, an enlarged preview, or a thumbnail contact sheet.

## Before rendering: account for every caption

1. Inventory every panel in reading order and every caption box within it. Record stable panel/caption IDs, exact expected text, source-image pixel bounds including the whole box and all glyphs, assigned shot IDs, and planned readable time intervals. Include short captions and bottom/edge boxes, not just narration excerpts.
2. Frame each text-reading hold to contain the entire caption with visible breathing room. Target at least 8 output pixels from the crop/frame edge at 640x360; increase when needed for borders or effects. Check start/end crop rectangles and intermediate camera positions. Keep overlays/subtitles clear of the text. Automatic containment checks assist but cannot prove the recorded box bounds are correct.
3. If fitting a panel makes lettering too small, use a closer static caption-reading view followed by the art view, or multiple clearly ordered reading views, each containing complete caption boxes. Do not solve clipping by making all lettering microscopic. Preserve original wording and reading order. Do not silently regenerate or rewrite the source lettering.
4. Give viewers time to read: provision at least max(3 seconds, word_count / 2.5) per reading view, then assess actual pacing. Add time for dense or difficult lettering. Narration timing is a minimum, not evidence that visual reading is possible.

## After rendering: inspect what the audience will see

- Extract and open full-size frames from the final delivery MP4 at the beginning, midpoint and end of **each** readable hold, plus maximum zoom/tightest crop and each transition boundary. Inspect additional frames where motion/effects can obscure lettering. Watch each pan/zoom segment through its entire interval; endpoint screenshots alone can miss transient clipping.
- At native playback size, read every word, punctuation mark, first/last line and box edge against the source inventory. Check for cut-off glyphs, partial last lines, blur, illegibly small text, compression artifacts, overlay obstruction and too-short holds. Enlargement may diagnose a problem but does not count as native-size readability.
- Brief establishing/transition shots may show small or incomplete text only outside the designated reading interval. Each caption still requires a sufficient continuous unobscured readable hold. Do not start narration over unreadable transition framing and count that as the reading hold.
- Record a ledger row per caption: panel ID, caption ID, expected text/source bounds, shot IDs, readable interval, inspected frame timestamps/paths, native dimensions, reviewer observation, pass/fail, repair and recheck result. Link the ledger to the final MP4 SHA-256. Reconcile inventory count to reviewed count: zero missing captions and zero unresolved failures.
- OCR, rectangle containment, frame extraction, FFmpeg decode, tests and contact sheets are useful preflight tools, not visual approval. Never mark a perceptual check passed unless you actually inspected the images/video. If visual inspection is unavailable, explicitly leave the gate unverified; do not describe the deliverable as fully QA-approved.

## Repair and delivery

For any partial clipping, widen/reposition the crop, reduce/stop the zoom, remove conflicting overlays, add an appropriate dedicated reading hold, or lengthen the hold. Rerender and repeat review of all affected shots and adjacent transitions. Recheck complete caption coverage on the final export; any further resize/re-encode requires native-size reinspection. Deliver only when all captions pass, or clearly disclose an unresolved limitation rather than claiming it was fixed. Keep existing audio mix, speaker segmentation, pronunciation and provenance gates intact.

This workflow changes future quality control. It does not authorize modifying or replacing a previously accepted/published video without a user request.
