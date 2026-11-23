// LUCID DUEL: SPELLGAUNTLET — Faithful Dream Card Duel & Spell Fusion Engine
// Rules from Dream Journal 11/23/2026:
// - 8,000 LP base, 1 card per turn (Attack or Defense position)
// - Porta Defense catches incoming attacks -> Switch to Attack redirects ("What goes around comes around!")
// - Porta + Porta fuses into Pocket Dimension (d20 Domain Control clash, Porta sealed)
// - Pyro into Pocket Dimension -> Hell Dimension (continuous burn with no escape)
// - Axe of 10,000 Souls -> d20 > 10 resists Possession, OR strike self to get Possessed on purpose (Water Nymph -> Hydro!)
// - Divine Affinity spells overflow Aegis shields; Sacrifice Aegis to unleash a massive Counter-Surge
// - Kurenos + Soaking Wet + Lightning Vulnerability + Unshielded stacks for devastating finishers!

import { CARDS } from '../data/cards.js';
import { FUSIONS, POSSESSION_FORMS, POSSESSION_LIST } from '../data/fusions.js';
import { getCardMasteryBonus, trackMissionProgress } from './storage.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createDuelState(metaState, runState, enemyTemplate) {
  const hasRelic = (id) => runState.relics.includes(id);
  const startShield =
    (hasRelic('leon_hull') ? 700 : 0) +
    (metaState.upgrades.hologram_cache || 0) * 250;

  const playerDeck = shuffle([...runState.deck]);
  const enemyDeck = shuffle([...enemyTemplate.deck, ...enemyTemplate.deck]);

  const duel = {
    turn: 1,
    phase: 'player', // 'player' | 'resolving' | 'victory' | 'defeat'
    enemyTemplate,
    player: {
      name: 'Jet (Lucid Duelist)',
      lp: runState.lp,
      maxLp: runState.maxLp,
      shield: startShield,
      shieldCard: startShield > 0 ? 'aegis' : null,
      shieldIsDivine: startShield > 0,
      activeDefense: null, // { cardId, type: 'porta'|'mirror'|'shield', caught: null | { cardId, damage, secondary } }
      possession: null,    // POSSESSION_FORMS entry or null
      statuses: {},        // { burn: 2, wet: 2, frozen: 1, cursed: 2, bound: 1, shrunk: 2 }
      counterSurge: 0,     // 0 or 0.5 / 0.75 from sacrificing defense
      nextAtkBonus: 0,
      nextD20Bonus: 0,
      extraDraw: (hasRelic('skelebot_link') ? 1 : 0) + ((metaState.upgrades.hologram_cache || 0) >= 3 ? 1 : 0),
      deck: playerDeck,
      hand: [],
      discard: [],
      lastSpell: null,
    },
    enemy: {
      name: enemyTemplate.name,
      title: enemyTemplate.title,
      avatar: enemyTemplate.avatar,
      accent: enemyTemplate.accent,
      lp: enemyTemplate.maxLp,
      maxLp: enemyTemplate.maxLp,
      shield: 0,
      shieldCard: null,
      shieldIsDivine: false,
      activeDefense: null,
      possession: enemyTemplate.startPossession ? POSSESSION_FORMS[enemyTemplate.startPossession] : null,
      innateAffinity: enemyTemplate.innateAffinity || null,
      statuses: {},
      counterSurge: 0,
      nextAtkBonus: 0,
      nextD20Bonus: 0,
      deck: enemyDeck,
      hand: [],
      discard: [],
      lastSpell: null,
      intent: null, // Previewed next move for tactical counterplay!
    },
    arena: {
      fusion: null,        // { id, turnsLeft, controller: 'player'|'enemy'|null, trapped: 'player'|'enemy'|null }
      portaSealed: false,
      waterStreamActive: false,
    },
    log: [],
    lastEvents: [],        // Visual FX queue for UI (d20 rolls, fusion banners, damage popups)
    metaRef: metaState,
    runRef: runState,
  };

  drawCards(duel.player, 5 + duel.player.extraDraw);
  duel.player.extraDraw = 0;
  drawCards(duel.enemy, 4);

  addLog(duel, `⚔️ ${enemyTemplate.name}: ${enemyTemplate.quote}`, 'system');
  if (duel.enemy.possession) {
    addLog(duel, `${duel.enemy.possession.icon} ${duel.enemy.name} begins possessed by ${duel.enemy.possession.name}!`, 'fusion');
  }
  planEnemyIntent(duel);
  return duel;
}

export function drawCards(combatant, count) {
  for (let i = 0; i < count; i++) {
    if (combatant.hand.length >= 7) break;
    if (combatant.deck.length === 0) {
      if (combatant.discard.length === 0) break;
      combatant.deck = shuffle(combatant.discard);
      combatant.discard = [];
    }
    const next = combatant.deck.pop();
    if (next) combatant.hand.push(next);
  }
}

