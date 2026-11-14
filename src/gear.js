/**
 * Customizable Gear System: Bladed Weapons, Armor, and Magic Wands.
 * Supports modular crafting, biome-unique materials, effect descriptions,
 * durability degradation (weakens over time, breaks at 0), and repairs.
 */

export const MATERIALS_META = {
  ironOre: { name: 'Iron Ore', short: 'Iron' },
  wood: { name: 'Timber', short: 'Wood' },
  obsidian: { name: 'Obsidian', short: 'Obsid' },
  sunstone: { name: 'Sunstone', short: 'Sun' },
  crystal: { name: 'Arcane Crystal', short: 'Cryst' },
  frostquartz: { name: 'Frostquartz', short: 'Frost' },
  brimstone: { name: 'Brimstone', short: 'Brim' },
  voidshard: { name: 'Void Shard', short: 'Void' },
  fang: { name: 'Monster Fang', short: 'Fang' },
};

export const BLADE_MATERIALS = {
  iron: { label: 'Iron', dmg: 16, maxDur: 100, color: 0xb8c2cc, cost: { ironOre: 3, wood: 1 } },
  obsidian: { label: 'Obsidian', dmg: 24, maxDur: 115, color: 0x3b2d4a, cost: { obsidian: 3, ironOre: 2 } },
  sunsteel: { label: 'Sunsteel', dmg: 31, maxDur: 140, color: 0xf59e0b, cost: { sunstone: 3, ironOre: 3 } },
  froststeel: { label: 'Froststeel', dmg: 34, maxDur: 145, color: 0x7dd3fc, cost: { frostquartz: 3, ironOre: 2 } },
  crystal: { label: 'Arcane Crystal', dmg: 39, maxDur: 160, color: 0x38bdf8, cost: { crystal: 3, voidshard: 1 } },
};

export const BLADE_STYLES = {
  broadsword: {
    label: 'Broadsword',
    dmgMult: 1.0,
    speed: 1.0,
    range: 2.8,
    desc: 'Balanced reach, speed, and slash damage.',
    cost: {},
  },
  katana: {
    label: 'Katana',
    dmgMult: 0.92,
    speed: 1.38,
    range: 2.95,
    crit: 0.30,
    desc: 'Rapid strikes with 30% critical hit chance (1.6x DMG).',
    cost: { fang: 2 },
  },
  cleaver: {
    label: 'Great Cleaver',
    dmgMult: 1.42,
    speed: 0.72,
    range: 3.35,
    desc: 'Heavy sweeping arcs with +42% base damage and extended reach.',
    cost: { ironOre: 2 },
  },
};

export const BLADE_ENCHANTS = {
  none: { label: 'Tempered', effect: null, glow: 0x000000, desc: 'No elemental enchantment.', cost: {} },
  ember: {
    label: 'Ember Edge',
    effect: 'burn',
    glow: 0xff5500,
    desc: 'Ignites foes on hit, dealing 5 burn DMG/sec for 3.5s.',
    cost: { brimstone: 2, sunstone: 1 },
  },
  frost: {
    label: 'Frostbite',
    effect: 'slow',
    glow: 0x38bdf8,
    desc: 'Chills monsters on hit, slowing movement by 50% for 3s.',
    cost: { frostquartz: 2 },
  },
  vampiric: {
    label: 'Bloodleech',
    effect: 'leech',
    glow: 0xe11d48,
    desc: 'Drains life force, healing you for 16% of damage dealt.',
    cost: { fang: 3, voidshard: 1 },
  },
};

export const ARMOR_PLATES = {
  leather: { label: 'Leather', def: 0.16, maxDur: 90, color: 0x854d27, cost: { wood: 2, fang: 2 } },
  iron: { label: 'Iron Plate', def: 0.30, maxDur: 120, color: 0x94a3b8, cost: { ironOre: 4 } },
  frostmail: { label: 'Frostmail', def: 0.38, maxDur: 135, color: 0x67e8f9, cost: { frostquartz: 3, ironOre: 2 } },
  obsidian: { label: 'Obsidian Mail', def: 0.45, maxDur: 150, color: 0x2e233d, cost: { obsidian: 4, brimstone: 1 } },
  crystal: { label: 'Crystal Aegis', def: 0.56, maxDur: 170, color: 0x0ea5e9, cost: { crystal: 4, voidshard: 2 } },
};

