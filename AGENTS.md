# Aetherbound RPG — Agent Guide

**Aetherbound: Chronicles of the Fourfold Temple** is a zero-dependency Node.js
+ HTML5 Canvas action-adventure RPG (`npm start` → `http://localhost:4173`).

## Built-In Agent Skills & Tools

This repository includes dedicated skills and CLI tools for creating custom
playable content from natural-language player requests:

| Task | Skill | CLI Tool |
| :--- | :--- | :--- |
| **Custom Characters** | `.agents/skills/create-custom-character/SKILL.md` | `node tools/character-cli.mjs` |
| **Custom Dungeon Levels** | `.agents/skills/create-custom-level/SKILL.md` | `node tools/level-cli.mjs` |

### Quick Commands
```bash
# Inspect all 9 species, 24 classes, styles, and stat rules
node tools/character-cli.mjs catalog

# Build & validate a custom character JSON
node tools/character-cli.mjs build --spec spec.json --out custom/characters/hero.json
node tools/character-cli.mjs validate custom/characters/hero.json

# Inspect all tiles, ASCII map legend, enemy presets, traps, chests, and themes
node tools/level-cli.mjs catalog

# Compile an ASCII-map blueprint JSON into a validated level JSON + terminal preview
node tools/level-cli.mjs compile --blueprint blueprint.json --out custom/levels/dungeon.json
node tools/level-cli.mjs validate custom/levels/dungeon.json
node tools/level-cli.mjs preview custom/levels/dungeon.json
```

## Conventions
- Keep the project **zero-dependency** (Node.js v18+ ESM only; no npm packages).
- Both CLI tools import directly from `src/data/` (`species.js`, `classes.js`,
  `spells.js`, `templeLevel.js`) as the single source of truth.
- Save player-requested custom exports under `custom/characters/` and
  `custom/levels/` unless the user specifies another location.
- Always run the corresponding `validate` (or `build`/`compile`) command and
  ensure zero errors before handing a `.json` file to the player.