function addLog(duel, text, type = 'info') {
  duel.log.unshift({ turn: duel.turn, text, type });
  if (duel.log.length > 40) duel.log.pop();
}

function pushEvent(duel, evt) {
  duel.lastEvents.push(evt);
}

function rollD20(duel, who, label, dc = 10) {
  const raw = Math.floor(Math.random() * 20) + 1;
  let bonus = 0;
  if (who === 'player') {
    bonus += (duel.metaRef.upgrades.lucid_will || 0);
    if (duel.runRef.relics.includes('second_brain')) bonus += 2;
    bonus += duel.player.nextD20Bonus;
    duel.player.nextD20Bonus = 0;
  } else {
    bonus += duel.enemy.nextD20Bonus;
    duel.enemy.nextD20Bonus = 0;
  }
  const total = raw + bonus;
  const success = total > dc;
  if (who === 'player' && success) {
    trackMissionProgress(duel.metaRef, 'd20Success', 1);
  }
  pushEvent(duel, { type: 'd20', who, label, raw, bonus, total, dc, success });
  return { raw, bonus, total, success };
}

function recordFusionDiscovery(duel, fusionId) {
  if (!duel.metaRef.discoveredFusions.includes(fusionId)) {
    duel.metaRef.discoveredFusions.push(fusionId);
  }
  trackMissionProgress(duel.metaRef, 'fusionsTriggered', 1);
}

function hasDivineAffinity(combatant, element) {
  if (combatant.possession && combatant.possession.affinity === element) return true;
  if (combatant.innateAffinity && combatant.innateAffinity === element) return true;
  return false;
}

function triggerPossession(duel, who, forcedFormId = null) {
  const target = duel[who];
  let form;
  if (forcedFormId && POSSESSION_FORMS[forcedFormId]) {
    form = POSSESSION_FORMS[forcedFormId];
  } else if (duel.arena.fusion?.id === 'hell_dimension' && duel.arena.fusion.trapped === who) {
    // Dream-accurate clutch: trapped in Hell Dimension summons Water Nymph to escape!
    form = POSSESSION_FORMS.water_nymph;
  } else {
    form = POSSESSION_LIST[Math.floor(Math.random() * POSSESSION_LIST.length)];
  }
  target.possession = form;
  // Conjure signature Affinity spell directly into hand!
  if (target.hand.length < 7) {
    target.hand.push(form.bonusCard);
  } else {
    target.hand[target.hand.length - 1] = form.bonusCard;
  }
  if (who === 'player') {
    trackMissionProgress(duel.metaRef, 'possessions', 1);
  }
  const bonusCardObj = CARDS[form.bonusCard];
  addLog(duel, `${form.icon} ${target.name} is POSSESSED by ${form.name}! Gained ${form.affinity.toUpperCase()} Affinity & conjured [${bonusCardObj.name}]!`, 'fusion');
  pushEvent(duel, { type: 'possession', who, form });
}

function planEnemyIntent(duel) {
  const enemy = duel.enemy;
  const ai = duel.enemyTemplate.aiStyle;

  // If enemy has a caught attack in Porta/Speculum, redirect it!
  if (enemy.activeDefense?.caught) {
    enemy.intent = { mode: 'redirect', cardId: enemy.activeDefense.cardId, label: `Redirect ${CARDS[enemy.activeDefense.caught.cardId].name}!` };
    return;
  }

  // Dream Boss special logic: if trapped in Hell Dimension, strike self with Axe of 10,000 Souls to become Water Nymph!
  if (duel.arena.fusion?.id === 'hell_dimension' && duel.arena.fusion.trapped === 'enemy') {
    const waterIdx = enemy.hand.findIndex((id) => CARDS[id].tags.includes('extinguish'));
    if (waterIdx >= 0) {
      enemy.intent = { mode: 'attack', cardIdx: waterIdx, cardId: enemy.hand[waterIdx], label: `Cast ${CARDS[enemy.hand[waterIdx]].name} (Extinguish!)` };
      return;
    }
    const axeIdx = enemy.hand.findIndex((id) => id === 'axe_souls');
    if (axeIdx >= 0 && !enemy.possession) {
      enemy.intent = { mode: 'defense', cardIdx: axeIdx, cardId: 'axe_souls', label: 'Desperate Play: Self-Strike Axe!' };
      return;
    }
  }

  // Filter out sealed Porta
  const playable = enemy.hand
    .map((id, idx) => ({ id, idx, card: CARDS[id] }))
    .filter((item) => !(duel.arena.portaSealed && item.card.tags.includes('portal')));

  if (playable.length === 0) {
    enemy.intent = { mode: 'pass', cardId: null, label: 'Gathering Energy...' };
    return;
  }

  // Dream Boss turn 1: always open with Axe of 10,000 Souls if in hand
  if (ai === 'dream_boss' && duel.turn === 1) {
    const axe = playable.find((p) => p.id === 'axe_souls');
    if (axe) {
      enemy.intent = { mode: 'attack', cardIdx: axe.idx, cardId: axe.id, label: `Attack: ${axe.card.name}` };
      return;
    }
  }

  // If player is Soaking Wet and enemy has Lightning, strike!
  if (duel.player.statuses.wet) {
    const bolt = playable.find((p) => p.card.element === 'lightning');
    if (bolt) {
      enemy.intent = { mode: 'attack', cardIdx: bolt.idx, cardId: bolt.id, label: `Attack: ${bolt.card.name} (Conduction!)` };
      return;
    }
  }

  // If enemy is possessed, prioritize affinity attack!
  if (enemy.possession) {
    const aff = playable.find((p) => p.card.element === enemy.possession.affinity);
    if (aff && Math.random() < 0.78) {
      enemy.intent = { mode: 'attack', cardIdx: aff.idx, cardId: aff.id, label: `Divine Wave: ${aff.card.name}` };
      return;
    }
  }

  // Decide Attack vs Defense
  const canDefend = !enemy.statuses.bound;
  const defChance = ai === 'defensive' ? 0.45 : ai === 'aggressive' ? 0.18 : 0.3;
  const wantDef = canDefend && enemy.shield < 400 && Math.random() < defChance;

  if (wantDef) {
    const defPick = playable.find((p) => p.card.defShield >= 600 || p.card.tags.includes('portal')) || playable[0];
    enemy.intent = { mode: 'defense', cardIdx: defPick.idx, cardId: defPick.id, label: `Defense: ${defPick.card.name}` };
  } else {
    // Pick highest damage card
    playable.sort((a, b) => b.card.atkPower - a.card.atkPower);
    const atkPick = playable[Math.floor(Math.random() * Math.min(2, playable.length))];
    enemy.intent = { mode: 'attack', cardIdx: atkPick.idx, cardId: atkPick.id, label: `Attack: ${atkPick.card.name}` };
  }
}

