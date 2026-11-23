// LUCID DUEL: SPELLGAUNTLET — Persistent Meta-Progression, Daily Rewards & Daily Missions

import { CARDS, getDefaultStarterDeck } from '../data/cards.js';

const STORAGE_KEY = 'lucid_duel_save_v1';

export const GAUNTLET_UPGRADES = [
  {
    id: 'life_core',
    name: 'Reinforced Life Core',
    icon: '❤️',
    maxRank: 5,
    baseCost: 150,
    costStep: 120,
    desc: '+400 Starting Max LP per rank.',
  },
  {
    id: 'lucid_will',
    name: 'Lucid Willpower',
    icon: '🎲',
    maxRank: 4,
    baseCost: 200,
    costStep: 160,
    desc: '+1 bonus to all d20 Resistance & Domain rolls per rank.',
  },
  {
    id: 'fusion_resonator',
    name: 'Fusion Resonator',
    icon: '🌀',
    maxRank: 5,
    baseCost: 180,
    costStep: 140,
    desc: '+15% Spell Fusion & Conduction damage per rank.',
  },
  {
    id: 'divine_conduit',
    name: 'Divine Conduit',
    icon: '⚡',
    maxRank: 4,
    baseCost: 220,
    costStep: 180,
    desc: '+15% Counter-Surge & Weakness exploit damage per rank.',
  },
  {
    id: 'power_siphon',
    name: 'Power Siphon',
    icon: '💎',
    maxRank: 5,
    baseCost: 160,
    costStep: 140,
    desc: '+20% Lucid Shards & XP earned from every duel.',
  },
  {
    id: 'hologram_cache',
    name: 'Hologram Cache',
    icon: '🃏',
    maxRank: 3,
    baseCost: 300,
    costStep: 250,
    desc: 'Start every duel with +250 Ethereal Shield per rank (Rank 3: +1 Turn 1 Draw).',
  },
];

export const DAILY_REWARD_CALENDAR = [
  { day: 1, label: '300 Lucid Shards', icon: '💎', type: 'shards', amount: 300 },
  { day: 2, label: '150 Arcane Dust', icon: '✨', type: 'dust', amount: 150 },
  { day: 3, label: '450 Lucid Shards', icon: '💎', type: 'shards', amount: 450 },
  { day: 4, label: 'Bonus Epic Spell', icon: '🃏', type: 'epic_card', amount: 1 },
  { day: 5, label: '600 Lucid Shards', icon: '💎', type: 'shards', amount: 600 },
  { day: 6, label: '350 Arcane Dust', icon: '✨', type: 'dust', amount: 350 },
  { day: 7, label: '1,000 Shards + 250 Dust', icon: '👑', type: 'jackpot', shards: 1000, dust: 250 },
];

const MISSION_POOL = [
  { id: 'win_duels',       title: 'Skyline Challenger',  desc: 'Win 2 Duels',                     metric: 'duelsWon',         target: 2, rewardShards: 180, rewardXp: 120 },
  { id: 'trigger_fusions', title: 'Spell Alchemist',     desc: 'Trigger 2 Spell Fusions',         metric: 'fusionsTriggered', target: 2, rewardShards: 200, rewardXp: 140 },
  { id: 'win_d20',         title: 'Lucid Defiance',      desc: 'Succeed on 2 d20 Rolls',          metric: 'd20Success',       target: 2, rewardShards: 160, rewardXp: 100 },
  { id: 'big_hit',         title: 'Kurenos Overdrive',   desc: 'Deal 1,500+ LP in a single hit',  metric: 'bigHits',          target: 1, rewardShards: 220, rewardXp: 150 },
  { id: 'open_pack',       title: 'Void Collector',      desc: 'Open 1 Holographic Gacha Pack',   metric: 'packsOpened',      target: 1, rewardShards: 150, rewardXp: 100 },
  { id: 'play_defense',    title: 'Aegis Tactician',     desc: 'Play 4 Spells in Defense Position', metric: 'defensePlayed',  target: 4, rewardShards: 160, rewardXp: 110 },
  { id: 'self_possess',    title: 'Spirit Vessel',       desc: 'Trigger Spirit Possession once',  metric: 'possessions',      target: 1, rewardShards: 200, rewardXp: 130 },
];

