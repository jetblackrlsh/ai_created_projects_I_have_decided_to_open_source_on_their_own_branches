# License scope and third-party notices

The repository's CC0 dedication covers only rights held by the original project contributor. It does not relicense third-party code, model weights or generated combinations that are subject to other licenses. Source-only packaging deliberately excludes the compiled synthesized-speech engine and its dictionaries.

## meSpeak/eSpeak — optional local browser build

`package.json` pins `mespeak` 2.0.2, the CommonJS wrapper for Norbert Landsteiner's meSpeak (built on speak.js/eSpeak). The npm package declares GPL; upstream: https://github.com/mikolalysenko/mespeak and https://www.masswerk.at/mespeak/ . The generated `vendor/voice/voice.bundle.js` is produced locally by `npm run build`, is ignored, and is not part of this committed source release. The standalone project adapter is `app/voice-entry.js`.

Installing dependencies/building locally does not turn the generated combined runtime into CC0. Before redistributing that runtime, satisfy its upstream GPL notice, license and complete corresponding-source obligations for the exact engine build; this repository does not claim that a minified wrapper or npm package alone establishes complete corresponding source. You may instead distribute this source release with its pinned dependency manifest and build instructions.

## pdf-lib

`vendor/pdf-lib` contains pdf-lib 1.17.1, copyright Andrew Dillon, MIT. Its full license is retained in `vendor/pdf-lib/LICENSE.md`. Upstream: https://github.com/Hopding/pdf-lib .

## Playwright

`package.json` pins Playwright Core 1.58.2; `npm run build` copies it locally to ignored `vendor/playwright-core`, Apache-2.0. Retain its `LICENSE`, `NOTICE` and `ThirdPartyNotices.txt`. Upstream: https://github.com/microsoft/playwright . It invokes an installed browser; no Chrome binary is redistributed.

## Build/test dependencies

esbuild (MIT), jsdom (MIT) and @napi-rs/canvas (MIT) are installed by npm, not vendored as runtime source in this release. Their transitive dependencies retain their own licenses. `node_modules` is ignored.

## Kokoro

The adapter is original project code. Kokoro ONNX and its model/voice files are optional external dependencies; model weights are not bundled or silently downloaded. See `tools/KOKORO.md` and upstream package/model license notices. Demo narration was generated locally from the generic original text recorded in `demo/narration-provenance.json`; no voice engine, personal recording, private journal or unauthorized music was used as an output asset.

## Other external programs

Node, Python, Chrome/Chromium, FFmpeg and ffprobe are not redistributed and remain subject to their own licenses/build configurations.
