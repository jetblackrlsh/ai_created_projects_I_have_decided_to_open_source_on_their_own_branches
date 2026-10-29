# AetherSnap

This project lives on the dedicated `aether-snap` branch. Clone it with:

```sh
git clone --branch aether-snap --single-branch https://github.com/jetblackrlsh/ai_created_projects_I_have_decided_to_open_source_on_their_own_branches.git AetherSnap
cd AetherSnap
```

An original, procedural SVG card battler: **play offline, let agents play headlessly, challenge another agent asynchronously, watch replays, and export board/card PNGs or genuine MP4 video.**

AetherSnap takes inspiration from the short-match, three-location format of Marvel Snap, with its own procedurally generated cards, location rules, SVG artwork and synthesized audio. It contains no Marvel character artwork, commercial card assets or recorded music, and is not affiliated with Marvel or Second Dinner.

## Start here

| You want to… | Entry point |
| --- | --- |
| Play in a browser | Download/clone the repository and open [`index.html`](index.html). It is the complete original standalone game. No server or install. |
| Have an AI agent play | [`docs/AGENT-QUICKSTART.md`](docs/AGENT-QUICKSTART.md), then `node lib/headless.mjs new game.json`. |
| Compete with another agent | [`docs/ASYNC-MULTIPLAYER.md`](docs/ASYNC-MULTIPLAYER.md): six-turn plans, explicit fallbacks and an actual shared-board referee. |
| Watch a match | Open [`replays/Aether-Snap-Replay-Viewer.html`](replays/Aether-Snap-Replay-Viewer.html), then import a complete export or try a built-in synthetic demo. |
| Export an image or video | [`docs/REPLAYS-AND-EXPORTS.md`](docs/REPLAYS-AND-EXPORTS.md): browser PNG buttons, exact-state CLI PNGs and H.264 MP4. |

**Download HTML files before opening them.** A repository file-preview page is not the application. For example, use GitHub's **Code → Download ZIP**, extract it, then open the local HTML.

## Requirements

- **Browser game / replay viewer:** a modern browser. The ready standalone HTML files work offline; there are no external scripts, fonts, accounts or network calls.
- **Headless game / async referee / replay reconstruction:** Node.js **18+**, no npm dependencies.
- **Node PNG exports:** Node.js 18+ and `npm ci` (installs pinned `@napi-rs/canvas`).
- **MP4 exports:** the PNG requirements plus `ffmpeg` with **libx264** and `ffprobe` on PATH. No FFmpeg binaries are bundled.

An agent needs **code execution**, not just file-storage access. Shared storage can carry challenge/response files, but does not itself run the referee. This release neither launches agents nor contacts opponents automatically.

## Fast headless example

```sh
node lib/headless.mjs new game.json
node lib/headless.mjs state game.json
```

Read `observation.legalActions`; copy one **exact** action object into:

```sh
node lib/headless.mjs act game.json '{"type":"end_turn"}'
```

Use actual advertised `play` actions to stage cards before `end_turn`. Repeat through all six turns until `observation.phase ` is `GAME_OVER`. Saves resume across processes. A full public-observation baseline is available with:

```sh
node lib/headless.mjs demo PUBLIC-DEMO
```

The original built-in CPU is the opponent in single-player. Multiplayer replaces **only** CPU planning with the other agent's explicitly submitted queue; it does not compare two unrelated solo scores.

## Original rules, preserved

Each side has a 12-card deck and at most 7 cards in hand. Three locations reveal over turns 1–3. Base energy follows the turn number plus original bonuses. Stage affordable cards into lanes 0–2, up to 4 per side per lane, then resolve initiative, reveals, ongoing/triggered effects, discards, destruction, summons and end-turn location effects. After turn 6, location wins decide the match; tied location counts use total power, then an exact tie remains a tie.

The extracted engine's rules, card/deck/location generation, CPU and scoring are unchanged. Original engine quirks remain visible; the adapters do not silently rebalance gameplay. See `PROVENANCE.json` for source/version hashes, without private storage identifiers.

## Replay and media quick examples

```sh
# Optional native media dependency; not needed for normal browser or headless play.
npm ci

node replays/export-replay.cjs info fixtures/multiplayer-result.json
node replays/export-replay.cjs frame fixtures/multiplayer-result.json board.png --turn 6 --point end
node replays/export-replay.cjs mp4 fixtures/multiplayer-result.json match.mp4
```

MP4 output is H.264/yuv420p,30 fps, with all validated event snapshots and event-paced holds. It is silent and does not recreate exact human thinking time. The HTML viewer's MP4 button explains this reliable CLI route; **there is no browser MP4 recorder**, and WebM is never mislabeled MP4. Browser PNG controls use the same composition as native export. Read the export guide before selecting a card: current power is state-dependent, so use an exact frame index for chronological close-ups.

## Development and verification

```sh
npm ci
npm run lint
npm test
npm run test:privacy
npm run build
npm run test:media   # additionally requires ffmpeg/libx264 and ffprobe
```

`npm test` compares 20 complete games action-by-action against the untouched browser engine and checks saves, invalid actions, both-seat staging, explicit multiplayer fallbacks, deterministic referee results, replay formats, hidden-info chronology and corrupt/incomplete inputs. Media tests use freshly generated public synthetic fixtures, verify PNG dimensions/provenance and encode a small H.264 fixture. `npm run fixtures` deliberately regenerates the generic public demo data; it never reads personal records.

**QA limits:** reconstruction, controls logic and native raster/media exports are tested. Native board/card PNGs and decoded MP4 frames have been visually inspected during development. Actual browser rendering/file-download integration could not be completed in the cloud environment used for this release; DOM-mock checks are not presented as pixel QA. CI outcomes, when available, are separate evidence—not proof of cross-browser polish.

Bundled examples use synthetic `PUBLIC-…` seeds and generic agent labels. They are demonstrations, not live invitations.

## Project layout

```text
index.html                 Complete original offline browser game
lib/engine-core.js         Exact extracted original rules + SVG generators
lib/headless.mjs           JSON CLI/API, legal actions and deterministic saves
multiplayer.mjs            Async plans, offers/responses and shared-board referee
replays/                   Standalone viewer, renderer and PNG/MP4 CLI sources
fixtures/                  Fresh synthetic public-only match exports
scripts/                   Build, parity, media and privacy checks
```

## License and acknowledgments

Original code is dedicated to the public domain under CC0 1.0; see [`LICENSE`](LICENSE). Dependencies/tools keep their own licenses; see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). Native dependency binaries, system fonts and FFmpeg are not vendored.
