/* Explicit DOM/native-canvas harness. Not a real-browser test. */
const fs = require("fs"),
  path = require("path"),
  assert = require("assert/strict"),
  { JSDOM } = require("jsdom"),
  native = require("@napi-rs/canvas");
(async () => {
  const root = path.resolve(__dirname, ".."),
    dom = new JSDOM(fs.readFileSync(path.join(root, "START.html"), "utf8"), {
      runScripts: "outside-only",
      url: "https://offline.invalid/",
    }),
    w = dom.window,
    canvases = new WeakMap();
  function canvas(el) {
    let c = canvases.get(el);
    if (!c || c.width !== el.width || c.height !== el.height) {
      c = native.createCanvas(el.width || 1, el.height || 1);
      canvases.set(el, c);
    }
    return c;
  }
  w.HTMLCanvasElement.prototype.getContext = function () {
    const ctx = canvas(this).getContext("2d");
    return new Proxy(ctx, {
      get(t, k) {
        if (k === "drawImage")
          return (im, ...a) =>
            t.drawImage(
              im instanceof w.HTMLCanvasElement ? canvas(im) : im,
              ...a,
            );
        const x = t[k];
        return typeof x === "function" ? x.bind(t) : x;
      },
      set(t, k, v) {
        t[k] = v;
        return true;
      },
    });
  };
  w.HTMLCanvasElement.prototype.toDataURL = function () {
    return canvas(this).toDataURL("image/png");
  };
  w.HTMLCanvasElement.prototype.toBlob = function (cb) {
    cb(new w.Blob([canvas(this).toBuffer("image/png")], { type: "image/png" }));
  };
  w.Image = class extends native.Image {
    set src(v) {
      super.src =
        typeof v === "string" && v.startsWith("data:")
          ? Buffer.from(v.split(",")[1], "base64")
          : v;
    }
    get src() {
      return super.src;
    }
  };
  w.Audio = class {
    constructor() {
      this.paused = true;
      this.currentTime = 0;
      this.duration = 1;
      this.volume = 1;
    }
    pause() {
      this.paused = true;
    }
    play() {
      this.paused = false;
      return Promise.resolve();
    }
    load() {
      this.onloadedmetadata?.();
    }
  };
  w.requestAnimationFrame = () => 0;
  const downloads = [];
  w.URL.createObjectURL = (b) => {
    downloads.push(b);
    return "blob:test";
  };
  w.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = function () {};
  w.setTimeout = setTimeout;
  for (const f of [
    "app/audio.js",
    "app/library.js",
    "app/core.js",
    "app/demo.js",
    "app/timeline.js",
    "app/editor.js",
    "vendor/pdf-lib/pdf-lib.min.js",
    "app/print.js",
    "app/print-ui.js",
    "vendor/voice/voice.bundle.js",
    "app/voice-tools.js",
    "app/voice-ui.js",
    "app/recorder.js",
    "app/recorder-ui.js",
    "app/character-palettes.js",
    "app/catalog.js",
    "app/catalog-ui.js",
    "app/bitmap-ui.js",
    "app/puppet.js",
    "app/puppet-actions.js",
    "app/puppet-ui.js",
    "app/scene-props.js",
    "app/scene-backgrounds.js",
    "app/scene-effects.js",
    "app/scene-library.js",
    "app/scene-library-ui.js",
    "app/browser-self-test.js",
  ])
    w.eval(fs.readFileSync(path.join(root, f), "utf8"));
  const $ = (id) => w.document.getElementById(id),
    click = async (id) => await $(id).onclick(),
    get = () => w.Editor.getProject();
  w.confirm = () => true;
  w.Editor.load(w.Studio.blank());
  await click("puppetAdd");
  let r = get().scenes[0].nodes[0];
  assert.equal(r.puppet.rig, "humanoid-v1");
  assert.equal($("puppetJoint").options.length, 29);
  $("puppetskin").value = "#76543a";
  $("puppetshirt").value = "#764a9c";
  await click("puppetStyle");
  assert.equal(get().scenes[0].nodes[0].puppet.style.skin, "#76543a");
  $("puppetJoint").value = "elbowR";
  $("puppetJoint").onchange();
  $("puppetRotation").value = "90";
  await click("puppetSetJoint");
  r = get().scenes[0].nodes[0];
  assert.equal(w.StudioPuppet2D.joint(r, "elbowR").keys[0].rotation, 90);
  await click("puppetClear");
  $("puppetAction").value = "wave";
  $("puppetDuration").value = "2";
  await click("puppetApplyAction");
  r = get().scenes[0].nodes[0];
  assert.equal(r.puppet.clips.length, 1);
  const before = JSON.stringify(get());
  await click("puppetApplyAction");
  assert.match($("puppetStatus").textContent, /overlap/);
  assert.equal(JSON.stringify(get()), before);
  $("puppetHandShape").value = "fist";
  await click("puppetSetHand");
  r = get().scenes[0].nodes[0];
  assert.equal(w.StudioPuppet2D.joint(r, "handLFist").keys[0].opacity, 1);
  await click("puppetSavePose");
  await click("puppetSaveClip");
  assert.equal(downloads.length, 2);
  await click("catalogRefresh2D");
  assert.equal(
    $("catalogActor2D").options.length,
    0,
    "Legacy whole-limb actions must not target the new rig",
  );
  await click("puppetAdd");
  const p = get();
  assert.equal(p.scenes[0].nodes.length, 2);
  assert.notEqual(p.scenes[0].nodes[0].id, p.scenes[0].nodes[1].id);
  w.Studio.validate(p);
  $("puppetJoint").value = "torso";
  $("puppetJoint").onchange();
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 110"><path d="M0 0 H56 V110 H0 Z" fill="#c54465"/></svg>';
  Object.defineProperty($("puppetArtwork"), "files", {
    configurable: true,
    value: [{ size: svg.length, text: async () => svg }],
  });
  await $("puppetArtwork").onchange();
  const custom = get().scenes[0].nodes[1],
    torso = w.StudioPuppet2D.joint(custom, "torso");
  assert.equal(torso.children[0].children[0].children[0].attrs.fill, "#c54465");
  assert.equal(custom.puppet.joints.length, 29);
  w.Studio.validate(get());
  const good = JSON.stringify(get()),
    bad =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
  Object.defineProperty($("puppetArtwork"), "files", {
    configurable: true,
    value: [{ size: bad.length, text: async () => bad }],
  });
  await $("puppetArtwork").onchange();
  assert.equal(JSON.stringify(get()), good);
  assert.match($("puppetStatus").textContent, /unsafe/);
  await click("puppetClear");
  $("puppetCategory").value = "Combat";
  $("puppetCategory").onchange();
  assert.equal($("puppetAction").options.length, 14);
  $("puppetAction").value = "shoot-pistol";
  $("puppetAction").onchange();
  assert.match($("puppetActionHelp").textContent, /pistol/);
  $("puppetMirror").checked = true;
  $("puppetIntensity").value = "0.75";
  $("puppetAddAccessory").checked = true;
  await click("puppetApplyAction");
  r = get().scenes[0].nodes[1];
  assert.equal(r.puppet.accessories[0].side, "L");
  const accepted = JSON.stringify(get());
  await click("puppetApplyAction");
  assert.equal(JSON.stringify(get()), accepted);
  w.confirm = () => false;
  await click("puppetClear");
  assert.equal(JSON.stringify(get()), accepted, "cancel preserves action");
  w.confirm = () => true;
  await click("puppetClear");
  assert.equal(get().scenes[0].nodes[1].puppet.accessories.length, 0);
  $("puppetIntensity").value = "2";
  const unchanged = JSON.stringify(get());
  await click("puppetApplyAction");
  assert.equal(JSON.stringify(get()), unchanged);
  assert.match($("puppetStatus").textContent, /Intensity/);
  $("puppetCategory").value = "Powers";
  $("puppetCategory").onchange();
  assert.equal($("puppetAction").options.length, 8);
  $("puppetCategory").value = "Emotions";
  $("puppetCategory").onchange();
  assert.equal($("puppetAction").options.length, 16);
  $("puppetCategory").value = "All";
  $("puppetCategory").onchange();
  assert.equal($("puppetAction").options.length, 58);
  w.Editor.load(w.Studio.blank());
  await click("puppetAdd");
  await click("refreshSceneLibrary");
  assert.equal($("propsAsset").options.length, 72);
  assert.equal($("backgroundsAsset").options.length, 42);
  assert.equal($("effectsAsset").options.length, 22);
  $("propsCategory").value = "Fantasy weapons";
  $("propsCategory").onchange();
  assert(
    $("propsAsset").options.length > 5 && $("propsAsset").options.length < 72,
  );
  $("propsAsset").value = "longsword";
  $("propsAsset").onchange();
  $("propAttach").checked = true;
  await click("addSceneProp");
  let hero = get().scenes[0].nodes[0];
  assert(
    w.StudioPuppet2D.joint(hero, "wristR").children.some(
      (n) => n.grip?.side === "R",
    ),
  );
  let stable = JSON.stringify(get());
  await click("addSceneProp");
  assert.equal(JSON.stringify(get()), stable);
  assert.match($("sceneLibraryStatus").textContent, /already/);
  w.confirm = () => false;
  await click("removeHandProp");
  assert.equal(JSON.stringify(get()), stable);
  w.confirm = () => true;
  await click("removeHandProp");
  assert(
    !w.StudioPuppet2D.joint(get().scenes[0].nodes[0], "wristR").children.some(
      (n) => n.grip,
    ),
  );
  $("propAttach").checked = false;
  await click("addSceneProp");
  const actorBefore = JSON.stringify(get().scenes[0].nodes[0]);
  $("backgroundsAsset").value = "tropical-beach";
  await click("addSceneBackground");
  assert.equal(get().scenes[0].nodes[0].library.kind, "tropical-beach");
  assert.equal(JSON.stringify(get().scenes[0].nodes[1]), actorBefore);
  $("backgroundsAsset").value = "kitchen";
  await click("addSceneBackground");
  assert.equal(
    get().scenes[0].nodes.filter((n) => n.library?.role === "background")
      .length,
    1,
  );
  $("effectsAsset").value = "fire-flames";
  $("effectsAsset").onchange();
  $("overlayDuration").value = "2";
  $("overlayIntensity").value = "1.5";
  await click("addSceneOverlay");
  assert(get().scenes[0].nodes.some((n) => n.library?.kind === "fire-flames"));
  stable = JSON.stringify(get());
  $("overlayDuration").value = "300";
  await click("addSceneOverlay");
  assert.equal(JSON.stringify(get()), stable);
  assert.match($("sceneLibraryStatus").textContent, /past this scene/);
  w.Studio.validate(get());
  console.log(
    JSON.stringify({
      pass: true,
      scope: "Real UI handlers in jsdom; not physical browser interaction",
      checks: [
        "add",
        "style",
        "joint pose key",
        "clear",
        "action",
        "overlap preservation",
        "hand state",
        "pose and clip download",
        "legacy control isolation",
        "unique second puppet",
        "72 props / 42 backgrounds / 22 effects",
        "category filters",
        "attach / occupied-hand guard / cancelled removal / confirmed removal",
        "free-standing prop",
        "replace library background preserving actors",
        "overlay creation and rejected out-of-scene duration",
      ],
    }),
  );
  dom.window.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
