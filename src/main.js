// LUCID DUEL: SPELLGAUNTLET — Main Application Controller

import { CARDS, CARD_LIST, ELEMENTS, RARITIES } from './data/cards.js';
import { FUSIONS, FUSION_LIST, POSSESSION_LIST } from './data/fusions.js';
import { ACTS, ENEMIES, RELICS, RELIC_LIST, VOID_EVENTS } from './data/enemies.js';
import { sfx } from './engine/audio.js';
import {
  buyUpgrade,
  canClaimDailyReward,
  claimDailyReward,
  claimMission,
  DAILY_REWARD_CALENDAR,
  GAUNTLET_UPGRADES,
  getCardMasteryBonus,
  getRankInfo,
  getUpgradeCost,
  loadState,
  saveState,
} from './engine/storage.js';
import {
  createDuelState,
  playerPlayCard,
  playerSwitchRedirect,
  sacrificePlayerShield,
} from './engine/combat.js';
import {
  applyDuelVictory,
  applyRunDefeat,
  getDuelRewards,
  startNewRun,
} from './engine/roguelike.js';
import {
  BANNERS,
  craftCard,
  performGachaPull,
  PULL_COSTS,
  upgradeCardMastery,
} from './engine/gacha.js';
import { renderCardArtSVG } from './ui/cardArt.js';

const state = loadState();
let activeTab = 'run';
let activeDuel = null;
let activeNode = null;
let deckFilter = 'all';

const appMain = document.getElementById('app-main');
const modalRewards = document.getElementById('modal-rewards');
const modalMissions = document.getElementById('modal-missions');
const modalGacha = document.getElementById('modal-gacha');
const modalOverlay = document.getElementById('modal-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayBody = document.getElementById('overlay-body');
const overlayCloseBtn = document.getElementById('overlay-close-btn');

// --- Toasts ---
function showToast(msg) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// --- Top Bar Sync ---
function updateTopBar() {
  const rank = getRankInfo(state.xp);
  document.getElementById('rank-display').textContent = `Lv.${rank.level} ${rank.title}`;
  document.getElementById('shards-display').textContent = state.shards.toLocaleString();
  document.getElementById('dust-display').textContent = state.dust.toLocaleString();

  const hasReward = canClaimDailyReward(state);
  document.getElementById('dot-rewards').hidden = !hasReward;

  const hasMission = state.dailyMissions.missions.some((m) => !m.claimed && m.progress >= m.target);
  document.getElementById('dot-missions').hidden = !hasMission;
}

// --- Navigation ---
document.querySelectorAll('.nav-tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (activeDuel && activeDuel.phase === 'player') {
      showToast('Finish your active duel first!');
      return;
    }
    activeTab = btn.dataset.tab;
    document.querySelectorAll('.nav-tab').forEach((b) => b.classList.toggle('active', b === btn));
    render();
  });
});

document.getElementById('btn-mute').addEventListener('click', (e) => {
  const muted = sfx.toggleMute();
  e.currentTarget.textContent = muted ? '🔇' : '🔊';
  showToast(muted ? 'Audio Muted' : 'Audio Enabled');
});

document.getElementById('btn-daily-rewards').addEventListener('click', () => {
  renderDailyRewardsModal();
  modalRewards.showModal();
});

document.getElementById('btn-daily-missions').addEventListener('click', () => {
  renderDailyMissionsModal();
  modalMissions.showModal();
});

overlayCloseBtn.addEventListener('click', () => modalOverlay.close());

// --- Main Render Router ---
function render() {
  updateTopBar();
  if (activeDuel) {
    renderDuelArena();
    return;
  }
  if (activeTab === 'run') renderRunView();
  else if (activeTab === 'deck') renderDeckbuilderView();
  else if (activeTab === 'gacha') renderGachaView();
  else if (activeTab === 'lab') renderLabView();
  else if (activeTab === 'codex') renderCodexView();
}

