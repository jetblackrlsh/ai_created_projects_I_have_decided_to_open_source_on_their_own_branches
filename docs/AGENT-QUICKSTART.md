# Agent quickstart

You need an authorized Node 18+ execution workspace. Merely reading a repository or shared folder cannot run a game. No browser, npm install, network, API key or personal-computer access is required for headless play.

```sh
node lib/headless.mjs new game.json '{"matchSeed":"MY-MATCH","playerDeck":"MY-DECK","cpuDeck":"RIVAL-DECK"}'
node lib/headless.mjs state game.json
```

Each command returns JSON. Inspect energy, `observation.player.hand `, revealed locations, board powers and `observation.legalActions`. Select an exact advertised action:

- `{"type":"play","cardUid":"ACTUAL_UID_FROM_LEGAL_ACTIONS","lane":0}` stages one card and pays energy. Lanes are integer 0, 1, 2.
- `{"type":"unplay","cardUid":"ACTUAL_STAGED_UID"}` returns/refunds one card.
- `{"type":"undo"}` returns/refunds all staged cards, when available.
- `{"type":"end_turn"}` commits the turn, including the original CPU's plays. An empty staging queue passes.

```sh
node lib/headless.mjs act game.json '{"type":"end_turn"}'
```

Continue until phase `GAME_OVER`, even if no card is playable. The result contains VICTORY/DEFEAT/TIE, lane wins, total powers and arcade score. Illegal actions return`ok:false`, exit 2, and do not change the save; CLI/read/JSON failures exit 1. Successful commands exit 0. `new` refuses to overwrite an existing save; successful`act` atomically updates your own local save. Use one writer per save.

Saves contain initial options and accepted actions plus version/hash/integrity data. Resume with the same code and `state`/`act`. Copy the save before branching. They are deterministic replay saves, not authenticated anti-cheat tokens.

Deck strings support the original raw seed, `RIFTDECK1:` share-code, JSON-string deck input or comma-separated list of 12 card seeds. Identical options/actions give identical gameplay and synthetic log timestamps. Those timestamps are not historical wall-clock times.

```js
import {HeadlessGame} from './lib/headless.mjs';
const g=new HeadlessGame({matchSeed:'MY-MATCH',playerDeck:'MY-DECK',cpuDeck:'RIVAL-DECK'});
const o=g.observe();
const result=await g.act(o.legalActions[0]);
const save=g.save();
const resumed=await HeadlessGame.load(save);
```

For fair play, use observations rather than internal engine state, debug logs or inferred hidden draw orders. The observer omits the CPU hand, both draw orders and future location names/effects, but deterministic public seeds permit inference; this is an honor-system interface, not a secure host.

Export a complete log with `node lib/headless.mjs log game.json`, or open the completed save directly in the replay viewer. For agent-v-agent competition, use the separate async multiplayer guide.
