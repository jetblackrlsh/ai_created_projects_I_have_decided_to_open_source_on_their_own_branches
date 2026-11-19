#!/usr/bin/env node
// Zero-dependency CLI tool for inspecting Aetherbound character options,
// building custom character JSON files, and validating them against game rules.

import fs from 'node:fs';
import path from 'node:path';
import { SPECIES, SPECIES_BY_ID } from '../src/data/species.js';
import { CLASSES, CLASS_BY_ID } from '../src/data/classes.js';
import {
  BONUS_SPELLS,
  HAIR_STYLES,
  EYE_STYLES,
  MAX_POTIONS,
  createDefaultCharacter,
  computeDerivedStats,
  validateCharacterJSON,
} from '../src/data/spells.js';

const STAT_POOL = 20;
const STAT_KEYS = ['str', 'int', 'vit', 'agi', 'wis', 'lck'];
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function printUsage() {
  console.log(`Aetherbound Character CLI

Usage:
  node tools/character-cli.mjs catalog [--json]
  node tools/character-cli.mjs build --spec <spec.json> --out <character.json> [--allow-overbudget]
  node tools/character-cli.mjs validate <character.json> [--allow-overbudget]

Commands:
  catalog   List all 9 species, 24 classes, hair/eye styles, bonus spells, and stat rules.
  build     Build and strictly validate a character JSON file from a partial or full spec JSON.
  validate  Validate an existing character JSON file and print computed derived stats.
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
          statPool: STAT_POOL,
          statKeys: STAT_KEYS,
          maxPotions: MAX_POTIONS,
          scaleRange: [0.85, 1.2],
          species: SPECIES.map((s) => ({
            id: s.id,
            name: s.name,
            tagline: s.tagline,
            defaultColors: s.defaultColors,
            stats: s.stats,
            melee: { name: s.melee.name, desc: s.melee.desc },
            spell: { name: s.spell.name, desc: s.spell.desc, type: s.spell.type },
          })),
          classes: CLASSES.map((c) => ({
            id: c.id,
            name: c.name,
            archetype: c.archetype,
            desc: c.desc,
            defaultColors: c.defaultColors,
            stats: c.stats,
            melee: { name: c.melee.name, desc: c.melee.desc },
            spell: { name: c.spell.name, desc: c.spell.desc, type: c.spell.type },
          })),
          hairStyles: HAIR_STYLES,
          eyeStyles: EYE_STYLES,
          bonusSpells: Object.values(BONUS_SPELLS).map((b) => ({
            id: b.id,
            name: b.name,
            source: b.source,
            desc: b.desc,
          })),
        },
        null,
        2
      )
    );
    return;
  }

  console.log('=== SPECIES (9) ===');
  for (const s of SPECIES) {
    const st = STAT_KEYS.map((k) => `${k.toUpperCase()}:${s.stats[k]}`).join(' ');
    console.log(`- ${s.id} (${s.name}) — ${s.tagline}`);
    console.log(`    Stats: ${st}`);
    console.log(`    Melee: ${s.melee.name} | Spell: ${s.spell.name}`);
  }

  console.log('\n=== CLASSES (24) ===');
  for (const c of CLASSES) {
    const st = STAT_KEYS.map((k) => `${k.toUpperCase()}:${c.stats[k]}`).join(' ');
    console.log(`- ${c.id} (${c.name} · ${c.archetype}) — ${c.desc}`);
    console.log(`    Stats: ${st}`);
    console.log(`    Melee: ${c.melee.name} | Spell: ${c.spell.name}`);
  }

  console.log('\n=== HAIR STYLES ===');
  console.log(HAIR_STYLES.map((h) => `${h.id} (${h.name})`).join(', '));

  console.log('\n=== EYE STYLES ===');
  console.log(EYE_STYLES.map((e) => `${e.id} (${e.name})`).join(', '));

  console.log('\n=== BONUS SPELLS ===');
  for (const b of Object.values(BONUS_SPELLS)) {
    console.log(`- ${b.id} (${b.name}) — ${b.desc}`);
  }

  console.log(`\n=== RULES ===`);
  console.log(`- Bonus stat pool: ${STAT_POOL} points across ${STAT_KEYS.join(', ')} (each 0..20)`);
  console.log(`- Scale: 0.85..1.20 | Potions: 0..${MAX_POTIONS} | Name <= 28 chars | Title <= 36 chars`);
}

export function lintCharacter(raw, { allowOverbudget = false } = {}) {
  const errors = [];
  const warnings = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { errors: ['Character JSON must be a JSON object.'], warnings, normalized: null };
  }

  if (!raw.speciesId || !SPECIES_BY_ID[raw.speciesId]) {
    errors.push(
      `Invalid or missing speciesId "${raw.speciesId}". Valid IDs: ${SPECIES.map((s) => s.id).join(', ')}`
    );
  }
  if (!raw.classId || !CLASS_BY_ID[raw.classId]) {
    errors.push(
      `Invalid or missing classId "${raw.classId}". Valid IDs: ${CLASSES.map((c) => c.id).join(', ')}`
    );
  }

  if (!raw.name || typeof raw.name !== 'string' || !raw.name.trim()) {
    errors.push('Missing or empty character "name".');
  } else if (raw.name.length > 28) {
    warnings.push(`name "${raw.name}" exceeds 28 chars and will be truncated by the game.`);
  }

  if (raw.title && String(raw.title).length > 36) {
    warnings.push(`title "${raw.title}" exceeds 36 chars and will be truncated by the game.`);
  }

  const app = raw.appearance || {};
  const hairIds = new Set(HAIR_STYLES.map((h) => h.id));
  const eyeIds = new Set(EYE_STYLES.map((e) => e.id));

  if (app.hairStyle !== undefined && !hairIds.has(app.hairStyle)) {
    errors.push(`Invalid appearance.hairStyle "${app.hairStyle}". Valid: ${[...hairIds].join(', ')}`);
  }
  if (app.eyeStyle !== undefined && !eyeIds.has(app.eyeStyle)) {
    errors.push(`Invalid appearance.eyeStyle "${app.eyeStyle}". Valid: ${[...eyeIds].join(', ')}`);
  }

  for (const colorKey of ['skinColor', 'hairColor', 'armorColor', 'accentColor']) {
    if (app[colorKey] !== undefined && !HEX_RE.test(String(app[colorKey]))) {
      errors.push(`Invalid appearance.${colorKey} "${app[colorKey]}". Expected #RRGGBB hex color.`);
    }
  }

  if (app.scale !== undefined) {
    const sc = Number(app.scale);
    if (Number.isNaN(sc) || sc < 0.85 || sc > 1.2) {
      errors.push(`appearance.scale (${app.scale}) must be between 0.85 and 1.20.`);
    }
  }

  if (raw.bonusStats) {
    let sum = 0;
    for (const k of STAT_KEYS) {
      const v = raw.bonusStats[k] ?? 0;
      if (!Number.isInteger(v) || v < 0 || v > 25) {
        errors.push(`bonusStats.${k} (${v}) must be an integer between 0 and 25.`);
      } else {
        sum += v;
      }
    }
    if (sum > STAT_POOL && !allowOverbudget) {
      errors.push(
        `bonusStats total is ${sum}, exceeding the standard ${STAT_POOL}-point pool. Reduce stats to ${STAT_POOL} or pass --allow-overbudget.`
      );
    } else if (sum < STAT_POOL) {
      warnings.push(`bonusStats total is ${sum}/${STAT_POOL} (${STAT_POOL - sum} unspent attribute points).`);
    }
  }

  if (raw.bonusSpells !== undefined) {
    if (!Array.isArray(raw.bonusSpells)) {
      errors.push('bonusSpells must be an array of bonus spell IDs.');
    } else {
      for (const id of raw.bonusSpells) {
        if (!BONUS_SPELLS[id]) {
          errors.push(`Unknown bonusSpell "${id}". Valid IDs: ${Object.keys(BONUS_SPELLS).join(', ')}`);
        }
      }
    }
  }

  if (raw.potions !== undefined) {
    const pot = Number(raw.potions);
    if (!Number.isInteger(pot) || pot < 0 || pot > MAX_POTIONS) {
      errors.push(`potions (${raw.potions}) must be an integer between 0 and ${MAX_POTIONS}.`);
    }
  }

  let normalized = null;
  if (errors.length === 0) {
    const defaults = createDefaultCharacter(raw.speciesId, raw.classId);
    const merged = {
      ...defaults,
      ...raw,
      appearance: {
        ...defaults.appearance,
        ...(raw.appearance || {}),
      },
      bonusStats: {
        ...defaults.bonusStats,
        ...(raw.bonusStats || {}),
      },
    };
    normalized = validateCharacterJSON(merged);
  }

  return { errors, warnings, normalized };
}

