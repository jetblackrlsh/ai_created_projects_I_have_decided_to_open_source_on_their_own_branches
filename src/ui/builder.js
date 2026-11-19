// Dungeon Level Builder UI (Tiles, NPCs with Missions & Rewards, Enemies, Traps, Chests, JSON Export/Import, Test Play)

import { TILE_SIZE, TILE_DEFS, createBlankCustomLevel, createTempleOfFourElementsLevel } from '../data/templeLevel.js';
import { BONUS_SPELLS } from '../data/spells.js';

const ENEMY_PRESETS = [
  { kind: 'skeleton', name: 'Skeleton Guard', hp: 75, damage: 11, color: '#cbd5e1' },
  { kind: 'goblin', name: 'Goblin Raider', hp: 65, damage: 10, color: '#65a30d' },
  { kind: 'cultist', name: 'Dark Cultist', hp: 75, damage: 12, color: '#9333ea' },
  { kind: 'flame_imp', name: 'Flame Imp', hp: 70, damage: 13, color: '#f97316' },
  { kind: 'frost_wraith', name: 'Frost Wraith', hp: 75, damage: 12, color: '#38bdf8' },
  { kind: 'stone_sentinel', name: 'Stone Sentinel', hp: 105, damage: 15, color: '#16a34a' },
  { kind: 'storm_harpy', name: 'Storm Harpy', hp: 70, damage: 13, color: '#a78bfa' },
];

