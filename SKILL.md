---
name: create-canvas-glsl-art
description: Create, edit, and animate original layered Canvas 2D artwork with genuine WebGL GLSL shaders; export reproducible stills and video with editable source. Use for Canvas-plus-shader illustrations, character scenes, multi-location animations, and complete story films with dialogue, narration, local model audio, captions and interactive playback.
---

# Create Canvas GLSL art

## Establish the deliverable

Honor the requested medium: Canvas 2D drawing geometry for the artwork, actual compiled GLSL programs for shader effects. Do not substitute CSS filters or claim a CPU image filter is GLSL. Inspect references for composition, lighting, gesture, palette and detail density. For original work, design new subjects and geometry rather than tracing raster color regions or embedding the reference. Use image-derived geometry only when reconstruction/tracing is requested and label it clearly.

For editing, inspect the existing implementation and preserve unaffected design and functionality. Separate geometry, motion, lighting and presentation changes. Retain a baseline preview so regressions are visible.

Default to **fast mode: 640×360 at 6 fps** unless the user specifies another format. Keep **full mode: 1920×1080 at 24 fps** selectable. Fast mode changes only raster resolution and sampled frame rate: preserve scene geometry, layers, timing, animation formulas, shaders, shader sample counts, glow, grading and audio quality. Keep a 1920×1080 logical coordinate system for widescreen work, scaling raster targets uniformly. It reduces fine-detail resolution and motion smoothness; never claim identical perceptual quality. Honor explicit requested sizes and choose a composition appropriate to the output. Read `references/fast-mode.md` for tested commands and scaling rules. Preserve a portrait subject through recomposition, not stretching or incidental cropping.

## Full audiovisual stories

For story adaptations or a requested complete film workflow, read `references/full-story-workflow.md` and `references/audio-workflow.md` before scripting or rendering. Integrate story-clarity audit, nonrepetitive chronological screenplay, direct dialogue/descriptive narration, actual Kokoro voices and Stable Audio music/SFX when appropriate, an audio-first measured timeline, ducked stems, captions, synchronized interactive playback and factual upload metadata. The installed **webgl-canvas-story-animator** supplies model-generation tooling; inspect its known edge cases rather than copying false quality claims. Preserve the higher visual/cinematic gates below. For a still or explicitly silent loop, do not add an unrequested film/audio workflow.

## Build editable layers

Use named semantic offscreen Canvas layers: environment, foreground, body, costume, hair, facial features, props, emission and atmosphere as needed. Make edit targets discoverable by name. Trace-free Path2D geometry, curves, strokes and gradients are suitable. Keep stable coordinates and pivots; separate static paint from moving parts. Author and visually inspect an explicit neutral human pose before animating: relaxed lowered hands, viewpoint-appropriate elbow placement and continuous arm contours. Do not reuse a braced/raised-arm pose as rest or globally flip IK branches; see the neutral-pose checks in `references/production-quality.md`. Do not mistake a large polygon count for visual richness.

Adapt `assets/starter.html` for a minimal reproducible Canvas/WebGL contract; it is a technical starter, not a finished art style. Replace its simple demonstration scene with the requested composition. It exposes `window.renderAt(seconds)` and `window.artInfo` for deterministic tests. Keep the source self-contained when offline delivery is requested.

Upload Canvas textures to WebGL; handle vertical orientation, alpha and aspect ratio explicitly. Compile/link with useful error logs. Check framebuffer completeness for multipass rendering. Use half-resolution separable bloom if needed, with a restrained final grade and vignette. Screen-space glow is not physically accurate relighting. Keep Canvas fallback visibly labeled as missing the shader, rather than silently claiming shader success.

## Animate deliberately

Read `references/animation.md` for shot planning and export and `references/production-quality.md` for the required visual-development, cinematography and motion review. Animate requested subjects, not only grain or lights. Character motion needs a readable action, stable anatomy, intentional pose changes, and coherent contacts. Separate hair, garment and prop motion from the main body; avoid rotating a whole rigid cutout as the only action. Multi-location requests require recognizably distinct authored environments and purposeful transitions.

Evaluate every frame from absolute time `t = frame / fps`. Seed procedural randomness; do not use wall-clock time or uncontrolled Math.random for offline frames. Cache static layers. Ensure full-frame backgrounds and no seams at moving cutout boundaries.

For animations, include motivated camera movement, pans, zooms and genuine perspective changes across a varied shot plan. Do not hold one shot type or perspective for the whole animation. A pan or zoom alone does not create a new viewpoint. Author alternate views or use depth-aware geometry when needed. Preserve detailed, polished, stylized character, prop and environment design through closeups and motion; add readable emotion, smooth staged actions and independent environmental life. Treat these as production requirements and inspect evidence, not automatic quality guarantees.

For combat and power-driven action, apply the anime-inspired action workflow in `references/production-quality.md` before rendering: creative power tactics, readable reversals and consequences, event-timed anticipation/impact/follow-through, selective impact frames and action lines, and authored perspective shifts. Choreography must remain clear without effects. Preserve story rules and the selected fast/full mode; do not claim these instructions or the technical starter automatically generate finished anime animation.

## Verify and deliver

Run scripts rather than describing hypothetical tests. Use `scripts/verify_video.py` on encoded video. The optional `scripts/render_frames.cjs` drives a compatible local HTML in installed Playwright/Chromium and encodes H.264. If browser startup is unavailable, use installed native Canvas and headless Mesa EGL/OpenGL ES to execute the same Canvas geometry and exact GLSL source, then disclose that browser interaction was not tested. Do not use a personal computer without explicit authorization.

Test compile/link, GL errors, texture orientation, shader uniforms at two values, deterministic repeated timestamps, and start/middle/end frames. For animation inspect a contact sheet spanning all shots and transitions. Technical tests do not establish artistic quality: inspect anatomy, silhouette, expression, occlusion, palette, seams and visual detail separately. Compare honestly to references; distinguish graphic illustration from painterly rendering, and lighting animation from articulated character animation.

Deliver preview, editable source, video when requested, and a short factual summary of what moves, rendering method, and limitations. Save/share only to destinations authorized for the task. Do not publish an offline artwork just to provide a link. See `references/lessons.md` for distinctions learned from the prior reconstruction and original-artwork workflows.
