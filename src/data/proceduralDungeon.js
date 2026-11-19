// Procedural Multi-Room Endless Dungeon Generator
// Scales difficulty, themes, enemies, traps, chests, and Floor Bosses as you descend!

import { TILE_SIZE } from './templeLevel.js';

const BIOMES = [
  { name: 'Forgotten Crypt', floor: 1, accent: 2, theme: 'corrupted' },
  { name: 'Crucible Depths', floor: 4, accent: 1, theme: 'fire' },
  { name: 'Abyssal Cistern', floor: 5, accent: 2, theme: 'water' },
  { name: 'Jade Monolith Vault', floor: 6, accent: 1, theme: 'earth' },
  { name: 'Starlight Rift', floor: 7, accent: 2, theme: 'air' },
  { name: 'Sovereign Sanctum', floor: 2, accent: 8, theme: 'master' },
];

const ENEMY_POOL = [
  { kind: 'skeleton', name: 'Crypt Skeleton', hp: 70, damage: 11 },
  { kind: 'goblin', name: 'Vault Raider', hp: 65, damage: 10 },
  { kind: 'cultist', name: 'Void Cultist', hp: 75, damage: 12 },
  { kind: 'flame_imp', name: 'Cinder Imp', hp: 72, damage: 13 },
  { kind: 'frost_wraith', name: 'Glacial Wraith', hp: 76, damage: 12 },
  { kind: 'stone_sentinel', name: 'Basalt Sentinel', hp: 100, damage: 14 },
  { kind: 'storm_harpy', name: 'Tempest Harpy', hp: 70, damage: 13 },
  { kind: 'alien_jetpack', name: 'Xylosian Jetpack Trooper', hp: 82, damage: 13 },
];