// =========================================================================
// 1. ROGUELIKE RUN HUB & PROCEDURAL MAP
// =========================================================================
function renderRunView() {
  const run = state.activeRun;

  if (!run || run.completed || run.failed) {
    appMain.innerHTML = `
      <section class="hero-banner">
        <div>
          <h2>Enter the Storyverse Card Duel</h2>
          <p>
            Summon your cybernetic wrist gauntlet and battle procedural villains across 3 Acts of the Storyverse.
            Play <strong>1 spell per turn</strong> in <strong>Attack</strong> or <strong>Defense</strong> position,
            fuse colliding spells into <strong>Pocket &amp; Hell Dimensions</strong>, roll <strong>d20s</strong> to resist
            Spirit Possession, and steal enemy cards to build an unstoppable roguelike deck.
          </p>
          <div style="display:flex; flex-wrap:wrap; gap:10px;">
            <button type="button" class="btn btn-primary" id="btn-start-run">⚔️ Start New Roguelike Run (${state.starterDeck.length} Cards)</button>
            <button type="button" class="btn btn-gold" id="btn-open-gacha">🌌 Open Holographic Packs (${state.shards} 💎)</button>
          </div>
        </div>
        <div class="panel" style="background:rgba(10,14,34,0.72);">
          <h3 style="margin:0 0 8px;">📊 Lucid Career</h3>
          <p style="margin:4px 0; font-size:0.86rem;">🏆 Runs Cleared: <strong>${state.stats.runsCompleted}</strong> / ${state.stats.runsAttempted}</p>
          <p style="margin:4px 0; font-size:0.86rem;">⚔️ Duels Won: <strong>${state.stats.duelsWon}</strong></p>
          <p style="margin:4px 0; font-size:0.86rem;">⚡ Highest Single Hit: <strong>${state.stats.highestHit.toLocaleString()} LP</strong></p>
          <p style="margin:4px 0; font-size:0.86rem;">🌀 Fusions Discovered: <strong>${state.discoveredFusions.length} / ${FUSION_LIST.length}</strong></p>
        </div>
      </section>

      <section class="rules-strip" aria-label="Core Dream Rules">
        <article class="rule-chip">
          <h3>⚔️ 8,000 LP • 1 Card / Turn</h3>
          <p>Play every spell in Attack Position to strike, or Defense Position to shield, catch, or trigger tactical traps.</p>
        </article>
        <article class="rule-chip">
          <h3>🌀 Porta Catch &amp; Pocket Fusion</h3>
          <p>Porta in Defense catches incoming attacks—switch to Attack to redirect! Two Portas fuse into a Pocket Dimension (d20 Clash), and Pyro turns it into a Hell Dimension!</p>
        </article>
        <article class="rule-chip">
          <h3>🪓 Axe of 10,000 Souls &amp; d20</h3>
          <p>Roll d20 &gt; 10 to resist Possession, or Strike Yourself on purpose to become a Spirit Divinity (Water Nymph!) with Shield-Overflowing Affinity!</p>
        </article>
        <article class="rule-chip">
          <h3>⚡ Aegis Sacrifice &amp; Kurenos</h3>
          <p>Sacrifice your active Shield for +50% Counter-Surge, then ride Kurenos through Soaking Wet targets for massive stacked finishers!</p>
        </article>
      </section>
    `;

    document.getElementById('btn-start-run').addEventListener('click', () => {
      sfx.cardPlay();
      startNewRun(state);
      render();
    });
    document.getElementById('btn-open-gacha').addEventListener('click', () => {
      activeTab = 'gacha';
      document.querySelectorAll('.nav-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === 'gacha'));
      render();
    });
    return;
  }

  const actInfo = ACTS[run.act - 1] || ACTS[0];
  const relicHtml = run.relics.length
    ? run.relics.map((id) => `<span class="relic-badge" title="${RELICS[id].desc}">${RELICS[id].icon} ${RELICS[id].name}</span>`).join('')
    : '<span style="color:var(--text-muted); font-size:0.82rem;">No Storyverse Relics yet (defeat Elites &amp; Bosses!)</span>';

  const mapRowsHtml = run.map
    .map((row, rIdx) => {
      const nodesHtml = row
        .map((node) => {
          const isAvail = rIdx === run.currentRow && !node.cleared;
          const cls = [
            'map-node',
            isAvail ? 'available' : '',
            node.cleared ? 'cleared' : '',
            node.type === 'boss' ? 'boss-node' : '',
          ].join(' ');

          let icon = '⚔️';
          let title = 'Spell Duel';
          let sub = '';
          if (node.type === 'duel' || node.type === 'elite' || node.type === 'boss') {
            const enemy = ENEMIES[node.enemyId];
            icon = enemy.avatar;
            title = enemy.name;
            sub = `${node.type.toUpperCase()} • ${enemy.maxLp.toLocaleString()} LP`;
          } else if (node.type === 'event') {
            icon = '🌀';
            title = 'Void Event';
            sub = 'Dream Choice';
          } else if (node.type === 'forge') {
            icon = '🔥';
            title = 'Fusion Forge';
            sub = 'Heal or Refine Deck';
          }

          return `
            <button type="button" class="${cls}" data-node-id="${node.id}" ${isAvail ? '' : 'disabled'}>
              <span class="node-icon" aria-hidden="true">${icon}</span>
              <span class="node-title">${title}</span>
              <span class="node-sub">${node.cleared ? '✅ Cleared' : sub}</span>
            </button>
          `;
        })
        .join('');
      return `<div class="map-row">${nodesHtml}</div>`;
    })
    .join('');

  appMain.innerHTML = `
    <section class="panel">
      <div class="run-header">
        <div>
          <h2 style="margin:0; color:${actInfo.color};">${actInfo.name}</h2>
          <p style="margin:4px 0 0; color:var(--text-muted); font-size:0.86rem;">${actInfo.subtitle}</p>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
          <span class="rank-pill">❤️ ${run.lp.toLocaleString()} / ${run.maxLp.toLocaleString()} LP</span>
          <span class="rank-pill">🃏 Run Deck: ${run.deck.length}</span>
          <button type="button" class="btn btn-sm btn-danger" id="btn-abandon-run">Abandon Run</button>
        </div>
      </div>

      <div class="relic-bar" style="margin-bottom:16px;">${relicHtml}</div>
      <div class="map-grid">${mapRowsHtml}</div>
    </section>
  `;

  document.getElementById('btn-abandon-run').addEventListener('click', () => {
    const res = applyRunDefeat(state, run);
    showToast(`Run ended. Gained +${res.consolationShards} 💎 & +${res.consolationXp} XP.`);
    render();
  });

  appMain.querySelectorAll('.map-node.available').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.nodeId;
      const node = run.map[run.currentRow].find((n) => n.id === id);
      if (node) enterMapNode(node);
    });
  });
}

function enterMapNode(node) {
  const run = state.activeRun;
  activeNode = node;

  if (node.type === 'duel' || node.type === 'elite' || node.type === 'boss') {
    sfx.cardPlay();
    activeDuel = createDuelState(state, run, ENEMIES[node.enemyId]);
    render();
  } else if (node.type === 'event') {
    openVoidEvent(node);
  } else if (node.type === 'forge') {
    openFusionForge(node);
  }
}