function printSummary(ch) {
  const sp = SPECIES_BY_ID[ch.speciesId];
  const cl = CLASS_BY_ID[ch.classId];
  const d = computeDerivedStats(ch);
  const spent = STAT_KEYS.reduce((acc, k) => acc + (ch.bonusStats[k] || 0), 0);

  console.log(`\nCharacter: ${ch.name} — "${ch.title}"`);
  console.log(`Species:   ${sp.name} (${sp.id})`);
  console.log(`Class:     ${cl.name} (${cl.id}, ${cl.archetype})`);
  console.log(`Bonus Pts: ${spent}/${STAT_POOL} (${STAT_KEYS.map((k) => `${k.toUpperCase()}:${ch.bonusStats[k]}`).join(' ')})`);
  console.log(`Totals:    ${STAT_KEYS.map((k) => `${k.toUpperCase()}:${d.total[k]}`).join(' ')}`);
  console.log(
    `Derived:   HP ${d.maxHp} | Mana ${d.maxMana} (${d.manaRegen.toFixed(1)}/s) | Speed ${Math.round(d.moveSpeed)} | Melee x${d.meleeMult.toFixed(2)} | Spell x${d.spellMult.toFixed(2)} | Crit ${Math.round(d.critChance * 100)}% | CDR ${Math.round(d.cdr * 100)}%`
  );
  console.log(`Abilities: ${cl.melee.name} / ${sp.melee.name} | ${cl.spell.name} / ${sp.spell.name}`);
  if (ch.bonusSpells.length) {
    console.log(`Bonus:     ${ch.bonusSpells.map((id) => BONUS_SPELLS[id].name).join(', ')}`);
  }
}

