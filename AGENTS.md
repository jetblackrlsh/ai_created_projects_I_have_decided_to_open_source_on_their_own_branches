# AI Agent Instructions — Building Characters for *The Elf Game* (JSON)

This repository is a single-player browser GM emulator for **The Elf Game** (by S&A Baudelaire). When a user asks you to create, roll, or convert a character for them, generate a valid **Character JSON** file that they can import directly into the app via **Save / Export → Import Character JSON**.

---

## 1. Required Character JSON Schema

Every imported character JSON must be a single JSON object with the following fields:

```json
{
  "name": "Lyra Mossfoot",
  "level": 1,
  "charClass": "tradesman",
  "stance": "mundane",
  "size": "small",
  "wearingArmor": true,
  "defending": false,
  "abilities": {
    "STR": 9,
    "DEX": 15,
    "CON": 12,
    "INT": 13,
    "WIS": 11,
    "CHA": 10
  },
  "maxHp": 9,
  "currentHp": 9,
  "gear": "Leather armor, shortbow (12 arrows), lockpicks, lantern, 3 days of rations."
}
```

### Field Reference & Legal Values

| Field | Type | Legal Values / Rules |
| :--- | :--- | :--- |
| `name` | `string` | Character name (ask the user or invent a fitting fantasy name if requested). |
| `level` | `integer` | `0`, `1`, `2`, or `3` (`0` = fresh adventurer, `3` = max level). |
| `charClass` | `string` | `"none"` (Standard), `"fighter"`, or `"tradesman"`. |
| `stance` | `string` | `"mundane"` or `"magical"`. |
| `size` | `string` | `"small"` (¼ Sq, Speed 2), `"medium"` (1 Sq, Speed 4), or `"large"` (2 Sq, Speed 8). |
| `wearingArmor` | `boolean` | `true` (applies `-1` to Armor Class) or `false`. |
| `defending` | `boolean` | Usually `false` at character creation (`true` applies `-1` to AC for the turn). |
| `abilities` | `object` | Object containing `STR`, `DEX`, `CON`, `INT`, `WIS`, `CHA` as integers (legally `3`–`18` from `3d6`). |
| `maxHp` | `integer` | At least `1`. Rolled using the Elf Game HP formula (see Section 2). |
| `currentHp` | `integer` | Usually equal to `maxHp` for a new character (`0` to `maxHp`). |
| `gear` | `string` | Freeform text for equipment, weapons, spells, treasure, and character notes. |

> **Important:** Do **not** add derived stats (`ac`, `melee`, `ranged`, `savingThrow`, `speed`) to the JSON. The app's rules engine (`engine.js`) calculates them automatically from the fields above.

---

## 2. Official *The Elf Game* Character Creation Math

Follow these rules when building a legal character:

1. **Ability Scores (`3d6 × 6`)**:
   - Roll `3d6` six times (each score is `3`–`18`) and assign them to `STR`, `DEX`, `CON`, `INT`, `WIS`, `CHA`.
   - **Ability Adjustment Table** (`Math.floor((score - 10) / 2)`):
     - `3` → `-4`
     - `4–5` → `-3`
     - `6–7` → `-2`
     - `8–9` → `-1`
     - `10–11` → `0`
     - `12–13` → `+1`
     - `14–15` → `+2`
     - `16–17` → `+3`
     - `18` → `+4`

2. **Classes**:
   - `"none"`: No class modifiers.
   - `"fighter"`: Rolls an **additional `1D6`** for Hit Points at each Level beyond `0` (Levels 1, 2, 3), and may use Actions in combat to Attack.
   - `"tradesman"`: Subtracts their `level` from all non-Attack Ability Test rolls, and may use Attacks in combat to perform Actions.

3. **Stances**:
   - `"magical"`: May use Actions to cast Spells.
   - `"mundane"`: Gains a `+1` Adjustment to Hit Points, Speed, Saving Throw, Melee score, and Ranged score, and `-1` to Armor Class.

4. **Hit Points (`maxHp`)**:
   - Roll `1D6` at each Level **including Level 0** (`1 + level` dice).
   - If `charClass === "fighter"`, roll an **extra `1D6`** for each Level above `0` (`level` extra dice).
   - Add `CON Adjustment + level` (and `+1` if `stance === "mundane"`).
   - Clamp to at least `1` (`Math.max(1, total)`).

5. **Derived Stats (for your explanation to the user)**:
   - **Melee** = `level + STR Adj` (`+1` if Mundane)
   - **Ranged** = `level + DEX Adj` (`+1` if Mundane)
   - **Armor Class (AC)** = `10 - CON Adj - DEX Adj - level` (`-1` if `wearingArmor`, `-1` if Mundane, `-1` if `defending`). *Lower AC is harder to hit.*
   - **Saving Throw** = `CON Score + WIS Adj + level` (`+1` if Mundane)
   - **Speed** = `2` (Small), `4` (Medium), or `8` (Large) squares (`+1` if Mundane)

---

## 3. Agent Workflow When a User Requests a Character

1. **Respect user preferences**: If the user asks for a concept (e.g., *"a sneaky level 2 elf archer"*), choose fitting `level`, `charClass`, `stance`, `size`, `wearingArmor`, and assign higher rolled scores to the matching abilities (`DEX` for an archer, `STR` for a melee fighter, `INT`/`WIS` for a spellcaster). If they ask for a completely random character, randomize all crunchy fields legally.
2. **Validate every value**: Ensure `abilities.STR` is a number (required by the app's importer), `level` is `0–3`, and `maxHp` matches the Elf Game HP formula.
3. **Deliver the JSON cleanly**:
   - Either save it as a `.json` file (e.g., `<character-name>-character.json`) or provide the raw JSON block so the user can save and import it via **Save / Export → Import Character JSON**.
   - Briefly explain the rolled stats, HP math, and derived combat numbers (`AC`, `Saving Throw`, `Melee`, `Ranged`, `Speed`) so the user understands how their character works.