function openVoidEvent(node) {
  const run = state.activeRun;
  const ev = VOID_EVENTS.find((e) => e.id === node.eventId) || VOID_EVENTS[0];
  overlayTitle.textContent = `${ev.icon} ${ev.title}`;
  overlayCloseBtn.hidden = true;

  overlayBody.innerHTML = `
    <p style="line-height:1.55; color:#cbd5e1; margin-top:0;">${ev.text}</p>
    <div style="display:flex; flex-direction:column; gap:10px; margin-top:16px;">
      ${ev.choices.map((ch, idx) => `<button type="button" class="btn btn-primary" data-choice="${idx}">${ch.label}</button>`).join('')}
    </div>
  `;

  overlayBody.querySelectorAll('[data-choice]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ch = ev.choices[Number(btn.dataset.choice)];
      if (ch.effect === 'gain_card_hp') {
        run.deck.push(ch.cardId);
        run.lp = Math.max(500, run.lp + ch.lpDelta);
        showToast(`Added ${CARDS[ch.cardId].name} to your Run Deck!`);
      } else if (ch.effect === 'shards') {
        state.shards += ch.amount;
        showToast(`Gained +${ch.amount} Lucid Shards!`);
      } else if (ch.effect === 'heal') {
        run.lp = Math.min(run.maxLp, run.lp + ch.amount);
        showToast(`Restored +${ch.amount} LP!`);
      } else if (ch.effect === 'shards_heal') {
        state.shards += ch.shards;
        run.lp = Math.min(run.maxLp, run.lp + ch.heal);
        showToast(`+${ch.shards} 💎 & +${ch.heal} LP!`);
      } else if (ch.effect === 'relic_hp') {
        run.lp = Math.max(500, run.lp + (ch.lpDelta || 0));
        const unowned = RELIC_LIST.filter((r) => !run.relics.includes(r.id));
        if (unowned.length) {
          const r = unowned[Math.floor(Math.random() * unowned.length)];
          run.relics.push(r.id);
          showToast(`Acquired Relic: ${r.icon} ${r.name}!`);
        } else {
          state.shards += 150;
          showToast('All relics owned! Gained +150 💎 instead.');
        }
      } else if (ch.effect === 'random_high_card') {
        const highs = CARD_LIST.filter((c) => c.rarity === 'epic' || c.rarity === 'divine');
        const pick = highs[Math.floor(Math.random() * highs.length)];
        run.deck.push(pick.id);
        showToast(`Added ${pick.name} (${pick.rarity.toUpperCase()}) to Run Deck!`);
      }

      sfx.shieldUp();
      node.cleared = true;
      run.currentRow += 1;
      saveState(state);
      modalOverlay.close();
      render();
    });
  });

  modalOverlay.showModal();
}

function openFusionForge(node) {
  const run = state.activeRun;
  overlayTitle.textContent = '🔥 Storyverse Fusion Forge';
  overlayCloseBtn.hidden = true;

  overlayBody.innerHTML = `
    <p style="margin-top:0; color:#cbd5e1;">Channel Lucid Light to restore your Life Points or refine your active Run Deck.</p>
    <div style="display:flex; flex-direction:column; gap:10px;">
      <button type="button" class="btn btn-primary" id="forge-heal">❤️ Restore +2,800 LP (${run.lp.toLocaleString()} / ${run.maxLp.toLocaleString()})</button>
      <button type="button" class="btn btn-cyan" id="forge-draft">🃏 Conjure a Rare/Epic Spell into your Run Deck</button>
      <button type="button" class="btn btn-gold" id="forge-shards">💎 Harvest +150 Lucid Shards &amp; +60 Arcane Dust</button>
    </div>
  `;

  document.getElementById('forge-heal').addEventListener('click', () => {
    run.lp = Math.min(run.maxLp, run.lp + 2800);
    showToast('Restored +2,800 LP!');
    finishForge(node);
  });
  document.getElementById('forge-draft').addEventListener('click', () => {
    const pool = CARD_LIST.filter((c) => c.rarity === 'rare' || c.rarity === 'epic');
    const pick = pool[Math.floor(Math.random() * pool.length)];
    run.deck.push(pick.id);
    showToast(`Conjured [${pick.name}] into your Run Deck!`);
    finishForge(node);
  });
  document.getElementById('forge-shards').addEventListener('click', () => {
    state.shards += 150;
    state.dust += 60;
    showToast('Harvested +150 💎 and +60 ✨!');
    finishForge(node);
  });

  modalOverlay.showModal();
}

function finishForge(node) {
  sfx.shieldUp();
  node.cleared = true;
  state.activeRun.currentRow += 1;
  saveState(state);
  modalOverlay.close();
  render();
}

