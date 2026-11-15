# Mechanized Magic — Offline Card Maker

An offline browser studio for creating custom **Minion** cards, **Card Backs**, and **Booster Packs** using Dumivid's public-domain **Mechanized Magic: 2D Vector Cards Pack (Free Pack)** without Photoshop.

## Features
- **Minion Card Mode**:
  - Editable Card Name (curved along the top ribbon), Mana Cost, Card Type, Attack & Health hexes (with toggle to hide), and Description (supports `**bold**` formatting and auto-wraps).
  - 16 included artworks + default art + custom image upload / drag-and-drop, with zoom and pan (sliders or direct canvas drag).
  - Standard + 3 Alternate frames, Photoshop-style `color` frame tinting with quick swatches, 8 rarity gems, and 6 box watermark emblems.
- **Card Back Mode**:
  - **Modular Builder**: Full/Broken bases, 24 center patterns, 18 corner sets, 14 vertical sides, 14 horizontal sides, 8 crystals, 6 emblems, and independent color tinting.
  - **Pre-Made Card Backs**: All 27 pre-built designs from the pack.
- **Booster Pack Mode**:
  - Wave / Smooth wrapper bodies with color tinting, custom or preset background art, editable banner text, and Game/Company logo toggles.
- **Surface Textures**: Clean Vector, 3 Plastic overlays, and 5 Metallic overlays.
- **Export / Import & Library**:
  - Export crisp `1062×1471` transparent PNGs.
  - Export & Import self-contained `.card.json` files (including custom uploaded artwork).
  - Browser `localStorage` library with **Export All JSON**.

## Running Offline
Browsers restrict `<canvas>` PNG exports over `file://`. Run the included local server script:

```bash
./start.sh
```

Then open `http://localhost:8080` in your browser.

## Credits & License
- **Assets & Font**: [Mechanized Magic: 2D Vector Cards Pack](https://dumivid.itch.io/mechanized-magic-2d-vector-fantasy-robot-cards-pack) by **Dumivid** (CC0 1.0 Universal Public Domain Dedication) and `Baloo Chettan 2` (SIL Open Font License).
- **Application**: CC0 1.0 Universal.
