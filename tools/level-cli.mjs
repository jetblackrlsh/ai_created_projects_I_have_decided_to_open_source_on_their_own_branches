#!/usr/bin/env node
// Zero-dependency CLI tool for inspecting Aetherbound level options,
// compiling ASCII-map blueprints into level JSON, validating playability
// (including BFS reachability from spawn), and rendering terminal ASCII previews.

import fs from 'node:fs';
import path from 'node:path';
import { TILE_SIZE, TILE_DEFS } from '../src/data/templeLevel.js';
import { BONUS_SPELLS } from '../src/data/spells.js';

const CHAR_TO_TILE = {
  '#': 0, // Dungeon Wall (solid)
  '.': 1, // Stone Floor
  ',': 2, // Temple Marble
  'O': 3, // Pillar (solid)
  'F': 4, // Crucible (Fire)
  'W': 5, // Tidepool (Water)
  'E': 6, // Monolith (Earth)
  'A': 7, // Skyfloor (Air)
  '=': 8, // Sanctum Carpet
  '*': 9, // Sanctum Altar
  'T': 10, // Torch Wall (solid)
};

const TILE_TO_CHAR = Object.fromEntries(
  Object.entries(CHAR_TO_TILE).map(([ch, id]) => [id, ch])
);

const TILE_BY_ID = Object.fromEntries(TILE_DEFS.map((t) => [t.id, t]));

const ENEMY_PRESETS = {
  skeleton: { name: 'Skeleton Guard', hp: 75, damage: 11, ranged: false, color: '#cbd5e1' },
  goblin: { name: 'Goblin Raider', hp: 65, damage: 10, ranged: false, color: '#65a30d' },
  cultist: { name: 'Dark Cultist', hp: 75, damage: 12, ranged: true, color: '#9333ea' },
  flame_imp: { name: 'Flame Imp', hp: 70, damage: 13, ranged: true, color: '#f97316' },
  frost_wraith: { name: 'Frost Wraith', hp: 75, damage: 12, ranged: true, color: '#38bdf8' },
  stone_sentinel: { name: 'Stone Sentinel', hp: 105, damage: 15, ranged: false, color: '#16a34a' },
  storm_harpy: { name: 'Storm Harpy', hp: 70, damage: 13, ranged: false, color: '#a78bfa' },
};

const TRAP_KINDS = ['spikes', 'fire_jet', 'arcane_rune'];
const CHEST_TIERS = ['wood', 'iron', 'gold'];
const CHEST_LOOT_TYPES = ['gold', 'potion', 'spell'];
const NPC_ROLES = ['priest', 'villager', 'elemental_fire', 'elemental_water', 'elemental_earth', 'elemental_air'];
const QUEST_OBJECTIVES = ['defeat_enemies', 'open_chests', 'temple_campaign'];
const TEMPLE_THEMES = ['corrupted', 'light', 'fire', 'water', 'earth', 'air', 'master'];

function printUsage() {
  console.log(`Aetherbound Level CLI

Usage:
  node tools/level-cli.mjs catalog [--json]
  node tools/level-cli.mjs compile --blueprint <blueprint.json> --out <level.json>
  node tools/level-cli.mjs validate <level.json>
  node tools/level-cli.mjs preview <level.json>

Commands:
  catalog   List tile IDs & ASCII legend, enemy presets, traps, chests, NPC roles, bonus spells, and themes.
  compile   Compile an ASCII-map blueprint JSON (using tileX/tileY coordinates) into a validated level JSON.
  validate  Check schema validity, solid-tile collisions, quest feasibility, and BFS reachability from spawn.
  preview   Render the level tile grid and entities as an ASCII map in the terminal.
`);
}

