/**
 * Painterly Anime & Gouache Visual Engine (`painterly-anime-engine.js` — v2 Bristle & Cel Edition)
 *
 * Produces Studio Ghibli / Makoto Shinkai / "The Moss Keeper" (Fable 5.5) visual style,
 * detail level, and polish on standard HTML5 2D Canvas + WebGL:
 *
 * Key Painterly Algorithms:
 * 1. Scalloped & Stippled Bristle-Brush Foliage (`drawLeafyBrushDab`, `drawMossCluster`):
 *    Never draws big smooth geometric ovals! Every moss cushion, tree crown, and cloud puff
 *    is built from serrated/scalloped organic leaf silhouettes and hundreds of micro-bristle
 *    gouache dabs (`3px..12px`) with directional brushstroke tooth.
 * 2. Curved 3D-Projected Domed Silhouettes & Opaque Irregular Cel-Paint Patches (`drawDomedArmorVolume`):
 *    Replaces flat trapezoids and semi-transparent Venn-diagram ellipses with smoothly curved
 *    bezier domes/cylinders, crisp opaque 3-tone cel-shading zones, jagged gouache weathering
 *    flakes, and variable-width hand-inked charcoal linework.
 * 3. Organic Gnarled Bark Trunks, Feathered Hanging Vines, Multi-Layer Meadow Grass, Ferns & Wildflowers.
 * 4. True Cel-Shaded Anime Humanoid Rigs with curved anatomy, cel-shaded fabric folds, and wind-swept hair.
 */

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Fast, deterministic 32-bit PRNG so procedural brush dabs stay rock-solid at 24fps
 */
export function mulberry32(seed) {
  let a = (seed >>> 0) + 0x6d2b79f5;
  return function () {
    a = Math.imul(a ^ (a >>> 15), a | 1);
    a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
    return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  };
}

const _layerCache = new Map();

export function getCachedLayer(key, width, height, drawFn) {
  let canvas = _layerCache.get(key);
  if (!canvas) {
    if (typeof globalThis.__createCanvas === "function") {
      canvas = globalThis.__createCanvas(width, height);
    } else if (typeof OffscreenCanvas !== "undefined") {
      canvas = new OffscreenCanvas(width, height);
    } else if (typeof document !== "undefined") {
      canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
    }
    if (canvas) {
      const cctx = canvas.getContext("2d");
      drawFn(cctx);
      _layerCache.set(key, canvas);
    }
  }
  return canvas;
}

/**
 * Trace an irregular scalloped / serrated painterly brush blob (NO smooth geometric ellipses!)
 */
export function traceScallopedBrushBlob(ctx, cx, cy, rx, ry, rot = 0, lobes = 11, irregularity = 0.28, seed = 1, begin = true) {
  const safeSeed = Math.abs(Math.floor(Number(seed) || 1));
  const safeLobes = Math.max(4, Math.floor(Number(lobes) || 10));
  const rng = mulberry32(safeSeed);
  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);
  const pts = [];
  for (let i = 0; i < safeLobes; i++) {
    const a = (i * Math.PI * 2) / safeLobes;
    const rScale = 1.0 + (rng() - 0.5) * irregularity * 2.0;
    const lx = Math.cos(a) * rx * rScale;
    const ly = Math.sin(a) * ry * rScale;
    pts.push([cx + lx * cosR - ly * sinR, cy + lx * sinR + ly * cosR]);
  }
  if (begin) ctx.beginPath();
  const firstMidX = (pts[pts.length - 1][0] + pts[0][0]) * 0.5;
  const firstMidY = (pts[pts.length - 1][1] + pts[0][1]) * 0.5;
  ctx.moveTo(firstMidX, firstMidY);
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % pts.length];
    const mx = (p0[0] + p1[0]) * 0.5;
    const my = (p0[1] + p1[1]) * 0.5;
    // Outward scalloped leaf/bristle curve
    ctx.quadraticCurveTo(p0[0], p0[1], mx, my);
  }
  ctx.closePath();
}

/**
 * Fill a scalloped gouache brush cluster with micro-bristle stipple along its perimeter
 * Batched into a single compound path for 8x faster GPU/CPU rasterization
 */
export function fillBristleCluster(ctx, cx, cy, rx, ry, color, seed = 1, microCount = 9) {
  const safeSeed = Math.abs(Math.floor(Number(seed) || 1));
  const rng = mulberry32(safeSeed);
  ctx.fillStyle = color;
  ctx.beginPath();
  traceScallopedBrushBlob(ctx, cx, cy, rx, ry, (rng() - 0.5) * 0.7, 10 + (safeSeed % 5), 0.32, safeSeed, false);

  for (let m = 0; m < microCount; m++) {
    const a = rng() * Math.PI * 2;
    const dist = 0.72 + rng() * 0.42;
    const mx = cx + Math.cos(a) * rx * dist;
    const my = cy + Math.sin(a) * ry * dist;
    const mrx = clamp(rx * (0.14 + rng() * 0.16), 2.5, 11);
    const mry = clamp(ry * (0.12 + rng() * 0.15), 2.0, 9);
    traceScallopedBrushBlob(ctx, mx, my, mrx, mry, a + (rng() - 0.5), 6, 0.25, safeSeed + m * 13, false);
  }
  ctx.fill();
}

/**
 * Trace a curved or organic hand-inked polygon path with subtle charcoal/sepia stroke
 */
export function drawInkedPolygon(ctx, pts, fillStyle, strokeStyle = "#26211d", lineWidth = 2.0, seed = 101, curve = 0.15) {
  if (!pts || pts.length < 3) return;
  const rng = mulberry32(seed);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i <= pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i % pts.length];
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const nx = dy * curve * (0.25 + (rng() - 0.5) * 0.2);
    const ny = -dx * curve * (0.25 + (rng() - 0.5) * 0.2);
    const mx = (p0[0] + p1[0]) * 0.5 + nx;
    const my = (p0[1] + p1[1]) * 0.5 + ny;
    ctx.quadraticCurveTo(mx, my, p1[0], p1[1]);
  }
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle && lineWidth > 0) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

/**
 * Draw a weathered, 3-tone cel-shaded & gouache-mottled armor/stone volume with OPAQUE irregular paint patches
 * (Zero semi-transparent Venn-diagram circles!)
 */
export function drawWeatheredPlate(ctx, pts, opts = {}) {
  const {
    baseColor = "#8d929c",
    shadowColor = "#676d78",
    highlightColor = "#ebd0a4",
    patinaColor = "#738f7c",
    rustColor = "#b5835a",
    inkColor = "#2a2420",
    lineWidth = 2.0,
    lightDir = { x: 0.65, y: -0.45 },
    seed = 42,
    stripeColor = null,
    stripeY = null,
    stripeH = 14,
    curve = 0.08,
  } = opts;

  if (!pts || pts.length < 3) return;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [px, py] of pts) {
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
  }
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const pad = Math.ceil(Math.max(w, h) * Math.abs(curve) * 0.35 + lineWidth * 2 + 8);
  const cw = Math.ceil(w + pad * 2);
  const ch = Math.ceil(h + pad * 2);
  const ox = -minX + pad;
  const oy = -minY + pad;

  const relKey = pts.map((p) => `${Math.round(p[0] - minX)},${Math.round(p[1] - minY)}`).join("_");
  const key = `plate_${seed}_${baseColor}_${stripeColor || "n"}_${relKey}`;

  const cached = getCachedLayer(key, cw, ch, (cctx) => {
    const rng = mulberry32(seed);
    cctx.translate(ox, oy);
    const cx = (minX + maxX) * 0.5;
    const cy = (minY + maxY) * 0.5;

    cctx.save();
    cctx.beginPath();
    cctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i <= pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i % pts.length];
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const mx = (p0[0] + p1[0]) * 0.5 + dy * curve * 0.22 + (rng() - 0.5) * 1.2;
      const my = (p0[1] + p1[1]) * 0.5 - dx * curve * 0.22 + (rng() - 0.5) * 1.2;
      cctx.quadraticCurveTo(mx, my, p1[0], p1[1]);
    }
    cctx.closePath();

    cctx.fillStyle = shadowColor;
    cctx.fill();
    cctx.clip();

    fillBristleCluster(
      cctx,
      cx + lightDir.x * w * 0.12,
      cy + lightDir.y * h * 0.10,
      w * 0.58,
      h * 0.62,
      baseColor,
      seed + 1,
      6
    );

    fillBristleCluster(
      cctx,
      cx + lightDir.x * w * 0.36,
      cy + lightDir.y * h * 0.24,
      w * 0.46,
      h * 0.52,
      highlightColor,
      seed + 2,
      8
    );

    for (let i = 0; i < 14; i++) {
      const bx = minX + rng() * w;
      const by = minY + rng() * h;
      const rx = clamp((0.05 + rng() * 0.11) * w, 3, 22);
      const ry = clamp((0.04 + rng() * 0.09) * h, 3, 18);
      const col = i % 3 === 0 ? patinaColor : i % 3 === 1 ? rustColor : baseColor;
      fillBristleCluster(cctx, bx, by, rx, ry, col, seed + 10 + i, 3);
    }

    if (stripeColor) {
      const sy = stripeY !== null ? stripeY : cy;
      cctx.fillStyle = stripeColor;
      cctx.fillRect(minX - 10, sy - stripeH * 0.5, w + 20, stripeH);
      for (let c = 0; c < 5; c++) {
        const chX = minX + rng() * w;
        const chY = sy + (rng() - 0.5) * stripeH;
        fillBristleCluster(cctx, chX, chY, 5 + rng() * 6, 3 + rng() * 4, c % 2 === 0 ? highlightColor : shadowColor, seed + 30 + c, 2);
      }
    }

    cctx.strokeStyle = inkColor;
    cctx.lineWidth = 0.95;
    cctx.globalAlpha = 0.52;
    for (let s = 0; s < 3; s++) {
      const sx = minX + (0.24 + 0.26 * s) * w;
      cctx.beginPath();
      cctx.moveTo(sx, minY);
      cctx.lineTo(sx + (rng() - 0.5) * 8, maxY);
      cctx.stroke();
    }
    cctx.restore();

    drawInkedPolygon(cctx, pts, null, inkColor, lineWidth, seed + 7, curve * 0.25);
  });

  if (cached) {
    ctx.drawImage(cached, minX - pad, minY - pad);
  }
}

/**
 * Draw a lush, multi-layered gouache moss cushion with scalloped bristle dabs, grass blades, and 5-petal wildflowers
 */