export const ARMOR_RUNES = {
  none: { label: 'Sturdy', effect: null, glow: 0x000000, desc: 'Standard physical protection.', cost: {} },
  endurance: {
    label: 'Endurance',
    effect: 'staminaSave',
    glow: 0x22c55e,
    desc: 'Reduces stamina drain from sprinting, dodging, and attacks by 25%.',
    cost: { wood: 2, sunstone: 1 },
  },
  thorns: {
    label: 'Thorns',
    effect: 'thorns',
    glow: 0xf43f5e,
    desc: 'Reflects 25% of incoming melee damage back onto attackers.',
    cost: { fang: 3, brimstone: 1 },
  },
  ward: {
    label: 'Arcane Ward',
    effect: 'ward',
    glow: 0x38bdf8,
    desc: 'Amplifies all Magic Wand spell damage by +20%.',
    cost: { crystal: 2, frostquartz: 1 },
  },
};

export const WAND_CORES = {
  spark: {
    label: 'Spark',
    dmg: 18,
    speed: 25,
    elem: 'lightning',
    color: 0xfacc15,
    desc: 'Fast lightning bolts with high projectile velocity.',
    cost: { crystal: 1, ironOre: 1 },
  },
  ember: {
    label: 'Ember',
    dmg: 26,
    speed: 20,
    elem: 'fire',
    color: 0xf97316,
    splash: 2.8,
    desc: 'Explosive fireballs dealing 60% splash damage to nearby foes.',
    cost: { sunstone: 2, brimstone: 2 },
  },
  frost: {
    label: 'Frost',
    dmg: 23,
    speed: 22,
    elem: 'ice',
    color: 0x38bdf8,
    slow: true,
    desc: 'Glacial shards that chill and slow enemies by 50% for 3s.',
    cost: { frostquartz: 2, crystal: 1 },
  },
  void: {
    label: 'Void',
    dmg: 33,
    speed: 19,
    elem: 'void',
    color: 0xc084fc,
    homing: true,
    desc: 'Homing void orbs that curve toward nearby monsters.',
    cost: { voidshard: 2, obsidian: 2 },
  },
};

export const WAND_SHAFTS = {
  ashwood: { label: 'Ashwood', maxDur: 85, castMult: 1.0, stamCost: 7, color: 0x78350f, cost: { wood: 3 } },
  ironwood: { label: 'Ironwood', maxDur: 120, castMult: 1.18, stamCost: 6, color: 0x475569, cost: { wood: 2, ironOre: 2 } },
  eldercrystal: { label: 'Elder Crystal', maxDur: 155, castMult: 1.35, stamCost: 4.5, color: 0x0284c7, cost: { crystal: 3, voidshard: 1 } },
};

let nextGearId = 1;

export function createBlade(materialKey = 'iron', styleKey = 'broadsword', enchantKey = 'none') {
  const mat = BLADE_MATERIALS[materialKey];
  const style = BLADE_STYLES[styleKey];
  const ench = BLADE_ENCHANTS[enchantKey];
  const maxDur = mat.maxDur;
  const effectDesc = enchantKey !== 'none' ? `${style.desc} ${ench.desc}` : style.desc;
  return {
    id: `gear_${nextGearId++}`,
    category: 'blade',
    partA: materialKey,
    partB: styleKey,
    partC: enchantKey,
    name: `${mat.label} ${style.label}${enchantKey !== 'none' ? ` (${ench.label})` : ''}`,
    baseDamage: Math.round(mat.dmg * style.dmgMult),
    speed: style.speed,
    range: style.range,
    crit: style.crit || 0.1,
    effect: ench.effect,
    effectDesc,
    color: mat.color,
    glow: ench.glow,
    durability: maxDur,
    maxDurability: maxDur,
  };
}

