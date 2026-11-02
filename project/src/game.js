
import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Procedural Web Audio Synthesizer for "Little Brick Adventure" CRPG

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Crisp plastic Brick stud click when walking or selecting
  playBrickStep(pitchOffset = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = 520 + pitchOffset * 35;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.045);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  // Dice clatter on plastic tabletop
  playDiceRoll() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const bounces = [0, 0.07, 0.14, 0.22, 0.31, 0.42];
    bounces.forEach((delay, idx) => {
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(680 + Math.random() * 420 - idx * 45, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.035);

      const vol = Math.max(0.03, 0.14 - idx * 0.02);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    });
  }

  // Dice outcome sound (Success / Crit / Fail)
  playDiceResult(success, isCrit = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (isCrit) {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        this._tone(freq, now + i * 0.06, 0.22, 'triangle', 0.18);
      });
    } else if (success) {
      this._tone(523.25, now, 0.12, 'triangle', 0.15);
      this._tone(659.25, now + 0.08, 0.18, 'triangle', 0.16);
    } else {
      this._tone(293.66, now, 0.15, 'sawtooth', 0.11);
      this._tone(220.0, now + 0.11, 0.22, 'sawtooth', 0.11);
    }
  }

  // Fairy Wand sparkle spell
  playWandSpell() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const sparkleNotes = [784, 987.77, 1174.66, 1567.98, 1975.53];
    sparkleNotes.forEach((freq, i) => {
      this._tone(freq, now + i * 0.045, 0.18, 'sine', 0.13);
    });
  }

  // Magic Sword slash / sonic wave
  playSwordSlash(isSonic = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isSonic ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isSonic ? 620 : 440, now);
    osc.frequency.exponentialRampToValueAtTime(isSonic ? 180 : 95, now + 0.22);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Killer Frog ribbit / splash
  playFrogCroak() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.12].forEach((offset, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140 + i * 30, now + offset);
      osc.frequency.linearRampToValueAtTime(250 + i * 40, now + offset + 0.08);
      gain.gain.setValueAtTime(0.13, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.11);
    });
  }

  // Mole Monster subterranean burrow rumble
  playMoleRumble() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.28);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);
  }

  // Treasure collected chime
  playTreasureCollect(type = 'ruby') {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = {
      ruby: [659.25, 830.61, 987.77, 1318.51],
      gold: [523.25, 659.25, 783.99, 1046.5, 1318.51],
      flower: [587.33, 739.99, 880, 1174.66]
    };
    const notes = chords[type] || chords.ruby;
    notes.forEach((f, idx) => {
      this._tone(f, now + idx * 0.055, 0.24, 'sine', 0.16);
    });
  }

  _tone(freq, startTime, duration, type = 'sine', volume = 0.15) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }
}

const sound = new SoundManager();


// 32x32 Brick Baseplate World Layout, Procedural Dungeon Generator & CRPG Definitions

const GRID_SIZE = 32; // 32x32 green Brick baseplate (0..31 on X and Z)

const TERRAIN = {
  GRASS: 'GRASS',
  BRIDGE: 'BRIDGE',
  WATER: 'WATER',
  GARDEN: 'GARDEN'
};

const DIFFICULTY_LEVELS = {
  easy: {
    id: 'easy',
    name: 'Easy',
    badge: '🟢 Easy (Cozy Adventure)',
    heroRollBonus: 2,
    heroBonusHp: 8,
    heroBonusAp: 1,
    monsterDcOffset: -2,
    monsterHpMult: 0.75,
    monsterAtkOffset: -1,
    monsterDmgOffset: -1,
    waterHazardDC: 8,
    waterHazardDmg: 1,
    extraMonsters: false,
    desc: 'Heroes gain +2 to all d20 rolls, +8 HP, and +1 AP per round. Monsters have -2 DC and 75% HP.'
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    badge: '🟡 Medium (Standard CRPG)',
    heroRollBonus: 0,
    heroBonusHp: 0,
    heroBonusAp: 0,
    monsterDcOffset: 0,
    monsterHpMult: 1.0,
    monsterAtkOffset: 0,
    monsterDmgOffset: 0,
    waterHazardDC: 11,
    waterHazardDmg: 2,
    extraMonsters: false,
    desc: 'Balanced tactical CRPG rules with standard Monster Difficulty Classes (DC 11–13) and 4 AP per hero.'
  },
  hard: {
    id: 'hard',
    name: 'Hard',
    badge: '🔴 Hard (Tactical Master)',
    heroRollBonus: -1,
    heroBonusHp: 0,
    heroBonusAp: 0,
    monsterDcOffset: 2,
    monsterHpMult: 1.35,
    monsterAtkOffset: 2,
    monsterDmgOffset: 2,
    waterHazardDC: 13,
    waterHazardDmg: 3,
    extraMonsters: true,
    desc: 'Monsters have +2 Target DC, +2 Attack Bonus, 135% HP, +2 Damage, and extra Elite Frog & Mole guardians spawn!'
  }
};

const PARTY_MODES = {
  both: {
    id: 'both',
    name: 'Fairy Mage & Sword Knight (Full Party)',
    shortLabel: '👫 Fairy Mage & Sword Knight',
    heroes: ['fairy_mage', 'sword_knight'],
    soloBonusAp: 0,
    soloBonusHp: 0,
    desc: 'Control both Fairy Mage (Fairy Wand Mage) and Sword Knight (Magic Sword Paladin) in tactical synergy.'
  },
  solo_mage: {
    id: 'solo_mage',
    name: 'Solo: Fairy Mage Only (Fairy Wand)',
    shortLabel: '🪄 Solo: Fairy Mage',
    heroes: ['fairy_mage'],
    soloBonusAp: 1,
    soloBonusHp: 8,
    desc: 'Play exclusively as Fairy Mage! Grants Solo Adventurer Blessing (+1 Max AP & +8 Max HP).'
  },
  solo_knight: {
    id: 'solo_knight',
    name: 'Solo: Sword Knight Only (Magic Sword)',
    shortLabel: '⚔️ Solo: Sword Knight',
    heroes: ['sword_knight'],
    soloBonusAp: 1,
    soloBonusHp: 8,
    desc: 'Play exclusively as Sword Knight! Grants Solo Adventurer Blessing (+1 Max AP & +8 Max HP).'
  }
};

// ============================================================================
// 10 WIN CONDITION ARCHETYPES & GENERATOR
// ============================================================================
const WIN_CONDITION_OPTIONS = [
  { id: 'random', label: '🎲 Randomize Win Condition (Any of 1–10)' },
  { id: '1_defeat_all_enemies', label: '1. Defeat all enemies' },
  { id: '2_defeat_x_enemies', label: '2. Defeat X number of enemies' },
  { id: '3_defeat_x_enemy_type', label: '3. Defeat X number of enemy type Y' },
  { id: '4_defeat_all_enemy_type', label: '4. Defeat all enemies of enemy type Y' },
  { id: '5_collect_all_treasure', label: '5. Collect all of the treasure' },
  { id: '6_collect_x_treasure', label: '6. Collect X amount of treasure' },
  { id: '7_collect_x_treasure_type', label: '7. Collect X amount of treasure type Y' },
  { id: '8_collect_all_treasure_type', label: '8. Collect all of treasure type Y' },
  { id: '9_defeat_x_and_collect_y', label: '9. Defeat X enemies & collect Y treasure' },
  { id: '10_defeat_x_type_and_collect_z_type', label: '10. Defeat X of enemy Y & collect Z of treasure A' }
];

const ENEMY_TYPE_META = {
  frog: { kind: 'frog', plural: 'Killer Frogs', singular: 'Killer Frog', icon: '🐸' },
  mole: { kind: 'mole', plural: 'Mole Monsters', singular: 'Mole Monster', icon: '🐾' }
};

const TREASURE_TYPE_META = {
  ruby: { category: 'ruby', plural: 'Glowing Rubies', singular: 'Glowing Ruby', icon: '🔴' },
  gold: { category: 'gold', plural: 'Gold Bricks', singular: 'Gold Brick', icon: '🟨' },
  flower: { category: 'flower', plural: 'Jewel Flowers', singular: 'Jewel Flower', icon: '🌸' }
};

function createWinCondition(optionId, monsters, treasures) {
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + Math.min(min, max);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const allSpecificIds = WIN_CONDITION_OPTIONS.filter((o) => o.id !== 'random').map((o) => o.id);
  const chosenId = optionId === 'random' ? pick(allSpecificIds) : optionId;

  const totalMonsters = monsters.length;
  const totalTreasures = treasures.length;
  const countMonstersByKind = (k) => monsters.filter((m) => m.kind === k).length;
  const countTreasuresByCat = (c) => treasures.filter((t) => t.category === c).length;

  switch (chosenId) {
    case '1_defeat_all_enemies': {
      return {
        id: chosenId,
        code: '#1',
        title: `Defeat all ${totalMonsters} enemies`,
        evaluate(currMonsters) {
          const done = currMonsters.filter((m) => !m.alive).length;
          return {
            complete: done >= totalMonsters,
            progressText: `⚔️ Enemies Defeated: ${done}/${totalMonsters}`,
            pct: Math.min(100, Math.round((done / totalMonsters) * 100))
          };
        }
      };
    }

    case '2_defeat_x_enemies': {
      const targetX = randInt(2, Math.max(2, totalMonsters - 1));
      return {
        id: chosenId,
        code: '#2',
        title: `Defeat ${targetX} enemies`,
        evaluate(currMonsters) {
          const done = currMonsters.filter((m) => !m.alive).length;
          return {
            complete: done >= targetX,
            progressText: `⚔️ Enemies Defeated: ${Math.min(done, targetX)}/${targetX}`,
            pct: Math.min(100, Math.round((Math.min(done, targetX) / targetX) * 100))
          };
        }
      };
    }

    case '3_defeat_x_enemy_type': {
      const eMeta = pick([ENEMY_TYPE_META.frog, ENEMY_TYPE_META.mole]);
      const available = countMonstersByKind(eMeta.kind);
      const targetX = randInt(1, Math.max(1, available - 1));
      const label = targetX === 1 ? eMeta.singular : eMeta.plural;
      return {
        id: chosenId,
        code: '#3',
        title: `Defeat ${targetX} ${label}`,
        evaluate(currMonsters) {
          const done = currMonsters.filter((m) => m.kind === eMeta.kind && !m.alive).length;
          return {
            complete: done >= targetX,
            progressText: `${eMeta.icon} ${eMeta.plural} Defeated: ${Math.min(done, targetX)}/${targetX}`,
            pct: Math.min(100, Math.round((Math.min(done, targetX) / targetX) * 100))
          };
        }
      };
    }

    case '4_defeat_all_enemy_type': {
      const eMeta = pick([ENEMY_TYPE_META.frog, ENEMY_TYPE_META.mole]);
      const targetX = countMonstersByKind(eMeta.kind);
      return {
        id: chosenId,
        code: '#4',
        title: `Defeat all ${targetX} ${eMeta.plural}`,
        evaluate(currMonsters) {
          const done = currMonsters.filter((m) => m.kind === eMeta.kind && !m.alive).length;
          return {
            complete: done >= targetX,
            progressText: `${eMeta.icon} All ${eMeta.plural}: ${done}/${targetX}`,
            pct: Math.min(100, Math.round((done / targetX) * 100))
          };
        }
      };
    }

    case '5_collect_all_treasure': {
      return {
        id: chosenId,
        code: '#5',
        title: `Collect all ${totalTreasures} treasures`,
        evaluate(_currMonsters, currTreasures) {
          const done = currTreasures.filter((t) => t.collected).length;
          return {
            complete: done >= totalTreasures,
            progressText: `💎 Treasures Collected: ${done}/${totalTreasures}`,
            pct: Math.min(100, Math.round((done / totalTreasures) * 100))
          };
        }
      };
    }

    case '6_collect_x_treasure': {
      const targetX = randInt(7, Math.max(8, totalTreasures - 5));
      return {
        id: chosenId,
        code: '#6',
        title: `Collect ${targetX} treasures`,
        evaluate(_currMonsters, currTreasures) {
          const done = currTreasures.filter((t) => t.collected).length;
          return {
            complete: done >= targetX,
            progressText: `💎 Treasures Collected: ${Math.min(done, targetX)}/${targetX}`,
            pct: Math.min(100, Math.round((Math.min(done, targetX) / targetX) * 100))
          };
        }
      };
    }

    case '7_collect_x_treasure_type': {
      const tMeta = pick([
        TREASURE_TYPE_META.ruby,
        TREASURE_TYPE_META.gold,
        TREASURE_TYPE_META.flower
      ]);
      const available = countTreasuresByCat(tMeta.category);
      const targetX = randInt(Math.max(1, Math.floor(available / 2)), Math.max(1, available - 1));
      const label = targetX === 1 ? tMeta.singular : tMeta.plural;
      return {
        id: chosenId,
        code: '#7',
        title: `Collect ${targetX} ${label}`,
        evaluate(_currMonsters, currTreasures) {
          const done = currTreasures.filter(
            (t) => t.category === tMeta.category && t.collected
          ).length;
          return {
            complete: done >= targetX,
            progressText: `${tMeta.icon} ${tMeta.plural}: ${Math.min(done, targetX)}/${targetX}`,
            pct: Math.min(100, Math.round((Math.min(done, targetX) / targetX) * 100))
          };
        }
      };
    }

    case '8_collect_all_treasure_type': {
      const tMeta = pick([
        TREASURE_TYPE_META.ruby,
        TREASURE_TYPE_META.gold,
        TREASURE_TYPE_META.flower
      ]);
      const targetX = countTreasuresByCat(tMeta.category);
      return {
        id: chosenId,
        code: '#8',
        title: `Collect all ${targetX} ${tMeta.plural}`,
        evaluate(_currMonsters, currTreasures) {
          const done = currTreasures.filter(
            (t) => t.category === tMeta.category && t.collected
          ).length;
          return {
            complete: done >= targetX,
            progressText: `${tMeta.icon} All ${tMeta.plural}: ${done}/${targetX}`,
            pct: Math.min(100, Math.round((done / targetX) * 100))
          };
        }
      };
    }

    case '9_defeat_x_and_collect_y': {
      const targetEnemies = randInt(2, Math.max(2, totalMonsters - 1));
      const targetTreasures = randInt(6, Math.max(7, totalTreasures - 6));
      return {
        id: chosenId,
        code: '#9',
        title: `Defeat ${targetEnemies} enemies & collect ${targetTreasures} treasures`,
        evaluate(currMonsters, currTreasures) {
          const eDone = Math.min(
            targetEnemies,
            currMonsters.filter((m) => !m.alive).length
          );
          const tDone = Math.min(
            targetTreasures,
            currTreasures.filter((t) => t.collected).length
          );
          const pct = Math.round(
            ((eDone / targetEnemies + tDone / targetTreasures) / 2) * 100
          );
          return {
            complete: eDone >= targetEnemies && tDone >= targetTreasures,
            progressText: `⚔️ Enemies: ${eDone}/${targetEnemies} ${eDone >= targetEnemies ? '✅' : ''} • 💎 Treasures: ${tDone}/${targetTreasures} ${tDone >= targetTreasures ? '✅' : ''}`,
            pct
          };
        }
      };
    }

    case '10_defeat_x_type_and_collect_z_type':
    default: {
      const eMeta = pick([ENEMY_TYPE_META.frog, ENEMY_TYPE_META.mole]);
      const tMeta = pick([
        TREASURE_TYPE_META.ruby,
        TREASURE_TYPE_META.gold,
        TREASURE_TYPE_META.flower
      ]);
      const availE = countMonstersByKind(eMeta.kind);
      const availT = countTreasuresByCat(tMeta.category);
      const targetX = randInt(1, Math.max(1, availE));
      const targetZ = randInt(Math.max(1, Math.floor(availT / 2)), Math.max(1, availT));
      const eLabel = targetX === 1 ? eMeta.singular : eMeta.plural;
      const tLabel = targetZ === 1 ? tMeta.singular : tMeta.plural;
      return {
        id: '10_defeat_x_type_and_collect_z_type',
        code: '#10',
        title: `Defeat ${targetX} ${eLabel} & collect ${targetZ} ${tLabel}`,
        evaluate(currMonsters, currTreasures) {
          const eDone = Math.min(
            targetX,
            currMonsters.filter((m) => m.kind === eMeta.kind && !m.alive).length
          );
          const tDone = Math.min(
            targetZ,
            currTreasures.filter(
              (t) => t.category === tMeta.category && t.collected
            ).length
          );
          const pct = Math.round(((eDone / targetX + tDone / targetZ) / 2) * 100);
          return {
            complete: eDone >= targetX && tDone >= targetZ,
            progressText: `${eMeta.icon} ${eMeta.plural}: ${eDone}/${targetX} ${eDone >= targetX ? '✅' : ''} • ${tMeta.icon} ${tMeta.plural}: ${tDone}/${targetZ} ${tDone >= targetZ ? '✅' : ''}`,
            pct
          };
        }
      };
    }
  }
}

