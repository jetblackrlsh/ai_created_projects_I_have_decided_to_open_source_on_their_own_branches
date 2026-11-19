# Aetherbound: Chronicles of the Fourfold Temple

An action-adventure fantasy RPG with full Xbox controller support, 9 playable species, 24 playable classes, character & stat customization, a dungeon level builder, JSON import/export, Web Audio-routed NPC dialogue TTS, and synchronized WYSIWYG MP4 playthrough recording.

## Features

- **9 Playable Species & 24 Playable Classes**: Every species and class has its own visual silhouette/equipment, unique melee attack, and unique spell.
- **Hero Customization**: Customize name, appearance colors, hair/crest & eye styles, scale, cape/aura toggles, and allocate a 20-point attribute pool (`STR`, `INT`, `VIT`, `AGI`, `WIS`, `LCK`). Export and import characters as `.json`.
- **Xbox Controller + Keyboard/Mouse Support**:
  - **Move**: Left Stick / `WASD`
  - **Aim**: Right Stick / Mouse
  - **Class Melee**: `X` / Left Click · **Racial Melee**: `Y` / Right Click
  - **Class Spell**: `B` / `Q` · **Racial Spell**: `RB` / `E`
  - **Pact / Bonus Spell**: `RT` / `R` (Cycle with `LB` / `Tab`)
  - **Interact / Dash**: `A` / `F` / `Space` · **Potion (Max 3)**: `LT` / `H`
  - **Record MP4**: `View` / `F9`
- **Dungeon Level Builder**: Paint tiles, place NPCs with custom mission assignments and rewards, place enemies, traps, treasure chests, and spawn points. Export/import levels as `.json` and playtest immediately.
- **In-Game MP4 Playthrough Recording (< 10 MB)**: Records a WYSIWYG composite of the game, HUD, action bar, banners, NPC dialogue boxes, and Game Over screen alongside synchronized SFX, music, and NPC TTS voices, automatically compressed to stay strictly under **10 MB** for easy sharing.
- **Start Screen & Pre-Game Hero Prep**: Every adventure begins paused on a Start Screen with a story briefing, live Hero preview, and one-click access to customize or import your Hero JSON before stepping into combat.
- **Custom Multi-Level Campaigns**: Import multiple level JSONs (or combine built-in levels) and reorder them (`▲`/`▼`) on the Start Screen. Carry the exact same Hero—including earned spells, potions, gold, remaining HP, and remaining MP—from chapter to chapter.
- **Endless Procedurally Generated Dungeons**: Completing any level lets you jump directly into escalating procedurally generated dungeons (`Floor 1`, `Floor 2`, ...) with rotating biomes, traps, treasure chests, and scaling Floor Guardian bosses so you can immediately unleash your newly unlocked reward spells.
- **Built-In Campaigns**:
  - ***The Temple of the Four Elements***: 3 story branches — banish all 4 Elemental Demons for **Exorcism**, ally with one elemental to convert the temple, or pretend to ally with all 4 to battle all 5 bosses and unlock **Fourfold Convergence**.
  - ***Concert Hall Invasion: Ballad of the Star Queen***: 3 story paths — join Commander Xylar to capture **Lyricus, Master Bard** (who summons lute minions) for **Xylosian Laser Volley**, defend Lyricus as his bodyguard against alien jetpack laser troopers for **Chord of the Virtuoso**, or take the Bard's place on **Planet Xylos** and duel **Zor-Krak's** earthquake drums for **Xylosian War Drums**.
- **True Game Over**: Dying resets the level from the beginning.

## Running Locally

Requires Node.js (v18+). Zero npm dependencies required:

```bash
npm start
# or
node server.mjs
```

Then open **http://localhost:4173** in your browser.

*(On macOS, `server.mjs` uses the built-in `say` synthesizer at `/api/tts` to route NPC voices through Web Audio so they are captured in MP4 recordings. On other platforms or static hosts, TTS automatically falls back to the browser's `speechSynthesis` API.)*

## License

Released under **Creative Commons Zero v1.0 Universal (CC0 1.0)** when published on the open-source projects repository.
