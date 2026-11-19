// App Bootstrapper: Wires Game Engine, Character Creator, Level Builder, Dialogue, Quest Journal & MP4 Recorder

import { SPECIES_BY_ID } from './data/species.js';
import { CLASS_BY_ID } from './data/classes.js';
import { createDefaultCharacter, MAX_POTIONS, computeDerivedStats } from './data/spells.js';
import { createTempleOfFourElementsLevel } from './data/templeLevel.js';
import { createConcertHallInvasionLevel } from './data/concertLevel.js';
import { generateProceduralFloor } from './data/proceduralDungeon.js';
import { AudioEngine } from './engine/audio.js';
import { DialogueTTS } from './engine/tts.js';
import { InputManager } from './engine/input.js';
import { GameRenderer, drawCharacter } from './engine/renderer.js';
import { PlaythroughRecorder } from './engine/recorder.js';
import { RPGGame } from './engine/game.js';
import { CharacterCreatorUI } from './ui/creator.js';
import { LevelBuilderUI } from './ui/builder.js';

const canvas = document.getElementById('game-canvas');
const audio = new AudioEngine();
const tts = new DialogueTTS(audio);
const input = new InputManager(canvas);
const renderer = new GameRenderer(canvas);
const recorder = new PlaythroughRecorder(canvas, audio);

let activeCharacter = createDefaultCharacter('human', 'spellblade');
let activeMode = 'grand_campaign'; // grand_campaign | concert | temple | endless | custom_campaign
let campaignQueue = [createTempleOfFourElementsLevel(), createConcertHallInvasionLevel()];
let campaignIndex = 0;
let activeLevel = campaignQueue[0];
let bannerTimer = null;
let activeBannerText = '';
let recTimer = null;
let reopenStartAfterCreator = false;
let startPreviewRaf = null;
let startPreviewTime = 0;

// Dialogue, Start Screen, Victory & Game Over modals
const dialogueDialog = document.getElementById('dialogue-dialog');
const gameOverDialog = document.getElementById('gameover-dialog');
const startDialog = document.getElementById('start-dialog');
const victoryDialog = document.getElementById('victory-dialog');
let dialogueChoicesData = [];
let dialogueSelectedIdx = 0;
let activeDialogueSnapshot = null;
let activeGameOverSnapshot = null;

function buildCampaignQueueForMode(mode) {
  if (mode === 'grand_campaign') {
    return [createTempleOfFourElementsLevel(), createConcertHallInvasionLevel()];
  }
  if (mode === 'concert') return [createConcertHallInvasionLevel()];
  if (mode === 'temple') return [createTempleOfFourElementsLevel()];
  if (mode === 'endless') return [generateProceduralFloor(1)];
  return campaignQueue.length ? campaignQueue : [createTempleOfFourElementsLevel()];
}

function getStoryBriefingHTML(level, mode) {
  if (mode === 'grand_campaign' || campaignQueue.length > 1) {
    const chapterList = campaignQueue
      .map((lv, idx) => `<li><strong>Chapter ${idx + 1}:</strong> ${lv.name}${idx === campaignIndex ? ' <em>(Next)</em>' : ''}</li>`)
      .join('');
    return `
      <h3>Multi-Level Campaign (${campaignQueue.length} Chapters + Endless Abyss)</h3>
      <p>Play straight through linked chapters as the <strong>same Hero</strong>—carrying over all earned <strong>spells, potions, gold, remaining HP, and remaining MP</strong> from level to level!</p>
      <ul>${chapterList}<li><strong>Post-Campaign:</strong> Endless Procedurally Generated Dungeons!</li></ul>
      <p><strong>Current Chapter Briefing:</strong> ${level.description || 'Explore the dungeon and complete your mission.'}</p>
    `;
  }
  if (level.isConcertCampaign) {
    return `
      <h3>${level.name}</h3>
      <p>${level.description}</p>
      <ul>
        <li><strong>Path 1:</strong> Join Commander Xylar to capture Lyricus (beware his lute-summoned minions!).</li>
        <li><strong>Path 2:</strong> Become Lyricus's bodyguard against alien jetpack soldiers with laser pistols.</li>
        <li><strong>Path 3:</strong> Volunteer to take the Bard's place and duel Zor-Krak's earthquake drums on Planet Xylos.</li>
      </ul>
    `;
  }
  if (level.isTempleCampaign) {
    return `
      <h3>${level.name}</h3>
      <p>${level.description}</p>
      <ul>
        <li><strong>Branch 1:</strong> Banish all 4 Elemental Demons for High Priest Aldric to unlock <em>Exorcism</em>.</li>
        <li><strong>Branch 2:</strong> Ally with one Elemental, claim their pact spell, and convert the temple to their domain.</li>
        <li><strong>Branch 3:</strong> Pretend to ally with all 4 Elementals, survive all 5 bosses, and claim the temple as Master of the Four Elements.</li>
      </ul>
    `;
  }
  return `
    <h3>${level.name}</h3>
    <p>${level.description || 'Descend through procedurally generated dungeons, defeat every Floor Guardian, and see how deep you can go with your toolkit!'}</p>
  `;
}