export function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hashDate(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function generateDailyMissions(dateKey) {
  const seed = hashDate(dateKey);
  const pool = [...MISSION_POOL];
  const chosen = [];
  let s = seed;
  for (let i = 0; i < 4 && pool.length > 0; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const idx = s % pool.length;
    const m = pool.splice(idx, 1)[0];
    chosen.push({ ...m, progress: 0, claimed: false });
  }
  return chosen;
}

export function getRankInfo(xp) {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const nextLevelXp = level * level * 100;
  const prevLevelXp = (level - 1) * (level - 1) * 100;
  const titles = [
    'Novice Dreamer',
    'Lucid Initiate',
    'Gauntlet Duelist',
    'Spell Weaver',
    'Domain Breaker',
    'Storyverse Captain',
    'Lucid Lord',
  ];
  const title = titles[Math.min(titles.length - 1, Math.floor((level - 1) / 2))];
  return { level, title, xp, prevLevelXp, nextLevelXp };
}

function createInitialState() {
  const starterDeck = getDefaultStarterDeck();
  const collection = {};
  for (const id of starterDeck) {
    collection[id] = (collection[id] || 0) + 1;
  }
  const today = getTodayKey();
  return {
    shards: 1000, // Enough for an immediate 10-pull!
    dust: 150,
    xp: 0,
    collection,        // { cardId: countOwned }
    mastery: {},       // { cardId: 0..5 }
    starterDeck,       // Array of 12-20 card IDs
    upgrades: {
      life_core: 0,
      lucid_will: 0,
      fusion_resonator: 0,
      divine_conduit: 0,
      power_siphon: 0,
      hologram_cache: 0,
    },
    pityEpic: 0,
    pityDivine: 0,
    totalPulls: 0,
    discoveredFusions: [],
    stats: {
      runsCompleted: 0,
      runsAttempted: 0,
      duelsWon: 0,
      highestHit: 0,
    },
    dailyRewards: {
      streakDay: 0,     // 0..7 claimed in current cycle
      lastClaimDate: null,
    },
    dailyMissions: {
      dateKey: today,
      missions: generateDailyMissions(today),
    },
    activeRun: null,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    const base = createInitialState();
    const merged = {
      ...base,
      ...parsed,
      upgrades: { ...base.upgrades, ...(parsed.upgrades || {}) },
      stats: { ...base.stats, ...(parsed.stats || {}) },
      dailyRewards: { ...base.dailyRewards, ...(parsed.dailyRewards || {}) },
    };
    // Refresh daily missions if date changed
    const today = getTodayKey();
    if (!merged.dailyMissions || merged.dailyMissions.dateKey !== today) {
      merged.dailyMissions = {
        dateKey: today,
        missions: generateDailyMissions(today),
      };
    }
    return merged;
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function trackMissionProgress(state, metric, amount = 1) {
  let updated = false;
  for (const m of state.dailyMissions.missions) {
    if (m.metric === metric && !m.claimed) {
      m.progress = Math.min(m.target, m.progress + amount);
      updated = true;
    }
  }
  if (updated) saveState(state);
}

export function canClaimDailyReward(state) {
  const today = getTodayKey();
  return state.dailyRewards.lastClaimDate !== today;
}

export function claimDailyReward(state) {
  const today = getTodayKey();
  if (state.dailyRewards.lastClaimDate === today) return null;

  const nextDay = (state.dailyRewards.streakDay % 7) + 1;
  const reward = DAILY_REWARD_CALENDAR[nextDay - 1];

  let summary = reward.label;
  if (reward.type === 'shards') {
    state.shards += reward.amount;
  } else if (reward.type === 'dust') {
    state.dust += reward.amount;
  } else if (reward.type === 'epic_card') {
    const epics = Object.values(CARDS).filter((c) => c.rarity === 'epic');
    const pick = epics[Math.floor(Math.random() * epics.length)];
    state.collection[pick.id] = (state.collection[pick.id] || 0) + 1;
    summary = `Epic Spell: ${pick.name}!`;
  } else if (reward.type === 'jackpot') {
    state.shards += reward.shards;
    state.dust += reward.dust;
  }

  state.dailyRewards.streakDay = nextDay;
  state.dailyRewards.lastClaimDate = today;
  saveState(state);
  return { day: nextDay, reward, summary };
}

export function claimMission(state, missionId) {
  const m = state.dailyMissions.missions.find((x) => x.id === missionId);
  if (!m || m.claimed || m.progress < m.target) return null;
  m.claimed = true;
  state.shards += m.rewardShards;
  state.xp += m.rewardXp;
  saveState(state);
  return m;
}

export function getUpgradeCost(upg, currentRank) {
  return upg.baseCost + currentRank * upg.costStep;
}

export function buyUpgrade(state, upgradeId) {
  const upg = GAUNTLET_UPGRADES.find((u) => u.id === upgradeId);
  if (!upg) return { ok: false, reason: 'Unknown upgrade' };
  const rank = state.upgrades[upgradeId] || 0;
  if (rank >= upg.maxRank) return { ok: false, reason: 'Max rank reached' };
  const cost = getUpgradeCost(upg, rank);
  if (state.shards < cost) return { ok: false, reason: 'Not enough Lucid Shards' };
  state.shards -= cost;
  state.upgrades[upgradeId] = rank + 1;
  saveState(state);
  return { ok: true, newRank: rank + 1 };
}

export function getCardMasteryBonus(state, cardId) {
  const lvl = state.mastery[cardId] || 0;
  return 1 + lvl * 0.08; // +8% power/shield per Mastery level (up to +40% at Lv.5)
}