function parseFlags(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (!next || next.startsWith('--')) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

function cmdCatalog(asJson) {
  if (asJson) {
    console.log(
      JSON.stringify(
        {
          tileSize: TILE_SIZE,
          tiles: TILE_DEFS.map((t) => ({ ...t, ascii: TILE_TO_CHAR[t.id] })),
          enemyPresets: ENEMY_PRESETS,
          trapKinds: TRAP_KINDS,
          chestTiers: CHEST_TIERS,
          chestLootTypes: CHEST_LOOT_TYPES,
          npcRoles: ['priest', 'villager'],
          questObjectives: ['defeat_enemies', 'open_chests'],
          templeThemes: TEMPLE_THEMES,
          bonusSpells: Object.values(BONUS_SPELLS).map((b) => ({
            id: b.id,
            name: b.name,
            desc: b.desc,
          })),
        },
        null,
        2
      )
    );
    return;
  }

  console.log(`=== TILES (TILE_SIZE = ${TILE_SIZE}px) ===`);
  for (const t of TILE_DEFS) {
    console.log(`  [${TILE_TO_CHAR[t.id]}] id=${String(t.id).padStart(2, ' ')}  ${t.name.padEnd(18)} ${t.solid ? '(SOLID)' : '(walkable)'}`);
  }

  console.log('\n=== ENEMY PRESETS (set isBoss: true for boss stats/spread shots) ===');
  for (const [kind, info] of Object.entries(ENEMY_PRESETS)) {
    console.log(`- ${kind.padEnd(15)} ${info.name.padEnd(16)} HP:${info.hp}  DMG:${info.damage}  ${info.ranged ? 'Ranged' : 'Melee'}`);
  }

  console.log(`\n=== TRAPS ===\n  ${TRAP_KINDS.join(', ')} (fields: kind, tileX/tileY, interval [default 2.5s], damage [default 14])`);
  console.log(`\n=== CHESTS ===\n  tiers: ${CHEST_TIERS.join(', ')} | lootType: ${CHEST_LOOT_TYPES.join(', ')} | fields: gold, potions, lootValue (spell ID)`);
  console.log(`\n=== CUSTOM NPCs ===\n  roles: priest, villager | quest objectiveType: defeat_enemies, open_chests`);
  console.log(`\n=== AMBIENT THEMES (templeTheme) ===\n  ${TEMPLE_THEMES.join(', ')} (non-'corrupted' spawns ambient rising particles)`);
  console.log('\n=== BONUS SPELLS (for chest lootValue or NPC quest rewardSpell) ===');
  for (const b of Object.values(BONUS_SPELLS)) {
    console.log(`- ${b.id.padEnd(21)} ${b.name}`);
  }
}

function resolveCoords(obj, label) {
  if (typeof obj.tileX === 'number' && typeof obj.tileY === 'number') {
    return {
      x: (obj.tileX + 0.5) * TILE_SIZE,
      y: (obj.tileY + 0.5) * TILE_SIZE,
    };
  }
  if (typeof obj.x === 'number' && typeof obj.y === 'number') {
    return { x: obj.x, y: obj.y };
  }
  throw new Error(`${label} must specify either (tileX, tileY) or (x, y).`);
}

function compileBlueprint(bp) {
  if (!bp || typeof bp !== 'object') throw new Error('Blueprint must be a JSON object.');
  if (!Array.isArray(bp.map) || bp.map.length < 5) {
    throw new Error('Blueprint "map" must be an array of at least 5 ASCII row strings.');
  }

  const height = bp.map.length;
  const width = bp.map[0].length;
  if (width < 5) throw new Error('Blueprint "map" rows must be at least 5 characters wide.');

  const tiles = [];
  for (let y = 0; y < height; y++) {
    const row = String(bp.map[y]);
    if (row.length !== width) {
      throw new Error(`Map row ${y} has length ${row.length}, expected ${width}.`);
    }
    const tileRow = [];
    for (let x = 0; x < width; x++) {
      const ch = row[x];
      if (!(ch in CHAR_TO_TILE)) {
        throw new Error(
          `Unknown ASCII map character "${ch}" at (x=${x}, y=${y}). Valid chars: ${Object.keys(CHAR_TO_TILE).join(' ')}`
        );
      }
      tileRow.push(CHAR_TO_TILE[ch]);
    }
    tiles.push(tileRow);
  }

  const spawn = resolveCoords(bp.spawn || {}, 'spawn');
  const slug = String(bp.name || 'custom_dungeon')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const npcs = (bp.npcs || []).map((n, idx) => {
    const pos = resolveCoords(n, `npcs[${idx}]`);
    const role = n.role || 'priest';
    const out = {
      id: n.id || `npc_${idx + 1}`,
      name: n.name || `NPC ${idx + 1}`,
      role,
      x: pos.x,
      y: pos.y,
      color: n.color || (role === 'priest' ? '#f8fafc' : '#cbd5e1'),
      accent: n.accent || '#facc15',
      dialogue: n.dialogue || 'Greetings, traveler.',
    };
    if (n.quest) {
      out.quest = {
        title: n.quest.title || 'Dungeon Mission',
        objectiveType: n.quest.objectiveType || 'defeat_enemies',
        targetCount: Number(n.quest.targetCount) || 1,
        rewardGold: Number(n.quest.rewardGold ?? 150),
        ...(n.quest.rewardSpell ? { rewardSpell: n.quest.rewardSpell } : {}),
        ...(n.quest.rewardTitle ? { rewardTitle: n.quest.rewardTitle } : {}),
      };
    }
    return out;
  });

  const enemies = (bp.enemies || []).map((e, idx) => {
    const pos = resolveCoords(e, `enemies[${idx}]`);
    const kind = e.kind || 'skeleton';
    const preset = ENEMY_PRESETS[kind] || ENEMY_PRESETS.skeleton;
    const out = {
      id: e.id || `enemy_${idx + 1}`,
      kind,
      name: e.name || preset.name,
      x: pos.x,
      y: pos.y,
      hp: Number(e.hp ?? (e.isBoss ? preset.hp * 3 : preset.hp)),
      damage: Number(e.damage ?? (e.isBoss ? preset.damage + 6 : preset.damage)),
    };
    if (e.isBoss) out.isBoss = true;
    if (e.color) out.color = e.color;
    return out;
  });

  const traps = (bp.traps || []).map((t, idx) => {
    const pos = resolveCoords(t, `traps[${idx}]`);
    return {
      id: t.id || `trap_${idx + 1}`,
      kind: t.kind || 'spikes',
      x: pos.x,
      y: pos.y,
      interval: Number(t.interval ?? 2.5),
      damage: Number(t.damage ?? 14),
    };
  });

  const chests = (bp.chests || []).map((c, idx) => {
    const pos = resolveCoords(c, `chests[${idx}]`);
    const tier = c.tier || 'iron';
    const lootType = c.lootType || (tier === 'gold' ? 'spell' : 'potion');
    const out = {
      id: c.id || `chest_${idx + 1}`,
      tier,
      x: pos.x,
      y: pos.y,
      lootType,
      gold: Number(c.gold ?? (tier === 'gold' ? 150 : tier === 'iron' ? 80 : 40)),
      potions: Number(c.potions ?? (tier === 'iron' ? 2 : 1)),
    };
    if (lootType === 'spell') {
      out.lootValue = c.lootValue || 'arcane_bolt';
    }
    return out;
  });

  return {
    version: 1,
    id: bp.id || `custom_${slug || 'dungeon'}`,
    name: bp.name || 'Custom Dungeon',
    description: bp.description || 'A custom dungeon for Aetherbound.',
    isTempleCampaign: Boolean(bp.isTempleCampaign),
    templeTheme: bp.templeTheme || 'corrupted',
    width,
    height,
    spawn,
    tiles,
    npcs,
    enemies,
    traps,
    chests,
  };
}

function toTile(wx, wy) {
  return {
    tx: Math.floor(wx / TILE_SIZE),
    ty: Math.floor(wy / TILE_SIZE),
  };
}

export function validateLevel(level) {
  const errors = [];
  const warnings = [];

  if (!level || typeof level !== 'object') {
    return { errors: ['Level JSON must be an object.'], warnings };
  }

  const { width, height, tiles } = level;
  if (!Number.isInteger(width) || width < 5 || width > 80) {
    errors.push(`width (${width}) must be an integer between 5 and 80.`);
  }
  if (!Number.isInteger(height) || height < 5 || height > 80) {
    errors.push(`height (${height}) must be an integer between 5 and 80.`);
  }
  if (!Array.isArray(tiles) || tiles.length !== height) {
    errors.push(`tiles must be a 2D array with ${height} rows.`);
    return { errors, warnings };
  }

  for (let y = 0; y < height; y++) {
    if (!Array.isArray(tiles[y]) || tiles[y].length !== width) {
      errors.push(`tiles[${y}] must have length ${width}.`);
      return { errors, warnings };
    }
    for (let x = 0; x < width; x++) {
      if (!TILE_BY_ID[tiles[y][x]]) {
        errors.push(`Invalid tile ID "${tiles[y][x]}" at (${x}, ${y}).`);
      }
    }
  }

  // Warn if outer border has non-solid tiles
  let openBorder = 0;
  for (let x = 0; x < width; x++) {
    if (!TILE_BY_ID[tiles[0][x]]?.solid) openBorder++;
    if (!TILE_BY_ID[tiles[height - 1][x]]?.solid) openBorder++;
  }
  for (let y = 0; y < height; y++) {
    if (!TILE_BY_ID[tiles[y][0]]?.solid) openBorder++;
    if (!TILE_BY_ID[tiles[y][width - 1]]?.solid) openBorder++;
  }
  if (openBorder > 0) {
    warnings.push(`${openBorder} outer border tile(s) are walkable; enclosing the border with walls (# or T) is recommended.`);
  }

  if (level.templeTheme && !TEMPLE_THEMES.includes(level.templeTheme)) {
    errors.push(`Invalid templeTheme "${level.templeTheme}". Valid: ${TEMPLE_THEMES.join(', ')}`);
  }

  // Spawn check + BFS reachability
  if (!level.spawn || typeof level.spawn.x !== 'number' || typeof level.spawn.y !== 'number') {
    errors.push('Missing valid spawn { x, y }.');
    return { errors, warnings };
  }

  const sp = toTile(level.spawn.x, level.spawn.y);
  const inBounds = (tx, ty) => tx >= 0 && ty >= 0 && tx < width && ty < height;
  const isWalkable = (tx, ty) => inBounds(tx, ty) && !TILE_BY_ID[tiles[ty][tx]]?.solid;

  const reachable = new Set();
  if (!isWalkable(sp.tx, sp.ty)) {
    errors.push(`Spawn at tile (${sp.tx}, ${sp.ty}) is out of bounds or on a solid tile.`);
  } else {
    const queue = [[sp.tx, sp.ty]];
    reachable.add(`${sp.tx},${sp.ty}`);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        const key = `${nx},${ny}`;
        if (!reachable.has(key) && isWalkable(nx, ny)) {
          reachable.add(key);
          queue.push([nx, ny]);
        }
      }
    }
  }

  const seenIds = new Set();
  const checkPlacement = (entity, kindLabel, idx) => {
    const id = entity.id || `${kindLabel}[${idx}]`;
    if (entity.id) {
      if (seenIds.has(entity.id)) {
        warnings.push(`Duplicate entity id "${entity.id}" on ${kindLabel}[${idx}].`);
      }
      seenIds.add(entity.id);
    }
    if (typeof entity.x !== 'number' || typeof entity.y !== 'number') {
      errors.push(`${kindLabel} "${id}" missing numeric x/y.`);
      return;
    }
    const { tx, ty } = toTile(entity.x, entity.y);
    if (!isWalkable(tx, ty)) {
      errors.push(`${kindLabel} "${id}" at tile (${tx}, ${ty}) is out of bounds or inside a solid wall/pillar.`);
    } else if (reachable.size > 0 && !reachable.has(`${tx},${ty}`)) {
      errors.push(`${kindLabel} "${id}" at tile (${tx}, ${ty}) is UNREACHABLE from player spawn (${sp.tx}, ${sp.ty}).`);
    }
  };

  const npcs = level.npcs || [];
  const enemies = level.enemies || [];
  const traps = level.traps || [];
  const chests = level.chests || [];

  npcs.forEach((n, idx) => {
    checkPlacement(n, 'NPC', idx);
    if (n.role && !NPC_ROLES.includes(n.role)) {
      warnings.push(`NPC "${n.name || n.id}" has uncommon role "${n.role}". Standard custom roles: priest, villager.`);
    }
    if (n.quest) {
      const q = n.quest;
      if (!QUEST_OBJECTIVES.includes(q.objectiveType)) {
        errors.push(`NPC "${n.name}" quest has invalid objectiveType "${q.objectiveType}". Valid: defeat_enemies, open_chests`);
      }
      if (q.objectiveType === 'defeat_enemies' && q.targetCount > enemies.length) {
        errors.push(
          `NPC "${n.name}" quest requires defeating ${q.targetCount} enemies, but level only has ${enemies.length}.`
        );
      }
      if (q.objectiveType === 'open_chests' && q.targetCount > chests.length) {
        errors.push(
          `NPC "${n.name}" quest requires opening ${q.targetCount} chests, but level only has ${chests.length}.`
        );
      }
      if (q.rewardSpell && !BONUS_SPELLS[q.rewardSpell]) {
        errors.push(
          `NPC "${n.name}" quest has invalid rewardSpell "${q.rewardSpell}". Valid: ${Object.keys(BONUS_SPELLS).join(', ')}`
        );
      }
    }
  });

  enemies.forEach((e, idx) => {
    checkPlacement(e, 'Enemy', idx);
    if (!ENEMY_PRESETS[e.kind] && e.kind !== 'priest_boss' && !String(e.kind || '').startsWith('elemental_')) {
      warnings.push(`Enemy "${e.name || e.id}" has unknown kind "${e.kind}". Standard presets: ${Object.keys(ENEMY_PRESETS).join(', ')}`);
    }
    if ((e.hp ?? 80) <= 0) errors.push(`Enemy "${e.name || e.id}" must have positive hp.`);
  });

  traps.forEach((t, idx) => {
    checkPlacement(t, 'Trap', idx);
    if (!TRAP_KINDS.includes(t.kind)) {
      errors.push(`Trap "${t.id || idx}" has invalid kind "${t.kind}". Valid: ${TRAP_KINDS.join(', ')}`);
    }
  });

  chests.forEach((c, idx) => {
    checkPlacement(c, 'Chest', idx);
    if (!CHEST_TIERS.includes(c.tier)) {
      errors.push(`Chest "${c.id || idx}" has invalid tier "${c.tier}". Valid: ${CHEST_TIERS.join(', ')}`);
    }
    if (c.lootType && !CHEST_LOOT_TYPES.includes(c.lootType)) {
      errors.push(`Chest "${c.id || idx}" has invalid lootType "${c.lootType}". Valid: ${CHEST_LOOT_TYPES.join(', ')}`);
    }
    if (c.lootType === 'spell' && !BONUS_SPELLS[c.lootValue]) {
      errors.push(
        `Chest "${c.id || idx}" has invalid spell lootValue "${c.lootValue}". Valid: ${Object.keys(BONUS_SPELLS).join(', ')}`
      );
    }
  });

  return { errors, warnings, reachableCount: reachable.size };
}