function cmdBuild(flags) {
  if (!flags.spec || !flags.out) {
    console.error('Error: build requires --spec <spec.json> and --out <character.json>');
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(flags.spec, 'utf8'));
  const { errors, warnings, normalized } = lintCharacter(raw, {
    allowOverbudget: Boolean(flags['allow-overbudget']),
  });

  for (const w of warnings) console.warn(`WARN:  ${w}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(`ERROR: ${e}`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(path.resolve(flags.out)), { recursive: true });
  fs.writeFileSync(flags.out, JSON.stringify(normalized, null, 2) + '\n', 'utf8');
  console.log(`Wrote valid character JSON -> ${flags.out}`);
  printSummary(normalized);
}

function cmdValidate(filePath, flags) {
  if (!filePath) {
    console.error('Error: validate requires <character.json>');
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const { errors, warnings, normalized } = lintCharacter(raw, {
    allowOverbudget: Boolean(flags['allow-overbudget']),
  });

  for (const w of warnings) console.warn(`WARN:  ${w}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(`ERROR: ${e}`);
    process.exit(1);
  }

  console.log(`VALID: ${filePath}`);
  printSummary(normalized);
}

// Entrypoint
const [cmd, ...rest] = process.argv.slice(2);
const { flags, positional } = parseFlags(rest);

if (!cmd || cmd === '-h' || cmd === '--help') {
  printUsage();
  process.exit(0);
} else if (cmd === 'catalog') {
  cmdCatalog(Boolean(flags.json));
} else if (cmd === 'build') {
  cmdBuild(flags);
} else if (cmd === 'validate') {
  cmdValidate(positional[0], flags);
} else {
  console.error(`Unknown command: ${cmd}`);
  printUsage();
  process.exit(1);
}