export function sacrificePlayerShield(duel) {
  if (duel.phase !== 'player') return false;
  const p = duel.player;
  if (p.shield <= 0 && !p.activeDefense) return false;

  const surgeVal = duel.runRef.relics.includes('savannah_optic') ? 0.75 : 0.5;
  p.shield = 0;
  p.shieldCard = null;
  p.activeDefense = null;
  p.counterSurge = surgeVal;

  addLog(duel, `⚡ SACRIFICED DEFENSE! Dropped shield to channel +${Math.round(surgeVal * 100)}% Counter-Surge & Shield-Pierce on your next Attack!`, 'fusion');
  pushEvent(duel, { type: 'banner', text: `DEFENSE SACRIFICED! +${Math.round(surgeVal * 100)}% COUNTER-SURGE`, color: '#facc15' });
  return true;
}

export function playerSwitchRedirect(duel) {
  if (duel.phase !== 'player') return false;
  const p = duel.player;
  if (!p.activeDefense || !p.activeDefense.caught) return false;

  duel.lastEvents = [];
  const caught = p.activeDefense.caught;
  const defCard = CARDS[p.activeDefense.cardId];
  const mult = defCard.id === 'omni_porta' ? 1.4 : defCard.id === 'speculum' ? 1.15 : 1.0;
  const dmg = Math.round(caught.damage * mult);
  p.activeDefense = null;

  addLog(duel, `🌀 Switched [${defCard.name}] to ATTACK POSITION! "What goes around comes around!" Fired [${CARDS[caught.cardId].name}] back!`, 'fusion');
  pushEvent(duel, { type: 'banner', text: 'WHAT GOES AROUND COMES AROUND!', color: '#a855f7' });

  applyDamage(duel, 'player', 'enemy', dmg, CARDS[caught.cardId], {
    isRedirect: true,
    triggerSecondary: caught.secondary,
  });

  if (checkDuelEnd(duel)) return true;
  resolveEnemyTurn(duel);
  return true;
}

export function playerPlayCard(duel, handIndex, position) {
  if (duel.phase !== 'player') return false;
  const p = duel.player;
  const cardId = p.hand[handIndex];
  if (!cardId) return false;
  const card = CARDS[cardId];

  if (duel.arena.portaSealed && card.tags.includes('portal')) {
    addLog(duel, `🚫 ${card.name} is SEALED while the Pocket/Hell Dimension persists!`, 'warn');
    return false;
  }
  if (position === 'defense' && p.statuses.bound) {
    addLog(duel, `⛓️ You are BOUND and cannot play in Defense Position this turn!`, 'warn');
    return false;
  }

  duel.lastEvents = [];
  p.hand.splice(handIndex, 1);
  p.discard.push(cardId);
  p.lastSpell = { cardId, position };

  if (position === 'defense') {
    trackMissionProgress(duel.metaRef, 'defensePlayed', 1);
    resolveDefensePlay(duel, 'player', card);
  } else {
    resolveAttackPlay(duel, 'player', card);
  }

  if (checkDuelEnd(duel)) return true;
  resolveEnemyTurn(duel);
  return true;
}