// Active World Layout State (holds tile grid, bridge/water/garden rectangles, treasures, props, monsters, hero spawns)
let activeWorld = null;

// Query terrain info from the currently active world layout
function getTileInfo(x, z, hazardDCOverride = null) {
  const gx = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(x)));
  const gz = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(z)));

  if (!activeWorld || !activeWorld.grid) {
    return {
      type: TERRAIN.GRASS,
      elevation: 0.0,
      moveCost: 1,
      hazardDC: 0,
      label: 'Green Brick Baseplate'
    };
  }

  const cell = activeWorld.grid[gx][gz];
  if (cell === TERRAIN.BRIDGE) {
    return {
      type: TERRAIN.BRIDGE,
      elevation: 0.72,
      moveCost: 1,
      hazardDC: 0,
      label: 'Grey Brick Bridge (+1 High Ground Bonus)'
    };
  }
  if (cell === 'GOLD_BANK') {
    return {
      type: TERRAIN.GRASS,
      elevation: 0.32,
      moveCost: 1,
      hazardDC: 0,
      label: 'Golden Stepping Bank'
    };
  }
  if (cell === TERRAIN.WATER) {
    const dc = hazardDCOverride ?? 11;
    return {
      type: TERRAIN.WATER,
      elevation: 0.24,
      moveCost: 2,
      hazardDC: dc,
      label: `Dangerous Frog Water (Hazard DC ${dc})`
    };
  }
  if (cell === TERRAIN.GARDEN) {
    return {
      type: TERRAIN.GARDEN,
      elevation: 0.32,
      moveCost: 1,
      hazardDC: 0,
      label: 'Mole Monster Garden Bed'
    };
  }

  return {
    type: TERRAIN.GRASS,
    elevation: 0.0,
    moveCost: 1,
    hazardDC: 0,
    label: 'Green Brick Baseplate'
  };
}

function createEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => TERRAIN.GRASS)
  );
}

// ============================================================================
// Generic procedural public scene.
// ============================================================================
function generateStarterWorldLayout() {
  const previousRandom = Math.random;
  let seed = 20261101;
  Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  try {
    generateRandomDungeonLayout();
    activeWorld.mode = 'starter';
    activeWorld.name = 'Crystal Garden';
    return activeWorld;
  } finally { Math.random = previousRandom; }
}

// ============================================================================
// 2. PROCEDURAL RANDOM BRICK DUNGEON GENERATOR (Same Bricks & Enemies, New Layouts!)
// ============================================================================
function generateRandomDungeonLayout() {
  const grid = createEmptyGrid();
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const themes = [
    {
      name: 'Twin River Crossing Dungeon',
      type: 'twin_bridges'
    },
    {
      name: 'Sunken Frog Citadel Dungeon',
      type: 'citadel_moat'
    },
    {
      name: 'Winding Canyon Bridge Dungeon',
      type: 'winding_bridge'
    },
    {
      name: 'Grand Crossroads Lagoon Dungeon',
      type: 'crossroads'
    }
  ];

  const theme = pick(themes);
  const bridgeTiles = [];
  const waterTiles = [];
  const gardenTiles = [];

  // 1. Construct Water Pools & Grey Brick Bridges according to the selected dungeon configuration
  if (theme.type === 'twin_bridges') {
    const waterZ = randInt(11, 14);
    for (let x = 3; x <= 28; x++) {
      for (let z = waterZ; z <= waterZ + 7; z++) {
        grid[x][z] = TERRAIN.WATER;
      }
    }
    // Left Bridge & Right Bridge (each 3 studs wide)
    const b1X = randInt(7, 10);
    const b2X = randInt(20, 23);
    for (let z = waterZ - 2; z <= waterZ + 9; z++) {
      for (let dx = 0; dx < 3; dx++) {
        grid[b1X + dx][z] = TERRAIN.BRIDGE;
        grid[b2X + dx][z] = TERRAIN.BRIDGE;
      }
    }
  } else if (theme.type === 'citadel_moat') {
    // Central island moat of blue frog water with L-shaped or cross grey bridges
    for (let x = 9; x <= 22; x++) {
      for (let z = 10; z <= 22; z++) {
        grid[x][z] = TERRAIN.WATER;
      }
    }
    // North-South Bridge through center
    const midX = randInt(14, 16);
    for (let z = 8; z <= 24; z++) {
      for (let dx = 0; dx < 4; dx++) {
        grid[midX + dx][z] = TERRAIN.BRIDGE;
      }
    }
    // East-West Spur Bridge
    const midZ = randInt(15, 17);
    for (let x = 7; x <= 24; x++) {
      for (let dz = 0; dz < 3; dz++) {
        grid[x][midZ + dz] = TERRAIN.BRIDGE;
      }
    }
  } else if (theme.type === 'winding_bridge') {
    // Diagonal/stepped water lagoon & Z-shaped grey brick bridge
    const wStartX = randInt(10, 13);
    for (let x = wStartX; x <= wStartX + 13; x++) {
      for (let z = 9; z <= 21; z++) {
        grid[x][z] = TERRAIN.WATER;
      }
    }
    // Upper span
    for (let z = 7; z <= 15; z++) {
      for (let x = wStartX + 2; x <= wStartX + 5; x++) {
        grid[x][z] = TERRAIN.BRIDGE;
      }
    }
    // Connecting middle span
    for (let x = wStartX + 2; x <= wStartX + 10; x++) {
      for (let z = 14; z <= 16; z++) {
        grid[x][z] = TERRAIN.BRIDGE;
      }
    }
    // Lower span
    for (let z = 14; z <= 23; z++) {
      for (let x = wStartX + 7; x <= wStartX + 10; x++) {
        grid[x][z] = TERRAIN.BRIDGE;
      }
    }
  } else {
    // Grand Crossroads Lagoon
    const cx = randInt(12, 15);
    const cz = randInt(12, 15);
    for (let x = cx - 6; x <= cx + 9; x++) {
      for (let z = cz - 4; z <= cz + 6; z++) {
        grid[x][z] = TERRAIN.WATER;
      }
    }
    for (let z = cz - 6; z <= cz + 8; z++) {
      for (let x = cx; x <= cx + 3; x++) grid[x][z] = TERRAIN.BRIDGE;
    }
    for (let x = cx - 8; x <= cx + 11; x++) {
      for (let z = cz; z <= cz + 2; z++) grid[x][z] = TERRAIN.BRIDGE;
    }
  }

  // 2. Construct Two Raised Reddish-Brown Mole Gardens in different quadrants!
  const gardenConfigs = [
    { x0: randInt(1, 4), z0: randInt(22, 24), w: 7, h: 7 },
    { x0: randInt(22, 24), z0: randInt(22, 24), w: 6, h: 6 }
  ];
  // Randomly swap one garden to the upper-left or upper-right flank
  if (Math.random() < 0.5) {
    gardenConfigs[1] = { x0: randInt(2, 5), z0: randInt(5, 7), w: 6, h: 6 };
  }

  gardenConfigs.forEach((g) => {
    for (let x = g.x0; x < g.x0 + g.w; x++) {
      for (let z = g.z0; z < g.z0 + g.h; z++) {
        if (x >= 1 && x < GRID_SIZE - 1 && z >= 4 && z < GRID_SIZE - 1) {
          if (grid[x][z] === TERRAIN.GRASS) {
            grid[x][z] = TERRAIN.GARDEN;
          }
        }
      }
    }
  });

  // Collect tile lists for placement
  const grassTiles = [];
  for (let x = 2; x < GRID_SIZE - 2; x++) {
    for (let z = 5; z < GRID_SIZE - 2; z++) {
      if (grid[x][z] === TERRAIN.BRIDGE) bridgeTiles.push({ x, z });
      else if (grid[x][z] === TERRAIN.WATER) waterTiles.push({ x, z });
      else if (grid[x][z] === TERRAIN.GARDEN) gardenTiles.push({ x, z });
      else if (grid[x][z] === TERRAIN.GRASS) grassTiles.push({ x, z });
    }
  }

  // Helper to claim unique tiles
  const usedKeys = new Set(['16,1', '19,1', '15,1', '20,1']);
  const claimTile = (pool, fallbackPool = grassTiles) => {
    const candidates = pool.filter((t) => !usedKeys.has(`${t.x},${t.z}`));
    const chosen =
      candidates.length > 0
        ? pick(candidates)
        : pick(fallbackPool.filter((t) => !usedKeys.has(`${t.x},${t.z}`)));
    if (!chosen) return { x: randInt(4, 27), z: randInt(6, 28) };
    // Mark surrounding 1-stud buffer for spacing
    usedKeys.add(`${chosen.x},${chosen.z}`);
    return chosen;
  };

  // 3. Place the 21 Collectible Treasures (same exact 11 Rubies/Gems, 3 Gold Bricks, 7 Jewel Flowers!)
  const treasures = [];

  // 4 Rubies on the Grey Bridge
  for (let i = 1; i <= 4; i++) {
    const pos = claimTile(bridgeTiles);
    treasures.push({
      id: `ruby-bridge-${i}`,
      category: 'ruby',
      subtype: 'crimson',
      name: `Bridge Vault Ruby #${i}`,
      x: pos.x,
      z: pos.z,
      points: 100
    });
  }

  // 3 Rubies/Amber Gems in the Brown Mole Gardens
  for (let i = 1; i <= 3; i++) {
    const pos = claimTile(gardenTiles);
    const isAmber = i === 2;
    treasures.push({
      id: `ruby-garden-${i}`,
      category: 'ruby',
      subtype: isAmber ? 'amber' : 'crimson',
      name: isAmber ? 'Garden Topaz Brick' : `Garden Soil Ruby #${i}`,
      x: pos.x,
      z: pos.z,
      points: 120
    });
  }

  // 4 Rubies/Amber Gems across the Green Baseplate & Water Edges
  for (let i = 1; i <= 4; i++) {
    const pos = claimTile(grassTiles);
    const isAmber = i === 1;
    treasures.push({
      id: `ruby-lawn-${i}`,
      category: 'ruby',
      subtype: isAmber ? 'amber' : 'crimson',
      name: isAmber ? 'Forest Bush Amber Gem' : `Meadow Ruby #${i}`,
      x: pos.x,
      z: pos.z,
      points: 110
    });
  }

  // 3 Pearl-Gold 2x2 Sloped Bricks (2 near water/bridge, 1 near garden)
  for (let i = 1; i <= 3; i++) {
    const pool = i <= 2 ? waterTiles : gardenTiles;
    const pos = claimTile(pool);
    grid[pos.x][pos.z] = 'GOLD_BANK';
    treasures.push({
      id: `gold-brick-${i}`,
      category: 'gold',
      name: i <= 2 ? `Lagoon Bank Gold Brick #${i}` : 'Garden Gate Gold Brick',
      x: pos.x,
      z: pos.z,
      points: 250
    });
  }

  // 7 Jewel-Encrusted Flowers (4 in gardens, 3 across lawn)
  const flowerConfigs = [
    { pool: gardenTiles, petalColor: '#ff6b4a', gemColor: '#ffe66d', name: 'Coral Ruby-Petal Bloom' },
    { pool: gardenTiles, petalColor: '#ff6b4a', gemColor: '#72efdd', name: 'Coral Ember-Jewel Bloom' },
    { pool: gardenTiles, petalColor: '#ffd60a', gemColor: '#ff2a5f', name: 'Garden Crown Blossom' },
    { pool: gardenTiles, petalColor: '#ffd60a', gemColor: '#c77dff', name: 'Golden Amethyst Flower' },
    { pool: grassTiles, petalColor: '#ffd60a', gemColor: '#ff3b8b', name: 'Sunburst Jewel Flower' },
    { pool: grassTiles, petalColor: '#ffd60a', gemColor: '#00f5d4', name: 'Meadow Starlight Flower' },
    { pool: grassTiles, petalColor: '#ffd60a', gemColor: '#ff4d6d', name: 'Southern Dawn Flower' }
  ];

  flowerConfigs.forEach((fc, idx) => {
    const pos = claimTile(fc.pool);
    treasures.push({
      id: `flower-rand-${idx + 1}`,
      category: 'flower',
      petalColor: fc.petalColor,
      gemColor: fc.gemColor,
      name: fc.name,
      x: pos.x,
      z: pos.z,
      points: 165
    });
  });

  // 4. Decorative Brick Plant Bushes & Arcane Fairy Wand Shrine
  const shrinePos = claimTile(
    grassTiles.filter((t) => t.z >= 5 && t.z <= 12)
  );
  const props = [
    {
      type: 'wand_shrine',
      x: shrinePos.x,
      z: shrinePos.z,
      label: 'Arcane Fairy Totem (+1 Spell Bonus Nearby)'
    }
  ];

  for (let i = 0; i < 6; i++) {
    const p = claimTile(i < 4 ? gardenTiles : grassTiles);
    props.push({
      type: 'plant_frond',
      x: p.x,
      z: p.z,
      rotation: (Math.random() - 0.5) * 2.5
    });
  }

  // 5. Place Killer Frogs in the Water Pools & Mole Monsters in the Brown Gardens
  const f1 = claimTile(waterTiles);
  const f2 = claimTile(waterTiles);
  const f3 = claimTile(waterTiles);
  const m1 = claimTile(gardenTiles);
  const m2 = claimTile(gardenTiles);
  const m3 = claimTile(gardenTiles);

  const monsters = [
    {
      id: 'frog-west',
      kind: 'frog',
      name: 'Lagoon Killer Frog Alpha',
      x: f1.x,
      z: f1.z,
      maxHp: 14,
      hp: 14,
      dc: 11,
      attackBonus: 3,
      attackRange: 4.5,
      moveRange: 3,
      minDmg: 3,
      maxDmg: 6,
      desc: 'Leaps across lily pads and lashes its sticky pink tongue!'
    },
    {
      id: 'frog-east',
      kind: 'frog',
      name: 'Bridge-Guard Killer Frog',
      x: f2.x,
      z: f2.z,
      maxHp: 14,
      hp: 14,
      dc: 11,
      attackBonus: 3,
      attackRange: 4.5,
      moveRange: 3,
      minDmg: 3,
      maxDmg: 6,
      desc: 'Patrols the dungeon moat near the grey bridge.'
    },
    {
      id: 'frog-south',
      kind: 'frog',
      name: 'Bullfrog Sentinel',
      x: f3.x,
      z: f3.z,
      maxHp: 16,
      hp: 16,
      dc: 12,
      attackBonus: 4,
      attackRange: 4.5,
      moveRange: 3,
      minDmg: 4,
      maxDmg: 7,
      desc: 'Elder killer frog guarding the golden stepping bricks.'
    },
    {
      id: 'mole-alpha',
      kind: 'mole',
      name: 'Brambleclaw Mole',
      x: m1.x,
      z: m1.z,
      maxHp: 16,
      hp: 16,
      dc: 12,
      attackBonus: 4,
      attackRange: 2.5,
      moveRange: 4,
      minDmg: 4,
      maxDmg: 7,
      burrowed: true,
      desc: 'Burrows beneath the dungeon garden bed!'
    },
    {
      id: 'mole-beta',
      kind: 'mole',
      name: 'Ruby-Snout Tunnel Mole',
      x: m2.x,
      z: m2.z,
      maxHp: 15,
      hp: 15,
      dc: 11,
      attackBonus: 3,
      attackRange: 2.5,
      moveRange: 4,
      minDmg: 3,
      maxDmg: 6,
      burrowed: true,
      desc: 'Lurks beneath the jewel-encrusted flowers.'
    },
    {
      id: 'mole-king',
      kind: 'mole',
      name: 'King Under-Garden Mole',
      x: m3.x,
      z: m3.z,
      maxHp: 20,
      hp: 20,
      dc: 13,
      attackBonus: 4,
      attackRange: 3.0,
      moveRange: 4,
      minDmg: 4,
      maxDmg: 8,
      burrowed: false,
      desc: 'Chieftain of the subterranean garden moles!'
    }
  ];

  const fElite = claimTile(waterTiles);
  const mElite = claimTile(gardenTiles);
  const extraHardMonsters = [
    {
      id: 'frog-elite',
      kind: 'frog',
      name: 'Crimson Lagoon Toad King',
      x: fElite.x,
      z: fElite.z,
      maxHp: 18,
      hp: 18,
      dc: 12,
      attackBonus: 4,
      attackRange: 4.5,
      moveRange: 3,
      minDmg: 4,
      maxDmg: 7,
      desc: 'Elite killer frog summoned in Hard mode!'
    },
    {
      id: 'mole-elite',
      kind: 'mole',
      name: 'Obsidian Digger Mole',
      x: mElite.x,
      z: mElite.z,
      maxHp: 18,
      hp: 18,
      dc: 12,
      attackBonus: 4,
      attackRange: 2.5,
      moveRange: 4,
      minDmg: 4,
      maxDmg: 7,
      burrowed: true,
      desc: 'Elite subterranean mole patrolling the garden border in Hard mode!'
    }
  ];

  activeWorld = {
    mode: 'random',
    name: theme.name,
    grid,
    heroSpawns: [
      { x: 15, z: 1 },
      { x: 18, z: 1 }
    ],
    wandShrinePos: { x: shrinePos.x, z: shrinePos.z },
    treasures,
    props,
    monsters,
    extraHardMonsters
  };

  return activeWorld;
}