function printPreview(level) {
  const { width, height, tiles } = level;
  const grid = tiles.map((row) => row.map((id) => TILE_TO_CHAR[id] ?? '?'));

  const put = (wx, wy, ch) => {
    const { tx, ty } = toTile(wx, wy);
    if (tx >= 0 && ty >= 0 && tx < width && ty < height) grid[ty][tx] = ch;
  };

  for (const t of level.traps || []) put(t.x, t.y, '^');
  for (const c of level.chests || []) put(c.x, c.y, 'C');
  for (const e of level.enemies || []) put(e.x, e.y, e.isBoss ? 'B' : 'e');
  for (const n of level.npcs || []) put(n.x, n.y, 'N');
  if (level.spawn) put(level.spawn.x, level.spawn.y, '@');

  console.log(`\n=== PREVIEW: ${level.name} (${width}x${height}, theme=${level.templeTheme || 'corrupted'}) ===`);
  console.log('Legend: @=Spawn  N=NPC  B=Boss  e=Enemy  C=Chest  ^=Trap');
  const header = '    ' + Array.from({ length: width }, (_, i) => String(i % 10)).join('');
  console.log(header);
  for (let y = 0; y < height; y++) {
    console.log(`${String(y).padStart(2, ' ')}  ${grid[y].join('')}`);
  }
  console.log(
    `\nEntities: ${(level.npcs || []).length} NPCs | ${(level.enemies || []).length} Enemies (${(level.enemies || []).filter((e) => e.isBoss).length} Bosses) | ${(level.traps || []).length} Traps | ${(level.chests || []).length} Chests`
  );
  for (const n of level.npcs || []) {
    if (n.quest) {
      console.log(
        `  Quest [${n.name}]: "${n.quest.title}" (${n.quest.objectiveType} x${n.quest.targetCount} -> ${n.quest.rewardGold || 0}g${n.quest.rewardSpell ? ` + ${n.quest.rewardSpell}` : ''})`
      );
    }
  }
}

