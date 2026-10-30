# Jet Black RLSH 2D Cartoon Studio

A local SVG animation editor with editable layered characters, articulated puppets, reusable actions, view-aware staging, props, backgrounds/effects, camera keyframes, captions, a timeline, portable embedded-audio projects, independent still/comic editing, PDF output and headless movie export.

This branch is a **source release**, not a hosted deployment. Build the synthesized-voice runtime locally before opening the editor. No accounts or hosted generation service are required.

## Quickstart

Requires Node 20+ and npm. In this folder:

```sh
npm ci
npm run build
```

Open `START.html` in a current browser. The demo is original generic fiction. Save projects as `.jet2d.json`; images and selected audio are embedded. This build includes the author's ten original thematic tracks, explicitly authorized for public release. Playback/editing work offline after setup. No Python or model files are downloaded when the page opens.

### Speech

Kokoro is preferred for new blank projects. It is optional and uses a separate local CLI, then imports actual generated audio. Existing projects preserve their audio and cast. Six **bundled synthesized voices** remain selectable without Kokoro, after the normal source build.

See [Kokoro workflow](docs/kokoro.md) and [adapter setup/reference](tools/KOKORO.md). The model weights are not included; model download and Python dependency installation require explicit terminal commands. There are no API keys. Imported WAV clips, cast configuration and provenance stay in portable project JSON.

## Headless tools

```sh
node scripts/export.cjs --help
node scripts/print.cjs --help
node scripts/kokoro-project.cjs import input.jet2d.json manifest.json NEW-output.jet2d.json
```

The exporters have positional interfaces; invoking without the required paths displays usage. Movie export additionally requires installed Chrome/Chromium, FFmpeg and ffprobe. These applications are not bundled. Browser-native recording can produce MP4 or WebM depending on browser codec support. Not every SVG feature is supported, and the editor does not claim lip sync or 3D turning.

## Tests

```sh
npm run test:voice
npm run test:ui
npm run test:kokoro
node scripts/verify-stagecraft.cjs
```

Other focused tests live in `scripts/`. UI tests use jsdom/native canvas unless expressly named browser. An optional `scripts/verify-kokoro-browser.cjs` uses separately installed Playwright and Chromium; its launch is blocked in the current restricted cloud process environment. See [verification](VERIFICATION.md) for exact executed scope. Listening and physical-browser quality review are not claimed.

## Assets and source

- `app/`: editor, schema, renderer, audio model, puppets/staging and speech adapters.
- `scripts/`: tests, source build, original audio generator, headless import/export.
- `library/`: original thematic music, original SFX and reusable art descriptors.
- `demo/`: neutral original Signal Garden demo and newly generated Kokoro narration/provenance.
- `vendor/`: separately licensed pdf-lib. The build copies pinned Playwright tooling and creates the GPL speech bundle and embedded audio manifests locally; generated dependencies/audio data wrappers are ignored and not committed.

Rebundle the included music and rebuild original deterministic SFX with `python3 scripts/build-audio-library.py`. No source journals, private stories, Drive documents, personal machine paths, production exports or saved personal projects are included.

## Licensing

Original project contributions are dedicated under the repository's CC0 terms **only to the extent the contributor owns those rights**. Third-party packages are not CC0. The local speech build combines GPL meSpeak/eSpeak; its generated runtime must not be redistributed as CC0. Read [third-party notices](THIRD-PARTY-NOTICES.md) and upstream licensing before distributing built bundles. Kokoro dependencies/model weights have their own licenses and are not included. No blanket copyright waiver is asserted over dependency code or its derived runtime.
