/* Deterministic transparent SVG overlays baked to editable keys, without external assets. */
(function (root) {
  "use strict";
  const S =
    root.Studio ||
    (typeof require === "function" ? require("./core.js") : null);
  const rows = [
    ["smoke-plume", "Rising smoke", "Atmosphere", "#98a8b5"],
    ["ground-fog", "Drifting fog", "Atmosphere", "#c6d5dc"],
    ["fire-flames", "Looping flames", "Elements", "#f28b43"],
    ["fireball-burst", "Cartoon explosion", "Impacts", "#efa34c"],
    ["debris-burst", "Debris burst", "Impacts", "#a18b77"],
    ["electric-arcs", "Electric arcs", "Magic and energy", "#83d6ee"],
    ["magic-particles", "Magic motes", "Magic and energy", "#b68aeb"],
    ["falling-snow", "Snowfall", "Weather", "#e8f3fa"],
    ["rain-streaks", "Rain", "Weather", "#9acbdf"],
    ["wind-gust", "Wind gusts", "Weather", "#d1e8e5"],
    ["dust-cloud", "Dust cloud", "Atmosphere", "#c7b493"],
    ["water-splash", "Water splash", "Elements", "#7ecbdc"],
    ["rising-bubbles", "Bubbles", "Elements", "#b1e0e8"],
    ["speed-lines", "Speed lines", "Impacts", "#e4d7b0"],
    ["impact-star", "Impact starburst", "Impacts", "#f2d073"],
    ["shockwave", "Shockwave ring", "Impacts", "#cee8e7"],
    ["confetti", "Confetti", "Celebration", "#d787c6"],
    ["falling-leaves", "Falling leaves", "Weather", "#c58b57"],
    ["floating-hearts", "Floating hearts", "Celebration", "#de7a9e"],
    ["embers", "Fire embers", "Elements", "#f3b55b"],
    ["energy-beam", "Energy beam", "Magic and energy", "#b1e8f0"],
    ["portal-swirl", "Portal swirl", "Magic and energy", "#b096ec"],
  ];
  const items = rows.map(([id, label, category, color]) => ({
    id,
    label,
    category,
    color,
  }));
  function build(
    kind,
    id,
    start = 0,
    duration = 2,
    x = 480,
    y = 270,
    options = {},
  ) {
    const item = items.find((a) => a.id === kind);
    if (!item) throw Error("Unknown overlay");
    const color = options.color || item.color,
      intensity = options.intensity ?? 1,
      scale = options.scale ?? 1,
      w = options.width ?? 960,
      h = options.height ?? 540;
    if (
      !/^[A-Za-z_][\w.-]*$/.test(id) ||
      !/^#[\da-f]{6}$/i.test(color) ||
      ![start, duration, x, y, intensity, scale, w, h].every(Number.isFinite) ||
      start < 0 ||
      duration < 0.1 ||
      duration > 30 ||
      start + duration > 3600 ||
      intensity < 0.25 ||
      intensity > 2 ||
      scale < 0.1 ||
      scale > 4 ||
      w < 1 ||
      h < 1 ||
      w > 10000 ||
      h > 10000
    )
      throw Error("Invalid effect timing, color, size or intensity");
    let serial = 0;
    const children = [],
      make = (tag, attrs) => {
        const n = {
          id: id + "_" + serial++,
          tag,
          attrs,
          pose: { ...S.defaults, opacity: 0 },
          keys: [],
          children: [],
        };
        children.push(n);
        return n;
      };
    const rand = (i, k) => {
      const v = Math.sin((i + 1) * 127.1 + k * 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    const count = Math.max(
        4,
        Math.round(
          (/snow|rain|confetti|leaves/.test(kind)
            ? 30
            : kind === "electric-arcs"
              ? 5
              : kind === "fire-flames"
                ? 8
                : 14) * intensity,
        ),
      ),
      frames = Math.max(3, Math.ceil(duration * 16));
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2,
        r = rand(i, 1),
        q = rand(i, 2),
        spread = kind === "ground-fog" ? 220 : 85;
      let n;
      if (kind === "rain-streaks")
        n = make("line", {
          x1: 0,
          y1: 0,
          x2: -5,
          y2: 22 + q * 15,
          stroke: color,
          "stroke-width": 1.5,
        });
      else if (kind === "electric-arcs")
        n = make("path", {
          d: `M-90 ${i * 14 - 35} L-45 ${-20 + i * 4} L-20 ${30 - i * 3} L20 ${-35 + i * 6} L35 ${15 - i * 4} L90 ${i * 14 - 35}`,
          fill: "none",
          stroke: color,
          "stroke-width": 2 + (i % 2),
          "stroke-linejoin": "round",
        });
      else if (kind === "fire-flames")
        n = make("path", {
          d: "M0 0 Q-26 -25 -9 -49 Q-6 -35 0 -75 Q35 -35 16 -12 Q11 -2 0 0 Z",
          fill: i % 3 === 0 ? "#ffe6a3" : color,
        });
      else if (kind === "fireball-burst" || kind === "impact-star")
        n = make("path", {
          d: "M0 -55 L10 -22 L38 -39 L25 -8 L60 0 L25 12 L40 42 L9 25 L0 60 L-12 25 L-42 41 L-25 8 L-60 0 L-25 -13 L-40 -40 L-10 -22 Z",
          fill: i % 3 === 0 ? "#fff0b4" : color,
        });
      else if (kind === "confetti" || kind === "debris-burst")
        n = make("rect", {
          x: -5,
          y: -3,
          width: 10 + q * 8,
          height: 6 + q * 4,
          fill:
            kind === "confetti"
              ? [color, "#f0cd74", "#84c1b8", "#8baad3"][i % 4]
              : color,
        });
      else if (kind === "falling-leaves")
        n = make("path", {
          d: "M-12 0 Q-1 -19 14 -8 Q15 11 -12 0 Z",
          fill: color,
          stroke: "#806144",
          "stroke-width": 1,
        });
      else if (kind === "floating-hearts")
        n = make("path", {
          d: "M0 10 C-30 -8 -8 -25 0 -12 C8 -25 30 -8 0 10 Z",
          fill: color,
        });
      else if (kind === "wind-gust")
        n = make("path", {
          d: "M-70 0 Q-25 -24 25 0 T100 0 M-40 19 Q10 2 80 20",
          fill: "none",
          stroke: color,
          "stroke-width": 2,
        });
      else if (kind === "speed-lines")
        n = make("line", {
          x1: Math.cos(a) * 80,
          y1: Math.sin(a) * 80,
          x2: Math.cos(a) * 180,
          y2: Math.sin(a) * 180,
          stroke: color,
          "stroke-width": 2 + q * 3,
        });
      else if (kind === "energy-beam")
        n = make("rect", {
          x: 0,
          y: -5,
          width: 280,
          height: 10,
          rx: 5,
          fill: i % 2 ? color : "#effcff",
        });
      else if (kind === "shockwave" || kind === "portal-swirl")
        n = make("ellipse", {
          cx: 0,
          cy: 0,
          rx: kind === "portal-swirl" ? 60 : 65,
          ry: kind === "portal-swirl" ? 90 : 35,
          fill: "none",
          stroke: color,
          "stroke-width": 2 + q * 2,
          "stroke-dasharray": kind === "portal-swirl" ? "22 12" : "1000 0",
        });
      else
        n = make("ellipse", {
          cx: 0,
          cy: 0,
          rx:
            kind === "ground-fog"
              ? 65
              : kind === "smoke-plume" || kind === "dust-cloud"
                ? 18 + q * 20
                : kind === "rising-bubbles"
                  ? 5 + q * 9
                  : 3 + q * 4,
          ry:
            kind === "ground-fog"
              ? 15
              : kind === "smoke-plume" || kind === "dust-cloud"
                ? 16 + q * 20
                : kind === "rising-bubbles"
                  ? 5 + q * 9
                  : 3 + q * 4,
          fill: kind === "rising-bubbles" ? "none" : color,
          stroke: kind === "rising-bubbles" ? color : "none",
          "stroke-width": 1.5,
        });
      for (let f = 0; f <= frames; f++) {
        const u = f / frames,
          phase = (u * (1 + duration * 0.55) + i / count) % 1,
          envelope = Math.sin(Math.PI * u),
          loopFade = Math.sin(Math.PI * phase);
        let px = 0,
          py = 0,
          s = 1,
          rot = 0,
          opacity = Math.max(0, envelope);
        if (/falling-snow|rain-streaks|confetti|falling-leaves/.test(kind)) {
          px =
            (r - 0.5) * w + Math.sin(u * 7 + i) * (/rain/.test(kind) ? 8 : 30);
          py = (phase - 0.5) * h;
          opacity = envelope * (0.35 + 0.65 * loopFade);
          rot =
            kind === "confetti" || kind === "falling-leaves"
              ? u * 540 + i * 17
              : 0;
        } else if (["smoke-plume", "ground-fog", "dust-cloud"].includes(kind)) {
          px = (r - 0.5) * spread + Math.sin(phase * 4 + i) * 25;
          py =
            kind === "ground-fog"
              ? (q - 0.5) * 55
              : -phase * (kind === "dust-cloud" ? 65 : 165);
          s = 0.3 + phase * 1.7;
          opacity = envelope * loopFade * 0.28;
        } else if (kind === "fire-flames") {
          px = (r - 0.5) * 75;
          py = 10;
          s = 0.5 + q * 0.5 + Math.sin(u * duration * 15 + i) * 0.15;
          rot = Math.sin(u * duration * 10 + i) * 8;
          opacity = envelope * (0.6 + 0.4 * loopFade);
        } else if (kind === "fireball-burst" || kind === "impact-star") {
          const burst = Math.min(1, u * 4);
          px = Math.cos(a) * u * 45;
          py = Math.sin(a) * u * 45;
          s = (0.1 + burst * (0.5 + q)) * (kind === "impact-star" ? 0.6 : 1);
          rot = i * 27 + u * 60;
          opacity = (Math.max(0, 1 - u) * Math.min(1, u * 15)) / (count * 0.18);
        } else if (kind === "debris-burst" || kind === "water-splash") {
          px = Math.cos(a) * u * (80 + q * 80);
          py = Math.sin(a) * u * (80 + q * 80) + u * u * 95;
          s = 1 - u * 0.5;
          rot = u * 500 + i * 31;
          opacity = envelope;
        } else if (kind === "electric-arcs") {
          opacity =
            envelope *
            (0.15 +
              0.85 *
                Math.pow(Math.max(0, Math.sin(u * duration * 24 + i * 2)), 2));
          rot = Math.sin(u * 8 + i) * 8;
        } else if (
          [
            "magic-particles",
            "embers",
            "rising-bubbles",
            "floating-hearts",
          ].includes(kind)
        ) {
          px = (r - 0.5) * 140 + Math.sin(phase * 5 + i) * 20;
          py = 60 - phase * 190;
          s = kind === "floating-hearts" ? 0.35 + q * 0.5 : 0.5 + q;
          rot = kind === "floating-hearts" ? Math.sin(u * 5 + i) * 15 : 0;
          opacity = envelope * loopFade;
        } else if (kind === "wind-gust") {
          px = (phase - 0.5) * 340;
          py = (q - 0.5) * 140;
          s = 0.5 + q;
          opacity = envelope * loopFade * 0.6;
        } else if (kind === "speed-lines") {
          s = 0.5 + u;
          opacity = envelope * (0.2 + 0.6 * q);
        } else if (kind === "energy-beam") {
          py = (q - 0.5) * 24;
          s = 0.6 + Math.sin(u * duration * 14 + i) * 0.08;
          opacity = envelope * 0.3;
        } else if (kind === "shockwave") {
          s = 0.1 + u * (1 + q * 1.5);
          opacity = envelope * (1 - u) * 0.6;
        } else if (kind === "portal-swirl") {
          s = 0.25 + q * 0.8;
          rot = u * 360 + i * 30;
          opacity = envelope * 0.5;
        }
        n.keys.push({
          t: start + u * duration,
          x: px,
          y: py,
          scaleX: s,
          scaleY: s,
          rotation: rot,
          opacity: Math.max(0, Math.min(1, opacity)),
          ease: "linear",
        });
      }
      if (start > 0) n.keys.unshift({ t: 0, opacity: 0, ease: "hold" });
    }
    const n = {
      id,
      tag: "g",
      attrs: {},
      pose: { ...S.defaults, x, y, scaleX: scale, scaleY: scale, opacity: 0 },
      keys: [
        ...(start > 0 ? [{ t: 0, opacity: 0, ease: "hold" }] : []),
        { t: start, opacity: 1, ease: "hold" },
        { t: start + duration, opacity: 0, ease: "hold" },
      ],
      children,
      library: { role: "effect", kind, category: item.category },
      effectOptions: {
        color,
        intensity,
        scale,
        width: w,
        height: h,
        start,
        duration,
      },
    };
    return n;
  }
  const api = { items, build };
  root.StudioSceneEffects2D = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