const BOSS_POOL = [
  { kind: 'elemental_fire', element: 'fire', name: 'Ember Overlord', color: '#ff5722', accent: '#ffd166', baseHp: 260, baseDmg: 17 },
  { kind: 'elemental_water', element: 'water', name: 'Tide Sovereign', color: '#00b4d8', accent: '#caf0f8', baseHp: 270, baseDmg: 17 },
  { kind: 'elemental_earth', element: 'earth', name: 'Monolith Warden', color: '#2ecc71', accent: '#a3e635', baseHp: 310, baseDmg: 19 },
  { kind: 'elemental_air', element: 'air', name: 'Tempest Archon', color: '#a29bfe', accent: '#74b9ff', baseHp: 255, baseDmg: 18 },
  { kind: 'alien_commander', element: 'air', name: 'Xylosian Warlord', color: '#10b981', accent: '#38bdf8', baseHp: 280, baseDmg: 18 },
  { kind: 'alien_drummer_boss', element: 'earth', name: 'Seismic Percussionist', color: '#06b6d4', accent: '#f43f5e', baseHp: 310, baseDmg: 19 },
  { kind: 'bard_boss', element: 'light', name: 'Phantom Virtuoso', color: '#f472b6', accent: '#fde047', baseHp: 290, baseDmg: 17 },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateProceduralFloor(floorNum = 1) {
  const width = 34;
  const height = 26;
  const biome = BIOMES[(floorNum - 1) % BIOMES.length];
  const tiles = Array.from({ length: height }, () => Array(width).fill(0));

  const rooms = [];
  const targetRooms = Math.min(8, 5 + Math.floor(floorNum / 2));

  const carveRect = (x1, y1, x2, y2, tile) => {
    for (let y = Math.max(1, y1); y <= Math.min(height - 2, y2); y++) {
      for (let x = Math.max(1, x1); x <= Math.min(width - 2, x2); x++) {
        tiles[y][x] = tile;
      }
    }
  };

  for (let attempt = 0; attempt < 60 && rooms.length < targetRooms; attempt++) {
    const rw = randInt(5, 8);
    const rh = randInt(5, 7);
    const rx = randInt(2, width - rw - 3);
    const ry = randInt(2, height - rh - 3);
    const overlaps = rooms.some(
      (r) => rx <= r.x + r.w + 1 && rx + rw + 1 >= r.x && ry <= r.y + r.h + 1 && ry + rh + 1 >= r.y
    );
    if (overlaps) continue;
    carveRect(rx, ry, rx + rw - 1, ry + rh - 1, biome.floor);
    if (rw >= 6 && rh >= 6) {
      carveRect(rx + 1, ry + 1, rx + rw - 2, ry + rh - 2, biome.accent);
    }
    const cx = Math.floor(rx + rw / 2);
    const cy = Math.floor(ry + rh / 2);
    rooms.push({ x: rx, y: ry, w: rw, h: rh, cx, cy });
  }

  // Guarantee at least 2 rooms if random placement was tight
  if (rooms.length < 2) {
    carveRect(3, 9, 10, 16, biome.floor);
    carveRect(22, 9, 30, 16, biome.accent);
    rooms.push({ x: 3, y: 9, w: 8, h: 8, cx: 6, cy: 12 });
    rooms.push({ x: 22, y: 9, w: 9, h: 8, cx: 26, cy: 12 });
  }

  // Connect rooms in order with 2-tile-wide corridors
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1];
    const b = rooms[i];
    const minX = Math.min(a.cx, b.cx);
    const maxX = Math.max(a.cx, b.cx);
    const minY = Math.min(a.cy, b.cy);
    const maxY = Math.max(a.cy, b.cy);
    carveRect(minX, a.cy, maxX, a.cy + 1, biome.floor);
    carveRect(b.cx, minY, b.cx + 1, maxY, biome.floor);
  }

  // Add decorative torches on walls adjacent to rooms
  for (const r of rooms) {
    if (r.y - 1 >= 0 && tiles[r.y - 1][r.cx] === 0) tiles[r.y - 1][r.cx] = 10;
  }

  const startRoom = rooms[0];
  const bossRoom = rooms[rooms.length - 1];
  tiles[bossRoom.cy][bossRoom.cx] = 9; // Portal dais in boss room

  // Scale enemy stats by floor number
  const hpScale = 1 + (floorNum - 1) * 0.22;
  const dmgScale = 1 + (floorNum - 1) * 0.14;
  const enemies = [];
  const traps = [];
  const chests = [];

  const trapKinds = ['spikes', 'fire_jet', 'arcane_rune'];

  for (let i = 1; i < rooms.length; i++) {
    const r = rooms[i];
    const isBossRoom = i === rooms.length - 1;
    const count = isBossRoom ? Math.min(3, 1 + Math.floor(floorNum / 2)) : Math.min(4, 2 + Math.floor(floorNum / 3));

    for (let j = 0; j < count; j++) {
      const tpl = ENEMY_POOL[randInt(0, ENEMY_POOL.length - 1)];
      const ex = (r.x + 1 + Math.random() * Math.max(1, r.w - 2)) * TILE_SIZE;
      const ey = (r.y + 1 + Math.random() * Math.max(1, r.h - 2)) * TILE_SIZE;
      enemies.push({
        id: `ef${floorNum}_r${i}_${j}`,
        kind: tpl.kind,
        name: `${tpl.name} Lv.${floorNum}`,
        x: ex,
        y: ey,
        hp: Math.round(tpl.hp * hpScale),
        damage: Math.round(tpl.damage * dmgScale),
      });
    }

    // Place a trap in middle rooms
    if (!isBossRoom && Math.random() < 0.7) {
      traps.push({
        id: `tf${floorNum}_${i}`,
        kind: trapKinds[randInt(0, trapKinds.length - 1)],
        x: (r.cx + 0.5) * TILE_SIZE,
        y: (r.cy + 0.5) * TILE_SIZE,
        interval: Math.max(1.8, 2.7 - floorNum * 0.08),
        damage: Math.round(12 * dmgScale),
      });
    }

    // Place a treasure chest in 1-2 rooms per floor
    if (i === Math.floor(rooms.length / 2) || (isBossRoom && floorNum % 2 === 0)) {
      chests.push({
        id: `cf${floorNum}_${i}`,
        tier: isBossRoom ? 'gold' : 'iron',
        x: (r.x + 1.5) * TILE_SIZE,
        y: (r.y + 1.5) * TILE_SIZE,
        lootType: 'potion',
        gold: 50 + floorNum * 25,
        potions: 1,
      });
    }
  }

  // Spawn Floor Guardian Boss in the final room!
  const bossTpl = BOSS_POOL[(floorNum - 1) % BOSS_POOL.length];
  enemies.push({
    id: `boss_floor_${floorNum}`,
    kind: bossTpl.kind,
    element: bossTpl.element,
    isBoss: true,
    isElementalBoss: bossTpl.kind.startsWith('elemental_'),
    name: `Floor ${floorNum} Guardian: ${bossTpl.name}`,
    x: (bossRoom.cx + 0.5) * TILE_SIZE,
    y: (bossRoom.cy + 0.5) * TILE_SIZE,
    hp: Math.round(bossTpl.baseHp * hpScale),
    damage: Math.round(bossTpl.baseDmg * dmgScale),
    color: bossTpl.color,
    accent: bossTpl.accent,
  });

  return {
    version: 1,
    id: `endless_floor_${floorNum}`,
    name: `Endless Abyss — Floor ${floorNum}: ${biome.name}`,
    description: `Procedurally generated Endless Dungeon Floor ${floorNum}. Defeat all foes and the Floor Guardian to unlock the Descent Portal!`,
    isTempleCampaign: false,
    isConcertCampaign: false,
    isEndlessDungeon: true,
    endlessFloor: floorNum,
    templeTheme: biome.theme,
    width,
    height,
    spawn: { x: (startRoom.cx + 0.5) * TILE_SIZE, y: (startRoom.cy + 0.5) * TILE_SIZE },
    portalPos: { x: (bossRoom.cx + 0.5) * TILE_SIZE, y: (bossRoom.cy + 0.5) * TILE_SIZE },
    tiles,
    npcs: [],
    enemies,
    traps,
    chests,
  };
}
