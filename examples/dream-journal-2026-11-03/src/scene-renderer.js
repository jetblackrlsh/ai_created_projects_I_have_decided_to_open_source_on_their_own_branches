/**
 * Scene Renderer v3 for "Echoes in the Static & The Unfinished Bite (Dream Journal 11/03/2026)"
 *
 * Implements:
 * 1. High-Detail Stylized Anime Characters (`drawMasterAnimeCharacter` & `drawMasterMuppetCharacter`)
 *    for ALL 9 cast members (sculpted jawlines, 3-tone cel shading, jewel anime eyes with winged lashes
 *    & dual catchlights, crown hair halo bands, articulated limbs/hands, and detailed clothing folds).
 * 2. Rich Painterly Anime Backgrounds across ALL 6 scenes (both outdoor and indoor/architectural):
 *    - S01: Deep Storyverse Nebula Void, painted starfield clouds, 6 miniature painted story-world
 *           biosphere bubbles, golden constellation threads, and Lucid Light god-rays.
 *    - S02: Hand-painted rustic log-cabin timber walls (`drawPainterlyTimberWall`), river-stone hearth
 *           with flickering anime fire (`drawPainterlyStoneHearth`), sculpted oak-plaque buck trophies
 *           (`drawDetailedBuckTrophy`), wood-paneled bathroom with vanity mirror & crystalline glass shards,
 *           plush leather lodge sofa, woven rug, and vintage wood-cabinet CRT TV hissing with cosmic static.
 *    - S03: Ornate Parisian/European Café-Hotel (`L'Hôtel du Sommeil`) with wainscoted walls, twilight arched
 *           windows (`drawPainterlyArchedWindow`), brass key-cubby matrix, espresso bar with brass machine &
 *           pastry cloches, tufted leather booths, bilingual translation wave HUD, and sleep-debt ledger.
 *    - S04: Candlelit Arcane Curiosity Sanctum with floor-to-ceiling bookcases (`drawPainterlyBookshelfSection`),
 *           lancet stained-glass window, velvet reading table, 99,999-Gold glass cloche relic, and the open
 *           illuminated Pop-Up Grimoire with 3D painted brass-and-crystal components assembling in midair.
 *    - S05: Sunlit Makoto Shinkai outdoor shopping promenade with cumulus cloud banks, Ghibli bristle foliage,
 *           pastel brick café facade, striped awning, wrought-iron 9:45 AM clock tower, cobblestone walkway,
 *           rolling partial-lucidity dream cloud, and Handel's Ice Cream golden mirage.
 *    - S06: Opulent Five-Star Palace Banquet Hall with 3 tall twilight arched windows (`drawPainterlyArchedWindow`),
 *           velvet draperies, sparkling crystal chandeliers, damask banquet table with candelabras & crystal stemware,
 *           and the centerpiece Cheesecake-Chicken-Tender-Ranch sandwich with lifting silver fork & 7:00 AM alarm shockwave.
 * 3. Multi-Shot Cinematic Camera Director (`computeCinematicShot`, `applyCameraTransform`, `drawDepthOfFieldBokeh`)
 *    executing 10 distinct camera shot types (wide, medium, close_up, extreme_close_up, ots_left, ots_right,
 *    low_angle, dutch_tilt, pan_left_to_right, push_in, pull_out) with multi-plane parallax.
 */

import {
  mulberry32,
  clamp,
  lerp,
  smoothstep,
  traceScallopedBrushBlob,
  fillBristleCluster,
  drawInkedPolygon,
  drawWeatheredPlate,
  drawMossCluster,
  drawImpastoCloud,
  drawPainterlySkyAndClouds,
  drawForestCanopyVista,
  drawAnamorphicStarGlint,
  drawFallingLeavesAndPollen,
  drawCinemaCaptionsAndHud,
  computeCinematicShot,
  applyCameraTransform,
  drawDepthOfFieldBokeh,
  drawMasterAnimeCharacter,
  drawMasterMuppetCharacter,
  drawPainterlyTimberWall,
  drawDetailedBuckTrophy,
  drawPainterlyStoneHearth,
  drawPainterlyBookshelfSection,
  drawPainterlyArchedWindow,
  getCachedLayer,
} from './painterly-anime-engine.js';

export const SCENE_META = {
  S01: {
    id: 'S01',
    title: 'The Storyverse Void & Avatar of Nova',
    sub: 'Full Lucidity in the Sparkling Purple Void',
    palette: { skyTop: '#070312', skyMid: '#1a0938', skyBot: '#351266', accent: '#c084fc', gold: '#ffd166' },
  },
  S02: {
    id: 'S02',
    title: "The Hunter's Lodge & Cosmic Static",
    sub: 'Shattered Glass, Muppet Relatives & Big Bang Relic Radiation',
    palette: { skyTop: '#1b120c', skyMid: '#332015', skyBot: '#4c2f1d', accent: '#60a5fa', gold: '#f59e0b' },
  },
  S03: {
    id: 'S03',
    title: 'Booth Hide-and-Seek & The Hourly Sleep-Debt Hotel',
    sub: 'Translated Menus & Meals Paid in Hours Slept',
    palette: { skyTop: '#16111c', skyMid: '#2d1e36', skyBot: '#492b4a', accent: '#38bdf8', gold: '#fbbf24' },
  },
  S04: {
    id: 'S04',
    title: 'The Pop-Up Grimoire of Living Relics',
    sub: '3D Painted Artifacts Assembled Directly from the Page',
    palette: { skyTop: '#1c120b', skyMid: '#3b2414', skyBot: '#5c381e', accent: '#2dd4bf', gold: '#fcd34d' },
  },
  S05: {
    id: 'S05',
    title: 'The 9:45 AM Milkshake Line & The Lucidity Cloud',
    sub: "Partial Lucidity, Handel's Mirage & The Cocoa-Mint Paradox",
    palette: { skyTop: '#1e6091', skyMid: '#4ea8de', skyBot: '#90e0ef', accent: '#34d399', gold: '#fde047' },
  },
  S06: {
    id: 'S06',
    title: 'The Five-Star Cheesecake-Chicken-Ranch Banquet',
    sub: 'Culinary QA Testing & The Split-Second Waking Alarm',
    palette: { skyTop: '#24141d', skyMid: '#462334', skyBot: '#6b334c', accent: '#fb7185', gold: '#fef08a' },
  },
};

