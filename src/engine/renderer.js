// Rich Canvas 2D Renderer for Aetherbound RPG
// Renders all 9 species x 24 classes, custom appearance, dungeon tiles, temple conversions, enemies, traps, chests, VFX, and minimap

import { SPECIES_BY_ID } from '../data/species.js';
import { CLASS_BY_ID } from '../data/classes.js';
import { TILE_SIZE } from '../data/templeLevel.js';

const THEME_PALETTES = {
  corrupted: {
    marble: '#4c516d',
    carpet: '#78263b',
    altar: '#c89b3c',
    altarGlow: 'rgba(200, 155, 60, 0.35)',
    ambientTint: 'rgba(15, 10, 28, 0.14)',
  },
  light: {
    marble: '#767a99',
    carpet: '#d4a73b',
    altar: '#fff3a1',
    altarGlow: 'rgba(255, 243, 161, 0.6)',
    ambientTint: 'rgba(255, 244, 190, 0.08)',
  },
  fire: {
    marble: '#59231d',
    carpet: '#b8321a',
    altar: '#ff6b35',
    altarGlow: 'rgba(255, 107, 53, 0.65)',
    ambientTint: 'rgba(255, 70, 20, 0.12)',
  },
  water: {
    marble: '#1b4766',
    carpet: '#0e7490',
    altar: '#38bdf8',
    altarGlow: 'rgba(56, 189, 248, 0.6)',
    ambientTint: 'rgba(14, 165, 233, 0.11)',
  },
  earth: {
    marble: '#2d4a31',
    carpet: '#3f6212',
    altar: '#4ade80',
    altarGlow: 'rgba(74, 222, 128, 0.55)',
    ambientTint: 'rgba(34, 197, 94, 0.09)',
  },
  air: {
    marble: '#3c3766',
    carpet: '#6d28d9',
    altar: '#c4b5fd',
    altarGlow: 'rgba(196, 181, 253, 0.65)',
    ambientTint: 'rgba(139, 92, 246, 0.11)',
  },
  master: {
    marble: '#524b7a',
    carpet: '#9d4edd',
    altar: '#fde047',
    altarGlow: 'rgba(250, 204, 21, 0.72)',
    ambientTint: 'rgba(192, 132, 252, 0.09)',
  },
};

