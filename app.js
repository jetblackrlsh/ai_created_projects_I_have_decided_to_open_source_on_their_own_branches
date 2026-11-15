const CARD_WIDTH = 1062;
const CARD_HEIGHT = 1471;
const STORAGE_KEY_CURRENT = "mm_current_card_v1";
const STORAGE_KEY_LIBRARY = "mm_card_library_v1";

const ART_PRESETS = [
  { id: "default", label: "Default (Radiant Crusader)", path: "assets/minion_psd/default_art.png" },
  { id: "neutral_minion", label: "Neutral Minion", path: "assets/art/neutral minion.webp" },
  { id: "neutral_spell", label: "Neutral Spell", path: "assets/art/neutral spell.webp" },
  { id: "neutral_talent", label: "Neutral Talent", path: "assets/art/neutral talent.webp" },
  { id: "neutral_landmark", label: "Neutral Landmark", path: "assets/art/neutral landmark.webp" },
  { id: "paladin_minion", label: "Paladin Minion", path: "assets/art/paladin minion.webp" },
  { id: "paladin_spell", label: "Paladin Spell", path: "assets/art/paladin spell.webp" },
  { id: "paladin_talent", label: "Paladin Talent", path: "assets/art/paladin talent.webp" },
  { id: "paladin_landmark", label: "Paladin Landmark", path: "assets/art/paladin landmark.webp" },
  { id: "rogue_minion", label: "Rogue Minion", path: "assets/art/rogue minion.webp" },
  { id: "rogue_spell", label: "Rogue Spell", path: "assets/art/rogue spell.webp" },
  { id: "rogue_talent", label: "Rogue Talent", path: "assets/art/rogue talent.webp" },
  { id: "rogue_landmark", label: "Rogue Landmark", path: "assets/art/rogue landmark.webp" },
  { id: "warlock_minion", label: "Warlock Minion", path: "assets/art/warlock minion.webp" },
  { id: "warlock_spell", label: "Warlock Spell", path: "assets/art/warlock spell.webp" },
  { id: "warlock_talent", label: "Warlock Talent", path: "assets/art/warlock talent.webp" },
  { id: "warlock_landmark", label: "Warlock Landmark", path: "assets/art/warlock landmark.webp" },
];

const CARD_BACK_PRESETS = [
  "_cover.png",
  "crystal (1).png",
  "crystal (2).png",
  "crystal (3).png",
  "crystal (4).png",
  "crystal (5).png",
  "crystal (6).png",
  "contrast emblem (1).png",
  "contrast emblem (2).png",
  "contrast emblem (3).png",
  "contrast emblem (4).png",
  "neutral emblem (1).png",
  "neutral emblem (2).png",
  "neutral emblem (3).png",
  "neutral emblem (4).png",
  "_experimental (1).png",
  "_experimental (2).png",
  "_experimental (3).png",
  "_experimental (4).png",
  "_experimental (5).png",
  "_experimental (6).png",
  "_experimental (7).png",
  "_experimental (8).png",
  "_experimental (9).png",
  "_experimental (10).png",
  "_experimental (11).png",
  "_experimental (12).png",
];

const TEXTURE_CONFIG = {
  plastic_1: { path: "assets/textures/plastic_1.png", blend: "soft-light", alpha: 54 / 255 },
  plastic_2: { path: "assets/textures/plastic_2.png", blend: "soft-light", alpha: 54 / 255 },
  plastic_3: { path: "assets/textures/plastic_3.png", blend: "soft-light", alpha: 54 / 255 },
  metalic_1: { path: "assets/textures/metalic_1.png", blend: "difference", alpha: 130 / 255 },
  metalic_2: { path: "assets/textures/metalic_2.png", blend: "color-burn", alpha: 138 / 255 },
  metalic_3: { path: "assets/textures/metalic_3.png", blend: "multiply", alpha: 130 / 255 },
  metalic_4: { path: "assets/textures/metalic_4.png", blend: "color-burn", alpha: 115 / 255 },
  metalic_5: { path: "assets/textures/metalic_5.png", blend: "overlay", alpha: 115 / 255 },
};

const DEFAULT_CARD = {
  id: "",
  mode: "minion",
  // Minion Card fields
  name: "Radiant Crusader",
  mana: "100",
  type: "minion",
  description: 'Whenever **"Radiant Crusader"** takes damage, deal 2 damage to all enemies in the row.',
  showStats: true,
  attack: "2",
  health: "15",
  artPreset: "default",
  customArtDataUrl: null,
  artZoom: 100,
  artX: 0,
  artY: 0,
  frameStyle: "standard",
  enableTint: false,
  frameColor: "#f5c542",
  rarity: "2",
  emblem: "1",
  // Card Back fields
  cbSource: "modular",
  cbPreset: "_cover.png",
  cbBase: "full",
  cbBaseTint: false,
  cbBaseColor: "#3b82f6",
  cbDecor: "big_decor_6",
  cbCorners: "10",
  cbVsides: "13",
  cbHsides: "none",
  cbDecorTint: false,
  cbDecorColor: "#f5c542",
  cbKey: "emblem_1",
  cbKeyTint: false,
  cbKeyColor: "#38bdf8",
  // Booster fields
  bstBody: "wave",
  bstTint: false,
  bstColor: "#3b82f6",
  bstBg: "default",
  bstCustomBgDataUrl: null,
  bstTopText: "LIMITED EDITION",
  bstBottomText: "BOOSTER PACK",
  bstShowGameLogo: true,
  bstShowCompanyLogo: true,
  // Shared finish
  texture: "none",
};