// Initialize default world on module load
generateStarterWorldLayout();

// Playable Heroes (Fairy Mage & Sword Knight)
const HERO_DEFINITIONS = [
  {
    id: 'fairy_mage',
    name: 'Fairy Mage (Fairy Wand Mage)',
    subtitle: 'Crystal Robe Enchanter',
    role: 'Long-Range Spellcaster & Healer',
    x: 16,
    z: 1,
    maxHp: 22,
    hp: 22,
    maxAp: 4,
    ap: 4,
    moveRange: 6,
    armorDC: 12,
    accentColor: '#e066ff',
    stats: {
      ARCANA: 4,
      LUCK: 3,
      ACROBATICS: 3,
      MIGHT: 1
    },
    abilities: [
      {
        id: 'move',
        name: 'Move',
        icon: '👣',
        apCost: 1,
        range: 6,
        type: 'movement',
        stat: 'ACROBATICS',
        desc: 'Walk up to 6 Brick studs across the baseplate (1 AP).'
      },
      {
        id: 'starlight_bolt',
        name: 'Starlight Bolt',
        icon: '🪄',
        apCost: 2,
        range: 9,
        type: 'ranged_spell',
        stat: 'ARCANA',
        damageDice: '1d8 + 3',
        minDmg: 4,
        maxDmg: 11,
        desc: 'Long-range fairy wand beam (Range 9 studs). Rolls 1d20 + ARCANA (+4) vs Monster DC. Can snipe Killer Frogs safely from afar!'
      },
      {
        id: 'unicorn_nova',
        name: 'Crystal Starburst',
        icon: '🦄',
        apCost: 3,
        range: 7,
        aoeRadius: 2,
        type: 'aoe_spell',
        stat: 'ARCANA',
        damageDice: '1d6 + 3',
        minDmg: 4,
        maxDmg: 9,
        healAmount: 4,
        desc: 'Unleashes unicorn magic in a 2-stud burst (Range 7). Rolls 1d20 + ARCANA (+4) vs DC, unearths burrowed Moles, and heals allies for +4 HP!'
      },
      {
        id: 'pixie_blessing',
        name: 'Fairy Ward & Heal',
        icon: '✨',
        apCost: 2,
        range: 6,
        type: 'support',
        stat: 'LUCK',
        checkDC: 9,
        healAmount: 6,
        desc: 'Rolls 1d20 + LUCK (+3) vs DC 9 to restore 6 HP and grant +2 Armor DC for 1 round.'
      }
    ]
  },
  {
    id: 'sword_knight',
    name: 'Sword Knight (Magic Sword Paladin)',
    subtitle: 'Ember Armor Blade Master',
    role: 'Frontline Warrior & Earthshaker',
    x: 19,
    z: 1,
    maxHp: 28,
    hp: 28,
    maxAp: 4,
    ap: 4,
    moveRange: 6,
    armorDC: 13,
    accentColor: '#00f5d4',
    stats: {
      MIGHT: 4,
      ATHLETICS: 4,
      FORTITUDE: 3,
      ARCANA: 2
    },
    abilities: [
      {
        id: 'move',
        name: 'Move',
        icon: '👣',
        apCost: 1,
        range: 6,
        type: 'movement',
        stat: 'ATHLETICS',
        desc: 'Stride up to 6 Brick studs across the baseplate (1 AP).'
      },
      {
        id: 'magic_sword_slash',
        name: 'Magic Sword Cleave',
        icon: '⚔️',
        apCost: 2,
        range: 2.5,
        type: 'melee_attack',
        stat: 'MIGHT',
        damageDice: '1d10 + 4',
        minDmg: 5,
        maxDmg: 14,
        desc: 'Powerful close-quarters magic blade slash (Range 2 studs). Rolls 1d20 + MIGHT (+4) vs Monster DC for heavy damage!'
      },
      {
        id: 'sonic_blade_wave',
        name: 'Resonant Sonic Wave',
        icon: '🌊',
        apCost: 2,
        range: 5.5,
        type: 'ranged_slash',
        stat: 'MIGHT',
        damageDice: '1d8 + 2',
        minDmg: 3,
        maxDmg: 10,
        desc: 'Channels hoodie equalizer energy into a crescent sword beam (Range 5 studs). Rolls 1d20 + MIGHT (+4) vs Monster DC!'
      },
      {
        id: 'earthshaker_slam',
        name: 'Baseplate Tremor Slam',
        icon: '🛡️',
        apCost: 2,
        range: 3.5,
        type: 'slam_utility',
        stat: 'ATHLETICS',
        damageDice: '1d6 + 3',
        minDmg: 4,
        maxDmg: 9,
        desc: 'Slams the Brick studs (Range 3). Rolls 1d20 + ATHLETICS (+4) vs DC to force burrowed Mole Monsters out of the dirt and stun them!'
      }
    ]
  }
];



// Convert grid coordinates (0..31, 0..31) to 3D world coordinates centered around (0, y, 0)
function gridToWorld(gx, gz) {
  const tile = getTileInfo(Math.round(gx), Math.round(gz));
  return new THREE.Vector3(
    gx - GRID_SIZE / 2 + 0.5,
    tile.elevation,
    gz - GRID_SIZE / 2 + 0.5
  );
}

// Shared geometries for Brick studs & bricks
const studGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.16, 20);
studGeo.translate(0, 0.08, 0);

// Glossy ABS Plastic Material Factory
function createBrickMaterial(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: opts.roughness ?? 0.22,
    metalness: opts.metalness ?? 0.04,
    clearcoat: opts.clearcoat ?? 0.65,
    clearcoatRoughness: 0.15,
    ...opts
  });
}

// Translucent glowing Brick Gem / Wand Material
function createTransMaterial(color, emissiveColor, emissiveIntensity = 0.55) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(emissiveColor || color),
    emissiveIntensity,
    roughness: 0.08,
    metalness: 0.05,
    transmission: 0.72,
    transparent: true,
    opacity: 0.9,
    ior: 1.58,
    clearcoat: 1.0
  });
}

// Generic procedural public scene.
function createCarpetTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c8baae';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 24000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = 175 + Math.floor(Math.random() * 45);
    ctx.fillStyle = `rgb(${shade + 12}, ${shade + 2}, ${shade - 8})`;
    ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

const sharedCarpetTex = createCarpetTexture();

// Build or Rebuild the 32x32 Brick Baseplate, Bridge, Water, Garden, and Decorative Foliage from activeWorld
function buildBrickWorldScene(scene, existingGroup = null) {
  if (existingGroup) {
    scene.remove(existingGroup);
  }

  const worldGroup = new THREE.Group();
  worldGroup.name = 'BrickWorldStatic';

  // 1. Surrounding Cozy Carpet Tabletop Surface
  const carpetGeo = new THREE.PlaneGeometry(110, 110);
  carpetGeo.rotateX(-Math.PI / 2);
  const carpetMat = new THREE.MeshStandardMaterial({
    map: sharedCarpetTex,
    roughness: 0.92,
    metalness: 0.0
  });
  const carpetMesh = new THREE.Mesh(carpetGeo, carpetMat);
  carpetMesh.position.y = -0.26;
  carpetMesh.receiveShadow = true;
  worldGroup.add(carpetMesh);

  // 2. Green 32x32 Brick Baseplate Body
  const greenMat = createBrickMaterial('#008542', { roughness: 0.24 });
  const basePlateGeo = new THREE.BoxGeometry(GRID_SIZE + 0.15, 0.25, GRID_SIZE + 0.15);
  const basePlateMesh = new THREE.Mesh(basePlateGeo, greenMat);
  basePlateMesh.position.set(0, -0.125, 0);
  basePlateMesh.receiveShadow = true;
  basePlateMesh.castShadow = true;
  worldGroup.add(basePlateMesh);

  // Generic procedural public scene.
  const waterMat = createBrickMaterial('#0055bf', {
    roughness: 0.12,
    clearcoat: 0.95
  });
  const bridgeMat = createBrickMaterial('#a0a5a9', { roughness: 0.22 });
  const brownMat = createBrickMaterial('#5f3118', { roughness: 0.28 });

  const waterTileGeo = new THREE.BoxGeometry(1.0, 0.24, 1.0);
  const bridgeTileGeo = new THREE.BoxGeometry(1.0, 0.72, 1.0);
  const gardenTileGeo = new THREE.BoxGeometry(1.0, 0.32, 1.0);

  const grassStuds = [];
  const bridgeStuds = [];
  const waterStuds = [];
  const gardenStuds = [];

  const waterBoxes = [];
  const bridgeBoxes = [];
  const gardenBoxes = [];

  for (let x = 0; x < GRID_SIZE; x++) {
    for (let z = 0; z < GRID_SIZE; z++) {
      const cell = activeWorld?.grid?.[x]?.[z] || TERRAIN.GRASS;
      const info = getTileInfo(x, z);
      const wx = x - GRID_SIZE / 2 + 0.5;
      const wz = z - GRID_SIZE / 2 + 0.5;
      const studPos = new THREE.Vector3(wx, info.elevation, wz);

      if (cell === TERRAIN.BRIDGE) {
        bridgeBoxes.push(new THREE.Vector3(wx, 0.36, wz));
        bridgeStuds.push(studPos);
      } else if (cell === TERRAIN.WATER || cell === 'GOLD_BANK') {
        waterBoxes.push(new THREE.Vector3(wx, 0.12, wz));
        waterStuds.push(new THREE.Vector3(wx, 0.24, wz));
      } else if (cell === TERRAIN.GARDEN) {
        gardenBoxes.push(new THREE.Vector3(wx, 0.16, wz));
        gardenStuds.push(studPos);
      } else {
        grassStuds.push(studPos);
      }
    }
  }

  const addInstancedMeshes = (geo, mat, positions) => {
    if (positions.length === 0) return;
    const inst = new THREE.InstancedMesh(geo, mat, positions.length);
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    });
    inst.receiveShadow = true;
    inst.castShadow = true;
    worldGroup.add(inst);
  };

  // Add instanced terrain blocks
  addInstancedMeshes(waterTileGeo, waterMat, waterBoxes);
  addInstancedMeshes(bridgeTileGeo, bridgeMat, bridgeBoxes);
  addInstancedMeshes(gardenTileGeo, brownMat, gardenBoxes);

  // Add instanced Brick studs across all 32x32 tiles!
  addInstancedMeshes(studGeo, greenMat, grassStuds);
  addInstancedMeshes(studGeo, bridgeMat, bridgeStuds);
  addInstancedMeshes(studGeo, waterMat, waterStuds);
  addInstancedMeshes(studGeo, brownMat, gardenStuds);

  // 4. Decorative Brick Bushes & Upright Purple Wand Shrine
  const propsList = activeWorld?.props || [];
  propsList.forEach((prop) => {
    if (prop.type === 'wand_shrine') {
      const shrine = createWandShrineMesh();
      const pos = gridToWorld(prop.x, prop.z);
      shrine.position.copy(pos);
      worldGroup.add(shrine);
    } else if (prop.type === 'plant_frond') {
      const bush = createBrickPlantBush(prop.rotation || 0);
      const pos = gridToWorld(prop.x, prop.z);
      bush.position.copy(pos);
      worldGroup.add(bush);
    }
  });

  scene.add(worldGroup);
  return worldGroup;
}

// Generic procedural public scene.
function createWandShrineMesh() {
  const group = new THREE.Group();
  const transPurple = createTransMaterial('#b5179e', '#f72585', 0.7);
  const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.25, 16), transPurple);
  baseRing.position.y = 0.125;
  group.add(baseRing);

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.45, 12), transPurple);
  shaft.position.y = 0.85;
  group.add(shaft);

  const tip = createFivePointStarGeometry(0.32, 0.14, 0.12);
  const tipMesh = new THREE.Mesh(tip, transPurple);
  tipMesh.position.y = 1.65;
  group.add(tipMesh);

  return group;
}

// Create a classic Brick green multi-frond plant piece
function createBrickPlantBush(rotY = 0) {
  const group = new THREE.Group();
  const leafMat = createBrickMaterial('#009e4f', { roughness: 0.2 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 14), leafMat);
  base.position.y = 0.11;
  group.add(base);

  for (let i = 0; i < 4; i++) {
    const frondGroup = new THREE.Group();
    frondGroup.rotation.y = rotY + (i * Math.PI) / 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.42), leafMat);
    blade.position.set(0, 0.62, 0.22);
    blade.rotation.x = 0.38;
    blade.castShadow = true;
    frondGroup.add(blade);

    // Serrated leaf notches
    for (let j = 0; j < 3; j++) {
      const lobe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.22), leafMat);
      lobe.position.set(0, 0.35 + j * 0.28, 0.32 + j * 0.08);
      lobe.rotation.x = 0.65;
      frondGroup.add(lobe);
    }
    group.add(frondGroup);
  }
  return group;
}

// Helper: Extruded 5-Point Star Geometry for the Fairy Wand & Star Effects
function createFivePointStarGeometry(outerR = 0.38, innerR = 0.17, depth = 0.12) {
  const shape = new THREE.Shape();
  const spikes = 5;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.03,
    bevelThickness: 0.03
  });
  geo.center();
  return geo;
}

