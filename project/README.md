# Little Brick Adventure

A small, AI-assisted, turn-based 3D fantasy toy-world game. Choose a Fairy Mage, a Sword Knight, or both; explore a reproducible Crystal Garden or a random dungeon; fight frogs and moles, collect treasure and try ten goal categories.

## Play locally

Download this branch, extract it, and open `project/index.html` in a modern WebGL-capable browser. The checked-in `dist/game.js` contains all runtime dependencies. No accounts, API keys, server, CDN, network connection or package installation are needed for the packaged game. Browser local-file restrictions vary; if necessary serve the project folder with any local static server. Sound starts after a user interaction.

The runtime has no analytics or remote game-state service. State is memory-only: reloading loses progress. Network access is needed only to initially download the package, or install optional development tools.

## Controls and modes

Click/tap a highlighted tile to move or choose a target. Choose an ability from the hotbar. Tab switches the active hero; Space ends the turn. Drag to orbit and scroll/pinch to zoom where supported; camera buttons provide top, side, hero and isometric views. The Rules dialog explains actions and goals.

The top panel selects party or solo play, difficulty and goals. New Random Dungeon replaces the map. Starter Map returns to Crystal Garden. Replay resets the current map. Solo characters receive additional action points and health.

## Development

`src/game.js` is the editable application source. `index.html` contains the interface and styles. Pinned Three.js 0.181.0 and OrbitControls sources and their license are in `vendor/three`.

Run `npm ci` then `npm run build` to regenerate the browser bundle. `npm test` runs deterministic headless game-logic tests without installing dependencies. Node.js 20+ is recommended. Tests deliberately stub rendering, DOM and audio; they are not WebGL/browser certification.

## Release boundaries

This is a sanitized public edition with fictional characters, newly drawn geometric fantasy outfits and a seeded starter layout. It contains no reference photographs or personal character profiles. The private source edition is not part of this branch or its history.

The implementation uses procedural geometry, canvas textures and synthesized Web Audio. It is an independent toy-world project, with no official toy-company endorsement or supplied commercial toy assets. The publication review is not a legal or security certification.

The game was source-reviewed and its logic regression-tested. Interactive WebGL rendering, mobile touch behavior and real disconnected-browser startup were **not verified in the release environment** because browser execution was unavailable. All runtime resources are local by static inspection. Please report reproducible browser issues. Random maps are experimental; generated encounters and balance are not guaranteed.

## License

Original application code, documentation and original procedural art: MIT, in this directory's `LICENSE`. Bundled Three.js/OrbitControls retain their upstream MIT license; see `THIRD_PARTY_NOTICES.md`. The branch's repository-root license is inherited hub scaffolding and does not replace these project-specific notices.
