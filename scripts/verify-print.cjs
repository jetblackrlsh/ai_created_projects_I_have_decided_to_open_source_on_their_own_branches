"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  { setup } = require("./print.cjs");
(async () => {
  const P = setup(),
    S = require("../app/core.js"),
    p = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../demo/Signal-Garden.jet2d.json")),
    ),
    out = path.join(__dirname, "../output/print");
  fs.mkdirSync(out, { recursive: true });
  const tests = [],
    pass = (name) => {
      tests.push(name);
      console.log("PASS", name);
    },
    hash = (b) => crypto.createHash("sha256").update(b).digest("hex");
  const before = JSON.stringify(p),
    shot = P.capture(p, 3);
  shot.project.scenes[0].background = "#351947";
  assert.equal(JSON.stringify(p), before);
  P.validateStill(shot);
  pass("independent scene capture and edit leave movie immutable");
  const a = await P.still(shot, { width: 1600, height: 900 }),
    b = await P.still(shot, { width: 1600, height: 900 });
  assert.equal(hash(a.toBuffer("image/png")), hash(b.toBuffer("image/png")));
  assert.equal(a.width, 1600);
  fs.writeFileSync(path.join(out, "fresh-still.png"), a.toBuffer("image/png"));
  pass("fresh 1600×900 still deterministic in native canvas");
  const noCaption = await P.still(shot, { captions: false }),
    withCaption = await P.still(shot, { captions: true });
  assert.notEqual(
    hash(noCaption.toBuffer("image/png")),
    hash(withCaption.toBuffer("image/png")),
  );
  pass("caption switch changes actual pixels");
  await assert.rejects(
    () => P.still(shot, { width: 4096, height: 4096 }),
    /megapixels/,
  );
  assert.throws(() => P.validateStill({ ...shot, time: 999 }), /time/);
  pass("invalid dimensions and time rejected");
  const comic = P.createComic(shot);
  comic.title = "2D Print Workflow Test";
  comic.pages = [];
  for (const layout of Object.keys(P.layouts)) {
    const panels = P.layouts[layout].map((_, i) => ({
      snapshot: S.clone(shot),
      caption: layout === "nine" ? "" : `Panel ${i + 1}`,
      balloons: [],
    }));
    comic.pages.push({
      layout,
      title: layout === "whos-who" ? "Who's Who" : layout,
      panels,
    });
  }
  comic.pages[0].panels[0].balloons = [
    {
      kind: "speech",
      text: "The scene is independent.",
      x: 0.08,
      y: 0.06,
      w: 0.64,
      h: 0.2,
      tail: [0.68, 0.4],
      fontSize: 22,
    },
  ];
  comic.pages[1].panels[0].balloons = [
    {
      kind: "thought",
      text: "A new idea.",
      x: 0.08,
      y: 0.1,
      w: 0.64,
      h: 0.25,
      tail: [0.8, 0.5],
      fontSize: 22,
    },
    {
      kind: "caption",
      text: "Later…",
      x: 0.05,
      y: 0.7,
      w: 0.5,
      h: 0.15,
      fontSize: 22,
    },
  ];
  const original = JSON.stringify(comic);
  P.validateComic(comic);
  assert.deepEqual(P.validateComic(JSON.parse(original)), comic);
  for (let i = 0; i < comic.pages.length; i++) {
    const c = await P.page(comic, i);
    fs.writeFileSync(
      path.join(out, `page-${i + 1}.png`),
      c.toBuffer("image/png"),
    );
  }
  assert.equal(JSON.stringify(comic), original);
  pass(
    "all eight layouts, independent panels, speech/thought/caption balloons and immutable page renders",
  );
  const bytes = await P.pdf(comic);
  fs.writeFileSync(path.join(out, "test-comic.pdf"), bytes);
  const doc = await global.PDFLib.PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(), 8);
  fs.writeFileSync(
    path.join(out, "test-comic.jetcomic2d.json"),
    JSON.stringify(comic, null, 2),
  );
  pass(
    "eight-page PDF parses and editable comic round trip retains all content",
  );
  const bad = S.clone(comic);
  bad.pages[0].panels[0].balloons[0].text = "M".repeat(300);
  await assert.rejects(() => P.page(bad, 0), /word exceeds/);
  bad.pages[0].panels[0].balloons[0].x = NaN;
  assert.throws(() => P.validateComic(bad), /balloon/);
  const excess = S.clone(comic);
  excess.pages[0].panels.push(excess.pages[0].panels[0]);
  assert.throws(() => P.validateComic(excess), /Too many/);
  pass("long words, invalid balloons and destructive layout overflow rejected");
  fs.writeFileSync(
    path.join(out, "verification.json"),
    JSON.stringify(
      {
        tests,
        scope:
          "Native Canvas shared-renderer tests; actual browser UI not yet verified.",
      },
      null,
      2,
    ),
  );
})().catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
