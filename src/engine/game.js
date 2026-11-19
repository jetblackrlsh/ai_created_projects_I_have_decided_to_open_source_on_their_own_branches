// Core 60fps Action-Adventure RPG Simulation & Branching Story Engine

import { SPECIES_BY_ID } from '../data/species.js';
import { CLASS_BY_ID } from '../data/classes.js';
import { BONUS_SPELLS, MAX_POTIONS, computeDerivedStats } from '../data/spells.js';
import { TILE_SIZE, TILE_DEFS } from '../data/templeLevel.js';

const ENEMY_COLORS = {
  skeleton: '#cbd5e1',
  goblin: '#65a30d',
  cultist: '#9333ea',
  flame_imp: '#f97316',
  frost_wraith: '#38bdf8',
  stone_sentinel: '#16a34a',
  storm_harpy: '#a78bfa',
};

export class RPGGame {
  constructor({ canvas, input, audio, renderer, callbacks }) {
    this.canvas = canvas;
    this.input = input;
    this.audio = audio;
    this.renderer = renderer;
    this.callbacks = callbacks || {};

    this.character = null;
    this.level = null;
    this.initialCharacter = null;
    this.initialLevel = null;
    this.running = false;
    this.paused = false;
    this.gameOver = false;
    this.time = 0;
    this.shake = 0;
    this.camX = 0;
    this.camY = 0;

    this.player = null;
    this.npcs = [];
    this.enemies = [];
    this.traps = [];
    this.chests = [];
    this.projectiles = [];
    this.particles = [];
    this.effects = [];
    this.floatingTexts = [];
    this.nearbyTarget = null;
    this.story = null;
    this.kills = 0;
    this.chestsOpened = 0;
    this.equippedBonusIdx = 0;

    this._lastTs = 0;
    this._raf = null;
  }

  load(character, levelData) {
    this.initialCharacter = structuredClone(character);
    this.initialLevel = structuredClone(levelData);
    this.character = structuredClone(character);
    this.character.potions = Math.max(0, Math.min(MAX_POTIONS, this.character.potions ?? MAX_POTIONS));
    this.level = structuredClone(levelData);
    this.gameOver = false;
    this.paused = false;
    const derived = computeDerivedStats(this.character);

    this.player = {
      x: this.level.spawn?.x ?? 100,
      y: this.level.spawn?.y ?? 100,
      vx: 0,
      vy: 0,
      radius: 15,
      hp: derived.maxHp,
      maxHp: derived.maxHp,
      mana: derived.maxMana,
      maxMana: derived.maxMana,
      shield: 0,
      aimAngle: -Math.PI / 2,
      invuln: 0,
      hurtFlash: 0,
      dashTimer: 0,
      dashCooldown: 0,
      hasteTimer: 0,
      buffDamageTimer: 0,
      buffDamageMult: 1,
      swingTimer: 0,
      swingDuration: 0.22,
      cooldowns: { classMelee: 0, racialMelee: 0, classSpell: 0, racialSpell: 0, bonusSpell: 0 },
    };

    this.npcs = (this.level.npcs || []).map((n) => ({
      ...n,
      allied: false,
      convertedToEnemy: false,
      questAccepted: false,
      questCompleted: false,
    }));

    this.enemies = (this.level.enemies || []).map((e) => ({
      ...e,
      maxHp: e.hp || 80,
      hp: e.hp || 80,
      damage: e.damage || 12,
      color: e.color || ENEMY_COLORS[e.kind] || '#ef4444',
      radius: e.isBoss ? 24 : 15,
      vx: 0,
      vy: 0,
      attackCd: 0.8 + Math.random() * 0.6,
      hurtFlash: 0,
      stunTimer: 0,
      slowTimer: 0,
      dead: false,
    }));

    this.traps = (this.level.traps || []).map((t) => ({
      ...t,
      timer: Math.random() * (t.interval || 2.5),
      active: false,
      hitCd: 0,
    }));

    this.chests = (this.level.chests || []).map((c) => ({ ...c, opened: false }));
    this.projectiles = [];
    this.particles = [];
    this.effects = [];
    this.floatingTexts = [];
    this.nearbyTarget = null;
    this.kills = 0;
    this.chestsOpened = 0;
    this.equippedBonusIdx = 0;

    this.story = {
      questAccepted: false,
      branch: 'undecided', // undecided | light | ally_fire | ally_water | ally_earth | ally_air | betray_all
      alliedElements: [],
      defeatedElements: [],
      priestDefeated: false,
      endingCompleted: null,
    };

    this.audio?.setMusicMode('dungeon');
    this.camX = this.player.x - this.canvas.width / 2;
    this.camY = this.player.y - this.canvas.height / 2;
    this._emitHud();
  }

  restartLevel() {
    if (this.initialCharacter && this.initialLevel) {
      this.load(this.initialCharacter, this.initialLevel);
    }
  }

  applyCharacterUpdate(character) {
    const prevHpRatio = this.player ? this.player.hp / this.player.maxHp : 1;
    const prevManaRatio = this.player ? this.player.mana / this.player.maxMana : 1;
    this.character = structuredClone(character);
    this.initialCharacter = structuredClone(character);
    if (this.player) {
      const d = computeDerivedStats(this.character);
      this.player.maxHp = d.maxHp;
      this.player.maxMana = d.maxMana;
      this.player.hp = Math.max(1, Math.round(d.maxHp * prevHpRatio));
      this.player.mana = Math.round(d.maxMana * prevManaRatio);
      this._emitHud();
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._lastTs = performance.now();
    const tick = (ts) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (ts - this._lastTs) / 1000);
      this._lastTs = ts;
      this.update(dt);
      this.renderer.render(this);
      this.callbacks.onAfterRender?.(this);
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  update(dt) {
    const inp = this.input.poll();

    if (inp.toggleRecord) {
      this.callbacks.onToggleRecord?.();
    }

    if (this.paused) {
      this.callbacks.onPausedInput?.(inp);
      return;
    }

    if (inp.pause) {
      this.callbacks.onPause?.();
      return;
    }

    this.time += dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3.5);

    const p = this.player;
    const derived = computeDerivedStats(this.character);
    const sp = SPECIES_BY_ID[this.character.speciesId];
    const cl = CLASS_BY_ID[this.character.classId];

    // Cooldowns & timers
    for (const k of Object.keys(p.cooldowns)) {
      if (p.cooldowns[k] > 0) p.cooldowns[k] = Math.max(0, p.cooldowns[k] - dt);
    }
    if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);
    if (p.hurtFlash > 0) p.hurtFlash = Math.max(0, p.hurtFlash - dt);
    if (p.dashTimer > 0) p.dashTimer = Math.max(0, p.dashTimer - dt);
    if (p.dashCooldown > 0) p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    if (p.hasteTimer > 0) p.hasteTimer = Math.max(0, p.hasteTimer - dt);
    if (p.buffDamageTimer > 0) {
      p.buffDamageTimer = Math.max(0, p.buffDamageTimer - dt);
      if (p.buffDamageTimer === 0) p.buffDamageMult = 1;
    }
    if (p.swingTimer > 0) p.swingTimer = Math.max(0, p.swingTimer - dt);