// ============================================================================
// COLLECTIBLE TREASURE MESH BUILDERS (Glowing Rubies, Gold Bricks, Flowers)
// ============================================================================
function createTreasureMesh(treasure) {
  const group = new THREE.Group();

  if (treasure.category === 'ruby') {
    const isAmber = treasure.subtype === 'amber';
    const mainColor = isAmber ? '#ff9e00' : '#ff1654';
    const glowColor = isAmber ? '#ffbe0b' : '#ff4d6d';
    const gemMat = createTransMaterial(mainColor, glowColor, 0.75);

    if (isAmber) {
      // Translucent orange/amber square 1x1 Brick crystal brick + top stud
      const brick = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.42, 0.76), gemMat);
      brick.position.y = 0.21;
      brick.castShadow = true;
      group.add(brick);

      const topStud = new THREE.Mesh(studGeo, gemMat);
      topStud.position.y = 0.42;
      group.add(topStud);
    } else {
      // Translucent glowing red round 1x1 Brick Ruby stud with inner sparkle core
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.38, 20), gemMat);
      cyl.position.y = 0.19;
      cyl.castShadow = true;
      group.add(cyl);

      const topStud = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.14, 18), gemMat);
      topStud.position.y = 0.44;
      group.add(topStud);

      const coreMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), coreMat);
      core.position.y = 0.25;
      group.add(core);
    }
  } else if (treasure.category === 'gold') {
    // Generic procedural public scene.
    const goldMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#eab308'),
      emissive: new THREE.Color('#854d0e'),
      emissiveIntensity: 0.28,
      metalness: 0.78,
      roughness: 0.22,
      clearcoat: 0.85
    });

    // Base 2x2 footprint (centered on its primary tile)
    const rearBlock = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.62, 0.88), goldMat);
    rearBlock.position.set(0.4, 0.31, -0.2);
    rearBlock.castShadow = true;
    group.add(rearBlock);

    // Sloped front wedge
    const slopeGeo = new THREE.CylinderGeometry(0.62, 0.62, 1.74, 16, 1, false, 0, Math.PI / 2);
    slopeGeo.rotateZ(Math.PI / 2);
    const slopeMesh = new THREE.Mesh(slopeGeo, goldMat);
    slopeMesh.position.set(0.4, 0.0, 0.24);
    slopeMesh.castShadow = true;
    group.add(slopeMesh);

    // Two top Brick studs on the pearl gold brick
    [-0.05, 0.85].forEach((sx) => {
      const s = new THREE.Mesh(studGeo, goldMat);
      s.position.set(sx, 0.62, -0.22);
      group.add(s);
    });
  } else if (treasure.category === 'flower') {
    // Jewel-Encrusted Brick Flower on a Green Leaf Base
    const stemMat = createBrickMaterial('#009e4f');
    const petalMat = createBrickMaterial(treasure.petalColor || '#ffd60a', { roughness: 0.18 });
    const jewelMat = createTransMaterial(treasure.gemColor || '#ff2a85', treasure.gemColor || '#ff2a85', 0.85);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.34, 12), stemMat);
    stem.position.y = 0.17;
    group.add(stem);

    // 3 green leaf blades under the flower
    for (let i = 0; i < 3; i++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.65), stemMat);
      const angle = (i * Math.PI * 2) / 3;
      leaf.position.set(Math.cos(angle) * 0.35, 0.12, Math.sin(angle) * 0.35);
      leaf.rotation.y = -angle + Math.PI / 2;
      leaf.rotation.x = 0.2;
      group.add(leaf);
    }

    // 7 rounded Brick petals around the crown
    const petalCount = treasure.petalColor === '#ff6b4a' ? 3 : 8;
    const petalRadius = petalCount === 3 ? 0.34 : 0.42;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i * Math.PI * 2) / petalCount;
      const pGeo =
        petalCount === 3
          ? new THREE.SphereGeometry(0.24, 12, 10)
          : new THREE.CylinderGeometry(0.16, 0.16, 0.14, 12);
      const petal = new THREE.Mesh(pGeo, petalMat);
      petal.position.set(Math.cos(angle) * petalRadius, 0.42, Math.sin(angle) * petalRadius);
      petal.castShadow = true;
      group.add(petal);
    }

    // Sparkling Jewel Center!
    const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), jewelMat);
    jewel.position.y = 0.52;
    group.add(jewel);
  }

  return group;
}

// ============================================================================
// ARTICULATED FANTASY TOY FIGURES
// ============================================================================

// Generic procedural public scene.
function makeHeroTexture(background, knight = false, face = false) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = background; ctx.fillRect(0,0,256,256);
  if (face) {
    ctx.fillStyle = '#18303d'; ctx.fillRect(78,90,24,24); ctx.fillRect(154,90,24,24);
    ctx.strokeStyle = '#18303d'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(128,136,29,0.2,Math.PI-0.2); ctx.stroke();
  } else {
    ctx.fillStyle = knight ? '#f4bb44' : '#91f3e6';
    ctx.beginPath(); ctx.moveTo(128,35); ctx.lineTo(204,100); ctx.lineTo(128,218); ctx.lineTo(52,100); ctx.closePath(); ctx.fill();
    ctx.fillStyle = background; ctx.fillRect(113,75,30,95);
  }
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
function createMageRobeTexture() { return makeHeroTexture('#176a83'); }
function createKnightArmorTexture() { return makeHeroTexture('#a64934',true); }
function createFaceTexture(isFairyMage) { return makeHeroTexture(isFairyMage ? '#75d3bf' : '#a9b7ee',false,true); }

function createHeroMinifigure(heroId) {
  const isFairy = heroId === 'fairy_mage';
  const root = new THREE.Group();
  root.name = heroId;

  // Selection ring underneath minifigure
  const ringGeo = new THREE.RingGeometry(0.45, 0.62, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: isFairy ? '#e066ff' : '#00f5d4',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85
  });
  const selectionRing = new THREE.Mesh(ringGeo, ringMat);
  selectionRing.position.y = 0.04;
  root.add(selectionRing);
  root.userData.selectionRing = selectionRing;

  // Body pivot for walk bounce & turn animations
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);
  root.userData.bodyPivot = bodyPivot;

  // 1. Legs (Left & Right articulated legs)
  const legColor = isFairy ? '#16455b' : '#623443';
  const legMat = createBrickMaterial(legColor);
  const hipMat = createBrickMaterial(isFairy ? '#6a28c9' : '#22272a');

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.21, 0.68, 0);
  const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.68, 0.42), legMat);
  leftLegMesh.position.y = -0.34;
  leftLegMesh.castShadow = true;
  leftLegPivot.add(leftLegMesh);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.21, 0.68, 0);
  const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.68, 0.42), legMat);
  rightLegMesh.position.y = -0.34;
  rightLegMesh.castShadow = true;
  rightLegPivot.add(rightLegMesh);


  bodyPivot.add(leftLegPivot);
  bodyPivot.add(rightLegPivot);
  root.userData.leftLeg = leftLegPivot;
  root.userData.rightLeg = rightLegPivot;

  // Pelvis / Hips
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.16, 0.42), hipMat);
  hips.position.y = 0.74;
  hips.castShadow = true;
  bodyPivot.add(hips);

  // 2. Torso with custom front graphic texture
  const torsoBaseColor = isFairy ? '#176a83' : '#a64934';
  const torsoSideMat = createBrickMaterial(torsoBaseColor);
  const torsoFrontMat = new THREE.MeshPhysicalMaterial({
    map: isFairy ? createMageRobeTexture() : createKnightArmorTexture(),
    roughness: 0.22,
    clearcoat: 0.6
  });

  const torsoGeo = new THREE.BoxGeometry(0.84, 0.78, 0.44);
  const torsoMaterials = [
    torsoSideMat, // right
    torsoSideMat, // left
    torsoSideMat, // top
    torsoSideMat, // bottom
    torsoFrontMat, // front (+Z)
    torsoSideMat // back (-Z)
  ];
  const torsoMesh = new THREE.Mesh(torsoGeo, torsoMaterials);
  torsoMesh.position.y = 1.21;
  torsoMesh.castShadow = true;
  bodyPivot.add(torsoMesh);

  // 3. Arms & Yellow Brick Hands
  const sleeveColor = isFairy ? '#176a83' : '#a64934';
  const armMat = createBrickMaterial(sleeveColor);
  const yellowHandMat = createBrickMaterial(isFairy ? '#75d3bf' : '#a9b7ee'); // Generic procedural public scene.

  const createArm = (isRight) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(isRight ? -0.52 : 0.52, 1.5, 0);

    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.54, 14), armMat);
    upperArm.position.set(0, -0.24, 0.06);
    upperArm.rotation.x = -0.25;
    upperArm.castShadow = true;
    armPivot.add(upperArm);

    // Classic C-shaped Brick Hand
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.52, 0.14);
    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.18, 12), yellowHandMat);
    wrist.rotation.x = Math.PI / 2;
    handGroup.add(wrist);
    armPivot.add(handGroup);

    return { armPivot, handGroup };
  };

  const rightArmObj = createArm(true);
  const leftArmObj = createArm(false);
  bodyPivot.add(rightArmObj.armPivot);
  bodyPivot.add(leftArmObj.armPivot);
  root.userData.rightArm = rightArmObj.armPivot;
  root.userData.leftArm = leftArmObj.armPivot;

  // 4. Equip Signature Weapons in Right Hand!
  if (isFairy) {
    // Generic procedural public scene.
    const wandGroup = new THREE.Group();
    const wandMat = createTransMaterial('#ff4da6', '#ff85c1', 0.8);

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 1.35, 12), wandMat);
    rod.position.set(0, 0.25, 0.25);
    rod.rotation.x = Math.PI / 3.2;
    wandGroup.add(rod);

    const starGeo = createFivePointStarGeometry(0.34, 0.15, 0.1);
    const starHead = new THREE.Mesh(starGeo, wandMat);
    starHead.position.set(0, 0.68, 0.78);
    starHead.rotation.x = Math.PI / 6;
    wandGroup.add(starHead);

    rightArmObj.handGroup.add(wandGroup);
    rightArmObj.armPivot.rotation.x = -0.55;
    root.userData.weaponTip = starHead;
  } else {
    // Generic procedural public scene.
    const swordGroup = new THREE.Group();
    const bladeMat = new THREE.MeshPhysicalMaterial({
      color: '#e2e8f0',
      emissive: '#38bdf8',
      emissiveIntensity: 0.22,
      metalness: 0.88,
      roughness: 0.15,
      clearcoat: 1.0
    });
    const hiltMat = createBrickMaterial('#64748b', { metalness: 0.6 });

    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.36, 12), hiltMat);
    grip.rotation.x = Math.PI / 2;
    swordGroup.add(grip);

    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.12), hiltMat);
    guard.position.set(0, 0, 0.18);
    swordGroup.add(guard);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 1.25), bladeMat);
    blade.position.set(0, 0.02, 0.82);
    blade.castShadow = true;
    swordGroup.add(blade);

    rightArmObj.handGroup.add(swordGroup);
    rightArmObj.armPivot.rotation.x = -0.35;
    root.userData.weaponTip = blade;
  }

  // 5. Brick Minifigure Head & Custom Sculpted Hairpiece
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.88;

  const skinColor = isFairy ? '#f4c29f' : '#a46843';
  const headMat = new THREE.MeshPhysicalMaterial({
    map: createFaceTexture(isFairy),
    roughness: 0.22,
    clearcoat: 0.65
  });
  const headCylinder = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.60, 0.60), headMat);
  headCylinder.rotation.y = 0; // Align face texture toward +Z
  headCylinder.castShadow = true;
  headGroup.add(headCylinder);

  const hatMat = createBrickMaterial(isFairy ? '#153e5c' : '#6f3439');
  const hat = new THREE.Mesh(isFairy ? new THREE.ConeGeometry(0.48,0.68,5) : new THREE.BoxGeometry(0.78,0.22,0.68),hatMat);
  hat.position.y = isFairy ? 0.49 : 0.35; headGroup.add(hat);

  bodyPivot.add(headGroup);
  root.userData.head = headGroup;

  return root;
}

// ============================================================================
// MONSTER MODELS: KILLER FROGS ON LILY PADS & BURROWING GARDEN MOLES
// ============================================================================
function createMonsterMesh(monster) {
  const root = new THREE.Group();
  root.name = monster.id;

  // Threat ring
  const ringGeo = new THREE.RingGeometry(0.45, 0.62, 28);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: '#ff3b3b',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65
  });
  const threatRing = new THREE.Mesh(ringGeo, ringMat);
  threatRing.position.y = 0.04;
  root.add(threatRing);

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);
  root.userData.bodyPivot = bodyPivot;

  if (monster.kind === 'frog') {
    // Generic procedural public scene.
    const padMat = createBrickMaterial('#8c9c52', { roughness: 0.25 });
    const padGroup = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3 - Math.PI / 2;
      const lobe = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.14, 16), padMat);
      lobe.position.set(Math.cos(angle) * 0.28, 0.07, Math.sin(angle) * 0.28);
      lobe.castShadow = true;
      padGroup.add(lobe);
    }
    root.add(padGroup);

    // 2. Sculpted Brick Killer Frog sitting on top of the lily pad
    const frogMat = createBrickMaterial('#657b38', { roughness: 0.2 });
    const frogBellyMat = createBrickMaterial('#b5c977');
    const eyeMat = createBrickMaterial('#ffbe0b');
    const pupilMat = createBrickMaterial('#d90429');

    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 14), frogMat);
    torso.scale.set(1.0, 0.82, 1.25);
    torso.position.set(0, 0.36, 0);
    torso.castShadow = true;
    bodyPivot.add(torso);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), frogBellyMat);
    belly.position.set(0, 0.3, 0.16);
    bodyPivot.add(belly);

    // Hind leaping legs
    [-0.3, 0.3].forEach((lx) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.44), frogMat);
      leg.position.set(lx, 0.24, -0.08);
      leg.rotation.x = 0.35;
      bodyPivot.add(leg);
    });

    // Bulging glowing killer frog eyes
    [-0.17, 0.17].forEach((ex) => {
      const eyeBall = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), eyeMat);
      eyeBall.position.set(ex, 0.62, 0.24);
      bodyPivot.add(eyeBall);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), pupilMat);
      pupil.position.set(ex, 0.64, 0.32);
      bodyPivot.add(pupil);
    });
  } else {
    // MOLE MONSTER BENEATH THE GARDEN
    const soilMat = createBrickMaterial('#4a2511', { roughness: 0.35 });
    const furMat = createBrickMaterial('#3d312a', { roughness: 0.28 });
    const snoutMat = createBrickMaterial('#ff758f');
    const clawMat = createBrickMaterial('#f8f9fa');
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#ffbe0b' });

    // Dirt Mound Ring of Brick Studs (always visible around the mole)
    const moundGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const clod = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.26, 12), soilMat);
      clod.position.set(Math.cos(angle) * 0.44, 0.13, Math.sin(angle) * 0.44);
      moundGroup.add(clod);
    }
    root.add(moundGroup);

    // Mole Body (lowers into the garden soil when burrowed!)
    const moleBody = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.85, 18), furMat);
    moleBody.position.y = 0.45;
    moleBody.castShadow = true;
    bodyPivot.add(moleBody);

    const headCap = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), furMat);
    headCap.position.y = 0.85;
    bodyPivot.add(headCap);

    // Pink star-nose snout
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.28, 12), snoutMat);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, 0.78, 0.42);
    bodyPivot.add(snout);

    // Glowing subterranean eyes
    [-0.15, 0.15].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), eyeMat);
      eye.position.set(ex, 0.9, 0.33);
      bodyPivot.add(eye);
    });

    // Oversized Brick digger claws
    [-0.38, 0.38].forEach((cx) => {
      const claw = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.38), clawMat);
      claw.position.set(cx, 0.48, 0.28);
      claw.rotation.x = 0.3;
      bodyPivot.add(claw);
    });

    // Apply initial burrowed state height
    bodyPivot.position.y = monster.burrowed ? -0.45 : 0;
  }

  return root;
}



