# Render manifest

Use JSON paths relative to the manifest directory, or absolute paths. Source coordinates use original pixels, not normalized fractions. Required keys:

- `source`: original image path; `source_sha256`: exact lowercase SHA-256.
- `audio`: canonical finished mix path (not a stem or placeholder).
- Optional `width`, `height`: positive even output dimensions, default 640 × 360; optional `fps`: default 24. Omit all three for the normal 360p/24fps production. Use explicit higher dimensions only when requested; for example width 1920, height 1080, fps 24.
- `shots`: ordered list. Each has `id`, `rect: [left, top, right, bottom]`, `duration` in seconds and optional `end_rect` for a gentle pan/zoom. Omit end_rect for readable holds. Rectangles must remain inside the original. Include a full-spread establishing shot explicitly if desired.

Production-specific fields should include panel/page IDs, speaker/line assignments, sample-clock starts/ends, cast mapping, text-safety review, model/stem provenance and listening review. The renderer ignores extra fields and cannot validate those semantic claims.

The helper measures audio duration with ffprobe and rejects duration mismatch beyond one frame plus 25 ms. Each shot becomes at least one frame; frame rounding is checked against the final soundtrack. It renders to a temporary workspace, validates a full final decode, and retains the source master separately. It does not silently truncate audio or pad an unknown timing mismatch. A transition may interpolate from the full-spread rectangle to a panel rectangle with a different aspect ratio: each frame is contained and letterboxed, never stretched. Use a brief silent transition followed by a separate full-panel hold for its spoken lines. Confirm all text is safe in both rectangles before rendering.

## Mandatory production readability evidence

Maintain a per-caption ledger as specified in `caption-readability-qa.md`, linked to the exact final video hash. Include source bounds, expected text, shot mapping, continuous readable interval, extracted final-frame timestamps, native-size visual observations and repair/recheck results. `render_spread.py` does not validate this semantic ledger or certify caption readability; a successful render or decode is not delivery approval.