function startStartScreenPreview() {
  if (startPreviewRaf) cancelAnimationFrame(startPreviewRaf);
  const cv = document.getElementById('start-hero-preview');
  const ctx = cv.getContext('2d');
  const loop = () => {
    if (!startDialog.open) return;
    startPreviewTime += 0.016;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const grad = ctx.createRadialGradient(90, 90, 8, 90, 90, 95);
    grad.addColorStop(0, '#2a2d47');
    grad.addColorStop(1, '#11131f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cv.width, cv.height);
    drawCharacter(ctx, activeCharacter, 90, 102, {
      time: startPreviewTime,
      moving: true,
      aimAngle: Math.sin(startPreviewTime * 0.9) * 0.4,
      zoom: 2.3,
    });
    startPreviewRaf = requestAnimationFrame(loop);
  };
  startPreviewRaf = requestAnimationFrame(loop);
}

function openStartScreen({ carryVitals = null } = {}) {
  game.paused = true;
  const sp = SPECIES_BY_ID[activeCharacter.speciesId];
  const cl = CLASS_BY_ID[activeCharacter.classId];
  const derived = computeDerivedStats(activeCharacter);
  const curHp = carryVitals ? Math.round(carryVitals.hp) : derived.maxHp;
  const curMp = carryVitals ? Math.round(carryVitals.mana) : derived.maxMana;

  document.getElementById('start-hero-name').textContent = activeCharacter.name;
  document.getElementById('start-hero-meta').textContent = `${sp.name} ${cl.name} · ${activeCharacter.title}`;
  document.getElementById('start-hero-vitals').innerHTML = `
    <span>HP <b>${curHp}/${derived.maxHp}</b></span>
    <span>MP <b>${curMp}/${derived.maxMana}</b></span>
    <span>🧪 <b>${activeCharacter.potions}/${MAX_POTIONS}</b></span>
  `;

  const modeSel = document.getElementById('start-mode-select');
  if (activeMode !== 'custom_campaign') modeSel.value = activeMode;
  const topSel = document.getElementById('campaign-switcher');
  if (activeMode !== 'custom_campaign') topSel.value = activeMode;

  const badge = document.getElementById('start-chapter-badge');
  badge.textContent =
    campaignQueue.length > 1
      ? `Campaign: Chapter ${campaignIndex + 1} of ${campaignQueue.length}`
      : activeLevel.isEndlessDungeon
        ? 'Endless Mode'
        : 'Standalone Level';

  renderCampaignOrderList();
  document.getElementById('start-story-box').innerHTML = getStoryBriefingHTML(activeLevel, activeMode);

  if (!startDialog.open) startDialog.showModal();
  startStartScreenPreview();
}

function renderCampaignOrderList() {
  const listEl = document.getElementById('campaign-order-list');
  if (!campaignQueue.length) {
    listEl.innerHTML = `<span class="muted">No levels in playlist yet — import Level JSON(s) or add a built-in level above.</span>`;
    return;
  }
  listEl.innerHTML = campaignQueue
    .map(
      (lv, idx) => `
      <div class="campaign-item ${idx === campaignIndex ? 'current' : ''}">
        <span><strong>${idx + 1}.</strong> ${lv.name}</span>
        <div class="campaign-item-actions">
          <button type="button" class="mini-btn" data-cmove="up" data-cidx="${idx}" title="Move Up" ${idx === 0 ? 'disabled' : ''}>▲</button>
          <button type="button" class="mini-btn" data-cmove="down" data-cidx="${idx}" title="Move Down" ${idx === campaignQueue.length - 1 ? 'disabled' : ''}>▼</button>
          <button type="button" class="mini-btn" data-cmove="del" data-cidx="${idx}" title="Remove" ${campaignQueue.length <= 1 ? 'disabled' : ''}>✕</button>
        </div>
      </div>`
    )
    .join('');

  listEl.querySelectorAll('[data-cmove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.cidx);
      const act = btn.dataset.cmove;
      if (act === 'up' && idx > 0) {
        [campaignQueue[idx - 1], campaignQueue[idx]] = [campaignQueue[idx], campaignQueue[idx - 1]];
      } else if (act === 'down' && idx < campaignQueue.length - 1) {
        [campaignQueue[idx + 1], campaignQueue[idx]] = [campaignQueue[idx], campaignQueue[idx + 1]];
      } else if (act === 'del' && campaignQueue.length > 1) {
        campaignQueue.splice(idx, 1);
      }
      campaignIndex = Math.min(campaignIndex, campaignQueue.length - 1);
      activeLevel = campaignQueue[campaignIndex];
      activeMode = campaignQueue.length > 1 ? 'custom_campaign' : activeMode;
      game.load(activeCharacter, activeLevel, { startPaused: true });
      openStartScreen();
    });
  });
}

