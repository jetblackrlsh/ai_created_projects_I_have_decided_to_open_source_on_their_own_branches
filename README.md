# The Elf Game — Solo GM Emulator

A single-player browser game & Game Master emulator for **The Elf Game** (by S&A Baudelaire). Play solo in an interactive chat log with automatic dice math, explained check results, Yes/No & How Many Oracles, random fantasy inspiration tables, a full Character Creator & Randomizer, and JSON/TXT export.

---

## Screenshots

### 1. General Solo Gameplay (Inspiration → Oracle → Check → Note)

| Light Mode | Dark Mode |
| :---: | :---: |
| ![General Solo Gameplay in Light Mode](screenshots/main-light.png) | ![General Solo Gameplay in Dark Mode](screenshots/main-dark.png) |

---

### 2. Back-and-Forth Combat (Player Attack vs Enemy Attack)

| Light Mode | Dark Mode |
| :---: | :---: |
| ![Back-and-Forth Combat in Light Mode](screenshots/combat-light.png) | ![Back-and-Forth Combat in Dark Mode](screenshots/combat-dark.png) |

---

### 3. Character Creator & Step-by-Step Randomizer (Full View)

#### Light Mode
| Top (Randomizer Summary & Character Details) | Bottom (Armor, Abilities & Save) |
| :---: | :---: |
| ![Character Creator Light Top](screenshots/character-creator-light-top.png) | ![Character Creator Light Bottom](screenshots/character-creator-light-bottom.png) |

#### Dark Mode
| Top (Randomizer Summary & Character Details) | Bottom (Armor, Abilities & Save) |
| :---: | :---: |
| ![Character Creator Dark Top](screenshots/character-creator-dark-top.png) | ![Character Creator Dark Bottom](screenshots/character-creator-dark-bottom.png) |

---

### 4. Rules & Solo Guide (Full View)

#### Light Mode
| Top (Core Solo Loop & Roll-Under Rules) | Bottom (Classes, Stances & Slash Commands) |
| :---: | :---: |
| ![Rules Guide Light Top](screenshots/rules-guide-light-top.png) | ![Rules Guide Light Bottom](screenshots/rules-guide-light-bottom.png) |

#### Dark Mode
| Top (Core Solo Loop & Roll-Under Rules) | Bottom (Classes, Stances & Slash Commands) |
| :---: | :---: |
| ![Rules Guide Dark Top](screenshots/rules-guide-dark-top.png) | ![Rules Guide Dark Bottom](screenshots/rules-guide-dark-bottom.png) |

---

### 5. Save, Export & Import — Light Mode vs Dark Mode

| Light Mode | Dark Mode |
| :---: | :---: |
| ![Save, Export and Import Light Mode](screenshots/save-export-light.png) | ![Save, Export and Import Dark Mode](screenshots/save-export-dark.png) |

---

## Features

- **Solo Chat & GM Emulator**: Log story notes, roll **Ability Checks** (`STR`, `DEX`, `CON`, `INT`, `WIS`, `CHA`), **Saving Throws**, **Melee / Ranged Attacks**, **Yes/No Oracles**, **How Many Oracles**, and **Random Inspiration** (`Creatures`, `Treasures`, `Magic Items`, `Spell Effects`, `Settings`, `NPCs & Classes`, `Plot Twists`).
- **Explained Check Results**: Every roll shows the exact D20, class/difficulty modifiers, target number, and a plain-English explanation of why you succeeded or failed (including Natural 1 & Natural 20 rules).
- **On-the-Fly Difficulty**: Switch between `Easy (-3)`, `Standard (0)`, `Hard (+3)`, `Heroic (+6)`, or enter any custom roll modifier.
- **Character Creator & Randomizer**: Roll `3d6 × 6`, roll Hit Points with the exact Elf Game formula, edit any stat or level (`0–3`) at will, or click **🎲 Random** to build a complete legal character step-by-step while keeping the name yours to choose.
- **Export & Import**: Save/load Characters (`.json`), full Adventures (`.json`), or readable Adventure Logs (`.txt`), with automatic `localStorage` persistence.
- **AI Agent Support**: Includes [`AGENTS.md`](AGENTS.md) so AI assistants can generate valid, legal Character JSON files on request.

## Running Locally

Open `index.html` directly in any modern browser, or serve the folder with any static HTTP server.
