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
