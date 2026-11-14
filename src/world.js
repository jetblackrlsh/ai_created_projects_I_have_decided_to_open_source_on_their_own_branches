import * as THREE from 'three';

export const WORLD_RADIUS = 190; // 380x380 playable expanse

export const BIOME_CONFIG = {
  meadow: {
    label: 'Emerald Meadows',
    groundColor: 0x3a6b35,
    campWeight: 1.5,
    mineWeight: 0.7,
    ores: ['ironOre', 'ironOre', 'sunstone'],
    monsters: ['goblin', 'goblin', 'brute'],
  },
  forest: {
    label: 'Ironwood Forest',
    groundColor: 0x254728,
    campWeight: 1.2,
    mineWeight: 0.9,
    ores: ['wood', 'ironOre', 'wood'],
    monsters: ['wolf', 'goblin', 'wolf'],
  },
  desert: {
    label: 'Sunscorched Dunes',
    groundColor: 0xc29b57,
    campWeight: 0.55,
    mineWeight: 1.25,
    ores: ['sunstone', 'sunstone', 'ironOre'],
    monsters: ['scorpion', 'scorpion', 'mage'],
  },
  tundra: {
    label: 'Frostveil Tundra',
    groundColor: 0xb8cde0,
    campWeight: 0.5,
    mineWeight: 1.2,
    ores: ['frostquartz', 'frostquartz', 'ironOre'],
    monsters: ['wraith', 'wolf', 'wraith'],
  },
  highlands: {
    label: 'Ashen Highlands',
    groundColor: 0x453f44,
    campWeight: 0.45,
    mineWeight: 1.65,
    ores: ['obsidian', 'brimstone', 'ironOre'],
    monsters: ['brute', 'mage', 'brute'],
  },
  crystal: {
    label: 'Crystal Crags',
    groundColor: 0x2c2f54,
    campWeight: 0.35,
    mineWeight: 1.8,
    ores: ['crystal', 'voidshard', 'sunstone'],
    monsters: ['knight', 'mage', 'knight'],
  },
};

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2D(ix, iz, seed) {
  let h = (ix * 374761393 + iz * 668265263 + seed * 1442695041) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function valueNoise2D(x, z, seed) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smoothstep(x - ix);
  const fz = smoothstep(z - iz);

  const a = hash2D(ix, iz, seed);
  const b = hash2D(ix + 1, iz, seed);
  const c = hash2D(ix, iz + 1, seed);
  const d = hash2D(ix + 1, iz + 1, seed);

  const ab = a + (b - a) * fx;
  const cd = c + (d - c) * fx;
  return ab + (cd - ab) * fz;
}

function fbm(x, z, seed, octaves = 4) {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    value += amp * valueNoise2D(x * freq, z * freq, seed + i * 97);
    norm += amp;
    amp *= 0.5;
    freq *= 2.02;
  }
  return value / norm;
}

export class ProceduralWorld {
  constructor(seed) {
    this.seed = seed;
    this.rng = mulberry32(seed);
    this.campsites = [];
    this.mines = [];
    this.oreNodes = [];
    this.trees = [];
    this.rocks = [];
    this.monsterSpawns = [];

    this._generatePOIs();
  }

  getBiome(x, z) {
    const dist = Math.hypot(x, z);
    if (dist < 28) return 'meadow';

    const temp = fbm(x * 0.0075 + 11.3, z * 0.0075 - 7.1, this.seed + 501, 3);
    const arcane = fbm(x * 0.0085 - 4.7, z * 0.0085 + 19.2, this.seed + 911, 3);

    if (arcane > 0.63 && dist > 55) return 'crystal';
    if (temp < 0.34) return 'tundra';
    if (temp > 0.66) return 'desert';
    if (arcane < 0.38 && dist > 42) return 'highlands';
    if (fbm(x * 0.011, z * 0.011, this.seed + 233, 2) > 0.49) return 'forest';
    return 'meadow';
  }

