/* Offline Aether Snap replay: original trusted engine statically embedded. Imported files are JSON/text data only. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.AetherReplay=factory();})(typeof globalThis==='object'?globalThis:this,function(){
'use strict';
function makeOriginalCore(Math,Date){

// ============================================================================
// DETERMINISTIC SEEDED PRNG & DECK SERIALIZATION UTILITIES
// ============================================================================

class SeededRNG {
  constructor(seedInput) {
    this.seedString = String(seedInput ?? SeededRNG.randomSeedString());
    const [a, b, c, d] = SeededRNG.cyrb128(this.seedString);
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }

  static cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
  }

  // Returns float in [0, 1)
  next() {
    this.a >>>= 0; this.b >>>= 0; this.c >>>= 0; this.d >>>= 0;
    let t = (this.a + this.b) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.d = (this.d + 1) | 0;
    t = (t + this.d) | 0;
    this.c = (this.c + t) | 0;
    return (t >>> 0) / 4294967296;
  }

  // Integer in [min, max] inclusive
  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Float in [min, max)
  range(min, max) {
    return min + this.next() * (max - min);
  }

  // Pick one item from array
  pick(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[this.int(0, arr.length - 1)];
  }

  // Weighted pick: items = [{ weight: number, value: any }, ...]
  weightedPick(items) {
    const total = items.reduce((acc, item) => acc + item.weight, 0);
    let r = this.next() * total;
    for (const item of items) {
      r -= item.weight;
      if (r <= 0) return item.value ?? item;
    }
    return items[items.length - 1].value ?? items[items.length - 1];
  }

  // Deterministic Fisher-Yates shuffle (returns new array)
  shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Generate a readable alphanumeric seed token
  static randomSeedString(prefix = 'SEED') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 8; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${prefix}-${out}`;
  }
}

// ============================================================================
// DECK CODE ENCODER / DECODER
// Supports importing:
// 1. Compact shareable Deck Code: "DECK1:<base64>"
// 2. Full JSON string (exported deck object)
// 3. Raw Deck Seed string (e.g., "DK-9A8F72C1" or any custom phrase like "DRAGON-LORD")
// 4. Comma/space-separated list of 12 card seeds
// ============================================================================

function encodeDeckShareCode(deckObj) {
  const payload = {
    v: 1,
    name: deckObj.name || `Deck ${deckObj.deckSeed}`,
    deckSeed: deckObj.deckSeed,
    cardSeeds: deckObj.cards ? deckObj.cards.map(c => c.seed) : deckObj.cardSeeds
  };
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return `RIFTDECK1:${b64}`;
}

function decodeDeckInput(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return null;
  }
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // Case 1: RIFTDECK1:<base64>
  if (trimmed.startsWith('RIFTDECK1:')) {
    try {
      const b64 = trimmed.slice('RIFTDECK1:'.length).trim();
      const json = decodeURIComponent(escape(atob(b64)));
      const parsed = JSON.parse(json);
      if (parsed && (parsed.deckSeed || Array.isArray(parsed.cardSeeds))) {
        return {
          name: parsed.name || `Deck ${parsed.deckSeed || 'Custom'}`,
          deckSeed: parsed.deckSeed || SeededRNG.randomSeedString('DK'),
          cardSeeds: Array.isArray(parsed.cardSeeds) && parsed.cardSeeds.length === 12 ? parsed.cardSeeds : null
        };
      }
    } catch (e) {
      console.warn('Failed to parse RIFTDECK1 code, falling back to seed string:', e);
    }
  }

  // Case 2: Raw JSON object
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const cardSeeds = parsed.cardSeeds || (Array.isArray(parsed.cards) ? parsed.cards.map(c => typeof c === 'string' ? c : c.seed) : null);
      return {
        name: parsed.name || `Imported Deck (${parsed.deckSeed || 'Custom'})`,
        deckSeed: parsed.deckSeed || SeededRNG.randomSeedString('DK'),
        cardSeeds: Array.isArray(cardSeeds) && cardSeeds.length === 12 ? cardSeeds : null
      };
    } catch (e) {
      console.warn('Invalid JSON deck input, treating as seed string.');
    }
  }

  // Case 3: Comma-separated 12 card seeds
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length === 12) {
      return {
        name: `Custom Seed List (${parts[0]}...)`,
        deckSeed: `CUSTOM-${parts.join('-').slice(0, 16)}`,
        cardSeeds: parts
      };
    }
  }

  // Case 4: Plain seed string (e.g. "DK-7F892A1B" or any user string)
  return {
    name: `Seeded Deck [${trimmed}]`,
    deckSeed: trimmed,
    cardSeeds: null
  };
}


// ============================================================================
// PROCEDURAL SVG ARTWORK GENERATOR FOR CARDS & LOCATIONS
// Generates deterministic, rich multi-layered SVG illustrations from seed
// ============================================================================


const PALETTES = [
  { name: 'Solaris', primary: '#ff7b00', secondary: '#ffd000', accent: '#ff0055', bg1: '#230903', bg2: '#591609', glow: '#ff9e00' },
  { name: 'Aether',  primary: '#00d4ff', secondary: '#7b2cbf', accent: '#b5179e', bg1: '#050826', bg2: '#1a0b3b', glow: '#00f5d4' },
  { name: 'Verdant', primary: '#2ec4b6', secondary: '#80ed99', accent: '#ffbf69', bg1: '#041c15', bg2: '#0b3b2d', glow: '#57cc99' },
  { name: 'Crimson', primary: '#ef233c', secondary: '#ff758f', accent: '#ffb703', bg1: '#1f0309', bg2: '#4a0717', glow: '#ff4d6d' },
  { name: 'Void',    primary: '#9d4edd', secondary: '#e0aaff', accent: '#00bbf9', bg1: '#0d0221', bg2: '#240046', glow: '#c77dff' },
  { name: 'Cyber',   primary: '#00f5d4', secondary: '#fee440', accent: '#f15bb5', bg1: '#06111c', bg2: '#0f2942', glow: '#00bbf9' },
  { name: 'Obsidian',primary: '#f72585', secondary: '#4cc9f0', accent: '#7209b7', bg1: '#0a090c', bg2: '#1d1a2f', glow: '#4361ee' },
  { name: 'Auric',   primary: '#ffd166', secondary: '#06d6a0', accent: '#ef476f', bg1: '#1c1605', bg2: '#3d2f0a', glow: '#ffe66d' }
];

const TRIGGER_META = {
  ON_REVEAL: { label: 'ON REVEAL', color: '#38bdf8', icon: 'M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z' },
  ONGOING:   { label: 'ONGOING',   color: '#a855f7', icon: 'M12 4A8 8 0 1 0 20 12A8 8 0 0 0 12 4ZM12 8A4 4 0 1 1 8 12A4 4 0 0 1 12 8Z' },
  WHEN_DISCARDED: { label: 'DISCARD', color: '#f59e0b', icon: 'M5 3H19L17 21H7L5 3ZM9 7V17M15 7V17' },
  WHEN_DESTROYED: { label: 'DESTROY', color: '#ef4444', icon: 'M12 2L14 8L20 6L16 12L21 17L14 16L12 22L10 16L3 17L8 12L4 6L10 8Z' }
};

function generateCardSVG(card, options = {}) {
  const rng = new SeededRNG(`SVG-${card.seed}`);
  const uid = card.seed.replace(/[^a-zA-Z0-9]/g, '') + '_' + rng.int(100, 999);
  const pal = PALETTES[rng.int(0, PALETTES.length - 1)];
  const archetypeStyle = rng.int(0, 6); // 0: Sacred Mandala, 1: Cyber Mecha, 2: Astral Entity, 3: Runic Monolith, 4: Draconic/Serpent, 5: Singularity Vortex, 6: Crystalline Golem

  // Starfield / particles in background
  let particles = '';
  const numParticles = 14;
  for (let i = 0; i < numParticles; i++) {
    const px = rng.int(18, 182);
    const py = rng.int(24, 210);
    const pr = rng.range(0.8, 2.8).toFixed(1);
    const op = rng.range(0.25, 0.85).toFixed(2);
    const col = i % 2 === 0 ? pal.secondary : pal.primary;
    particles += `<circle cx="${px}" cy="${py}" r="${pr}" fill="${col}" opacity="${op}"/>`;
  }

  // Background geometric rays or nebula waves
  let bgGeo = '';
  const rayCount = rng.int(6, 12);
  for (let i = 0; i < rayCount; i++) {
    const angle = (360 / rayCount) * i + rng.int(-8, 8);
    bgGeo += `<line x1="100" y1="105" x2="${100 + Math.cos(angle * Math.PI / 180) * 120}" y2="${105 + Math.sin(angle * Math.PI / 180) * 120}" stroke="${pal.primary}" stroke-width="1" opacity="0.22"/>`;
  }

  // Central focal illustration based on archetypeStyle
  let centerArt = '';
  const cx = 100, cy = 105;

  if (archetypeStyle === 0) {
    // Sacred Cosmic Mandala & Core
    const rings = rng.int(3, 5);
    for (let r = rings; r >= 1; r--) {
      const rad = r * 14 + rng.int(-2, 4);
      const pts = [];
      const sides = rng.pick([5, 6, 8, 10, 12]);
      const rot = rng.int(0, 45);
      for (let s = 0; s < sides; s++) {
        const a = ((360 / sides) * s + rot) * (Math.PI / 180);
        pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`);
      }
      centerArt += `<polygon points="${pts.join(' ')}" fill="${r === 1 ? pal.accent : 'none'}" fill-opacity="0.35" stroke="${r % 2 === 0 ? pal.secondary : pal.primary}" stroke-width="${r === 1 ? 2.5 : 1.5}" opacity="0.88"/>`;
    }
    centerArt += `<circle cx="${cx}" cy="${cy}" r="12" fill="url(#core_${uid})" stroke="#fff" stroke-width="1.5"/>`;
  } else if (archetypeStyle === 1) {
    // Cybernetic Sentinel / Mecha Visor & Wings
    const wingSpan = rng.int(55, 76);
    const wingHeight = rng.int(35, 60);
    const helmH = rng.int(26, 40);
    centerArt += `
      <path d="M${cx} ${cy - 45} L${cx + wingSpan} ${cy - wingHeight} L${cx + 42} ${cy + 25} L${cx} ${cy + 48} L${cx - 42} ${cy + 25} L${cx - wingSpan} ${cy - wingHeight} Z" fill="${pal.bg2}" stroke="${pal.primary}" stroke-width="2" opacity="0.9"/>
      <polygon points="${cx},${cy - helmH} ${cx + 28},${cy - 8} ${cx + 18},${cy + 32} ${cx},${cy + 42} ${cx - 18},${cy + 32} ${cx - 28},${cy - 8}" fill="url(#core_${uid})" stroke="${pal.secondary}" stroke-width="2"/>
      <polygon points="${cx - 20},${cy - 4} ${cx},${cy + 4} ${cx + 20},${cy - 4} ${cx + 14},${cy - 12} ${cx},${cy - 6} ${cx - 14},${cy - 12}" fill="#ffffff" stroke="${pal.accent}" stroke-width="1.2"/>
      <line x1="${cx}" y1="${cy - helmH - 12}" x2="${cx}" y2="${cy - helmH + 6}" stroke="${pal.secondary}" stroke-width="3"/>
    `;
  } else if (archetypeStyle === 2) {
    // Astral Archon / Crowned Entity
    const hornSpread = rng.int(32, 54);
    const hornTipY = cy - rng.int(48, 66);
    centerArt += `
      <circle cx="${cx}" cy="${cy}" r="48" fill="none" stroke="${pal.secondary}" stroke-dasharray="6 4" stroke-width="1.8" opacity="0.7"/>
      <path d="M${cx - 22} ${cy - 10} Q${cx - hornSpread - 15} ${cy - 30} ${cx - hornSpread} ${hornTipY} Q${cx - 15} ${cy - 32} ${cx} ${cy - 26} Q${cx + 15} ${cy - 32} ${cx + hornSpread} ${hornTipY} Q${cx + hornSpread + 15} ${cy - 30} ${cx + 22} ${cy - 10} Z" fill="url(#core_${uid})" stroke="${pal.primary}" stroke-width="2"/>
      <path d="M${cx - 26} ${cy + 42} C${cx - 32} ${cy + 10}, ${cx - 20} ${cy - 24}, ${cx} ${cy - 24} C${cx + 20} ${cy - 24}, ${cx + 32} ${cy + 10}, ${cx + 26} ${cy + 42} Z" fill="${pal.bg1}" stroke="${pal.secondary}" stroke-width="2"/>
      <ellipse cx="${cx - 9}" cy="${cy - 4}" rx="5" ry="2.5" fill="${pal.glow}"/>
      <ellipse cx="${cx + 9}" cy="${cy - 4}" rx="5" ry="2.5" fill="${pal.glow}"/>
      <circle cx="${cx}" cy="${cy - 15}" r="4" fill="#fff"/>
    `;
  } else if (archetypeStyle === 3) {
    // Runic Obelisk / Floating Crystals
    const obW = rng.int(18, 26);
    centerArt += `
      <polygon points="${cx},${cy - 62} ${cx + obW},${cy - 32} ${cx + obW - 4},${cy + 38} ${cx},${cy + 52} ${cx - obW + 4},${cy + 38} ${cx - obW},${cy - 32}" fill="url(#core_${uid})" stroke="${pal.secondary}" stroke-width="2"/>
      <polygon points="${cx - 48},${cy - 18} ${cx - 36},${cy - 36} ${cx - 28},${cy - 12} ${cx - 40},${cy + 8}" fill="${pal.primary}" stroke="#fff" stroke-width="1" opacity="0.85"/>
      <polygon points="${cx + 48},${cy - 18} ${cx + 36},${cy - 36} ${cx + 28},${cy - 12} ${cx + 40},${cy + 8}" fill="${pal.primary}" stroke="#fff" stroke-width="1" opacity="0.85"/>
      <path d="M${cx} ${cy - 40} L${cx} ${cy + 30} M${cx - 10} ${cy - 15} L${cx + 10} ${cy - 5} M${cx - 10} ${cy + 10} L${cx + 10} ${cy + 20}" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    `;
  } else if (archetypeStyle === 4) {
    // Solar/Void Phoenix or Winged Wyrm
    const span = rng.int(60, 76);
    centerArt += `
      <path d="M${cx} ${cy - 15} Q${cx - 40} ${cy - 65} ${cx - span} ${cy - 25} Q${cx - 45} ${cy - 5} ${cx - 58} ${cy + 20} Q${cx - 25} ${cy + 10} ${cx} ${cy + 48} Q${cx + 25} ${cy + 10} ${cx + 58} ${cy + 20} Q${cx + 45} ${cy - 5} ${cx + span} ${cy - 25} Q${cx + 40} ${cy - 65} ${cx} ${cy - 15} Z" fill="url(#core_${uid})" stroke="${pal.secondary}" stroke-width="2"/>
      <polygon points="${cx},${cy - 52} ${cx + 12},${cy - 28} ${cx},${cy + 15} ${cx - 12},${cy - 28}" fill="${pal.accent}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="${cx}" cy="${cy - 32}" r="4.5" fill="#fff"/>
    `;
  } else if (archetypeStyle === 5) {
    // Singularity Vortex / Dimensional Eye
    for (let i = 0; i < 4; i++) {
      const rx = 56 - i * 10;
      const ry = 26 - i * 4;
      const rot = i * 28 + rng.int(0, 20);
      centerArt += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="none" stroke="${i % 2 === 0 ? pal.primary : pal.secondary}" stroke-width="2" opacity="0.8"/>`;
    }
    centerArt += `
      <path d="M${cx - 46} ${cy} Q${cx} ${cy - 36} ${cx + 46} ${cy} Q${cx} ${cy + 36} ${cx - 46} ${cy} Z" fill="${pal.bg1}" stroke="${pal.secondary}" stroke-width="2.5"/>
      <circle cx="${cx}" cy="${cy}" r="16" fill="url(#core_${uid})" stroke="${pal.accent}" stroke-width="2"/>
      <ellipse cx="${cx}" cy="${cy}" rx="4" ry="11" fill="#fff"/>
    `;
  } else {
    // Crystalline Titan / Prismatic Shield
    const shards = rng.int(5, 8);
    for (let i = 0; i < shards; i++) {
      const ang = ((360 / shards) * i - 90) * (Math.PI / 180);
      const dist = rng.int(28, 46);
      const sx = cx + Math.cos(ang) * dist;
      const sy = cy + Math.sin(ang) * dist;
      centerArt += `<polygon points="${cx},${cy} ${sx - 10},${sy - 8} ${sx + 8},${sy - 12} ${sx + 10},${sy + 10}" fill="${i % 2 === 0 ? pal.primary : pal.accent}" fill-opacity="0.55" stroke="${pal.secondary}" stroke-width="1.5"/>`;
    }
    centerArt += `<polygon points="${cx},${cy - 34} ${cx + 28},${cy} ${cx},${cy + 34} ${cx - 28},${cy}" fill="url(#core_${uid})" stroke="#fff" stroke-width="2"/>`;
  }

  const trig = TRIGGER_META[card.trigger] || TRIGGER_META.ON_REVEAL;
  const effectivePower = card.currentPower !== undefined ? card.currentPower : card.power;
  const powerColor = effectivePower > card.power ? '#4ade80' : (effectivePower < card.power ? '#f87171' : '#ffffff');

  // Balance tier indicator badge colour
  let tierGemColor = '#38bdf8';
  if (card.tier === 'POWERFUL') tierGemColor = '#facc15';
  else if (card.tier === 'NEGATIVE') tierGemColor = '#ef4444';
  else if (card.tier === 'WEAK') tierGemColor = '#94a3b8';

  return `
<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" class="card-svg" role="img" aria-label="${card.name}">
  <defs>
    <linearGradient id="bg_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${pal.bg1}"/>
      <stop offset="60%" stop-color="${pal.bg2}"/>
      <stop offset="100%" stop-color="${pal.bg1}"/>
    </linearGradient>
    <radialGradient id="core_${uid}" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="${pal.secondary}"/>
      <stop offset="65%" stop-color="${pal.primary}"/>
      <stop offset="100%" stop-color="${pal.bg1}"/>
    </radialGradient>
    <linearGradient id="frame_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${pal.primary}"/>
      <stop offset="50%" stop-color="${pal.secondary}"/>
      <stop offset="100%" stop-color="${pal.accent}"/>
    </linearGradient>
    <clipPath id="artclip_${uid}">
      <rect x="12" y="14" width="176" height="172" rx="12"/>
    </clipPath>
  </defs>

  <!-- Outer Card Body -->
  <rect x="4" y="4" width="192" height="272" rx="16" fill="#0b0f19" stroke="url(#frame_${uid})" stroke-width="3.5"/>
  <rect x="8" y="8" width="184" height="264" rx="13" fill="url(#bg_${uid})" stroke="${pal.primary}" stroke-opacity="0.35" stroke-width="1"/>

  <!-- Clipped Artwork Window -->
  <g clip-path="url(#artclip_${uid})">
    <rect x="12" y="14" width="176" height="172" fill="url(#bg_${uid})"/>
    ${bgGeo}
    ${particles}
    ${centerArt}
  </g>

  <!-- Artwork Frame Border -->
  <rect x="12" y="14" width="176" height="172" rx="12" fill="none" stroke="url(#frame_${uid})" stroke-width="2"/>

  <!-- Trigger Type Pill Badge -->
  <rect x="52" y="175" width="96" height="18" rx="9" fill="#090d16" stroke="${trig.color}" stroke-width="1.5"/>
  <text x="100" y="187.5" text-anchor="middle" fill="${trig.color}" font-family="system-ui, sans-serif" font-size="9" font-weight="800" letter-spacing="0.8">${trig.label}</text>

  <!-- Card Name Banner -->
  <path d="M16 198 L184 198 L178 219 L22 219 Z" fill="#111827" stroke="${pal.secondary}" stroke-width="1.2"/>
  <text x="100" y="212.5" text-anchor="middle" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="11.5" font-weight="800" letter-spacing="0.4">${escapeXml(card.name)}</text>

  <!-- Card Effect Text Box -->
  <rect x="14" y="222" width="172" height="44" rx="7" fill="#060911" fill-opacity="0.88" stroke="#1e293b" stroke-width="1"/>
  ${renderWrappedSvgText(card.effectText, 100, 236, 28, 11, '#cbd5e1')}

  <!-- Seed Footer Watermark -->
  <text x="100" y="273" text-anchor="middle" fill="#64748b" font-family="monospace" font-size="7.5">#${escapeXml(card.seed)}</text>

  <!-- Top-Left COST Hexagon Orb -->
  <g transform="translate(26, 28)">
    <polygon points="0,-18 16,-9 16,9 0,18 -16,9 -16,-9" fill="#0284c7" stroke="#bae6fd" stroke-width="2.2"/>
    <polygon points="0,-14 12,-7 12,7 0,14 -12,7 -12,-7" fill="#0369a1"/>
    <text x="0" y="6" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="17" font-weight="900">${card.cost}</text>
  </g>

  <!-- Top-Right POWER Shield Orb -->
  <g transform="translate(174, 28)">
    <circle cx="0" cy="0" r="17" fill="#b45309" stroke="#fde68a" stroke-width="2.2"/>
    <circle cx="0" cy="0" r="13" fill="#78350f"/>
    <text x="0" y="6" text-anchor="middle" fill="${powerColor}" font-family="system-ui, sans-serif" font-size="16" font-weight="900">${effectivePower}</text>
  </g>

  <!-- Balance Tier Gem Indicator -->
  <circle cx="100" cy="14" r="4" fill="${tierGemColor}" stroke="#0f172a" stroke-width="1.2"/>
</svg>`.trim();
}

function generateLocationSVG(location, isRevealed = true) {
  const rng = new SeededRNG(`LOCSVG-${location.seed}`);
  const uid = location.seed.replace(/[^a-zA-Z0-9]/g, '') + '_' + rng.int(100, 999);
  const pal = PALETTES[rng.int(0, PALETTES.length - 1)];

  if (!isRevealed) {
    return `
<svg viewBox="0 0 260 110" xmlns="http://www.w3.org/2000/svg" class="location-svg unrevealed">
  <defs>
    <linearGradient id="loclock_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
  </defs>
  <rect x="3" y="3" width="254" height="104" rx="14" fill="url(#loclock_${uid})" stroke="#475569" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="130" cy="44" r="22" fill="none" stroke="#64748b" stroke-width="2"/>
  <path d="M122 44 L130 32 L138 44 L130 56 Z" fill="#475569"/>
  <text x="130" y="82" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="1.2">REVEALS TURN ${location.revealTurn}</text>
  <text x="130" y="96" text-anchor="middle" fill="#475569" font-family="monospace" font-size="8.5">SEED: ${escapeXml(location.seed)}</text>
</svg>`.trim();
  }

  // Landscape Horizon + Celestial Body + Spire/Portal
  const moonX = rng.int(55, 205);
  const moonY = rng.int(22, 42);
  const moonR = rng.int(14, 24);
  const landscapeType = rng.int(0, 2);
  let structArt = '';

  if (landscapeType === 0) {
    // Floating Citadel Spire
    structArt = `
      <polygon points="130,10 148,48 138,48 144,72 116,72 122,48 112,48" fill="${pal.primary}" opacity="0.7" stroke="${pal.secondary}" stroke-width="1.2"/>
      <circle cx="130" cy="32" r="5" fill="#fff"/>
    `;
  } else if (landscapeType === 1) {
    // Dimensional Ring Gate
    structArt = `
      <circle cx="130" cy="42" r="24" fill="none" stroke="${pal.secondary}" stroke-width="3" stroke-dasharray="10 4"/>
      <circle cx="130" cy="42" r="16" fill="${pal.accent}" fill-opacity="0.35" stroke="${pal.primary}" stroke-width="1.5"/>
    `;
  } else {
    // Twin Crystal Monoliths
    structArt = `
      <polygon points="95,18 106,58 84,58" fill="${pal.primary}" opacity="0.65"/>
      <polygon points="165,18 176,58 154,58" fill="${pal.secondary}" opacity="0.65"/>
      <polygon points="130,12 142,58 118,58" fill="${pal.accent}" opacity="0.75" stroke="#fff" stroke-width="1"/>
    `;
  }

  return `
<svg viewBox="0 0 260 110" xmlns="http://www.w3.org/2000/svg" class="location-svg revealed">
  <defs>
    <linearGradient id="locbg_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${pal.bg1}"/>
      <stop offset="100%" stop-color="${pal.bg2}"/>
    </linearGradient>
    <clipPath id="locclip_${uid}">
      <rect x="4" y="4" width="252" height="102" rx="13"/>
    </clipPath>
  </defs>
  <g clip-path="url(#locclip_${uid})">
    <rect x="4" y="4" width="252" height="102" fill="url(#locbg_${uid})"/>
    <circle cx="${moonX}" cy="${moonY}" r="${moonR}" fill="${pal.secondary}" opacity="0.32"/>
    <path d="M0 68 L55 44 L105 62 L155 40 L210 58 L260 42 L260 110 L0 110 Z" fill="${pal.bg1}" opacity="0.75"/>
    ${structArt}
    <rect x="4" y="50" width="252" height="56" fill="#060913" fill-opacity="0.82"/>
  </g>
  <rect x="3" y="3" width="254" height="104" rx="14" fill="none" stroke="${pal.primary}" stroke-width="2.2"/>
  <text x="130" y="65" text-anchor="middle" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="900" letter-spacing="0.6">${escapeXml(location.name.toUpperCase())}</text>
  ${renderWrappedSvgText(location.effectText, 130, 80, 42, 11.5, '#e2e8f0')}
  <text x="248" y="16" text-anchor="end" fill="#94a3b8" font-family="monospace" font-size="7.5">#${escapeXml(location.seed)}</text>
</svg>`.trim();
}

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderWrappedSvgText(text, x, startY, maxCharsPerLine, lineHeight, fill) {
  const words = String(text || '').split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length <= maxCharsPerLine) {
      current = (current + ' ' + w).trim();
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);

  const displayLines = lines.slice(0, 3);
  return displayLines.map((line, idx) =>
    `<text x="${x}" y="${startY + idx * lineHeight}" text-anchor="middle" fill="${fill}" font-family="system-ui, sans-serif" font-size="9.5" font-weight="600">${escapeXml(line)}</text>`
  ).join('');
}


// ============================================================================
// PROCEDURAL CARD, DECK & LOCATION GENERATOR
// Rules enforced:
// - All cards have Power 0..12 and Cost 0..6
// - High Cost (4..6) + Low Power (0..4)  => POWERFUL effects
// - High Cost (4..6) + High Power (8..12) => WEAK effects
// - Low Cost (0..2)  + High Power (5..12) => NEGATIVE effects (drawbacks)
// - Balanced/Mid cards => SYNERGY / ENABLER effects
// - 4 Triggers: ON_REVEAL, WHEN_DISCARDED, WHEN_DESTROYED, ONGOING
// ============================================================================


const NAME_PREFIXES = [
  'Astral', 'Void', 'Solar', 'Chrono', 'Cyber', 'Aether', 'Obsidian', 'Crimson',
  'Verdant', 'Quantum', 'Runic', 'Plasma', 'Nebula', 'Apex', 'Iron', 'Shattered',
  'Luminous', 'Abyssal', 'Hyperion', 'Valkyrie', 'Eldritch', 'Prismatic', 'Starlight',
  'Cinder', 'Frost', 'Tempest', 'Vortex', 'Omega', 'Echo', 'Spectral', 'Gilded', 'Arcane'
];

const NAME_CORES = [
  'Archon', 'Golem', 'Vanguard', 'Seraph', 'Leviathan', 'Automaton', 'Wraith', 'Phoenix',
  'Sentinel', 'Wyrm', 'Monolith', 'Weaver', 'Construct', 'Harbinger', 'Drifter', 'Colossus',
  'Stalker', 'Oracle', 'Reaver', 'Titan', 'Sovereign', 'Specter', 'Catalyst', 'Guardian',
  'Inquisitor', 'Behemoth', 'Conjurer', 'Herald', 'Anomaly', 'Hydra', 'Paladin', 'Ravager'
];

const NAME_SUFFIXES = [
  'of Dawn', 'Prime', 'Zero', 'MK-IV', 'of the Rift', 'Ascendant', 'Unbound', 'Overlord',
  'Core', 'Protocol', 'from Beyond', 'Eternal', 'Breaker', 'Walker', 'Matrix', 'Incarnate',
  'of Ash', 'Rex', '99', 'Alpha', 'of Ruin', 'Pulse', 'Shard', 'Whisper'
];

// ============================================================================
// EFFECT TEMPLATES BY TIER & TRIGGER
// Every effect template maps to an executable `effectId` + numeric `param`
// implemented in gameEngine.js
// ============================================================================

const EFFECT_POOL = {
  // --------------------------------------------------------------------------
  // 1. POWERFUL EFFECTS (High Cost 4-6, Low Power 0-4)
  // --------------------------------------------------------------------------
  POWERFUL: {
    ON_REVEAL: [
      {
        effectId: 'BUFF_ALL_FRIENDLY_ALL_LOCS',
        minP: 2, maxP: 4,
        text: (p) => `On Reveal: Give ALL other friendly cards at all locations +${p} Power.`
      },
      {
        effectId: 'DESTROY_HIGHEST_ENEMY_HERE',
        minP: 1, maxP: 2,
        text: (p) => p === 1
          ? `On Reveal: Destroy the highest-Power enemy card here.`
          : `On Reveal: Destroy the highest-Power enemy card here and gain +3 Power.`
      },
      {
        effectId: 'SUMMON_DRONES_OTHER_LOCS',
        minP: 4, maxP: 6,
        text: (p) => `On Reveal: Summon a ${p}-Power Astral Drone at each other location.`
      },
      {
        effectId: 'DOUBLE_FRIENDLY_HERE',
        minP: 2, maxP: 4,
        text: (p) => `On Reveal: Give other friendly cards here +${p} Power, then double this card's Power.`
      },
      {
        effectId: 'DRAIN_ALL_ENEMIES_HERE',
        minP: 2, maxP: 4,
        text: (p) => `On Reveal: Steal ${p} Power from each enemy card at this location.`
      },
      {
        effectId: 'DISCARD_HAND_GAIN_MASSIVE',
        minP: 4, maxP: 6,
        text: (p) => `On Reveal: Discard up to 2 cards from your hand. Gain +${p} Power for each discarded.`
      },
      {
        effectId: 'DESTROY_FRIENDLY_HERE_MASSIVE_BUFF',
        minP: 5, maxP: 8,
        text: (p) => `On Reveal: Destroy another friendly card here to give all friendly cards +${ Math.max(3, Math.floor(p/2)) } Power and gain +${p} Power.`
      }
    ],
    ONGOING: [
      {
        effectId: 'ONGOING_ALL_FRIENDLY_GLOBAL_BUFF',
        minP: 2, maxP: 3,
        text: (p) => `Ongoing: All your other cards at ALL locations have +${p} Power.`
      },
      {
        effectId: 'ONGOING_OTHER_LOCATIONS_POWER',
        minP: 4, maxP: 6,
        text: (p) => `Ongoing: Add +${p} Power to each Adjacent/Other location.`
      },
      {
        effectId: 'ONGOING_SCALE_PER_FRIENDLY_GLOBAL',
        minP: 2, maxP: 3,
        text: (p) => `Ongoing: Has +${p} Power for each friendly card in play across all locations.`
      },
      {
        effectId: 'ONGOING_SCALE_DISCARD_DESTROY',
        minP: 3, maxP: 5,
        text: (p) => `Ongoing: Has +${p} Power for each card discarded or destroyed this game.`
      },
      {
        effectId: 'ONGOING_ENEMY_ALL_DEBUFF',
        minP: 2, maxP: 3,
        text: (p) => `Ongoing: All enemy cards at this location have -${p} Power.`
      }
    ],
    WHEN_DISCARDED: [
      {
        effectId: 'DISCARD_SUMMON_SELF_BUFFED',
        minP: 6, maxP: 9,
        text: (p) => `When Discarded: Automatically summon this card to a random location with +${p} Power.`
      },
      {
        effectId: 'DISCARD_GLOBAL_TEAM_BUFF',
        minP: 3, maxP: 4,
        text: (p) => `When Discarded: Give all friendly cards in play and in hand +${p} Power, and return this to hand at Cost 1.`
      }
    ],
    WHEN_DESTROYED: [
      {
        effectId: 'DESTROY_RESPAWN_TWO_COPIES',
        minP: 5, maxP: 8,
        text: (p) => `When Destroyed: Summon two copies of this card at other locations with ${p} Power each.`
      },
      {
        effectId: 'DESTROY_WIPE_ENEMY_AND_BUFF',
        minP: 3, maxP: 5,
        text: (p) => `When Destroyed: Destroy a random enemy card here and give all friendly cards +${p} Power.`
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 2. WEAK EFFECTS (High Cost 4-6, High Power 8-12)
  // --------------------------------------------------------------------------
  WEAK: {
    ON_REVEAL: [
      {
        effectId: 'WEAK_SELF_TINY_BUFF',
        minP: 1, maxP: 1,
        text: (p) => `On Reveal: Gain +${p} Power if you have another card here.`
      },
      {
        effectId: 'WEAK_BUFF_ONE_RANDOM_ALLY',
        minP: 1, maxP: 1,
        text: (p) => `On Reveal: Give a random friendly card here +${p} Power.`
      },
      {
        effectId: 'WEAK_PING_ONE_ENEMY',
        minP: 1, maxP: 1,
        text: (p) => `On Reveal: Afflict 1 random enemy card here with -${p} Power.`
      },
      {
        effectId: 'WEAK_DRAW_IF_EMPTY',
        minP: 1, maxP: 1,
        text: () => `On Reveal: If your hand is empty, gain +1 Power.`
      }
    ],
    ONGOING: [
      {
        effectId: 'ONGOING_WEAK_FULL_LANE_BONUS',
        minP: 1, maxP: 2,
        text: (p) => `Ongoing: +${p} Power if you have 4 cards at this location.`
      },
      {
        effectId: 'ONGOING_WEAK_SOLO_BONUS',
        minP: 1, maxP: 1,
        text: (p) => `Ongoing: +${p} Power if this is your only card here.`
      }
    ],
    WHEN_DISCARDED: [
      {
        effectId: 'DISCARD_WEAK_BUFF_RANDOM',
        minP: 1, maxP: 2,
        text: (p) => `When Discarded: Give a random friendly card +${p} Power.`
      }
    ],
    WHEN_DESTROYED: [
      {
        effectId: 'DESTROY_WEAK_BUFF_RANDOM',
        minP: 1, maxP: 2,
        text: (p) => `When Destroyed: Give a random friendly card +${p} Power.`
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 3. NEGATIVE EFFECTS / DRAWBACKS (Low Cost 0-2, High Power 5-12)
  // Note: Discard & Destroy drawbacks also act as combo enablers!
  // --------------------------------------------------------------------------
  NEGATIVE: {
    ON_REVEAL: [
      {
        effectId: 'NEG_DISCARD_RANDOM_CARD',
        minP: 1, maxP: 2,
        text: (p) => `On Reveal: Discard ${p} random card${p > 1 ? 's' : ''} from your hand.`
      },
      {
        effectId: 'NEG_DESTROY_FRIENDLY_HERE',
        minP: 1, maxP: 1,
        text: () => `On Reveal: Destroy another random friendly card at this location.`
      },
      {
        effectId: 'NEG_BUFF_ENEMIES_HERE',
        minP: 2, maxP: 3,
        text: (p) => `On Reveal: Give all enemy cards at this location +${p} Power.`
      },
      {
        effectId: 'NEG_DEBUFF_ALLIES_HERE',
        minP: 2, maxP: 3,
        text: (p) => `On Reveal: Afflict all other friendly cards here with -${p} Power.`
      },
      {
        effectId: 'NEG_SELF_DECAY_IF_ALONE',
        minP: 3, maxP: 5,
        text: (p) => `On Reveal: If you have no other cards here, lose ${p} Power.`
      }
    ],
    ONGOING: [
      {
        effectId: 'ONGOING_NEG_ALLY_AURA',
        minP: 2, maxP: 3,
        text: (p) => `Ongoing: Your other cards at this location have -${p} Power.`
      },
      {
        effectId: 'ONGOING_NEG_ENEMY_AURA',
        minP: 2, maxP: 3,
        text: (p) => `Ongoing: Enemy cards at this location have +${p} Power.`
      },
      {
        effectId: 'ONGOING_NEG_CROWD_PENALTY',
        minP: 2, maxP: 3,
        text: (p) => `Ongoing: Has -${p} Power for each other friendly card here.`
      }
    ],
    WHEN_DISCARDED: [
      {
        effectId: 'NEG_DISCARD_DEBUFF_HAND',
        minP: 2, maxP: 3,
        text: (p) => `When Discarded: Afflict all cards in your hand with -${p} Power. (On Reveal: Lose 2 Power.)`
      }
    ],
    WHEN_DESTROYED: [
      {
        effectId: 'NEG_DESTROY_BUFF_ENEMY',
        minP: 3, maxP: 5,
        text: (p) => `When Destroyed: Give all enemy cards here +${p} Power. (On Reveal: Lose 2 Power.)`
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 4. SYNERGY / BALANCED EFFECTS (Mid Cost or Low Cost + Low/Normal Power)
  // Drives archetypes: Discard, Destroy, On Reveal, Ongoing
  // --------------------------------------------------------------------------
  SYNERGY: {
    ON_REVEAL: [
      {
        effectId: 'SYN_DISCARD_ONE_FOR_BUFF',
        minP: 3, maxP: 4,
        text: (p) => `On Reveal: Discard a random card from your hand to gain +${p} Power.`
      },
      {
        effectId: 'SYN_DESTROY_ONE_FOR_BUFF',
        minP: 3, maxP: 5,
        text: (p) => `On Reveal: Destroy another friendly card here to gain +${p} Power and +1 Energy next turn.`
      },
      {
        effectId: 'SYN_BUFF_ALLIES_HERE',
        minP: 1, maxP: 2,
        text: (p) => `On Reveal: Give all other friendly cards here +${p} Power.`
      },
      {
        effectId: 'SYN_GAIN_ENERGY_NEXT_TURN',
        minP: 1, maxP: 2,
        text: (p) => `On Reveal: You get +${p} Energy next turn.`
      },
      {
        effectId: 'SYN_BUFF_HAND',
        minP: 2, maxP: 3,
        text: (p) => `On Reveal: Give all cards in your hand +${p} Power.`
      },
      {
        effectId: 'SYN_DRAW_AND_BUFF',
        minP: 1, maxP: 2,
        text: (p) => `On Reveal: Draw 1 card and give it +${p} Power.`
      }
    ],
    ONGOING: [
      {
        effectId: 'ONGOING_SYN_ALLY_HERE_BUFF',
        minP: 1, maxP: 2,
        text: (p) => `Ongoing: Your other cards here have +${p} Power.`
      },
      {
        effectId: 'ONGOING_SYN_PER_CARD_HERE',
        minP: 1, maxP: 2,
        text: (p) => `Ongoing: +${p} Power for each other card you have here.`
      },
      {
        effectId: 'ONGOING_SYN_ARMOR_LANE',
        minP: 2, maxP: 2,
        text: (p) => `Ongoing: Friendly cards here have +${p} Power if you are winning this location.`
      }
    ],
    WHEN_DISCARDED: [
      {
        effectId: 'SYN_DISCARD_RETURN_BUFFED',
        minP: 3, maxP: 5,
        text: (p) => `When Discarded: Return this card to your hand with +${p} Power and -1 Cost.`
      },
      {
        effectId: 'SYN_DISCARD_SUMMON_SELF',
        minP: 2, maxP: 4,
        text: (p) => `When Discarded: Summon this card at a random location with +${p} Power.`
      },
      {
        effectId: 'SYN_DISCARD_BUFF_BOARD',
        minP: 2, maxP: 3,
        text: (p) => `When Discarded: Give all friendly cards in play +${p} Power.`
      }
    ],
    WHEN_DESTROYED: [
      {
        effectId: 'SYN_DESTROY_REBORN_OTHER_LOC',
        minP: 3, maxP: 5,
        text: (p) => `When Destroyed: Regenerate this card at another random location with +${p} Power.`
      },
      {
        effectId: 'SYN_DESTROY_RETURN_ZERO_COST',
        minP: 4, maxP: 6,
        text: (p) => `When Destroyed: Return this to your hand with Cost 0 and +${p} Power.`
      },
      {
        effectId: 'SYN_DESTROY_ENERGY_AND_BUFF',
        minP: 2, maxP: 3,
        text: (p) => `When Destroyed: Give all friendly cards here +${p} Power and gain +1 Energy next turn.`
      }
    ]
  }
};

// ============================================================================
// DETERMINE BALANCE TIER FROM COST (0..6) AND POWER (0..12)
// ============================================================================

function classifyCardTier(cost, power) {
  // Rule 1: High cost (4-6) with low power (0-4) => POWERFUL
  if (cost >= 4 && power <= 4) {
    return 'POWERFUL';
  }
  // Rule 2: High cost (4-6) with high power (8-12) => WEAK
  if (cost >= 4 && power >= 8) {
    return 'WEAK';
  }
  // Rule 3: Low cost (0-2) with high power (5-12) => NEGATIVE
  if (cost <= 2 && power >= 5) {
    return 'NEGATIVE';
  }
  // Additional boundary handling for Cost 3 or Cost 4-6 mid power (5-7):
  if (cost >= 4 && power <= 6) {
    return 'POWERFUL';
  }
  if (cost >= 4 && power === 7) {
    return 'WEAK';
  }
  if (cost === 3 && power >= 7) {
    return 'NEGATIVE';
  }
  if (cost === 3 && power <= 1) {
    return 'POWERFUL';
  }
  return 'SYNERGY';
}

// ============================================================================
// GENERATE A SINGLE PROCEDURAL CARD FROM A SEED
// Optional hints allow deck generator to request an archetype or cost slot
// while encoding the exact properties into the canonical seed if needed.
// ============================================================================

function generateCardFromSeed(seedInput) {
  const cleanSeed = String(seedInput || SeededRNG.randomSeedString('CRD')).trim();
  const rng = new SeededRNG(`CARD-${cleanSeed}`);

  // Check if seed encodes explicit archetype profile prefix (still 100% deterministic from seed!)
  // Profile choices ensure wide variety across all rules:
  // 0: High Cost (4-6), Low Power (0-4) -> POWERFUL
  // 1: High Cost (4-6), High Power (8-12) -> WEAK
  // 2: Low Cost (0-2), High Power (5-12) -> NEGATIVE
  // 3: Low/Mid Cost (0-3), Normal Power (0-4) -> SYNERGY (On Reveal / Ongoing / Discard / Destroy)
  let profile = rng.int(0, 3);
  if (cleanSeed.startsWith('P-')) profile = 0;
  else if (cleanSeed.startsWith('W-')) profile = 1;
  else if (cleanSeed.startsWith('N-')) profile = 2;
  else if (cleanSeed.startsWith('S-')) profile = 3;

  let cost, power;
  if (profile === 0) {
    cost = rng.int(4, 6);
    power = rng.int(0, 4);
  } else if (profile === 1) {
    cost = rng.int(4, 6);
    power = rng.int(8, 12);
  } else if (profile === 2) {
    cost = rng.int(0, 2);
    power = rng.int(5, 12);
  } else {
    cost = rng.int(0, 3);
    power = rng.int(0, 4);
  }

  const tier = classifyCardTier(cost, power);

  // Choose trigger type
  let triggerWeights;
  if (tier === 'NEGATIVE') {
    // Low cost + high power mostly uses ON_REVEAL and ONGOING so the drawback triggers on play
    triggerWeights = [
      { weight: 55, value: 'ON_REVEAL' },
      { weight: 35, value: 'ONGOING' },
      { weight: 5,  value: 'WHEN_DESTROYED' },
      { weight: 5,  value: 'WHEN_DISCARDED' }
    ];
  } else if (tier === 'SYNERGY') {
    triggerWeights = [
      { weight: 35, value: 'ON_REVEAL' },
      { weight: 25, value: 'ONGOING' },
      { weight: 20, value: 'WHEN_DISCARDED' },
      { weight: 20, value: 'WHEN_DESTROYED' }
    ];
  } else {
    triggerWeights = [
      { weight: 40, value: 'ON_REVEAL' },
      { weight: 30, value: 'ONGOING' },
      { weight: 15, value: 'WHEN_DISCARDED' },
      { weight: 15, value: 'WHEN_DESTROYED' }
    ];
  }

  // Allow seed prefix override for trigger to guarantee all 4 triggers in decks
  let trigger = rng.weightedPick(triggerWeights);
  if (cleanSeed.includes('-REV-')) trigger = 'ON_REVEAL';
  else if (cleanSeed.includes('-ONG-')) trigger = 'ONGOING';
  else if (cleanSeed.includes('-DSC-')) trigger = 'WHEN_DISCARDED';
  else if (cleanSeed.includes('-DST-')) trigger = 'WHEN_DESTROYED';

  const templates = EFFECT_POOL[tier][trigger] || EFFECT_POOL[tier].ON_REVEAL;
  const chosenTemplate = rng.pick(templates);

  // Scale parameter based on cost/power extremity
  let param = rng.int(chosenTemplate.minP, chosenTemplate.maxP);
  if (tier === 'POWERFUL' && cost === 6 && power <= 1) {
    param = chosenTemplate.maxP;
  } else if (tier === 'NEGATIVE' && power >= 10 && cost <= 1) {
    param = chosenTemplate.maxP;
  }

  // Generate unique procedural name
  const prefix = rng.pick(NAME_PREFIXES);
  const core = rng.pick(NAME_CORES);
  const useSuffix = rng.next() > 0.55;
  const suffix = useSuffix ? ' ' + rng.pick(NAME_SUFFIXES) : '';
  const name = `${prefix} ${core}${suffix}`;

  return {
    seed: cleanSeed,
    name,
    cost,
    power,
    currentPower: power,
    baseCost: cost,
    basePower: power,
    tier,
    trigger,
    effectId: chosenTemplate.effectId,
    effectParam: param,
    effectText: chosenTemplate.text(param)
  };
}

// ============================================================================
// GENERATE A 12-CARD DECK FROM A DECK SEED OR CARD SEED LIST
// Ensures all 4 triggers and all 3 cost/power tiers are represented
// ============================================================================

function generateDeckFromSeed(deckSeedInput, explicitCardSeeds = null, customName = null) {
  const deckSeed = String(deckSeedInput || SeededRNG.randomSeedString('DK')).trim();
  const rng = new SeededRNG(`DECK-${deckSeed}`);

  let cardSeeds = [];
  if (Array.isArray(explicitCardSeeds) && explicitCardSeeds.length === 12) {
    cardSeeds = explicitCardSeeds.map(s => String(s).trim());
  } else {
    // Construct 12 deterministic card seeds derived from deckSeed that guarantee:
    // - 3 High Cost + Low Power (POWERFUL effects)
    // - 2 High Cost + High Power (WEAK effects)
    // - 3 Low Cost + High Power (NEGATIVE effects - includes discard/destroy enablers!)
    // - 4 Synergy / Enabler cards covering ON_REVEAL, ONGOING, WHEN_DISCARDED, WHEN_DESTROYED
    const blueprint = [
      'P-REV', // High cost, low power, On Reveal
      'P-ONG', // High cost, low power, Ongoing
      'P-ANY', // High cost, low power, any trigger
      'W-REV', // High cost, high power, weak effect
      'W-ONG', // High cost, high power, weak effect
      'N-REV', // Low cost, high power, negative On Reveal (often discards or destroys!)
      'N-ONG', // Low cost, high power, negative Ongoing
      'N-ANY', // Low cost, high power, negative effect
      'S-DSC', // Synergy When Discarded card
      'S-DST', // Synergy When Destroyed card
      'S-REV', // Synergy On Reveal (discard/destroy enabler or buff)
      'S-ONG'  // Synergy Ongoing
    ];
    const shuffledBlueprint = rng.shuffle(blueprint);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 12; i++) {
      let token = '';
      for (let k = 0; k < 5; k++) {
        token += chars[rng.int(0, chars.length - 1)];
      }
      cardSeeds.push(`${shuffledBlueprint[i]}-${token}`);
    }
  }

  const cards = cardSeeds.map((cSeed, idx) => {
    const card = generateCardFromSeed(cSeed);
    card.instanceId = `${deckSeed}_c${idx}_${Math.random().toString(36).slice(2, 7)}`;
    return card;
  });

  // Procedural Deck Title if not provided
  const adj = rng.pick(NAME_PREFIXES);
  const noun = rng.pick(['Legion', 'Covenant', 'Syndicate', 'Protocol', 'Vanguard', 'Nexus', 'Armada', 'Dominion']);

  return {
    name: customName || `${adj} ${noun}`,
    deckSeed,
    cardSeeds,
    cards
  };
}

// ============================================================================
// PROCEDURAL LOCATION GENERATOR
// Revealed slowly on Turn 1 (Left), Turn 2 (Center), Turn 3 (Right)
// ============================================================================

const LOC_PREFIXES = [
  'Citadel of', 'Nexus of', 'Shattered', 'Astral', 'Chronos', 'Obsidian', 'Collapsed',
  'Luminous', 'Crimson', 'Quantum', 'Forbidden', 'Celestial', 'Molten', 'Infinite'
];

const LOC_NOUNS = [
  'Eternity', 'Spire', 'Sanctuary', 'Foundry', 'Abyss', 'Vortex', 'Reactor',
  'Crucible', 'Monolith', 'Observatory', 'Vault', 'Catacombs', 'Horizon', 'Altar'
];

const LOCATION_TEMPLATES = [
  {
    effectId: 'LOC_ONGOING_ALL_PLUS',
    locTrigger: 'ONGOING',
    minP: 2, maxP: 3,
    text: (p) => `Cards here have +${p} Power.`
  },
  {
    effectId: 'LOC_ONGOING_ALL_MINUS',
    locTrigger: 'ONGOING',
    minP: 1, maxP: 2,
    text: (p) => `Cards here have -${p} Power.`
  },
  {
    effectId: 'LOC_REVEAL_BOTH_DRAW_BUFF',
    locTrigger: 'ON_REVEAL',
    minP: 1, maxP: 2,
    text: (p) => `When Revealed: Both players draw a card and give it +${p} Power.`
  },
  {
    effectId: 'LOC_REVEAL_BONUS_ENERGY',
    locTrigger: 'ON_REVEAL',
    minP: 1, maxP: 2,
    text: (p) => `When Revealed: Both players get +${p} Energy next turn.`
  },
  {
    effectId: 'LOC_ON_PLAY_BUFF',
    locTrigger: 'ON_PLAY',
    minP: 2, maxP: 3,
    text: (p) => `After you play a card here, give it +${p} Power.`
  },
  {
    effectId: 'LOC_ON_PLAY_DISCARD_FOR_POWER',
    locTrigger: 'ON_PLAY',
    minP: 3, maxP: 4,
    text: (p) => `After you play a card here, discard a card from your hand to give the played card +${p} Power.`
  },
  {
    effectId: 'LOC_END_TURN_BUFF_RANDOM',
    locTrigger: 'END_OF_TURN',
    minP: 1, maxP: 2,
    text: (p) => `At the end of each turn, give a random card here +${p} Power for each player.`
  },
  {
    effectId: 'LOC_TURN4_DESTROY_LOWEST',
    locTrigger: 'END_OF_TURN',
    minP: 4, maxP: 4,
    text: () => `At the end of Turn 4, destroy the lowest-Power card on each side here.`
  },
  {
    effectId: 'LOC_ONGOING_DOUBLE_HIGH_COST',
    locTrigger: 'ONGOING',
    minP: 3, maxP: 4,
    text: (p) => `Cards here that cost 4 or more have +${p} Power.`
  },
  {
    effectId: 'LOC_ONGOING_LOW_COST_BUFF',
    locTrigger: 'ONGOING',
    minP: 2, maxP: 3,
    text: (p) => `Cards here that cost 2 or less have +${p} Power.`
  },
  {
    effectId: 'LOC_REVEAL_SUMMON_CONSTRUCT',
    locTrigger: 'ON_REVEAL',
    minP: 2, maxP: 4,
    text: (p) => `When Revealed: Summon a ${p}-Power Rift Construct on each side here.`
  }
];

function generateLocationFromSeed(seedInput, laneIndex = 0) {
  const cleanSeed = String(seedInput || SeededRNG.randomSeedString('LOC')).trim();
  const rng = new SeededRNG(`LOCATION-${cleanSeed}-${laneIndex}`);

  const prefix = rng.pick(LOC_PREFIXES);
  const noun = rng.pick(LOC_NOUNS);
  const name = `${prefix} ${noun}`;

  const tpl = rng.pick(LOCATION_TEMPLATES);
  const param = rng.int(tpl.minP, tpl.maxP);

  return {
    seed: cleanSeed,
    laneIndex,
    revealTurn: laneIndex + 1, // Turn 1, Turn 2, Turn 3
    revealed: false,
    name,
    locTrigger: tpl.locTrigger,
    effectId: tpl.effectId,
    effectParam: param,
    effectText: tpl.text(param),
    playerCards: [],
    cpuCards: [],
    playerTotalPower: 0,
    cpuTotalPower: 0,
    playerBonusPower: 0,
    cpuBonusPower: 0
  };
}


// ============================================================================
// PROCEDURAL WEB AUDIO SYNTHESIZER & SOUNDTRACK ENGINE
// Distinct multi-layered compositions for:
// 1. MENU_MUSIC        - Cosmic Synthwave Arpeggio & Warm Pad
// 2. PAUSE_MUSIC       - Lo-Fi Submerged Ambient Chimes & Rhodes Chords
// 3. END_GAME_MUSIC    - Grand Orchestral/Synth Fanfare & Resolution Theme
// 4. HIGH_SCORE_MUSIC  - Upbeat Retro-Arcade Chiptune Celebration
// 5. BATTLE_MUSIC      - Tactical Pulse Underscore during active turns
// ============================================================================

class GameEngine {
  constructor(options = {}) {
    this.audio = options.audio || null;
    this.onStateUpdate = options.onStateUpdate || (() => {});
    this.onVisualEvent = options.onVisualEvent || (() => {});
    this.resetMatch(options);
  }

  resetMatch(options = {}) {
    this.matchSeed = options.matchSeed || SeededRNG.randomSeedString('MATCH');
    this.rng = new SeededRNG(this.matchSeed);

    // Build Player and CPU Decks (either imported or procedurally generated)
    const pDeckSpec = options.playerDeckSpec || null;
    const cDeckSpec = options.cpuDeckSpec || null;

    this.playerDeckSource = pDeckSpec
      ? generateDeckFromSeed(pDeckSpec.deckSeed, pDeckSpec.cardSeeds, pDeckSpec.name)
      : generateDeckFromSeed(SeededRNG.randomSeedString('PLR'));

    this.cpuDeckSource = cDeckSpec
      ? generateDeckFromSeed(cDeckSpec.deckSeed, cDeckSpec.cardSeeds, cDeckSpec.name)
      : generateDeckFromSeed(SeededRNG.randomSeedString('CPU'));

    // Initialize Player & CPU states
    this.turn = 0;
    this.maxTurns = 6;
    this.phase = 'IDLE'; // 'STAGING', 'RESOLVING', 'GAME_OVER'

    this.player = this._createCombatantState('PLAYER', this.playerDeckSource);
    this.cpu = this._createCombatantState('CPU', this.cpuDeckSource);

    // Generate 3 procedural locations (revealed on Turns 1, 2, 3)
    this.locations = [0, 1, 2].map((laneIdx) =>
      generateLocationFromSeed(`${this.matchSeed}-L${laneIdx + 1}`, laneIdx)
    );

    // Staging queue for current turn plays before End Turn is clicked
    this.stagedPlayerPlays = []; // [{ card, laneIndex }]

    // Full Game Log
    this.logs = [];
    this.matchStartTime = new Date().toISOString();
    this.result = null;

    this.logEvent('SYSTEM', `=== MATCH INITIALIZED (Seed: ${this.matchSeed}) ===`);
    this.logEvent('SYSTEM', `Player Deck: "${this.playerDeckSource.name}" (Seed: ${this.playerDeckSource.deckSeed})`);
    this.logEvent('SYSTEM', `CPU Deck: "${this.cpuDeckSource.name}" (Seed: ${this.cpuDeckSource.deckSeed})`);

    // Draw initial 3-card opening hands
    for (let i = 0; i < 3; i++) {
      this._drawCard('PLAYER', true);
      this._drawCard('CPU', true);
    }

    // Start Turn 1
    this.startNextTurn();
  }

  _createCombatantState(side, deckObj) {
    const clonedCards = deckObj.cards.map((c, i) => ({
      ...c,
      owner: side,
      uid: `${side}_${i}_${c.seed}`,
      permPowerMod: 0,
      ongoingPowerMod: 0,
      currentPower: c.power
    }));

    const shuffled = this.rng.shuffle(clonedCards);
    return {
      side,
      deckName: deckObj.name,
      deckSeed: deckObj.deckSeed,
      shareCode: encodeDeckShareCode(deckObj),
      drawPile: shuffled,
      hand: [],
      discardPile: [],
      destroyedPile: [],
      energy: 0,
      bonusEnergyNextTurn: 0,
      discardCount: 0,
      destroyCount: 0
    };
  }

  // ==========================================================================
  // LOGGING & EXPORT
  // ==========================================================================

  logEvent(category, message, details = null) {
    const entry = {
      id: this.logs.length + 1,
      turn: this.turn,
      timestamp: new Date().toLocaleTimeString(),
      category,
      message,
      details
    };
    this.logs.push(entry);
  }

  exportReadableLog() {
    const lines = [
      `====================================================================`,
      `AETHER SNAP: PROCEDURAL SVG CARD GAME - OFFICIAL MATCH LOG`,
      `====================================================================`,
      `Match Seed   : ${this.matchSeed}`,
      `Played At    : ${this.matchStartTime}`,
      `Player Deck  : ${this.player.deckName} (Seed: ${this.player.deckSeed})`,
      `Player Code  : ${this.player.shareCode}`,
      `CPU Deck     : ${this.cpu.deckName} (Seed: ${this.cpu.deckSeed})`,
      `CPU Code     : ${this.cpu.shareCode}`,
      `Locations    :`,
      ...this.locations.map((loc, idx) =>
        `  [Lane ${idx + 1}] ${loc.name} (Seed: ${loc.seed}) - ${loc.effectText} | Final Power: Player ${loc.playerTotalPower} vs CPU ${loc.cpuTotalPower}`
      ),
      `--------------------------------------------------------------------`
    ];

    if (this.result) {
      lines.push(
        `FINAL RESULT : ${this.result.outcome} (${this.result.reason})`,
        `Locations Won: Player ${this.result.playerLanesWon} - CPU ${this.result.cpuLanesWon}`,
        `Total Power  : Player ${this.result.playerTotalPower} - CPU ${this.result.cpuTotalPower}`,
        `Match Score  : ${this.result.score}`,
        `--------------------------------------------------------------------`
      );
    }

    lines.push(`CHRONOLOGICAL TURN EVENTS:`);
    for (const item of this.logs) {
      const turnTag = item.turn > 0 ? `[T${item.turn}]` : `[INIT]`;
      lines.push(`${turnTag} [${item.category}] ${item.message}`);
    }
    lines.push(`====================================================================`);
    return lines.join('\n');
  }

  exportJsonLog() {
    return JSON.stringify({
      matchSeed: this.matchSeed,
      matchStartTime: this.matchStartTime,
      playerDeck: {
        name: this.player.deckName,
        deckSeed: this.player.deckSeed,
        shareCode: this.player.shareCode
      },
      cpuDeck: {
        name: this.cpu.deckName,
        deckSeed: this.cpu.deckSeed,
        shareCode: this.cpu.shareCode
      },
      locations: this.locations.map(l => ({
        name: l.name,
        seed: l.seed,
        effectText: l.effectText,
        playerTotalPower: l.playerTotalPower,
        cpuTotalPower: l.cpuTotalPower
      })),
      result: this.result,
      logs: this.logs
    }, null, 2);
  }

  // ==========================================================================
  // TURN FLOW (Turns 1 to 6)
  // ==========================================================================

  startNextTurn() {
    if (this.turn >= this.maxTurns) {
      this.finishGame();
      return;
    }

    this.turn += 1;
    this.phase = 'STAGING';
    this.stagedPlayerPlays = [];

    this.logEvent('TURN', `--- TURN ${this.turn} OF ${this.maxTurns} BEGINS ---`);

    // 1. Slowly reveal location for Turns 1, 2, 3
    if (this.turn >= 1 && this.turn <= 3) {
      const loc = this.locations[this.turn - 1];
      loc.revealed = true;
      if (this.audio) this.audio.playSfx('location_reveal');
      this.logEvent('LOCATION', `Location ${this.turn} Revealed: [${loc.name}] (Seed: ${loc.seed}) — "${loc.effectText}"`);
      this.onVisualEvent({ type: 'LOCATION_REVEAL', laneIndex: this.turn - 1, location: loc });
      this._executeLocationOnReveal(loc);
    }

    // 2. Grant Energy (Base = Turn number + any bonus energy from cards/locations)
    this.player.energy = this.turn + this.player.bonusEnergyNextTurn;
    this.player.bonusEnergyNextTurn = 0;

    this.cpu.energy = this.turn + this.cpu.bonusEnergyNextTurn;
    this.cpu.bonusEnergyNextTurn = 0;

    // 3. Both players draw 1 card
    this._drawCard('PLAYER');
    this._drawCard('CPU');

    this.recalculateBoardState();
    this.onStateUpdate();
  }

  _drawCard(side, silent = false) {
    const actor = side === 'PLAYER' ? this.player : this.cpu;
    if (actor.hand.length >= 7) {
      if (!silent) this.logEvent('DRAW', `${side} hand is full (7 cards); could not draw.`);
      return null;
    }
    if (actor.drawPile.length === 0) {
      return null;
    }
    const card = actor.drawPile.shift();
    actor.hand.push(card);
    if (!silent) {
      this.logEvent('DRAW', `${side} drew [${card.name}] (Cost ${card.cost}, Power ${card.currentPower}, Seed: ${card.seed}).`);
    }
    return card;
  }

  // ==========================================================================
  // PLAYER STAGING INTERACTIONS
  // ==========================================================================

  stageCardPlay(cardUid, laneIndex) {
    if (this.phase !== 'STAGING') return { ok: false, reason: 'Cannot play cards right now.' };
    const loc = this.locations[laneIndex];
    if (!loc) return { ok: false, reason: 'Invalid location.' };

    // Count existing + staged cards in this lane
    const stagedInLane = this.stagedPlayerPlays.filter(p => p.laneIndex === laneIndex).length;
    if (loc.playerCards.length + stagedInLane >= 4) {
      return { ok: false, reason: 'Location is full (max 4 cards per side).' };
    }

    const handIdx = this.player.hand.findIndex(c => c.uid === cardUid);
    if (handIdx === -1) return { ok: false, reason: 'Card not in hand.' };

    const card = this.player.hand[handIdx];
    if (card.cost > this.player.energy) {
      return { ok: false, reason: `Not enough Energy! Need ${card.cost}, have ${this.player.energy}.` };
    }

    // Move from hand to staged
    this.player.hand.splice(handIdx, 1);
    this.player.energy -= card.cost;
    this.stagedPlayerPlays.push({ card, laneIndex });

    if (this.audio) this.audio.playSfx('card_play');
    this.onStateUpdate();
    return { ok: true };
  }

  unstageCardPlay(cardUid) {
    if (this.phase !== 'STAGING') return false;
    const idx = this.stagedPlayerPlays.findIndex(p => p.card.uid === cardUid);
    if (idx === -1) return false;

    const { card } = this.stagedPlayerPlays[idx];
    this.stagedPlayerPlays.splice(idx, 1);
    this.player.energy += card.cost;
    this.player.hand.push(card);

    if (this.audio) this.audio.playSfx('click');
    this.onStateUpdate();
    return true;
  }

  undoAllStagedPlays() {
    if (this.phase !== 'STAGING') return;
    while (this.stagedPlayerPlays.length > 0) {
      const { card } = this.stagedPlayerPlays.pop();
      this.player.energy += card.cost;
      this.player.hand.push(card);
    }
    if (this.audio) this.audio.playSfx('click');
    this.onStateUpdate();
  }

  // ==========================================================================
  // CPU TACTICAL DECISION ENGINE
  // ==========================================================================

  _planCpuPlays() {
    const plays = [];
    const availableCards = [...this.cpu.hand];
    let remainingEnergy = this.cpu.energy;

    // Sort cards by heuristic value (prefer synergy or high value plays that fit energy)
    availableCards.sort((a, b) => {
      const scoreA = this._evaluateCardHeuristic(a);
      const scoreB = this._evaluateCardHeuristic(b);
      return scoreB - scoreA;
    });

    const laneCounts = this.locations.map(l => l.cpuCards.length);

    for (const card of availableCards) {
      // Avoid playing cards whose only role is WHEN_DISCARDED unless turn 5-6 and extra energy
      if (card.trigger === 'WHEN_DISCARDED' && this.turn < 5 && availableCards.length > 2) {
        continue;
      }
      if (card.cost <= remainingEnergy) {
        // Choose best lane with < 4 cards
        const candidateLanes = [0, 1, 2].filter(idx => laneCounts[idx] < 4);
        if (candidateLanes.length === 0) break;

        const chosenLane = this._pickBestLaneForCpuCard(card, candidateLanes);
        // Remove from CPU hand
        const realIdx = this.cpu.hand.findIndex(c => c.uid === card.uid);
        if (realIdx !== -1) {
          this.cpu.hand.splice(realIdx, 1);
          remainingEnergy -= card.cost;
          this.cpu.energy = remainingEnergy;
          laneCounts[chosenLane]++;
          plays.push({ card, laneIndex: chosenLane });
        }
      }
    }
    return plays;
  }

  _evaluateCardHeuristic(card) {
    let val = card.currentPower + card.cost * 1.2;
    if (card.tier === 'POWERFUL') val += 5;
    if (card.effectId.includes('DESTROY') && card.tier === 'NEGATIVE') {
      // Check if CPU has a WHEN_DESTROYED card in play
      const hasDestroyFodder = this.locations.some(l => l.cpuCards.some(c => c.trigger === 'WHEN_DESTROYED'));
      val += hasDestroyFodder ? 5 : -2;
    }
    if (card.effectId.includes('DISCARD')) {
      const hasDiscardTarget = this.cpu.hand.some(c => c.trigger === 'WHEN_DISCARDED' && c.uid !== card.uid);
      val += hasDiscardTarget ? 6 : 0;
    }
    return val;
  }

  _pickBestLaneForCpuCard(card, candidateLanes) {
    // Score each lane
    let bestLane = candidateLanes[0];
    let bestScore = -999;

    for (const laneIdx of candidateLanes) {
      const loc = this.locations[laneIdx];
      let score = this.rng.range(0, 2);

      const diff = loc.cpuTotalPower - loc.playerTotalPower;
      // Contest close lanes
      if (diff >= -8 && diff <= 4) score += 5;
      // Avoid overcommitting if already winning by 14+
      if (diff > 14) score -= 4;

      // Synergy with card effect
      if (card.effectId === 'DESTROY_HIGHEST_ENEMY_HERE' && loc.playerCards.length > 0) {
        score += 8;
      }
      if (card.effectId === 'NEG_DESTROY_FRIENDLY_HERE' || card.effectId === 'SYN_DESTROY_ONE_FOR_BUFF') {
        const hasDestroyable = loc.cpuCards.some(c => c.trigger === 'WHEN_DESTROYED');
        if (hasDestroyable) score += 9;
        else if (loc.cpuCards.length === 0) score += 4; // No friendly card to destroy!
        else score -= 4;
      }
      if (card.effectId === 'NEG_SELF_DECAY_IF_ALONE') {
        if (loc.cpuCards.length > 0) score += 6;
        else score -= 6;
      }

      if (score > bestScore) {
        bestScore = score;
        bestLane = laneIdx;
      }
    }
    return bestLane;
  }

  // ==========================================================================
  // TURN RESOLUTION & INITIATIVE
  // ==========================================================================

  async commitTurn() {
    if (this.phase !== 'STAGING') return;
    this.phase = 'RESOLVING';

    const playerPlays = [...this.stagedPlayerPlays];
    this.stagedPlayerPlays = [];
    const cpuPlays = this._planCpuPlays();

    // Determine who reveals first (Initiative: winning more locations, or higher total power)
    const playerFirst = this._doesPlayerHaveInitiative();
    this.logEvent('TURN', `Initiative: ${playerFirst ? 'PLAYER' : 'CPU'} reveals first.`);

    const firstQueue = playerFirst
      ? playerPlays.map(p => ({ ...p, side: 'PLAYER' }))
      : cpuPlays.map(p => ({ ...p, side: 'CPU' }));
    const secondQueue = playerFirst
      ? cpuPlays.map(p => ({ ...p, side: 'CPU' }))
      : playerPlays.map(p => ({ ...p, side: 'PLAYER' }));

    const allPlays = [...firstQueue, ...secondQueue];

    // Place cards on board in unrevealed state first so user sees them flip
    for (const play of allPlays) {
      play.card.isFaceDown = true;
      const loc = this.locations[play.laneIndex];
      const list = play.side === 'PLAYER' ? loc.playerCards : loc.cpuCards;
      list.push(play.card);
    }
    this.onStateUpdate();

    // Sequentially reveal each card and trigger effects
    for (const play of allPlays) {
      await this._delay(380);
      play.card.isFaceDown = false;
      if (this.audio) this.audio.playSfx('card_reveal');

      const loc = this.locations[play.laneIndex];
      this.logEvent(
        'PLAY',
        `${play.side} revealed [${play.card.name}] (Cost ${play.card.cost}, Base Power ${play.card.power}, Tier: ${play.card.tier}) at [${loc.name}].`
      );
      this.onVisualEvent({ type: 'CARD_REVEAL', card: play.card, laneIndex: play.laneIndex, side: play.side });

      // 1. Trigger Card's ON_REVEAL effect (plus negative secondary reveal effects)
      this._executeCardOnReveal(play.card, play.side, play.laneIndex);

      // 2. If location is revealed and has an ON_PLAY effect, trigger it
      if (loc.revealed && loc.locTrigger === 'ON_PLAY') {
        this._executeLocationOnPlay(loc, play.card, play.side);
      }

      this.recalculateBoardState();
      this.onStateUpdate();
    }

    // 3. End-of-Turn Location Effects
    for (const loc of this.locations) {
      if (loc.revealed && loc.locTrigger === 'END_OF_TURN') {
        await this._delay(250);
        this._executeLocationEndOfTurn(loc);
        this.recalculateBoardState();
        this.onStateUpdate();
      }
    }

    // Log End-of-Turn Power Summary
    const summaryStr = this.locations
      .map((l, i) => `L${i + 1} (${l.revealed ? l.name : 'Unrevealed'}): P ${l.playerTotalPower} vs CPU ${l.cpuTotalPower}`)
      .join(' | ');
    this.logEvent('SUMMARY', `End of Turn ${this.turn} Scores -> ${summaryStr}`);

    await this._delay(350);
    this.startNextTurn();
  }

  _doesPlayerHaveInitiative() {
    let pWon = 0, cWon = 0, pTot = 0, cTot = 0;
    for (const loc of this.locations) {
      pTot += loc.playerTotalPower;
      cTot += loc.cpuTotalPower;
      if (loc.playerTotalPower > loc.cpuTotalPower) pWon++;
      else if (loc.cpuTotalPower > loc.playerTotalPower) cWon++;
    }
    if (pWon !== cWon) return pWon > cWon;
    if (pTot !== cTot) return pTot > cTot;
    return this.rng.next() >= 0.5;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // CARD EFFECT EXECUTION: ON REVEAL
  // ==========================================================================

  _executeCardOnReveal(card, side, laneIndex) {
    const actor = side === 'PLAYER' ? this.player : this.cpu;
    const loc = this.locations[laneIndex];
    const friendlyHere = side === 'PLAYER' ? loc.playerCards : loc.cpuCards;
    const enemyHere = side === 'PLAYER' ? loc.cpuCards : loc.playerCards;
    const p = card.effectParam;

    // Handle hybrid negative When-Discarded / When-Destroyed cards that also have a small On-Reveal penalty
    if (card.effectId === 'NEG_DISCARD_DEBUFF_HAND' || card.effectId === 'NEG_DESTROY_BUFF_ENEMY') {
      card.permPowerMod -= 2;
      this.logEvent('ON_REVEAL', `[${card.name}] unstable core caused it to lose 2 Power on reveal.`);
      return;
    }

    if (card.trigger !== 'ON_REVEAL') return;

    switch (card.effectId) {
      // --- POWERFUL ON REVEAL ---
      case 'BUFF_ALL_FRIENDLY_ALL_LOCS': {
        let count = 0;
        for (const l of this.locations) {
          const list = side === 'PLAYER' ? l.playerCards : l.cpuCards;
          for (const ally of list) {
            if (ally.uid !== card.uid && !ally.isFaceDown) {
              ally.permPowerMod += p;
              count++;
            }
          }
        }
        if (this.audio && count > 0) this.audio.playSfx('buff');
        this.logEvent('ON_REVEAL', `[${card.name}] gave +${p} Power to ${count} friendly card(s) across all locations!`);
        break;
      }

      case 'DESTROY_HIGHEST_ENEMY_HERE': {
        const revealedEnemies = enemyHere.filter(e => !e.isFaceDown);
        if (revealedEnemies.length > 0) {
          revealedEnemies.sort((a, b) => b.currentPower - a.currentPower);
          const target = revealedEnemies[0];
          this.logEvent('ON_REVEAL', `[${card.name}] targeted highest-Power enemy [${target.name}] (${target.currentPower} Power) for destruction!`);
          this._destroyCardOnBoard(target, side === 'PLAYER' ? 'CPU' : 'PLAYER', laneIndex, card.name);
        } else {
          this.logEvent('ON_REVEAL', `[${card.name}] found no revealed enemy cards here to destroy.`);
        }
        if (p >= 2) {
          card.permPowerMod += 3;
          this.logEvent('ON_REVEAL', `[${card.name}] gained +3 Power!`);
        }
        break;
      }

      case 'SUMMON_DRONES_OTHER_LOCS': {
        for (let i = 0; i < 3; i++) {
          if (i === laneIndex) continue;
          this._summonToken(side, i, {
            name: 'Astral Drone',
            cost: 1,
            power: p,
            effectText: 'Summoned Construct.'
          }, card.name);
        }
        break;
      }

      case 'DOUBLE_FRIENDLY_HERE': {
        for (const ally of friendlyHere) {
          if (ally.uid !== card.uid && !ally.isFaceDown) {
            ally.permPowerMod += p;
          }
        }
        const currentTotal = Math.max(1, card.basePower + card.permPowerMod);
        card.permPowerMod += currentTotal;
        if (this.audio) this.audio.playSfx('buff');
        this.logEvent('ON_REVEAL', `[${card.name}] buffed allies here by +${p} Power and doubled its own Power!`);
        break;
      }

      case 'DRAIN_ALL_ENEMIES_HERE': {
        let totalStolen = 0;
        for (const enemy of enemyHere) {
          if (!enemy.isFaceDown) {
            enemy.permPowerMod -= p;
            totalStolen += p;
          }
        }
        card.permPowerMod += totalStolen;
        if (this.audio && totalStolen > 0) this.audio.playSfx('buff');
        this.logEvent('ON_REVEAL', `[${card.name}] drained ${p} Power from each enemy here (gained +${totalStolen} Power)!`);
        break;
      }

      case 'DISCARD_HAND_GAIN_MASSIVE': {
        let discarded = 0;
        for (let i = 0; i < 2; i++) {
          if (actor.hand.length > 0) {
            this._discardRandomFromHand(side, card.name);
            discarded++;
          }
        }
        const gain = discarded * p;
        card.permPowerMod += gain;
        this.logEvent('ON_REVEAL', `[${card.name}] discarded ${discarded} card(s) and gained +${gain} Power!`);
        break;
      }

      case 'DESTROY_FRIENDLY_HERE_MASSIVE_BUFF': {
        const otherAllies = friendlyHere.filter(a => a.uid !== card.uid && !a.isFaceDown);
        if (otherAllies.length > 0) {
          const victim = this.rng.pick(otherAllies);
          this._destroyCardOnBoard(victim, side, laneIndex, card.name);
          const teamBuff = Math.max(3, Math.floor(p / 2));
          for (const l of this.locations) {
            const list = side === 'PLAYER' ? l.playerCards : l.cpuCards;
            for (const ally of list) {
              if (!ally.isFaceDown) ally.permPowerMod += teamBuff;
            }
          }
          card.permPowerMod += p;
          this.logEvent('ON_REVEAL', `[${card.name}] sacrificed [${victim.name}] to grant team +${teamBuff} Power and gain +${p} Power!`);
        } else {
          this.logEvent('ON_REVEAL', `[${card.name}] had no other friendly card here to sacrifice.`);
        }
        break;
      }

      // --- WEAK ON REVEAL ---
      case 'WEAK_SELF_TINY_BUFF': {
        const others = friendlyHere.filter(a => a.uid !== card.uid);
        if (others.length > 0) {
          card.permPowerMod += p;
          this.logEvent('ON_REVEAL', `[${card.name}] gained +${p} Power for having an ally here.`);
        }
        break;
      }

      case 'WEAK_BUFF_ONE_RANDOM_ALLY': {
        const others = friendlyHere.filter(a => a.uid !== card.uid && !a.isFaceDown);
        if (others.length > 0) {
          const target = this.rng.pick(others);
          target.permPowerMod += p;
          this.logEvent('ON_REVEAL', `[${card.name}] gave [${target.name}] +${p} Power.`);
        }
        break;
      }

      case 'WEAK_PING_ONE_ENEMY': {
        const targets = enemyHere.filter(e => !e.isFaceDown);
        if (targets.length > 0) {
          const target = this.rng.pick(targets);
          target.permPowerMod -= p;
          this.logEvent('ON_REVEAL', `[${card.name}] afflicted enemy [${target.name}] with -${p} Power.`);
        }
        break;
      }

      case 'WEAK_DRAW_IF_EMPTY': {
        if (actor.hand.length === 0) {
          card.permPowerMod += 1;
          this.logEvent('ON_REVEAL', `[${card.name}] gained +1 Power because ${side}'s hand was empty.`);
        }
        break;
      }

      // --- NEGATIVE ON REVEAL (Low Cost, High Power Drawbacks!) ---
      case 'NEG_DISCARD_RANDOM_CARD': {
        for (let i = 0; i < p; i++) {
          this._discardRandomFromHand(side, card.name);
        }
        break;
      }

      case 'NEG_DESTROY_FRIENDLY_HERE': {
        const others = friendlyHere.filter(a => a.uid !== card.uid);
        if (others.length > 0) {
          const victim = this.rng.pick(others);
          this.logEvent('ON_REVEAL', `[${card.name}] drawback triggered: destroying friendly [${victim.name}]!`);
          this._destroyCardOnBoard(victim, side, laneIndex, card.name);
        } else {
          this.logEvent('ON_REVEAL', `[${card.name}] drawback checked for friendly cards here, but none were present.`);
        }
        break;
      }

      case 'NEG_BUFF_ENEMIES_HERE': {
        for (const e of enemyHere) {
          e.permPowerMod += p;
        }
        this.logEvent('ON_REVEAL', `[${card.name}] drawback gave all enemy cards at [${loc.name}] +${p} Power.`);
        break;
      }

      case 'NEG_DEBUFF_ALLIES_HERE': {
        for (const a of friendlyHere) {
          if (a.uid !== card.uid) a.permPowerMod -= p;
        }
        this.logEvent('ON_REVEAL', `[${card.name}] drawback afflicted other friendly cards at [${loc.name}] with -${p} Power.`);
        break;
      }

      case 'NEG_SELF_DECAY_IF_ALONE': {
        const others = friendlyHere.filter(a => a.uid !== card.uid);
        if (others.length === 0) {
          card.permPowerMod -= p;
          this.logEvent('ON_REVEAL', `[${card.name}] had no allies at [${loc.name}] and lost ${p} Power!`);
        }
        break;
      }

      // --- SYNERGY ON REVEAL ---
      case 'SYN_DISCARD_ONE_FOR_BUFF': {
        const discardedCard = this._discardRandomFromHand(side, card.name);
        if (discardedCard) {
          card.permPowerMod += p;
          if (this.audio) this.audio.playSfx('buff');
          this.logEvent('ON_REVEAL', `[${card.name}] gained +${p} Power from discarding [${discardedCard.name}]!`);
        } else {
          this.logEvent('ON_REVEAL', `[${card.name}] had no cards in hand to discard.`);
        }
        break;
      }

      case 'SYN_DESTROY_ONE_FOR_BUFF': {
        const others = friendlyHere.filter(a => a.uid !== card.uid);
        if (others.length > 0) {
          const victim = this.rng.pick(others);
          this._destroyCardOnBoard(victim, side, laneIndex, card.name);
          card.permPowerMod += p;
          actor.bonusEnergyNextTurn += 1;
          this.logEvent('ON_REVEAL', `[${card.name}] destroyed [${victim.name}] to gain +${p} Power and +1 Energy next turn!`);
        } else {
          this.logEvent('ON_REVEAL', `[${card.name}] had no friendly card here to destroy.`);
        }
        break;
      }

      case 'SYN_BUFF_ALLIES_HERE': {
        for (const a of friendlyHere) {
          if (a.uid !== card.uid) a.permPowerMod += p;
        }
        if (this.audio) this.audio.playSfx('buff');
        this.logEvent('ON_REVEAL', `[${card.name}] gave all other friendly cards at [${loc.name}] +${p} Power.`);
        break;
      }

      case 'SYN_GAIN_ENERGY_NEXT_TURN': {
        actor.bonusEnergyNextTurn += p;
        this.logEvent('ON_REVEAL', `[${card.name}] granted ${side} +${p} Energy for next turn.`);
        break;
      }

      case 'SYN_BUFF_HAND': {
        for (const hc of actor.hand) {
          hc.permPowerMod += p;
          hc.currentPower = Math.max(0, hc.basePower + hc.permPowerMod);
        }
        if (this.audio && actor.hand.length > 0) this.audio.playSfx('buff');
        this.logEvent('ON_REVEAL', `[${card.name}] gave all ${actor.hand.length} card(s) in ${side}'s hand +${p} Power.`);
        break;
      }

      case 'SYN_DRAW_AND_BUFF': {
        const drawn = this._drawCard(side);
        if (drawn) {
          drawn.permPowerMod += p;
          drawn.currentPower = Math.max(0, drawn.basePower + drawn.permPowerMod);
          this.logEvent('ON_REVEAL', `[${card.name}] buffed drawn card [${drawn.name}] by +${p} Power.`);
        }
        break;
      }
    }
  }

  // ==========================================================================
  // DISCARD ENGINE & "WHEN DISCARDED" TRIGGERS
  // ==========================================================================

  _discardRandomFromHand(side, sourceName = 'Effect') {
    const actor = side === 'PLAYER' ? this.player : this.cpu;
    if (actor.hand.length === 0) return null;

    // Prefer discarding WHEN_DISCARDED cards if any exist in hand (smart synergy!)
    const discardSynergyCards = actor.hand.filter(c => c.trigger === 'WHEN_DISCARDED' && c.tier !== 'NEGATIVE');
    const target = discardSynergyCards.length > 0
      ? this.rng.pick(discardSynergyCards)
      : this.rng.pick(actor.hand);

    const idx = actor.hand.findIndex(c => c.uid === target.uid);
    if (idx !== -1) actor.hand.splice(idx, 1);

    actor.discardPile.push(target);
    actor.discardCount += 1;

    if (this.audio) this.audio.playSfx('discard');
    this.logEvent('DISCARD', `${side} discarded [${target.name}] (caused by ${sourceName}).`);
    this.onVisualEvent({ type: 'CARD_DISCARD', card: target, side });

    // Trigger WHEN_DISCARDED effect if applicable!
    if (target.trigger === 'WHEN_DISCARDED') {
      this._executeWhenDiscarded(target, side);
    }

    this.recalculateBoardState();
    return target;
  }

  _executeWhenDiscarded(card, side) {
    const actor = side === 'PLAYER' ? this.player : this.cpu;
    const p = card.effectParam;

    switch (card.effectId) {
      case 'DISCARD_SUMMON_SELF_BUFFED':
      case 'SYN_DISCARD_SUMMON_SELF': {
        const openLanes = [0, 1, 2].filter(i => {
          const list = side === 'PLAYER' ? this.locations[i].playerCards : this.locations[i].cpuCards;
          return list.length < 4;
        });
        if (openLanes.length > 0) {
          const laneIdx = this.rng.pick(openLanes);
          card.permPowerMod += p;
          card.isFaceDown = false;
          const list = side === 'PLAYER' ? this.locations[laneIdx].playerCards : this.locations[laneIdx].cpuCards;
          list.push(card);
          this.logEvent('WHEN_DISCARDED', `[${card.name}] triggered When Discarded: summoned itself to [${this.locations[laneIdx].name}] with +${p} Power!`);
        }
        break;
      }

      case 'DISCARD_GLOBAL_TEAM_BUFF': {
        for (const l of this.locations) {
          const list = side === 'PLAYER' ? l.playerCards : l.cpuCards;
          for (const c of list) c.permPowerMod += p;
        }
        for (const hc of actor.hand) {
          hc.permPowerMod += p;
          hc.currentPower = Math.max(0, hc.basePower + hc.permPowerMod);
        }
        if (actor.hand.length < 7) {
          card.cost = 1;
          actor.hand.push(card);
        }
        this.logEvent('WHEN_DISCARDED', `[${card.name}] triggered When Discarded: gave all friendly cards +${p} Power and returned to hand at Cost 1!`);
        break;
      }

      case 'DISCARD_WEAK_BUFF_RANDOM':
      case 'SYN_DISCARD_BUFF_BOARD': {
        for (const l of this.locations) {
          const list = side === 'PLAYER' ? l.playerCards : l.cpuCards;
          for (const c of list) c.permPowerMod += p;
        }
        this.logEvent('WHEN_DISCARDED', `[${card.name}] triggered When Discarded: gave friendly cards in play +${p} Power!`);
        break;
      }

      case 'SYN_DISCARD_RETURN_BUFFED': {
        card.permPowerMod += p;
        card.cost = Math.max(0, card.cost - 1);
        card.currentPower = Math.max(0, card.basePower + card.permPowerMod);
        if (actor.hand.length < 7) {
          actor.hand.push(card);
        }
        this.logEvent('WHEN_DISCARDED', `[${card.name}] triggered When Discarded: returned to ${side}'s hand with +${p} Power and Cost ${card.cost}!`);
        break;
      }

      case 'NEG_DISCARD_DEBUFF_HAND': {
        for (const hc of actor.hand) {
          hc.permPowerMod -= p;
          hc.currentPower = Math.max(0, hc.basePower + hc.permPowerMod);
        }
        this.logEvent('WHEN_DISCARDED', `[${card.name}] negative When Discarded triggered: afflicted all cards in ${side}'s hand with -${p} Power!`);
        break;
      }
    }
  }

  // ==========================================================================
  // DESTROY ENGINE & "WHEN DESTROYED" TRIGGERS
  // ==========================================================================

  _destroyCardOnBoard(card, side, laneIndex, sourceName = 'Effect') {
    const actor = side === 'PLAYER' ? this.player : this.cpu;
    const loc = this.locations[laneIndex];
    const list = side === 'PLAYER' ? loc.playerCards : loc.cpuCards;

    const idx = list.findIndex(c => c.uid === card.uid);
    if (idx === -1) return false;

    list.splice(idx, 1);
    actor.destroyedPile.push(card);
    actor.destroyCount += 1;

    if (this.audio) this.audio.playSfx('destroy');
    this.logEvent('DESTROY', `[${card.name}] (${side}) at [${loc.name}] was DESTROYED by ${sourceName}!`);
    this.onVisualEvent({ type: 'CARD_DESTROY', card, laneIndex, side });

    // Trigger WHEN_DESTROYED effect if applicable!
    if (card.trigger === 'WHEN_DESTROYED') {
      this._executeWhenDestroyed(card, side, laneIndex);
    }

    this.recalculateBoardState();
    return true;
  }

  _executeWhenDestroyed(card, side, laneIndex) {
    const actor = side === 'PLAYER' ? this.player : this.cpu;
    const loc = this.locations[laneIndex];
    const friendlyHere = side === 'PLAYER' ? loc.playerCards : loc.cpuCards;
    const enemyHere = side === 'PLAYER' ? loc.cpuCards : loc.playerCards;
    const p = card.effectParam;

    switch (card.effectId) {
      case 'DESTROY_RESPAWN_TWO_COPIES': {
        const otherLanes = [0, 1, 2].filter(i => i !== laneIndex);
        for (const oLane of otherLanes) {
          this._summonToken(side, oLane, {
            name: `${card.name} Reborn`,
            cost: card.cost,
            power: p,
            seed: card.seed,
            effectText: `Reborn from ${card.name}.`
          }, card.name);
        }
        this.logEvent('WHEN_DESTROYED', `[${card.name}] triggered When Destroyed: spawned ${p}-Power copies at other locations!`);
        break;
      }

      case 'DESTROY_WIPE_ENEMY_AND_BUFF': {
        const enemies = enemyHere.filter(e => !e.isFaceDown);
        if (enemies.length > 0) {
          const victim = this.rng.pick(enemies);
          this._destroyCardOnBoard(victim, side === 'PLAYER' ? 'CPU' : 'PLAYER', laneIndex, card.name);
        }
        for (const l of this.locations) {
          const list = side === 'PLAYER' ? l.playerCards : l.cpuCards;
          for (const c of list) c.permPowerMod += p;
        }
        this.logEvent('WHEN_DESTROYED', `[${card.name}] triggered When Destroyed: retaliated against enemy and buffed all allies by +${p} Power!`);
        break;
      }

      case 'DESTROY_WEAK_BUFF_RANDOM': {
        const allAllies = [];
        for (const l of this.locations) {
          const list = side === 'PLAYER' ? l.playerCards : l.cpuCards;
          allAllies.push(...list);
        }
        if (allAllies.length > 0) {
          const target = this.rng.pick(allAllies);
          target.permPowerMod += p;
          this.logEvent('WHEN_DESTROYED', `[${card.name}] triggered When Destroyed: gave [${target.name}] +${p} Power.`);
        }
        break;
      }

      case 'NEG_DESTROY_BUFF_ENEMY': {
        for (const e of enemyHere) {
          e.permPowerMod += p;
        }
        this.logEvent('WHEN_DESTROYED', `[${card.name}] negative When Destroyed triggered: gave enemy cards here +${p} Power!`);
        break;
      }

      case 'SYN_DESTROY_REBORN_OTHER_LOC': {
        const otherLanes = [0, 1, 2].filter(i => {
          if (i === laneIndex) return false;
          const list = side === 'PLAYER' ? this.locations[i].playerCards : this.locations[i].cpuCards;
          return list.length < 4;
        });
        if (otherLanes.length > 0) {
          const targetLane = this.rng.pick(otherLanes);
          card.permPowerMod += p;
          card.isFaceDown = false;
          const list = side === 'PLAYER' ? this.locations[targetLane].playerCards : this.locations[targetLane].cpuCards;
          list.push(card);
          this.logEvent('WHEN_DESTROYED', `[${card.name}] triggered When Destroyed: regenerated at [${this.locations[targetLane].name}] with +${p} Power!`);
        }
        break;
      }

      case 'SYN_DESTROY_RETURN_ZERO_COST': {
        if (actor.hand.length < 7) {
          card.cost = 0;
          card.permPowerMod += p;
          card.currentPower = Math.max(0, card.basePower + card.permPowerMod);
          actor.hand.push(card);
          this.logEvent('WHEN_DESTROYED', `[${card.name}] triggered When Destroyed: returned to ${side}'s hand with Cost 0 and +${p} Power!`);
        }
        break;
      }

      case 'SYN_DESTROY_ENERGY_AND_BUFF': {
        for (const a of friendlyHere) {
          a.permPowerMod += p;
        }
        actor.bonusEnergyNextTurn += 1;
        this.logEvent('WHEN_DESTROYED', `[${card.name}] triggered When Destroyed: gave allies here +${p} Power and granted +1 Energy next turn!`);
        break;
      }
    }
  }

  _summonToken(side, laneIndex, spec, sourceName) {
    const loc = this.locations[laneIndex];
    const list = side === 'PLAYER' ? loc.playerCards : loc.cpuCards;
    if (list.length >= 4) return null;

    const token = {
      seed: spec.seed || `TKN-${this.rng.int(1000, 9999)}`,
      uid: `${side}_TKN_${Date.now()}_${this.rng.int(100, 999)}`,
      owner: side,
      name: spec.name,
      cost: spec.cost ?? 1,
      power: spec.power ?? 2,
      baseCost: spec.cost ?? 1,
      basePower: spec.power ?? 2,
      permPowerMod: 0,
      ongoingPowerMod: 0,
      currentPower: spec.power ?? 2,
      tier: 'SYNERGY',
      trigger: 'ON_REVEAL',
      effectId: 'NONE',
      effectParam: 0,
      effectText: spec.effectText || 'Summoned unit.',
      isFaceDown: false
    };

    list.push(token);
    this.logEvent('SUMMON', `${side} summoned [${token.name}] (${token.power} Power) at [${loc.name}] via ${sourceName}.`);
    return token;
  }

  // ==========================================================================
  // LOCATION EFFECTS EXECUTION
  // ==========================================================================

  _executeLocationOnReveal(loc) {
    const p = loc.effectParam;
    switch (loc.effectId) {
      case 'LOC_REVEAL_BOTH_DRAW_BUFF': {
        const pCard = this._drawCard('PLAYER');
        if (pCard) {
          pCard.permPowerMod += p;
          pCard.currentPower = Math.max(0, pCard.basePower + pCard.permPowerMod);
        }
        const cCard = this._drawCard('CPU');
        if (cCard) {
          cCard.permPowerMod += p;
          cCard.currentPower = Math.max(0, cCard.basePower + cCard.permPowerMod);
        }
        this.logEvent('LOCATION', `[${loc.name}] drew a card for both players with +${p} Power.`);
        break;
      }
      case 'LOC_REVEAL_BONUS_ENERGY': {
        this.player.bonusEnergyNextTurn += p;
        this.cpu.bonusEnergyNextTurn += p;
        this.logEvent('LOCATION', `[${loc.name}] granted both players +${p} Energy for next turn.`);
        break;
      }
      case 'LOC_REVEAL_SUMMON_CONSTRUCT': {
        this._summonToken('PLAYER', loc.laneIndex, {
          name: 'Rift Construct',
          cost: 1,
          power: p,
          effectText: `Summoned by ${loc.name}.`
        }, loc.name);
        this._summonToken('CPU', loc.laneIndex, {
          name: 'Rift Construct',
          cost: 1,
          power: p,
          effectText: `Summoned by ${loc.name}.`
        }, loc.name);
        break;
      }
    }
  }

  _executeLocationOnPlay(loc, card, side) {
    const p = loc.effectParam;
    if (loc.effectId === 'LOC_ON_PLAY_BUFF') {
      card.permPowerMod += p;
      this.logEvent('LOCATION', `[${loc.name}] gave newly played [${card.name}] +${p} Power.`);
    } else if (loc.effectId === 'LOC_ON_PLAY_DISCARD_FOR_POWER') {
      const discarded = this._discardRandomFromHand(side, loc.name);
      if (discarded) {
        card.permPowerMod += p;
        this.logEvent('LOCATION', `[${loc.name}] discarded [${discarded.name}] to grant [${card.name}] +${p} Power!`);
      }
    }
  }

  _executeLocationEndOfTurn(loc) {
    const p = loc.effectParam;
    if (loc.effectId === 'LOC_END_TURN_BUFF_RANDOM') {
      if (loc.playerCards.length > 0) {
        const target = this.rng.pick(loc.playerCards);
        target.permPowerMod += p;
        this.logEvent('LOCATION', `[${loc.name}] gave Player's [${target.name}] +${p} Power at end of turn.`);
      }
      if (loc.cpuCards.length > 0) {
        const target = this.rng.pick(loc.cpuCards);
        target.permPowerMod += p;
        this.logEvent('LOCATION', `[${loc.name}] gave CPU's [${target.name}] +${p} Power at end of turn.`);
      }
    } else if (loc.effectId === 'LOC_TURN4_DESTROY_LOWEST' && this.turn === 4) {
      if (loc.playerCards.length > 0) {
        const sortedP = [...loc.playerCards].sort((a, b) => a.currentPower - b.currentPower);
        this._destroyCardOnBoard(sortedP[0], 'PLAYER', loc.laneIndex, loc.name);
      }
      if (loc.cpuCards.length > 0) {
        const sortedC = [...loc.cpuCards].sort((a, b) => a.currentPower - b.currentPower);
        this._destroyCardOnBoard(sortedC[0], 'CPU', loc.laneIndex, loc.name);
      }
    }
  }

  // ==========================================================================
  // ONGOING AURA & BOARD POWER RECALCULATION
  // Dynamically evaluates all ONGOING card effects & ONGOING location effects
  // ==========================================================================

  recalculateBoardState() {
    // 1. Reset ongoing modifiers on all cards and locations
    for (const loc of this.locations) {
      loc.playerBonusPower = 0;
      loc.cpuBonusPower = 0;
      for (const c of loc.playerCards) c.ongoingPowerMod = 0;
      for (const c of loc.cpuCards) c.ongoingPowerMod = 0;
    }

    // 2. Apply Location ONGOING effects (only if location is revealed!)
    for (const loc of this.locations) {
      if (!loc.revealed || loc.locTrigger !== 'ONGOING') continue;
      const p = loc.effectParam;
      const allHere = [...loc.playerCards, ...loc.cpuCards].filter(c => !c.isFaceDown);

      for (const c of allHere) {
        if (loc.effectId === 'LOC_ONGOING_ALL_PLUS') {
          c.ongoingPowerMod += p;
        } else if (loc.effectId === 'LOC_ONGOING_ALL_MINUS') {
          c.ongoingPowerMod -= p;
        } else if (loc.effectId === 'LOC_ONGOING_DOUBLE_HIGH_COST' && c.baseCost >= 4) {
          c.ongoingPowerMod += p;
        } else if (loc.effectId === 'LOC_ONGOING_LOW_COST_BUFF' && c.baseCost <= 2) {
          c.ongoingPowerMod += p;
        }
      }
    }

    // 3. Apply Card ONGOING effects
    const totalPlayerCards = this.locations.reduce((acc, l) => acc + l.playerCards.filter(c => !c.isFaceDown).length, 0);
    const totalCpuCards = this.locations.reduce((acc, l) => acc + l.cpuCards.filter(c => !c.isFaceDown).length, 0);

    for (let laneIdx = 0; laneIdx < 3; laneIdx++) {
      const loc = this.locations[laneIdx];
      this._applySideOngoingEffects('PLAYER', laneIdx, loc.playerCards, loc.cpuCards, totalPlayerCards);
      this._applySideOngoingEffects('CPU', laneIdx, loc.cpuCards, loc.playerCards, totalCpuCards);
    }

    // 4. First pass of total power per location (for conditional "winning this location" Ongoing effects)
    for (const loc of this.locations) {
      const pSum = loc.playerCards.reduce((s, c) => s + Math.max(0, c.basePower + c.permPowerMod + c.ongoingPowerMod), 0) + loc.playerBonusPower;
      const cSum = loc.cpuCards.reduce((s, c) => s + Math.max(0, c.basePower + c.permPowerMod + c.ongoingPowerMod), 0) + loc.cpuBonusPower;

      // Check ONGOING_SYN_ARMOR_LANE ("Friendly cards here have +p Power if you are winning this location")
      for (const c of loc.playerCards) {
        if (!c.isFaceDown && c.trigger === 'ONGOING' && c.effectId === 'ONGOING_SYN_ARMOR_LANE' && pSum > cSum) {
          for (const ally of loc.playerCards) {
            if (!ally.isFaceDown) ally.ongoingPowerMod += c.effectParam;
          }
        }
      }
      for (const c of loc.cpuCards) {
        if (!c.isFaceDown && c.trigger === 'ONGOING' && c.effectId === 'ONGOING_SYN_ARMOR_LANE' && cSum > pSum) {
          for (const ally of loc.cpuCards) {
            if (!ally.isFaceDown) ally.ongoingPowerMod += c.effectParam;
          }
        }
      }
    }

    // 5. Finalize currentPower on every card and compute Location totals
    for (const loc of this.locations) {
      let pTotal = loc.playerBonusPower;
      for (const c of loc.playerCards) {
        c.currentPower = Math.max(0, c.basePower + c.permPowerMod + c.ongoingPowerMod);
        if (!c.isFaceDown) pTotal += c.currentPower;
      }
      loc.playerTotalPower = Math.max(0, pTotal);

      let cTotal = loc.cpuBonusPower;
      for (const c of loc.cpuCards) {
        c.currentPower = Math.max(0, c.basePower + c.permPowerMod + c.ongoingPowerMod);
        if (!c.isFaceDown) cTotal += c.currentPower;
      }
      loc.cpuTotalPower = Math.max(0, cTotal);
    }
  }

  _applySideOngoingEffects(side, laneIdx, friendlyHere, enemyHere, totalFriendlyGlobal) {
    const actor = side === 'PLAYER' ? this.player : this.cpu;
    const revealedFriends = friendlyHere.filter(c => !c.isFaceDown);
    const revealedEnemies = enemyHere.filter(c => !c.isFaceDown);

    for (const card of revealedFriends) {
      if (card.trigger !== 'ONGOING') continue;
      const p = card.effectParam;

      switch (card.effectId) {
        case 'ONGOING_ALL_FRIENDLY_GLOBAL_BUFF': {
          for (const l of this.locations) {
            const list = side === 'PLAYER' ? l.playerCards : l.cpuCards;
            for (const ally of list) {
              if (ally.uid !== card.uid && !ally.isFaceDown) ally.ongoingPowerMod += p;
            }
          }
          break;
        }
        case 'ONGOING_OTHER_LOCATIONS_POWER': {
          for (let i = 0; i < 3; i++) {
            if (i === laneIdx) continue;
            if (side === 'PLAYER') this.locations[i].playerBonusPower += p;
            else this.locations[i].cpuBonusPower += p;
          }
          break;
        }
        case 'ONGOING_SCALE_PER_FRIENDLY_GLOBAL': {
          card.ongoingPowerMod += totalFriendlyGlobal * p;
          break;
        }
        case 'ONGOING_SCALE_DISCARD_DESTROY': {
          const totalEvents = this.player.discardCount + this.player.destroyCount + this.cpu.discardCount + this.cpu.destroyCount;
          card.ongoingPowerMod += totalEvents * p;
          break;
        }
        case 'ONGOING_ENEMY_ALL_DEBUFF': {
          for (const e of revealedEnemies) {
            e.ongoingPowerMod -= p;
          }
          break;
        }
        case 'ONGOING_WEAK_FULL_LANE_BONUS': {
          if (revealedFriends.length >= 4) {
            card.ongoingPowerMod += p;
          }
          break;
        }
        case 'ONGOING_WEAK_SOLO_BONUS': {
          if (revealedFriends.length === 1) {
            card.ongoingPowerMod += p;
          }
          break;
        }
        case 'ONGOING_NEG_ALLY_AURA': {
          for (const ally of revealedFriends) {
            if (ally.uid !== card.uid) ally.ongoingPowerMod -= p;
          }
          break;
        }
        case 'ONGOING_NEG_ENEMY_AURA': {
          for (const e of revealedEnemies) {
            e.ongoingPowerMod += p;
          }
          break;
        }
        case 'ONGOING_NEG_CROWD_PENALTY': {
          const otherCount = Math.max(0, revealedFriends.length - 1);
          card.ongoingPowerMod -= otherCount * p;
          break;
        }
        case 'ONGOING_SYN_ALLY_HERE_BUFF': {
          for (const ally of revealedFriends) {
            if (ally.uid !== card.uid) ally.ongoingPowerMod += p;
          }
          break;
        }
        case 'ONGOING_SYN_PER_CARD_HERE': {
          const otherCount = Math.max(0, revealedFriends.length - 1);
          card.ongoingPowerMod += otherCount * p;
          break;
        }
      }
    }
  }

  // ==========================================================================
  // END OF GAME (After Turn 6) & SCORING
  // Objective: Win 2 out of 3 locations by having the most power.
  // ==========================================================================

  finishGame() {
    this.phase = 'GAME_OVER';
    this.recalculateBoardState();

    let playerLanesWon = 0;
    let cpuLanesWon = 0;
    let playerTotalPower = 0;
    let cpuTotalPower = 0;

    for (const loc of this.locations) {
      playerTotalPower += loc.playerTotalPower;
      cpuTotalPower += loc.cpuTotalPower;
      if (loc.playerTotalPower > loc.cpuTotalPower) {
        playerLanesWon++;
      } else if (loc.cpuTotalPower > loc.playerTotalPower) {
        cpuLanesWon++;
      }
    }

    let outcome = 'TIE';
    let reason = '';

    if (playerLanesWon >= 2 && playerLanesWon > cpuLanesWon) {
      outcome = 'VICTORY';
      reason = `Won ${playerLanesWon} of 3 Locations!`;
    } else if (cpuLanesWon >= 2 && cpuLanesWon > playerLanesWon) {
      outcome = 'DEFEAT';
      reason = `CPU won ${cpuLanesWon} of 3 Locations.`;
    } else if (playerLanesWon > cpuLanesWon) {
      outcome = 'VICTORY';
      reason = `Won ${playerLanesWon} Location to ${cpuLanesWon} (with tied locations)!`;
    } else if (cpuLanesWon > playerLanesWon) {
      outcome = 'DEFEAT';
      reason = `CPU won ${cpuLanesWon} Location to ${playerLanesWon}.`;
    } else {
      // Tiebreaker: Total Power across all 3 locations
      if (playerTotalPower > cpuTotalPower) {
        outcome = 'VICTORY';
        reason = `Tied on Locations (${playerLanesWon}-${cpuLanesWon}); Won on Total Power Tiebreaker (${playerTotalPower} vs ${cpuTotalPower})!`;
      } else if (cpuTotalPower > playerTotalPower) {
        outcome = 'DEFEAT';
        reason = `Tied on Locations (${playerLanesWon}-${cpuLanesWon}); Lost on Total Power Tiebreaker (${playerTotalPower} vs ${cpuTotalPower}).`;
      } else {
        outcome = 'TIE';
        reason = `Exact tie on both Locations (${playerLanesWon}-${cpuLanesWon}) and Total Power (${playerTotalPower})!`;
      }
    }

    // Calculate Arcade High Score
    const winBonus = outcome === 'VICTORY' ? 1000 : (outcome === 'TIE' ? 400 : 100);
    const laneBonus = playerLanesWon * 350;
    const powerDiffBonus = Math.max(0, (playerTotalPower - cpuTotalPower) * 15);
    const totalPowerScore = playerTotalPower * 12;
    const score = winBonus + laneBonus + powerDiffBonus + totalPowerScore;

    this.result = {
      outcome,
      reason,
      playerLanesWon,
      cpuLanesWon,
      playerTotalPower,
      cpuTotalPower,
      score,
      matchSeed: this.matchSeed,
      playerDeckName: this.player.deckName,
      playerDeckSeed: this.player.deckSeed,
      playerShareCode: this.player.shareCode,
      cpuDeckName: this.cpu.deckName,
      cpuDeckSeed: this.cpu.deckSeed,
      cpuShareCode: this.cpu.shareCode,
      date: new Date().toLocaleDateString()
    };

    this.logEvent('RESULT', `=== GAME OVER: ${outcome} — ${reason} (Score: ${score}) ===`);
    this.onStateUpdate();
    this.onVisualEvent({ type: 'GAME_OVER', result: this.result });
  }
}



return {GameEngine,SeededRNG,generateCardSVG,generateLocationSVG,decodeDeckInput};
}
const ENGINE_HASH='ef957e369ae46809d89bdf70e4849eeb3392757239b008a63e1a833e208e549a';
const MULTI_HASH='afeabce7012a207d3b25c823f95e7d190ea4d7859e7b08978230eb7ad6bb76fe';
const RUNTIME_HASH='929c30c82abfda2eaf24ccbbe04584ab47cf978a1c9229c8ed99aded960f08ea';
const clone=x=>JSON.parse(JSON.stringify(x));
function check(x,m){if(!x)throw Error(m);}
function canonical(x){if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';}
async function sha(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function verify(x,kind){check(x&&x.protocol==='aether-snap-async-v1'&&x.kind===kind,'Unsupported multiplayer object/version');const {sha256,...rest}=x;check(sha256===await sha(canonical(rest)),'Multiplayer checksum mismatch');return x;}
function optionsOf(matchSeed,playerDeck,cpuDeck){for(const [k,v]of Object.entries({matchSeed,playerDeck,cpuDeck}))check(typeof v==='string'&&v.trim()&&v.length<=20000,'Missing or invalid '+k);return {matchSeed,playerDeck,cpuDeck};}
function auxRuntime(seed){let ticks=0,r=0x12345678;for(const c of seed)r=Math.imul(r^c.charCodeAt(0),16777619)>>>0;const math=Object.create(Math);math.random=()=>{r^=r<<13;r^=r>>>17;r^=r<<5;return(r>>>0)/4294967296;};class Clock extends Date{constructor(...a){super(...(a.length?a:[Date.UTC(2000,0,1)+ticks++]));}static now(){return Date.UTC(2000,0,1)+ticks++;}toLocaleTimeString(){return this.toISOString().slice(11,23)+'Z';}toLocaleDateString(){return this.toISOString().slice(0,10);}}return makeOriginalCore(math,Clock);}
function captureSession(options){const api=auxRuntime(options.matchSeed),frames=[];let bStaged=[],suppress=false,e;
 function snap(engine,kind,detail){if(suppress||!engine.player||!engine.cpu||!engine.locations||!engine.logs)return;check(frames.length<5000,'Replay exceeds 5,000 frames');if(kind==='state'&&frames.length){const prev=frames.at(-1),changes=[];for(let i=0;i<3;i++){const old=prev.locations[i],now=engine.locations[i];for(const [label,key]of [['A','playerTotalPower'],['B','cpuTotalPower']])if(old[key]!==now[key])changes.push('L'+(i+1)+' '+label+' '+old[key]+'→'+now[key]);}if(changes.length)detail={message:'Power updated: '+changes.join(' · ')};}frames.push(clone({index:frames.length,kind,detail,turn:engine.turn,phase:engine.phase,energyA:engine.player.energy,energyB:engine.cpu.energy,handA:engine.player.hand,handBCount:engine.cpu.hand.length,drawA:engine.player.drawPile.length,drawB:engine.cpu.drawPile.length,discardA:engine.player.discardCount,discardB:engine.cpu.discardCount,destroyA:engine.player.destroyCount,destroyB:engine.cpu.destroyCount,stagedA:engine.stagedPlayerPlays||[],stagedB:bStaged,locations:engine.locations,result:engine.result}));}
 const originalLog=api.GameEngine.prototype.logEvent;api.GameEngine.prototype.logEvent=function(...args){originalLog.apply(this,args);snap(this,'event',this.logs[this.logs.length-1]);};api.GameEngine.prototype._delay=async()=>{};
 e=new api.GameEngine({matchSeed:options.matchSeed,playerDeckSpec:api.decodeDeckInput(options.playerDeck),cpuDeckSpec:api.decodeDeckInput(options.cpuDeck),onStateUpdate:function(){snap(this,'state',{message:'Board / hand state updated'});},onVisualEvent:function(event){snap(this,'visual',event);}});
 function uid(side,slot){check(Number.isInteger(slot)&&slot>=0&&slot<12,'Invalid cardSlot');const d=side==='A'?e.playerDeckSource:e.cpuDeckSource;return `${side==='A'?'PLAYER':'CPU'}_${slot}_${d.cards[slot].seed}`;}
 function stage(side,choice){check(choice&&Number.isInteger(choice.lane)&&choice.lane>=0&&choice.lane<=2,'Invalid lane');const id=uid(side,choice.cardSlot);if(side==='A')return e.stageCardPlay(id,choice.lane);check(side==='B','Invalid side');suppress=true;[e.player,e.cpu]=[e.cpu,e.player];for(const l of e.locations)[l.playerCards,l.cpuCards]=[l.cpuCards,l.playerCards];const old=e.stagedPlayerPlays;e.stagedPlayerPlays=bStaged;let result;try{result=e.stageCardPlay(id,choice.lane);}finally{bStaged=e.stagedPlayerPlays;e.stagedPlayerPlays=old;for(const l of e.locations)[l.playerCards,l.cpuCards]=[l.cpuCards,l.playerCards];[e.player,e.cpu]=[e.cpu,e.player];suppress=false;}snap(e,'action',{message:'B stages a face-down card.'});return result;}
 function step(side,step){check(step&&step.otherwise==='skip'&&Array.isArray(step.choices)&&step.choices.length<=12&&Object.keys(step).sort().join(',')==='choices,otherwise','Invalid multiplayer step');const rejected=[];for(let i=0;i<step.choices.length;i++){const c=step.choices[i];check(c&&Object.keys(c).sort().join(',')==='cardSlot,lane','Invalid choice fields');const r=stage(side,c);if(r.ok)return{selected:c,choiceIndex:i,rejected};rejected.push({choiceIndex:i,choice:c,reason:r.reason});}snap(e,'action',{message:side+' skips a submitted step (no legal listed choice).'});return{selected:null,rejected};}
 return{api,e,frames,stage,step,useHumanB(){e._planCpuPlays=()=>{const q=bStaged;bStaged=[];return q;};},finish(){snap(e,'complete',{message:'Replay complete'});return frames;}};
}
const semantics=logs=>logs.map(x=>({turn:x.turn,category:x.category,message:x.message}));
function parseText(text){const h=k=>text.match(new RegExp('^'+k+'\\s*:\\s*(.+)$','m'))?.[1]?.trim();const entries=[];for(const line of text.split(/\r?\n/)){const m=line.match(/^\[(INIT|T\d+)\] \[([A-Z_]+)\] (.*)$/);if(m)entries.push({turn:m[1]==='INIT'?0:Number(m[1].slice(1)),category:m[2],message:m[3]});}check(entries.length&&entries.at(-1).category==='RESULT','Incomplete text log: a complete original chronological log through RESULT is required.');return{matchSeed:h('Match Seed'),playerDeck:{shareCode:h('Player Code')},cpuDeck:{shareCode:h('CPU Code')},logs:entries,_text:true};}
function validateOriginalLogs(logs){check(Array.isArray(logs)&&logs.length>5&&logs.length<=10000,'Complete original event array required');for(const l of logs)check(l&&Number.isInteger(l.turn)&&l.turn>=0&&l.turn<=6&&typeof l.category==='string'&&typeof l.message==='string'&&l.message.length<=20000,'Malformed log entry');check(logs[0].category==='SYSTEM'&&logs.at(-1).category==='RESULT','Incomplete log: requires initialization through final RESULT');}
function compareLogs(e,expected){const actual=semantics(e.logs),wanted=semantics(expected);check(canonical(actual)===canonical(wanted),'Log cannot be reconstructed exactly: regenerated event stream differs (missing events, ambiguous data, or incompatible rules). No speculative replay was created.');}
function compareResult(e,result){if(!result)return;for(const k of ['outcome','playerLanesWon','cpuLanesWon','playerTotalPower','cpuTotalPower','score','matchSeed'])if(result[k]!==undefined)check(e.result[k]===result[k],'Final result mismatch: '+k);}
function validateTurns(turns){check(Array.isArray(turns)&&turns.length===6,'Requires exactly six turn arrays');for(const t of turns)check(Array.isArray(t)&&t.length<=24,'Invalid turn array');}
async function fromSave(save){check(save.schema==='aether-snap-save-v1'&&save.engineSHA256===ENGINE_HASH,'Unsupported save engine/version');const {checksum,...base}=save;check(checksum===await sha(JSON.stringify(base)),'Save checksum mismatch');check(Array.isArray(save.actions)&&save.actions.length<=10000,'Invalid save actions');const o=optionsOf(save.options?.matchSeed,save.options?.playerDeck,save.options?.cpuDeck),s=captureSession(o);for(const a of save.actions){check(a&&typeof a.type==='string','Invalid action');if(a.type==='play'){check(Object.keys(a).sort().join(',')==='cardUid,lane,type'&&Number.isInteger(a.lane)&&a.lane>=0&&a.lane<3,'Invalid play');check(s.e.stageCardPlay(a.cardUid,a.lane).ok,'Saved play is illegal');}else if(a.type==='unplay'){check(Object.keys(a).sort().join(',')==='cardUid,type'&&s.e.unstageCardPlay(a.cardUid),'Invalid unplay');}else if(a.type==='undo'){check(Object.keys(a).join(',')==='type'&&s.e.phase==='STAGING'&&s.e.stagedPlayerPlays.length>0,'Invalid undo');s.e.undoAllStagedPlays();}else if(a.type==='end_turn'){check(Object.keys(a).join(',')==='type'&&s.e.phase==='STAGING','Invalid end_turn');await s.e.commitTurn();}else throw Error('Unknown saved action');}check(s.e.phase==='GAME_OVER','Save is an unfinished match. Complete it before watching a full replay.');return{session:s,options:o,format:'Headless single-player save',notes:['Original accepted actions, including recorded undo/unplay, replayed exactly.']};}
async function fromOriginal(log){validateOriginalLogs(log.logs);const o=optionsOf(log.matchSeed,log.playerDeck?.shareCode,log.cpuDeck?.shareCode),s=captureSession(o);for(let turn=1;turn<=6;turn++){check(s.e.turn===turn,'Turn reconstruction mismatch');for(const entry of log.logs.filter(x=>x.turn===turn&&x.category==='PLAY'&&x.message.startsWith('PLAYER revealed'))){const m=entry.message.match(/^PLAYER revealed \[(.*)\] \(Cost (\d+), Base Power (-?\d+), Tier: ([A-Z_]+)\) at \[(.*)\]\.$/);check(m,'Unsupported PLAY log syntax');const cards=s.e.player.hand.filter(c=>c.name===m[1]&&c.cost===Number(m[2])&&c.power===Number(m[3])&&c.tier===m[4]),lanes=s.e.locations.map((l,i)=>({l,i})).filter(x=>x.l.name===m[5]);check(cards.length===1&&lanes.length===1,'Ambiguous log: card or location cannot be identified uniquely. Use the headless save or offer+response instead.');check(s.e.stageCardPlay(cards[0].uid,lanes[0].i).ok,'Logged play cannot be legally staged');}await s.e.commitTurn();}compareLogs(s.e,log.logs);compareResult(s.e,log.result);return{session:s,options:o,format:log._text?'Original complete text match log':'Original complete JSON match log',notes:['Committed plays recovered unambiguously and the entire generated event stream verified. Original staging deliberation, undo history and wall-clock timing were not recorded; replay shows inferred committed staging and event-paced timing.']};}
async function fromMultiplayerResult(result){await verify(result,'result');check(result.engineSHA256===ENGINE_HASH&&result.adapterSHA256===MULTI_HASH&&result.runtimeSHA256===RUNTIME_HASH,'Unsupported multiplayer engine/adapter/runtime version');const r=result.originalResult,o=optionsOf(r?.matchSeed,r?.playerShareCode,r?.cpuShareCode),s=captureSession(o);s.useHumanB();check(Array.isArray(result.audit)&&result.audit.length<=288,'Invalid multiplayer audit');let lastTurn=1;for(let turn=1;turn<=6;turn++){const rows=result.audit.filter(a=>a.turn===turn);check(rows.every(a=>a.side==='A'||a.side==='B'),'Invalid audit side');let seenB=false;for(const a of rows){check(a.turn>=lastTurn,'Audit not ordered');lastTurn=a.turn;if(a.side==='B')seenB=true;else check(!seenB,'Audit staging order mismatch');const applied=s.step(a.side,a.step);check(canonical(applied.selected)===canonical(a.selected),'Audit selected choice differs from legal replay');if(a.selected!==null)check(applied.choiceIndex===a.choiceIndex,'Audit fallback index mismatch');}await s.e.commitTurn();}check(result.audit.every(a=>Number.isInteger(a.turn)&&a.turn>=1&&a.turn<=6),'Audit turn out of range');compareResult(s.e,r);check(result.winner===(s.e.result.outcome==='VICTORY'?'A':s.e.result.outcome==='DEFEAT'?'B':'TIE'),'Winner mismatch');const expected=parseText(result.fullLog);compareLogs(s.e,expected.logs);return{session:s,options:o,format:'Multiplayer referee result',notes:['Both human plans reconstructed from audited submitted choices; original shared-board interactions verified against full referee log. No CPU decision planner used.']};}
async function fromPair(offer,response){await verify(offer,'offer');await verify(response,'response');await verify(offer.spec,'challenge-spec');await verify(offer.planA,'plan');await verify(response.planB,'plan');const sp=offer.spec;check(sp.format==='shared-board-six-turn-plans'&&sp.priority==='original-initiative-seeded-tie'&&sp.fallback==='ordered-first-legal-otherwise-skip','Unsupported multiplayer format/priority/fallback');check(sp.engineSHA256===ENGINE_HASH&&sp.adapterSHA256===MULTI_HASH&&sp.runtimeSHA256===RUNTIME_HASH,'Unsupported offer version');check(response.offerSHA256===offer.sha256&&response.challengeId===sp.id,'Response/offer binding mismatch');check(offer.planA.side==='A'&&response.planB.side==='B'&&offer.planA.specSHA256===sp.sha256&&response.planB.specSHA256===sp.sha256,'Plan binding mismatch');validateTurns(offer.planA.turns);validateTurns(response.planB.turns);const o=optionsOf(sp.matchSeed,sp.deckA,sp.deckB),s=captureSession(o);s.useHumanB();for(let t=0;t<6;t++){for(const step of offer.planA.turns[t])s.step('A',step);for(const step of response.planB.turns[t])s.step('B',step);await s.e.commitTurn();}return{session:s,options:o,format:'Multiplayer offer + response',notes:['Match computed from two hash-bound original plans with the unchanged original engine. No supplied result was assumed.']};}
async function reconstruct(inputs){check(Array.isArray(inputs)&&inputs.length>0&&inputs.length<=2,'Import one supported file, or exactly one multiplayer offer plus response.');inputs=inputs.map(x=>typeof x==='string'?(x.trim().startsWith('{')?JSON.parse(x):parseText(x)):clone(x));if(inputs.length===1&&inputs[0]?.schema==='aether-snap-replay-bundle-v1'){check(Array.isArray(inputs[0].sources)&&inputs[0].sources.length<=2,'Invalid replay bundle');return reconstruct(inputs[0].sources);}let built;if(inputs.length===2){const offer=inputs.find(x=>x.kind==='offer'),response=inputs.find(x=>x.kind==='response');check(offer&&response,'Two files must be an offer and its response');built=await fromPair(offer,response);}else{let x=inputs[0];if(x.save)x=x.save;if(x.schema==='aether-snap-save-v1')built=await fromSave(x);else if(x.kind==='result')built=await fromMultiplayerResult(x);else if(x.kind==='offer'||x.kind==='response')throw Error('This file needs its matching multiplayer offer/response. Select both files together, or import a referee RESULT.');else if(x.logs)built=await fromOriginal(x);else if(x.spoilerLog)built=await fromOriginal(parseText(x.spoilerLog));else throw Error('Unsupported file. Import a complete original JSON/text log, completed headless save/demo, multiplayer result, or matching offer+response.');}const frames=built.session.finish();check(built.session.e.phase==='GAME_OVER','Replay is incomplete');return{schema:'aether-snap-reconstructed-v1',format:built.format,options:built.options,notes:built.notes,frames,result:clone(built.session.e.result),eventLog:semantics(built.session.e.logs),sources:inputs};}
function publicMessage(frame){const d=frame.detail||{};if(frame.kind==='visual'){const who=d.side==='PLAYER'?'A / Player':'B / CPU';if(d.type==='CARD_REVEAL')return who+' reveals '+d.card.name+' in lane '+(d.laneIndex+1)+'.';if(d.type==='CARD_DESTROY')return who+' loses '+(d.card.isFaceDown?'a face-down card':d.card.name)+' in lane '+(d.laneIndex+1)+' (destroyed).';if(d.type==='CARD_DISCARD')return who+' discards '+d.card.name+'.';if(d.type==='LOCATION_REVEAL')return 'Lane '+(d.laneIndex+1)+' reveals: '+d.location.name+'.';}let m=d.message||({CARD_REVEAL:'Card reveals',CARD_DESTROY:'Card destroyed',CARD_DISCARD:'Card discarded',LOCATION_REVEAL:'Location reveals',GAME_OVER:'Game over'}[d.type])||'State updated';if(frame.kind==='event'&&d.category==='DRAW'&&/^CPU drew /.test(m))return 'B / CPU drew a card (identity concealed).';if(frame.kind==='event'&&d.category==='SYSTEM'&&/^CPU Deck:/.test(m))return 'B / CPU deck initialized.';return m.replaceAll('PLAYER','A / Player').replaceAll('CPU','B / CPU');}
const renderApi=auxRuntime('RENDER-ONLY');return{reconstruct,publicMessage,canonical,sha,ENGINE_HASH,generateCardSVG:renderApi.generateCardSVG,generateLocationSVG:renderApi.generateLocationSVG};

});
