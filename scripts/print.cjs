#!/usr/bin/env node
"use strict";
const fs = require("node:fs"),
  path = require("node:path");
function setup() {
  let native;
  try {
    native = require("@napi-rs/canvas");
  } catch {
    throw Error(
      "Optional print CLI requires @napi-rs/canvas installed from npm. Browser printing needs no installation.",
    );
  }
  global.document = { createElement: () => native.createCanvas(1, 1) };
  global.Image = native.Image;
  global.PDFLib = require("../vendor/pdf-lib/pdf-lib.min.js");
  return require("../app/print.js");
}
async function main() {
  const [mode, input, out, optionFile] = process.argv.slice(2);
  if (!["still", "page", "comic"].includes(mode) || !input || !out)
    throw Error(
      "Usage: node scripts/print.cjs still|page|comic INPUT.json NEW_OUTPUT [OPTIONS.json]",
    );
  if (fs.existsSync(out)) throw Error("Output exists; choose a new path");
  const P = setup(),
    data = JSON.parse(fs.readFileSync(input)),
    opt = optionFile ? JSON.parse(fs.readFileSync(optionFile)) : {};
  if (mode === "still" || mode === "page") {
    const c = await (mode === "still"
      ? P.still(data, opt)
      : P.page(data, opt.pageIndex || 0, opt));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, c.toBuffer("image/png"));
  } else {
    P.validateComic(data);
    fs.mkdirSync(out, { recursive: true });
    for (let i = 0; i < data.pages.length; i++) {
      const c = await P.page(data, i, opt);
      fs.writeFileSync(
        path.join(out, "page-" + String(i + 1).padStart(3, "0") + ".png"),
        c.toBuffer("image/png"),
      );
    }
    fs.writeFileSync(path.join(out, "comic.pdf"), await P.pdf(data, opt));
    fs.writeFileSync(
      path.join(out, "editable.jetcomic2d.json"),
      JSON.stringify(data, null, 2),
    );
    fs.writeFileSync(
      path.join(out, "render-report.json"),
      JSON.stringify(
        {
          pages: data.pages.length,
          renderer: "Shared StudioPrint2D with native Canvas; not browser QA",
          options: opt,
        },
        null,
        2,
      ),
    );
  }
  console.log("Rendered", out);
}
if (require.main === module)
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
module.exports = { setup };
