---
name: create-custom-level
description: >-
  Design, compile, validate, and preview custom Aetherbound RPG dungeon levels
  (.json) from a player's natural-language concept using the ASCII-map
  blueprint compiler, BFS reachability checker, and terminal map previewer.
---

# Create a Custom Aetherbound Level

Use this skill whenever the user describes a dungeon, arena, quest, boss
encounter, or custom level concept for **Aetherbound: Chronicles of the Fourfold
Temple**.

## Workflow

### 1. Inspect the Live Level Catalog
Run the built-in zero-dependency CLI to view all tile IDs & ASCII map symbols,
enemy presets, trap kinds, chest tiers, NPC quest options, bonus spells, and
ambient themes directly from `src/data/`:

```bash
node tools/level-cli.mjs catalog
```

### 2. Design a Readable ASCII-Map Blueprint
Instead of hand-editing a 2D array of raw tile integers and pixel coordinates,
author a **blueprint JSON** using ASCII characters for `map` and **tile grid
coordinates (`tileX`, `tileY`)** for entities.

#### ASCII Tile Legend
| Char | Tile ID | Name | Solid? |
| :--- | :---: | :--- | :---: |
| `#` | `0` | Dungeon Wall | Yes |
| `.` | `1` | Stone Floor | No |
| `,` | `2` | Temple Marble | No |
| `O` | `3` | Pillar | Yes |
| `F` | `4` | Crucible (Fire) | No |
| `W` | `5` | Tidepool (Water) | No |
| `E` | `6` | Monolith (Earth) | No |
| `A` | `7` | Skyfloor (Air) | No |
| `=` | `8` | Sanctum Carpet | No |
| `*` | `9` | Sanctum Altar | No |
| `T` | `10` | Torch Wall | Yes |

#### Blueprint JSON Shape
```json
{
  "name": "Vault of the Sunken Flame",
  "description": "A flooded forge guarded by fire imps and a frost wraith boss.",
  "isTempleCampaign": false,
  "templeTheme": "fire",
  "map": [
    "######T######",
    "#...........#",
    "#.==..O..FF.#",
    "#...........#",
    "######T######"
  ],
  "spawn": { "tileX": 2, "tileY": 2 },
  "npcs": [
    {
      "id": "npc_warden",
      "name": "Forgekeeper Orin",
      "role": "priest",
      "tileX": 4,
      "tileY": 2,
      "dialogue": "Clear the vault and return to claim the Inferno Pact!",
      "quest": {
        "title": "Reclaim the Sunken Forge",
        "objectiveType": "defeat_enemies",
        "targetCount": 4,
        "rewardGold": 200,
        "rewardSpell": "inferno_pact",
        "rewardTitle": "Forge Reclaimer"
      }
    }
  ],
  "enemies": [
    { "kind": "flame_imp", "name": "Cinder Imp", "tileX": 9, "tileY": 1 },
    { "kind": "frost_wraith", "name": "Steambound Warden", "tileX": 10, "tileY": 2, "isBoss": true, "hp": 260, "damage": 18 }
  ],
  "traps": [
    { "kind": "fire_jet", "tileX": 6, "tileY": 1, "interval": 2.4, "damage": 14 }
  ],
  "chests": [
    { "tier": "gold", "tileX": 10, "tileY": 3, "lootType": "spell", "lootValue": "arcane_bolt", "gold": 120, "potions": 2 }
  ]
}
```

#### Level Design & Balance Guidelines
- **Enclose the outer border** with `#` (or `T` for lit walls) so the player
  cannot walk off the map.
- **Give corridors at least 2–3 tiles of width** so combat, dodging, and
  projectiles feel responsive.
- **Spawn safety**: Place `spawn` in a safe starting room (no enemies within ~6
  tiles of spawn) with any quest-giver NPC nearby.
- **Pacing & variety**:
  - Combine melee enemies (`skeleton`, `goblin`, `stone_sentinel`, `storm_harpy`)
    with ranged enemies (`cultist`, `flame_imp`, `frost_wraith`).
  - Set `"isBoss": true` on 1–2 centerpiece enemies (`hp: 240–400`, `damage: 18–24`).
    Bosses have a larger radius, wider aggro range, fire 4-shot spread volleys,
    and drop 120 Gold.
  - Place `iron` or `wood` chests with potions along side rooms before boss rooms,
    and `gold` chests with a bonus spell in secret or guarded alcoves.
  - Use `templeTheme` (`corrupted`, `light`, `fire`, `water`, `earth`, `air`, `master`)
    to add matching rising ambient particles.
- **Quest feasibility**: For custom levels (`isTempleCampaign: false`), NPC
  quests support `objectiveType`: `"defeat_enemies"` or `"open_chests"`. Ensure
  `targetCount` is <= the actual number of enemies or chests in the level.

### 3. Compile, Validate & Inspect the ASCII Preview
Run the compiler to turn the blueprint into an Aetherbound level `.json`:

```bash
node tools/level-cli.mjs compile --blueprint <temp-blueprint.json> --out custom/levels/<slug>-level.json
```

`compile` automatically:
1. Converts the ASCII map and `tileX`/`tileY` coordinates into world pixels (`TILE_SIZE = 48`).
2. Runs full validation — including **BFS reachability from spawn** to ensure
   no NPC, enemy, chest, or trap is stuck inside a wall or locked in an
   unreachable room, and that every NPC quest is completable.
3. Prints an **ASCII preview map** (`@` Spawn, `N` NPC, `B` Boss, `e` Enemy,
   `C` Chest, `^` Trap).

Always inspect the printed preview map! Fix any layout, spacing, or validation
issues, re-compile until there are **0 errors**, and remove any temporary
blueprint file if you don't intend to keep it.

You can also validate or preview any existing level JSON at any time:
```bash
node tools/level-cli.mjs validate custom/levels/<slug>-level.json
node tools/level-cli.mjs preview custom/levels/<slug>-level.json
```

### 4. Present the Result to the Player
Tell the player:
1. The path to the generated `.json` file.
2. A brief overview of the dungeon layout, theme, enemies/bosses, traps, chests,
   and NPC quests.
3. How to play it in-game:
   - Start the game (`npm start`, then open `http://localhost:4173`).
   - Open **Level Builder** → click **Import JSON** → select the `.json` file
     → click **Playtest**.