function beginSelectedAdventure({ carryVitals = null } = {}) {
  if (!campaignQueue.length) {
    alert('Add or import at least one level to your campaign playlist first!');
    return;
  }
  activeLevel = campaignQueue[campaignIndex] || campaignQueue[0];
  if (startPreviewRaf) cancelAnimationFrame(startPreviewRaf);
  if (startDialog.open) startDialog.close();
  game.load(activeCharacter, activeLevel, { carryVitals, startPaused: false });
  showBanner(`Entered: ${activeLevel.name}`);
}

startDialog.addEventListener('cancel', (e) => e.preventDefault());
startDialog.addEventListener('close', () => {
  if (startPreviewRaf) cancelAnimationFrame(startPreviewRaf);
  startDialog.returnValue = '';
});

document.getElementById('start-mode-select').addEventListener('change', (e) => {
  activeMode = e.target.value;
  campaignQueue = buildCampaignQueueForMode(activeMode);
  campaignIndex = 0;
  activeLevel = campaignQueue[0];
  game.load(activeCharacter, activeLevel, { startPaused: true });
  openStartScreen();
});

const campaignFileInput = document.getElementById('campaign-json-file');
document.getElementById('btn-campaign-add-json').addEventListener('click', () => campaignFileInput.click());
campaignFileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  for (const file of files) {
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed.tiles) || !parsed.width || !parsed.height) {
        throw new Error(`${file.name} is not a valid level JSON.`);
      }
      campaignQueue.push(parsed);
      activeMode = 'custom_campaign';
    } catch (err) {
      alert(err.message);
    }
  }
  activeLevel = campaignQueue[campaignIndex];
  campaignFileInput.value = '';
  openStartScreen();
});

document.getElementById('btn-campaign-add-temple').addEventListener('click', () => {
  campaignQueue.push(createTempleOfFourElementsLevel());
  activeMode = 'custom_campaign';
  activeLevel = campaignQueue[campaignIndex];
  openStartScreen();
});

document.getElementById('btn-campaign-add-concert').addEventListener('click', () => {
  campaignQueue.push(createConcertHallInvasionLevel());
  activeMode = 'custom_campaign';
  activeLevel = campaignQueue[campaignIndex];
  openStartScreen();
});

document.getElementById('btn-campaign-clear').addEventListener('click', () => {
  campaignQueue = [];
  campaignIndex = 0;
  activeMode = 'custom_campaign';
  renderCampaignOrderList();
});

