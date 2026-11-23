# LUCID DUEL: SPELLGAUNTLET

A single-player, procedural, roguelike holographic card game adapted from the **11/23/2026 Storyverse Dream Journal** duel.

## Features & Dream Rules
- **8,000 LP Cybernetic Gauntlet Duels**: Play **1 spell card per turn** in **Attack Position** (cast against the opponent or into an active Arena Domain) or **Defense Position** (shield, catch, or trigger reactive traps).
- **Porta Catch & Redirect ("What goes around comes around")**: Play `Porta` in Defense Position to catch an incoming attack mid-air, then switch it to Attack Position on your next turn to blast the enemy's own spell back at them.
- **Spell Collisions & Environmental Fusions (8 Fusions)**:
  - `Porta + Porta` → **Pocket Dimension** (seals `Porta` for both duelists and triggers a contested **d20 Domain Control clash** for +40% ATK).
  - `Pyro + Pocket Dimension` → **Hell Dimension** (traps the domain controller inside taking 900 LP burn/turn with no escape).
  - `Hydro/Aqua + Hell Dimension` → **Steam Flood** (extinguishes the flames and applies **Soaking Wet** to both duelists).
  - `Kurenos/Fulmen + Soaking Wet` → **Divine Conduction** (stacks with Lightning Vulnerability and Unshielded bonuses for massive finishers).
  - Plus **Inferno Vortex**, **Glacial Prison**, **Cosmic Eclipse**, and **Singularity Rift**.
- **d20 Rolls & Axe of 10,000 Souls**: Roll animated **d20s** (`> 10` resists secondary effects), or **Self-Strike** with `Axe of 10,000 Souls` (`-1,000 LP`) to intentionally trigger **Spirit Possession** (such as the **Water Nymph**), gaining Divine Affinity (+40% matching damage + **Shield Overflow** through `Aegis`) and conjuring its signature spell (`Hydro`).
- **Sacrifice Defense**: Shatter your active shield to gain **+50% Counter-Surge & Shield-Pierce** on your next Attack.
- **Procedural 3-Act Roguelike Runs**: Branching Storyverse maps with Duels, Elites, Void Events, Fusion Forges, Storyverse Relics, stealing defeated enemy cards, and Act Bosses (**The Cloaked Villain**, **Abyssal Nymph**, **The Crystal Stranger**).
- **Void Gacha, Deckbuilder & Meta-Progression**: 24 spell cards with custom SVG art, 2 featured Holographic Pack banners with pity counters & Arcane Dust crafting, Card Mastery (Lv.1–5), 6 permanent **Gauntlet Lab** upgrades, date-seeded **Daily Missions**, and a **7-Day Daily Login Reward** calendar.

## Quick Start (Zero Build Dependencies)
Run any static HTTP server from the project root:

```bash
python -m http.server 4173
```

Then open [http://localhost:4173](http://localhost:4173) in your browser.

## License
Released under **Creative Commons Zero v1.0 Universal (CC0 1.0)** — see [LICENSE](./LICENSE).