class DiceRollerUI {
  constructor(canvasEl, bannerEl) {
    this.canvas = canvasEl;
    this.banner = bannerEl;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
    this.camera.position.set(0, 0, 3.6);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(112, 112);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting for the 3D d20
    const amb = new THREE.AmbientLight('#ffffff', 1.2);
    this.scene.add(amb);
    const dir = new THREE.DirectionalLight('#fffbeb', 2.4);
    dir.position.set(3, 4, 5);
    this.scene.add(dir);

    // 3D Polyhedral d20 Icosahedron with wireframe gold ridges
    this.dieGroup = new THREE.Group();
    const icoGeo = new THREE.IcosahedronGeometry(1.08, 0);
    this.dieMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#c026d3'),
      roughness: 0.15,
      metalness: 0.15,
      clearcoat: 1.0
    });
    this.dieMesh = new THREE.Mesh(icoGeo, this.dieMat);
    this.dieGroup.add(this.dieMesh);

    const edgesGeo = new THREE.EdgesGeometry(icoGeo);
    const edgesMat = new THREE.LineBasicMaterial({ color: '#fde047', linewidth: 2 });
    this.edgesMesh = new THREE.LineSegments(edgesGeo, edgesMat);
    this.dieGroup.add(this.edgesMesh);

    this.scene.add(this.dieGroup);

    this.rolling = false;
    this.rollStart = 0;
    this.rollDuration = 580;
    this._animate();
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    const now = performance.now();
    if (this.rolling) {
      const t = Math.min(1, (now - this.rollStart) / this.rollDuration);
      const speed = (1 - t) * 0.48 + 0.03;
      this.dieGroup.rotation.x += speed * 1.3;
      this.dieGroup.rotation.y += speed * 1.7;
      this.dieGroup.rotation.z += speed * 0.9;
      const bounce = Math.sin(t * Math.PI * 3) * (1 - t) * 0.25;
      this.dieGroup.position.y = bounce;
    } else {
      this.dieGroup.rotation.y += 0.008;
      this.dieGroup.position.y = 0;
    }
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Perform a CRPG d20 Difficulty Check with full breakdown and 3D tumble animation
   */
  async rollCheck({
    actorName,
    actionTitle,
    statName,
    statBonus = 0,
    situationalBonus = 0,
    situationalLabel = '',
    dc = 12,
    accentColor = '#e066ff'
  }) {
    this.dieMat.color.set(accentColor);
    this.rolling = true;
    this.rollStart = performance.now();
    sound.playDiceRoll();

    // Generate authentic d20 roll (1..20)
    const naturalRoll = Math.floor(Math.random() * 20) + 1;
    const isCrit = naturalRoll === 20;
    const isFumble = naturalRoll === 1;
    const total = naturalRoll + statBonus + situationalBonus;
    const success = isCrit || (!isFumble && total >= dc);

    // Show rolling state in banner
    this.banner.classList.add('active');
    const titleEl = this.banner.querySelector('#dice-roll-title');
    const numberEl = this.banner.querySelector('#dice-face-number');
    const formulaEl = this.banner.querySelector('#dice-roll-formula');
    const badgeEl = this.banner.querySelector('#dice-roll-badge');

    titleEl.textContent = `${actorName} — ${actionTitle}`;
    numberEl.textContent = '🎲';
    formulaEl.textContent = `Rolling 1d20 + ${statName} (${statBonus >= 0 ? '+' : ''}${statBonus}) vs DC ${dc}...`;
    badgeEl.textContent = 'ROLLING...';
    badgeEl.className = 'dice-badge rolling';

    await new Promise((r) => setTimeout(r, this.rollDuration));
    this.rolling = false;

    // Reveal result
    numberEl.textContent = String(naturalRoll);
    const sitPart =
      situationalBonus !== 0
        ? ` ${situationalBonus > 0 ? '+' : ''}${situationalBonus} (${situationalLabel})`
        : '';
    formulaEl.innerHTML = `<strong>d20 (${naturalRoll})</strong> + ${statName} (<strong>+${statBonus}</strong>)${sitPart} = <strong>${total}</strong> vs <strong>DC ${dc}</strong>`;

    if (isCrit) {
      badgeEl.textContent = 'NATURAL 20! CRITICAL!';
      badgeEl.className = 'dice-badge crit';
    } else if (isFumble) {
      badgeEl.textContent = 'NATURAL 1! MISS!';
      badgeEl.className = 'dice-badge fail';
    } else if (success) {
      badgeEl.textContent = `SUCCESS! (${total} ≥ ${dc})`;
      badgeEl.className = 'dice-badge success';
    } else {
      badgeEl.textContent = `RESISTED (${total} < ${dc})`;
      badgeEl.className = 'dice-badge fail';
    }

    sound.playDiceResult(success, isCrit);

    return {
      naturalRoll,
      statBonus,
      situationalBonus,
      total,
      dc,
      success,
      isCrit,
      isFumble
    };
  }
}



// ============================================================================
// MAIN GAME APPLICATION
// ============================================================================
class BrickWorldCRPG {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.floatingLayer = document.getElementById('floating-labels');

    // Configurable Game Options
    this.difficultyKey = 'medium'; // 'easy' | 'medium' | 'hard'
    this.partyModeKey = 'both';    // 'both' | 'solo_mage' | 'solo_knight'
    this.mapMode = 'starter';        // 'starter' | 'random'
    this.winConditionOption = '5_collect_all_treasure'; // 'random' or any of 1..10
    this.activeWinCondition = null;

    // Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1a1625');
    this.scene.fog = new THREE.FogExp2('#1a1625', 0.011);

    this.camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.camera.position.set(0, 26, 28);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.maxPolarAngle = Math.PI / 2.08;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 58;
    this.controls.target.set(0, 0.5, 2);

    this._setupLights();
    this.worldGroup = null;