export class LevelBuilderUI {
  constructor(dialogEl, onPlayLevel) {
    this.dialog = dialogEl;
    this.onPlayLevel = onPlayLevel;
    this.canvas = dialogEl.querySelector('#builder-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.level = null;
    this.tool = 'tile'; // tile | npc | enemy | trap | chest | spawn | erase
    this.selectedTile = 1;
    this.selectedEnemy = 'skeleton';
    this.selectedTrap = 'spikes';
    this.selectedChest = 'gold';
    this.isDrawing = false;
    this.cellSize = 22;

    this._bindEvents();
  }

  open(levelData) {
    this.level = structuredClone(levelData || createBlankCustomLevel());
    this._syncMetaInputs();
    this._renderPalette();
    this._resizeCanvas();
    this._draw();
    this.dialog.showModal();
  }

  close() {
    if (this.dialog.open) this.dialog.close();
  }

  _bindEvents() {
    this.dialog.addEventListener('close', () => {
      this.dialog.returnValue = '';
    });

    this.dialog.querySelector('#builder-name').addEventListener('input', (e) => {
      if (this.level) this.level.name = e.target.value;
    });

    // Tool selector buttons
    this.dialog.querySelectorAll('[data-btool]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.tool = btn.dataset.btool;
        this.dialog.querySelectorAll('[data-btool]').forEach((b) => b.classList.toggle('active', b === btn));
        this._renderToolOptions();
      });
    });

    this.dialog.querySelector('#builder-new-blank').addEventListener('click', () => {
      this.level = createBlankCustomLevel();
      this._syncMetaInputs();
      this._resizeCanvas();
      this._draw();
    });

    this.dialog.querySelector('#builder-load-temple').addEventListener('click', () => {
      this.level = createTempleOfFourElementsLevel();
      this._syncMetaInputs();
      this._resizeCanvas();
      this._draw();
    });

    this.dialog.querySelector('#builder-export-json').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(this.level, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(this.level.name || 'dungeon').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-level.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    const importFile = this.dialog.querySelector('#builder-import-file');
    this.dialog.querySelector('#builder-import-json').addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        if (!Array.isArray(parsed.tiles) || !parsed.width || !parsed.height) {
          throw new Error('Missing tiles/width/height fields.');
        }
        this.level = parsed;
        this._syncMetaInputs();
        this._resizeCanvas();
        this._draw();
      } catch (err) {
        alert(`Invalid level JSON: ${err.message}`);
      }
      importFile.value = '';
    });

    this.dialog.querySelector('#builder-play').addEventListener('click', () => {
      this.onPlayLevel(structuredClone(this.level));
      this.close();
    });

    // Canvas painting
    const getCell = (e) => {
      const r = this.canvas.getBoundingClientRect();
      const x = Math.floor((((e.clientX - r.left) / r.width) * this.canvas.width) / this.cellSize);
      const y = Math.floor((((e.clientY - r.top) / r.height) * this.canvas.height) / this.cellSize);
      return { x, y };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDrawing = true;
      const { x, y } = getCell(e);
      this._applyAt(x, y, true);
    });
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDrawing) return;
      if (this.tool === 'tile' || this.tool === 'erase') {
        const { x, y } = getCell(e);
        this._applyAt(x, y, false);
      }
    });
    window.addEventListener('mouseup', () => {
      this.isDrawing = false;
    });
  }

  _syncMetaInputs() {
    this.dialog.querySelector('#builder-name').value = this.level.name || 'Custom Dungeon';
  }

  _renderPalette() {
    this._renderToolOptions();
  }

  _renderToolOptions() {
    const box = this.dialog.querySelector('#builder-tool-options');
    if (this.tool === 'tile') {
      box.innerHTML = TILE_DEFS.map(
        (t) =>
          `<button type="button" class="chip ${this.selectedTile === t.id ? 'active' : ''}" data-tile="${t.id}">
            <span class="dot" style="background:${t.color}"></span>${t.name}
          </button>`
      ).join('');
      box.querySelectorAll('[data-tile]').forEach((b) => {
        b.addEventListener('click', () => {
          this.selectedTile = Number(b.dataset.tile);
          this._renderToolOptions();
        });
      });
    } else if (this.tool === 'npc') {
      const spellOpts = Object.values(BONUS_SPELLS)
        .map((s) => `<option value="${s.id}">${s.name}</option>`)
        .join('');
      box.innerHTML = `
        <div class="builder-form">
          <label>NPC Name <input id="b-npc-name" type="text" value="Quest Giver" /></label>
          <label>Role
            <select id="b-npc-role">
              <option value="priest">Priest / Sage</option>
              <option value="villager">Villager / Guard</option>
            </select>
          </label>
          <label>Dialogue <input id="b-npc-dialogue" type="text" value="Defeat the monsters in this dungeon and return for your reward!" /></label>
          <label>Mission Title <input id="b-npc-quest" type="text" value="Purge the Crypt" /></label>
          <label>Objective
            <select id="b-npc-obj">
              <option value="defeat_enemies">Defeat Enemies</option>
              <option value="open_chests">Open Treasure Chests</option>
            </select>
          </label>
          <label>Target Count <input id="b-npc-count" type="number" min="1" max="20" value="3" /></label>
          <label>Reward Gold <input id="b-npc-gold" type="number" min="0" max="5000" value="150" /></label>
          <label>Reward Spell <select id="b-npc-spell"><option value="">None</option>${spellOpts}</select></label>
        </div>
        <small class="muted">Click any floor tile on the grid to place this NPC.</small>
      `;
    } else if (this.tool === 'enemy') {
      box.innerHTML = ENEMY_PRESETS.map(
        (en) =>
          `<button type="button" class="chip ${this.selectedEnemy === en.kind ? 'active' : ''}" data-enemy="${en.kind}">
            <span class="dot" style="background:${en.color}"></span>${en.name} (${en.hp} HP)
          </button>`
      ).join('');
      box.querySelectorAll('[data-enemy]').forEach((b) => {
        b.addEventListener('click', () => {
          this.selectedEnemy = b.dataset.enemy;
          this._renderToolOptions();
        });
      });
    } else if (this.tool === 'trap') {
      const traps = [
        { id: 'spikes', label: 'Spike Trap' },
        { id: 'fire_jet', label: 'Fire Jet Trap' },
        { id: 'arcane_rune', label: 'Arcane Rune Trap' },
      ];
      box.innerHTML = traps
        .map(
          (tr) =>
            `<button type="button" class="chip ${this.selectedTrap === tr.id ? 'active' : ''}" data-trap="${tr.id}">${tr.label}</button>`
        )
        .join('');
      box.querySelectorAll('[data-trap]').forEach((b) => {
        b.addEventListener('click', () => {
          this.selectedTrap = b.dataset.trap;
          this._renderToolOptions();
        });
      });
    } else if (this.tool === 'chest') {
      const chests = [
        { id: 'wood', label: 'Wooden Chest (50g + Potion)' },
        { id: 'iron', label: 'Iron Chest (100g + 2 Potions)' },
        { id: 'gold', label: 'Golden Chest (150g + Arcane Bolt Spell)' },
      ];
      box.innerHTML = chests
        .map(
          (ch) =>
            `<button type="button" class="chip ${this.selectedChest === ch.id ? 'active' : ''}" data-chest="${ch.id}">${ch.label}</button>`
        )
        .join('');
      box.querySelectorAll('[data-chest]').forEach((b) => {
        b.addEventListener('click', () => {
          this.selectedChest = b.dataset.chest;
          this._renderToolOptions();
        });
      });
    } else if (this.tool === 'spawn') {
      box.innerHTML = `<small class="muted">Click any floor tile to move the Player Spawn point.</small>`;
    } else if (this.tool === 'erase') {
      box.innerHTML = `<small class="muted">Click or drag over entities (NPCs, Enemies, Traps, Chests) to remove them.</small>`;
    }
  }

  _applyAt(gx, gy, isClick) {
    if (gx < 0 || gy < 0 || gx >= this.level.width || gy >= this.level.height) return;
    const wx = (gx + 0.5) * TILE_SIZE;
    const wy = (gy + 0.5) * TILE_SIZE;

    if (this.tool === 'tile') {
      this.level.tiles[gy][gx] = this.selectedTile;
    } else if (this.tool === 'spawn') {
      this.level.spawn = { x: wx, y: wy };
    } else if (this.tool === 'erase') {
      const near = (item) => Math.hypot(item.x - wx, item.y - wy) < TILE_SIZE * 0.7;
      this.level.npcs = (this.level.npcs || []).filter((n) => !near(n));
      this.level.enemies = (this.level.enemies || []).filter((e) => !near(e));
      this.level.traps = (this.level.traps || []).filter((t) => !near(t));
      this.level.chests = (this.level.chests || []).filter((c) => !near(c));
    } else if (isClick && this.tool === 'npc') {
      const name = this.dialog.querySelector('#b-npc-name')?.value || 'Quest Giver';
      const role = this.dialog.querySelector('#b-npc-role')?.value || 'priest';
      const dialogue = this.dialog.querySelector('#b-npc-dialogue')?.value || 'Good luck!';
      const questTitle = this.dialog.querySelector('#b-npc-quest')?.value?.trim();
      const obj = this.dialog.querySelector('#b-npc-obj')?.value || 'defeat_enemies';
      const count = Number(this.dialog.querySelector('#b-npc-count')?.value) || 3;
      const gold = Number(this.dialog.querySelector('#b-npc-gold')?.value) || 150;
      const spell = this.dialog.querySelector('#b-npc-spell')?.value || '';
      this.level.npcs.push({
        id: `npc_${Date.now()}`,
        name,
        role,
        x: wx,
        y: wy,
        color: role === 'priest' ? '#f8fafc' : '#cbd5e1',
        accent: '#facc15',
        dialogue,
        quest: questTitle
          ? {
              title: questTitle,
              objectiveType: obj,
              targetCount: count,
              rewardGold: gold,
              rewardSpell: spell || undefined,
              rewardTitle: `${questTitle} Hero`,
            }
          : undefined,
      });
    } else if (isClick && this.tool === 'enemy') {
      const preset = ENEMY_PRESETS.find((e) => e.kind === this.selectedEnemy) || ENEMY_PRESETS[0];
      this.level.enemies.push({
        id: `enemy_${Date.now()}`,
        kind: preset.kind,
        name: preset.name,
        x: wx,
        y: wy,
        hp: preset.hp,
        damage: preset.damage,
      });
    } else if (isClick && this.tool === 'trap') {
      this.level.traps.push({
        id: `trap_${Date.now()}`,
        kind: this.selectedTrap,
        x: wx,
        y: wy,
        interval: 2.5,
        damage: 14,
      });
    } else if (isClick && this.tool === 'chest') {
      this.level.chests.push({
        id: `chest_${Date.now()}`,
        tier: this.selectedChest,
        x: wx,
        y: wy,
        lootType: this.selectedChest === 'gold' ? 'spell' : 'potion',
        lootValue: this.selectedChest === 'gold' ? 'arcane_bolt' : undefined,
        gold: this.selectedChest === 'gold' ? 150 : this.selectedChest === 'iron' ? 100 : 50,
        potions: this.selectedChest === 'iron' ? 2 : 1,
      });
    }

    this._draw();
  }

  _resizeCanvas() {
    this.canvas.width = this.level.width * this.cellSize;
    this.canvas.height = this.level.height * this.cellSize;
  }

  _draw() {
    const ctx = this.ctx;
    const cs = this.cellSize;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < this.level.height; y++) {
      for (let x = 0; x < this.level.width; x++) {
        const def = TILE_DEFS[this.level.tiles[y][x]] || TILE_DEFS[0];
        ctx.fillStyle = def.color;
        ctx.fillRect(x * cs, y * cs, cs, cs);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.strokeRect(x * cs, y * cs, cs, cs);
      }
    }

    const toPx = (wx, wy) => [(wx / TILE_SIZE) * cs, (wy / TILE_SIZE) * cs];

    // Traps
    for (const t of this.level.traps || []) {
      const [px, py] = toPx(t.x, t.y);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(px - 6, py - 6, 12, 12);
    }
    // Chests
    for (const c of this.level.chests || []) {
      const [px, py] = toPx(c.x, c.y);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 7, py - 5, 14, 10);
    }
    // Enemies
    for (const e of this.level.enemies || []) {
      const [px, py] = toPx(e.x, e.y);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    // NPCs
    for (const n of this.level.npcs || []) {
      const [px, py] = toPx(n.x, n.y);
      ctx.fillStyle = n.role?.startsWith('elemental_') ? n.color : '#38bdf8';
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // Spawn
    if (this.level.spawn) {
      const [px, py] = toPx(this.level.spawn.x, this.level.spawn.y);
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#052e16';
      ctx.font = '700 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('P', px, py + 3.5);
    }
  }
}
