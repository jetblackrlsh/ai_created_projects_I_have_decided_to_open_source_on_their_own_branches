# Ironbound Wilds

A procedurally generated 3D action-adventure RPG built with Three.js and Vite, featuring first-class **Xbox Controller** support (HTML5 Gamepad API + dual-rumble), keyboard & mouse fallback, customizable breakable gear, biome-specific mining & monsters, a day/night cycle with dynamic weather, and synchronized audio-video replay + daily event log exports.

## Features
- **Xbox Controller & KB/M Controls**: Move (`Left Stick` / `WASD`), Orbit Camera (`Right Stick` / `Mouse`), Attack (`RT` / `Click`), Heavy Strike (`RB` / `K`), Guard (`LT` / `Right Click`), Dodge (`B` / `Space`), Interact (`X` / `E`), Swap Blade ↔ Wand (`Y` / `R`), Pause (`Menu` / `Esc`). Full D-Pad/A/B/LB/RB menu navigation in the Campsite Forge.
- **6 Procedural Biomes**: *Emerald Meadows*, *Ironwood Forest*, *Sunscorched Dunes*, *Frostveil Tundra*, *Ashen Highlands*, and *Crystal Crags* — each with unique terrain, props, monsters, mineable materials, and Campsite/Mine spawn odds.
- **Customizable & Breakable Gear**: Forge custom **Bladed Weapons**, **Armor**, and **Magic Wands** with unique effect descriptions. Gear weakens (*Worn*, *Cracked*) and shatters at `0%` durability.
- **Day/Night Cycle & Weather**: Continuous Dawn/Day/Dusk/Night cycle with Rain, Snow, Ashfall, and Arcane Mist, plus cinematic Day Transition cards.
- **3 Lose Conditions**: Exhaustion (`0` Stamina from lack of rest), Slain in Battle (`0` HP), or Total Gear Loss (all gear broken/discarded).
- **Replay & Log Export**: Download a `.webm` replay video (full UI + 3D scene + Web Audio SFX) and a `.txt` adventure log organized by Day.

## Run Locally
```bash
npm install
npm run dev
```

## License
Licensed under **Creative Commons Zero v1.0 Universal (CC0 1.0)**.
