# v1.0 verification

- 12 Python unit tests executed: declared math, partial/natural precedence, raw value validation, forged result rejection, duplicate/stale checks, atomic revision conflict, pause/resume and exact quotes.
- Independent forward test executed an original rescue, saved/restored a pending check, supplied d20 5 +5 against DC18, correctly failed, preserved quotes, rejected replay and advanced only a declared fictional clock cost. Export sections improved after its finding.
- Offline UI core assertions run separately with Node. See tests/test-ui.js. All 20 UI roll values also passed actual JavaScript-to-Python contract checks with duplicate rejection.
- A Chromium browser test was attempted but blocked by environment socket restrictions. No claim of browser rendering or live ChatGPT host callback certification.
- The originating user reports the interactive dice/choices working in ChatGPT Instant. That is user testing of the approach, not proof this package works identically on every surface.
- No real personal campaign was used or published. Drive integration is documented agent workflow, not a bundled authenticated client.
- CI is not configured; local tests are not CI. Source release is v1, with known interface and client-receipt trust limits documented.

## 2026-11-11 character-first / stat-aware update
- 21 Python unit tests pass (12 legacy tests + 9 setup/stat tests).
- JS dice core tests pass; Python/JS contract test passes for all 20 die faces.
- Covered confirmed setup gate, imported custom attribute values, direct and d20 bonus formulas, unknown stats, rejection of duplicate manual modifiers, narrative mode, and pending-check snapshots.
- Synthetic regression: Example Hero Intellect 3 + Translator 2 + raw 10 = 15. Agility 1 under same circumstances produces 13, confirming attributes actually affect results.
- Added offline character builder with default allocation validation and proposal export. Real browser run attempted twice; Chromium startup blocked by environment socket/process restrictions, so new form interaction is not claimed browser-verified. Host interactive form availability remains interface-dependent; plain-text setup is required fallback.