document.getElementById('btn-start-customize').addEventListener('click', () => {
  reopenStartAfterCreator = true;
  if (startDialog.open) startDialog.close();
  creatorUI.open(activeCharacter);
});

document.getElementById('btn-start-play').addEventListener('click', () => {
  audio.ensureContext();
  beginSelectedAdventure();
});

function openVictoryModal({ endingTitle, rewardSpellName, levelName }) {
  game.paused = true;
  activeCharacter = structuredClone(game.character);
  document.getElementById('victory-ending').textContent = `${endingTitle} in ${levelName}!`;
  document.getElementById('victory-reward').textContent = rewardSpellName
    ? `✨ New Spell Unlocked: ${rewardSpellName} (Equipped on RT / R!)`
    : `✨ Victory achieved!`;
  document.getElementById('victory-carry').textContent =
    `Carrying over: ${Math.ceil(game.player.hp)}/${game.player.maxHp} HP · ${Math.floor(game.player.mana)}/${game.player.maxMana} MP · ${game.character.potions}/${MAX_POTIONS} Potions · ${game.character.bonusSpells.length} Bonus Spell(s)`;

  const nextBtn = document.getElementById('btn-victory-next-chapter');
  const hasNextChapter = campaignIndex + 1 < campaignQueue.length;
  if (hasNextChapter) {
    const nextLvl = campaignQueue[campaignIndex + 1];
    nextBtn.hidden = false;
    nextBtn.textContent = `▶ Next Chapter (${campaignIndex + 2}/${campaignQueue.length}): ${nextLvl.name}`;
  } else {
    nextBtn.hidden = true;
  }

  if (!victoryDialog.open) victoryDialog.showModal();
}

victoryDialog.addEventListener('close', () => {
  victoryDialog.returnValue = '';
  if (!startDialog.open && !dialogueDialog.open && !gameOverDialog.open) {
    game.paused = false;
  }
});

document.getElementById('btn-victory-next-chapter').addEventListener('click', () => {
  const vitals = { hp: game.player.hp, mana: game.player.mana };
  activeCharacter = structuredClone(game.character);
  campaignIndex++;
  activeLevel = campaignQueue[campaignIndex];
  victoryDialog.close();
  // Show Start Screen briefing for the next chapter with carried-over vitals & hero!
  game.load(activeCharacter, activeLevel, { carryVitals: vitals, startPaused: true });
  openStartScreen({ carryVitals: vitals });
  // Ensure clicking Start Adventure preserves carried vitals for this chapter transition
  document.getElementById('btn-start-play').onclick = () => {
    audio.ensureContext();
    document.getElementById('btn-start-play').onclick = null;
    beginSelectedAdventure({ carryVitals: vitals });
  };
});

document.getElementById('btn-victory-endless').addEventListener('click', () => {
  victoryDialog.close();
  activeCharacter = structuredClone(game.character);
  game.startEndlessRun(true);
});

function openGameOver({ killerName, levelName, kills, chestsOpened, isEndless, endlessFloor }) {
  const cause = `${game.character.name} was slain by ${killerName} in ${levelName}.`;
  const stats = isEndless
    ? `Endless Run Summary: Reached Floor ${endlessFloor} · ${kills} total enemies vanquished · ${chestsOpened} chests opened.`
    : `Run Summary: ${kills} enemies vanquished · ${chestsOpened} treasure chests opened.`;
  document.getElementById('gameover-cause').textContent = cause;
  document.getElementById('gameover-stats').textContent = stats;
  activeGameOverSnapshot = { cause, stats };
  if (!gameOverDialog.open) gameOverDialog.showModal();
}

function restartFromGameOver() {
  activeGameOverSnapshot = null;
  if (gameOverDialog.open) gameOverDialog.close();
  game.restartLevel();
  showBanner(`Restarted ${game.level.name} from the beginning!`);
}

// Prevent Esc from bypassing Game Over without restarting
gameOverDialog.addEventListener('cancel', (e) => {
  e.preventDefault();
});

gameOverDialog.addEventListener('close', () => {
  activeGameOverSnapshot = null;
  gameOverDialog.returnValue = '';
});

document.getElementById('btn-gameover-restart').addEventListener('click', () => {
  restartFromGameOver();
});