function resolveDefensePlay(duel, who, card) {
  const actor = duel[who];
  const mastery = who === 'player' ? getCardMasteryBonus(duel.metaRef, card.id) : 1;

  // Special: Axe of 10,000 Souls Self-Strike -> Possess on Purpose!
  if (card.tags.includes('self_possess')) {
    actor.lp = Math.max(1, actor.lp - 1000);
    addLog(duel, `🪓 ${actor.name} struck themselves with [${card.name}] (-1,000 LP) to force Spirit Possession!`, 'fusion');
    pushEvent(duel, { type: 'damage', who, amount: 1000, label: 'SELF-STRIKE' });
    triggerPossession(duel, who);
    return;
  }

  // Special: Porta / Omni-Porta / Speculum Defense Catch
  if (card.tags.includes('portal') || card.tags.includes('mirror')) {
    actor.activeDefense = {
      cardId: card.id,
      type: card.tags.includes('portal') ? 'porta' : 'mirror',
      caught: null,
    };
    addLog(duel, `🌀 ${actor.name} played [${card.name}] in DEFENSE Position — ready to catch incoming spells!`, 'defense');
    pushEvent(duel, { type: 'shield', who, text: `${card.name.toUpperCase()} READY` });
    if (who === 'player' && duel.runRef.relics.includes('chipper_ward')) {
      healCombatant(duel, 'player', 300);
    }
    return;
  }

  // Standard / Divine Shield Defense
  const shieldVal = Math.round(card.defShield * mastery);
  actor.shield = Math.max(actor.shield, shieldVal);
  actor.shieldCard = card.id;
  actor.shieldIsDivine = card.tags.includes('divine_shield') || card.rarity === 'divine';
  addLog(duel, `🛡️ ${actor.name} manifested [${card.name}] in DEFENSE Position (${shieldVal} Shield)!`, 'defense');
  pushEvent(duel, { type: 'shield', who, text: `+${shieldVal} SHIELD` });

  if (card.heal) {
    healCombatant(duel, who, Math.round(card.heal * mastery));
  }
  if (card.tags.includes('draw_on_def') && who === 'player') {
    drawCards(actor, 1);
    addLog(duel, `🃏 [${card.name}] drew 1 extra card!`, 'info');
  }
  if (card.id === 'lucid_light') {
    actor.statuses = {};
    drawCards(actor, 2);
    addLog(duel, `🌌 [Lucid Sanctuary] cleansed all negative statuses and drew 2 cards!`, 'fusion');
  }
  if (card.id === 'energy_tether') {
    actor.nextD20Bonus += 2;
  }
  if (card.id === 'shrinking_ray') {
    actor.nextD20Bonus += 3;
  }
  if (card.id === 'kurenos') {
    actor.nextAtkBonus += 300;
  }
  if (card.tags.includes('extinguish') && duel.arena.fusion?.id === 'hell_dimension') {
    triggerSteamFlood(duel, who);
  }
  if (who === 'player' && duel.runRef.relics.includes('chipper_ward')) {
    healCombatant(duel, 'player', 300);
  }
}

function resolveAttackPlay(duel, who, card) {
  const actor = duel[who];
  const oppKey = who === 'player' ? 'enemy' : 'player';
  const opp = duel[oppKey];

  // Check Spell Collisions & Fusions FIRST!
  if (checkAndTriggerFusions(duel, who, card)) {
    // Some fusions (like Pocket Dimension) completely transform the exchange; others still deal attack damage!
    if (card.tags.includes('portal') && duel.arena.fusion?.id === 'pocket_dimension' && duel.arena.fusion.turnsLeft === FUSIONS.pocket_dimension.duration) {
      return;
    }
  }

  // Check if opponent has Porta or Speculum Defense catching this attack!
  if (opp.activeDefense && !opp.activeDefense.caught) {
    const canPierce = card.tags.includes('pierce') && opp.activeDefense.cardId !== 'omni_porta';
    if (!canPierce) {
      const dmgVal = computeAttackDamage(duel, who, oppKey, card).finalDamage;
      opp.activeDefense.caught = {
        cardId: card.id,
        damage: dmgVal,
        secondary: card.secondary || null,
      };
      addLog(duel, `🌀 ${opp.name}’s [${CARDS[opp.activeDefense.cardId].name}] CAUGHT [${card.name}] mid-air! Ready to redirect!`, 'fusion');
      pushEvent(duel, { type: 'banner', text: `SPELL CAUGHT BY ${CARDS[opp.activeDefense.cardId].name.toUpperCase()}!`, color: '#a855f7' });
      return;
    }
  }

  // Compute & apply damage
  const calc = computeAttackDamage(duel, who, oppKey, card);
  addLog(duel, `⚔️ ${actor.name} cast [${card.name}] in ATTACK Position! ${calc.notes.join(' • ')}`, 'attack');

  applyDamage(duel, who, oppKey, calc.finalDamage, card, {
    pierce: calc.pierce,
    isDivineOverflow: calc.divineOverflow,
    triggerSecondary: card.secondary || null,
    isConduction: calc.isConduction,
  });

  if (card.heal) {
    healCombatant(duel, who, card.heal);
  }
  if (card.tags.includes('stream')) {
    duel.arena.waterStreamActive = true;
  }
}

