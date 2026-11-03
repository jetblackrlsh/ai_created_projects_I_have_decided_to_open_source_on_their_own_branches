/**
 * High-Detail 2D Canvas Engine for "The Awakening of Mosaic" (v2 Director's Cut)
 *
 * Implements:
 * - 5-Layer High-Detail Environments (Parallax Megacity, Terraced Ridge, Watchtower Trusses,
 *   Subterranean Bunker Conduits, Server Racks, Gantry Cranes, Firewall Barrier, Vault Pillars)
 * - 14+ Part Sculpted Humanoid Rigs (Tapered armored limbs, knee/elbow guards, pauldrons,
 *   utility belt, chestplate core, collar, contoured head/jaw, multi-lock hair, eyes/visor reticle,
 *   speech-reactive mouth, hydraulic gauntlets, and magnetic boot clamps)
 * - 28-Piece Interlocking Polyhedral Titan Rig for Mosaic + Tracked M-04 + Faceted ARCHITECT-S2
 * - Kinetic Action FX (Dynamic Camera Zoom/Pan/Shake, Speed-Lines, Lightning After-Images,
 *   Welding Spark Showers, Plasma Dodgeball Trajectory, and Shockwave Rings)
 *
 * Works identically in browser <canvas> and Node.js @napi-rs/canvas for deterministic 24fps MP4 export.
 */

export const SPEAKER_PALETTE = {
  Narrator: { badge: "#334155", border: "#94a3b8", text: "#f8fafc", glow: "#64748b" },
  Traveler: { badge: "#0369a1", border: "#38bdf8", text: "#e0f2fe", glow: "#0ea5e9" },
  "Astral Warden": { badge: "#6b21a8", border: "#c084fc", text: "#f3e8ff", glow: "#a855f7" },
  Velocity: { badge: "#854d0e", border: "#facc15", text: "#fef9c3", glow: "#eab308" },
  "Aegis Prime": { badge: "#9a3412", border: "#fb923c", text: "#ffedd5", glow: "#f97316" },
  ARCHITECT: { badge: "#115e59", border: "#2dd4bf", text: "#ccfbf1", glow: "#14b8a6" },
  "ARCHITECT-S1": { badge: "#166534", border: "#4ade80", text: "#dcfce7", glow: "#22c55e" },
  Mosaic: { badge: "#831843", border: "#f472b6", text: "#fce7f3", glow: "#ec4899" },
  "ARCHITECT-S2": { badge: "#4c1d95", border: "#a78bfa", text: "#ede9fe", glow: "#8b5cf6" },
};

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, Math.abs(w) * 0.5, Math.abs(h) * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function bevelPolygon(ctx, pts, fill, stroke, lineWidth = 2) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/**
 * Draw a sculpted, tapered anatomical/armored limb segment with inner panel bevel & joint cap
 */