let state = loadInitialState();
const imageCache = new Map();
let renderQueued = false;

const canvas = document.getElementById("card-canvas");
const ctx = canvas.getContext("2d");

const offscreenTint = document.createElement("canvas");
offscreenTint.width = CARD_WIDTH;
offscreenTint.height = CARD_HEIGHT;
const offscreenTintCtx = offscreenTint.getContext("2d");

const offscreenTex = document.createElement("canvas");
offscreenTex.width = CARD_WIDTH;
offscreenTex.height = CARD_HEIGHT;
const offscreenTexCtx = offscreenTex.getContext("2d");

const offscreenGroup = document.createElement("canvas");
offscreenGroup.width = CARD_WIDTH;
offscreenGroup.height = CARD_HEIGHT;
const offscreenGroupCtx = offscreenGroup.getContext("2d");

const el = {
  panelMinion: document.getElementById("panel-minion"),
  panelCardBack: document.getElementById("panel-card-back"),
  panelBooster: document.getElementById("panel-booster"),
  name: document.getElementById("card-name"),
  mana: document.getElementById("card-mana"),
  type: document.getElementById("card-type"),
  description: document.getElementById("card-description"),
  showStats: document.getElementById("show-stats"),
  statsInputs: document.getElementById("stats-inputs"),
  attack: document.getElementById("card-attack"),
  health: document.getElementById("card-health"),
  artPreset: document.getElementById("art-preset"),
  artUpload: document.getElementById("art-upload"),
  artZoom: document.getElementById("art-zoom"),
  artZoomVal: document.getElementById("art-zoom-val"),
  artX: document.getElementById("art-x"),
  artXVal: document.getElementById("art-x-val"),
  artY: document.getElementById("art-y"),
  artYVal: document.getElementById("art-y-val"),
  frameStyle: document.getElementById("frame-style"),
  frameColor: document.getElementById("frame-color"),
  enableTint: document.getElementById("enable-tint"),
  rarity: document.getElementById("rarity-select"),
  emblem: document.getElementById("emblem-select"),
  // Card Back
  cbSource: document.getElementById("cb-source"),
  cbPresetControls: document.getElementById("cb-preset-controls"),
  cbModularControls: document.getElementById("cb-modular-controls"),
  cbPreset: document.getElementById("cb-preset"),
  cbBase: document.getElementById("cb-base"),
  cbBaseColor: document.getElementById("cb-base-color"),
  cbBaseTint: document.getElementById("cb-base-tint"),
  cbDecor: document.getElementById("cb-decor"),
  cbCorners: document.getElementById("cb-corners"),
  cbVsides: document.getElementById("cb-vsides"),
  cbHsides: document.getElementById("cb-hsides"),
  cbDecorColor: document.getElementById("cb-decor-color"),
  cbDecorTint: document.getElementById("cb-decor-tint"),
  cbKey: document.getElementById("cb-key"),
  cbKeyColor: document.getElementById("cb-key-color"),
  cbKeyTint: document.getElementById("cb-key-tint"),
  // Booster
  bstBody: document.getElementById("bst-body"),
  bstColor: document.getElementById("bst-color"),
  bstTint: document.getElementById("bst-tint"),
  bstBg: document.getElementById("bst-bg"),
  bstBgUpload: document.getElementById("bst-bg-upload"),
  bstTopText: document.getElementById("bst-top-text"),
  bstBottomText: document.getElementById("bst-bottom-text"),
  bstShowGameLogo: document.getElementById("bst-show-game-logo"),
  bstShowCompanyLogo: document.getElementById("bst-show-company-logo"),
  // Shared
  texture: document.getElementById("texture-select"),
  dropZone: document.getElementById("drop-zone"),
  jsonInput: document.getElementById("json-file-input"),
  libraryList: document.getElementById("library-list"),
  announcer: document.getElementById("status-announcer"),
  protocolWarning: document.getElementById("file-protocol-warning"),
};

function loadInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (saved) return { ...DEFAULT_CARD, ...JSON.parse(saved) };
  } catch {
    // Ignore malformed localStorage
  }
  return { ...DEFAULT_CARD, id: crypto.randomUUID?.() || String(Date.now()) };
}

function saveCurrentState() {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

function announce(msg) {
  el.announcer.textContent = msg;
}

function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) return imageCache.get(src);

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

