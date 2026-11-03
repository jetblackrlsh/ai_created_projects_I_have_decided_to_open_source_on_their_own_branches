# WebGL Shaders, 5-Layer Environments, High-Detail Rigs & Kinetic Camera Guide

## 1. High-Detail 5-Layer Visual Architecture

Every scene must render **5 distinct depth layers** so environments look like rich, inhabited worlds rather than flat stage cutouts:

```text
+-----------------------------------------------------------------------+
| Pass 5: Foreground Framing, Volumetric Beams, Particles & HUD SafeBar |
+-----------------------------------------------------------------------+
| Pass 4: Main Stage Textured Ground Deck, Props & 14-Part Characters   |
+-----------------------------------------------------------------------+
| Pass 3: Midground Set-Pieces (Consoles, Gantries, Cables, Monitors)   |
+-----------------------------------------------------------------------+
| Pass 2: Far Parallax Architecture (City Spires, Bridges, Cavern Ribs) |
+-----------------------------------------------------------------------+
| Pass 1: WebGL GLSL Fragment Shader (Volumetric Sky, Moons, SDF Ring)  |
+-----------------------------------------------------------------------+
```

### Environment Detail Checklist
- **Surface Scenes**:
  - Multi-tiered city skyline with illuminated window grids, sky-bridges, communication spires, and energy pylons.
  - Layered ridge terrain with rock outcrops, swaying grass blades, road guardrails, and glowing streetlamps.
  - Watchtower architecture with diagonal steel cross-bracing, glass observation decks, holographic radar tables, and suspension cables.
- **Underground & Vault Scenes**:
  - Ribbed subterranean tunnel arches, overhead pipe conduits, glowing coolant tubes, and distant vertical reactor shafts.
  - Laboratory workbenches, multi-monitor holographic telemetry arrays with live graphs/waveforms, ceiling-mounted robotic welding arms, and containment blast doors with hazard chevrons.
  - Lower Containment Vault with fractured stone-and-titanium columns, levitating magnetic lattice shards, and overhead energy conduits.

---

## 2. High-Detail Character & Construct Rigs (`src/scene-renderer.js`)

Characters must never be drawn as simple boxes or stick limbs. Implement sculpted, multi-layered rigs:

### 14-Part Articulated Humanoid Rig
1. **Back Cape / Coat Tails**: Multi-point bezier cloth polygon with secondary motion wave reacting to movement velocity.
2. **Sculpted Torso & Pelvis**: Contoured chest armor or jacket with collar, waist taper, belt/buckle, shoulder pauldrons, panel seams, and glowing chest reactor/emblem.
3. **Articulated Legs (Left & Right)**: Separate contoured **Thigh**, **Knee Guard**, **Shin Greave**, and **Multi-Part Boot** (with glowing electromagnetic clamp talons and arc-lightning when active).
4. **Articulated Arms (Left & Right)**: Separate **Shoulder Pauldron**, **Upper Arm**, **Elbow Cuff**, **Forearm Gauntlet** (with holographic wrist projector cone), and **Hand/Fingers**.
5. **Detailed Head & Expression System**: Contoured head with chin/jaw, ear, multi-strand hair silhouette, angled eyebrows (`determined`, `urgent`, `surprised`, `warm`), multi-layered eyes (or glowing tactical visor with internal scanline), and speech-reactive mouth/jaw.

### 28-Piece Interlocking Titan Rig (Mosaic)
- Render Mosaic as an intricate, towering mecha-construct built from interlocking beveled armor plates floating around a blazing star-reactor core:
  - Crowned polyhedral head with multi-slit optic visor and articulated jaw plate.
  - Layered thoracic chest matrix, floating rune-etched shoulder pylons, and dorsal wing-fins.
  - Segmented upper/forearm plates with glowing plasma seams and articulated 4-fingered mechanical hands capable of launching kinetic orbs, extending a fist ramp, or cradling a miniature lattice cube.
  - Pelvic core, segmented thigh/shin greaves, and anti-gravity hover thrusters.

---

## 3. Kinetic Action Choreography & 24 FPS Dynamic Camera Rig

To make action sequences thrilling and fast-paced, drive every frame at **24 fps** through a **Dynamic Camera Transform** (`applyCameraTransform(ctx, width, height, cam)`):

- **Dynamic Camera Modes**:
  - **Establishing Pan**: Smooth lateral drift across the 5-layer parallax environment.
  - **Heroic Push-In**: Zoom (`1.0 -> 1.28`) onto the active speaker or critical story prop (e.g., the `PREPARE THE VESSEL` log anomaly or the wristband distillation).
  - **Kinetic Action Tracking**: Fast whip-pan and zoom following Velocity's lightning sprint, the plasma dodgeball catch-and-throw, and the Traveler's parkour vault up Mosaic's extended arm!
  - **Impact Shake & Shockwave Rings**: Damped high-frequency camera shake (`±12 px`) paired with expanding shockwave rings and radial speed-lines on heavy impacts (girder lift, firewall breach, kinetic orb catch, magnetic boot clamp lock, and the ancient Ring's sudden halt).