function checkAndTriggerFusions(duel, who, card) {
  const oppKey = who === 'player' ? 'enemy' : 'player';
  const opp = duel[oppKey];

  // 1. Porta + Porta (or Omni-Porta) -> Pocket Dimension!
  const oppUsedPorta = opp.lastSpell && CARDS[opp.lastSpell.cardId]?.tags.includes('portal');
  const oppHasPortaDef = opp.activeDefense?.type === 'porta';
  if (card.tags.includes('portal') && (oppUsedPorta || oppHasPortaDef || card.tags.includes('domain_lord'))) {
    opp.activeDefense = null;
    duel.arena.portaSealed = true;

    const pBonus = card.id === 'omni_porta' && who === 'player' ? 4 : 0;
    const eBonus = card.id === 'omni_porta' && who === 'enemy' ? 4 : 0;
    duel.player.nextD20Bonus += pBonus;
    duel.enemy.nextD20Bonus += eBonus;

    const pRoll = rollD20(duel, 'player', 'Domain Control Clash', 0);
    const eRoll = rollD20(duel, 'enemy', 'Domain Control Clash', 0);
    const winner = pRoll.total >= eRoll.total ? 'player' : 'enemy';

    duel.arena.fusion = {
      id: 'pocket_dimension',
      turnsLeft: FUSIONS.pocket_dimension.duration,
      controller: winner,
      trapped: winner, // The winner flies inside to claim godlike advantage!
    };
    recordFusionDiscovery(duel, 'pocket_dimension');
    addLog(
      duel,
      `🌀 SPELL FUSION: [POCKET DIMENSION]! Both lost access to Porta! Domain Roll: Jet ${pRoll.total} vs ${duel.enemy.name} ${eRoll.total} → ${duel[winner].name} flew inside (+40% ATK)!`,
      'fusion'
    );
    pushEvent(duel, { type: 'fusion', fusion: FUSIONS.pocket_dimension });
    return true;
  }

  // 2. Pyro / Supernova + Pocket Dimension -> HELL DIMENSION!
  if (card.tags.includes('hell_catalyst') && duel.arena.fusion?.id === 'pocket_dimension') {
    const trapped = duel.arena.fusion.controller;
    duel.arena.fusion = {
      id: 'hell_dimension',
      turnsLeft: FUSIONS.hell_dimension.duration,
      controller: who,
      trapped,
    };
    recordFusionDiscovery(duel, 'hell_dimension');
    addLog(
      duel,
      `🔥 SPELL FUSION: [HELL DIMENSION]! Flames engulf the entire Pocket Dimension! ${duel[trapped].name} is trapped inside taking 900 LP/turn!`,
      'fusion'
    );
    pushEvent(duel, { type: 'fusion', fusion: FUSIONS.hell_dimension });
    return true;
  }

  // 3. Hydro / Aqua / Cryo + Hell Dimension -> STEAM FLOOD!
  if (card.tags.includes('extinguish') && duel.arena.fusion?.id === 'hell_dimension') {
    triggerSteamFlood(duel, who);
    return true;
  }

  // 4. Gravitas + Porta -> SINGULARITY RIFT!
  if (card.tags.includes('gravity') && (oppUsedPorta || oppHasPortaDef)) {
    duel.player.shield = 0;
    duel.enemy.shield = 0;
    duel.player.activeDefense = null;
    duel.enemy.activeDefense = null;
    duel.player.lp = Math.max(0, duel.player.lp - 750);
    duel.enemy.lp = Math.max(0, duel.enemy.lp - 750);
    recordFusionDiscovery(duel, 'singularity_rift');
    addLog(duel, `🕳️ SPELL FUSION: [SINGULARITY RIFT]! All shields shattered & both duelists take 750 Space dmg!`, 'fusion');
    pushEvent(duel, { type: 'fusion', fusion: FUSIONS.singularity_rift });
    return true;
  }

  // 5. Pyro + Ventus -> INFERNO VORTEX!
  if (
    (card.element === 'fire' && opp.lastSpell && CARDS[opp.lastSpell.cardId]?.element === 'wind') ||
    (card.element === 'wind' && opp.lastSpell && CARDS[opp.lastSpell.cardId]?.element === 'fire')
  ) {
    duel.arena.fusion = { id: 'inferno_vortex', turnsLeft: 2, controller: null, trapped: null };
    recordFusionDiscovery(duel, 'inferno_vortex');
    addLog(duel, `🌪️ SPELL FUSION: [INFERNO VORTEX]! Blazing winds scorch the arena for 500 LP/turn!`, 'fusion');
    pushEvent(duel, { type: 'fusion', fusion: FUSIONS.inferno_vortex });
    return true;
  }

  // 6. Water + Cryo -> GLACIAL PRISON!
  if (
    (card.element === 'ice' && opp.lastSpell && CARDS[opp.lastSpell.cardId]?.element === 'water') ||
    (card.element === 'water' && opp.lastSpell && CARDS[opp.lastSpell.cardId]?.element === 'ice')
  ) {
    duel.arena.fusion = { id: 'glacial_prison', turnsLeft: 2, controller: null, trapped: null };
    recordFusionDiscovery(duel, 'glacial_prison');
    addLog(duel, `❄️ SPELL FUSION: [GLACIAL PRISON]! The battlefield flash-freezes!`, 'fusion');
    pushEvent(duel, { type: 'fusion', fusion: FUSIONS.glacial_prison });
    return true;
  }

  // 7. Umbra + Lux -> COSMIC ECLIPSE!
  if (
    (card.element === 'shadow' && opp.lastSpell && CARDS[opp.lastSpell.cardId]?.element === 'light') ||
    (card.element === 'light' && opp.lastSpell && CARDS[opp.lastSpell.cardId]?.element === 'shadow')
  ) {
    duel.arena.fusion = { id: 'cosmic_eclipse', turnsLeft: 3, controller: null, trapped: null };
    recordFusionDiscovery(duel, 'cosmic_eclipse');
    addLog(duel, `🌑 SPELL FUSION: [COSMIC ECLIPSE]! Spirit & Lucid spells gain +40% power!`, 'fusion');
    pushEvent(duel, { type: 'fusion', fusion: FUSIONS.cosmic_eclipse });
    return true;
  }

  return false;
}

