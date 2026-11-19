// Character Customization UI Controller (9 Species x 24 Classes, Appearance, Stats, JSON Export/Import)

import { SPECIES, SPECIES_BY_ID } from '../data/species.js';
import { CLASSES, CLASS_BY_ID } from '../data/classes.js';
import {
  HAIR_STYLES,
  EYE_STYLES,
  computeDerivedStats,
  validateCharacterJSON,
} from '../data/spells.js';
import { drawCharacter } from '../engine/renderer.js';

const STAT_POOL = 20;
const STAT_KEYS = [
  { key: 'str', label: 'STR', hint: 'Melee Power' },
  { key: 'int', label: 'INT', hint: 'Spell Power' },
  { key: 'vit', label: 'VIT', hint: 'Max HP' },
  { key: 'agi', label: 'AGI', hint: 'Speed & Haste' },
  { key: 'wis', label: 'WIS', hint: 'Mana & CDR' },
  { key: 'lck', label: 'LCK', hint: 'Crit Chance' },
];

export class CharacterCreatorUI {
  constructor(dialogEl, onApply) {
    this.dialog = dialogEl;
    this.onApply = onApply;
    this.draft = null;
    this.previewCanvas = dialogEl.querySelector('#creator-preview');
    this.previewCtx = this.previewCanvas.getContext('2d');
    this.previewRaf = null;
    this.previewTime = 0;
    this.previewSwing = 0;
    this.classFilter = 'All';

    this._bindStaticControls();
  }

  open(character) {
    this.draft = structuredClone(character);
    this._renderAll();
    this.dialog.showModal();
    this._startPreviewLoop();
  }

  close() {
    if (this.previewRaf) cancelAnimationFrame(this.previewRaf);
    this.previewRaf = null;
    if (this.dialog.open) this.dialog.close();
  }