// =========================================================================
// 2. DUEL ARENA VIEW
// =========================================================================
function renderDuelArena() {
  const d = activeDuel;
  const p = d.player;
  const e = d.enemy;

  const pPct = Math.max(0, Math.min(100, (p.lp / p.maxLp) * 100));
  const ePct = Math.max(0, Math.min(100, (e.lp / e.maxLp) * 100));

  const renderStatuses = (c) => {
    const chips = [];
    if (c.shield > 0) chips.push(`<span class="status-chip shield">🛡️ Shield: ${c.shield}</span>`);
    if (c.activeDefense) {
      const defName = CARDS[c.activeDefense.cardId].name;
      const caught = c.activeDefense.caught ? ` (CAUGHT: ${CARDS[c.activeDefense.caught.cardId].name}!)` : ' (Ready to Catch)';
      chips.push(`<span class="status-chip possession">🌀 ${defName}${caught}</span>`);
    }
    if (c.possession) {
      chips.push(`<span class="status-chip possession">${c.possession.icon} ${c.possession.name} (${c.possession.affinity.toUpperCase()} Affinity • Weak: ${c.possession.weakness.toUpperCase()})</span>`);
    }
    if (c.counterSurge > 0) {
      chips.push(`<span class="status-chip surge">⚡ COUNTER-SURGE +${Math.round(c.counterSurge * 100)}%</span>`);
    }
    for (const [k, v] of Object.entries(c.statuses)) {
      const cls = k === 'wet' ? 'wet' : k === 'burn' ? 'burn' : '';
      chips.push(`<span class="status-chip ${cls}">${k.toUpperCase()} (${v}t)</span>`);
    }
    return chips.join('');
  };

  // Arena Fusion Zone
  let fieldHtml = `
    <div style="font-size:0.9rem; color:var(--text-muted);">
      🌌 <strong>Turn ${d.turn} — Open Storyverse Arena</strong><br>
      <span style="font-size:0.78rem;">Collide spells to trigger Fusions (Porta+Porta → Pocket Dimension • Pyro+Pocket → Hell Dimension • Kurenos+Wet → Divine Conduction!)</span>
    </div>
  `;
  let fieldCls = 'field-zone';
  let fieldStyle = '';
  if (d.arena.fusion) {
    const fInfo = FUSIONS[d.arena.fusion.id];
    fieldCls += ' active-fusion';
    fieldStyle = `--fusion-color:${fInfo.color};`;
    const trapTxt = d.arena.fusion.trapped ? ` • Trapped: <strong>${d[d.arena.fusion.trapped].name}</strong>` : '';
    const ctrlTxt = d.arena.fusion.controller && d.arena.fusion.id === 'pocket_dimension'
      ? ` • Domain Control (+40% ATK): <strong>${d[d.arena.fusion.controller].name}</strong>` : '';
    fieldHtml = `
      <div style="font-size:1.05rem; font-weight:800; color:${fInfo.color};">
        ${fInfo.icon} ACTIVE FUSION: ${fInfo.name.toUpperCase()} (${d.arena.fusion.turnsLeft}t left)
      </div>
      <div style="font-size:0.82rem; color:#e2e8f0;">${fInfo.desc}${ctrlTxt}${trapTxt}</div>
      ${d.arena.portaSealed ? '<div style="font-size:0.78rem; color:#fda4af;">🚫 PORTA SEALED WHILE DIMENSION PERSISTS</div>' : ''}
    `;
  }

  // Recent Events Ribbon (d20 rolls, damage popups, banners)
  const eventsHtml = d.lastEvents
    .map((ev) => {
      if (ev.type === 'd20') {
        const whoLbl = ev.who === 'player' ? 'Jet' : e.name;
        const dcTxt = ev.dc > 0 ? ` vs >${ev.dc} (${ev.success ? 'RESIST!' : 'FAIL'})` : '';
        return `<span class="d20-badge ${ev.dc > 0 && !ev.success ? 'fail' : ''}">🎲 ${whoLbl} ${ev.label}: d20(${ev.raw})${ev.bonus ? `+${ev.bonus}` : ''} = ${ev.total}${dcTxt}</span>`;
      }
      if (ev.type === 'damage') {
        const whoLbl = ev.who === 'player' ? 'Jet' : e.name;
        return `<span class="dmg-badge ${ev.big ? 'big' : ''}">💥 ${whoLbl} -${ev.amount.toLocaleString()} LP ${ev.label || ''}</span>`;
      }
      if (ev.type === 'banner') {
        return `<span class="d20-badge" style="border-color:${ev.color};">✨ ${ev.text}</span>`;
      }
      return '';
    })
    .join('');

  // Tactical Gauntlet Buttons
  const canRedirect = Boolean(p.activeDefense?.caught) && d.phase === 'player';
  const canSacrifice = (p.shield > 0 || Boolean(p.activeDefense)) && p.counterSurge === 0 && d.phase === 'player';

  // Hand Cards
  const handHtml = p.hand
    .map((cardId, idx) => {
      const card = CARDS[cardId];
      const el = ELEMENTS[card.element];
      const rar = RARITIES[card.rarity];
      const mastery = getCardMasteryBonus(state, cardId);
      const atkVal = Math.round(card.atkPower * mastery);
      const defVal = Math.round(card.defShield * mastery);
      const isSealed = d.arena.portaSealed && card.tags.includes('portal');
      const isSelfPossess = card.tags.includes('self_possess');
      const defLabel = isSelfPossess ? '🪓 Self-Strike' : card.tags.includes('portal') ? '🌀 Catch' : '🛡️ Defense';

      return `
        <article class="spell-card rarity-${card.rarity} ${isSealed ? 'sealed' : ''}" style="--rarity-color:${rar.color};">
          <div class="card-header">
            <h3 class="card-name">${card.name}</h3>
            <span class="card-el">${el.icon} ${el.name}</span>
          </div>
          <div class="card-art-frame">${renderCardArtSVG(card)}</div>
          <div class="card-stats">
            <span>⚔️ ${atkVal}</span>
            <span>${defVal > 0 ? `🛡️ ${defVal}` : isSelfPossess ? '👻 Possess' : '🌀 Redirect'}</span>
          </div>
          <p class="card-desc"><strong>ATK:</strong> ${card.atkDesc}<br><strong>DEF:</strong> ${card.defDesc}</p>
          <div class="card-actions">
            <button type="button" class="btn btn-sm btn-danger" data-play-idx="${idx}" data-pos="attack" ${isSealed || d.phase !== 'player' ? 'disabled' : ''}>⚔️ Attack</button>
            <button type="button" class="btn btn-sm btn-cyan" data-play-idx="${idx}" data-pos="defense" ${isSealed || p.statuses.bound || d.phase !== 'player' ? 'disabled' : ''}>${defLabel}</button>
          </div>
        </article>
      `;
    })
    .join('');

  appMain.innerHTML = `
    <div class="duel-layout">
      <div class="arena-stage">
        <!-- ENEMY -->
        <section class="combatant-panel enemy-panel">
          <div class="combatant-top">
            <div class="avatar-group">
              <div class="avatar-orb" style="--accent-color:${e.accent};">${e.possession ? e.possession.icon : e.avatar}</div>
              <div>
                <h2 style="margin:0; font-size:1.15rem;">${e.name}</h2>
                <div style="font-size:0.78rem; color:var(--text-muted);">${e.title}</div>
              </div>
            </div>
            ${e.intent ? `<span class="status-chip intent">🎯 Next Intent: ${e.intent.label}</span>` : ''}
          </div>
          <div class="lp-bar-wrap">
            <div class="lp-bar-fill" style="--hp-pct:${ePct}%;"></div>
            <div class="lp-bar-text">${e.lp.toLocaleString()} / ${e.maxLp.toLocaleString()} LP</div>
          </div>
          <div class="status-row">${renderStatuses(e)}</div>
        </section>

        <!-- FIELD / FUSION ZONE -->
        <section class="${fieldCls}" style="${fieldStyle}">
          ${fieldHtml}
          ${eventsHtml ? `<div class="event-ribbon">${eventsHtml}</div>` : ''}
        </section>

        <!-- PLAYER -->
        <section class="combatant-panel player-panel">
          <div class="combatant-top">
            <div class="avatar-group">
              <div class="avatar-orb" style="--accent-color:#38bdf8;">${p.possession ? p.possession.icon : '🦸🏾‍♂️'}</div>
              <div>
                <h2 style="margin:0; font-size:1.15rem;">${p.name}</h2>
                <div style="font-size:0.78rem; color:var(--text-muted);">Deck: ${p.deck.length} • Discard: ${p.discard.length} • Play 1 Spell / Turn</div>
              </div>
            </div>
            <div class="tactical-bar">
              ${canRedirect ? `<button type="button" class="btn btn-sm btn-primary" id="btn-redirect">🌀 Switch to ATTACK (Redirect ${CARDS[p.activeDefense.caught.cardId].name}!)</button>` : ''}
              ${canSacrifice ? `<button type="button" class="btn btn-sm btn-gold" id="btn-sacrifice">⚡ Sacrifice Shield (+Counter-Surge)</button>` : ''}
            </div>
          </div>
          <div class="lp-bar-wrap">
            <div class="lp-bar-fill" style="--hp-pct:${pPct}%;"></div>
            <div class="lp-bar-text">${p.lp.toLocaleString()} / ${p.maxLp.toLocaleString()} LP</div>
          </div>
          <div class="status-row">${renderStatuses(p)}</div>

          <h3 style="margin:14px 0 8px; font-size:0.9rem; color:#cbd5e1;">🃏 Your Holographic Hand (${p.hand.length})</h3>
          <div class="hand-grid">${handHtml}</div>
        </section>
      </div>

      <!-- DUEL LOG -->
      <aside class="panel duel-log-panel">
        <h3 style="margin:0; font-size:0.95rem;">📜 Duel Chronicle</h3>
        <ul class="duel-log-list">
          ${d.log.map((item) => `<li class="${item.type}"><strong>T${item.turn}:</strong> ${item.text}</li>`).join('')}
        </ul>
      </aside>
    </div>
  `;

  // Wire card play buttons
  appMain.querySelectorAll('[data-play-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.playIdx);
      const pos = btn.dataset.pos;
      const ok = playerPlayCard(d, idx, pos);
      if (ok) {
        playCombatSfx(d);
        handlePostAction(d);
      }
    });
  });

  const btnRedir = document.getElementById('btn-redirect');
  if (btnRedir) {
    btnRedir.addEventListener('click', () => {
      if (playerSwitchRedirect(d)) {
        sfx.fusion();
        handlePostAction(d);
      }
    });
  }

  const btnSac = document.getElementById('btn-sacrifice');
  if (btnSac) {
    btnSac.addEventListener('click', () => {
      if (sacrificePlayerShield(d)) {
        sfx.lightning();
        render();
      }
    });
  }
}

