"use strict";
const $ = (id) => document.getElementById(id),
  S = Studio;
let project = S.clone(window.PRODUCTION_PROJECT || DEMO_PROJECT),
  selected = [],
  time = 0,
  history = [],
  future = [],
  playing = false,
  last = 0,
  audios = [],
  serial = 100,
  library = S.clone(AUDIO_LIBRARY),
  audition = null;
const status = (m) => ($("status").textContent = m);
function current() {
  return S.locate(project, time);
}
function scene() {
  return current().scene;
}
function find(id) {
  let hit;
  S.walk(scene().nodes, (n) => {
    if (n.id === id) hit = n;
  });
  return hit;
}
function owner(id, ns = scene().nodes) {
  for (const n of ns) {
    if (n.id === id) return ns;
    const hit = owner(id, n.children || []);
    if (hit) return hit;
  }
}
function one() {
  return find(selected[0]);
}
function uid(prefix = "node") {
  let id;
  do {
    id = prefix + "_" + serial++;
  } while (
    project.scenes.some((s) => {
      let exists = false;
      S.walk(s.nodes, (n) => {
        if (n.id === id) exists = true;
      });
      return exists;
    })
  );
  return id;
}
function remember(value) {
  history.push(value);
  while (
    history.length > 1 &&
    (history.length > 60 || history.reduce((n, s) => n + s.length, 0) > 32e6)
  )
    history.shift();
}
function saveHistory() {
  remember(JSON.stringify(project));
  future = [];
}
function edit(fn) {
  stop();
  const before = JSON.stringify(project);
  try {
    fn();
    S.validate(project);
    remember(before);
    future = [];
    rebuildAudio();
    refresh();
    status("Saved in memory. Download JSON to keep this revision.");
  } catch (e) {
    project = JSON.parse(before);
    refresh();
    status(e.message);
  }
}
function guard(fn) {
  return async (...a) => {
    try {
      await fn(...a);
    } catch (e) {
      status(e.message);
    }
  };
}
function download(name, data, type = "application/json") {
  const url = URL.createObjectURL(
    data instanceof Blob ? data : new Blob([data], { type }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function cleanName() {
  return project.title.replace(/[^\w -]/g, "").trim() || "cartoon";
}
function draw() {
  const c = current();
  $("stage").innerHTML = S.render(project, time, {
    captions: $("captionsOn").checked,
  });
  $("clock").textContent =
    `${time.toFixed(2)} / ${S.duration(project).toFixed(2)}s`;
  $("scrub").value = time;
  $("shotLabel").textContent =
    c.scene.name + " · local " + c.time.toFixed(2) + "s";
  $("scenes").value = c.index;
}
function field(container, label, value, handler) {
  const l = document.createElement("label");
  l.textContent = label;
  const input = document.createElement("input");
  input.type = "number";
  input.step = [
    "gain",
    "duck",
    "duckAttack",
    "duckRelease",
    "fadeIn",
    "fadeOut",
  ].includes(label)
    ? ".01"
    : ".1";
  input.value = value;
  input.dataset.prop = label;
  input.onchange = () => edit(() => handler(Number(input.value)));
  l.append(input);
  container.append(l);
}
function inspect() {
  const n = one();
  $("selectedName").textContent = n ? n.id + " · " + n.tag : "No selection";
  $("poseFields").replaceChildren();
  if (n) {
    const pose = { ...S.defaults, ...n.pose };
    for (const p of S.props)
      field($("poseFields"), p, pose[p], (v) => {
        n.pose = { ...pose, [p]: v };
      });
    $("fill").value = n.attrs.fill || "none";
    $("stroke").value = n.attrs.stroke || "none";
    $("strokeWidth").value = n.attrs["stroke-width"] || 0;
    $("attributes").value = JSON.stringify(n.attrs, null, 2);
    $("textContent").value = n.text || "";
    $("pathData").value = n.attrs.d || "";
    $("nodeSource").value = nodeXML(n);
    $("ownerSource2D").value = JSON.stringify(n.owners || [], null, 2);
  } else {
    for (const id of [
      "attributes",
      "textContent",
      "pathData",
      "nodeSource",
      "ownerSource2D",
    ])
      $(id).value = "";
  }
  $("keys").replaceChildren();
  for (const [i, k] of (n?.keys || []).entries()) {
    const b = document.createElement("button");
    b.textContent = k.t.toFixed(2) + "s ×";
    b.title = "Delete key";
    b.onclick = () => edit(() => n.keys.splice(i, 1));
    $("keys").append(b);
  }
  $("cameraFields").replaceChildren();
  const cam = scene().camera || {};
  for (const p of ["x", "y", "zoom"])
    field($("cameraFields"), p, cam[p] ?? (p === "zoom" ? 1 : 0), (v) => {
      scene().camera = { ...cam, [p]: v };
    });
}
function nodeXML(n) {
  return (
    `<${n.tag} id="${S.esc(n.id)}"` +
    Object.entries(n.attrs)
      .filter(([k]) => k !== "id")
      .map(([k, v]) => ` ${k}="${S.esc(v)}"`)
      .join("") +
    ">" +
    S.esc(n.text || "") +
    (n.children || []).map(nodeXML).join("") +
    `</${n.tag}>`
  );
}
function layers() {
  const out = $("layers");
  out.replaceChildren();
  function each(ns, depth) {
    for (const n of [...ns].reverse()) {
      const b = document.createElement("button");
      b.className = "layer" + (selected.includes(n.id) ? " selected" : "");
      b.style.paddingLeft = 8 + depth * 13 + "px";
      b.textContent = (n.tag === "g" ? "▾ " : "◇ ") + n.id;
      b.onclick = (e) => {
        if (e.shiftKey)
          selected = selected.includes(n.id)
            ? selected.filter((id) => id !== n.id)
            : [...selected, n.id];
        else selected = [n.id];
        layers();
        inspect();
      };
      out.append(b);
      each(n.children || [], depth + 1);
    }
  }
  each(scene().nodes, 0);
}
function refresh() {
  time = Math.min(time, S.duration(project));
  selected = selected.filter((id) => find(id));
  $("title").value = project.title;
  $("summary").textContent =
    `${project.width} × ${project.height} · ${project.fps} fps · ${project.scenes.length} scenes`;
  $("scenes").replaceChildren();
  project.scenes.forEach((s, i) => {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = s.name;
    $("scenes").append(o);
  });
  $("duration").value = scene().duration;
  $("sceneName").value = scene().name;
  $("background").value = scene().background;
  $("captions").value = JSON.stringify(scene().captions || [], null, 2);
  $("ledger").value = JSON.stringify(project.ledger || [], null, 2);
  for (const k of ["width", "height", "fps"]) $(k).value = project[k];
  $("scrub").max = S.duration(project);
  $("scrub").step = 1 / project.fps;
  $("ruler").replaceChildren();
  let start = 0;
  project.scenes.forEach((s) => {
    const t = start;
    const b = document.createElement("button");
    b.style.flex = s.duration;
    b.textContent = s.name;
    b.onclick = () => seek(t);
    $("ruler").append(b);
    start += s.duration;
  });
  layers();
  inspect();
  audioUI();
  draw();
}
function load(p) {
  S.validate(p);
  stop();
  saveHistory();
  project = S.clone(p);
  time = 0;
  selected = [];
  rebuildAudio();
  refresh();
  document.dispatchEvent(new Event("jet2d-project-loaded"));
  status("Loaded and validated. Embedded artwork and audio restored.");
}
function seek(t) {
  stop();
  time = Math.max(0, Math.min(Number(t), S.duration(project)));
  refresh();
}
function rebuildAudio() {
  for (const a of audios) a.el.pause();
  audios = (project.audio || []).map((track) => {
    const el = new Audio(AudioModel.data(project, track));
    el.preload = "auto";
    el.volume = AudioModel.gainAt(project, track, time);
    el.loop = !!track.loop;
    el.preservesPitch = true;
    return { track, el };
  });
}
function syncAudio() {
  const speed = Number($("speed").value);
  for (const { track: a, el } of audios) {
    const active = time >= a.start && time < a.start + a.duration;
    if (!active) {
      el.pause();
      continue;
    }
    const sd = AudioModel.sourceDuration(project, a),
      target = a.loop
        ? (time - a.start + a.offset) % sd
        : time - a.start + a.offset;
    el.volume = AudioModel.gainAt(project, a, time);
    el.playbackRate = speed;
    if (Math.abs(el.currentTime - target) > 0.14) el.currentTime = target;
    if (el.paused)
      el.play().catch((e) => status("Audio playback failed: " + e.message));
  }
}
function stop() {
  if (audition) audition.pause();
  playing = false;
  $("play").textContent = "▶ Play";
  for (const a of audios) a.el.pause();
}
function tick(now) {
  if (!playing) return;
  const oldScene = current().index;
  if (last) time += ((now - last) / 1000) * Number($("speed").value);
  last = now;
  if (time >= S.duration(project)) {
    time = S.duration(project);
    stop();
    refresh();
    return;
  }
  if (current().index !== oldScene) refresh();
  else draw();
  syncAudio();
  requestAnimationFrame(tick);
}
function audioUI() {
  const box = $("audioList");
  box.replaceChildren();
  (project.audio || []).forEach((a, i) => {
    const div = document.createElement("div");
    div.className = "audio";
    const title = document.createElement("b");
    title.textContent = (a.kind || "audio") + " · " + a.name;
    div.append(title);
    const fields = document.createElement("div");
    fields.className = "grid2";
    for (const k of [
      "start",
      "offset",
      "duration",
      "gain",
      "fadeIn",
      "fadeOut",
      "duck",
      "duckAttack",
      "duckRelease",
    ])
      field(
        fields,
        k,
        a[k] ?? (["duck"].includes(k) ? 1 : 0),
        (v) => (project.audio[i][k] = v),
      );
    div.append(fields);
    const role = document.createElement("select");
    role.setAttribute("aria-label", "Clip role " + i);
    for (const k of ["narration", "music", "sfx"]) role.add(new Option(k, k));
    role.value = a.kind || "narration";
    role.onchange = () => edit(() => (a.kind = role.value));
    div.append(role);
    const loop = document.createElement("label");
    loop.textContent = "Loop source";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!a.loop;
    cb.onchange = () => edit(() => (a.loop = cb.checked));
    loop.append(cb);
    div.append(loop);
    const b = document.createElement("button");
    b.textContent = "Remove";
    b.onclick = () => edit(() => project.audio.splice(i, 1));
    div.append(b);
    box.append(div);
  });
}
$("stage").onclick = (e) => {
  const target = e.target.closest("[data-node]");
  if (target) {
    selected = [target.getAttribute("data-node")];
    layers();
    inspect();
  }
};
$("play").onclick = () => {
  if (playing) {
    stop();
    refresh();
    return;
  }
  if (time >= S.duration(project)) time = 0;
  playing = true;
  last = 0;
  $("play").textContent = "Ⅱ Pause";
  syncAudio();
  requestAnimationFrame(tick);
};
$("scrub").oninput = (e) => seek(e.target.value);
$("captionsOn").onchange = draw;
$("speed").onchange = () => {
  if (playing) syncAudio();
};
$("new").onclick = () => load(S.blank());
$("demo").onclick = () => load(DEMO_PROJECT);
$("save").onclick = () => {
  S.validate(project);
  download(cleanName() + ".jet2d.json", JSON.stringify(project, null, 2));
  status("Project JSON downloaded. All audio is embedded.");
};
$("load").onchange = guard(async (e) => {
  const f = e.target.files[0];
  if (f) {
    if (f.size > 150e6) throw Error("Project exceeds 150 MB");
    load(JSON.parse(await f.text()));
  }
  e.target.value = "";
});
$("undo").onclick = () => {
  if (!history.length) return;
  stop();
  future.push(JSON.stringify(project));
  project = JSON.parse(history.pop());
  time = Math.min(time, S.duration(project));
  selected = [];
  rebuildAudio();
  refresh();
  status("Undo applied");
};
$("redo").onclick = () => {
  if (!future.length) return;
  stop();
  history.push(JSON.stringify(project));
  project = JSON.parse(future.pop());
  rebuildAudio();
  refresh();
  status("Redo applied");
};
$("title").onchange = () => edit(() => (project.title = $("title").value));
$("sceneName").onchange = () =>
  edit(() => (scene().name = $("sceneName").value));
$("duration").onchange = () =>
  edit(() =>
    StudioTimeline2D.resize(
      project,
      current().index,
      Number($("duration").value),
    ),
  );
$("background").onchange = () =>
  edit(() => (scene().background = $("background").value));
$("scenes").onchange = (e) =>
  seek(
    project.scenes
      .slice(0, Number(e.target.value))
      .reduce((a, s) => a + s.duration, 0),
  );
$("addScene").onclick = () =>
  edit(() => {
    const s = S.blank().scenes[0];
    s.id = uid("scene");
    s.name = "Scene " + (project.scenes.length + 1);
    project.scenes.push(s);
    time = S.duration(project) - s.duration;
    selected = [];
  });
$("duplicateScene").onclick = () =>
  edit(() => {
    const s = S.clone(scene());
    s.id = uid("scene");
    s.name += " copy";
    const idMap = new Map();
    S.walk(s.nodes, (n) => {
      const old = n.id;
      n.id = uid("copy");
      idMap.set(old, n.id);
      if (n.attrs.id) n.attrs.id = n.id;
    });
    S.walk(s.nodes, (n) => {
      for (const key of n.owners || [])
        if (key.parentId !== null)
          key.parentId = idMap.get(key.parentId) || key.parentId;
    });
    const idx = current().index;
    StudioTimeline2D.duplicateAudio(project, idx);
    project.scenes.splice(idx + 1, 0, s);
    time = current().start + scene().duration;
    selected = [];
  });
$("deleteScene").onclick = () =>
  edit(() => {
    if (project.scenes.length === 1) throw Error("Keep at least one scene");
    const idx = current().index;
    StudioTimeline2D.deleteAudio(project, idx);
    project.scenes.splice(idx, 1);
    time = 0;
    selected = [];
  });
const shapeAttrs = {
  rect: { x: 380, y: 210, width: 180, height: 100, rx: 15 },
  circle: { cx: 480, cy: 270, r: 65 },
  ellipse: { cx: 480, cy: 270, rx: 90, ry: 50 },
  line: {
    x1: 350,
    y1: 240,
    x2: 600,
    y2: 300,
    stroke: "#72e5c1",
    "stroke-width": 5,
  },
  path: { d: "M350 300 Q480 130 610 300 Z" },
  text: { x: 350, y: 270, "font-size": 40, "font-family": "Arial, sans-serif" },
};
for (const b of document.querySelectorAll("[data-shape]"))
  b.onclick = () =>
    edit(() => {
      const tag = b.dataset.shape,
        n = {
          id: uid(tag),
          tag,
          attrs: { fill: "#72e5c1", ...shapeAttrs[tag] },
          pose: { ...S.defaults },
          keys: [],
          children: [],
        };
      if (tag === "text") n.text = "Your words";
      scene().nodes.push(n);
      selected = [n.id];
    });
function adoptSVG(src, excluded = new Set()) {
  const result = S.importSVG(src);
  let all = new Set();
  project.scenes.forEach((s) =>
    S.walk(s.nodes, (n) => {
      if (!excluded.has(n.id)) all.add(n.id);
    }),
  );
  S.walk(result.nodes, (n) => {
    if (all.has(n.id)) {
      const old = n.id;
      n.id = uid("import");
      if (n.attrs.id) n.attrs.id = n.id;
      result.warnings.push("ID collision " + old + " renamed to " + n.id);
    }
    all.add(n.id);
  });
  return result;
}
$("svgImport").onchange = guard(async (e) => {
  if (!e.target.files[0]) return;
  const r = adoptSVG(await e.target.files[0].text());
  edit(() => {
    scene().nodes.push(...r.nodes);
    selected = r.nodes.map((n) => n.id);
  });
  status("SVG imported as editable nodes. " + r.warnings.join(" "));
  e.target.value = "";
});
$("up").onclick = () =>
  edit(() => {
    for (const id of selected) {
      const ns = owner(id);
      if (!ns) continue;
      const i = ns.findIndex((n) => n.id === id);
      if (i < ns.length - 1) [ns[i], ns[i + 1]] = [ns[i + 1], ns[i]];
    }
  });
$("down").onclick = () =>
  edit(() => {
    for (const id of selected) {
      const ns = owner(id);
      if (!ns) continue;
      const i = ns.findIndex((n) => n.id === id);
      if (i > 0) [ns[i], ns[i - 1]] = [ns[i - 1], ns[i]];
    }
  });
$("group").onclick = () =>
  edit(() => {
    if (!selected.length) throw Error("Select sibling layers to group");
    const ns = owner(selected[0]);
    if (selected.some((id) => owner(id) !== ns))
      throw Error("Group only sibling layers");
    const children = ns.filter((n) => selected.includes(n.id));
    const index = ns.indexOf(children[0]);
    for (const n of children) ns.splice(ns.indexOf(n), 1);
    const n = {
      id: uid("group"),
      tag: "g",
      attrs: {},
      pose: { ...S.defaults },
      keys: [],
      children,
    };
    ns.splice(index, 0, n);
    selected = [n.id];
  });
$("ungroup").onclick = () =>
  edit(() => {
    const n = one();
    if (!n || n.tag !== "g") throw Error("Select a group");
    if (
      (n.keys || []).length ||
      Object.entries(n.pose || {}).some(([k, v]) => v !== S.defaults[k]) ||
      Object.keys(n.attrs).some((k) => k !== "id")
    )
      throw Error(
        "Ungroup only identity groups; retain transformed or animated parent to preserve motion",
      );
    const ns = owner(n.id);
    ns.splice(ns.indexOf(n), 1, ...n.children);
    selected = n.children.map((n) => n.id);
  });
$("deleteNode").onclick = () =>
  edit(() => {
    for (const id of selected) {
      const ns = owner(id);
      if (ns)
        ns.splice(
          ns.findIndex((n) => n.id === id),
          1,
        );
    }
    selected = [];
  });
function need() {
  const n = one();
  if (!n) throw Error("Select a layer");
  return n;
}
$("paint").onclick = () =>
  edit(() => {
    for (const id of selected) {
      const n = find(id);
      Object.assign(n.attrs, {
        fill: $("fill").value,
        stroke: $("stroke").value,
        "stroke-width": Number($("strokeWidth").value),
      });
    }
  });
$("applyText").onclick = () =>
  edit(() => {
    const n = need();
    if (!["text", "tspan"].includes(n.tag)) throw Error("Select text");
    n.text = $("textContent").value;
  });
$("applyPath").onclick = () =>
  edit(() => {
    const n = need();
    if (n.tag !== "path") throw Error("Select a path");
    n.attrs.d = $("pathData").value;
  });
$("applyAttributes").onclick = () =>
  edit(() => (need().attrs = JSON.parse($("attributes").value)));
$("addKey").onclick = () =>
  edit(() => {
    const n = need();
    n.keys = n.keys || [];
    n.keys = n.keys.filter((k) => Math.abs(k.t - current().time) > 0.0001);
    n.keys.push({
      t: current().time,
      ...S.defaults,
      ...n.pose,
      ease: $("easing").value,
    });
    n.keys.sort((a, b) => a.t - b.t);
  });
$("clearKeys").onclick = () => edit(() => (need().keys = []));
$("cameraKey").onclick = () =>
  edit(() => {
    scene().camera = scene().camera || {};
    const c = scene().camera;
    c.keys = c.keys || [];
    c.keys = c.keys.filter((k) => Math.abs(k.t - current().time) > 0.0001);
    c.keys.push({
      t: current().time,
      x: c.x || 0,
      y: c.y || 0,
      zoom: c.zoom ?? 1,
      ease: $("easing").value,
    });
  });
$("cameraClear").onclick = () => edit(() => (scene().camera.keys = []));
$("applyOwners2D").onclick = () =>
  edit(() => (need().owners = JSON.parse($("ownerSource2D").value)));
$("applyCaptions").onclick = () =>
  edit(() => (scene().captions = JSON.parse($("captions").value)));
$("applyLedger").onclick = () =>
  edit(() => (project.ledger = JSON.parse($("ledger").value)));
$("refreshSource").onclick = () =>
  ($("projectSource").value = JSON.stringify(project, null, 2));
$("applySource").onclick = guard(() =>
  load(JSON.parse($("projectSource").value)),
);
$("format").onclick = () =>
  edit(() => {
    for (const k of ["width", "height", "fps"]) project[k] = Number($(k).value);
  });
$("validate").onclick = guard(() => {
  S.validate(project);
  for (let i = 0; i < project.scenes.length; i++) {
    const start = project.scenes
      .slice(0, i)
      .reduce((a, s) => a + s.duration, 0);
    for (const c of project.scenes[i].captions)
      S.render(project, start + c.start);
  }
  status("Project and all caption layouts validated.");
});
$("applyNodeSource").onclick = () =>
  edit(() => {
    const n = need();
    const excluded = new Set();
    S.walk([n], (part) => excluded.add(part.id));
    const r = adoptSVG(
      '<svg xmlns="http://www.w3.org/2000/svg">' +
        $("nodeSource").value +
        "</svg>",
      excluded,
    );
    if (r.nodes.length !== 1) throw Error("Provide exactly one root element");
    const replacement = r.nodes[0];
    replacement.pose = n.pose;
    replacement.keys = n.keys;
    for (const k of ["owners", "library", "joint"])
      if (n[k] !== undefined) replacement[k] = S.clone(n[k]);
    const ns = owner(n.id);
    ns.splice(ns.indexOf(n), 1, replacement);
    selected = [replacement.id];
  });
$("audioImport").onchange = guard(async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > 40e6) throw Error("Audio limit 40 MB per track");
  const data = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
  const el = new Audio(data);
  await new Promise((res, rej) => {
    el.onloadedmetadata = res;
    el.onerror = () => rej(Error("Audio codec unsupported in this browser"));
    el.load();
  });
  edit(() =>
    project.audio.push({
      name: f.name,
      kind: $("audioRole").value,
      data,
      start: time,
      offset: 0,
      duration: el.duration,
      sourceDuration: el.duration,
      gain: $("audioRole").value === "narration" ? 0.9 : 0.18,
      fadeIn: 0,
      fadeOut: 0.05,
      duck: $("audioRole").value === "narration" ? 1 : 0.5,
    }),
  );
  e.target.value = "";
});
$("svgExport").onclick = guard(() =>
  download(
    cleanName() + "-" + time.toFixed(2) + ".svg",
    S.render(project, time, { captions: $("captionsOn").checked }),
    "image/svg+xml",
  ),
);
async function png(p, t, options = {}) {
  const svg = S.render(p, t, options);
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = options.width || p.width;
  canvas.height = options.height || p.height;
  canvas.getContext("2d").drawImage(img, 0, 0);
  return new Promise((r) => canvas.toBlob(r, "image/png"));
}
$("pngExport").onclick = guard(async () =>
  download(
    cleanName() + "-" + time.toFixed(2) + ".png",
    await png(project, time, { captions: $("captionsOn").checked }),
    "image/png",
  ),
);
function libraryUI() {
  const keep = $("libraryTrack").value;
  $("libraryTrack").replaceChildren(new Option("Silence / no cue", ""));
  for (const a of library.assets.filter(
    (a) => a.kind === $("libraryType").value,
  ))
    $("libraryTrack").add(
      new Option(
        a.name + (a.available === false ? " — missing asset" : ""),
        a.id,
      ),
    );
  if ([...$("libraryTrack").options].some((o) => o.value === keep))
    $("libraryTrack").value = keep;
  else if ($("libraryTrack").options.length > 1)
    $("libraryTrack").selectedIndex = 1;
  libraryInfo();
}
function selectedAsset() {
  const a = library.assets.find((a) => a.id === $("libraryTrack").value);
  if (!a) throw Error("Choose a recording; Silence adds no cue.");
  if (a.available === false || !a.data)
    throw Error(
      a.name + " audio asset is missing. Import the actual recording.",
    );
  return a;
}
function libraryInfo() {
  const a = library.assets.find((a) => a.id === $("libraryTrack").value);
  $("libraryInfo").textContent = a
    ? a.name +
      " · " +
      a.kind +
      " · " +
      (a.duration?.toFixed(2) || "?") +
      "s · " +
      (a.provenance?.rights ||
        "User-imported recording; retain its rights/provenance.")
    : "Silence: no recording selected.";
}
$("libraryType").onchange = () => {
  if (audition) audition.pause();
  libraryUI();
};
$("libraryTrack").onchange = () => {
  if (audition) audition.pause();
  libraryInfo();
};
$("libraryPreview").onclick = guard(async () => {
  const a = selectedAsset();
  stop();
  audition = new Audio(a.data);
  audition.volume = a.kind === "music" ? 0.18 : 0.25;
  await audition.play();
  status("Auditioning " + a.name + " from the offline library.");
});
$("libraryStop").onclick = () => {
  if (audition) audition.pause();
  status("Library audition stopped.");
};
$("libraryAdd").onclick = () =>
  edit(() => {
    const a = selectedAsset(),
      remaining = S.duration(project) - time;
    if (remaining <= 0) throw Error("Move the playhead before the project end");
    AudioModel.add(
      project,
      a,
      time,
      a.kind === "music" ? remaining : Math.min(a.duration, remaining),
    );
  });
$("libraryScene").onclick = () =>
  edit(() => {
    const a = selectedAsset(),
      c = current();
    AudioModel.add(
      project,
      a,
      c.start,
      a.kind === "music"
        ? c.scene.duration
        : Math.min(a.duration, c.scene.duration),
    );
  });
$("librarySave").onclick = guard(() =>
  download(
    "Jet-Black-Audio-Library.jet-audio-library.json",
    JSON.stringify(AudioModel.validateLibrary(library)),
  ),
);
$("libraryLoad").onchange = guard(async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > 150e6) throw Error("Library exceeds 150MB");
  const next = AudioModel.validateLibrary(JSON.parse(await f.text()));
  if (audition) audition.pause();
  library = S.clone(next);
  libraryUI();
  status("Reusable audio library loaded. Existing project cues are unchanged.");
  e.target.value = "";
});
$("libraryImport").onchange = guard(async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > 40e6) throw Error("Recording exceeds 40MB");
  const bytes = await f.arrayBuffer(),
    hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const data = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(f);
  });
  const el = new Audio(data);
  await new Promise((resolve, reject) => {
    el.onloadedmetadata = resolve;
    el.onerror = () => reject(Error("Unsupported recording codec"));
    el.load();
  });
  const a = {
    id: "custom/" + hash.slice(0, 20),
    name: f.name,
    kind: $("libraryType").value,
    duration: el.duration,
    data,
    available: true,
    sha256: hash,
    provenance: {
      source: "User-imported local recording",
      rights:
        "User must retain the recording permissions; no public license inferred.",
    },
  };
  AudioModel.validateLibrary({ ...library, assets: [a] });
  library.assets = library.assets.filter((x) => x.id !== a.id);
  library.assets.push(a);
  libraryUI();
  $("libraryTrack").value = a.id;
  libraryInfo();
  status("Recording added to reusable library; Save library JSON to keep it.");
  e.target.value = "";
});
libraryUI();
window.Editor = {
  select: (id) => {
    if (!find(id)) throw Error("Node not in current scene");
    selected = [id];
    layers();
    inspect();
  },
  getSelected: () => [...selected],
  getProject: () => S.clone(project),
  load,
  seek,
  png,
  getTime: () => time,
  getLibrary: () => S.clone(library),
  getAuditionState: () =>
    audition
      ? {
          paused: audition.paused,
          currentTime: audition.currentTime,
          readyState: audition.readyState,
          duration: audition.duration,
          error: audition.error?.message || null,
        }
      : null,
  getAudioState: () =>
    audios.map(({ track, el }) => ({
      name: track.name,
      currentTime: el.currentTime,
      paused: el.paused,
      volume: el.volume,
      expectedGain: AudioModel.gainAt(project, track, time),
      assetId: track.assetId,
      rate: el.playbackRate,
      preservesPitch: el.preservesPitch,
    })),
  stop,
};
rebuildAudio();
refresh();
status(
  window.PRODUCTION_PROJECT
    ? "Complete production loaded. Save JSON after edits."
    : "Original demo loaded. Save JSON after edits.",
);