function populateSelects() {
  // Art presets
  el.artPreset.innerHTML = "";
  for (const preset of ART_PRESETS) {
    const opt = document.createElement("option");
    opt.value = preset.id;
    opt.textContent = preset.label;
    el.artPreset.appendChild(opt);
  }
  const customArtOpt = document.createElement("option");
  customArtOpt.value = "custom";
  customArtOpt.textContent = "Custom Uploaded Art";
  el.artPreset.appendChild(customArtOpt);

  // Pre-made Card Backs
  el.cbPreset.innerHTML = "";
  for (const file of CARD_BACK_PRESETS) {
    const opt = document.createElement("option");
    opt.value = file;
    opt.textContent = file.replace(/\.png$/i, "").replace(/^_/, "");
    el.cbPreset.appendChild(opt);
  }

  // Modular Card Back Decors
  el.cbDecor.innerHTML = '<option value="none">None</option>';
  for (let i = 1; i <= 8; i++) {
    const opt = document.createElement("option");
    opt.value = `big_decor_${i}`;
    opt.textContent = `Big Decor ${i}`;
    el.cbDecor.appendChild(opt);
  }
  for (let i = 1; i <= 16; i++) {
    const opt = document.createElement("option");
    opt.value = `small_decor_${i}`;
    opt.textContent = `Small Decor ${i}`;
    el.cbDecor.appendChild(opt);
  }

  // Corners 1..18
  el.cbCorners.innerHTML = '<option value="none">None</option>';
  for (let i = 1; i <= 18; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `Corners ${i}`;
    el.cbCorners.appendChild(opt);
  }

  // Vertical sides 1..14
  el.cbVsides.innerHTML = '<option value="none">None</option>';
  for (let i = 1; i <= 14; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `Vertical Sides ${i}`;
    el.cbVsides.appendChild(opt);
  }

  // Horizontal sides 1..14
  el.cbHsides.innerHTML = '<option value="none">None</option>';
  for (let i = 1; i <= 14; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `Horizontal Sides ${i}`;
    el.cbHsides.appendChild(opt);
  }

  // Key elements: Crystal 1..8, Emblem 1..6
  el.cbKey.innerHTML = '<option value="none">None</option>';
  for (let i = 1; i <= 8; i++) {
    const opt = document.createElement("option");
    opt.value = `crystal_${i}`;
    opt.textContent = `Crystal ${i}`;
    el.cbKey.appendChild(opt);
  }
  for (let i = 1; i <= 6; i++) {
    const opt = document.createElement("option");
    opt.value = `emblem_${i}`;
    opt.textContent = `Emblem ${i}`;
    el.cbKey.appendChild(opt);
  }

  // Booster backgrounds
  el.bstBg.innerHTML = '<option value="default">Default Pack Background</option>';
  for (const preset of ART_PRESETS.slice(1)) {
    const opt = document.createElement("option");
    opt.value = preset.id;
    opt.textContent = preset.label;
    el.bstBg.appendChild(opt);
  }
  const customBstOpt = document.createElement("option");
  customBstOpt.value = "custom";
  customBstOpt.textContent = "Custom Uploaded Background";
  el.bstBg.appendChild(customBstOpt);
}

function syncFormFromState() {
  document.querySelectorAll('input[name="studioMode"]').forEach((r) => {
    r.checked = r.value === state.mode;
  });

  el.panelMinion.hidden = state.mode !== "minion";
  el.panelCardBack.hidden = state.mode !== "card_back";
  el.panelBooster.hidden = state.mode !== "booster";

  // Minion
  el.name.value = state.name;
  el.mana.value = state.mana;
  el.type.value = state.type;
  el.description.value = state.description;
  el.showStats.checked = state.showStats;
  el.statsInputs.hidden = !state.showStats;
  el.attack.value = state.attack;
  el.health.value = state.health;
  el.artPreset.value = state.customArtDataUrl ? "custom" : state.artPreset;
  el.artZoom.value = state.artZoom;
  el.artZoomVal.textContent = `${state.artZoom}%`;
  el.artX.value = state.artX;
  el.artXVal.textContent = String(state.artX);
  el.artY.value = state.artY;
  el.artYVal.textContent = String(state.artY);
  el.frameStyle.value = state.frameStyle;
  el.frameColor.value = state.frameColor;
  el.enableTint.checked = state.enableTint;
  el.rarity.value = state.rarity;
  el.emblem.value = state.emblem;

  // Card Back
  el.cbSource.value = state.cbSource;
  el.cbPresetControls.hidden = state.cbSource !== "preset";
  el.cbModularControls.hidden = state.cbSource !== "modular";
  el.cbPreset.value = state.cbPreset;
  el.cbBase.value = state.cbBase;
  el.cbBaseColor.value = state.cbBaseColor;
  el.cbBaseTint.checked = state.cbBaseTint;
  el.cbDecor.value = state.cbDecor;
  el.cbCorners.value = state.cbCorners;
  el.cbVsides.value = state.cbVsides;
  el.cbHsides.value = state.cbHsides;
  el.cbDecorColor.value = state.cbDecorColor;
  el.cbDecorTint.checked = state.cbDecorTint;
  el.cbKey.value = state.cbKey;
  el.cbKeyColor.value = state.cbKeyColor;
  el.cbKeyTint.checked = state.cbKeyTint;

  // Booster
  el.bstBody.value = state.bstBody;
  el.bstColor.value = state.bstColor;
  el.bstTint.checked = state.bstTint;
  el.bstBg.value = state.bstCustomBgDataUrl ? "custom" : state.bstBg;
  el.bstTopText.value = state.bstTopText;
  el.bstBottomText.value = state.bstBottomText;
  el.bstShowGameLogo.checked = state.bstShowGameLogo;
  el.bstShowCompanyLogo.checked = state.bstShowCompanyLogo;

  // Shared
  el.texture.value = state.texture;
}

