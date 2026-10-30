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
  w.setTimeout = () => 0;
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
  ])
    w.eval(fs.readFileSync(path.join(root, f), "utf8"));
  const $ = (id) => w.document.getElementById(id),
    click = async (id) => {
      await $(id).onclick();
      const msg = $("printStatus").textContent;
      if (/overflow|outside|Invalid|failed|exceeds|requires|missing/.test(msg))
        throw Error(msg);
    },
    tests = [],
    pass = (s) => {
      tests.push(s);
      console.log("PASS", s);
    };
  const original = JSON.stringify(w.Editor.getProject());
  await click("stillCapture2D");
  let shot = w.PrintEditor2D.getStill();
  shot.project.scenes[0].background = "#452255";
  $("stillSource2D").value = JSON.stringify(shot);
  await click("stillApply2D");
  assert.equal(JSON.stringify(w.Editor.getProject()), original);
  await click("stillPng2D");
  await click("stillSave2D");
  assert.equal(downloads.length, 2);
  pass(
    "actual still UI handlers capture/edit/render/download without movie mutation",
  );
  await click("comicNew2D");
  await click("comicAddPage2D");
  await click("comicAddPanel2D");
  await click("comicDuplicate2D");
  assert.equal(w.PrintEditor2D.getComic().pages.length, 3);
  await click("comicEarlier2D");
  assert.equal(w.PrintEditor2D.getPageIndex(), 1);
  await click("comicLater2D");
  await click("comicDelete2D");
  assert.equal(w.PrintEditor2D.getComic().pages.length, 2);
  pass(
    "page add/duplicate/reorder/delete and independent panel capture handlers",
  );
  let page = JSON.parse($("comicSource2D").value);
  page.panels[0].balloons = [
    {
      kind: "speech",
      text: "Editable dialogue",
      x: 0.05,
      y: 0.05,
      w: 0.8,
      h: 0.3,
      fontSize: 22,
    },
  ];
  $("comicSource2D").value = JSON.stringify(page);
  await click("comicApply2D");
  await click("comicPng2D");
  await click("comicPdf2D");
  await click("comicSave2D");
  assert.equal(downloads.length, 5);
  const comic = w.PrintEditor2D.getComic();
  const json = JSON.stringify(comic);
  Object.defineProperty($("comicLoad2D"), "files", {
    value: [{ size: json.length, text: async () => json }],
    configurable: true,
  });
  await $("comicLoad2D").onchange();
  assert.equal(JSON.stringify(w.PrintEditor2D.getComic()), json);
  assert.equal(JSON.stringify(w.Editor.getProject()), original);
  pass(
    "balloon edit, page PNG, complete PDF, editable download and load round trip",
  );
  const out = path.join(root, "output/print");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(
    path.join(out, "ui-harness.json"),
    JSON.stringify(
      {
        tests,
        scope:
          "jsdom plus native Canvas runs real handlers; does NOT verify physical browser downloads, layout or browser media APIs.",
      },
      null,
      2,
    ),
  );
  dom.window.close();
})().catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
