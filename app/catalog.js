/* Editable 2D cutout templates; palettes are reference data, not copied meshes. */
(function (root) {
  "use strict";
  const S =
      root.Studio ||
      (typeof require === "function" ? require("./core.js") : null),
    palettes =
      root.CHARACTER_PALETTES ||
      (typeof require === "function"
        ? require("../library/character-palettes.json")
        : null),
    copy = S.clone;
  const actions = [
    "idle",
    "talk",
    "think",
    "observe",
    "gesture",
    "walk",
    "run",
    "march",
    "dance",
    "swing",
    "aim",
    "attack",
    "fall",
    "brace",
    "sit",
    "paper",
    "strike",
    "stomp",
    "down",
    "reach",
    "kneel",
    "draw",
    "crouch",
    "push",
    "lift",
    "point",
    "clap",
    "salute",
    "nod",
    "bow",
    "look-down",
    "look-up",
    "hurt",
    "recoil",
    "protect",
    "offer",
    "read",
    "work",
    "grieve",
    "sleep",
    "land",
    "fly",
    "heavy",
    "hit",
    "yield",
    "sad",
    "angry",
    "restrained",
    "spell",
    "hidefigs",
    "reveal",
    "pull",
    "dig",
    "carry",
    "build",
    "play",
    "strong",
    "care",
    "gift",
    "special",
    "surprised",
    "spinach",
  ];
  const environments = [
    "void",
    "jungle",
    "gym",
    "royal",
    "room",
    "library",
    "diner",
    "street",
    "bears",
    "gatewake",
    "softville",
    "emerald-landing",
    "roof",
    "space",
    "ruins",
    "fall",
    "neo",
    "hardville",
    "cave",
    "rebuildrex",
    "temporal",
    "lab",
    "dome",
    "ship",
    "core",
  ];
  const props = [
    "sword",
    "rifle",
    "knife",
    "spear",
    "top",
    "box",
    "tablet",
    "slime",
    "lantern",
  ];
  function n(id, tag, attrs = {}, children = []) {
    return { id, tag, attrs, pose: { ...S.defaults }, keys: [], children };
  }
  function character(kind, id, x = 480, y = 380) {
    const info = palettes.characters[kind];
    if (!info) throw Error("Unknown character template");
    if (!/^[A-Za-z_][\w.-]*$/.test(id)) throw Error("Invalid character ID");
    const cloth = info.top || info.color,
      skin = info.skin || info.accent,
      legs = info.legs || info.color,
      species = info.species || "human";
    let serial = 0;
    const make = (tag, a, c) => n(id + "_part" + serial++, tag, a, c),
      group = (part, a, c) => ({
        ...n(id + "_" + part, "g", a, c),
        joint: part,
      }),
      rect = (x, y, w, h, fill, rx = 4) =>
        make("rect", { x, y, width: w, height: h, fill, rx }),
      ellipse = (cx, cy, rx, ry, fill) =>
        make("ellipse", { cx, cy, rx, ry, fill }),
      path = (d, fill) => make("path", { d, fill });
    const tail = ["roo", "rex", "dragon"].includes(species)
      ? group("tail", {}, [
          path("M15 -40 Q95 -5 110 -42 Q68 -12 25 -80 Z", cloth),
        ])
      : null;
    const legL = group("legL", {}, [
        rect(-12, 0, 20, 65, legs),
        ellipse(-2, 66, 14, 7, "#142033"),
      ]),
      legR = group("legR", {}, [
        rect(-8, 0, 20, 65, legs),
        ellipse(2, 66, 14, 7, "#142033"),
      ]);
    legL.pose = { ...S.defaults, x: -14, y: -64 };
    legR.pose = { ...S.defaults, x: 14, y: -64 };
    const armL = group("armL", {}, [
        rect(-10, 0, 18, 48, cloth),
        ellipse(-1, 51, 10, 11, skin),
      ]),
      armR = group("armR", {}, [
        rect(-8, 0, 18, 48, cloth),
        ellipse(1, 51, 10, 11, skin),
      ]);
    armL.pose = { ...S.defaults, x: -33, y: -132, rotation: 8 };
    armR.pose = { ...S.defaults, x: 33, y: -132, rotation: -8 };
    const face = [];
    if (["bear", "roo"].includes(species) || info.ears) {
      face.push(
        ellipse(
          -24,
          -23,
          species === "roo" ? 8 : 11,
          species === "roo" ? 27 : 11,
          cloth,
        ),
        ellipse(
          24,
          -23,
          species === "roo" ? 8 : 11,
          species === "roo" ? 27 : 11,
          cloth,
        ),
      );
    }
    face.push(
      species === "robot"
        ? rect(-26, -28, 52, 50, cloth, 8)
        : ellipse(0, -2, 28, species === "rex" ? 22 : 31, skin),
    );
    if (["bear", "rex", "dragon"].includes(species))
      face.push(
        ellipse(0, 11, species === "rex" ? 33 : 17, 13, skin),
        ellipse(0, 7, 6, 4, "#1d2431"),
      );
    if (info.hair || species === "human")
      face.push(
        path(
          "M-27 -4 L-26 -23 Q0 -48 26 -23 L28 -4 L14 -19 L-15 -19 Z",
          "#172131",
        ),
      );
    if (species === "insect") {
      face.push(
        path("M-12 -24 L-24 -48 L-27 -47 L-16 -23 Z", "#b7c77e"),
        path("M12 -24 L24 -48 L27 -47 L16 -23 Z", "#b7c77e"),
      );
    }
    face.push(
      ellipse(-10, -3, 3, 4, species === "robot" ? "#b9fbff" : "#162336"),
      ellipse(10, -3, 3, 4, species === "robot" ? "#b9fbff" : "#162336"),
      path("M-7 17 Q0 21 7 17 L6 19 Q0 24 -6 19 Z", "#273444"),
    );
    const head = group("head", {}, face);
    head.pose = { ...S.defaults, y: -169 };
    const bodyChildren = [];
    if (info.cloak)
      bodyChildren.push(
        path("M-27 -145 L-55 -45 Q0 -25 55 -45 L27 -145 Z", cloth),
      );
    if (tail) bodyChildren.push(tail);
    if (species === "dragon" || info.bolt)
      bodyChildren.push(
        group("wings", {}, [
          path(
            "M-25 -135 L-110 -190 L-85 -92 L-40 -70 Z",
            info.accent || "#9bd4e0",
          ),
          path(
            "M25 -135 L110 -190 L85 -92 L40 -70 Z",
            info.accent || "#9bd4e0",
          ),
        ]),
      );
    bodyChildren.push(
      legL,
      legR,
      armL,
      rect(-31, -144, 62, 84, cloth, 12),
      armR,
      head,
    );
    if (info.coat)
      bodyChildren.push(
        rect(-25, -138, 18, 78, "#e7efeb"),
        rect(7, -138, 18, 78, "#e7efeb"),
      );
    if (info.cyber || species === "robot")
      bodyChildren.push(rect(-12, -123, 24, 18, info.accent, 2));
    if (info.armor) bodyChildren.push(rect(-27, -137, 54, 44, "#818e9e", 3));
    if (
      ["slime", "elemental"].includes(species) ||
      ["fire", "water", "earth", "wind"].includes(kind)
    ) {
      bodyChildren.length = 0;
      bodyChildren.push(
        path(
          kind === "fire"
            ? "M-50 0 Q-70 -60 -30 -100 Q-45 -150 0 -190 Q-8 -110 30 -130 Q75 -65 50 0 Z"
            : "M-55 0 Q-65 -130 0 -165 Q65 -130 55 0 Z",
          cloth,
        ),
        ellipse(-13, -83, 5, 7, "#162336"),
        ellipse(13, -83, 5, 7, "#162336"),
        path("M-12 -59 Q0 -48 12 -59 L10 -56 Q0 -43 -10 -56 Z", "#162336"),
      );
    }
    const body = group("body", {}, bodyChildren),
      rig = group("root", {}, [body]);
    rig.id = id;
    rig.pose = { ...S.defaults, x, y };
    rig.library = {
      kind,
      role: "character",
      provenance:
        "Original editable SVG interpretation of existing studio palette/species metadata",
    };
    return rig;
  }
  function part(rig, name) {
    let result;
    S.walk([rig], (node) => {
      if (node.joint === name || node.id === rig.id + "_" + name) result = node;
    });
    return result;
  }
  function actionPose(action, t, u) {
    const v = {
      body: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
      head: { rotation: 0 },
      armL: { rotation: 8 },
      armR: { rotation: -8 },
      legL: { rotation: 0 },
      legR: { rotation: 0 },
      wings: { rotation: 0 },
      tail: { rotation: 0 },
    };
    const wave = Math.sin(t * 6),
      rise = Math.sin(Math.PI * u),
      both = (a) => {
        v.armL.rotation = -a;
        v.armR.rotation = a;
      };
    if (["walk", "run", "march", "dance", "swing", "play"].includes(action)) {
      const speed = action === "run" ? 11 : action === "march" ? 7 : 6,
        w = Math.sin(t * speed),
        amp = action === "run" ? 42 : 25;
      v.legL.rotation = w * amp;
      v.legR.rotation = -w * amp;
      v.armL.rotation = -w * amp;
      v.armR.rotation = w * amp;
      v.body.y = -Math.abs(w) * (action === "run" ? 9 : 4);
      if (action === "dance" || action === "play") {
        v.body.rotation = wave * 9;
        both(65 + wave * 20);
      }
      if (action === "swing") {
        both(155);
        v.body.rotation = wave * 20;
      }
    }
    if (["talk", "gesture", "care", "gift", "offer"].includes(action)) {
      v.armR.rotation = -45 - rise * 25;
      v.head.rotation = wave * 3;
      if (action === "gesture") v.armL.rotation = 35 + wave * 15;
    }
    if (["think", "observe", "read", "work"].includes(action)) {
      v.head.rotation = action === "observe" ? -10 : 12;
      v.armR.rotation = -135;
      if (action === "read") {
        both(70);
      }
      if (action === "work") v.armL.rotation = 35 + wave * 20;
    }
    if (["aim", "point", "spell"].includes(action)) {
      v.armR.rotation = -90;
      v.armL.rotation = action === "aim" ? 55 : 10;
      if (action === "spell") v.armL.rotation = 75 + wave * 15;
    }
    if (
      ["attack", "strike", "heavy", "special", "dig", "build"].includes(action)
    ) {
      v.armR.rotation = -30 - 135 * rise;
      v.armL.rotation = 35;
      v.body.rotation = rise * 15;
      if (action === "dig" || action === "build") {
        v.armR.rotation = -35 - 70 * (0.5 + 0.5 * wave);
      }
    }
    if (["brace", "protect", "push", "restrained", "strong"].includes(action)) {
      both(action === "strong" ? 145 : 80);
      v.body.rotation = action === "push" ? 15 : 0;
      if (action === "restrained") both(95);
    }
    if (["reach", "lift", "pull", "carry"].includes(action)) {
      both(action === "reach" ? 140 : action === "carry" ? 65 : 50 + 80 * rise);
      v.body.y = action === "lift" ? -10 * rise : 0;
    }
    if (["sit", "crouch", "kneel", "yield", "land"].includes(action)) {
      v.body.y = action === "crouch" ? 45 : 30;
      v.legL.rotation = action === "kneel" ? 75 : -55;
      v.legR.rotation = 55;
      v.head.rotation = action === "yield" ? 18 : 0;
      if (action === "land") v.body.y = 35 * rise;
    }
    if (["fall", "down", "sleep"].includes(action)) {
      v.body.rotation = action === "fall" ? 85 * u : 85;
      v.body.y = action === "fall" ? 20 * u : 20;
      both(action === "sleep" ? 15 : 30);
    }
    if (["hurt", "hit", "recoil", "sad", "angry", "grieve"].includes(action)) {
      v.body.rotation =
        action === "recoil" ? -20 * rise : action === "angry" ? 8 : 12;
      v.head.rotation = action === "sad" || action === "grieve" ? 25 : wave * 5;
      if (action === "grieve") both(145);
      if (action === "angry") both(35 + rise * 25);
    }
    if (action === "surprised") {
      both(120);
      v.head.rotation = -15;
      v.body.y = -8 * rise;
    }
    if (action === "spinach") {
      v.armR.rotation = -145 * rise;
      v.head.rotation = -12 * rise;
      v.body.scaleY = 1 + 0.05 * u;
    }
    if (action === "stomp") {
      v.legR.rotation = -55 * rise;
      v.body.y = -12 * rise;
    }
    if (action === "draw") {
      v.armR.rotation = -90 * rise;
      v.body.rotation = -8 * rise;
    }
    if (action === "clap") {
      both(60 + 35 * (0.5 + 0.5 * wave));
    }
    if (action === "salute") v.armR.rotation = -150;
    if (action === "nod") v.head.rotation = 15 * rise;
    if (action === "bow") {
      v.body.rotation = 30 * rise;
      v.head.rotation = 20 * rise;
    }
    if (action === "look-down") v.head.rotation = 20;
    if (action === "look-up") v.head.rotation = -20;
    if (action === "paper") {
      v.body.scaleX = Math.max(0.08, 1 - 0.9 * rise);
      both(90);
    }
    if (action === "fly") {
      both(75);
      v.body.y = -35 + wave * 5;
      v.wings.rotation = wave * 12;
    }
    if (action === "hidefigs") v.body.opacity = 1 - u;
    if (action === "reveal") v.body.opacity = u;
    v.tail.rotation = wave * 5;
    return v;
  }
  function animate(rig, action, start, duration) {
    if (!actions.includes(action)) throw Error("Unsupported action");
    if (
      !Number.isFinite(start) ||
      start < 0 ||
      !Number.isFinite(duration) ||
      duration <= 0 ||
      duration > 120
    )
      throw Error("Action duration must be >0 and <=120 seconds");
    const count = Math.ceil(duration * 8);
    for (const name of [
      "body",
      "head",
      "armL",
      "armR",
      "legL",
      "legR",
      "wings",
      "tail",
    ]) {
      const node = part(rig, name);
      if (!node) continue;
      const base = copy(node.pose);
      node.keys = (node.keys || []).filter(
        (k) => k.t < start || k.t > start + duration,
      );
      for (let i = 0; i <= count; i++) {
        const t = (duration * i) / count,
          p = actionPose(action, t, t / duration)[name],
          key = { t: start + t, ease: "smooth" };
        for (const [k, v] of Object.entries(p))
          key[k] = k === "x" || k === "y" ? base[k] + v : v;
        node.keys.push(key);
      }
      node.keys.sort((a, b) => a.t - b.t);
    }
    rig.library = { ...rig.library, action };
    return rig;
  }
  function prop(kind, id) {
    if (!props.includes(kind)) throw Error("Unknown prop");
    const shapes = {
      sword: [
        [
          "path",
          { d: "M-4 -5 L-5 -75 L0 -88 L5 -75 L4 -5 Z", fill: "#d2e5ed" },
        ],
        ["rect", { x: -13, y: -9, width: 26, height: 6, fill: "#d6b25b" }],
        ["rect", { x: -4, y: -3, width: 8, height: 18, fill: "#80583b" }],
      ],
      knife: [
        ["path", { d: "M0 8 L-5 -25 L0 -36 L6 -25 L5 8 Z", fill: "#cfdae2" }],
      ],
      spear: [
        ["rect", { x: -3, y: -90, width: 6, height: 130, fill: "#876444" }],
        ["path", { d: "M-10 -90 L0 -110 L10 -90 Z", fill: "#cedbe0" }],
      ],
      rifle: [
        ["rect", { x: -6, y: -9, width: 64, height: 14, fill: "#3d485e" }],
        ["rect", { x: 4, y: 3, width: 12, height: 15, fill: "#715b4c" }],
      ],
      box: [
        ["rect", { x: -20, y: -20, width: 40, height: 40, fill: "#b58a56" }],
      ],
      tablet: [
        [
          "rect",
          { x: -16, y: -23, width: 32, height: 46, rx: 4, fill: "#334559" },
        ],
        ["rect", { x: -12, y: -18, width: 24, height: 33, fill: "#8bdde2" }],
      ],
      lantern: [
        [
          "rect",
          { x: -13, y: -18, width: 26, height: 36, rx: 5, fill: "#f6d47a" },
        ],
      ],
      top: [["path", { d: "M-18 -6 L18 -6 L0 20 Z", fill: "#a968cf" }]],
      slime: [["ellipse", { cx: 0, cy: 0, rx: 25, ry: 17, fill: "#a7cd78" }]],
    };
    const g = n(
      id,
      "g",
      {},
      shapes[kind].map(([tag, a], i) => n(id + "_" + i, tag, a)),
    );
    g.library = { role: "prop", kind };
    return g;
  }
  function environment(kind, id, w, h) {
    if (!environments.includes(kind)) throw Error("Unknown environment");
    let i = 0;
    const shapes = [],
      add = (tag, a) => shapes.push(n(id + "_" + i++, tag, a)),
      rect = (x, y, width, height, fill) =>
        add("rect", { x, y, width, height, fill });
    rect(
      0,
      0,
      w,
      h,
      kind === "void"
        ? "#17172f"
        : kind === "jungle" || kind === "bears"
          ? "#173d3b"
          : "#26334d",
    );
    rect(0, h * 0.7, w, h * 0.3, "#34475a");
    if (
      ["softville", "emerald-landing", "ruins", "fall", "neo"].includes(kind)
    ) {
      const ruined = ["ruins", "fall"].includes(kind);
      for (let j = 0; j < 5; j++) {
        const x = w * (0.08 + j * 0.21);
        rect(x, h * 0.18, w * 0.025, h * 0.55, "#685241");
        if (!ruined) {
          add("ellipse", {
            cx: x + w * 0.012,
            cy: h * 0.21,
            rx: w * 0.11,
            ry: h * 0.17,
            fill: "#3b7354",
          });
          if (kind !== "emerald-landing") {
            rect(x - w * 0.045, h * 0.36, w * 0.12, h * 0.14, "#98734f");
            add("path", {
              d: `M${x - w * 0.055} ${h * 0.36} L${x + w * 0.015} ${h * 0.27} L${x + w * 0.085} ${h * 0.36} Z`,
              fill: "#426d73",
            });
          }
        }
      }
      if (kind === "emerald-landing") {
        for (const x of [w * 0.15, w * 0.66]) {
          rect(x, h * 0.53, w * 0.19, h * 0.2, "#856247");
          add("path", {
            d: `M${x - w * 0.025} ${h * 0.53} L${x + w * 0.095} ${h * 0.4} L${x + w * 0.215} ${h * 0.53} Z`,
            fill: "#654d49",
          });
          rect(x + w * 0.07, h * 0.61, w * 0.05, h * 0.12, "#352d2d");
        }
      } else {
        for (const x of [w * 0.15, w * 0.8]) {
          rect(
            x,
            h * (ruined ? 0.6 : 0.45),
            w * 0.065,
            h * (ruined ? 0.14 : 0.29),
            "#a5a596",
          );
          if (!ruined)
            add("path", {
              d: `M${x - w * 0.01} ${h * 0.45} L${x + w * 0.032} ${h * 0.35} L${x + w * 0.075} ${h * 0.45} Z`,
              fill: "#617287",
            });
        }
        if (kind === "neo")
          for (const x of [w * 0.3, w * 0.6]) {
            rect(x, h * 0.12, w * 0.04, h * 0.58, "#8299ad");
            for (let y = 0; y < 7; y++)
              rect(x + 3, h * 0.15 + y * h * 0.075, w * 0.03, 4, "#98e4ec");
          }
      }
    } else if (
      [
        "roof",
        "space",
        "hardville",
        "cave",
        "rebuildrex",
        "temporal",
        "lab",
        "dome",
        "ship",
        "core",
      ].includes(kind)
    ) {
      if (kind === "roof") {
        rect(0, h * 0.65, w, h * 0.04, "#a0a99f");
        rect(0, h * 0.65, w * 0.025, h * 0.35, "#a0a99f");
        rect(w * 0.975, h * 0.65, w * 0.025, h * 0.35, "#a0a99f");
      } else if (kind === "space") {
        rect(0, 0, w, h, "#10172d");
        add("circle", {
          cx: w * 0.22,
          cy: h * 0.65,
          r: h * 0.27,
          fill: "#527f98",
        });
        for (let j = 0; j < 45; j++)
          add("circle", {
            cx: (j * 137) % w,
            cy: (j * 71) % h,
            r: 1.5,
            fill: "#dce8f4",
          });
      } else if (["hardville", "cave", "rebuildrex"].includes(kind)) {
        rect(0, 0, w, h, "#352d41");
        for (let j = 0; j < 7; j++) {
          const x = (j * w) / 6;
          add("path", {
            d: `M${x - w * 0.1} ${h * 0.78} L${x} ${h * 0.12 + (j % 3) * h * 0.1} L${x + w * 0.12} ${h * 0.78} Z`,
            fill: "#735767",
          });
        }
        add("ellipse", {
          cx: w * 0.5,
          cy: h * 0.57,
          rx: w * 0.09,
          ry: h * 0.22,
          fill: "#121b29",
          stroke: "#87988e",
          "stroke-width": 14,
        });
      } else if (kind === "temporal") {
        for (let j = 0; j < 7; j++)
          add("ellipse", {
            cx: w * (0.1 + j * 0.14),
            cy: h * (0.35 + (j % 2) * 0.2),
            rx: w * 0.065,
            ry: h * 0.17,
            fill: "none",
            stroke: "#a88dc7",
            "stroke-width": 4,
          });
      } else {
        for (let j = 0; j < 5; j++) {
          const x = w * (0.08 + j * 0.2);
          rect(x, h * 0.1, 8, h * 0.61, "#728693");
          rect(
            x + 15,
            h * 0.35,
            w * 0.12,
            h * 0.15,
            kind === "ship" || kind === "core" ? "#799b85" : "#6e9cc4",
          );
        }
        if (kind === "lab")
          for (const x of [w * 0.17, w * 0.62]) {
            rect(x, h * 0.64, w * 0.22, h * 0.025, "#b1c4cc");
            rect(x + 7, h * 0.66, 6, h * 0.16, "#b1c4cc");
            rect(x + w * 0.19, h * 0.66, 6, h * 0.16, "#b1c4cc");
          }
        if (kind === "dome")
          add("ellipse", {
            cx: w * 0.5,
            cy: h * 0.43,
            rx: w * 0.31,
            ry: h * 0.32,
            fill: "none",
            stroke: "#a9dfe3",
            "stroke-width": 7,
          });
        if (kind === "core")
          rect(w * 0.43, h * 0.62, w * 0.14, h * 0.12, "#b7ced1");
      }
    } else if (kind === "void") {
      for (let j = 0; j < 40; j++)
        add("circle", {
          cx: (j * 137.37) % w,
          cy: (j * 73.61) % (h * 0.8),
          r: (j % 3) + 1,
          fill: "#d6c5ef",
        });
    } else if (kind === "jungle" || kind === "bears") {
      for (let j = 0; j < 7; j++) {
        const x = (j * w) / 6;
        rect(x - 8, h * 0.18, 16, h * 0.6, "#604e40");
        add("ellipse", {
          cx: x,
          cy: h * 0.25,
          rx: w / 9,
          ry: h * 0.2,
          fill: j % 2 ? "#27594a" : "#356c55",
        });
      }
    } else if (kind === "street") {
      for (let j = 0; j < 7; j++) {
        const x = (j * w) / 7,
          bh = h * (0.3 + (j % 3) * 0.1);
        rect(
          x + 8,
          h * 0.7 - bh,
          w / 7 - 16,
          bh,
          ["#68788a", "#7c657f", "#557785"][j % 3],
        );
        for (let row = 0; row < 3; row++)
          for (let col = 0; col < 2; col++)
            rect(
              x + 20 + (col * w) / 15,
              h * 0.7 - bh + 20 + row * h * 0.07,
              w / 32,
              h * 0.04,
              "#c2dace",
            );
      }
    } else if (kind === "library") {
      for (let j = 0; j < 4; j++) {
        const x = w * (0.06 + j * 0.24);
        rect(x, h * 0.1, w * 0.18, h * 0.62, "#795a42");
        for (let row = 0; row < 4; row++)
          for (let k = 0; k < 7; k++)
            rect(
              x + 8 + k * w * 0.021,
              h * 0.12 + row * h * 0.14,
              w * 0.017,
              h * 0.11,
              ["#568b8b", "#b48065", "#746997"][k % 3],
            );
      }
    } else if (kind === "royal" || kind === "gatewake") {
      for (const x of [w * 0.12, w * 0.3, w * 0.7, w * 0.88])
        rect(x, h * 0.1, w * 0.04, h * 0.65, "#b0a99a");
      rect(
        w * 0.38,
        h * 0.2,
        w * 0.24,
        h * 0.5,
        kind === "royal" ? "#784787" : "#15212d",
      );
      if (kind === "gatewake")
        add("path", {
          d: `M${w * 0.34} ${h * 0.7} V${h * 0.3} Q${w * 0.5} ${-h * 0.05} ${w * 0.66} ${h * 0.3} V${h * 0.7}`,
          fill: "none",
          stroke: "#a0b4af",
          "stroke-width": 18,
        });
    } else if (kind === "gym") {
      for (let j = 0; j < 6; j++)
        rect(w * (0.12 + j * 0.15), h * 0.15, 8, h * 0.55, "#9aacb7");
      rect(w * 0.1, h * 0.18, w * 0.8, 8, "#9aacb7");
      rect(w * 0.12, h * 0.75, w * 0.6, h * 0.08, "#835b78");
    } else if (kind === "diner") {
      for (let j = 0; j < 3; j++) {
        rect(w * (0.08 + j * 0.31), h * 0.54, w * 0.22, h * 0.13, "#a4596f");
        rect(w * (0.07 + j * 0.31), h * 0.65, w * 0.25, h * 0.035, "#c7aa7e");
        rect(w * (0.17 + j * 0.31), h * 0.68, 12, h * 0.2, "#a5b0b7");
      }
    } else {
      rect(w * 0.12, h * 0.14, w * 0.3, h * 0.32, "#99c1d1");
      rect(w * 0.7, h * 0.23, w * 0.18, h * 0.48, "#6a4d43");
    }
    const g = n(id, "g", {}, shapes);
    g.library = { role: "background", kind };
    return g;
  }
  const effects = [
    "flash",
    "spark",
    "beam",
    "smoke",
    "portal",
    "burst",
    "ripple",
  ];
  function effect(kind, id, start, duration, x = 480, y = 270) {
    if (!effects.includes(kind)) throw Error("Unknown visual effect");
    if (
      !Number.isFinite(start) ||
      start < 0 ||
      !Number.isFinite(duration) ||
      duration <= 0 ||
      duration > 120
    )
      throw Error("Invalid effect interval");
    const children = [];
    const add = (tag, attrs) =>
      children.push(n(id + "_" + children.length, tag, attrs));
    if (kind === "beam")
      add("rect", {
        x: 0,
        y: -6,
        width: 260,
        height: 12,
        rx: 5,
        fill: "#c4f7ff",
      });
    else if (kind === "smoke")
      for (let i = 0; i < 5; i++)
        add("circle", {
          cx: ((i % 3) - 1) * 25,
          cy: Math.floor(i / 3) * -20,
          r: 30,
          fill: "#9bafbd",
          opacity: 0.5,
        });
    else if (kind === "spark" || kind === "burst") {
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        add("line", {
          x1: Math.cos(a) * 10,
          y1: Math.sin(a) * 10,
          x2: Math.cos(a) * 55,
          y2: Math.sin(a) * 55,
          stroke: kind === "spark" ? "#f8dc7d" : "#c19deb",
          "stroke-width": 5,
          "stroke-linecap": "round",
        });
      }
    } else if (kind === "flash")
      add("circle", { cx: 0, cy: 0, r: 100, fill: "#fff2bf" });
    else
      add("ellipse", {
        cx: 0,
        cy: 0,
        rx: 70,
        ry: kind === "portal" ? 100 : 30,
        fill: "none",
        stroke: kind === "portal" ? "#ba9aef" : "#8de6e3",
        "stroke-width": 7,
      });
    const node = n(id, "g", {}, children);
    node.pose = { ...S.defaults, x, y, opacity: 0 };
    node.keys = [
      ...(start > 0 ? [{ t: 0, opacity: 0, ease: "hold" }] : []),
      {
        t: start,
        opacity: 1,
        scaleX: kind === "beam" ? 0.05 : 0.3,
        scaleY: 0.3,
        x,
        y,
        ease: "smooth",
      },
      {
        t: start + duration * 0.25,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        x,
        y,
        ease: "smooth",
      },
      {
        t: start + duration,
        opacity: 0,
        scaleX: kind === "beam" ? 1 : 1.7,
        scaleY: kind === "beam" ? 1 : 1.7,
        x,
        y: kind === "smoke" ? y - 80 : y,
        ease: "hold",
      },
    ];
    node.library = { role: "effect", kind };
    return node;
  }
  const api = {
    characters: Object.keys(palettes.characters),
    actions,
    environments,
    props,
    character,
    animate,
    actionPose,
    environment,
    prop,
    part,
    effects,
    effect,
  };
  root.StudioCatalog2D = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
