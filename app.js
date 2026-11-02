// Lumenweave: The Unbound Accord - Main Game Controller, Difficulty Levels, Level Codes & Turn-Based Card Engine

(function () {
  "use strict";

  const DATA = window.LUMEN_DATA;
  const SAVE_KEY = "lumenweave_unbound_accord_save_v1";

  const FAIRY_CHAR_MAP = {"tavra": "T", "oru": "O", "veska": "V", "pella": "P", "iman": "I", "sile": "S", "nemi": "N"};
  const CHAR_FAIRY_MAP = {"T": "tavra", "O": "oru", "V": "veska", "P": "pella", "I": "iman", "S": "sile", "N": "nemi"};

  const DIFFICULTY_CONFIG = {
    easy: {
      id: "easy",
      codeChar: "E",
      label: "🌸 Easy",
      shortLabel: "Easy",
      bossHpMult: 0.75,
      bossDmgMult: 0.75,
      bossShieldMult: 0.75,
      fairyBonusHp: 10,
      startAccord: 25,
      bossRoundShield: 0,
      bossRoundHeal: 0,
      bossBonusDebuff: 0,
      desc: "-25% Boss HP & DMG • Fairies gain +10 Max HP & +25% Starting Accord"
    },
    medium: {
      id: "medium",
      codeChar: "M",
      label: "✨ Medium",
      shortLabel: "Medium",
      bossHpMult: 1.0,
      bossDmgMult: 1.0,
      bossShieldMult: 1.0,
      fairyBonusHp: 0,
      startAccord: 0,
      bossRoundShield: 0,
      bossRoundHeal: 0,
      bossBonusDebuff: 0,
      desc: "100% Standard Boss HP & Damage (Balanced)"
    },
    hard: {
      id: "hard",
      codeChar: "H",
      label: "🔥 Hard",
      shortLabel: "Hard",
      bossHpMult: 1.3,
      bossDmgMult: 1.25,
      bossShieldMult: 1.25,
      fairyBonusHp: 0,
      startAccord: 0,
      bossRoundShield: 4,
      bossRoundHeal: 0,
      bossBonusDebuff: 0,
      desc: "+30% Boss HP, +25% Boss DMG/Shield & Boss gains +4 Shield each round"
    },
    extreme: {
      id: "extreme",
      codeChar: "X",
      label: "💀 Extreme",
      shortLabel: "Extreme",
      bossHpMult: 1.65,
      bossDmgMult: 1.5,
      bossShieldMult: 1.5,
      fairyBonusHp: 0,
      startAccord: 0,
      bossRoundShield: 8,
      bossRoundHeal: 5,
      bossBonusDebuff: 1,
      desc: "+65% Boss HP, +50% Boss DMG/Shield, Boss gains +8 Shield & +5 HP/round +1 Debuff"
    }
  };

  const CHAR_DIFF_MAP = {
    E: "easy",
    M: "medium",
    H: "hard",
    X: "extreme"
  };

  const QUICK_CHAPTER_CODES = [
    { code: "TOLLWEAVER-LV1", level: 1, label: "Level 1: The Tollweaver (0 Upgrades)" },
    { code: "HUSH-LV2", level: 2, label: "Level 2: Archivist Hush (+1 Card Upgrade)" },
    { code: "CALDRUM-LV3", level: 3, label: "Level 3: Caldrum the Still (+2 Card Upgrades)" },
    { code: "VELIS-LV4", level: 4, label: "Level 4: Broker Velis (+3 Card Upgrades)" },
    { code: "MORROW-LV5", level: 5, label: "Level 5: The Morrow Engine (+4 Card Upgrades)" },
    { code: "AUREX-LV6", level: 6, label: "Level 6: Chancellor Aurex (+5 Upgrades)" },
    { code: "COVENANT-LV7", level: 7, label: "Level 7: The Crowned Covenant Finale (+6 Upgrades)" }
  ];

  // --- Modern Web Guidance: Fallback for <dialog closedby="any"> ---
  document.querySelectorAll("dialog[closedby='any']").forEach((dialog) => {
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      dialog.addEventListener("click", (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      });
    }
  });

  // --- Web Audio Magical Sound Synthesizer ---
  class SoundFX {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    }

    playTone(freq, duration = 0.16, type = "sine", gainVal = 0.08, delay = 0) {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch (_) {}
    }

    chime() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) =>
        this.playTone(f, 0.18, "triangle", 0.06, idx * 0.055)
      );
    }

    attack() {
      this.playTone(320, 0.12, "sawtooth", 0.08, 0);
      this.playTone(540, 0.18, "triangle", 0.08, 0.05);
      this.playTone(220, 0.2, "sine", 0.09, 0.09);
    }

    shield() {
      [440, 554.37, 659.25].forEach((f, idx) =>
        this.playTone(f, 0.22, "sine", 0.07, idx * 0.06)
      );
    }

    heal() {
      [587.33, 739.99, 880, 1174.66].forEach((f, idx) =>
        this.playTone(f, 0.2, "sine", 0.06, idx * 0.06)
      );
    }

    ultimate() {
      [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((f, idx) =>
        this.playTone(f, 0.26, "triangle", 0.08, idx * 0.06)
      );
    }

    villainHit() {
      this.playTone(190, 0.22, "sawtooth", 0.09, 0);
      this.playTone(135, 0.28, "sawtooth", 0.09, 0.08);
    }

    victory() {
      [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, idx) =>
        this.playTone(f, 0.25, "triangle", 0.08, idx * 0.1)
      );
    }
  }

  const sfx = new SoundFX();

  // --- Save Data Management ---
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          unlockedLevel: parsed.unlockedLevel || 1,
          clearedLevels: Array.isArray(parsed.clearedLevels) ? parsed.clearedLevels : [],
          upgradedCards: parsed.upgradedCards || {}
        };
      }
    } catch (_) {}
    return {
      unlockedLevel: 1,
      clearedLevels: [],
      upgradedCards: {}
    };
  }

  function writeSave(saveObj) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveObj));
    } catch (_) {}
    updateAllLevelCodeDisplays();
  }

  // --- Global Application State ---
  const state = {
    save: loadSave(),
    gameMode: "story", // 'story' | 'versus'
    teamMode: "solo", // 'solo' | 'coop'
    difficulty: "medium", // 'easy' | 'medium' | 'hard' | 'extreme'
    coopAiEnabled: false,
    versusUpgradePreset: "story", // 'story' | 'base' | 'attuned' | 'max'
    selectedFairies: ["tavra"],
    selectedVillainId: "tollweaver",

    // Grimoire Modal State
    grimoireFairyId: "tavra",
    grimoirePreviewUpgraded: false,

    // Cutscene State
    cutscenePhase: "pre", // 'pre' | 'post'
    cutsceneSlides: [],
    cutsceneIndex: 0,

    // Upgrade Screen Queue
    upgradeQueueFairyIds: [],
    currentUpgradeFairyId: null,

    // Active Battle State
    battle: null
  };

  function getDiffConfig() {
    return DIFFICULTY_CONFIG[state.difficulty] || DIFFICULTY_CONFIG.medium;
  }

  function calcBossMaxHp(baseHp) {
    const coopMult = state.teamMode === "coop" ? 1.55 : 1.0;
    const diffMult = getDiffConfig().bossHpMult;
    return Math.round(baseHp * coopMult * diffMult);
  }

  function scaleVillainMove(move, diff) {
    const scaled = { ...move };
    if (move.dmg) {
      scaled.dmg = Math.max(1, Math.round(move.dmg * diff.bossDmgMult));
    }
    if (move.shield) {
      scaled.shield = Math.max(1, Math.round(move.shield * diff.bossShieldMult));
    }
    if (move.heal) {
      scaled.heal = Math.max(1, Math.round(move.heal * diff.bossDmgMult));
    }
    if (move.burn) {
      scaled.burn = Math.max(1, Math.round(move.burn * diff.bossDmgMult)) + diff.bossBonusDebuff;
    }
    if (move.weaken) {
      scaled.weaken = move.weaken + diff.bossBonusDebuff;
    }

    // Build accurate description reflecting scaled numbers & parenthetical mechanic explanations
    const parts = [];
    if (scaled.dmg) {
      parts.push(
        `Deals ${scaled.dmg} DMG${scaled.targetAll ? " to all Waykeepers fairies" : ""}`
      );
    }
    if (scaled.shield) {
      parts.push(`gains ${scaled.shield} Shield (blocks ${scaled.shield} incoming DMG)`);
    }
    if (scaled.heal) {
      parts.push(`heals Boss for ${scaled.heal} HP`);
    }
    if (scaled.burn) {
      parts.push(`deals +${scaled.burn} extra Burn DMG`);
    }
    if (scaled.weaken) {
      parts.push(
        `inflicts ${scaled.weaken} Weaken (-${scaled.weaken * 2} fairy Attack DMG)`
      );
    }
    if (scaled.entangle) {
      parts.push(`reduces fairy Inspire by 1 (-1 bonus Attack DMG)`);
    }
    scaled.desc = parts.join(", ") + ".";
    return scaled;
  }

  // --- Story Mode Level Code Encoder & Decoder ---
  function generateLevelCode() {
    const lvl = Math.max(1, Math.min(7, state.save.unlockedLevel || 1));
    const diffChar = getDiffConfig().codeChar;
    const modeChar = state.teamMode === "coop" ? "C" : "S";
    const fairyChars = state.selectedFairies
      .slice(0, state.teamMode === "coop" ? 2 : 1)
      .map((fid) => FAIRY_CHAR_MAP[fid] || "B")
      .join("");

    const hexBytes = DATA.fairies.map((f) => {
      let mask = 0;
      f.deck.forEach((c, idx) => {
        if (state.save.upgradedCards[c.id]) {
          mask |= 1 << idx;
        }
      });
      return mask.toString(16).toUpperCase().padStart(2, "0");
    });

    while (hexBytes.length > 1 && hexBytes[hexBytes.length - 1] === "00") {
      hexBytes.pop();
    }

    return `LUMEN-L${lvl}${diffChar}-${modeChar}${fairyChars}-${hexBytes.join("")}`;
  }

  function applyLevelCode(rawInput) {
    if (!rawInput || typeof rawInput !== "string") {
      return { ok: false, msg: "Please enter a valid Level Code." };
    }
    const clean = rawInput.trim().toUpperCase();

    // 1. Check Quick Chapter Passwords
    const quickMatch = QUICK_CHAPTER_CODES.find((q) => q.code === clean);
    if (quickMatch) {
      const targetLvl = quickMatch.level;
      const cleared = [];
      for (let i = 1; i < targetLvl; i++) cleared.push(i);
      const upgraded = {};
      const upgradeCount = Math.max(0, targetLvl - 1);
      state.selectedFairies.forEach((fid) => {
        const f = getFairyDef(fid);
        f.deck.slice(0, upgradeCount).forEach((c) => {
          upgraded[c.id] = true;
        });
      });

      state.save = {
        unlockedLevel: targetLvl,
        clearedLevels: cleared,
        upgradedCards: upgraded
      };
      state.gameMode = "story";
      const v = DATA.villains.find((vil) => vil.level === targetLvl) || DATA.villains[0];
      state.selectedVillainId = v.id;
      writeSave(state.save);
      syncMainMenuUI();
      return {
        ok: true,
        msg: `Loaded ${quickMatch.code}! Unlocked Story Level ${targetLvl} (${v.name}) with ${upgradeCount} upgraded spell card(s) per selected fairy.`
      };
    }

    // 2. Parse Full State Code: LUMEN-L<1..7>[E/M/H/X]-<S/C><Fairies>-<Hex>
    const match = clean.match(/^LUMEN-L([1-7])([EMHX]?)-([SC])([TOVPISN]{1,2})-([0-9A-F]{2,14})$/);
    if (!match) {
      return {
        ok: false,
        msg: "Invalid Level Code format. Try a code like LUMEN-L3M-ST-03 or a chapter password like CALDRUM-LV3."
      };
    }

    const lvl = parseInt(match[1], 10);
    const diffChar = match[2];
    const modeChar = match[3];
    const fChars = match[4];
    const hexStr = match[5];

    if (diffChar && CHAR_DIFF_MAP[diffChar]) {
      state.difficulty = CHAR_DIFF_MAP[diffChar];
    }
    state.teamMode = modeChar === "C" ? "coop" : "solo";
    const parsedFairies = fChars
      .split("")
      .map((ch) => CHAR_FAIRY_MAP[ch])
      .filter(Boolean);
    if (parsedFairies.length > 0) {
      state.selectedFairies = parsedFairies;
    }

    const cleared = [];
    for (let i = 1; i < lvl; i++) cleared.push(i);

    const upgraded = {};
    for (let fIdx = 0; fIdx < DATA.fairies.length; fIdx++) {
      const byteHex = hexStr.slice(fIdx * 2, fIdx * 2 + 2);
      if (!byteHex) break;
      const mask = parseInt(byteHex, 16);
      if (!isNaN(mask)) {
        const fairy = DATA.fairies[fIdx];
        fairy.deck.forEach((c, cIdx) => {
          if (mask & (1 << cIdx)) {
            upgraded[c.id] = true;
          }
        });
      }
    }

    state.save = {
      unlockedLevel: lvl,
      clearedLevels: cleared,
      upgradedCards: upgraded
    };
    state.gameMode = "story";
    const targetVillain = DATA.villains.find((vil) => vil.level === lvl) || DATA.villains[0];
    state.selectedVillainId = targetVillain.id;

    writeSave(state.save);
    syncMainMenuUI();

    const totalUpgrades = Object.keys(upgraded).length;
    return {
      ok: true,
      msg: `Restored Story Level ${lvl} (${targetVillain.name}), ${getDiffConfig().shortLabel} difficulty, ${
        state.teamMode === "coop" ? "Co-op" : "Solo"
      } team, and ${totalUpgrades} upgraded spell card(s)!`
    };
  }

  function updateAllLevelCodeDisplays() {
    const code = generateLevelCode();
    const menuEl = document.getElementById("menu-current-level-code");
    if (menuEl) menuEl.textContent = code;
    const upgEl = document.getElementById("upgrade-current-level-code");
    if (upgEl) upgEl.textContent = code;
    const modalEl = document.getElementById("modal-current-level-code");
    if (modalEl) modalEl.textContent = code;
  }

  function copyCurrentLevelCode(buttonEl) {
    const code = generateLevelCode();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    sfx.chime();
    if (buttonEl) {
      const orig = buttonEl.textContent;
      buttonEl.textContent = "✓ Copied!";
      setTimeout(() => {
        buttonEl.textContent = orig;
      }, 1400);
    }
  }

  function openLevelCodeModal() {
    updateAllLevelCodeDisplays();
    const gridEl = document.getElementById("quick-chapter-codes-grid");
    if (gridEl) {
      gridEl.innerHTML = QUICK_CHAPTER_CODES.map(
        (q) => `
          <button type="button" class="btn btn-sm" data-quick-code="${q.code}" style="justify-content: flex-start; text-align: left; border-radius: 10px; padding: 8px 12px;">
            <div>
              <div style="color: var(--gold-light); font-family: monospace; font-size: 0.85rem;">${q.code}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500;">${q.label}</div>
            </div>
          </button>
        `
      ).join("");

      gridEl.querySelectorAll("[data-quick-code]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const c = btn.getAttribute("data-quick-code");
          document.getElementById("input-level-code").value = c;
          handleApplyCodeInput();
        });
      });
    }

    const fb = document.getElementById("level-code-feedback");
    if (fb) fb.textContent = "";
    const dialog = document.getElementById("level-code-dialog");
    if (!dialog.open) dialog.showModal();
  }

  function handleApplyCodeInput() {
    const input = document.getElementById("input-level-code");
    const fb = document.getElementById("level-code-feedback");
    const res = applyLevelCode(input ? input.value : "");
    if (fb) {
      fb.style.color = res.ok ? "#26de81" : "#fc5c65";
      fb.textContent = res.msg;
    }
    if (res.ok) {
      sfx.victory();
      updateAllLevelCodeDisplays();
      if (document.getElementById("screen-select").classList.contains("active")) {
        renderSelectionScreen();
      }
    }
  }

  // --- Helper Lookups ---
  function getFairyDef(id) {
    return DATA.fairies.find((f) => f.id === id) || DATA.fairies[0];
  }

  function getVillainDef(id) {
    return DATA.villains.find((v) => v.id === id) || DATA.villains[0];
  }

  function isCardUpgradedInCurrentMode(cardId, cardIndexInDeck) {
    if (state.gameMode === "story") {
      return Boolean(state.save.upgradedCards[cardId]);
    }
    if (state.versusUpgradePreset === "base") return false;
    if (state.versusUpgradePreset === "max") return true;
    if (state.versusUpgradePreset === "attuned") return cardIndexInDeck < 4;
    return Boolean(state.save.upgradedCards[cardId]);
  }

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  // --- Screen Navigation ---
  function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((el) => {
      el.classList.toggle("active", el.id === screenId);
    });
    updateAllLevelCodeDisplays();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // --- Render Spell Card HTML ---
  function renderSpellCardHTML(cardDef, fairyDef, isUpgraded, isPlayable = true, clickAttr = "") {
    const stats = isUpgraded ? cardDef.upgraded : cardDef.base;
    const displayName = isUpgraded ? cardDef.upgradedName : cardDef.name;
    const classes = [
      "spell-card",
      isUpgraded ? "upgraded" : "",
      !isPlayable ? "unplayable" : ""
    ]
      .filter(Boolean)
      .join(" ");

    return `
      <div class="${classes}" ${clickAttr} style="--fairy-color: ${fairyDef.color};">
        <div class="spell-card-top">
          <img src="${cardDef.art}" alt="${displayName}" loading="lazy" />
          <div class="spell-cost-gem" title="Mana Cost">${stats.cost}</div>
          <span class="spell-type-pill">${cardDef.type}</span>
          ${isUpgraded ? `<span class="spell-upgrade-star">★ UPGRADED +</span>` : ""}
        </div>
        <div class="spell-card-content">
          <div class="spell-card-owner">${fairyDef.name} • ${fairyDef.element}</div>
          <div class="spell-card-name">${displayName}</div>
          <div class="spell-card-desc">${stats.desc}</div>
        </div>
      </div>
    `;
  }

  // --- Main Menu Setup ---
  function syncMainMenuUI() {
    document.getElementById("mode-story-btn").classList.toggle("selected", state.gameMode === "story");
    document.getElementById("mode-versus-btn").classList.toggle("selected", state.gameMode === "versus");
    document.getElementById("team-solo-btn").classList.toggle("selected", state.teamMode === "solo");
    document.getElementById("team-coop-btn").classList.toggle("selected", state.teamMode === "coop");

    ["easy", "medium", "hard", "extreme"].forEach((dKey) => {
      const btn = document.getElementById(`diff-${dKey}-btn`);
      if (btn) btn.classList.toggle("selected", state.difficulty === dKey);
    });

    const diffDropdown = document.getElementById("select-difficulty-dropdown");
    if (diffDropdown) diffDropdown.value = state.difficulty;

    updateAllLevelCodeDisplays();
  }

  // --- Character & Villain Selection Screen ---
  function openSelectionScreen() {
    const neededCount = state.teamMode === "coop" ? 2 : 1;
    if (state.selectedFairies.length > neededCount) {
      state.selectedFairies = state.selectedFairies.slice(0, neededCount);
    } else if (state.selectedFairies.length < neededCount) {
      for (const f of DATA.fairies) {
        if (!state.selectedFairies.includes(f.id)) {
          state.selectedFairies.push(f.id);
          if (state.selectedFairies.length === neededCount) break;
        }
      }
    }

    if (state.gameMode === "story") {
      const targetLevel = Math.min(state.save.unlockedLevel, DATA.villains.length);
      const v = DATA.villains.find((vil) => vil.level === targetLevel) || DATA.villains[0];
      state.selectedVillainId = v.id;
    }

    renderSelectionScreen();
    showScreen("screen-select");
  }

  function renderSelectionScreen() {
    const isCoop = state.teamMode === "coop";
    const isStory = state.gameMode === "story";
    const diff = getDiffConfig();
    updateAllLevelCodeDisplays();

    const diffDropdown = document.getElementById("select-difficulty-dropdown");
    if (diffDropdown) diffDropdown.value = state.difficulty;

    document.getElementById("select-screen-title").textContent = isCoop
      ? `Choose Your 2 Waykeeper Fairies (Cooperative • ${diff.label})`
      : `Choose Your Waykeeper Fairy (Solo • ${diff.label})`;

    document.getElementById("select-screen-subtitle").textContent = isStory
      ? `Story Mode (Level Code: ${generateLevelCode()}) • ${diff.desc}`
      : `Versus Mode (${diff.label}): ${diff.desc}`;

    const coopWrap = document.getElementById("coop-control-toggle-wrap");
    coopWrap.style.display = isCoop ? "flex" : "none";
    const coopBtn = document.getElementById("btn-toggle-coop-ai");
    coopBtn.textContent = state.coopAiEnabled
      ? "🤖 AI Fairy Partner: ON (AI Plays Fairy 2)"
      : "👥 2-Player Co-op (Control Both Fairies)";

    const versusTierWrap = document.getElementById("versus-deck-tier-wrap");
    versusTierWrap.style.display = isStory ? "none" : "flex";

    const slotsEl = document.getElementById("selected-team-slots");
    const slotCount = isCoop ? 2 : 1;
    let slotsHTML = "";
    for (let i = 0; i < slotCount; i++) {
      const fid = state.selectedFairies[i];
      if (fid) {
        const f = getFairyDef(fid);
        slotsHTML += `
          <div class="slot-pill filled">
            <img src="${f.portrait}" alt="${f.name}" />
            <div>
              <strong style="display:block; color: var(--gold-light);">${isCoop ? `Fairy ${i + 1}: ` : ""}${f.name}</strong>
              <span style="font-size: 0.72rem; color: var(--text-muted);">${f.title}</span>
            </div>
          </div>
        `;
      } else {
        slotsHTML += `<div class="slot-pill">Select Fairy ${i + 1}</div>`;
      }
    }
    const chosenVillain = getVillainDef(state.selectedVillainId);
    slotsHTML += `
      <div class="slot-pill filled" style="border-color: var(--red-danger); background: rgba(252,92,101,0.18);">
        <img src="${chosenVillain.portrait}" alt="${chosenVillain.name}" style="border-color: var(--red-danger);" />
        <div>
          <strong style="display:block; color: #ffb8bc;">VS: ${chosenVillain.name}</strong>
          <span style="font-size: 0.72rem; color: var(--text-muted);">${chosenVillain.season} • ❤️ ${calcBossMaxHp(chosenVillain.baseHp)} HP</span>
        </div>
      </div>
    `;
    slotsEl.innerHTML = slotsHTML;

    const rosterEl = document.getElementById("fairy-roster-grid");
    rosterEl.innerHTML = DATA.fairies
      .map((f) => {
        const selIdx = state.selectedFairies.indexOf(f.id);
        const isSelected = selIdx !== -1;
        const upgradedCount = f.deck.filter((c) => state.save.upgradedCards[c.id]).length;
        const badgeLabel = isCoop && isSelected ? `FAIRY ${selIdx + 1}` : "SELECTED";
        const effectiveHp = f.maxHp + diff.fairyBonusHp;

        return `
          <div class="fairy-card ${isSelected ? "selected" : ""}" data-select-fairy="${f.id}" style="--fairy-color: ${f.color};">
            <div class="fairy-card-art">
              <img src="${f.portrait}" alt="${f.name}" />
              <span class="fairy-element-tag">${f.element}</span>
              <span class="fairy-select-badge">✓ ${badgeLabel}</span>
            </div>
            <div class="fairy-card-body">
              <div class="fairy-card-title">
                <h3>${f.name}</h3>
                <span class="fairy-hp-stat">❤️ ${effectiveHp} HP</span>
              </div>
              <div class="fairy-subtitle">${f.title} • ${f.homeworld}</div>
              <div class="fairy-passive">
                <strong>${f.passiveName}:</strong> ${f.passiveDesc}
              </div>
              <div style="font-size: 0.75rem; color: var(--gold-light);">
                ✨ Story Deck Upgrades: <strong>${upgradedCount} / 8 Cards+</strong>
              </div>
              <div class="fairy-card-footer">
                <button type="button" class="btn btn-sm" data-inspect-fairy="${f.id}" style="width: 100%;">
                  🔍 Inspect ${f.name}'s 8 Spell Cards
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    rosterEl.querySelectorAll("[data-select-fairy]").forEach((cardEl) => {
      cardEl.addEventListener("click", (e) => {
        const inspectBtn = e.target.closest("[data-inspect-fairy]");
        if (inspectBtn) {
          e.stopPropagation();
          openGrimoireModal(inspectBtn.getAttribute("data-inspect-fairy"));
          return;
        }
        const fid = cardEl.getAttribute("data-select-fairy");
        sfx.chime();
        if (state.teamMode === "solo") {
          state.selectedFairies = [fid];
        } else {
          const existingIdx = state.selectedFairies.indexOf(fid);
          if (existingIdx !== -1) {
            if (state.selectedFairies.length > 1) {
              state.selectedFairies.splice(existingIdx, 1);
            }
          } else {
            if (state.selectedFairies.length < 2) {
              state.selectedFairies.push(fid);
            } else {
              state.selectedFairies = [state.selectedFairies[1], fid];
            }
          }
        }
        renderSelectionScreen();
      });
    });

    document.getElementById("villain-section-title").textContent = isStory
      ? `Story Mode Chapters (Unlocked Level ${state.save.unlockedLevel} of 7 • ${diff.label})`
      : `Versus Mode: Choose Any Major Villain (${diff.label})`;

    const villainGridEl = document.getElementById("villain-roster-grid");
    villainGridEl.innerHTML = DATA.villains
      .map((v) => {
        const isLocked = isStory && v.level > state.save.unlockedLevel;
        const isCleared = state.save.clearedLevels.includes(v.level);
        const isSelected = state.selectedVillainId === v.id;

        return `
          <div class="villain-card ${isSelected ? "selected" : ""} ${isLocked ? "locked" : ""}" data-select-villain="${v.id}">
            <div class="villain-card-art">
              <img src="${v.portrait}" alt="${v.name}" />
              <span class="chapter-pill">${v.season}</span>
              ${isCleared ? `<span class="cleared-pill">✓ CLEARED</span>` : ""}
            </div>
            <div class="villain-card-body">
              <h4>${v.name}</h4>
              <div class="villain-season">📍 ${v.location} • ❤️ ${calcBossMaxHp(v.baseHp)} HP (${diff.shortLabel})</div>
              <p class="villain-desc">${v.desc}</p>
              ${
                isLocked
                  ? `<div style="margin-top:auto; font-size:0.75rem; color:#ffadb2; font-weight:700;">🔒 Beat Level ${v.level - 1} in Story Mode to Unlock</div>`
                  : `<div style="margin-top:auto; font-size:0.75rem; color:var(--gold-light); font-weight:700;">${
                      isSelected ? "⚔️ Target Selected" : "Click to Select Boss"
                    }</div>`
              }
            </div>
          </div>
        `;
      })
      .join("");

    villainGridEl.querySelectorAll("[data-select-villain]").forEach((vEl) => {
      vEl.addEventListener("click", () => {
        const vid = vEl.getAttribute("data-select-villain");
        const vDef = getVillainDef(vid);
        if (state.gameMode === "story" && vDef.level > state.save.unlockedLevel) {
          return;
        }
        sfx.chime();
        state.selectedVillainId = vid;
        renderSelectionScreen();
      });
    });
  }

  // --- Grimoire Modal ---
  function openGrimoireModal(fairyId) {
    if (fairyId) state.grimoireFairyId = fairyId;
    renderGrimoireModal();
    const dialog = document.getElementById("grimoire-dialog");
    if (!dialog.open) dialog.showModal();
  }

  function renderGrimoireModal() {
    const tabsEl = document.getElementById("grimoire-fairy-tabs");
    tabsEl.innerHTML = DATA.fairies
      .map(
        (f) => `
        <button type="button" class="btn btn-sm ${f.id === state.grimoireFairyId ? "btn-primary" : ""}" data-grimoire-tab="${f.id}">
          ${f.name}
        </button>
      `
      )
      .join("");

    tabsEl.querySelectorAll("[data-grimoire-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.grimoireFairyId = btn.getAttribute("data-grimoire-tab");
        sfx.chime();
        renderGrimoireModal();
      });
    });

    const fDef = getFairyDef(state.grimoireFairyId);
    const toggleBtn = document.getElementById("btn-grimoire-toggle-preview");
    toggleBtn.textContent = state.grimoirePreviewUpgraded
      ? "✨ Showing Upgraded (+) Forms (Click for Base)"
      : "✨ Preview Upgraded (+) Stats: OFF";

    document.getElementById("grimoire-fairy-summary").innerHTML = `
      <strong>${fDef.name} (${fDef.title})</strong> — ❤️ ${fDef.maxHp} HP •
      <span style="color: var(--gold-light);">Passive (${fDef.passiveName}):</span> ${fDef.passiveDesc}<br/>
      <span style="color: var(--cyan-magic);">🌟 Ultimate (${fDef.ultimateName}):</span> ${fDef.ultimateDesc}
    `;

    const cardsContainer = document.getElementById("grimoire-cards-container");
    cardsContainer.innerHTML = fDef.deck
      .map((c) => {
        const isUp = state.grimoirePreviewUpgraded || Boolean(state.save.upgradedCards[c.id]);
        return renderSpellCardHTML(c, fDef, isUp, true);
      })
      .join("");
  }

  // --- Story Cutscene Controller ---
  function startCutscene(phase) {
    const villain = getVillainDef(state.selectedVillainId);
    const hero1 = getFairyDef(state.selectedFairies[0]);
    const hero2 = state.selectedFairies[1] ? getFairyDef(state.selectedFairies[1]) : hero1;

    state.cutscenePhase = phase;
    const rawSlides = phase === "pre" ? villain.preCutscene : villain.postCutscene;

    state.cutsceneSlides = rawSlides.map((slide) => ({
      speaker: slide.speaker
        .replace("{HERO_1}", hero1.name)
        .replace("{HERO_2_OR_1}", hero2.name),
      side: slide.side,
      portrait: slide.portrait
        .replace("{HERO_1_PORTRAIT}", hero1.portrait)
        .replace("{HERO_2_OR_1_PORTRAIT}", hero2.portrait),
      bg: slide.bg || villain.bg,
      text: slide.text
        .replace(/\{HERO_1\}/g, hero1.name)
        .replace(/\{HERO_2_OR_1\}/g, hero2.name)
    }));

    state.cutsceneIndex = 0;
    renderCutsceneSlide();
    showScreen("screen-cutscene");
  }

  function renderCutsceneSlide() {
    const villain = getVillainDef(state.selectedVillainId);
    const hero1 = getFairyDef(state.selectedFairies[0]);
    const slide = state.cutsceneSlides[state.cutsceneIndex];
    if (!slide) {
      finishCutscene();
      return;
    }

    document.getElementById("cutscene-chapter-tag").textContent =
      state.cutscenePhase === "pre"
        ? `${villain.season} • Pre-Battle Story Cutscene (${villain.location})`
        : `${villain.season} • Post-Battle Victory Cutscene`;

    document.getElementById("cutscene-bg").style.backgroundImage = `url('${slide.bg}')`;

    const leftActor = document.getElementById("cutscene-actor-left");
    const rightActor = document.getElementById("cutscene-actor-right");
    const leftImg = document.getElementById("cutscene-img-left");
    const rightImg = document.getElementById("cutscene-img-right");

    if (slide.side === "left") {
      leftImg.src = slide.portrait;
      rightImg.src = villain.portrait;
      leftActor.classList.add("speaking");
      rightActor.classList.remove("speaking");
    } else {
      leftImg.src = hero1.portrait;
      rightImg.src = slide.portrait;
      rightActor.classList.add("speaking");
      leftActor.classList.remove("speaking");
    }

    document.getElementById("cutscene-speaker").textContent = slide.speaker;
    document.getElementById("cutscene-text").textContent = slide.text;
    document.getElementById("cutscene-step-indicator").textContent = `Scene ${state.cutsceneIndex + 1} of ${state.cutsceneSlides.length}`;

    const nextBtn = document.getElementById("btn-next-cutscene");
    if (state.cutsceneIndex === state.cutsceneSlides.length - 1) {
      nextBtn.textContent =
        state.cutscenePhase === "pre" ? "⚔️ Start Card Battle!" : "✨ Claim Card Upgrade →";
    } else {
      nextBtn.textContent = "Next Dialogue →";
    }
  }

  function finishCutscene() {
    if (state.cutscenePhase === "pre") {
      initBattle();
    } else {
      openPostLevelUpgradeScreen();
    }
  }

  // --- Turn-Based Card Battle Engine & Combat Log ---
  function addBattleLog(text, type = "hero") {
    if (!state.battle) return;
    state.battle.logs.push({ text, type });
  }

  function createHeroCombatant(fairyId, index) {
    const fDef = getFairyDef(fairyId);
    const diff = getDiffConfig();
    const fullDeck = fDef.deck.map((cDef, cIdx) => {
      const upgraded = isCardUpgradedInCurrentMode(cDef.id, cIdx);
      return {
        ...cDef,
        upgraded,
        activeStats: upgraded ? { ...cDef.upgraded } : { ...cDef.base }
      };
    });

    const totalMaxHp = fDef.maxHp + diff.fairyBonusHp;

    return {
      index,
      id: fDef.id,
      name: fDef.name,
      title: fDef.title,
      element: fDef.element,
      color: fDef.color,
      portrait: fDef.portrait,
      passiveName: fDef.passiveName,
      passiveDesc: fDef.passiveDesc,
      ultimateName: fDef.ultimateName,
      ultimateDesc: fDef.ultimateDesc,
      maxHp: totalMaxHp,
      hp: totalMaxHp,
      shield: 0,
      maxMana: 3,
      mana: 3,
      statuses: {
        inspire: 0,
        regen: 0,
        reflect: 0,
        weaken: 0
      },
      spellsCastThisTurn: 0,
      drawPile: shuffleArray(fullDeck),
      hand: [],
      discardPile: [],
      floatingPop: null
    };
  }

  function drawCardsForHero(hero, count) {
    for (let i = 0; i < count; i++) {
      if (hero.drawPile.length === 0) {
        if (hero.discardPile.length === 0) break;
        hero.drawPile = shuffleArray(hero.discardPile);
        hero.discardPile = [];
      }
      if (hero.drawPile.length > 0 && hero.hand.length < 7) {
        hero.hand.push(hero.drawPile.pop());
      }
    }
  }

  function initBattle() {
    const villainDef = getVillainDef(state.selectedVillainId);
    const isCoop = state.teamMode === "coop";
    const diff = getDiffConfig();
    const heroes = state.selectedFairies.slice(0, isCoop ? 2 : 1).map((fid, idx) =>
      createHeroCombatant(fid, idx)
    );

    const bossMaxHp = calcBossMaxHp(villainDef.baseHp);
    const scaledMoves = villainDef.moves.map((m) => scaleVillainMove(m, diff));

    state.battle = {
      round: 1,
      activeHeroIndex: 0,
      selectedAllyTargetIndex: 0,
      accord: diff.startAccord,
      difficulty: diff,
      heroes,
      villain: {
        id: villainDef.id,
        level: villainDef.level,
        name: villainDef.name,
        title: villainDef.title,
        season: villainDef.season,
        location: villainDef.location,
        bg: villainDef.bg,
        portrait: villainDef.portrait,
        maxHp: bossMaxHp,
        hp: bossMaxHp,
        shield: diff.bossRoundShield,
        moves: scaledMoves,
        moveIndex: 0,
        statuses: {
          burn: 0,
          weaken: 0,
          entangle: 0
        },
        floatingPop: null
      },
      logs: [
        {
          text: `✨ Battle started vs. ${villainDef.name} (${bossMaxHp} HP) on ${diff.label} Difficulty (${diff.desc})!`,
          type: "round"
        }
      ],
      ended: false
    };

    startPlayerRound();
    showScreen("screen-battle");
    sfx.chime();
  }

  function startPlayerRound() {
    const b = state.battle;
    if (!b || b.ended) return;

    const nextIntent = b.villain.moves[b.villain.moveIndex % b.villain.moves.length];
    addBattleLog(
      `=== Round ${b.round}: Waykeepers Turn • Villain Intent: ${nextIntent.name} (${nextIntent.desc}) ===`,
      "round"
    );

    // Hard / Extreme round-start boss aura
    if (b.round > 1) {
      if (b.difficulty.bossRoundShield > 0) {
        b.villain.shield += b.difficulty.bossRoundShield;
        addBattleLog(
          `🛡️ [${b.difficulty.shortLabel} Difficulty] ${b.villain.name} gained +${b.difficulty.bossRoundShield} Round-Start Shield.`,
          "villain"
        );
      }
      if (b.difficulty.bossRoundHeal > 0 && b.villain.hp > 0 && b.villain.hp < b.villain.maxHp) {
        const before = b.villain.hp;
        b.villain.hp = Math.min(b.villain.maxHp, b.villain.hp + b.difficulty.bossRoundHeal);
        addBattleLog(
          `💀 [${b.difficulty.shortLabel} Difficulty] ${b.villain.name} regenerated +${b.villain.hp - before} HP.`,
          "villain"
        );
      }
    }

    b.heroes.forEach((h) => {
      if (h.hp <= 0) return;

      const hadShield = h.shield > 0;
      if (h.id === "iman" && h.shield > 0) {
        h.shield = Math.min(10, h.shield);
        addBattleLog(
          `🛡️ [Passive] Iman's Persistent Firewall retained ${h.shield} Shield into Round ${b.round}.`,
          "passive"
        );
      } else {
        h.shield = 0;
      }

      h.statuses.reflect = 0;
      h.mana = h.maxMana;
      h.spellsCastThisTurn = 0;

      if (h.id === "oru" && hadShield) {
        h.mana += 1;
        b.accord = Math.min(100, b.accord + 10);
        addBattleLog(
          `☀️ [Passive] Oru's Returning Light granted +1 bonus Mana and +10% Accord!`,
          "passive"
        );
      }

      while (h.hand.length > 0) {
        h.discardPile.push(h.hand.pop());
      }
      drawCardsForHero(h, 4);
    });

    const firstAlive = b.heroes.findIndex((h) => h.hp > 0);
    b.activeHeroIndex = firstAlive !== -1 ? firstAlive : 0;
    b.selectedAllyTargetIndex = b.activeHeroIndex;

    renderBattleUI();
  }

  function triggerFloatingPop(unit, text, color = "#ffe885") {
    unit.floatingPop = { text, color, ts: Date.now() };
  }

  function dealDamageToVillain(rawDmg, sourceHero) {
    const b = state.battle;
    const v = b.villain;
    let dmg = rawDmg;

    if (sourceHero) {
      dmg += sourceHero.statuses.inspire || 0;
      if (sourceHero.statuses.weaken > 0) {
        dmg = Math.max(1, dmg - sourceHero.statuses.weaken * 2);
      }
    }

    let blocked = 0;
    if (v.shield > 0) {
      blocked = Math.min(v.shield, dmg);
      v.shield -= blocked;
      dmg -= blocked;
    }

    v.hp = Math.max(0, v.hp - dmg);
    triggerFloatingPop(v, `-${dmg} HP${blocked ? ` (${blocked} Blocked)` : ""}`, "#ff6b81");
    return { dmg, blocked };
  }

  function healHero(hero, amount) {
    if (hero.hp <= 0) return 0;
    const before = hero.hp;
    hero.hp = Math.min(hero.maxHp, hero.hp + amount);
    const actual = hero.hp - before;
    triggerFloatingPop(hero, `+${actual || amount} HP`, "#26de81");

    if (hero.id === "sile" && state.battle.villain.hp > 0) {
      const splash = dealDamageToVillain(4, null);
      addBattleLog(
        `🌊 [Passive] Sile's Tidal Recoil splashed ${state.battle.villain.name} for ${splash.dmg} DMG!`,
        "passive"
      );
    }
    return actual;
  }

  function shieldHero(hero, amount) {
    if (hero.hp <= 0) return;
    hero.shield += amount;
    triggerFloatingPop(hero, `+${amount} Shield`, "#32e0ff");

    if (hero.id === "sile" && state.battle.villain.hp > 0) {
      const splash = dealDamageToVillain(4, null);
      addBattleLog(
        `🌊 [Passive] Sile's Tidal Recoil splashed ${state.battle.villain.name} for ${splash.dmg} DMG!`,
        "passive"
      );
    }
  }

  function playHandCard(heroIndex, handCardIndex) {
    const b = state.battle;
    if (!b || b.ended) return;

    const hero = b.heroes[heroIndex];
    if (!hero || hero.hp <= 0) return;

    const card = hero.hand[handCardIndex];
    if (!card) return;

    const st = card.activeStats;
    if (hero.mana < st.cost) return;

    hero.mana -= st.cost;
    hero.hand.splice(handCardIndex, 1);
    hero.discardPile.push(card);
    hero.spellsCastThisTurn += 1;

    b.accord = Math.min(100, b.accord + (st.accord || 10));

    const allyTargets = st.targetAllAllies
      ? b.heroes.filter((h) => h.hp > 0)
      : [
          b.heroes[b.selectedAllyTargetIndex] && b.heroes[b.selectedAllyTargetIndex].hp > 0
            ? b.heroes[b.selectedAllyTargetIndex]
            : hero
        ];

    const cardLabel = card.upgraded ? card.upgradedName : card.name;
    const logDetails = [];

    if (st.dmg) {
      const res = dealDamageToVillain(st.dmg, hero);
      logDetails.push(
        `dealt ${res.dmg} DMG to ${b.villain.name}${res.blocked ? ` (${res.blocked} blocked by Shield)` : ""}`
      );
      sfx.attack();

      if (hero.id === "tavra") {
        b.villain.statuses.burn += 2;
        b.accord = Math.min(100, b.accord + 5);
        logDetails.push(`[Tavra Passive: +2 Burn & +5% Accord]`);
      }
    }

    if (st.burn) {
      b.villain.statuses.burn += st.burn;
      logDetails.push(`applied ${st.burn} Burn (now ${b.villain.statuses.burn} DMG/turn)`);
    }

    if (st.weaken) {
      b.villain.statuses.weaken += st.weaken;
      logDetails.push(`applied ${st.weaken} Weaken (-${b.villain.statuses.weaken * 2} boss ATK)`);
    }

    if (st.entangle) {
      b.villain.statuses.entangle += st.entangle;
      logDetails.push(`applied ${st.entangle} Entangle (-35% boss DMG)`);
    }

    if (st.shield) {
      allyTargets.forEach((ally) => shieldHero(ally, st.shield));
      if (!st.dmg) sfx.shield();
      logDetails.push(`granted +${st.shield} Shield to ${allyTargets.map((a) => a.name).join(" & ")}`);
    }

    if (st.heal) {
      allyTargets.forEach((ally) => healHero(ally, st.heal));
      if (!st.dmg) sfx.heal();
      logDetails.push(`healed ${allyTargets.map((a) => a.name).join(" & ")} for +${st.heal} HP`);
    }

    if (st.inspire) {
      allyTargets.forEach((ally) => {
        ally.statuses.inspire += st.inspire;
      });
      logDetails.push(`granted +${st.inspire} Inspire (+${st.inspire} Attack DMG)`);
    }

    if (st.regen) {
      allyTargets.forEach((ally) => {
        ally.statuses.regen += st.regen;
      });
      logDetails.push(`granted +${st.regen} Regen`);
    }

    if (st.reflect) {
      hero.statuses.reflect += st.reflect;
      logDetails.push(`gained ${st.reflect} Reflect`);
    }

    if (st.cleanse) {
      allyTargets.forEach((ally) => {
        ally.statuses.weaken = 0;
      });
      logDetails.push(`cleansed Weaken debuffs`);
    }

    if (st.energy) {
      hero.mana += st.energy;
      logDetails.push(`gained +${st.energy} Mana`);
    }

    if (st.draw) {
      drawCardsForHero(hero, st.draw);
      logDetails.push(`drew ${st.draw} card(s)`);
    }

    addBattleLog(
      `[R${b.round}] 🧚‍♀️ ${hero.name} cast ${cardLabel} (${st.cost}💎): ${logDetails.join(", ")}.`,
      "hero"
    );

    if (hero.id === "pella" && hero.spellsCastThisTurn % 2 === 0 && b.villain.hp > 0) {
      const echo = dealDamageToVillain(5, null);
      addBattleLog(
        `🎵 [Passive] Pella's Resonant Echo echoed for ${echo.dmg} bonus Sonic DMG!`,
        "passive"
      );
    }

    checkBattleOutcome();
    renderBattleUI();
  }

  function castAccordUltimate() {
    const b = state.battle;
    if (!b || b.ended || b.accord < 100) return;

    const hero = b.heroes[b.activeHeroIndex] || b.heroes[0];
    b.accord = 0;
    sfx.ultimate();

    const livingAllies = b.heroes.filter((h) => h.hp > 0);

    if (hero.id === "tavra") {
      dealDamageToVillain(28, hero);
      b.villain.statuses.burn += 6;
      livingAllies.forEach((a) => healHero(a, 12));
    } else if (hero.id === "oru") {
      dealDamageToVillain(24, hero);
      b.villain.statuses.weaken += 3;
      livingAllies.forEach((a) => shieldHero(a, 16));
    } else if (hero.id === "veska") {
      dealDamageToVillain(22, hero);
      b.villain.statuses.entangle += 1;
      livingAllies.forEach((a) => {
        healHero(a, 18);
        a.statuses.regen += 6;
      });
    } else if (hero.id === "pella") {
      dealDamageToVillain(26, hero);
      livingAllies.forEach((a) => {
        a.statuses.inspire += 5;
      });
      drawCardsForHero(hero, 2);
    } else if (hero.id === "iman") {
      dealDamageToVillain(24, hero);
      livingAllies.forEach((a) => shieldHero(a, 22));
      drawCardsForHero(hero, 2);
    } else if (hero.id === "sile") {
      dealDamageToVillain(26, hero);
      b.villain.statuses.entangle += 1;
      livingAllies.forEach((a) => {
        shieldHero(a, 14);
        healHero(a, 10);
      });
    } else if (hero.id === "nemi") {
      dealDamageToVillain(25, hero);
      livingAllies.forEach((a) => {
        a.statuses.inspire += 4;
        shieldHero(a, 12);
        healHero(a, 10);
      });
    }

    addBattleLog(
      `[R${b.round}] 🌟 ULTIMATE ACCORD! ${hero.name} unleashed ${hero.ultimateName} (${hero.ultimateDesc})`,
      "passive"
    );
    checkBattleOutcome();
    renderBattleUI();
  }

  function endPlayerTurn() {
    const b = state.battle;
    if (!b || b.ended) return;

    if (
      state.teamMode === "coop" &&
      !state.coopAiEnabled &&
      b.activeHeroIndex === 0 &&
      b.heroes[1] &&
      b.heroes[1].hp > 0 &&
      b.heroes[1].spellsCastThisTurn === 0 &&
      b.heroes[1].hand.some((c) => c.activeStats.cost <= b.heroes[1].mana)
    ) {
      b.activeHeroIndex = 1;
      b.selectedAllyTargetIndex = 1;
      addBattleLog(
        `[R${b.round}] 🤝 Cooperative Turn switched to ${b.heroes[1].name}'s Spell Hand.`,
        "round"
      );
      sfx.chime();
      renderBattleUI();
      return;
    }

    if (state.teamMode === "coop" && state.coopAiEnabled && b.heroes[1] && b.heroes[1].hp > 0) {
      runCoopPartnerAI(b.heroes[1]);
      if (checkBattleOutcome()) {
        renderBattleUI();
        return;
      }
    }

    b.heroes.forEach((h) => {
      if (h.hp <= 0) return;

      if (h.statuses.regen > 0) {
        const regenAmt = h.statuses.regen;
        healHero(h, regenAmt);
        h.statuses.regen = Math.max(0, h.statuses.regen - 1);
        addBattleLog(`🌿 ${h.name}'s Regen restored +${regenAmt} HP (Regen now ${h.statuses.regen}).`, "passive");
      }

      if (h.id === "veska") {
        b.heroes.filter((ally) => ally.hp > 0).forEach((ally) => healHero(ally, 4));
        addBattleLog(`🌸 [Passive] Veska's Evergreen Care restored +4 HP to all Waykeeper allies.`, "passive");
      }

      if (h.id === "nemi" && b.villain.hp > 0) {
        const packHit = dealDamageToVillain(5, null);
        shieldHero(h, 3);
        addBattleLog(
          `🐾 [Passive] Nemi's Wild Kinship struck ${b.villain.name} for ${packHit.dmg} DMG and granted Nemi +3 Shield.`,
          "passive"
        );
      }

      if (h.statuses.weaken > 0) {
        h.statuses.weaken -= 1;
      }
    });

    if (checkBattleOutcome()) {
      renderBattleUI();
      return;
    }

    executeVillainTurn();
  }

  function runCoopPartnerAI(aiHero) {
    const b = state.battle;
    let safety = 10;
    while (safety-- > 0 && !b.ended && aiHero.hp > 0) {
      const idx = aiHero.hand.findIndex((c) => c.activeStats.cost <= aiHero.mana);
      if (idx === -1) break;
      const woundedIdx = b.heroes.findIndex((h) => h.hp > 0 && h.hp < h.maxHp * 0.65);
      b.selectedAllyTargetIndex = woundedIdx !== -1 ? woundedIdx : 1;
      playHandCard(1, idx);
    }
  }

  function executeVillainTurn() {
    const b = state.battle;
    const v = b.villain;
    if (b.ended || v.hp <= 0) return;

    v.shield = 0;

    if (v.statuses.burn > 0) {
      const burnDmg = v.statuses.burn;
      v.hp = Math.max(0, v.hp - burnDmg);
      v.statuses.burn = Math.max(0, v.statuses.burn - 1);
      triggerFloatingPop(v, `🔥 -${burnDmg} Burn`, "#ff9f43");
      addBattleLog(
        `[R${b.round}] 🔥 ${v.name} took ${burnDmg} Burn/Toxin DMG at turn start (${v.hp}/${v.maxHp} HP left; Burn now ${v.statuses.burn}).`,
        "passive"
      );
      if (checkBattleOutcome()) {
        renderBattleUI();
        return;
      }
    }

    const move = v.moves[v.moveIndex % v.moves.length];
    v.moveIndex += 1;

    const livingHeroes = b.heroes.filter((h) => h.hp > 0);
    if (livingHeroes.length === 0) return;

    const targets = move.targetAll
      ? livingHeroes
      : [livingHeroes[Math.floor(Math.random() * livingHeroes.length)]];

    const moveNotes = [];

    if (move.dmg) {
      sfx.villainHit();
      let dmg = move.dmg;
      if (v.statuses.weaken > 0) {
        dmg = Math.max(2, dmg - v.statuses.weaken * 2);
      }
      if (v.statuses.entangle > 0) {
        dmg = Math.max(2, Math.round(dmg * 0.65));
      }

      targets.forEach((target) => {
        let incoming = dmg;
        let absorbed = 0;
        if (target.shield > 0) {
          absorbed = Math.min(target.shield, incoming);
          target.shield -= absorbed;
          incoming -= absorbed;
        }
        target.hp = Math.max(0, target.hp - incoming);
        triggerFloatingPop(target, `-${incoming} HP`, "#fc5c65");
        moveNotes.push(
          `hit ${target.name} for ${incoming} DMG${absorbed ? ` (${absorbed} blocked by Shield)` : ""}`
        );

        if (target.statuses.reflect > 0 && v.hp > 0) {
          const ref = dealDamageToVillain(target.statuses.reflect, null);
          moveNotes.push(`🪞 ${target.name} reflected ${ref.dmg} DMG back`);
        }
      });
    }

    if (move.shield) {
      v.shield += move.shield;
      moveNotes.push(`gained +${move.shield} Boss Shield`);
    }
    if (move.heal && v.hp > 0) {
      v.hp = Math.min(v.maxHp, v.hp + move.heal);
      moveNotes.push(`healed +${move.heal} Boss HP`);
    }
    if (move.burn) {
      targets.forEach((t) => {
        t.hp = Math.max(0, t.hp - move.burn);
      });
      moveNotes.push(`dealt +${move.burn} bonus Burn DMG`);
    }
    if (move.weaken) {
      targets.forEach((t) => {
        t.statuses.weaken += move.weaken;
      });
      moveNotes.push(`inflicted ${move.weaken} Weaken`);
    }
    if (move.entangle) {
      targets.forEach((t) => {
        t.statuses.inspire = Math.max(0, t.statuses.inspire - 1);
      });
      moveNotes.push(`reduced Inspire by 1`);
    }

    if (v.statuses.weaken > 0) v.statuses.weaken -= 1;
    if (v.statuses.entangle > 0) v.statuses.entangle -= 1;

    addBattleLog(
      `[R${b.round}] ⚡ BOSS TURN — ${v.name} used ${move.name}: ${moveNotes.join(", ")}.`,
      "villain"
    );

    if (checkBattleOutcome()) {
      renderBattleUI();
      return;
    }

    b.round += 1;
    startPlayerRound();
  }

  function checkBattleOutcome() {
    const b = state.battle;
    if (!b || b.ended) return true;

    if (b.villain.hp <= 0) {
      b.ended = true;
      addBattleLog(`🏆 VICTORY! ${b.villain.name} was defeated in Round ${b.round} (${b.difficulty.label})!`, "round");
      sfx.victory();
      handleBattleVictory();
      return true;
    }

    const anyAlive = b.heroes.some((h) => h.hp > 0);
    if (!anyAlive) {
      b.ended = true;
      addBattleLog(`💔 DEFEAT — All Waykeepers fairies were overwhelmed in Round ${b.round}.`, "villain");
      openBattleResultModal(false);
      return true;
    }

    return false;
  }

  function handleBattleVictory() {
    const b = state.battle;
    const lvl = b.villain.level;

    if (state.gameMode === "story") {
      if (!state.save.clearedLevels.includes(lvl)) {
        state.save.clearedLevels.push(lvl);
      }
      if (state.save.unlockedLevel <= lvl && lvl < DATA.villains.length) {
        state.save.unlockedLevel = lvl + 1;
      }
      writeSave(state.save);

      state.upgradeQueueFairyIds = state.selectedFairies.slice(
        0,
        state.teamMode === "coop" ? 2 : 1
      );

      setTimeout(() => {
        startCutscene("post");
      }, 450);
    } else {
      openBattleResultModal(true);
    }
  }

  function openBattleResultModal(isVictory) {
    const dialog = document.getElementById("result-dialog");
    const titleEl = document.getElementById("result-dialog-title");
    const bodyEl = document.getElementById("result-dialog-body");
    const b = state.battle;

    if (isVictory) {
      titleEl.textContent = "🌟 Magical Victory!";
      bodyEl.innerHTML = `
        <img src="${b.heroes[0].portrait}" alt="${b.heroes[0].name}" style="width: 110px; height: 110px; border-radius: 50%; object-fit: cover; border: 3px solid var(--gold-light);" />
        <h3 style="font-size: 1.35rem;">${b.villain.name} Defeated in ${b.round} Rounds (${b.difficulty.label})!</h3>
        <p style="color: var(--text-muted); max-width: 480px;">
          Your Waykeepers spell accord triumphed at ${b.villain.location}!
        </p>
        <div style="display: flex; gap: 12px; margin-top: 8px;">
          <button type="button" class="btn btn-primary" id="btn-result-rematch">🔄 Rematch Boss</button>
          <button type="button" class="btn btn-gold" id="btn-result-select">🧚‍♀️ Change Fairy / Villain</button>
        </div>
      `;
    } else {
      titleEl.textContent = "💔 Wings Fatigued — Defeat";
      bodyEl.innerHTML = `
        <img src="${b.villain.portrait}" alt="${b.villain.name}" style="width: 110px; height: 110px; border-radius: 50%; object-fit: cover; border: 3px solid var(--red-danger);" />
        <h3 style="font-size: 1.35rem;">${b.villain.name} Overwhelmed the Waykeepers (${b.difficulty.label})</h3>
        <p style="color: var(--text-muted); max-width: 480px;">
          Don't give up! Watch the villain's telegraphed attack intent and combine Shield, Entangle, and Healing spells.
        </p>
        <div style="display: flex; gap: 12px; margin-top: 8px;">
          <button type="button" class="btn btn-primary" id="btn-result-rematch">⚔️ Retry Battle</button>
          <button type="button" class="btn" id="btn-result-select">🏰 Back to Character Select</button>
        </div>
      `;
    }

    dialog.showModal();

    document.getElementById("btn-result-rematch").onclick = () => {
      dialog.close();
      initBattle();
    };
    document.getElementById("btn-result-select").onclick = () => {
      dialog.close();
      openSelectionScreen();
    };
  }

  // --- Post-Level Deck Progression / Card Upgrade Sanctuary ---
  function openPostLevelUpgradeScreen() {
    if (!state.upgradeQueueFairyIds || state.upgradeQueueFairyIds.length === 0) {
      openSelectionScreen();
      return;
    }
    state.currentUpgradeFairyId = state.upgradeQueueFairyIds.shift();
    renderUpgradeSanctuary();
    showScreen("screen-upgrade");
  }

  function renderUpgradeSanctuary() {
    const fDef = getFairyDef(state.currentUpgradeFairyId);
    const vDef = getVillainDef(state.selectedVillainId);
    updateAllLevelCodeDisplays();

    document.getElementById("upgrade-screen-title").textContent = `${vDef.name} Defeated! Upgrade 1 Card for ${fDef.name}`;
    document.getElementById("upgrade-screen-subtitle").textContent = `Choose 1 spell card from ${fDef.name}'s deck to permanently upgrade to its Enchanted (+) form for Story Mode!`;

    const gridEl = document.getElementById("upgrade-cards-grid");
    gridEl.innerHTML = fDef.deck
      .map((c) => {
        const alreadyUp = Boolean(state.save.upgradedCards[c.id]);
        return `
          <div class="upgrade-choice-card ${alreadyUp ? "already-upgraded" : ""}">
            <div style="display: flex; justify-content: center;">
              ${renderSpellCardHTML(c, fDef, true, true)}
            </div>
            <div class="upgrade-diff-box">
              <div><strong style="color: var(--text-muted);">Base:</strong> (${c.base.cost}💎) ${c.base.desc}</div>
              <div style="margin-top: 4px;"><strong style="color: var(--gold-light);">Upgraded+:</strong> (${c.upgraded.cost}💎) ${c.upgraded.desc}</div>
            </div>
            <button type="button" class="btn ${alreadyUp ? "" : "btn-gold"}" data-upgrade-card-id="${c.id}" ${alreadyUp ? "disabled" : ""}>
              ${alreadyUp ? "✓ Already Upgraded+" : `✨ Upgrade to ${c.upgradedName}`}
            </button>
          </div>
        `;
      })
      .join("");

    gridEl.querySelectorAll("[data-upgrade-card-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cid = btn.getAttribute("data-upgrade-card-id");
        state.save.upgradedCards[cid] = true;
        writeSave(state.save);
        sfx.ultimate();
        openPostLevelUpgradeScreen();
      });
    });
  }

  // --- Render Battle Arena UI ---
  function renderBattleUI() {
    const b = state.battle;
    if (!b) return;

    const v = b.villain;
    const activeHero = b.heroes[b.activeHeroIndex] || b.heroes[0];

    document.getElementById("battle-bg").style.backgroundImage = `url('${v.bg}')`;
    document.getElementById("battle-round-pill").textContent = `Round ${b.round} • ${b.difficulty.label}`;
    document.getElementById("battle-mode-label").textContent =
      state.gameMode === "story"
        ? `Story Mode • ${v.season} (${v.location})`
        : `Versus Mode • ${v.location}`;

    document.getElementById("accord-bar-fill").style.width = `${b.accord}%`;
    document.getElementById("accord-pct-label").textContent = `${b.accord}%`;
    const ultBtn = document.getElementById("btn-cast-ultimate");
    ultBtn.disabled = b.accord < 100;
    ultBtn.textContent =
      b.accord >= 100
        ? `🌟 Cast ${activeHero.ultimateName}!`
        : `🌟 Ultimate (${b.accord}%)`;

    const heroesContainer = document.getElementById("battle-heroes-container");
    heroesContainer.innerHTML = b.heroes
      .map((h, idx) => {
        const hpPct = Math.max(0, Math.min(100, Math.round((h.hp / h.maxHp) * 100)));
        const isActive = idx === b.activeHeroIndex;
        const isAllyTarget = idx === b.selectedAllyTargetIndex && b.heroes.length > 1;
        const popHTML =
          h.floatingPop && Date.now() - h.floatingPop.ts < 1200
            ? `<div class="floating-pop" style="color: ${h.floatingPop.color};">${h.floatingPop.text}</div>`
            : "";

        return `
          <div class="combatant-card ${isActive ? "active-turn" : ""} ${b.heroes.length > 1 ? "targetable-ally" : ""} ${isAllyTarget ? "selected-ally-target" : ""}" data-hero-box="${idx}">
            ${popHTML}
            <div class="combatant-header">
              <div class="combatant-avatar" style="border-color: ${h.color};">
                <img src="${h.portrait}" alt="${h.name}" />
              </div>
              <div class="combatant-meta">
                <h3>
                  ${h.name}
                  ${h.shield > 0 ? `<span class="shield-badge">🛡️ ${h.shield} Shield (blocks DMG)</span>` : ""}
                </h3>
                <div class="combatant-role">${h.title} • 💎 ${h.mana}/${h.maxMana} Mana</div>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                  <strong>${h.passiveName}:</strong> ${h.passiveDesc}
                </div>
              </div>
            </div>

            <div class="hp-bar-container">
              <div class="hp-bar-fill" style="width: ${hpPct}%;"></div>
              <div class="hp-bar-label">
                <span>❤️ HP</span>
                <span>${h.hp} / ${h.maxHp}</span>
              </div>
            </div>

            <div class="status-row">
              ${h.statuses.inspire > 0 ? `<span class="status-chip buff">💫 Inspire ${h.statuses.inspire} (+${h.statuses.inspire} Attack DMG)</span>` : ""}
              ${h.statuses.regen > 0 ? `<span class="status-chip buff">🌿 Regen ${h.statuses.regen} (heals ${h.statuses.regen} HP at turn end)</span>` : ""}
              ${h.statuses.reflect > 0 ? `<span class="status-chip buff">🪞 Reflect ${h.statuses.reflect} (bounces ${h.statuses.reflect} DMG when hit)</span>` : ""}
              ${h.statuses.weaken > 0 ? `<span class="status-chip debuff">🌙 Weaken ${h.statuses.weaken} (-${h.statuses.weaken * 2} Attack DMG)</span>` : ""}
              ${b.heroes.length > 1 ? `<span class="status-chip" style="margin-left:auto;">${isActive ? "✨ Active Caster" : "Click to Command"}</span>` : ""}
            </div>
          </div>
        `;
      })
      .join("");

    heroesContainer.querySelectorAll("[data-hero-box]").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number(el.getAttribute("data-hero-box"));
        if (b.heroes[idx] && b.heroes[idx].hp > 0) {
          b.activeHeroIndex = idx;
          b.selectedAllyTargetIndex = idx;
          sfx.chime();
          renderBattleUI();
        }
      });
    });

    const nextMove = v.moves[v.moveIndex % v.moves.length];
    const vHpPct = Math.max(0, Math.min(100, Math.round((v.hp / v.maxHp) * 100)));
    const vPopHTML =
      v.floatingPop && Date.now() - v.floatingPop.ts < 1200
        ? `<div class="floating-pop" style="color: ${v.floatingPop.color};">${v.floatingPop.text}</div>`
        : "";

    document.getElementById("battle-villain-container").innerHTML = `
      <div class="combatant-card villain-unit">
        ${vPopHTML}
        <div class="combatant-header">
          <div class="combatant-avatar" style="border-color: var(--red-danger);">
            <img src="${v.portrait}" alt="${v.name}" />
          </div>
          <div class="combatant-meta">
            <h3>
              ${v.name}
              ${v.shield > 0 ? `<span class="shield-badge">🛡️ ${v.shield}</span>` : ""}
            </h3>
            <div class="combatant-role" style="color: #ffadb2;">${v.title} • ${v.season} (${b.difficulty.label})</div>
          </div>
        </div>

        <div class="hp-bar-container">
          <div class="hp-bar-fill" style="width: ${vHpPct}%;"></div>
          <div class="hp-bar-label">
            <span>💀 BOSS HP</span>
            <span>${v.hp} / ${v.maxHp}</span>
          </div>
        </div>

        <div class="villain-intent-box">
          <div>
            <div class="intent-title">⚠️ Upcoming Boss Attack: ${nextMove.name}</div>
            <div class="intent-desc">${nextMove.desc}</div>
          </div>
        </div>

        <div class="status-row">
          ${v.statuses.burn > 0 ? `<span class="status-chip debuff">🔥 Burn / Toxin: ${v.statuses.burn} (${v.statuses.burn} DMG at turn start)</span>` : ""}
          ${v.statuses.weaken > 0 ? `<span class="status-chip debuff">🌙 Weaken: ${v.statuses.weaken} (-${v.statuses.weaken * 2} Boss DMG)</span>` : ""}
          ${v.statuses.entangle > 0 ? `<span class="status-chip debuff">🕸️ Entangled: ${v.statuses.entangle}t (-35% Boss DMG)</span>` : ""}
        </div>
      </div>
    `;

    document.getElementById("battle-mana-display").textContent = `💎 Mana: ${activeHero.mana} / ${activeHero.maxMana}`;
    document.getElementById("active-fairy-turn-indicator").textContent = `${activeHero.name}'s Spell Hand (${activeHero.element})`;
    document.getElementById("draw-pile-count").textContent = `📚 Draw Pile: ${activeHero.drawPile.length}`;
    document.getElementById("discard-pile-count").textContent = `♻️ Discard Pile: ${activeHero.discardPile.length}`;

    const coopSwitchEl = document.getElementById("coop-switch-fairy-group");
    if (b.heroes.length > 1) {
      coopSwitchEl.style.display = "flex";
      coopSwitchEl.innerHTML = b.heroes
        .map(
          (h, idx) => `
          <button type="button" class="btn btn-sm ${idx === b.activeHeroIndex ? "btn-gold" : ""}" data-switch-hero="${idx}">
            🧚‍♀️ ${h.name} (${h.mana}💎)
          </button>
        `
        )
        .join("");
      coopSwitchEl.querySelectorAll("[data-switch-hero]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.getAttribute("data-switch-hero"));
          b.activeHeroIndex = idx;
          b.selectedAllyTargetIndex = idx;
          sfx.chime();
          renderBattleUI();
        });
      });
    } else {
      coopSwitchEl.style.display = "none";
    }

    const handRowEl = document.getElementById("battle-hand-row");
    if (activeHero.hand.length === 0) {
      handRowEl.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; color: var(--text-muted); font-size:0.95rem;">
          No cards left in ${activeHero.name}'s hand this turn. Click <strong>End Turn</strong> (or switch fairy in Co-op)!
        </div>
      `;
    } else {
      handRowEl.innerHTML = activeHero.hand
        .map((card, cIdx) => {
          const playable = activeHero.mana >= card.activeStats.cost && activeHero.hp > 0;
          return renderSpellCardHTML(
            card,
            activeHero,
            card.upgraded,
            playable,
            `data-play-hand-index="${cIdx}"`
          );
        })
        .join("");

      handRowEl.querySelectorAll("[data-play-hand-index]").forEach((cardEl) => {
        cardEl.addEventListener("click", () => {
          const cIdx = Number(cardEl.getAttribute("data-play-hand-index"));
          playHandCard(b.activeHeroIndex, cIdx);
        });
      });
    }

    const logFeedEl = document.getElementById("battle-log-feed");
    if (logFeedEl) {
      logFeedEl.innerHTML = b.logs
        .map((entry) => {
          const cls =
            entry.type === "round"
              ? "round-divider"
              : entry.type === "villain"
              ? "villain-act"
              : entry.type === "passive"
              ? "passive-act"
              : "";
          return `<div class="log-entry ${cls}">${entry.text}</div>`;
        })
        .join("");
      logFeedEl.scrollTop = logFeedEl.scrollHeight;
    }
  }

  // --- Sparkle Starfield Background Animation ---
  function initSparkleCanvas() {
    const canvas = document.getElementById("sparkle-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2.2 + 0.6,
      vy: -(Math.random() * 0.35 + 0.1),
      alpha: Math.random() * 0.7 + 0.2,
      hue: Math.random() > 0.5 ? 320 : 48
    }));

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.y += p.vy;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 95%, 80%, ${p.alpha})`;
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // --- Wire Up Static UI Event Listeners ---
  function bindEvents() {
    document.getElementById("nav-home-btn").addEventListener("click", () => {
      sfx.chime();
      showScreen("screen-menu");
    });
    document.getElementById("btn-main-menu").addEventListener("click", () => {
      sfx.chime();
      showScreen("screen-menu");
    });
    document.getElementById("btn-open-grimoire").addEventListener("click", () => {
      sfx.chime();
      openGrimoireModal(state.selectedFairies[0] || "tavra");
    });
    document.getElementById("btn-View-all-decks").addEventListener("click", () => {
      sfx.chime();
      openGrimoireModal("tavra");
    });
    document.getElementById("btn-open-rules").addEventListener("click", () => {
      sfx.chime();
      document.getElementById("rules-dialog").showModal();
    });
    document.getElementById("btn-toggle-audio").addEventListener("click", (e) => {
      sfx.enabled = !sfx.enabled;
      e.currentTarget.textContent = sfx.enabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
      if (sfx.enabled) sfx.chime();
    });

    // Level Code Buttons
    document.getElementById("btn-open-level-code").addEventListener("click", () => {
      sfx.chime();
      openLevelCodeModal();
    });
    document.getElementById("btn-menu-level-code").addEventListener("click", () => {
      sfx.chime();
      openLevelCodeModal();
    });
    document.getElementById("btn-select-level-code").addEventListener("click", () => {
      sfx.chime();
      openLevelCodeModal();
    });
    document.getElementById("btn-copy-menu-code").addEventListener("click", (e) => {
      copyCurrentLevelCode(e.currentTarget);
    });
    document.getElementById("btn-copy-upgrade-code").addEventListener("click", (e) => {
      copyCurrentLevelCode(e.currentTarget);
    });
    document.getElementById("btn-modal-copy-code").addEventListener("click", (e) => {
      copyCurrentLevelCode(e.currentTarget);
    });
    document.getElementById("btn-apply-level-code").addEventListener("click", () => {
      handleApplyCodeInput();
    });
    document.getElementById("input-level-code").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleApplyCodeInput();
      }
    });

    document.getElementById("btn-grimoire-toggle-preview").addEventListener("click", () => {
      state.grimoirePreviewUpgraded = !state.grimoirePreviewUpgraded;
      sfx.chime();
      renderGrimoireModal();
    });

    document.getElementById("mode-story-btn").addEventListener("click", () => {
      state.gameMode = "story";
      sfx.chime();
      syncMainMenuUI();
    });
    document.getElementById("mode-versus-btn").addEventListener("click", () => {
      state.gameMode = "versus";
      sfx.chime();
      syncMainMenuUI();
    });
    document.getElementById("team-solo-btn").addEventListener("click", () => {
      state.teamMode = "solo";
      sfx.chime();
      syncMainMenuUI();
    });
    document.getElementById("team-coop-btn").addEventListener("click", () => {
      state.teamMode = "coop";
      sfx.chime();
      syncMainMenuUI();
    });

    // Difficulty Buttons on Main Menu & Dropdown on Select Screen
    ["easy", "medium", "hard", "extreme"].forEach((dKey) => {
      const btn = document.getElementById(`diff-${dKey}-btn`);
      if (btn) {
        btn.addEventListener("click", () => {
          state.difficulty = dKey;
          sfx.chime();
          syncMainMenuUI();
        });
      }
    });

    const diffDropdown = document.getElementById("select-difficulty-dropdown");
    if (diffDropdown) {
      diffDropdown.addEventListener("change", (e) => {
        state.difficulty = e.target.value;
        sfx.chime();
        syncMainMenuUI();
        renderSelectionScreen();
      });
    }

    document.getElementById("btn-start-setup").addEventListener("click", () => {
      sfx.chime();
      openSelectionScreen();
    });

    document.getElementById("btn-reset-story").addEventListener("click", () => {
      state.save = {
        unlockedLevel: 1,
        clearedLevels: [],
        upgradedCards: {}
      };
      writeSave(state.save);
      sfx.chime();
      alert("Story Mode progress and spell card upgrades have been reset to Level 1!");
    });

    document.getElementById("btn-back-to-menu").addEventListener("click", () => {
      sfx.chime();
      showScreen("screen-menu");
    });

    document.getElementById("btn-toggle-coop-ai").addEventListener("click", () => {
      state.coopAiEnabled = !state.coopAiEnabled;
      sfx.chime();
      renderSelectionScreen();
    });

    document.getElementById("versus-upgrade-preset").addEventListener("change", (e) => {
      state.versusUpgradePreset = e.target.value;
    });

    document.getElementById("btn-launch-battle").addEventListener("click", () => {
      sfx.chime();
      if (state.gameMode === "story") {
        startCutscene("pre");
      } else {
        initBattle();
      }
    });

    document.getElementById("btn-next-cutscene").addEventListener("click", () => {
      sfx.chime();
      state.cutsceneIndex += 1;
      if (state.cutsceneIndex >= state.cutsceneSlides.length) {
        finishCutscene();
      } else {
        renderCutsceneSlide();
      }
    });

    document.getElementById("btn-skip-cutscene").addEventListener("click", () => {
      sfx.chime();
      finishCutscene();
    });

    document.getElementById("btn-end-turn").addEventListener("click", () => {
      endPlayerTurn();
    });

    document.getElementById("btn-cast-ultimate").addEventListener("click", () => {
      castAccordUltimate();
    });

    document.getElementById("btn-view-battle-deck").addEventListener("click", () => {
      const b = state.battle;
      const activeId = b && b.heroes[b.activeHeroIndex] ? b.heroes[b.activeHeroIndex].id : "tavra";
      openGrimoireModal(activeId);
    });

    document.getElementById("btn-retreat-battle").addEventListener("click", () => {
      sfx.chime();
      openSelectionScreen();
    });

    document.getElementById("btn-skip-upgrade").addEventListener("click", () => {
      sfx.chime();
      openPostLevelUpgradeScreen();
    });
  }

  // --- Boot ---
  bindEvents();
  syncMainMenuUI();
  initSparkleCanvas();
})();