function triggerSteamFlood(duel, who) {
  duel.arena.fusion = { id: 'steam_flood', turnsLeft: 2, controller: who, trapped: null };
  duel.arena.portaSealed = false;
  duel.arena.waterStreamActive = true;
  duel.player.statuses.wet = 2;
  duel.enemy.statuses.wet = 2;
  recordFusionDiscovery(duel, 'steam_flood');
  addLog(duel, `🌊 SPELL FUSION: [STEAM FLOOD]! Hell Dimension extinguished! Both duelists are SOAKING WET!`, 'fusion');
  pushEvent(duel, { type: 'fusion', fusion: FUSIONS.steam_flood });
}

function computeAttackDamage(duel, attackerKey, defenderKey, card) {
  const atk = duel[attackerKey];
  const def = duel[defenderKey];
  const mastery = attackerKey === 'player' ? getCardMasteryBonus(duel.metaRef, card.id) : 1;
  let dmg = Math.round(card.atkPower * mastery) + atk.nextAtkBonus;
  atk.nextAtkBonus = 0;

  const notes = [];
  let mult = 1.0;
  let pierce = card.tags.includes('pierce');
  let divineOverflow = false;
  let isConduction = false;

  if (attackerKey === 'player' && duel.runRef.relics.includes('tecton_baldric')) {
    dmg += 150;
  }

  // Domain Control advantage (+40%)
  if (duel.arena.fusion?.id === 'pocket_dimension' && duel.arena.fusion.controller === attackerKey) {
    mult *= 1.4;
    notes.push('Domain Control +40%');
  }

  // Inferno Vortex fire boost
  if (duel.arena.fusion?.id === 'inferno_vortex' && card.element === 'fire') {
    mult *= 1.3;
    notes.push('Inferno Vortex +30%');
  }

  // Cosmic Eclipse spirit/lucid boost
  if (duel.arena.fusion?.id === 'cosmic_eclipse' && (card.element === 'spirit' || card.element === 'lucid')) {
    mult *= 1.4;
    notes.push('Cosmic Eclipse +40%');
  }

  // Divine Affinity Boost + Shield Overflow!
  if (hasDivineAffinity(atk, card.element)) {
    mult *= 1.4;
    divineOverflow = true;
    notes.push('Divine Affinity +40% (Overflows Shields!)');
  }

  // Counter-Surge from Sacrificing Aegis!
  if (atk.counterSurge > 0) {
    const conduitBonus = attackerKey === 'player' ? (duel.metaRef.upgrades.divine_conduit || 0) * 0.15 : 0;
    mult *= 1 + atk.counterSurge + conduitBonus;
    pierce = true;
    notes.push(`Counter-Surge +${Math.round((atk.counterSurge + conduitBonus) * 100)}%`);
    atk.counterSurge = 0;
  }

  // DIVINE CONDUCTION: Lightning + Soaking Wet / Water Stream!
  if (card.tags.includes('conductive') && (def.statuses.wet || duel.arena.waterStreamActive)) {
    const fusionBonus = attackerKey === 'player'
      ? (duel.metaRef.upgrades.fusion_resonator || 0) * 0.15 + (duel.runRef.relics.includes('overdrive_core') ? 0.25 : 0)
      : 0;
    mult *= 1.65 + fusionBonus;
    isConduction = true;
    recordFusionDiscovery(duel, 'divine_conduction');
    notes.push('⚡ DIVINE CONDUCTION!');
    if (def.shield <= 0) {
      mult *= 1.25;
      notes.push('Unshielded +25%');
    }
  }

  // Elemental Weakness (Possessed Divinity!)
  if (def.possession && (def.possession.weakness === card.element || card.tags.includes('exploit_weakness'))) {
    const conduitBonus = attackerKey === 'player' ? (duel.metaRef.upgrades.divine_conduit || 0) * 0.15 : 0;
    mult *= 1.55 + conduitBonus;
    notes.push(`WEAKNESS (${def.possession.name})!`);
  }

  // Shield-breaker bonus
  if (card.tags.includes('shield_breaker') && def.shield > 0) {
    def.shield = 0;
    notes.push('SHIELD SHATTERED!');
  } else if (card.id === 'terra' && def.shield > 0) {
    dmg += 300;
  }

  // Debuffs on attacker
  if (atk.statuses.frozen) {
    mult *= 0.6;
    notes.push('Frozen -40%');
  }
  if (atk.statuses.shrunk) {
    mult *= 0.55;
    notes.push('Shrunk -45%');
  }

  // Cursed defender takes +300 flat
  if (def.statuses.cursed) {
    dmg += 300;
    notes.push('Cursed +300');
  }

  const finalDamage = Math.max(100, Math.round(dmg * mult));
  return { finalDamage, notes, pierce, divineOverflow, isConduction };
}