    // Passive mana regen
    p.mana = Math.min(p.maxMana, p.mana + derived.manaRegen * dt);

    // Aim direction: Xbox Right Stick > Mouse > Movement direction
    if (inp.hasAimStick) {
      p.aimAngle = Math.atan2(inp.aimY, inp.aimX);
    } else if (!this.input.gamepadConnected) {
      const worldMouseX = this.input.mouse.x + this.camX;
      const worldMouseY = this.input.mouse.y + this.camY;
      p.aimAngle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);
    } else if (Math.hypot(inp.moveX, inp.moveY) > 0.2) {
      p.aimAngle = Math.atan2(inp.moveY, inp.moveX);
    }

    // Movement
    const speedMult = (p.hasteTimer > 0 ? 1.38 : 1.0) * (p.dashTimer > 0 ? 2.45 : 1.0);
    const speed = derived.moveSpeed * speedMult;
    if (p.dashTimer > 0) {
      // maintain dash velocity
    } else {
      p.vx = inp.moveX * speed;
      p.vy = inp.moveY * speed;
    }
    this._moveWithCollision(p, p.vx * dt, p.vy * dt);

    // Find nearby interactive NPC / Chest / Sanctum Altar
    this._updateNearbyTarget();

    // Actions
    if (inp.interact && this.nearbyTarget) {
      this._triggerInteract(this.nearbyTarget);
    } else if (inp.dashOrInteract && !this.nearbyTarget && p.dashCooldown <= 0) {
      const dirX = Math.hypot(inp.moveX, inp.moveY) > 0.1 ? inp.moveX : Math.cos(p.aimAngle);
      const dirY = Math.hypot(inp.moveX, inp.moveY) > 0.1 ? inp.moveY : Math.sin(p.aimAngle);
      const len = Math.hypot(dirX, dirY) || 1;
      p.vx = (dirX / len) * derived.moveSpeed * 2.5;
      p.vy = (dirY / len) * derived.moveSpeed * 2.5;
      p.dashTimer = 0.18;
      p.dashCooldown = Math.max(0.45, 0.9 - derived.cdr);
      p.invuln = 0.24;
      this.audio?.playDash();
      this._spawnBurst(p.x, p.y, '#93c5fd', 8);
    }

    if (inp.classMelee && p.cooldowns.classMelee <= 0) {
      this._performMelee(cl.melee, 'classMelee', derived);
    }
    if (inp.racialMelee && p.cooldowns.racialMelee <= 0) {
      this._performMelee(sp.melee, 'racialMelee', derived);
    }
    if (inp.classSpell && p.cooldowns.classSpell <= 0) {
      this._castSpell(cl.spell, 'classSpell', derived);
    }
    if (inp.racialSpell && p.cooldowns.racialSpell <= 0) {
      this._castSpell(sp.spell, 'racialSpell', derived);
    }
    if (inp.cycleSpell && this.character.bonusSpells.length > 1) {
      this.equippedBonusIdx = (this.equippedBonusIdx + 1) % this.character.bonusSpells.length;
      const spell = BONUS_SPELLS[this.character.bonusSpells[this.equippedBonusIdx]];
      this._floatText(p.x, p.y - 32, `Equipped: ${spell.name}`, spell.color);
    }
    if (inp.bonusSpell && p.cooldowns.bonusSpell <= 0 && this.character.bonusSpells.length > 0) {
      const id = this.character.bonusSpells[this.equippedBonusIdx % this.character.bonusSpells.length];
      const spell = BONUS_SPELLS[id];
      if (spell) this._castSpell(spell, 'bonusSpell', derived);
    }
    if (inp.potion) {
      this._usePotion();
    }

    // Update world entities
    this._updateTraps(dt);
    this._updateEnemies(dt);
    this._updateProjectiles(dt);
    this._updateEffectsAndParticles(dt);

    // Smooth camera follow
    const targetCamX = p.x - this.canvas.width / 2;
    const targetCamY = p.y - this.canvas.height / 2;
    this.camX += (targetCamX - this.camX) * Math.min(1, dt * 8);
    this.camY += (targetCamY - this.camY) * Math.min(1, dt * 8);

    // Ambient temple particles when converted
    if (this.level.templeTheme && this.level.templeTheme !== 'corrupted' && Math.random() < 0.25) {
      const colors = { light: '#fef08a', fire: '#fb923c', water: '#38bdf8', earth: '#4ade80', air: '#c4b5fd', master: '#f472b6' };
      this.particles.push({
        x: this.camX + Math.random() * this.canvas.width,
        y: this.camY + Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 18,
        vy: -16 - Math.random() * 20,
        size: 2.5,
        color: colors[this.level.templeTheme] || '#facc15',
        life: 1.4,
        maxLife: 1.4,
      });
    }

    this._emitHud();
  }

  _usePotion() {
    if (this.character.potions <= 0) {
      this._floatText(this.player.x, this.player.y - 26, 'No Potions!', '#f87171');
      return;
    }
    if (this.player.hp >= this.player.maxHp && this.player.mana >= this.player.maxMana) return;
    this.character.potions--;
    const healAmt = Math.round(this.player.maxHp * 0.45);
    const manaAmt = Math.round(this.player.maxMana * 0.35);
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
    this.player.mana = Math.min(this.player.maxMana, this.player.mana + manaAmt);
    this.audio?.playHeal();
    this._spawnBurst(this.player.x, this.player.y, '#4ade80', 14);
    this._floatText(this.player.x, this.player.y - 26, `+${healAmt} HP`, '#4ade80', true);
  }

  _performMelee(melee, cdKey, derived) {
    const p = this.player;
    p.cooldowns[cdKey] = melee.cooldown * (1 - derived.cdr * 0.65);
    p.swingDuration = Math.min(0.28, melee.cooldown * 0.65);
    p.swingTimer = p.swingDuration;

    if (melee.dashBoost) {
      this._moveWithCollision(p, Math.cos(p.aimAngle) * melee.dashBoost * 0.14, Math.sin(p.aimAngle) * melee.dashBoost * 0.14);
    }

    this.audio?.playMelee(melee.damage >= 25);
    this.effects.push({
      kind: 'arc',
      x: p.x,
      y: p.y,
      angle: p.aimAngle,
      arc: melee.arc,
      range: melee.range,
      color: melee.color,
      life: 0.2,
      maxLife: 0.2,
    });

    // Check if hitting a neutral Elemental NPC -> provokes them into combat!
    this._checkProvokeElemental(p.x, p.y, melee.range + 22);

    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= melee.range + e.radius) {
        const ang = Math.atan2(dy, dx);
        const diff = Math.abs(Math.atan2(Math.sin(ang - p.aimAngle), Math.cos(ang - p.aimAngle)));
        if (diff <= melee.arc / 2 + 0.25) {
          const isCrit = Math.random() < derived.critChance;
          const dmg = Math.round(melee.damage * derived.meleeMult * p.buffDamageMult * (isCrit ? 1.6 : 1));
          this._damageEnemy(e, dmg, isCrit, ang, melee.knockback || 180, melee.stun || 0);
          if (melee.lifesteal) {
            const steal = Math.max(2, Math.round(dmg * melee.lifesteal));
            p.hp = Math.min(p.maxHp, p.hp + steal);
            this._floatText(p.x, p.y - 24, `+${steal}`, '#4ade80');
          }
        }
      }
    }
  }

  _castSpell(spell, cdKey, derived) {
    const p = this.player;
    if (p.mana < spell.manaCost) {
      this._floatText(p.x, p.y - 28, 'Low Mana!', '#60a5fa');
      return;
    }
    p.mana -= spell.manaCost;
    p.cooldowns[cdKey] = spell.cooldown * (1 - derived.cdr);
    this.audio?.playSpell(spell.type.includes('heal') ? 660 : 480);

    const dmgBase = (spell.damage || 0) * derived.spellMult * p.buffDamageMult;

    if (spell.heal) {
      p.hp = Math.min(p.maxHp, p.hp + spell.heal);
      this._floatText(p.x, p.y - 30, `+${spell.heal} HP`, '#4ade80', true);
      this.audio?.playHeal();
    }
    if (spell.shield) {
      p.shield = Math.min(120, p.shield + spell.shield);
      this._floatText(p.x, p.y - 44, `+${spell.shield} Shield`, '#38bdf8');
    }
    if (spell.hasteDuration) {
      p.hasteTimer = Math.max(p.hasteTimer, spell.hasteDuration);
    }
    if (spell.buffDamage) {
      p.buffDamageMult = spell.buffDamage;
      p.buffDamageTimer = spell.buffDuration || 5;
    }

    if (spell.type === 'beam') {
      this.effects.push({
        kind: 'beam',
        x: p.x,
        y: p.y,
        angle: p.aimAngle,
        range: spell.range || 320,
        width: spell.width || 22,
        color: spell.color,
        life: 0.28,
        maxLife: 0.28,
      });
      this._checkProvokeElemental(p.x + Math.cos(p.aimAngle) * 140, p.y + Math.sin(p.aimAngle) * 140, 140);
      const bx = Math.cos(p.aimAngle);
      const by = Math.sin(p.aimAngle);
      for (const e of this.enemies) {
        if (e.dead) continue;
        const rx = e.x - p.x;
        const ry = e.y - p.y;
        const proj = rx * bx + ry * by;
        if (proj > 0 && proj < (spell.range || 320)) {
          const perp = Math.abs(rx * -by + ry * bx);
          if (perp <= (spell.width || 22) + e.radius) {
            const isCrit = Math.random() < derived.critChance;
            this._damageEnemy(e, Math.round(dmgBase * (isCrit ? 1.55 : 1)), isCrit, p.aimAngle, 160, 0);
          }
        }
      }
    } else if (spell.type === 'cone') {
      const count = spell.count || 5;
      const spread = spell.spread || 0.7;
      for (let i = 0; i < count; i++) {
        const offset = count === 1 ? 0 : -spread / 2 + (spread * i) / (count - 1);
        const a = p.aimAngle + offset;
        this.projectiles.push({
          friendly: true,
          x: p.x + Math.cos(a) * 16,
          y: p.y + Math.sin(a) * 16,
          vx: Math.cos(a) * (spell.speed || 400),
          vy: Math.sin(a) * (spell.speed || 400),
          damage: Math.round(dmgBase),
          color: spell.color,
          size: 7,
          life: (spell.range || 240) / (spell.speed || 400),
        });
      }
    } else if (spell.type === 'projectile_explode' || spell.type === 'projectile_pierce') {
      this.projectiles.push({
        friendly: true,
        x: p.x + Math.cos(p.aimAngle) * 18,
        y: p.y + Math.sin(p.aimAngle) * 18,
        vx: Math.cos(p.aimAngle) * (spell.speed || 360),
        vy: Math.sin(p.aimAngle) * (spell.speed || 360),
        damage: Math.round(dmgBase),
        color: spell.color,
        size: spell.size || 10,
        explodeRadius: spell.type === 'projectile_explode' ? spell.radius || 90 : 0,
        pierce: spell.type === 'projectile_pierce',
        slowDuration: spell.slowDuration || 0,
        hitIds: new Set(),
        life: 1.4,
      });
    } else if (spell.type === 'homing' || spell.type === 'homing_haste') {
      const count = spell.count || 4;
      for (let i = 0; i < count; i++) {
        const a = p.aimAngle + ((i - (count - 1) / 2) * 0.45);
        this.projectiles.push({
          friendly: true,
          homing: true,
          x: p.x + Math.cos(a) * 18,
          y: p.y + Math.sin(a) * 18,
          vx: Math.cos(a) * (spell.speed || 320),
          vy: Math.sin(a) * (spell.speed || 320),
          speed: spell.speed || 320,
          damage: Math.round(dmgBase),
          color: spell.color,
          size: 8,
          life: 2.2,
        });
      }
    } else if (spell.type === 'radial_explode') {
      const count = spell.count || 8;
      for (let i = 0; i < count; i++) {
        const a = (i * Math.PI * 2) / count;
        this.projectiles.push({
          friendly: true,
          x: p.x + Math.cos(a) * 18,
          y: p.y + Math.sin(a) * 18,
          vx: Math.cos(a) * (spell.speed || 320),
          vy: Math.sin(a) * (spell.speed || 320),
          damage: Math.round(dmgBase),
          color: spell.color,
          size: 9,
          explodeRadius: spell.radius || 75,
          life: 1.1,
        });
      }
    } else if (spell.type === 'dash_nova') {
      this._moveWithCollision(p, Math.cos(p.aimAngle) * (spell.dashDist || 150), Math.sin(p.aimAngle) * (spell.dashDist || 150));
      this._triggerNova(p.x, p.y, spell.radius || 110, Math.round(dmgBase), spell.color, 260, 0);
    } else if (spell.type === 'convergence') {
      this._triggerNova(p.x, p.y, spell.radius || 200, Math.round(dmgBase), '#fde047', 380, 3.0);
      const colors = ['#ff5722', '#00d2ff', '#2ecc71', '#a29bfe'];
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI * 2) / 8;
        this.projectiles.push({
          friendly: true,
          homing: true,
          x: p.x + Math.cos(a) * 24,
          y: p.y + Math.sin(a) * 24,
          vx: Math.cos(a) * 360,
          vy: Math.sin(a) * 360,
          speed: 380,
          damage: Math.round(dmgBase * 0.55),
          color: colors[i % 4],
          size: 9,
          life: 2.4,
        });
      }
    } else {
      // nova / nova_shield / nova_heal / nova_slow / nova_slow_heal / nova_haste / buff_heal
      this._triggerNova(
        p.x,
        p.y,
        spell.radius || 120,
        Math.round(dmgBase),
        spell.color,
        spell.knockback || 240,
        spell.slowDuration || 0
      );
    }
  }

  _triggerNova(x, y, radius, damage, color, knockback, slowDuration) {
    this.effects.push({ kind: 'nova', x, y, radius, color, life: 0.34, maxLife: 0.34 });
    this._spawnBurst(x, y, color, 16);
    if (damage <= 0) return;
    this._checkProvokeElemental(x, y, radius);
    const derived = computeDerivedStats(this.character);
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dist = Math.hypot(e.x - x, e.y - y);
      if (dist <= radius + e.radius) {
        const ang = Math.atan2(e.y - y, e.x - x);
        const isCrit = Math.random() < derived.critChance;
        this._damageEnemy(e, Math.round(damage * (isCrit ? 1.5 : 1)), isCrit, ang, knockback, 0);
        if (slowDuration > 0) e.slowTimer = Math.max(e.slowTimer, slowDuration);
      }
    }
  }

  _checkProvokeElemental(x, y, radius) {
    for (const npc of this.npcs) {
      if (npc.convertedToEnemy || npc.allied) continue;
      if (npc.role?.startsWith('elemental_')) {
        if (Math.hypot(npc.x - x, npc.y - y) <= radius + 24) {
          this.convertNpcToBoss(npc);
        }
      }
    }
  }

  convertNpcToBoss(npc) {
    if (npc.convertedToEnemy) return;
    npc.convertedToEnemy = true;
    npc.allied = false;
    const isPriest = npc.role === 'priest';
    this.enemies.push({
      id: `boss_${npc.id}`,
      npcId: npc.id,
      name: isPriest ? 'High Priest Aldric, Warden of Light' : npc.name,
      kind: isPriest ? 'priest_boss' : npc.role,
      element: npc.element || 'light',
      isBoss: true,
      isElementalBoss: !isPriest,
      x: npc.x,
      y: npc.y,
      hp: isPriest ? 360 : npc.maxHp || 320,
      maxHp: isPriest ? 360 : npc.maxHp || 320,
      damage: isPriest ? 20 : npc.damage || 19,
      color: isPriest ? '#facc15' : npc.color,
      accent: npc.accent,
      radius: 24,
      vx: 0,
      vy: 0,
      attackCd: 1.0,
      hurtFlash: 0,
      stunTimer: 0,
      slowTimer: 0,
      dead: false,
    });
    this.audio?.setMusicMode('boss');
    this._floatText(npc.x, npc.y - 44, `${npc.name} attacks!`, '#ef4444', true);
  }

  _damageEnemy(e, dmg, isCrit, angle, knockback, stun) {
    e.hp -= dmg;
    e.hurtFlash = 0.14;
    if (stun > 0) e.stunTimer = Math.max(e.stunTimer, stun);
    e.vx += Math.cos(angle) * knockback;
    e.vy += Math.sin(angle) * knockback;
    this.shake = Math.max(this.shake, isCrit ? 0.55 : 0.28);
    this.audio?.playHit(isCrit);
    this.input?.rumble(isCrit ? 120 : 65, isCrit ? 0.55 : 0.25, 0.2);
    this._spawnBurst(e.x, e.y, isCrit ? '#fde047' : e.color, isCrit ? 12 : 7);
    this._floatText(e.x, e.y - 20, isCrit ? `${dmg}!` : `${dmg}`, isCrit ? '#fde047' : '#ffffff', isCrit);

    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      this.kills++;
      this.character.gold += e.isBoss ? 120 : 18;
      this._spawnBurst(e.x, e.y, e.color, 22);
      this._floatText(e.x, e.y - 34, e.isBoss ? `BOSS DEFEATED!` : `+18 Gold`, '#facc15', e.isBoss);

      if (e.isElementalBoss && e.element) {
        if (!this.story.defeatedElements.includes(e.element)) {
          this.story.defeatedElements.push(e.element);
        }
        this.callbacks.onBanner?.(
          `${e.name} Vanquished! (${this.story.defeatedElements.length}/4 Elementals Defeated)`
        );
      } else if (e.kind === 'priest_boss') {
        this.story.priestDefeated = true;
        this.callbacks.onBanner?.('High Priest Aldric Defeated!');
      }

      const anyBossAlive = this.enemies.some((en) => !en.dead && en.isBoss);
      if (!anyBossAlive) this.audio?.setMusicMode('dungeon');
    }
  }

  _damagePlayer(dmg, sourceName = 'Dungeon Hazard') {
    const p = this.player;
    if (p.invuln > 0 || this.gameOver) return;
    let remaining = dmg;
    if (p.shield > 0) {
      const absorbed = Math.min(p.shield, remaining);
      p.shield -= absorbed;
      remaining -= absorbed;
    }
    if (remaining > 0) {
      p.hp = Math.max(0, p.hp - remaining);
      p.hurtFlash = 0.22;
      p.invuln = 0.55;
      this.shake = Math.max(this.shake, 0.5);
      this.audio?.playPlayerHurt();
      this.input?.rumble(140, 0.65, 0.4);
      this._floatText(p.x, p.y - 26, `-${remaining}`, '#ef4444', true);
    } else {
      this._floatText(p.x, p.y - 26, 'Blocked!', '#38bdf8');
    }

    if (p.hp <= 0) {
      p.hp = 0;
      this.gameOver = true;
      this.paused = true;
      this.shake = 0.9;
      this._spawnBurst(p.x, p.y, '#ef4444', 28);
      this.audio?.playGameOver();
      this.input?.rumble(320, 0.9, 0.7);
      this._emitHud();
      this.callbacks.onGameOver?.({
        killerName: sourceName,
        levelName: this.level.name,
        kills: this.kills,
        chestsOpened: this.chestsOpened,
      });
    }
  }

  _updateTraps(dt) {
    const p = this.player;
    for (const t of this.traps) {
      t.timer += dt;
      if (t.hitCd > 0) t.hitCd -= dt;
      const cycle = t.interval || 2.5;
      t.active = (t.timer % cycle) > cycle * 0.62;
      if (t.active && t.hitCd <= 0 && Math.hypot(p.x - t.x, p.y - t.y) < 26) {
        t.hitCd = 0.8;
        const trapLabel = t.kind === 'fire_jet' ? 'Fire Jet Trap' : t.kind === 'arcane_rune' ? 'Arcane Rune Trap' : 'Spike Trap';
        this._damagePlayer(t.damage || 14, trapLabel);
      }
    }
  }

  _updateEnemies(dt) {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.hurtFlash > 0) e.hurtFlash -= dt;
      if (e.stunTimer > 0) {
        e.stunTimer -= dt;
        e.vx *= 0.85;
        e.vy *= 0.85;
        this._moveWithCollision(e, e.vx * dt, e.vy * dt);
        continue;
      }
      if (e.slowTimer > 0) e.slowTimer -= dt;

      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.hypot(dx, dy);
      const aggroRange = e.isBoss ? 520 : 320;

      if (dist < aggroRange && dist > 1) {
        const moveSpd = (e.isBoss ? 92 : 82) * (e.slowTimer > 0 ? 0.45 : 1);
        const targetVx = (dx / dist) * moveSpd;
        const targetVy = (dy / dist) * moveSpd;
        e.vx += (targetVx - e.vx) * Math.min(1, dt * 6);
        e.vy += (targetVy - e.vy) * Math.min(1, dt * 6);

        // Contact damage
        if (dist < e.radius + p.radius + 4) {
          this._damagePlayer(e.damage, e.name || 'Enemy');
        }

        // Boss / ranged projectiles
        e.attackCd -= dt;
        if (e.attackCd <= 0) {
          if (e.isBoss) {
            e.attackCd = 1.65;
            const baseAng = Math.atan2(dy, dx);
            const shots = e.kind === 'priest_boss' ? 5 : 4;
            for (let i = 0; i < shots; i++) {
              const a = baseAng + (i - (shots - 1) / 2) * 0.28;
              this.projectiles.push({
                friendly: false,
                sourceName: e.name || 'Boss',
                x: e.x + Math.cos(a) * 20,
                y: e.y + Math.sin(a) * 20,
                vx: Math.cos(a) * 240,
                vy: Math.sin(a) * 240,
                damage: Math.round(e.damage * 0.85),
                color: e.color || '#ef4444',
                size: 8,
                life: 2.0,
              });
            }
          } else if (e.kind === 'cultist' || e.kind === 'flame_imp' || e.kind === 'frost_wraith') {
            e.attackCd = 2.4;
            const a = Math.atan2(dy, dx);
            this.projectiles.push({
              friendly: false,
              sourceName: e.name || 'Enemy',
              x: e.x,
              y: e.y,
              vx: Math.cos(a) * 210,
              vy: Math.sin(a) * 210,
              damage: Math.round(e.damage * 0.8),
              color: e.color,
              size: 6,
              life: 1.6,
            });
          }
        }
      } else {
        e.vx *= 0.88;
        e.vy *= 0.88;
      }

      this._moveWithCollision(e, e.vx * dt, e.vy * dt);
    }
  }

  _updateProjectiles(dt) {
    const p = this.player;
    const derived = computeDerivedStats(this.character);
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      if (pr.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (pr.homing && pr.friendly) {
        let best = null;
        let bestD = 360;
        for (const e of this.enemies) {
          if (e.dead) continue;
          const d = Math.hypot(e.x - pr.x, e.y - pr.y);
          if (d < bestD) {
            bestD = d;
            best = e;
          }
        }
        if (best) {
          const desired = Math.atan2(best.y - pr.y, best.x - pr.x);
          const spd = pr.speed || 340;
          pr.vx += (Math.cos(desired) * spd - pr.vx) * Math.min(1, dt * 6);
          pr.vy += (Math.sin(desired) * spd - pr.vy) * Math.min(1, dt * 6);
        }
      }

      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      // Wall collision
      if (this._isSolidWorld(pr.x, pr.y)) {
        if (pr.explodeRadius) {
          this._triggerNova(pr.x, pr.y, pr.explodeRadius, pr.damage, pr.color, 220, 0);
        } else {
          this._spawnBurst(pr.x, pr.y, pr.color, 5);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      if (pr.friendly) {
        this._checkProvokeElemental(pr.x, pr.y, 20);
        let consumed = false;
        for (const e of this.enemies) {
          if (e.dead) continue;
          if (pr.hitIds?.has(e.id)) continue;
          if (Math.hypot(e.x - pr.x, e.y - pr.y) <= e.radius + (pr.size || 7)) {
            if (pr.explodeRadius) {
              this._triggerNova(pr.x, pr.y, pr.explodeRadius, pr.damage, pr.color, 240, pr.slowDuration || 0);
              consumed = true;
              break;
            }
            const isCrit = Math.random() < derived.critChance;
            this._damageEnemy(e, Math.round(pr.damage * (isCrit ? 1.5 : 1)), isCrit, Math.atan2(pr.vy, pr.vx), 120, 0);
            if (pr.slowDuration) e.slowTimer = Math.max(e.slowTimer, pr.slowDuration);
            if (pr.pierce) {
              pr.hitIds.add(e.id);
            } else {
              consumed = true;
              break;
            }
          }
        }
        if (consumed) this.projectiles.splice(i, 1);
      } else {
        if (Math.hypot(p.x - pr.x, p.y - pr.y) <= p.radius + (pr.size || 7)) {
          this._damagePlayer(pr.damage, pr.sourceName || 'Enemy Spell');
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  _updateEffectsAndParticles(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      this.effects[i].life -= dt;
      if (this.effects[i].life <= 0) this.effects.splice(i, 1);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= 32 * dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  _updateNearbyTarget() {
    const p = this.player;
    let best = null;
    let bestDist = 74;

    for (const npc of this.npcs) {
      if (npc.convertedToEnemy) continue;
      const d = Math.hypot(npc.x - p.x, npc.y - p.y);
      if (d < bestDist) {
        bestDist = d;
        best = { type: 'npc', entity: npc, label: `[A / F] Talk to ${npc.name}` };
      }
    }

    for (const chest of this.chests) {
      if (chest.opened) continue;
      const d = Math.hypot(chest.x - p.x, chest.y - p.y);
      if (d < bestDist) {
        bestDist = d;
        best = { type: 'chest', entity: chest, label: `[A / F] Open Treasure Chest` };
      }
    }

    // Branch 3 Altar Claim Check
    if (
      this.level.isTempleCampaign &&
      this.story.branch === 'betray_all' &&
      !this.story.endingCompleted &&
      this.story.defeatedElements.length === 4 &&
      this.story.priestDefeated
    ) {
      const ax = 18 * TILE_SIZE;
      const ay = 13 * TILE_SIZE;
      const d = Math.hypot(ax - p.x, ay - p.y);
      if (d < 105) {
        best = { type: 'altar', entity: { x: ax, y: ay }, label: `[A / F] Claim the Temple as Master of the Four Elements` };
      }
    }

    this.nearbyTarget = best;
  }

  _triggerInteract(target) {
    if (target.type === 'chest') {
      const c = target.entity;
      c.opened = true;
      this.chestsOpened++;
      this.audio?.playChest();
      this._spawnBurst(c.x, c.y, '#facc15', 18);
      const rewards = [];
      if (c.gold) {
        this.character.gold += c.gold;
        rewards.push(`+${c.gold} Gold`);
      }
      if (c.potions) {
        const space = Math.max(0, MAX_POTIONS - this.character.potions);
        const added = Math.min(space, c.potions);
        this.character.potions += added;
        if (added > 0) {
          rewards.push(`+${added} Potion${added > 1 ? 's' : ''}${added < c.potions ? ' (Max)' : ''}`);
        } else {
          rewards.push(`Potions Full (${MAX_POTIONS}/${MAX_POTIONS})`);
        }
      }
      if (c.lootType === 'spell' && c.lootValue && BONUS_SPELLS[c.lootValue]) {
        this._grantBonusSpell(c.lootValue);
        rewards.push(`Spell: ${BONUS_SPELLS[c.lootValue].name}`);
      }
      this._floatText(c.x, c.y - 26, rewards.join(' | ') || 'Looted!', '#fde047', true);
      return;
    }

    if (target.type === 'altar') {
      this._completeBranch3Ending();
      return;
    }

    if (target.type === 'npc') {
      this._openNpcDialogue(target.entity);
    }
  }

  _openNpcDialogue(npc) {
    // Handle Temple Campaign branching dialogues
    if (this.level.isTempleCampaign) {
      if (npc.role === 'priest') {
        return this._openPriestDialogue(npc);
      }
      if (npc.role?.startsWith('elemental_')) {
        return this._openElementalDialogue(npc);
      }
    }

    // Generic / Custom Level Builder NPC with optional quest & reward
    const choices = [];
    let body = npc.dialogue || 'Greetings, traveler.';

    if (npc.quest) {
      const q = npc.quest;
      if (npc.questCompleted) {
        body = `Thank you again, ${this.character.name}! Your heroism will be remembered.`;
      } else if (!npc.questAccepted) {
        choices.push({
          label: `Accept Mission: ${q.title}`,
          primary: true,
          action: () => {
            npc.questAccepted = true;
            this.callbacks.onBanner?.(`Mission Accepted: ${q.title}`);
          },
        });
      } else {
        const progress = q.objectiveType === 'open_chests' ? this.chestsOpened : this.kills;
        if (progress >= (q.targetCount || 1)) {
          body = `You completed "${q.title}"! Claim your reward, hero.`;
          choices.push({
            label: `Claim Reward (+${q.rewardGold || 100} Gold${q.rewardSpell ? ` & ${BONUS_SPELLS[q.rewardSpell]?.name}` : ''})`,
            primary: true,
            action: () => {
              npc.questCompleted = true;
              this.character.gold += q.rewardGold || 100;
              if (q.rewardSpell) this._grantBonusSpell(q.rewardSpell);
              if (q.rewardTitle) this.character.title = q.rewardTitle;
              this.audio?.playFanfare();
              this.callbacks.onBanner?.(`Mission Complete! Reward Claimed!`);
            },
          });
        } else {
          body = `Progress on "${q.title}": ${progress}/${q.targetCount || 1}. Return once finished!`;
        }
      }
    }

    choices.push({ label: 'Farewell', action: () => {} });
    this.callbacks.onOpenDialogue?.({ speaker: npc.name, role: npc.role || 'villager', text: body, choices });
  }

  _openPriestDialogue(npc) {
    const s = this.story;
    // If player allied with an elemental (Branch 2 or Branch 3) -> Priest confronts you as a heretic!
    if (s.alliedElements.length > 0 && !s.priestDefeated) {
      this.callbacks.onOpenDialogue?.({
        speaker: npc.name,
        role: npc.role || 'priest',
        text: 'What foul elemental aura clings to you?! You have made a pact with the demons that defiled our sanctum! By the Fourfold Light, I shall purge your heresy myself!',
        choices: [
          {
            label: 'Fight High Priest Aldric!',
            primary: true,
            action: () => this.convertNpcToBoss(npc),
          },
        ],
      });
      return;
    }

    // Branch 1 Victory: Defeated all 4 elementals faithfully
    if (s.defeatedElements.length === 4 && s.alliedElements.length === 0 && !s.endingCompleted) {
      this.callbacks.onOpenDialogue?.({
        speaker: npc.name,
        role: npc.role || 'priest',
        text: 'Praise the Light! All four elemental demons have been banished and our worshippers can return in peace. Kneel, champion—I hereby ordain you a Disciple of the Fourfold Light and bestow upon you the sacred Exorcism spell!',
        choices: [
          {
            label: 'Accept Ordination & Learn Exorcism (Branch 1 Ending)',
            primary: true,
            action: () => {
              s.branch = 'light';
              s.endingCompleted = 'light';
              npc.questCompleted = true;
              this.character.title = 'Disciple of the Fourfold Light';
              this.character.gold += 250;
              this._grantBonusSpell('exorcism');
              this.level.templeTheme = 'light';
              this.audio?.setMusicMode('victory');
              this.audio?.playFanfare();
              this.callbacks.onBanner?.('BRANCH 1 COMPLETE: Disciple of the Light! Learned Exorcism!');
            },
          },
        ],
      });
      return;
    }

    if (s.endingCompleted === 'light') {
      this.callbacks.onOpenDialogue?.({
        speaker: npc.name,
        role: npc.role || 'priest',
        text: `Welcome home, ${this.character.name}, Disciple of the Fourfold Light. The temple shines brightly thanks to your valor!`,
        choices: [{ label: 'May the Light endure', action: () => {} }],
      });
      return;
    }

    const choices = [];
    if (!s.questAccepted) {
      choices.push({
        label: 'Accept Mission: Free the Temple from the 4 Elemental Demons',
        primary: true,
        action: () => {
          s.questAccepted = true;
          npc.questAccepted = true;
          this.callbacks.onBanner?.('Mission Accepted: Free the Fourfold Temple (0/4 Elementals)');
        },
      });
    }
    choices.push({ label: 'I will return soon', action: () => {} });
    this.callbacks.onOpenDialogue?.({
      speaker: npc.name,
      role: npc.role || 'priest',
      text: s.questAccepted
        ? `Elemental demons banished so far: ${s.defeatedElements.length}/4. Venture into all four wings and cleanse our sanctum!`
        : npc.dialogue,
      choices,
    });
  }

  _openElementalDialogue(npc) {
    const s = this.story;
    const elem = npc.element;
    const spell = BONUS_SPELLS[npc.pactSpell];

    // If this elemental is our sole ally and we finished defeating the other 3 elementals + the Priest -> Branch 2 Victory!
    if (npc.allied && s.branch === `ally_${elem}`) {
      const otherDefeated = s.defeatedElements.filter((e) => e !== elem).length;
      if (otherDefeated >= 3 && s.priestDefeated && !s.endingCompleted) {
        const domainNames = { fire: 'Flame', water: 'the Abyss', earth: 'Stone', air: 'Gales' };
        this.callbacks.onOpenDialogue?.({
          speaker: npc.name,
          role: npc.role,
          text: `Magnificent! My three rivals lie broken and the Priest is no more. I name you Disciple of ${domainNames[elem]}! Behold as this temple is reborn in our eternal element!`,
          choices: [
            {
              label: `Convert the Temple to ${domainNames[elem]} (Branch 2 Ending)`,
              primary: true,
              action: () => {
                s.endingCompleted = `ally_${elem}`;
                this.character.title = `Disciple of ${domainNames[elem]}`;
                this.character.gold += 300;
                this.level.templeTheme = elem;
                this.audio?.setMusicMode('victory');
                this.audio?.playFanfare();
                this.callbacks.onBanner?.(
                  `BRANCH 2 COMPLETE: Disciple of ${domainNames[elem]}! Temple Converted!`
                );
              },
            },
          ],
        });
        return;
      }

      if (s.endingCompleted === `ally_${elem}`) {
        this.callbacks.onOpenDialogue?.({
          speaker: npc.name,
          role: npc.role,
          text: `The temple pulses with our dominion, ${this.character.title}. None shall ever challenge us again.`,
          choices: [{ label: 'Long live our pact', action: () => {} }],
        });
        return;
      }

      this.callbacks.onOpenDialogue?.({
        speaker: npc.name,
        role: npc.role,
        text: `Use my ${spell.name} well! Defeat the other 3 elementals (${otherDefeated}/3 done) and slay High Priest Aldric (${s.priestDefeated ? 'Done' : 'Alive'}), then return to me to convert the temple!`,
        choices: [{ label: 'It shall be done', action: () => {} }],
      });
      return;
    }

    // Fresh Elemental Encounter: Fight OR Ally (Branch 2) OR Pretend to Ally (Branch 3)!
    const alreadyAlliedCount = s.alliedElements.length;
    const allyLabel =
      alreadyAlliedCount === 0
        ? `Ally with ${npc.name} (Gain ${spell.name} — Branch 2)`
        : `Pretend to Ally with ${npc.name} (Gain ${spell.name} — ${alreadyAlliedCount + 1}/4 Deception!)`;

    this.callbacks.onOpenDialogue?.({
      speaker: npc.name,
      role: npc.role,
      text: npc.dialogue,
      choices: [
        {
          label: `Refuse & Banish ${npc.name}! (Combat)`,
          action: () => this.convertNpcToBoss(npc),
        },
        {
          label: allyLabel,
          primary: true,
          action: () => this._handleElementalAlliance(npc),
        },
        { label: 'Step back for now', action: () => {} },
      ],
    });
  }

  _handleElementalAlliance(npc) {
    const s = this.story;
    const elem = npc.element;
    npc.allied = true;
    if (!s.alliedElements.includes(elem)) {
      s.alliedElements.push(elem);
    }
    this._grantBonusSpell(npc.pactSpell);
    this.audio?.playFanfare();

    if (s.alliedElements.length === 1) {
      s.branch = `ally_${elem}`;
      this.callbacks.onBanner?.(
        `Pact Forged with ${npc.name}! Learned ${BONUS_SPELLS[npc.pactSpell].name}. Defeat the other 3 elementals & the Priest!`
      );
    } else if (s.alliedElements.length < 4) {
      this.callbacks.onBanner?.(
        `Deception (${s.alliedElements.length}/4): Pretended to ally with ${npc.name} & gained ${BONUS_SPELLS[npc.pactSpell].name}!`
      );
    } else {
      // ALL 4 PRETEND ALLIANCES ACHIEVED -> BRANCH 3 SHOWDOWN!
      s.branch = 'betray_all';
      this.callbacks.onBanner?.(
        'BRANCH 3 TRIGGERED! All 4 Elementals realized your deception! Defeat ALL 4 Elementals & High Priest Aldric!'
      );
      // Turn ALL 4 elementals AND High Priest Aldric into hostile bosses!
      for (const n of this.npcs) {
        if (!n.convertedToEnemy && (n.role?.startsWith('elemental_') || n.role === 'priest')) {
          this.convertNpcToBoss(n);
        }
      }
    }
  }

  _completeBranch3Ending() {
    this.story.endingCompleted = 'master';
    this.character.title = 'Master of the Four Elements';
    this.character.gold += 500;
    this._grantBonusSpell('fourfold_convergence');
    this.level.templeTheme = 'master';
    this.audio?.setMusicMode('victory');
    this.audio?.playFanfare();
    this._spawnBurst(this.player.x, this.player.y, '#fde047', 40);
    this.callbacks.onBanner?.(
      `BRANCH 3 COMPLETE: ${this.character.name} is Master of the Four Elements! The Temple is now YOURS!`
    );
  }

  _grantBonusSpell(spellId) {
    if (!BONUS_SPELLS[spellId]) return;
    if (!this.character.bonusSpells.includes(spellId)) {
      this.character.bonusSpells.push(spellId);
      this.equippedBonusIdx = this.character.bonusSpells.length - 1;
    }
  }

  _moveWithCollision(ent, dx, dy) {
    const r = ent.radius || 14;
    const nx = ent.x + dx;
    if (
      !this._isSolidWorld(nx - r, ent.y - r) &&
      !this._isSolidWorld(nx + r, ent.y - r) &&
      !this._isSolidWorld(nx - r, ent.y + r) &&
      !this._isSolidWorld(nx + r, ent.y + r)
    ) {
      ent.x = nx;
    }
    const ny = ent.y + dy;
    if (
      !this._isSolidWorld(ent.x - r, ny - r) &&
      !this._isSolidWorld(ent.x + r, ny - r) &&
      !this._isSolidWorld(ent.x - r, ny + r) &&
      !this._isSolidWorld(ent.x + r, ny + r)
    ) {
      ent.y = ny;
    }
  }

  _isSolidWorld(wx, wy) {
    const gx = Math.floor(wx / TILE_SIZE);
    const gy = Math.floor(wy / TILE_SIZE);
    if (gx < 0 || gy < 0 || gx >= this.level.width || gy >= this.level.height) return true;
    const tileId = this.level.tiles[gy][gx];
    return Boolean(TILE_DEFS[tileId]?.solid);
  }

  _spawnBurst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        size: 2.5 + Math.random() * 3,
        color,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
      });
    }
  }

  _floatText(x, y, text, color = '#ffffff', big = false) {
    this.floatingTexts.push({ x, y, text, color, big, life: big ? 1.35 : 0.9 });
  }

  _emitHud() {
    this.callbacks.onHudUpdate?.({
      character: this.character,
      player: this.player,
      story: this.story,
      level: this.level,
      equippedBonusSpell:
        this.character.bonusSpells.length > 0
          ? BONUS_SPELLS[this.character.bonusSpells[this.equippedBonusIdx % this.character.bonusSpells.length]]
          : null,
      kills: this.kills,
      chestsOpened: this.chestsOpened,
    });
  }
}
