# Animation and export

Before rendering, define duration, frame rate, size, shot boundaries, subject action and transition timing. Apply the cinematography, design and performance gates in production-quality.md before full rendering. If duration is unspecified, choose a modest duration fitting the action and disclose it. A multi-location sequence should have time to establish each location, not simply cycle background colors.

- Define a camera per shot with position, framing, focal target, scale and depth/angle convention. Include pans, zooms and perspective changes; combine wider environmental views, readable action coverage and expressive closeups. Author changed views of the character/environment where necessary.
- Use named scene functions, e.g. observatory(t), skyBridge(t), duneGate(t), with one consistent character rig.
- Evaluate walks with planted contacts, separate upper/lower limbs where needed, and bounded secondary hair/coat motion. For stationary scenes, use deliberate gaze, breathing, gesture or prop handling rather than arbitrary oscillation.
- Crossfade two complete rendered scenes or use a motivated camera transition. Do not fade only the background while leaving a discontinuous pose.
- Keep shader uniforms in scene coordinates or documented screen coordinates. Avoid random grain flicker overwhelming small details.
- Default to 640×360 at 6 fps; use selectable full mode for 1920×1080 at 24 fps. Cache static layers at the target raster dimensions, keep logical coordinates unchanged, and never reduce shader samples or alter effect settings to obtain speed. Measure a sample before a full encode.
- Render N = round(seconds × fps) frames at t = 0...(N−1)/fps. Export with a constant frame rate and even dimensions for yuv420p. Avoid an extra endpoint frame that changes duration.

Browser export (requires installed playwright and Chromium, ffmpeg):

    node scripts/render_frames.cjs /absolute/path/art.html /absolute/path/output.mp4 8
    node scripts/render_frames.cjs /absolute/path/art.html /absolute/path/full.mp4 8 --mode full

Set CHROMIUM_PATH to an already installed Chromium executable if Playwright has no bundled browser.

The script expects window.renderAt(t), window.artInfo.width/height, and canvas id="art". It refuses dimension mismatch and shader fallback. Target-resolution frames are exported directly from the canvas, not from a scaled viewport screenshot. The temporary PNG sequence can be large; allow sufficient disk space. ffmpeg encodes only after all frames succeed. No audio is implied; add it only if requested.

Headless alternative: execute the exact Canvas functions under a compatible installed Canvas runtime, upload resulting RGBA layers to EGL, compile the same GLSL strings, set the same uniforms and render. ReadPixels is bottom-up; flip exactly once. Preserve pass order, texture filtering and texture-coordinate convention. This tests rendering, not DOM event handlers, downloads or browser integration.

Run scripts/verify_video.py output.mp4 --width 640 --height 360 --fps 6 --seconds 8. It verifies codec, actual decoded frame count, dimensions, rate and duration. Extract and inspect representative frames separately; metadata is not visual QA.

See fast-mode.md for the native seven-layer story exporter and preserved logical-coordinate contract. Use explicit 1920/1080/24 verification arguments for full mode.
