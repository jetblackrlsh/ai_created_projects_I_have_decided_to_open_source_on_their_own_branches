# Fast and full rendering

Default: 640×360 at 6 fps. Full option: 1920×1080 at 24 fps. Respect explicit user format requests. Only output resolution and sampled fps change. Preserve exact geometry, semantic layers, scene timings, animation formulas, audio, captions, GLSL source, precision, sample counts, glow and grading. Do not replace GLSL with CPU effects.

## Browser starter and exporter

The starter opens in fast mode and includes a working mode selector. `window.setRenderMode('full')` and `?mode=full` select full mode. `window.artInfo` reports actual width, height, fps and mode. `renderAt(t)` remains absolute-time deterministic. The starter itself displays a deterministic still; fps governs export sampling, not an invented playback loop.

    node scripts/render_frames.cjs artwork.html fast.mp4 8
    node scripts/render_frames.cjs artwork.html full.mp4 8 --mode full

Legacy explicit positional fps/width/height remain supported. Custom HTML must implement compatible dimensions and optionally setRenderMode; mismatches fail rather than silently rescaling screenshots. Requires installed Playwright/Chromium and ffmpeg. Browser interaction must be tested separately when a usable browser exists.

## Native story exporter

For the seven-layer story contract used by The Breathing Engine and The Story I May Never Have Made:

    python scripts/render_story_video.py PROJECT --seconds 12 --start 350 --output fast.mp4
    python scripts/render_story_video.py PROJECT --mode full --seconds 12 --start 350 --output full.mp4

Omit seconds to render the timeline's remaining duration. Output paths are relative to the caller's working directory; existing output is never overwritten. This renders video only. Mux the unchanged audio master separately using the existing story workflow. Requires Node with @napi-rs/canvas, Python with numpy/Pillow, ffmpeg and Mesa libEGL/OpenGL ES. No model generation or paid APIs are needed.

PROJECT must contain audio/timeline.json with total_duration, src/scene-renderer.js exposing initSets(makeCanvas) and drawScene(canvas,t,layers), and exact src/vertex.glsl and src/fragment.glsl. Logical dimensions are 1920×1080 and layers are far, mid, stage, actors, energy, foreground, captions. The adapter corrects the existing cached-set three-argument drawImage call to an explicit 1920×1080 logical destination. A project already using explicit logical drawImage destinations needs no correction. Audit other cached image calls before adopting this adapter for a different scene contract; it is not an arbitrary HTML interpreter.

Canvas targets, texture allocation, EGL pbuffer, viewport and RGBA readback use actual output dimensions. Canvas contexts uniformly scale logical coordinates. Cached raster canvases are composited into the original logical destination rectangle. The existing shader's u_resolution remains 1920×1080 to preserve its normalized effect footprint. Changing it to 640×360 would triple that shader's blur footprint, so do not do that. Preserve the full-mode encoder settings (libx264 medium CRF17 yuv420p +faststart) in both native modes. Browser exporter retains its preexisting CRF18.

## Validation and evidence

Run `node scripts/test_render_modes.cjs`. It checks fast/full metadata and selector behavior, repeated timestamps, unchanged shader source hashes and full-mode Canvas pixel hashes against the original starter at three timestamps. This uses native Canvas with a stub WebGL interface to inspect pre-shader pixels; it is not browser or GLSL execution QA.

For native output, run verify_video.py with explicit --width 640 --height 360 --fps 6, or 1920/1080/24 for full, and --seconds matching the export. Inspect produced representative frames and .mp4.json results. Verify actual compiled GLSL and gl_error=0. Short encodes establish technical functionality, not full-film motion QA.

The controlled 2026-11-03 benchmark used three 12-second segments from the existing dream scene: 154.2165 seconds full versus 9.8756 seconds fast, aggregate 15.62× rendering-and-encoding speedup. That is a measured sample result, not a guaranteed speedup for all scenes or total production. Audio generation/mixing was excluded. Fast sampling necessarily reduces fine-detail resolution and motion smoothness. Do not claim perceptual equivalence or full-film render timing from these samples.
