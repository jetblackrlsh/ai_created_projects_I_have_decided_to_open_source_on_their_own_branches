(function () {
  'use strict';

  const STORAGE_KEY = 'roll-for-shoes-sandbox-v3';
  const RFS = window.RFS;

  const DIE_PIPS = {
    1: [[18, 18]],
    2: [[10, 10], [26, 26]],
    3: [[10, 10], [18, 18], [26, 26]],
    4: [[10, 10], [26, 10], [10, 26], [26, 26]],
    5: [[10, 10], [26, 10], [18, 18], [10, 26], [26, 26]],
    6: [[10, 9], [26, 9], [10, 18], [26, 18], [10, 27], [26, 27]]
  };

  let state = loadState();
  let selectedSkillId = state.character.skills[0]?.id || 'do-anything';
  let manualSkillOverride = false;
  let lastRoll = state.lastRoll || null;
  let pendingAdvancement = null;
  let pendingStartingSkills = [];

  const el = {
    btnNewSandbox: document.getElementById('btn-new-sandbox'),
    btnJsonIo: document.getElementById('btn-json-io'),
    btnRules: document.getElementById('btn-rules'),

    charXp: document.getElementById('char-xp'),
    charNameInput: document.getElementById('char-name-input'),
    statRolls: document.getElementById('stat-rolls'),
    statWins: document.getElementById('stat-wins'),
    statSkills: document.getElementById('stat-skills'),
    skillsList: document.getElementById('skills-list'),
    btnToggleAddSkill: document.getElementById('btn-toggle-add-skill'),
    addSkillForm: document.getElementById('add-skill-form'),
    customSkillName: document.getElementById('custom-skill-name'),
    customSkillLevel: document.getElementById('custom-skill-level'),
    statusForm: document.getElementById('status-form'),
    statusInput: document.getElementById('status-input'),
    statusesList: document.getElementById('statuses-list'),

    oracleForm: document.getElementById('oracle-form'),
    oracleQuestion: document.getElementById('oracle-question'),
    oracleResult: document.getElementById('oracle-result'),
    btnSparkPrompt: document.getElementById('btn-spark-prompt'),
    btnSparkTwist: document.getElementById('btn-spark-twist'),
    btnSparkNpc: document.getElementById('btn-spark-npc'),

    adventureGenre: document.getElementById('adventure-genre'),
    adventureTitle: document.getElementById('adventure-title'),
    tensionPips: document.getElementById('tension-pips'),
    btnTensionDown: document.getElementById('btn-tension-down'),
    btnTensionUp: document.getElementById('btn-tension-up'),
    storyLog: document.getElementById('story-log'),

    diceTray: document.getElementById('dice-tray'),
    trayPlayerLabel: document.getElementById('tray-player-label'),
    trayPlayerSum: document.getElementById('tray-player-sum'),
    playerDiceRow: document.getElementById('player-dice-row'),
    trayGmLabel: document.getElementById('tray-gm-label'),
    trayGmSum: document.getElementById('tray-gm-sum'),
    gmDiceRow: document.getElementById('gm-dice-row'),
    trayOutcomeBar: document.getElementById('tray-outcome-bar'),
    xpAdvanceBar: document.getElementById('xp-advance-bar'),
    xpAdvanceHint: document.getElementById('xp-advance-hint'),
    btnSpendAllXp: document.getElementById('btn-spend-all-xp'),

    actionForm: document.getElementById('action-form'),
    selectedSkillBadge: document.getElementById('selected-skill-badge'),
    matchHint: document.getElementById('match-hint'),
    oppOverride: document.getElementById('opp-override'),
    staticTargetCheck: document.getElementById('static-target-check'),
    actionInput: document.getElementById('action-input'),
    btnAddNote: document.getElementById('btn-add-note'),

    dialogRules: document.getElementById('dialog-rules'),
    dialogNewSkill: document.getElementById('dialog-new-skill'),
    newSkillForm: document.getElementById('new-skill-form'),
    nsParentSkill: document.getElementById('ns-parent-skill'),
    nsNewLevel: document.getElementById('ns-new-level'),
    newSkillName: document.getElementById('new-skill-name'),

    dialogNewSandbox: document.getElementById('dialog-new-sandbox'),
    newSandboxForm: document.getElementById('new-sandbox-form'),
    customTitleInput: document.getElementById('custom-title-input'),
    customGenreInput: document.getElementById('custom-genre-input'),
    customOpeningInput: document.getElementById('custom-opening-input'),
    keepCharacterCheck: document.getElementById('keep-character-check'),
    startingSkillsSection: document.getElementById('starting-skills-section'),
    ssNameInput: document.getElementById('ss-name-input'),
    ssLevelInput: document.getElementById('ss-level-input'),
    btnAddStartingSkill: document.getElementById('btn-add-starting-skill'),
    startingSkillsList: document.getElementById('starting-skills-list'),
    btnCancelNewAdv: document.getElementById('btn-cancel-new-adv'),

    dialogJsonIo: document.getElementById('dialog-json-io'),
    btnExportStoryMd: document.getElementById('btn-export-story-md'),
    btnCopyStoryMd: document.getElementById('btn-copy-story-md'),
    exportStatus: document.getElementById('export-status'),
    btnExportCharacter: document.getElementById('btn-export-character'),
    btnExportAdventure: document.getElementById('btn-export-adventure'),
    importFileInput: document.getElementById('import-file-input'),
    importJsonText: document.getElementById('import-json-text'),
    importStatus: document.getElementById('import-status'),
    btnImportPaste: document.getElementById('btn-import-paste')
  };

  function createDieSvg(value) {
    const pips = DIE_PIPS[value] || DIE_PIPS[1];
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 36 36');
    svg.setAttribute('aria-hidden', 'true');

    for (const [cx, cy] of pips) {
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', String(cx));
      circle.setAttribute('cy', String(cy));
      circle.setAttribute('r', '3.3');
      circle.setAttribute('fill', 'currentColor');
      svg.appendChild(circle);
    }
    return svg;
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.character && parsed.adventure) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return {
      character: RFS.createFreshCharacter('Unnamed Adventurer'),
      adventure: RFS.createSandboxState('', '', '')
    };
  }

  function saveState() {
    try {
      state.lastRoll = lastRoll;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }

  function getSelectedSkill() {
    return state.character.skills.find((s) => s.id === selectedSkillId) || state.character.skills[0];
  }

  function renderAll() {
    renderCharacter();
    renderAdventureHeader();
    renderStoryLog();
    renderSelectedSkillBadge();
    renderDiceTray();
  }

  function renderCharacter() {
    el.charXp.textContent = String(state.character.xp);
    if (document.activeElement !== el.charNameInput) {
      el.charNameInput.value = state.character.name;
    }
    el.statRolls.textContent = String(state.character.stats.rolls);
    el.statWins.textContent = String(state.character.stats.wins);
    el.statSkills.textContent = String(state.character.skills.length);

    if (!Array.isArray(state.character.statuses)) {
      state.character.statuses = [];
    }
    el.statusesList.innerHTML = '';
    state.character.statuses.forEach((statusText, idx) => {
      const li = document.createElement('li');
      li.className = 'status-chip';

      const textSpan = document.createElement('span');
      textSpan.textContent = statusText;
      li.appendChild(textSpan);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'status-remove-btn';
      removeBtn.setAttribute('aria-label', `Remove status ${statusText}`);
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        state.character.statuses.splice(idx, 1);
        saveState();
        renderCharacter();
      });
      li.appendChild(removeBtn);

      el.statusesList.appendChild(li);
    });

    el.skillsList.innerHTML = '';
    const byId = new Map(state.character.skills.map((s) => [s.id, s]));

    for (const skill of state.character.skills) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skill-btn' + (skill.id === selectedSkillId ? ' is-selected' : '');
      btn.setAttribute('aria-pressed', skill.id === selectedSkillId ? 'true' : 'false');

      const meta = document.createElement('span');
      meta.className = 'skill-meta';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'skill-name';
      nameSpan.textContent = skill.name;
      meta.appendChild(nameSpan);

      if (skill.parentId && byId.has(skill.parentId)) {
        const parentSpan = document.createElement('span');
        parentSpan.className = 'skill-parent';
        parentSpan.textContent = `↳ from ${byId.get(skill.parentId).name}`;
        meta.appendChild(parentSpan);
      }

      const levelPill = document.createElement('span');
      levelPill.className = 'skill-level-pill';
      levelPill.textContent = `${skill.level}d6`;

      btn.appendChild(meta);
      btn.appendChild(levelPill);

      btn.addEventListener('click', () => {
        selectedSkillId = skill.id;
        manualSkillOverride = true;
        el.matchHint.textContent = 'Manual';
        renderCharacter();
        renderSelectedSkillBadge();
      });

      li.appendChild(btn);
      el.skillsList.appendChild(li);
    }
  }

  function renderSelectedSkillBadge() {
    const skill = getSelectedSkill();
    if (!skill) return;
    el.selectedSkillBadge.textContent = `${skill.name} ${skill.level}`;
  }

  function renderAdventureHeader() {
    el.adventureGenre.textContent = state.adventure.genre;
    el.adventureTitle.textContent = state.adventure.title;

    el.tensionPips.innerHTML = '';
    for (let i = 1; i <= 5; i += 1) {
      const pip = document.createElement('span');
      pip.className = 'pip' + (i <= state.adventure.tension ? ' is-active' : '');
      el.tensionPips.appendChild(pip);
    }
  }

  function renderStoryLog() {
    el.storyLog.innerHTML = '';
    if (!state.adventure.log.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-chronicle';
      empty.innerHTML =
        '<strong>Blank Sandbox</strong><br>Write your own starter hook below and click <strong>Add Note</strong>, or jump straight into your first action and <strong>Roll D6s</strong>. Use the <strong>Solo Oracle</strong> anytime for fate, sparks, twists, or NPCs.';
      el.storyLog.appendChild(empty);
      return;
    }
    for (const entry of state.adventure.log) {
      const article = document.createElement('article');
      article.className = `log-entry is-${entry.speaker}`;

      const header = document.createElement('div');
      header.className = 'log-header';
      const speakerSpan = document.createElement('span');
      speakerSpan.textContent = entry.label;
      header.appendChild(speakerSpan);
      article.appendChild(header);

      const body = document.createElement('p');
      body.className = 'log-body';
      body.textContent = entry.text;
      article.appendChild(body);

      if (entry.rollSummary) {
        const sumDiv = document.createElement('div');
        sumDiv.className = 'log-roll-summary';

        const pill = document.createElement('span');
        pill.className = 'outcome-pill ' + (entry.rollSummary.won ? 'is-win' : 'is-fail');
        pill.textContent = entry.rollSummary.won ? 'SUCCESS' : 'FAILED';
        sumDiv.appendChild(pill);

        const detail = document.createElement('span');
        const oppLabel = entry.rollSummary.isStatic
          ? `Target ${entry.rollSummary.gmSum}`
          : `GM [${entry.rollSummary.gmDice.join(', ')}] = ${entry.rollSummary.gmSum}`;
        detail.textContent = `${entry.rollSummary.skillName} (${entry.rollSummary.skillLevel}d6): [${entry.rollSummary.playerDice.join(', ')}] = ${entry.rollSummary.playerSum} vs ${oppLabel}`;
        sumDiv.appendChild(detail);

        article.appendChild(sumDiv);
      }

      el.storyLog.appendChild(article);
    }
    el.storyLog.scrollTop = el.storyLog.scrollHeight;
  }

  function renderDiceTray() {
    if (!lastRoll) {
      el.diceTray.hidden = true;
      return;
    }

    el.diceTray.hidden = false;
    el.trayPlayerLabel.textContent = `${lastRoll.skill.name} (${lastRoll.skill.level}d6)`;
    el.trayPlayerSum.textContent = String(lastRoll.playerSum);
    el.trayGmLabel.textContent = `Opposition (${lastRoll.opp.reason})`;
    el.trayGmSum.textContent = String(lastRoll.gmSum);

    const nonSixCount = lastRoll.playerDice.filter((d, i) => d !== 6 && !lastRoll.flippedIndices.includes(i)).length;
    const canAffordAdvancement = state.character.xp >= nonSixCount;

    el.playerDiceRow.innerHTML = '';
    lastRoll.playerDice.forEach((val, idx) => {
      const isFlipped = lastRoll.flippedIndices.includes(idx);
      const effectiveVal = isFlipped ? 6 : val;
      const canFlip = !lastRoll.advanced && effectiveVal !== 6 && canAffordAdvancement;

      const chip = document.createElement(canFlip ? 'button' : 'span');
      if (canFlip) {
        chip.type = 'button';
        chip.title = 'Spend 1 XP to turn this die into a 6 for advancement';
        chip.setAttribute('aria-label', `Die ${effectiveVal}, click to spend 1 XP to flip to 6`);
        chip.addEventListener('click', () => flipSingleDieWithXp(idx));
      } else {
        chip.setAttribute('aria-label', `Die ${effectiveVal}`);
      }
      chip.className = 'die-chip is-rolling' +
        (effectiveVal === 6 ? ' is-six' : '') +
        (isFlipped ? ' is-xp-flipped' : '') +
        (canFlip ? ' is-clickable' : '');
      chip.appendChild(createDieSvg(effectiveVal));
      el.playerDiceRow.appendChild(chip);
    });

    el.gmDiceRow.innerHTML = '';
    if (lastRoll.opp.isStatic) {
      const staticPill = document.createElement('span');
      staticPill.className = 'static-target-pill';
      staticPill.textContent = `Static Target: ${lastRoll.gmSum}`;
      el.gmDiceRow.appendChild(staticPill);
    } else {
      for (const val of lastRoll.gmDice) {
        const chip = document.createElement('span');
        chip.className = 'die-chip is-rolling' + (val === 6 ? ' is-six' : '');
        chip.setAttribute('aria-label', `Opposition die ${val}`);
        chip.appendChild(createDieSvg(val));
        el.gmDiceRow.appendChild(chip);
      }
    }

    if (lastRoll.won) {
      el.trayOutcomeBar.textContent = `Success! ${lastRoll.playerSum} beats ${lastRoll.gmSum}.`;
      el.trayOutcomeBar.style.color = 'var(--success)';
    } else {
      el.trayOutcomeBar.textContent = `Failed (${lastRoll.playerSum} vs ${lastRoll.gmSum}) — you gained +1 XP.`;
      el.trayOutcomeBar.style.color = 'var(--danger)';
    }

    if (!lastRoll.advanced && nonSixCount > 0 && state.character.xp > 0) {
      el.xpAdvanceBar.hidden = false;
      if (canAffordAdvancement) {
        el.xpAdvanceHint.textContent = `Spend ${nonSixCount} XP to flip ${nonSixCount === 1 ? 'that die' : 'all remaining dice'} to 6s for advancement (Rule 6)?`;
        el.btnSpendAllXp.hidden = false;
        el.btnSpendAllXp.textContent = `Spend ${nonSixCount} XP → Unlock Skill`;
      } else {
        el.xpAdvanceHint.textContent = `Cannot advance this roll yet: need ${nonSixCount} XP to flip all non-6 dice (you have ${state.character.xp} XP).`;
        el.btnSpendAllXp.hidden = true;
      }
    } else {
      el.xpAdvanceBar.hidden = true;
    }
  }

  function flipSingleDieWithXp(idx) {
    if (!lastRoll || lastRoll.advanced || state.character.xp <= 0) return;
    if (lastRoll.playerDice[idx] === 6 || lastRoll.flippedIndices.includes(idx)) return;

    state.character.xp -= 1;
    lastRoll.flippedIndices.push(idx);
    checkXpAdvancementComplete();
    saveState();
    renderCharacter();
    renderDiceTray();
  }

  function flipAllDiceWithXp() {
    if (!lastRoll || lastRoll.advanced) return;
    const needed = [];
    lastRoll.playerDice.forEach((d, i) => {
      if (d !== 6 && !lastRoll.flippedIndices.includes(i)) needed.push(i);
    });
    if (!needed.length || state.character.xp < needed.length) return;

    state.character.xp -= needed.length;
    lastRoll.flippedIndices.push(...needed);
    checkXpAdvancementComplete();
    saveState();
    renderCharacter();
    renderDiceTray();
  }

  function checkXpAdvancementComplete() {
    if (!lastRoll) return;
    const allSixNow = lastRoll.playerDice.every((d, i) => d === 6 || lastRoll.flippedIndices.includes(i));
    if (allSixNow) {
      lastRoll.advanced = true;
      openNewSkillDialog(lastRoll.skill, lastRoll.actionText);
    }
  }

  function openNewSkillDialog(parentSkill, actionText) {
    pendingAdvancement = { parentSkill, actionText };
    el.nsParentSkill.textContent = `${parentSkill.name} ${parentSkill.level}`;
    el.nsNewLevel.textContent = String(parentSkill.level + 1);
    el.newSkillName.value = RFS.suggestSkillName(actionText);
    el.dialogNewSkill.showModal();
    el.newSkillName.select();
  }

  function appendLog(entry) {
    state.adventure.log.push({
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      ...entry
    });
    if (state.adventure.log.length > 200) {
      state.adventure.log = state.adventure.log.slice(-200);
    }
  }

  // Tension Controls
  el.btnTensionDown.addEventListener('click', () => {
    state.adventure.tension = Math.max(1, state.adventure.tension - 1);
    saveState();
    renderAdventureHeader();
  });

  el.btnTensionUp.addEventListener('click', () => {
    state.adventure.tension = Math.min(5, state.adventure.tension + 1);
    saveState();
    renderAdventureHeader();
  });

  el.btnToggleAddSkill.addEventListener('click', () => {
    const isHidden = el.addSkillForm.hidden;
    el.addSkillForm.hidden = !isHidden;
    el.btnToggleAddSkill.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    if (isHidden) el.customSkillName.focus();
  });

  el.addSkillForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.customSkillName.value.trim();
    const level = Math.max(1, Math.min(20, Math.floor(Number(el.customSkillLevel.value) || 1)));
    if (!name) return;

    state.character.skills.push({
      id: 'skill-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name: name.slice(0, 48),
      level,
      parentId: null
    });
    el.customSkillName.value = '';
    el.customSkillLevel.value = '2';
    el.addSkillForm.hidden = true;
    el.btnToggleAddSkill.setAttribute('aria-expanded', 'false');
    saveState();
    renderAll();
  });

  el.statusForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = el.statusInput.value.trim();
    if (!raw) return;
    if (!Array.isArray(state.character.statuses)) {
      state.character.statuses = [];
    }
    const exists = state.character.statuses.some((s) => s.toLowerCase() === raw.toLowerCase());
    if (!exists) {
      state.character.statuses.push(raw.slice(0, 36));
      saveState();
      renderCharacter();
    }
    el.statusInput.value = '';
  });

  // Character Name
  el.charNameInput.addEventListener('input', () => {
    state.character.name = el.charNameInput.value.trim() || 'Unnamed Adventurer';
    saveState();
  });

  // Free-text Action & Auto Skill Match
  el.actionInput.addEventListener('input', () => {
    if (manualSkillOverride) return;
    const matched = RFS.matchBestSkill(el.actionInput.value, state.character.skills);
    if (matched && matched.id !== selectedSkillId) {
      selectedSkillId = matched.id;
      el.matchHint.textContent = matched.id === 'do-anything' ? 'Defaulting to Do Anything 1' : `Matched: ${matched.name}`;
      renderCharacter();
      renderSelectedSkillBadge();
    }
  });

  el.actionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      el.actionForm.requestSubmit();
    }
  });

  el.actionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const actionText = el.actionInput.value.trim();
    if (!actionText) return;

    const skill = getSelectedSkill();
    const result = RFS.resolveTurn(
      state,
      actionText,
      skill,
      el.oppOverride.value,
      el.staticTargetCheck.checked
    );

    state.character.stats.rolls += 1;
    if (result.won) {
      state.character.stats.wins += 1;
    } else {
      state.character.xp += 1;
    }
    state.adventure.tension = result.nextTension;

    appendLog({
      speaker: 'player',
      label: state.character.name,
      text: actionText,
      rollSummary: {
        skillName: skill.name,
        skillLevel: skill.level,
        playerDice: result.playerDice,
        playerSum: result.playerSum,
        gmDice: result.gmDice,
        gmSum: result.gmSum,
        isStatic: result.opp.isStatic,
        won: result.won
      }
    });

    appendLog({
      speaker: 'gm',
      label: 'Solo GM',
      text: result.narrative,
      rollSummary: null
    });

    lastRoll = {
      skill,
      actionText,
      opp: result.opp,
      playerDice: result.playerDice,
      gmDice: result.gmDice,
      playerSum: result.playerSum,
      gmSum: result.gmSum,
      won: result.won,
      flippedIndices: [],
      advanced: result.allSixes
    };

    el.actionInput.value = '';
    manualSkillOverride = false;
    el.matchHint.textContent = 'Auto-matched';
    selectedSkillId = state.character.skills[0]?.id || 'do-anything';

    saveState();
    renderAll();

    if (result.allSixes) {
      openNewSkillDialog(skill, actionText);
    }
  });

  el.btnAddNote.addEventListener('click', () => {
    const noteText = el.actionInput.value.trim();
    if (!noteText) {
      el.actionInput.focus();
      return;
    }
    const isFirst = state.adventure.log.length === 0;
    appendLog({
      speaker: 'gm',
      label: isFirst ? 'Starter Hook' : 'Scene Note',
      text: noteText,
      rollSummary: null
    });
    el.actionInput.value = '';
    saveState();
    renderStoryLog();
    el.actionInput.focus();
  });

  el.btnSpendAllXp.addEventListener('click', flipAllDiceWithXp);

  el.newSkillForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!pendingAdvancement) return;

    const rawName = el.newSkillName.value.trim();
    if (rawName.length < 2) return;

    const newSkill = {
      id: 'skill-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name: rawName.slice(0, 48),
      level: pendingAdvancement.parentSkill.level + 1,
      parentId: pendingAdvancement.parentSkill.id
    };

    state.character.skills.push(newSkill);
    appendLog({
      speaker: 'system',
      label: 'Skill Unlocked',
      text: `Gained new skill: ${newSkill.name} ${newSkill.level} (evolved from ${pendingAdvancement.parentSkill.name} ${pendingAdvancement.parentSkill.level}).`,
      rollSummary: null
    });

    pendingAdvancement = null;
    el.dialogNewSkill.close('added');
    saveState();
    renderAll();
    el.actionInput.focus();
  });

  // Solo Oracle
  el.oracleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = el.oracleQuestion.value.trim();
    if (!q) return;
    const odds = el.oracleForm.querySelector('input[name="odds"]:checked')?.value || 'even';
    const ans = RFS.askOracle(q, odds);
    el.oracleResult.textContent = `[d6=${ans.roll}] ${ans.label} — ${ans.detail}`;
    appendLog({
      speaker: 'oracle',
      label: `Oracle (${odds})`,
      text: `Q: "${ans.question}" → ${ans.label} — ${ans.detail}`,
      rollSummary: null
    });
    el.oracleQuestion.value = '';
    saveState();
    renderStoryLog();
  });

  el.btnSparkPrompt.addEventListener('click', () => {
    const spark = RFS.rollSpark();
    el.oracleResult.textContent = `Spark: ${spark}`;
    appendLog({
      speaker: 'oracle',
      label: 'Oracle Spark',
      text: `Inspiration Spark: ${spark}`,
      rollSummary: null
    });
    saveState();
    renderStoryLog();
  });

  el.btnSparkTwist.addEventListener('click', () => {
    const twist = RFS.rollTwist();
    el.oracleResult.textContent = twist;
    appendLog({
      speaker: 'oracle',
      label: 'Oracle Twist',
      text: twist,
      rollSummary: null
    });
    saveState();
    renderStoryLog();
  });

  el.btnSparkNpc.addEventListener('click', () => {
    const npc = RFS.rollNpc();
    el.oracleResult.textContent = npc;
    appendLog({
      speaker: 'oracle',
      label: 'Oracle NPC',
      text: npc,
      rollSummary: null
    });
    saveState();
    renderStoryLog();
  });

  // Rules Dialog
  el.btnRules.addEventListener('click', () => {
    el.dialogRules.showModal();
  });

  function renderStartingSkillsList() {
    el.startingSkillsList.innerHTML = '';
    pendingStartingSkills.forEach((sk, idx) => {
      const li = document.createElement('li');
      li.className = 'status-chip';

      const textSpan = document.createElement('span');
      textSpan.textContent = `${sk.name} (${sk.level}d6)`;
      li.appendChild(textSpan);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'status-remove-btn';
      removeBtn.setAttribute('aria-label', `Remove starting skill ${sk.name}`);
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        pendingStartingSkills.splice(idx, 1);
        renderStartingSkillsList();
      });
      li.appendChild(removeBtn);

      el.startingSkillsList.appendChild(li);
    });
  }

  function addPendingStartingSkill() {
    const name = el.ssNameInput.value.trim();
    const level = Math.max(1, Math.min(20, Math.floor(Number(el.ssLevelInput.value) || 1)));
    if (!name) {
      el.ssNameInput.focus();
      return;
    }
    pendingStartingSkills.push({ name: name.slice(0, 48), level });
    el.ssNameInput.value = '';
    el.ssLevelInput.value = '2';
    renderStartingSkillsList();
    el.ssNameInput.focus();
  }

  el.btnAddStartingSkill.addEventListener('click', addPendingStartingSkill);

  el.ssNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      addPendingStartingSkill();
    }
  });

  el.keepCharacterCheck.addEventListener('change', () => {
    el.startingSkillsSection.hidden = el.keepCharacterCheck.checked;
  });

  // New Sandbox Dialog
  el.btnNewSandbox.addEventListener('click', () => {
    el.customTitleInput.value = '';
    el.customGenreInput.value = '';
    el.customOpeningInput.value = '';
    el.keepCharacterCheck.checked = false;
    el.startingSkillsSection.hidden = false;
    pendingStartingSkills = [];
    el.ssNameInput.value = '';
    el.ssLevelInput.value = '2';
    renderStartingSkillsList();
    el.dialogNewSandbox.showModal();
  });

  el.btnCancelNewAdv.addEventListener('click', () => {
    el.dialogNewSandbox.close('cancel');
  });

  el.newSandboxForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const keepChar = el.keepCharacterCheck.checked;

    if (!keepChar) {
      state.character = RFS.createFreshCharacter(state.character.name, pendingStartingSkills);
    }

    state.adventure = RFS.createSandboxState(
      el.customTitleInput.value,
      el.customGenreInput.value,
      el.customOpeningInput.value
    );

    lastRoll = null;
    selectedSkillId = state.character.skills[0]?.id || 'do-anything';
    manualSkillOverride = false;

    el.dialogNewSandbox.close('started');
    saveState();
    renderAll();
  });

  // JSON Export / Import
  function downloadJSON(filename, content) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function slugify(str) {
    return (str || 'save').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'save';
  }

  el.btnJsonIo.addEventListener('click', () => {
    el.exportStatus.textContent = '';
    el.exportStatus.className = 'import-status';
    el.importStatus.textContent = '';
    el.importStatus.className = 'import-status';
    el.importJsonText.value = '';
    el.importFileInput.value = '';
    el.dialogJsonIo.showModal();
  });

  el.btnExportStoryMd.addEventListener('click', () => {
    const md = RFS.exportStoryLogMarkdown(state);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(state.adventure.title)}-story-log.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    el.exportStatus.textContent = 'Downloaded Story Log (.md).';
    el.exportStatus.className = 'import-status is-ok';
  });

  el.btnCopyStoryMd.addEventListener('click', async () => {
    const md = RFS.exportStoryLogMarkdown(state);
    try {
      await navigator.clipboard.writeText(md);
      el.exportStatus.textContent = 'Story Log copied to clipboard!';
      el.exportStatus.className = 'import-status is-ok';
    } catch {
      el.exportStatus.textContent = 'Clipboard unavailable—use Export Story Log (.md) instead.';
      el.exportStatus.className = 'import-status is-error';
    }
  });

  el.btnExportCharacter.addEventListener('click', () => {
    const json = RFS.exportCharacterJSON(state.character);
    downloadJSON(`${slugify(state.character.name)}-character.json`, json);
  });

  el.btnExportAdventure.addEventListener('click', () => {
    const json = RFS.exportAdventureJSON(state);
    downloadJSON(`${slugify(state.adventure.title)}-sandbox.json`, json);
  });

  function applyImportedJSON(jsonText) {
    try {
      const imported = RFS.parseImportJSON(jsonText);
      if (imported.kind === 'adventure') {
        state.character = imported.character;
        state.adventure = imported.adventure;
        lastRoll = null;
        el.importStatus.textContent = `Loaded sandbox "${state.adventure.title}" with ${state.character.name}.`;
      } else {
        state.character = imported.character;
        appendLog({
          speaker: 'system',
          label: 'Character Imported',
          text: `${state.character.name} joined the sandbox (${state.character.skills.length} skills, ${state.character.xp} XP).`,
          rollSummary: null
        });
        el.importStatus.textContent = `Imported character "${state.character.name}" (${state.character.skills.length} skills).`;
      }
      el.importStatus.className = 'import-status is-ok';
      selectedSkillId = state.character.skills[0]?.id || 'do-anything';
      manualSkillOverride = false;
      saveState();
      renderAll();
    } catch (err) {
      el.importStatus.textContent = err.message || 'Invalid JSON.';
      el.importStatus.className = 'import-status is-error';
    }
  }

  el.importFileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        applyImportedJSON(reader.result);
      }
    };
    reader.readAsText(file);
  });

  el.btnImportPaste.addEventListener('click', () => {
    const text = el.importJsonText.value.trim();
    if (!text) {
      el.importStatus.textContent = 'Paste some JSON first.';
      el.importStatus.className = 'import-status is-error';
      return;
    }
    applyImportedJSON(text);
  });

  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.addEventListener('close', () => {
      dialog.returnValue = '';
    });
  }

  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const outside = (e, dialog) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (e) => { pressedOutside = outside(e, dialog); });
      dialog.addEventListener('pointerup', (e) => { if (pressedOutside && outside(e, dialog)) dialog.close(); });
    }
  }

  renderAll();
})();