function playCombatSfx(d) {
  const hasFusion = d.lastEvents.some((e) => e.type === 'fusion');
  const hasD20 = d.lastEvents.some((e) => e.type === 'd20');
  const bigHit = d.lastEvents.some((e) => e.type === 'damage' && e.big);
  if (hasFusion) sfx.fusion();
  else if (bigHit) sfx.lightning();
  else if (hasD20) sfx.diceRoll();
  else sfx.attackHit(false);
}

function handlePostAction(d) {
  render();
  if (d.phase === 'victory') {
    sfx.victory();
    openVictoryModal(d);
  } else if (d.phase === 'defeat') {
    sfx.defeat();
    openDefeatModal(d);
  }
}

function openVictoryModal(d) {
  const run = state.activeRun;
  const rewards = getDuelRewards(state, run, d.enemyTemplate);
  overlayTitle.textContent = `🏆 VICTORY vs ${d.enemyTemplate.name}!`;
  overlayCloseBtn.hidden = true;

  const cardsHtml = rewards.cardChoices
    .map((id) => {
      const c = CARDS[id];
      const rar = RARITIES[c.rarity];
      return `
        <article class="spell-card rarity-${c.rarity}" style="--rarity-color:${rar.color};">
          <div class="card-header">
            <h3 class="card-name">${c.name}</h3>
            <span class="card-el">${ELEMENTS[c.element].icon}</span>
          </div>
          <div class="card-art-frame">${renderCardArtSVG(c)}</div>
          <p class="card-desc">${c.atkDesc}</p>
          <button type="button" class="btn btn-sm btn-primary" data-steal-card="${id}">Steal Spell Card</button>
        </article>
      `;
    })
    .join('');

  overlayBody.innerHTML = `
    <p style="margin-top:0;">
      You claimed <strong>+${rewards.shards} 💎 Lucid Shards</strong> and <strong>+${rewards.xp} XP</strong>!
      ${rewards.relic ? `<br>🎁 Storyverse Relic Unlocked: <strong>${rewards.relic.icon} ${rewards.relic.name}</strong> — ${rewards.relic.desc}` : ''}
    </p>
    <h3 style="margin:12px 0 8px;">Steal 1 Spell Card from the defeated Duelist (adds to your Run Deck):</h3>
    <div class="card-grid">${cardsHtml}</div>
    <div style="margin-top:14px; text-align:right;">
      <button type="button" class="btn" id="btn-skip-steal">Skip Card (+40 Bonus Shards)</button>
    </div>
  `;

  const finish = (chosenId) => {
    if (!chosenId) state.shards += 40;
    applyDuelVictory(state, run, activeNode, rewards, chosenId);
    activeDuel = null;
    activeNode = null;
    modalOverlay.close();
    if (run.completed) {
      showToast('👑 STORYVERSE RUN COMPLETE! +300 Bonus Lucid Shards!');
    }
    render();
  };

  overlayBody.querySelectorAll('[data-steal-card]').forEach((btn) => {
    btn.addEventListener('click', () => finish(btn.dataset.stealCard));
  });
  document.getElementById('btn-skip-steal').addEventListener('click', () => finish(null));
  modalOverlay.showModal();
}

