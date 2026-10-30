const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const S = require("../app/core.js"),
  P = require("../app/puppet.js"),
  native = require("@napi-rs/canvas");
const originals = Object.fromEntries(
  P.actions.map((a) => [a, JSON.stringify(P.makeClip(a, 2))]),
);
require("../app/puppet-actions.js");
(async () => {
  const out = path.resolve(__dirname, "../output/puppet-actions");
  fs.mkdirSync(out, { recursive: true });
  assert.equal(P.actions.length, 58);
  assert.equal(P.expandedActions.length, 38);
  assert.equal(new Set(P.actions).size, 58);
  for (const [a, clip] of Object.entries(originals))
    assert.equal(JSON.stringify(P.makeClip(a, 2)), clip, "original " + a);
  const digests = new Set();
  let samples = 0;
  const make = (name, opts = {}, start = 0) => {
    const p = S.blank();
    p.width = 420;
    p.height = 480;
    p.scenes[0].background = "#edf0f5";
    p.scenes[0].duration = 4;
    const r = P.create("actor", 210, 425);
    p.scenes[0].nodes = [r];
    const clip = P.makeClip(name, 2, opts);
    P.applyClip(r, clip, start);
    P.addActionProp(r, clip, start);
    return { p, r, clip };
  };
  const demo = S.blank();
  demo.title = "Articulated Action and Emotion Presets";
  demo.width = 960;
  demo.height = 540;
  demo.scenes = [];
  for (let i = 0; i < P.expandedActions.length; i++) {
    const a = P.expandedActions[i],
      info = P.actionInfo[a],
      { p, r, clip } = make(a);
    S.validate(p);
    digests.add(
      crypto
        .createHash("sha256")
        .update(JSON.stringify(clip.frames))
        .digest("hex"),
    );
    for (const intensity of [0.25, 1, 1.5])
      for (const mirror of [false, true]) {
        const q = make(a, { intensity, mirror }, 1);
        S.validate(q.p);
        const before = JSON.stringify(q.r);
        assert.throws(() => P.applyClip(q.r, q.clip, 1.5), /overlap/);
        assert.equal(JSON.stringify(q.r), before);
        for (const t of [0, 0.9, 1, 1.44, 1 + 2 * info.peak, 2.6, 3, 3.5]) {
          const svg = S.render(q.p, t);
          assert(!/NaN|Infinity|undefined/.test(svg));
          await native.loadImage(Buffer.from(svg));
          samples++;
        }
        const accessory = [];
        S.walk([q.r], (n) => {
          if (n.puppetAccessory) accessory.push(n);
        });
        for (const n of accessory) {
          assert.equal(S.sample(n.pose, n.keys, 0.5).opacity, 0);
          assert.equal(S.sample(n.pose, n.keys, 3.5).opacity, 0);
        }
        const keys = JSON.stringify(q.r);
        P.restyle(q.r, {
          skin: "#8e5c40",
          shirt: "#327d9c",
          hairVisible: true,
        });
        assert.equal(
          JSON.stringify(P.capturePose(q.r, 1.8)),
          JSON.stringify(P.capturePose(JSON.parse(keys), 1.8)),
        );
        P.clearAnimation(q.r);
        assert.equal(q.r.puppet.accessories.length, 0);
        S.walk([q.r], (n) => assert(!n.puppetAccessory));
      }
    if (i % 4 === 0) {
      global.sheet = native.createCanvas(2100, 1920);
      global.ctx = sheet.getContext("2d");
      ctx.fillStyle = "#edf0f5";
      ctx.fillRect(0, 0, 2100, 1920);
    }
    const phases = [0, 0.22, info.peak, 0.8, 1];
    for (let k = 0; k < 5; k++) {
      const im = await native.loadImage(
        Buffer.from(S.render(p, phases[k] * 2)),
      );
      ctx.drawImage(im, k * 420, (i % 4) * 480);
      ctx.fillStyle = "#24334d";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(
        a + " · " + Math.round(phases[k] * 100) + "%",
        k * 420 + 8,
        (i % 4) * 480 + 23,
      );
    }
    if (i % 4 === 3 || i === P.expandedActions.length - 1)
      fs.writeFileSync(
        path.join(out, "phases-" + Math.floor(i / 4) + ".png"),
        sheet.toBuffer("image/png"),
      );
    const sc = {
      ...p.scenes[0],
      id: "action-" + i,
      name: info.label,
      duration: 3,
      nodes: [],
    };
    for (const [j, mirror] of [false, true].entries()) {
      const rig = P.create(
        "actor-" + i + "-" + j,
        j ? 690 : 270,
        440,
        j
          ? {
              skin: "#8e5c40",
              shirt: "#327d9c",
              pants: "#273249",
              hairVisible: true,
            }
          : {},
      );
      rig.pose.scaleX =
        rig.pose.scaleY =
        rig.bindPose.scaleX =
        rig.bindPose.scaleY =
          0.9;
      const c = P.makeClip(a, 3, { intensity: 1, mirror });
      P.applyClip(rig, c);
      P.addActionProp(rig, c);
      sc.nodes.push(rig);
    }
    demo.scenes.push(sc);
    fs.writeFileSync(
      path.join(out, a + ".jetmotion2d.json"),
      JSON.stringify(clip, null, 2),
    );
  }
  assert.equal(digests.size, 38, "every preset must have distinct motion");
  for (const category of ["Combat", "Powers", "Emotions"]) {
    const part = {
      ...demo,
      title: demo.title + " — " + category,
      scenes: demo.scenes.filter(
        (sc, i) => P.actionInfo[P.expandedActions[i]].category === category,
      ),
    };
    S.validate(part);
    fs.writeFileSync(
      path.join(out, category + "-Presets-Demo.jet2d.json"),
      JSON.stringify(part, null, 2),
    );
  }
  for (const options of [
    { intensity: 0 },
    { intensity: 2 },
    { intensity: NaN },
    { mirror: "yes" },
  ])
    assert.throws(() => P.makeClip("punch-jab", 2, options));
  const report = {
    pass: true,
    totalActions: 58,
    newActions: 38,
    samples,
    uniqueMotionSignatures: digests.size,
    checks: [
      "original20clipsbyteidentical",
      "all38actionsall3intensitiesbothdirections",
      "delayedaccessoryvisibility",
      "recoveryvisibility",
      "overlaptransactional",
      "restylepreservespose",
      "clearremovesaccessories",
      "allSVGnativeRasterDecode",
      "distinctmotion",
      "portableclipfiles",
    ],
    limits: [
      "native canvas and jsdom, not real browser",
      "front-view FK; no contact simulation or IK",
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