export function drawMossCluster(ctx, x, y, radiusX, radiusY, time = 0, seed = 77, hasFlowers = true) {
  ctx.save();
  ctx.translate(x, y);

  const rxInt = Math.round(radiusX);
  const ryInt = Math.round(radiusY);
  const pad = 34;
  const cw = rxInt * 2 + pad * 2;
  const ch = ryInt * 2 + pad * 2;
  const ox = cw * 0.5;
  const oy = ch * 0.55;
  const key = `moss_${rxInt}_${ryInt}_${seed}_${hasFlowers ? 1 : 0}`;

  const cached = getCachedLayer(key, cw, ch, (cctx) => {
    const rng = mulberry32(seed);
    cctx.translate(ox, oy);
    const tones = ["#274e2b", "#3d6e38", "#5f8f44", "#8db553", "#c4d468", "#e2e685"];
    const dabCount = Math.max(22, Math.round((radiusX + radiusY) * 0.42));

    for (let i = 0; i < dabCount; i++) {
      const layerT = i / (dabCount - 1);
      const angle = rng() * Math.PI * 2;
      const dist = Math.pow(rng(), 0.75) * 0.85;
      const dx = Math.cos(angle) * radiusX * dist + layerT * radiusX * 0.12;
      const dy = Math.sin(angle) * radiusY * dist - layerT * radiusY * 0.26;
      const rx = clamp(radiusX * (0.16 + rng() * 0.22) * (1 - layerT * 0.35), 4, 26);
      const ry = clamp(radiusY * (0.18 + rng() * 0.22) * (1 - layerT * 0.30), 4, 22);
      const toneIdx = Math.min(tones.length - 1, Math.floor(layerT * tones.length));
      fillBristleCluster(cctx, dx, dy, rx, ry, tones[toneIdx], seed + i * 17, 4);
    }

    if (hasFlowers) {
      const flowerCount = Math.max(3, Math.round(radiusX * 0.14));
      for (let f = 0; f < flowerCount; f++) {
        const fx = (rng() - 0.5) * radiusX * 1.35;
        const fy = (rng() - 0.5) * radiusY * 0.85 - 3;
        const fSize = 2.6 + rng() * 2.0;
        const isLavender = rng() > 0.62;
        drawFivePetalFlower(cctx, fx, fy, fSize, isLavender ? "#d8b4f8" : "#fffdf7", "#f5c249");
      }
    }
  });

  if (cached) {
    ctx.drawImage(cached, -ox, -oy);
  }

  // Live swaying grass blades sprouting from the moss cushion
  const bladeRng = mulberry32(seed + 999);
  const bladeCount = Math.max(6, Math.round(radiusX * 0.28));
  for (let b = 0; b < bladeCount; b++) {
    const bx = (bladeRng() - 0.5) * radiusX * 1.45;
    const by = (bladeRng() - 0.5) * radiusY * 0.65;
    const bh = 9 + bladeRng() * 15;
    const sway = Math.sin(time * 2.4 + b * 1.1 + seed) * 3.5;
    ctx.strokeStyle = b % 3 === 0 ? "#2d5731" : b % 3 === 1 ? "#689948" : "#c4d468";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + sway * 0.5, by - bh * 0.5, bx + sway, by - bh);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw a delicate 5-petal wildflower (white or pale lavender with golden stamen center)
 */
export function drawFivePetalFlower(ctx, x, y, size = 4, petalColor = "#ffffff", centerColor = "#f5c249") {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = petalColor;
  for (let p = 0; p < 5; p++) {
    const a = (p * Math.PI * 2) / 5 - Math.PI * 0.5;
    const px = Math.cos(a) * size * 0.85;
    const py = Math.sin(a) * size * 0.85;
    ctx.beginPath();
    ctx.ellipse(px, py, size * 0.65, size * 0.36, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = centerColor;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draw the rotating red-and-cream pinwheel turbine medallion (signature Moss Keeper back-arch motif)
 */
export function drawPinwheelMedallion(ctx, x, y, radius, time, seed = 11) {
  ctx.save();
  ctx.translate(x, y);

  // Outer weathered stone drum cylinder
  ctx.fillStyle = "#757c88";
  ctx.strokeStyle = "#26211d";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(-radius * 0.15, radius * 0.08, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Sunlit cream face with weathered shadow crescent
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.94, 0, Math.PI * 2);
  ctx.fillStyle = "#ebd1a7";
  ctx.fill();
  ctx.save();
  ctx.clip();
  fillBristleCluster(ctx, -radius * 0.45, radius * 0.35, radius * 0.55, radius * 0.55, "#8b909a", seed + 1, 4);
  ctx.restore();
  ctx.stroke();

  // 4 curved terracotta-red pinwheel vanes
  ctx.save();
  ctx.rotate(time * 0.55 + seed);
  ctx.fillStyle = "#a83e2b";
  for (let v = 0; v < 4; v++) {
    ctx.save();
    ctx.rotate((v * Math.PI) / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(radius * 0.45, -radius * 0.15, radius * 0.82, -radius * 0.42);
    ctx.arc(0, 0, radius * 0.86, -0.46, 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // Radial score lines
  ctx.strokeStyle = "#26211d";
  ctx.lineWidth = 1.1;
  for (let s = 0; s < 8; s++) {
    const a = (s * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * radius * 0.9, Math.sin(a) * radius * 0.9);
    ctx.stroke();
  }
  ctx.restore();

  // Clinging moss tuft on top edge
  drawMossCluster(ctx, -radius * 0.28, -radius * 0.78, radius * 0.52, radius * 0.34, time, seed + 5, false);
  ctx.restore();
}

/**
 * Draw the living shoulder sapling tree with gnarled roots and stippled sunlit leaf canopy
 */
export function drawShoulderSapling(ctx, x, y, scale = 1.0, time = 0, seed = 33) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const sway = Math.sin(time * 1.8 + seed) * 4.5;

  // Gnarled roots gripping the shoulder armor
  ctx.strokeStyle = "#3b2f26";
  ctx.lineWidth = 4.2;
  ctx.lineCap = "round";
  const roots = [
    [[-4, 0], [-22, 16], [-38, 36]],
    [[-1, 0], [-8, 22], [-12, 46]],
    [[2, 0], [16, 18], [28, 42]],
    [[5, 0], [32, 10], [54, 28]],
  ];
  for (const r of roots) {
    ctx.beginPath();
    ctx.moveTo(r[0][0], r[0][1]);
    ctx.quadraticCurveTo(r[1][0], r[1][1], r[2][0], r[2][1]);
    ctx.stroke();
  }

  // Tapered curved trunk with sunlit bark highlight
  ctx.fillStyle = "#423327";
  ctx.strokeStyle = "#231c16";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-7, 4);
  ctx.quadraticCurveTo(-4 + sway * 0.3, -45, -2 + sway, -96);
  ctx.lineTo(5 + sway, -96);
  ctx.quadraticCurveTo(6 + sway * 0.3, -45, 7, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Branches
  ctx.strokeStyle = "#423327";
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(0 + sway * 0.6, -64);
  ctx.quadraticCurveTo(-18 + sway, -82, -32 + sway, -96);
  ctx.moveTo(2 + sway * 0.7, -70);
  ctx.quadraticCurveTo(20 + sway, -86, 34 + sway, -98);
  ctx.stroke();

  // Warm sunlit bark strip on right edge
  ctx.strokeStyle = "#cfa772";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.quadraticCurveTo(4 + sway * 0.3, -45, 3 + sway, -88);
  ctx.stroke();

  // Multi-tiered stippled leaf crown
  const crownCenters = [
    { cx: -32 + sway * 0.9, cy: -100, rx: 38, ry: 26 },
    { cx: 30 + sway * 1.1, cy: -98, rx: 40, ry: 28 },
    { cx: 0 + sway, cy: -120, rx: 48, ry: 32 },
  ];
  for (let c = 0; c < crownCenters.length; c++) {
    const cc = crownCenters[c];
    drawMossCluster(ctx, cc.cx, cc.cy, cc.rx, cc.ry, time, seed + c * 19, false);
  }

  ctx.restore();
}

/**
 * Draw an anamorphic 4-point anime star lens-flare glint (e.g., when the giant's eye opens)
 */
export function drawAnamorphicStarGlint(ctx, x, y, radius = 48, intensity = 1.0, color = "#fffbeb") {
  if (intensity <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = clamp(intensity, 0, 1);

  const halo = ctx.createRadialGradient(0, 0, 1, 0, 0, radius * 0.65);
  halo.addColorStop(0, "#ffffff");
  halo.addColorStop(0.22, "rgba(254, 249, 195, 0.85)");
  halo.addColorStop(0.55, "rgba(250, 204, 21, 0.22)");
  halo.addColorStop(1, "rgba(250, 204, 21, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  for (let s = 0; s < 2; s++) {
    const rLong = s === 0 ? radius * 1.25 : radius * 1.05;
    const rShort = radius * 0.024;
    ctx.beginPath();
    if (s === 0) {
      ctx.moveTo(-rLong, 0);
      ctx.quadraticCurveTo(-rShort, -rShort, 0, -rShort * 0.45);
      ctx.quadraticCurveTo(rShort, -rShort, rLong, 0);
      ctx.quadraticCurveTo(rShort, rShort, 0, rShort * 0.45);
      ctx.quadraticCurveTo(-rShort, rShort, -rLong, 0);
    } else {
      ctx.moveTo(0, -rLong);
      ctx.quadraticCurveTo(-rShort, -rShort, -rShort * 0.45, 0);
      ctx.quadraticCurveTo(-rShort, rShort, 0, rLong);
      ctx.quadraticCurveTo(rShort, rShort, rShort * 0.45, 0);
      ctx.quadraticCurveTo(rShort, -rShort, 0, -rLong);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draw the cel-shaded anime Bluebird (from Moss Keeper Shot 2)
 */
export function drawCelShadedBluebird(ctx, x, y, scale = 1.0, time = 0, mode = "perched", facing = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * scale, scale);

  const hop = mode === "perched" ? Math.abs(Math.sin(time * 3.2)) * -2.5 : Math.sin(time * 14) * 5;
  const headTilt = mode === "perched" ? Math.sin(time * 2.5) * 0.06 : -0.12;
  ctx.translate(0, hop);

  if (mode === "perched") {
    ctx.strokeStyle = "#231f20";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-4, 10);
    ctx.lineTo(-6, 24);
    ctx.moveTo(-12, 24);
    ctx.lineTo(2, 24);
    ctx.moveTo(4, 10);
    ctx.lineTo(3, 23);
    ctx.stroke();
  }

  // Tail feathers
  drawInkedPolygon(ctx, [[14, 4], [42, 16], [40, 20], [12, 10]], "#4b87dc", "#231f20", 1.5, 12, 0.05);

  // Plump rounded body
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(2, 2, 22, 14, 0.22, 0, Math.PI * 2);
  ctx.fillStyle = "#f1f5f9";
  ctx.fill();
  ctx.clip();

  ctx.fillStyle = "#94a3b8";
  ctx.beginPath();
  ctx.ellipse(4, 10, 20, 10, 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4b87dc";
  ctx.beginPath();
  ctx.ellipse(6, -6, 22, 11, 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e07a3c";
  ctx.beginPath();
  ctx.ellipse(0, 5, 5, 3, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "#231f20";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(2, 2, 22, 14, 0.22, 0, Math.PI * 2);
  ctx.stroke();

  // Layered wing
  const wingFlap = mode === "flying" ? Math.sin(time * 22) * 0.65 : Math.sin(time * 2.8) * 0.03;
  ctx.save();
  ctx.translate(-2, -2);
  ctx.rotate(wingFlap);
  drawInkedPolygon(
    ctx,
    [[-4, 0], [18, -2], [34, 4], [20, 8], [32, 11], [12, 11], [-4, 6]],
    "#5d96e8",
    "#231f20",
    1.5,
    19,
    0.05
  );
  ctx.restore();

  // Rounded head, neck collar, beak & eye
  ctx.save();
  ctx.translate(-14, -8);
  ctx.rotate(headTilt);
  ctx.fillStyle = "#4b87dc";
  ctx.strokeStyle = "#231f20";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f1f5f9";
  ctx.beginPath();
  ctx.ellipse(-2, 4, 7, 4.5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  drawInkedPolygon(ctx, [[-9, -2], [-18, 0], [-9, 3]], "#1e293b", "#231f20", 1.3, 23, 0.02);

  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(-4, -1.5, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-4.6, -2.2, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Paint a multi-stop golden sunrise / atmospheric sky with hand-brushed impasto cloud banks
 */
export function drawPainterlySkyAndClouds(ctx, width, height, time = 0, palette = "goldenSunrise", seed = 10) {
  ctx.save();
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (palette === "goldenSunrise") {
    skyGrad.addColorStop(0.0, "#6695ab");
    skyGrad.addColorStop(0.28, "#a6c6bf");
    skyGrad.addColorStop(0.58, "#f2dfb8");
    skyGrad.addColorStop(0.82, "#fae6ba");
    skyGrad.addColorStop(1.0, "#fef4d8");
  } else if (palette === "emeraldGlade") {
    skyGrad.addColorStop(0.0, "#8ab0a4");
    skyGrad.addColorStop(0.35, "#cfe3cc");
    skyGrad.addColorStop(0.75, "#f7eed4");
    skyGrad.addColorStop(1.0, "#fcf6e6");
  } else if (palette === "ancientVault") {
    skyGrad.addColorStop(0.0, "#1c282e");
    skyGrad.addColorStop(0.45, "#2d4245");
    skyGrad.addColorStop(0.80, "#52695d");
    skyGrad.addColorStop(1.0, "#24302c");
  } else {
    skyGrad.addColorStop(0.0, "#e8be84");
    skyGrad.addColorStop(0.45, "#f7dfa8");
    skyGrad.addColorStop(1.0, "#fdf2d6");
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle horizontal dry-brush paper/canvas tooth lines
  ctx.strokeStyle = "rgba(255, 248, 231, 0.04)";
  ctx.lineWidth = 2;
  for (let y = 8; y < height * 0.75; y += 9) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Impasto brushed cloud banks
  if (palette !== "ancientVault") {
    const cloudBands = [
      { x: 260, y: 120, w: 620, h: 48, seed: seed + 1, drift: 8 },
      { x: 1080, y: 105, w: 680, h: 54, seed: seed + 2, drift: 6 },
      { x: 460, y: 215, w: 540, h: 42, seed: seed + 3, drift: 5 },
      { x: 1440, y: 195, w: 560, h: 44, seed: seed + 4, drift: 7 },
    ];
    for (const cb of cloudBands) {
      drawImpastoCloud(ctx, cb.x + Math.sin(time * 0.08 + cb.seed) * cb.drift, cb.y, cb.w, cb.h, cb.seed);
    }
  }
  ctx.restore();
}

/**
 * Draw a single hand-brushed impasto cloud bank using scalloped bristle puffs (NO geometric ovals!)
 */
export function drawImpastoCloud(ctx, cx, cy, width, height, seed = 1) {
  const pad = 80;
  const cw = Math.round(width + pad * 2);
  const ch = Math.round(height + pad * 2);
  const ox = cw * 0.5;
  const oy = ch * 0.5;
  const key = `cloud_${cw}_${ch}_${seed}`;
  const cached = getCachedLayer(key, cw, ch, (cctx) => {
    const rng = mulberry32(seed);
    const puffs = 30;
    for (let i = 0; i < puffs; i++) {
      const t = i / (puffs - 1);
      const px = ox - width * 0.5 + t * width + (rng() - 0.5) * 32;
      const py = oy + Math.sin(t * Math.PI * 3 + seed) * (height * 0.25) + (rng() - 0.5) * 12;
      const rx = (22 + rng() * 34) * (1 - Math.abs(t - 0.5) * 0.65);
      const ry = rx * (0.36 + rng() * 0.18);
      fillBristleCluster(cctx, px, py + 6, rx, ry, i % 2 === 0 ? "#ba96a3" : "#cca9ac", seed + i * 7, 3);
    }
    for (let i = 0; i < puffs; i++) {
      const t = i / (puffs - 1);
      const px = ox - width * 0.5 + t * width + (rng() - 0.5) * 28;
      const py = oy - 5 + Math.sin(t * Math.PI * 3 + seed) * (height * 0.22) + (rng() - 0.5) * 10;
      const rx = (20 + rng() * 30) * (1 - Math.abs(t - 0.5) * 0.6);
      const ry = rx * (0.34 + rng() * 0.18);
      fillBristleCluster(cctx, px + 7, py - 4, rx, ry, i % 2 === 0 ? "#f8dfc0" : "#fff2d9", seed + 100 + i * 7, 4);
    }
  });
  if (cached) {
    ctx.drawImage(cached, cx - ox, cy - oy);
  }
}

/**
 * Draw distant flocking birds across the morning sky
 */
export function drawDistantBirdFlock(ctx, cx, cy, count = 14, time = 0, seed = 55) {
  const rng = mulberry32(seed);
  ctx.save();
  ctx.strokeStyle = "#4a453e";
  ctx.lineWidth = 1.6;
  for (let i = 0; i < count; i++) {
    const bx = cx + (rng() - 0.5) * 380 + time * (8 + (i % 4) * 2);
    const by = cy + (rng() - 0.5) * 70 + Math.sin(time * 2 + i) * 4;
    const flap = Math.sin(time * 9 + i * 1.3) * 3.5;
    const span = 4.5 + rng() * 3.5;
    ctx.beginPath();
    ctx.moveTo(bx - span, by - flap);
    ctx.quadraticCurveTo(bx - span * 0.4, by - 2, bx, by);
    ctx.quadraticCurveTo(bx + span * 0.4, by - 2, bx + span, by - flap);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draw a multi-tier stippled forest canopy & misty mountain horizon
 */
export function drawForestCanopyVista(ctx, width, height, time = 0, seed = 200) {
  const key = `vista_${width}_${height}_${seed}`;
  const cached = getCachedLayer(key, width, height, (cctx) => {
    const rng = mulberry32(seed);
    const mGrad = cctx.createLinearGradient(0, height * 0.42, 0, height * 0.65);
    mGrad.addColorStop(0, "rgba(196, 204, 198, 0.88)");
    mGrad.addColorStop(1, "rgba(238, 226, 198, 0.94)");
    cctx.fillStyle = mGrad;
    cctx.beginPath();
    cctx.moveTo(0, height * 0.56);
    for (let x = 0; x <= width; x += 30) {
      const mh = Math.sin(x * 0.0025 + 1.2) * 38 + Math.cos(x * 0.008) * 12 + (rng() - 0.5) * 6;
      cctx.lineTo(x, height * 0.49 + mh);
    }
    cctx.lineTo(width, height);
    cctx.lineTo(0, height);
    cctx.closePath();
    cctx.fill();

    const mist1 = cctx.createLinearGradient(0, height * 0.50, 0, height * 0.68);
    mist1.addColorStop(0, "rgba(252, 240, 208, 0)");
    mist1.addColorStop(0.5, "rgba(252, 240, 208, 0.85)");
    mist1.addColorStop(1, "rgba(252, 240, 208, 0.25)");
    cctx.fillStyle = mist1;
    cctx.fillRect(0, height * 0.48, width, height * 0.22);

    const midTones = ["#85a675", "#a3c283", "#c8dc98", "#e5ebb2"];
    for (let i = 0; i < 220; i++) {
      const tx = (i / 219) * (width + 120) - 60 + (rng() - 0.5) * 36;
      const ty = height * 0.63 + Math.sin(i * 0.37) * 34 + (rng() - 0.5) * 72;
      const rx = 20 + rng() * 32;
      const ry = 16 + rng() * 24;
      fillBristleCluster(cctx, tx, ty, rx, ry, midTones[i % midTones.length], seed + i * 11, 4);
    }

    const fgTones = ["#143620", "#1e4b2c", "#2d6637", "#4d8544", "#88b35a"];
    for (let t = 0; t < 28; t++) {
      const treeX = (t / 27) * (width + 80) - 40 + (rng() - 0.5) * 26;
      const treeH = 105 + rng() * 145;
      const baseY = height + 20;
      for (let d = 0; d < 20; d++) {
        const frac = d / 19;
        const spread = (1 - frac * 0.72) * 42;
        const dx = treeX + (rng() - 0.5) * spread;
        const dy = baseY - frac * treeH + (rng() - 0.5) * 16;
        const r = (12 + rng() * 16) * (1 - frac * 0.42);
        const colIdx = Math.min(fgTones.length - 1, Math.floor(frac * 3.2 + rng() * 1.8));
        fillBristleCluster(cctx, dx, dy, r * 1.15, r * 0.85, fgTones[colIdx], seed + 500 + t * 31 + d, 3);
      }
    }
  });
  if (cached) {
    ctx.drawImage(cached, 0, 0);
  }
}

/**
 * Draw a detailed forest clearing backdrop with distant misty trunks, stippled sunlit canopy,
 * framing dark bark-textured trees, hanging vines, and 3-layer meadow with ferns & wildflowers
 */
export function drawSunlitForestGladeStage(ctx, width, height, groundY, time = 0, seed = 300, drawForegroundGrass = true) {
  ctx.save();
  const key = `glade_base_${width}_${height}_${Math.round(groundY)}_${seed}`;
  const cachedBase = getCachedLayer(key, width, height, (cctx) => {
    const rng = mulberry32(seed);
    const bgCanopyTones = ["#7fa174", "#98b888", "#b5cfa2", "#d4e2be", "#e8edd0"];
    for (let tier = 0; tier < 4; tier++) {
      const baseY = groundY - 120 - tier * 115;
      for (let x = -40; x <= width + 40; x += 48) {
        if (tier >= 2 && x > width * 0.48 && x < width * 0.78) continue;
        const cx = x + (rng() - 0.5) * 32;
        const cy = baseY + Math.sin(x * 0.008 + tier) * 42 + (rng() - 0.5) * 28;
        const rx = 44 + rng() * 38;
        const ry = 36 + rng() * 30;
        const col = bgCanopyTones[Math.min(bgCanopyTones.length - 1, tier + (rng() > 0.5 ? 1 : 0))];
        fillBristleCluster(cctx, cx, cy, rx, ry, col, seed + tier * 200 + x, 5);
      }
    }

    const distantTrunks = [
      { x: 215, w: 22 }, { x: 310, w: 26 }, { x: 455, w: 18 },
      { x: 1390, w: 20 }, { x: 1445, w: 26 }, { x: 1495, w: 18 }, { x: 1555, w: 24 },
    ];
    for (let i = 0; i < distantTrunks.length; i++) {
      const dt = distantTrunks[i];
      cctx.fillStyle = i % 2 === 0 ? "#8da387" : "#768f71";
      cctx.fillRect(dt.x - dt.w * 0.5, 0, dt.w, groundY + 10);
      const isLeft = dt.x < width * 0.5;
      cctx.fillStyle = "#e8ddb5";
      cctx.fillRect(isLeft ? dt.x + dt.w * 0.22 : dt.x - dt.w * 0.5, 0, dt.w * 0.28, groundY + 10);
    }

    const mistGrad = cctx.createLinearGradient(0, groundY - 240, 0, groundY + 40);
    mistGrad.addColorStop(0, "rgba(253, 245, 220, 0)");
    mistGrad.addColorStop(0.68, "rgba(253, 245, 220, 0.84)");
    mistGrad.addColorStop(1, "rgba(235, 238, 200, 0.35)");
    cctx.fillStyle = mistGrad;
    cctx.fillRect(0, groundY - 240, width, 280);

    const meadowGrad = cctx.createLinearGradient(0, groundY - 20, 0, height);
    meadowGrad.addColorStop(0.0, "#d7e39c");
    meadowGrad.addColorStop(0.28, "#8fb35c");
    meadowGrad.addColorStop(0.62, "#3f6d3a");
    meadowGrad.addColorStop(1.0, "#122b18");
    cctx.fillStyle = meadowGrad;
    cctx.fillRect(0, groundY - 20, width, height - groundY + 20);

    for (let s = 0; s < 24; s++) {
      const sx = (s / 23) * width + (rng() - 0.5) * 40;
      if (sx > 650 && sx < 1350 && rng() > 0.35) continue;
      drawMossCluster(cctx, sx, groundY - 12, 36 + rng() * 28, 20 + rng() * 14, 0, seed + 400 + s, false);
    }

    for (let g = 0; g < 180; g++) {
      const gx = rng() * width;
      const gy = groundY + rng() * (height - groundY - 30);
      cctx.strokeStyle = g % 2 === 0 ? "#5a8743" : "#a8c967";
      cctx.lineWidth = 1.3;
      cctx.beginPath();
      cctx.moveTo(gx, gy);
      cctx.lineTo(gx + (rng() - 0.5) * 6, gy - 8 - rng() * 10);
      cctx.stroke();
    }
    for (let f = 0; f < 90; f++) {
      const fx = rng() * width;
      const fy = groundY - 4 + rng() * 145;
      const sz = 1.6 + (fy - groundY) * 0.018;
      drawFivePetalFlower(cctx, fx, fy, clamp(sz, 1.8, 3.8), f % 3 === 0 ? "#e9d5ff" : "#fffbeb", "#f5c249");
    }

    const mainTrunks = [
      { x: 42, w: 92, side: "left", yEnd: height * 0.92 },
      { x: 382, w: 54, side: "left", yEnd: groundY + 45 },
      { x: 615, w: 32, side: "left", yEnd: groundY + 18 },
      { x: 1685, w: 66, side: "right", yEnd: groundY + 58 },
      { x: 1835, w: 72, side: "right", yEnd: groundY + 70 },
    ];
    for (let i = 0; i < mainTrunks.length; i++) {
      const tr = mainTrunks[i];
      drawBarkTreeTrunk(cctx, tr.x, 0, tr.w, tr.yEnd, tr.side, seed + i * 31);
    }
  });

  if (cachedBase) {
    ctx.drawImage(cachedBase, 0, 0);
  }

  drawUpperCanopyAndVines(ctx, width, time, seed + 99);

  if (drawForegroundGrass) {
    drawForegroundMeadowGrassAndFerns(ctx, width, height, time, seed + 177);
  }

  ctx.restore();
}

/**
 * Draw a single bark-textured tree trunk with gnarled contour, striated bark fissures, stippled moss & golden rim light
 */
export function drawBarkTreeTrunk(ctx, cx, topY, baseWidth, bottomY, side = "left", seed = 1) {
  const rng = mulberry32(seed);
  ctx.save();
  const pts = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = lerp(topY - 10, bottomY, t);
    const flare = t > 0.82 ? 1.0 + (t - 0.82) * 2.2 : 1.0 + t * 0.12;
    const gnurl = (rng() - 0.5) * 6;
    pts.push([cx - baseWidth * 0.48 * flare + gnurl, y]);
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const y = lerp(topY - 10, bottomY, t);
    const flare = t > 0.82 ? 1.0 + (t - 0.82) * 2.2 : 1.0 + t * 0.12;
    const gnurl = (rng() - 0.5) * 6;
    pts.push([cx + baseWidth * 0.48 * flare + gnurl, y]);
  }

  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = "#2b2219";
  ctx.fill();
  ctx.save();
  ctx.clip();

  // Irregular vertical bark ridges & dry-brush bark fissures
  for (let b = 0; b < 18; b++) {
    const bx = cx + (rng() - 0.5) * baseWidth * 0.82;
    const by = topY + rng() * (bottomY - topY);
    const bw = 3 + rng() * 6;
    const bh = 55 + rng() * 110;
    fillBristleCluster(ctx, bx, by, bw, bh * 0.45, b % 2 === 0 ? "#433324" : "#34271b", seed + b * 5, 2);
  }
  ctx.strokeStyle = "#1c150f";
  ctx.lineWidth = 1.4;
  for (let f = 0; f < 14; f++) {
    const fx = cx + (rng() - 0.5) * baseWidth * 0.85;
    const fy = topY + rng() * (bottomY - topY - 80);
    const fh = 45 + rng() * 95;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.quadraticCurveTo(fx + (rng() - 0.5) * 5, fy + fh * 0.5, fx + (rng() - 0.5) * 4, fy + fh);
    ctx.stroke();
  }

  // Golden-hour rim light strip on inner clearing-facing edge
  const rimEdgeX = side === "left" ? cx + baseWidth * 0.38 : cx - baseWidth * 0.38;
  for (let r = 0; r < 16; r++) {
    const ry = topY + (r / 15) * (bottomY - topY);
    fillBristleCluster(ctx, rimEdgeX, ry, baseWidth * 0.11, 38, "#cfa468", seed + 100 + r, 2);
  }

  // Stippled green bark moss patches along trunk crevices
  for (let m = 0; m < 14; m++) {
    const mx = cx + (rng() - 0.5) * baseWidth * 0.86;
    const my = topY + rng() * (bottomY - topY);
    fillBristleCluster(
      ctx,
      mx,
      my,
      6 + rng() * 10,
      10 + rng() * 18,
      m % 2 === 0 ? "#365e32" : "#588543",
      seed + 200 + m,
      3
    );
  }
  ctx.restore();

  drawInkedPolygon(ctx, pts, null, "#1a140f", 2.2, seed, 0.05);
  ctx.restore();
}

/**
 * Draw upper canopy foliage border and swaying hanging vine garlands
 */
export function drawUpperCanopyAndVines(ctx, width, time = 0, seed = 88) {
  ctx.save();

  const vineXList = [165, 220, 295, 350, 440, 490, 765, 815, 960, 998, 1028, 1225, 1395, 1425, 1595, 1630, 1795, 1890];
  for (let v = 0; v < vineXList.length; v++) {
    const vx = vineXList[v];
    const vLen = 95 + (v % 4) * 48;
    const sway = Math.sin(time * 1.9 + v * 0.8) * 10;
    ctx.strokeStyle = "#1d3d22";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(vx, -5);
    ctx.quadraticCurveTo(vx + sway * 0.4, vLen * 0.5, vx + sway, vLen);
    ctx.stroke();

    const leafPairs = Math.floor(vLen / 12);
    for (let lp = 1; lp <= leafPairs; lp++) {
      const t = lp / leafPairs;
      const lx = vx + sway * t * t;
      const ly = vLen * t;
      ctx.fillStyle = lp % 3 === 0 ? "#4e7c44" : "#244a29";
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(lx + dir * 6, ly, 6.2, 2.5, dir * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Cached upper framing canopy leaf clusters using scalloped bristle dabs
  const key = `upper_canopy_${width}_${seed}`;
  const cachedCanopy = getCachedLayer(key, width, 180, (cctx) => {
    const rng = mulberry32(seed);
    const canopyTones = ["#16361f", "#24522d", "#3c733b", "#689c4d", "#a6c96b"];
    for (let i = 0; i < 110; i++) {
      const isLeft = i < 58;
      const cx = isLeft ? rng() * (width * 0.44) : width - rng() * (width * 0.38);
      const cy = rng() * 140 - 25;
      const rx = 22 + rng() * 34;
      const ry = 15 + rng() * 24;
      fillBristleCluster(cctx, cx, cy, rx, ry, canopyTones[i % canopyTones.length], seed + i * 13, 4);
    }
  });
  if (cachedCanopy) {
    ctx.drawImage(cachedCanopy, 0, 0);
  }

  ctx.restore();
}

/**
 * Draw the dense foreground silhouette grass blades and multi-leaflet fern fronds along the bottom of the frame
 */
export function drawForegroundMeadowGrassAndFerns(ctx, width, height, time = 0, seed = 444) {
  const rng = mulberry32(seed);
  ctx.save();

  const bladeCount = 320;
  for (let i = 0; i < bladeCount; i++) {
    const gx = (i / (bladeCount - 1)) * (width + 40) - 20 + (rng() - 0.5) * 8;
    const gy = height + 6;
    const gh = 65 + rng() * 75;
    const sway = Math.sin(time * 2.2 + gx * 0.015) * 10 + (rng() - 0.5) * 18;
    ctx.fillStyle = i % 3 === 0 ? "#285231" : i % 3 === 1 ? "#1b3d24" : "#112918";
    ctx.beginPath();
    ctx.moveTo(gx - 3.2, gy);
    ctx.quadraticCurveTo(gx + sway * 0.4, gy - gh * 0.5, gx + sway, gy - gh);
    ctx.quadraticCurveTo(gx + sway * 0.4 + 3.2, gy - gh * 0.5, gx + 3.2, gy);
    ctx.closePath();
    ctx.fill();
  }

  const fernPositions = [180, 420, 680, 940, 1210, 1480, 1740];
  for (let f = 0; f < fernPositions.length; f++) {
    const fx = fernPositions[f];
    for (const dir of [-1, 1]) {
      const fSway = Math.sin(time * 1.8 + f) * 5;
      ctx.save();
      ctx.translate(fx, height + 4);
      ctx.rotate(dir * 0.58 + fSway * 0.01);
      ctx.strokeStyle = "#1e4226";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -95);
      ctx.stroke();

      for (let l = 1; l <= 10; l++) {
        const ly = -l * 8.5;
        const lw = (11 - l) * 2.3;
        ctx.fillStyle = l % 2 === 0 ? "#2e5c36" : "#3d7042";
        ctx.beginPath();
        ctx.ellipse(-lw * 0.5, ly, lw * 0.6, 3.0, -0.25, 0, Math.PI * 2);
        ctx.ellipse(lw * 0.5, ly, lw * 0.6, 3.0, 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Draw the Top-Down Forest Pond Reflection Cutaway (like frame_016 in Moss Keeper!)
 */
export function drawTopDownPondReflectionScene(ctx, width, height, time = 0, opts = {}) {
  const {
    showRingReflection = true,
    ringRotation = 0,
    seed = 512,
  } = opts;
  ctx.save();

  const cx = width * 0.49;
  const cy = height * 0.58;
  const pondRx = 510;
  const pondRy = 150;

  // 1. Cached pond water base + reflected canopy shadows
  const waterKey = `pond_water_${width}_${height}_${seed}`;
  const cachedWater = getCachedLayer(waterKey, width, height, (cctx) => {
    const rng = mulberry32(seed);
    const waterGrad = cctx.createLinearGradient(0, cy - pondRy, 0, cy + pondRy);
    waterGrad.addColorStop(0.0, "#fce5b4");
    waterGrad.addColorStop(0.55, "#ebd2a4");
    waterGrad.addColorStop(1.0, "#7fa6a6");
    cctx.fillStyle = waterGrad;
    cctx.fillRect(0, 0, width, height);

    for (let s = 0; s < 36; s++) {
      const a = (s / 36) * Math.PI * 2;
      const rDist = 0.58 + rng() * 0.38;
      const sx = cx + Math.cos(a) * pondRx * rDist;
      const sy = cy + Math.sin(a) * pondRy * rDist;
      fillBristleCluster(cctx, sx, sy, 38 + rng() * 42, 16 + rng() * 18, "#4c6e68", seed + s * 7, 4);
    }
  });
  if (cachedWater) {
    ctx.drawImage(cachedWater, 0, 0);
  }

  if (showRingReflection) {
    ctx.save();
    ctx.translate(cx + 40, cy - 10);
    ctx.scale(1.0, 0.42);
    ctx.rotate(ringRotation * 0.5);
    ctx.strokeStyle = "rgba(217, 155, 67, 0.45)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 175, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Live expanding concentric water droplet ripples
  for (let r = 0; r < 3; r++) {
    const phase = ((time * 0.55 + r * 0.33) % 1.0);
    const ripRx = 12 + phase * 155;
    const ripRy = ripRx * 0.32;
    ctx.strokeStyle = `rgba(255, 252, 240, ${(1 - phase) * 0.85})`;
    ctx.lineWidth = 2.2 - phase * 1.2;
    ctx.beginPath();
    ctx.ellipse(cx - 18, cy + 16, ripRx, ripRy, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 2. Cached mossy shoreline boulders + dense surrounding 720-cluster overhead forest canopy
  const rimKey = `pond_rim_${width}_${height}_${seed}`;
  const cachedRim = getCachedLayer(rimKey, width, height, (cctx) => {
    const rng = mulberry32(seed + 100);
    const rockCount = 18;
    for (let rk = 0; rk < rockCount; rk++) {
      const a = (rk / rockCount) * Math.PI * 2;
      const rx = cx + Math.cos(a) * (pondRx * (0.86 + rng() * 0.14));
      const ry = cy + Math.sin(a) * (pondRy * (0.86 + rng() * 0.14));
      const rw = 52 + rng() * 44;
      const rh = 30 + rng() * 24;
      const rockTones = ["#454138", "#696354", "#8a8370", "#b0a894"];
      for (let d = 0; d < 16; d++) {
        fillBristleCluster(
          cctx,
          rx + (rng() - 0.5) * rw * 0.7,
          ry + (rng() - 0.5) * rh * 0.7,
          10 + rng() * 14,
          8 + rng() * 11,
          rockTones[d % rockTones.length],
          seed + 200 + rk * 19 + d,
          3
        );
      }
    }

    cctx.save();
    cctx.beginPath();
    cctx.rect(0, 0, width, height);
    cctx.ellipse(cx, cy, pondRx * 0.92, pondRy * 0.92, 0, 0, Math.PI * 2, true);
    cctx.fillStyle = "#193b22";
    cctx.fill();
    cctx.restore();

    const leafTones = ["#1d4527", "#2b5e32", "#417a3c", "#619948", "#88b555", "#b4d169"];
    for (let i = 0; i < 720; i++) {
      const lx = rng() * width;
      const ly = rng() * height;
      const nx = (lx - cx) / (pondRx * 0.96);
      const ny = (ly - cy) / (pondRy * 0.96);
      if (nx * nx + ny * ny < 1.0) continue;
      const r = 22 + rng() * 32;
      fillBristleCluster(cctx, lx, ly, r * 1.15, r * 0.85, leafTones[i % leafTones.length], seed + 1000 + i * 5, 4);
    }
  });
  if (cachedRim) {
    ctx.drawImage(cachedRim, 0, 0);
  }

  // 4. Overhanging tropical fern fronds around the pond rim
  const rimAngles = [-2.6, -1.8, -1.4, -0.5, 0.8, 1.3, 1.9, 2.4];
  for (let f = 0; f < rimAngles.length; f++) {
    const a = rimAngles[f];
    const fx = cx + Math.cos(a) * pondRx * 0.95;
    const fy = cy + Math.sin(a) * pondRy * 0.95;
    for (let frond = -2; frond <= 2; frond++) {
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(a + Math.PI + frond * 0.35 + Math.sin(time * 1.6 + f) * 0.04);
      ctx.strokeStyle = "#2b5932";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(115, 0);
      ctx.stroke();
      for (let l = 1; l <= 11; l++) {
        const lx = l * 9.5;
        const lw = (12 - l) * 2.2;
        ctx.fillStyle = l % 2 === 0 ? "#4e8545" : "#8ab858";
        ctx.beginPath();
        ctx.ellipse(lx, -lw * 0.5, 3.0, lw * 0.55, 0.3, 0, Math.PI * 2);
        ctx.ellipse(lx, lw * 0.5, 3.0, lw * 0.55, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Draw the Complete "Moss Keeper" / Awakened Ancient Titan Rig with Curved Domed Armor & Stippled Moss
 */
export function drawMossKeeperTitanRig(ctx, opts = {}) {
  const {
    x = 960,
    y = 820,
    scale = 1.0,
    time = 0.0,
    pose = "kneeling",
    eyeOpen = 0.0,
    starGlint = 0.0,
    furnaceGlow = 0.0,
    talkEnergy = 0.0,
    seed = 700,
  } = opts;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const breath = Math.sin(time * 1.8) * 3.5;
  const riseLift = pose === "rising" ? -28 : pose === "soaring" ? -60 + Math.sin(time * 2.2) * 10 : 0;
  ctx.translate(0, riseLift);

  // 1. Back-Arch Strut & 3 Rotating Pinwheel Turbine Medallions (rising proudly above shoulder & head!)
  ctx.save();
  ctx.translate(0, -408 + breath * 0.6);
  drawWeatheredPlate(
    ctx,
    [
      [-152, 48],
      [-125, -25],
      [-92, -68],
      [-16, -80],
      [-12, -58],
      [-82, -46],
      [-128, 52],
    ],
    { baseColor: "#6e8280", highlightColor: "#b8cfc4", shadowColor: "#425252", seed: seed + 1, curve: 0.16 }
  );
  drawWeatheredPlate(
    ctx,
    [
      [-34, -64],
      [-18, -64],
      [-12, 18],
      [-30, 18],
    ],
    { baseColor: "#485458", highlightColor: "#7e8e92", shadowColor: "#2d3538", seed: seed + 2 }
  );
  drawPinwheelMedallion(ctx, -138, 38, 32, time, seed + 3);
  drawPinwheelMedallion(ctx, -90, -58, 34, time, seed + 4);
  drawPinwheelMedallion(ctx, -14, -66, 32, time, seed + 5);
  ctx.restore();

  // 2. Massive Curved Weathered Legs & Pelvis
  const legSpread = pose === "soaring" ? 18 : 0;
  drawWeatheredPlate(
    ctx,
    [
      [-105 - legSpread, -175],
      [-20, -175],
      [-26, -15],
      [-116 - legSpread, -10],
    ],
    { baseColor: "#8b8f99", highlightColor: "#d9c39e", shadowColor: "#5c606b", seed: seed + 10, curve: 0.12 }
  );
  drawWeatheredPlate(
    ctx,
    [
      [20, -175],
      [98 + legSpread, -175],
      [114 + legSpread, -10],
      [26, -15],
    ],
    { baseColor: "#8b8f99", highlightColor: "#ebd2a9", shadowColor: "#5c606b", seed: seed + 11, curve: 0.12 }
  );
  drawWeatheredPlate(
    ctx,
    [
      [-92, -218],
      [88, -218],
      [98, -168],
      [-102, -168],
    ],
    { baseColor: "#4e525c", highlightColor: "#8c7a6b", shadowColor: "#2f323b", stripeColor: "#7d3529", seed: seed + 12 }
  );

  drawMossCluster(ctx, -68 - legSpread * 0.5, -110, 56, 42, time, seed + 13, true);
  drawMossCluster(ctx, -72 - legSpread * 0.5, -38, 62, 36, time, seed + 14, true);
  drawMossCluster(ctx, 64 + legSpread * 0.5, -95, 58, 44, time, seed + 15, true);
  drawMossCluster(ctx, 72 + legSpread * 0.5, -32, 60, 34, time, seed + 16, true);

  // 3. Sculpted Barrel Torso & Recessed Circular Chest Furnace Grate
  ctx.save();
  ctx.translate(0, breath);
  drawWeatheredPlate(
    ctx,
    [
      [-106, -362],
      [0, -372],
      [104, -362],
      [90, -208],
      [-92, -208],
    ],
    { baseColor: "#9296a0", highlightColor: "#f0d3a5", shadowColor: "#636875", seed: seed + 20, curve: 0.14 }
  );

  drawMossCluster(ctx, -18, -238, 96, 42, time, seed + 21, true);
  drawMossCluster(ctx, 42, -215, 68, 36, time, seed + 22, true);

  // Central Circular Chest Furnace Grate
  const fx = -4;
  const fy = -295;
  const fr = 48;
  ctx.fillStyle = "#567568";
  ctx.strokeStyle = "#26211d";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(fx, fy, fr + 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (furnaceGlow > 0.05) {
    const fg = ctx.createRadialGradient(fx, fy, 4, fx, fy, fr * 1.35);
    fg.addColorStop(0, "#fffbeb");
    fg.addColorStop(0.45, `rgba(251, 191, 36, ${0.65 + furnaceGlow * 0.35})`);
    fg.addColorStop(0.85, `rgba(217, 119, 6, ${0.45 * furnaceGlow})`);
    fg.addColorStop(1, "rgba(217, 119, 6, 0)");
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(fx, fy, fr * 1.35, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#22252a";
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "#474b52";
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.arc(fx, fy, fr * 0.92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(fx, fy, fr * 0.52, 0, Math.PI * 2);
  ctx.stroke();
  for (let s = 0; s < 8; s++) {
    const a = (s * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + Math.cos(a) * fr * 0.92, fy + Math.sin(a) * fr * 0.92);
    ctx.stroke();
  }

  // 4. Right Arm (Viewer's Left — Domed Pauldron, Cylindrical Forearm & Mossy Gauntlet)
  const rArmAngle = pose === "sparring" ? -0.45 : pose === "soaring" ? 0.32 : 0.04;
  ctx.save();
  ctx.translate(-126, -332);
  ctx.rotate(rArmAngle);
  drawWeatheredPlate(
    ctx,
    [
      [-56, 26],
      [-52, -24],
      [-18, -46],
      [28, -42],
      [42, 32],
    ],
    {
      baseColor: "#8d929c",
      highlightColor: "#eac999",
      shadowColor: "#5c6270",
      stripeColor: "#8f3828",
      stripeY: 6,
      stripeH: 13,
      seed: seed + 30,
      curve: 0.22,
    }
  );
  drawWeatheredPlate(
    ctx,
    [
      [-64, 24],
      [28, 28],
      [24, 198],
      [-26, 214],
      [-80, 196],
    ],
    {
      baseColor: "#8d929c",
      highlightColor: "#eac999",
      shadowColor: "#5c6270",
      stripeColor: "#8f3828",
      stripeY: 135,
      stripeH: 12,
      seed: seed + 31,
      curve: 0.16,
    }
  );
  drawMossCluster(ctx, -18, 45, 52, 38, time, seed + 32, true);
  drawMossCluster(ctx, -28, 175, 62, 46, time, seed + 33, true);
  ctx.restore();

  // 5. Left Arm (Viewer's Right — Domed Shoulder Pauldron + Rooted Living Sapling Tree + Forearm)
  const lArmAngle = pose === "offering" ? -0.35 : pose === "soaring" ? -0.22 : 0.0;
  ctx.save();
  ctx.translate(115, -330);
  ctx.rotate(lArmAngle);
  drawWeatheredPlate(
    ctx,
    [
      [-32, -40],
      [16, -46],
      [54, -22],
      [62, 34],
      [-28, 30],
    ],
    {
      baseColor: "#959aa4",
      highlightColor: "#f5d7a8",
      shadowColor: "#656b78",
      stripeColor: "#8f3828",
      stripeY: 8,
      stripeH: 13,
      seed: seed + 40,
      curve: 0.22,
    }
  );
  drawShoulderSapling(ctx, 8, -28, 0.92, time, seed + 41);

  drawWeatheredPlate(
    ctx,
    [
      [-26, 28],
      [64, 32],
      [54, 152],
      [0, 168],
      [-48, 150],
    ],
    {
      baseColor: "#959aa4",
      highlightColor: "#f5d7a8",
      shadowColor: "#656b78",
      seed: seed + 42,
      curve: 0.18,
    }
  );
  drawMossCluster(ctx, 14, 92, 68, 48, time, seed + 43, true);
  ctx.restore();

  // 6. Domed Weathered Head, Terracotta Crest & Expressive Optic Visors
  ctx.save();
  ctx.translate(0, -408 + Math.sin(time * 2.1) * 2);
  drawMossKeeperHead(ctx, {
    scale: 1.0,
    time,
    eyeOpen: clamp(eyeOpen + talkEnergy * 0.4, 0, 1),
    starGlint,
    talkEnergy,
    seed: seed + 50,
  });
  ctx.restore();

  ctx.restore();
  ctx.restore();
}

/**
 * Draw the Moss Keeper's Smoothly Domed Weathered Head (used both on the full rig and in Extreme Close-Up Shot!)
 */
export function drawMossKeeperHead(ctx, opts = {}) {
  const {
    scale = 1.0,
    time = 0,
    eyeOpen = 0.0,
    starGlint = 0.0,
    talkEnergy = 0.0,
    seed = 750,
  } = opts;

  ctx.save();
  ctx.scale(scale, scale);

  // Smoothly rounded 12-point hemisphere dome & jaw housing
  const domePts = [
    [-58, 8],
    [-56, -22],
    [-42, -46],
    [-20, -60],
    [0, -64],
    [22, -60],
    [44, -46],
    [58, -22],
    [60, 8],
    [52, 40],
    [24, 54],
    [-24, 54],
    [-52, 40],
  ];
  drawWeatheredPlate(ctx, domePts, {
    baseColor: "#8b909a",
    highlightColor: "#f5d7a8",
    shadowColor: "#5d6370",
    lineWidth: 2.0,
    seed,
    curve: 0.18,
  });

  // Curved horizontal helmet brow band
  ctx.strokeStyle = "#26211d";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-56, -16);
  ctx.quadraticCurveTo(0, -28, 58, -16);
  ctx.stroke();

  // Central terracotta/oxidized-copper vertical crest with curved top cap
  drawInkedPolygon(
    ctx,
    [
      [-7, -68],
      [7, -68],
      [11, 14],
      [-9, 14],
    ],
    "#9c432e",
    "#26211d",
    1.8,
    seed + 1,
    0.12
  );

  // Twin Recessed Oval Optic Visors
  for (const side of [-1, 1]) {
    const ex = side * 24;
    const ey = 2;
    ctx.save();
    ctx.translate(ex, ey);
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 14, side * -0.08, 0, Math.PI * 2);
    ctx.fillStyle = "#5f857b";
    ctx.fill();
    ctx.clip();

    // Opaque sunlit cel-reflection on right optic
    if (side === 1) {
      fillBristleCluster(ctx, 6, -5, 13, 9, "#cde0c8", seed + 9, 3);
    }

    // Horizontal optic eyelid slit
    const slitH = 2.0 + eyeOpen * 5.2 + talkEnergy * 3.8;
    ctx.fillStyle = eyeOpen > 0.25 ? "#fef08a" : "#1f2926";
    ctx.fillRect(-22, -slitH * 0.5, 44, slitH);
    ctx.restore();

    ctx.strokeStyle = "#26211d";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 20, 14, side * -0.08, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Lower jaw grill & chin bevel
  drawInkedPolygon(ctx, [[-26, 36], [26, 36], [22, 48], [-22, 48]], "#484d54", "#26211d", 1.5, seed + 4, 0.05);

  // Clinging head moss tufts
  drawMossCluster(ctx, -46, -18, 28, 22, time, seed + 2, true);
  drawMossCluster(ctx, 48, -24, 32, 26, time, seed + 3, true);

  if (starGlint > 0.02) {
    drawAnamorphicStarGlint(ctx, 32, 2, 54, starGlint);
  }

  ctx.restore();
}

/**
 * Draw a True Cel-Shaded Anime Humanoid Character Rig
 * (Crisp 2-tone cel-shaded garments, organic curved anatomy, flowing cloak, and expressive anime face)
 */
export function drawPainterlyHumanoidRig(ctx, opts = {}) {
  const {
    x = 500,
    y = 820,
    scale = 1.0,
    facing = 1,
    character = "Traveler",
    pose = "idle",
    talkEnergy = 0.0,
    time = 0.0,
    hasExosuit = false,
    hasWristband = false,
    hasBootClamps = false,
    hasShoulderBot = false,
    isHologram = false,
    alpha = 1.0,
  } = opts;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * scale, scale);
  ctx.globalAlpha = alpha;

  const palettes = {
    Traveler: {
      tunic: hasExosuit ? "#365f7d" : "#445866",
      tunicHi: hasExosuit ? "#7ab0d4" : "#879eab",
      tunicSh: hasExosuit ? "#223d52" : "#2b3842",
      cloak: hasExosuit ? "#3b7ea1" : "#496357",
      cloakSh: hasExosuit ? "#24526b" : "#2f4239",
      trim: "#e6c280",
      skin: "#f6d7b0",
      skinSh: "#cfa379",
      hair: "#2b2623",
      eye: "#3b82a6",
    },
    Velocity: {
      tunic: "#993930",
      tunicHi: "#de755b",
      tunicSh: "#5e201a",
      cloak: "#d99b38",
      cloakSh: "#9e6b1b",
      trim: "#f5d061",
      skin: "#f7dcc0",
      skinSh: "#d4a887",
      hair: "#e8b84b",
      eye: "#d99b26",
    },
    "Aegis Prime": {
      tunic: "#63402b",
      tunicHi: "#b07c52",
      tunicSh: "#3b2518",
      cloak: "#b85d35",
      cloakSh: "#7d3b1e",
      trim: "#e8b074",
      skin: "#e3b88d",
      skinSh: "#b5865d",
      hair: "#d8dee3",
      eye: "#d97736",
    },
    "Astral Warden": {
      tunic: "#4c3863",
      tunicHi: "#8f73b3",
      tunicSh: "#2d203d",
      cloak: "#68498c",
      cloakSh: "#432c5e",
      trim: "#e8c89b",
      skin: "#f2e4d8",
      skinSh: "#c4b0a1",
      hair: "#e6dcf0",
      eye: "#9b6dd6",
    },
    Courier: {
      tunic: "#4c6154",
      tunicHi: "#84a18c",
      tunicSh: "#2f3d34",
      cloak: "#695542",
      cloakSh: "#453629",
      trim: "#d9b882",
      skin: "#f4d3ad",
      skinSh: "#c99f75",
      hair: "#4a3b31",
      eye: "#4b8063",
    },
  };
  const pal = palettes[character] || palettes.Traveler;
  const ink = "#241f1c";
  const breath = Math.sin(time * 2.6) * 2.0;

  if (!isHologram) {
    ctx.fillStyle = "rgba(24, 34, 24, 0.38)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 34, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  let hipY = -98 + breath * 0.4;
  let torsoTilt = 0.0;
  let lFoot = { x: -13, y: 0 }, rFoot = { x: 15, y: 0 };
  let lKnee = { x: -11, y: -48 }, rKnee = { x: 13, y: -48 };
  let rHand = { x: 28, y: -96 };
  if (pose === "run") {
    const s = Math.sin(time * 10);
    torsoTilt = 0.22;
    lFoot = { x: -12 + s * 28, y: Math.min(0, Math.cos(time * 10) * 12) };
    rFoot = { x: 12 - s * 28, y: Math.min(0, -Math.cos(time * 10) * 12) };
    lKnee = { x: -8 + s * 18, y: -50 };
    rKnee = { x: 8 - s * 18, y: -50 };
    rHand = { x: 24 + s * 24, y: -102 };
  } else if (pose === "point" || pose === "terminal") {
    rHand = { x: 52, y: -144 + Math.sin(time * 4) * 3 };
  } else if (pose === "lift") {
    hipY = -84;
    torsoTilt = 0.12;
    rHand = { x: 22, y: -192 };
  } else if (pose === "catch" || pose === "clamp") {
    hipY = -88;
    torsoTilt = 0.16;
    rHand = { x: 48, y: -146 };
  }

  // 1. Flowing Two-Tone Cel-Shaded Travel Cloak
  const wave = Math.sin(time * 3.8) * 11 + (pose === "run" ? -24 : 0);
  const cloakPts = [
    [-14, hipY - 64],
    [10, hipY - 64],
    [-4 + wave * 0.4, hipY + 36],
    [-42 + wave, hipY + 40],
    [-34 + wave * 0.6, hipY - 18],
  ];
  ctx.save();
  drawInkedPolygon(ctx, cloakPts, pal.cloak, null, 0, 91, 0.16);
  ctx.clip();
  ctx.fillStyle = pal.cloakSh;
  ctx.fillRect(-60, hipY - 70, 42, 120);
  ctx.restore();
  drawInkedPolygon(ctx, cloakPts, null, ink, 1.8, 91, 0.16);

  // 2. Crisp Cel-Shaded Legs & Leather Boots
  for (const [kx, ky, fx, fy, isFront] of [
    [lKnee.x, lKnee.y, lFoot.x, lFoot.y, false],
    [rKnee.x, rKnee.y, rFoot.x, rFoot.y, true],
  ]) {
    drawInkedPolygon(
      ctx,
      [
        [isFront ? 3 : -16, hipY],
        [isFront ? 18 : -2, hipY],
        [kx + 7, ky],
        [fx + 5, fy - 8],
        [fx - 6, fy - 8],
        [kx - 7, ky],
      ],
      isFront ? pal.tunic : pal.tunicSh,
      ink,
      1.8,
      isFront ? 92 : 93,
      0.14
    );
    drawInkedPolygon(
      ctx,
      [
        [fx - 9, fy - 13],
        [fx + 9, fy - 11],
        [fx + 16, fy],
        [fx - 10, fy],
      ],
      hasBootClamps ? "#3b7ea1" : "#3b2f26",
      ink,
      1.8,
      94,
      0.12
    );
  }

  // 3. Curved Anime Torso, Sash Belt, Shoulder Mantle & Head
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(torsoTilt);

  // Torso with crisp cel-shaded sunlit edge
  const torsoPts = [
    [-21, -64],
    [21, -64],
    [17, -24],
    [16, 6],
    [-16, 6],
    [-17, -24],
  ];
  ctx.save();
  drawInkedPolygon(ctx, torsoPts, pal.tunic, null, 0, 95, 0.14);
  ctx.clip();
  ctx.fillStyle = pal.tunicSh;
  ctx.fillRect(-24, -68, 22, 80);
  ctx.fillStyle = pal.tunicHi;
  ctx.fillRect(8, -68, 16, 80);
  ctx.fillStyle = pal.trim;
  ctx.fillRect(-20, -7, 40, 6);
  ctx.restore();
  drawInkedPolygon(ctx, torsoPts, null, ink, 1.9, 95, 0.14);

  // Curved Shoulder Mantle
  drawInkedPolygon(
    ctx,
    [
      [-24, -64],
      [24, -64],
      [20, -48],
      [-20, -48],
    ],
    pal.cloak,
    ink,
    1.8,
    99,
    0.16
  );

  // Front Arm
  drawInkedPolygon(
    ctx,
    [
      [10, -58],
      [21, -54],
      [rHand.x + 4, rHand.y - hipY],
      [rHand.x - 4, rHand.y - hipY + 4],
    ],
    pal.tunicHi,
    ink,
    1.7,
    96,
    0.14
  );
  ctx.fillStyle = pal.skin;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(rHand.x, rHand.y - hipY, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (hasWristband) {
    ctx.fillStyle = "#5ea878";
    ctx.strokeStyle = ink;
    ctx.beginPath();
    ctx.arc(rHand.x * 0.78, (rHand.y - hipY) * 0.78, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Expressive Anime Head
  ctx.save();
  ctx.translate(0, -84);
  ctx.fillStyle = pal.skinSh;
  ctx.fillRect(-5, 6, 10, 12);

  drawInkedPolygon(
    ctx,
    [
      [-13, -13],
      [14, -13],
      [15, 2],
      [6, 15],
      [-5, 15],
      [-14, 4],
    ],
    pal.skin,
    ink,
    1.7,
    97,
    0.16
  );

  ctx.fillStyle = "rgba(217, 130, 108, 0.35)";
  ctx.beginPath();
  ctx.ellipse(7, 4, 4.2, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(8, -2, 4.6, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pal.eye;
  ctx.beginPath();
  ctx.arc(8.6, -2, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(7.8, -2.8, 0.85, 0, Math.PI * 2);
  ctx.fill();

  const mOpen = clamp(talkEnergy * 6.0, 1.0, 5.5);
  ctx.fillStyle = talkEnergy > 0.08 ? "#8c3b32" : ink;
  ctx.beginPath();
  ctx.ellipse(8, 8, 3.0, mOpen * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const hairPts = [
    [-17, -2],
    [-19, -19],
    [-2, -25],
    [16, -19],
    [18, -8],
    [8, -10],
    [-8, -8],
    [-14, 5],
  ];
  ctx.save();
  drawInkedPolygon(ctx, hairPts, pal.hair, null, 0, 98, 0.18);
  ctx.clip();
  ctx.fillStyle = "rgba(255, 248, 225, 0.22)";
  ctx.beginPath();
  ctx.ellipse(2, -18, 12, 3.2, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawInkedPolygon(ctx, hairPts, null, ink, 1.7, 98, 0.18);
  ctx.restore();

  if (hasShoulderBot) {
    drawCelShadedBluebird(ctx, -20, -72, 0.52, time, "perched", -1);
  }

  ctx.restore();
  ctx.restore();
}

/**
 * Draw billowing painterly dust plumes at the feet during heavy steps or liftoff (using scalloped bristle puffs!)
 */
export function drawBillowingDustPlumes(ctx, cx, groundY, spread = 240, intensity = 1.0, time = 0, seed = 600) {
  if (intensity <= 0.01) return;
  const rng = mulberry32(seed);
  ctx.save();
  ctx.globalAlpha = clamp(intensity, 0, 1) * 0.85;
  for (let p = 0; p < 20; p++) {
    const dir = p % 2 === 0 ? -1 : 1;
    const frac = p / 19;
    const px = cx + dir * (35 + frac * spread + (time * 35) % 45);
    const py = groundY - 8 - Math.sin(frac * Math.PI) * 38 - rng() * 16;
    const rx = 22 + rng() * 28;
    const ry = 14 + rng() * 18;
    fillBristleCluster(ctx, px, py, rx, ry, p % 2 === 0 ? "#f2dfc0" : "#cdb896", seed + p * 11, 4);
  }
  ctx.restore();
}

/**
 * Draw drifting autumn/forest leaves & glowing golden pollen motes across the frame
 */
export function drawFallingLeavesAndPollen(ctx, width, height, time = 0, count = 18, seed = 800) {
  const rng = mulberry32(seed);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const lx = ((rng() * width + time * (28 + (i % 5) * 9)) % (width + 80)) - 40;
    const ly = ((rng() * height + time * (18 + (i % 4) * 6)) % (height + 60)) - 30;
    const rot = time * (1.4 + (i % 3) * 0.5) + i;
    if (i % 3 === 0) {
      ctx.fillStyle = "rgba(254, 243, 178, 0.65)";
      ctx.beginPath();
      ctx.arc(lx, ly, 2.0 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      ctx.fillStyle = i % 2 === 0 ? "#8a9a46" : "#c48b3f";
      ctx.strokeStyle = "#2b241d";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7.5, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

/**
 * Draw expanding concentric aerodynamic condensation/wind rings (like frame_030 & frame_034)
 */
export function drawAerodynamicWindRings(ctx, cx, cy, maxRadius = 720, time = 0, color = "rgba(255, 248, 225, 0.36)") {
  ctx.save();
  ctx.strokeStyle = color;
  for (let r = 0; r < 3; r++) {
    const phase = ((time * 0.45 + r * 0.33) % 1.0);
    const rx = 180 + phase * maxRadius;
    const ry = rx * 0.42;
    ctx.lineWidth = (1 - phase) * 18 + 4;
    ctx.globalAlpha = (1 - phase) * 0.52;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, -0.06, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Split long caption strings into sequential time-synced pages (<= maxCharsPerPage per page)
 * at natural sentence/clause/word boundaries so captions NEVER overflow horizontally or crowd the screen.
 */
export function paginateCaptionText(text, lineProgress = 0, maxCharsPerPage = 108) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return { pageText: "", pageIndex: 0, pageCount: 1, pages: [""] };
  if (clean.length <= maxCharsPerPage) {
    return { pageText: clean, pageIndex: 0, pageCount: 1, pages: [clean] };
  }

  const words = clean.split(" ");
  const pages = [];
  let current = "";
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const candidate = current ? `${current} ${w}` : w;
    const isClauseBreak = /[.;!?—–,]$/.test(current) && current.length >= maxCharsPerPage * 0.58;
    if ((candidate.length > maxCharsPerPage && current) || (isClauseBreak && i < words.length - 2)) {
      pages.push(current.trim());
      current = w;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) pages.push(current.trim());

  // Rebalance if last page is tiny (< 18 chars) and can merge or borrow from previous page
  if (pages.length >= 2 && pages[pages.length - 1].length < 20) {
    const last = pages.pop();
    const prev = pages.pop();
    const combinedWords = `${prev} ${last}`.split(" ");
    if (`${prev} ${last}`.length <= maxCharsPerPage + 12) {
      pages.push(`${prev} ${last}`);
    } else {
      const mid = Math.ceil(combinedWords.length / 2);
      pages.push(combinedWords.slice(0, mid).join(" "));
      pages.push(combinedWords.slice(mid).join(" "));
    }
  }

  // Weight page duration by character length so reading speed is uniform
  const totalChars = pages.reduce((acc, p) => acc + Math.max(1, p.length), 0);
  const targetCharPos = clamp(lineProgress, 0, 0.9999) * totalChars;
  let accum = 0;
  let pageIndex = 0;
  for (let i = 0; i < pages.length; i++) {
    accum += Math.max(1, pages[i].length);
    if (targetCharPos <= accum) {
      pageIndex = i;
      break;
    }
  }
  return {
    pageText: pages[pageIndex] || pages[0],
    pageIndex,
    pageCount: pages.length,
    pages,
  };
}

/**
 * Strictly wrap caption text into multiple lines guaranteed to satisfy `measureText(line).width <= maxW`.
 */
export function wrapCaptionLines(ctx, text, maxW) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (cur && ctx.measureText(test).width > maxW) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Draw title-safe Cinema Subtitles & Whisper-HUD with guaranteed horizontal safe margins (16% on each side),
 * automatic time-synced pagination for long utterances, multi-line wrapping, and glassmorphic backing pill.
 */
export function drawCinemaCaptionsAndHud(ctx, width, height, state = {}) {
  const {
    scene,
    activeLine,
    activeSfx,
    lineProgress = 0,
    showCaptions = true,
    cinemaMode = false,
  } = state;

  if (scene && !cinemaMode) {
    ctx.save();
    ctx.font = '600 14px "Palatino Linotype", Georgia, serif';
    const loc = scene.location || scene.sub || "";
    const hudTxt = loc ? `${scene.id ? scene.id + " — " : ""}${scene.title}  ·  ${loc}` : `${scene.title}`;
    const maxHudW = width * 0.72;
    let displayHud = hudTxt;
    while (ctx.measureText(displayHud).width > maxHudW && displayHud.length > 20) {
      displayHud = displayHud.slice(0, -4).trim() + "…";
    }
    const pillW = Math.min(maxHudW + 48, Math.max(380, ctx.measureText(displayHud).width + 44));
    ctx.fillStyle = "rgba(12, 14, 20, 0.72)";
    ctx.strokeStyle = "rgba(242, 200, 121, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(42, 26, pillW, 40, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f2c879";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(displayHud, 64, 46);
    ctx.restore();
  }

  if (showCaptions && (activeLine || activeSfx)) {
    ctx.save();
    const safeMaxW = Math.floor(width * 0.68); // Guaranteed 16% horizontal safe margin on BOTH sides (307px each side at 1920w)

    if (activeLine) {
      const spk = activeLine.speaker || "Narrator";
      const rawCaption = activeLine.caption || activeLine.text || "";
      const prog = typeof state.lineProgress === "number"
        ? state.lineProgress
        : (activeLine.duration ? clamp(((state.t || 0) - (activeLine.start || 0)) / Math.max(0.1, activeLine.duration), 0, 1) : lineProgress);

      const { pageText, pageIndex, pageCount } = paginateCaptionText(rawCaption, prog, 108);

      // Select font size (22px -> 20px -> 18px) so wrapped lines <= 2 and strictly <= safeMaxW
      let fontSize = 22;
      ctx.font = `500 ${fontSize}px "Palatino Linotype", Georgia, serif`;
      let lines = wrapCaptionLines(ctx, pageText, safeMaxW);
      while ((lines.length > 2 || lines.some((l) => ctx.measureText(l).width > safeMaxW)) && fontSize > 16) {
        fontSize -= 2;
        ctx.font = `500 ${fontSize}px "Palatino Linotype", Georgia, serif`;
        lines = wrapCaptionLines(ctx, pageText, safeMaxW);
      }

      const lineHeight = fontSize + 8;
      const widestLine = lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 240);
      const boxW = clamp(widestLine + 64, 340, safeMaxW + 64);
      const boxH = 34 + lines.length * lineHeight + 14;
      const boxX = (width - boxW) * 0.5;
      const boxY = height - boxH - 22;

      // Dark glassmorphic caption pill for high-contrast legibility over any background
      ctx.fillStyle = "rgba(8, 10, 18, 0.82)";
      ctx.strokeStyle = "rgba(242, 200, 121, 0.36)";
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 14);
      ctx.fill();
      ctx.stroke();

      // Speaker + Voice header (+ page indicator if multi-page)
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f2c879";
      ctx.font = '600 13px "Palatino Linotype", Georgia, serif';
      const voiceTag = activeLine.voice ? `  ·  ${activeLine.voice}` : "";
      const pageTag = pageCount > 1 ? `  (${pageIndex + 1}/${pageCount})` : "";
      const label = `${spk.toUpperCase()}${voiceTag}${pageTag}`;
      ctx.fillText(label, width * 0.5, boxY + 22);

      // Wrapped caption lines
      ctx.font = `500 ${fontSize}px "Palatino Linotype", Georgia, serif`;
      for (let i = 0; i < lines.length; i++) {
        const ty = boxY + 26 + (i + 1) * lineHeight - 4;
        ctx.strokeStyle = "rgba(5, 6, 12, 0.95)";
        ctx.lineWidth = 4.0;
        ctx.lineJoin = "round";
        ctx.strokeText(lines[i], width * 0.5, ty);
        ctx.fillStyle = "#f8f3e6";
        ctx.fillText(lines[i], width * 0.5, ty);
      }
    } else if (activeSfx) {
      ctx.font = 'italic 19px "Palatino Linotype", Georgia, serif';
      const sfxTxt = `[ ${activeSfx.description} ]`;
      const lines = wrapCaptionLines(ctx, sfxTxt, safeMaxW);
      const widest = lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 220);
      const boxW = clamp(widest + 52, 260, safeMaxW + 52);
      const boxH = lines.length * 26 + 20;
      const boxX = (width - boxW) * 0.5;
      const boxY = height - boxH - 24;

      ctx.fillStyle = "rgba(8, 10, 18, 0.76)";
      ctx.strokeStyle = "rgba(217, 200, 169, 0.35)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "center";
      for (let i = 0; i < lines.length; i++) {
        const ty = boxY + 14 + (i + 1) * 24 - 4;
        ctx.strokeStyle = "rgba(5, 6, 12, 0.92)";
        ctx.lineWidth = 3.5;
        ctx.strokeText(lines[i], width * 0.5, ty);
        ctx.fillStyle = "#e2d4b7";
        ctx.fillText(lines[i], width * 0.5, ty);
      }
    }

    ctx.restore();
  }
}

// ============================================================================
// CINEMATIC MULTI-SHOT CAMERA DIRECTOR & PARALLAX ENGINE
// ============================================================================

/**
 * Compute dynamic camera framing (close-ups, medium two-shots, wide establishing, over-the-shoulder,
 * low-angle hero, Dutch tilt, pan, and dolly zoom) from the active line and scene state.
 */
export function computeCinematicShot(state = {}, anchorMap = {}, width = 1920, height = 1080) {
  const { activeLine, lineProgress = 0, sceneProgress = 0, time = 0 } = state;
  const shotType = (activeLine && activeLine.shot) || "wide";
  const speaker = (activeLine && (activeLine.focal_subject || activeLine.speaker)) || "Narrator";
  const anchor = anchorMap[speaker] || anchorMap.default || { x: width * 0.5, y: height * 0.54 };

  let zoom = 1.04;
  let focusX = width * 0.5;
  let focusY = height * 0.52;
  let rot = 0.0;
  let dofIntensity = 0.0;
  let otsSide = null;

  const p = smoothstep(0.0, 1.0, lineProgress);

  switch (shotType) {
    case "wide":
    case "establishing":
      zoom = lerp(1.02, 1.09, p);
      focusX = width * 0.5 + lerp(-35, 35, p);
      focusY = height * 0.5 + lerp(-12, 10, p);
      break;
    case "pan_left_to_right":
      zoom = 1.24;
      focusX = lerp(width * 0.34, width * 0.66, p);
      focusY = height * 0.52;
      break;
    case "pan_right_to_left":
      zoom = 1.24;
      focusX = lerp(width * 0.66, width * 0.34, p);
      focusY = height * 0.52;
      break;
    case "medium":
    case "two_shot":
      zoom = lerp(1.28, 1.38, p);
      focusX = lerp(width * 0.5, anchor.x, 0.62) + Math.sin(time * 0.6) * 14;
      focusY = lerp(height * 0.52, anchor.y, 0.58);
      dofIntensity = 0.25;
      break;
    case "close_up":
      zoom = lerp(1.68, 1.84, p);
      focusX = anchor.x + lerp(-14, 14, p);
      focusY = anchor.y - 34 + lerp(6, -6, p);
      dofIntensity = 0.65;
      break;
    case "extreme_close_up":
      zoom = lerp(2.05, 2.28, p);
      focusX = anchor.x + lerp(-8, 8, p);
      focusY = anchor.y - 46 + lerp(4, -4, p);
      dofIntensity = 0.85;
      break;
    case "ots_left":
      zoom = lerp(1.48, 1.60, p);
      focusX = lerp(width * 0.5, anchor.x, 0.72);
      focusY = anchor.y - 18;
      dofIntensity = 0.55;
      otsSide = "left";
      break;
    case "ots_right":
      zoom = lerp(1.48, 1.60, p);
      focusX = lerp(width * 0.5, anchor.x, 0.72);
      focusY = anchor.y - 18;
      dofIntensity = 0.55;
      otsSide = "right";
      break;
    case "low_angle":
      zoom = lerp(1.38, 1.52, p);
      focusX = anchor.x;
      focusY = anchor.y - 42;
      rot = -0.018;
      dofIntensity = 0.4;
      break;
    case "dutch_tilt":
      zoom = lerp(1.42, 1.58, p);
      focusX = anchor.x + Math.sin(time * 1.4) * 12;
      focusY = anchor.y - 24;
      rot = 0.038 * (speaker.length % 2 === 0 ? 1 : -1);
      dofIntensity = 0.45;
      break;
    case "push_in":
      zoom = lerp(1.08, 1.74, p);
      focusX = lerp(width * 0.5, anchor.x, p * 0.85);
      focusY = lerp(height * 0.52, anchor.y - 28, p * 0.85);
      dofIntensity = p * 0.65;
      break;
    case "pull_out":
      zoom = lerp(1.72, 1.06, p);
      focusX = lerp(anchor.x, width * 0.5, p * 0.85);
      focusY = lerp(anchor.y - 28, height * 0.5, p * 0.85);
      dofIntensity = (1 - p) * 0.6;
      break;
    default:
      zoom = 1.15;
      focusX = lerp(width * 0.5, anchor.x, 0.5);
      focusY = lerp(height * 0.52, anchor.y, 0.5);
      break;
  }

  // Clamp camera focus so zoomed viewport never exposes outside [0..width, 0..height]
  const halfVisW = (width * 0.5) / zoom;
  const halfVisH = (height * 0.5) / zoom;
  focusX = clamp(focusX, halfVisW + 16, width - halfVisW - 16);
  focusY = clamp(focusY, halfVisH + 16, height - halfVisH - 16);

  return {
    shotType,
    zoom,
    focusX,
    focusY,
    rot,
    dofIntensity,
    otsSide,
    panOffsetX: focusX - width * 0.5,
    panOffsetY: focusY - height * 0.5,
    sceneProgress,
  };
}

/**
 * Apply camera transform for a given parallax depth plane (`depth = 0.35` far bg, `0.7` mid, `1.0` stage, `1.3` fg).
 */
export function applyCameraTransform(ctx, cam, width = 1920, height = 1080, depth = 1.0) {
  const effectiveZoom = 1.0 + (cam.zoom - 1.0) * clamp(depth, 0.2, 1.35);
  const fx = width * 0.5 + cam.panOffsetX * clamp(depth, 0.15, 1.35);
  const fy = height * 0.5 + cam.panOffsetY * clamp(depth, 0.15, 1.35);
  ctx.translate(width * 0.5, height * 0.5);
  if (cam.rot) ctx.rotate(cam.rot * clamp(depth, 0.3, 1.0));
  ctx.scale(effectiveZoom, effectiveZoom);
  ctx.translate(-fx, -fy);
}

/**
 * Draw Shinkai-style foreground depth-of-field bokeh orbs & over-the-shoulder silhouette framing.
 */
export function drawDepthOfFieldBokeh(ctx, width, height, cam, palette = {}, time = 0, seed = 707) {
  ctx.save();
  // Over-the-shoulder foreground silhouette when in OTS shot
  if (cam.otsSide === "left" || cam.otsSide === "right") {
    const isLeft = cam.otsSide === "left";
    const sx = isLeft ? width * 0.11 : width * 0.89;
    const grad = ctx.createRadialGradient(sx, height * 0.68, 30, sx, height * 0.68, 340);
    grad.addColorStop(0, "rgba(8, 10, 18, 0.88)");
    grad.addColorStop(0.7, "rgba(12, 15, 26, 0.72)");
    grad.addColorStop(1, "rgba(12, 15, 26, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(sx, height * 0.46, 135, 165, isLeft ? 0.12 : -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx + (isLeft ? 30 : -30), height * 0.92, 260, 220, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft optical bokeh circles during medium/close-up shots
  if (cam.dofIntensity > 0.05) {
    const rng = mulberry32(seed);
    const accent = palette.accent || "#c084fc";
    const gold = palette.gold || "#fde047";
    ctx.globalAlpha = clamp(cam.dofIntensity * 0.38, 0.05, 0.38);
    for (let i = 0; i < 14; i++) {
      const bx = ((rng() * width + Math.sin(time * 0.35 + i) * 60 - cam.panOffsetX * 0.45) + width) % width;
      const by = ((rng() * height + Math.cos(time * 0.28 + i) * 40 - cam.panOffsetY * 0.45) + height) % height;
      // Keep bokeh near outer edges so center subject face stays crisp
      if (bx > width * 0.25 && bx < width * 0.75 && by > height * 0.22 && by < height * 0.78) continue;
      const rad = 26 + (i % 5) * 22;
      const bGrad = ctx.createRadialGradient(bx, by, rad * 0.1, bx, by, rad);
      const col = i % 2 === 0 ? gold : accent;
      bGrad.addColorStop(0, col);
      bGrad.addColorStop(0.75, col);
      bGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(bx, by, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ============================================================================
// MASTER ANIME CHARACTER & MUPPET RENDERERS (SHINKAI / GHIBLI CEL & GOUACHE)
// ============================================================================

/**
 * Draw a detailed, stylized, 3-tone cel-shaded Anime Character with:
 * - Sculpted bezier jawline, cheekbones, ears, and tapered neck with cast chin shadow
 * - Multi-stop jewel anime eyes with winged upper lashes, scleral shadow, pupil, and dual specular catchlights
 * - Multi-layered bezier hair with dynamic wind sway and crown specular halo band
 * - Articulated upper/lower arms, sculpted hands with fingers, and detailed multi-layer wardrobe folds
 */
export function drawMasterAnimeCharacter(ctx, x, y, scale = 1.0, opts = {}) {
  const {
    time = 0,
    facing = 1,
    speaking = false,
    talkEnergy = 0.5,
    expression = "neutral", // 'neutral' | 'happy' | 'surprised' | 'horrified' | 'focused' | 'sleepy'
    pose = "stand", // 'stand' | 'float' | 'seated' | 'booth_phone' | 'grimoire' | 'gesture' | 'plead'
    armRaise = 0.0,
    lookAtX = 0.0,
    lookAtY = 0.0,
    skinBase = "#f3cfb3",
    skinShadow = "#c99778",
    skinHighlight = "#ffe8d6",
    blushColor = "rgba(235, 115, 115, 0.28)",
    eyeColorTop = "#1e3a8a",
    eyeColorMid = "#38bdf8",
    eyeColorBot = "#bae6fd",
    hairStyle = "short_tousled", // 'dreadlocks' | 'celestial_long' | 'curly_long' | 'silver_bun' | 'sleek_bob' | 'short_tousled' | 'beret'
    hairBase = "#271810",
    hairShadow = "#140b06",
    hairHighlight = "#6b442a",
    beard = false,
    glasses = null, // null | { shape: 'round' | 'rect', color: '#ff7eb6' }
    outfit = "hoodie_street", // 'hoodie_street' | 'celestial_gown' | 'cardigan_skirt' | 'grandma_cardigan' | 'concierge_suit' | 'clerk_vest' | 'casual_sweater' | 'evening_dress'
    primaryColor = "#1e293b",
    secondaryColor = "#334155",
    accentColor = "#fbbf24",
    skirtOrPantsColor = "#0f172a",
    hasCrystalSword = false,
    hasCrossbodyBag = false,
    hasBandageArm = false,
    hasCondimentBottle = false,
    seed = 101,
  } = opts;

  const ink = "#18131e";
  const breath = Math.sin(time * 2.4 + seed * 0.1) * 2.2;
  const floatOffset = pose === "float" ? Math.sin(time * 1.9 + seed) * 11 : 0;

  ctx.save();
  ctx.translate(x, y + floatOffset);
  ctx.scale(facing * scale, scale);

  // 0. Ground Contact Shadow
  if (pose !== "float" && pose !== "seated" && pose !== "grimoire") {
    ctx.fillStyle = "rgba(10, 12, 22, 0.34)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 38, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 1. Optional Celestial Halo / Golden Tether & Crystal Sword on Back
  if (outfit === "celestial_gown") {
    const aura = ctx.createRadialGradient(0, -145, 10, 0, -145, 115);
    aura.addColorStop(0, "rgba(192, 132, 252, 0.52)");
    aura.addColorStop(0.55, "rgba(56, 189, 248, 0.22)");
    aura.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -145, 115, 0, Math.PI * 2);
    ctx.fill();
  }

  if (hasCrystalSword) {
    ctx.save();
    // Golden astral tether ribbon
    ctx.strokeStyle = "rgba(253, 224, 71, 0.82)";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-16, -118 + breath);
    ctx.bezierCurveTo(
      -78, -142 + Math.sin(time * 2.2) * 16,
      -115, -68 + Math.cos(time * 1.8) * 16,
      -162, -96 + Math.sin(time * 2.6) * 20
    );
    ctx.stroke();

    // Faceted Rainbow Crystal Greatsword
    ctx.translate(-14, -128 + breath);
    ctx.rotate(-0.52);
    const bladeGrad = ctx.createLinearGradient(0, -105, 0, 65);
    bladeGrad.addColorStop(0, "#f472b6");
    bladeGrad.addColorStop(0.32, "#fde047");
    bladeGrad.addColorStop(0.66, "#38bdf8");
    bladeGrad.addColorStop(1, "#a855f7");
    drawInkedPolygon(
      ctx,
      [[0, -108], [12, -74], [8, 52], [-8, 52], [-12, -74]],
      bladeGrad,
      "#ffffff",
      1.6,
      seed + 1,
      0.06
    );
    // Center ridge facet line
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -104);
    ctx.lineTo(0, 48);
    ctx.stroke();
    // Ornate wing crossguard & wrapped pommel
    drawInkedPolygon(ctx, [[-22, -74], [22, -74], [17, -65], [-17, -65]], "#f59e0b", ink, 1.5, seed + 2, 0.08);
    drawInkedPolygon(ctx, [[-4.5, -100], [4.5, -100], [4.5, -74], [-4.5, -74]], "#312e81", ink, 1.4, seed + 3, 0.05);
    ctx.restore();
  }

  // 2. Back Hair Layer (for long/flowing hair styles)
  ctx.save();
  ctx.translate(0, -168 + breath);
  if (hairStyle === "dreadlocks") {
    for (let i = -6; i <= 6; i++) {
      const sway = Math.sin(time * 2.1 + i * 0.55) * 4.5;
      const lx = i * 4.2;
      drawInkedPolygon(
        ctx,
        [
          [lx - 3.5, 4],
          [lx + 3.5, 4],
          [lx + 4.8 + sway, 68 + (Math.abs(i) % 3) * 7],
          [lx - 2.2 + sway, 68 + (Math.abs(i) % 3) * 7],
        ],
        i % 2 === 0 ? hairBase : hairShadow,
        ink,
        1.2,
        seed + 10 + i,
        0.12
      );
    }
  } else if (hairStyle === "celestial_long") {
    for (let i = -5; i <= 5; i++) {
      const wave = Math.sin(time * 2.3 + i * 0.6) * 9;
      drawInkedPolygon(
        ctx,
        [
          [i * 4, -8],
          [i * 4 + 7, -8],
          [i * 9 + 8 + wave, 92],
          [i * 9 - 4 + wave, 92],
        ],
        i % 2 === 0 ? hairBase : hairHighlight,
        "#312e81",
        1.2,
        seed + 20 + i,
        0.15
      );
    }
  } else if (hairStyle === "curly_long") {
    for (let i = -4; i <= 4; i++) {
      const cx = i * 6.5 + Math.sin(time * 2.0 + i) * 3;
      fillBristleCluster(ctx, cx, 18 + Math.abs(i) * 4, 15, 22, i % 2 === 0 ? hairBase : hairShadow, seed + 30 + i, 5);
      fillBristleCluster(ctx, cx * 1.1, 42 + Math.abs(i) * 3, 14, 18, i % 2 === 0 ? hairHighlight : hairBase, seed + 40 + i, 4);
    }
  }
  ctx.restore();

  // 3. Articulated Legs & Footwear
  if (pose !== "grimoire" && pose !== "seated") {
    ctx.save();
    if (pose === "booth_phone") {
      // Seated in café booth profile
      drawInkedPolygon(ctx, [[-18, -74], [32, -74], [34, -52], [-18, -52]], skirtOrPantsColor, ink, 1.8, seed + 50, 0.08);
      drawInkedPolygon(ctx, [[14, -58], [34, -58], [32, -10], [14, -10]], skirtOrPantsColor, ink, 1.8, seed + 51, 0.08);
      // White athletic stripe
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(-12, -64, 38, 3.5);
      ctx.fillRect(22, -56, 3.5, 42);
      // Detailed sneaker
      drawInkedPolygon(ctx, [[10, -14], [44, -12], [46, 0], [10, 0]], "#f8fafc", ink, 1.7, seed + 52, 0.08);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(11, -4, 34, 4);
    } else if (outfit === "celestial_gown" || outfit === "evening_dress") {
      // Flowing full-length anime gown with cel-shaded drapery pleats
      const sway = Math.sin(time * 2.0 + seed) * 6;
      const skirtPts = [
        [-22, -82],
        [22, -82],
        [44 + sway, -4],
        [0, 4],
        [-44 + sway * 0.6, -4],
      ];
      ctx.save();
      drawInkedPolygon(ctx, skirtPts, primaryColor, null, 0, seed + 53, 0.12);
      ctx.clip();
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(-52, -85, 34, 95);
      // Vertical drapery fold lines
      ctx.strokeStyle = "rgba(15, 23, 42, 0.38)";
      ctx.lineWidth = 1.6;
      for (const fx of [-16, -4, 10, 22]) {
        ctx.beginPath();
        ctx.moveTo(fx * 0.5, -80);
        ctx.quadraticCurveTo(fx, -40, fx * 1.3 + sway * 0.5, 2);
        ctx.stroke();
      }
      ctx.restore();
      drawInkedPolygon(ctx, skirtPts, null, outfit === "celestial_gown" ? "#fde047" : ink, 1.8, seed + 53, 0.12);
    } else {
      // Standing legs (either pleated skirt + calves or tapered trousers + sneakers/shoes)
      const isSkirt = outfit === "cardigan_skirt" || outfit === "grandma_cardigan";
      for (const side of [-1, 1]) {
        const lx = side * 12;
        if (isSkirt) {
          // Lower leg / stockings
          drawInkedPolygon(
            ctx,
            [[lx - 6, -46], [lx + 6, -46], [lx + 5, -10], [lx - 5, -10]],
            side === -1 ? skinShadow : skinBase,
            ink,
            1.6,
            seed + 54 + side,
            0.08
          );
        } else {
          // Tapered trousers with shadow crease
          drawInkedPolygon(
            ctx,
            [[lx - 10, -78], [lx + 10, -78], [lx + 8, -10], [lx - 8, -10]],
            side === -1 ? "#0f131d" : skirtOrPantsColor,
            ink,
            1.8,
            seed + 56 + side,
            0.08
          );
          if (outfit === "hoodie_street") {
            ctx.fillStyle = "#f1f5f9";
            ctx.fillRect(lx + (side > 0 ? 4 : -7), -74, 3, 62);
          }
        }
        // Detailed Anime Footwear (Sneakers with sole & laces or Mary-Jane / dress shoes)
        const shoeCol = outfit === "hoodie_street" ? "#f8fafc" : "#1e1b24";
        drawInkedPolygon(
          ctx,
          [[lx - 9, -13], [lx + 12, -12], [lx + 18, 0], [lx - 9, 0]],
          shoeCol,
          ink,
          1.7,
          seed + 58 + side,
          0.08
        );
        ctx.fillStyle = outfit === "hoodie_street" ? "#64748b" : "#09090b";
        ctx.fillRect(lx - 8, -3.5, 25, 3.5);
      }
      if (isSkirt) {
        // Pleated Anime Skirt with shadow pleats
        const skPts = [[-22, -80], [22, -80], [30, -40], [-30, -40]];
        ctx.save();
        drawInkedPolygon(ctx, skPts, skirtOrPantsColor, null, 0, seed + 60, 0.1);
        ctx.clip();
        ctx.fillStyle = "rgba(10, 12, 20, 0.28)";
        for (let px = -24; px <= 20; px += 11) {
          ctx.fillRect(px, -80, 5, 42);
        }
        ctx.restore();
        drawInkedPolygon(ctx, skPts, null, ink, 1.8, seed + 60, 0.1);
      }
    }
    ctx.restore();
  }

  // 4. Back Arm (Articulated Upper + Forearm + Hand)
  ctx.save();
  ctx.translate(-20, -136 + breath);
  const backArmRot = pose === "plead" ? -0.55 : (0.18 - armRaise * 0.35);
  ctx.rotate(backArmRot);
  drawInkedPolygon(ctx, [[-7, 0], [7, 0], [6, 38], [-6, 38]], secondaryColor, ink, 1.7, seed + 62, 0.1);
  ctx.fillStyle = skinShadow;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 42, 6, 7, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 5. Sculpted Torso & Multi-Layer Anime Wardrobe
  ctx.save();
  ctx.translate(0, -144 + breath);
  const torsoPts = [
    [-26, 0],
    [26, 0],
    [23, 34],
    [22, 68],
    [-22, 68],
    [-23, 34],
  ];
  ctx.save();
  drawInkedPolygon(ctx, torsoPts, primaryColor, null, 0, seed + 65, 0.1);
  ctx.clip();
  // Cel-shaded shadow half & sunlit rim
  ctx.fillStyle = secondaryColor;
  ctx.fillRect(-30, -4, 24, 78);
  ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
  ctx.fillRect(12, -4, 16, 78);

  if (outfit === "hoodie_street") {
    // Inner graphic tee panel ("DREAM ANIME")
    ctx.fillStyle = "#1e2436";
    ctx.fillRect(-13, 4, 26, 64);
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 7.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DREAM", 0, 25);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("ANIME", 0, 35);
    drawAnamorphicStarGlint(ctx, 0, 46, 9, 0.8, "#fde047");
    // Open hoodie zipper edges & drawstrings
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-13, 4);
    ctx.lineTo(-13, 68);
    ctx.moveTo(13, 4);
    ctx.lineTo(13, 68);
    ctx.stroke();
  } else if (outfit === "cardigan_skirt" || outfit === "grandma_cardigan") {
    // Inner blouse / top
    ctx.fillStyle = accentColor;
    ctx.fillRect(-11, 2, 22, 64);
    // Knit cardigan lapels & buttons
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-11, 2);
    ctx.lineTo(-14, 66);
    ctx.moveTo(11, 2);
    ctx.lineTo(14, 66);
    ctx.stroke();
    for (const by of [24, 38, 52]) {
      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.arc(-15, by, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (outfit === "concierge_suit" || outfit === "clerk_vest" || outfit === "casual_sweater") {
    // Crisp white dress shirt V-neck & tie/cravat
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(11, 0);
    ctx.lineTo(0, 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(-3, 8);
    ctx.lineTo(3, 8);
    ctx.lineTo(4, 30);
    ctx.lineTo(0, 36);
    ctx.lineTo(-4, 30);
    ctx.closePath();
    ctx.fill();
  } else if (outfit === "celestial_gown") {
    // Gold constellation embroidery across bodice
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-14, 18);
    ctx.lineTo(0, 28);
    ctx.lineTo(14, 16);
    ctx.lineTo(6, 42);
    ctx.lineTo(-8, 46);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
  drawInkedPolygon(ctx, torsoPts, null, ink, 1.9, seed + 65, 0.1);

  // Hoodie Collar or Lapel Collar
  if (outfit === "hoodie_street") {
    drawInkedPolygon(ctx, [[-26, -4], [26, -4], [22, 9], [-22, 9]], "#1e2230", ink, 1.7, seed + 66, 0.1);
  }

  // Optional Cross-Body Belt Bag
  if (hasCrossbodyBag) {
    ctx.strokeStyle = "#090b10";
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(-22, 3);
    ctx.lineTo(22, 56);
    ctx.stroke();
    ctx.save();
    ctx.translate(2, 30);
    ctx.rotate(0.72);
    drawInkedPolygon(ctx, [[-16, -9], [16, -9], [16, 9], [-16, 9]], "#11131a", "#64748b", 1.5, seed + 67, 0.06);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-11, -2);
    ctx.lineTo(11, -2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // 6. Sculpted Anime Head, Neck, Cel-Shaded Face, Jewel Eyes, Nose, Lips & Hair
  ctx.save();
  ctx.translate(0, -168 + breath);

  // Tapered Neck + Clavicle Cast Shadow
  drawInkedPolygon(ctx, [[-7.5, 10], [7.5, 10], [8.5, 25], [-8.5, 25]], skinBase, ink, 1.6, seed + 70, 0.06);
  ctx.fillStyle = skinShadow;
  ctx.beginPath();
  ctx.moveTo(-7.5, 10);
  ctx.lineTo(7.5, 10);
  ctx.lineTo(7.5, 18);
  ctx.quadraticCurveTo(0, 22, -7.5, 19);
  ctx.closePath();
  ctx.fill();

  // Ears with inner concha shadow
  for (const ex of [-19.5, 19.5]) {
    ctx.fillStyle = ex < 0 ? skinShadow : skinBase;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(ex, -2, 4.2, 6.5, ex < 0 ? -0.15 : 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Sculpted Anime Head Silhouette (curved temples, soft cheekbones, tapered chin)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-18, -18);
  ctx.bezierCurveTo(-19, -28, 19, -28, 18, -18);
  ctx.bezierCurveTo(20, -4, 17, 7, 11, 13);
  ctx.quadraticCurveTo(3.5, 19.5, 0, 19.8);
  ctx.quadraticCurveTo(-3.5, 19.5, -11, 13);
  ctx.bezierCurveTo(-17, 7, -20, -4, -18, -18);
  ctx.closePath();
  ctx.fillStyle = skinBase;
  ctx.fill();
  ctx.clip();

  // Left-side cel shadow + sunlit cheek highlight + warm blush
  ctx.fillStyle = skinShadow;
  ctx.beginPath();
  ctx.moveTo(-22, -28);
  ctx.lineTo(-7, -28);
  ctx.quadraticCurveTo(-11, 0, -3, 22);
  ctx.lineTo(-22, 22);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = skinHighlight;
  ctx.beginPath();
  ctx.ellipse(9, -4, 8, 9, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = blushColor;
  ctx.beginPath();
  ctx.ellipse(-10, 3, 4.8, 2.4, 0.1, 0, Math.PI * 2);
  ctx.ellipse(10, 3, 4.8, 2.4, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Under-eye fatigue rings for sleepy clerk
  if (expression === "sleepy") {
    ctx.strokeStyle = "rgba(88, 28, 135, 0.45)";
    ctx.lineWidth = 1.8;
    for (const ex of [-7.5, 7.5]) {
      ctx.beginPath();
      ctx.arc(ex, -3.5, 4.8, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Hand-inked jawline outline
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.moveTo(-18, -18);
  ctx.bezierCurveTo(-19, -28, 19, -28, 18, -18);
  ctx.bezierCurveTo(20, -4, 17, 7, 11, 13);
  ctx.quadraticCurveTo(3.5, 19.5, 0, 19.8);
  ctx.quadraticCurveTo(-3.5, 19.5, -11, 13);
  ctx.bezierCurveTo(-17, 7, -20, -4, -18, -18);
  ctx.closePath();
  ctx.stroke();

  // Optional Full Beard & Mustache (Jet)
  if (beard) {
    ctx.fillStyle = "#1f1109";
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-18.5, -1);
    ctx.quadraticCurveTo(-19, 19, 0, 22);
    ctx.quadraticCurveTo(19, 19, 18.5, -1);
    ctx.lineTo(14.5, -3);
    ctx.quadraticCurveTo(11, 8, 0, 9.5);
    ctx.quadraticCurveTo(-11, 8, -14.5, -3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mustache arch
    ctx.fillStyle = "#170c06";
    ctx.beginPath();
    ctx.moveTo(-11, 4.5);
    ctx.quadraticCurveTo(0, 1.5, 11, 4.5);
    ctx.quadraticCurveTo(9, 8.5, 0, 7.2);
    ctx.quadraticCurveTo(-9, 8.5, -11, 4.5);
    ctx.closePath();
    ctx.fill();
  }

  // Sculpted Anime Nose Bridge & Shadow Wedge
  ctx.fillStyle = skinShadow;
  ctx.beginPath();
  ctx.moveTo(0.5, -4);
  ctx.lineTo(2.8, 1.2);
  ctx.lineTo(0.2, 2.0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0.4, -3.5);
  ctx.lineTo(2.4, 1.2);
  ctx.lineTo(0.5, 1.8);
  ctx.stroke();

  // Expressive Mouth & Lip-Sync Interior
  const mouthOpen = speaking
    ? 2.2 + Math.abs(Math.sin(time * 14.5 + seed)) * 5.0 * clamp(talkEnergy, 0.35, 1.2)
    : (expression === "horrified" || expression === "surprised" ? 5.2 : 0.8);
  const my = beard ? 9.5 : 8.8;
  if (mouthOpen > 1.6) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0.5, my, 5.2, mouthOpen, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#5c1922";
    ctx.fill();
    ctx.clip();
    // Upper teeth row
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-5, my - mouthOpen, 11, 2.2);
    // Warm tongue dome
    ctx.fillStyle = "#e15b64";
    ctx.beginPath();
    ctx.ellipse(0.5, my + mouthOpen * 0.55, 4.2, mouthOpen * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0.5, my, 5.2, mouthOpen, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (expression === "happy") {
      ctx.moveTo(-4.5, my - 0.5);
      ctx.quadraticCurveTo(0.5, my + 2.8, 5.2, my - 0.5);
    } else {
      ctx.moveTo(-4.2, my);
      ctx.quadraticCurveTo(0.5, my + 0.8, 4.8, my);
    }
    ctx.stroke();
  }

  // Detailed Shinkai Jewel Anime Eyes (Left & Right)
  const blink = Math.sin(time * 0.85 + seed * 1.7) > 0.975 ? 0.12 : (expression === "sleepy" ? 0.58 : 1.0);
  for (const [idx, ex] of [[-7.2, -1], [7.8, 1]].map(([pos, s], i) => [i, pos])) {
    ctx.save();
    ctx.translate(ex + lookAtX * 1.5, -5.2 + lookAtY * 1.5);
    ctx.scale(1, blink);

    // Sclera with soft upper lid shadow
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.2, 4.1, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
    ctx.fillRect(-6, -5, 12, 3.2);

    // 3-stop Jewel Iris Gradient
    const irisGrad = ctx.createLinearGradient(0, -3.8, 0, 3.8);
    irisGrad.addColorStop(0, eyeColorTop);
    irisGrad.addColorStop(0.55, eyeColorMid);
    irisGrad.addColorStop(1, eyeColorBot);
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(0.4, 0.2, 3.3, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Deep Pupil
    ctx.fillStyle = "#090d16";
    ctx.beginPath();
    ctx.arc(0.4, 0.3, 1.55, 0, Math.PI * 2);
    ctx.fill();

    // Dual Specular Catchlights
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-1.1, -1.3, 1.25, 0, Math.PI * 2);
    ctx.arc(1.5, 1.4, 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Thick Winged Upper Eyelash & Lower Lash Line
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-5.4, -1.0);
    ctx.quadraticCurveTo(0, -4.8, 5.6, -1.2);
    ctx.stroke();
    // Lower lid subtle line
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-3.5, 3.6);
    ctx.quadraticCurveTo(0, 4.4, 3.8, 3.5);
    ctx.stroke();
    ctx.restore();

    // Expressive Eyebrows
    const browY = expression === "surprised" || expression === "horrified" ? -12.8 : -11.0;
    const browTilt = expression === "horrified" ? (idx === 0 ? -2.2 : 2.2) : 0;
    ctx.strokeStyle = hairShadow;
    ctx.lineWidth = 2.1;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(ex - 4.8, browY + browTilt);
    ctx.quadraticCurveTo(ex, browY - 2.0, ex + 4.8, browY - browTilt * 0.5);
    ctx.stroke();
  }

  // Optional Glasses (Ashley's round pink glasses or QA / Daughter rectangular frames)
  if (glasses) {
    ctx.save();
    ctx.strokeStyle = glasses.color || "#ff7eb6";
    ctx.lineWidth = 2.0;
    for (const gx of [-7.2, 7.8]) {
      ctx.beginPath();
      if (glasses.shape === "round") {
        ctx.arc(gx, -5.0, 6.2, 0, Math.PI * 2);
      } else {
        ctx.roundRect(gx - 6.2, -9.2, 12.4, 8.4, 2.2);
      }
      ctx.stroke();
      // Subtle lens reflection slash
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(gx - 3, -7.5);
      ctx.lineTo(gx + 1, -3.5);
      ctx.stroke();
      ctx.strokeStyle = glasses.color || "#ff7eb6";
      ctx.lineWidth = 2.0;
    }
    // Bridge
    ctx.beginPath();
    ctx.moveTo(-1.0, -5.2);
    ctx.lineTo(1.6, -5.2);
    ctx.stroke();
    ctx.restore();
  }

  // Front Hair Bangs, Side Framing Locks & Specular Anime Hair Halo
  ctx.save();
  if (hairStyle === "dreadlocks") {
    // Hood or crown cap + side dreadlock strands with warm highlights
    drawInkedPolygon(ctx, [[-21, -11], [-18, -26], [0, -29], [18, -26], [21, -11], [10, -16], [-10, -16]], "#141722", ink, 1.7, seed + 80, 0.08);
    for (const dx of [-18.5, -14.5, -10.5, 11, 15, 19]) {
      const sway = Math.sin(time * 2.4 + dx) * 2.5;
      drawInkedPolygon(
        ctx,
        [[dx - 2.6, -15], [dx + 2.6, -15], [dx + 3.2 + sway, 28], [dx - 2.2 + sway, 28]],
        dx < 0 ? hairShadow : hairBase,
        ink,
        1.3,
        seed + 85 + Math.round(dx),
        0.1
      );
    }
  } else {
    // Sculpted anime crown & bangs
    const crownPts = [
      [-20, -6],
      [-21, -21],
      [-8, -28],
      [8, -28],
      [21, -20],
      [20, -5],
      [13, -12],
      [5, -8],
      [0, -14],
      [-6, -7],
      [-14, -12],
    ];
    ctx.save();
    drawInkedPolygon(ctx, crownPts, hairBase, null, 0, seed + 90, 0.12);
    ctx.clip();
    // Signature Anime Specular Hair Halo Band
    ctx.fillStyle = hairHighlight;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.ellipse(2, -19, 15, 3.8, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawInkedPolygon(ctx, crownPts, null, ink, 1.7, seed + 90, 0.12);

    if (hairStyle === "silver_bun") {
      fillBristleCluster(ctx, -4, -31, 11, 9, hairBase, seed + 92, 5);
    } else if (hairStyle === "curly_long") {
      // Bouncy orange side curls framing cheeks
      for (const sx of [-19, 19]) {
        fillBristleCluster(ctx, sx, 2, 8.5, 14, sx < 0 ? hairBase : hairHighlight, seed + 93 + sx, 4);
      }
    }
  }
  if (outfit === "celestial_gown") {
    drawAnamorphicStarGlint(ctx, 0, -21, 16, 0.95, "#fde047");
  }
  ctx.restore();
  ctx.restore(); // End head

  // 7. Foreground Articulated Arm, Hand & Prop
  ctx.save();
  ctx.translate(18, -136 + breath);
  const fgRot =
    pose === "booth_phone"
      ? -0.68
      : pose === "grimoire"
      ? -0.58 - Math.sin(time * 2.5) * 0.12
      : pose === "plead"
      ? -0.85 + Math.sin(time * 3.2) * 0.1
      : -0.25 - armRaise * 0.75 + Math.sin(time * 2.0 + seed) * 0.06;
  ctx.rotate(fgRot);
  drawInkedPolygon(ctx, [[-7, 0], [8, 0], [7, 38], [-6, 38]], primaryColor, ink, 1.7, seed + 95, 0.1);

  if (hasBandageArm) {
    ctx.fillStyle = "#f8fafc";
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.2;
    ctx.fillRect(-6.5, 14, 13.5, 13);
    ctx.strokeRect(-6.5, 14, 13.5, 13);
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(0.5, 20.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sculpted Hand + Thumb
  ctx.fillStyle = skinBase;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(1, 42, 6.5, 7.5, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (pose === "booth_phone") {
    ctx.save();
    ctx.translate(8, 42);
    ctx.rotate(0.35);
    drawInkedPolygon(ctx, [[-6, -14], [8, -14], [8, 10], [-6, 10]], "#0f172a", "#38bdf8", 1.8, seed + 96, 0.05);
    ctx.fillStyle = "rgba(56, 189, 248, 0.34)";
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-28, -42);
    ctx.lineTo(20, -42);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (hasCondimentBottle) {
    ctx.save();
    ctx.translate(8, 42);
    ctx.rotate(1.15 + Math.sin(time * 4.2) * 0.15);
    drawInkedPolygon(ctx, [[-7, -16], [7, -16], [8, 12], [-8, 12]], "#f8fafc", ink, 1.5, seed + 97, 0.06);
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(-6, -5, 12, 9);
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(-4, -16);
    ctx.lineTo(4, -16);
    ctx.lineTo(1.5, -25);
    ctx.lineTo(-1.5, -25);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  ctx.restore();
}

/**
 * Draw a tactile, high-detail Felt & Flannel Muppet Relative (`S02`) with:
 * - Stippled bristle-brush fuzzy felt head & hands (`fillBristleCluster`)
 * - 3D domed hemisphere ping-pong-ball eyes with specular highlights and expressive felt eyelids
 * - Wide stitched felt mouth interior with felt tongue
 * - Detailed woven Tartan Plaid Flannel or Woodland Camouflage collared shirt with buttons
 */
export function drawMasterMuppetCharacter(ctx, x, y, scale = 1.0, opts = {}) {
  const {
    time = 0,
    facing = 1,
    speaking = false,
    feltColor = "#f97316",
    feltShadow = "#c2410c",
    feltHighlight = "#fdba74",
    shirtType = "flannel_red", // 'flannel_red' | 'camo' | 'flannel_gold' | 'white_tee'
    seed = 303,
  } = opts;

  const ink = "#18131e";
  const bob = Math.sin(time * 2.8 + seed) * 3.5;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(facing * scale, scale);

  // Legs
  for (const side of [-1, 1]) {
    drawInkedPolygon(
      ctx,
      [[side * 12 - 9, -68], [side * 12 + 9, -68], [side * 12 + 8, 0], [side * 12 - 8, 0]],
      side === -1 ? "#1e3a8a" : "#2563eb",
      ink,
      1.7,
      seed + side,
      0.08
    );
    drawInkedPolygon(
      ctx,
      [[side * 12 - 10, -10], [side * 12 + 12, -10], [side * 12 + 15, 2], [side * 12 - 10, 2]],
      "#292524",
      ink,
      1.6,
      seed + 10 + side,
      0.08
    );
  }

  // Torso with Detailed Woven Plaid Flannel or Woodland Camo
  const torsoPts = [[-28, -132], [28, -132], [30, -64], [-30, -64]];
  ctx.save();
  drawInkedPolygon(ctx, torsoPts, "#991b1b", null, 0, seed + 20, 0.1);
  ctx.clip();
  if (shirtType === "flannel_red" || shirtType === "flannel_gold") {
    const base = shirtType === "flannel_red" ? "#b91c1c" : "#d97706";
    const stripe = shirtType === "flannel_red" ? "rgba(15, 23, 42, 0.58)" : "rgba(69, 26, 3, 0.55)";
    ctx.fillStyle = base;
    ctx.fillRect(-34, -136, 68, 76);
    ctx.fillStyle = stripe;
    for (let sx = -28; sx <= 28; sx += 12) ctx.fillRect(sx, -136, 5, 76);
    for (let sy = -128; sy <= -66; sy += 12) ctx.fillRect(-34, sy, 68, 5);
    // Fine yellow/white tartan thread lines
    ctx.strokeStyle = "rgba(254, 240, 138, 0.45)";
    ctx.lineWidth = 1.0;
    for (let sx = -22; sx <= 26; sx += 12) {
      ctx.beginPath();
      ctx.moveTo(sx, -136);
      ctx.lineTo(sx, -60);
      ctx.stroke();
    }
  } else if (shirtType === "camo") {
    ctx.fillStyle = "#3f6212";
    ctx.fillRect(-34, -136, 68, 76);
    const rng = mulberry32(seed + 25);
    const cols = ["#1a2e05", "#713f12", "#65a30d", "#365314"];
    for (let i = 0; i < 16; i++) {
      fillBristleCluster(ctx, -26 + rng() * 52, -128 + rng() * 60, 11 + rng() * 8, 7 + rng() * 6, cols[i % 4], seed + i, 3);
    }
  } else {
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(-34, -136, 68, 76);
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(-34, -136, 22, 76);
  }
  // Shirt placket & buttons
  ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
  ctx.fillRect(-3, -132, 6, 68);
  for (const by of [-118, -102, -86, -72]) {
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.arc(0, by, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  drawInkedPolygon(ctx, torsoPts, null, ink, 1.9, seed + 20, 0.1);

  // Fuzzy Felt Arms with stitched fingers
  for (const side of [-1, 1]) {
    const wave = Math.sin(time * 3.2 + seed + side) * 6;
    ctx.strokeStyle = side === -1 ? feltShadow : feltColor;
    ctx.lineWidth = 11;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(side * 26, -122);
    ctx.quadraticCurveTo(side * 38, -96 + wave, side * 28, -70 + wave);
    ctx.stroke();
    fillBristleCluster(ctx, side * 28, -68 + wave, 8, 8, feltHighlight, seed + 30 + side, 4);
  }

  // Stippled Bristle-Brush Fuzzy Felt Head
  ctx.save();
  ctx.translate(0, -162);
  fillBristleCluster(ctx, -4, 2, 26, 25, feltShadow, seed + 40, 10);
  fillBristleCluster(ctx, 2, 0, 25, 24, feltColor, seed + 41, 12);
  fillBristleCluster(ctx, 6, -6, 14, 12, feltHighlight, seed + 42, 6);

  // Wide Hinged Puppet Mouth with Felt Tongue
  const mOpen = speaking ? 5 + Math.abs(Math.sin(time * 15 + seed)) * 7 : 4.5;
  ctx.fillStyle = "#450a0a";
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(2, 9, 15, mOpen, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fb7185";
  ctx.beginPath();
  ctx.ellipse(2, 9 + mOpen * 0.38, 9, mOpen * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Giant 3D Domed Ping-Pong-Ball Eyes
  for (const ex of [-8, 9]) {
    ctx.save();
    ctx.translate(ex, -15);
    const eyeGrad = ctx.createRadialGradient(-2, -3, 1, 0, 0, 10);
    eyeGrad.addColorStop(0, "#ffffff");
    eyeGrad.addColorStop(0.75, "#f1f5f9");
    eyeGrad.addColorStop(1, "#94a3b8");
    ctx.fillStyle = eyeGrad;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(0, 0, 9.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Felt upper eyelid
    ctx.fillStyle = feltShadow;
    ctx.beginPath();
    ctx.arc(0, 0, 9.2, Math.PI * 1.1, Math.PI * 1.9);
    ctx.closePath();
    ctx.fill();

    // Pupil + Specular Glint
    ctx.fillStyle = "#090d16";
    ctx.beginPath();
    ctx.arc(1.5, 0.5, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0.2, -1.2, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  ctx.restore();
}

// ============================================================================
// PAINTERLY ANIME ARCHITECTURAL & INTERIOR ENVIRONMENT BUILDERS
// ============================================================================

/**
 * Draw hand-painted log/plank timber walls with wood-grain rings, warm varnish highlights, and chinking shadows.
 */
export function drawPainterlyTimberWall(ctx, x, y, w, h, seed = 500) {
  const rng = mulberry32(seed);
  ctx.save();
  const baseGrad = ctx.createLinearGradient(x, y, x, y + h);
  baseGrad.addColorStop(0, "#23150d");
  baseGrad.addColorStop(0.5, "#3b2314");
  baseGrad.addColorStop(1, "#1e110a");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(x, y, w, h);

  const logH = 46;
  const rows = Math.ceil(h / logH);
  for (let r = 0; r < rows; r++) {
    const ly = y + r * logH;
    const logGrad = ctx.createLinearGradient(x, ly, x, ly + logH);
    logGrad.addColorStop(0, "#160d07");
    logGrad.addColorStop(0.22, r % 2 === 0 ? "#54341e" : "#4a2c18");
    logGrad.addColorStop(0.55, r % 2 === 0 ? "#3d2414" : "#361f11");
    logGrad.addColorStop(0.9, "#1c1009");
    logGrad.addColorStop(1, "#0f0804");
    ctx.fillStyle = logGrad;
    ctx.fillRect(x, ly, w, logH - 2);

    // Subtle wood-grain bezier lines & knots
    ctx.strokeStyle = "rgba(24, 13, 7, 0.42)";
    ctx.lineWidth = 1.3;
    for (let g = 0; g < 3; g++) {
      const gy = ly + 10 + g * 11;
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.bezierCurveTo(x + w * 0.33, gy + (rng() - 0.5) * 8, x + w * 0.66, gy + (rng() - 0.5) * 8, x + w, gy);
      ctx.stroke();
    }
    for (let k = 0; k < 2; k++) {
      const kx = x + (0.12 + rng() * 0.76) * w;
      const ky = ly + 14 + rng() * 18;
      ctx.fillStyle = "rgba(20, 11, 6, 0.55)";
      ctx.beginPath();
      ctx.ellipse(kx, ky, 14 + rng() * 10, 5 + rng() * 3, (rng() - 0.5) * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Draw a detailed sculpted oak-plaque taxidermy buck mount with multi-tine antlers and 3-tone cel shading.
 */
export function drawDetailedBuckTrophy(ctx, cx, cy, scale = 1.0, seed = 610) {
  const ink = "#18131e";
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Drop shadow on log wall
  ctx.fillStyle = "rgba(8, 5, 3, 0.48)";
  ctx.beginPath();
  ctx.ellipse(4, 8, 42, 48, 0, 0, Math.PI * 2);
  ctx.fill();

  // Carved heraldic oak shield plaque
  drawInkedPolygon(
    ctx,
    [[0, -44], [36, -30], [32, 22], [0, 44], [-32, 22], [-36, -30]],
    "#451a03",
    "#fbbf24",
    2.0,
    seed,
    0.08
  );
  drawInkedPolygon(
    ctx,
    [[0, -37], [29, -25], [26, 17], [0, 36], [-26, 17], [-29, -25]],
    "#78350f",
    ink,
    1.4,
    seed + 1,
    0.06
  );

  // Multi-tine antlers (left & right)
  for (const side of [-1, 1]) {
    ctx.strokeStyle = "#fef3c7";
    ctx.lineWidth = 4.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(side * 10, -18);
    ctx.quadraticCurveTo(side * 34, -46, side * 46, -68);
    ctx.moveTo(side * 22, -33);
    ctx.lineTo(side * 18, -56);
    ctx.moveTo(side * 32, -46);
    ctx.lineTo(side * 30, -70);
    ctx.moveTo(side * 38, -54);
    ctx.lineTo(side * 52, -52);
    ctx.stroke();
  }

  // Ears
  for (const side of [-1, 1]) {
    drawInkedPolygon(
      ctx,
      [[side * 12, -14], [side * 30, -24], [side * 26, -8], [side * 12, -6]],
      "#92400e",
      ink,
      1.5,
      seed + 2 + side,
      0.08
    );
  }

  // Sculpted Deer Neck, Head & Snout
  drawInkedPolygon(ctx, [[-16, -8], [16, -8], [20, 26], [-20, 26]], "#78350f", ink, 1.7, seed + 5, 0.1);
  drawInkedPolygon(ctx, [[-15, -20], [15, -20], [12, 12], [0, 19], [-12, 12]], "#a16207", ink, 1.8, seed + 6, 0.1);
  // Dark nose & glass eyes
  ctx.fillStyle = "#1c1917";
  ctx.beginPath();
  ctx.ellipse(0, 14, 5.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const side of [-1, 1]) {
    ctx.fillStyle = "#1c1917";
    ctx.beginPath();
    ctx.arc(side * 8.5, -5, 3.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(side * 8.5 - 0.8, -6, 1.0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draw a painterly river-stone lodge fireplace with flickering anime hearth flames and warm glow.
 */
export function drawPainterlyStoneHearth(ctx, x, y, w, h, time = 0, seed = 650) {
  const rng = mulberry32(seed);
  const ink = "#18131e";
  ctx.save();

  // Chimney stonework base
  drawInkedPolygon(ctx, [[x, y], [x + w, y], [x + w + 14, y + h], [x - 14, y + h]], "#334155", ink, 2.2, seed, 0.06);

  // Individual cel-shaded river stones
  const cols = ["#475569", "#64748b", "#334155", "#52525b", "#3f3f46"];
  for (let ry = y + 18; ry < y + h - 30; ry += 34) {
    for (let rx = x + 16; rx < x + w - 20; rx += 44) {
      const sw = 32 + rng() * 14;
      const sh = 22 + rng() * 8;
      drawInkedPolygon(
        ctx,
        [[rx, ry], [rx + sw, ry + 2], [rx + sw - 2, ry + sh], [rx + 2, ry + sh - 1]],
        cols[Math.floor(rng() * cols.length)],
        ink,
        1.4,
        seed + rx + ry,
        0.12
      );
    }
  }

  // Heavy hewn timber mantel beam
  drawInkedPolygon(
    ctx,
    [[x - 22, y + h * 0.42], [x + w + 22, y + h * 0.42], [x + w + 18, y + h * 0.50], [x - 18, y + h * 0.50]],
    "#451a03",
    ink,
    2.0,
    seed + 99,
    0.08
  );

  // Arched firebox opening
  const fx = x + w * 0.18;
  const fy = y + h * 0.55;
  const fw = w * 0.64;
  const fh = h * 0.45;
  ctx.fillStyle = "#090a0f";
  ctx.beginPath();
  ctx.roundRect(fx, fy, fw, fh, [40, 40, 4, 4]);
  ctx.fill();

  // Glowing anime hearth fire & warm radial spill
  const fireGlow = ctx.createRadialGradient(fx + fw * 0.5, fy + fh * 0.75, 8, fx + fw * 0.5, fy + fh * 0.75, fw * 1.4);
  fireGlow.addColorStop(0, "rgba(251, 191, 36, 0.65)");
  fireGlow.addColorStop(0.45, "rgba(234, 88, 12, 0.28)");
  fireGlow.addColorStop(1, "rgba(234, 88, 12, 0)");
  ctx.fillStyle = fireGlow;
  ctx.beginPath();
  ctx.arc(fx + fw * 0.5, fy + fh * 0.75, fw * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Charred logs & multi-layered dancing anime flames
  drawInkedPolygon(ctx, [[fx + 18, fy + fh - 18], [fx + fw - 18, fy + fh - 12], [fx + fw - 22, fy + fh - 2], [fx + 14, fy + fh - 6]], "#27170e", ink, 1.5, seed + 101, 0.08);
  for (let f = 0; f < 5; f++) {
    const flx = fx + fw * (0.25 + f * 0.125);
    const sway = Math.sin(time * 7.5 + f * 1.3) * 8;
    const flh = 34 + (f % 2) * 18 + Math.cos(time * 9.0 + f) * 6;
    ctx.fillStyle = f % 2 === 0 ? "#f97316" : "#fde047";
    ctx.beginPath();
    ctx.moveTo(flx - 14, fy + fh - 10);
    ctx.quadraticCurveTo(flx + sway, fy + fh - 10 - flh, flx + sway * 0.5, fy + fh - 14 - flh * 1.15);
    ctx.quadraticCurveTo(flx + 14, fy + fh - 10 - flh * 0.4, flx + 14, fy + fh - 10);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draw an ornate arched bookshelf section packed with individually colored leather-bound tomes & glowing potion jars.
 */
export function drawPainterlyBookshelfSection(ctx, x, y, w, h, seed = 710) {
  const rng = mulberry32(seed);
  const ink = "#18131e";
  ctx.save();

  // Recessed dark oak bookcase frame
  drawInkedPolygon(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], "#1e120a", ink, 2.0, seed, 0.04);
  ctx.fillStyle = "#120a05";
  ctx.fillRect(x + 10, y + 12, w - 20, h - 24);

  const bookColors = ["#7f1d1d", "#1e3a8a", "#14532d", "#581c87", "#78350f", "#0f766e", "#9a3412", "#312e81"];
  const shelfCount = 6;
  const shelfH = (h - 28) / shelfCount;

  for (let s = 0; s < shelfCount; s++) {
    const sy = y + 14 + (s + 1) * shelfH;
    // Books or alchemical jars on this shelf
    let bx = x + 14;
    while (bx < x + w - 28) {
      if (rng() > 0.86 && bx < x + w - 50) {
        // Glowing glass potion flask
        const jarCol = rng() > 0.5 ? "#2dd4bf" : "#c084fc";
        ctx.fillStyle = jarCol;
        ctx.beginPath();
        ctx.arc(bx + 12, sy - 16, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        bx += 28;
      } else {
        const bw = 11 + Math.floor(rng() * 10);
        const bh = shelfH * (0.64 + rng() * 0.26);
        const bCol = bookColors[Math.floor(rng() * bookColors.length)];
        ctx.fillStyle = bCol;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.1;
        ctx.fillRect(bx, sy - bh, bw, bh);
        ctx.strokeRect(bx, sy - bh, bw, bh);
        // Gold spine foil rib
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(bx + 2, sy - bh + 6, bw - 4, 2);
        ctx.fillRect(bx + 2, sy - 10, bw - 4, 2);
        bx += bw + 1;
      }
    }
    // Carved oak shelf plank
    ctx.fillStyle = "#451a03";
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.4;
    ctx.fillRect(x + 8, sy - 2, w - 16, 8);
    ctx.strokeRect(x + 8, sy - 2, w - 16, 8);
  }
  ctx.restore();
}

/**
 * Draw a grand cathedral / palace arched window with twilight starry sky, distant city/mountain silhouette,
 * and velvet drapery with gold tassels.
 */
export function drawPainterlyArchedWindow(ctx, cx, cy, w, h, time = 0, seed = 820) {
  const rng = mulberry32(seed);
  const ink = "#18131e";
  ctx.save();
  ctx.translate(cx, cy);

  const hw = w * 0.5;
  const hh = h * 0.5;

  // Window path (arched top)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-hw, hh);
  ctx.lineTo(-hw, -hh + hw);
  ctx.arc(0, -hh + hw, hw, Math.PI, 0, false);
  ctx.lineTo(hw, hh);
  ctx.closePath();

  // Night sky gradient inside window
  const skyGrad = ctx.createLinearGradient(0, -hh, 0, hh);
  skyGrad.addColorStop(0, "#090d24");
  skyGrad.addColorStop(0.55, "#1e1b4b");
  skyGrad.addColorStop(1, "#312e81");
  ctx.fillStyle = skyGrad;
  ctx.fill();
  ctx.clip();

  // Twinkling stars & crescent moon
  for (let i = 0; i < 18; i++) {
    const sx = (rng() - 0.5) * w * 0.85;
    const sy = -hh + rng() * h * 0.65;
    const alpha = 0.4 + 0.5 * Math.sin(time * 2.5 + i);
    ctx.fillStyle = `rgba(254, 249, 195, ${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.4 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant painterly skyline / mountains
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.moveTo(-hw, hh);
  for (let x = -hw; x <= hw; x += 24) {
    const bh = 28 + ((Math.abs(x * 7 + seed) % 55));
    ctx.lineTo(x, hh - bh);
    ctx.lineTo(x + 20, hh - bh);
  }
  ctx.lineTo(hw, hh);
  ctx.closePath();
  ctx.fill();

  // Warm lit city windows
  ctx.fillStyle = "rgba(253, 224, 71, 0.7)";
  for (let i = 0; i < 22; i++) {
    const wx = -hw + 14 + rng() * (w - 28);
    const wy = hh - 10 - rng() * 42;
    ctx.fillRect(wx, wy, 3, 4);
  }

  // Mullion lead panes
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -hh);
  ctx.lineTo(0, hh);
  ctx.moveTo(-hw, -hh * 0.15);
  ctx.lineTo(hw, -hh * 0.15);
  ctx.moveTo(-hw, hh * 0.38);
  ctx.lineTo(hw, hh * 0.38);
  ctx.stroke();
  ctx.restore();

  // Outer gilded arch molding
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 5.0;
  ctx.beginPath();
  ctx.moveTo(-hw, hh);
  ctx.lineTo(-hw, -hh + hw);
  ctx.arc(0, -hh + hw, hw, Math.PI, 0, false);
  ctx.lineTo(hw, hh);
  ctx.closePath();
  ctx.stroke();

  // Rich crimson velvet side curtains with gold tie-backs
  for (const side of [-1, 1]) {
    const cPts = [
      [side * (hw - 6), -hh + hw * 0.4],
      [side * (hw + 26), -hh + hw * 0.4],
      [side * (hw + 32), hh + 12],
      [side * (hw - 2), hh + 12],
      [side * (hw - 22), hh * 0.25],
    ];
    drawInkedPolygon(ctx, cPts, side === -1 ? "#7f1d1d" : "#991b1b", ink, 1.8, seed + 10 + side, 0.12);
    // Gold tie-back tassel
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(side * (hw - 22), hh * 0.25);
    ctx.lineTo(side * (hw + 28), hh * 0.28);
    ctx.stroke();
  }

  ctx.restore();
}