    // Interactive Raycasting Plane & Highlights
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    const hitPlaneGeo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
    hitPlaneGeo.rotateX(-Math.PI / 2);
    this.hitPlane = new THREE.Mesh(
      hitPlaneGeo,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.hitPlane.position.y = 0.25;
    this.scene.add(this.hitPlane);

    // Tactical Grid Overlay Group (Range tiles, Path preview, Hover cursor)
    this.overlayGroup = new THREE.Group();
    this.scene.add(this.overlayGroup);

    this.rangeTilesGroup = new THREE.Group();
    this.pathTilesGroup = new THREE.Group();
    this.overlayGroup.add(this.rangeTilesGroup);
    this.overlayGroup.add(this.pathTilesGroup);

    const cursorGeo = new THREE.RingGeometry(0.36, 0.48, 4);
    cursorGeo.rotateX(-Math.PI / 2);
    cursorGeo.rotateY(Math.PI / 4);
    this.cursorMesh = new THREE.Mesh(
      cursorGeo,
      new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide })
    );
    this.cursorMesh.visible = false;
    this.overlayGroup.add(this.cursorMesh);

    // Dynamic Entities Groups
    this.treasuresGroup = new THREE.Group();
    this.heroesGroup = new THREE.Group();
    this.monstersGroup = new THREE.Group();
    this.vfxGroup = new THREE.Group();
    this.scene.add(this.treasuresGroup);
    this.scene.add(this.heroesGroup);
    this.scene.add(this.monstersGroup);
    this.scene.add(this.vfxGroup);

    // Dice Roller UI
    this.diceUI = new DiceRollerUI(
      document.getElementById('dice-canvas'),
      document.getElementById('dice-roll-banner')
    );

    // Active VFX list
    this.activeParticles = [];

    // Initialize Game State
    this.resetGame({ regenerateMap: false });
    this._bindEvents();
    this._setupDialogs();

    // Start render loop
    this.clock = new THREE.Clock();
    this._animate();
  }

  get difficulty() {
    return DIFFICULTY_LEVELS[this.difficultyKey] || DIFFICULTY_LEVELS.medium;
  }

  get partyMode() {
    return PARTY_MODES[this.partyModeKey] || PARTY_MODES.both;
  }

  _setupLights() {
    const hemi = new THREE.HemisphereLight('#fffbeb', '#3b2d54', 0.95);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight('#fff7ed', 2.1);
    sun.position.set(16, 30, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 75;
    const d = 22;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    const rim = new THREE.DirectionalLight('#c084fc', 0.65);
    rim.position.set(-18, 14, -15);
    this.scene.add(rim);

    const bridgeGlow = new THREE.PointLight('#ff4d6d', 2.2, 14);
    bridgeGlow.position.set(4, 2.5, 0);
    this.scene.add(bridgeGlow);

    const gardenGlow = new THREE.PointLight('#ffbe0b', 2.0, 14);
    gardenGlow.position.set(-10, 2.2, 10);
    this.scene.add(gardenGlow);
  }

  resetGame({ regenerateMap = false } = {}) {
    if (regenerateMap) {
      if (this.mapMode === 'random') {
        generateRandomDungeonLayout();
      } else {
        generateStarterWorldLayout();
      }
    } else if (!activeWorld) {
      generateStarterWorldLayout();
    }

    // Rebuild 3D Brick World Geometry (baseplate, bridges, water, gardens, studs, bushes)
    this.worldGroup = buildBrickWorldScene(this.scene, this.worldGroup);

    this.round = 1;
    this.turnPhase = 'HEROES'; // 'HEROES' | 'MONSTERS' | 'GAMEOVER'
    this.busy = false;
    this.score = 0;

    const diff = this.difficulty;
    const pMode = this.partyMode;

    // Clear previous entity meshes
    this.treasuresGroup.clear();
    this.heroesGroup.clear();
    this.monstersGroup.clear();
    this.vfxGroup.clear();

    // 1. Spawn Collectible Treasures from activeWorld
    this.treasures = activeWorld.treasures.map((t) => {
      const copy = { ...t, collected: false };
      const mesh = createTreasureMesh(copy);
      const pos = gridToWorld(copy.x, copy.z);
      mesh.position.copy(pos);
      copy.mesh = mesh;
      this.treasuresGroup.add(mesh);
      return copy;
    });

    // 2. Spawn Playable Heroes based on Party Mode (Both, Solo Fairy Mage, or Solo Sword Knight) & Difficulty
    const activeHeroDefs = HERO_DEFINITIONS.filter((h) =>
      pMode.heroes.includes(h.id)
    );

    this.heroes = activeHeroDefs.map((h, idx) => {
      const copy = JSON.parse(JSON.stringify(h));
      const spawn = activeWorld.heroSpawns[idx] || activeWorld.heroSpawns[0] || { x: 16, z: 1 };
      copy.x = spawn.x;
      copy.z = spawn.z;

      // Apply Difficulty + Solo Adventurer bonuses
      copy.maxHp = h.maxHp + diff.heroBonusHp + pMode.soloBonusHp;
      copy.hp = copy.maxHp;
      copy.maxAp = h.maxAp + diff.heroBonusAp + pMode.soloBonusAp;
      copy.ap = copy.maxAp;
      copy.shieldBonus = 0;
      copy.alive = true;

      const mesh = createHeroMinifigure(copy.id);
      const pos = gridToWorld(copy.x, copy.z);
      mesh.position.copy(pos);
      copy.mesh = mesh;
      this.heroesGroup.add(mesh);
      return copy;
    });

    // 3. Spawn Monsters from activeWorld scaled by Difficulty
    const baseMonsters = diff.extraMonsters
      ? [...activeWorld.monsters, ...(activeWorld.extraHardMonsters || [])]
      : activeWorld.monsters;

    this.monsters = baseMonsters.map((m) => {
      const scaledHp = Math.max(6, Math.round(m.maxHp * diff.monsterHpMult));
      const copy = {
        ...m,
        maxHp: scaledHp,
        hp: scaledHp,
        dc: Math.max(7, m.dc + diff.monsterDcOffset),
        attackBonus: Math.max(1, m.attackBonus + diff.monsterAtkOffset),
        minDmg: Math.max(1, m.minDmg + diff.monsterDmgOffset),
        maxDmg: Math.max(2, m.maxDmg + diff.monsterDmgOffset),
        alive: true,
        stunned: false
      };
      const mesh = createMonsterMesh(copy);
      const pos = gridToWorld(copy.x, copy.z);
      mesh.position.copy(pos);
      mesh.rotation.y = Math.PI;
      copy.mesh = mesh;
      this.monstersGroup.add(mesh);
      return copy;
    });

    this.selectedHeroIndex = 0;
    this.selectedAbilityId = 'move';
    this.hoveredTile = null;

    // 4. Generate Active Win Condition (supports all 10 archetypes + randomized roll!)
    this.activeWinCondition = createWinCondition(
      this.winConditionOption,
      this.monsters,
      this.treasures
    );

    this.logMessages = [];
    const heroNames = this.heroes.map((h) => h.name.split(' ')[0]).join(' & ');
    this.addLog(
      `🎯 WIN CONDITION (${this.activeWinCondition.code}): ${this.activeWinCondition.title}!`,
      'treasure'
    );
    this.addLog(
      `✨ Map: ${activeWorld.name} | Difficulty: ${diff.name} | Party: ${heroNames} (${this.heroes[0].maxAp} AP/turn).`,
      'info'
    );
    if (pMode.id !== 'both') {
      this.addLog(
        `🌟 Solo Adventurer Blessing Active: ${heroNames} gains +${pMode.soloBonusAp} Max AP and +${pMode.soloBonusHp} Max HP!`,
        'roll'
      );
    }

    this.selectHero(0, false);
    this.syncSetupControlsUI();
    this.updateHUD();
  }

  get activeHero() {
    return this.heroes[this.selectedHeroIndex];
  }

  get activeAbility() {
    const hero = this.activeHero;
    if (!hero) return null;
    return (
      hero.abilities.find((a) => a.id === this.selectedAbilityId) ||
      hero.abilities[0]
    );
  }

  selectHero(index, playClick = true) {
    if (this.busy || this.turnPhase !== 'HEROES') return;
    if (!this.heroes[index] || !this.heroes[index].alive) return;

    this.selectedHeroIndex = index;
    if (!this.heroes[index].abilities.some((a) => a.id === this.selectedAbilityId)) {
      this.selectedAbilityId = 'move';
    }
    if (playClick) sound.playBrickStep(2);

    this.heroes.forEach((h, idx) => {
      if (h.mesh && h.mesh.userData.selectionRing) {
        h.mesh.userData.selectionRing.material.opacity = idx === index ? 0.95 : 0.25;
        h.mesh.userData.selectionRing.scale.setScalar(idx === index ? 1.15 : 0.85);
      }
    });

    this.rebuildRangeOverlay();
    this.updateHUD();
  }

  selectAbility(abilityId) {
    if (this.busy || this.turnPhase !== 'HEROES') return;
    const hero = this.activeHero;
    const ability = hero.abilities.find((a) => a.id === abilityId);
    if (!ability) return;

    this.selectedAbilityId = abilityId;
    sound.playBrickStep(4);
    this.rebuildRangeOverlay();
    this.updateHUD();
  }

  // ==========================================================================
  // TACTICAL RANGE & PATH OVERLAYS
  // ==========================================================================
  isTileOccupied(gx, gz, ignoreHeroId = null) {
    for (const h of this.heroes) {
      if (h.alive && h.id !== ignoreHeroId && h.x === gx && h.z === gz) return true;
    }
    for (const m of this.monsters) {
      if (m.alive && m.x === gx && m.z === gz) return true;
    }
    return false;
  }

  getMonsterAt(gx, gz) {
    return this.monsters.find((m) => m.alive && m.x === gx && m.z === gz) || null;
  }

  getHeroAt(gx, gz) {
    return this.heroes.find((h) => h.alive && h.x === gx && h.z === gz) || null;
  }

  computeReachableTiles(hero) {
    const maxSteps = hero.moveRange;
    const visited = new Map();
    const parent = new Map();
    const queue = [{ x: hero.x, z: hero.z, dist: 0 }];
    visited.set(`${hero.x},${hero.z}`, 0);

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1]
    ];

    while (queue.length > 0) {
      queue.sort((a, b) => a.dist - b.dist);
      const curr = queue.shift();

      for (const [dx, dz] of dirs) {
        const nx = curr.x + dx;
        const nz = curr.z + dz;
        if (nx < 0 || nx >= GRID_SIZE || nz < 0 || nz >= GRID_SIZE) continue;
        if (this.isTileOccupied(nx, nz, hero.id)) continue;

        const stepCost = dx !== 0 && dz !== 0 ? 1.4 : 1.0;
        const newDist = curr.dist + stepCost;
        if (newDist > maxSteps + 0.1) continue;

        const key = `${nx},${nz}`;
        if (!visited.has(key) || newDist < visited.get(key)) {
          visited.set(key, newDist);
          parent.set(key, { x: curr.x, z: curr.z });
          queue.push({ x: nx, z: nz, dist: newDist });
        }
      }
    }

    return { visited, parent };
  }

  reconstructPath(parentMap, startX, startZ, targetX, targetZ) {
    const path = [];
    let currKey = `${targetX},${targetZ}`;
    if (!parentMap.has(currKey)) return path;

    let curr = { x: targetX, z: targetZ };
    while (curr.x !== startX || curr.z !== startZ) {
      path.unshift(curr);
      curr = parentMap.get(`${curr.x},${curr.z}`);
      if (!curr) break;
    }
    return path;
  }

  rebuildRangeOverlay() {
    this.rangeTilesGroup.clear();
    this.pathTilesGroup.clear();
    if (this.turnPhase !== 'HEROES' || this.busy) return;

    const hero = this.activeHero;
    const ability = this.activeAbility;
    if (!hero || !hero.alive || !ability) return;

    const tilePlane = new THREE.PlaneGeometry(0.86, 0.86);
    tilePlane.rotateX(-Math.PI / 2);

    if (ability.type === 'movement') {
      if (hero.ap < ability.apCost) return;
      const { visited, parent } = this.computeReachableTiles(hero);
      this.currentReachable = { visited, parent };

      const moveMat = new THREE.MeshBasicMaterial({
        color: hero.accentColor,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide
      });
      const hazardMat = new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide
      });

      visited.forEach((dist, key) => {
        if (dist === 0) return;
        const [gx, gz] = key.split(',').map(Number);
        const info = getTileInfo(gx, gz, this.difficulty.waterHazardDC);
        const pos = gridToWorld(gx, gz);
        const mesh = new THREE.Mesh(
          tilePlane,
          info.type === TERRAIN.WATER ? hazardMat : moveMat
        );
        mesh.position.set(pos.x, pos.y + 0.17, pos.z);
        this.rangeTilesGroup.add(mesh);
      });
    } else {
      const targetMat = new THREE.MeshBasicMaterial({
        color: ability.type === 'support' ? '#4ade80' : '#fb7185',
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
      });

      for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
          const dist = Math.hypot(x - hero.x, z - hero.z);
          if (dist <= ability.range + 0.1) {
            const pos = gridToWorld(x, z);
            const m = new THREE.Mesh(tilePlane, targetMat);
            m.position.set(pos.x, pos.y + 0.17, pos.z);
            this.rangeTilesGroup.add(m);
          }
        }
      }
    }
  }

  updateHoverPath(gx, gz) {
    this.pathTilesGroup.clear();
    if (this.turnPhase !== 'HEROES' || this.busy) return;

    const hero = this.activeHero;
    const ability = this.activeAbility;
    if (!hero || !ability) return;

    const pos = gridToWorld(gx, gz);
    this.cursorMesh.position.set(pos.x, pos.y + 0.19, pos.z);
    this.cursorMesh.visible = true;

    const tileInfo = getTileInfo(gx, gz, this.difficulty.waterHazardDC);
    const monster = this.getMonsterAt(gx, gz);
    const treasure = this.treasures.find(
      (t) => !t.collected && t.x === gx && t.z === gz
    );

    const inspectorEl = document.getElementById('tile-inspector');
    if (inspectorEl) {
      let label = `Stud (${gx}, ${gz}) • ${tileInfo.label}`;
      if (monster) {
        const effDC = monster.burrowed ? monster.dc + 2 : monster.dc;
        label = `👾 ${monster.name} (${monster.hp}/${monster.maxHp} HP • Target DC ${effDC}${monster.burrowed ? ' Burrowed' : ''})`;
      } else if (treasure) {
        label = `💎 ${treasure.name} (+${treasure.points} pts — Step here or adjacent to collect!)`;
      }
      inspectorEl.textContent = label;
    }

    if (
      ability.type === 'movement' &&
      this.currentReachable &&
      this.currentReachable.visited.has(`${gx},${gz}`)
    ) {
      const path = this.reconstructPath(
        this.currentReachable.parent,
        hero.x,
        hero.z,
        gx,
        gz
      );
      const stepGeo = new THREE.PlaneGeometry(0.65, 0.65);
      stepGeo.rotateX(-Math.PI / 2);
      const stepMat = new THREE.MeshBasicMaterial({
        color: '#fde047',
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide
      });

      path.forEach((p) => {
        const wp = gridToWorld(p.x, p.z);
        const m = new THREE.Mesh(stepGeo, stepMat);
        m.position.set(wp.x, wp.y + 0.185, wp.z);
        this.pathTilesGroup.add(m);
      });
    } else if (ability.aoeRadius) {
      const dist = Math.hypot(gx - hero.x, gz - hero.z);
      if (dist <= ability.range + 0.1) {
        const aoeGeo = new THREE.PlaneGeometry(0.82, 0.82);
        aoeGeo.rotateX(-Math.PI / 2);
        const aoeMat = new THREE.MeshBasicMaterial({
          color: '#f472b6',
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide
        });
        for (let ax = gx - ability.aoeRadius; ax <= gx + ability.aoeRadius; ax++) {
          for (let az = gz - ability.aoeRadius; az <= gz + ability.aoeRadius; az++) {
            if (ax < 0 || ax >= GRID_SIZE || az < 0 || az >= GRID_SIZE) continue;
            if (Math.hypot(ax - gx, az - gz) <= ability.aoeRadius + 0.2) {
              const wp = gridToWorld(ax, az);
              const m = new THREE.Mesh(aoeGeo, aoeMat);
              m.position.set(wp.x, wp.y + 0.185, wp.z);
              this.pathTilesGroup.add(m);
            }
          }
        }
      }
    }
  }

  // ==========================================================================
  // PLAYER INTERACTION ON THE 32x32 BASEPLATE
  // ==========================================================================
  async handleTileClick(gx, gz) {
    if (this.busy || this.turnPhase !== 'HEROES') return;

    const clickedHeroIndex = this.heroes.findIndex(
      (h) => h.alive && h.x === gx && h.z === gz
    );
    if (
      clickedHeroIndex !== -1 &&
      clickedHeroIndex !== this.selectedHeroIndex &&
      this.activeAbility?.type !== 'support'
    ) {
      this.selectHero(clickedHeroIndex);
      return;
    }

    const hero = this.activeHero;
    let ability = this.activeAbility;
    if (!hero || !hero.alive || !ability) return;

    const clickedMonster = this.getMonsterAt(gx, gz);

    if (ability.type === 'movement' && clickedMonster) {
      const dist = Math.hypot(clickedMonster.x - hero.x, clickedMonster.z - hero.z);
      const attackAbility = hero.abilities.find(
        (a) =>
          a.type !== 'movement' &&
          a.type !== 'support' &&
          dist <= a.range + 0.1 &&
          hero.ap >= a.apCost
      );
      if (attackAbility) {
        this.selectedAbilityId = attackAbility.id;
        ability = attackAbility;
        this.updateHUD();
      } else {
        this.spawnFloatingText(
          gridToWorld(clickedMonster.x, clickedMonster.z),
          'Move closer or pick a ranged attack!',
          '#facc15'
        );
        return;
      }
    }

    if (hero.ap < ability.apCost) {
      this.spawnFloatingText(
        gridToWorld(hero.x, hero.z),
        `Not enough AP! (Needs ${ability.apCost} AP)`,
        '#fb7185'
      );
      return;
    }

    if (ability.type === 'movement') {
      if (!this.currentReachable || !this.currentReachable.visited.has(`${gx},${gz}`)) {
        return;
      }
      const path = this.reconstructPath(
        this.currentReachable.parent,
        hero.x,
        hero.z,
        gx,
        gz
      );
      if (path.length === 0) return;

      this.busy = true;
      hero.ap -= ability.apCost;
      this.rangeTilesGroup.clear();
      this.pathTilesGroup.clear();
      this.updateHUD();

      await this.animateHeroMovement(hero, path);

      this.busy = false;
      this.rebuildRangeOverlay();
      this.updateHUD();
      this.checkAutoEndTurn();
      return;
    }

    if (ability.type === 'support') {
      const targetHero = this.getHeroAt(gx, gz) || hero;
      const dist = Math.hypot(targetHero.x - hero.x, targetHero.z - hero.z);
      if (dist > ability.range + 0.1) {
        this.spawnFloatingText(
          gridToWorld(gx, gz),
          `Out of range (${ability.range} studs)!`,
          '#fb7185'
        );
        return;
      }

      this.busy = true;
      hero.ap -= ability.apCost;
      this.rangeTilesGroup.clear();
      this.pathTilesGroup.clear();
      this.updateHUD();

      await this.executeSupportAbility(hero, targetHero, ability);

      this.busy = false;
      this.selectedAbilityId = 'move';
      this.rebuildRangeOverlay();
      this.updateHUD();
      this.checkAutoEndTurn();
      return;
    }

    const dist = Math.hypot(gx - hero.x, gz - hero.z);
    if (dist > ability.range + 0.1) {
      this.spawnFloatingText(
        gridToWorld(gx, gz),
        `Out of Range! Max ${ability.range} studs`,
        '#fb7185'
      );
      return;
    }

    if (!ability.aoeRadius && !clickedMonster) {
      this.spawnFloatingText(
        gridToWorld(gx, gz),
        'Click a Monster to attack!',
        '#fde047'
      );
      return;
    }

    this.busy = true;
    hero.ap -= ability.apCost;
    this.rangeTilesGroup.clear();
    this.pathTilesGroup.clear();
    this.updateHUD();

    await this.executeAttackAbility(hero, ability, gx, gz, clickedMonster);

    this.busy = false;
    this.selectedAbilityId = 'move';
    this.rebuildRangeOverlay();
    this.updateHUD();
    this.checkVictoryOrDefeat();
    this.checkAutoEndTurn();
  }

  // ==========================================================================
  // MOVEMENT, TREASURE COLLECTION & TERRAIN HAZARDS
  // ==========================================================================
  async animateHeroMovement(hero, path) {
    for (let i = 0; i < path.length; i++) {
      const step = path[i];
      const startPos = hero.mesh.position.clone();
      const endPos = gridToWorld(step.x, step.z);

      const angle = Math.atan2(endPos.x - startPos.x, endPos.z - startPos.z);
      hero.mesh.rotation.y = angle;

      const stepDuration = 155;
      const t0 = performance.now();

      await new Promise((resolve) => {
        const tick = () => {
          const t = Math.min(1, (performance.now() - t0) / stepDuration);
          hero.mesh.position.lerpVectors(startPos, endPos, t);
          const hop = Math.sin(t * Math.PI) * 0.28;
          hero.mesh.position.y += hop;

          const swing = Math.sin(t * Math.PI * 2) * 0.55;
          if (hero.mesh.userData.leftLeg) {
            hero.mesh.userData.leftLeg.rotation.x = swing;
            hero.mesh.userData.rightLeg.rotation.x = -swing;
          }

          if (t < 1) requestAnimationFrame(tick);
          else resolve();
        };
        tick();
      });

      if (hero.mesh.userData.leftLeg) {
        hero.mesh.userData.leftLeg.rotation.x = 0;
        hero.mesh.userData.rightLeg.rotation.x = 0;
      }

      hero.x = step.x;
      hero.z = step.z;
      sound.playBrickStep(i % 3);

      await this.checkTreasureCollectionAt(hero);
    }

    const diff = this.difficulty;
    const destInfo = getTileInfo(hero.x, hero.z, diff.waterHazardDC);
    if (destInfo.type === TERRAIN.WATER) {
      const statName = hero.id === 'fairy_mage' ? 'ACROBATICS' : 'ATHLETICS';
      const statBonus = hero.stats[statName] || 3;
      const roll = await this.diceUI.rollCheck({
        actorName: hero.name,
        actionTitle: 'Frog Water Balance Check',
        statName,
        statBonus,
        situationalBonus: diff.heroRollBonus,
        situationalLabel: `${diff.name} Mode`,
        dc: destInfo.hazardDC,
        accentColor: '#38bdf8'
      });

      if (roll.success) {
        this.addLog(
          `🌊 ${hero.name} rolled ${roll.total} vs DC ${destInfo.hazardDC} (${statName}) and hopped across the water studs safely!`,
          'roll'
        );
        this.spawnFloatingText(
          hero.mesh.position,
          `SAFE HOP! (${roll.total} vs DC ${destInfo.hazardDC})`,
          '#38bdf8'
        );
      } else {
        const dmg = diff.waterHazardDmg;
        hero.hp = Math.max(0, hero.hp - dmg);
        sound.playFrogCroak();
        this.addLog(
          `💦 ${hero.name} slipped in the dangerous frog water (${roll.total} vs DC ${destInfo.hazardDC}) and took ${dmg} damage!`,
          'combat'
        );
        this.spawnFloatingText(hero.mesh.position, `-${dmg} HP (Water Hazard)`, '#fb7185');
      }
    }

    for (const mole of this.monsters) {
      if (mole.alive && mole.burrowed) {
        const d = Math.hypot(mole.x - hero.x, mole.z - hero.z);
        if (d <= 4.2) {
          mole.burrowed = false;
          if (mole.mesh?.userData?.bodyPivot) {
            mole.mesh.userData.bodyPivot.position.y = 0;
          }
          sound.playMoleRumble();
          this.spawnSparkleBurst(gridToWorld(mole.x, mole.z), '#a16207', 14);
          this.spawnFloatingText(
            gridToWorld(mole.x, mole.z),
            'MOLE AMBUSH!',
            '#f59e0b'
          );
          this.addLog(
            `🐾 ${mole.name} erupted from beneath the brown garden soil near ${hero.name}!`,
            'combat'
          );
        }
      }
    }
  }

  async checkTreasureCollectionAt(hero) {
    for (const t of this.treasures) {
      if (t.collected) continue;
      const d = Math.hypot(t.x - hero.x, t.z - hero.z);
      if (d <= 1.45) {
        t.collected = true;
        t.mesh.visible = false;
        this.score += t.points;
        sound.playTreasureCollect(t.category);

        const pos = gridToWorld(t.x, t.z);
        const burstColor =
          t.category === 'gold'
            ? '#facc15'
            : t.category === 'flower'
              ? '#f472b6'
              : '#ff2a5f';
        this.spawnSparkleBurst(pos, burstColor, 20);
        this.spawnFloatingText(
          pos,
          `+${t.name}! (+${t.points})`,
          '#fde047'
        );
        this.addLog(
          `💎 ${hero.name} collected ${t.name} (+${t.points} pts)!`,
          'treasure'
        );

        if (t.category === 'gold' && hero.hp < hero.maxHp) {
          hero.hp = Math.min(hero.maxHp, hero.hp + 2);
          this.spawnFloatingText(hero.mesh.position, '+2 HP (Gold Brick Blessing)', '#4ade80');
        }

        this.updateHUD();
        if (this.checkVictoryOrDefeat()) return;
      }
    }
  }

  // ==========================================================================
  // OFFENSIVE & SUPPORT ABILITIES WITH D20 DIFFICULTY CHECKS
  // ==========================================================================
  async executeSupportAbility(hero, targetHero, ability) {
    sound.playWandSpell();
    const diff = this.difficulty;
    const statBonus = hero.stats[ability.stat] || 3;
    const roll = await this.diceUI.rollCheck({
      actorName: hero.name,
      actionTitle: ability.name,
      statName: ability.stat,
      statBonus,
      situationalBonus: diff.heroRollBonus,
      situationalLabel: `${diff.name} Mode`,
      dc: ability.checkDC || 9,
      accentColor: '#4ade80'
    });

    const heal = roll.isCrit
      ? ability.healAmount + 4
      : roll.success
        ? ability.healAmount
        : Math.ceil(ability.healAmount / 2);

    targetHero.hp = Math.min(targetHero.maxHp, targetHero.hp + heal);
    targetHero.shieldBonus = roll.success ? 2 : 1;

    this.spawnSparkleBurst(targetHero.mesh.position, '#4ade80', 22);
    this.spawnFloatingText(
      targetHero.mesh.position,
      `+${heal} HP & +${targetHero.shieldBonus} Armor DC!`,
      '#4ade80'
    );
    this.addLog(
      `✨ ${hero.name} cast ${ability.name} on ${targetHero.name} (Roll ${roll.total} vs DC ${ability.checkDC}) → Restored ${heal} HP & granted +${targetHero.shieldBonus} Armor DC!`,
      'roll'
    );
  }

  async executeAttackAbility(hero, ability, targetX, targetZ, primaryMonster) {
    const targetWorld = gridToWorld(targetX, targetZ);
    const angle = Math.atan2(
      targetWorld.x - hero.mesh.position.x,
      targetWorld.z - hero.mesh.position.z
    );
    hero.mesh.rotation.y = angle;

    if (hero.mesh.userData.rightArm) {
      hero.mesh.userData.rightArm.rotation.x = -1.35;
      setTimeout(() => {
        if (hero.mesh?.userData?.rightArm) {
          hero.mesh.userData.rightArm.rotation.x =
            hero.id === 'fairy_mage' ? -0.55 : -0.35;
        }
      }, 360);
    }

    let targets = [];
    if (ability.aoeRadius) {
      targets = this.monsters.filter(
        (m) =>
          m.alive &&
          Math.hypot(m.x - targetX, m.z - targetZ) <= ability.aoeRadius + 0.25
      );
    } else if (primaryMonster) {
      targets = [primaryMonster];
    }

    const startWorld = hero.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const endWorld = targetWorld.clone().add(new THREE.Vector3(0, 0.7, 0));

    if (hero.id === 'fairy_mage') {
      sound.playWandSpell();
      await this.animateSpellProjectile(
        startWorld,
        endWorld,
        ability.id === 'unicorn_nova' ? '#f472b6' : '#e066ff'
      );
      if (ability.aoeRadius) {
        this.spawnSparkleBurst(targetWorld, '#f472b6', 32);
        this.heroes.forEach((ally) => {
          if (ally.alive && ally.hp < ally.maxHp) {
            ally.hp = Math.min(ally.maxHp, ally.hp + (ability.healAmount || 4));
            this.spawnFloatingText(
              ally.mesh.position,
              `+${ability.healAmount || 4} HP (Crystal Glow)`,
              '#4ade80'
            );
          }
        });
      }
    } else {
      sound.playSwordSlash(ability.id === 'sonic_blade_wave');
      if (ability.id === 'sonic_blade_wave') {
        await this.animateSpellProjectile(startWorld, endWorld, '#00f5d4');
      } else {
        this.spawnSparkleBurst(endWorld, '#38bdf8', 22);
      }
    }

    const diff = this.difficulty;
    const heroTile = getTileInfo(hero.x, hero.z);
    const shrinePos = activeWorld?.wandShrinePos || { x: 13, z: 5 };

    let sitBonus = diff.heroRollBonus;
    const sitLabels = [];
    if (diff.heroRollBonus !== 0) sitLabels.push(`${diff.name}`);
    if (heroTile.type === TERRAIN.BRIDGE) {
      sitBonus += 1;
      sitLabels.push('Bridge High Ground');
    } else if (Math.hypot(hero.x - shrinePos.x, hero.z - shrinePos.z) <= 4) {
      sitBonus += 1;
      sitLabels.push('Fairy Totem');
    }

    const statBonus = hero.stats[ability.stat] || 4;

    if (targets.length === 0) {
      this.spawnSparkleBurst(targetWorld, hero.accentColor, 16);
      this.addLog(
        `✨ ${hero.name} unleashed ${ability.name} at stud (${targetX}, ${targetZ})!`,
        'info'
      );
      return;
    }

    for (const monster of targets) {
      const unearths =
        ability.id === 'earthshaker_slam' || ability.id === 'unicorn_nova';
      const effectiveDC =
        monster.burrowed && !unearths ? monster.dc + 2 : monster.dc;

      const roll = await this.diceUI.rollCheck({
        actorName: hero.name,
        actionTitle: `${ability.name} vs ${monster.name}`,
        statName: ability.stat,
        statBonus,
        situationalBonus: sitBonus,
        situationalLabel: sitLabels.join(' + '),
        dc: effectiveDC,
        accentColor: hero.accentColor
      });

      if (unearths && monster.burrowed) {
        monster.burrowed = false;
        if (monster.mesh?.userData?.bodyPivot) {
          monster.mesh.userData.bodyPivot.position.y = 0;
        }
        sound.playMoleRumble();
        this.spawnFloatingText(
          monster.mesh.position,
          'UNEARTHED!',
          '#f59e0b'
        );
      }

      if (roll.success) {
        let dmg =
          Math.floor(Math.random() * (ability.maxDmg - ability.minDmg + 1)) +
          ability.minDmg;
        if (roll.isCrit) dmg = Math.round(dmg * 1.75);

        monster.hp = Math.max(0, monster.hp - dmg);
        this.spawnSparkleBurst(monster.mesh.position, '#fde047', 18);
        this.spawnFloatingText(
          monster.mesh.position,
          `${roll.isCrit ? 'CRIT! ' : ''}-${dmg} HP`,
          roll.isCrit ? '#fde047' : '#fb7185'
        );

        if (ability.id === 'earthshaker_slam') {
          monster.stunned = true;
        }

        this.addLog(
          `🎯 ${hero.name}'s ${ability.name} hit ${monster.name} (Roll ${roll.total} vs DC ${effectiveDC}) for ${dmg} damage!`,
          'combat'
        );

        if (monster.hp <= 0) {
          monster.alive = false;
          monster.mesh.visible = false;
          this.score += 150;
          this.spawnSparkleBurst(monster.mesh.position, '#a855f7', 28);
          this.spawnFloatingText(
            monster.mesh.position,
            'DEFEATED! (+150 pts)',
            '#4ade80'
          );
          this.addLog(
            `🏆 ${monster.name} was defeated by ${hero.name}! (+150 pts)`,
            'treasure'
          );
        }
      } else {
        this.spawnFloatingText(
          monster.mesh.position,
          `MISS (${roll.total} < DC ${effectiveDC})`,
          '#94a3b8'
        );
        this.addLog(
          `🛡️ ${monster.name} evaded ${hero.name}'s ${ability.name} (Roll ${roll.total} vs DC ${effectiveDC}).`,
          'roll'
        );
      }
    }
  }

  async animateSpellProjectile(startVec, endVec, colorHex) {
    const starGeo = createFivePointStarGeometry(0.28, 0.13, 0.08);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    const proj = new THREE.Mesh(starGeo, mat);
    proj.position.copy(startVec);
    this.vfxGroup.add(proj);

    const duration = 260;
    const t0 = performance.now();
    await new Promise((resolve) => {
      const step = () => {
        const t = Math.min(1, (performance.now() - t0) / duration);
        proj.position.lerpVectors(startVec, endVec, t);
        proj.position.y += Math.sin(t * Math.PI) * 0.9;
        proj.rotation.z += 0.25;
        proj.rotation.y += 0.2;
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      step();
    });

    this.vfxGroup.remove(proj);
  }

  // ==========================================================================
  // TURN MANAGEMENT & MONSTER AI PHASE
  // ==========================================================================
  checkAutoEndTurn() {
    if (this.turnPhase !== 'HEROES' || this.busy) return;
    const anyHeroHasAp = this.heroes.some((h) => h.alive && h.ap > 0);
    if (!anyHeroHasAp) {
      setTimeout(() => this.endHeroesTurn(), 450);
    } else if (this.activeHero && this.activeHero.ap === 0) {
      const otherIdx = this.heroes.findIndex((h) => h.alive && h.ap > 0);
      if (otherIdx !== -1) {
        this.selectHero(otherIdx);
      }
    }
  }

  async endHeroesTurn() {
    if (this.busy || this.turnPhase !== 'HEROES') return;
    this.busy = true;
    this.turnPhase = 'MONSTERS';
    this.rangeTilesGroup.clear();
    this.pathTilesGroup.clear();
    this.updateHUD();

    this.addLog(
      `🐸 Round ${this.round} — Monster Turn: Killer Frogs and Garden Moles make their moves!`,
      'combat'
    );

    for (const monster of this.monsters) {
      if (!monster.alive) continue;

      const livingHeroes = this.heroes.filter((h) => h.alive);
      if (livingHeroes.length === 0) break;

      livingHeroes.sort(
        (a, b) =>
          Math.hypot(a.x - monster.x, a.z - monster.z) -
          Math.hypot(b.x - monster.x, b.z - monster.z)
      );
      const targetHero = livingHeroes[0];
      let dist = Math.hypot(targetHero.x - monster.x, targetHero.z - monster.z);

      if (dist > 12.5) continue;

      if (monster.stunned) {
        monster.stunned = false;
        this.spawnFloatingText(
          monster.mesh.position,
          'RECOVERED FROM STUN',
          '#fde047'
        );
        await new Promise((r) => setTimeout(r, 320));
        continue;
      }

      if (dist > monster.attackRange) {
        const angle = Math.atan2(
          targetHero.x - monster.x,
          targetHero.z - monster.z
        );
        const stepX = Math.max(
          1,
          Math.min(
            GRID_SIZE - 2,
            Math.round(monster.x + Math.sin(angle) * Math.min(2, monster.moveRange))
          )
        );
        const stepZ = Math.max(
          1,
          Math.min(
            GRID_SIZE - 2,
            Math.round(monster.z + Math.cos(angle) * Math.min(2, monster.moveRange))
          )
        );

        if (!this.isTileOccupied(stepX, stepZ)) {
          const startPos = monster.mesh.position.clone();
          const endPos = gridToWorld(stepX, stepZ);
          monster.mesh.rotation.y = Math.atan2(
            endPos.x - startPos.x,
            endPos.z - startPos.z
          );

          if (monster.kind === 'frog') sound.playFrogCroak();
          else sound.playMoleRumble();

          const t0 = performance.now();
          await new Promise((resolve) => {
            const hop = () => {
              const t = Math.min(1, (performance.now() - t0) / 240);
              monster.mesh.position.lerpVectors(startPos, endPos, t);
              if (monster.kind === 'frog') {
                monster.mesh.position.y += Math.sin(t * Math.PI) * 0.65;
              }
              if (t < 1) requestAnimationFrame(hop);
              else resolve();
            };
            hop();
          });

          monster.x = stepX;
          monster.z = stepZ;
          dist = Math.hypot(targetHero.x - monster.x, targetHero.z - monster.z);
        }
      }

      if (dist <= monster.attackRange + 0.25) {
        if (monster.kind === 'mole' && monster.burrowed) {
          monster.burrowed = false;
          if (monster.mesh?.userData?.bodyPivot) {
            monster.mesh.userData.bodyPivot.position.y = 0;
          }
        }

        const heroWorld = targetHero.mesh.position.clone();
        monster.mesh.rotation.y = Math.atan2(
          heroWorld.x - monster.mesh.position.x,
          heroWorld.z - monster.mesh.position.z
        );

        if (monster.kind === 'frog') {
          sound.playFrogCroak();
          await this.animateFrogTongue(
            monster.mesh.position.clone().add(new THREE.Vector3(0, 0.45, 0)),
            heroWorld.clone().add(new THREE.Vector3(0, 0.9, 0))
          );
        } else {
          sound.playMoleRumble();
        }

        const targetArmorDC = targetHero.armorDC + (targetHero.shieldBonus || 0);
        const attackTitle =
          monster.kind === 'frog' ? 'Tongue Lash Attack' : 'Subterranean Claw Swipe';

        const roll = await this.diceUI.rollCheck({
          actorName: monster.name,
          actionTitle: `${attackTitle} vs ${targetHero.name}`,
          statName: 'MONSTER ATK',
          statBonus: monster.attackBonus,
          dc: targetArmorDC,
          accentColor: '#fb7185'
        });

        if (roll.success) {
          const dmg =
            Math.floor(Math.random() * (monster.maxDmg - monster.minDmg + 1)) +
            monster.minDmg;
          targetHero.hp = Math.max(0, targetHero.hp - dmg);
          this.spawnSparkleBurst(targetHero.mesh.position, '#fb7185', 16);
          this.spawnFloatingText(
            targetHero.mesh.position,
            `-${dmg} HP!`,
            '#fb7185'
          );
          this.addLog(
            `💥 ${monster.name} hit ${targetHero.name} (Roll ${roll.total} vs Armor DC ${targetArmorDC}) for ${dmg} damage!`,
            'combat'
          );

          if (targetHero.hp <= 0) {
            targetHero.alive = false;
            targetHero.mesh.rotation.x = -Math.PI / 2;
            this.addLog(
              `⚠️ ${targetHero.name} was knocked down!`,
              'combat'
            );
          }
        } else {
          this.spawnFloatingText(
            targetHero.mesh.position,
            `DODGED! (${roll.total} < DC ${targetArmorDC})`,
            '#38bdf8'
          );
          this.addLog(
            `🛡️ ${targetHero.name} deflected ${monster.name}'s attack (Roll ${roll.total} vs Armor DC ${targetArmorDC})!`,
            'roll'
          );
        }

        this.updateHUD();
        if (this.checkVictoryOrDefeat()) return;
      }
    }

    this.round += 1;
    this.turnPhase = 'HEROES';
    this.heroes.forEach((h) => {
      if (h.alive) {
        h.ap = h.maxAp;
        h.shieldBonus = 0;
      }
    });

    const firstAliveIdx = this.heroes.findIndex((h) => h.alive);
    if (firstAliveIdx !== -1) {
      this.selectedHeroIndex = firstAliveIdx;
    }

    this.busy = false;
    this.selectHero(this.selectedHeroIndex, false);
    this.addLog(
      `🌟 Round ${this.round} — Heroes' Turn! AP restored.`,
      'info'
    );
  }

  async animateFrogTongue(startVec, endVec) {
    const pts = [startVec, endVec];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: '#ff4d94', linewidth: 4 });
    const line = new THREE.Line(geo, mat);
    this.vfxGroup.add(line);
    await new Promise((r) => setTimeout(r, 220));
    this.vfxGroup.remove(line);
  }

  // ==========================================================================
  // VICTORY / DEFEAT & VISUAL EFFECTS
  // ==========================================================================
  checkVictoryOrDefeat() {
    if (this.turnPhase === 'GAMEOVER') return true;

    const evalState = this.activeWinCondition
      ? this.activeWinCondition.evaluate(this.monsters, this.treasures)
      : {
          complete:
            this.treasures.filter((t) => t.collected).length >=
            this.treasures.length
        };

    if (evalState.complete) {
      this.turnPhase = 'GAMEOVER';
      this.busy = true;
      sound.playTreasureCollect('gold');
      this.showEndGameModal(true);
      return true;
    }

    const anyHeroAlive = this.heroes.some((h) => h.alive);
    if (!anyHeroAlive) {
      this.turnPhase = 'GAMEOVER';
      this.busy = true;
      this.showEndGameModal(false);
      return true;
    }
    return false;
  }

  showEndGameModal(victory) {
    const dialog = document.getElementById('endgame-dialog');
    const title = document.getElementById('endgame-title');
    const summary = document.getElementById('endgame-summary');
    if (!dialog) return;

    const collectedCount = this.treasures.filter((t) => t.collected).length;
    const defeatedMonsters = this.monsters.filter((m) => !m.alive).length;
    const heroNames = this.heroes.map((h) => `<strong>${h.name.split(' ')[0]}</strong>`).join(' and ');
    const questTitle = this.activeWinCondition?.title || 'Collect all treasures';

    if (victory) {
      title.textContent = '🎉 Quest Complete — Victory!';
      summary.innerHTML = `${heroNames} fulfilled the win condition <strong>"${questTitle}"</strong> in <strong>${activeWorld.name}</strong> (${this.difficulty.name})!<br/><br/>📊 Final Tally: <strong>${collectedCount}/${this.treasures.length} Treasures</strong> collected, <strong>${defeatedMonsters}/${this.monsters.length} Enemies</strong> defeated, and <strong>${this.score} Points</strong> in <strong>${this.round} Rounds</strong>!`;
    } else {
      title.textContent = '💔 The Monsters Guarded the Dungeon...';
      summary.innerHTML = `${heroNames} fought bravely toward <strong>"${questTitle}"</strong> in <strong>${activeWorld.name}</strong> (${this.difficulty.name}), collecting <strong>${collectedCount}/${this.treasures.length} Treasures</strong> and defeating <strong>${defeatedMonsters}/${this.monsters.length} Enemies</strong> (${this.score} Points). Ready to roll the d20 and try again?`;
    }

    dialog.showModal();
  }

  spawnSparkleBurst(worldPos, colorHex, count = 16) {
    const geo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });

    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(worldPos).add(new THREE.Vector3(0, 0.4, 0));
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4.2,
        1.8 + Math.random() * 2.8,
        (Math.random() - 0.5) * 4.2
      );
      this.vfxGroup.add(m);
      this.activeParticles.push({
        mesh: m,
        vel,
        born: performance.now(),
        life: 550 + Math.random() * 250
      });
    }
  }

  spawnFloatingText(worldPos, text, color = '#ffffff') {
    if (!this.floatingLayer) return;
    const projected = worldPos.clone().add(new THREE.Vector3(0, 1.8, 0));
    projected.project(this.camera);

    const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(projected.y * 0.5) + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = 'floating-label';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    el.textContent = text;
    this.floatingLayer.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, 1450);
  }

  setCameraPreset(preset) {
    sound.playBrickStep(1);
    if (preset === 'isometric') {
      this.camera.position.set(0, 26, 28);
      this.controls.target.set(0, 0.5, 2);
    } else if (preset === 'top-view') {
      this.camera.position.set(0, 38, 4.5);
      this.controls.target.set(0, 0, 0);
    } else if (preset === 'side-view') {
      this.camera.position.set(0, 9.5, 27.5);
      this.controls.target.set(0, 0.8, -2);
    } else if (preset === 'hero-closeup') {
      const h = this.activeHero;
      const wp = gridToWorld(h.x, h.z);
      this.camera.position.set(wp.x + 3.5, wp.y + 6.5, wp.z + 7.5);
      this.controls.target.set(wp.x, wp.y + 1.1, wp.z);
    }
    this.controls.update();
  }

  // ==========================================================================
  // HUD & COMBAT LOG UPDATES
  // ==========================================================================
  addLog(text, category = 'info') {
    this.logMessages.unshift({ text, category });
    if (this.logMessages.length > 25) this.logMessages.pop();

    const listEl = document.getElementById('combat-log-list');
    if (!listEl) return;
    listEl.innerHTML = this.logMessages
      .slice(0, 8)
      .map(
        (m) =>
          `<div class="log-entry log-${m.category}">${m.text}</div>`
      )
      .join('');
  }

  syncSetupControlsUI() {
    const diffSelect = document.getElementById('select-difficulty');
    if (diffSelect) diffSelect.value = this.difficultyKey;

    const partySelect = document.getElementById('select-party');
    if (partySelect) partySelect.value = this.partyModeKey;

    const winSelect = document.getElementById('select-win-condition');
    if (winSelect) winSelect.value = this.winConditionOption;

    const mapBadge = document.getElementById('active-map-badge');
    if (mapBadge && activeWorld) {
      mapBadge.textContent =
        this.mapMode === 'random' ? `🎲 ${activeWorld.name}` : '🗺️ Starter Map';
    }
  }

  updateHUD() {
    const rubies = this.treasures.filter((t) => t.category === 'ruby');
    const golds = this.treasures.filter((t) => t.category === 'gold');
    const flowers = this.treasures.filter((t) => t.category === 'flower');

    const rDone = rubies.filter((t) => t.collected).length;
    const gDone = golds.filter((t) => t.collected).length;
    const fDone = flowers.filter((t) => t.collected).length;
    const totalDone = rDone + gDone + fDone;

    const frogs = this.monsters.filter((m) => m.kind === 'frog');
    const moles = this.monsters.filter((m) => m.kind === 'mole');
    const frogsDefeated = frogs.filter((m) => !m.alive).length;
    const molesDefeated = moles.filter((m) => !m.alive).length;

    document.getElementById('count-rubies').textContent = `${rDone}/${rubies.length}`;
    document.getElementById('count-gold').textContent = `${gDone}/${golds.length}`;
    document.getElementById('count-flowers').textContent = `${fDone}/${flowers.length}`;
    document.getElementById('count-total').textContent = `${totalDone}/${this.treasures.length}`;

    const frogCountEl = document.getElementById('count-frogs');
    if (frogCountEl) frogCountEl.textContent = `${frogsDefeated}/${frogs.length}`;
    const moleCountEl = document.getElementById('count-moles');
    if (moleCountEl) moleCountEl.textContent = `${molesDefeated}/${moles.length}`;

    document.getElementById('round-indicator').textContent = `Round ${this.round} • ${
      this.turnPhase === 'HEROES' ? "Heroes' Turn" : 'Monsters Acting...'
    }`;

    // Update Active Win Condition Quest Card
    if (this.activeWinCondition) {
      const evalState = this.activeWinCondition.evaluate(
        this.monsters,
        this.treasures
      );
      const qTitleEl = document.getElementById('quest-title-text');
      const qProgEl = document.getElementById('quest-progress-text');
      const qFillEl = document.getElementById('quest-progress-fill');
      if (qTitleEl) {
        qTitleEl.textContent = `🎯 Goal (${this.activeWinCondition.code}): ${this.activeWinCondition.title}`;
      }
      if (qProgEl) {
        qProgEl.textContent = evalState.progressText;
      }
      if (qFillEl) {
        qFillEl.style.width = `${evalState.pct}%`;
      }
    }

    const switchBtn = document.getElementById('btn-switch-hero');
    if (switchBtn) {
      switchBtn.style.display = this.heroes.length > 1 ? 'inline-flex' : 'none';
    }

    const partyContainer = document.getElementById('party-cards');
    if (partyContainer) {
      partyContainer.innerHTML = this.heroes
        .map((h, idx) => {
          const isSelected = idx === this.selectedHeroIndex;
          const hpPct = Math.round((h.hp / h.maxHp) * 100);
          const apDots = Array.from({ length: h.maxAp })
            .map(
              (_, i) =>
                `<span class="ap-pip ${i < h.ap ? 'filled' : ''}"></span>`
            )
            .join('');

          const statChips = Object.entries(h.stats)
            .map(
              ([k, v]) =>
                `<span class="stat-chip">${k.slice(0, 3)} +${v}</span>`
            )
            .join('');

          return `
            <div class="hero-card ${isSelected ? 'selected' : ''} ${!h.alive ? 'downed' : ''}" data-hero-index="${idx}">
              <div class="hero-card-header">
                <div class="hero-avatar ${h.id}">${h.id === 'fairy_mage' ? '🪄' : '⚔️'}</div>
                <div class="hero-meta">
                  <div class="hero-name">${h.name}</div>
                  <div class="hero-sub">${h.subtitle} • AC DC ${h.armorDC + (h.shieldBonus || 0)}</div>
                </div>
                <div class="hero-key-hint">${this.heroes.length > 1 ? `[${idx + 1}]` : 'SOLO'}</div>
              </div>
              <div class="hp-bar-track">
                <div class="hp-bar-fill" style="width:${hpPct}%"></div>
                <span class="hp-bar-text">❤️ ${h.hp} / ${h.maxHp} HP</span>
              </div>
              <div class="ap-row">
                <span class="ap-label">AP (${h.ap}/${h.maxAp}):</span>
                <div class="ap-pips">${apDots}</div>
              </div>
              <div class="stat-row">${statChips}</div>
            </div>
          `;
        })
        .join('');

      partyContainer.querySelectorAll('.hero-card').forEach((card) => {
        card.addEventListener('click', () => {
          const idx = Number(card.getAttribute('data-hero-index'));
          this.selectHero(idx);
        });
      });
    }

    const hero = this.activeHero;
    const hotbar = document.getElementById('ability-hotbar');
    const descEl = document.getElementById('ability-description');

    if (hotbar && hero) {
      hotbar.innerHTML = hero.abilities
        .map((ab) => {
          const active = ab.id === this.selectedAbilityId;
          const disabled = hero.ap < ab.apCost || this.turnPhase !== 'HEROES';
          return `
            <button class="ability-btn ${active ? 'active' : ''}" ${disabled ? 'disabled' : ''} data-ability-id="${ab.id}">
              <span class="ability-icon">${ab.icon}</span>
              <span class="ability-info">
                <strong>${ab.name}</strong>
                <small>${ab.apCost} AP • Rng ${ab.range} • +${hero.stats[ab.stat] || 3} ${ab.stat}</small>
              </span>
            </button>
          `;
        })
        .join('');

      hotbar.querySelectorAll('.ability-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-ability-id');
          this.selectAbility(id);
        });
      });

      const currAb = this.activeAbility;
      if (descEl && currAb) {
        descEl.textContent = currAb.desc;
      }
    }
  }

  // ==========================================================================
  // INPUT & DIALOG BINDINGS
  // ==========================================================================
  _bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hits = this.raycaster.intersectObject(this.hitPlane);
      if (hits.length > 0) {
        const pt = hits[0].point;
        const gx = Math.floor(pt.x + GRID_SIZE / 2);
        const gz = Math.floor(pt.z + GRID_SIZE / 2);
        if (gx >= 0 && gx < GRID_SIZE && gz >= 0 && gz < GRID_SIZE) {
          if (
            !this.hoveredTile ||
            this.hoveredTile.x !== gx ||
            this.hoveredTile.z !== gz
          ) {
            this.hoveredTile = { x: gx, z: gz };
            this.updateHoverPath(gx, gz);
          }
        }
      }
    });

    let downPos = { x: 0, y: 0 };
    this.canvas.addEventListener('pointerdown', (e) => {
      downPos = { x: e.clientX, y: e.clientY };
    });

    this.canvas.addEventListener('pointerup', (e) => {
      if (e.button !== 0) return;
      const moveDist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      if (moveDist > 6) return;

      if (this.hoveredTile) {
        this.handleTileClick(this.hoveredTile.x, this.hoveredTile.z);
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === '1') this.selectHero(0);
      else if (e.key === '2' && this.heroes.length > 1) this.selectHero(1);
      else if (e.key === 'Tab' && this.heroes.length > 1) {
        e.preventDefault();
        this.selectHero(this.selectedHeroIndex === 0 ? 1 : 0);
      } else if (e.key === ' ') {
        e.preventDefault();
        this.endHeroesTurn();
      }
    });

    // Difficulty, Party Mode, Win Condition & Map Generator Controls
    document.getElementById('select-difficulty')?.addEventListener('change', (e) => {
      this.difficultyKey = e.target.value;
      sound.playBrickStep(3);
      this.resetGame({ regenerateMap: false });
    });

    document.getElementById('select-party')?.addEventListener('change', (e) => {
      this.partyModeKey = e.target.value;
      sound.playBrickStep(3);
      this.resetGame({ regenerateMap: false });
    });

    document.getElementById('select-win-condition')?.addEventListener('change', (e) => {
      this.winConditionOption = e.target.value;
      sound.playBrickStep(4);
      this.activeWinCondition = createWinCondition(
        this.winConditionOption,
        this.monsters,
        this.treasures
      );
      this.addLog(
        `🎯 New Win Condition (${this.activeWinCondition.code}): ${this.activeWinCondition.title}!`,
        'treasure'
      );
      this.updateHUD();
      this.checkVictoryOrDefeat();
    });

    document.getElementById('btn-reroll-quest')?.addEventListener('click', () => {
      this.winConditionOption = 'random';
      sound.playDiceRoll();
      this.activeWinCondition = createWinCondition(
        'random',
        this.monsters,
        this.treasures
      );
      this.syncSetupControlsUI();
      this.addLog(
        `🎲 Rerolled Win Condition (${this.activeWinCondition.code}): ${this.activeWinCondition.title}!`,
        'treasure'
      );
      this.updateHUD();
      this.checkVictoryOrDefeat();
    });

    document.getElementById('btn-random-dungeon')?.addEventListener('click', () => {
      if (this.mapMode === 'starter' && this.winConditionOption === '5_collect_all_treasure') {
        this.winConditionOption = 'random';
      }
      this.mapMode = 'random';
      sound.playTreasureCollect('ruby');
      this.resetGame({ regenerateMap: true });
    });

    document.getElementById('btn-starter-world')?.addEventListener('click', () => {
      this.mapMode = 'starter';
      sound.playBrickStep(2);
      this.resetGame({ regenerateMap: true });
    });

    document.getElementById('btn-end-turn')?.addEventListener('click', () => {
      this.endHeroesTurn();
    });

    document.getElementById('btn-switch-hero')?.addEventListener('click', () => {
      if (this.heroes.length > 1) {
        this.selectHero(this.selectedHeroIndex === 0 ? 1 : 0);
      }
    });

    document.getElementById('btn-mute')?.addEventListener('click', (e) => {
      const muted = sound.toggleMute();
      e.currentTarget.textContent = muted ? '🔇 Muted' : '🔊 Sound';
    });

    document.querySelectorAll('[data-cam-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-cam-preset');
        this.setCameraPreset(preset);
      });
    });

    document.getElementById('btn-restart')?.addEventListener('click', () => {
      const dlg = document.getElementById('endgame-dialog');
      if (dlg?.open) dlg.close();
      this.resetGame({ regenerateMap: false });
    });

    document.getElementById('btn-restart-random')?.addEventListener('click', () => {
      const dlg = document.getElementById('endgame-dialog');
      if (dlg?.open) dlg.close();
      this.mapMode = 'random';
      this.resetGame({ regenerateMap: true });
    });
  }

  _setupDialogs() {
    let supportsDisplayTransition;
    function canTransitionDisplay() {
      if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
      const probe = document.createElement('div');
      probe.style.cssText =
        'transition: display 1s allow-discrete !important; display: block;';
      document.body.appendChild(probe);
      getComputedStyle(probe).display;
      probe.style.display = 'none';
      supportsDisplayTransition = getComputedStyle(probe).display === 'block';
      probe.remove();
      return supportsDisplayTransition;
    }

    function supportsTopLayerExit() {
      return window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay();
    }

    async function closeTopLayer(dialog) {
      if (!supportsTopLayerExit()) {
        dialog.setAttribute('data-closing', '');
        const animations = dialog.getAnimations({ subtree: true });
        if (animations.length > 0) {
          await Promise.race([
            Promise.allSettled(animations.map((a) => a.finished)),
            new Promise((r) => setTimeout(r, 2000))
          ]);
        }
        if (!dialog.hasAttribute('data-closing')) return;
        dialog.removeAttribute('data-closing');
      }
      dialog.close();
    }

    document.querySelectorAll('dialog').forEach((dialog) => {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        dialog.addEventListener('click', (event) => {
          if (event.target !== dialog) return;
          const rect = dialog.getBoundingClientRect();
          const isDialogContent =
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width;
          if (isDialogContent) return;
          closeTopLayer(dialog);
        });
      }

      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeTopLayer(dialog);
      });

      dialog.querySelectorAll('[data-close-dialog]').forEach((btn) => {
        btn.addEventListener('click', () => closeTopLayer(dialog));
      });
    });



    document.getElementById('btn-open-rules')?.addEventListener('click', () => {
      document.getElementById('rules-dialog')?.showModal();
    });
  }

  // ==========================================================================
  // ANIMATION LOOP
  // ==========================================================================
  _animate() {
    requestAnimationFrame(() => this._animate());
    const elapsed = this.clock.getElapsedTime();
    const now = performance.now();

    this.treasures.forEach((t, idx) => {
      if (!t.collected && t.mesh) {
        if (t.category === 'ruby') {
          t.mesh.rotation.y = elapsed * 1.4 + idx;
        } else if (t.category === 'flower') {
          t.mesh.rotation.y = Math.sin(elapsed * 1.5 + idx) * 0.18;
        }
      }
    });

    this.heroes.forEach((h, idx) => {
      if (h.alive && h.mesh?.userData?.bodyPivot && !this.busy) {
        h.mesh.userData.bodyPivot.position.y =
          Math.sin(elapsed * 2.6 + idx) * 0.035;
      }
    });

    this.monsters.forEach((m, idx) => {
      if (m.alive && m.mesh?.userData?.bodyPivot && !this.busy) {
        if (m.kind === 'frog') {
          m.mesh.userData.bodyPivot.scale.y =
            1 + Math.sin(elapsed * 3.8 + idx) * 0.06;
        } else if (m.burrowed) {
          m.mesh.userData.bodyPivot.position.y =
            -0.44 + Math.sin(elapsed * 5 + idx) * 0.03;
        }
      }
    });

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      const age = now - p.born;
      if (age >= p.life) {
        this.vfxGroup.remove(p.mesh);
        this.activeParticles.splice(i, 1);
      } else {
        p.mesh.position.addScaledVector(p.vel, 0.016);
        p.vel.y -= 9.5 * 0.016;
        p.mesh.rotation.x += 0.15;
        p.mesh.rotation.y += 0.15;
        p.mesh.scale.setScalar(1 - age / p.life);
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new BrickWorldCRPG();
});