function applyDamage(duel, attackerKey, defenderKey, rawDamage, card, opts = {}) {
  const def = duel[defenderKey];
  const atk = duel[attackerKey];
  let hpDamage = rawDamage;

  if (def.shield > 0 && !opts.pierce) {
    if (opts.isDivineOverflow && def.shieldCard !== 'terra') {
      // Dream mechanic: Water Nymph Hydro overflows Aegis!
      let overflow = Math.round(rawDamage * 0.45);
      if (defenderKey === 'player' && duel.runRef.relics.includes('johnson_suit')) {
        overflow = Math.round(overflow * 0.65);
      }
      const absorbed = Math.min(def.shield, rawDamage - overflow);
      def.shield = Math.max(0, def.shield - Math.round(absorbed * 0.6));
      hpDamage = overflow;
      addLog(duel, `🌊 Divine Affinity OVERFLOWED ${def.name}’s shield for ${hpDamage} LP!`, 'warn');
    } else {
      const absorbed = Math.min(def.shield, rawDamage);
      def.shield -= absorbed;
      hpDamage = rawDamage - absorbed;
      if (absorbed > 0) {
        addLog(duel, `🛡️ ${def.name}’s shield absorbed ${absorbed} dmg (${def.shield} remaining).`, 'defense');
      }
    }

    // Thorns / Counter shields
    if (def.shieldCard === 'pyro') {
      atk.lp = Math.max(0, atk.lp - 300);
      addLog(duel, `🔥 Flame Barrier scorched ${atk.name} for 300 LP!`, 'attack');
    } else if (def.shieldCard === 'fulmen') {
      atk.lp = Math.max(0, atk.lp - 350);
      addLog(duel, `⚡ Static Ward shocked ${atk.name} for 350 LP!`, 'attack');
    } else if (def.shieldCard === 'death_sword') {
      atk.lp = Math.max(0, atk.lp - 650);
      addLog(duel, `⚔️ Violet Parry countered ${atk.name} for 650 LP!`, 'attack');
    }
  }

  if (hpDamage > 0) {
    def.lp = Math.max(0, def.lp - hpDamage);
    pushEvent(duel, {
      type: 'damage',
      who: defenderKey,
      amount: hpDamage,
      big: hpDamage >= 1200 || opts.isConduction,
      label: opts.isConduction ? '⚡ CONDUCTION!' : opts.isRedirect ? '🌀 REDIRECT!' : '',
    });
    if (attackerKey === 'player') {
      if (hpDamage > duel.metaRef.stats.highestHit) {
        duel.metaRef.stats.highestHit = hpDamage;
      }
      if (hpDamage >= 1500) {
        trackMissionProgress(duel.metaRef, 'bigHits', 1);
      }
    }
  }

  // Secondary effect d20 Resistance Roll!
  const sec = opts.triggerSecondary;
  if (sec && def.lp > 0) {
    const roll = rollD20(duel, defenderKey, `Resist ${sec.status.toUpperCase()}`, sec.dc);
    if (roll.success) {
      addLog(duel, `🎲 ${def.name} rolled d20 = ${roll.total} (> ${sec.dc}) and RESISTED ${sec.status.toUpperCase()}!`, 'dice');
    } else {
      addLog(duel, `🎲 ${def.name} rolled d20 = ${roll.total} (≤ ${sec.dc}) — afflicted with ${sec.status.toUpperCase()}!`, 'warn');
      if (sec.status === 'possessed') {
        triggerPossession(duel, defenderKey);
      } else {
        def.statuses[sec.status] = 2;
      }
    }
  }
}

