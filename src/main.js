// App Bootstrapper: Wires Game Engine, Character Creator, Level Builder, Dialogue, Quest Journal & MP4 Recorder

import { SPECIES_BY_ID } from './data/species.js';
import { CLASS_BY_ID } from './data/classes.js';
import { createDefaultCharacter, MAX_POTIONS } from './data/spells.js';
import { createTempleOfFourElementsLevel } from './data/templeLevel.js';
import { AudioEngine } from './engine/audio.js';
import { DialogueTTS } from './engine/tts.js';
import { InputManager } from './engine/input.js';
import { GameRenderer } from './engine/renderer.js';
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
let activeLevel = createTempleOfFourElementsLevel();
let bannerTimer = null;
let activeBannerText = '';
let recTimer = null;

// Dialogue & Game Over state for Xbox controller + WYSIWYG MP4 recording
const dialogueDialog = document.getElementById('dialogue-dialog');
const gameOverDialog = document.getElementById('gameover-dialog');
let dialogueChoicesData = [];
let dialogueSelectedIdx = 0;
let activeDialogueSnapshot = null;
let activeGameOverSnapshot = null;

function openGameOver({ killerName, levelName, kills, chestsOpened }) {
  const cause = `${game.character.name} was slain by ${killerName} in ${levelName}.`;
  const stats = `Run Summary: ${kills} enemies vanquished · ${chestsOpened} treasure chests opened.`;
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
    btn.textContent = '● Record MP4';
    const result = await recorder.stop();
    if (result) {
      game.paused = true;
      const vid = document.getElementById('replay-video');
      vid.src = result.url;
      document.getElementById('replay-meta').textContent =
        `Recorded ${result.durationSec}s (Full HUD + Dialogue + Synced Audio/TTS · ${result.extension.toUpperCase()}). Ready to download or share!`;
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
      if (!game.gameOver) openQuestJournal();
    },
    onPausedInput: (inp) => {
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
  showBanner(`Hero updated: ${updatedChar.name} (${SPECIES_BY_ID[updatedChar.speciesId].name} ${CLASS_BY_ID[updatedChar.classId].name})`);
});

const builderDialog = document.getElementById('builder-dialog');
const builderUI = new LevelBuilderUI(builderDialog, (customLevel) => {
  activeLevel = customLevel;
  game.load(activeCharacter, activeLevel);
  showBanner(`Loaded Dungeon: ${customLevel.name}`);
});

const questDialog = document.getElementById('quest-dialog');
function openQuestJournal() {
  game.paused = true;
  const s = game.story;
  const body = document.getElementById('quest-content');
  if (game.level.isTempleCampaign) {
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
for (const dlg of [creatorDialog, builderDialog]) {
  dlg.addEventListener('close', () => {
    game.paused = false;
  });
}

// Topbar buttons
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

document.getElementById('btn-reset-temple').addEventListener('click', () => {
  activeLevel = createTempleOfFourElementsLevel();
  game.load(activeCharacter, activeLevel);
  questDialog.close();
  showBanner('Temple of the Four Elements reset!');
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

// Boot the game!
game.load(activeCharacter, activeLevel);
game.start();
showBanner('Welcome to the Temple of the Four Elements! Talk to High Priest Aldric [A / F] or customize your Hero!');