function openDefeatModal(d) {
  const res = applyRunDefeat(state, state.activeRun);
  overlayTitle.textContent = '💀 Gauntlet Overloaded';
  overlayCloseBtn.hidden = true;
  overlayBody.innerHTML = `
    <p style="margin-top:0;">${d.enemyTemplate.name} overwhelmed your Life Points, waking you from this run.</p>
    <p>You still kept <strong>+${res.consolationShards} 💎 Lucid Shards</strong> and <strong>+${res.consolationXp} XP</strong> to upgrade your Gauntlet or pull new Holographic Packs!</p>
    <button type="button" class="btn btn-primary" id="btn-return-hub">Return to Storyverse Hub</button>
  `;
  document.getElementById('btn-return-hub').addEventListener('click', () => {
    activeDuel = null;
    activeNode = null;
    modalOverlay.close();
    render();
  });
  modalOverlay.showModal();
}

// =========================================================================
// 3. DECKBUILDER & COLLECTION VIEW
// =========================================================================
function renderDeckbuilderView() {
  const deckCounts = {};
  for (const id of state.starterDeck) deckCounts[id] = (deckCounts[id] || 0) + 1;

  const filters = ['all', 'common', 'rare', 'epic', 'divine'];
  const filtered = CARD_LIST.filter((c) => deckFilter === 'all' || c.rarity === deckFilter);

  const cardsHtml = filtered
    .map((c) => {
      const owned = state.collection[c.id] || 0;
      const inDeck = deckCounts[c.id] || 0;
      const mastery = state.mastery[c.id] || 0;
      const rar = RARITIES[c.rarity];
      const craftCost = rar.dustCost;
      const upgCost = 80 + mastery * 80;

      return `
        <article class="spell-card rarity-${c.rarity} ${owned === 0 ? 'sealed' : ''}" style="--rarity-color:${rar.color};">
          <div class="card-header">
            <h3 class="card-name">${c.name} ${mastery > 0 ? `<small style="color:#fbbf24;">+${mastery}</small>` : ''}</h3>
            <span class="card-el">${ELEMENTS[c.element].icon} ${rar.name}</span>
          </div>
          <div class="card-art-frame">${renderCardArtSVG(c)}</div>
          <div class="card-stats">
            <span>Owned: ${owned}/3</span>
            <span>In Deck: ${inDeck}</span>
          </div>
          <p class="card-desc">${c.atkDesc}</p>
          <div class="card-actions">
            ${owned > 0
              ? `<button type="button" class="btn btn-sm btn-primary" data-add-deck="${c.id}" ${inDeck >= owned || state.starterDeck.length >= 20 ? 'disabled' : ''}>+ Deck</button>
                 <button type="button" class="btn btn-sm btn-danger" data-rem-deck="${c.id}" ${inDeck <= 0 || state.starterDeck.length <= 12 ? 'disabled' : ''}>- Deck</button>`
              : `<button type="button" class="btn btn-sm btn-gold" style="grid-column:span 2;" data-craft="${c.id}">✨ Craft (${craftCost})</button>`}
            ${owned > 0 && mastery < 5
              ? `<button type="button" class="btn btn-sm btn-cyan" style="grid-column:span 2;" data-mastery="${c.id}">⬆️ Mastery Lv.${mastery + 1} (${upgCost} ✨)</button>`
              : ''}
          </div>
        </article>
      `;
    })
    .join('');

  appMain.innerHTML = `
    <section class="panel">
      <div class="deck-toolbar">
        <div>
          <h2 style="margin:0;">🃏 Starter Deckbuilder &amp; Spell Collection</h2>
          <p style="margin:4px 0 0; color:var(--text-muted); font-size:0.84rem;">
            Active Starter Deck: <strong>${state.starterDeck.length} / 20 cards</strong> (Min 12) • Upgrade Mastery for +8% ATK &amp; Shield per level!
          </p>
        </div>
        <div class="filter-pills">
          ${filters.map((f) => `<button type="button" class="pill-btn ${deckFilter === f ? 'active' : ''}" data-filter="${f}">${f.toUpperCase()}</button>`).join('')}
        </div>
      </div>
      <div class="card-grid">${cardsHtml}</div>
    </section>
  `;

  appMain.querySelectorAll('[data-filter]').forEach((b) => {
    b.addEventListener('click', () => {
      deckFilter = b.dataset.filter;
      render();
    });
  });

  appMain.querySelectorAll('[data-add-deck]').forEach((b) => {
    b.addEventListener('click', () => {
      state.starterDeck.push(b.dataset.addDeck);
      saveState(state);
      sfx.cardPlay();
      render();
    });
  });

  appMain.querySelectorAll('[data-rem-deck]').forEach((b) => {
    b.addEventListener('click', () => {
      const idx = state.starterDeck.indexOf(b.dataset.remDeck);
      if (idx >= 0) state.starterDeck.splice(idx, 1);
      saveState(state);
      render();
    });
  });

  appMain.querySelectorAll('[data-craft]').forEach((b) => {
    b.addEventListener('click', () => {
      const res = craftCard(state, b.dataset.craft);
      if (res.ok) {
        sfx.gachaReveal('rare');
        showToast(`Crafted ${CARDS[b.dataset.craft].name}!`);
        render();
      } else {
        showToast(res.reason);
      }
    });
  });

  appMain.querySelectorAll('[data-mastery]').forEach((b) => {
    b.addEventListener('click', () => {
      const res = upgradeCardMastery(state, b.dataset.mastery);
      if (res.ok) {
        sfx.shieldUp();
        showToast(`${CARDS[b.dataset.mastery].name} upgraded to Mastery +${res.level}!`);
        render();
      } else {
        showToast(res.reason);
      }
    });
  });
}