document.getElementById('btn-gameover-start-screen').addEventListener('click', () => {
  activeGameOverSnapshot = null;
  if (gameOverDialog.open) gameOverDialog.close();
  game.load(activeCharacter, activeLevel, { startPaused: true });
  openStartScreen();
});

function showBanner(msg) {
  const el = document.getElementById('banner');
  el.textContent = msg;
  el.classList.add('show');
  activeBannerText = msg;
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => {
    el.classList.remove('show');
    activeBannerText = '';
  }, 4600);
}

function openDialogue({ speaker, role, text, choices }) {
  game.paused = true;
  document.getElementById('dialogue-speaker').textContent = speaker;
  document.getElementById('dialogue-text').textContent = text;
  const wrap = document.getElementById('dialogue-choices');
  dialogueChoicesData = choices || [];
  dialogueSelectedIdx = 0;
  activeDialogueSnapshot = { speaker, text, choices: dialogueChoicesData, selectedIdx: 0 };

  wrap.innerHTML = dialogueChoicesData
    .map(
      (c, i) =>
        `<button type="button" class="btn ${c.primary ? 'primary' : ''} ${i === 0 ? 'focused' : ''}" data-choice="${i}">${c.label}</button>`
    )
    .join('');

  wrap.querySelectorAll('[data-choice]').forEach((btn) => {
    btn.addEventListener('click', () => chooseDialogue(Number(btn.dataset.choice)));
  });

  dialogueDialog.showModal();
  tts.speak(text, { speaker, role });
}

function chooseDialogue(idx) {
  const choice = dialogueChoicesData[idx];
  tts.stop();
  activeDialogueSnapshot = null;
  dialogueDialog.close();
  game.paused = false;
  choice?.action?.();
}

dialogueDialog.addEventListener('close', () => {
  tts.stop();
  activeDialogueSnapshot = null;
  dialogueDialog.returnValue = '';
  game.paused = false;
});

document.getElementById('btn-tts-replay').addEventListener('click', () => {
  tts.replay();
});

document.getElementById('btn-tts-toggle').addEventListener('click', (e) => {
  tts.setEnabled(!tts.enabled);
  e.target.textContent = tts.enabled ? '🗣️ TTS: On' : '🗣️ TTS: Off';
});

function updateDialogueFocus() {
  const btns = dialogueDialog.querySelectorAll('[data-choice]');
  btns.forEach((b, i) => b.classList.toggle('focused', i === dialogueSelectedIdx));
  if (activeDialogueSnapshot) activeDialogueSnapshot.selectedIdx = dialogueSelectedIdx;
}

async function toggleRecording() {
  const btn = document.getElementById('btn-record');
  if (!recorder.recording) {
    try {
      audio.ensureContext();
      const res = recorder.start();
      if (!res?.started) return;
      btn.classList.add('recording');
      btn.textContent = '■ Stop (00:00)';
      recTimer = setInterval(() => {
        btn.textContent = `■ Stop (${recorder.getElapsedString()})`;
      }, 500);
      showBanner('Recording MP4 (Full HUD, Dialogue, SFX, Music & NPC TTS in sync). Click Stop or press View/F9 to finish.');
    } catch (err) {
      alert(`Could not start recording: ${err.message}`);
    }
  } else {
    clearInterval(recTimer);
    btn.classList.remove('recording');
    btn.textContent = '⏳ Finalizing...';
    btn.disabled = true;
    const result = await recorder.stop(() => {
      showBanner('Compressing MP4 to stay under 10 MB...');
    });
    btn.disabled = false;
    btn.textContent = '● Record MP4';
    if (result) {
      game.paused = true;
      const vid = document.getElementById('replay-video');
      vid.src = result.url;
      const compNote = result.compressed ? ' · FFmpeg compressed < 10 MB' : '';
      document.getElementById('replay-meta').textContent =
        `Recorded ${result.durationSec}s · ${result.sizeMB} MB ${result.extension.toUpperCase()}${compNote} (Full HUD + Dialogue + Synced Audio/TTS).`;
      document.getElementById('replay-dialog').showModal();
    }
  }
}

