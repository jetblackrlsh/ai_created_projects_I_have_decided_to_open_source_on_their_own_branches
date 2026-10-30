/* Independent SVG stills and editable comics. Original 2D adaptation of the
 * user's 3D Studio print workflow; private original-code license undecided. */
(function (root) {
  "use strict";
  const S =
      root.Studio ||
      (typeof require === "function" ? require("./core.js") : null),
    copy = S.clone;
  const layouts = {
    cover: [[0, 0, 1, 1]],
    one: [[0, 0, 1, 1]],
    two: [
      [0, 0, 1, 0.5],
      [0, 0.5, 1, 0.5],
    ],
    four: [
      [0, 0, 0.5, 0.5],
      [0.5, 0, 0.5, 0.5],
      [0, 0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5, 0.5],
    ],
    six: Array.from({ length: 6 }, (_, i) => [
      (i % 2) / 2,
      Math.floor(i / 2) / 3,
      0.5,
      1 / 3,
    ]),
    nine: Array.from({ length: 9 }, (_, i) => [
      (i % 3) / 3,
      Math.floor(i / 3) / 3,
      1 / 3,
      1 / 3,
    ]),
    "whos-who": [
      [0, 0, 0.5, 0.5],
      [0.5, 0, 0.5, 0.5],
      [0, 0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5, 0.5],
    ],
    credits: [[0, 0, 1, 1]],
  };
  function fail(s) {
    throw Error(s);
  }
  function number(v, label, min, max) {
    if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)
      fail("Invalid " + label);
  }
  function dimensions(w, h) {
    number(w, "width", 64, 4096);
    number(h, "height", 64, 4096);
    if (!Number.isInteger(w) || !Number.isInteger(h) || w * h > 8388608)
      fail("Integer dimensions, maximum 8 megapixels required");
  }
  function canvas(w, h) {
    dimensions(w, h);
    const c = root.document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  function capture(project, time) {
    S.validate(project);
    const row = S.locate(project, time);
    const p = {
      format: "jet2d",
      version: 1,
      title: project.title,
      width: project.width,
      height: project.height,
      fps: project.fps,
      scenes: [copy(row.scene)],
      audio: [],
      ledger: [],
    };
    return {
      format: "jet2d-still",
      version: 1,
      title: row.scene.name,
      project: p,
      time: row.time,
      captions: false,
    };
  }
  function validateStill(st) {
    if (!st || st.format !== "jet2d-still" || st.version !== 1)
      fail("Expected jet2d-still version 1");
    S.validate(st.project);
    if (st.project.scenes.length !== 1 || st.project.audio.length)
      fail("Still requires one independent visual scene and no audio");
    number(st.time, "still time", 0, S.duration(st.project));
    return st;
  }
  async function imageFromSVG(svg) {
    const im = new root.Image();
    await new Promise((resolve, reject) => {
      im.onload = resolve;
      im.onerror = () => reject(Error("SVG rasterization failed"));
      im.src =
        typeof Buffer !== "undefined"
          ? Buffer.from(svg)
          : "data:image/svg+xml;base64," +
            btoa(unescape(encodeURIComponent(svg)));
    });
    return im;
  }
  async function still(st, opt = {}) {
    validateStill(st);
    const width = opt.width ?? st.project.width,
      height = opt.height ?? st.project.height;
    dimensions(width, height);
    const p = copy(st.project);
    if (opt.camera) p.scenes[0].camera = copy(opt.camera);
    const svg = S.render(p, st.time, {
        captions: opt.captions ?? st.captions ?? false,
        width: p.width,
        height: p.height,
      }),
      im = await imageFromSVG(svg),
      c = canvas(width, height),
      ctx = c.getContext("2d"),
      fit = opt.fit || "contain";
    if (!["contain", "cover", "stretch"].includes(fit))
      fail("Unknown image fit");
    ctx.fillStyle = opt.background || p.scenes[0].background;
    ctx.fillRect(0, 0, width, height);
    if (fit === "stretch") ctx.drawImage(im, 0, 0, width, height);
    else {
      const ratio = (fit === "cover" ? Math.max : Math.min)(
          width / p.width,
          height / p.height,
        ),
        w = p.width * ratio,
        h = p.height * ratio;
      ctx.drawImage(im, (width - w) / 2, (height - h) / 2, w, h);
    }
    return c;
  }
  function wrap(ctx, text, width) {
    const lines = [];
    for (const paragraph of String(text ?? "").split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        if (ctx.measureText(word).width > width)
          fail("A word exceeds the text box width");
        const test = line ? line + " " + word : word;
        if (ctx.measureText(test).width > width && line) {
          lines.push(line);
          line = word;
        } else line = test;
      }
      lines.push(line);
    }
    return lines;
  }
  function label(ctx, text, b, style = {}) {
    const size = style.fontSize ?? 22,
      pad = style.padding ?? 12;
    number(size, "font size", 4, 400);
    number(pad, "text padding", 0, 400);
    ctx.save();
    try {
      ctx.font = `${style.bold ? "bold " : ""}${size}px sans-serif`;
      const lines = wrap(
          ctx,
          style.allCaps ? String(text).toUpperCase() : text,
          b.w - pad * 2,
        ),
        lh = size * 1.25;
      if (lines.length * lh > b.h - pad * 2 + 0.1)
        fail("Text overflows its box. Enlarge it or reduce its font size.");
      ctx.fillStyle = style.color || "#111827";
      ctx.textBaseline = "top";
      if (style.strokeWidth) {
        ctx.strokeStyle = style.strokeColor || "#fff";
        ctx.lineWidth = style.strokeWidth;
        ctx.lineJoin = "round";
      }
      lines.forEach((line, i) => {
        if (style.strokeWidth)
          ctx.strokeText(line, b.x + pad, b.y + pad + i * lh);
        ctx.fillText(line, b.x + pad, b.y + pad + i * lh);
      });
    } finally {
      ctx.restore();
    }
  }
  function validateBalloon(b) {
    if (!b || !["speech", "thought", "caption"].includes(b.kind))
      fail("Unknown balloon kind");
    if (typeof b.text !== "string" || b.text.length > 10000)
      fail("Invalid balloon text");
    for (const k of ["x", "y", "w", "h"]) number(b[k], "balloon " + k, 0, 1);
    if (b.w <= 0 || b.h <= 0 || b.x + b.w > 1.000001 || b.y + b.h > 1.000001)
      fail("Balloon outside panel");
    if (b.tail !== undefined) {
      if (!Array.isArray(b.tail) || b.tail.length !== 2)
        fail("Invalid balloon tail");
      b.tail.forEach((v) => number(v, "tail", 0, 1));
    }
    if (b.fontSize !== undefined) number(b.fontSize, "font size", 4, 150);
    if (b.strokeWidth !== undefined)
      number(b.strokeWidth, "text stroke", 0, 10);
    if (b.borderWidth !== undefined)
      number(b.borderWidth, "border width", 0, 10);
  }
  function balloon(ctx, b, r, scale) {
    validateBalloon(b);
    const x = r.x + b.x * r.w,
      y = r.y + b.y * r.h,
      w = b.w * r.w,
      h = b.h * r.h;
    ctx.save();
    try {
      ctx.fillStyle = b.fill || "#fff";
      ctx.strokeStyle = b.border || "#172033";
      ctx.lineWidth = (b.borderWidth ?? 2) * scale;
      ctx.beginPath();
      if (b.kind === "thought")
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      else
        ctx.roundRect(
          x,
          y,
          w,
          h,
          b.kind === "caption" ? 2 : Math.min(18 * scale, h / 6),
        );
      ctx.fill();
      ctx.stroke();
      if (b.tail && b.kind === "speech") {
        const tx = r.x + b.tail[0] * r.w,
          ty = r.y + b.tail[1] * r.h,
          edge = ty < y ? y + 1 : y + h - 1;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.55, edge);
        ctx.lineTo(tx, ty);
        ctx.lineTo(x + w * 0.7, edge);
        ctx.fill();
        ctx.stroke();
      }
      if (b.tail && b.kind === "thought")
        for (let i = 1; i <= 3; i++) {
          const f = i / 4;
          ctx.beginPath();
          ctx.arc(
            x + w * 0.7 + (r.x + b.tail[0] * r.w - x - w * 0.7) * f,
            y + h + (r.y + b.tail[1] * r.h - y - h) * f,
            Math.max(2, 7 - i * 1.4) * scale,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.stroke();
        }
      label(
        ctx,
        b.text,
        b.kind === "thought"
          ? { x: x + w * 0.16, y: y + h * 0.16, w: w * 0.68, h: h * 0.68 }
          : { x, y, w, h },
        {
          ...b,
          fontSize: (b.fontSize || 22) * scale,
          padding: b.kind === "thought" ? 4 * scale : 10 * scale,
          strokeWidth: (b.strokeWidth || 0) * scale,
        },
      );
    } finally {
      ctx.restore();
    }
  }
  function validateComic(c) {
    if (
      !c ||
      c.format !== "jet2d-comic" ||
      c.version !== 1 ||
      typeof c.title !== "string" ||
      !Array.isArray(c.pages) ||
      !c.pages.length ||
      c.pages.length > 300
    )
      fail("Expected jet2d-comic version 1 with 1–300 pages");
    for (const p of c.pages) {
      if (!Object.hasOwn(layouts, p.layout)) fail("Unknown page layout");
      if (
        !Array.isArray(p.panels) ||
        p.panels.length > layouts[p.layout].length
      )
        fail("Too many panels for layout");
      for (const pn of p.panels) {
        validateStill(pn.snapshot);
        if (pn.fit && !["contain", "cover", "stretch"].includes(pn.fit))
          fail("Unknown panel fit");
        if (
          pn.caption !== undefined &&
          (typeof pn.caption !== "string" || pn.caption.length > 10000)
        )
          fail("Invalid caption");
        if (
          !Array.isArray(pn.balloons || []) ||
          (pn.balloons || []).length > 30
        )
          fail("Invalid balloon array");
        for (const b of pn.balloons || []) validateBalloon(b);
      }
    }
    return c;
  }
  function createComic(st) {
    validateStill(st);
    return {
      format: "jet2d-comic",
      version: 1,
      title: st.project.title,
      pages: [
        {
          layout: "cover",
          title: st.project.title,
          panels: [{ snapshot: copy(st), caption: "", balloons: [] }],
        },
      ],
    };
  }
  async function page(c, index = 0, opt = {}) {
    validateComic(c);
    if (!Number.isInteger(index) || index < 0 || index >= c.pages.length)
      fail("Page index outside comic");
    const p = c.pages[index],
      w = opt.width ?? 1275,
      h = opt.height ?? 1650,
      out = canvas(w, h),
      ctx = out.getContext("2d"),
      scale = w / 1275,
      margin = 45 * scale,
      gutter = 20 * scale,
      foot = 45 * scale;
    let head = 0;
    ctx.fillStyle = p.background || "#f7f3ea";
    ctx.fillRect(0, 0, w, h);
    if (p.title) {
      ctx.font = `bold ${32 * scale}px sans-serif`;
      head = Math.max(
        95 * scale,
        wrap(ctx, p.title, w - 2 * margin - 16 * scale).length * 40 * scale +
          16 * scale,
      );
      label(
        ctx,
        p.title,
        { x: margin, y: margin / 2, w: w - 2 * margin, h: head },
        { fontSize: 32 * scale, bold: true, padding: 8 * scale },
      );
    }
    const inner = {
      x: margin,
      y: margin + head,
      w: w - 2 * margin,
      h: h - 2 * margin - head - foot,
    };
    if (inner.h < 64) fail("Page title leaves no panel space");
    for (let i = 0; i < layouts[p.layout].length; i++) {
      const a = layouts[p.layout][i],
        r = {
          x: inner.x + a[0] * inner.w + gutter / 2,
          y: inner.y + a[1] * inner.h + gutter / 2,
          w: a[2] * inner.w - gutter,
          h: a[3] * inner.h - gutter,
        },
        pn = p.panels[i];
      ctx.fillStyle = "#e1e3e9";
      ctx.fillRect(r.x, r.y, r.w, r.h);
      if (pn) {
        const caption = pn.caption || "";
        let ch = 0;
        if (caption) {
          ctx.font = `${22 * scale}px sans-serif`;
          ch =
            wrap(ctx, caption, r.w - 24 * scale).length * 27.5 * scale +
            24 * scale;
          if (ch > r.h * 0.45) fail("Panel caption too long");
        }
        const im = await still(pn.snapshot, {
          width: Math.max(64, Math.round(r.w)),
          height: Math.max(64, Math.round(r.h - ch)),
          captions: false,
          fit: pn.fit || "contain",
        });
        ctx.drawImage(im, r.x, r.y, r.w, r.h - ch);
        if (ch) {
          ctx.fillStyle = "#fff7df";
          ctx.fillRect(r.x, r.y + r.h - ch, r.w, ch);
          label(
            ctx,
            caption,
            { x: r.x, y: r.y + r.h - ch, w: r.w, h: ch },
            { fontSize: 22 * scale, padding: 12 * scale },
          );
        }
        for (const b of pn.balloons || []) balloon(ctx, b, r, scale);
      }
      ctx.strokeStyle = "#182034";
      ctx.lineWidth = 3 * scale;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
    if (p.text)
      label(
        ctx,
        p.text,
        {
          x: inner.x + inner.w * 0.08,
          y: inner.y + inner.h * 0.16,
          w: inner.w * 0.84,
          h: inner.h * 0.7,
        },
        {
          fontSize: 28 * scale,
          color: p.textColor || "#fff",
          strokeWidth: 3 * scale,
          strokeColor: "#000",
        },
      );
    ctx.fillStyle = "#444";
    ctx.font = `${16 * scale}px sans-serif`;
    ctx.fillText(String(index + 1), w - margin - 22 * scale, h - margin / 2);
    return out;
  }
  async function pdf(c, opt = {}) {
    validateComic(c);
    if (!root.PDFLib) fail("Bundled PDF library missing");
    const doc = await root.PDFLib.PDFDocument.create();
    doc.setTitle(c.title);
    doc.setCreator("Jet Black RLSH 2D Cartoon Studio");
    for (let i = 0; i < c.pages.length; i++) {
      const canvas = await page(c, i, opt),
        img = await doc.embedPng(canvas.toDataURL("image/png")),
        p = doc.addPage([612, 792]);
      p.drawImage(img, { x: 0, y: 0, width: 612, height: 792 });
      opt.onProgress?.(i + 1, c.pages.length);
    }
    return doc.save();
  }
  const api = {
    layouts,
    capture,
    validateStill,
    still,
    createComic,
    validateComic,
    page,
    pdf,
    wrap,
  };
  root.StudioPrint2D = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
