---
name: create-custom-character
description: >-
  Create a custom playable Aetherbound RPG character (.json) from a player's
  natural-language concept, validate it against the game's species, classes,
  appearance options, and 20-point attribute pool, and prepare it for direct
  import into the Character Creator.
---

# Create a Custom Aetherbound Character

Use this skill whenever the user describes a hero concept, fantasy archetype,
build idea, or asks you to create/edit a custom character for **Aetherbound:
Chronicles of the Fourfold Temple**.

## Workflow

### 1. Inspect the Live Catalog
Run the built-in zero-dependency CLI to see all 9 species, 24 classes, hair/eye
styles, bonus spells, and base stats directly from `src/data/`:

```bash
node tools/character-cli.mjs catalog
```

(Pass `--json` if you prefer structured JSON output.)

### 2. Translate the Concept into a Spec
Map the user's concept to the best-fitting options:
- **`speciesId` & `classId`**: Pick a species and class whose silhouette, melee
  attack, and spell match the fantasy.
- **`name`** (<= 28 chars) & **`title`** (<= 36 chars): Give the hero a fitting
  name and epithet.
- **`appearance`**:
  - `skinColor`, `hairColor`, `armorColor`, `accentColor`: `#RRGGBB` hex colors
    that form a cohesive palette.
  - `hairStyle`: `swept`, `long`, `spiky`, `braid`, `bob`, or `bald`.
  - `eyeStyle`: `bright`, `glow`, `fierce`, `visor`, or `mystic`.
  - `scale`: `0.85` to `1.20` (e.g., `0.9` for nimble/petite, `1.15` for imposing).
  - `showCape` / `showAura`: booleans matching the character's vibe.
- **`bonusStats`** (**20-point pool** across `str`, `int`, `vit`, `agi`, `wis`, `lck`):
  - `str` -> Melee Power (`meleeMult`)
  - `int` -> Spell Power (`spellMult`) + small Mana/Regen boost
  - `vit` -> Max HP (`110 + total.vit * 10`)
  - `agi` -> Move Speed + minor Cooldown Reduction
  - `wis` -> Max Mana, Mana Regen, and Cooldown Reduction
  - `lck` -> Critical Hit Chance (caps at 55%)
  - Always spend all **20 points** unless the user asks for a challenge run or
    an overpowered custom build (for over-budget builds, pass `--allow-overbudget`).
- **`bonusSpells`**: Keep `[]` for a standard starting hero, or include valid
  bonus spell IDs (`arcane_bolt`, `exorcism`, `inferno_pact`, `tidal_pact`,
  `terra_pact`, `tempest_pact`, `fourfold_convergence`) if the user explicitly
  wants a pre-unlocked pact/bonus spell.
- **`gold`** (default `25`) and **`potions`** (`0` to `3`, default `3`).

### 3. Build & Validate with the Character CLI
Write a spec JSON file (or create the character JSON directly) and run:

```bash
node tools/character-cli.mjs build --spec <temp-spec.json> --out custom/characters/<slug>-character.json
```

Or validate an existing file:

```bash
node tools/character-cli.mjs validate custom/characters/<slug>-character.json
```

The tool will verify every ID, hex color, scale, potion cap, and the 20-point
stat pool, then print the exact computed **HP, Mana, Speed, Melee/Spell
multipliers, Crit %, and CDR %**. Fix any errors or unintended warnings before
finishing (and remove any temporary spec file if you used one).

### 4. Present the Result to the Player
Tell the player:
1. The path to the generated `.json` file.
2. A concise character sheet summary (Species, Class, Abilities, Stat split,
   and Derived Stats).
3. How to load it in-game:
   - Start the game (`npm start`, then open `http://localhost:4173`).
   - Open **Customize Hero** → click **Import JSON** → select the `.json` file
     → click **Apply**.
