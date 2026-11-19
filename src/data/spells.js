// Story / Reward / Bonus Spells and Character Factory helpers
import { SPECIES_BY_ID } from './species.js';
import { CLASS_BY_ID } from './classes.js';

export const MAX_POTIONS = 3;

export const BONUS_SPELLS = {
  exorcism: {
    id: 'exorcism',
    name: 'Exorcism',
    source: 'High Priest Aldric (Disciple of Light)',
    desc: 'Calls down a blinding pillar of sacred light that banishes demons and heals the caster.',
    type: 'nova_heal',
    manaCost: 22,
    cooldown: 3.2,
    damage: 62,
    heal: 35,
    radius: 175,
    knockback: 380,
    color: '#fff3a1',
  },
  inferno_pact: {
    id: 'inferno_pact',
    name: 'Inferno Pact',
    source: 'Ignis-Kael, Demon of Flame',
    desc: 'Unleashes a volcanic ring of explosive fireballs in all directions.',
    type: 'radial_explode',
    manaCost: 22,
    cooldown: 2.8,
    damage: 42,
    count: 8,
    speed: 320,
    radius: 85,
    color: '#ff5722',
  },
  tidal_pact: {
    id: 'tidal_pact',
    name: 'Tidal Pact',
    source: 'Nerai-Vex, Demon of the Abyss',
    desc: 'Summons an abyssal maelstrom that crushes, freezes, and heals from the tide.',
    type: 'nova_slow_heal',
    manaCost: 20,
    cooldown: 3.2,
    damage: 46,
    heal: 28,
    radius: 170,
    slowDuration: 5.0,
    color: '#00d2ff',
  },
  terra_pact: {
    id: 'terra_pact',
    name: 'Terra Pact',
    source: 'Grol-Makh, Demon of Stone',
    desc: 'Shatters the ground in tectonic fissures while encasing you in obsidian armor.',
    type: 'nova_shield',
    manaCost: 22,
    cooldown: 3.4,
    damage: 54,
    radius: 175,
    shield: 65,
    knockback: 420,
    color: '#2ecc71',
  },
  tempest_pact: {
    id: 'tempest_pact',
    name: 'Tempest Pact',
    source: 'Vael-Zeph, Demon of Gales',
    desc: 'Fires six homing lightning cyclones and surges your speed.',
    type: 'homing_haste',
    manaCost: 20,
    cooldown: 2.6,
    damage: 28,
    count: 6,
    speed: 410,
    hasteDuration: 5.0,
    color: '#a29bfe',
  },
  fourfold_convergence: {
    id: 'fourfold_convergence',
    name: 'Fourfold Convergence',
    source: 'Master of the Four Elements',
    desc: 'Fuses Flame, Tide, Stone, and Gale into a cataclysmic prismatic nova and homing barrage.',
    type: 'convergence',
    manaCost: 28,
    cooldown: 3.5,
    damage: 65,
    count: 8,
    radius: 200,
    heal: 30,
    shield: 40,
    color: '#f9ca24',
  },
  arcane_bolt: {
    id: 'arcane_bolt',
    name: 'Scroll: Arcane Bolt',
    source: 'Dungeon Treasure',
    desc: 'A reliable piercing bolt of pure mana found in ancient chests.',
    type: 'projectile_pierce',
    manaCost: 12,
    cooldown: 1.4,
    damage: 28,
    speed: 440,
    size: 14,
    color: '#67e8f9',
  },
  plasma_barrage: {
    id: 'plasma_barrage',
    name: 'Xylosian Laser Volley',
    source: 'Commander Xylar (Concert Invasion Path 1)',
    desc: 'Fires a high-velocity spread of alien plasma bolts.',
    type: 'cone',
    manaCost: 16,
    cooldown: 1.8,
    damage: 24,
    count: 6,
    spread: 0.55,
    speed: 520,
    range: 340,
    color: '#22d3ee',
  },
  harmonic_summon: {
    id: 'harmonic_summon',
    name: 'Chord of the Virtuoso',
    source: 'Lyricus, Master Bard (Concert Invasion Path 2)',
    desc: 'Unleashes homing resonant notes that seek enemies and heal you.',
    type: 'homing_haste',
    manaCost: 20,
    cooldown: 2.5,
    damage: 28,
    heal: 22,
    count: 6,
    speed: 380,
    hasteDuration: 4.5,
    color: '#f472b6',
  },
  seismic_drumbeat: {
    id: 'seismic_drumbeat',
    name: 'Xylosian War Drums',
    source: 'Royal Bard of Planet Xylos (Concert Invasion Path 3)',
    desc: 'Slams futuristic drums to unleash a massive earthquake shockwave and stone shield.',
    type: 'nova_shield',
    manaCost: 22,
    cooldown: 3.0,
    damage: 62,
    radius: 195,
    shield: 50,
    knockback: 420,
    color: '#06b6d4',
  },
};