function drawVolumetricGodRays(ctx, W, H, opts = {}) {
  const {
    originX = W * 0.5,
    originY = -60,
    rayCount = 8,
    color = '253, 224, 71',
    intensity = 0.2,
    time = 0,
  } = opts;
  ctx.save();
  for (let i = 0; i < rayCount; i++) {
    const frac = (i + 0.5) / rayCount;
    const targetX = W * (0.08 + frac * 0.84) + Math.sin(time * 0.4 + i) * 35;
    const spread = 55 + (i % 3) * 24;
    const grad = ctx.createLinearGradient(originX, originY, targetX, H);
    grad.addColorStop(0, `rgba(${color}, ${intensity})`);
    grad.addColorStop(0.65, `rgba(${color}, ${intensity * 0.45})`);
    grad.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(originX - 18, originY);
    ctx.lineTo(originX + 18, originY);
    ctx.lineTo(targetX + spread, H);
    ctx.lineTo(targetX - spread, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function getTimelineState(timeline, t) {
  const scenes = timeline?.scenes || [];
  const lines = timeline?.lines || [];

  let activeScene = scenes[0] || {
    id: 'S01',
    title: SCENE_META.S01.title,
    start: 0,
    end: 45,
    duration: 45,
  };

  for (const s of scenes) {
    const sStart = s.start ?? s.start_sec ?? 0;
    const sEnd = s.end ?? s.end_sec ?? 45;
    if (t >= sStart && t <= sEnd) {
      activeScene = s;
      break;
    }
    if (t > sEnd) {
      activeScene = s;
    }
  }

  const activeSceneId = activeScene.id || activeScene.scene_id || 'S01';
  const activeStart = activeScene.start ?? activeScene.start_sec ?? 0;
  const activeEnd = activeScene.end ?? activeScene.end_sec ?? 45;
  const activeDur = activeScene.duration ?? activeScene.duration_sec ?? (activeEnd - activeStart);

  let activeLine = null;
  let lastLineInScene = null;
  for (const l of lines) {
    const lScene = l.scene || l.scene_id;
    const lStart = l.start ?? l.start_sec ?? 0;
    const lEnd = l.end ?? l.end_sec ?? 0;
    if (lScene === activeSceneId && t >= lStart) {
      lastLineInScene = l;
    }
    if (t >= lStart && t <= lEnd) {
      activeLine = l;
      break;
    }
  }

  const lineForCamera = activeLine || lastLineInScene || lines.find((l) => l.scene === activeSceneId) || null;
  const sceneProgress = clamp((t - activeStart) / Math.max(0.1, activeDur), 0, 1);

  let lineProgress = 0;
  let isSpeaking = false;
  let talkEnergy = 0.55;
  if (activeLine) {
    const lStart = activeLine.start ?? activeLine.start_sec ?? 0;
    const lDur = activeLine.duration ?? activeLine.duration_sec ?? 1;
    lineProgress = clamp((t - lStart) / Math.max(0.05, lDur), 0, 1);
    isSpeaking = true;
    const env = activeLine.envelope_20hz;
    if (Array.isArray(env) && env.length > 0) {
      const idx = clamp(Math.floor((t - lStart) * 20), 0, env.length - 1);
      talkEnergy = clamp(env[idx] || 0.45, 0.25, 1.2);
    }
  }

  return {
    t,
    sceneId: activeSceneId,
    scene: activeScene,
    sceneMeta: SCENE_META[activeSceneId] || SCENE_META.S01,
    sceneProgress,
    activeLine,
    lineForCamera,
    lastLineInScene,
    lineProgress,
    isSpeaking,
    talkEnergy,
  };
}

// ============================================================================
// CANONICAL ANIME CHARACTER WRAPPERS (USING `drawMasterAnimeCharacter`)
// ============================================================================

export function drawJetRig(ctx, x, y, scale = 1.0, opts = {}) {
  drawMasterAnimeCharacter(ctx, x, y, scale, {
    skinBase: '#6e4228',
    skinShadow: '#462614',
    skinHighlight: '#965e3d',
    blushColor: 'rgba(185, 80, 65, 0.22)',
    eyeColorTop: '#1c0f08',
    eyeColorMid: '#5c341d',
    eyeColorBot: '#d97706',
    hairStyle: 'dreadlocks',
    hairBase: '#26150c',
    hairShadow: '#120904',
    hairHighlight: '#54321d',
    beard: true,
    outfit: 'hoodie_street',
    primaryColor: '#181b26',
    secondaryColor: '#0d0f17',
    accentColor: '#ffd166',
    skirtOrPantsColor: '#141720',
    hasCrystalSword: true,
    hasCrossbodyBag: true,
    seed: 101,
    ...opts,
  });
}

export function drawNovaRig(ctx, x, y, scale = 1.0, opts = {}) {
  drawMasterAnimeCharacter(ctx, x, y, scale, {
    skinBase: '#f3e8ff',
    skinShadow: '#c084fc',
    skinHighlight: '#ffffff',
    blushColor: 'rgba(192, 132, 252, 0.35)',
    eyeColorTop: '#1e1b4b',
    eyeColorMid: '#38bdf8',
    eyeColorBot: '#fef08a',
    hairStyle: 'celestial_long',
    hairBase: '#a855f7',
    hairShadow: '#4c1d95',
    hairHighlight: '#38bdf8',
    outfit: 'celestial_gown',
    primaryColor: '#4c1d95',
    secondaryColor: '#2e1065',
    accentColor: '#fde047',
    pose: 'float',
    seed: 102,
    ...opts,
  });
}

export function drawAshleyRig(ctx, x, y, scale = 1.0, opts = {}) {
  drawMasterAnimeCharacter(ctx, x, y, scale, {
    skinBase: '#fde2ce',
    skinShadow: '#d9a78a',
    skinHighlight: '#fff5ed',
    blushColor: 'rgba(244, 114, 182, 0.32)',
    eyeColorTop: '#064e3b',
    eyeColorMid: '#10b981',
    eyeColorBot: '#a7f3d0',
    hairStyle: 'curly_long',
    hairBase: '#ea580c',
    hairShadow: '#9a3412',
    hairHighlight: '#fb923c',
    glasses: { shape: 'round', color: '#f472b6' },
    outfit: 'cardigan_skirt',
    primaryColor: '#94a3b8',
    secondaryColor: '#64748b',
    accentColor: '#fde047',
    skirtOrPantsColor: '#6e473b',
    seed: 202,
    ...opts,
  });
}

export function drawGrandmotherRig(ctx, x, y, scale = 1.0, opts = {}) {
  drawMasterAnimeCharacter(ctx, x, y, scale, {
    skinBase: '#f5d5be',
    skinShadow: '#cfa082',
    skinHighlight: '#ffefe3',
    eyeColorTop: '#1e3a8a',
    eyeColorMid: '#60a5fa',
    eyeColorBot: '#dbeafe',
    hairStyle: 'silver_bun',
    hairBase: '#cbd5e1',
    hairShadow: '#94a3b8',
    hairHighlight: '#f8fafc',
    outfit: 'grandma_cardigan',
    primaryColor: '#9a3412',
    secondaryColor: '#7c2d12',
    accentColor: '#fef3c7',
    skirtOrPantsColor: '#451a03',
    hasBandageArm: true,
    seed: 301,
    ...opts,
  });
}

export function drawDaughterRig(ctx, x, y, scale = 1.0, opts = {}) {
  drawMasterAnimeCharacter(ctx, x, y, scale, {
    skinBase: '#f7d9c4',
    skinShadow: '#cfa286',
    skinHighlight: '#fff2e8',
    eyeColorTop: '#312e81',
    eyeColorMid: '#818cf8',
    eyeColorBot: '#e0e7ff',
    hairStyle: 'sleek_bob',
    hairBase: '#451a03',
    hairShadow: '#270e02',
    hairHighlight: '#78350f',
    outfit: 'casual_sweater',
    primaryColor: '#2563eb',
    secondaryColor: '#1d4ed8',
    accentColor: '#f8fafc',
    skirtOrPantsColor: '#1e293b',
    hasBandageArm: true,
    seed: 302,
    ...opts,
  });
}

export function drawConciergeRig(ctx, x, y, scale = 1.0, opts = {}) {
  drawMasterAnimeCharacter(ctx, x, y, scale, {
    skinBase: '#f8dcc8',
    skinShadow: '#d1a488',
    skinHighlight: '#fff4ec',
    eyeColorTop: '#3b0764',
    eyeColorMid: '#a855f7',
    eyeColorBot: '#f3e8ff',
    hairStyle: 'sleek_bob',
    hairBase: '#1e1b4b',
    hairShadow: '#0f0d26',
    hairHighlight: '#4338ca',
    outfit: 'concierge_suit',
    primaryColor: '#4c1d95',
    secondaryColor: '#2e1065',
    accentColor: '#fbbf24',
    skirtOrPantsColor: '#1e1b4b',
    seed: 401,
    ...opts,
  });
}

export function drawSleepyClerkRig(ctx, x, y, scale = 1.0, opts = {}) {
  drawMasterAnimeCharacter(ctx, x, y, scale, {
    skinBase: '#cbd5e1',
    skinShadow: '#94a3b8',
    skinHighlight: '#e2e8f0',
    blushColor: 'rgba(100, 116, 139, 0.2)',
    eyeColorTop: '#334155',
    eyeColorMid: '#64748b',
    eyeColorBot: '#cbd5e1',
    expression: 'sleepy',
    hairStyle: 'short_tousled',
    hairBase: '#334155',
    hairShadow: '#1e293b',
    hairHighlight: '#64748b',
    outfit: 'clerk_vest',
    primaryColor: '#1e293b',
    secondaryColor: '#0f172a',
    accentColor: '#991b1b',
    skirtOrPantsColor: '#0f172a',
    seed: 402,
    ...opts,
  });
}

export function drawQAAcquaintanceRig(ctx, x, y, scale = 1.0, opts = {}) {
  drawMasterAnimeCharacter(ctx, x, y, scale, {
    skinBase: '#f4d3bc',
    skinShadow: '#cc9e80',
    skinHighlight: '#ffefe3',
    eyeColorTop: '#0f766e',
    eyeColorMid: '#14b8a6',
    eyeColorBot: '#99f6e4',
    hairStyle: 'short_tousled',
    hairBase: '#5c2d16',
    hairShadow: '#36190b',
    hairHighlight: '#8f4926',
    glasses: { shape: 'rect', color: '#1e293b' },
    outfit: 'casual_sweater',
    primaryColor: '#0284c7',
    secondaryColor: '#0369a1',
    accentColor: '#fbbf24',
    skirtOrPantsColor: '#1e293b',
    seed: 501,
    ...opts,
  });
}

export function drawHorrifiedDinerRig(ctx, x, y, scale = 1.0, opts = {}) {
  drawMasterAnimeCharacter(ctx, x, y, scale, {
    skinBase: '#f7d8c4',
    skinShadow: '#d1a286',
    skinHighlight: '#fff2e8',
    eyeColorTop: '#701a75',
    eyeColorMid: '#d946ef',
    eyeColorBot: '#fae8ff',
    expression: 'horrified',
    hairStyle: 'silver_bun',
    hairBase: '#581c87',
    hairShadow: '#3b0764',
    hairHighlight: '#9333ea',
    outfit: 'evening_dress',
    primaryColor: '#be123c',
    secondaryColor: '#881337',
    accentColor: '#fde047',
    skirtOrPantsColor: '#881337',
    seed: 601,
    ...opts,
  });
}

// ============================================================================
// SCENE 01: THE STORYVERSE VOID & AVATAR OF NOVA
// ============================================================================
function renderScene01StoryverseVoid(ctx, W, H, time, state) {
  const speaker = state.activeLine?.speaker || '';
  const anchors = {
    Center: { x: W * 0.5, y: H * 0.52 },
    Narrator: { x: W * 0.5, y: H * 0.52 },
    Jet: { x: W * 0.34, y: H * 0.48 },
    Nova: { x: W * 0.66, y: H * 0.46 },
  };
  const cam = computeCinematicShot({ ...state, activeLine: state.lineForCamera, time }, anchors, W, H);

  // 1. Far Background Layer (0.35x parallax): Deep Cosmic Storyverse Nebula & Painted Starclouds
  ctx.save();
  applyCameraTransform(ctx, cam, W, H, 0.35);

  const bgLayer = getCachedLayer(`s01_bg_${W}_${H}`, W, H, (bctx) => {
    const sky = bctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0.0, '#05020d');
    sky.addColorStop(0.38, '#170833');
    sky.addColorStop(0.75, '#2d0f5c');
    sky.addColorStop(1.0, '#4a1882');
    bctx.fillStyle = sky;
    bctx.fillRect(0, 0, W, H);

    // Painterly Nebula Bristle Swirls across the Void
    const nCols = ['rgba(168, 85, 247, 0.20)', 'rgba(236, 72, 153, 0.16)', 'rgba(56, 189, 248, 0.16)', 'rgba(250, 204, 21, 0.12)'];
    for (let i = 0; i < 24; i++) {
      const nx = (W * ((i * 173) % 100)) / 100;
      const ny = (H * ((i * 229) % 88)) / 100;
      fillBristleCluster(bctx, nx, ny, 140 + (i % 4) * 45, 58 + (i % 3) * 25, nCols[i % 4], 900 + i, 12);
    }

    // Dense Makoto Shinkai Starfield & Golden Storyverse Constellation Maps across the Void
    const sRng = mulberry32(911);
    const starPts = [];
    for (let s = 0; s < 260; s++) {
      const sx = sRng() * W;
      const sy = sRng() * H * 0.88;
      const rad = 1.0 + (s % 3) * 0.85;
      bctx.fillStyle = s % 4 === 0 ? '#fde047' : s % 3 === 0 ? '#7dd3fc' : '#f5d0fe';
      bctx.beginPath();
      bctx.arc(sx, sy, rad, 0, Math.PI * 2);
      bctx.fill();
      if (s < 48) starPts.push([sx, sy]);
    }
    bctx.strokeStyle = 'rgba(253, 224, 71, 0.34)';
    bctx.lineWidth = 1.2;
    for (let i = 0; i < starPts.length - 1; i++) {
      if (i % 3 !== 2) {
        bctx.beginPath();
        bctx.moveTo(starPts[i][0], starPts[i][1]);
        bctx.lineTo(starPts[i + 1][0], starPts[i + 1][1]);
        bctx.stroke();
      }
    }

    // Concentric Celestial Astrolabe Rings in the Deep Void
    bctx.strokeStyle = 'rgba(192, 132, 252, 0.28)';
    bctx.lineWidth = 1.6;
    for (const rad of [220, 340, 480, 640]) {
      bctx.beginPath();
      bctx.ellipse(W * 0.5, H * 0.46, rad, rad * 0.52, -0.12, 0, Math.PI * 2);
      bctx.stroke();
    }

    // Painterly Impasto Astral Cloud Banks
    drawImpastoCloud(bctx, W * 0.22, H * 0.28, 460, 125, 11);
    drawImpastoCloud(bctx, W * 0.78, H * 0.32, 480, 130, 22);
    drawImpastoCloud(bctx, W * 0.50, H * 0.78, 620, 110, 33);

    // Astral Floor Horizon Reflection Pools
    for (let r = 0; r < 14; r++) {
      const rx = W * (0.12 + (r * 0.76) / 13);
      const ry = H * (0.82 + (r % 3) * 0.04);
      fillBristleCluster(bctx, rx, ry, 95, 16, r % 2 === 0 ? 'rgba(192, 132, 252, 0.24)' : 'rgba(56, 189, 248, 0.20)', 950 + r, 8);
    }
  });
  ctx.drawImage(bgLayer, 0, 0);

  drawVolumetricGodRays(ctx, W, H, {
    originX: W * 0.5,
    originY: -80,
    rayCount: 10,
    color: '192, 132, 252',
    intensity: 0.22,
    time,
  });
  ctx.restore();

  // 2. Midground Layer (0.72x parallax): 6 Floating Miniature Story-World Biosphere Bubbles
  ctx.save();
  applyCameraTransform(ctx, cam, W, H, 0.72);
  const worlds = [
    { x: W * 0.14, y: H * 0.25, r: 82, rim: '#38bdf8', treeCol: '#22c55e', skyCol: '#0ea5e9' },
    { x: W * 0.85, y: H * 0.23, r: 94, rim: '#f472b6', treeCol: '#ec4899', skyCol: '#831843' },
    { x: W * 0.20, y: H * 0.68, r: 68, rim: '#a78bfa', treeCol: '#8b5cf6', skyCol: '#312e81' },
    { x: W * 0.81, y: H * 0.69, r: 74, rim: '#34d399', treeCol: '#10b981', skyCol: '#064e3b' },
    { x: W * 0.50, y: H * 0.16, r: 62, rim: '#fbbf24', treeCol: '#f59e0b', skyCol: '#78350f' },
    { x: W * 0.50, y: H * 0.74, r: 52, rim: '#60a5fa', treeCol: '#38bdf8', skyCol: '#1e3a8a' },
  ];
  for (let i = 0; i < worlds.length; i++) {
    const b = worlds[i];
    const bx = b.x + Math.sin(time * 0.9 + i * 1.4) * 14;
    const by = b.y + Math.cos(time * 1.1 + i * 1.7) * 12;

    ctx.save();
    ctx.beginPath();
    ctx.arc(bx, by, b.r, 0, Math.PI * 2);
    ctx.clip();

    // Miniature painted world inside each bubble!
    const wGrad = ctx.createLinearGradient(bx, by - b.r, bx, by + b.r);
    wGrad.addColorStop(0, b.skyCol);
    wGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = wGrad;
    ctx.fillRect(bx - b.r, by - b.r, b.r * 2, b.r * 2);

    // Miniature mountain silhouette & bristle foliage island inside the bubble
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(bx - b.r, by + b.r);
    ctx.lineTo(bx - b.r * 0.35, by + b.r * 0.05);
    ctx.lineTo(bx + b.r * 0.25, by + b.r * 0.20);
    ctx.lineTo(bx + b.r, by - b.r * 0.05);
    ctx.lineTo(bx + b.r, by + b.r);
    ctx.closePath();
    ctx.fill();
    fillBristleCluster(ctx, bx, by + b.r * 0.45, b.r * 0.72, b.r * 0.32, b.treeCol, 1000 + i, 6);
    ctx.restore();

    // Iridescent glass bubble rim & specular crescent
    ctx.strokeStyle = b.rim;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(bx, by, b.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.beginPath();
    ctx.ellipse(bx - b.r * 0.35, by - b.r * 0.35, b.r * 0.22, b.r * 0.1, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. Stage Layer (1.0x parallax): Jet, Nova & Golden Story-Brainstorming Constellation Core
  ctx.save();
  applyCameraTransform(ctx, cam, W, H, 1.0);

  // Golden constellation threads connecting Jet and Nova
  ctx.save();
  const coreX = W * 0.5;
  const coreY = H * 0.47 + Math.sin(time * 2.2) * 8;
  const cGrad = ctx.createRadialGradient(coreX, coreY, 6, coreX, coreY, 95);
  cGrad.addColorStop(0, 'rgba(254, 240, 138, 0.92)');
  cGrad.addColorStop(0.45, 'rgba(192, 132, 252, 0.42)');
  cGrad.addColorStop(1, 'rgba(192, 132, 252, 0)');
  ctx.fillStyle = cGrad;
  ctx.beginPath();
  ctx.arc(coreX, coreY, 95, 0, Math.PI * 2);
  ctx.fill();

  for (let r = 0; r < 3; r++) {
    ctx.save();
    ctx.translate(coreX, coreY);
    ctx.rotate(time * (0.6 + r * 0.3) + r);
    ctx.strokeStyle = r % 2 === 0 ? 'rgba(253, 224, 71, 0.78)' : 'rgba(56, 189, 248, 0.72)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, 68, 24, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  drawAnamorphicStarGlint(ctx, coreX, coreY, 42, 0.95, '#fef08a');
  ctx.restore();

  drawJetRig(ctx, W * 0.33, H * 0.67, 1.38, {
    time,
    facing: 1,
    speaking: speaker === 'Jet',
    talkEnergy: state.talkEnergy,
    pose: 'float',
    armRaise: speaker === 'Jet' ? 0.55 : 0.25,
    expression: 'focused',
  });

  drawNovaRig(ctx, W * 0.67, H * 0.66, 1.38, {
    time,
    facing: -1,
    speaking: speaker === 'Nova',
    talkEnergy: state.talkEnergy,
    pose: 'float',
    armRaise: speaker === 'Nova' ? 0.6 : 0.3,
  });
  ctx.restore();

  // 4. Foreground Bokeh & Lucid Light Sparkles
  drawFallingLeavesAndPollen(ctx, W, H, time, 24, 105);
  drawDepthOfFieldBokeh(ctx, W, H, cam, state.sceneMeta.palette, time, 109);
}

// ============================================================================
// SCENE 02: THE HUNTER'S LODGE, SHATTERED GLASS & MUPPET CRT STATIC
// ============================================================================
function renderScene02HuntersLodgeStatic(ctx, W, H, time, state) {
  const speaker = state.activeLine?.speaker || '';
  const lineId = state.lineForCamera?.id || 'L04';
  const isBathroomPhase = lineId === 'L04' || lineId === 'L05' || lineId === 'L06';

  const anchors = {
    Bathroom: { x: W * 0.22, y: H * 0.56 },
    Daughter: { x: W * 0.16, y: H * 0.55 },
    Grandmother: { x: isBathroomPhase ? W * 0.27 : W * 0.34, y: H * 0.55 },
    Muppets: { x: W * 0.56, y: H * 0.56 },
    CRT: { x: W * 0.82, y: H * 0.56 },
    Narrator: { x: W * 0.52, y: H * 0.54 },
  };
  const cam = computeCinematicShot({ ...state, activeLine: state.lineForCamera, time }, anchors, W, H);

  // 1. Cached Painterly Timber Lodge Architecture, Stone Hearth, Buck Trophies & Tiled Bathroom
  ctx.save();
  applyCameraTransform(ctx, cam, W, H, 0.55);

  const lodgeBg = getCachedLayer(`s02_lodge_bg_${W}_${H}`, W, H, (bctx) => {
    // Hand-painted timber wall & plank floor
    drawPainterlyTimberWall(bctx, 0, 0, W, H * 0.73, 210);
    const floorGrad = bctx.createLinearGradient(0, H * 0.73, 0, H);
    floorGrad.addColorStop(0, '#29170d');
    floorGrad.addColorStop(1, '#120904');
    bctx.fillStyle = floorGrad;
    bctx.fillRect(0, H * 0.73, W, H * 0.27);

    // Floor perspective plank seams
    bctx.strokeStyle = 'rgba(10, 5, 2, 0.55)';
    bctx.lineWidth = 2;
    for (let px = 0; px <= W; px += 120) {
      bctx.beginPath();
      bctx.moveTo(W * 0.5 + (px - W * 0.5) * 0.65, H * 0.73);
      bctx.lineTo(px, H);
      bctx.stroke();
    }

    // Woven Navajo/Lodge Crimson & Gold Braided Rug
    bctx.fillStyle = '#5c141b';
    bctx.strokeStyle = '#d97706';
    bctx.lineWidth = 4;
    bctx.beginPath();
    bctx.ellipse(W * 0.56, H * 0.83, 410, 58, 0, 0, Math.PI * 2);
    bctx.fill();
    bctx.stroke();
    bctx.strokeStyle = '#fde047';
    bctx.lineWidth = 2;
    bctx.beginPath();
    bctx.ellipse(W * 0.56, H * 0.83, 350, 42, 0, 0, Math.PI * 2);
    bctx.stroke();

    // Detailed Sculpted Buck Trophies along Upper Log Wall
    drawDetailedBuckTrophy(bctx, W * 0.38, H * 0.18, 0.92, 221);
    drawDetailedBuckTrophy(bctx, W * 0.56, H * 0.16, 1.02, 222);
    drawDetailedBuckTrophy(bctx, W * 0.74, H * 0.18, 0.92, 223);

    // Left Cutaway: Tiled Bathroom Alcove with Vanity Mirror, Sink, Medicine Cabinet & Doorframe
    bctx.fillStyle = '#162436';
    bctx.fillRect(36, 84, 305, H * 0.67);
    // Ceramic wall tiles grid
    bctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    bctx.lineWidth = 1.2;
    for (let tx = 40; tx < 340; tx += 30) {
      bctx.beginPath();
      bctx.moveTo(tx, 88);
      bctx.lineTo(tx, 84 + H * 0.67);
      bctx.stroke();
    }
    for (let ty = 90; ty < 84 + H * 0.67; ty += 30) {
      bctx.beginPath();
      bctx.moveTo(36, ty);
      bctx.lineTo(341, ty);
      bctx.stroke();
    }
    // Vanity mirror with diagonal reflection & porcelain sink basin
    const mirGrad = bctx.createLinearGradient(84, 130, 290, 310);
    mirGrad.addColorStop(0, '#1e3a5f');
    mirGrad.addColorStop(0.5, '#3b6998');
    mirGrad.addColorStop(1, '#172a45');
    drawInkedPolygon(bctx, [[84, 135], [292, 135], [292, 295], [84, 295]], mirGrad, '#cbd5e1', 3.5, 230, 0.03);
    // Porcelain pedestal sink & brass faucet
    drawInkedPolygon(bctx, [[125, 430], [250, 430], [235, 475], [140, 475]], '#e2e8f0', '#475569', 2.0, 231, 0.05);
    // Heavy timber doorframe
    bctx.strokeStyle = '#78350f';
    bctx.lineWidth = 12;
    bctx.strokeRect(36, 84, 305, H * 0.67);
  });
  ctx.drawImage(lodgeBg, 0, 0);

  // Live flickering River-Stone Lodge Hearth on the back-right wall
  drawPainterlyStoneHearth(ctx, W * 0.83, H * 0.14, 210, H * 0.59, time, 240);
  ctx.restore();

  // 2. Stage Layer (1.0x parallax): Bathroom Characters, Shattered Glass, Muppet Couch & CRT TV
  ctx.save();
  applyCameraTransform(ctx, cam, W, H, 1.0);

  // Crystalline Broken Glass Bottle Shards glinting on the bathroom tile floor
  const rng = mulberry32(250);
  for (let s = 0; s < 16; s++) {
    const sx = 82 + rng() * 215;
    const sy = H * 0.72 + rng() * 34;
    ctx.fillStyle = s % 2 === 0 ? '#7dd3fc' : '#f0f9ff';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 14, sy + 5);
    ctx.lineTo(sx + 5, sy + 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Daughter & Grandmother
  drawDaughterRig(ctx, 132, H * 0.74, 1.12, {
    time,
    facing: 1,
    speaking: speaker === 'Daughter',
    talkEnergy: state.talkEnergy,
    expression: 'surprised',
  });

  const grandmaX = isBathroomPhase ? 255 : 395;
  const grandmaFacing = 1;
  drawGrandmotherRig(ctx, grandmaX, H * 0.74, 1.12, {
    time,
    facing: grandmaFacing,
    speaking: speaker === 'Grandmother',
    talkEnergy: state.talkEnergy,
    pose: isBathroomPhase ? 'stand' : 'plead',
    expression: 'surprised',
  });

  // Plush Tufted Leather Lodge Sofa & 5 Fuzzy Felt Muppet Relatives in Flannel & Camo
  drawInkedPolygon(
    ctx,
    [[W * 0.36, H * 0.54], [W * 0.70, H * 0.54], [W * 0.71, H * 0.75], [W * 0.35, H * 0.75]],
    '#451a03',
    '#18131e',
    2.5,
    260,
    0.06
  );

  const muppets = [
    { x: W * 0.41, y: H * 0.75, felt: '#f59e0b', sh: '#b45309', hi: '#fde047', shirt: 'flannel_red', seed: 311 },
    { x: W * 0.48, y: H * 0.73, felt: '#14b8a6', sh: '#0f766e', hi: '#5eead4', shirt: 'white_tee', seed: 312 },
    { x: W * 0.55, y: H * 0.76, felt: '#a855f7', sh: '#6b21a8', hi: '#d8b4fe', shirt: 'camo', seed: 313 },
    { x: W * 0.62, y: H * 0.73, felt: '#f97316', sh: '#c2410c', hi: '#fdba74', shirt: 'flannel_gold', seed: 314 },
    { x: W * 0.69, y: H * 0.76, felt: '#84cc16', sh: '#4d7c0f', hi: '#bef264', shirt: 'camo', seed: 315 },
  ];
  for (const m of muppets) {
    drawMasterMuppetCharacter(ctx, m.x, m.y, 1.02, {
      time,
      facing: 1,
      speaking: false,
      feltColor: m.felt,
      feltShadow: m.sh,
      feltHighlight: m.hi,
      shirtType: m.shirt,
      seed: m.seed,
    });
  }

  // Vintage Wood-Cabinet CRT Television Hissing with Cosmic Microwave Background Static
  const tvX = W * 0.75;
  const tvY = H * 0.44;
  const tvW = 245;
  const tvH = 195;

  // Blue-white CRT static light cone washing over the Muppets
  const coneGrad = ctx.createLinearGradient(tvX, tvY + tvH * 0.5, W * 0.36, H * 0.62);
  coneGrad.addColorStop(0, 'rgba(186, 230, 253, 0.42)');
  coneGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');
  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(tvX, tvY + 18);
  ctx.lineTo(W * 0.36, H * 0.38);
  ctx.lineTo(W * 0.36, H * 0.78);
  ctx.lineTo(tvX, tvY + tvH - 18);
  ctx.closePath();
  ctx.fill();

  // TV wooden stand & cabinet
  drawInkedPolygon(ctx, [[tvX + 25, tvY + tvH], [tvX + tvW - 25, tvY + tvH], [tvX + tvW - 15, H * 0.76], [tvX + 15, H * 0.76]], '#271206', '#18131e', 2.0, 270, 0.05);
  drawInkedPolygon(ctx, [[tvX, tvY], [tvX + tvW, tvY], [tvX + tvW, tvY + tvH], [tvX, tvY + tvH]], '#451a03', '#18131e', 2.5, 271, 0.05);

  // Curved glass CRT screen filled with live Big Bang CMB static snow + scanlines
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(tvX + 16, tvY + 16, tvW - 58, tvH - 32, 18);
  ctx.clip();
  const stRng = mulberry32(Math.floor(time * 24) + 900);
  const cell = 7;
  for (let sy = tvY + 16; sy < tvY + tvH - 16; sy += cell) {
    for (let sx = tvX + 16; sx < tvX + tvW - 42; sx += cell) {
      const lum = Math.floor(95 + stRng() * 160);
      const cosmicTint = lineId === 'L09' && stRng() > 0.75;
      ctx.fillStyle = cosmicTint ? `rgb(${lum}, ${Math.max(80, lum - 30)}, 255)` : `rgb(${lum}, ${lum}, ${Math.min(255, lum + 18)})`;
      ctx.fillRect(sx, sy, cell, cell);
    }
  }
  if (lineId === 'L09') {
    // Cosmic Big Bang CMB radiation rings inside the static
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.75)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(tvX + (tvW - 42) * 0.5, tvY + tvH * 0.5, 62, 42, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Rotary dials on right side of CRT cabinet
  for (const dy of [tvY + 48, tvY + 92]) {
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(tvX + tvW - 22, dy, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  drawDepthOfFieldBokeh(ctx, W, H, cam, state.sceneMeta.palette, time, 299);
}

// ============================================================================
// SCENE 03: BOOTH HIDE-AND-SEEK & THE BILINGUAL SLEEP-DEBT HOTEL
// ============================================================================
function renderScene03SleepDebtHotel(ctx, W, H, time, state) {
  const speaker = state.activeLine?.speaker || '';
  const anchors = {
    Jet: { x: W * 0.23, y: H * 0.56 },
    Concierge: { x: W * 0.62, y: H * 0.50 },
    Clerk: { x: W * 0.82, y: H * 0.52 },
    Narrator: { x: W * 0.52, y: H * 0.52 },
  };
  const cam = computeCinematicShot({ ...state, activeLine: state.lineForCamera, time }, anchors, W, H);

  // 1. Cached Rich Parisian/European Café-Hotel Interior (`L'Hôtel du Sommeil`)
  ctx.save();
  applyCameraTransform(ctx, cam, W, H, 0.5);

  const hotelBg = getCachedLayer(`s03_hotel_bg_${W}_${H}`, W, H, (bctx) => {
    const wallGrad = bctx.createLinearGradient(0, 0, 0, H * 0.74);
    wallGrad.addColorStop(0, '#140e1c');
    wallGrad.addColorStop(0.55, '#261a36');
    wallGrad.addColorStop(1, '#38234a');
    bctx.fillStyle = wallGrad;
    bctx.fillRect(0, 0, W, H * 0.74);

    // Classic European wainscoted wood paneling along lower wall + striped damask wallpaper above
    for (let wx = 0; wx < W; wx += 36) {
      bctx.fillStyle = wx % 72 === 0 ? 'rgba(251, 191, 36, 0.05)' : 'rgba(192, 132, 252, 0.04)';
      bctx.fillRect(wx, 0, 18, H * 0.48);
    }
    drawPainterlyTimberWall(bctx, 0, H * 0.48, W, H * 0.26, 310);

    // Back-bar shelf of sparkling glass bottles & espresso cups behind the counter
    drawPainterlyBookshelfSection(bctx, W * 0.52, H * 0.24, W * 0.40, H * 0.26, 315);

    // Checkered marble/parquet hotel lobby floor
    const floorGrad = bctx.createLinearGradient(0, H * 0.74, 0, H);
    floorGrad.addColorStop(0, '#1f1629');
    floorGrad.addColorStop(1, '#0d0914');
    bctx.fillStyle = floorGrad;
    bctx.fillRect(0, H * 0.74, W, H * 0.26);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 16; c++) {
        if ((r + c) % 2 === 0) {
          bctx.fillStyle = 'rgba(253, 224, 71, 0.06)';
          bctx.fillRect(c * 120, H * 0.74 + r * 45, 120, 45);
        }
      }
    }

    // Two Arched European Windows on the left overlooking starry Paris-style roofs
    drawPainterlyArchedWindow(bctx, W * 0.16, H * 0.26, 175, 250, 0, 321);
    drawPainterlyArchedWindow(bctx, W * 0.36, H * 0.26, 175, 250, 0, 322);

    // Behind Reception Desk: Brass Room-Key Cubby Matrix & Sleep-Debt Tariff Board
    drawInkedPolygon(bctx, [[W * 0.51, 56], [W * 0.93, 56], [W * 0.93, 225], [W * 0.51, 225]], '#1e1b4b', '#fbbf24', 3.0, 330, 0.04);
    bctx.fillStyle = '#fde047';
    bctx.font = 'bold 21px Georgia, serif';
    bctx.textAlign = 'center';
    bctx.fillText("L'HÔTEL DU SOMMEIL — HOURLY SLEEP-DEBT TARIFF", W * 0.72, 98);
    bctx.fillStyle = '#e0f2fe';
    bctx.font = '16px sans-serif';
    bctx.fillText('ESPRESSO & PASTRY = 1.5 HRS SLEPT   |   HOT ENTRÉE = 4.0 HRS SLEPT', W * 0.72, 136);
    bctx.fillStyle = '#fda4af';
    bctx.font = 'bold 15px sans-serif';
    bctx.fillText('HOUSE RULE: UNINTERRUPTED SLEEP REQUIRED TO CLEAR BALANCE', W * 0.72, 172);

    // Key cubbies below tariff board
    for (let kx = W * 0.54; kx < W * 0.90; kx += 48) {
      bctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
      bctx.strokeRect(kx, 185, 42, 28);
      bctx.fillStyle = '#fbbf24';
      bctx.beginPath();
      bctx.arc(kx + 21, 198, 3, 0, Math.PI * 2);
      bctx.fill();
    }
  });
  ctx.drawImage(hotelBg, 0, 0);

  // Warm Edison Pendant Lamps casting golden pools of light
  for (const lx of [W * 0.16, W * 0.36, W * 0.62, W * 0.84]) {
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, 88);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(lx, 102, 22, Math.PI, 0);
    ctx.fill();
    const glow = ctx.createRadialGradient(lx, 115, 6, lx, 240, 220);
    glow.addColorStop(0, 'rgba(254, 240, 138, 0.32)');
    glow.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, 220, 220, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 2. Stage Layer (1.0x parallax): Tufted Booth, Jet on Phone, Peeking Acquaintance, Concierge & Sleepy Clerk
  ctx.save();
  applyCameraTransform(ctx, cam, W, H, 1.0);

  // Left: Crimson Tufted Leather Café Booth & Walnut Table
  drawInkedPolygon(ctx, [[75, H * 0.45], [515, H * 0.45], [515, H * 0.76], [75, H * 0.76]], '#7f1d1d', '#18131e', 2.4, 340, 0.06);
  // Diamond tufting seams
  ctx.strokeStyle = 'rgba(24, 19, 30, 0.45)';
  ctx.lineWidth = 1.4;
  for (let tx = 110; tx < 490; tx += 48) {
    ctx.beginPath();
    ctx.moveTo(tx, H * 0.47);
    ctx.lineTo(tx + 24, H * 0.62);
    ctx.lineTo(tx, H * 0.74);
    ctx.stroke();
  }

  // Jet seated in booth playing his phone game
  drawJetRig(ctx, 215, H * 0.73, 1.18, {
    time,
    facing: 1,
    speaking: speaker === 'Jet',
    talkEnergy: state.talkEnergy,
    pose: 'booth_phone',
  });

  // Booth tabletop with espresso cup
  drawInkedPolygon(ctx, [[245, H * 0.56], [475, H * 0.56], [465, H * 0.59], [255, H * 0.59]], '#78350f', '#fbbf24', 2.0, 342, 0.05);

  // Goofy Acquaintance peeking from under the booth table in hide-and-seek!
  const peekBob = Math.sin(time * 2.8) * 10;
  drawQAAcquaintanceRig(ctx, 415, H * 0.80 + peekBob, 0.78, {
    time,
    facing: -1,
    speaking: false,
    pose: 'seated',
  });

  // Right: Bilingual European Concierge & Exhausted Insomniac Clerk behind Mahogany Reception Counter
  drawConciergeRig(ctx, W * 0.62, H * 0.61, 1.24, {
    time,
    facing: -1,
    speaking: speaker === 'Concierge',
    talkEnergy: state.talkEnergy,
    armRaise: speaker === 'Concierge' ? 0.45 : 0.1,
  });

  const wipeSlide = Math.sin(time * 1.9) * 24;
  drawSleepyClerkRig(ctx, W * 0.82 + wipeSlide, H * 0.63, 1.16, {
    time,
    facing: -1,
    speaking: false,
  });

  // Carved Mahogany & Brass Hotel Counter with Wood-Grain Panels, Espresso Machine & Pastry Cloche
  drawInkedPolygon(ctx, [[W * 0.50, H * 0.59], [W * 0.93, H * 0.59], [W * 0.93, H * 0.78], [W * 0.50, H * 0.78]], '#451a03', '#fbbf24', 2.5, 350, 0.05);
  for (let cx = W * 0.52; cx < W * 0.90; cx += 88) {
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(cx, H * 0.61, 74, H * 0.14);
  }
  // Brass reception desk bell & golden pastry dome
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(W * 0.57, H * 0.59, 15, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(226, 232, 240, 0.45)';
  ctx.beginPath();
  ctx.arc(W * 0.72, H * 0.59, 26, Math.PI, 0);
  ctx.fill();

  // Floating Bilingual Dual-Voice Translation Ribbon above Concierge
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(W * 0.51, H * 0.25, 395, 62, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'italic 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('« Chaque repas est facturé en heures de sommeil… »', W * 0.51 + 197, H * 0.25 + 24);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('[LIVE TRANSLATION]: "Every meal is billed in hours slept."', W * 0.51 + 197, H * 0.25 + 46);
  ctx.restore();

  // Insomniac Clerk Debt Badge
  ctx.save();
  ctx.fillStyle = 'rgba(69, 10, 10, 0.9)';
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(W * 0.75, H * 0.29, 225, 42, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fecaca';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CLERK SLEEP DEBT: -48.5 HRS', W * 0.75 + 112, H * 0.29 + 26);
  ctx.restore();

  ctx.restore();
  drawDepthOfFieldBokeh(ctx, W, H, cam, state.sceneMeta.palette, time, 399);
}

// ============================================================================
// SCENE 04: THE POP-UP GRIMOIRE OF LIVING RELICS
// ============================================================================
function renderScene04PopUpGrimoire(ctx, W, H, time, state) {
  const speaker = state.activeLine?.speaker || '';
  const anchors = {
    Grimoire: { x: W * 0.54, y: H * 0.56 },
    Jet: { x: W * 0.44, y: H * 0.52 },
    Narrator: { x: W * 0.50, y: H * 0.54 },
  };
  const cam = computeCinematicShot({ ...state, activeLine: state.lineForCamera, time }, anchors, W, H);

  // 1. Cached Arcane Library Sanctum Background (Floor-to-Ceiling Bookshelves, Stained Glass, Astrolabes)
  ctx.save();
  applyCameraTransform(ctx, cam, W, H, 0.48);

  const sanctumBg = getCachedLayer(`s04_sanctum_bg_${W}_${H}`, W, H, (bctx) => {
    const bgGrad = bctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#140c06');
    bgGrad.addColorStop(0.6, '#29180d');
    bgGrad.addColorStop(1, '#120a05');
    bctx.fillStyle = bgGrad;
    bctx.fillRect(0, 0, W, H);

    // 4 Packed Floor-to-Ceiling Oak Bookshelf Sections (`drawPainterlyBookshelfSection`)
    drawPainterlyBookshelfSection(bctx, 48, 52, 340, H * 0.64, 411);
    drawPainterlyBookshelfSection(bctx, 410, 52, 320, H * 0.64, 412);
    drawPainterlyBookshelfSection(bctx, W - 730, 52, 320, H * 0.64, 413);
    drawPainterlyBookshelfSection(bctx, W - 388, 52, 340, H * 0.64, 414);

    // Center Arched Stained-Glass Window between bookcases
    drawPainterlyArchedWindow(bctx, W * 0.5, H * 0.30, 290, 360, 0, 420);
  });
  ctx.drawImage(sanctumBg, 0, 0);

  drawVolumetricGodRays(ctx, W, H, {
    originX: W * 0.5,
    originY: -40,
    rayCount: 8,
    color: '251, 191, 36',
    intensity: 0.24,
    time,
  });
  ctx.restore();

  // 2. Stage Layer (1.0x parallax): Jet, Overpriced Pedestal Relic & 3D Pop-Up Grimoire Assembly
  ctx.save();
  applyCameraTransform(ctx, cam, W, H, 1.0);

  // Jet leaning over the sanctum table assembling the 3D pop-up components
  drawJetRig(ctx, W * 0.43, H * 0.72, 1.38, {
    time,
    facing: 1,
    speaking: speaker === 'Jet',
    talkEnergy: state.talkEnergy,
    pose: 'grimoire',
    expression: 'happy',
  });

  // Ornate Velvet-Draped Sanctum Worktable
  drawInkedPolygon(ctx, [[85, H * 0.64], [W - 85, H * 0.64], [W - 55, H * 0.92], [55, H * 0.92]], '#451a03', '#fbbf24', 3.0, 430, 0.04);
  drawInkedPolygon(ctx, [[160, H * 0.64], [W - 160, H * 0.64], [W - 210, H * 0.76], [210, H * 0.76]], '#581c87', '#fcd34d', 2.0, 431, 0.05);

  // Left: Glass Cloche Display Case with Overpriced Artifact ("99,999 GOLD")
  const pedX = W * 0.22;
  const pedY = H * 0.64;
  ctx.fillStyle = 'rgba(186, 230, 253, 0.18)';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(pedX, pedY - 68, 56, Math.PI, 0);
  ctx.lineTo(pedX + 56, pedY);
  ctx.lineTo(pedX - 56, pedY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  drawAnamorphicStarGlint(ctx, pedX, pedY - 58, 28, 0.85, '#c084fc');
  drawInkedPolygon(ctx, [[pedX - 64, pedY + 8], [pedX + 64, pedY + 8], [pedX + 64, pedY + 42], [pedX - 64, pedY + 42]], '#fef3c7', '#78350f', 1.8, 435, 0.05);
  ctx.fillStyle = '#991b1b';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('99,999 GOLD', pedX, pedY + 30);

  // Center-Right: Illuminated Leather Grimoire & 3D Painted Pop-Up Relic Components Snapping Together!
  const bookX = W * 0.58;
  const bookY = H * 0.64;
  // Leather cover & arched parchment pages
  drawInkedPolygon(ctx, [[bookX - 235, bookY + 6], [bookX, bookY - 12], [bookX + 235, bookY + 6], [bookX + 205, bookY + 26], [bookX, bookY + 8], [bookX - 205, bookY + 26]], '#3b0764', '#fbbf24', 2.2, 440, 0.04);
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.moveTo(bookX, bookY - 6);
  ctx.quadraticCurveTo(bookX - 115, bookY - 34, bookX - 215, bookY - 4);
  ctx.lineTo(bookX - 190, bookY + 14);
  ctx.quadraticCurveTo(bookX - 100, bookY - 12, bookX, bookY + 6);
  ctx.quadraticCurveTo(bookX + 100, bookY - 12, bookX + 190, bookY + 14);
  ctx.lineTo(bookX + 215, bookY - 4);
  ctx.quadraticCurveTo(bookX + 115, bookY - 34, bookX, bookY - 6);
  ctx.fill();

  // 3D Pop-Up Clockwork Rings & Faceted Crystal Wings rising from the page and snapping together
  const snapT = smoothstep(0.1, 0.88, state.sceneProgress);
  const compOffsets = [
    { x0: -95, y0: -48, x1: 0, y1: -145 },
    { x0: 0, y0: -62, x1: 0, y1: -145 },
    { x0: 95, y0: -48, x1: 0, y1: -145 },
  ];
  for (let i = 0; i < 3; i++) {
    const c = compOffsets[i];
    const cx = bookX + lerp(c.x0, c.x1, snapT);
    const cy = bookY + lerp(c.y0, c.y1, snapT) + Math.sin(time * 3.0 + i) * 5;

    // Pop-up paper-engineered golden hinge strut connecting component to page
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(bookX + c.x0 * 0.45, bookY - 10);
    ctx.quadraticCurveTo(bookX + c.x0 * 0.7, cy + 40, cx, cy);
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    if (i === 0) {
      // Brass astrolabe gear ring
      ctx.rotate(time * 0.9);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(0, 0, 42, 0, Math.PI * 2);
      ctx.stroke();
      for (let a = 0; a < 8; a++) {
        const ang = (a * Math.PI) / 4;
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(Math.cos(ang) * 40 - 4, Math.sin(ang) * 40 - 4, 8, 8);
      }
    } else if (i === 1) {
      // Glowing cyan-violet crystal core
      drawInkedPolygon(ctx, [[0, -34], [26, 0], [0, 34], [-26, 0]], '#2dd4bf', '#ffffff', 2.0, 450, 0.05);
    } else {
      // Twin cel-shaded rainbow crystal wings
      for (const side of [-1, 1]) {
        drawInkedPolygon(
          ctx,
          [[side * 18, -10], [side * 68, -42], [side * 54, 18], [side * 18, 12]],
          '#c084fc',
          '#fde047',
          1.8,
          452 + side,
          0.06
        );
      }
    }
    ctx.restore();
  }
  if (snapT > 0.55) {
    drawAnamorphicStarGlint(ctx, bookX, bookY - 145, 58 * snapT, 0.95, '#fde047');
  }

  ctx.restore();
  drawFallingLeavesAndPollen(ctx, W, H, time, 18, 490);
  drawDepthOfFieldBokeh(ctx, W, H, cam, state.sceneMeta.palette, time, 499);
}

// ============================================================================
// SCENE 05: THE 9:45 AM MILKSHAKE LINE & THE LUCIDITY CLOUD
// ============================================================================
function renderScene05MilkshakeLine(ctx, W, H, time, state) {
  const speaker = state.activeLine?.speaker || '';
  const lineId = state.lineForCamera?.id || 'L19';
  const anchors = {
    Ashley: { x: W * 0.54, y: H * 0.56 },
    Jet: { x: W * 0.68, y: H * 0.54 },
    'QA Acquaintance': { x: W * 0.36, y: H * 0.56 },
    Cloud: { x: W * 0.72, y: H * 0.28 },
    Center: { x: W * 0.52, y: H * 0.54 },
    Narrator: { x: W * 0.52, y: H * 0.54 },
  };
  const cam = computeCinematicShot({ ...state, activeLine: state.lineForCamera, time }, anchors, W, H);

  // 1. Far Background Layer (0.4x parallax): Makoto Shinkai Sunlit Sky, Cumulus Clouds & Ghibli Tree Line
  ctx.save();
  applyCameraTransform(ctx, cam, W, H, 0.4);
  const outdoorBg = getCachedLayer(`s05_outdoor_bg_${W}_${H}`, W, H, (bctx) => {
    drawPainterlySkyAndClouds(bctx, W, H, 0);
    drawForestCanopyVista(bctx, W, H, 0, { clearingWidth: 0.45 });
  });
  ctx.drawImage(outdoorBg, 0, 0);
  ctx.restore();

  // 2. Stage Layer (1.0x parallax): Cobblestone Mall Promenade, Pastel Ice Cream Shop, 9:45 AM Clock & Cast
  ctx.save();
  applyCameraTransform(ctx, cam, W, H, 1.0);

  // Sunlit Cobblestone Promenade & Perspective Sidewalk Curbs
  const paveGrad = ctx.createLinearGradient(0, H * 0.66, 0, H);
  paveGrad.addColorStop(0, '#e2e8f0');
  paveGrad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = paveGrad;
  ctx.fillRect(0, H * 0.66, W, H * 0.34);
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
  ctx.lineWidth = 1.5;
  for (let cx = 0; cx <= W; cx += 95) {
    ctx.beginPath();
    ctx.moveTo(W * 0.5 + (cx - W * 0.5) * 0.6, H * 0.66);
    ctx.lineTo(cx, H);
    ctx.stroke();
  }
  for (let ry = H * 0.69; ry < H; ry += 32) {
    ctx.beginPath();
    ctx.moveTo(0, ry);
    ctx.lineTo(W, ry);
    ctx.stroke();
  }

  // Shinkai Overhead Utility Pole & Power Lines across the Sunlit Sky
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.55)';
  ctx.lineWidth = 1.6;
  for (let ly = 42; ly <= 78; ly += 18) {
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.quadraticCurveTo(W * 0.45, ly + 38, W, ly - 10);
    ctx.stroke();
  }

  // Detailed Pastel-Brick Ice Cream Parlor Facade, Service Window, Striped Awning & Menu Chalkboard
  drawInkedPolygon(ctx, [[56, H * 0.24], [585, H * 0.24], [585, H * 0.68], [56, H * 0.68]], '#fef3c7', '#d97706', 3.0, 510, 0.04);
  // Subtle brick courses on facade
  ctx.fillStyle = 'rgba(217, 119, 6, 0.14)';
  for (let by = H * 0.32; by < H * 0.65; by += 28) {
    for (let bx = 72; bx < 560; bx += 54) {
      ctx.fillRect(bx + ((by % 56) ? 20 : 0), by, 38, 12);
    }
  }

  // Scalloped Pink-and-Cream Striped Canvas Awning
  const stripeW = (585 - 56) / 9;
  for (let i = 0; i < 9; i++) {
    const sx = 56 + i * stripeW;
    ctx.fillStyle = i % 2 === 0 ? '#ec4899' : '#fffbeb';
    ctx.strokeStyle = '#18131e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(sx, H * 0.21, stripeW, 48);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx + stripeW * 0.5, H * 0.21 + 48, stripeW * 0.5, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  // Parlor Service Window & Neon "COCOA-MINT MILKSHAKE" Chalkboard
  drawInkedPolygon(ctx, [[105, H * 0.34], [365, H * 0.34], [365, H * 0.52], [105, H * 0.52]], '#0f172a', '#f472b6', 2.8, 515, 0.04);
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("TODAY'S SPECIAL:", 235, H * 0.39);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('COCOA-MINT MILKSHAKE', 235, H * 0.44);
  drawAnamorphicStarGlint(ctx, 132, H * 0.39 - 5, 12, 0.85, '#fde047');
  drawAnamorphicStarGlint(ctx, 338, H * 0.39 - 5, 12, 0.85, '#fde047');
  // Giant sculpted pastel ice-cream cone sign on roof corner
  fillBristleCluster(ctx, 485, H * 0.38, 34, 28, '#34d399', 516, 6);
  fillBristleCluster(ctx, 485, H * 0.33, 28, 24, '#f472b6', 517, 6);
  drawInkedPolygon(ctx, [[462, H * 0.40], [508, H * 0.40], [485, H * 0.54]], '#d97706', '#18131e', 1.8, 518, 0.06);

  // Lush Painterly Moss & Wildflower Planters flanking the parlor
  drawMossCluster(ctx, 565, H * 0.67, 155, 68, 520, true);
  drawMossCluster(ctx, W * 0.88, H * 0.67, 175, 72, 521, true);

  // Vintage Wrought-Iron Mall Clock Tower reading 9:45 AM
  const clkX = W * 0.45;
  const clkY = H * 0.29;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(clkX - 7, clkY, 14, H * 0.38);
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(clkX, clkY, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(clkX, clkY);
  ctx.lineTo(clkX - 18, clkY - 14); // 9:45 hour hand
  ctx.moveTo(clkX, clkY);
  ctx.lineTo(clkX - 30, clkY); // 45 minute hand
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('9:45 AM', clkX, clkY + 26);

  // Characters in the Real Queue: QA College Acquaintance, Ashley & Jet
  drawQAAcquaintanceRig(ctx, W * 0.35, H * 0.77, 1.18, {
    time,
    facing: lineId === 'L24' || lineId === 'L25' ? 1 : -1,
    speaking: speaker === 'QA Acquaintance',
    talkEnergy: state.talkEnergy,
  });

  drawAshleyRig(ctx, W * 0.54, H * 0.78, 1.22, {
    time,
    facing: speaker === 'QA Acquaintance' ? -1 : 1,
    speaking: speaker === 'Ashley',
    talkEnergy: state.talkEnergy,
    expression: 'happy',
  });

  drawJetRig(ctx, W * 0.70, H * 0.77, 1.25, {
    time,
    facing: -1,
    speaking: speaker === 'Jet',
    talkEnergy: state.talkEnergy,
    armRaise: lineId === 'L21' ? 0.85 : 0.2,
  });

  // Partial-Lucidity Dream Cloud Rolling in from Top-Right & Handel's Mirage (`L20`-`L23`)
  const cloudStrength =
    lineId === 'L21' ? 1.0 : lineId === 'L20' || lineId === 'L22' ? 0.78 : lineId === 'L23' ? 0.35 : 0.15;
  ctx.save();
  ctx.globalAlpha = cloudStrength;
  const cX = W * 0.74 + Math.sin(time * 1.4) * 18;
  const cY = H * 0.22;
  fillBristleCluster(ctx, cX, cY, 240, 88, '#c084fc', 550, 14);
  fillBristleCluster(ctx, cX - 35, cY - 12, 185, 66, '#f3e8ff', 551, 12);
  ctx.fillStyle = '#4c1d95';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText("MIRAGE: HANDEL'S HOMEMADE ICE CREAM", cX, cY - 6);
  drawAnamorphicStarGlint(ctx, cX - 215, cY - 12, 18, 0.9, '#fde047');
  drawAnamorphicStarGlint(ctx, cX + 215, cY - 12, 18, 0.9, '#fde047');
  ctx.fillStyle = '#7e22ce';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(lineId === 'L22' || lineId === 'L23' ? '[ DREAM FIZZLING OUT... ]' : '[ PARTIAL LUCIDITY MORPHING ]', cX, cY + 18);
  ctx.restore();

  ctx.restore();
  drawFallingLeavesAndPollen(ctx, W, H, time, 18, 580);
  drawDepthOfFieldBokeh(ctx, W, H, cam, state.sceneMeta.palette, time, 599);
}

// ============================================================================
// SCENE 06: THE FIVE-STAR CHEESECAKE-CHICKEN-RANCH BANQUET & WAKING ALARM
// ============================================================================
function renderScene06FiveStarBanquet(ctx, W, H, time, state) {
  const speaker = state.activeLine?.speaker || '';
  const lineId = state.lineForCamera?.id || 'L26';
  const isAlarmLine = lineId === 'L29' || lineId === 'L30';

  const anchors = {
    Banquet: { x: W * 0.50, y: H * 0.52 },
    'Horrified Diner': { x: W * 0.78, y: H * 0.50 },
    'QA Acquaintance': { x: W * 0.54, y: H * 0.50 },
    Platter: { x: W * 0.55, y: H * 0.60 },
    Jet: { x: W * 0.22, y: H * 0.50 },
    Ashley: { x: W * 0.36, y: H * 0.52 },
    Narrator: { x: W * 0.52, y: H * 0.52 },
  };
  const cam = computeCinematicShot({ ...state, activeLine: state.lineForCamera, time }, anchors, W, H);

  // 1. Cached Opulent Palace Banquet Hall Background (Arched Windows, Velvet Curtains, Wainscoting, Chandeliers)
  ctx.save();
  applyCameraTransform(ctx, cam, W, H, 0.45);

  const banquetBg = getCachedLayer(`s06_banquet_bg_${W}_${H}`, W, H, (bctx) => {
    const wallGrad = bctx.createLinearGradient(0, 0, 0, H);
    wallGrad.addColorStop(0, '#1c0c16');
    wallGrad.addColorStop(0.55, '#3b172b');
    wallGrad.addColorStop(1, '#240d1b');
    bctx.fillStyle = wallGrad;
    bctx.fillRect(0, 0, W, H);

    // Gilded palace wainscoting & pilasters
    drawPainterlyTimberWall(bctx, 0, H * 0.46, W, H * 0.24, 610);
    for (const px of [90, W * 0.35, W * 0.65, W - 90]) {
      bctx.fillStyle = '#4a1d33';
      bctx.strokeStyle = '#fbbf24';
      bctx.lineWidth = 2;
      bctx.fillRect(px - 22, 0, 44, H * 0.66);
      bctx.strokeRect(px - 22, 0, 44, H * 0.66);
    }

    // 3 Grand Arched Cathedral Windows overlooking Starry City Skyline
    drawPainterlyArchedWindow(bctx, W * 0.20, H * 0.24, 215, 310, 0, 621);
    drawPainterlyArchedWindow(bctx, W * 0.50, H * 0.24, 215, 310, 0, 622);
    drawPainterlyArchedWindow(bctx, W * 0.80, H * 0.24, 215, 310, 0, 623);
  });
  ctx.drawImage(banquetBg, 0, 0);

  // Two Sparkling Crystal Chandeliers
  for (const chx of [W * 0.35, W * 0.65]) {
    drawAnamorphicStarGlint(ctx, chx, 78, 56, 0.95, '#fef08a');
    drawAnamorphicStarGlint(ctx, chx - 32, 96, 28, 0.75, '#ffffff');
    drawAnamorphicStarGlint(ctx, chx + 32, 96, 28, 0.75, '#ffffff');
  }
  ctx.restore();

  // 2. Stage Layer (1.0x parallax): Seated Cast, Damask Banquet Table, Candelabras & Cheesecake-Chicken-Ranch Sandwich
  ctx.save();
  applyCameraTransform(ctx, cam, W, H, 1.0);

  // Seated Characters behind the Banquet Table: Jet, Ashley, QA Acquaintance (with Ranch Bottle), Horrified Diner
  drawJetRig(ctx, W * 0.20, H * 0.69, 1.24, {
    time,
    facing: 1,
    speaking: speaker === 'Jet',
    talkEnergy: state.talkEnergy,
    pose: 'seated',
    expression: 'surprised',
  });

  drawAshleyRig(ctx, W * 0.36, H * 0.70, 1.20, {
    time,
    facing: 1,
    speaking: false,
    pose: 'seated',
    expression: 'surprised',
  });

  drawQAAcquaintanceRig(ctx, W * 0.55, H * 0.69, 1.24, {
    time,
    facing: -1,
    speaking: speaker === 'QA Acquaintance',
    talkEnergy: state.talkEnergy,
    pose: 'seated',
    hasCondimentBottle: true,
    expression: 'happy',
  });

  drawHorrifiedDinerRig(ctx, W * 0.78, H * 0.70, 1.20, {
    time,
    facing: -1,
    speaking: speaker === 'Horrified Diner',
    talkEnergy: state.talkEnergy,
    pose: 'seated',
    expression: 'horrified',
  });

  // Five-Star Damask Banquet Tablecloth, Royal Burgundy Runner, Crystal Wine Glasses & Silver Candelabras
  const clothGrad = ctx.createLinearGradient(0, H * 0.65, 0, H);
  clothGrad.addColorStop(0, '#f8fafc');
  clothGrad.addColorStop(0.35, '#e2e8f0');
  clothGrad.addColorStop(1, '#94a3b8');
  drawInkedPolygon(ctx, [[42, H * 0.65], [W - 42, H * 0.65], [W - 24, H], [24, H]], clothGrad, '#fbbf24', 3.5, 640, 0.03);

  ctx.fillStyle = '#881337';
  ctx.fillRect(48, H * 0.67, W - 96, 30);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(48, H * 0.67, W - 96, 4);
  ctx.fillRect(48, H * 0.67 + 26, W - 96, 4);

  // Silver Candelabras & Crystal Stemware along the table
  for (const cx of [W * 0.28, W * 0.70]) {
    const cy = H * 0.65;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 8);
    ctx.lineTo(cx, cy - 52);
    ctx.moveTo(cx - 26, cy - 32);
    ctx.quadraticCurveTo(cx, cy - 18, cx + 26, cy - 32);
    ctx.stroke();
    for (const fx of [cx - 26, cx, cx + 26]) {
      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(fx - 3, cy - 54, 6, 22);
      drawAnamorphicStarGlint(ctx, fx, cy - 60, 16, 0.9, '#fde047');
    }
  }
  for (const gx of [W * 0.18, W * 0.39, W * 0.64, W * 0.82]) {
    const gy = H * 0.68;
    ctx.fillStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(gx, gy - 26, 12, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(gx, gy - 24, 9, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(gx, gy - 14);
    ctx.lineTo(gx, gy + 4);
    ctx.moveTo(gx - 8, gy + 4);
    ctx.lineTo(gx + 8, gy + 4);
    ctx.stroke();
  }

  // Centerpiece Hero Prop: The Cheesecake-Chicken-Tender-Ranch Sandwich on a Silver Platter!
  const px = W * 0.54;
  const py = H * 0.66;
  ctx.save();
  ctx.translate(px, py);

  // Silver domed platter base
  ctx.fillStyle = '#94a3b8';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 12, 118, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Bottom New York Cheesecake Slice (Graham cracker crust + creamy yellow wedge)
  drawInkedPolygon(ctx, [[-68, -2], [68, -2], [68, 9], [-68, 9]], '#b45309', '#18131e', 1.6, 650, 0.04);
  drawInkedPolygon(ctx, [[-68, -2], [68, -2], [58, -28], [-68, -24]], '#fef08a', '#18131e', 1.6, 651, 0.04);

  // Crispy Golden Fried Chicken Tenders stacked in the middle
  for (const tx of [-38, 0, 38]) {
    fillBristleCluster(ctx, tx, -36, 28, 14, '#d97706', 660 + tx, 6);
    fillBristleCluster(ctx, tx - 3, -39, 18, 8, '#f59e0b', 670 + tx, 4);
  }

  // Top New York Cheesecake Slice
  drawInkedPolygon(ctx, [[-64, -48], [64, -48], [52, -74], [-64, -70]], '#fef08a', '#18131e', 1.6, 680, 0.04);
  drawInkedPolygon(ctx, [[-64, -76], [54, -76], [54, -69], [-64, -69]], '#b45309', '#18131e', 1.5, 681, 0.04);

  // Creamy White Ranch Dressing Drizzle Cascading Over the Top Cheesecake + Dill Herb Flecks
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-48, -72);
  ctx.bezierCurveTo(-30, -52, -18, -82, 0, -56);
  ctx.bezierCurveTo(18, -36, 28, -78, 44, -54);
  ctx.stroke();

  ctx.fillStyle = '#16a34a';
  for (let h = -40; h <= 40; h += 14) {
    ctx.beginPath();
    ctx.arc(h, -64 + (h % 3) * 4, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Silver Fork lifting the fateful first bite toward the QA Acquaintance's mouth!
  const biteLift = isAlarmLine ? 0.92 : clamp((state.sceneProgress - 0.32) * 1.4, 0, 0.86);
  const fx = lerp(36, -6, biteLift);
  const fy = lerp(-62, -138, biteLift);
  ctx.save();
  ctx.translate(fx, fy);
  ctx.rotate(-0.24);
  drawInkedPolygon(ctx, [[0, -4], [70, -4], [70, 3], [0, 3]], '#e2e8f0', '#1e293b', 1.4, 690, 0.03);
  drawInkedPolygon(ctx, [[-18, -16], [6, -16], [6, 0], [-18, 0]], '#fef08a', '#18131e', 1.4, 691, 0.04);
  fillBristleCluster(ctx, -6, -6, 11, 6, '#d97706', 692, 3);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-5, -16, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  // Waking Morning Alarm Shockwave & Echoes of Nova's Storyverse Void (`L29`-`L30`)
  if (isAlarmLine) {
    ctx.save();
    for (let r = 1; r <= 4; r++) {
      const rad = ((time * 240 + r * 135) % 680) + 45;
      ctx.strokeStyle = r % 2 === 0 ? 'rgba(251, 113, 133, 0.62)' : 'rgba(192, 132, 252, 0.62)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(W * 0.54, H * 0.48, rad, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
  drawDepthOfFieldBokeh(ctx, W, H, cam, state.sceneMeta.palette, time, 699);
}

// ============================================================================
// MASTER FRAME ENTRYPOINT
// ============================================================================
export function renderStoryFrame(ctx, W, H, time, timeline, opts = {}) {
  const { showSubtitles = true, showHud = false } = opts;
  const state = getTimelineState(timeline, time);

  ctx.save();
  switch (state.sceneId) {
    case 'S01':
      renderScene01StoryverseVoid(ctx, W, H, time, state);
      break;
    case 'S02':
      renderScene02HuntersLodgeStatic(ctx, W, H, time, state);
      break;
    case 'S03':
      renderScene03SleepDebtHotel(ctx, W, H, time, state);
      break;
    case 'S04':
      renderScene04PopUpGrimoire(ctx, W, H, time, state);
      break;
    case 'S05':
      renderScene05MilkshakeLine(ctx, W, H, time, state);
      break;
    case 'S06':
    default:
      renderScene06FiveStarBanquet(ctx, W, H, time, state);
      break;
  }

  // Title-safe paginated & wrapped captions via `drawCinemaCaptionsAndHud`
  const activeLineForCaption = state.activeLine
    ? {
        ...state.activeLine,
        caption: state.activeLine.caption || state.activeLine.text || '',
      }
    : null;

  drawCinemaCaptionsAndHud(ctx, W, H, {
    scene: {
      id: state.sceneId,
      title: state.sceneMeta.title,
      location: state.sceneMeta.sub,
    },
    activeLine: activeLineForCaption,
    lineProgress: state.lineProgress,
    t: time,
    activeSfx: null,
    showCaptions: showSubtitles,
    cinemaMode: !showHud,
  });

  ctx.restore();
  return state;
}