function drawSculptedSegment(ctx, x1, y1, x2, y2, w1, w2, fill, stroke, highlight, addPiston = false) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1 + nx * w1 * 0.5, y1 + ny * w1 * 0.5);
  ctx.lineTo(x2 + nx * w2 * 0.5, y2 + ny * w2 * 0.5);
  ctx.lineTo(x2 - nx * w2 * 0.5, y2 - ny * w2 * 0.5);
  ctx.lineTo(x1 - nx * w1 * 0.5, y1 - ny * w1 * 0.5);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Inner armor seam highlight
  if (highlight) {
    ctx.strokeStyle = highlight;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x1 + nx * w1 * 0.18, y1 + ny * w1 * 0.18);
    ctx.lineTo(x2 + nx * w2 * 0.18, y2 + ny * w2 * 0.18);
    ctx.stroke();
  }

  // Hydraulic exosuit piston rail
  if (addPiston) {
    ctx.strokeStyle = "#e0f2fe";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1 - nx * (w1 * 0.48), y1 - ny * (w1 * 0.48));
    ctx.lineTo(x2 - nx * (w2 * 0.48), y2 - ny * (w2 * 0.48));
    ctx.stroke();
  }

  // Joint cap at origin
  ctx.fillStyle = stroke;
  ctx.beginPath();
  ctx.arc(x1, y1, w1 * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draw kinetic speed lines or radial shockwave bursts for high-energy action beats
 */
function drawKineticSpeedLines(ctx, width, height, time, color = "rgba(56, 189, 248, 0.28)", mode = "horizontal") {
  ctx.save();
  ctx.strokeStyle = color;
  if (mode === "horizontal") {
    for (let i = 0; i < 22; i++) {
      const y = ((i * 53 + time * 90) % (height - 220)) + 60;
      const xStart = ((i * 197 + time * 1600) % (width + 400)) - 200;
      const len = 140 + (i % 5) * 65;
      ctx.lineWidth = 1.5 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(xStart, y);
      ctx.lineTo(xStart - len, y);
      ctx.stroke();
    }
  } else {
    // Radial impact lines around center
    const cx = width * 0.5;
    const cy = height * 0.48;
    for (let i = 0; i < 28; i++) {
      const a = (i * Math.PI * 2) / 28 + Math.sin(time * 4) * 0.04;
      const r1 = 360 + ((i * 29 + time * 420) % 240);
      const r2 = r1 + 110 + (i % 4) * 35;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Draw electric lightning arcs between two points (for Velocity & Welding/Firewall FX)
 */
function drawLightningArc(ctx, x1, y1, x2, y2, time, color = "#fde047", width = 2.5, seed = 1) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const steps = 7;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const jitter = Math.sin(time * 38 + i * 4.7 + seed * 9.1) * 16;
    const px = lerp(x1, x2, t) + jitter * 0.5;
    const py = lerp(y1, y2, t) + jitter;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a 14+ Part High-Detail Sculpted Humanoid Character Rig
 * (Traveler, Velocity, Aegis Prime, Astral Warden, Courier)
 */
export function drawHumanoidRig(ctx, opts) {
  const {
    x,
    y,
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

  const breath = Math.sin(time * 3.0) * 2.5;
  const palettes = {
    Traveler: {
      suit: hasExosuit ? "#1e3a8a" : "#1e293b",
      suitDark: hasExosuit ? "#172554" : "#0f172a",
      trim: hasExosuit ? "#38bdf8" : "#64748b",
      glow: hasExosuit ? "#7dd3fc" : "#94a3b8",
      skin: "#f1c27d",
      skinShade: "#d4a359",
      hair: "#0f172a",
      hairHi: "#334155",
      visor: hasExosuit ? "rgba(56, 189, 248, 0.78)" : null,
      cape: hasExosuit ? "#0284c7" : "#334155",
      capeInner: hasExosuit ? "#0369a1" : "#1e293b",
      eyeColor: "#38bdf8",
    },
    Velocity: {
      suit: "#991b1b",
      suitDark: "#450a0a",
      trim: "#facc15",
      glow: "#fef08a",
      skin: "#f5cba7",
      skinShade: "#d9a77c",
      hair: "#fde047",
      hairHi: "#fef9c3",
      visor: "rgba(250, 204, 21, 0.85)",
      cape: "#eab308",
      capeInner: "#ca8a04",
      eyeColor: "#facc15",
    },
    "Aegis Prime": {
      suit: "#431407",
      suitDark: "#270a03",
      trim: "#fb923c",
      glow: "#fdba74",
      skin: "#e0ac69",
      skinShade: "#b88343",
      hair: "#e2e8f0",
      hairHi: "#ffffff",
      visor: "rgba(251, 146, 60, 0.72)",
      cape: "#ea580c",
      capeInner: "#9a3412",
      eyeColor: "#fb923c",
    },
    "Astral Warden": {
      suit: "#3b0764",
      suitDark: "#1e0338",
      trim: "#c084fc",
      glow: "#e9d5ff",
      skin: "#e2e8f0",
      skinShade: "#94a3b8",
      hair: "#f3e8ff",
      hairHi: "#ffffff",
      visor: "rgba(216, 180, 254, 0.82)",
      cape: "#7e22ce",
      capeInner: "#581c87",
      eyeColor: "#e879f9",
    },
    Courier: {
      suit: "#334155",
      suitDark: "#1e293b",
      trim: "#38bdf8",
      glow: "#7dd3fc",
      skin: "#f1c27d",
      skinShade: "#d4a359",
      hair: "#475569",
      hairHi: "#64748b",
      visor: "rgba(56, 189, 248, 0.65)",
      cape: "#1e293b",
      capeInner: "#0f172a",
      eyeColor: "#38bdf8",
    },
  };
  const pal = palettes[character] || palettes.Traveler;

  // Joint Kinematics (ground at y = 0, hip around y = -102)
  let hipY = -102 + breath * 0.4;
  let torsoTilt = 0.0;
  let headNod = Math.sin(time * 2.4) * 0.04 + (talkEnergy > 0.1 ? Math.sin(time * 16) * 0.05 : 0);
  let lKnee = { x: -16, y: -52 }, lFoot = { x: -20, y: 0 };
  let rKnee = { x: 18, y: -52 }, rFoot = { x: 22, y: 0 };
  let lElbow = { x: -30, y: -134 }, lHand = { x: -36, y: -96 };
  let rElbow = { x: 30, y: -134 }, rHand = { x: 40, y: -100 };

  if (pose === "walk" || pose === "run") {
    const spd = pose === "run" ? 11.5 : 4.8;
    const amp = pose === "run" ? 34 : 18;
    const s = Math.sin(time * spd);
    const c = Math.cos(time * spd);
    torsoTilt = pose === "run" ? 0.28 : 0.08;
    hipY = -98 + Math.abs(s) * (pose === "run" ? 7 : 3);
    lKnee = { x: -10 + s * amp * 0.75, y: -54 - Math.max(0, c) * 14 };
    lFoot = { x: -14 + s * amp, y: Math.min(0, c * 14) };
    rKnee = { x: 10 - s * amp * 0.75, y: -54 - Math.max(0, -c) * 14 };
    rFoot = { x: 14 - s * amp, y: Math.min(0, -c * 14) };
    lElbow = { x: -20 - s * amp * 0.55, y: -130 };
    lHand = { x: -10 - s * amp * 0.9, y: -100 };
    rElbow = { x: 20 + s * amp * 0.55, y: -130 };
    rHand = { x: 28 + s * amp * 0.9, y: -104 };
  } else if (pose === "point" || pose === "terminal") {
    torsoTilt = 0.05;
    rElbow = { x: 38, y: -148 };
    rHand = { x: 70, y: -156 + Math.sin(time * 5) * 3 };
    lElbow = { x: -28, y: -132 };
    lHand = { x: -22, y: -98 };
  } else if (pose === "lift") {
    hipY = -86;
    torsoTilt = 0.16;
    lKnee = { x: -26, y: -44 };
    lFoot = { x: -30, y: 0 };
    rKnee = { x: 28, y: -44 };
    rFoot = { x: 32, y: 0 };
    lElbow = { x: -28, y: -168 };
    lHand = { x: -20, y: -206 };
    rElbow = { x: 32, y: -168 };
    rHand = { x: 26, y: -206 };
  } else if (pose === "catch" || pose === "throw") {
    torsoTilt = -0.14;
    hipY = -94;
    lKnee = { x: -24, y: -48 };
    lFoot = { x: -32, y: 0 };
    rKnee = { x: 24, y: -48 };
    rFoot = { x: 30, y: 0 };
    lElbow = { x: 26, y: -158 };
    lHand = { x: 60, y: -168 };
    rElbow = { x: 40, y: -148 };
    rHand = { x: 76, y: -158 };
  } else if (pose === "clamp") {
    hipY = -88;
    torsoTilt = 0.22;
    lKnee = { x: -28, y: -46 };
    lFoot = { x: -34, y: 0 };
    rKnee = { x: 30, y: -46 };
    rFoot = { x: 36, y: 0 };
    lElbow = { x: -34, y: -140 };
    lHand = { x: -46, y: -116 };
    rElbow = { x: 36, y: -150 };
    rHand = { x: 58, y: -144 };
  } else if (pose === "pinned") {
    hipY = -36;
    torsoTilt = 1.18;
    lKnee = { x: -48, y: -18 };
    lFoot = { x: -82, y: -6 };
    rKnee = { x: -36, y: -12 };
    rFoot = { x: -70, y: 0 };
    rElbow = { x: 30, y: -54 };
    rHand = { x: 58, y: -28 };
  }

  // Ground contact shadow
  if (!isHologram) {
    const shGrad = ctx.createRadialGradient(0, 4, 4, 0, 4, 52);
    shGrad.addColorStop(0, "rgba(2, 6, 23, 0.72)");
    shGrad.addColorStop(1, "rgba(2, 6, 23, 0)");
    ctx.fillStyle = shGrad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 50, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 1. Multi-Wave Dynamic Cloth Cape / Coat Tail / Speedster Ribbon
  ctx.save();
  const w1 = Math.sin(time * 5.5) * 14 + (pose === "run" ? -28 : 0);
  const w2 = Math.cos(time * 4.8) * 10 + (pose === "run" ? -36 : 0);
  ctx.fillStyle = pal.capeInner;
  ctx.beginPath();
  ctx.moveTo(-14, hipY - 66);
  ctx.bezierCurveTo(-46 + w1 * 0.6, hipY - 30, -56 + w1, hipY + 12, -48 + w2, hipY + 46);
  ctx.lineTo(-10, hipY + 34);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = pal.cape;
  ctx.strokeStyle = pal.trim;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-10, hipY - 68);
  ctx.bezierCurveTo(-38 + w1 * 0.5, hipY - 34, -46 + w1 * 0.9, hipY + 8, -36 + w2, hipY + 42);
  ctx.lineTo(-6, hipY + 28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 2. Sculpted Thighs, Knee Guards & Shin Greaves
  const thighW = hasExosuit ? 22 : 17;
  const shinW = hasExosuit ? 18 : 14;
  // Left leg (back)
  drawSculptedSegment(ctx, -11, hipY, lKnee.x, lKnee.y, thighW, thighW * 0.8, pal.suitDark, pal.trim, pal.glow, hasExosuit);
  drawSculptedSegment(ctx, lKnee.x, lKnee.y, lFoot.x, lFoot.y - 6, shinW, shinW * 0.72, pal.suit, pal.trim, pal.glow, hasExosuit);
  // Right leg (front)
  drawSculptedSegment(ctx, 11, hipY, rKnee.x, rKnee.y, thighW, thighW * 0.8, pal.suit, pal.trim, pal.glow, hasExosuit);
  drawSculptedSegment(ctx, rKnee.x, rKnee.y, rFoot.x, rFoot.y - 6, shinW, shinW * 0.72, pal.suit, pal.trim, pal.glow, hasExosuit);

  // Polyhedral Knee Guards
  for (const kn of [lKnee, rKnee]) {
    bevelPolygon(
      ctx,
      [
        [kn.x, kn.y - 10],
        [kn.x + 9, kn.y],
        [kn.x, kn.y + 10],
        [kn.x - 8, kn.y],
      ],
      pal.suitDark,
      pal.trim,
      2
    );
  }

  // 3. Armored Boots & Electromagnetic Traction Clamps
  for (const ft of [lFoot, rFoot]) {
    ctx.save();
    ctx.translate(ft.x, ft.y);
    bevelPolygon(
      ctx,
      [
        [-12, -12],
        [12, -10],
        [22, 0],
        [20, 4],
        [-14, 4],
      ],
      hasBootClamps ? "#0284c7" : pal.suitDark,
      hasBootClamps ? "#38bdf8" : pal.trim,
      2.2
    );
    if (hasBootClamps) {
      // Glowing electromagnetic clamp claws & plasma grip arcs
      ctx.strokeStyle = "#7dd3fc";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(3, 2, 18 + Math.sin(time * 14) * 3, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(-14, 1, 6, 5);
      ctx.fillRect(16, 1, 6, 5);
    }
    ctx.restore();
  }

  // 4. Torso, Utility Belt, Chestplate, Pauldrons, Arms & Head
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(torsoTilt);

  // Back Arm (Upper Arm + Elbow Guard + Forearm + Hand)
  const armW = hasExosuit ? 17 : 13;
  drawSculptedSegment(ctx, -20, -62, lElbow.x, lElbow.y - hipY, armW, armW * 0.82, pal.suitDark, pal.trim, null, hasExosuit);
  drawSculptedSegment(ctx, lElbow.x, lElbow.y - hipY, lHand.x, lHand.y - hipY, armW * 0.85, armW * 0.7, pal.suit, pal.trim, pal.glow, hasExosuit);
  ctx.fillStyle = hasExosuit ? pal.trim : pal.skin;
  ctx.beginPath();
  ctx.arc(lHand.x, lHand.y - hipY, 6, 0, Math.PI * 2);
  ctx.fill();

  // Sculpted Multi-Plate Torso Chassis
  bevelPolygon(
    ctx,
    [
      [-28, -68],
      [28, -68],
      [22, -26],
      [17, 6],
      [-17, 6],
      [-22, -26],
    ],
    pal.suit,
    pal.trim,
    hasExosuit ? 3.2 : 2.2
  );

  // Inner abdominal & rib armor panel seams
  ctx.strokeStyle = pal.glow;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-18, -50);
  ctx.lineTo(-8, -32);
  ctx.lineTo(-10, -8);
  ctx.moveTo(18, -50);
  ctx.lineTo(8, -32);
  ctx.lineTo(10, -8);
  ctx.stroke();

  // Utility Belt with Pouches & Central Buckle
  roundRectPath(ctx, -20, -4, 40, 11, 3);
  ctx.fillStyle = pal.suitDark;
  ctx.fill();
  ctx.strokeStyle = pal.trim;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = pal.glow;
  ctx.fillRect(-5, -2, 10, 7);

  // Layered Shoulder Pauldrons
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 25, -62);
    ctx.rotate(side * 0.18);
    bevelPolygon(
      ctx,
      [
        [-12, -10],
        [12, -10],
        [16, 8],
        [-14, 8],
      ],
      pal.suitDark,
      pal.trim,
      2.4
    );
    ctx.restore();
  }

  // Character-Specific Chest Core / Emblem
  if (hasExosuit || character === "Aegis Prime") {
    const coreR = 10 + talkEnergy * 2.5;
    const cg = ctx.createRadialGradient(0, -42, 2, 0, -42, coreR * 1.8);
    cg.addColorStop(0, "#ffffff");
    cg.addColorStop(0.5, pal.trim);
    cg.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, -42, coreR * 1.8, 0, Math.PI * 2);
    ctx.fill();

    bevelPolygon(
      ctx,
      [
        [0, -53],
        [11, -42],
        [0, -31],
        [-11, -42],
      ],
      "#e0f2fe",
      pal.trim,
      2
    );
  } else if (character === "Velocity") {
    // Sculpted Gold Lightning Emblem
    bevelPolygon(
      ctx,
      [
        [5, -58],
        [-9, -38],
        [1, -38],
        [-5, -18],
        [11, -41],
        [1, -41],
      ],
      "#fde047",
      "#ffffff",
      1.5
    );
  } else if (character === "Astral Warden") {
    // Cosmic Star Sigil
    bevelPolygon(
      ctx,
      [
        [0, -56],
        [6, -44],
        [18, -42],
        [6, -38],
        [0, -26],
        [-6, -38],
        [-18, -42],
        [-6, -44],
      ],
      "#e9d5ff",
      "#c084fc",
      1.5
    );
  }

  // 5. Armored Collar, Neck & Contoured Head with Facial Features
  ctx.save();
  ctx.translate(0, -74);
  ctx.rotate(headNod);

  // Collar & Neck
  bevelPolygon(ctx, [[-14, 6], [14, 6], [10, -6], [-10, -6]], pal.suitDark, pal.trim, 2);
  ctx.fillStyle = pal.skinShade;
  ctx.fillRect(-6, -14, 12, 10);

  // Sculpted Head & Jawline
  ctx.translate(0, -18);
  ctx.fillStyle = pal.skin;
  ctx.strokeStyle = pal.skinShade;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-16, -14);
  ctx.quadraticCurveTo(0, -24, 17, -14);
  ctx.lineTo(18, 2);
  ctx.quadraticCurveTo(15, 16, 4, 19);
  ctx.lineTo(-6, 18);
  ctx.quadraticCurveTo(-17, 12, -16, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Ear & Cheek highlight
  ctx.fillStyle = pal.skinShade;
  ctx.beginPath();
  ctx.ellipse(-14, 1, 3.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows & Layered Eyes (Sclera, Iris, Pupil, Specular)
  const browLift = talkEnergy > 0.15 ? -2.2 : 0;
  ctx.strokeStyle = pal.hair;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(1, -8 + browLift);
  ctx.lineTo(14, -9 + browLift * 0.5);
  ctx.stroke();

  // Sclera
  ctx.fillStyle = "#ffffff";
  roundRectPath(ctx, 2, -5, 11, 6, 2.5);
  ctx.fill();
  // Iris & Pupil
  ctx.fillStyle = pal.eyeColor;
  ctx.beginPath();
  ctx.arc(9, -2, 2.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#020617";
  ctx.beginPath();
  ctx.arc(9.5, -2, 1.3, 0, Math.PI * 2);
  ctx.fill();
  // Eye Specular Glint
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(8.2, -3.2, 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Translucent HUD Visor & Reticle (when equipped)
  if (pal.visor) {
    ctx.save();
    ctx.fillStyle = pal.visor;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.4;
    roundRectPath(ctx, -4, -9, 24, 11, 4);
    ctx.fill();
    ctx.stroke();
    // Target reticle line inside visor
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    const rx = 6 + Math.sin(time * 5) * 4;
    ctx.beginPath();
    ctx.moveTo(rx, -8);
    ctx.lineTo(rx, 1);
    ctx.stroke();
    ctx.restore();
  }

  // Nose & Speech-Reactive Mouth / Jaw
  ctx.strokeStyle = pal.skinShade;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(14, -1);
  ctx.lineTo(17, 4);
  ctx.lineTo(13, 5);
  ctx.stroke();

  const mouthOpen = clamp(talkEnergy * 8.5, 1.2, 8.0);
  ctx.fillStyle = talkEnergy > 0.08 ? "#7f1d1d" : "#475569";
  roundRectPath(ctx, 4, 9 - mouthOpen * 0.3, 10, mouthOpen, 2);
  ctx.fill();
  if (talkEnergy > 0.12) {
    // Upper teeth glint
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(5, 9 - mouthOpen * 0.3, 8, 2);
  }

  // Multi-Lock Sculpted Hair / Aerodynamic Crest
  ctx.fillStyle = pal.hair;
  ctx.strokeStyle = pal.hairHi;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-18, -4);
  ctx.quadraticCurveTo(-22, -22, -2, -25);
  ctx.lineTo(14, -22);
  ctx.lineTo(8, -14);
  ctx.lineTo(18, -15);
  ctx.lineTo(6, -9);
  ctx.lineTo(-10, -11);
  ctx.lineTo(-16, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 6. Shoulder Companion ARCHITECT-S2 (Scene 11)
  if (hasShoulderBot) {
    drawMiniShapeshifterRig(ctx, -28, -92, 0.56, time, "bot", talkEnergy);
  }

  // 7. Front Arm, Hydraulic Gauntlet & Air-Gapped Wristband (ARCHITECT-S1)
  drawSculptedSegment(ctx, 18, -62, rElbow.x, rElbow.y - hipY, armW, armW * 0.82, pal.suit, pal.trim, pal.glow, hasExosuit);
  drawSculptedSegment(ctx, rElbow.x, rElbow.y - hipY, rHand.x, rHand.y - hipY, armW * 0.88, armW * 0.72, pal.suit, pal.trim, pal.glow, hasExosuit);

  // Sculpted Hand / Gauntlet Knuckles
  ctx.fillStyle = hasExosuit ? pal.trim : pal.skin;
  ctx.strokeStyle = pal.suitDark;
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, rHand.x - 6, rHand.y - hipY - 6, 13, 12, 4);
  ctx.fill();
  ctx.stroke();

  if (hasWristband) {
    const wx = lerp(rElbow.x, rHand.x, 0.72);
    const wy = lerp(rElbow.y - hipY, rHand.y - hipY, 0.72);
    ctx.save();
    ctx.translate(wx, wy);
    ctx.fillStyle = "#166534";
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 2.2;
    roundRectPath(ctx, -7, -6, 14, 12, 4);
    ctx.fill();
    ctx.stroke();
    // Glowing emerald AI core & holo-ring
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(74, 222, 128, 0.65)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, -14, 14, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Courier's Sealed Silver Cylinder Prop
  if (character === "Courier") {
    ctx.save();
    ctx.translate(rHand.x, rHand.y - hipY);
    ctx.fillStyle = "#e2e8f0";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.2;
    roundRectPath(ctx, -10, -10, 32, 14, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(-2, -8, 16, 4);
    ctx.restore();
  }

  // Velocity's Crackling Golden Aura
  if (character === "Velocity" && !isHologram) {
    drawLightningArc(ctx, -26, -70, -52, -30, time, "#fde047", 2.2, 1);
    drawLightningArc(ctx, 20, -40, -35, 0, time, "#facc15", 2.0, 2);
  }

  ctx.restore();

  // Holographic Scanline & Glitch Overlay
  if (isHologram) {
    ctx.save();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.38)";
    ctx.lineWidth = 1.5;
    for (let sy = -200; sy <= 0; sy += 7) {
      ctx.beginPath();
      ctx.moveTo(-46, sy);
      ctx.lineTo(46, sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draw High-Detail Tracked Maintenance Robot M-04
 */
export function drawRobotM04(ctx, x, y, scale, time, active = true, lifting = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const bob = active ? Math.sin(time * 5.0) * 3 : (Math.sin(time * 22) * 2);
  ctx.fillStyle = "rgba(2, 6, 23, 0.6)";
  ctx.beginPath();
  ctx.ellipse(0, 4, 42, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Caterpillar Treads & Bogie Wheels
  ctx.fillStyle = "#1e293b";
  ctx.strokeStyle = active ? "#38bdf8" : "#f59e0b";
  ctx.lineWidth = 2.5;
  roundRectPath(ctx, -36, -28, 72, 28, 10);
  ctx.fill();
  ctx.stroke();
  for (const wx of [-22, 0, 22]) {
    ctx.fillStyle = "#475569";
    ctx.beginPath();
    ctx.arc(wx, -14, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Articulated Chassis & Sensor Mast
  ctx.translate(0, bob);
  bevelPolygon(
    ctx,
    [
      [-34, -96],
      [34, -96],
      [40, -32],
      [-40, -32],
    ],
    "#334155",
    active ? "#2dd4bf" : "#f59e0b",
    2.8
  );

  // Dual Optical Camera Lens & Telemetry Visor
  ctx.fillStyle = "#0f172a";
  roundRectPath(ctx, -26, -84, 52, 20, 6);
  ctx.fill();
  ctx.fillStyle = active ? "#2dd4bf" : (Math.sin(time * 12) > 0 ? "#f59e0b" : "#78350f");
  ctx.beginPath();
  ctx.arc(-10, -74, 6, 0, Math.PI * 2);
  ctx.arc(10, -74, 6, 0, Math.PI * 2);
  ctx.fill();

  // Stencil Badge
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.fillText("UNIT M-04", 0, -44);

  // Multi-Joint Hydraulic Claws
  const targetY = lifting ? -142 : -68;
  drawSculptedSegment(ctx, -36, -72, -56, targetY, 13, 10, "#475569", "#38bdf8", "#7dd3fc", true);
  drawSculptedSegment(ctx, 36, -72, 56, targetY, 13, 10, "#475569", "#38bdf8", "#7dd3fc", true);

  ctx.restore();
}

/**
 * Draw ARCHITECT-S2 (15cm Faceted Shapeshifting Modular Companion)
 */
export function drawMiniShapeshifterRig(ctx, x, y, scale, time, mode = "morph", talkEnergy = 0) {
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 5.5) * 6);
  ctx.scale(scale, scale);

  const phase = mode === "morph" ? Math.floor((time * 1.1) % 3) : 2;

  // Harmonic Aura Field
  const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 56);
  grad.addColorStop(0, "rgba(196, 181, 253, 0.78)");
  grad.addColorStop(0.5, "rgba(139, 92, 246, 0.28)");
  grad.addColorStop(1, "rgba(139, 92, 246, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 56, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting micro-facets
  for (let f = 0; f < 6; f++) {
    const a = time * 2.6 + (f * Math.PI) / 3;
    const fx = Math.cos(a) * 40;
    const fy = Math.sin(a) * 40;
    bevelPolygon(ctx, [[fx, fy - 4], [fx + 4, fy], [fx, fy + 4], [fx - 4, fy]], "#ddd6fe", "#8b5cf6", 1.2);
  }

  if (phase === 0) {
    // Form 1: 8-Point Crystalline Star
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const r = i % 2 === 0 ? 36 : 15;
      const a = (i * Math.PI) / 8 + time * 1.6;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    bevelPolygon(ctx, pts, "#7c3aed", "#ddd6fe", 2.5);
  } else if (phase === 1) {
    // Form 2: Interlocking Hexagonal Aegis Shield
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + time * 0.9;
      pts.push([Math.cos(a) * 34, Math.sin(a) * 34]);
    }
    bevelPolygon(ctx, pts, "#6d28d9", "#4ade80", 3);
    bevelPolygon(ctx, pts.map(([px, py]) => [px * 0.55, py * 0.55]), "#a78bfa", "#ffffff", 1.5);
  } else {
    // Form 3: Articulated Mini-Guardian Robot (10 facets)
    bevelPolygon(ctx, [[-18, -12], [18, -12], [22, 18], [-22, 18]], "#6d28d9", "#c4b5fd", 2.5);
    bevelPolygon(ctx, [[-16, -38], [16, -38], [20, -14], [-20, -14]], "#7c3aed", "#ddd6fe", 2.5);
    // Tiny V-crest antenna
    bevelPolygon(ctx, [[0, -36], [12, -48], [6, -36], [-6, -36], [-12, -48]], "#fde047", "#ffffff", 1.2);
    // Floating little hands
    ctx.fillStyle = "#a78bfa";
    ctx.beginPath();
    ctx.arc(-28, 2 + Math.sin(time * 8) * 3, 6, 0, Math.PI * 2);
    ctx.arc(28, 2 - Math.sin(time * 8) * 3, 6, 0, Math.PI * 2);
    ctx.fill();
    // Expressive glowing eyes
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(-7, -26, 4 + talkEnergy * 1.8, 0, Math.PI * 2);
    ctx.arc(7, -26, 4 + talkEnergy * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draw Mosaic — 28-Piece Interlocking Polyhedral Mechanical Titan (Scenes 8-11)
 */
export function drawMosaicTitanRig(ctx, opts) {
  const {
    x,
    y,
    scale = 1.0,
    time = 0.0,
    assemblyProgress = 1.0,
    mode = "vessel", // "vessel" | "sparring" | "offering" | "awakened"
    talkEnergy = 0.0,
  } = opts;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const isAwakened = mode === "awakened" || mode === "offering";
  const coreColor = isAwakened ? "#f472b6" : "#38bdf8";
  const subGlow = isAwakened ? "#fde047" : "#ec4899";
  const plateFill = isAwakened ? "#311042" : "#0f172a";
  const plateMid = isAwakened ? "#4a1942" : "#1e1b4b";
  const plateStroke = isAwakened ? "#f9a8d4" : "#38bdf8";

  // Ground Shadow
  ctx.fillStyle = "rgba(2, 6, 23, 0.72)";
  ctx.beginPath();
  ctx.ellipse(0, 10, 130, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Harmonic Lattice Aura behind Torso
  const coreY = -245 + Math.sin(time * 2.4) * 7;
  const grad = ctx.createRadialGradient(0, coreY, 16, 0, coreY, 185);
  grad.addColorStop(0, isAwakened ? "rgba(244, 114, 182, 0.80)" : "rgba(56, 189, 248, 0.72)");
  grad.addColorStop(0.55, isAwakened ? "rgba(251, 191, 36, 0.25)" : "rgba(236, 72, 153, 0.25)");
  grad.addColorStop(1, "rgba(15, 23, 42, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, coreY, 185, 0, Math.PI * 2);
  ctx.fill();

  // 20 Interlocking Polyhedral Armor Plates (Legs, Pelvis, Abdomen, Chest, Pauldrons, Crown)
  const polyPieces = [
    // Shin Greaves & Knee Guards (4)
    { gx: -52, gy: -72, pts: [[-22, -55], [22, -55], [18, 55], [-24, 55]], fill: plateFill },
    { gx: 52, gy: -72, pts: [[-22, -55], [22, -55], [24, 55], [-18, 55]], fill: plateFill },
    { gx: -52, gy: -135, pts: [[0, -18], [22, 0], [0, 18], [-22, 0]], fill: plateMid },
    { gx: 52, gy: -135, pts: [[0, -18], [22, 0], [0, 18], [-22, 0]], fill: plateMid },
    // Thigh Pillars (2)
    { gx: -48, gy: -175, pts: [[-26, -38], [24, -38], [20, 38], [-22, 38]], fill: plateMid },
    { gx: 48, gy: -175, pts: [[-24, -38], [26, -38], [22, 38], [-20, 38]], fill: plateMid },
    // Pelvis Core & Side Tassets (3)
    { gx: 0, gy: -202, pts: [[-42, -18], [42, -18], [28, 22], [-28, 22]], fill: plateFill },
    { gx: -64, gy: -198, pts: [[-18, -22], [18, -14], [12, 26], [-22, 16]], fill: plateMid },
    { gx: 64, gy: -198, pts: [[-18, -14], [18, -22], [22, 16], [-12, 26]], fill: plateMid },
    // Multi-Plate Rib & Upper Chest Chassis (4)
    { gx: -38, gy: -245, pts: [[-34, -32], [28, -24], [22, 30], [-28, 22]], fill: plateFill },
    { gx: 38, gy: -245, pts: [[-28, -24], [34, -32], [28, 22], [-22, 30]], fill: plateFill },
    { gx: -44, gy: -292, pts: [[-42, -28], [36, -28], [28, 26], [-34, 22]], fill: plateMid },
    { gx: 44, gy: -292, pts: [[-36, -28], [42, -28], [34, 22], [-28, 26]], fill: plateMid },
    // Central Harmonic Reactor Diamond (1)
    { gx: 0, gy: -272, pts: [[0, -34], [32, 0], [0, 34], [-32, 0]], fill: coreColor },
    // Twin Layered Wing-Pauldrons (4)
    { gx: -96, gy: -306, pts: [[-38, -28], [32, -38], [26, 32], [-42, 18]], fill: plateMid, ripple: true },
    { gx: -122, gy: -332, pts: [[-28, -22], [26, -32], [18, 18], [-32, 12]], fill: plateFill, ripple: true },
    { gx: 96, gy: -306, pts: [[-32, -38], [38, -28], [42, 18], [-26, 32]], fill: plateMid },
    { gx: 122, gy: -332, pts: [[-26, -32], [28, -22], [32, 12], [-18, 18]], fill: plateFill },
    // Sculpted Helm & Horned Crest (2)
    { gx: 0, gy: -362, pts: [[-36, -32], [36, -32], [28, 32], [0, 40], [-28, 32]], fill: plateFill },
    { gx: 0, gy: -396, pts: [[0, -26], [48, -6], [24, 12], [-24, 12], [-48, -6]], fill: plateMid },
  ];

  polyPieces.forEach((pl, idx) => {
    const scatterAngle = idx * 0.92 + time * 0.6;
    const scatterDist = (1.0 - clamp(assemblyProgress, 0, 1)) * 260;
    const floatBob = Math.sin(time * 3.2 + idx * 0.7) * 3.5;
    const px = pl.gx + Math.cos(scatterAngle) * scatterDist;
    const py = pl.gy + Math.sin(scatterAngle) * scatterDist + floatBob;

    ctx.save();
    ctx.translate(px, py);
    if (mode === "sparring" && pl.ripple) {
      // Liquid-armor shoulder ripple during Scene 9!
      ctx.rotate(Math.sin(time * 8.0 + idx) * 0.34);
    }
    bevelPolygon(ctx, pl.pts, pl.fill, plateStroke, 3.0);

    // Internal circuit trace
    ctx.strokeStyle = idx % 2 === 0 ? coreColor : subGlow;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(pl.pts[0][0] * 0.45, pl.pts[0][1] * 0.45);
    ctx.lineTo(pl.pts[2][0] * 0.45, pl.pts[2][1] * 0.45);
    ctx.stroke();
    ctx.restore();
  });

  // Multi-Slit Face Visor & Speech-Reactive Harmonic Mask
  const headY = -362 + Math.sin(time * 2.4) * 4;
  ctx.fillStyle = coreColor;
  const visorH = 10 + talkEnergy * 16;
  roundRectPath(ctx, -24, headY - visorH * 0.5 - 4, 48, visorH, 4);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  roundRectPath(ctx, -14, headY - 3, 28, 4, 2);
  ctx.fill();

  // Articulated Multi-Segment Giant Arms & Mechanical Fingers (8 segments)
  if (mode === "sparring") {
    // Extended sweeping arm for the Traveler to vault and sprint up!
    drawSculptedSegment(ctx, -95, -295, -205, -215, 44, 38, plateMid, plateStroke, coreColor, true);
    drawSculptedSegment(ctx, -205, -215, -325, -162, 36, 30, plateFill, coreColor, subGlow, true);
    // Giant Knuckle Fist
    bevelPolygon(ctx, [[-355, -182], [-310, -182], [-305, -138], [-360, -142]], plateMid, plateStroke, 3);
    // Right arm counter-balance
    drawSculptedSegment(ctx, 95, -295, 145, -210, 42, 34, plateMid, plateStroke, coreColor, true);
    drawSculptedSegment(ctx, 145, -210, 170, -135, 32, 26, plateFill, plateStroke, subGlow, true);
  } else if (mode === "offering") {
    // Open Palm offering the modular lattice cube
    drawSculptedSegment(ctx, -95, -295, -185, -225, 42, 36, plateMid, plateStroke, coreColor, true);
    drawSculptedSegment(ctx, -185, -225, -275, -220, 34, 28, plateFill, coreColor, subGlow, true);
    bevelPolygon(ctx, [[-315, -226], [-265, -234], [-265, -208], [-320, -212]], plateMid, plateStroke, 2.5);
    drawSculptedSegment(ctx, 95, -295, 138, -195, 40, 32, plateMid, plateStroke, coreColor, true);
  } else {
    // Heroic / Sentinel Stance
    drawSculptedSegment(ctx, -95, -295, -138, -200, 42, 34, plateMid, plateStroke, coreColor, true);
    drawSculptedSegment(ctx, -138, -200, -152, -118, 32, 26, plateFill, plateStroke, subGlow, true);
    drawSculptedSegment(ctx, 95, -295, 138, -200, 42, 34, plateMid, plateStroke, coreColor, true);
    drawSculptedSegment(ctx, 138, -200, 152, -118, 32, 26, plateFill, plateStroke, subGlow, true);
  }

  ctx.restore();
}

/**
 * Layer 2 & 3 Helper: Draw Multi-Tiered Veyra Skyline & Parallax Architecture (Surface Scenes S01-S03)
 */
function drawVeyraSurfaceEnvironment(ctx, width, height, groundY, time, sceneIndex) {
  ctx.save();
  // Distant Mountain Range Silhouette
  ctx.fillStyle = "rgba(15, 23, 42, 0.68)";
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(0, 610);
  ctx.lineTo(260, 520);
  ctx.lineTo(540, 590);
  ctx.lineTo(880, 490);
  ctx.lineTo(1260, 575);
  ctx.lineTo(1620, 480);
  ctx.lineTo(width, 555);
  ctx.lineTo(width, groundY);
  ctx.closePath();
  ctx.fill();

  // Multi-Tiered Veyra Megacity Towers with Lit Windows & Sky-Bridges
  const towers = [
    [680, 540, 56, 285], [748, 495, 68, 330], [828, 530, 52, 295],
    [892, 455, 78, 370], [982, 505, 64, 320], [1058, 440, 82, 385],
    [1152, 490, 66, 335], [1230, 525, 58, 300], [1302, 470, 74, 355],
    [1390, 515, 62, 310], [1468, 485, 72, 340], [1554, 535, 60, 290],
    [1628, 495, 68, 330], [1710, 550, 54, 275],
  ];

  // Suspended Sky-Bridges between towers
  ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(748, 560);
  ctx.lineTo(1140, 560);
  ctx.moveTo(1058, 510);
  ctx.lineTo(1468, 510);
  ctx.stroke();

  for (let i = 0; i < towers.length; i++) {
    const [tx, ty, tw, th] = towers[i];
    ctx.fillStyle = i % 2 === 0 ? "rgba(15, 23, 42, 0.88)" : "rgba(30, 41, 59, 0.86)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.48)";
    ctx.lineWidth = 1.8;
    ctx.fillRect(tx, ty, tw, th);
    ctx.strokeRect(tx, ty, tw, th);

    // Rooftop bevel spire
    ctx.beginPath();
    ctx.moveTo(tx + tw * 0.5, ty - 28);
    ctx.lineTo(tx + tw * 0.5, ty);
    ctx.stroke();

    // Illuminated window grid
    ctx.fillStyle = i % 3 === 0 ? "rgba(250, 204, 21, 0.55)" : "rgba(56, 189, 248, 0.45)";
    for (let wy = ty + 18; wy < groundY - 30; wy += 22) {
      for (let wx = tx + 10; wx < tx + tw - 12; wx += 14) {
        if ((wx + wy + i) % 3 !== 0) {
          ctx.fillRect(wx, wy, 7, 10);
        }
      }
    }
  }
  ctx.restore();
}

/**
 * Layer 2, 3 & 4 Helper: Draw Subterranean Bunker Architecture (Scenes S04-S11)
 */
function drawSubterraneanBunkerEnvironment(ctx, width, height, groundY, time, alertLevel = 0) {
  ctx.save();

  // Ribbed Subterranean Vault Arches & Concrete Support Buttresses
  const archColor = alertLevel > 0.5 ? "rgba(244, 63, 94, 0.32)" : "rgba(45, 212, 191, 0.25)";
  for (let ax = 120; ax < width; ax += 340) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
    ctx.strokeStyle = archColor;
    ctx.lineWidth = 2.5;
    ctx.fillRect(ax - 26, 80, 52, groundY - 80);
    ctx.strokeRect(ax - 26, 80, 52, groundY - 80);

    // Diagonal structural gussets
    ctx.beginPath();
    ctx.moveTo(ax - 26, 220);
    ctx.lineTo(ax + 140, 80);
    ctx.moveTo(ax + 26, 220);
    ctx.lineTo(ax - 140, 80);
    ctx.stroke();
  }

  // Overhead Coolant Conduits & Ceiling Gantry Crane Track
  ctx.fillStyle = "#0f172a";
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 3;
  ctx.fillRect(0, 72, width, 26);
  ctx.strokeRect(0, 72, width, 26);
  ctx.strokeStyle = alertLevel > 0.5 ? "#f43f5e" : "#38bdf8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 85);
  ctx.lineTo(width, 85);
  ctx.stroke();

  // Midground Server Rack Banks with Blinking Telemetry LEDs
  for (const sx of [90, 1720]) {
    ctx.fillStyle = "rgba(2, 6, 23, 0.82)";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    roundRectPath(ctx, sx, 380, 110, groundY - 380, 8);
    ctx.fill();
    ctx.stroke();
    for (let ly = 405; ly < groundY - 25; ly += 24) {
      const on = Math.sin(time * 6 + ly) > -0.2;
      ctx.fillStyle = alertLevel > 0.5 ? (on ? "#f43f5e" : "#4c0519") : (on ? "#2dd4bf" : "#134e4a");
      ctx.fillRect(sx + 16, ly, 28, 8);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(sx + 54, ly, 40, 8);
    }
  }

  // Textured Metallic Deck Floor with Bevel Grating & Hazard Stripes
  const deckGrad = ctx.createLinearGradient(0, groundY, 0, height);
  deckGrad.addColorStop(0, "#0f172a");
  deckGrad.addColorStop(1, "#020617");
  ctx.fillStyle = deckGrad;
  ctx.fillRect(0, groundY, width, height - groundY);

  ctx.strokeStyle = alertLevel > 0.5 ? "#f43f5e" : "#2dd4bf";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();

  // Perspective deck panel seams
  ctx.strokeStyle = "rgba(51, 65, 85, 0.65)";
  ctx.lineWidth = 2;
  for (let px = 0; px <= width; px += 160) {
    ctx.beginPath();
    ctx.moveTo(px, groundY);
    ctx.lineTo((px - width * 0.5) * 1.35 + width * 0.5, height);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Layer 5 Helper: Foreground Framing Cables & Drifting Atmospheric Particles
 */
function drawForegroundAtmosphere(ctx, width, height, time, color = "#38bdf8") {
  ctx.save();
  // Floating energy / dust motes
  ctx.fillStyle = color;
  for (let p = 0; p < 18; p++) {
    const px = (p * 137 + time * (22 + (p % 4) * 8)) % width;
    const py = (p * 89 + Math.sin(time * 1.5 + p) * 28) % (height - 180);
    const rad = 1.8 + (p % 3) * 1.1;
    ctx.globalAlpha = 0.25 + 0.25 * Math.sin(time * 3 + p);
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Compute Dynamic 24fps Camera Rig (Zoom, Pan, Shake) per Scene & Action Beat
 */
function computeCameraTransform(sceneIndex, sceneProgress, time, activeLine, activeSfx) {
  let zoom = 1.0 + 0.03 * Math.sin(sceneProgress * Math.PI);
  let panX = 0;
  let panY = 0;
  let shake = 0;

  if (sceneIndex === 0) {
    // Slow cinematic push-in across Emerald Ridge toward the turning Ring
    zoom = lerp(1.0, 1.06, sceneProgress);
    panX = lerp(-18, 18, sceneProgress);
  } else if (sceneIndex === 2 && activeLine?.id === "L09") {
    // Whip-zoom as Velocity grabs Traveler to dash to the plaza hatch
    zoom = 1.08;
    panX = 24;
  } else if (sceneIndex === 5) {
    // High-tension push-in and firewall shockwave shake
    zoom = lerp(1.02, 1.09, sceneProgress);
    shake = 4.5;
  } else if (sceneIndex === 7) {
    // Girder heave & Mosaic colossus assembly tremor
    zoom = 1.05;
    shake = activeSfx ? 5.0 : 2.0;
  } else if (sceneIndex === 8) {
    // Dynamic sparring tracking camera
    zoom = sceneProgress < 0.42 ? 1.06 : lerp(1.05, 1.12, (sceneProgress - 0.42) / 0.58);
    panX = sceneProgress < 0.42 ? -20 : lerp(10, 55, (sceneProgress - 0.42) / 0.58);
    shake = activeSfx ? 4.0 : 1.0;
  } else if (sceneIndex === 9) {
    // Focus push-in on ARCHITECT-S2 unfolding
    zoom = lerp(1.02, 1.08, sceneProgress);
  } else if (sceneIndex === 10 && activeLine?.id === "L36") {
    // Thunderous tremor when the colossal Ring above Veyra slams to a dead halt!
    shake = 7.5;
  }

  const sx = shake > 0 ? Math.sin(time * 47.0) * shake : 0;
  const sy = shake > 0 ? Math.cos(time * 53.0) * shake : 0;
  return { zoom, panX: panX + sx, panY: panY + sy };
}

/**
 * Render the complete 5-Layer 2D Canvas scene for any timestamp `t`
 */
export function renderScene2D(ctx, width, height, state) {
  const {
    time,
    scene,
    sceneIndex,
    sceneProgress,
    activeLine,
    activeSfx,
    talkEnergy = 0,
    showCaptions = true,
    clearCanvas = true,
  } = state;

  if (clearCanvas) {
    ctx.clearRect(0, 0, width, height);
  }
  const groundY = 825;

  // Apply Dynamic Camera Transform for World Layers (Layers 2, 3, 4, 5)
  const cam = computeCameraTransform(sceneIndex, sceneProgress, time, activeLine, activeSfx);
  ctx.save();
  ctx.translate(width * 0.5 + cam.panX, height * 0.5 + cam.panY);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-width * 0.5, -height * 0.5);

  if (sceneIndex === 0) {
    // =========================================================================
    // S01: EMERALD RIDGE ABOVE VEYRA — Turning Ring, Second Moon, Spider-Scouts, Courier & Traveler
    // =========================================================================
    drawVeyraSurfaceEnvironment(ctx, width, height, groundY, time, sceneIndex);

    // Layer 3: Eastern City Gate Portal & Marching Multi-Legged Mechanical Scouts
    bevelPolygon(ctx, [[1110, 650], [1230, 650], [1245, 800], [1095, 800]], "#1e293b", "#38bdf8", 2.5);
    ctx.fillStyle = "rgba(244, 63, 94, 0.28)";
    ctx.fillRect(1135, 690, 70, 110);

    for (let m = 0; m < 4; m++) {
      const mx = 1170 + ((time * 52 + m * 125) % 480);
      const my = 796 + Math.sin(time * 8 + m) * 3;
      ctx.save();
      ctx.translate(mx, my);
      // Articulated spider legs
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2.2;
      for (const lx of [-18, -6, 6, 18]) {
        const stepY = Math.sin(time * 12 + lx) * 5;
        ctx.beginPath();
        ctx.moveTo(lx * 0.6, -14);
        ctx.lineTo(lx * 1.2, -24);
        ctx.lineTo(lx * 1.5, stepY);
        ctx.stroke();
      }
      bevelPolygon(ctx, [[-22, -26], [22, -26], [28, -10], [-28, -10]], "#334155", "#f43f5e", 2);
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(14, -18, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Courier sprinting down the ridge road with the silver cylinder
    const courierX = 720 + sceneProgress * 360;
    drawHumanoidRig(ctx, {
      x: courierX,
      y: 792,
      scale: 0.82,
      facing: 1,
      character: "Courier",
      pose: "run",
      time,
    });

    // Layer 4: Terraced Emerald Ridge Foreground with Rocky Outcrops & Swaying Grass Blades
    const ridgeGrad = ctx.createLinearGradient(0, 730, 0, height);
    ridgeGrad.addColorStop(0, "#065f46");
    ridgeGrad.addColorStop(0.5, "#064e3b");
    ridgeGrad.addColorStop(1, "#022c22");
    ctx.fillStyle = ridgeGrad;
    ctx.beginPath();
    ctx.moveTo(0, 748);
    ctx.quadraticCurveTo(480, 710, 980, 812);
    ctx.lineTo(width, 835);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Swaying grass blades along the ridge crest
    ctx.strokeStyle = "#34d399";
    ctx.lineWidth = 2;
    for (let gx = 40; gx < 960; gx += 28) {
      const gy = 742 + (gx / 960) * 62;
      const sway = Math.sin(time * 3.5 + gx * 0.05) * 8;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.quadraticCurveTo(gx + sway * 0.5, gy - 14, gx + sway, gy - 24);
      ctx.stroke();
    }

    // Traveler on the ridge overlooking Veyra
    drawHumanoidRig(ctx, {
      x: 410,
      y: 778,
      scale: 1.22,
      facing: 1,
      character: "Traveler",
      pose: activeLine?.speaker === "Traveler" ? "point" : "idle",
      talkEnergy: activeLine?.speaker === "Traveler" ? talkEnergy : 0,
      time,
    });

    drawForegroundAtmosphere(ctx, width, height, time, "#38bdf8");
  } else if (sceneIndex === 1) {
    // =========================================================================
    // S02: ROADSIDE HERO REGISTRY TERMINAL — 3 High-Detail Holographic Hero Dossiers
    // =========================================================================
    drawVeyraSurfaceEnvironment(ctx, width, height, groundY, time, sceneIndex);

    // Textured Roadside Plaza Deck
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, groundY, width, height - groundY);
    ctx.strokeStyle = "#2dd4bf";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // Hexagonal Holographic Kiosk Pedestal & Emitter Beams
    bevelPolygon(ctx, [[545, 620], [675, 620], [695, groundY], [525, groundY]], "#1e293b", "#38bdf8", 3);
    ctx.fillStyle = "rgba(56, 189, 248, 0.14)";
    ctx.beginPath();
    ctx.moveTo(610, 620);
    ctx.lineTo(750, 230);
    ctx.lineTo(1790, 230);
    ctx.lineTo(660, 620);
    ctx.closePath();
    ctx.fill();

    const cards = [
      {
        name: "AEGIS PRIME",
        role: "Chief Gravity Engineer",
        status: "STATUS: MISSING IN SUB-RING LAB",
        col: "#fb923c",
        x: 750,
        char: "Aegis Prime",
      },
      {
        name: "ASTRAL WARDEN",
        role: "Cosmic Sorcerer Supreme",
        status: "ALERT: 2ND MOON EXTRADIMENSIONAL",
        col: "#c084fc",
        x: 1110,
        char: "Astral Warden",
      },
      {
        name: "VELOCITY",
        role: "Registered Speedster Hero",
        status: "ACTIVE: EASTERN WATCHTOWER",
        col: "#facc15",
        x: 1470,
        char: "Velocity",
      },
    ];

    cards.forEach((c) => {
      const isSpeaking = activeLine?.speaker === c.char;
      ctx.save();
      ctx.fillStyle = isSpeaking ? "rgba(30, 27, 75, 0.92)" : "rgba(15, 23, 42, 0.86)";
      ctx.strokeStyle = c.col;
      ctx.lineWidth = isSpeaking ? 4.5 : 2.8;
      roundRectPath(ctx, c.x, 235, 320, 455, 16);
      ctx.fill();
      ctx.stroke();

      // Corner HUD brackets
      ctx.fillStyle = c.col;
      ctx.fillRect(c.x + 12, 247, 28, 4);
      ctx.fillRect(c.x + 320 - 40, 247, 28, 4);

      drawHumanoidRig(ctx, {
        x: c.x + 160,
        y: 555,
        scale: 0.96,
        facing: -1,
        character: c.char,
        pose: isSpeaking ? "point" : "idle",
        talkEnergy: isSpeaking ? talkEnergy : 0,
        time,
        isHologram: true,
      });

      ctx.fillStyle = c.col;
      ctx.font = "bold 21px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(c.name, c.x + 160, 612);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "14px monospace";
      ctx.fillText(c.role, c.x + 160, 638);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 12px monospace";
      ctx.fillText(c.status, c.x + 160, 664);
      ctx.restore();
    });

    drawHumanoidRig(ctx, {
      x: 390,
      y: groundY,
      scale: 1.24,
      facing: 1,
      character: "Traveler",
      pose: "terminal",
      talkEnergy: activeLine?.speaker === "Traveler" ? talkEnergy : 0,
      time,
    });

    drawForegroundAtmosphere(ctx, width, height, time, "#c084fc");
  } else if (sceneIndex === 2) {
    // =========================================================================
    // S03: EASTERN WATCHTOWER DECK — Velocity's Testimony & 06:17 Anomaly Replay
    // =========================================================================
    drawVeyraSurfaceEnvironment(ctx, width, height, groundY, time, sceneIndex);

    // Watchtower Steel Truss Pillars & Glass Observation Balustrade
    ctx.strokeStyle = "rgba(100, 116, 139, 0.65)";
    ctx.lineWidth = 5;
    for (const tx of [140, 1780]) {
      ctx.strokeRect(tx - 35, 80, 70, groundY - 80);
      ctx.beginPath();
      for (let y = 80; y < groundY - 80; y += 110) {
        ctx.moveTo(tx - 35, y);
        ctx.lineTo(tx + 35, y + 110);
        ctx.moveTo(tx + 35, y);
        ctx.lineTo(tx - 35, y + 110);
      }
      ctx.stroke();
    }

    // Glass Observation Railing
    ctx.fillStyle = "rgba(56, 189, 248, 0.10)";
    ctx.fillRect(0, 685, width, 140);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 685);
    ctx.lineTo(width, 685);
    ctx.stroke();

    // Deck Floor
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, groundY, width, height - groundY);

    // Holographic Security Replay of the Flickering Black-Suited Figure inside the Ring (06:17)
    const flicker = 0.45 + 0.45 * Math.abs(Math.sin(time * 13.0));
    ctx.save();
    ctx.translate(960, 455);
    ctx.globalAlpha = flicker;
    // Tailored black suit silhouette with glowing cyan lapel trim
    bevelPolygon(ctx, [[-30, -92], [30, -92], [24, 38], [-24, 38]], "#020617", "#38bdf8", 2.5);
    ctx.beginPath();
    ctx.arc(0, -116, 20, 0, Math.PI * 2);
    ctx.fillStyle = "#020617";
    ctx.fill();
    ctx.stroke();
    // Tie & Collar
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(-3, -88, 6, 36);

    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, -275, 52, 550, 56, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fda4af";
    ctx.font = "bold 15px monospace";
    ctx.textAlign = "center";
    ctx.fillText("RING ARCH CAM 06:17 — VISUAL ANOMALY (0 BYTES RECORDED)", 0, 76);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "13px monospace";
    ctx.fillText("AEGIS NOTE: 'ANSWERING FIRST SIGNAL BENEATH THE CITY'", 0, 96);
    ctx.restore();

    if (activeLine?.id === "L09") {
      drawKineticSpeedLines(ctx, width, height, time, "rgba(250, 204, 21, 0.35)", "horizontal");
    }

    drawHumanoidRig(ctx, {
      x: 520,
      y: groundY,
      scale: 1.24,
      facing: 1,
      character: "Traveler",
      pose: activeLine?.speaker === "Traveler" ? "point" : "idle",
      talkEnergy: activeLine?.speaker === "Traveler" ? talkEnergy : 0,
      time,
    });

    drawHumanoidRig(ctx, {
      x: activeLine?.id === "L09" ? 1360 - sceneProgress * 220 : 1360,
      y: groundY,
      scale: 1.24,
      facing: -1,
      character: "Velocity",
      pose: activeLine?.id === "L09" ? "run" : "point",
      talkEnergy: activeLine?.speaker === "Velocity" ? talkEnergy : 0,
      time,
    });

    drawForegroundAtmosphere(ctx, width, height, time, "#facc15");
  } else if (sceneIndex === 3) {
    // =========================================================================
    // S04: AEGIS PRIME'S SUB-RING BUNKER — Cracked Grav-Armor, Twitching M-04 & Intercom
    // =========================================================================
    drawSubterraneanBunkerEnvironment(ctx, width, height, groundY, time, 0.25);

    // Heavy Armored Gantry Bay holding Aegis Prime's Cracked Mk-IV Gravity Suit
    ctx.save();
    ctx.translate(450, 640);
    ctx.fillStyle = "rgba(67, 20, 7, 0.80)";
    ctx.strokeStyle = "#fb923c";
    ctx.lineWidth = 3;
    roundRectPath(ctx, -105, -250, 210, 300, 14);
    ctx.fill();
    ctx.stroke();
    drawHumanoidRig(ctx, {
      x: 0,
      y: 22,
      scale: 1.04,
      facing: 1,
      character: "Aegis Prime",
      pose: "idle",
      alpha: 0.72,
      time,
    });
    // Sparking cracks on the damaged armor
    drawLightningArc(ctx, -20, -110, 25, -75, time, "#fb923c", 2.0, 4);
    ctx.fillStyle = "#fdba74";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.fillText("DAMAGED GRAV-ARMOR MK-IV", 0, -262);
    ctx.restore();

    // Wall-Mounted Intercom & Sub-Ring First Signal Seismic Display
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 3.5;
    roundRectPath(ctx, 1150, 250, 520, 310, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fb923c";
    ctx.font = "bold 20px monospace";
    ctx.fillText("EMERGENCY INTERCOM: LOWER VAULT", 1180, 294);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "15px monospace";
    ctx.fillText("SEISMIC ORIGIN: FIRST SIGNAL BENEATH RING", 1180, 324);
    ctx.fillStyle = "#f43f5e";
    ctx.fillText("STATUS: AEGIS PRIME PINNED UNDER GIRDER", 1180, 350);

    // Live Voice Waveform for Aegis Prime
    ctx.strokeStyle = "#fb923c";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    for (let wx = 0; wx < 460; wx += 6) {
      const amp = activeLine?.speaker === "Aegis Prime" ? (22 + talkEnergy * 62) : 8;
      const wy = 455 + Math.sin(wx * 0.09 + time * 16) * amp * Math.sin((wx / 460) * Math.PI);
      if (wx === 0) ctx.moveTo(1180 + wx, wy);
      else ctx.lineTo(1180 + wx, wy);
    }
    ctx.stroke();
    ctx.restore();

    // Twitching hallway robot M-04
    drawRobotM04(ctx, 235, groundY, 1.02, time, false, false);

    drawHumanoidRig(ctx, {
      x: 730,
      y: groundY,
      scale: 1.22,
      facing: 1,
      character: "Traveler",
      pose: "idle",
      time,
    });
    drawHumanoidRig(ctx, {
      x: 960,
      y: groundY,
      scale: 1.22,
      facing: 1,
      character: "Velocity",
      pose: "idle",
      time,
    });
  } else if (sceneIndex === 4) {
    // =========================================================================
    // S05: ROBOTICS & EXOSUIT FABRICATION BAY — ARCHITECT AI, Super-Speed M-04 Repair & Vessel Log
    // =========================================================================
    drawSubterraneanBunkerEnvironment(ctx, width, height, groundY, time, 0.35);

    // ARCHITECT Crystalline AI Core Pillar with Rotating Schematic Rings
    ctx.save();
    ctx.translate(960, 435);
    const pulse = 1.0 + (activeLine?.speaker === "ARCHITECT" ? talkEnergy * 0.25 : 0.05 * Math.sin(time * 4));
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = "rgba(45, 212, 191, 0.55)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 145, 48, time * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 145, 48, -time * 0.8, 0, Math.PI * 2);
    ctx.stroke();

    bevelPolygon(ctx, [[0, -118], [92, 0], [0, 118], [-92, 0]], "rgba(17, 94, 89, 0.72)", "#2dd4bf", 3.5);
    bevelPolygon(ctx, [[0, -68], [52, 0], [0, 68], [-52, 0]], "rgba(45, 212, 191, 0.35)", "#ccfbf1", 2);
    ctx.fillStyle = "#ccfbf1";
    ctx.font = "bold 19px monospace";
    ctx.textAlign = "center";
    ctx.fillText("ARCHITECT AI", 0, 6);
    ctx.restore();

    // Hijacked Ring Command Banner ("PREPARE THE VESSEL")
    ctx.save();
    ctx.fillStyle = "rgba(127, 29, 29, 0.92)";
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 3;
    roundRectPath(ctx, 570, 145, 780, 76, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fecdd3";
    ctx.font = "bold 21px monospace";
    ctx.textAlign = "center";
    ctx.fillText("M-04 MEMORY LOG ANOMALY: 'PREPARE THE VESSEL'", 960, 180);
    ctx.fillStyle = "#fda4af";
    ctx.font = "14px monospace";
    ctx.fillText("CAUSE: UNDERGROUND SIGNAL HIJACKING ROBOTS TO BUILD A GIANT HOST BODY", 960, 206);
    ctx.restore();

    drawHumanoidRig(ctx, {
      x: 450,
      y: groundY,
      scale: 1.24,
      facing: 1,
      character: "Traveler",
      pose: activeLine?.speaker === "Traveler" ? "point" : "idle",
      talkEnergy: activeLine?.speaker === "Traveler" ? talkEnergy : 0,
      time,
    });

    // Restored M-04 on the robotics workbench
    drawRobotM04(ctx, 1270, groundY, 1.12, time, true, false);

    // Velocity blurring at super-speed with golden after-images
    const blurX = 1490 + Math.sin(time * 15) * 105;
    drawHumanoidRig(ctx, {
      x: blurX - 55,
      y: groundY,
      scale: 1.18,
      facing: -1,
      character: "Velocity",
      pose: "run",
      alpha: 0.32,
      time: time - 0.08,
    });
    drawHumanoidRig(ctx, {
      x: blurX,
      y: groundY,
      scale: 1.20,
      facing: -1,
      character: "Velocity",
      pose: "run",
      time,
    });
  } else if (sceneIndex === 5 || sceneIndex === 6) {
    // =========================================================================
    // S06 & S07: EXOSUIT WELDING GANTRY, FIREWALL SIEGE & AIR-GAPPED WRISTBAND DISTILLATION
    // =========================================================================
    drawSubterraneanBunkerEnvironment(ctx, width, height, groundY, time, sceneIndex === 5 ? 0.95 : 0.35);

    // Heavy Exosuit Gantry Cage & Articulated Ceiling Welding Arms
    ctx.strokeStyle = sceneIndex === 5 ? "#f43f5e" : "#4ade80";
    ctx.lineWidth = 4.5;
    ctx.strokeRect(680, 290, 560, 535);

    // Articulated Ceiling Gantry Welding Arms
    drawSculptedSegment(ctx, 730, 290, 830, 440, 22, 16, "#334155", "#38bdf8", "#7dd3fc", true);
    drawSculptedSegment(ctx, 1190, 290, 1090, 440, 22, 16, "#334155", "#38bdf8", "#7dd3fc", true);

    if (sceneIndex === 5) {
      // Scene 6: Welding Spark Showers & Crimson Firewall Intrusion Shockwaves!
      drawKineticSpeedLines(ctx, width, height, time, "rgba(244, 63, 94, 0.28)", "radial");
      drawLightningArc(ctx, 830, 440, 920, 580, time, "#38bdf8", 3.0, 1);
      drawLightningArc(ctx, 1090, 440, 1000, 580, time, "#fde047", 3.0, 2);

      // Shower of welding sparks
      ctx.fillStyle = "#fef08a";
      for (let sp = 0; sp < 24; sp++) {
        const sx = 960 + Math.cos(sp * 2.1 + time * 14) * (40 + (sp * 9) % 160);
        const sy = 560 + Math.sin(sp * 1.7 + time * 18) * (30 + (sp * 11) % 180);
        ctx.fillRect(sx, sy, 5, 5);
      }

      ctx.save();
      ctx.fillStyle = "rgba(159, 18, 57, 0.92)";
      ctx.strokeStyle = "#fb7185";
      ctx.lineWidth = 3.5;
      roundRectPath(ctx, 530, 145, 860, 78, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffe4e6";
      ctx.font = "bold 21px monospace";
      ctx.textAlign = "center";
      ctx.fillText("FIREWALL BREACH ALERT: SIGNAL COUNTER-ATTACKING LAB GRID", 960, 180);
      ctx.fillStyle = "#fecdd3";
      ctx.font = "14px monospace";
      ctx.fillText("WARNING: EXTERNAL SIGNAL SCANNING NETWORK FOR TRAVELER IDENTITY", 960, 206);
      ctx.restore();
    } else {
      // Scene 7: Double-Helix Emerald Distillation into Air-Gapped Wristband
      ctx.save();
      for (let h = 0; h < 28; h++) {
        const ht = h / 27;
        const hx = lerp(960, 1025, ht) + Math.sin(ht * 10 - time * 12) * 36 * (1 - ht * 0.5);
        const hy = lerp(240, 665, ht);
        ctx.fillStyle = h % 2 === 0 ? "#4ade80" : "#38bdf8";
        ctx.beginPath();
        ctx.arc(hx, hy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(22, 101, 52, 0.92)";
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 3;
      roundRectPath(ctx, 560, 145, 800, 74, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#dcfce7";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.fillText("NETWORK LINK SEVERED — DISTILLING OFFLINE AI: ARCHITECT-S1", 960, 180);
      ctx.fillStyle = "#86efac";
      ctx.font = "14px monospace";
      ctx.fillText("AIR-GAPPED WRISTBAND CORE: 100% | HYDRAULIC LIFT ASSIST: ONLINE", 960, 204);
      ctx.restore();
    }

    drawHumanoidRig(ctx, {
      x: 960,
      y: groundY,
      scale: 1.30,
      facing: 1,
      character: "Traveler",
      pose: "point",
      talkEnergy: activeLine?.speaker === "Traveler" ? talkEnergy : 0,
      time,
      hasExosuit: true,
      hasWristband: true,
    });
  } else if (sceneIndex === 7) {
    // =========================================================================
    // S08: THE RESCUE IN LOWER CONTAINMENT VAULT & MOSAIC'S COLOSSAL ASSEMBLY
    // =========================================================================
    drawSubterraneanBunkerEnvironment(ctx, width, height, groundY, time, 0.75);

    // Left Side: Velocity, M-04, and Traveler heaving the riveted steel girder off Aegis Prime
    const liftOffset = clamp(sceneProgress * 110, 12, 95);
    ctx.save();
    ctx.translate(470, groundY - 98 - liftOffset);
    ctx.rotate(-0.15);
    bevelPolygon(ctx, [[-280, -26], [280, -26], [280, 26], [-280, 26]], "#334155", "#94a3b8", 3.5);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-265, -14, 530, 28);
    // Steel girder rivets
    ctx.fillStyle = "#cbd5e1";
    for (let rx = -240; rx <= 240; rx += 40) {
      ctx.beginPath();
      ctx.arc(rx, -19, 3, 0, Math.PI * 2);
      ctx.arc(rx, 19, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    drawHumanoidRig(ctx, {
      x: 285,
      y: groundY,
      scale: 1.12,
      facing: 1,
      character: "Velocity",
      pose: activeLine?.id === "L23" ? "run" : "lift",
      time,
    });
    drawRobotM04(ctx, 435, groundY, 1.05, time, true, true);
    drawHumanoidRig(ctx, {
      x: 615,
      y: groundY,
      scale: 1.22,
      facing: 1,
      character: "Traveler",
      pose: "lift",
      talkEnergy: activeLine?.speaker === "Traveler" ? talkEnergy : 0,
      time,
      hasExosuit: true,
      hasWristband: true,
    });
    drawHumanoidRig(ctx, {
      x: 495,
      y: groundY,
      scale: 1.05,
      facing: -1,
      character: "Aegis Prime",
      pose: sceneProgress < 0.42 ? "pinned" : "idle",
      time,
    });

    // Right Side: 28-Piece Modular Mechanical Colossus (Mosaic) slamming together!
    drawMosaicTitanRig(ctx, {
      x: 1435,
      y: groundY,
      scale: 1.18,
      time,
      assemblyProgress: clamp(sceneProgress * 1.45, 0.22, 1.0),
      mode: "vessel",
      talkEnergy: activeLine?.speaker === "Mosaic" ? talkEnergy : 0,
    });
  } else if (sceneIndex === 8) {
    // =========================================================================
    // S09: KINETIC SPARRING ARENA — Plasma Dodgeball, Arm Parkour & Magnetic Boot Clamps
    // =========================================================================
    drawSubterraneanBunkerEnvironment(ctx, width, height, groundY, time, 0.35);
    drawKineticSpeedLines(ctx, width, height, time, "rgba(56, 189, 248, 0.30)", "horizontal");

    drawMosaicTitanRig(ctx, {
      x: 1395,
      y: groundY,
      scale: 1.24,
      time,
      assemblyProgress: 1.0,
      mode: "sparring",
      talkEnergy: activeLine?.speaker === "Mosaic" ? talkEnergy : 0,
    });

    if (sceneProgress < 0.44) {
      // Phase 1: Blazing Kinetic Sphere Dodgeball Catch & Rocket Return!
      const orbT = sceneProgress / 0.44;
      const orbX = lerp(1080, 560, Math.sin(orbT * Math.PI));
      const orbY = lerp(550, 600, Math.sin(orbT * Math.PI)) - Math.sin(orbT * Math.PI * 2) * 85;

      // Trailing plasma rings
      for (let tr = 1; tr <= 4; tr++) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.55 - tr * 0.11})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(orbX + tr * 28, orbY + tr * 6, 38 - tr * 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      const orbGrad = ctx.createRadialGradient(orbX, orbY, 6, orbX, orbY, 52);
      orbGrad.addColorStop(0, "#ffffff");
      orbGrad.addColorStop(0.45, "#38bdf8");
      orbGrad.addColorStop(0.8, "#ec4899");
      orbGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(orbX, orbY, 52, 0, Math.PI * 2);
      ctx.fill();

      drawHumanoidRig(ctx, {
        x: 470,
        y: groundY,
        scale: 1.24,
        facing: 1,
        character: "Traveler",
        pose: "catch",
        talkEnergy: activeLine?.speaker === "Traveler" ? talkEnergy : 0,
        time,
        hasExosuit: true,
        hasWristband: true,
      });
    } else {
      // Phase 2: Traveler vaults onto the giant's sweeping fist, sprints up its arm, and clamps boots!
      const climbT = clamp((sceneProgress - 0.44) / 0.56, 0, 1);
      const travX = lerp(995, 1265, climbT);
      const travY = lerp(635, 468, climbT);

      // Motion after-image during the sprint up the arm
      if (climbT < 0.75) {
        drawHumanoidRig(ctx, {
          x: travX - 48,
          y: travY + 24,
          scale: 1.08,
          facing: 1,
          character: "Traveler",
          pose: "run",
          alpha: 0.30,
          time: time - 0.06,
          hasExosuit: true,
          hasWristband: true,
          hasBootClamps: true,
        });
      }

      drawHumanoidRig(ctx, {
        x: travX,
        y: travY,
        scale: 1.12,
        facing: 1,
        character: "Traveler",
        pose: climbT > 0.65 ? "clamp" : "run",
        talkEnergy: activeLine?.speaker === "Traveler" ? talkEnergy : 0,
        time,
        hasExosuit: true,
        hasWristband: true,
        hasBootClamps: true,
      });
    }

    // Suit Telemetry Readout Badge
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.90)";
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 2.8;
    roundRectPath(ctx, 64, 138, 560, 86, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 17px monospace";
    ctx.fillText("ARCHITECT-S1 EXOSUIT ADAPTATION TELEMETRY", 88, 170);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "15px monospace";
    ctx.fillText("MAG-BOOT CLAMPS: LOCKED | ARMOR: 94% | POWER: 64%", 88, 202);
    ctx.restore();
  } else if (sceneIndex === 9) {
    // =========================================================================
    // S10: ADAPTABILITY AS A PHILOSOPHY — Awakening of 15cm Shapeshifter ARCHITECT-S2
    // =========================================================================
    drawSubterraneanBunkerEnvironment(ctx, width, height, groundY, time, 0.15);

    drawMosaicTitanRig(ctx, {
      x: 1385,
      y: groundY,
      scale: 1.22,
      time,
      assemblyProgress: 1.0,
      mode: "offering",
      talkEnergy: 0,
    });

    drawHumanoidRig(ctx, {
      x: 545,
      y: groundY,
      scale: 1.24,
      facing: 1,
      character: "Traveler",
      pose: "point",
      talkEnergy: activeLine?.speaker === "Traveler" ? talkEnergy : 0,
      time,
      hasExosuit: true,
      hasWristband: true,
      hasBootClamps: true,
    });

    // Dual Emerald & Violet Control Field Beams weaving intelligence into the floating metal lattice
    ctx.save();
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3.5;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(635, 635);
    ctx.lineTo(960, 535);
    ctx.stroke();

    ctx.strokeStyle = "#f472b6";
    ctx.beginPath();
    ctx.moveTo(1045, 555);
    ctx.lineTo(960, 535);
    ctx.stroke();
    ctx.restore();

    // Floating 15cm Shapeshifting Companion ARCHITECT-S2
    drawMiniShapeshifterRig(
      ctx,
      960,
      535,
      1.42,
      time,
      "morph",
      activeLine?.speaker === "ARCHITECT-S2" ? talkEnergy : 0
    );

    drawForegroundAtmosphere(ctx, width, height, time, "#a78bfa");
  } else {
    // =========================================================================
    // S11: THE FREEDOM TO CHOOSE — Mosaic Claims Its Name & The Ancient Ring Halts!
    // =========================================================================
    drawSubterraneanBunkerEnvironment(ctx, width, height, groundY, time, 0.05);

    // Top Checkpoint & Ring Halt Status Banner
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    roundRectPath(ctx, 510, 124, 900, 76, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f472b6";
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText("CHECKPOINT 11:10 — ANCIENT RING ROTATION: HALTED (0.00 rad/s)", 960, 156);
    ctx.fillStyle = "#bae6fd";
    ctx.font = "15px monospace";
    ctx.fillText("EXOSUIT ARMOR: 94% | POWER: 64% | TEAM: TRAVELER, ARCHITECT-S1, ARCHITECT-S2, MOSAIC", 960, 184);
    ctx.restore();

    // Surface Comms Holo-Window for Velocity
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3.2;
    roundRectPath(ctx, 100, 240, 330, 370, 16);
    ctx.fill();
    ctx.stroke();
    drawHumanoidRig(ctx, {
      x: 265,
      y: 540,
      scale: 0.96,
      facing: 1,
      character: "Velocity",
      pose: "point",
      talkEnergy: activeLine?.speaker === "Velocity" ? talkEnergy : 0,
      time,
      isHologram: true,
    });
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SURFACE COMMS: VELOCITY", 265, 578);
    ctx.fillStyle = "#86efac";
    ctx.font = "12px monospace";
    ctx.fillText("AEGIS PRIME STABLE IN MED-BAY", 265, 598);
    ctx.restore();

    // Traveler with ARCHITECT-S2 perched on his shoulder pauldron
    drawHumanoidRig(ctx, {
      x: 735,
      y: groundY,
      scale: 1.26,
      facing: 1,
      character: "Traveler",
      pose: "idle",
      talkEnergy: activeLine?.speaker === "Traveler" ? talkEnergy : 0,
      time,
      hasExosuit: true,
      hasWristband: true,
      hasBootClamps: true,
      hasShoulderBot: true,
    });

    // Mosaic in Warm Rose-Gold Awakened Superhero Form
    drawMosaicTitanRig(ctx, {
      x: 1330,
      y: groundY,
      scale: 1.24,
      time,
      assemblyProgress: 1.0,
      mode: "awakened",
      talkEnergy: activeLine?.speaker === "Mosaic" ? talkEnergy : 0,
    });

    drawForegroundAtmosphere(ctx, width, height, time, "#f472b6");
  }

  // Restore camera transform before drawing screen-locked HUD & Captions
  ctx.restore();

  // 2. Top-Left Scene & Timecode HUD Pill (Screen-Locked)
  if (scene) {
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
    ctx.lineWidth = 2.2;
    roundRectPath(ctx, 48, 34, 580, 68, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${scene.title}  •  Day 1, ${scene.timecode}`, 68, 62);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "14px monospace";
    ctx.fillText(`LOCATION: ${scene.location.toUpperCase()}`, 68, 86);
    ctx.restore();
  }

  // 3. Synchronized Caption Safe-Zone Card (y = 922..1050, Screen-Locked)
  if (showCaptions && (activeLine || activeSfx)) {
    ctx.save();
    const boxX = 130;
    const boxY = 922;
    const boxW = width - 260;
    const boxH = 128;

    const spk = activeLine ? activeLine.speaker : "Narrator";
    const pal = SPEAKER_PALETTE[spk] || SPEAKER_PALETTE.Narrator;

    ctx.fillStyle = "rgba(2, 6, 23, 0.90)";
    ctx.strokeStyle = pal.border;
    ctx.lineWidth = 3;
    roundRectPath(ctx, boxX, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.stroke();

    if (activeLine) {
      // Speaker Name Pill
      ctx.fillStyle = pal.badge;
      roundRectPath(ctx, boxX + 24, boxY + 15, 215, 32, 8);
      ctx.fill();
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = pal.text;
      ctx.font = "bold 15px monospace";
      ctx.textAlign = "center";
      ctx.fillText(spk.toUpperCase(), boxX + 131, boxY + 36);

      // Voice ID & Descriptive Tag
      ctx.fillStyle = "#94a3b8";
      ctx.font = "13px monospace";
      ctx.textAlign = "left";
      const roleNote = activeLine.speaker === "Narrator"
        ? `KOKORO VOICE: ${activeLine.voice} (DESCRIPTIVE AUDIO)`
        : `KOKORO VOICE: ${activeLine.voice} (CHARACTER DIALOGUE)`;
      ctx.fillText(roleNote, boxX + 255, boxY + 36);

      // Caption text (wrapped up to 2 lines)
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 23px sans-serif";
      const words = activeLine.caption.split(" ");
      let line1 = "";
      let line2 = "";
      for (const w of words) {
        const test = line1 ? `${line1} ${w}` : w;
        if (ctx.measureText(test).width < boxW - 56) {
          line1 = test;
        } else {
          line2 = line2 ? `${line2} ${w}` : w;
        }
      }
      ctx.fillText(line1, boxX + 26, boxY + 78);
      if (line2) {
        ctx.fillText(line2, boxX + 26, boxY + 108);
      }
    }

    // Active SFX indicator pill on top-right of caption bar
    if (activeSfx) {
      ctx.fillStyle = "rgba(15, 118, 110, 0.92)";
      ctx.strokeStyle = "#2dd4bf";
      ctx.lineWidth = 1.5;
      const sfxLabel = `[SFX: ${activeSfx.description}]`;
      ctx.font = "bold 13px monospace";
      const sw = Math.min(720, ctx.measureText(sfxLabel).width + 34);
      roundRectPath(ctx, boxX + boxW - sw - 20, boxY + 15, sw, 30, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ccfbf1";
      ctx.textAlign = "center";
      ctx.fillText(sfxLabel, boxX + boxW - 20 - sw * 0.5, boxY + 35);
    }

    ctx.restore();
  }
}
