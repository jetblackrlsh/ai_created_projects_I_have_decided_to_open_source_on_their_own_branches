# Studio Ghibli / Makoto Shinkai / "The Moss Keeper" Painterly Anime Engine Guide

This reference defines the **Moss-Keeper Painterly Anime Architecture** (`scripts/painterly-anime-engine.js`) used by `webgl-canvas-story-animator` to achieve the hand-painted gouache backgrounds, botanical overgrowth, weathered cel-shaded constructs, expressive anime characters, and multi-shot cinematography of *The Moss Keeper* (`ChetasLua/moss-keeper`).

---

## 1. Core Painterly Algorithms (`painterly-anime-engine.js`)

### 1.1 Deterministic Seeded PRNG (`mulberry32`)
Never use `Math.random()` inside per-frame 2D Canvas drawing calls (which causes boiling/flickering at 24–60 fps). Always seed `mulberry32(seed)` per prop, tree, cloud bank, or armor plate so every bristle dab is 100% deterministic across frames:

```js
export function mulberry32(seed) {
  let a = (seed >>> 0) + 0x6d2b79f5;
  return function () {
    a = Math.imul(a ^ (a >>> 15), a | 1);
    a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
    return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  };
}
```

### 1.2 Scalloped Bristle-Brush Foliage (`traceScallopedBrushBlob` & `fillBristleCluster`)
**Anti-Pattern Ban**: Never draw foliage, moss cushions, or cloud banks using smooth geometric `ctx.ellipse()` ovals or semi-transparent Venn-diagram circles.
Instead, build every organic silhouette from **scalloped/serrated bezier lobes** (`traceScallopedBrushBlob`) surrounded by perimeter micro-bristle stipple dabs (`fillBristleCluster`) batched into a single compound path (`ctx.beginPath()` -> subpaths -> single `ctx.fill()`):
- **6-Tone Gouache Moss & Canopy Progression**:
  1. Deep Forest Undercanopy Shadow: `#193b22` / `#274e2b`
  2. Rich Emerald Mid-Shadow: `#3d6e38`
  3. Leaf Green Midtone: `#5f8f44`
  4. Sunlit Moss Green: `#8db553`
  5. Warm Chartreuse Highlight: `#c4d468`
  6. Golden-Hour Crown Tip: `#e2e685`
- **Botanical Detail Pass**: Top every foreground/midground moss cluster (`drawMossCluster`) with individual swaying grass blades (`ctx.quadraticCurveTo`) and 5-petal white (`#fffdf7`) and pale lavender (`#d8b4f8`) wildflowers with golden centers (`#f5c249`).

### 1.3 Opaque 3-Tone Cel-Shading & Gouache Weathering (`drawWeatheredPlate`)
**Anti-Pattern Ban**: Never shade armor or stone with linear neon gradients or semi-transparent circles.
Every mechanical or architectural volume must use `drawWeatheredPlate(ctx, pts, opts)`:
1. **Outward-Curved Bezier Silhouette (`curve > 0`)**: Displace polygon edge midpoints along the outward normal (`+dy * curve, -dx * curve`) so helmets, pauldrons, and torso barrels read as 3D curved domes and cylinders rather than flat polygons.
2. **Clipped Opaque 3-Tone Cel Zones**: Fill with cool slate-blue/taupe shadow (`#676d78`), clip to the contour, and paint an opaque midtone zone (`#8d929c`) and an opaque warm golden-hour sunlit highlight zone (`#ebd0a4`) on the sun-facing edge.
3. **Opaque Gouache Weathering Flakes**: Paint 12–16 small irregular scalloped bristle patches in verdigris patina (`#738f7c`) and warm ochre rust (`#b5835a`).
4. **Chipped Regalia Stripes & Hand-Inked Charcoal Outlines**: Paint faded terracotta/crimson regalia bands (`#a83e2b`) with chipped paint flakes and finish with a warm charcoal-sepia ink stroke (`#2a2420`, `1.8px–2.2px`).

