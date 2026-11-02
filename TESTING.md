# Mechanical regression tests

Install development dependencies (`npm install`) then run `npm test`, or run `node tests/mechanics.cjs` with jsdom 26.1.0 available. `JSDOM_PATH` can point to an existing jsdom installation without installing anything in the game directory.

The suite loads the real HTML, data, and application into an isolated jsdom window. It instruments the application in memory to expose existing handlers without modifying production files. Randomness is seeded. Canvas/audio playback, scrolling, and animation/timer scheduling are stubbed; no remote resources are loaded.

454 deterministic cases cover:
- Every one of 56 cards, with both base and upgraded stats (112 executions).
- All seven ultimate abilities and three passive-trigger contexts for each custodian.
- Every boss's four moves across four difficulties in solo and cooperative play (224 snapshots).
- 56 generated level-code and local-save round trips, including upgrade masks.
- All seven chapter passwords; malformed input rejection.
- Story progression versus non-progressing versus victories, defeat, cooperative AI.
- Actual upgrade-choice button handlers for all seven custodians.
- Four versus upgrade presets.

Numeric card definitions, boss move definitions, character HP, elemental domains, and deterministic combat state are checked against committed golden hashes. Presentation text/art is deliberately excluded. These hashes were established only after an independent before/after mechanical-equivalence comparison.

This is DOM/logic regression coverage, not a real-browser visual, audio, accessibility, performance, or exhaustive gameplay test. It does not exercise real-time animation timers. A browser playtest remains advisable.

## Release verification performed

Both the private original-to-release comparison and the public test suite passed on Node.js v24.22.1 with jsdom 26.1.0. The public command used an already available development installation rather than adding node_modules to this release:

```sh
JSDOM_PATH=/path/to/existing/jsdom node tests/mechanics.cjs
```

Output: `PASS: 454 deterministic DOM/logic cases and complete mechanical definitions.`

For a fresh checkout, `npm ci --ignore-scripts && npm test` installs only the development test dependencies. jsdom is MIT-licensed and is never loaded by the browser game. Its transitive dependencies retain their respective package licenses. The production game has no third-party JavaScript runtime dependency.

No screenshot/browser-render certification, audible sound check, or real-device test was performed. Original-to-release data/logic comparison is not distributed with private source material; the public golden hashes preserve the verified mechanical baseline without including that private original.

`node tests/assets.cjs` additionally checks local art references for existence and rejects external URLs in HTML/CSS/application code. This is an asset-integrity check, not an artistic or visual-layout evaluation.

## Final release results

After final art assembly, `npm test` passed both suites: **454 deterministic DOM/logic cases** and **79 unique local art references**. All 79 PNG files also passed Pillow image decoding/integrity verification. Final release text scan found no original franchise names, private workspace paths, embedded source-art data URLs, or obvious credential patterns. The generic Nature & Flora domain remains intentionally.

Package-lock metadata was derived from an existing installed jsdom 26.1.0 lockfile dependency closure and validated with `npm install --package-lock-only --ignore-scripts --offline` (39 development packages). No dependency modules are bundled. A network vulnerability scan was not performed.
