# Create Canvas GLSL Art

An agent skill for layered Canvas 2D artwork, real GLSL lighting, deterministic animation, and audiovisual story production.

## Fast by default

- Fast: 640×360 at 6 fps.
- Full: 1920×1080 at 24 fps, selectable in the starter or with `--mode full` in exporters.
- Geometry, timing, shader source and audio quality stay unchanged; lower resolution and sampling reduce fine detail and motion smoothness.

This lightweight release contains the complete skill, starter, exporters, tests, and reference guides. Large example projects and media are intentionally omitted.

## Use

Install this directory through your agent's supported skill-installation process. Start with [SKILL.md](SKILL.md) and [references/fast-mode.md](references/fast-mode.md). Open [assets/starter.html](assets/starter.html) in a WebGL-capable browser for the technical demo and mode selector.

```sh
npm install
python3 -m pip install -r requirements.txt
npm test
node scripts/render_frames.cjs assets/starter.html fast.mp4 8
node scripts/render_frames.cjs assets/starter.html full.mp4 8 --mode full
```

Browser export additionally needs Playwright's compatible Chromium browser and FFmpeg/FFprobe. Native story export additionally needs Mesa EGL/OpenGL ES and a compatible seven-layer project as documented in the fast-mode guide. Story examples and audio models are not bundled. Audio production instructions may require a separately installed webgl-canvas-story-animator skill and its model runtimes.

## Verification

Release checks on 2026-11-03 passed default/full mode metadata, mode-selector behavior, repeated-timestamp determinism, unchanged full-resolution Canvas baseline hashes, unchanged shader hashes, Python compilation and Node syntax checks. The mode unit test stubs WebGL and is not interactive browser verification. Earlier native fast/full smoke renders compiled actual GLSL successfully; see the fast-mode guide for measured benchmark scope and limitations.

## License

[CC0-1.0](LICENSE). Third-party runtime packages retain their own licenses. No model weights, third-party media, credentials or private journal source are included.