export const HAIR_STYLES = [
  { id: 'swept', name: 'Heroic Swept' },
  { id: 'long', name: 'Flowing Mane' },
  { id: 'spiky', name: 'Battle Spikes' },
  { id: 'braid', name: 'Warrior Braid' },
  { id: 'bob', name: 'Mystic Bob' },
  { id: 'bald', name: 'Clean / Crest' },
];

export const EYE_STYLES = [
  { id: 'bright', name: 'Bright' },
  { id: 'glow', name: 'Arcane Glow' },
  { id: 'fierce', name: 'Fierce Slit' },
  { id: 'visor', name: 'Radiant Visor' },
  { id: 'mystic', name: 'Starry' },
];

export function createDefaultCharacter(speciesId = 'human', classId = 'spellblade') {
  const sp = SPECIES_BY_ID[speciesId] || SPECIES_BY_ID.human;
  const cl = CLASS_BY_ID[classId] || CLASS_BY_ID.spellblade;
  return {
    version: 1,
    name: 'Aetheris',
    title: 'Wanderer',
    speciesId: sp.id,
    classId: cl.id,
    appearance: {
      skinColor: sp.defaultColors.skin,
      hairColor: sp.defaultColors.hair,
      armorColor: cl.defaultColors.armor,
      accentColor: cl.defaultColors.accent,
      hairStyle: 'swept',
      eyeStyle: 'glow',
      scale: 1.0,
      showCape: cl.visual.cape,
      showAura: cl.visual.aura !== 'none',
    },
    bonusStats: { str: 4, int: 4, vit: 4, agi: 3, wis: 3, lck: 2 }, // 20 point-buy pool
    bonusSpells: [],
    gold: 25,
    potions: 3,
  };
}

export function computeDerivedStats(character) {
  const sp = SPECIES_BY_ID[character.speciesId] || SPECIES_BY_ID.human;
  const cl = CLASS_BY_ID[character.classId] || CLASS_BY_ID.knight;
  const b = character.bonusStats || { str: 0, int: 0, vit: 0, agi: 0, wis: 0, lck: 0 };
  const total = {
    str: sp.stats.str + cl.stats.str + (b.str || 0),
    int: sp.stats.int + cl.stats.int + (b.int || 0),
    vit: sp.stats.vit + cl.stats.vit + (b.vit || 0),
    agi: sp.stats.agi + cl.stats.agi + (b.agi || 0),
    wis: sp.stats.wis + cl.stats.wis + (b.wis || 0),
    lck: sp.stats.lck + cl.stats.lck + (b.lck || 0),
  };
  return {
    total,
    maxHp: 110 + total.vit * 10,
    maxMana: 70 + total.wis * 6 + total.int * 2,
    manaRegen: 7 + total.wis * 0.55 + total.int * 0.25,
    meleeMult: 0.75 + total.str * 0.045,
    spellMult: 0.75 + total.int * 0.05,
    moveSpeed: 175 + total.agi * 5.2,
    critChance: Math.min(0.55, 0.06 + total.lck * 0.018),
    cdr: Math.min(0.45, total.wis * 0.012 + total.agi * 0.008),
  };
}

export function validateCharacterJSON(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid JSON object.');
  const speciesId = SPECIES_BY_ID[data.speciesId] ? data.speciesId : 'human';
  const classId = CLASS_BY_ID[data.classId] ? data.classId : 'knight';
  const base = createDefaultCharacter(speciesId, classId);
  const b = data.bonusStats || {};
  const bonusStats = {
    str: Math.max(0, Math.min(25, Number(b.str) || 0)),
    int: Math.max(0, Math.min(25, Number(b.int) || 0)),
    vit: Math.max(0, Math.min(25, Number(b.vit) || 0)),
    agi: Math.max(0, Math.min(25, Number(b.agi) || 0)),
    wis: Math.max(0, Math.min(25, Number(b.wis) || 0)),
    lck: Math.max(0, Math.min(25, Number(b.lck) || 0)),
  };
  return {
    ...base,
    name: String(data.name || base.name).slice(0, 28),
    title: String(data.title || base.title).slice(0, 36),
    appearance: {
      ...base.appearance,
      ...(data.appearance || {}),
      scale: Math.max(0.85, Math.min(1.2, Number(data.appearance?.scale) || 1.0)),
    },
    bonusStats,
    bonusSpells: Array.isArray(data.bonusSpells)
      ? data.bonusSpells.filter((id) => Boolean(BONUS_SPELLS[id]))
      : [],
    gold: Math.max(0, Number(data.gold) || 0),
    potions: Math.max(0, Math.min(MAX_POTIONS, Number(data.potions ?? MAX_POTIONS))),
  };
}