const game = new RPGGame({
  canvas,
  input,
  audio,
  renderer,
  callbacks: {
    onBanner: showBanner,
    onOpenDialogue: openDialogue,
    onGameOver: openGameOver,
    onLevelComplete: openVictoryModal,
    onToggleRecord: toggleRecording,
    onAfterRender: (g) => {
      if (recorder.recording) {
        recorder.captureFrame(g, {
          bannerText: activeBannerText,
          dialogue: activeDialogueSnapshot,
          gameOver: activeGameOverSnapshot,
        });
      }
    },
    onPause: () => {
      if (!game.gameOver && !startDialog.open) openQuestJournal();
    },
    onPausedInput: (inp) => {
      if (startDialog.open) {
        if (inp.uiConfirm) {
          audio.ensureContext();
          document.getElementById('btn-start-play').click();
        }
        return;
      }
      if (gameOverDialog.open) {
        if (inp.uiConfirm) restartFromGameOver();
        return;
      }
      if (dialogueDialog.open && dialogueChoicesData.length > 0) {
        if (inp.uiDown) {
          dialogueSelectedIdx = (dialogueSelectedIdx + 1) % dialogueChoicesData.length;
          updateDialogueFocus();
        } else if (inp.uiUp) {
          dialogueSelectedIdx = (dialogueSelectedIdx - 1 + dialogueChoicesData.length) % dialogueChoicesData.length;
          updateDialogueFocus();
        } else if (inp.uiConfirm) {
          chooseDialogue(dialogueSelectedIdx);
        } else if (inp.uiCancel) {
          dialogueDialog.close();
        }
      }
    },
    onHudUpdate: ({ character, player, level, equippedBonusSpell }) => {
      const sp = SPECIES_BY_ID[character.speciesId];
      const cl = CLASS_BY_ID[character.classId];
      document.getElementById('hud-level-name').textContent = level.name;
      document.getElementById('hud-hero-name').textContent = character.name;
      document.getElementById('hud-hero-sub').textContent = `${sp.name} ${cl.name} · ${character.title}`;

      const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
      const mpPct = Math.max(0, Math.min(100, (player.mana / player.maxMana) * 100));
      document.getElementById('hp-fill').style.width = `${hpPct}%`;
      document.getElementById('mp-fill').style.width = `${mpPct}%`;
      document.getElementById('hp-text').textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
      document.getElementById('mp-text').textContent = `${Math.floor(player.mana)}/${player.maxMana}`;

      document.getElementById('hud-gold').textContent = `🪙 ${character.gold}`;
      document.getElementById('hud-potions').textContent = `🧪 ${character.potions}/${MAX_POTIONS}`;

      document.querySelector('#slot-class-melee .slot-name').textContent = cl.melee.name;
      document.querySelector('#slot-racial-melee .slot-name').textContent = sp.melee.name;
      document.querySelector('#slot-class-spell .slot-name').textContent = cl.spell.name;
      document.querySelector('#slot-racial-spell .slot-name').textContent = sp.spell.name;
      document.querySelector('#slot-bonus-spell .slot-name').textContent = equippedBonusSpell
        ? equippedBonusSpell.name
        : 'No Pact Spell';

      document.getElementById('slot-class-melee').classList.toggle('cooldown', player.cooldowns.classMelee > 0);
      document.getElementById('slot-racial-melee').classList.toggle('cooldown', player.cooldowns.racialMelee > 0);
      document.getElementById('slot-class-spell').classList.toggle('cooldown', player.cooldowns.classSpell > 0);
      document.getElementById('slot-racial-spell').classList.toggle('cooldown', player.cooldowns.racialSpell > 0);
      document.getElementById('slot-bonus-spell').classList.toggle('cooldown', player.cooldowns.bonusSpell > 0 || !equippedBonusSpell);
    },
  },
});

// Character Creator & Level Builder UIs
const creatorDialog = document.getElementById('creator-dialog');
const creatorUI = new CharacterCreatorUI(creatorDialog, (updatedChar) => {
  activeCharacter = updatedChar;
  game.applyCharacterUpdate(activeCharacter);
  if (reopenStartAfterCreator) {
    reopenStartAfterCreator = false;
    openStartScreen();
  } else {
    showBanner(`Hero updated: ${updatedChar.name} (${SPECIES_BY_ID[updatedChar.speciesId].name} ${CLASS_BY_ID[updatedChar.classId].name})`);
  }
});

