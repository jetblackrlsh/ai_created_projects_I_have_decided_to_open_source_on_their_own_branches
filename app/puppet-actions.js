/* Original phase-based action library for the articulated front-view puppet. */
(function (root) {
  "use strict";
  const P =
      root.StudioPuppet2D ||
      (typeof require === "function" ? require("./puppet.js") : null),
    S =
      root.Studio ||
      (typeof require === "function" ? require("./core.js") : null);
  const clone = S.clone,
    extras = [];
  function channels(values = {}) {
    const out = {};
    for (const [k, v] of Object.entries(values))
      out[k] = typeof v === "number" ? { rotation: v } : clone(v);
    return out;
  }
  function hands(c, side, shape) {
    for (const k of ["Open", "Fist", "Point"])
      c["hand" + side + k] = { opacity: k.toLowerCase() === shape ? 1 : 0 };
  }
  function mix(a, b, u) {
    const out = {},
      smooth = u * u * (3 - 2 * u);
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      out[key] = {};
      for (const prop of new Set([
        ...Object.keys(a[key] || {}),
        ...Object.keys(b[key] || {}),
      ])) {
        let fallback = ["scaleX", "scaleY", "opacity"].includes(prop) ? 1 : 0;
        if (prop === "opacity" && /hand.*(Fist|Point)/.test(key)) fallback = 0;
        const x = a[key]?.[prop] ?? fallback,
          y = b[key]?.[prop] ?? fallback;
        out[key][prop] = x + (y - x) * smooth;
      }
    }
    return out;
  }
  function evaluate(frames, u) {
    if (u <= frames[0].at) return clone(frames[0].pose);
    for (let i = 1; i < frames.length; i++)
      if (u <= frames[i].at)
        return mix(
          frames[i - 1].pose,
          frames[i].pose,
          (u - frames[i - 1].at) / (frames[i].at - frames[i - 1].at),
        );
    return clone(frames.at(-1).pose);
  }
  const guard = {
    shoulderL: 25,
    elbowL: -125,
    wristL: 10,
    shoulderR: -15,
    elbowR: -135,
    wristR: 0,
    hipL: 10,
    hipR: -10,
    kneeL: -8,
    kneeR: 8,
    browL: 12,
    browR: -12,
  };
  function add(
    name,
    category,
    label,
    wind,
    hit,
    {
      settle = {},
      prop = null,
      side = "R",
      shape = "fist",
      peak = 0.42,
      hold = 0.54,
      loop = false,
      notes = "",
    } = {},
  ) {
    const frames = [
      { at: 0, pose: channels({}) },
      { at: 0.22, pose: channels(wind) },
      { at: peak, pose: channels(hit) },
      { at: hold, pose: channels(hit) },
      { at: 0.8, pose: channels(settle) },
      { at: 1, pose: channels({}) },
    ];
    const info = { category, label, prop, side, peak, notes, loop };
    extras.push(name);
    P.registerAction(
      name,
      (u, cycles) => {
        const c = evaluate(frames, u);
        if (shape) {
          hands(c, "L", shape);
          hands(c, "R", shape);
        }
        if (loop && u > 0.22 && u < 0.8) {
          const pulse = Math.sin(((u - 0.22) / 0.58) * Math.PI * 2 * cycles),
            env = Math.sin(((u - 0.22) / 0.58) * Math.PI);
          if (c.torso)
            c.torso.rotation = (c.torso.rotation || 0) + pulse * env * 2;
          if (c.wristR)
            c.wristR.rotation = (c.wristR.rotation || 0) + pulse * env * 5;
        }
        return P.pose(c, label);
      },
      info,
    );
  }
  add(
    "punch-jab",
    "Combat",
    "Punch · jab",
    { ...guard, torso: -6 },
    {
      ...guard,
      shoulderR: -90,
      elbowR: 0,
      wristR: 0,
      torso: 6,
      root: { x: 8 },
    },
    { settle: guard, peak: 0.34, hold: 0.4 },
  );
  add(
    "punch-cross",
    "Combat",
    "Punch · cross",
    { ...guard, torso: -15, shoulderR: 15 },
    {
      ...guard,
      shoulderR: -75,
      elbowR: -15,
      torso: 18,
      pelvis: 5,
      root: { x: 15 },
    },
    { settle: guard, peak: 0.4, hold: 0.46 },
  );
  add(
    "punch-uppercut",
    "Combat",
    "Punch · uppercut",
    { ...guard, torso: 12, pelvis: { y: 12 }, shoulderR: 10, elbowR: -130 },
    {
      ...guard,
      shoulderR: -155,
      elbowR: -15,
      wristR: -10,
      torso: -8,
      pelvis: { y: -5 },
    },
    { settle: guard, peak: 0.43, hold: 0.52 },
  );
  add(
    "kick-front",
    "Combat",
    "Kick · forward diagonal",
    { ...guard, hipR: -40, kneeR: 95, ankleR: -35, torso: -8 },
    { ...guard, hipR: -65, kneeR: 0, ankleR: -25, torso: -12, pelvis: -5 },
    {
      settle: guard,
      peak: 0.44,
      hold: 0.5,
      notes: "Stylized diagonal kick; not a depth-facing camera kick.",
    },
  );
  add(
    "kick-side",
    "Combat",
    "Kick · side",
    { ...guard, hipR: -50, kneeR: 110, torso: -12 },
    {
      ...guard,
      hipR: -95,
      kneeR: 5,
      ankleR: -5,
      torso: -20,
      pelvis: -8,
      root: { x: 5 },
    },
    { settle: guard, peak: 0.44, hold: 0.54 },
  );
  add(
    "weapon-slash",
    "Combat",
    "Weapon · diagonal slash",
    { ...guard, shoulderR: -155, elbowR: -25, wristR: -10, torso: -12 },
    { ...guard, shoulderR: -60, elbowR: 30, wristR: 70, torso: 15 },
    {
      settle: { ...guard, shoulderR: -25, elbowR: -20, wristR: 20 },
      prop: "sword",
      peak: 0.4,
      hold: 0.46,
    },
  );
  add(
    "weapon-overhead",
    "Combat",
    "Weapon · overhead swing",
    {
      shoulderL: 135,
      elbowL: 15,
      shoulderR: -155,
      elbowR: 5,
      wristR: -25,
      torso: -10,
    },
    {
      shoulderL: 25,
      elbowL: -80,
      shoulderR: -55,
      elbowR: 20,
      wristR: 40,
      torso: 18,
      pelvis: { y: 8 },
    },
    { prop: "sword", peak: 0.45, hold: 0.52 },
  );
  add(
    "shoot-pistol",
    "Combat",
    "Shoot · pistol",
    { ...guard, shoulderR: -90, elbowR: 0, wristR: 0 },
    {
      ...guard,
      shoulderR: -98,
      elbowR: -7,
      wristR: -10,
      torso: -6,
      root: { x: -3 },
    },
    {
      settle: { ...guard, shoulderR: -90, elbowR: 0, wristR: 0 },
      prop: "pistol",
      peak: 0.38,
      hold: 0.42,
    },
  );
  add(
    "shoot-rifle",
    "Combat",
    "Shoot · two-hand long gun",
    {
      shoulderL: -90,
      elbowL: 0,
      wristL: 0,
      shoulderR: -53,
      elbowR: -66,
      neck: -5,
      torso: 3,
    },
    {
      shoulderL: -94,
      elbowL: -4,
      wristL: -4,
      shoulderR: -75,
      elbowR: -65,
      neck: -8,
      torso: -6,
      root: { x: -5 },
    },
    {
      settle: { shoulderL: -90, elbowL: 0, shoulderR: -53, elbowR: -66 },
      prop: "rifle",
      side: "L",
      peak: 0.38,
      hold: 0.42,
    },
  );
  add(
    "block-high",
    "Combat",
    "Block · high guard",
    { ...guard, shoulderL: 60, elbowL: -115 },
    {
      ...guard,
      shoulderL: 135,
      elbowL: 45,
      wristL: 25,
      shoulderR: -70,
      elbowR: -100,
      neck: 12,
      pelvis: { y: 12 },
      torso: -7,
    },
    { prop: "shield", side: "L", peak: 0.38, hold: 0.68 },
  );
  add(
    "block-low",
    "Combat",
    "Block · low guard",
    { ...guard, pelvis: { y: 10 } },
    {
      ...guard,
      shoulderL: 35,
      elbowL: -70,
      wristL: -10,
      hipL: 45,
      hipR: -45,
      kneeL: -65,
      kneeR: 65,
      pelvis: { y: 24 },
      torso: 10,
    },
    { prop: "shield", side: "L", peak: 0.38, hold: 0.68 },
  );
  add(
    "hit-recoil",
    "Combat",
    "Hit reaction · recoil",
    { neck: -3 },
    {
      torso: -24,
      neck: -17,
      head: 9,
      shoulderL: 55,
      elbowL: -25,
      shoulderR: -65,
      elbowR: 30,
      pelvis: -8,
      root: { x: -14 },
      eyeL: { scaleY: 0.35 },
      eyeR: { scaleY: 0.35 },
      mouth: { scaleY: 2 },
    },
    {
      settle: { torso: 10, neck: 14, shoulderR: 15, elbowR: -110 },
      shape: "open",
      peak: 0.3,
      hold: 0.37,
    },
  );
  add(
    "knockback",
    "Combat",
    "Hit reaction · stagger back",
    { ...guard },
    {
      torso: -28,
      pelvis: -12,
      neck: 15,
      hipL: 20,
      hipR: -35,
      kneeR: 55,
      shoulderL: 70,
      shoulderR: -95,
      root: { x: -35, y: -5 },
      mouth: { scaleY: 2.5 },
    },
    {
      settle: {
        torso: 15,
        pelvis: { y: 12 },
        hipL: 15,
        hipR: -20,
        kneeL: -20,
        kneeR: 25,
      },
      shape: "open",
      peak: 0.32,
      hold: 0.45,
    },
  );
  add(
    "dodge",
    "Combat",
    "Dodge · lean and duck",
    { ...guard },
    {
      ...guard,
      torso: -35,
      pelvis: { y: 25, rotation: -10 },
      neck: 20,
      hipL: 30,
      hipR: -20,
      kneeL: -45,
      kneeR: 35,
      root: { x: -20 },
    },
    { settle: guard, peak: 0.4, hold: 0.62 },
  );
  add(
    "cast-projectile",
    "Powers",
    "Power · project or cast",
    { shoulderL: 25, elbowL: -100, shoulderR: 15, elbowR: -130, torso: -10 },
    {
      shoulderL: 20,
      elbowL: -75,
      shoulderR: -90,
      elbowR: 0,
      wristR: 0,
      torso: 10,
      browL: 12,
      browR: -12,
    },
    { shape: "open", prop: "energy-orb", peak: 0.43, hold: 0.58 },
  );
  add(
    "cast-area",
    "Powers",
    "Power · wide area release",
    { shoulderL: -15, elbowL: -120, shoulderR: 15, elbowR: 120, neck: 10 },
    {
      shoulderL: 100,
      elbowL: -15,
      shoulderR: -100,
      elbowR: 15,
      wristL: 25,
      wristR: -25,
      neck: -12,
      torso: { scaleY: 1.025 },
    },
    { shape: "open", prop: "aura", peak: 0.5, hold: 0.72 },
  );
  add(
    "channel-power",
    "Powers",
    "Power · sustained channel",
    { shoulderL: 20, elbowL: -90, shoulderR: -20, elbowR: 90 },
    {
      shoulderL: 65,
      elbowL: -25,
      shoulderR: -65,
      elbowR: 25,
      wristR: 5,
      torso: 0,
      browL: 10,
      browR: -10,
    },
    { shape: "open", prop: "energy-orb", peak: 0.38, hold: 0.72, loop: true },
  );
  add(
    "charge-release",
    "Powers",
    "Power · charge then release",
    {
      shoulderL: -10,
      elbowL: -120,
      shoulderR: 10,
      elbowR: 120,
      pelvis: { y: 12 },
      neck: 12,
    },
    {
      shoulderL: 95,
      elbowL: 0,
      shoulderR: -95,
      elbowR: 0,
      pelvis: { y: -5 },
      neck: -14,
      torso: -6,
      root: { y: -12 },
    },
    { shape: "open", prop: "aura", peak: 0.62, hold: 0.68 },
  );
  add(
    "shield-power",
    "Powers",
    "Power · protective barrier",
    { shoulderL: 20, elbowL: -90, shoulderR: -20, elbowR: 90 },
    {
      shoulderL: 55,
      elbowL: -30,
      shoulderR: -55,
      elbowR: 30,
      wristL: -15,
      wristR: 15,
      pelvis: { y: 8 },
      torso: 4,
    },
    { shape: "open", prop: "barrier", peak: 0.4, hold: 0.72 },
  );
  add(
    "telekinesis",
    "Powers",
    "Power · telekinetic control",
    { neck: 8, shoulderR: -20, elbowR: -80 },
    {
      shoulderR: -80,
      elbowR: -20,
      wristR: 20,
      shoulderL: 40,
      elbowL: -50,
      neck: -5,
      torso: -3,
      browL: 12,
      browR: -12,
    },
    { shape: "open", prop: "energy-orb", peak: 0.4, hold: 0.72, loop: true },
  );
  add(
    "heal",
    "Powers",
    "Power · healing or blessing",
    { neck: 12, shoulderL: 15, elbowL: -80, shoulderR: -15, elbowR: 80 },
    {
      neck: 8,
      shoulderL: 25,
      elbowL: -105,
      shoulderR: -25,
      elbowR: 105,
      wristR: 10,
      torso: 4,
      eyeL: { scaleY: 0.6 },
      eyeR: { scaleY: 0.6 },
    },
    { shape: "open", prop: "energy-orb", peak: 0.42, hold: 0.74, loop: true },
  );
  add(
    "transform",
    "Powers",
    "Power · transformation pose",
    {
      pelvis: { y: 15 },
      torso: 12,
      neck: 15,
      shoulderL: 10,
      elbowL: -110,
      shoulderR: -10,
      elbowR: 110,
    },
    {
      root: { y: -15 },
      shoulderL: 135,
      shoulderR: -135,
      elbowL: 5,
      elbowR: -5,
      neck: -15,
      torso: { scaleY: 1.04 },
    },
    {
      shape: "open",
      prop: "aura",
      peak: 0.55,
      hold: 0.7,
      notes: "Pose/effect only; does not replace character artwork.",
    },
  );
  // Emotions combine posture, head, shoulders, eyebrows, eyes and mouth.
  add(
    "happy",
    "Emotions",
    "Happy · open welcome",
    { neck: -3 },
    {
      shoulderL: 45,
      elbowL: -35,
      shoulderR: -45,
      elbowR: 35,
      neck: -6,
      mouth: { scaleX: 1.5, scaleY: 1.8 },
      browL: -8,
      browR: 8,
    },
    { shape: "open", peak: 0.42, hold: 0.7 },
  );
  add(
    "laugh",
    "Emotions",
    "Laugh · chuckle",
    { neck: 3 },
    {
      torso: 5,
      neck: -10,
      shoulderL: 10,
      elbowL: -85,
      shoulderR: -10,
      elbowR: 85,
      mouth: { scaleX: 1.4, scaleY: 3 },
      eyeL: { scaleY: 0.3 },
      eyeR: { scaleY: 0.3 },
      wristR: 0,
    },
    { shape: "open", peak: 0.38, hold: 0.74, loop: true },
  );
  add(
    "angry",
    "Emotions",
    "Angry · tense stance",
    { browL: 8, browR: -8 },
    {
      shoulderL: 18,
      shoulderR: -18,
      elbowL: -30,
      elbowR: 30,
      torso: 8,
      neck: 8,
      browL: 25,
      browR: -25,
      eyeL: { scaleY: 0.65 },
      eyeR: { scaleY: 0.65 },
      mouth: { scaleX: 1.3, scaleY: 0.45 },
    },
    { peak: 0.4, hold: 0.72 },
  );
  add(
    "furious",
    "Emotions",
    "Furious · frustrated outburst",
    { torso: 8, neck: 12, shoulderL: 10, shoulderR: -10 },
    {
      shoulderL: 75,
      elbowL: -105,
      shoulderR: -75,
      elbowR: 105,
      torso: -8,
      neck: -12,
      browL: 30,
      browR: -30,
      mouth: { scaleY: 3.5 },
      wristR: 0,
    },
    { peak: 0.43, hold: 0.7, loop: true },
  );
  add(
    "afraid",
    "Emotions",
    "Afraid · withdraw",
    { neck: -5 },
    {
      torso: -13,
      neck: 15,
      shoulderL: -8,
      elbowL: -135,
      shoulderR: 8,
      elbowR: 135,
      root: { x: -8 },
      browL: -25,
      browR: 25,
      eyeL: { scaleY: 1.4 },
      eyeR: { scaleY: 1.4 },
      mouth: { scaleX: 0.65, scaleY: 3 },
    },
    { shape: "open", peak: 0.4, hold: 0.72 },
  );
  add(
    "panic",
    "Emotions",
    "Panic · alarmed flail",
    { ...guard },
    {
      shoulderL: 125,
      elbowL: -30,
      shoulderR: -125,
      elbowR: 30,
      neck: -8,
      torso: 8,
      wristR: 15,
      browL: -25,
      browR: 25,
      mouth: { scaleY: 4 },
      root: { y: -6 },
    },
    { shape: "open", peak: 0.35, hold: 0.74, loop: true },
  );
  add(
    "surprised",
    "Emotions",
    "Surprised · double take",
    { neck: 4 },
    {
      neck: -15,
      head: 8,
      shoulderL: 35,
      elbowL: -105,
      shoulderR: -35,
      elbowR: 105,
      browL: { y: -5 },
      browR: { y: -5 },
      eyeL: { scaleY: 1.5 },
      eyeR: { scaleY: 1.5 },
      mouth: { scaleX: 0.75, scaleY: 4 },
      root: { y: -4 },
    },
    { shape: "open", peak: 0.3, hold: 0.57 },
  );
  add(
    "confused",
    "Emotions",
    "Confused · uncertain shrug",
    { neck: -8 },
    {
      neck: 14,
      head: -5,
      shoulderL: 45,
      elbowL: -100,
      shoulderR: -35,
      elbowR: 95,
      wristL: 35,
      wristR: -35,
      browL: -18,
      browR: 15,
      mouth: { scaleX: 0.7, rotation: -10 },
    },
    { shape: "open", peak: 0.43, hold: 0.72 },
  );
  add(
    "curious",
    "Emotions",
    "Curious · lean in",
    { neck: -5 },
    {
      torso: 9,
      neck: 12,
      head: -9,
      shoulderR: 15,
      elbowR: -150,
      wristR: -10,
      browL: { y: -3 },
      browR: { y: -3 },
      mouth: { scaleX: 0.7 },
    },
    { shape: "open", peak: 0.45, hold: 0.72 },
  );
  add(
    "disgusted",
    "Emotions",
    "Disgusted · recoil away",
    { neck: 3 },
    {
      torso: -15,
      neck: -10,
      head: -12,
      shoulderR: -60,
      elbowR: -20,
      wristR: 15,
      browL: 20,
      browR: -8,
      eyeL: { scaleY: 0.55 },
      eyeR: { scaleY: 0.8 },
      mouth: { scaleX: 0.8, rotation: 15 },
      root: { x: -7 },
    },
    { shape: "open", peak: 0.37, hold: 0.7 },
  );
  add(
    "embarrassed",
    "Emotions",
    "Embarrassed · hide face",
    { neck: 12 },
    {
      torso: 7,
      neck: 18,
      head: -10,
      shoulderL: -10,
      elbowL: -160,
      wristL: -5,
      shoulderR: 8,
      elbowR: 145,
      browL: -15,
      browR: 15,
      eyeL: { scaleY: 0.5 },
      eyeR: { scaleY: 0.5 },
      mouth: { scaleX: 0.7 },
    },
    { shape: "open", peak: 0.46, hold: 0.72 },
  );
  add(
    "proud",
    "Emotions",
    "Proud · confident stance",
    { neck: -5 },
    {
      torso: -5,
      neck: -10,
      shoulderL: 25,
      elbowL: -95,
      shoulderR: -25,
      elbowR: 95,
      pelvis: 3,
      browL: -5,
      browR: 5,
      mouth: { scaleX: 1.3 },
    },
    { peak: 0.45, hold: 0.75 },
  );
  add(
    "crying",
    "Emotions",
    "Crying · wipe eyes",
    { torso: 8, neck: 15 },
    {
      torso: 12,
      neck: 18,
      shoulderR: 5,
      elbowR: 155,
      wristR: -10,
      shoulderL: -5,
      elbowL: -115,
      browL: -25,
      browR: 25,
      eyeL: { scaleY: 0.25 },
      eyeR: { scaleY: 0.25 },
      mouth: { scaleY: 2, scaleX: 0.8 },
    },
    {
      shape: "open",
      peak: 0.4,
      hold: 0.75,
      loop: true,
      notes: "Body/face performance, not simulated tears.",
    },
  );
  add(
    "relieved",
    "Emotions",
    "Relieved · exhale",
    { torso: -3, shoulderL: 25, shoulderR: -25, neck: -7 },
    {
      torso: 5,
      neck: 8,
      shoulderL: 3,
      shoulderR: -3,
      elbowL: -15,
      elbowR: 15,
      eyeL: { scaleY: 0.5 },
      eyeR: { scaleY: 0.5 },
      mouth: { scaleY: 1.5 },
      pelvis: { y: 4 },
    },
    { shape: "open", peak: 0.55, hold: 0.72 },
  );
  add(
    "determined",
    "Emotions",
    "Determined · resolve",
    { neck: 10 },
    {
      ...guard,
      torso: 5,
      neck: 0,
      browL: 18,
      browR: -18,
      mouth: { scaleY: 0.5 },
      shoulderR: -35,
      elbowR: -90,
    },
    { peak: 0.45, hold: 0.75 },
  );
  add(
    "tired",
    "Emotions",
    "Tired · slump",
    { neck: 8 },
    {
      torso: 15,
      neck: 22,
      shoulderL: 8,
      shoulderR: -8,
      elbowL: -12,
      elbowR: 12,
      eyeL: { scaleY: 0.3 },
      eyeR: { scaleY: 0.3 },
      mouth: { scaleY: 2 },
      pelvis: { y: 5 },
    },
    { shape: "open", peak: 0.55, hold: 0.78 },
  );
  const originalMakeClip = P.makeClip;
  P.makeClip = function (action, duration = 2, options) {
    const clip = originalMakeClip(action, duration);
    if (options === undefined) return clip;
    const intensity = options.intensity ?? 1,
      mirror = options.mirror ?? false;
    if (
      !Number.isFinite(intensity) ||
      intensity < 0.25 ||
      intensity > 1.5 ||
      typeof mirror !== "boolean"
    )
      throw Error("Intensity must be 0.25–1.5; mirror must be boolean");
    for (const frame of clip.frames) {
      const mapped = {};
      for (const [name, values] of Object.entries(frame.pose.channels)) {
        let target = name;
        if (mirror)
          target = name.replace(/L$|R$|(?<=hand)L|(?<=hand)R/g, (v) =>
            v === "L" ? "R" : "L",
          );
        mapped[target] = {};
        for (const [k, v] of Object.entries(values))
          mapped[target][k] =
            k === "opacity"
              ? v
              : k === "scaleX" || k === "scaleY"
                ? 1 + (v - 1) * intensity
                : v *
                  intensity *
                  (mirror && (k === "x" || k === "rotation") ? -1 : 1);
      }
      frame.pose.channels = mapped;
    }
    clip.options = { intensity, mirror };
    return clip;
  };
  P.addActionProp = function (rig, clip, start = 0) {
    if (rig?.puppet?.rig !== P.rigVersion)
      throw Error("Select an articulated puppet");
    const info = P.actionInfo[clip.name],
      kind = info?.prop;
    if (!kind) return false;
    if (
      !Number.isFinite(start) ||
      start < 0 ||
      !Number.isFinite(clip.duration) ||
      clip.duration <= 0
    )
      throw Error("Invalid accessory interval");
    let side = info.side || "R";
    if (clip.options?.mirror) side = side === "R" ? "L" : "R";
    if (
      kind !== "aura" &&
      P.joint(rig, "wrist" + side).children.some(
        (n) => n.library?.role === "prop",
      )
    )
      throw Error(
        "This hand already holds a library prop. Disable the matching accessory or remove that prop first.",
      );
    const records = rig.puppet.accessories || [];
    if (
      records.some(
        (a) =>
          a.side === side &&
          a.start < start + clip.duration - 1e-7 &&
          a.end > start + 1e-7,
      )
    )
      throw Error("Preset prop overlaps another on this hand");
    let serial = 0;
    S.walk([rig], () => serial++);
    const prefix = rig.id + "_accessory_" + serial;
    let n = 0;
    const node = (tag, attrs = {}, children = []) => ({
      id: prefix + "_" + n++,
      tag,
      attrs,
      pose: { ...S.defaults },
      keys: [],
      children,
    });
    const rect = (x, y, width, height, fill) =>
      node("rect", {
        x,
        y,
        width,
        height,
        fill,
        rx: 3,
        stroke: "#243047",
        "stroke-width": 1.5,
      });
    const shapes = [],
      metal = "#b8cddd",
      dark = "#334559",
      gold = "#ffc85c",
      energy = clip.name === "heal" ? "#43d9ac" : "#a47aff";
    if (kind === "sword") {
      shapes.push(
        rect(-4, 0, 8, 19, "#855f40"),
        rect(-15, 16, 30, 6, gold),
        node("path", {
          d: "M-5 22 L-5 85 L0 102 L5 85 L5 22 Z",
          fill: metal,
          stroke: dark,
          "stroke-width": 1.5,
        }),
      );
    }
    if (kind === "pistol" || kind === "rifle") {
      shapes.push(
        rect(-4, 0, 8, 19, dark),
        rect(-9, 14, 18, kind === "rifle" ? 64 : 28, dark),
      );
      if (kind === "rifle")
        shapes.push(
          rect(-8, -28, 16, 30, "#736657"),
          rect(6, 25, 13, 20, dark),
        );
      const muzzle = kind === "rifle" ? 80 : 44,
        flash = node("path", {
          d: `M0 ${muzzle} L-12 ${muzzle + 12} L-4 ${muzzle + 14} L0 ${muzzle + 29} L5 ${muzzle + 15} L13 ${muzzle + 11} Z`,
          fill: gold,
        });
      flash.pose.opacity = 0;
      flash.keys = [
        { t: start, opacity: 0, ease: "hold" },
        {
          t: start + clip.duration * (info.peak - 0.015),
          opacity: 1,
          ease: "hold",
        },
        {
          t: start + clip.duration * (info.peak + 0.04),
          opacity: 0,
          ease: "hold",
        },
      ];
      shapes.push(flash);
    }
    if (kind === "shield")
      shapes.push(
        node("ellipse", {
          cx: 0,
          cy: 20,
          rx: 29,
          ry: 38,
          fill: "#6386ab",
          stroke: metal,
          "stroke-width": 5,
        }),
        node("ellipse", { cx: 0, cy: 20, rx: 8, ry: 10, fill: metal }),
      );
    const fx = ["energy-orb", "aura", "barrier"].includes(kind);
    if (fx) {
      const radius = kind === "aura" ? 130 : kind === "barrier" ? 75 : 24,
        cy = kind === "aura" ? -140 : kind === "barrier" ? 25 : 38;
      shapes.push(
        node("circle", {
          cx: 0,
          cy,
          r: radius,
          fill: energy,
          "fill-opacity": 0.12,
          stroke: energy,
          "stroke-width": 4,
        }),
        node("circle", {
          cx: 0,
          cy,
          r: radius * 0.7,
          fill: "none",
          stroke: energy,
          "stroke-width": 2,
        }),
      );
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        shapes.push(
          node("circle", {
            cx: Math.cos(a) * radius,
            cy: cy + Math.sin(a) * radius,
            r: 3,
            fill: "#f0e4ff",
          }),
        );
      }
    }
    const group = node("g", {}, shapes);
    group.puppetAccessory = { kind, action: clip.name, side };
    group.pose.opacity = 0;
    group.keys = [
      { t: start, opacity: fx ? 0 : 1, ease: fx ? "smooth" : "hold" },
      ...(fx
        ? [
            {
              t: start + clip.duration * 0.22,
              opacity: 0.45,
              scaleX: 0.65,
              scaleY: 0.65,
              ease: "smooth",
            },
            {
              t: start + clip.duration * info.peak,
              opacity: 1,
              scaleX: 1.1,
              scaleY: 1.1,
              ease: "smooth",
            },
            {
              t: start + clip.duration * 0.8,
              opacity: 0.65,
              scaleX: 1,
              scaleY: 1,
              ease: "smooth",
            },
          ]
        : []),
      { t: start + clip.duration, opacity: 0, ease: "hold" },
    ];
    if (start > 0) group.keys.unshift({ t: 0, opacity: 0, ease: "hold" });
    if (kind === "aura") rig.children.unshift(group);
    else if (kind === "shield")
      P.joint(rig, "wrist" + side).children.push(group);
    else P.joint(rig, "wrist" + side).children.unshift(group);
    rig.puppet.accessories = [
      ...records,
      { side, start, end: start + clip.duration, kind },
    ];
    return group;
  };
  const originalClear = P.clearAnimation;
  P.clearAnimation = function (rig) {
    originalClear(rig);
    S.walk([rig], (n) => {
      n.children = (n.children || []).filter((c) => !c.puppetAccessory);
    });
    rig.puppet.accessories = [];
    return rig;
  };
  P.expandedActions = extras;
  if (typeof module !== "undefined") module.exports = P;
})(typeof window !== "undefined" ? window : globalThis);
