# Third-party notices and scope

The repository's original game and adaptation code is dedicated to the public domain under the root CC0 1.0 dedication. This does not relicense external dependencies or claim ownership of their code, trademarks, fonts or tools.

- **@napi-rs/canvas 0.1.100** is an optional native raster dependency required for Node PNG/MP4 exports. Its package declares MIT; the exact installed package's copyright/license notice is retained in `third_party/NAPI_RS_CANVAS_LICENSE.txt`. Its native distributions include upstream components such as Skia; follow their distribution notices when redistributing those binaries. No dependency binaries or `node_modules` are vendored here.
- **FFmpeg/ffprobe** are external programs, not included. Licensing depends on build configuration (including GPL components such as libx264). Obtain and distribute them in accordance with their own licenses. This project does not grant additional rights to FFmpeg, x264 or their binaries.
- The browser game synthesizes its own Web Audio music/effects and procedurally generates SVG artwork. No recorded music, voices, cartoon footage, commercial card images or proprietary game assets are bundled.
- Raster exports use available system fonts; no font files are bundled. Native and browser font rendering may differ.
- GitHub Actions referenced by CI are separately maintained tools under their own licenses; they are not copied into this repository.

AetherSnap is an original game inspired by the broad short-match, three-location card-battler format associated with Marvel Snap. It is not affiliated with or endorsed by Marvel, Second Dinner or their licensors. Those names identify the inspiration only; no Marvel character artwork, logos or licensed assets are used here.

## Seeded-random algorithm lineage

The original engine retains its cyrb128 seed-hash revision and sfc32-style state transitions. Credit to bryc for the JavaScript implementation lineage. Upstream [PRNGs.md](https://github.com/bryc/code/blob/master/jshash/PRNGs.md) states public-domain availability, and [the author’s cyrb128 clarification](https://github.com/bryc/code/issues/13) confirms that status for cyrb128. The exact original revision is preserved for replay compatibility rather than substituted with a newer algorithm.
