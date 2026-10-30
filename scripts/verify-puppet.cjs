const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  S = require("../app/core.js"),
  P = require("../app/puppet.js"),
  { setup } = require("./print.cjs"),
  native = require("@napi-rs/canvas");
(async () => {
  const Print = setup(),
    out = path.join(__dirname, "../output/puppet");
  fs.mkdirSync(out, { recursive: true });
  const make = (id = "actor", x = 150) => {
    const p = S.blank();
    p.width = 300;
    p.height = 380;
    p.scenes[0].background = "#edf0f5";
    p.scenes[0].duration = 4;
    p.scenes[0].nodes = [P.create(id, x, 320)];
    return p;
  };
  const a = make(),
    r = a.scenes[0].nodes[0];
  S.validate(a);
  assert.equal(r.puppet.joints.length, 29);
  assert.equal(new Set(r.puppet.joints).size, 29);
  const hierarchy = {};
  S.walk([r], (n) => {
    for (const c of n.children || [])
      if (c.puppetJoint) hierarchy[c.puppetJoint] = n.puppetJoint;
  });
  for (const side of ["L", "R"]) {
    assert.equal(hierarchy["elbow" + side], "shoulder" + side);
    assert.equal(hierarchy["wrist" + side], "elbow" + side);
    assert.equal(hierarchy["knee" + side], "hip" + side);
    assert.equal(hierarchy["ankle" + side], "knee" + side);
  }
  assert.equal(hierarchy.torso, "pelvis");
  assert.equal(hierarchy.head, "neck");
  function points(r, t) {
    const result = {};
    function visit(n, m = [1, 0, 0, 1, 0, 0]) {
      const p = S.sample({ ...S.defaults, ...n.pose }, n.keys, t),
        ang = (p.rotation * Math.PI) / 180,
        c = Math.cos(ang),
        s = Math.sin(ang),
        q = [c * p.scaleX, s * p.scaleX, -s * p.scaleY, c * p.scaleY, p.x, p.y],
        v = [
          m[0] * q[0] + m[2] * q[1],
          m[1] * q[0] + m[3] * q[1],
          m[0] * q[2] + m[2] * q[3],
          m[1] * q[2] + m[3] * q[3],
          m[0] * q[4] + m[2] * q[5] + m[4],
          m[1] * q[4] + m[3] * q[5] + m[5],
        ];
      if (n.puppetJoint) result[n.puppetJoint] = v.slice(4);
      for (const child of n.children || []) visit(child, v);
    }
    visit(r);
    return result;
  }
  const before = points(r, 0);
  P.applyPose(
    r,
    P.pose({
      elbowR: { rotation: 90 },
      kneeL: { rotation: 65 },
      wristR: { rotation: 35 },
    }),
  );
  const bent = points(r, 0);
  assert.notDeepEqual(before.wristR, bent.wristR);
  assert.deepEqual(before.wristL, bent.wristL);
  assert.ok(
    Math.abs(
      Math.hypot(
        bent.wristR[0] - bent.elbowR[0],
        bent.wristR[1] - bent.elbowR[1],
      ) - 37,
    ) < 1e-8,
  );
  assert.notDeepEqual(before.ankleL, bent.ankleL);
  const saved = P.capturePose(r, 0),
    r2 = P.create("other", 230, 290, {
      skin: "#71442b",
      shirt: "#287a84",
      hairVisible: true,
    });
  P.applyPose(r2, saved);
  assert.equal(P.joint(r2, "elbowR").pose.rotation, 90);
  assert.equal(r2.pose.x, 230);
  const oldKeys = JSON.stringify(r2);
  assert.throws(() => P.restyle(r2, { skin: "url(javascript:evil)" }));
  assert.equal(JSON.stringify(r2), oldKeys);
  P.clearAnimation(r);
  const clip = P.makeClip("wave", 2);
  P.applyClip(r, clip, 1);
  S.validate(a);
  assert.equal(
    S.sample(P.joint(r, "shoulderR").pose, P.joint(r, "shoulderR").keys, 0.5)
      .rotation,
    0,
    "delayed clip must not leak backwards",
  );
  const animated = JSON.stringify(r);
  assert.throws(() => P.applyClip(r, clip, 1.5), /overlap/);
  assert.equal(
    JSON.stringify(r),
    animated,
    "failed application is transactional",
  );
  const structure = [];
  S.walk([r], (n) => structure.push([n.id, n.puppetJoint, n.keys, n.pose]));
  const keyHash = JSON.stringify(structure);
  P.restyle(r, {
    skin: "#9a5b37",
    shirt: "#8846a3",
    pants: "#253b66",
    hairVisible: true,
  });
  const afterStyle = [];
  S.walk([r], (n) => afterStyle.push([n.id, n.puppetJoint, n.keys, n.pose]));
  assert.equal(
    JSON.stringify(afterStyle),
    keyHash,
    "restyling preserves rig and motion",
  );
  const bad = S.clone(clip);
  bad.frames[1].pose.channels.elbowR = { rotation: NaN };
  assert.throws(() => P.applyClip(r2, bad), /Invalid pose/);
  assert.throws(() => P.makeClip("missing"), /Unknown/);
  assert.throws(() => P.makeClip("walk", 0));
  const sheet = native.createCanvas(
      1500,
      Math.ceil(P.actions.length / 5) * 420,
    ),
    ctx = sheet.getContext("2d");
  ctx.fillStyle = "#edf0f5";
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  let cases = 0;
  for (let i = 0; i < P.actions.length; i++) {
    const name = P.actions[i],
      p = make("demo" + i),
      rig = p.scenes[0].nodes[0];
    P.applyClip(rig, P.makeClip(name, 2));
    for (const t of [0, 0.25, 0.5, 1, 1.5, 2]) {
      S.validate(p);
      assert.ok(S.render(p, t).includes("<svg"));
      cases++;
    }
    const frame = await Print.still(
      Print.capture(p, name === "jump" ? 0.75 : 0.6),
    );
    ctx.drawImage(frame, (i % 5) * 300, Math.floor(i / 5) * 420);
    ctx.fillStyle = "#22324d";
    ctx.font = "20px sans-serif";
    ctx.fillText(name, (i % 5) * 300 + 15, Math.floor(i / 5) * 420 + 405);
  }
  fs.writeFileSync(path.join(out, "actions.png"), sheet.toBuffer("image/png"));
  const looks = native.createCanvas(1200, 380),
    lx = looks.getContext("2d");
  lx.fillStyle = "#edf0f5";
  lx.fillRect(0, 0, 1200, 380);
  for (let i = 0; i < 4; i++) {
    const p = make("look" + i),
      rig = p.scenes[0].nodes[0];
    if (i)
      P.restyle(
        rig,
        [
          {},
          {
            skin: "#795038",
            shirt: "#266c90",
            pants: "#273249",
            hairVisible: true,
          },
          {
            skin: "#dcb086",
            shirt: "#ac4d57",
            pants: "#6d5975",
            hairVisible: true,
            hair: "#bd743c",
          },
          {
            skin: "#7faeb5",
            shirt: "#d8dfe7",
            pants: "#738ba8",
            shoes: "#334c60",
          },
        ][i],
      );
    P.applyClip(rig, clip);
    lx.drawImage(await Print.still(Print.capture(p, 0.6)), i * 300, 0);
  }
  fs.writeFileSync(
    path.join(out, "same-rig-four-looks.png"),
    looks.toBuffer("image/png"),
  );
  const demo = S.blank();
  demo.title = "Blank Articulated Person — Action and Restyle Demonstration";
  demo.scenes = [];
  for (let i = 0; i < P.actions.length; i++) {
    const p = make("puppet" + i, 480);
    p.width = 960;
    p.height = 540;
    const rig = p.scenes[0].nodes[0];
    rig.pose.y = rig.bindPose.y = 450;
    P.applyClip(rig, P.makeClip(P.actions[i], 2));
    const sc = p.scenes[0];
    sc.id = "action" + i;
    sc.name = P.actions[i];
    sc.duration = 2;
    sc.captions = [];
    demo.scenes.push(sc);
  }
  S.validate(demo);
  fs.writeFileSync(
    path.join(out, "Articulated-Puppet-Demo.jet2d.json"),
    JSON.stringify(demo, null, 2),
  );
  fs.writeFileSync(
    path.join(out, "Wave.jetmotion2d.json"),
    JSON.stringify(clip, null, 2),
  );
  fs.writeFileSync(
    path.join(out, "Bent-Elbow.jetpose2d.json"),
    JSON.stringify(saved, null, 2),
  );
  const result = {
    pass: true,
    skeletalControls: 17,
    totalNamedControls: 29,
    actions: P.actions.length,
    poseCases: cases,
    checks: [
      "joint hierarchy",
      "independent elbow and knee articulation",
      "constant segment length",
      "pose retargeting",
      "restyle preserves motion",
      "delayed clip boundary",
      "overlap and invalid input transactional rejection",
      "all action SVG samples",
      "native raster action sheet",
      "portable example project",
    ],
  };
  fs.writeFileSync(
    path.join(out, "verification.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