function drawTintedImage(targetCtx, imgOrCanvas, color, enabled) {
  if (!imgOrCanvas) return;
  if (!enabled) {
    targetCtx.drawImage(imgOrCanvas, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    return;
  }
  offscreenTintCtx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  offscreenTintCtx.globalCompositeOperation = "source-over";
  offscreenTintCtx.drawImage(imgOrCanvas, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  offscreenTintCtx.globalCompositeOperation = "color";
  offscreenTintCtx.fillStyle = color;
  offscreenTintCtx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  offscreenTintCtx.globalCompositeOperation = "destination-in";
  offscreenTintCtx.drawImage(imgOrCanvas, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  offscreenTintCtx.globalCompositeOperation = "source-over";
  targetCtx.drawImage(offscreenTint, 0, 0);
}

async function applySurfaceTexture() {
  if (state.texture === "none" || !TEXTURE_CONFIG[state.texture]) return;
  const cfg = TEXTURE_CONFIG[state.texture];
  const textureImg = await loadImage(cfg.path);
  if (!textureImg) return;

  offscreenTexCtx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  offscreenTexCtx.globalCompositeOperation = "source-over";
  offscreenTexCtx.drawImage(textureImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  offscreenTexCtx.globalCompositeOperation = "destination-in";
  offscreenTexCtx.drawImage(canvas, 0, 0);
  offscreenTexCtx.globalCompositeOperation = "source-over";

  ctx.save();
  ctx.globalCompositeOperation = cfg.blend;
  ctx.globalAlpha = cfg.alpha;
  ctx.drawImage(offscreenTex, 0, 0);
  ctx.restore();
}

function scheduleRender() {
  saveCurrentState();
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(async () => {
    renderQueued = false;
    await renderCurrentMode();
  });
}

async function renderCurrentMode() {
  await document.fonts.ready;
  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  if (state.mode === "minion") {
    await renderMinionCard();
  } else if (state.mode === "card_back") {
    await renderCardBack();
  } else if (state.mode === "booster") {
    await renderBoosterPack();
  }

  await applySurfaceTexture();
}

async function renderMinionCard() {
  const framePaths = {
    standard: "assets/minion_psd/back.png",
    alt1: "assets/minion_psd/back_alt_1.png",
    alt2: "assets/minion_psd/back_alt_2.png",
    alt3: "assets/minion_psd/back_alt_3.png",
  };

  const artSrc = state.customArtDataUrl
    ? state.customArtDataUrl
    : (ART_PRESETS.find((p) => p.id === state.artPreset) || ART_PRESETS[0]).path;

  const [
    downMarkImg,
    backImg,
    statsImg,
    backCircleImg,
    artImg,
    frontCircleImg,
    descriptionImg,
    emblemImg,
    costImg,
    nameImg,
    rarityImg,
  ] = await Promise.all([
    loadImage("assets/minion_psd/down_mark.png"),
    loadImage(framePaths[state.frameStyle] || framePaths.standard),
    state.showStats ? loadImage("assets/minion_psd/stats.png") : Promise.resolve(null),
    loadImage("assets/minion_psd/back_circle.png"),
    loadImage(artSrc),
    loadImage("assets/minion_psd/front_circle.png"),
    loadImage("assets/minion_psd/description.png"),
    state.emblem !== "none" ? loadImage(`assets/minion_psd/emblem_${state.emblem}.png`) : Promise.resolve(null),
    loadImage("assets/minion_psd/cost.png"),
    loadImage("assets/minion_psd/name.png"),
    state.rarity !== "none" ? loadImage(`assets/minion_psd/rarity_${state.rarity}.png`) : Promise.resolve(null),
  ]);

  if (downMarkImg) ctx.drawImage(downMarkImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  if (backImg) drawTintedImage(ctx, backImg, state.frameColor, state.enableTint);
  if (statsImg) ctx.drawImage(statsImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  if (backCircleImg) ctx.drawImage(backCircleImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);

  if (artImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(530, 526, 305, 0, Math.PI * 2);
    ctx.clip();

    if (artSrc === "assets/minion_psd/default_art.png") {
      const scale = state.artZoom / 100;
      ctx.translate(530 + state.artX, 526 + state.artY);
      ctx.scale(scale, scale);
      ctx.drawImage(artImg, -530, -526, CARD_WIDTH, CARD_HEIGHT);
    } else {
      const targetSize = 640;
      const baseScale = Math.max(targetSize / artImg.width, targetSize / artImg.height);
      const scale = baseScale * (state.artZoom / 100);
      const drawW = artImg.width * scale;
      const drawH = artImg.height * scale;
      ctx.drawImage(
        artImg,
        530 - drawW / 2 + state.artX,
        526 - drawH / 2 + state.artY,
        drawW,
        drawH
      );
    }
    ctx.restore();
  }

  if (frontCircleImg) {
    ctx.save();
    ctx.globalAlpha = 168 / 255;
    ctx.drawImage(frontCircleImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    ctx.restore();
  }

  if (descriptionImg) ctx.drawImage(descriptionImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);

  if (emblemImg) {
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = 115 / 255;
    ctx.drawImage(emblemImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    ctx.restore();
  }

  if (costImg) ctx.drawImage(costImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  if (nameImg) ctx.drawImage(nameImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  if (rarityImg) ctx.drawImage(rarityImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);

  drawCardText();
}

async function renderCardBack() {
  if (state.cbSource === "preset") {
    const presetImg = await loadImage(`assets/card_back/${state.cbPreset}`);
    if (presetImg) {
      ctx.drawImage(presetImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    }
    return;
  }

  const basePath = state.cbBase === "broken" ? "assets/card_back_psd/base_broken.png" : "assets/card_back_psd/base_full.png";
  const decorPath = state.cbDecor !== "none" ? `assets/card_back_psd/decor_${state.cbDecor}.png` : null;
  const cornersPath = state.cbCorners !== "none" ? `assets/card_back_psd/corners_${state.cbCorners}.png` : null;
  const vsidesPath = state.cbVsides !== "none" ? `assets/card_back_psd/vsides_${state.cbVsides}.png` : null;
  const hsidesPath = state.cbHsides !== "none" ? `assets/card_back_psd/hsides_${state.cbHsides}.png` : null;
  const keyPath = state.cbKey !== "none" ? `assets/card_back_psd/${state.cbKey}.png` : null;

  const [baseImg, decorImg, cornersImg, vsidesImg, hsidesImg, keyImg] = await Promise.all([
    loadImage(basePath),
    loadImage(decorPath),
    loadImage(cornersPath),
    loadImage(vsidesPath),
    loadImage(hsidesPath),
    loadImage(keyPath),
  ]);

  if (baseImg) {
    drawTintedImage(ctx, baseImg, state.cbBaseColor, state.cbBaseTint);
  }

  // Composite decorations into offscreen group so tint applies uniformly
  offscreenGroupCtx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  if (decorImg) offscreenGroupCtx.drawImage(decorImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  if (cornersImg) offscreenGroupCtx.drawImage(cornersImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  if (vsidesImg) offscreenGroupCtx.drawImage(vsidesImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  if (hsidesImg) offscreenGroupCtx.drawImage(hsidesImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  drawTintedImage(ctx, offscreenGroup, state.cbDecorColor, state.cbDecorTint);

  if (keyImg) {
    drawTintedImage(ctx, keyImg, state.cbKeyColor, state.cbKeyTint);
  }
}

async function renderBoosterPack() {
  const bodyPath = state.bstBody === "smooth" ? "assets/booster_psd/body_smooth.png" : "assets/booster_psd/body_wave.png";
  let bgSrc = "assets/booster_psd/background_replace.png";
  if (state.bstCustomBgDataUrl) {
    bgSrc = state.bstCustomBgDataUrl;
  } else if (state.bstBg !== "default") {
    const preset = ART_PRESETS.find((p) => p.id === state.bstBg);
    if (preset) bgSrc = preset.path;
  }

  const [bodyImg, bgImg, gameLogoImg, companyLogoImg] = await Promise.all([
    loadImage(bodyPath),
    loadImage(bgSrc),
    state.bstShowGameLogo ? loadImage("assets/booster_psd/logo_game.png") : Promise.resolve(null),
    state.bstShowCompanyLogo ? loadImage("assets/booster_psd/logo_company.png") : Promise.resolve(null),
  ]);

  if (bodyImg) {
    drawTintedImage(ctx, bodyImg, state.bstColor, state.bstTint);
  }

  if (bgImg && bodyImg) {
    // Clip background art to booster body silhouette, leaving wrapper top/bottom crimp visible
    offscreenGroupCtx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    offscreenGroupCtx.globalCompositeOperation = "source-over";
    if (bgSrc === "assets/booster_psd/background_replace.png") {
      offscreenGroupCtx.drawImage(bgImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    } else {
      const targetW = 860;
      const targetH = 1160;
      const scale = Math.max(targetW / bgImg.width, targetH / bgImg.height);
      const dw = bgImg.width * scale;
      const dh = bgImg.height * scale;
      offscreenGroupCtx.drawImage(bgImg, 531 - dw / 2, 735 - dh / 2, dw, dh);
    }
    offscreenGroupCtx.globalCompositeOperation = "destination-in";
    offscreenGroupCtx.drawImage(bodyImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    offscreenGroupCtx.globalCompositeOperation = "source-over";
    ctx.drawImage(offscreenGroup, 0, 0);
  }

  if (gameLogoImg) ctx.drawImage(gameLogoImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  if (companyLogoImg) ctx.drawImage(companyLogoImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);

  if (state.bstTopText.trim()) {
    drawShadowedText(state.bstTopText, 531, 218, '700 40px "Baloo Chettan 2", sans-serif');
  }
  if (state.bstBottomText.trim()) {
    drawShadowedText(state.bstBottomText, 716, 1218, '700 40px "Baloo Chettan 2", sans-serif');
  }
}

function drawShadowedText(text, x, y, font, fill = "#ffffff") {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 0, 0, 0.72)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawCurvedName(text) {
  if (!text.trim()) return;
  const maxArcWidth = 570;
  let fontSize = 72;
  ctx.save();

  while (fontSize > 34) {
    ctx.font = `700 ${fontSize}px "Baloo Chettan 2", sans-serif`;
    if (ctx.measureText(text).width <= maxArcWidth) break;
    fontSize -= 2;
  }

  const radius = 1650;
  const centerX = 530;
  const centerY = 208 + radius;

  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalWidth = widths.reduce((a, b) => a + b, 0);
  const totalAngle = totalWidth / radius;
  let currentAngle = -Math.PI / 2 - totalAngle / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#ffffff";

  for (let i = 0; i < chars.length; i++) {
    const w = widths[i];
    const charAngle = currentAngle + w / (2 * radius);
    ctx.save();
    ctx.translate(
      centerX + Math.cos(charAngle) * radius,
      centerY + Math.sin(charAngle) * radius
    );
    ctx.rotate(charAngle + Math.PI / 2);
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
    currentAngle += w / radius;
  }
  ctx.restore();
}

function parseRichTokens(text) {
  return text.split("\n").map((paragraph) => {
    const tokens = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(paragraph)) !== null) {
      if (match.index > lastIndex) {
        for (const word of paragraph.slice(lastIndex, match.index).split(/(\s+)/)) {
          if (word) tokens.push({ text: word, bold: false });
        }
      }
      for (const word of match[1].split(/(\s+)/)) {
        if (word) tokens.push({ text: word, bold: true });
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < paragraph.length) {
      for (const word of paragraph.slice(lastIndex).split(/(\s+)/)) {
        if (word) tokens.push({ text: word, bold: false });
      }
    }
    return tokens;
  });
}

function drawDescriptionText(text) {
  if (!text.trim()) return;
  const maxWidth = 540;
  const boxCenterX = 530;
  const boxCenterY = 995;
  const maxHeight = 290;

  const paragraphs = parseRichTokens(text);
  let fontSize = 40;
  let wrappedLines = [];

  while (fontSize >= 22) {
    const lineHeight = fontSize * 1.28;
    wrappedLines = [];

    for (const tokens of paragraphs) {
      let currentLine = [];
      let currentWidth = 0;

      for (const token of tokens) {
        const weight = token.bold ? 700 : 500;
        ctx.font = `${weight} ${fontSize}px "Baloo Chettan 2", sans-serif`;
        const w = ctx.measureText(token.text).width;

        if (currentLine.length > 0 && currentWidth + w > maxWidth && !/^\s+$/.test(token.text)) {
          wrappedLines.push(currentLine);
          currentLine = [];
          currentWidth = 0;
          if (/^\s+$/.test(token.text)) continue;
        }
        if (currentLine.length === 0 && /^\s+$/.test(token.text)) continue;
        currentLine.push({ ...token, width: w });
        currentWidth += w;
      }
      wrappedLines.push(currentLine);
    }

    if (wrappedLines.length * lineHeight <= maxHeight) break;
    fontSize -= 2;
  }

  const lineHeight = fontSize * 1.28;
  const totalHeight = wrappedLines.length * lineHeight;
  let y = boxCenterY - totalHeight / 2 + lineHeight / 2;

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#ffffff";

  for (const line of wrappedLines) {
    while (line.length && /^\s+$/.test(line[line.length - 1].text)) line.pop();
    const lineWidth = line.reduce((acc, t) => acc + t.width, 0);
    let x = boxCenterX - lineWidth / 2;
    for (const token of line) {
      const weight = token.bold ? 700 : 500;
      ctx.font = `${weight} ${fontSize}px "Baloo Chettan 2", sans-serif`;
      ctx.fillText(token.text, x, y);
      x += token.width;
    }
    y += lineHeight;
  }
  ctx.restore();
}

function drawCardText() {
  drawShadowedText(state.mana, 530, 96, '700 104px "Baloo Chettan 2", sans-serif');
  drawCurvedName(state.name);
  drawDescriptionText(state.description);
  if (state.showStats) {
    drawShadowedText(state.attack, 196, 1278, '700 116px "Baloo Chettan 2", sans-serif');
    drawShadowedText(state.health, 863, 1278, '700 116px "Baloo Chettan 2", sans-serif');
  }
  drawShadowedText(state.type, 530, 1368, '600 66px "Baloo Chettan 2", sans-serif');
}

function getExportBaseName() {
  if (state.mode === "card_back") {
    return state.cbSource === "preset" ? `card-back-${state.cbPreset.replace(/\.png$/i, "")}` : "custom-card-back";
  }
  if (state.mode === "booster") {
    return state.bstTopText || "booster-pack";
  }
  return state.name || "card";
}

function slugify(name) {
  return (name || "card")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "card";
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportPng() {
  const base = slugify(getExportBaseName());
  try {
    canvas.toBlob((blob) => {
      if (!blob) {
        announce("Failed to export PNG.");
        return;
      }
      downloadBlob(blob, `${base}.png`);
      announce(`Exported ${base}.png`);
    }, "image/png");
  } catch (err) {
    el.protocolWarning.hidden = false;
    announce("PNG export blocked on file:// protocol. Start a local server.");
    console.error(err);
  }
}

function exportJson() {
  const base = slugify(getExportBaseName());
  const payload = {
    version: 1,
    app: "mechanized-magic-card-maker",
    exportedAt: new Date().toISOString(),
    card: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${base}.card.json`);
  announce(`Exported ${base}.card.json`);
}

function loadCardObject(cardObj) {
  state = {
    ...DEFAULT_CARD,
    ...cardObj,
    id: cardObj.id || crypto.randomUUID?.() || String(Date.now()),
  };
  syncFormFromState();
  scheduleRender();
}

function handleJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (parsed.cards && Array.isArray(parsed.cards) && parsed.cards.length > 0) {
        const lib = getLibrary();
        for (const c of parsed.cards) {
          lib.push({ ...DEFAULT_CARD, ...c, id: crypto.randomUUID?.() || String(Date.now() + Math.random()) });
        }
        saveLibrary(lib);
        renderLibrary();
        loadCardObject(parsed.cards[0]);
        announce(`Imported ${parsed.cards.length} items into library.`);
      } else {
        const cardData = parsed.card ? parsed.card : parsed;
        loadCardObject(cardData);
        announce(`Imported "${getExportBaseName()}".`);
      }
    } catch {
      announce("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
}

function handleImageFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    if (state.mode === "booster") {
      state.bstCustomBgDataUrl = reader.result;
      state.bstBg = "custom";
    } else {
      state.customArtDataUrl = reader.result;
      state.artPreset = "custom";
      state.artZoom = 100;
      state.artX = 0;
      state.artY = 0;
    }
    syncFormFromState();
    scheduleRender();
    announce(`Loaded custom image "${file.name}".`);
  };
  reader.readAsDataURL(file);
}

function getLibrary() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_LIBRARY) || "[]");
  } catch {
    return [];
  }
}

function saveLibrary(lib) {
  try {
    localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(lib));
  } catch {
    announce("Could not save to browser storage (storage quota exceeded).");
  }
}

function renderLibrary() {
  const lib = getLibrary();
  el.libraryList.innerHTML = "";
  if (lib.length === 0) {
    const p = document.createElement("p");
    p.className = "empty-library";
    p.textContent = 'No saved items yet. Click "Save to Library" to store cards locally in your browser.';
    el.libraryList.appendChild(p);
    return;
  }

  for (const item of lib) {
    const cardEl = document.createElement("div");
    cardEl.className = "library-item";
    cardEl.setAttribute("role", "listitem");

    const title = document.createElement("div");
    title.className = "library-item-title";
    const mode = item.mode || "minion";
    if (mode === "card_back") {
      title.textContent = item.cbSource === "preset" ? `Back: ${item.cbPreset}` : "Custom Card Back";
    } else if (mode === "booster") {
      title.textContent = `Booster: ${item.bstTopText || "Pack"}`;
    } else {
      title.textContent = item.name || "Untitled";
    }

    const meta = document.createElement("div");
    meta.className = "library-item-meta";
    if (mode === "card_back") {
      meta.textContent = "Card Back";
    } else if (mode === "booster") {
      meta.textContent = `Booster (${item.bstBody || "wave"})`;
    } else {
      meta.textContent = `${item.type || "card"} • Mana ${item.mana || "0"}${item.showStats ? ` • ${item.attack}/${item.health}` : ""}`;
    }

    const actions = document.createElement("div");
    actions.className = "library-item-actions";

    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.className = "btn btn-small btn-primary";
    loadBtn.textContent = "Load";
    loadBtn.addEventListener("click", () => {
      loadCardObject(item);
      announce(`Loaded "${title.textContent}".`);
    });

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn btn-small btn-secondary";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      const next = getLibrary().filter((c) => c.id !== item.id);
      saveLibrary(next);
      renderLibrary();
      announce(`Deleted "${title.textContent}" from library.`);
    });

    actions.append(loadBtn, delBtn);
    cardEl.append(title, meta, actions);
    el.libraryList.appendChild(cardEl);
  }
}

function bindEvents() {
  document.querySelectorAll('input[name="studioMode"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        state.mode = radio.value;
        syncFormFromState();
        scheduleRender();
      }
    });
  });

  const valueBindings = [
    [el.name, "name"],
    [el.mana, "mana"],
    [el.type, "type"],
    [el.description, "description"],
    [el.attack, "attack"],
    [el.health, "health"],
    [el.frameStyle, "frameStyle"],
    [el.rarity, "rarity"],
    [el.emblem, "emblem"],
    [el.cbPreset, "cbPreset"],
    [el.cbBase, "cbBase"],
    [el.cbDecor, "cbDecor"],
    [el.cbCorners, "cbCorners"],
    [el.cbVsides, "cbVsides"],
    [el.cbHsides, "cbHsides"],
    [el.cbKey, "cbKey"],
    [el.bstBody, "bstBody"],
    [el.bstTopText, "bstTopText"],
    [el.bstBottomText, "bstBottomText"],
    [el.texture, "texture"],
  ];

  for (const [input, key] of valueBindings) {
    input.addEventListener("input", () => {
      state[key] = input.value;
      scheduleRender();
    });
  }

  el.showStats.addEventListener("change", () => {
    state.showStats = el.showStats.checked;
    el.statsInputs.hidden = !state.showStats;
    scheduleRender();
  });

  el.cbSource.addEventListener("change", () => {
    state.cbSource = el.cbSource.value;
    syncFormFromState();
    scheduleRender();
  });

  // Color + tint checkbox pairs
  const colorTintPairs = [
    [el.frameColor, el.enableTint, "frameColor", "enableTint"],
    [el.cbBaseColor, el.cbBaseTint, "cbBaseColor", "cbBaseTint"],
    [el.cbDecorColor, el.cbDecorTint, "cbDecorColor", "cbDecorTint"],
    [el.cbKeyColor, el.cbKeyTint, "cbKeyColor", "cbKeyTint"],
    [el.bstColor, el.bstTint, "bstColor", "bstTint"],
  ];

  for (const [colorEl, checkEl, colorKey, checkKey] of colorTintPairs) {
    colorEl.addEventListener("input", () => {
      state[colorKey] = colorEl.value;
      state[checkKey] = true;
      checkEl.checked = true;
      scheduleRender();
    });
    checkEl.addEventListener("change", () => {
      state[checkKey] = checkEl.checked;
      scheduleRender();
    });
  }

  el.bstShowGameLogo.addEventListener("change", () => {
    state.bstShowGameLogo = el.bstShowGameLogo.checked;
    scheduleRender();
  });

  el.bstShowCompanyLogo.addEventListener("change", () => {
    state.bstShowCompanyLogo = el.bstShowCompanyLogo.checked;
    scheduleRender();
  });

  el.artPreset.addEventListener("change", () => {
    if (el.artPreset.value !== "custom") {
      state.artPreset = el.artPreset.value;
      state.customArtDataUrl = null;
      scheduleRender();
    }
  });

  el.bstBg.addEventListener("change", () => {
    if (el.bstBg.value !== "custom") {
      state.bstBg = el.bstBg.value;
      state.bstCustomBgDataUrl = null;
      scheduleRender();
    }
  });

  el.artUpload.addEventListener("change", () => {
    if (el.artUpload.files[0]) {
      handleImageFile(el.artUpload.files[0]);
      el.artUpload.value = "";
    }
  });

  el.bstBgUpload.addEventListener("change", () => {
    if (el.bstBgUpload.files[0]) {
      handleImageFile(el.bstBgUpload.files[0]);
      el.bstBgUpload.value = "";
    }
  });

  el.artZoom.addEventListener("input", () => {
    state.artZoom = Number(el.artZoom.value);
    el.artZoomVal.textContent = `${state.artZoom}%`;
    scheduleRender();
  });

  el.artX.addEventListener("input", () => {
    state.artX = Number(el.artX.value);
    el.artXVal.textContent = String(state.artX);
    scheduleRender();
  });

  el.artY.addEventListener("input", () => {
    state.artY = Number(el.artY.value);
    el.artYVal.textContent = String(state.artY);
    scheduleRender();
  });

  document.getElementById("btn-reset-art").addEventListener("click", () => {
    state.artZoom = 100;
    state.artX = 0;
    state.artY = 0;
    syncFormFromState();
    scheduleRender();
  });

  document.querySelectorAll(".swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      const color = btn.dataset.color;
      if (!color) {
        state.enableTint = false;
      } else {
        state.enableTint = true;
        state.frameColor = color;
      }
      syncFormFromState();
      scheduleRender();
    });
  });

  document.getElementById("btn-export-png").addEventListener("click", exportPng);
  document.getElementById("btn-export-json").addEventListener("click", exportJson);

  document.getElementById("btn-import-json").addEventListener("click", () => {
    el.jsonInput.click();
  });

  el.jsonInput.addEventListener("change", () => {
    if (el.jsonInput.files[0]) {
      handleJsonFile(el.jsonInput.files[0]);
      el.jsonInput.value = "";
    }
  });

  document.getElementById("btn-new-card").addEventListener("click", () => {
    loadCardObject({
      ...DEFAULT_CARD,
      mode: state.mode,
      id: crypto.randomUUID?.() || String(Date.now()),
    });
    announce("Reset current item to defaults.");
  });

  document.getElementById("btn-save-library").addEventListener("click", () => {
    const lib = getLibrary();
    const idx = lib.findIndex((c) => c.id === state.id);
    const snapshot = { ...state, id: state.id || crypto.randomUUID?.() || String(Date.now()) };
    state.id = snapshot.id;
    if (idx >= 0) {
      lib[idx] = snapshot;
    } else {
      lib.unshift(snapshot);
    }
    saveLibrary(lib);
    renderLibrary();
    announce(`Saved "${getExportBaseName()}" to library.`);
  });

  document.getElementById("btn-export-deck").addEventListener("click", () => {
    const lib = getLibrary();
    if (lib.length === 0) {
      announce("Library is empty.");
      return;
    }
    const payload = {
      version: 1,
      app: "mechanized-magic-card-maker",
      exportedAt: new Date().toISOString(),
      cards: lib,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    downloadBlob(blob, "mechanized-magic-deck.json");
    announce(`Exported ${lib.length} items.`);
  });

  // Canvas pointer drag for panning artwork in Minion mode
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener("pointerdown", (e) => {
    if (state.mode !== "minion") return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragging || state.mode !== "minion") return;
    const rect = canvas.getBoundingClientRect();
    const scale = CARD_WIDTH / rect.width;
    const dx = (e.clientX - lastX) * scale;
    const dy = (e.clientY - lastY) * scale;
    lastX = e.clientX;
    lastY = e.clientY;

    state.artX = Math.max(-300, Math.min(300, Math.round(state.artX + dx)));
    state.artY = Math.max(-300, Math.min(300, Math.round(state.artY + dy)));
    el.artX.value = state.artX;
    el.artXVal.textContent = String(state.artX);
    el.artY.value = state.artY;
    el.artYVal.textContent = String(state.artY);
    scheduleRender();
  });

  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  el.dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    el.dropZone.classList.add("drag-over");
  });

  el.dropZone.addEventListener("dragleave", () => {
    el.dropZone.classList.remove("drag-over");
  });

  el.dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    el.dropZone.classList.remove("drag-over");
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (file.name.endsWith(".json") || file.type === "application/json") {
      handleJsonFile(file);
    } else if (file.type.startsWith("image/")) {
      handleImageFile(file);
    }
  });
}

if (window.location.protocol === "file:") {
  el.protocolWarning.hidden = false;
}
populateSelects();
syncFormFromState();
renderLibrary();
bindEvents();
scheduleRender();
