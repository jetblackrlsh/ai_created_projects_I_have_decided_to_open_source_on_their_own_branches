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
- **Built-In Campaign — *The Temple of the Four Elements***:
  1. **Branch 1 (Disciple of the Light)**: Defeat all 4 Elemental Demons and return to High Priest Aldric to become a Disciple of the Light and unlock **Exorcism**.
  2. **Branch 2 (Disciple of an Element — 4 Variants)**: Ally with one Elemental Demon to gain their Elemental Pact Spell, defeat the other 3 Elementals and High Priest Aldric, and convert the temple into that elemental's domain.
  3. **Branch 3 (Master of the Four Elements)**: Pretend to ally with all 4 Elemental Demons to gain all 4 Elemental Pact Spells, survive the combined battle against all 4 Elementals and High Priest Aldric, and claim the Central Sanctum Altar to unlock **Fourfold Convergence** and convert the temple into your own.
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