// =========================================================================
// 4. VOID GACHA VIEW
// =========================================================================
function renderGachaView() {
  const bannersHtml = BANNERS.map((b) => `
    <article class="banner-card" style="--banner-accent:${b.accent};">
      <h3 style="margin:0; font-size:1.25rem; color:${b.accent};">🌌 ${b.name}</h3>
      <p style="margin:0; font-size:0.86rem; color:#cbd5e1;">${b.subtitle}</p>
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin:4px 0;">
        ${b.featured.map((id) => `<span class="status-chip">${ELEMENTS[CARDS[id].element].icon} ${CARDS[id].name}</span>`).join('')}
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:auto; padding-top:8px;">
        <button type="button" class="btn btn-cyan" data-pull-banner="${b.id}" data-pull-count="1">Open 1× Pack (${PULL_COSTS.single} 💎)</button>
        <button type="button" class="btn btn-gold" data-pull-banner="${b.id}" data-pull-count="10">Open 10× Packs (${PULL_COSTS.ten} 💎)</button>
      </div>
    </article>
  `).join('');

  appMain.innerHTML = `
    <section class="panel">
      <div class="deck-toolbar">
        <div>
          <h2 style="margin:0;">🌌 Void Summon — Holographic Card Packs</h2>
          <p style="margin:4px 0 0; color:var(--text-muted); font-size:0.85rem;">
            Guaranteed <strong>Epic+</strong> every 10 pulls • Guaranteed <strong>Divine Mythic</strong> at 50 pity • Duplicates convert into ✨ Arcane Dust!
          </p>
        </div>
        <div style="display:flex; gap:8px;">
          <span class="rank-pill">Epic Pity: ${state.pityEpic}/10</span>
          <span class="rank-pill">Divine Pity: ${state.pityDivine}/50</span>
        </div>
      </div>
      <div class="banner-grid">${bannersHtml}</div>
    </section>
  `;

  appMain.querySelectorAll('[data-pull-banner]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const bannerId = btn.dataset.pullBanner;
      const count = Number(btn.dataset.pullCount);
      const res = performGachaPull(state, bannerId, count);
      if (!res.ok) {
        showToast(res.reason);
        return;
      }
      const best = res.results.some((r) => r.card.rarity === 'divine')
        ? 'divine'
        : res.results.some((r) => r.card.rarity === 'epic')
          ? 'epic'
          : 'rare';
      sfx.gachaReveal(best);
      openGachaRevealModal(res.results);
      render();
    });
  });
}

function openGachaRevealModal(results) {
  const body = document.getElementById('gacha-modal-body');
  body.innerHTML = `
    <div class="card-grid">
      ${results
        .map(({ card, isNew, dustGained }) => {
          const rar = RARITIES[card.rarity];
          return `
            <article class="spell-card rarity-${card.rarity}" style="--rarity-color:${rar.color};">
              <div class="card-header">
                <h3 class="card-name">${card.name}</h3>
                <span class="card-el">${rar.name}</span>
              </div>
              <div class="card-art-frame">${renderCardArtSVG(card)}</div>
              <p class="card-desc" style="text-align:center; font-weight:700;">
                ${isNew ? '🌟 NEW SPELL UNLOCKED!' : dustGained > 0 ? `✨ Max Copies → +${dustGained} Arcane Dust` : '✅ Added Copy to Collection'}
              </p>
            </article>
          `;
        })
        .join('')}
    </div>
  `;
  modalGacha.showModal();
}

// =========================================================================
// 5. GAUNTLET LAB (META-PROGRESSION)
// =========================================================================
function renderLabView() {
  const upgHtml = GAUNTLET_UPGRADES.map((u) => {
    const rank = state.upgrades[u.id] || 0;
    const maxed = rank >= u.maxRank;
    const cost = getUpgradeCost(u, rank);
    return `
      <article class="upgrade-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0; font-size:1rem;">${u.icon} ${u.name}</h3>
          <span class="status-chip shield">Rank ${rank}/${u.maxRank}</span>
        </div>
        <p style="margin:0; font-size:0.82rem; color:#cbd5e1; flex-grow:1;">${u.desc}</p>
        <button type="button" class="btn btn-sm btn-primary" data-buy-upg="${u.id}" ${maxed || state.shards < cost ? 'disabled' : ''}>
          ${maxed ? '✅ MAXED' : `Upgrade (${cost} 💎)`}
        </button>
      </article>
    `;
  }).join('');

  appMain.innerHTML = `
    <section class="panel">
      <h2 style="margin:0 0 6px;">🦾 Cybernetic Gauntlet Lab</h2>
      <p style="margin:0 0 16px; color:var(--text-muted); font-size:0.86rem;">
        Invest Lucid Shards into permanent wrist-gauntlet upgrades that persist across every roguelike run.
      </p>
      <div class="upgrade-grid">${upgHtml}</div>
    </section>
  `;

  appMain.querySelectorAll('[data-buy-upg]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const res = buyUpgrade(state, btn.dataset.buyUpg);
      if (res.ok) {
        sfx.shieldUp();
        showToast(`Gauntlet upgraded to Rank ${res.newRank}!`);
        render();
      } else {
        showToast(res.reason);
      }
    });
  });
}