  getBiomeLabel(biome) {
    return BIOME_CONFIG[biome]?.label || 'Emerald Meadows';
  }

  getRawHeight(x, z) {
    const base = fbm(x * 0.014, z * 0.014, this.seed, 4);
    const ridge = Math.abs(fbm(x * 0.025, z * 0.025, this.seed + 313, 3) - 0.5) * 2;
    const dist = Math.hypot(x, z);
    const edgeLift = Math.max(0, (dist - (WORLD_RADIUS - 18)) * 0.55);
    let h = (base - 0.45) * 14 + ridge * 5.5 + edgeLift;
    const spawnBlend = Math.min(1, dist / 24);
    h *= 0.25 + 0.75 * spawnBlend;
    return h;
  }

  getHeight(x, z) {
    let h = this.getRawHeight(x, z);
    for (const c of this.campsites) {
      const d = Math.hypot(x - c.x, z - c.z);
      if (d < 11) {
        const t = smoothstep(Math.max(0, Math.min(1, (d - 5) / 6)));
        h = c.baseY * (1 - t) + h * t;
      }
    }
    for (const m of this.mines) {
      const d = Math.hypot(x - m.x, z - m.z);
      if (d < 13) {
        const t = smoothstep(Math.max(0, Math.min(1, (d - 6) / 7)));
        h = m.baseY * (1 - t) + h * t;
      }
    }
    return h;
  }