function cmdCompile(flags) {
  if (!flags.blueprint || !flags.out) {
    console.error('Error: compile requires --blueprint <blueprint.json> and --out <level.json>');
    process.exit(1);
  }
  const bp = JSON.parse(fs.readFileSync(flags.blueprint, 'utf8'));
  const level = compileBlueprint(bp);
  const { errors, warnings, reachableCount } = validateLevel(level);

  for (const w of warnings) console.warn(`WARN:  ${w}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(`ERROR: ${e}`);
    printPreview(level);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(path.resolve(flags.out)), { recursive: true });
  fs.writeFileSync(flags.out, JSON.stringify(level, null, 2) + '\n', 'utf8');
  console.log(`Compiled & validated level JSON -> ${flags.out} (${reachableCount} reachable tiles)`);
  printPreview(level);
}

function cmdValidate(filePath) {
  if (!filePath) {
    console.error('Error: validate requires <level.json>');
    process.exit(1);
  }
  const level = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const { errors, warnings, reachableCount } = validateLevel(level);

  for (const w of warnings) console.warn(`WARN:  ${w}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(`ERROR: ${e}`);
    process.exit(1);
  }

  console.log(`VALID: ${filePath} (${level.width}x${level.height}, ${reachableCount} reachable tiles)`);
}

function cmdPreview(filePath) {
  if (!filePath) {
    console.error('Error: preview requires <level.json>');
    process.exit(1);
  }
  const level = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  printPreview(level);
}

// Entrypoint
const [cmd, ...rest] = process.argv.slice(2);
const { flags, positional } = parseFlags(rest);

if (!cmd || cmd === '-h' || cmd === '--help') {
  printUsage();
  process.exit(0);
} else if (cmd === 'catalog') {
  cmdCatalog(Boolean(flags.json));
} else if (cmd === 'compile') {
  cmdCompile(flags);
} else if (cmd === 'validate') {
  cmdValidate(positional[0]);
} else if (cmd === 'preview') {
  cmdPreview(positional[0]);
} else {
  console.error(`Unknown command: ${cmd}`);
  printUsage();
  process.exit(1);
}
