// LUCID DUEL: SPELLGAUNTLET — Procedural Roguelike Run & Branching Map Engine

import { CARD_LIST } from '../data/cards.js';
import { ACTS, ENEMIES, RELIC_LIST, VOID_EVENTS } from '../data/enemies.js';
import { saveState, trackMissionProgress } from './storage.js';

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getEnemiesByActAndTier(act, tier) {
  return Object.values(ENEMIES).filter((e) => e.act === act && e.tier === tier);
}

export function generateActMap(act) {
  // 5 rows + Boss row (row 5) = 6 floors per Act
  const rows = [];
  for (let r = 0; r < 5; r++) {
    const count = r === 0 ? 2 : r === 4 ? 2 : Math.random() < 0.5 ? 2 : 3;
    const rowNodes = [];
    for (let c = 0; c < count; c++) {
      let type = 'duel';
      if (r === 0) {
        type = 'duel';
      } else if (r === 2) {
        type = c === 0 ? 'elite' : Math.random() < 0.5 ? 'event' : 'duel';
      } else if (r === 4) {
        type = c === 0 ? 'forge' : 'event';
      } else {
        const roll = Math.random();
        if (roll < 0.48) type = 'duel';
        else if (roll < 0.72) type = 'event';
        else if (roll < 0.88) type = 'forge';
        else type = 'elite';
      }

      let enemyId = null;
      let eventId = null;
      if (type === 'duel') {
        enemyId = pickRandom(getEnemiesByActAndTier(act, 'normal')).id;
      } else if (type === 'elite') {
        enemyId = pickRandom(getEnemiesByActAndTier(act, 'elite')).id;
      } else if (type === 'event') {
        eventId = pickRandom(VOID_EVENTS).id;
      }

      rowNodes.push({
        id: `a${act}_r${r}_c${c}`,
        row: r,
        col: c,
        type,
        enemyId,
        eventId,
        cleared: false,
      });
    }
    rows.push(rowNodes);
  }

  // Row 5: Act Boss
  const boss = getEnemiesByActAndTier(act, 'boss')[0];
  rows.push([
    {
      id: `a${act}_boss`,
      row: 5,
      col: 0,
      type: 'boss',
      enemyId: boss.id,
      cleared: false,
    },
  ]);

  return rows;
}

export function startNewRun(metaState) {
  const maxLp = 8000 + (metaState.upgrades.life_core || 0) * 400;
  const run = {
    act: 1,
    currentRow: 0,
    lp: maxLp,
    maxLp,
    deck: [...metaState.starterDeck],
    relics: [],
    map: generateActMap(1),
    duelsWonThisRun: 0,
    completed: false,
    failed: false,
  };

  metaState.stats.runsAttempted += 1;
  metaState.activeRun = run;
  saveState(metaState);
  return run;
}

export function getDuelRewards(metaState, run, enemyTemplate) {
  const siphonMult = 1 + (metaState.upgrades.power_siphon || 0) * 0.2;
  const baseShards = enemyTemplate.tier === 'boss' ? 220 : enemyTemplate.tier === 'elite' ? 120 : 65;
  const baseXp = enemyTemplate.tier === 'boss' ? 180 : enemyTemplate.tier === 'elite' ? 100 : 55;

  const shards = Math.round(baseShards * siphonMult);
  const xp = Math.round(baseXp * siphonMult);

  // Offer 3 stealable spell cards (weighted by enemy deck + higher rarity for elite/boss)
  const pool = CARD_LIST.filter((c) => {
    if (enemyTemplate.tier === 'boss') return c.rarity === 'epic' || c.rarity === 'divine' || c.rarity === 'rare';
    if (enemyTemplate.tier === 'elite') return c.rarity === 'rare' || c.rarity === 'epic';
    return c.rarity === 'common' || c.rarity === 'rare';
  });

  const choices = [];
  const used = new Set();
  // First choice: steal one of the villain's signature cards!
  const sigId = pickRandom(enemyTemplate.deck);
  if (sigId) {
    choices.push(sigId);
    used.add(sigId);
  }
  while (choices.length < 3 && pool.length > 0) {
    const c = pickRandom(pool);
    if (!used.has(c.id)) {
      used.add(c.id);
      choices.push(c.id);
    }
  }

  // Relic reward for Elites & Bosses
  let relic = null;
  if (enemyTemplate.tier === 'elite' || enemyTemplate.tier === 'boss') {
    const unowned = RELIC_LIST.filter((r) => !run.relics.includes(r.id));
    if (unowned.length > 0) {
      relic = pickRandom(unowned);
    }
  }

  return { shards, xp, cardChoices: choices, relic };
}

export function applyDuelVictory(metaState, run, node, rewards, chosenCardId) {
  metaState.shards += rewards.shards;
  metaState.xp += rewards.xp;
  metaState.stats.duelsWon += 1;
  run.duelsWonThisRun += 1;
  trackMissionProgress(metaState, 'duelsWon', 1);

  if (chosenCardId) {
    run.deck.push(chosenCardId);
  }
  if (rewards.relic && !run.relics.includes(rewards.relic.id)) {
    run.relics.push(rewards.relic.id);
  }

  node.cleared = true;
  if (node.type === 'boss') {
    if (run.act < ACTS.length) {
      run.act += 1;
      run.currentRow = 0;
      run.lp = Math.min(run.maxLp, run.lp + 2500); // Act-clear recovery!
      run.map = generateActMap(run.act);
    } else {
      run.completed = true;
      metaState.stats.runsCompleted += 1;
      metaState.shards += 300; // Full Run Clear Bonus!
      metaState.xp += 250;
    }
  } else {
    run.currentRow += 1;
  }

  saveState(metaState);
}

export function applyRunDefeat(metaState, run) {
  run.failed = true;
  // Consolation Lucid Shards & XP based on progress!
  const consolationShards = 35 + run.duelsWonThisRun * 25;
  const consolationXp = 30 + run.duelsWonThisRun * 20;
  metaState.shards += consolationShards;
  metaState.xp += consolationXp;
  metaState.activeRun = null;
  saveState(metaState);
  return { consolationShards, consolationXp };
}