### 1.4 Offscreen Layer Caching (`getCachedLayer`) for 60 FPS Realtime & Fast MP4 Encoding
In traditional anime production (Studio Ghibli, CoMix Wave Films), lush gouache background plates are painted once per shot while characters, swaying vines, water ripples, wind rings, and falling leaves animate on cel layers above them.
- Use `getCachedLayer(key, width, height, drawFn)` to cache static bristle-painted layers (`drawImpastoCloud`, `drawForestCanopyVista`, `drawSunlitForestGladeStage` base, `drawTopDownPondReflectionScene` rim/water base, and `drawMossCluster` cushion base) onto offscreen canvases (`OffscreenCanvas`, `document.createElement("canvas")`, or `@napi-rs/canvas`).
- Render animated elements (swaying grass blades, hanging vines, foreground ferns, expanding water ripples, characters, Titan articulation, billowing dust plumes, and falling leaves/pollen) live every frame at 24–60 fps.

---

## 2. Multi-Shot Anime Cinematography & 7 Signature Shot Types

Instead of locking the camera in a single wide stage view for an entire scene, divide scenes into **cinematic sub-shots** modeled after *The Moss Keeper*:

```text
+-----------------------------------------------------------------------------------+
| Shot Type A: High-Altitude Aerial Forest Canopy Vista + Distant Bird Flock        |
| Shot Type B: Framed Sunlit Forest Glade (Bark Trunks, Hanging Vines, Wildflowers) |
| Shot Type C: Shallow-DOF Macro Bokeh Cutaway (Bluebird on Sapling Roots)          |
| Shot Type D: Top-Down Forest Pond Mirror Reflection with Expanding Water Ripples  |
| Shot Type E: Extreme Close-Up Optic Awakening + Anamorphic 4-Point Star Glint     |
| Shot Type F: Low-Angle Heroic Ascent with Billowing Gouache Dust Plumes           |
| Shot Type G: Overhead Canopy Wind-Ring Shockwave & Golden Cumulus Cloud Flight    |
+-----------------------------------------------------------------------------------+
```

### Signature Visual Motifs (`painterly-anime-engine.js`)
- **`drawMossKeeperTitanRig` & `drawMossKeeperHead`**: Towering ancient sentinel with a hemispherical domed helmet, terracotta nose bridge, recessed dual oval optic visors with horizontal eyelid shutters, rotating red-and-cream pinwheel turbine medallions (`drawPinwheelMedallion`), a living sapling tree rooted into its left pauldron (`drawShoulderSapling`), and an ornate 8-spoke golden chest astrolabe.
- **`drawAnamorphicStarGlint`**: Needle-sharp 4-point anime lens flare with warm golden-white radial halo triggered when optics or energy cores ignite.
- **`drawCelShadedBluebird`**: Plump cel-shaded blue-and-white songbird with slate wing feathers, orange cheek blush, and expressive head-tilt/wing-flap animation.
- **`drawPainterlyHumanoidRig`**: Expressive cel-shaded anime humanoids with flowing 2-tone travel cloaks, curved limb silhouettes, shoulder mantles, and 20Hz speech-synchronized mouth articulation.

---

## 3. Live Film Grain, Classic Serif Typography & Modern Web Performance

Every generated `index.html` and `cinema.html` must include:
1. **Live 6-Frame Procedural Film Grain Overlay (`<canvas id="grain">`)**:
   - Pre-generate 6 grayscale noise `ImageData` frames (`256x144`) and cycle them every `~84ms` (`~12 fps`) with `opacity: 0.055; mix-blend-mode: overlay; pointer-events: none;`.
   - Hide `#grain` (`display: none`) and disable frame cycling when `@media (prefers-reduced-motion: reduce)` is active.
2. **Poster Frame Fade-Out (`<img id="poster">`)**:
   - Display a high-resolution painted keyframe (`keyframes/poster_glade.jpg`) over the stage that smoothly fades out (`opacity: 0`) once playback or rendering begins.
3. **Classic Anime Cinema Typography**:
   - Use warm cream ink (`#f3ead8`), golden-amber accents (`#f2c879`), deep theater charcoal (`#07060a`), and classic serif typography (`"Iowan Old Style", "Palatino Linotype", Georgia, serif`) with subtle dark text outlines (`strokeText`) instead of heavyopaque boxes.
4. **Off-Screen Rendering Pause (`content-visibility: auto`)**:
   - Apply `content-visibility: auto; contain-intrinsic-size: auto none auto 540px;` on the stage container and listen for `contentvisibilityautostatechange` (with an `IntersectionObserver` fallback) to pause WebGL, 2D Canvas, and film-grain loops when scrolled off-screen.
