// LUCID DUEL: SPELLGAUNTLET — Holographic Pack Gacha, Crafting & Mastery Engine

import { CARDS, CARD_LIST, RARITIES } from '../data/cards.js';
import { saveState, trackMissionProgress } from './storage.js';

export const BANNERS = [
  {
    id: 'storyverse_origins',
    name: 'Storyverse Origins',
    subtitle: 'Rate-Up: Lucid Light, Kurenos, Rainbow Sword, Axe of 10,000 Souls',
    accent: '#c084fc',
    featured: ['lucid_light', 'kurenos', 'rainbow_sword', 'axe_souls'],
  },
  {
    id: 'dimensional_rift',
    name: 'Dimensional Rift',
    subtitle: 'Rate-Up: Omni-Porta, Death Sword, Supernova, Shrinking Ray',
    accent: '#10b981',
    featured: ['omni_porta', 'death_sword', 'supernova', 'shrinking_ray'],
  },
];

export const PULL_COSTS = {
  single: 100,
  ten: 900,
};

function pickRarity(metaState) {
  metaState.pityEpic += 1;
  metaState.pityDivine += 1;

  if (metaState.pityDivine >= 50) {
    metaState.pityDivine = 0;
    metaState.pityEpic = 0;
    return 'divine';
  }
  if (metaState.pityEpic >= 10) {
    metaState.pityEpic = 0;
    return Math.random() < 0.12 ? 'divine' : 'epic';
  }

  const r = Math.random() * 100;
  if (r < RARITIES.divine.weight) {
    metaState.pityDivine = 0;
    metaState.pityEpic = 0;
    return 'divine';
  }
  if (r < RARITIES.divine.weight + RARITIES.epic.weight) {
    metaState.pityEpic = 0;
    return 'epic';
  }
  if (r < RARITIES.divine.weight + RARITIES.epic.weight + RARITIES.rare.weight) {
    return 'rare';
  }
  return 'common';
}

function pickCardOfRarity(rarity, banner) {
  const pool = CARD_LIST.filter((c) => c.rarity === rarity);
  const featuredInRarity = pool.filter((c) => banner.featured.includes(c.id));
  if (featuredInRarity.length > 0 && Math.random() < 0.55) {
    return featuredInRarity[Math.floor(Math.random() * featuredInRarity.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function performGachaPull(metaState, bannerId, count = 1) {
  const cost = count === 10 ? PULL_COSTS.ten : PULL_COSTS.single * count;
  if (metaState.shards < cost) {
    return { ok: false, reason: `Need ${cost} Lucid Shards!` };
  }
  const banner = BANNERS.find((b) => b.id === bannerId) || BANNERS[0];
  metaState.shards -= cost;
  metaState.totalPulls += count;

  const results = [];
  for (let i = 0; i < count; i++) {
    const rarity = pickRarity(metaState);
    const card = pickCardOfRarity(rarity, banner);
    const prevOwned = metaState.collection[card.id] || 0;
    const isNew = prevOwned === 0;
    let dustGained = 0;

    // Max 3 copies of any card in collection; extras convert to Arcane Dust!
    if (prevOwned >= 3) {
      dustGained = RARITIES[card.rarity].dupDust;
      metaState.dust += dustGained;
    } else {
      metaState.collection[card.id] = prevOwned + 1;
    }

    results.push({ card, isNew, dustGained });
  }

  trackMissionProgress(metaState, 'packsOpened', count === 10 ? 1 : 1);
  saveState(metaState);
  return { ok: true, results };
}

export function craftCard(metaState, cardId) {
  const card = CARDS[cardId];
  if (!card) return { ok: false, reason: 'Invalid card' };
  const owned = metaState.collection[cardId] || 0;
  if (owned >= 3) return { ok: false, reason: 'Already own max 3 copies' };
  const cost = RARITIES[card.rarity].dustCost;
  if (metaState.dust < cost) return { ok: false, reason: `Need ${cost} Arcane Dust` };

  metaState.dust -= cost;
  metaState.collection[cardId] = owned + 1;
  saveState(metaState);
  return { ok: true, owned: owned + 1 };
}

export function upgradeCardMastery(metaState, cardId) {
  const owned = metaState.collection[cardId] || 0;
  if (owned <= 0) return { ok: false, reason: 'Unlock card first' };
  const current = metaState.mastery[cardId] || 0;
  if (current >= 5) return { ok: false, reason: 'Max Mastery Lv.5' };
  const cost = 80 + current * 80;
  if (metaState.dust < cost) return { ok: false, reason: `Need ${cost} Arcane Dust` };

  metaState.dust -= cost;
  metaState.mastery[cardId] = current + 1;
  saveState(metaState);
  return { ok: true, level: current + 1 };
}