const builderDialog = document.getElementById('builder-dialog');
const builderUI = new LevelBuilderUI(builderDialog, (customLevel) => {
  activeMode = 'custom_campaign';
  campaignQueue = [customLevel];
  campaignIndex = 0;
  activeLevel = customLevel;
  game.load(activeCharacter, activeLevel, { startPaused: true });
  openStartScreen();
});

const questDialog = document.getElementById('quest-dialog');
function openQuestJournal() {
  game.paused = true;
  const s = game.story;
  const body = document.getElementById('quest-content');
  if (game.level.isConcertCampaign) {
    document.getElementById('quest-title').textContent = 'Concert Hall Invasion: Story Paths';
    body.innerHTML = `
      <p><strong>Current Path:</strong> <code>${s.concertPath.toUpperCase()}</code> · Bard: <b>${s.bardDefeated ? 'Subdued' : 'On Stage'}</b> · Commander Xylar: <b>${s.commanderDefeated ? 'Defeated' : 'Active'}</b> · Zor-Krak: <b>${s.drummerDefeated ? 'Defeated' : 'Planet Xylos'}</b></p>
      <div class="branch-card ${s.concertPath === 'alien_ally' ? 'active' : ''}">
        <strong>Path 1 — Join the Aliens (Capture the Bard)</strong>
        <p>Ally with Commander Xylar to capture Lyricus, Master Bard. Watch out—his magical lute summons Harmonic Phantom minions to defend him! Reward: <b>Xylosian Laser Volley</b>.</p>
      </div>
      <div class="branch-card ${s.concertPath === 'bodyguard' ? 'active' : ''}">
        <strong>Path 2 — Bard's Personal Bodyguard</strong>
        <p>Join forces with Lyricus to protect him from slavery. Repel Commander Xylar and Alien Soldiers armed with laser pistols and jet packs! Reward: <b>Chord of the Virtuoso</b>.</p>
      </div>
      <div class="branch-card ${s.concertPath === 'substitute_bard' ? 'active' : ''}">
        <strong>Path 3 — Take the Bard's Place (Planet Xylos Drum Duel)</strong>
        <p>Volunteer to replace Lyricus. The aliens beam you to Planet Xylos where you must defeat Zor-Krak—the Queen's alien drummer who unleashes shockwaves and earthquakes—to claim the Royal Bard throne! Reward: <b>Xylosian War Drums</b>.</p>
      </div>
    `;
  } else if (game.level.isTempleCampaign) {
    document.getElementById('quest-title').textContent = 'Chronicles of the Fourfold Temple';
    body.innerHTML = `
      <p><strong>Temple Status:</strong> Theme = <code>${game.level.templeTheme.toUpperCase()}</code> · Elementals Defeated: <b>${s.defeatedElements.length}/4</b> · Elementals Allied: <b>${s.alliedElements.length}/4</b> · High Priest: <b>${s.priestDefeated ? 'Defeated' : 'Alive'}</b></p>
      <div class="branch-card ${s.branch === 'light' || s.branch === 'undecided' ? 'active' : ''}">
        <strong>Branch 1 — Disciple of the Light</strong>
        <p>Talk to High Priest Aldric, defeat all 4 Elemental Demons (Fire, Water, Earth, Air), and return to Aldric to become a Disciple of the Light and learn <b>Exorcism</b>.</p>
      </div>
      <div class="branch-card ${s.branch.startsWith('ally_') ? 'active' : ''}">
        <strong>Branch 2 — Disciple of an Element (4 Variants)</strong>
        <p>Speak to any Elemental Demon and ally with them to gain their Elemental Pact Spell. Defeat the other 3 Elementals AND High Priest Aldric, then return to your ally to convert the temple into their element.</p>
      </div>
      <div class="branch-card ${s.branch === 'betray_all' ? 'active' : ''}">
        <strong>Branch 3 — Master of the Four Elements</strong>
        <p>Pretend to ally with ALL 4 Elemental Demons to claim all 4 Elemental Pact Spells. Survive the combined fury of all 4 Elementals AND High Priest Aldric, then claim the Central Sanctum Altar to convert the temple into YOUR temple and unlock <b>Fourfold Convergence</b>!</p>
      </div>
    `;
  } else {
    body.innerHTML = `
      <p><strong>Custom Dungeon:</strong> ${game.level.name}</p>
      <p>Enemies Defeated: <b>${game.kills}</b> · Chests Opened: <b>${game.chestsOpened}</b></p>
      <p>Talk to placed NPCs (<code>A</code> / <code>F</code>) to accept missions and claim rewards!</p>
    `;
  }
  questDialog.showModal();
}