  _generatePOIs() {
    // 1. Starter Campsite near spawn
    this.campsites.push({
      id: 'camp_0',
      x: 0,
      z: -12,
      baseY: this.getRawHeight(0, -12),
      biome: 'meadow',
    });

    // 2. Additional campsites weighted by biome campWeight
    const campTarget = 8;
    let tries = 0;
    while (this.campsites.length < campTarget && tries < 360) {
      tries++;
      const angle = this.rng() * Math.PI * 2;
      const rad = 42 + this.rng() * (WORLD_RADIUS - 65);
      const x = Math.cos(angle) * rad;
      const z = Math.sin(angle) * rad;
      const biome = this.getBiome(x, z);
      const weight = BIOME_CONFIG[biome].campWeight;
      if (this.rng() > weight / 1.5) continue;
      if (this.campsites.every((c) => Math.hypot(c.x - x, c.z - z) > 55)) {
        this.campsites.push({
          id: `camp_${this.campsites.length}`,
          x,
          z,
          baseY: this.getRawHeight(x, z),
          biome,
        });
      }
    }

    // 3. Starter Mine nearby
    this.mines.push({
      id: 'mine_0',
      x: 24,
      z: 14,
      baseY: this.getRawHeight(24, 14),
      biome: 'meadow',
    });

    // 4. Procedural Mines weighted by biome mineWeight
    const mineTarget = 12;
    tries = 0;
    while (this.mines.length < mineTarget && tries < 420) {
      tries++;
      const angle = this.rng() * Math.PI * 2;
      const rad = 36 + this.rng() * (WORLD_RADIUS - 55);
      const x = Math.cos(angle) * rad;
      const z = Math.sin(angle) * rad;
      const biome = this.getBiome(x, z);
      const weight = BIOME_CONFIG[biome].mineWeight;
      if (this.rng() > weight / 1.8) continue;
      const clearCamp = this.campsites.every((c) => Math.hypot(c.x - x, c.z - z) > 28);
      const clearMine = this.mines.every((m) => Math.hypot(m.x - x, m.z - z) > 42);
      if (clearCamp && clearMine) {
        this.mines.push({
          id: `mine_${this.mines.length}`,
          x,
          z,
          baseY: this.getRawHeight(x, z),
          biome,
        });
      }
    }

    // 5. Populate Biome-Specific Ore Veins & Timber inside/around Mines
    for (const m of this.mines) {
      const cfg = BIOME_CONFIG[m.biome] || BIOME_CONFIG.meadow;
      const veinCount = 4 + Math.floor(this.rng() * 3);
      for (let i = 0; i < veinCount; i++) {
        const a = (i / veinCount) * Math.PI * 2 + this.rng() * 0.5;
        const r = 3.2 + this.rng() * 5.5;
        const ox = m.x + Math.cos(a) * r;
        const oz = m.z + Math.sin(a) * r;
        const kind = cfg.ores[Math.floor(this.rng() * cfg.ores.length)];
        this.oreNodes.push({
          id: `ore_${this.oreNodes.length}`,
          x: ox,
          z: oz,
          kind,
          charges: 3,
          maxCharges: 3,
          respawnTimer: 0,
        });
      }
      this.oreNodes.push({
        id: `ore_${this.oreNodes.length}`,
        x: m.x - 4.2,
        z: m.z + 2.6,
        kind: 'wood',
        charges: 3,
        maxCharges: 3,
        respawnTimer: 0,
      });
    }

    // 6. Scatter extra world ore/timber nodes matching each biome
    for (let i = 0; i < 64; i++) {
      const a = this.rng() * Math.PI * 2;
      const rad = 18 + this.rng() * (WORLD_RADIUS - 30);
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      if (this.campsites.some((c) => Math.hypot(c.x - x, c.z - z) < 12)) continue;
      const biome = this.getBiome(x, z);
      const cfg = BIOME_CONFIG[biome];
      const kind = this.rng() > 0.35 ? cfg.ores[Math.floor(this.rng() * cfg.ores.length)] : 'wood';
      this.oreNodes.push({
        id: `ore_${this.oreNodes.length}`,
        x,
        z,
        kind,
        charges: 2,
        maxCharges: 2,
        respawnTimer: 0,
      });
    }

    // 7. Biome Props (Trees, Cacti, Ice/Volcanic/Crystal Rocks)
    for (let i = 0; i < 280; i++) {
      const a = this.rng() * Math.PI * 2;
      const rad = 14 + this.rng() * (WORLD_RADIUS - 22);
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      if (this.campsites.some((c) => Math.hypot(c.x - x, c.z - z) < 11)) continue;
      if (this.mines.some((m) => Math.hypot(m.x - x, m.z - z) < 11)) continue;
      const biome = this.getBiome(x, z);
      if (biome === 'highlands' || biome === 'crystal' || biome === 'desert' && this.rng() > 0.45) {
        this.rocks.push({ x, z, scale: 0.8 + this.rng() * 1.4, biome });
      } else {
        this.trees.push({ x, z, scale: 0.85 + this.rng() * 0.75, biome });
      }
    }

    // 8. Biome-Unique Monster Spawns
    for (let i = 0; i < 44; i++) {
      const a = this.rng() * Math.PI * 2;
      const rad = 22 + this.rng() * (WORLD_RADIUS - 34);
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      if (this.campsites.some((c) => Math.hypot(c.x - x, c.z - z) < 19)) continue;
      const biome = this.getBiome(x, z);
      const pool = BIOME_CONFIG[biome].monsters;
      const type = pool[Math.floor(this.rng() * pool.length)];
      this.monsterSpawns.push({ x, z, type, tier: Math.min(3, 1 + Math.floor(rad / 60)) });
    }
  }

  buildTerrainMesh() {
    const size = WORLD_RADIUS * 2;
    const segments = 148;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getHeight(x, z);
      pos.setY(i, y);

      const biome = this.getBiome(x, z);
      c.setHex(BIOME_CONFIG[biome]?.groundColor || 0x3a6b35);

      const shade = 0.86 + Math.min(0.28, Math.max(-0.14, y * 0.018));
      c.multiplyScalar(shade);

      for (const camp of this.campsites) {
        const d = Math.hypot(x - camp.x, z - camp.z);
        if (d < 9) c.lerp(new THREE.Color(0x6b5643), 1 - d / 9);
      }
      for (const mine of this.mines) {
        const d = Math.hypot(x - mine.x, z - mine.z);
        if (d < 10) c.lerp(new THREE.Color(0x475569), 1 - d / 10);
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.04,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    return mesh;
  }
}
