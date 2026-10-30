/* Original blank articulated 2D puppet. Private studio source. */
(function (root) {
  "use strict";
  const S =
      root.Studio ||
      (typeof require === "function" ? require("./core.js") : null),
    copy = S.clone;
  const VERSION = "humanoid-v1";
  const styleDefaults = {
    skin: "#d7dce3",
    shirt: "#b8c4d4",
    pants: "#8997ab",
    shoes: "#465269",
    hair: "#303a4c",
    outline: "#273447",
    eye: "#1e293b",
    hairVisible: false,
  };
  const actions = [
    "idle",
    "breathe",
    "blink",
    "walk",
    "run",
    "wave",
    "talk",
    "nod",
    "point",
    "reach",
    "carry",
    "push",
    "sit",
    "stand-up",
    "crouch",
    "kneel",
    "jump",
    "celebrate",
    "sad",
    "bow",
  ];
  const actionFactories = new Map();
  const actionInfo = Object.fromEntries(
    actions.map((name) => [
      name,
      { name, category: "Everyday", label: name.replaceAll("-", " ") },
    ]),
  );
  function registerAction(name, factory, info = {}) {
    if (
      !/^[a-z][a-z0-9-]*$/.test(name) ||
      actions.includes(name) ||
      typeof factory !== "function"
    )
      throw Error("Invalid or duplicate action registration");
    actionFactories.set(name, factory);
    actions.push(name);
    actionInfo[name] = { ...info, name };
  }
  function requireRig(r) {
    if (r?.puppet?.rig !== VERSION) throw Error("Select a humanoid-v1 puppet.");
    return r;
  }
  function joint(r, name) {
    let found;
    S.walk([r], (n) => {
      if (n.puppetJoint === name) found = n;
    });
    if (!found) throw Error("Unknown puppet joint: " + name);
    return found;
  }
  function create(id = "puppet", x = 480, y = 450, style = {}) {
    if (!/^[A-Za-z_][\w.-]*$/.test(id)) throw Error("Invalid puppet ID");
    let serial = 0;
    const joints = [],
      make = (tag, attrs = {}, children = []) => ({
        id: id + "_art" + serial++,
        tag,
        attrs,
        pose: { ...S.defaults },
        keys: [],
        children,
      });
    const art = (tag, attrs, slot) => {
      const n = make(tag, attrs);
      if (slot) n.styleSlot = slot;
      return n;
    };
    const group = (name, x = 0, y = 0, children = []) => {
      const n = make("g", {}, children);
      n.id = id + "_" + name;
      n.puppetJoint = name;
      n.pose = { ...S.defaults, x, y };
      n.bindPose = copy(n.pose);
      joints.push(name);
      return n;
    };
    const rect = (x, y, w, h, slot, rx = 7) =>
      art(
        "rect",
        {
          x,
          y,
          width: w,
          height: h,
          rx,
          fill: styleDefaults[slot],
          stroke: styleDefaults.outline,
          "stroke-width": 1.5,
        },
        slot,
      );
    const ell = (cx, cy, rx, ry, slot) =>
      art(
        "ellipse",
        {
          cx,
          cy,
          rx,
          ry,
          fill: styleDefaults[slot],
          stroke: styleDefaults.outline,
          "stroke-width": 1.5,
        },
        slot,
      );
    const line = (x1, y1, x2, y2, slot, width = 3) =>
      art(
        "line",
        {
          x1,
          y1,
          x2,
          y2,
          stroke: styleDefaults[slot],
          "stroke-width": width,
          "stroke-linecap": "round",
        },
        slot,
      );
    function hand(side) {
      const open = group("hand" + side + "Open", 0, 0, [
        ell(0, 5, 9, 11, "skin"),
        ...[-6, -2, 2, 6].map((v, i) =>
          rect(v - 1.5, 8, 3, [13, 17, 16, 12][i], "skin", 1.5),
        ),
        rect(side === "L" ? 5 : -10, 0, 5, 12, "skin", 2),
      ]);
      const fist = group("hand" + side + "Fist", 0, 0, [
        rect(-9, -3, 18, 20, "skin", 5),
        line(-4, 1, -4, 9, "outline", 1),
        line(0, 0, 0, 9, "outline", 1),
        line(4, 1, 4, 9, "outline", 1),
      ]);
      const point = group("hand" + side + "Point", 0, 0, [
        rect(-8, 0, 16, 16, "skin", 5),
        rect(-5, 9, 4, 22, "skin", 2),
      ]);
      fist.pose.opacity = fist.bindPose.opacity = 0;
      point.pose.opacity = point.bindPose.opacity = 0;
      return group("wrist" + side, 0, 37, [open, fist, point]);
    }
    function arm(side) {
      const elbow = group("elbow" + side, 0, 42, [
        rect(-7, -5, 14, 43, "skin", 7),
        hand(side),
      ]);
      return group("shoulder" + side, side === "L" ? -29 : 29, -90, [
        rect(-10, -4, 20, 48, "shirt", 10),
        elbow,
      ]);
    }
    function leg(side) {
      const ankle = group("ankle" + side, 0, 45, [
        rect(-11, -4, side === "L" ? 28 : 28, 13, "shoes", 5),
      ]);
      const knee = group("knee" + side, 0, 48, [
        rect(-10, -5, 20, 51, "pants", 9),
        ankle,
      ]);
      return group("hip" + side, side === "L" ? -14 : 14, 0, [
        rect(-12, -6, 24, 58, "pants", 11),
        knee,
      ]);
    }
    const eyeL = group("eyeL", -10, -4, [ell(0, 0, 3, 4, "eye")]),
      eyeR = group("eyeR", 10, -4, [ell(0, 0, 3, 4, "eye")]);
    const brows = [
      group("browL", -10, -14, [line(-5, 0, 5, 0, "outline", 2)]),
      group("browR", 10, -14, [line(-5, 0, 5, 0, "outline", 2)]),
    ];
    const mouth = group("mouth", 0, 12, [ell(0, 0, 6, 2, "outline")]);
    const hair = group("hair", 0, 0, [
      art(
        "path",
        {
          d: "M-25 -8 L-24 -25 Q0 -45 24 -25 L26 -8 L12 -20 L-12 -20 Z",
          fill: styleDefaults.hair,
        },
        "hair",
      ),
    ]);
    const head = group("head", 0, -14, [
      ell(0, -1, 26, 30, "skin"),
      eyeL,
      eyeR,
      ...brows,
      mouth,
      hair,
    ]);
    const neck = group("neck", 0, -108, [
      rect(-8, -10, 16, 17, "skin", 4),
      head,
    ]);
    const torso = group("torso", 0, 0, [
      rect(-28, -104, 56, 110, "shirt", 12),
      arm("L"),
      arm("R"),
      neck,
    ]);
    const pelvis = group("pelvis", 0, -95, [
      leg("L"),
      leg("R"),
      rect(-27, -10, 54, 23, "pants", 10),
      torso,
    ]);
    const r = group("root", x, y, [pelvis]);
    r.id = id;
    r.library = { role: "character", kind: "blank-articulated-person" };
    r.puppet = {
      rig: VERSION,
      joints,
      style: { ...styleDefaults },
      clips: [],
      view: "front",
      notes:
        "Hierarchical forward-kinematic SVG rig; no automatic foot planting or inverse kinematics.",
    };
    restyle(r, style);
    return r;
  }
  function restyle(r, changes = {}) {
    requireRig(r);
    const style = { ...r.puppet.style };
    for (const [k, v] of Object.entries(changes)) {
      if (!(k in styleDefaults)) throw Error("Unknown style slot: " + k);
      if (k === "hairVisible") {
        if (typeof v !== "boolean") throw Error("hairVisible must be boolean");
      } else if (typeof v !== "string" || !/^#[0-9a-fA-F]{6}$/.test(v))
        throw Error("Use six-digit hex colors");
      style[k] = v;
    }
    S.walk([r], (n) => {
      if (n.styleSlot) {
        const key = n.tag === "line" ? "stroke" : "fill";
        n.attrs[key] = style[n.styleSlot];
      }
      if (n.attrs?.stroke && n.tag !== "line") n.attrs.stroke = style.outline;
    });
    // Appearance visibility is independent of the skeletal animation channels.
    joint(r, "hair").attrs.opacity = style.hairVisible ? 1 : 0;
    r.puppet.style = style;
    return r;
  }
  function validatePose(p, r) {
    if (
      p?.format !== "jet2d-puppet-pose" ||
      p.version !== 1 ||
      p.rig !== VERSION ||
      !p.channels ||
      typeof p.channels !== "object"
    )
      throw Error("Invalid puppet pose");
    for (const [name, v] of Object.entries(p.channels)) {
      joint(r, name);
      if (!v || typeof v !== "object" || Array.isArray(v))
        throw Error("Invalid joint channels");
      for (const [k, n] of Object.entries(v)) {
        if (
          !["x", "y", "rotation", "scaleX", "scaleY", "opacity"].includes(k) ||
          !Number.isFinite(n) ||
          Math.abs(n) > 10000
        )
          throw Error("Invalid pose channel");
        if (k === "opacity" && (n < 0 || n > 1)) throw Error("Invalid opacity");
      }
    }
    return p;
  }
  function pose(channels = {}, name = "Custom pose") {
    return {
      format: "jet2d-puppet-pose",
      version: 1,
      rig: VERSION,
      name,
      channels: copy(channels),
    };
  }
  function absolute(n, delta = {}) {
    const p = copy(n.bindPose);
    for (const [k, v] of Object.entries(delta))
      p[k] =
        k === "x" || k === "y" || k === "rotation"
          ? p[k] + v
          : k === "scaleX" || k === "scaleY"
            ? p[k] * v
            : v;
    return p;
  }
  function applyPose(r, p, time) {
    requireRig(r);
    validatePose(p, r);
    if (
      time !== undefined &&
      (!Number.isFinite(time) || time < 0 || time > 3600)
    )
      throw Error("Invalid pose time");
    if (
      time === undefined &&
      r.puppet.joints.some((name) => joint(r, name).keys.length)
    )
      throw Error(
        "Animated puppet: set a pose key at a time, or clear its animation first.",
      );
    for (const name of r.puppet.joints) {
      const n = joint(r, name),
        value = absolute(n, p.channels[name]);
      if (time === undefined) n.pose = value;
      else {
        n.keys = n.keys.filter((k) => Math.abs(k.t - time) > 1e-7);
        n.keys.push({ t: time, ...value, ease: "smooth" });
        n.keys.sort((a, b) => a.t - b.t);
      }
    }
    return r;
  }
  function capturePose(r, time = 0, name = "Saved pose") {
    requireRig(r);
    const channels = {};
    for (const name of r.puppet.joints) {
      const n = joint(r, name),
        p = S.sample({ ...S.defaults, ...n.pose }, n.keys, time),
        d = {};
      for (const k of ["x", "y", "rotation", "scaleX", "scaleY", "opacity"]) {
        const v =
          k === "x" || k === "y" || k === "rotation"
            ? p[k] - n.bindPose[k]
            : k === "scaleX" || k === "scaleY"
              ? p[k] / n.bindPose[k]
              : p[k];
        if (v !== (k === "scaleX" || k === "scaleY" || k === "opacity" ? 1 : 0))
          d[k] = v;
      }
      channels[name] = d;
    }
    return pose(channels, name);
  }
  function handPose(ch, side, kind) {
    for (const name of ["Open", "Fist", "Point"])
      ch["hand" + side + name] = {
        opacity: name.toLowerCase() === kind ? 1 : 0,
      };
  }
  function actionPose(name, u, cycles = 1) {
    const c = {},
      sin = Math.sin(u * Math.PI * 2 * cycles),
      rise = Math.sin(u * Math.PI),
      r = (j, v) => (c[j] = { rotation: v });
    if (name === "blink") {
      c.eyeL = { scaleY: Math.max(0.05, 1 - rise) };
      c.eyeR = { scaleY: Math.max(0.05, 1 - rise) };
    }
    if (["idle", "breathe", "talk"].includes(name)) {
      c.torso = {
        scaleY: 1 + 0.018 * (1 - Math.cos(u * Math.PI * 2 * cycles)),
      };
      r("neck", sin * 2);
    }
    if (["walk", "run"].includes(name)) {
      const amp = name === "run" ? 35 : 20;
      r("hipL", sin * amp);
      r("hipR", -sin * amp);
      r("kneeL", Math.max(0, -sin) * 55);
      r("kneeR", Math.max(0, sin) * 55);
      r("ankleL", -Math.max(0, -sin) * 30);
      r("ankleR", -Math.max(0, sin) * 30);
      r("shoulderL", -sin * amp);
      r("shoulderR", sin * amp);
      r("elbowL", -18 - Math.max(0, sin) * 25);
      r("elbowR", 18 + Math.max(0, -sin) * 25);
      c.pelvis = { y: -Math.abs(sin) * (name === "run" ? 9 : 3) };
      r("torso", name === "run" ? 8 : 0);
    }
    if (name === "wave") {
      r("shoulderR", -115);
      r("elbowR", -35 - sin * 18);
      r("wristR", sin * 22);
      handPose(c, "R", "open");
    }
    if (name === "talk") {
      r("shoulderR", -25 - rise * 20);
      r("elbowR", -45 - rise * 25);
      r("wristR", sin * 8);
      c.mouth = { scaleY: 1 + 1.8 * Math.abs(sin) };
    }
    if (name === "nod") r("neck", rise * 15);
    if (["point", "reach"].includes(name)) {
      r("shoulderR", -85 * rise);
      r("elbowR", -12 * rise);
      r("wristR", -5 * rise);
      handPose(c, "R", name === "point" ? "point" : "open");
    }
    if (["carry", "push"].includes(name)) {
      r("shoulderL", 25);
      r("shoulderR", -25);
      r("elbowL", name === "push" ? -80 : -95);
      r("elbowR", name === "push" ? 80 : 95);
      r("wristL", name === "push" ? -35 : 0);
      r("wristR", name === "push" ? 35 : 0);
      handPose(c, "L", "fist");
      handPose(c, "R", "fist");
      if (name === "push") r("torso", 10 * rise);
    }
    if (["sit", "stand-up", "crouch", "kneel"].includes(name)) {
      const f = name === "stand-up" ? 1 - u : 1;
      c.pelvis = { y: (name === "crouch" ? 43 : 34) * f };
      r("hipL", (name === "crouch" ? 65 : 70) * f);
      r("hipR", (name === "crouch" ? -65 : -70) * f);
      r("kneeL", (name === "crouch" ? -110 : -70) * f);
      r("kneeR", (name === "kneel" ? 140 : name === "crouch" ? 110 : 70) * f);
      r("ankleL", -10 * f);
      r("ankleR", 10 * f);
      r("torso", name === "crouch" ? 12 * f : 0);
    }
    if (name === "jump") {
      c.root = { y: -60 * rise };
      r("hipL", -20 * rise);
      r("hipR", 20 * rise);
      r("kneeL", 35 * rise);
      r("kneeR", -35 * rise);
      r("shoulderL", 140 * rise);
      r("shoulderR", -140 * rise);
    }
    if (name === "celebrate") {
      r("shoulderL", 150);
      r("shoulderR", -150);
      r("elbowL", sin * 20);
      r("elbowR", -sin * 20);
      c.root = { y: -Math.abs(sin) * 8 };
    }
    if (name === "sad") {
      r("neck", 18);
      r("torso", 8);
      r("shoulderL", -12);
      r("shoulderR", 12);
      r("browL", -20);
      r("browR", 20);
    }
    if (name === "bow") {
      r("pelvis", 12 * rise);
      r("torso", 22 * rise);
      r("neck", 15 * rise);
    }
    return pose(c, name);
  }
  function makeClip(action, duration = 2) {
    if (!actions.includes(action)) throw Error("Unknown puppet action");
    if (!Number.isFinite(duration) || duration <= 0 || duration > 30)
      throw Error("Clip duration must be >0 and <=30 seconds");
    const count = Math.ceil(duration * 24),
      cycles = Math.max(
        1,
        Math.round(
          duration * (action === "run" ? 1.8 : action === "walk" ? 1.1 : 0.75),
        ),
      );
    return {
      format: "jet2d-puppet-clip",
      version: 1,
      rig: VERSION,
      name: action,
      duration,
      frames: Array.from({ length: count + 1 }, (_, i) => ({
        at: i / count,
        pose: actionFactories.has(action)
          ? actionFactories.get(action)(i / count, cycles)
          : actionPose(action, i / count, cycles),
      })),
    };
  }
  function applyClip(r, clip, start = 0) {
    requireRig(r);
    if (
      clip?.format !== "jet2d-puppet-clip" ||
      clip.version !== 1 ||
      clip.rig !== VERSION ||
      !Number.isFinite(clip.duration) ||
      clip.duration <= 0 ||
      clip.duration > 30 ||
      !Array.isArray(clip.frames) ||
      clip.frames.length < 2 ||
      clip.frames.length > 1000
    )
      throw Error("Invalid puppet clip");
    if (!Number.isFinite(start) || start < 0 || start + clip.duration > 3600)
      throw Error("Invalid clip interval");
    let prev = -1;
    for (const f of clip.frames) {
      if (!Number.isFinite(f.at) || f.at < 0 || f.at > 1 || f.at <= prev)
        throw Error("Clip frame times must increase from 0 to 1");
      prev = f.at;
      validatePose(f.pose, r);
    }
    if (clip.frames[0].at !== 0 || prev !== 1)
      throw Error("Clip must include endpoints");
    if (
      r.puppet.clips.some(
        (c) => start < c.end - 1e-7 && start + clip.duration > c.start + 1e-7,
      )
    )
      throw Error(
        "Clip overlaps existing animation. Clear puppet animation or choose another interval.",
      );
    // All validation finishes before any mutation.
    for (const name of r.puppet.joints) {
      const n = joint(r, name);
      const before = S.sample(
        { ...S.defaults, ...n.pose },
        n.keys,
        Math.max(0, start - 1e-5),
      );
      n.keys = n.keys.filter(
        (k) => k.t < start - 1e-7 || k.t > start + clip.duration + 1e-7,
      );
      if (start > 0) {
        const guardTime = Math.max(0, start - 1e-5);
        n.keys = n.keys.filter((k) => Math.abs(k.t - guardTime) > 1e-8);
        n.keys.push({ t: guardTime, ...before, ease: "hold" });
        if (!n.keys.some((k) => k.t === 0))
          n.keys.push({ t: 0, ...n.pose, ease: "hold" });
      }
      for (const f of clip.frames)
        n.keys.push({
          t: start + f.at * clip.duration,
          ...absolute(n, f.pose.channels[name]),
          ease: "linear",
        });
      n.keys.sort((a, b) => a.t - b.t);
    }
    r.puppet.clips.push({ start, end: start + clip.duration, name: clip.name });
    return r;
  }
  function clearAnimation(r) {
    requireRig(r);
    for (const name of r.puppet.joints) {
      const n = joint(r, name);
      n.keys = [];
      n.pose = copy(n.bindPose);
    }
    r.puppet.clips = [];
    return r;
  }
  function replaceArtwork(r, name, nodes, offset = { x: 0, y: 0 }) {
    requireRig(r);
    const target = joint(r, name);
    if (!Array.isArray(nodes) || !nodes.length)
      throw Error("Artwork needs SVG nodes");
    if (!Number.isFinite(offset.x) || !Number.isFinite(offset.y))
      throw Error("Invalid artwork offset");
    const artwork = copy(nodes);
    let serial = 0;
    S.walk(artwork, (n) => {
      if (n.puppetJoint || n.puppet || n.owners?.length || n.keys?.length)
        throw Error("Artwork must be static; keep skeletal joints separate");
      n.id = r.id + "_skin_" + name + "_" + serial++;
    });
    const wrapper = {
      id: r.id + "_skin_" + name,
      tag: "g",
      attrs: {},
      pose: { ...S.defaults, x: offset.x, y: offset.y },
      keys: [],
      children: artwork,
    };
    const test = S.blank();
    test.scenes[0].nodes = [wrapper];
    S.validate(test);
    target.children = [
      wrapper,
      ...target.children.filter((n) => n.puppetJoint),
    ];
    return r;
  }
  const api = {
    create,
    joint,
    restyle,
    replaceArtwork,
    pose,
    applyPose,
    capturePose,
    makeClip,
    applyClip,
    clearAnimation,
    actions,
    actionInfo,
    registerAction,
    styleDefaults,
    rigVersion: VERSION,
  };
  root.StudioPuppet2D = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
