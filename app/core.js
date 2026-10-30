/* Jet Black RLSH 2D Cartoon Studio. Original project source; CC0. Third-party dependencies retain their own licenses. */
(function (root) {
  "use strict";
  const tags = new Set(
    "g rect circle ellipse path line polyline polygon text tspan image".split(
      " ",
    ),
  );
  const attrs = new Set(
    "id x y x1 y1 x2 y2 width height rx ry cx cy r d points fill stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-dashoffset opacity fill-opacity stroke-opacity fill-rule transform font-size font-family font-weight text-anchor dominant-baseline letter-spacing href preserveAspectRatio".split(
      " ",
    ),
  );
  const defaults = {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    reveal: 1,
    pivotX: 0,
    pivotY: 0,
  };
  const props = Object.keys(defaults);
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        })[c],
    );
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function fail(m) {
    throw Error(m);
  }
  function finite(n, label, min = -1e6, max = 1e6) {
    if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max)
      fail("Invalid " + label);
  }
  function attrCheck(k, v, tag) {
    if (k === "href") {
      if (
        tag !== "image" ||
        typeof v !== "string" ||
        v.length > 28e6 ||
        !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v)
      )
        fail("Image href must be embedded PNG/JPEG/WebP");
      const prefix = v.slice(v.indexOf(",") + 1, v.indexOf(",") + 65);
      let header;
      try {
        header =
          typeof atob === "function"
            ? atob(prefix)
            : Buffer.from(prefix, "base64").toString("latin1");
      } catch {
        fail("Invalid embedded bitmap encoding");
      }
      const byte = (i) => header.charCodeAt(i);
      const png = [137, 80, 78, 71, 13, 10, 26, 10].every(
        (x, i) => byte(i) === x,
      );
      const jpeg = byte(0) === 255 && byte(1) === 216 && byte(2) === 255;
      const webp =
        header.slice(0, 4) === "RIFF" && header.slice(8, 12) === "WEBP";
      if (
        !(v.startsWith("data:image/png;")
          ? png
          : v.startsWith("data:image/jpeg;")
            ? jpeg
            : webp)
      )
        fail("Bitmap signature does not match its declared type");
      return;
    }
    if (
      k === "preserveAspectRatio" &&
      !/^(none|x(Min|Mid|Max)Y(Min|Mid|Max)( (meet|slice))?)$/.test(v)
    )
      fail("Invalid image fit");
    if (!attrs.has(k)) fail("Unsupported SVG attribute: " + k);
    if (typeof v !== "string" && typeof v !== "number")
      fail("Invalid attribute " + k);
    if (typeof v === "number") finite(v, "attribute " + k);
    if (
      String(v).length > 100000 ||
      /[<>\\]|url\s*\(|(?:https?|data|javascript):|@import/i.test(v)
    )
      fail("Unsafe SVG attribute: " + k);
  }
  function walk(nodes, fn) {
    for (const n of nodes) {
      fn(n);
      walk(n.children || [], fn);
    }
  }
  function ownerTree(scene, time) {
    const items = [],
      originalParent = new Map(),
      byID = new Map(),
      parents = new Map(),
      poses = new Map();
    function scan(nodes, parent) {
      for (const n of nodes) {
        items.push(n);
        byID.set(n.id, n);
        originalParent.set(n.id, parent);
        scan(n.children || [], n.id);
      }
    }
    scan(scene.nodes, null);
    let changed = false;
    for (const n of items) {
      let parent = originalParent.get(n.id),
        active;
      for (const key of n.owners || [])
        if (key.t <= time) active = key;
        else break;
      if (active) {
        parent = active.parentId;
        const pose = {};
        for (const k of ["x", "y", "rotation"])
          if (active[k] !== undefined) pose[k] = active[k];
        poses.set(n.id, pose);
        changed = true;
      }
      parents.set(n.id, parent);
    }
    const color = new Map();
    function visit(id) {
      if (color.get(id) === 1) fail("Ownership cycle at " + id);
      if (color.get(id) === 2) return;
      color.set(id, 1);
      const parent = parents.get(id);
      if (parent !== null) {
        if (!byID.has(parent)) fail("Missing owner " + parent);
        visit(parent);
      }
      color.set(id, 2);
    }
    for (const n of items) visit(n.id);
    if (!changed) return { nodes: scene.nodes, poses };
    const copies = new Map(items.map((n) => [n.id, { ...n, children: [] }])),
      nodes = [];
    for (const n of items) {
      const parent = parents.get(n.id);
      (parent === null ? nodes : copies.get(parent).children).push(
        copies.get(n.id),
      );
    }
    return { nodes, poses };
  }
  function validateOwnership(scene) {
    const byID = new Map();
    walk(scene.nodes, (n) => byID.set(n.id, n));
    const times = new Set([0]);
    let total = 0;
    for (const n of byID.values()) {
      if (n.owners === undefined) continue;
      if (!Array.isArray(n.owners) || n.owners.length > 100)
        fail("Ownership requires up to 100 ordered keys");
      let last = -1;
      for (const key of n.owners) {
        if (++total > 500) fail("Maximum 500 ownership keys per scene");
        finite(key.t, "ownership time", 0, scene.duration);
        if (key.t <= last) fail("Ownership times must increase");
        last = key.t;
        times.add(key.t);
        if (
          key.parentId !== null &&
          (typeof key.parentId !== "string" ||
            !byID.has(key.parentId) ||
            byID.get(key.parentId).tag !== "g")
        )
          fail("Owner must be a group ID in this scene or null");
        if (key.parentId === n.id) fail("A node cannot own itself");
        for (const k of ["x", "y", "rotation"])
          if (key[k] !== undefined) finite(key[k], "owner " + k);
      }
    }
    if (total) for (const t of times) ownerTree(scene, t);
  }

  function validate(p, options = {}) {
    if (!p || p.format !== "jet2d" || p.version !== 1)
      fail("Expected jet2d version 1");
    if (typeof p.title !== "string" || !p.title.trim() || p.title.length > 240)
      fail("Project title must be 1–240 characters");
    if (!Array.isArray(p.ledger || [])) fail("Ledger must be an array");
    finite(p.width, "width", 64, 4096);
    finite(p.height, "height", 64, 4096);
    if (p.width * p.height > 8388608) fail("Maximum 8 megapixels");
    finite(p.fps, "fps", 1, 60);
    if (!Number.isInteger(p.fps)) fail("FPS must be an integer");
    if (!Array.isArray(p.scenes) || !p.scenes.length || p.scenes.length > 200)
      fail("1–200 scenes required");
    const ids = new Set();
    let count = 0;
    const keys = (ks, allowed) => {
      if (!Array.isArray(ks) || ks.length > 10000) fail("Invalid keyframes");
      for (const k of ks) {
        finite(k.t, "key time", 0, 3600);
        if (k.ease && !["linear", "smooth", "hold"].includes(k.ease))
          fail("Invalid easing");
        for (const a of Object.keys(k)) {
          if (a === "t" || a === "ease") continue;
          if (!allowed.includes(a)) fail("Unsupported animated property " + a);
          finite(k[a], a);
          if (["opacity", "reveal"].includes(a)) finite(k[a], a, 0, 1);
          if (a === "zoom") finite(k[a], a, 0.01, 100);
        }
      }
    };
    const sceneIDs = new Set();
    for (const s of p.scenes) {
      if (typeof s.name !== "string" || !s.name.trim() || s.name.length > 240)
        fail("Scene name must be 1–240 characters");
      if (!/^[A-Za-z_][\w.-]*$/.test(s.id) || sceneIDs.has(s.id))
        fail("Invalid or duplicate scene ID");
      sceneIDs.add(s.id);
      finite(s.duration, "scene duration", 0.05, 3600);
      if (!Array.isArray(s.nodes)) fail("Missing scene nodes");
      if (!/^#[\da-f]{6}$/i.test(s.background))
        fail("Background must be hex color");
      let depth = 0;
      const check = (ns, d) => {
        if (d > 30) fail("Nesting exceeds 30");
        for (const n of ns) {
          if (++count > 5000) fail("Too many nodes");
          if (n.revealBox !== undefined) {
            if (!Array.isArray(n.revealBox) || n.revealBox.length !== 4)
              fail("Invalid revealBox");
            n.revealBox.forEach((v) => finite(v, "revealBox"));
            if (n.revealBox[2] < 0 || n.revealBox[3] < 0)
              fail("Negative revealBox");
          }
          if (!tags.has(n.tag)) fail("Unsupported SVG element: " + n.tag);
          if (!/^[A-Za-z_][\w.-]*$/.test(n.id) || ids.has(n.id))
            fail("Invalid or duplicate ID: " + n.id);
          ids.add(n.id);
          if (!n.attrs || typeof n.attrs !== "object")
            fail("Missing attributes");
          for (const [k, v] of Object.entries(n.attrs)) {
            attrCheck(k, v, n.tag);
            if (k === "id" && v !== n.id) fail("ID attribute mismatch");
          }
          if (n.text !== undefined && typeof n.text !== "string")
            fail("Invalid text");
          for (const [k, v] of Object.entries(n.pose || {})) {
            if (!props.includes(k)) fail("Unknown pose " + k);
            finite(v, k);
            if (["opacity", "reveal"].includes(k)) finite(v, k, 0, 1);
          }
          keys(n.keys || [], props);
          if (!Array.isArray(n.children || [])) fail("Invalid children");
          check(n.children || [], d + 1);
        }
      };
      check(s.nodes, 0);
      keys(s.camera?.keys || [], ["x", "y", "zoom"]);
      for (const [k, v] of Object.entries(s.camera || {})) {
        if (k === "keys") continue;
        if (!["x", "y", "zoom"].includes(k)) fail("Invalid camera");
        finite(v, k);
        if (k === "zoom") finite(v, k, 0.01, 100);
      }
      validateOwnership(s);
      if (!Array.isArray(s.captions || [])) fail("Invalid captions");
      for (const c of s.captions || []) {
        finite(c.start, "caption start", 0, s.duration);
        finite(c.end, "caption end", c.start, s.duration);
        if (typeof c.text !== "string" || c.text.length > 400)
          fail("Caption maximum 400 characters");
      }
    }
    if (!options.visualOnly) {
      (
        root.AudioModel ||
        (typeof require !== "undefined" ? require("./audio.js") : null)
      ).validate(p);
      if (JSON.stringify(p).length > 150e6) fail("Project exceeds 150 MB");
    }
    return p;
  }
  function sample(base, keys, t) {
    const out = { ...base };
    for (const prop of Object.keys(base)) {
      const track = (keys || [])
        .filter((k) => typeof k[prop] === "number")
        .sort((a, b) => a.t - b.t);
      if (!track.length) continue;
      let a = track[0],
        b = track[track.length - 1];
      if (t <= a.t) {
        out[prop] = a[prop];
        continue;
      }
      if (t >= b.t) {
        out[prop] = b[prop];
        continue;
      }
      for (let i = 1; i < track.length; i++)
        if (track[i].t >= t) {
          a = track[i - 1];
          b = track[i];
          break;
        }
      let u = (t - a.t) / (b.t - a.t);
      if (a.ease === "hold") u = 0;
      else if (a.ease === "smooth") u = u * u * (3 - 2 * u);
      out[prop] = a[prop] + (b[prop] - a[prop]) * u;
    }
    return out;
  }
  function duration(p) {
    return p.scenes.reduce((a, s) => a + s.duration, 0);
  }
  function locate(p, t) {
    finite(t, "time", 0, duration(p));
    let start = 0;
    for (let i = 0; i < p.scenes.length; i++) {
      const s = p.scenes[i];
      if (t < start + s.duration || i === p.scenes.length - 1)
        return { scene: s, index: i, time: t - start, start };
      start += s.duration;
    }
  }
  function render(
    p,
    t,
    { captions = true, width = p.width, height = p.height } = {},
  ) {
    validate(p, { visualOnly: true });
    finite(width, "export width", 64, 4096);
    finite(height, "export height", 64, 4096);
    if (width * height > 8388608) fail("Maximum 8 megapixels");
    const { scene: s, time } = locate(p, t);
    const owned = ownerTree(s, time);
    let clips = "";
    function node(n) {
      const v = Object.assign(
        sample({ ...defaults, ...n.pose }, n.keys, time),
        owned.poses.get(n.id) || {},
      );
      // Reveals use a local left-to-right wipe over each node's declared revealBox or project bounds.
      const box = n.revealBox || [0, 0, p.width, p.height];
      if (v.reveal < 1) {
        clips += `<clipPath id="wipe_${n.id}"><rect x="${box[0]}" y="${box[1]}" width="${Math.max(0, box[2] * v.reveal)}" height="${box[3]}"/></clipPath>`;
      }
      const tr = `translate(${v.x} ${v.y}) translate(${v.pivotX} ${v.pivotY}) rotate(${v.rotation}) scale(${v.scaleX} ${v.scaleY}) translate(${-v.pivotX} ${-v.pivotY})`;
      const aa = Object.entries(n.attrs)
        .filter(([k]) => k !== "id")
        .map(([k, v]) => ` ${k}="${esc(v)}"`)
        .join("");
      return `<g data-node="${n.id}" transform="${tr}" opacity="${v.opacity}"${v.reveal < 1 ? ` clip-path="url(#wipe_${n.id})"` : ""}><${n.tag} id="${n.id}"${aa}>${esc(n.text || "")}${(n.children || []).map(node).join("")}</${n.tag}></g>`;
    }
    const content = owned.nodes.map(node).join("");
    const camera = sample(
      {
        x: 0,
        y: 0,
        zoom: 1,
        ...Object.fromEntries(
          Object.entries(s.camera || {}).filter(([k]) => k !== "keys"),
        ),
      },
      s.camera?.keys,
      time,
    );
    let caption = "";
    const c = (s.captions || [])
      .filter((c) => time >= c.start && time < c.end)
      .map((c) => c.text)
      .join(" ");
    if (c && captions) {
      const words = c.split(/\s+/);
      const lines = [""];
      const max = Math.floor(p.width / 14);
      for (const w of words) {
        if ((lines.at(-1) + " " + w).length > max) lines.push(w);
        else lines[lines.length - 1] += (lines.at(-1) ? " " : "") + w;
      }
      if (lines.length > 4)
        fail("Caption overflow: shorten or split this caption");
      const h = lines.length * 29 + 24;
      caption =
        `<rect y="${p.height - h}" width="${p.width}" height="${h}" fill="#09121e" opacity=".93"/>` +
        lines
          .map(
            (l, i) =>
              `<text x="${p.width / 2}" y="${p.height - h + 34 + i * 29}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="23">${esc(l)}</text>`,
          )
          .join("");
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${p.width} ${p.height}"><defs>${clips}</defs><rect width="${p.width}" height="${p.height}" fill="${s.background}"/><g transform="translate(${p.width / 2} ${p.height / 2}) scale(${camera.zoom}) translate(${-p.width / 2 - camera.x} ${-p.height / 2 - camera.y})">${content}</g>${caption}</svg>`;
  }
  function importSVG(source) {
    if (source.length > 2e6) fail("SVG exceeds 2 MB");
    if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(source))
      fail("SVG declarations/entities are not allowed");
    const doc = new DOMParser().parseFromString(source, "image/svg+xml");
    if (
      doc.querySelector("parsererror") ||
      doc.documentElement.localName !== "svg"
    )
      fail("Invalid SVG document");
    const warnings = [];
    let serial = 0;
    function read(el) {
      if (!tags.has(el.localName))
        fail("Unsupported or unsafe SVG element: " + el.localName);
      if (el.namespaceURI !== "http://www.w3.org/2000/svg")
        fail("Unexpected XML namespace");
      const at = {};
      for (const a of el.attributes) {
        attrCheck(a.name, a.value, el.localName);
        at[a.name] = a.value;
      }
      const id = at.id || "import_" + ++serial;
      if (!at.id) warnings.push("Generated ID " + id);
      return {
        id,
        tag: el.localName,
        attrs: at,
        text: [...el.childNodes]
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent)
          .join(""),
        pose: { ...defaults },
        keys: [],
        children: [...el.children].map(read),
      };
    }
    for (const a of doc.documentElement.attributes) {
      if (!["xmlns", "width", "height", "viewBox", "version"].includes(a.name))
        fail("Unsupported root SVG attribute: " + a.name);
      if (a.name === "xmlns" && a.value !== "http://www.w3.org/2000/svg")
        fail("Invalid SVG namespace");
    }
    const nodes = [...doc.documentElement.children].map(read);
    const vb = doc.documentElement.getAttribute("viewBox");
    if (vb) {
      const nums = vb.trim().split(/[ ,]+/).map(Number);
      if (
        nums.length !== 4 ||
        nums.some((x) => !Number.isFinite(x)) ||
        nums[2] <= 0 ||
        nums[3] <= 0
      )
        fail("Invalid viewBox");
      warnings.push(
        "Root viewBox preserved in import wrapper transform; imported artwork keeps original dimensions.",
      );
      return {
        nodes: [
          {
            id: "import_root",
            tag: "g",
            attrs: { transform: `translate(${-nums[0]} ${-nums[1]})` },
            pose: { ...defaults },
            keys: [],
            children: nodes,
          },
        ],
        warnings,
      };
    }
    return { nodes, warnings };
  }
  function blank() {
    return {
      format: "jet2d",
      version: 1,
      title: "Untitled cartoon",
      voicePreferences: {provider:"kokoro",voice:"af_heart",speed:1,lang:"en-us"},
      width: 960,
      height: 540,
      fps: 24,
      scenes: [
        {
          id: "scene1",
          name: "Scene 1",
          duration: 6,
          background: "#101d30",
          nodes: [],
          captions: [],
          camera: { x: 0, y: 0, zoom: 1, keys: [] },
        },
      ],
      audio: [],
      ledger: [],
    };
  }
  root.Studio = {
    defaults,
    props,
    tags: [...tags],
    attrs: [...attrs],
    esc,
    clone,
    validate,
    sample,
    duration,
    locate,
    render,
    importSVG,
    blank,
    walk,
    ownerTree,
  };
  if (typeof module !== "undefined") module.exports = root.Studio;
})(typeof window !== "undefined" ? window : globalThis);