  _bindStaticControls() {
    this.dialog.addEventListener('close', () => {
      if (this.previewRaf) cancelAnimationFrame(this.previewRaf);
      this.previewRaf = null;
      this.dialog.returnValue = '';
    });

    this.dialog.querySelector('#creator-name').addEventListener('input', (e) => {
      this.draft.name = e.target.value;
    });

    const colorMap = [
      ['#creator-skin', 'skinColor'],
      ['#creator-hair-color', 'hairColor'],
      ['#creator-armor-color', 'armorColor'],
      ['#creator-accent-color', 'accentColor'],
    ];
    for (const [sel, prop] of colorMap) {
      this.dialog.querySelector(sel).addEventListener('input', (e) => {
        this.draft.appearance[prop] = e.target.value;
      });
    }

    const hairSel = this.dialog.querySelector('#creator-hair-style');
    hairSel.innerHTML = HAIR_STYLES.map((h) => `<option value="${h.id}">${h.name}</option>`).join('');
    hairSel.addEventListener('change', (e) => {
      this.draft.appearance.hairStyle = e.target.value;
    });

    const eyeSel = this.dialog.querySelector('#creator-eye-style');
    eyeSel.innerHTML = EYE_STYLES.map((ey) => `<option value="${ey.id}">${ey.name}</option>`).join('');
    eyeSel.addEventListener('change', (e) => {
      this.draft.appearance.eyeStyle = e.target.value;
    });

    const scaleInput = this.dialog.querySelector('#creator-scale');
    scaleInput.addEventListener('input', (e) => {
      this.draft.appearance.scale = Number(e.target.value);
      this.dialog.querySelector('#creator-scale-val').textContent = `${Math.round(this.draft.appearance.scale * 100)}%`;
      if (!CSS.supports('accent-color', '#facc15')) {
        const pct = ((Number(e.target.value) - 0.85) / 0.35) * 100;
        e.target.style.setProperty('--progress', `${pct}%`);
      }
    });

    this.dialog.querySelector('#creator-cape').addEventListener('change', (e) => {
      this.draft.appearance.showCape = e.target.checked;
    });
    this.dialog.querySelector('#creator-aura').addEventListener('change', (e) => {
      this.draft.appearance.showAura = e.target.checked;
    });

    this.dialog.querySelector('#creator-test-swing').addEventListener('click', () => {
      this.previewSwing = 1.0;
    });

    this.dialog.querySelector('#creator-randomize').addEventListener('click', () => {
      const sp = SPECIES[Math.floor(Math.random() * SPECIES.length)];
      const cl = CLASSES[Math.floor(Math.random() * CLASSES.length)];
      this.draft.speciesId = sp.id;
      this.draft.classId = cl.id;
      this.draft.appearance.skinColor = sp.defaultColors.skin;
      this.draft.appearance.hairColor = sp.defaultColors.hair;
      this.draft.appearance.armorColor = cl.defaultColors.armor;
      this.draft.appearance.accentColor = cl.defaultColors.accent;
      this.draft.appearance.hairStyle = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id;
      this.draft.appearance.eyeStyle = EYE_STYLES[Math.floor(Math.random() * EYE_STYLES.length)].id;
      this.draft.appearance.showCape = cl.visual.cape;
      this.draft.appearance.showAura = cl.visual.aura !== 'none';
      this._renderAll();
    });

    this.dialog.querySelector('#creator-export-json').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(this.draft, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(this.draft.name || 'hero').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-character.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    const importFile = this.dialog.querySelector('#creator-import-file');
    this.dialog.querySelector('#creator-import-json').addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        this.draft = validateCharacterJSON(JSON.parse(text));
        this._renderAll();
      } catch (err) {
        alert(`Could not import character JSON: ${err.message}`);
      }
      importFile.value = '';
    });

    this.dialog.querySelector('#creator-save').addEventListener('click', () => {
      this.onApply(structuredClone(this.draft));
      this.close();
    });
  }

  _renderAll() {
    const sp = SPECIES_BY_ID[this.draft.speciesId];
    const cl = CLASS_BY_ID[this.draft.classId];

    // Sync inputs
    this.dialog.querySelector('#creator-name').value = this.draft.name;
    this.dialog.querySelector('#creator-skin').value = this.draft.appearance.skinColor;
    this.dialog.querySelector('#creator-hair-color').value = this.draft.appearance.hairColor;
    this.dialog.querySelector('#creator-armor-color').value = this.draft.appearance.armorColor;
    this.dialog.querySelector('#creator-accent-color').value = this.draft.appearance.accentColor;
    this.dialog.querySelector('#creator-hair-style').value = this.draft.appearance.hairStyle;
    this.dialog.querySelector('#creator-eye-style').value = this.draft.appearance.eyeStyle;
    this.dialog.querySelector('#creator-scale').value = this.draft.appearance.scale;
    this.dialog.querySelector('#creator-scale-val').textContent = `${Math.round(this.draft.appearance.scale * 100)}%`;
    this.dialog.querySelector('#creator-cape').checked = Boolean(this.draft.appearance.showCape);
    this.dialog.querySelector('#creator-aura').checked = Boolean(this.draft.appearance.showAura);

    // Render 9 Species Grid
    const spGrid = this.dialog.querySelector('#species-grid');
    spGrid.innerHTML = SPECIES.map(
      (s) => `
      <button type="button" class="choice-card ${s.id === this.draft.speciesId ? 'selected' : ''}" data-species="${s.id}">
        <span class="swatch" style="background:${s.defaultColors.skin}; border-color:${s.defaultColors.accent}"></span>
        <span class="choice-meta">
          <strong>${s.name}</strong>
          <small>${s.melee.name} · ${s.spell.name}</small>
        </span>
      </button>`
    ).join('');
    spGrid.querySelectorAll('[data-species]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const picked = SPECIES_BY_ID[btn.dataset.species];
        this.draft.speciesId = picked.id;
        this.draft.appearance.skinColor = picked.defaultColors.skin;
        this.draft.appearance.hairColor = picked.defaultColors.hair;
        this._renderAll();
      });
    });

    // Class Archetype filter tabs
    const archetypes = ['All', 'Vanguard', 'Skirmisher', 'Arcanist', 'Mystic', 'Artificer'];
    const filterEl = this.dialog.querySelector('#class-filters');
    filterEl.innerHTML = archetypes
      .map(
        (a) =>
          `<button type="button" class="chip ${this.classFilter === a ? 'active' : ''}" data-arch="${a}">${a}</button>`
      )
      .join('');
    filterEl.querySelectorAll('[data-arch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.classFilter = btn.dataset.arch;
        this._renderAll();
      });
    });

    // Render 24 Classes Grid
    const clGrid = this.dialog.querySelector('#class-grid');
    const visibleClasses =
      this.classFilter === 'All' ? CLASSES : CLASSES.filter((c) => c.archetype === this.classFilter);
    clGrid.innerHTML = visibleClasses
      .map(
        (c) => `
      <button type="button" class="choice-card ${c.id === this.draft.classId ? 'selected' : ''}" data-class="${c.id}">
        <span class="swatch" style="background:${c.defaultColors.armor}; border-color:${c.defaultColors.accent}"></span>
        <span class="choice-meta">
          <strong>${c.name}</strong>
          <small>${c.archetype} · ${c.melee.name}</small>
        </span>
      </button>`
      )
      .join('');
    clGrid.querySelectorAll('[data-class]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const picked = CLASS_BY_ID[btn.dataset.class];
        this.draft.classId = picked.id;
        this.draft.appearance.armorColor = picked.defaultColors.armor;
        this.draft.appearance.accentColor = picked.defaultColors.accent;
        this.draft.appearance.showCape = picked.visual.cape;
        this.draft.appearance.showAura = picked.visual.aura !== 'none';
        this._renderAll();
      });
    });

    // Abilities breakdown
    this.dialog.querySelector('#creator-abilities').innerHTML = `
      <div class="ability-pill"><span>[X / LMB] Class Melee</span><strong>${cl.melee.name}</strong><small>${cl.melee.desc}</small></div>
      <div class="ability-pill"><span>[Y / RMB] Racial Melee</span><strong>${sp.melee.name}</strong><small>${sp.melee.desc}</small></div>
      <div class="ability-pill"><span>[B / Q] Class Spell</span><strong>${cl.spell.name}</strong><small>${cl.spell.desc}</small></div>
      <div class="ability-pill"><span>[RB / E] Racial Spell</span><strong>${sp.spell.name}</strong><small>${sp.spell.desc}</small></div>
    `;

    // Stats point-buy
    this._renderStats();
  }

  _renderStats() {
    const derived = computeDerivedStats(this.draft);
    const spent = Object.values(this.draft.bonusStats).reduce((a, b) => a + b, 0);
    const remaining = STAT_POOL - spent;

    this.dialog.querySelector('#stat-points-left').textContent = `${remaining} pts left`;
    const list = this.dialog.querySelector('#stat-allocator');
    list.innerHTML = STAT_KEYS.map(({ key, label, hint }) => {
      const val = derived.total[key];
      const bonus = this.draft.bonusStats[key] || 0;
      return `
        <div class="stat-row">
          <div class="stat-label"><strong>${label}</strong> <small>${hint}</small></div>
          <div class="stat-controls">
            <button type="button" class="mini-btn" data-stat="${key}" data-delta="-1" ${bonus <= 0 ? 'disabled' : ''}>−</button>
            <span class="stat-num">${val} <small>(+${bonus})</small></span>
            <button type="button" class="mini-btn" data-stat="${key}" data-delta="1" ${remaining <= 0 ? 'disabled' : ''}>+</button>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('[data-stat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.stat;
        const d = Number(btn.dataset.delta);
        const curSpent = Object.values(this.draft.bonusStats).reduce((a, b) => a + b, 0);
        if (d > 0 && curSpent >= STAT_POOL) return;
        if (d < 0 && this.draft.bonusStats[k] <= 0) return;
        this.draft.bonusStats[k] += d;
        this._renderStats();
      });
    });

    this.dialog.querySelector('#derived-summary').innerHTML = `
      <span>HP <b>${derived.maxHp}</b></span>
      <span>Mana <b>${derived.maxMana}</b></span>
      <span>Speed <b>${Math.round(derived.moveSpeed)}</b></span>
      <span>Crit <b>${Math.round(derived.critChance * 100)}%</b></span>
    `;
  }

  _startPreviewLoop() {
    const loop = () => {
      this.previewTime += 0.016;
      if (this.previewSwing > 0) this.previewSwing = Math.max(0, this.previewSwing - 0.05);
      const ctx = this.previewCtx;
      const W = this.previewCanvas.width;
      const H = this.previewCanvas.height;
      ctx.clearRect(0, 0, W, H);
      const grad = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.6);
      grad.addColorStop(0, '#2a2d47');
      grad.addColorStop(1, '#11131f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      drawCharacter(ctx, this.draft, W / 2, H / 2 + 12, {
        time: this.previewTime,
        moving: true,
        aimAngle: Math.sin(this.previewTime * 0.9) * 0.45,
        swingProgress: this.previewSwing,
        zoom: 2.8,
      });

      this.previewRaf = requestAnimationFrame(loop);
    };
    this.previewRaf = requestAnimationFrame(loop);
  }
}