export function drawCharacter(ctx, character, x, y, opts = {}) {
  const sp = SPECIES_BY_ID[character.speciesId] || SPECIES_BY_ID.human;
  const cl = CLASS_BY_ID[character.classId] || CLASS_BY_ID.knight;
  const app = character.appearance || {};
  const skin = app.skinColor || sp.defaultColors.skin;
  const hair = app.hairColor || sp.defaultColors.hair;
  const armor = app.armorColor || cl.defaultColors.armor;
  const accent = app.accentColor || cl.defaultColors.accent;
  const scale = (app.scale || 1.0) * (opts.zoom || 1.0);
  const time = opts.time || 0;
  const moving = Boolean(opts.moving);
  const aimAngle = opts.aimAngle ?? 0;
  const swingProgress = opts.swingProgress || 0; // 0..1
  const hurtFlash = opts.hurtFlash || 0;

  const bob = moving ? Math.sin(time * 13) * 2.5 : Math.sin(time * 3.2) * 1.2;
  const flipX = Math.cos(aimAngle) < -0.15 ? -1 : 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.ellipse(0, 17, 15 * sp.visual.bodyScaleX, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Class Aura
  if (app.showAura && cl.visual.aura !== 'none') {
    const pulse = 0.75 + Math.sin(time * 5) * 0.25;
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.45 * pulse;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 2, 22 + Math.sin(time * 4) * 2, 0, Math.PI * 2);
    ctx.stroke();
    if (cl.visual.aura === 'holy' || cl.visual.aura === 'time') {
      ctx.rotate(time * 1.4);
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.arc(0, 2, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  ctx.translate(0, bob);

  // Species Wings / Floating Stones / Shadow Wisps (behind body)
  if (sp.visual.wings === 'butterfly') {
    const flap = Math.sin(time * 11) * 0.22;
    ctx.save();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.62;
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.scale(dir, 1);
      ctx.rotate(flap);
      ctx.beginPath();
      ctx.ellipse(15, -4, 12, 8, -0.35, 0, Math.PI * 2);
      ctx.ellipse(13, 6, 9, 6, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  } else if (sp.visual.wings === 'floating_stones') {
    ctx.fillStyle = skin;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = time * 2.2 + (i * Math.PI * 2) / 3;
      const rx = Math.cos(a) * 22;
      const ry = Math.sin(a) * 6 - 10;
      ctx.beginPath();
      ctx.moveTo(rx, ry - 4);
      ctx.lineTo(rx + 4, ry);
      ctx.lineTo(rx, ry + 4);
      ctx.lineTo(rx - 4, ry);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (sp.visual.wings === 'shadow_wisps') {
    ctx.save();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 4; i++) {
      const ox = Math.sin(time * 4 + i * 1.7) * 14;
      const oy = 8 - ((time * 18 + i * 9) % 24);
      ctx.beginPath();
      ctx.arc(ox, oy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Species Tail
  if (sp.visual.tail === 'dragon' || sp.visual.tail === 'spade') {
    const wag = Math.sin(time * 6) * 4;
    ctx.save();
    ctx.strokeStyle = sp.visual.tail === 'dragon' ? skin : accent;
    ctx.lineWidth = sp.visual.tail === 'dragon' ? 5 : 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-flipX * 6, 9);
    ctx.quadraticCurveTo(-flipX * 18, 12 + wag, -flipX * 22, 2 + wag);
    ctx.stroke();
    if (sp.visual.tail === 'spade') {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(-flipX * 25, -1 + wag);
      ctx.lineTo(-flipX * 19, 1 + wag);
      ctx.lineTo(-flipX * 22, 6 + wag);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Cape
  if (app.showCape) {
    const sway = Math.sin(time * 6) * 2.5;
    ctx.fillStyle = armor;
    ctx.beginPath();
    ctx.moveTo(-10 * sp.visual.bodyScaleX, -4);
    ctx.lineTo(10 * sp.visual.bodyScaleX, -4);
    ctx.lineTo(14 * sp.visual.bodyScaleX + sway, 16);
    ctx.lineTo(-14 * sp.visual.bodyScaleX + sway, 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  // Legs (animated walk stride)
  const stride = moving ? Math.sin(time * 13) * 4 : 0;
  ctx.fillStyle = '#1f2430';
  ctx.fillRect(-7 * sp.visual.bodyScaleX, 10 + stride * 0.5, 5, 8);
  ctx.fillRect(2 * sp.visual.bodyScaleX, 10 - stride * 0.5, 5, 8);

  // Body / Armor
  const bw = 18 * sp.visual.bodyScaleX;
  const bh = 18 * sp.visual.bodyScaleY;
  ctx.fillStyle = hurtFlash > 0 ? '#ffffff' : armor;
  ctx.beginPath();
  ctx.roundRect(-bw / 2, -5, bw, bh, 5);
  ctx.fill();
  ctx.strokeStyle = '#11131c';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Armor trim / sash / chest emblem
  ctx.fillStyle = accent;
  if (cl.visual.armorStyle.includes('plate') || cl.visual.armorStyle === 'lamellar') {
    ctx.fillRect(-bw / 2 - 2, -5, 5, 6); // left pauldron
    ctx.fillRect(bw / 2 - 3, -5, 5, 6); // right pauldron
    ctx.fillRect(-3, -2, 6, bh - 6);
  } else if (cl.visual.armorStyle.includes('robe') || cl.visual.armorStyle === 'vestments') {
    ctx.beginPath();
    ctx.moveTo(-3, -5);
    ctx.lineTo(3, -5);
    ctx.lineTo(6, bh - 4);
    ctx.lineTo(-6, bh - 4);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(-bw / 2 + 1, 3, bw - 2, 3);
  }

  // Head
  const headY = -13 * sp.visual.bodyScaleY;
  const headR = 9.5 * (sp.visual.bodyScaleX * 0.5 + 0.5);

  // Ears
  if (sp.visual.earType === 'long_pointed') {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(-headR + 1, headY);
    ctx.lineTo(-headR - 8, headY - 4);
    ctx.lineTo(-headR + 2, headY + 3);
    ctx.moveTo(headR - 1, headY);
    ctx.lineTo(headR + 8, headY - 4);
    ctx.lineTo(headR - 2, headY + 3);
    ctx.fill();
  } else if (sp.visual.earType === 'pointed_short' || sp.visual.earType === 'frills') {
    ctx.fillStyle = sp.visual.earType === 'frills' ? accent : skin;
    ctx.beginPath();
    ctx.moveTo(-headR, headY - 2);
    ctx.lineTo(-headR - 5, headY - 5);
    ctx.lineTo(-headR, headY + 3);
    ctx.moveTo(headR, headY - 2);
    ctx.lineTo(headR + 5, headY - 5);
    ctx.lineTo(headR, headY + 3);
    ctx.fill();
  }

  // Head base
  ctx.fillStyle = hurtFlash > 0 ? '#ffffff' : skin;
  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#11131c';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Species textures (cracked veins / beard / tusks / warpaint)
  if (sp.visual.skinTexture === 'cracked_veins') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-4, headY - 4);
    ctx.lineTo(0, headY);
    ctx.lineTo(4, headY + 3);
    ctx.stroke();
  } else if (sp.visual.skinTexture === 'bearded') {
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.moveTo(-7, headY + 2);
    ctx.lineTo(7, headY + 2);
    ctx.lineTo(4, headY + 13);
    ctx.lineTo(-4, headY + 13);
    ctx.closePath();
    ctx.fill();
  }

  // Hair (unless fully covered by greathelm/dread_helm)
  const fullHelm = cl.visual.headgear === 'greathelm' || cl.visual.headgear === 'dread_helm';
  if (!fullHelm && app.hairStyle !== 'bald') {
    ctx.fillStyle = hair;
    if (app.hairStyle === 'spiky') {
      ctx.beginPath();
      ctx.moveTo(-headR, headY - 2);
      ctx.lineTo(-6, headY - headR - 5);
      ctx.lineTo(-1, headY - headR);
      ctx.lineTo(3, headY - headR - 6);
      ctx.lineTo(headR, headY - 2);
      ctx.closePath();
      ctx.fill();
    } else if (app.hairStyle === 'long') {
      ctx.beginPath();
      ctx.arc(0, headY - 2, headR + 1.5, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-headR - 1, headY - 2, 4, 13);
      ctx.fillRect(headR - 3, headY - 2, 4, 13);
    } else if (app.hairStyle === 'braid') {
      ctx.beginPath();
      ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-flipX * (headR - 1), headY, 4, 15);
    } else {
      ctx.beginPath();
      ctx.arc(0, headY - 2.5, headR + 1, Math.PI * 0.95, Math.PI * 2.05);
      ctx.fill();
    }
  }

  // Species Horns / Tusks / Crystals
  if (sp.visual.horns === 'curved' || sp.visual.horns === 'dragon') {
    ctx.strokeStyle = sp.visual.horns === 'dragon' ? hair : '#2b192e';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 5, headY - headR + 2);
      ctx.quadraticCurveTo(dir * 13, headY - headR - 6, dir * 10, headY - headR - 12);
      ctx.stroke();
    }
  } else if (sp.visual.horns === 'crystals') {
    ctx.fillStyle = accent;
    for (const dir of [-1, 0, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 5 - 2, headY - headR + 2);
      ctx.lineTo(dir * 6, headY - headR - 8);
      ctx.lineTo(dir * 5 + 2, headY - headR + 2);
      ctx.fill();
    }
  } else if (sp.visual.horns === 'tusks') {
    ctx.fillStyle = '#fff5e4';
    ctx.fillRect(-5, headY + 3, 2.2, 4);
    ctx.fillRect(3, headY + 3, 2.2, 4);
  }

  // Eyes
  const eyeOffsetX = flipX * 1.5;
  if (app.eyeStyle === 'visor') {
    ctx.fillStyle = accent;
    ctx.fillRect(-5 + eyeOffsetX, headY - 1, 10, 3);
  } else {
    ctx.fillStyle = app.eyeStyle === 'glow' || sp.id === 'shadowkin' ? accent : '#111827';
    ctx.beginPath();
    ctx.arc(-3 + eyeOffsetX, headY, 1.8, 0, Math.PI * 2);
    ctx.arc(3 + eyeOffsetX, headY, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Class Headgear
  drawHeadgear(ctx, cl.visual.headgear, headY, headR, armor, accent, time);

  // Held Class Weapon (rotates toward aimAngle + melee swing animation!)
  ctx.save();
  const swingOffset = swingProgress > 0 ? Math.sin(swingProgress * Math.PI) * 1.6 - 0.7 : 0;
  ctx.translate(flipX * 8, 2);
  ctx.rotate(aimAngle + swingOffset * flipX);
  drawWeapon(ctx, cl.visual.weapon, accent, armor);
  ctx.restore();

  ctx.restore();
}

function drawHeadgear(ctx, headgear, headY, r, armor, accent, time) {
  ctx.save();
  if (headgear === 'greathelm' || headgear === 'dread_helm') {
    ctx.fillStyle = armor;
    ctx.beginPath();
    ctx.roundRect(-r - 1, headY - r - 1, (r + 1) * 2, r * 2, 4);
    ctx.fill();
    ctx.fillStyle = headgear === 'dread_helm' ? '#ef4444' : '#0f172a';
    ctx.fillRect(-6, headY - 1, 12, 3);
    ctx.fillStyle = accent;
    ctx.fillRect(-2, headY - r - 6, 4, 6);
  } else if (headgear === 'halo_crown' || headgear === 'astrolabe') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, headY - r - 6 + Math.sin(time * 4) * 1.5, 9, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (headgear === 'kabuto' || headgear === 'winged_helm' || headgear === 'crested_helm') {
    ctx.fillStyle = armor;
    ctx.beginPath();
    ctx.arc(0, headY - 2, r + 1.5, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-7, headY - r - 4);
    ctx.lineTo(0, headY - r + 1);
    ctx.lineTo(7, headY - r - 4);
    ctx.stroke();
  } else if (headgear === 'flame_crown' || headgear === 'ice_tiara' || headgear === 'crystal_crown') {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-7, headY - r + 2);
    ctx.lineTo(-4, headY - r - 6);
    ctx.lineTo(0, headY - r - 2);
    ctx.lineTo(4, headY - r - 7);
    ctx.lineTo(7, headY - r + 2);
    ctx.closePath();
    ctx.fill();
  } else if (headgear === 'tricorne' || headgear === 'plumed_beret') {
    ctx.fillStyle = armor;
    ctx.beginPath();
    ctx.ellipse(0, headY - r + 1, r + 5, 4.5, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, headY - r);
    ctx.quadraticCurveTo(13, headY - r - 9, 16, headY - r - 3);
    ctx.stroke();
  } else if (headgear === 'goggles') {
    ctx.fillStyle = accent;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-3.5, headY - 5, 3, 0, Math.PI * 2);
    ctx.arc(3.5, headY - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (headgear === 'antlers' || headgear === 'storm_horns') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.2;
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(d * 4, headY - r);
      ctx.lineTo(d * 10, headY - r - 9);
      ctx.moveTo(d * 7, headY - r - 5);
      ctx.lineTo(d * 13, headY - r - 4);
      ctx.stroke();
    }
  } else if (headgear === 'cowl' || headgear === 'forest_hood' || headgear === 'skull_hood' || headgear === 'horned_hood') {
    ctx.strokeStyle = armor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, headY, r + 1.5, Math.PI * 0.85, Math.PI * 2.15);
    ctx.stroke();
  } else if (headgear === 'miter') {
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-6, headY - r + 2);
    ctx.lineTo(0, headY - r - 10);
    ctx.lineTo(6, headY - r + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(-1, headY - r - 6, 2, 6);
  }
  ctx.restore();
}

function drawWeapon(ctx, weapon, accent, armor) {
  ctx.save();
  if (weapon.includes('staff') || weapon.includes('wand') || weapon === 'thunder_rod') {
    ctx.strokeStyle = '#7c5333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(24, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (weapon === 'scythe') {
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.quadraticCurveTo(26, 12, 13, 15);
    ctx.quadraticCurveTo(20, 8, 18, 0);
    ctx.fill();
  } else if (weapon === 'warhammer' || weapon === 'monolith_mace' || weapon === 'censer_mace') {
    ctx.strokeStyle = '#6b4c35';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.fillRect(14, -7, 8, 14);
  } else if (weapon === 'twin_axes') {
    ctx.strokeStyle = '#7c5333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(14, -9);
    ctx.lineTo(22, -4);
    ctx.lineTo(22, 4);
    ctx.lineTo(14, 9);
    ctx.closePath();
    ctx.fill();
  } else if (weapon === 'spear' || weapon === 'trident') {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(26, 0);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(31, 0);
    ctx.lineTo(23, -4);
    ctx.lineTo(23, 4);
    ctx.closePath();
    ctx.fill();
  } else if (weapon === 'chi_fists') {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(10, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (weapon === 'bow_saber') {
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(8, 0, 11, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(10, -10);
    ctx.lineTo(10, 10);
    ctx.stroke();
  } else if (weapon === 'lute_blade') {
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(10, 0, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(15, -1.5, 11, 3);
  } else {
    // Swords, katanas, daggers, rapiers, rune blades, pact blades
    const len = weapon === 'greatsword' || weapon === 'katana' ? 26 : weapon === 'twin_daggers' || weapon === 'kunai' ? 14 : 20;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-3, -2, 6, 4);
    ctx.fillStyle = accent;
    ctx.fillRect(3, -5, 3, 10);
    ctx.fillStyle = weapon === 'rune_blade' || weapon === 'pact_blade' ? accent : '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(6, -2.5);
    ctx.lineTo(6 + len, 0);
    ctx.lineTo(6, 2.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  render(game) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const level = game.level;
    const theme = THEME_PALETTES[level.templeTheme] || THEME_PALETTES.corrupted;
    const time = game.time;

    ctx.fillStyle = '#0c0d14';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    // Camera with screen shake
    const shakeX = game.shake > 0 ? (Math.random() - 0.5) * game.shake * 14 : 0;
    const shakeY = game.shake > 0 ? (Math.random() - 0.5) * game.shake * 14 : 0;
    const camX = Math.round(game.camX + shakeX);
    const camY = Math.round(game.camY + shakeY);
    ctx.translate(-camX, -camY);

    // 1. Tiles (only visible viewport)
    const startCol = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
    const endCol = Math.min(level.width - 1, Math.ceil((camX + W) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
    const endRow = Math.min(level.height - 1, Math.ceil((camY + H) / TILE_SIZE) + 1);

    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        const t = level.tiles[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        this._drawTile(ctx, t, px, py, x, y, theme, time, level.templeTheme);
      }
    }

    // 2. Traps
    for (const trap of game.traps) {
      this._drawTrap(ctx, trap, time);
    }

    // 3. Chests
    for (const chest of game.chests) {
      this._drawChest(ctx, chest, time);
    }

    // 3b. Endless Dungeon Descent Portal
    if (game.level.isEndlessDungeon && game.level.portalPos) {
      this._drawPortal(ctx, game.level.portalPos.x, game.level.portalPos.y, game.portalUnlocked, time);
    }

    // 4. NPCs (including friendly/neutral Elementals & Worshippers & High Priest)
    for (const npc of game.npcs) {
      if (npc.convertedToEnemy) continue;
      this._drawNpc(ctx, npc, time, game.nearbyTarget?.entity === npc);
    }

    // 5. Enemies (including hostile Elementals & hostile Priest Boss)
    for (const enemy of game.enemies) {
      if (enemy.dead) continue;
      this._drawEnemy(ctx, enemy, time);
    }

    // 6. Player
    drawCharacter(ctx, game.character, game.player.x, game.player.y, {
      time,
      moving: Math.hypot(game.player.vx, game.player.vy) > 15,
      aimAngle: game.player.aimAngle,
      swingProgress: game.player.swingTimer > 0 ? game.player.swingTimer / game.player.swingDuration : 0,
      hurtFlash: game.player.hurtFlash,
    });

    // Shield ring on player
    if (game.player.shield > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(game.player.x, game.player.y, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 7. Melee Swing Arcs & Beams & Novas
    for (const fx of game.effects) {
      this._drawEffect(ctx, fx);
    }

    // 8. Projectiles
    for (const p of game.projectiles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size || 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, (p.size || 7) * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 9. Particles
    for (const pt of game.particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 10. Floating damage/info texts
    ctx.textAlign = 'center';
    for (const ft of game.floatingTexts) {
      ctx.globalAlpha = Math.min(1, ft.life / 0.5);
      ctx.font = ft.big ? '700 18px system-ui, sans-serif' : '700 14px system-ui, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    // 11. Interact Prompt Bubble
    if (game.nearbyTarget) {
      const t = game.nearbyTarget.entity;
      const label = game.nearbyTarget.label;
      ctx.save();
      ctx.font = '600 13px system-ui, sans-serif';
      const tw = ctx.measureText(label).width + 24;
      ctx.fillStyle = 'rgba(13, 16, 28, 0.9)';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(t.x - tw / 2, t.y - 54, tw, 26, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText(label, t.x, t.y - 37);
      ctx.restore();
    }

    ctx.restore();

    // Ambient temple conversion tint
    ctx.fillStyle = theme.ambientTint;
    ctx.fillRect(0, 0, W, H);

    // Boss HP Bar at top center if an active boss is nearby/aggroed
    const activeBoss = game.enemies.find((e) => !e.dead && e.isBoss && Math.hypot(e.x - game.player.x, e.y - game.player.y) < 520);
    if (activeBoss) {
      const bw = Math.min(460, W - 120);
      const bx = (W - bw) / 2;
      const by = 68;
      ctx.fillStyle = 'rgba(10, 12, 22, 0.85)';
      ctx.strokeStyle = activeBoss.color || '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx - 10, by - 22, bw + 20, 44, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(activeBoss.name, W / 2, by - 5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx, by + 3, bw, 12);
      ctx.fillStyle = activeBoss.color || '#ef4444';
      ctx.fillRect(bx, by + 3, bw * Math.max(0, activeBoss.hp / activeBoss.maxHp), 12);
    }

    // Minimap (bottom-right)
    this._drawMinimap(ctx, game, W, H);
  }

  _drawTile(ctx, t, px, py, gx, gy, theme, time, templeTheme) {
    if (t === 0 || t === 10) {
      ctx.fillStyle = '#181a26';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#25283a';
      ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 10);
      if (t === 10) {
        const flick = 0.8 + Math.sin(time * 12 + gx) * 0.2;
        const grad = ctx.createRadialGradient(px + 24, py + 24, 3, px + 24, py + 24, 40 * flick);
        grad.addColorStop(0, 'rgba(255, 196, 70, 0.9)');
        grad.addColorStop(1, 'rgba(255, 120, 20, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(px - 16, py - 16, TILE_SIZE + 32, TILE_SIZE + 32);
        ctx.fillStyle = '#ff9f1c';
        ctx.beginPath();
        ctx.arc(px + 24, py + 24, 6 * flick, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    let base = '#313548';
    if (t === 2) base = theme.marble;
    else if (t === 3) base = theme.marble;
    else if (t === 4) base = '#5c241e';
    else if (t === 5) base = '#1c3f59';
    else if (t === 6) base = '#2b472f';
    else if (t === 7) base = '#39345e';
    else if (t === 8) base = theme.carpet;
    else if (t === 9) base = theme.altar;

    ctx.fillStyle = base;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Subtle tile grid seam
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

    // Animated elemental shimmer
    if (t === 4 || t === 5 || t === 6 || t === 7) {
      const shimmer = 0.1 + Math.sin(time * 3 + gx * 0.7 + gy * 0.9) * 0.08;
      ctx.fillStyle =
        t === 4 ? `rgba(255,120,40,${shimmer})` :
        t === 5 ? `rgba(56,189,248,${shimmer})` :
        t === 6 ? `rgba(74,222,128,${shimmer})` :
        `rgba(196,181,253,${shimmer})`;
      ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    }

    if (t === 3) {
      // Pillar
      ctx.fillStyle = '#1f2333';
      ctx.fillRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);
      ctx.fillStyle = '#6c7394';
      ctx.fillRect(px + 9, py + 6, TILE_SIZE - 18, TILE_SIZE - 16);
    } else if (t === 9) {
      // Sanctum Altar glow
      ctx.fillStyle = theme.altarGlow;
      ctx.beginPath();
      ctx.arc(px + 24, py + 24, 22 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
      ctx.fill();
      if (templeTheme === 'master') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 10, py + 10, TILE_SIZE - 20, TILE_SIZE - 20);
      }
    }
  }

  _drawTrap(ctx, trap, time) {
    ctx.save();
    ctx.translate(trap.x, trap.y);
    ctx.fillStyle = '#1e2230';
    ctx.fillRect(-18, -18, 36, 36);
    ctx.strokeStyle = trap.active ? '#ef4444' : '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(-18, -18, 36, 36);

    if (trap.kind === 'spikes') {
      ctx.fillStyle = trap.active ? '#f87171' : '#64748b';
      for (const ox of [-9, 0, 9]) {
        for (const oy of [-9, 0, 9]) {
          ctx.beginPath();
          ctx.arc(ox, oy, trap.active ? 4 : 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (trap.kind === 'fire_jet') {
      ctx.fillStyle = trap.active ? '#f97316' : '#7c2d12';
      ctx.beginPath();
      ctx.arc(0, 0, trap.active ? 15 + Math.sin(time * 24) * 3 : 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = trap.active ? '#c084fc' : '#6b21a8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, trap.active ? 16 : 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawPortal(ctx, x, y, unlocked, time) {
    ctx.save();
    ctx.translate(x, y);
    const r = unlocked ? 26 + Math.sin(time * 5) * 3 : 20;
    ctx.shadowColor = unlocked ? '#22d3ee' : '#6b21a8';
    ctx.shadowBlur = unlocked ? 26 : 8;
    ctx.strokeStyle = unlocked ? '#fde047' : '#7e22ce';
    ctx.lineWidth = unlocked ? 4 : 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = unlocked ? 'rgba(34, 211, 238, 0.35)' : 'rgba(88, 28, 135, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, r - 4, 0, Math.PI * 2);
    ctx.fill();

    if (unlocked) {
      ctx.rotate(time * 2.5);
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, r - 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  _drawChest(ctx, chest, time) {
    ctx.save();
    ctx.translate(chest.x, chest.y);
    const bodyColor = chest.tier === 'gold' ? '#d97706' : chest.tier === 'iron' ? '#475569' : '#78350f';
    const trimColor = chest.tier === 'gold' ? '#fef08a' : '#cbd5e1';

    if (!chest.opened) {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.18)';
      ctx.beginPath();
      ctx.arc(0, 0, 22 + Math.sin(time * 4) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-15, -11, 30, 22);
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(-15, -11, 30, 22);
    ctx.fillStyle = chest.opened ? '#0f172a' : trimColor;
    ctx.fillRect(-4, -3, 8, 6);
    ctx.restore();
  }

  _drawNpc(ctx, npc, time, highlighted) {
    const isElemental = npc.role?.startsWith('elemental_');
    const bob = Math.sin(time * 3.5 + npc.x) * 2.5;
    ctx.save();
    ctx.translate(npc.x, npc.y + bob);

    if (highlighted) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 2, isElemental ? 32 : 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (isElemental) {
      this._drawElementalBody(ctx, npc.element, npc.color, npc.accent, time, npc.allied);
    } else {
      // Priest or Villager
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 16, 13, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = npc.color || '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(-10, -4, 20, 20, 5);
      ctx.fill();
      ctx.fillStyle = npc.accent || '#facc15';
      ctx.fillRect(-3, -4, 6, 18);
      ctx.fillStyle = '#f1c29b';
      ctx.beginPath();
      ctx.arc(0, -12, 8.5, 0, Math.PI * 2);
      ctx.fill();
      if (npc.role === 'priest') {
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(-7, -18);
        ctx.lineTo(0, -30);
        ctx.lineTo(7, -18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-1.5, -26, 3, 7);
      } else if (npc.role === 'bard') {
        // Plumed beret + enchanted lute!
        ctx.fillStyle = '#831843';
        ctx.beginPath();
        ctx.ellipse(0, -20, 11, 4.5, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(4, -22);
        ctx.quadraticCurveTo(14, -31, 16, -24);
        ctx.stroke();
        // Lute in hand
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(13, 4, 7, 5, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(24, -8);
        ctx.stroke();
      } else if (npc.role === 'alien_commander' || npc.role === 'alien_queen' || npc.role === 'alien_drummer') {
        // Alien antennae, glowing visor, futuristic aura
        ctx.fillStyle = npc.color;
        ctx.beginPath();
        ctx.arc(0, -12, 9.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = npc.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-5, -20);
        ctx.lineTo(-10, -30);
        ctx.moveTo(5, -20);
        ctx.lineTo(10, -30);
        ctx.stroke();
        ctx.fillStyle = npc.accent;
        ctx.fillRect(-6, -14, 12, 3.5);
        if (npc.role === 'alien_drummer') {
          // Futuristic glowing war drums
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(-15, 6, 8, 5, 0, 0, Math.PI * 2);
          ctx.ellipse(15, 6, 8, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (npc.role === 'alien_queen') {
          // Cosmic star crown
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.moveTo(-8, -20);
          ctx.lineTo(-4, -31);
          ctx.lineTo(0, -24);
          ctx.lineTo(4, -31);
          ctx.lineTo(8, -20);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Nameplate & Quest indicator
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText(npc.name, 1, isElemental ? -36 : -32);
    ctx.fillStyle = npc.allied ? '#4ade80' : isElemental ? npc.accent : '#fef08a';
    ctx.fillText(npc.allied ? `${npc.name} (ALLY)` : npc.name, 0, isElemental ? -37 : -33);

    if (npc.quest && !npc.questCompleted) {
      ctx.font = '900 18px system-ui, sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.fillText('!', 0, -46);
    }
    ctx.restore();
  }

  _drawElementalBody(ctx, element, color, accent, time, allied = false) {
    ctx.save();
    ctx.shadowColor = allied ? '#4ade80' : color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Swirling elemental satellites
    ctx.fillStyle = accent;
    for (let i = 0; i < 4; i++) {
      const a = time * 3 + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 26, Math.sin(a) * 18, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Fierce eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-7, -4, 3.5, 0, Math.PI * 2);
    ctx.arc(7, -4, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Demon horns
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-12, -16);
    ctx.lineTo(-22, -30);
    ctx.moveTo(12, -16);
    ctx.lineTo(22, -30);
    ctx.stroke();
    ctx.restore();
  }

  _drawEnemy(ctx, e, time) {
    const bob = Math.sin(time * 7 + e.x) * 2;
    ctx.save();
    ctx.translate(e.x, e.y + bob);

    if (e.isElementalBoss) {
      this._drawElementalBody(ctx, e.element, e.hurtFlash > 0 ? '#ffffff' : e.color, e.accent, time, false);
    } else if (e.kind === 'priest_boss') {
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 20;
      ctx.fillStyle = e.hurtFlash > 0 ? '#ffffff' : '#fef3c7';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.stroke();
    } else if (e.kind === 'bard_boss') {
      // Lyricus, Master Bard Boss with glowing musical aura & lute
      ctx.shadowColor = '#f472b6';
      ctx.shadowBlur = 22;
      ctx.fillStyle = e.hurtFlash > 0 ? '#ffffff' : '#831843';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 28 + Math.sin(time * 8) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.font = '700 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('♫', 0, 6);
    } else if (e.kind === 'alien_drummer_boss') {
      // Zor-Krak, Royal Alien Drummer Boss with twin futuristic earthquake drums
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 24;
      ctx.fillStyle = e.hurtFlash > 0 ? '#ffffff' : '#0891b2';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(-22, 8, 10, 6, 0, 0, Math.PI * 2);
      ctx.ellipse(22, 8, 10, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-9, -6, 18, 4);
    } else if (e.kind === 'alien_jetpack' || e.kind === 'alien_commander') {
      // Alien soldier with jetpack thruster flames + laser pistol!
      const isCmd = e.kind === 'alien_commander';
      const r = isCmd ? 21 : 14;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-6, r - 2);
      ctx.lineTo(0, r + 10 + Math.sin(time * 30) * 4);
      ctx.lineTo(6, r - 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = e.hurtFlash > 0 ? '#ffffff' : isCmd ? '#059669' : '#10b981';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#a5f3fc';
      ctx.fillRect(-r * 0.5, -4, r, 4);
    } else if (e.kind === 'harmonic_minion') {
      // Summoned musical phantom minion
      ctx.shadowColor = '#f472b6';
      ctx.shadowBlur = 12;
      ctx.fillStyle = e.hurtFlash > 0 ? '#ffffff' : '#ec4899';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('♪', 0, 4);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 14, 13, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = e.hurtFlash > 0 ? '#ffffff' : e.color || '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, e.radius || 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-4, -3, 2.3, 0, Math.PI * 2);
      ctx.arc(4, -3, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (e.slowTimer > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, (e.radius || 16) + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Small HP bar above non-boss enemies
    if (!e.isBoss && e.hp < e.maxHp) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-16, -24, 32, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-16, -24, 32 * Math.max(0, e.hp / e.maxHp), 5);
    }
    ctx.restore();
  }

  _drawEffect(ctx, fx) {
    const p = Math.max(0, fx.life / fx.maxLife);
    ctx.save();
    ctx.globalAlpha = p;
    if (fx.kind === 'arc') {
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 10 * p + 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.range * (1.05 - p * 0.15), fx.angle - fx.arc / 2, fx.angle + fx.arc / 2);
      ctx.stroke();
    } else if (fx.kind === 'nova') {
      const r = fx.radius * (1.05 - p * 0.45);
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 8 * p;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = fx.color;
      ctx.globalAlpha = p * 0.25;
      ctx.fill();
    } else if (fx.kind === 'beam') {
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = fx.width * p;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(fx.x, fx.y);
      ctx.lineTo(fx.x + Math.cos(fx.angle) * fx.range, fx.y + Math.sin(fx.angle) * fx.range);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawMinimap(ctx, game, W, H) {
    const level = game.level;
    const scale = 4;
    const mw = level.width * scale;
    const mh = level.height * scale;
    const ox = W - mw - 14;
    const oy = H - mh - 14;

    ctx.save();
    ctx.fillStyle = 'rgba(10, 12, 22, 0.78)';
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(ox - 4, oy - 4, mw + 8, mh + 8, 6);
    ctx.fill();
    ctx.stroke();

    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const t = level.tiles[y][x];
        if (t === 0 || t === 10) continue;
        ctx.fillStyle =
          t === 4 ? '#ea580c' :
          t === 5 ? '#0284c7' :
          t === 6 ? '#16a34a' :
          t === 7 ? '#7c3aed' :
          t === 9 ? '#facc15' :
          '#475569';
        ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
      }
    }

    // NPCs
    for (const n of game.npcs) {
      if (n.convertedToEnemy) continue;
      ctx.fillStyle = n.allied ? '#4ade80' : '#facc15';
      ctx.fillRect(ox + (n.x / TILE_SIZE) * scale - 2, oy + (n.y / TILE_SIZE) * scale - 2, 4, 4);
    }
    // Enemies
    for (const e of game.enemies) {
      if (e.dead) continue;
      ctx.fillStyle = e.isBoss ? '#ff3838' : '#f87171';
      const s = e.isBoss ? 5 : 3;
      ctx.fillRect(ox + (e.x / TILE_SIZE) * scale - s / 2, oy + (e.y / TILE_SIZE) * scale - s / 2, s, s);
    }
    // Player
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ox + (game.player.x / TILE_SIZE) * scale, oy + (game.player.y / TILE_SIZE) * scale, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