questDialog.addEventListener('close', () => {
  questDialog.returnValue = '';
  game.paused = false;
});

const replayDialog = document.getElementById('replay-dialog');
replayDialog.addEventListener('close', () => {
  replayDialog.returnValue = '';
  game.paused = false;
});

document.getElementById('replay-download').addEventListener('click', () => {
  recorder.download(`${activeCharacter.name.toLowerCase()}-playthrough`);
});

document.getElementById('replay-share').addEventListener('click', async () => {
  try {
    const res = await recorder.share(`${activeCharacter.name}'s Aetherbound Playthrough`);
    if (!res.shared && res.reason) showBanner(res.reason);
  } catch (err) {
    if (err.name !== 'AbortError') showBanner('Downloaded playthrough video.');
  }
});

// Pause/resume game when modals open/close
creatorDialog.addEventListener('close', () => {
  if (reopenStartAfterCreator) {
    reopenStartAfterCreator = false;
    openStartScreen();
  } else if (!startDialog.open && !victoryDialog.open && !gameOverDialog.open) {
    game.paused = false;
  }
});
builderDialog.addEventListener('close', () => {
  if (!startDialog.open && !victoryDialog.open && !gameOverDialog.open) {
    game.paused = false;
  }
});

// Topbar buttons
document.getElementById('btn-start-screen').addEventListener('click', () => {
  openStartScreen();
});

document.getElementById('btn-creator').addEventListener('click', () => {
  audio.ensureContext();
  game.paused = true;
  creatorUI.open(game.character || activeCharacter);
});

document.getElementById('btn-builder').addEventListener('click', () => {
  audio.ensureContext();
  game.paused = true;
  builderUI.open(game.level || activeLevel);
});

document.getElementById('btn-quest').addEventListener('click', () => {
  audio.ensureContext();
  openQuestJournal();
});

document.getElementById('btn-record').addEventListener('click', () => toggleRecording());

document.getElementById('btn-mute').addEventListener('click', (e) => {
  audio.setMuted(!audio.muted);
  tts.setMuted(audio.muted);
  e.target.textContent = audio.muted ? '🔇' : '🔊';
});

document.getElementById('campaign-switcher').addEventListener('change', (e) => {
  activeMode = e.target.value;
  campaignQueue = buildCampaignQueueForMode(activeMode);
  campaignIndex = 0;
  activeLevel = campaignQueue[0];
  game.load(activeCharacter, activeLevel, { startPaused: true });
  openStartScreen();
});

document.getElementById('btn-reset-temple').addEventListener('click', () => {
  activeLevel = game.level.isConcertCampaign
    ? createConcertHallInvasionLevel()
    : game.level.isEndlessDungeon
      ? generateProceduralFloor(1)
      : createTempleOfFourElementsLevel();
  game.load(activeCharacter, activeLevel, { startPaused: true });
  questDialog.close();
  openStartScreen();
});

window.addEventListener('gamepad-status', (e) => {
  const el = document.getElementById('hud-gamepad');
  if (e.detail.connected) {
    el.textContent = '🎮 Xbox Controller Connected';
    el.classList.add('connected');
    showBanner(`Controller Connected: ${e.detail.name}`);
  } else {
    el.textContent = '🎮 Keyboard/Mouse';
    el.classList.remove('connected');
  }
});

// Boot the game paused behind the Start Screen so the player can read the story & customize/import their Hero first!
game.load(activeCharacter, activeLevel, { startPaused: true });
game.start();
openStartScreen();
