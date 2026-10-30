const fs = require("fs"),
  path = require("path"),
  assert = require("assert/strict"),
  crypto = require("crypto"),
  S = require("../app/core.js"),
  C = require("../app/catalog.js"),
  { setup } = require("./print.cjs");
(async () => {
  const P = setup(),
    native = require("@napi-rs/canvas"),
    out = path.join(__dirname, "../output/catalog");
  fs.mkdirSync(out, { recursive: true });
  const sheet = native.createCanvas(
      1440,
      Math.ceil(C.characters.length / 6) * 280,
    ),
    ctx = sheet.getContext("2d");
  ctx.fillStyle = "#eef0f5";
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  const hashes = new Set(),
    sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
  let cases = 0;
  for (let i = 0; i < C.characters.length; i++) {
    const kind = C.characters[i],
      p = S.blank();
    p.width = 240;
    p.height = 240;
    p.scenes[0].nodes = [C.character(kind, "actor", 120, 215)];
    S.validate(p);
    const c = await P.still(P.capture(p, 0));
    hashes.add(sha(c.toBuffer("image/png")));
    ctx.drawImage(c, (i % 6) * 240, Math.floor(i / 6) * 280);
    ctx.fillStyle = "#182336";
    ctx.font = "16px sans-serif";
    ctx.fillText(kind, (i % 6) * 240 + 10, Math.floor(i / 6) * 280 + 265);
    for (const action of C.actions) {
      const q = S.clone(p);
      C.animate(q.scenes[0].nodes[0], action, 0, 3);
      S.validate(q);
      S.render(q, 0.4);
      S.render(q, 1.4);
      cases++;
    }
  }
  assert.equal(
    hashes.size,
    C.characters.length,
    "Each named template must have distinct actual pixels",
  );
  fs.writeFileSync(
    path.join(out, "characters.png"),
    sheet.toBuffer("image/png"),
  );
  const demo = S.blank();
  demo.scenes[0].nodes = [
    C.environment("royal", "background", demo.width, demo.height),
    C.character("solar", "hero", 480, 420),
  ];
  C.animate(demo.scenes[0].nodes[1], "walk", 0, 6);
  const prop = C.prop("sword", "held_sword");
  prop.pose.y = 50;
  C.part(demo.scenes[0].nodes[1], "armR").children.push(prop);
  S.validate(demo);
  assert.notEqual(S.render(demo, 0.15), S.render(demo, 0.7));
  const before = JSON.stringify(demo);
  const c = await P.still(P.capture(demo, 0.7));
  assert.equal(JSON.stringify(demo), before);
  fs.writeFileSync(
    path.join(out, "action-and-prop.png"),
    c.toBuffer("image/png"),
  );
  for (const env of C.environments) {
    const p = S.blank();
    p.scenes[0].nodes = [C.environment(env, "env", p.width, p.height)];
    S.validate(p);
    const c = await P.still(P.capture(p, 0));
    fs.writeFileSync(path.join(out, env + ".png"), c.toBuffer("image/png"));
  }
  for (const kind of C.props) {
    const p = S.blank();
    p.scenes[0].nodes = [C.prop(kind, "prop")];
    S.validate(p);
  }
  assert.throws(() => C.character("nonexistent", "a"), /Unknown/);
  assert.throws(
    () => C.animate(demo.scenes[0].nodes[1], "nonexistent", 0, 1),
    /Unsupported/,
  );
  assert.throws(
    () => C.animate(demo.scenes[0].nodes[1], "walk", 0, 121),
    /duration/,
  );
  fs.writeFileSync(
    path.join(out, "catalog-demo.jet2d.json"),
    JSON.stringify(demo, null, 2),
  );
  fs.writeFileSync(
    path.join(out, "verification.json"),
    JSON.stringify(
      {
        characters: C.characters.length,
        distinctPixelHashes: hashes.size,
        actions: C.actions.length,
        characterActionValidationCases: cases,
        environments: C.environments.length,
        props: C.props.length,
        scope:
          "Every base catalog template and action combination validated/rendered as SVG; character contact sheet and backgrounds rasterized with native Canvas. Exact 3D mesh likeness not claimed.",
      },
      null,
      2,
    ),
  );
  console.log("PASS catalog", C.characters.length, C.actions.length, cases);
})().catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
