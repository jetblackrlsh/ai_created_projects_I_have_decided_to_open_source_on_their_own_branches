const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  native = require("@napi-rs/canvas"),
  S = require("../app/core.js"),
  P = require("../app/puppet-actions.js"),
  L = require("../app/scene-library.js");
(async () => {
  const out = path.resolve(__dirname, "../output/scene-library");
  fs.mkdirSync(out, { recursive: true });
  let samples = 0;
  const make = () => {
    const p = S.blank();
    p.width = 960;
    p.height = 540;
    p.scenes[0].duration = 5;
    p.scenes[0].background = "#edf0f5";
    return p;
  };
  async function raster(p, t = 0) {
    S.validate(p);
    const before = JSON.stringify(p),
      svg = S.render(p, t);
    assert.equal(S.render(p, t), svg);
    assert.equal(JSON.stringify(p), before);
    assert(!/NaN|Infinity|undefined/.test(svg));
    samples++;
    return native.loadImage(Buffer.from(svg));
  }
  for (const prop of L.props)
    for (const action of prop.actions)
      assert(P.actions.includes(action), "Unknown suggested motion: " + action);
  for (const type of ["props", "backgrounds", "effects"]) {
    const list = L[type],
      columns = type === "props" ? 6 : type === "backgrounds" ? 3 : 4,
      cw = type === "props" ? 200 : 320,
      ch = type === "props" ? 235 : 220,
      per = type === "props" ? 24 : 12;
    let sheet, ctx;
    for (let i = 0; i < list.length; i++) {
      if (i % per === 0) {
        sheet = native.createCanvas(
          columns * cw,
          Math.ceil(Math.min(per, list.length - i) / columns) * ch,
        );
        ctx = sheet.getContext("2d");
        ctx.fillStyle = "#edf0f5";
        ctx.fillRect(0, 0, sheet.width, sheet.height);
      }
      const item = list[i],
        p = make();
      let node;
      if (type === "props") {
        p.width = 200;
        p.height = 210;
        node = L.prop(item.id, "prop");
        node.pose = { ...S.defaults, x: 100, y: 102, scaleX: 0.7, scaleY: 0.7 };
      } else if (type === "backgrounds")
        node = L.background(item.id, "background", 960, 540);
      else {
        node = L.effect(item.id, "effect", 1, 2, 480, 270);
        for (let y = 0; y < 540; y += 45)
          for (let x = 0; x < 960; x += 45)
            if ((x / 45 + y / 45) % 2 === 0)
              p.scenes[0].nodes.push({
                id: "check_" + x + "_" + y,
                tag: "rect",
                attrs: { x, y, width: 45, height: 45, fill: "#d5dce4" },
                pose: { ...S.defaults },
                keys: [],
                children: [],
              });
      }
      p.scenes[0].nodes.push(node);
      const image = await raster(p, type === "effects" ? 1.8 : 0),
        col = i % columns,
        row = Math.floor((i % per) / columns);
      ctx.drawImage(
        image,
        col * cw,
        row * ch + 30,
        cw,
        type === "props" ? 205 : 180,
      );
      ctx.fillStyle = "#26384d";
      ctx.font = "15px sans-serif";
      ctx.fillText(item.label, col * cw + 6, row * ch + 20);
      if (type === "props") {
        for (const side of ["L", "R"])
          if (item.grip) {
            const rig = P.create("actor");
            const n = L.attach(rig, item.id, "held", side, {
              scale: 1,
              rotation: 0,
            });
            assert.equal(n.grip.side, side);
            const before = JSON.stringify(rig);
            assert.throws(
              () => L.attach(rig, item.id, "held2", side),
              /already/,
            );
            assert.equal(JSON.stringify(rig), before);
            assert.equal(L.remove(rig, side), 1);
            assert.equal(L.remove(rig, side), 0);
          }
      }
      if (type === "effects") {
        for (const intensity of [0.25, 2]) {
          const q = make();
          q.scenes[0].nodes = [
            L.effect(item.id, "testfx", 1, 2, 480, 270, {
              intensity,
              color: "#56adce",
            }),
          ];
          for (const t of [0, 0.99, 1, 1.5, 2, 2.9, 3, 4]) await raster(q, t);
          assert.equal(
            S.sample(q.scenes[0].nodes[0].pose, q.scenes[0].nodes[0].keys, 0.5)
              .opacity,
            0,
          );
          assert.equal(
            S.sample(q.scenes[0].nodes[0].pose, q.scenes[0].nodes[0].keys, 3.1)
              .opacity,
            0,
          );
        }
      }
      fs.writeFileSync(
        path.join(out, type + "-" + item.id + ".jetart2d.json"),
        JSON.stringify(
          {
            format: "jet2d-art-template",
            version: 1,
            width: p.width,
            height: p.height,
            node,
          },
          null,
          2,
        ),
      );
      if (i % per === per - 1 || i === list.length - 1)
        fs.writeFileSync(
          path.join(out, type + "-sheet-" + Math.floor(i / per) + ".png"),
          sheet.toBuffer("image/png"),
        );
    }
  }
  for (const args of [
    { color: "url(https://evil)" },
    { intensity: 3 },
    { intensity: NaN },
    { scale: 0 },
  ])
    assert.throws(() => L.effect("smoke-plume", "bad", 0, 2, 0, 0, args));
  assert.throws(() => L.effect("rain-streaks", "bad", 0, 31));
  assert.throws(() => L.attach(P.create("a"), "chair", "b", "R"), /stage-only/);
  const rig = P.create("a");
  L.attach(rig, "katana", "katanaHeld");
  const before = JSON.stringify(rig);
  assert.throws(
    () => P.addActionProp(rig, P.makeClip("weapon-slash", 2)),
    /already holds/,
  );
  assert.equal(JSON.stringify(rig), before);
  const demo = make();
  demo.scenes = [];
  let i = 0;
  for (const name of [
    "deciduous-forest",
    "castle-courtyard",
    "western-town",
    "city-night",
    "starship-bridge",
    "tropical-beach",
    "kitchen",
    "crystal-cavern",
  ]) {
    const p = make(),
      r = P.create("hero" + i, 475, 465, {
        skin: "#86583b",
        shirt: "#46879c",
        pants: "#384b69",
        hairVisible: true,
      });
    r.pose.scaleX = r.pose.scaleY = r.bindPose.scaleX = r.bindPose.scaleY = 0.9;
    const [prop, action, fx] = [
      ["longsword", "weapon-slash", "falling-leaves"],
      ["kite-shield", "block-high", "dust-cloud"],
      ["revolver", "shoot-pistol", "smoke-plume"],
      ["scifi-blaster", "shoot-pistol", "rain-streaks"],
      ["energy-sword", "weapon-slash", "electric-arcs"],
      ["water-bottle", "wave", "water-splash"],
      ["mug", "talk", "floating-hearts"],
      ["wizard-staff", "channel-power", "magic-particles"],
    ][i];
    L.attach(r, prop, "held" + i, i === 1 ? "L" : "R", { scale: 0.85 });
    P.applyClip(r, P.makeClip(action, 4), 0);
    const sc = p.scenes[0];
    sc.id = "scene" + i;
    sc.name = name;
    sc.duration = 4;
    sc.nodes = [
      L.background(name, "bg" + i, 960, 540),
      r,
      L.effect(fx, "fx" + i, 0.5, 3, 480, 270, {
        width: 960,
        height: 540,
        intensity: 0.75,
      }),
    ];
    demo.scenes.push(sc);
    i++;
  }
  S.validate(demo);
  fs.writeFileSync(
    path.join(out, "Scene-Library-Showcase.jet2d.json"),
    JSON.stringify(demo, null, 2),
  );
  const report = {
    pass: true,
    newProps: L.props.length,
    newBackgrounds: L.backgrounds.length,
    newOverlays: L.effects.length,
    rasterSamples: samples,
    checks: [
      "all assets schema-valid and deterministic",
      "render does not mutate source",
      "hand attachment both sides",
      "occupied hand rejection transactional",
      "stage-only prop guard",
      "effect color/intensity/scale/timing validation",
      "before-start and after-end invisibility",
      "manual hand prop versus preset accessory guard",
    ],
    limits: [
      "native canvas not real browser",
      "no collision/IK/sound generation",
    ],
  };
  fs.writeFileSync(
    path.join(out, "verification.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
