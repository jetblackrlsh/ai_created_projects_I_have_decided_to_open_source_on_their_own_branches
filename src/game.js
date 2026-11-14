import * as THREE from 'three';
import { sound } from './audio.js';
import { InputManager, PAD_BTN } from './input.js';
import { AdventureLogger } from './logger.js';
import { ReplayRecorder } from './recorder.js';
import { drawReplayFrame } from './compositor.js';
import {
  MATERIALS_META,
  BLADE_MATERIALS,
  BLADE_STYLES,
  BLADE_ENCHANTS,
  ARMOR_PLATES,
  ARMOR_RUNES,
  WAND_CORES,
  WAND_SHAFTS,
  createBlade,
  createArmor,
  createWand,
  getDurabilityRatio,
  getConditionLabel,
  getEffectivenessMultiplier,
  computeCraftCost,
  getRepairCost,
  canAfford,
  spendMaterials,
} from './gear.js';
import { ProceduralWorld, WORLD_RADIUS, BIOME_CONFIG } from './world.js';
import {
  createPlayerRig,
  updatePlayerGearVisuals,
  createMonsterRig,
  createCampsiteMesh,
  createMineEntranceMesh,
  createOreMesh,
} from './models.js';

export class IronboundGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');
    this.input = new InputManager(this.canvas);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.2, 320);

    this.forgeDialog = document.getElementById('forge-dialog');
    this.pauseDialog = document.getElementById('pause-dialog');
    this.gameoverDialog = document.getElementById('gameover-dialog');

    this.seed = Math.floor(100000 + Math.random() * 899999);
    this.clock = new THREE.Clock();
    this.lastPadNavTime = 0;
    this.staminaWarned = false;
    this.logger = new AdventureLogger(this.seed);
    this.recorder = new ReplayRecorder();
    this.dayTransitionTimer = 0;
    this.lastForgeAction = '';
    this.lastForgeActionTimer = 0;

    this._bindUI();
    this._bindAudioUnlock();
    this.startNewWorld(this.seed);
    window.addEventListener('resize', () => this._onResize());
    requestAnimationFrame(() => this._loop());
  }

  _bindAudioUnlock() {
    const unlock = () => sound.ensureCtx();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  _bindUI() {
    // Tabs in Forge
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => this._switchForgeTab(btn.dataset.tab));
    });

    document.getElementById('forge-close-btn').addEventListener('click', () => {
      this.forgeDialog.close('close');
    });

    this.forgeDialog.addEventListener('close', () => {
      this.forgeDialog.returnValue = '';
    });
    this.pauseDialog.addEventListener('close', () => {
      this.pauseDialog.returnValue = '';
    });
    this.gameoverDialog.addEventListener('close', () => {
      this.gameoverDialog.returnValue = '';
    });

    document.getElementById('btn-rest-camp').addEventListener('click', () => this._restAtCamp());

    const catSel = document.getElementById('craft-category');
    const partA = document.getElementById('craft-part-a');
    const partB = document.getElementById('craft-part-b');
    const partC = document.getElementById('craft-part-c');
    catSel.addEventListener('change', () => this._populateCraftOptions());
    partA.addEventListener('change', () => this._updateCraftPreview());
    partB.addEventListener('change', () => this._updateCraftPreview());
    partC.addEventListener('change', () => this._updateCraftPreview());
    document.getElementById('btn-forge-item').addEventListener('click', () => this._forgeSelectedItem());

    document.getElementById('pause-resume-btn').addEventListener('click', () => this.pauseDialog.close());
    document.getElementById('btn-toggle-audio').addEventListener('click', (e) => {
      sound.setEnabled(!sound.enabled);
      e.target.textContent = `Sound: ${sound.enabled ? 'ON' : 'OFF'}`;
    });
    document.getElementById('btn-new-world').addEventListener('click', () => {
      this.pauseDialog.close();
      this.startNewWorld(Math.floor(100000 + Math.random() * 899999));
    });

    document.getElementById('btn-retry-seed').addEventListener('click', () => {
      this.gameoverDialog.close();
      this.startNewWorld(this.seed);
    });
    document.getElementById('btn-gameover-new').addEventListener('click', () => {
      this.gameoverDialog.close();
      this.startNewWorld(Math.floor(100000 + Math.random() * 899999));
    });

    const dlLog = () => {
      this.logger.download(this.stats);
      this.toast('Adventure Event Log (.txt) downloaded!');
    };
    const dlReplay = () => {
      if (this.recorder.download(this.seed)) {
        this.toast('Replay video (.webm) downloaded!');
      } else {
        this.toast('No replay video captured yet.', true);
      }
    };
    document.getElementById('btn-pause-log').addEventListener('click', dlLog);
    document.getElementById('btn-download-log').addEventListener('click', dlLog);
    document.getElementById('btn-pause-replay').addEventListener('click', dlReplay);
    document.getElementById('btn-download-replay').addEventListener('click', dlReplay);
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  startNewWorld(seed) {
    this.seed = seed;
    document.getElementById('world-seed-display').textContent = String(seed);

    // Clear old scene
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    this.scene.background = new THREE.Color(0x162032);
    this.scene.fog = new THREE.FogExp2(0x162032, 0.0085);

    // Lighting
    const hemi = new THREE.HemisphereLight(0xcbd5e1, 0x1e293b, 0.75);
    this.scene.add(hemi);
    this.hemiLight = hemi;

    const sun = new THREE.DirectionalLight(0xfffbeb, 1.35);
    sun.position.set(45, 70, 35);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 5;
    sun.shadow.camera.far = 200;
    const d = 65;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    this.scene.add(sun);
    this.sunLight = sun;

    this.world = new ProceduralWorld(seed);
    this.scene.add(this.world.buildTerrainMesh());

    // Build Campsites
    this.campsiteVisuals = [];
    for (const c of this.world.campsites) {
      const y = this.world.getHeight(c.x, c.z);
      const vis = createCampsiteMesh();
      vis.group.position.set(c.x, y, c.z);
      this.scene.add(vis.group);
      this.campsiteVisuals.push(vis);
    }

    // Build Mines
    for (const m of this.world.mines) {
      const y = this.world.getHeight(m.x, m.z);
      const mesh = createMineEntranceMesh();
      mesh.position.set(m.x, y, m.z);
      this.scene.add(mesh);
    }

    // Build Ore & Timber Nodes
    this.oreMeshes = new Map();
    for (const node of this.world.oreNodes) {
      const y = this.world.getHeight(node.x, node.z);
      const mesh = createOreMesh(node.kind);
      mesh.position.set(node.x, y, node.z);
      this.scene.add(mesh);
      this.oreMeshes.set(node.id, mesh);
    }

    // Build Biome-Specific Trees, Cacti & Rocks
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
    const leafMatMeadow = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85, flatShading: true });
    const leafMatForest = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.85, flatShading: true });
    const leafMatTundra = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8, flatShading: true });
    const cactusMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85, flatShading: true });

    for (const t of this.world.trees) {
      const y = this.world.getHeight(t.x, t.z);
      const g = new THREE.Group();
      if (t.biome === 'desert') {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * t.scale, 0.28 * t.scale, 2.5 * t.scale, 6), cactusMat);
        stem.position.y = 1.25 * t.scale;
        stem.castShadow = true;
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * t.scale, 0.16 * t.scale, 1.0 * t.scale, 6), cactusMat);
        arm.position.set(0.35 * t.scale, 1.5 * t.scale, 0);
        arm.rotation.z = -0.6;
        g.add(stem, arm);
      } else {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * t.scale, 0.32 * t.scale, 2.2 * t.scale, 6), trunkMat);
        trunk.position.y = 1.1 * t.scale;
        trunk.castShadow = true;
        const leafMat = t.biome === 'tundra' ? leafMatTundra : t.biome === 'forest' ? leafMatForest : leafMatMeadow;
        const crown = new THREE.Mesh(new THREE.ConeGeometry(1.45 * t.scale, 3.4 * t.scale, 7), leafMat);
        crown.position.y = 3.2 * t.scale;
        crown.castShadow = true;
        g.add(trunk, crown);
      }
      g.position.set(t.x, y, t.z);
      this.scene.add(g);
    }

    const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, flatShading: true });
    const sandRockMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9, flatShading: true });
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0369a1,
      emissiveIntensity: 0.5,
      roughness: 0.25,
      flatShading: true,
    });
    for (const r of this.world.rocks) {
      const y = this.world.getHeight(r.x, r.z);
      const isCrystal = r.biome === 'crystal';
      const isDesert = r.biome === 'desert';
      const mesh = new THREE.Mesh(
        isCrystal ? new THREE.OctahedronGeometry(1.1 * r.scale, 0) : new THREE.DodecahedronGeometry(1.1 * r.scale, 0),
        isCrystal ? spireMat : isDesert ? sandRockMat : rockMat
      );
      mesh.position.set(r.x, y + 0.6 * r.scale, r.z);
      if (isCrystal) mesh.scale.set(0.7, 2.1, 0.7);
      mesh.castShadow = true;
      this.scene.add(mesh);
    }

    // Player State
    this.player = {
      pos: new THREE.Vector3(0, this.world.getHeight(0, 0), 0),
      vel: new THREE.Vector3(),
      yaw: 0,
      hp: 100,
      maxHp: 100,
      stamina: 100,
      maxStamina: 100,
      attackCd: 0,
      swingTimer: 0,
      dodgeTimer: 0,
      dodgeDir: new THREE.Vector3(),
      invulnTimer: 0,
      walkPhase: 0,
    };

    this.gear = {
      activeWeapon: 'blade',
      blade: createBlade('iron', 'broadsword', 'none'),
      armor: createArmor('leather', 'none'),
      wand: createWand('spark', 'ashwood'),
      satchel: [],
    };

    this.materials = {
      ironOre: 3,
      wood: 3,
      obsidian: 0,
      sunstone: 0,
      crystal: 1,
      frostquartz: 0,
      brimstone: 0,
      voidshard: 0,
      fang: 0,
    };

    this.stats = {
      slain: 0,
      mined: 0,
      crafted: 0,
      rested: 0,
      day: 1,
    };

    this.timeOfDay = 0.08; // 0..1 (0=Dawn, 0.25=Day, 0.55=Dusk, 0.78=Night)
    this.weather = 'Clear';
    this.weatherTimer = 32;
    this.currentBiome = 'meadow';
    this._initWeatherParticles();

    this.playerRig = createPlayerRig();
    this.playerRig.root.position.copy(this.player.pos);
    this.scene.add(this.playerRig.root);
    updatePlayerGearVisuals(this.playerRig, this.gear);

    // Camera orbit
    this.camYaw = Math.PI;
    this.camPitch = 0.42;
    this.camDist = 9.5;

    // Entities
    this.monsters = [];
    this._spawnAllMonsters();
    this.projectiles = [];
    this.particles = [];
    this.gameOver = false;

    this.logger.reset(seed);
    this.logger.log(this.stats.day, this._getTimeLabel(), `Entered the wilds (Seed ${seed}) in Emerald Meadows.`);

    this.recorder.stop();
    document.getElementById('rec-badge').classList.add('hidden');
    const runId = (this._runSeq = (this._runSeq || 0) + 1);
    sound.onReady((audioStream) => {
      if (this._runSeq !== runId || this.gameOver) return;
      const recOk = this.recorder.start(audioStream);
      document.getElementById('rec-badge').classList.toggle('hidden', !recOk);
    });

    this._populateCraftOptions();
    this._updateHUD();
    this._showDayTransition(this.stats.day);
    this.toast('Welcome to Ironbound Wilds! Visit the nearby Campfire or Mine.');
  }

  _spawnAllMonsters() {
    for (const m of this.monsters) {
      this.scene.remove(m.rig.group);
    }
    this.monsters = [];
    for (const sp of this.world.monsterSpawns) {
      const rig = createMonsterRig(sp.type, sp.tier);
      const y = this.world.getHeight(sp.x, sp.z);
      rig.group.position.set(sp.x, y, sp.z);
      this.scene.add(rig.group);

      const baseHp =
        sp.type === 'brute' ? 95 :
        sp.type === 'knight' ? 125 :
        sp.type === 'mage' ? 58 :
        sp.type === 'wraith' ? 65 :
        sp.type === 'scorpion' ? 62 :
        sp.type === 'wolf' ? 52 : 48;
      const maxHp = Math.round(baseHp * (1 + (sp.tier - 1) * 0.35));
      const speed =
        sp.type === 'wolf' ? 6.6 :
        sp.type === 'scorpion' ? 6.0 :
        sp.type === 'goblin' ? 5.6 :
        sp.type === 'brute' ? 3.5 : 4.3;
      const baseDmg =
        sp.type === 'brute' ? 18 :
        sp.type === 'knight' ? 22 :
        sp.type === 'mage' ? 14 :
        sp.type === 'wraith' ? 15 :
        sp.type === 'scorpion' ? 14 :
        sp.type === 'wolf' ? 12 : 11;

      this.monsters.push({
        type: sp.type,
        tier: sp.tier,
        homeX: sp.x,
        homeZ: sp.z,
        pos: new THREE.Vector3(sp.x, y, sp.z),
        hp: maxHp,
        maxHp,
        speed,
        dmg: baseDmg * (1 + (sp.tier - 1) * 0.25),
        attackCd: 0,
        windup: 0,
        burnTimer: 0,
        slowTimer: 0,
        rig,
      });
    }
  }

  toast(msg, isDanger = false) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast${isDanger ? ' danger' : ''}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  _initWeatherParticles() {
    const count = 450;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 44;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 44;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.weatherMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.22,
      transparent: true,
      opacity: 0.75,
    });
    this.weatherPoints = new THREE.Points(geo, this.weatherMat);
    this.weatherPoints.visible = false;
    this.scene.add(this.weatherPoints);
  }

  _getTimeLabel() {
    const t = this.timeOfDay;
    if (t < 0.16) return 'Dawn';
    if (t < 0.48) return 'Day';
    if (t < 0.64) return 'Dusk';
    return 'Night';
  }

  _showDayTransition(day) {
    this.dayTransitionTimer = 3.0;
    const el = document.getElementById('day-transition');
    document.getElementById('day-trans-title').textContent = `DAY ${day}`;
    document.getElementById('day-trans-sub').textContent = `Weather: ${this.weather}  •  ${this.world.getBiomeLabel(this.currentBiome)}`;
    el.classList.remove('hidden');
    // Restart CSS animation
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    sound.dayTransition();
    clearTimeout(this._dayTransTimeout);
    this._dayTransTimeout = setTimeout(() => el.classList.add('hidden'), 3000);
  }

  _updateDayNightAndWeather(dt) {
    // Full day/night cycle = 120 seconds
    this.timeOfDay += dt / 120;
    if (this.timeOfDay >= 1) {
      this.timeOfDay -= 1;
      this.stats.day++;
      this.logger.log(this.stats.day, 'Dawn', `Day ${this.stats.day} began.`);
      this._showDayTransition(this.stats.day);
    }

    // Sun & sky colors based on timeOfDay
    const angle = this.timeOfDay * Math.PI * 2;
    const sunY = Math.sin(angle); // >0 day, <0 night
    const daylight = Math.max(0, Math.min(1, (sunY + 0.2) / 1.05));

    const nightSky = new THREE.Color(0x090d1a);
    const dawnSky = new THREE.Color(0x7c3e4b);
    const daySky = new THREE.Color(0x3b6998);

    const sky = nightSky.clone();
    if (daylight > 0.5) {
      sky.lerpColors(dawnSky, daySky, (daylight - 0.5) * 2);
    } else {
      sky.lerpColors(nightSky, dawnSky, daylight * 2);
    }

    // Weather tint
    if (this.weather === 'Rain') sky.lerp(new THREE.Color(0x1e293b), 0.45);
    else if (this.weather === 'Ashfall') sky.lerp(new THREE.Color(0x291d1d), 0.45);
    else if (this.weather === 'Arcane Mist') sky.lerp(new THREE.Color(0x1e1b4b), 0.4);

    this.scene.background.copy(sky);
    this.scene.fog.color.copy(sky);
    this.scene.fog.density = this.weather === 'Clear' ? 0.008 : 0.0135;

    this.sunLight.intensity = 0.25 + daylight * 1.25;
    this.hemiLight.intensity = 0.28 + daylight * 0.55;
    this.sunLight.color.setHex(daylight < 0.35 ? 0x64748b : daylight < 0.6 ? 0xfdba74 : 0xfffbeb);

    // Biome tracking
    const biome = this.world.getBiome(this.player.pos.x, this.player.pos.z);
    if (biome !== this.currentBiome) {
      this.currentBiome = biome;
      const bLabel = this.world.getBiomeLabel(biome);
      this.toast(`Entered ${bLabel}`);
      this.logger.log(this.stats.day, this._getTimeLabel(), `Traveled into ${bLabel}.`);
    }

    // Weather transitions
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      this.weatherTimer = 28 + Math.random() * 25;
      let nextWeather = 'Clear';
      const roll = Math.random();
      if (biome === 'tundra') nextWeather = roll < 0.65 ? 'Snow' : 'Clear';
      else if (biome === 'highlands') nextWeather = roll < 0.6 ? 'Ashfall' : 'Clear';
      else if (biome === 'crystal') nextWeather = roll < 0.6 ? 'Arcane Mist' : 'Clear';
      else if (biome === 'desert') nextWeather = roll < 0.8 ? 'Clear' : 'Ashfall';
      else nextWeather = roll < 0.42 ? 'Rain' : 'Clear';

      if (nextWeather !== this.weather) {
        this.weather = nextWeather;
        this.toast(`Weather changed: ${this.weather}`);
        this.logger.log(this.stats.day, this._getTimeLabel(), `Weather shifted to ${this.weather}.`);
      }
    }

    // Animate 3D weather particles around player
    this.weatherPoints.visible = this.weather !== 'Clear';
    if (this.weatherPoints.visible) {
      this.weatherPoints.position.set(this.player.pos.x, this.player.pos.y, this.player.pos.z);
      const posAttr = this.weatherPoints.geometry.attributes.position;
      let fallSpeed = 14;
      if (this.weather === 'Rain') {
        this.weatherMat.color.setHex(0x93c5fd);
        this.weatherMat.size = 0.18;
        fallSpeed = 18;
      } else if (this.weather === 'Snow') {
        this.weatherMat.color.setHex(0xf8fafc);
        this.weatherMat.size = 0.25;
        fallSpeed = 4.2;
      } else if (this.weather === 'Ashfall') {
        this.weatherMat.color.setHex(0xf97316);
        this.weatherMat.size = 0.2;
        fallSpeed = 3.5;
      } else {
        this.weatherMat.color.setHex(0xc084fc);
        this.weatherMat.size = 0.28;
        fallSpeed = 1.8;
      }

      for (let i = 0; i < posAttr.count; i++) {
        let y = posAttr.getY(i) - fallSpeed * dt;
        if (y < 0) y = 20;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    }
  }

  _spawnParticles(pos, color, count = 10, speed = 4) {
    const geo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    const mat = new THREE.MeshBasicMaterial({ color });
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3((Math.random() - 0.5) * speed, Math.random() * speed * 0.9 + 1.5, (Math.random() - 0.5) * speed),
        life: 0.45 + Math.random() * 0.25,
      });
    }
  }

  _loop() {
    requestAnimationFrame(() => this._loop());
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.dayTransitionTimer > 0) this.dayTransitionTimer = Math.max(0, this.dayTransitionTimer - dt);
    if (this.lastForgeActionTimer > 0) this.lastForgeActionTimer = Math.max(0, this.lastForgeActionTimer - dt);

    this.input.poll();
    if (this.input.padConnected && this.input.currPadBtns.some(Boolean)) {
      sound.ensureCtx();
    }
    this._updateControllerBadge();

    const anyModalOpen = this.forgeDialog.open || this.pauseDialog.open || this.gameoverDialog.open;

    if (anyModalOpen) {
      this._handleDialogGamepad();
    } else if (!this.gameOver) {
      if (this.input.isPausePressed()) {
        if (document.pointerLockElement) document.exitPointerLock?.();
        this.pauseDialog.showModal();
      } else {
        this._updateGameplay(dt);
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.recorder.captureFrame((ctx, w, h) => drawReplayFrame(ctx, w, h, this));
    this.input.endFrame();
  }

  _updateControllerBadge() {
    const badge = document.getElementById('controller-badge');
    const label = document.getElementById('controller-label');
    if (this.input.padConnected) {
      badge.classList.remove('disconnected');
      badge.classList.add('connected');
      label.textContent = 'Xbox Controller Connected';
    } else {
      badge.classList.remove('connected');
      badge.classList.add('disconnected');
      label.textContent = 'No Xbox Pad (KB/M Active)';
    }
  }

  _handleDialogGamepad() {
    if (!this.input.padConnected) return;
    const now = performance.now();

    if (this.gameoverDialog.open) {
      if (this.input.padJustPressed(PAD_BTN.A)) {
        this.gameoverDialog.close();
        this.startNewWorld(this.seed);
      }
      return;
    }

    if (this.input.padJustPressed(PAD_BTN.B) || this.input.padJustPressed(PAD_BTN.START)) {
      if (this.forgeDialog.open) this.forgeDialog.close();
      if (this.pauseDialog.open) this.pauseDialog.close();
      return;
    }

    if (this.forgeDialog.open) {
      const tabs = ['rest', 'craft', 'satchel'];
      const activeIdx = tabs.findIndex((t) => document.querySelector(`.tab-btn[data-tab="${t}"]`).classList.contains('active'));
      if (this.input.padJustPressed(PAD_BTN.RB)) {
        this._switchForgeTab(tabs[(activeIdx + 1) % tabs.length]);
      } else if (this.input.padJustPressed(PAD_BTN.LB)) {
        this._switchForgeTab(tabs[(activeIdx + tabs.length - 1) % tabs.length]);
      }
    }

    const activeDialog = this.forgeDialog.open ? this.forgeDialog : this.pauseDialog;
    const focusables = [...activeDialog.querySelectorAll('button:not([disabled]), select')].filter(
      (el) => el.offsetParent !== null
    );
    if (focusables.length === 0) return;

    let idx = focusables.indexOf(document.activeElement);
    if (idx === -1) idx = 0;

    const up = this.input.padJustPressed(PAD_BTN.UP) || (this.input.padAxes[1] < -0.6 && now - this.lastPadNavTime > 200);
    const down = this.input.padJustPressed(PAD_BTN.DOWN) || (this.input.padAxes[1] > 0.6 && now - this.lastPadNavTime > 200);
    const left = this.input.padJustPressed(PAD_BTN.LEFT) || (this.input.padAxes[0] < -0.6 && now - this.lastPadNavTime > 200);
    const right = this.input.padJustPressed(PAD_BTN.RIGHT) || (this.input.padAxes[0] > 0.6 && now - this.lastPadNavTime > 200);

    if (up) {
      this.lastPadNavTime = now;
      focusables[(idx + focusables.length - 1) % focusables.length].focus();
    } else if (down) {
      this.lastPadNavTime = now;
      focusables[(idx + 1) % focusables.length].focus();
    } else if ((left || right) && document.activeElement?.tagName === 'SELECT') {
      this.lastPadNavTime = now;
      const sel = document.activeElement;
      const dir = right ? 1 : -1;
      sel.selectedIndex = (sel.selectedIndex + dir + sel.options.length) % sel.options.length;
      sel.dispatchEvent(new Event('change'));
    }

    if (this.input.padJustPressed(PAD_BTN.A)) {
      const el = document.activeElement;
      if (el && el.tagName === 'BUTTON') el.click();
    }
  }

  _updateGameplay(dt) {
    // 1. Camera look
    const look = this.input.getCameraLook(dt);
    this.camYaw += look.yaw;
    this.camPitch = Math.max(0.15, Math.min(1.15, this.camPitch + look.pitch));

    // 2. Movement
    const move = this.input.getMoveVector();
    const sprinting = this.input.isSprinting() && move.magnitude > 0.1;
    const armorEndurance = this.gear.armor?.effect === 'endurance' && this.gear.armor.durability > 0 ? 0.75 : 1.0;

    if (this.player.dodgeTimer > 0) {
      this.player.dodgeTimer -= dt;
      this.player.pos.addScaledVector(this.player.dodgeDir, 15 * dt);
    } else if (move.magnitude > 0.05) {
      const forward = new THREE.Vector3(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
      const right = new THREE.Vector3(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
      const dir = new THREE.Vector3()
        .addScaledVector(forward, -move.y)
        .addScaledVector(right, move.x)
        .normalize();

      const speed = sprinting ? 10.5 : 6.8;
      this.player.pos.addScaledVector(dir, speed * move.magnitude * dt);
      this.player.yaw = Math.atan2(dir.x, dir.z);
      this.player.walkPhase += dt * (sprinting ? 13 : 8.5);

      // Travel stamina drain (encourages resting at campsites; harsher in rain/snow)
      const weatherMult = (this.weather === 'Rain' || this.weather === 'Snow') ? 1.2 : 1.0;
      const drain = (sprinting ? 3.0 : 0.45) * armorEndurance * weatherMult * dt;
      this._consumeStamina(drain);
    }

    this._updateDayNightAndWeather(dt);

    // Clamp to world bounds
    const r = Math.hypot(this.player.pos.x, this.player.pos.z);
    if (r > WORLD_RADIUS - 4) {
      const scale = (WORLD_RADIUS - 4) / r;
      this.player.pos.x *= scale;
      this.player.pos.z *= scale;
    }
    this.player.pos.y = this.world.getHeight(this.player.pos.x, this.player.pos.z);

    // Gentle warmth near campfire
    for (const c of this.world.campsites) {
      if (Math.hypot(this.player.pos.x - c.x, this.player.pos.z - c.z) < 5.5) {
        this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + 3.0 * dt);
      }
    }

    // 3. Dodge Roll
    if (this.input.isDodgePressed() && this.player.dodgeTimer <= 0 && this.player.stamina > 8) {
      this._consumeStamina(8 * armorEndurance);
      this.player.dodgeTimer = 0.28;
      this.player.invulnTimer = 0.34;
      this.player.dodgeDir.set(Math.sin(this.player.yaw), 0, Math.cos(this.player.yaw));
      sound.slash();
    }

    // 4. Swap Weapon
    if (this.input.isSwapWeaponPressed()) {
      this.gear.activeWeapon = this.gear.activeWeapon === 'blade' ? 'wand' : 'blade';
      updatePlayerGearVisuals(this.playerRig, this.gear);
      this._updateHUD();
    }

    // 5. Attack (Primary / Heavy)
    this.player.attackCd = Math.max(0, this.player.attackCd - dt);
    this.player.swingTimer = Math.max(0, this.player.swingTimer - dt);
    this.player.invulnTimer = Math.max(0, this.player.invulnTimer - dt);

    const guarding = this.input.isGuarding() && this.gear.armor && this.gear.armor.durability > 0;
    this.playerRig.shieldMesh.visible = guarding;

    if (!guarding && this.player.attackCd <= 0) {
      if (this.input.isAttackPressed()) {
        this._performAttack(false);
      } else if (this.input.isHeavyPressed()) {
        this._performAttack(true);
      }
    }

    // 6. Context Interaction (Campfire or Ore Vein)
    this._updateContextInteraction(dt);

    // 7. Update Monsters, Projectiles, Particles, Campfires
    this._updateMonsters(dt, guarding);
    this._updateProjectiles(dt, guarding);
    this._updateParticles(dt);
    this._updateCampsiteFlames(dt);

    // 8. Animate Player Rig & Camera
    this.playerRig.root.position.copy(this.player.pos);
    this.playerRig.root.rotation.y = this.player.yaw;
    const legSwing = move.magnitude > 0.05 ? Math.sin(this.player.walkPhase) * 0.55 : 0;
    this.playerRig.legL.rotation.x = legSwing;
    this.playerRig.legR.rotation.x = -legSwing;
    if (this.player.swingTimer > 0) {
      this.playerRig.armRPivot.rotation.x = -1.6 + Math.sin(this.player.swingTimer * 18) * 1.1;
    } else {
      this.playerRig.armRPivot.rotation.x = -legSwing * 0.5;
    }
    this.playerRig.armLPivot.rotation.x = guarding ? -1.1 : legSwing * 0.5;

    const camTarget = new THREE.Vector3(this.player.pos.x, this.player.pos.y + 1.8, this.player.pos.z);
    const camX = camTarget.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * this.camDist;
    const camZ = camTarget.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * this.camDist;
    const camY = Math.max(
      this.world.getHeight(camX, camZ) + 1.2,
      camTarget.y + Math.sin(this.camPitch) * this.camDist
    );
    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(camTarget);

    this.sunLight.position.set(this.player.pos.x + 40, 70, this.player.pos.z + 30);
    this.sunLight.target.position.copy(this.player.pos);
    this.sunLight.target.updateMatrixWorld();

    this._updateHUD();
    this._drawMinimap();
  }

  _consumeStamina(amount) {
    this.player.stamina = Math.max(0, this.player.stamina - amount);
    if (this.player.stamina < 25 && !this.staminaWarned) {
      this.staminaWarned = true;
      this.toast('Low Stamina! Find a Campsite to rest!', true);
    } else if (this.player.stamina >= 30) {
      this.staminaWarned = false;
    }
    if (this.player.stamina <= 0) {
      this._triggerGameOver('You collapsed from exhaustion (ran out of stamina from lack of rest).');
    }
  }

  _degradeGear(slotKey, amount) {
    const item = this.gear[slotKey];
    if (!item) return;
    item.durability = Math.max(0, item.durability - amount);
    if (item.durability <= 0) {
      const brokenName = item.name;
      this.gear[slotKey] = null;
      sound.gearBreak();
      this.input.rumble(0.8, 0.9, 260);
      this.toast(`${brokenName} SHATTERED!`, true);
      this.logger.log(this.stats.day, this._getTimeLabel(), `${brokenName} (${slotKey}) shattered and broke!`);
      updatePlayerGearVisuals(this.playerRig, this.gear);
      this._checkTotalGearLoss();
    }
  }

  _checkTotalGearLoss() {
    const hasEquipped = Boolean(this.gear.blade || this.gear.armor || this.gear.wand);
    const hasSatchel = this.gear.satchel.some((g) => g.durability > 0);
    if (!hasEquipped && !hasSatchel) {
      this._triggerGameOver('You lost all your gear (every weapon, armor piece, and wand broke or was discarded).');
    }
  }

  _performAttack(isHeavy) {
    const activeKey = this.gear.activeWeapon;
    const item = this.gear[activeKey];
    if (!item || item.durability <= 0) {
      this.toast(`No ${activeKey} equipped! Swap weapon (Y) or forge at camp.`, true);
      return;
    }

    const eff = getEffectivenessMultiplier(item);
    const armorEndurance = this.gear.armor?.effect === 'endurance' && this.gear.armor.durability > 0 ? 0.75 : 1.0;

    if (activeKey === 'blade') {
      this.player.attackCd = (isHeavy ? 0.65 : 0.42) / item.speed;
      this.player.swingTimer = 0.25;
      this._consumeStamina((isHeavy ? 8 : 4) * armorEndurance);
      sound.slash();

      const forward = new THREE.Vector3(Math.sin(this.player.yaw), 0, Math.cos(this.player.yaw));
      let hitAny = false;
      for (const m of this.monsters) {
        if (m.hp <= 0) continue;
        const toMob = new THREE.Vector3().subVectors(m.pos, this.player.pos);
        toMob.y = 0;
        const dist = toMob.length();
        if (dist <= item.range) {
          toMob.normalize();
          if (forward.dot(toMob) > 0.2 || dist < 1.35) {
            const isCrit = Math.random() < item.crit;
            const dmg = Math.round(item.baseDamage * eff * (isHeavy ? 1.55 : 1.0) * (isCrit ? 1.6 : 1.0));
            this._damageMonster(m, dmg, item.effect);
            hitAny = true;
          }
        }
      }
      if (hitAny) {
        this.input.rumble(0.35, 0.45, 90);
        this._degradeGear('blade', isHeavy ? 2.8 : 1.8);
      } else {
        this._degradeGear('blade', 0.4);
      }
    } else if (activeKey === 'wand') {
      this.player.attackCd = (isHeavy ? 0.65 : 0.42) / item.castSpeed;
      this.player.swingTimer = 0.22;
      this._consumeStamina(item.stamCost * (isHeavy ? 1.5 : 1.0) * armorEndurance);
      sound.wandCast();

      const wardBonus = this.gear.armor?.effect === 'ward' && this.gear.armor.durability > 0 ? 1.2 : 1.0;
      const dmg = Math.round(item.baseDamage * eff * wardBonus * (isHeavy ? 1.45 : 1.0));
      const dir = new THREE.Vector3(Math.sin(this.player.yaw), 0, Math.cos(this.player.yaw)).normalize();

      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(isHeavy ? 0.32 : 0.22, 8, 8),
        new THREE.MeshBasicMaterial({ color: item.glow })
      );
      const startPos = this.player.pos.clone().add(new THREE.Vector3(0, 1.4, 0)).addScaledVector(dir, 0.9);
      orb.position.copy(startPos);
      this.scene.add(orb);

      this.projectiles.push({
        fromPlayer: true,
        mesh: orb,
        pos: startPos,
        vel: dir.multiplyScalar(item.projSpeed),
        dmg,
        splash: item.splash || 0,
        slow: item.slow,
        homing: item.homing,
        color: item.glow,
        life: 1.8,
      });

      this._degradeGear('wand', isHeavy ? 3.2 : 2.1);
    }
  }

  _damageMonster(m, dmg, effect = null) {
    m.hp -= dmg;
    sound.hitEnemy();
    this._spawnParticles(m.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xf87171, 8, 4.5);

    if (effect === 'burn') m.burnTimer = 3.5;
    if (effect === 'slow') m.slowTimer = 3.0;
    if (effect === 'leech') this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.ceil(dmg * 0.16));

    if (m.hp <= 0) {
      this.scene.remove(m.rig.group);
      this.stats.slain++;
      this.materials.fang += 1;
      if (Math.random() < 0.5) {
        const bonus = m.tier >= 3 ? 'crystal' : m.tier === 2 ? 'sunstone' : 'ironOre';
        this.materials[bonus] += 1;
      }
      this.toast(`Slain ${m.type}! +1 Fang`);
      this.logger.log(this.stats.day, this._getTimeLabel(), `Slain a ${m.type} in ${this.world.getBiomeLabel(this.currentBiome)}.`);
    } else {
      const ratio = Math.max(0, m.hp / m.maxHp);
      m.rig.hpFill.scale.x = Math.max(0.01, ratio);
    }
  }

  _updateContextInteraction(dt) {
    // Respawn depleted ore nodes slowly
    for (const node of this.world.oreNodes) {
      if (node.charges <= 0) {
        node.respawnTimer -= dt;
        if (node.respawnTimer <= 0) {
          node.charges = node.maxCharges;
          const mesh = this.oreMeshes.get(node.id);
          if (mesh) {
            mesh.visible = true;
            mesh.scale.setScalar(1);
          }
        }
      }
    }

    const prompt = document.getElementById('context-prompt');
    const textEl = document.getElementById('context-text');

    let nearCamp = null;
    for (const c of this.world.campsites) {
      if (Math.hypot(this.player.pos.x - c.x, this.player.pos.z - c.z) < 4.5) {
        nearCamp = c;
        break;
      }
    }

    let nearOre = null;
    if (!nearCamp) {
      for (const node of this.world.oreNodes) {
        if (node.charges > 0 && Math.hypot(this.player.pos.x - node.x, this.player.pos.z - node.z) < 3.4) {
          nearOre = node;
          break;
        }
      }
    }

    if (nearCamp) {
      prompt.classList.remove('hidden');
      textEl.textContent = 'Rest & Open Field Forge';
      if (this.input.isInteractPressed()) {
        if (document.pointerLockElement) document.exitPointerLock?.();
        this._openForgeDialog();
      }
    } else if (nearOre) {
      prompt.classList.remove('hidden');
      const label = MATERIALS_META[nearOre.kind]?.name || nearOre.kind;
      textEl.textContent = `Mine ${label} (${nearOre.charges} left)`;
      if (this.input.isInteractPressed()) {
        this._mineNode(nearOre);
      }
    } else {
      prompt.classList.add('hidden');
    }
  }

  _mineNode(node) {
    const hasBlade = this.gear.blade && this.gear.blade.durability > 0;
    this._consumeStamina(hasBlade ? 4 : 6);
    if (hasBlade) this._degradeGear('blade', 1.2);

    this.player.swingTimer = 0.25;
    sound.mineStrike();
    this.input.rumble(0.3, 0.5, 100);

    const yieldAmt = hasBlade ? (Math.random() < 0.35 ? 2 : 1) : 1;
    this.materials[node.kind] += yieldAmt;
    this.stats.mined += yieldAmt;
    node.charges--;

    const mesh = this.oreMeshes.get(node.id);
    if (mesh) {
      this._spawnParticles(mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0x38bdf8, 8, 3.5);
      if (node.charges <= 0) {
        mesh.visible = false;
        node.respawnTimer = 45;
      } else {
        mesh.scale.setScalar(0.55 + 0.45 * (node.charges / node.maxCharges));
      }
    }
    this.toast(`+${yieldAmt} ${MATERIALS_META[node.kind].name}`);
    this.logger.log(this.stats.day, this._getTimeLabel(), `Mined +${yieldAmt} ${MATERIALS_META[node.kind].name}.`);
  }

  _updateMonsters(dt, guarding) {
    for (const m of this.monsters) {
      if (m.hp <= 0) continue;

      if (m.burnTimer > 0) {
        m.burnTimer -= dt;
        m.hp -= 5 * dt;
        if (m.hp <= 0) {
          this._damageMonster(m, 1);
          continue;
        }
      }
      if (m.slowTimer > 0) m.slowTimer -= dt;

      const toPlayer = new THREE.Vector3().subVectors(this.player.pos, m.pos);
      toPlayer.y = 0;
      const dist = toPlayer.length();
      m.attackCd = Math.max(0, m.attackCd - dt);

      if (dist < 24) {
        const dir = toPlayer.clone().normalize();
        m.rig.group.rotation.y = Math.atan2(dir.x, dir.z);
        const spd = m.speed * (m.slowTimer > 0 ? 0.5 : 1.0);

        if (m.type === 'mage' || m.type === 'wraith') {
          if (dist > 11) {
            m.pos.addScaledVector(dir, spd * dt);
          } else if (m.attackCd <= 0) {
            m.attackCd = 2.1;
            const projColor = m.type === 'wraith' ? 0x38bdf8 : 0xf43f5e;
            const orb = new THREE.Mesh(
              new THREE.SphereGeometry(0.24, 6, 6),
              new THREE.MeshBasicMaterial({ color: projColor })
            );
            const start = m.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
            orb.position.copy(start);
            this.scene.add(orb);
            this.projectiles.push({
              fromPlayer: false,
              mesh: orb,
              pos: start,
              vel: dir.multiplyScalar(14),
              dmg: m.dmg,
              color: projColor,
              life: 2.2,
            });
          }
        } else {
          if (dist > 2.0) {
            m.pos.addScaledVector(dir, spd * dt);
          } else if (m.attackCd <= 0) {
            m.attackCd = 1.45;
            this._hitPlayer(m.dmg, guarding, m);
          }
        }
      }

      m.pos.y = this.world.getHeight(m.pos.x, m.pos.z);
      m.rig.group.position.copy(m.pos);
      m.rig.hpBg.lookAt(this.camera.position);
      m.rig.hpFill.lookAt(this.camera.position);
    }
  }

  _hitPlayer(rawDmg, guarding, attacker = null) {
    if (this.player.invulnTimer > 0 || this.gameOver) return;

    let dmg = rawDmg;
    if (this.gear.armor && this.gear.armor.durability > 0) {
      const eff = getEffectivenessMultiplier(this.gear.armor);
      const armorMit = this.gear.armor.baseDefense * eff;
      const guardMit = guarding ? 0.45 : 0;
      dmg = Math.max(2, Math.round(rawDmg * (1 - Math.min(0.85, armorMit + guardMit))));

      if (this.gear.armor.effect === 'thorns' && attacker) {
        this._damageMonster(attacker, Math.round(rawDmg * 0.25));
      }
      this._degradeGear('armor', guarding ? 1.8 : 3.5);
    }

    this.player.hp = Math.max(0, this.player.hp - dmg);
    this.player.invulnTimer = 0.28;
    if (guarding) {
      sound.guardBlock();
      this.input.rumble(0.25, 0.35, 80);
    } else {
      sound.playerHurt();
      this.input.rumble(0.5, 0.65, 130);
    }

    if (this.player.hp <= 0) {
      this._triggerGameOver('You were slain in battle against a monster.');
    }
  }

  _updateProjectiles(dt, guarding) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;

      if (p.fromPlayer && p.homing) {
        let best = null;
        let bestD = 14;
        for (const m of this.monsters) {
          if (m.hp <= 0) continue;
          const d = m.pos.distanceTo(p.pos);
          if (d < bestD) {
            bestD = d;
            best = m;
          }
        }
        if (best) {
          const desired = best.pos.clone().add(new THREE.Vector3(0, 1.2, 0)).sub(p.pos).normalize().multiplyScalar(p.vel.length());
          p.vel.lerp(desired, 6 * dt);
        }
      }

      p.pos.addScaledVector(p.vel, dt);
      p.mesh.position.copy(p.pos);

      let remove = p.life <= 0 || p.pos.y < this.world.getHeight(p.pos.x, p.pos.z);

      if (!remove && p.fromPlayer) {
        for (const m of this.monsters) {
          if (m.hp <= 0) continue;
          if (p.pos.distanceTo(m.pos.clone().add(new THREE.Vector3(0, 1.1, 0))) < 1.2) {
            this._damageMonster(m, p.dmg, p.slow ? 'slow' : null);
            if (p.splash > 0) {
              for (const other of this.monsters) {
                if (other !== m && other.hp > 0 && other.pos.distanceTo(p.pos) < p.splash) {
                  this._damageMonster(other, Math.round(p.dmg * 0.6));
                }
              }
            }
            this._spawnParticles(p.pos, p.color, 10, 5);
            remove = true;
            break;
          }
        }
      } else if (!remove && !p.fromPlayer) {
        if (p.pos.distanceTo(this.player.pos.clone().add(new THREE.Vector3(0, 1.2, 0))) < 1.0) {
          this._hitPlayer(p.dmg, guarding);
          remove = true;
        }
      }

      if (remove) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  _updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.vel.y -= 9.8 * dt;
      pt.mesh.position.addScaledVector(pt.vel, dt);
      pt.mesh.scale.setScalar(Math.max(0.01, pt.life * 2));
      if (pt.life <= 0) {
        this.scene.remove(pt.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  _updateCampsiteFlames(dt) {
    const t = performance.now() * 0.006;
    for (const v of this.campsiteVisuals) {
      v.flame.scale.y = 0.88 + Math.sin(t) * 0.22;
      v.innerFlame.scale.y = 0.9 + Math.cos(t * 1.4) * 0.2;
      v.light.intensity = 2.1 + Math.sin(t * 1.7) * 0.4;
    }
  }

  _openForgeDialog() {
    this._renderRepairList();
    this._renderSatchelList();
    this._updateCraftPreview();
    this.forgeDialog.showModal();
  }

  _switchForgeTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach((p) => {
      p.classList.toggle('active', p.id === `tab-${tabName}`);
    });
  }

  _restAtCamp() {
    this.player.hp = this.player.maxHp;
    this.player.stamina = this.player.maxStamina;
    this.stats.rested++;
    this.stats.day++;
    this.timeOfDay = 0.05; // Advance to Dawn
    this.lastForgeAction = `Rested at Campfire (Day ${this.stats.day})`;
    this.lastForgeActionTimer = 2.5;
    sound.campRest();
    this._spawnAllMonsters();
    this.forgeDialog.close();
    this.logger.log(this.stats.day, 'Dawn', `Rested at a campsite until Day ${this.stats.day} (100% HP & Stamina restored).`);
    this._showDayTransition(this.stats.day);
  }

  _renderRepairList() {
    const list = document.getElementById('repair-list');
    list.innerHTML = '';
    for (const key of ['blade', 'armor', 'wand']) {
      const item = this.gear[key];
      const row = document.createElement('div');
      row.className = 'repair-row';
      if (!item) {
        row.innerHTML = `<span><strong>${key.toUpperCase()}:</strong> None equipped</span>`;
        list.appendChild(row);
        continue;
      }
      const pct = Math.round(getDurabilityRatio(item) * 100);
      const cost = getRepairCost(item);
      const costStr = Object.entries(cost)
        .map(([k, v]) => `${v} ${MATERIALS_META[k].short}`)
        .join(', ') || 'Full';
      const affordable = canAfford(this.materials, cost);

      const info = document.createElement('span');
      info.innerHTML = `<strong>${item.name}</strong> (${pct}% — ${getConditionLabel(item)})`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-sm btn-primary';
      btn.textContent = pct >= 99 ? 'Full' : `Repair (${costStr})`;
      btn.disabled = pct >= 99 || !affordable;
      btn.addEventListener('click', () => {
        spendMaterials(this.materials, cost);
        item.durability = item.maxDurability;
        this.lastForgeAction = `Repaired ${item.name} to 100%`;
        this.lastForgeActionTimer = 2.5;
        this.logger.log(this.stats.day, this._getTimeLabel(), `Repaired ${item.name} to 100%.`);
        sound.craftSuccess();
        this._renderRepairList();
        this._updateHUD();
      });
      row.append(info, btn);
      list.appendChild(row);
    }
  }

  _populateCraftOptions() {
    const cat = document.getElementById('craft-category').value;
    const lblA = document.getElementById('label-part-a');
    const lblB = document.getElementById('label-part-b');
    const lblC = document.getElementById('label-part-c');
    const selA = document.getElementById('craft-part-a');
    const selB = document.getElementById('craft-part-b');
    const selC = document.getElementById('craft-part-c');

    const fill = (sel, obj) => {
      sel.innerHTML = '';
      for (const [k, v] of Object.entries(obj)) {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = v.label;
        sel.appendChild(opt);
      }
    };

    if (cat === 'blade') {
      lblA.textContent = 'Blade Material';
      lblB.textContent = 'Blade Style';
      lblC.textContent = 'Enchantment';
      selC.parentElement.style.display = '';
      fill(selA, BLADE_MATERIALS);
      fill(selB, BLADE_STYLES);
      fill(selC, BLADE_ENCHANTS);
    } else if (cat === 'armor') {
      lblA.textContent = 'Armor Plate';
      lblB.textContent = 'Rune Sigil';
      selC.parentElement.style.display = 'none';
      fill(selA, ARMOR_PLATES);
      fill(selB, ARMOR_RUNES);
    } else {
      lblA.textContent = 'Arcane Core';
      lblB.textContent = 'Wand Shaft';
      selC.parentElement.style.display = 'none';
      fill(selA, WAND_CORES);
      fill(selB, WAND_SHAFTS);
    }
    this._updateCraftPreview();
  }

  _updateCraftPreview() {
    const cat = document.getElementById('craft-category').value;
    const a = document.getElementById('craft-part-a').value;
    const b = document.getElementById('craft-part-b').value;
    const c = document.getElementById('craft-part-c').value;

    const preview = cat === 'blade' ? createBlade(a, b, c) : cat === 'armor' ? createArmor(a, b) : createWand(a, b);
    document.getElementById('craft-preview-name').textContent = preview.name;
    document.getElementById('craft-preview-effect').textContent = preview.effectDesc || '';

    const statsEl = document.getElementById('craft-preview-stats');
    if (cat === 'blade') {
      statsEl.innerHTML = `<span class="stat-pill">DMG: ${preview.baseDamage}</span><span class="stat-pill">SPD: ${preview.speed}x</span><span class="stat-pill">DUR: ${preview.maxDurability}</span>`;
    } else if (cat === 'armor') {
      statsEl.innerHTML = `<span class="stat-pill">DEF: ${Math.round(preview.baseDefense * 100)}%</span><span class="stat-pill">DUR: ${preview.maxDurability}</span>`;
    } else {
      statsEl.innerHTML = `<span class="stat-pill">DMG: ${preview.baseDamage}</span><span class="stat-pill">ELEM: ${preview.elem}</span><span class="stat-pill">DUR: ${preview.maxDurability}</span>`;
    }

    const cost = computeCraftCost(cat, a, b, c);
    const costEl = document.getElementById('craft-cost-list');
    costEl.innerHTML = '';
    for (const [k, v] of Object.entries(cost)) {
      const have = this.materials[k] || 0;
      const span = document.createElement('span');
      span.className = `cost-pill${have < v ? ' missing' : ''}`;
      span.textContent = `${MATERIALS_META[k].name}: ${have}/${v}`;
      costEl.appendChild(span);
    }
    document.getElementById('btn-forge-item').disabled = !canAfford(this.materials, cost);
  }

  _forgeSelectedItem() {
    const cat = document.getElementById('craft-category').value;
    const a = document.getElementById('craft-part-a').value;
    const b = document.getElementById('craft-part-b').value;
    const c = document.getElementById('craft-part-c').value;
    const cost = computeCraftCost(cat, a, b, c);
    if (!canAfford(this.materials, cost)) return;

    spendMaterials(this.materials, cost);
    const crafted = cat === 'blade' ? createBlade(a, b, c) : cat === 'armor' ? createArmor(a, b) : createWand(a, b);
    if (this.gear[cat]) {
      this.gear.satchel.push(this.gear[cat]);
    }
    this.gear[cat] = crafted;
    this.stats.crafted++;
    sound.craftSuccess();
    updatePlayerGearVisuals(this.playerRig, this.gear);
    this._renderRepairList();
    this._renderSatchelList();
    this._updateCraftPreview();
    this._updateHUD();
    this.lastForgeAction = `Forged & Equipped ${crafted.name}`;
    this.lastForgeActionTimer = 2.5;
    this.logger.log(this.stats.day, this._getTimeLabel(), `Forged & equipped ${crafted.name}.`);
    this.toast(`Forged & equipped ${crafted.name}!`);
  }

  _renderSatchelList() {
    const list = document.getElementById('satchel-list');
    list.innerHTML = '';

    const addRow = (item, isEquipped, slotKey, idx = -1) => {
      const row = document.createElement('div');
      row.className = 'satchel-row';
      const pct = Math.round(getDurabilityRatio(item) * 100);
      const info = document.createElement('div');
      info.innerHTML = `<strong>[${item.category.toUpperCase()}]</strong> ${item.name} (${pct}%)${isEquipped ? ' <em>(Equipped)</em>' : ''}<div style="font-size:0.74rem;color:#94a3b8;margin-top:2px;">${item.effectDesc || ''}</div>`;
      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '6px';

      if (!isEquipped) {
        const eqBtn = document.createElement('button');
        eqBtn.type = 'button';
        eqBtn.className = 'btn-sm btn-primary';
        eqBtn.textContent = 'Equip';
        eqBtn.addEventListener('click', () => {
          const prev = this.gear[item.category];
          this.gear[item.category] = item;
          this.gear.satchel.splice(idx, 1);
          if (prev) this.gear.satchel.push(prev);
          this.lastForgeAction = `Equipped ${item.name}`;
          this.lastForgeActionTimer = 2.5;
          this.logger.log(this.stats.day, this._getTimeLabel(), `Equipped ${item.name} from satchel.`);
          updatePlayerGearVisuals(this.playerRig, this.gear);
          this._renderSatchelList();
          this._renderRepairList();
          this._updateHUD();
        });
        actions.appendChild(eqBtn);
      }

      const dropBtn = document.createElement('button');
      dropBtn.type = 'button';
      dropBtn.className = 'btn-sm btn-danger';
      dropBtn.textContent = 'Discard';
      dropBtn.addEventListener('click', () => {
        if (isEquipped) this.gear[slotKey] = null;
        else this.gear.satchel.splice(idx, 1);
        this.lastForgeAction = `Discarded ${item.name}`;
        this.lastForgeActionTimer = 2.5;
        this.logger.log(this.stats.day, this._getTimeLabel(), `Discarded ${item.name}.`);
        updatePlayerGearVisuals(this.playerRig, this.gear);
        this._renderSatchelList();
        this._renderRepairList();
        this._updateHUD();
        this._checkTotalGearLoss();
      });
      actions.appendChild(dropBtn);
      row.append(info, actions);
      list.appendChild(row);
    };

    for (const key of ['blade', 'armor', 'wand']) {
      if (this.gear[key]) addRow(this.gear[key], true, key);
    }
    this.gear.satchel.forEach((item, idx) => addRow(item, false, null, idx));
  }

  _triggerGameOver(reason) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.recorder.stop();
    this.logger.log(this.stats.day, this._getTimeLabel(), `FALLEN: ${reason}`);
    sound.gameOver();
    if (document.pointerLockElement) document.exitPointerLock?.();
    if (this.forgeDialog.open) this.forgeDialog.close();
    if (this.pauseDialog.open) this.pauseDialog.close();

    document.getElementById('gameover-reason').textContent = reason;
    document.getElementById('gameover-stats').innerHTML = `
      <div>Monsters Slain: <strong>${this.stats.slain}</strong></div>
      <div>Materials Mined: <strong>${this.stats.mined}</strong></div>
      <div>Gear Crafted: <strong>${this.stats.crafted}</strong></div>
      <div>Days Survived: <strong>${this.stats.day}</strong></div>
    `;
    document.getElementById('btn-download-replay').disabled = !this.recorder.hasRecording();
    this.gameoverDialog.showModal();
  }

  _updateHUD() {
    document.getElementById('hp-text').textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
    document.getElementById('hp-fill').style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;

    const stamPct = (this.player.stamina / this.player.maxStamina) * 100;
    document.getElementById('stamina-text').textContent = `${Math.ceil(this.player.stamina)} / ${this.player.maxStamina}`;
    const stamFill = document.getElementById('stamina-fill');
    stamFill.style.width = `${stamPct}%`;
    stamFill.classList.toggle('low', stamPct < 25);
    document.getElementById('stamina-warn').classList.toggle('hidden', stamPct >= 25);

    const biome = this.world.getBiome(this.player.pos.x, this.player.pos.z);
    document.getElementById('biome-name').textContent = this.world.getBiomeLabel(biome);
    document.getElementById('time-weather').textContent = `Day ${this.stats.day} • ${this._getTimeLabel()} • ${this.weather}`;
    document.getElementById('stats-mini').textContent = `Slain: ${this.stats.slain}`;

    // Gear cards
    for (const key of ['blade', 'wand', 'armor']) {
      const card = document.getElementById(`gear-${key}-card`);
      const nameEl = document.getElementById(`${key}-name`);
      const effEl = document.getElementById(`${key}-effect`);
      const pctEl = document.getElementById(`${key}-dur-pct`);
      const barEl = document.getElementById(`${key}-dur-bar`);
      const item = this.gear[key];

      card.classList.toggle('active-weapon', this.gear.activeWeapon === key);
      card.classList.toggle('broken', !item || item.durability <= 0);

      if (!item) {
        nameEl.textContent = 'BROKEN / NONE';
        effEl.textContent = 'Forge or equip a replacement at a Campsite.';
        pctEl.textContent = '0%';
        barEl.style.width = '0%';
      } else {
        const pct = Math.round(getDurabilityRatio(item) * 100);
        nameEl.textContent = item.name;
        effEl.textContent = item.effectDesc || '';
        pctEl.textContent = `${pct}%`;
        barEl.style.width = `${pct}%`;
        barEl.style.background = pct < 25 ? '#ef4444' : pct < 60 ? '#f59e0b' : '#38bdf8';
      }
    }

    // Materials
    const matGrid = document.getElementById('materials-grid');
    matGrid.innerHTML = '';
    for (const [k, meta] of Object.entries(MATERIALS_META)) {
      const div = document.createElement('div');
      div.className = 'mat-chip';
      div.innerHTML = `<span>${meta.short}</span><strong>${this.materials[k] || 0}</strong>`;
      matGrid.appendChild(div);
    }
  }

  _drawMinimap() {
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 1.15; // pixels per world unit

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, w, h);

    const drawDot = (wx, wz, color, rad) => {
      const dx = (wx - this.player.pos.x) * scale;
      const dz = (wz - this.player.pos.z) * scale;
      if (Math.hypot(dx, dz) > cx - 4) return;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dz, rad, 0, Math.PI * 2);
      ctx.fill();
    };

    for (const m of this.world.mines) drawDot(m.x, m.z, '#38bdf8', 4.2);
    for (const c of this.world.campsites) drawDot(c.x, c.z, '#f59e0b', 4.5);
    for (const mob of this.monsters) {
      if (mob.hp > 0) drawDot(mob.pos.x, mob.pos.z, '#ef4444', 2.8);
    }

    // Player arrow at center
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-this.player.yaw);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(-4.5, -5);
    ctx.lineTo(4.5, -5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