export function createArmor(plateKey = 'leather', runeKey = 'none') {
  const plate = ARMOR_PLATES[plateKey];
  const rune = ARMOR_RUNES[runeKey];
  const maxDur = plate.maxDur;
  return {
    id: `gear_${nextGearId++}`,
    category: 'armor',
    partA: plateKey,
    partB: runeKey,
    partC: 'none',
    name: `${plate.label}${runeKey !== 'none' ? ` of ${rune.label}` : ''}`,
    baseDefense: plate.def,
    effect: rune.effect,
    effectDesc: rune.desc,
    color: plate.color,
    glow: rune.glow,
    durability: maxDur,
    maxDurability: maxDur,
  };
}

export function createWand(coreKey = 'spark', shaftKey = 'ashwood') {
  const core = WAND_CORES[coreKey];
  const shaft = WAND_SHAFTS[shaftKey];
  const maxDur = shaft.maxDur;
  return {
    id: `gear_${nextGearId++}`,
    category: 'wand',
    partA: coreKey,
    partB: shaftKey,
    partC: 'none',
    name: `${core.label} ${shaft.label} Wand`,
    baseDamage: core.dmg,
    castSpeed: shaft.castMult,
    projSpeed: core.speed,
    stamCost: shaft.stamCost,
    elem: core.elem,
    splash: core.splash || 0,
    slow: Boolean(core.slow),
    homing: Boolean(core.homing),
    effectDesc: `${core.desc} (${shaft.label} shaft: ${shaft.castMult}x cast speed, ${shaft.stamCost} stamina/cast).`,
    color: shaft.color,
    glow: core.color,
    durability: maxDur,
    maxDurability: maxDur,
  };
}

export function getDurabilityRatio(item) {
  if (!item || item.maxDurability <= 0) return 0;
  return Math.max(0, Math.min(1, item.durability / item.maxDurability));
}

export function getConditionLabel(item) {
  const r = getDurabilityRatio(item);
  if (r <= 0) return 'BROKEN';
  if (r < 0.25) return 'Cracked';
  if (r < 0.6) return 'Worn';
  return 'Fine';
}

export function getEffectivenessMultiplier(item) {
  const r = getDurabilityRatio(item);
  if (r <= 0) return 0;
  if (r < 0.25) return 0.55;
  if (r < 0.6) return 0.8;
  return 1.0;
}

export function computeCraftCost(category, partA, partB, partC) {
  const cost = {};
  const addCost = (obj) => {
    if (!obj) return;
    for (const [k, v] of Object.entries(obj)) {
      cost[k] = (cost[k] || 0) + v;
    }
  };
  if (category === 'blade') {
    addCost(BLADE_MATERIALS[partA]?.cost);
    addCost(BLADE_STYLES[partB]?.cost);
    addCost(BLADE_ENCHANTS[partC]?.cost);
  } else if (category === 'armor') {
    addCost(ARMOR_PLATES[partA]?.cost);
    addCost(ARMOR_RUNES[partB]?.cost);
  } else if (category === 'wand') {
    addCost(WAND_CORES[partA]?.cost);
    addCost(WAND_SHAFTS[partB]?.cost);
  }
  return cost;
}

export function getRepairCost(item) {
  const missingRatio = 1 - getDurabilityRatio(item);
  if (missingRatio <= 0.02) return {};
  const tier = item.maxDurability >= 140 ? 2 : 1;
  if (item.category === 'blade') {
    return { ironOre: Math.max(1, Math.ceil(missingRatio * 2 * tier)) };
  }
  if (item.category === 'armor') {
    return { ironOre: Math.max(1, Math.ceil(missingRatio * 2 * tier)), wood: 1 };
  }
  return { crystal: Math.max(1, Math.ceil(missingRatio * 1.5 * tier)), wood: 1 };
}

export function canAfford(materials, cost) {
  for (const [k, v] of Object.entries(cost)) {
    if ((materials[k] || 0) < v) return false;
  }
  return true;
}

export function spendMaterials(materials, cost) {
  for (const [k, v] of Object.entries(cost)) {
    materials[k] = Math.max(0, (materials[k] || 0) - v);
  }
}