// =========================================================================
// 6. FUSION & POSSESSION CODEX
// =========================================================================
function renderCodexView() {
  const fusionsHtml = FUSION_LIST.map((f) => {
    const unlocked = state.discoveredFusions.includes(f.id);
    return `
      <article class="codex-card ${unlocked ? '' : 'locked'}">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0; font-size:1rem; color:${f.color};">${f.icon} ${f.name}</h3>
          <span class="status-chip">${unlocked ? '✅ Discovered' : '🔒 Undiscovered'}</span>
        </div>
        <div style="font-size:0.8rem; font-weight:700; color:#e2e8f0;">Recipe: ${f.recipe}</div>
        <p style="margin:0; font-size:0.8rem; color:#cbd5e1;">${f.desc}</p>
      </article>
    `;
  }).join('');

  const spiritsHtml = POSSESSION_LIST.map((s) => `
    <article class="codex-card">
      <h3 style="margin:0; font-size:1rem; color:${s.color};">${s.icon} ${s.name}</h3>
      <div style="font-size:0.8rem; font-weight:700;">Affinity: ${s.affinity.toUpperCase()} • Weakness: ${s.weakness.toUpperCase()}</div>
      <p style="margin:0; font-size:0.8rem; color:#cbd5e1;">${s.desc}</p>
    </article>
  `).join('');

  appMain.innerHTML = `
    <section class="panel" style="margin-bottom:18px;">
      <h2 style="margin:0 0 6px;">🌀 Spell Fusion Grimoire (${state.discoveredFusions.length}/${FUSION_LIST.length})</h2>
      <p style="margin:0 0 14px; color:var(--text-muted); font-size:0.85rem;">Collide compatible spells during duels to manifest uncontrollable environmental Fusions!</p>
      <div class="codex-grid">${fusionsHtml}</div>
    </section>

    <section class="panel">
      <h2 style="margin:0 0 6px;">👻 Spirit Possession Divinities</h2>
      <p style="margin:0 0 14px; color:var(--text-muted); font-size:0.85rem;">Triggered by failing a d20 Possession save against Axe of 10,000 Souls—or striking yourself on purpose!</p>
      <div class="codex-grid">${spiritsHtml}</div>
    </section>
  `;
}

// =========================================================================
// 7. DAILY REWARDS & DAILY MISSIONS MODALS
// =========================================================================
function renderDailyRewardsModal() {
  const claimable = canClaimDailyReward(state);
  const currentDay = state.dailyRewards.streakDay;
  const nextDay = (currentDay % 7) + 1;

  const body = document.getElementById('rewards-body');
  body.innerHTML = `
    <p style="margin-top:0; color:#cbd5e1; font-size:0.88rem;">
      Log in daily to claim escalating Lucid Shards, Arcane Dust, and Epic Spells! Current Streak: <strong>Day ${currentDay}</strong>
    </p>
    <div class="calendar-grid">
      ${DAILY_REWARD_CALENDAR.map((d) => {
        const claimed = d.day <= currentDay && !(currentDay === 7 && claimable);
        const isCurrent = claimable && d.day === nextDay;
        return `
          <div class="day-tile ${claimed ? 'claimed' : ''} ${isCurrent ? 'current' : ''}">
            <div style="font-size:0.74rem; color:var(--text-muted);">DAY ${d.day}</div>
            <div style="font-size:1.6rem; margin:4px 0;">${d.icon}</div>
            <div style="font-size:0.78rem; font-weight:700;">${d.label}</div>
            <div style="font-size:0.72rem; margin-top:4px;">${claimed ? '✅ Claimed' : isCurrent ? '⭐ Ready!' : 'Locked'}</div>
          </div>
        `;
      }).join('')}
    </div>
    <button type="button" class="btn btn-gold" style="width:100%;" id="btn-claim-daily" ${claimable ? '' : 'disabled'}>
      ${claimable ? `🎁 Claim Day ${nextDay} Reward!` : '✅ Already Claimed Today — Come Back Tomorrow!'}
    </button>
  `;

  const btn = document.getElementById('btn-claim-daily');
  if (btn && claimable) {
    btn.addEventListener('click', () => {
      const res = claimDailyReward(state);
      if (res) {
        sfx.gachaReveal('epic');
        showToast(`🎁 Day ${res.day} Claimed: ${res.summary}`);
        renderDailyRewardsModal();
        updateTopBar();
      }
    });
  }
}

function renderDailyMissionsModal() {
  const body = document.getElementById('missions-body');
  body.innerHTML = `
    <p style="margin-top:0; color:#cbd5e1; font-size:0.86rem;">
      Missions refresh automatically each day (${state.dailyMissions.dateKey}). Complete objectives during duels or gacha pulls!
    </p>
    ${state.dailyMissions.missions
      .map((m) => {
        const done = m.progress >= m.target;
        return `
          <div class="mission-row">
            <div>
              <strong>${m.title}</strong> — <span style="color:#cbd5e1;">${m.desc}</span><br>
              <small style="color:var(--text-muted);">Progress: ${m.progress} / ${m.target} • Reward: +${m.rewardShards} 💎 &amp; +${m.rewardXp} XP</small>
            </div>
            <button type="button" class="btn btn-sm ${m.claimed ? '' : done ? 'btn-gold' : ''}" data-claim-mission="${m.id}" ${m.claimed || !done ? 'disabled' : ''}>
              ${m.claimed ? '✅ Claimed' : done ? 'Claim!' : 'In Progress'}
            </button>
          </div>
        `;
      })
      .join('')}
  `;

  body.querySelectorAll('[data-claim-mission]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const claimed = claimMission(state, btn.dataset.claimMission);
      if (claimed) {
        sfx.victory();
        showToast(`Mission Complete! +${claimed.rewardShards} 💎 & +${claimed.rewardXp} XP`);
        renderDailyMissionsModal();
        updateTopBar();
      }
    });
  });
}

// Initial boot
render();
