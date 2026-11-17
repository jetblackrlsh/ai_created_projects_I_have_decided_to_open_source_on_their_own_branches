(() => {
  const { ABILITIES, INSPIRATION_TABLES } = window.ElfGameData;
  const Engine = window.ElfGameEngine;

  const STORAGE_KEY = 'elfgame-solo-adventure-v1';
  const THEME_STORAGE_KEY = 'elfgame-color-scheme';

  function createDefaultCharacter() {
    return {
      name: 'Rowan Mossfoot',
      level: 0,
      charClass: 'none',
      stance: 'mundane',
      size: 'medium',
      wearingArmor: false,
      defending: false,
      abilities: { STR: 11, DEX: 12, CON: 10, INT: 10, WIS: 11, CHA: 9 },
      maxHp: 5,
      currentHp: 5,
      gear: 'Traveler’s cloak, iron lantern, 3 days of rations, short sword, 12 silver coins.',
    };
  }

  function createWelcomeLog() {
    return [
      {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        type: 'system',
        title: 'Welcome to The Elf Game Solo Emulator',
        timestamp: new Date().toISOString(),
        body:
          'You are ready to play without a Game Master! Here is how to start:\n' +
          '1. Edit or roll your character on the left (or jump right in as Rowan!).\n' +
          '2. Use "Inspire Me" below to generate a starting setting or creature.\n' +
          '3. Ask the Yes/No or How Many Oracle when you want the world to surprise you.\n' +
          '4. Click any Ability, Save, or Attack button when your character attempts something risky—all math is explained!',
      },
    ];
  }

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.character && Array.isArray(parsed.log)) {
          return parsed;
        }
      }
    } catch (_) {}
    return {
      character: createDefaultCharacter(),
      difficulty: 0,
      targetAC: 10,
      enemyAttackBonus: 0,
      log: createWelcomeLog(),
    };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  // DOM Elements
  const chatLogEl = document.getElementById('chat-log');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const diffPresetEl = document.getElementById('difficulty-preset');
  const diffCustomEl = document.getElementById('difficulty-custom');
  const targetAcEl = document.getElementById('target-ac-input');
  const enemyAtkEl = document.getElementById('enemy-atk-input');
  const gearEl = document.getElementById('char-gear');
  const armorToggleEl = document.getElementById('toggle-armor');
  const defendToggleEl = document.getElementById('toggle-defend');

  // --- Rendering ---
  function renderAll() {
    renderCharacterSheet();
    renderDifficulty();
    renderLog();
  }

  function renderDifficulty() {
    const val = Number(state.difficulty) || 0;
    diffCustomEl.value = String(val);
    const matchingOption = Array.from(diffPresetEl.options).find(
      (opt) => opt.value !== 'custom' && Number(opt.value) === val
    );
    diffPresetEl.value = matchingOption ? matchingOption.value : 'custom';
    targetAcEl.value = String(state.targetAC ?? 10);
    enemyAtkEl.value = String(state.enemyAttackBonus ?? 0);
  }

  function renderCharacterSheet() {
    const c = state.character;
    const derived = Engine.calculateDerivedStats(c);

    document.getElementById('char-display-name').textContent = c.name || 'Unnamed Elf';
    const classLabel = c.charClass === 'none' ? 'Standard' : c.charClass === 'fighter' ? 'Fighter' : 'Tradesman';
    const stanceLabel = c.stance === 'magical' ? 'Magical' : 'Mundane';
    const sizeLabel = c.size.charAt(0).toUpperCase() + c.size.slice(1);
    document.getElementById('char-display-meta').textContent =
      `Level ${c.level} · ${sizeLabel} · ${classLabel} · ${stanceLabel}`;

    const hpDisplay = document.getElementById('char-hp-display');
    hpDisplay.textContent = `${c.currentHp} / ${c.maxHp}`;
    const pct = Math.max(0, Math.min(100, (c.currentHp / Math.max(1, c.maxHp)) * 100));
    const hpFill = document.getElementById('hp-bar-fill');
    hpFill.style.width = `${pct}%`;
    hpFill.style.backgroundColor = pct <= 25 ? 'var(--danger)' : 'var(--success)';

    armorToggleEl.checked = Boolean(c.wearingArmor);
    defendToggleEl.checked = Boolean(c.defending);
    gearEl.value = c.gear || '';

    const derivedGrid = document.getElementById('derived-stats-grid');
    const derivedItems = [
      { label: 'Armor Class', val: derived.ac, title: `AC Formula: ${derived.formulas.ac}` },
      { label: 'Saving Throw', val: derived.savingThrow, title: `Save Formula: ${derived.formulas.savingThrow}` },
      { label: 'Melee', val: Engine.formatSigned(derived.melee), title: `Melee Formula: ${derived.formulas.melee}` },
      { label: 'Ranged', val: Engine.formatSigned(derived.ranged), title: `Ranged Formula: ${derived.formulas.ranged}` },
      { label: 'Size', val: derived.sizeLabel, title: 'Grid space occupied' },
      { label: 'Speed', val: `${derived.speed} Sq`, title: `Speed Formula: ${derived.formulas.speed}` },
    ];

    derivedGrid.innerHTML = '';
    for (const item of derivedItems) {
      const box = document.createElement('div');
      box.className = 'derived-box';
      box.title = item.title;
      box.innerHTML = `<span class="derived-label">${item.label}</span><span class="derived-val">${item.val}</span>`;
      derivedGrid.appendChild(box);
    }

    const abilitiesGrid = document.getElementById('abilities-grid');
    abilitiesGrid.innerHTML = '';
    for (const ab of ABILITIES) {
      const score = Number(c.abilities[ab.key]) || 10;
      const adj = Engine.getAbilityAdjustment(score);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ability-btn';
      btn.title = `${ab.name} (${ab.desc}) — Click to roll a ${ab.key} Ability Test`;
      btn.innerHTML = `
        <span class="ability-name">${ab.key}</span>
        <span class="ability-score-wrap">
          <span class="ability-score">${score}</span>
          <span class="ability-adj">(${Engine.formatSigned(adj)})</span>
        </span>
      `;
      btn.addEventListener('click', () => triggerAbilityCheck(ab.key));
      abilitiesGrid.appendChild(btn);
    }
  }

  function formatTime(iso) {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return '';
    }
  }

  function renderLog() {
    chatLogEl.innerHTML = '';
    for (const entry of state.log) {
      const el = document.createElement('article');
      let cls = `log-entry type-${entry.type}`;
      if (entry.type === 'check') {
        cls += entry.success ? ' is-success' : ' is-fail';
      }
      el.className = cls;

      const header = document.createElement('div');
      header.className = 'entry-header';

      const title = document.createElement('div');
      title.className = 'entry-title';
      title.textContent = entry.title;

      if (entry.type === 'check') {
        const badge = document.createElement('span');
        const isGood = entry.badgeGood !== undefined ? entry.badgeGood : entry.success;
        badge.className = `badge ${isGood ? 'badge-success' : 'badge-fail'}`;
        badge.textContent = entry.badgeText || (entry.success ? 'Success' : 'Failure');
        title.appendChild(badge);
      }

      const time = document.createElement('span');
      time.className = 'entry-time';
      time.textContent = formatTime(entry.timestamp);

      header.appendChild(title);
      header.appendChild(time);
      el.appendChild(header);

      if (entry.body) {
        const body = document.createElement('div');
        body.className = 'entry-body';
        body.textContent = entry.body;
        el.appendChild(body);
      }

      if (entry.steps && entry.explain) {
        const mathBox = document.createElement('div');
        mathBox.className = 'math-breakdown';

        const stepsRow = document.createElement('div');
        stepsRow.className = 'math-steps';
        for (const s of entry.steps) {
          const span = document.createElement('span');
          span.textContent = s;
          stepsRow.appendChild(span);
        }

        const explainP = document.createElement('p');
        explainP.className = 'math-explain';
        explainP.textContent = entry.explain;

        mathBox.appendChild(stepsRow);
        mathBox.appendChild(explainP);
        el.appendChild(mathBox);
      }

      chatLogEl.appendChild(el);
    }
    chatLogEl.scrollTop = chatLogEl.scrollHeight;
  }

  function appendLogEntry(entry) {
    state.log.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      ...entry,
    });
    saveState();
    renderLog();
  }

  function consumeInputText() {
    const txt = chatInput.value.trim();
    chatInput.value = '';
    return txt;
  }

  // --- Game Actions ---
  function triggerAbilityCheck(abilityKey, customNote = null) {
    const note = customNote !== null ? customNote : consumeInputText();
    const res = Engine.resolveAbilityTest(state.character, abilityKey, state.difficulty, note);
    appendLogEntry({
      type: 'check',
      title: `${abilityKey} Ability Test`,
      success: res.success,
      body: note ? `Action: "${note}"` : '',
      steps: res.steps,
      explain: res.explain,
    });
  }

  function triggerSavingThrow(customNote = null) {
    const note = customNote !== null ? customNote : consumeInputText();
    const res = Engine.resolveSavingThrow(state.character, state.difficulty, note);
    appendLogEntry({
      type: 'check',
      title: 'Saving Throw',
      success: res.success,
      body: note ? `Resisting: "${note}"` : '',
      steps: res.steps,
      explain: res.explain,
    });
  }

  function triggerAttack(attackType, customNote = null) {
    const note = customNote !== null ? customNote : consumeInputText();
    const ac = Number(targetAcEl.value) || 10;
    const res = Engine.resolveAttackRoll(state.character, attackType, ac, note);
    const label = attackType === 'melee' ? '⚔️ Melee Attack' : '🏹 Ranged Attack';
    const dmgLine = res.success ? `Hit! Dealt ${res.damage} Hit Point damage (1D6).` : 'Missed the target.';
    appendLogEntry({
      type: 'check',
      title: `${label} (vs AC ${ac})`,
      success: res.success,
      body: note ? `"${note}" — ${dmgLine}` : dmgLine,
      steps: res.steps,
      explain: res.explain,
    });
  }

  function triggerEnemyAttack(customNote = null) {
    const note = customNote !== null ? customNote : consumeInputText();
    const bonus = Number(enemyAtkEl.value) || 0;
    const res = Engine.resolveEnemyAttackRoll(state.character, bonus, note);
    let dmgLine = 'The enemy missed you!';

    if (res.success) {
      const before = state.character.currentHp;
      const after = Math.max(0, before - res.damage);
      state.character.currentHp = after;
      saveState();
      renderCharacterSheet();
      dmgLine = `Enemy hit you for ${res.damage} Hit Point damage (1D6)! HP: ${before} → ${after}.`;
    }

    appendLogEntry({
      type: 'check',
      title: `👹 Enemy Attack (Bonus ${Engine.formatSigned(bonus)} vs Your AC ${res.playerAC})`,
      success: !res.success,
      badgeGood: !res.success,
      badgeText: res.success ? 'Enemy Hit' : 'Enemy Miss',
      body: note ? `"${note}" — ${dmgLine}` : dmgLine,
      steps: res.steps,
      explain: res.explain,
    });

    if (res.success && state.character.currentHp === 0) {
      appendLogEntry({
        type: 'system',
        title: '⚠️ Reduced to 0 Hit Points!',
        body: 'By Elf Game rules, roll a Saving Throw to determine the outcome!',
      });
    }
  }

  function triggerYesNoOracle(customQuestion = null) {
    const question = customQuestion !== null ? customQuestion : consumeInputText();
    const likelihood = document.getElementById('oracle-likelihood').value;
    const res = Engine.resolveYesNoOracle(question, likelihood);
    appendLogEntry({
      type: 'oracle',
      title: `🔮 Oracle: ${res.answer}`,
      body: `Question: "${res.question}"${res.twistNote ? `\n${res.twistNote}` : ''}`,
      steps: [`Likelihood: ${res.likelihoodLabel} (≤ ${res.target}%)`, `Rolled d100: ${res.roll}`],
      explain: `Rolled ${res.roll} on a 1–100 oracle die against a ${res.target}% chance (${res.likelihoodLabel}).`,
    });
  }

  function triggerHowManyOracle(customQuestion = null) {
    const question = customQuestion !== null ? customQuestion : consumeInputText();
    const scale = document.getElementById('oracle-scale').value;
    const res = Engine.resolveHowManyOracle(question, scale);
    appendLogEntry({
      type: 'oracle',
      title: `🔢 How Many Oracle: ${res.total}`,
      body: `Question: "${res.question}"`,
      steps: [`Scale: ${res.scaleLabel}`, `Dice: [${res.rolls.join(', ')}]`, `Total: ${res.total}`],
      explain: `Rolled ${res.scaleLabel} and got ${res.total}.`,
    });
  }

  function triggerInspiration(categoryOverride = null) {
    const cat = categoryOverride || document.getElementById('inspire-category').value;
    const res = Engine.rollInspiration(cat);
    appendLogEntry({
      type: 'inspire',
      title: `Random Inspiration — ${res.categoryLabel}`,
      body: res.result,
    });
  }

  // --- Chat Submit & Slash Commands ---
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = consumeInputText();
    if (!text) return;

    if (text.startsWith('/')) {
      const [rawCmd, ...rest] = text.slice(1).split(/\s+/);
      const cmd = rawCmd.toLowerCase();
      const arg = rest.join(' ');

      const abilityMap = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };
      if (abilityMap[cmd]) return triggerAbilityCheck(abilityMap[cmd], arg);
      if (cmd === 'save') return triggerSavingThrow(arg);
      if (cmd === 'melee') return triggerAttack('melee', arg);
      if (cmd === 'ranged') return triggerAttack('ranged', arg);
      if (cmd === 'enemy') return triggerEnemyAttack(arg);
      if (cmd === 'oracle' || cmd === 'yn') return triggerYesNoOracle(arg);
      if (cmd === 'howmany' || cmd === 'hm') return triggerHowManyOracle(arg);
      if (cmd === 'inspire') {
        const key = Object.keys(INSPIRATION_TABLES).find((k) => k.toLowerCase().startsWith(arg.toLowerCase()));
        return triggerInspiration(key || null);
      }
    }

    appendLogEntry({
      type: 'note',
      title: `📝 ${state.character.name || 'Adventurer'}`,
      body: text,
    });
  });

  // IME-safe Enter-to-submit (with keyCode === 229 Safari fallback)
  chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (event.isComposing || event.keyCode === 229) return;
      chatForm.requestSubmit();
    }
  });

  // --- Quick Tool Buttons ---
  document.querySelectorAll('[data-quick-check]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-quick-check');
      if (key === 'SAVE') triggerSavingThrow();
      else triggerAbilityCheck(key);
    });
  });

  document.getElementById('btn-attack-melee').addEventListener('click', () => triggerAttack('melee'));
  document.getElementById('btn-attack-ranged').addEventListener('click', () => triggerAttack('ranged'));
  document.getElementById('btn-enemy-attack').addEventListener('click', () => triggerEnemyAttack());
  document.getElementById('btn-oracle-yesno').addEventListener('click', () => triggerYesNoOracle());
  document.getElementById('btn-oracle-howmany').addEventListener('click', () => triggerHowManyOracle());
  document.getElementById('btn-inspire').addEventListener('click', () => triggerInspiration());

  // --- Difficulty & AC Controls ---
  diffPresetEl.addEventListener('change', () => {
    if (diffPresetEl.value !== 'custom') {
      state.difficulty = Number(diffPresetEl.value);
      diffCustomEl.value = String(state.difficulty);
      saveState();
    } else {
      diffCustomEl.focus();
    }
  });

  diffCustomEl.addEventListener('input', () => {
    state.difficulty = Number(diffCustomEl.value) || 0;
    renderDifficulty();
    saveState();
  });

  targetAcEl.addEventListener('input', () => {
    state.targetAC = Number(targetAcEl.value) || 10;
    saveState();
  });

  enemyAtkEl.addEventListener('input', () => {
    state.enemyAttackBonus = Number(enemyAtkEl.value) || 0;
    saveState();
  });

  // --- Sidebar HP, Toggles, Gear ---
  document.getElementById('btn-hp-minus').addEventListener('click', () => {
    state.character.currentHp = Math.max(0, state.character.currentHp - 1);
    saveState();
    renderCharacterSheet();
    if (state.character.currentHp === 0) {
      appendLogEntry({
        type: 'system',
        title: '⚠️ Reduced to 0 Hit Points!',
        body: 'By Elf Game rules, roll a Saving Throw to determine the outcome!',
      });
    }
  });

  document.getElementById('btn-hp-plus').addEventListener('click', () => {
    state.character.currentHp = Math.min(state.character.maxHp, state.character.currentHp + 1);
    saveState();
    renderCharacterSheet();
  });

  document.getElementById('btn-rest-heal').addEventListener('click', () => {
    const before = state.character.currentHp;
    state.character.currentHp = Math.min(state.character.maxHp, before + 1);
    saveState();
    renderCharacterSheet();
    appendLogEntry({
      type: 'system',
      title: '🛏️ Rested ~8 Hours',
      body: state.character.currentHp > before
        ? `Healed 1 Hit Point (${before} → ${state.character.currentHp}).`
        : 'Already at full Hit Points.',
    });
  });

  armorToggleEl.addEventListener('change', () => {
    state.character.wearingArmor = armorToggleEl.checked;
    saveState();
    renderCharacterSheet();
  });

  defendToggleEl.addEventListener('change', () => {
    state.character.defending = defendToggleEl.checked;
    saveState();
    renderCharacterSheet();
  });

  gearEl.addEventListener('input', () => {
    state.character.gear = gearEl.value;
    saveState();
  });

  // --- Native <dialog> Management & Light-Dismiss Fallback ---
  const charDialog = document.getElementById('char-dialog');
  const rulesDialog = document.getElementById('rules-dialog');
  const ioDialog = document.getElementById('io-dialog');

  document.getElementById('btn-open-rules').addEventListener('click', () => rulesDialog.showModal());
  document.getElementById('btn-open-io').addEventListener('click', () => ioDialog.showModal());

  document.querySelectorAll('[data-close-dialog]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-close-dialog');
      document.getElementById(id).close();
    });
  });

  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const outside = (e, dialog) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (e) => { pressedOutside = outside(e, dialog); });
      dialog.addEventListener('pointerup', (e) => {
        if (pressedOutside && outside(e, dialog)) dialog.close();
      });
    }
  }

  // --- Character Creator / Editor Modal ---
  function updateEditModalHints() {
    for (const ab of ABILITIES) {
      const val = Number(document.getElementById(`edit-${ab.key}`).value) || 10;
      const adj = Engine.getAbilityAdjustment(val);
      document.getElementById(`adj-${ab.key}`).textContent = Engine.formatSigned(adj);
    }
    const tempChar = readCharFormDraft();
    const derived = Engine.calculateDerivedStats(tempChar);
    document.getElementById('hp-formula-hint').textContent = `Formula: ${derived.formulas.hp}`;
  }

  function readCharFormDraft() {
    return {
      ...state.character,
      name: document.getElementById('edit-name').value.trim() || 'Unnamed Elf',
      level: Number(document.getElementById('edit-level').value) || 0,
      charClass: document.getElementById('edit-class').value,
      stance: document.getElementById('edit-stance').value,
      size: document.getElementById('edit-size').value,
      wearingArmor: document.getElementById('edit-wearing-armor').checked,
      maxHp: Math.max(1, Number(document.getElementById('edit-max-hp').value) || 1),
      abilities: {
        STR: Number(document.getElementById('edit-STR').value) || 10,
        DEX: Number(document.getElementById('edit-DEX').value) || 10,
        CON: Number(document.getElementById('edit-CON').value) || 10,
        INT: Number(document.getElementById('edit-INT').value) || 10,
        WIS: Number(document.getElementById('edit-WIS').value) || 10,
        CHA: Number(document.getElementById('edit-CHA').value) || 10,
      },
    };
  }

  function populateCharForm(charData) {
    document.getElementById('edit-name').value = charData.name ?? state.character.name;
    document.getElementById('edit-level').value = String(charData.level);
    document.getElementById('edit-class').value = charData.charClass;
    document.getElementById('edit-stance').value = charData.stance;
    document.getElementById('edit-size').value = charData.size;
    document.getElementById('edit-wearing-armor').checked = Boolean(charData.wearingArmor);
    document.getElementById('edit-max-hp').value = String(charData.maxHp);
    for (const ab of ABILITIES) {
      document.getElementById(`edit-${ab.key}`).value = String(charData.abilities[ab.key]);
    }
    updateEditModalHints();
  }

  function applyRandomCharacterToModal() {
    const { characterPatch, steps } = Engine.generateRandomCharacter();
    const currentName = document.getElementById('edit-name').value;
    populateCharForm({ ...characterPatch, name: currentName });
    document.getElementById('rolled-pool-banner').hidden = true;

    const stepsBox = document.getElementById('random-steps-box');
    stepsBox.innerHTML = '<strong>Step-by-Step Random Build (Name is yours to choose!):</strong>';
    const ol = document.createElement('ol');
    for (const step of steps) {
      const li = document.createElement('li');
      li.textContent = step.replace(/^\d+\.\s*/, '');
      ol.appendChild(li);
    }
    stepsBox.appendChild(ol);
    stepsBox.hidden = false;
  }

  document.getElementById('btn-edit-char').addEventListener('click', () => {
    populateCharForm(state.character);
    document.getElementById('rolled-pool-banner').hidden = true;
    document.getElementById('random-steps-box').hidden = true;
    charDialog.showModal();
  });

  document.getElementById('btn-random-char-quick').addEventListener('click', () => {
    populateCharForm(state.character);
    document.getElementById('rolled-pool-banner').hidden = true;
    applyRandomCharacterToModal();
    charDialog.showModal();
    document.getElementById('edit-name').focus();
    document.getElementById('edit-name').select();
  });

  document.getElementById('btn-random-char-modal').addEventListener('click', () => {
    applyRandomCharacterToModal();
  });

  ['edit-level', 'edit-class', 'edit-stance', 'edit-size', ...ABILITIES.map((a) => `edit-${a.key}`)].forEach((id) => {
    document.getElementById(id).addEventListener('input', updateEditModalHints);
  });

  document.getElementById('btn-roll-3d6').addEventListener('click', () => {
    const pool = ABILITIES.map(() => Engine.rollDice(3, 6).total);
    ABILITIES.forEach((ab, idx) => {
      document.getElementById(`edit-${ab.key}`).value = String(pool[idx]);
    });
    const banner = document.getElementById('rolled-pool-banner');
    banner.textContent = `Rolled 3d6 × 6: [${pool.join(', ')}] — Feel free to swap numbers between abilities!`;
    banner.hidden = false;
    updateEditModalHints();
  });

  document.getElementById('btn-roll-hp').addEventListener('click', () => {
    const draft = readCharFormDraft();
    const res = Engine.rollSuggestedMaxHP(draft);
    document.getElementById('edit-max-hp').value = String(res.total);
    const banner = document.getElementById('rolled-pool-banner');
    banner.textContent = `Rolled HP: [${res.diceRolls.join(' + ')}] ${Engine.formatSigned(res.flatBonus)} = ${res.total} Max HP.`;
    banner.hidden = false;
  });

  document.getElementById('char-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const updated = readCharFormDraft();
    const prevMax = state.character.maxHp;
    const hpDiff = updated.maxHp - prevMax;
    updated.currentHp = Math.max(1, Math.min(updated.maxHp, state.character.currentHp + Math.max(0, hpDiff)));
    state.character = updated;
    saveState();
    renderCharacterSheet();
    charDialog.close();
    appendLogEntry({
      type: 'system',
      title: '📜 Character Updated',
      body: `${updated.name} (Level ${updated.level}, ${updated.maxHp} Max HP) is ready.`,
    });
  });

  // --- Export / Import (JSON & TXT) ---
  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function safeFilename(name) {
    return (name || 'elf-game').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  document.getElementById('btn-export-char').addEventListener('click', () => {
    const name = safeFilename(state.character.name);
    downloadFile(`${name}-character.json`, JSON.stringify(state.character, null, 2), 'application/json');
  });

  document.getElementById('input-import-char').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data.abilities || typeof data.abilities.STR !== 'number') {
        throw new Error('Invalid character file');
      }
      state.character = { ...createDefaultCharacter(), ...data };
      saveState();
      renderCharacterSheet();
      ioDialog.close();
      appendLogEntry({
        type: 'system',
        title: '⬆️ Character Imported',
        body: `Loaded ${state.character.name} into the adventure.`,
      });
    } catch (_) {
      alert('Could not import character JSON. Please check that the file is valid.');
    }
    e.target.value = '';
  });

  document.getElementById('btn-export-adv').addEventListener('click', () => {
    const name = safeFilename(state.character.name);
    downloadFile(`${name}-adventure.json`, JSON.stringify(state, null, 2), 'application/json');
  });

  document.getElementById('input-import-adv').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data.character || !Array.isArray(data.log)) {
        throw new Error('Invalid adventure file');
      }
      state = data;
      saveState();
      renderAll();
      ioDialog.close();
    } catch (_) {
      alert('Could not import adventure JSON. Please check that the file is valid.');
    }
    e.target.value = '';
  });

  document.getElementById('btn-export-txt').addEventListener('click', () => {
    const lines = [
      `THE ELF GAME — SOLO ADVENTURE LOG`,
      `Character: ${state.character.name} (Level ${state.character.level})`,
      `Exported: ${new Date().toLocaleString()}`,
      `==================================================`,
      '',
    ];
    for (const entry of state.log) {
      const status = entry.type === 'check' ? ` [${entry.success ? 'SUCCESS' : 'FAILURE'}]` : '';
      lines.push(`[${formatTime(entry.timestamp)}] ${entry.title}${status}`);
      if (entry.body) lines.push(entry.body);
      if (entry.steps) lines.push(`  Math: ${entry.steps.join(' | ')}`);
      if (entry.explain) lines.push(`  Why: ${entry.explain}`);
      lines.push('');
    }
    const name = safeFilename(state.character.name);
    downloadFile(`${name}-adventure-log.txt`, lines.join('\n'), 'text/plain;charset=utf-8');
  });

  document.getElementById('btn-clear-log').addEventListener('click', () => {
    if (!confirm('Clear the entire adventure log and start a fresh log?')) return;
    state.log = createWelcomeLog();
    saveState();
    renderLog();
    ioDialog.close();
  });

  // --- Theme Toggle ---
  const themeBtn = document.getElementById('btn-theme-toggle');
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');

  themeBtn.addEventListener('click', () => {
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const current = metaColorScheme.content === 'dark' ? 'dark'
      : metaColorScheme.content === 'light' ? 'light'
      : (sysDark ? 'dark' : 'light');
    const target = current === 'dark' ? 'light' : 'dark';
    const sysCurrent = sysDark ? 'dark' : 'light';

    if (target === sysCurrent) {
      try { localStorage.removeItem(THEME_STORAGE_KEY); } catch (_) {}
      metaColorScheme.content = 'light dark';
    } else {
      try { localStorage.setItem(THEME_STORAGE_KEY, target); } catch (_) {}
      metaColorScheme.content = target;
    }
  });

  window.addEventListener('storage', (e) => {
    if (e.key === THEME_STORAGE_KEY) {
      metaColorScheme.content = e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : 'light dark';
    }
  });

  renderAll();
})();
