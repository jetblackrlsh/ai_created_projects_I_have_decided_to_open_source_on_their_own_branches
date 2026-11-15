# Roll for Shoes — Solo Sandbox RPG

A 100% offline, single-player browser adaptation of **Roll for Shoes** (the CC0 1.0 tabletop RPG micro-system by Ben Wray), built for bare-bones **Custom Sandbox** play with a built-in **Solo Oracle**.

## How to Play

1. Download or clone this branch.
2. Open `index.html` directly in any modern web browser (no build step, no server, no internet connection, and no API key required).

## Features

- **Pure Custom Sandbox:** Start with a blank chronicle, write your own **Starter Hook** and **Scene Notes** using **Add Note**, or jump straight into action.
- **Free-Text Actions & Auto Skill Matching:** Type whatever you want to do. The engine automatically matches your most relevant skill (or falls back to `Do Anything 1`), and you can click any skill in the sidebar to override it.
- **Difficulty & Static Targets:** Choose `Auto (Tension)` or set task difficulty using the official **Roll for Shoes** table (`Easy 1d6 / 3`, `Moderate 2d6 / 6`, `Hard 3d6 / 9`, `Very Hard 4d6 / 12`), with a **Static** toggle to use static target numbers instead of rolling opposing dice.
- **Tactile SVG Dice & Rule 6 XP Advancement:** Rolling all 6s unlocks a new `Level + 1` skill specific to your action. Failed rolls grant `+1 XP`, which you can spend to flip non-6 dice to 6s for advancement purposes only.
- **Solo Oracle:** Ask Yes/No questions weighted by `Unlikely`, `50/50`, or `Likely` odds, or generate grounded **✦ Sparks**, **⚡ Twists**, and **👤 NPCs**.
- **Custom Statuses:** Add and remove flavor status tags on your character sheet.
- **Portable Exports & Imports:**
  - **Export Story Log (`.md`)** or **Copy Story Log** for a clean, readable session chronicle.
  - **Export / Import JSON** for standalone characters (`rfs-character`) or full sandbox saves (`rfs-adventure`), plus automatic `localStorage` persistence.

## License

- **Roll for Shoes** micro-system created by Ben Wray, marked with [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).
- This project’s code and assets are dedicated to the public domain under **CC0 1.0 Universal** (see `LICENSE`).