function healCombatant(duel, who, amount) {
  const c = duel[who];
  const actual = duel.arena.fusion?.id === 'cosmic_eclipse' ? Math.round(amount * 0.5) : amount;
  c.lp = Math.min(c.maxLp, c.lp + actual);
  addLog(duel, `✨ ${c.name} restored +${actual} LP!`, 'heal');
  pushEvent(duel, { type: 'heal', who, amount: actual });
}

function resolveEnemyTurn(duel) {
  const e = duel.enemy;
  const intent = e.intent;

  if (intent) {
    if (intent.mode === 'redirect' && e.activeDefense?.caught) {
      const caught = e.activeDefense.caught;
      const defCard = CARDS[e.activeDefense.cardId];
      e.activeDefense = null;
      addLog(duel, `🌀 ${e.name} switched [${defCard.name}] to ATTACK and fired [${CARDS[caught.cardId].name}] back at you!`, 'fusion');
      applyDamage(duel, 'enemy', 'player', caught.damage, CARDS[caught.cardId], {
        isRedirect: true,
        triggerSecondary: caught.secondary,
      });
    } else if (intent.mode !== 'pass' && intent.cardId) {
      const idx = e.hand.indexOf(intent.cardId);
      if (idx >= 0) e.hand.splice(idx, 1);
      e.discard.push(intent.cardId);
      e.lastSpell = { cardId: intent.cardId, position: intent.mode };
      const card = CARDS[intent.cardId];
      if (intent.mode === 'defense') {
        resolveDefensePlay(duel, 'enemy', card);
      } else {
        resolveAttackPlay(duel, 'enemy', card);
      }
    }
  }

  if (checkDuelEnd(duel)) return;

  // End-of-turn environmental & status effects
  processEndOfTurn(duel);
  if (checkDuelEnd(duel)) return;

  // Start next player turn
  duel.turn += 1;
  drawCards(duel.player, 1 + duel.player.extraDraw);
  duel.player.extraDraw = 0;
  drawCards(duel.enemy, 1);
  planEnemyIntent(duel);
}

function processEndOfTurn(duel) {
  // Arena Fusion ticking
  if (duel.arena.fusion) {
    const f = duel.arena.fusion;
    if (f.id === 'hell_dimension' && f.trapped) {
      let burn = 900;
      if (f.trapped === 'player' && duel.runRef.relics.includes('johnson_suit')) {
        burn = Math.round(burn * 0.65);
      }
      duel[f.trapped].lp = Math.max(0, duel[f.trapped].lp - burn);
      addLog(duel, `🔥 [HELL DIMENSION] seared trapped ${duel[f.trapped].name} for ${burn} LP!`, 'warn');
      pushEvent(duel, { type: 'damage', who: f.trapped, amount: burn, label: 'HELL FLAMES' });
    } else if (f.id === 'inferno_vortex') {
      duel.player.lp = Math.max(0, duel.player.lp - 500);
      duel.enemy.lp = Math.max(0, duel.enemy.lp - 500);
      addLog(duel, `🌪️ [INFERNO VORTEX] scorched both duelists for 500 LP!`, 'warn');
    } else if (f.id === 'glacial_prison') {
      for (const who of ['player', 'enemy']) {
        const r = rollD20(duel, who, 'Resist Glacial Prison', 10);
        if (!r.success) duel[who].statuses.frozen = 1;
      }
    }

    f.turnsLeft -= 1;
    if (f.turnsLeft <= 0) {
      addLog(duel, `✨ [${FUSIONS[f.id].name}] dissipated. Portals unsealed.`, 'system');
      duel.arena.fusion = null;
      duel.arena.portaSealed = false;
    }
  }

  // Status ticking
  for (const who of ['player', 'enemy']) {
    const c = duel[who];
    if (c.statuses.burn) {
      let dmg = 400;
      if (who === 'player' && duel.runRef.relics.includes('johnson_suit')) dmg = 260;
      c.lp = Math.max(0, c.lp - dmg);
      addLog(duel, `🔥 ${c.name} took ${dmg} Burn LP!`, 'warn');
      pushEvent(duel, { type: 'damage', who, amount: dmg, label: 'BURN' });
    }
    for (const key of Object.keys(c.statuses)) {
      c.statuses[key] -= 1;
      if (c.statuses[key] <= 0) delete c.statuses[key];
    }
  }
}

function checkDuelEnd(duel) {
  if (duel.enemy.lp <= 0) {
    duel.phase = 'victory';
    duel.runRef.lp = Math.max(1, duel.player.lp);
    addLog(duel, `🏆 VICTORY! ${duel.enemy.name} fell out of the sky!`, 'fusion');
    return true;
  }
  if (duel.player.lp <= 0) {
    duel.phase = 'defeat';
    duel.runRef.lp = 0;
    addLog(duel, `💀 DEFEAT! Your gauntlet overloaded...`, 'warn');
    return true;
  }
  return false;
}
