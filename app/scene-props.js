/* Original editable, generic SVG props. All geometry is artwork, not device schematics. */
(function (root) {
  "use strict";
  const S =
    root.Studio ||
    (typeof require === "function" ? require("./core.js") : null);
  const defs = [];
  const shape = (tag, attrs) => {
      if (/^#[0-9a-f]{8}$/i.test(attrs.fill || "")) {
        attrs = {
          ...attrs,
          "fill-opacity": parseInt(attrs.fill.slice(7), 16) / 255,
          fill: attrs.fill.slice(0, 7),
        };
      }
      return { tag, attrs };
    },
    R = (x, y, w, h, fill, rx = 2) =>
      shape("rect", {
        x,
        y,
        width: w,
        height: h,
        fill,
        rx,
        stroke: "#283547",
        "stroke-width": 1.5,
      }),
    E = (x, y, rx, ry, fill) =>
      shape("ellipse", {
        cx: x,
        cy: y,
        rx,
        ry,
        fill,
        stroke: "#283547",
        "stroke-width": 1.5,
      }),
    L = (x1, y1, x2, y2, color = "#c4d8df", width = 3) =>
      shape("line", {
        x1,
        y1,
        x2,
        y2,
        stroke: color,
        "stroke-width": width,
        "stroke-linecap": "round",
      }),
    D = (d, fill, stroke = "#283547", width = 1.5) =>
      shape("path", { d, fill, stroke, "stroke-width": width });
  const metal = "#c4d8df",
    wood = "#926348",
    dark = "#33465c",
    gold = "#e9ba55",
    blue = "#62c7e0";
  function add(id, label, category, shapes, actions = [], grip = true) {
    defs.push({ id, label, category, shapes, actions, grip });
  }
  const blade = (tip, width = 7) =>
      D(
        `M-${width} 15 L-${width} ${tip - 14} L0 ${tip} L${width} ${tip - 14} L${width} 15 Z`,
        metal,
      ),
    handle = () => [R(-4, -8, 8, 25, wood), R(-18, 13, 36, 6, gold)];
  add(
    "longsword",
    "Longsword",
    "Fantasy weapons",
    [...handle(), blade(105)],
    ["weapon-slash", "weapon-overhead"],
  );
  add(
    "greatsword",
    "Greatsword",
    "Fantasy weapons",
    [R(-5, -15, 10, 38, wood), R(-24, 20, 48, 7, gold), blade(140, 10)],
    ["weapon-overhead"],
  );
  add(
    "rapier",
    "Rapier",
    "Fantasy weapons",
    [
      R(-3, -6, 6, 23, wood),
      E(0, 12, 19, 6, gold),
      D("M-2 18 L0 115 L3 18 Z", metal),
      D("M-9 14 Q-23 -4 -4 -8", "none", gold, 4),
    ],
    ["weapon-slash"],
  );
  add(
    "katana",
    "Curved katana",
    "Historical weapons",
    [
      R(-4, -15, 8, 35, dark),
      R(-12, 17, 24, 5, gold),
      D("M-4 21 Q-5 95 16 122 Q8 79 4 21 Z", metal),
    ],
    ["weapon-slash"],
  );
  add(
    "scimitar",
    "Scimitar",
    "Fantasy weapons",
    [...handle(), D("M-5 19 Q-13 71 20 109 Q5 70 17 43 L5 19 Z", metal)],
    ["weapon-slash"],
  );
  add(
    "dagger",
    "Dagger",
    "Fantasy weapons",
    [...handle(), blade(60, 9)],
    ["weapon-slash"],
  );
  add(
    "battleaxe",
    "Battle axe",
    "Fantasy weapons",
    [
      R(-4, -15, 8, 125, wood),
      D("M4 62 Q52 48 46 101 Q23 91 4 94 Z", metal),
      R(-7, 67, 14, 27, dark),
    ],
    ["weapon-overhead"],
  );
  add(
    "double-axe",
    "Double axe",
    "Fantasy weapons",
    [
      R(-4, -15, 8, 125, wood),
      D("M-4 62 Q-49 48 -44 103 L-4 91 L4 91 L44 103 Q49 48 4 62 Z", metal),
    ],
    ["weapon-overhead"],
  );
  add(
    "warhammer",
    "War hammer",
    "Fantasy weapons",
    [
      R(-4, -15, 8, 118, wood),
      R(-34, 72, 68, 25, metal),
      R(-9, 67, 18, 36, gold),
    ],
    ["weapon-overhead"],
  );
  add(
    "mace",
    "Mace",
    "Fantasy weapons",
    [
      R(-4, -12, 8, 90, wood),
      E(0, 85, 20, 23, metal),
      L(-23, 85, 23, 85, dark, 3),
      L(0, 60, 0, 110, dark, 3),
    ],
    ["weapon-slash"],
  );
  add(
    "wood-club",
    "Wooden club",
    "Fantasy weapons",
    [
      D("M-4 -9 Q-7 30 -17 60 Q-25 105 0 109 Q25 105 17 60 Q7 30 4 -9 Z", wood),
      L(-6, 45, -8, 90, "#b88e66", 3),
    ],
    ["weapon-overhead"],
  );
  add(
    "halberd",
    "Halberd",
    "Historical weapons",
    [
      R(-3, -55, 6, 180, wood),
      D("M-9 108 L0 145 L9 108 Z", metal),
      D("M3 80 Q42 65 38 108 L3 102 Z", metal),
    ],
    ["weapon-slash"],
  );
  add(
    "wood-spear",
    "Long spear",
    "Historical weapons",
    [
      R(-3, -70, 6, 188, wood),
      D("M-12 112 L0 145 L12 112 Z", metal),
      L(-5, 103, 5, 103, gold, 5),
    ],
    ["weapon-slash"],
  );
  add(
    "wizard-staff",
    "Crystal staff",
    "Magic weapons",
    [
      R(-4, -65, 8, 170, wood),
      D("M0 92 L-19 117 L0 143 L19 117 Z", "#a779ed"),
      E(0, 114, 25, 26, "none"),
      L(-4, 79, 4, 79, gold, 5),
    ],
    ["cast-projectile", "channel-power"],
  );
  add(
    "wand",
    "Magic wand",
    "Magic weapons",
    [
      R(-3, -8, 6, 64, wood),
      D(
        "M0 46 L4 55 L14 56 L7 64 L9 75 L0 69 L-9 75 L-7 64 L-14 56 L-4 55 Z",
        gold,
      ),
    ],
    ["cast-projectile"],
  );
  add(
    "longbow",
    "Longbow",
    "Historical weapons",
    [
      D("M0 -70 Q62 0 0 80", "none", wood, 7),
      L(0, -70, 0, 80, "#dfd6bb", 1.5),
      R(-5, -10, 12, 25, dark),
    ],
    ["reach", "carry"],
  );
  add(
    "crossbow",
    "Crossbow",
    "Historical weapons",
    [
      R(-5, -18, 10, 96, wood),
      D("M-45 50 Q0 22 45 50", "none", wood, 7),
      L(-45, 50, 0, 7, "#dfd6bb", 1),
      L(45, 50, 0, 7, "#dfd6bb", 1),
      L(0, 8, 0, 82, metal, 3),
    ],
    ["shoot-rifle"],
  );
  add(
    "round-shield",
    "Round shield",
    "Armor",
    [
      E(0, 16, 37, 40, wood),
      E(0, 16, 32, 35, "#527798"),
      E(0, 16, 10, 11, metal),
    ],
    ["block-high", "block-low"],
  );
  add(
    "kite-shield",
    "Kite shield",
    "Armor",
    [
      D("M-35 -20 L35 -20 L29 37 L0 77 L-29 37 Z", "#587f9b"),
      D("M-25 -10 L25 -10 L19 32 L0 60 L-19 32 Z", gold),
      D("M0 -10 L0 60", "none", metal, 4),
    ],
    ["block-high", "block-low"],
  );
  add(
    "buckler",
    "Small buckler",
    "Armor",
    [E(0, 12, 24, 26, metal), E(0, 12, 10, 11, dark)],
    ["block-high"],
  );
  add(
    "revolver",
    "Western revolver",
    "Modern weapons",
    [
      R(-14, -7, 16, 23, wood),
      R(-7, 6, 18, 24, dark),
      E(0, 20, 11, 10, metal),
      R(-7, 26, 12, 39, dark),
    ],
    ["shoot-pistol"],
  );
  add(
    "handgun",
    "Modern handgun",
    "Modern weapons",
    [
      R(-16, -7, 18, 22, dark),
      R(-7, 10, 15, 43, dark),
      L(-3, 16, -3, 46, metal, 2),
    ],
    ["shoot-pistol"],
  );
  add(
    "shotgun",
    "Wood-stock long gun",
    "Modern weapons",
    [
      R(-8, -37, 16, 41, wood),
      R(-6, 0, 12, 93, dark),
      R(-9, 35, 18, 28, wood),
      L(-2, 63, -2, 94, metal, 2),
    ],
    ["shoot-rifle"],
  );
  add(
    "scifi-blaster",
    "Science-fiction blaster",
    "Science fiction props",
    [
      R(-15, -9, 17, 25, dark),
      R(-11, 9, 22, 47, "#637a9b"),
      R(-14, 47, 28, 12, blue),
      E(0, 29, 7, 8, "#b7f3ff"),
    ],
    ["shoot-pistol", "cast-projectile"],
  );
  add(
    "energy-sword",
    "Energy sword",
    "Science fiction props",
    [
      R(-6, -14, 12, 36, dark),
      R(-4, 22, 8, 101, blue, 4),
      R(-1, 24, 2, 96, "#e2fcff"),
    ],
    ["weapon-slash", "weapon-overhead"],
  );
  add(
    "scifi-rifle",
    "Science-fiction long gun",
    "Science fiction props",
    [
      R(-9, -35, 18, 39, dark),
      R(-12, 2, 24, 68, "#6788a5"),
      R(-8, 67, 16, 29, blue),
      R(11, 15, 12, 21, gold),
      L(-4, 15, -4, 55, blue, 4),
    ],
    ["shoot-rifle"],
  );
  add(
    "scanner",
    "Hand scanner",
    "Science fiction props",
    [
      R(-15, -23, 30, 47, dark, 5),
      R(-11, -17, 22, 22, blue),
      L(-8, 10, 8, 10, gold, 3),
      E(0, -28, 5, 5, blue),
    ],
    ["reach", "carry"],
  );
  add(
    "holo-projector",
    "Hologram projector",
    "Science fiction props",
    [
      E(0, 12, 28, 12, dark),
      D("M-19 6 L-32 -55 L32 -55 L19 6 Z", "#62c7e055"),
      D("M0 -58 L-14 -36 L0 -16 L14 -36 Z", blue),
    ],
    ["reach", "carry"],
  );
  add(
    "mug",
    "Mug",
    "Food and daily life",
    [
      R(-17, -26, 34, 42, "#f2c073", 5),
      E(22, -8, 12, 15, "none"),
      E(0, -25, 16, 5, "#654d42"),
    ],
    ["carry", "reach"],
  );
  add(
    "water-bottle",
    "Water bottle",
    "Food and daily life",
    [
      R(-11, -34, 22, 58, blue, 7),
      R(-8, -44, 16, 12, dark),
      L(-6, -20, -6, 12, "#c7f2ff", 3),
    ],
    ["carry", "reach"],
  );
  add(
    "plate",
    "Plate",
    "Food and daily life",
    [E(0, 0, 40, 12, "#e4edf0"), E(0, -2, 31, 7, "#b3c9d3")],
    ["carry"],
  );
  add(
    "apple",
    "Apple",
    "Food and daily life",
    [
      E(-8, 0, 15, 21, "#d95b61"),
      E(8, 0, 15, 21, "#d95b61"),
      L(0, -18, 3, -31, wood, 4),
      D("M3 -27 Q23 -39 17 -22 Z", "#5c9563"),
    ],
    ["carry", "reach"],
  );
  add(
    "bread",
    "Bread loaf",
    "Food and daily life",
    [
      R(-35, -20, 70, 36, "#d7a665", 18),
      L(-20, -12, -12, 0, "#efc78c", 5),
      L(0, -14, 8, -2, "#efc78c", 5),
      L(20, -12, 28, 0, "#efc78c", 5),
    ],
    ["carry"],
  );
  add(
    "bowl",
    "Bowl",
    "Food and daily life",
    [
      D("M-30 -12 Q-25 29 0 29 Q25 29 30 -12 Z", "#9cb4d3"),
      E(0, -12, 30, 9, "#e2c37b"),
    ],
    ["carry"],
  );
  add(
    "book",
    "Closed book",
    "Documents and devices",
    [
      R(-24, -32, 48, 64, "#865b9b"),
      R(-20, -28, 39, 54, "#ece0bd"),
      R(-24, -32, 7, 64, "#62467a"),
      L(-8, -15, 11, -15, gold, 3),
    ],
    ["carry", "reach"],
  );
  add(
    "open-book",
    "Open book",
    "Documents and devices",
    [
      D(
        "M0 -21 Q-20 -35 -39 -23 L-39 29 Q-20 17 0 30 Q20 17 39 29 L39 -23 Q20 -35 0 -21 Z",
        "#f0e5c9",
      ),
      L(0, -20, 0, 29, wood, 2),
      L(-30, -8, -8, -3, "#a3947b", 2),
      L(8, -3, 30, -8, "#a3947b", 2),
    ],
    ["carry"],
  );
  add(
    "scroll",
    "Scroll",
    "Documents and devices",
    [
      R(-29, -30, 58, 61, "#e5d2a1", 7),
      E(-29, -2, 7, 33, "#c3a974"),
      E(29, -2, 7, 33, "#c3a974"),
      L(-17, -13, 17, -13, wood, 2),
      L(-17, 0, 11, 0, wood, 2),
    ],
    ["carry"],
  );
  add(
    "map",
    "Folded map",
    "Documents and devices",
    [
      D(
        "M-35 -28 L-10 -20 L13 -30 L38 -20 L38 30 L13 20 L-10 30 L-35 20 Z",
        "#e8d9af",
      ),
      L(-10, -20, -10, 30, "#b5a475", 2),
      L(13, -30, 13, 20, "#b5a475", 2),
      D("M-28 6 Q-8 -17 4 5 T31 -4", "none", "#638ca3", 3),
    ],
    ["carry"],
  );
  add(
    "quill",
    "Quill pen",
    "Documents and devices",
    [
      L(0, 24, 7, -35, wood, 2),
      D("M4 -12 Q-24 -35 13 -59 Q25 -24 4 -12 Z", "#d2e4e7"),
    ],
    ["reach"],
  );
  add(
    "phone",
    "Phone",
    "Documents and devices",
    [
      R(-13, -27, 26, 54, dark, 5),
      R(-10, -21, 20, 38, blue),
      E(0, 22, 2, 2, metal),
    ],
    ["carry", "reach"],
  );
  add(
    "laptop",
    "Laptop",
    "Documents and devices",
    [
      R(-37, -40, 74, 47, dark, 4),
      R(-32, -35, 64, 35, blue),
      D("M-37 7 L37 7 L48 29 L-48 29 Z", metal),
      R(-12, 16, 24, 6, dark),
    ],
    ["carry"],
    false,
  );
  add(
    "camera",
    "Camera",
    "Documents and devices",
    [
      R(-30, -18, 60, 38, dark, 6),
      E(0, 1, 17, 17, metal),
      E(0, 1, 11, 11, "#477b94"),
      R(-23, -26, 19, 9, dark),
    ],
    ["carry"],
  );
  add(
    "microphone",
    "Microphone",
    "Documents and devices",
    [
      R(-5, -4, 10, 40, dark, 4),
      E(0, -17, 12, 15, metal),
      L(-8, -20, 8, -20, dark, 2),
    ],
    ["talk"],
  );
  add(
    "key",
    "Key",
    "Treasure and travel",
    [
      E(0, -18, 13, 13, gold),
      E(0, -18, 6, 6, "#edf0f5"),
      R(-3, -7, 6, 39, gold),
      R(2, 19, 11, 6, gold),
      R(2, 28, 8, 5, gold),
    ],
    ["reach"],
  );
  add(
    "coin-pouch",
    "Coin pouch",
    "Treasure and travel",
    [
      D("M-12 -23 L12 -23 L10 -14 Q31 28 0 30 Q-31 28 -10 -14 Z", wood),
      L(-13, -16, 13, -16, gold, 3),
    ],
    ["carry"],
  );
  add(
    "gem",
    "Cut gemstone",
    "Treasure and travel",
    [
      D("M-24 -10 L-12 -25 L12 -25 L24 -10 L0 25 Z", "#8c6ee0"),
      L(-24, -10, 24, -10, "#d4c8ff", 2),
      L(-12, -25, 0, 25, "#d4c8ff", 2),
      L(12, -25, 0, 25, "#d4c8ff", 2),
    ],
    ["carry"],
  );
  add(
    "backpack",
    "Backpack",
    "Treasure and travel",
    [
      R(-28, -35, 56, 71, "#b08b55", 12),
      R(-21, 3, 42, 28, "#87633e", 7),
      D("M-12 -35 Q0 -56 12 -35", "none", dark, 5),
    ],
    ["carry"],
    false,
  );
  add(
    "suitcase",
    "Suitcase",
    "Treasure and travel",
    [
      R(-37, -23, 74, 52, "#866748", 6),
      D("M-12 -24 V-37 H12 V-24", "none", dark, 5),
      L(-22, -20, -22, 24, gold, 4),
      L(22, -20, 22, 24, gold, 4),
    ],
    ["carry"],
  );
  add(
    "torch",
    "Lit torch",
    "Tools",
    [
      R(-4, -8, 8, 65, wood),
      D("M-10 0 Q-23 -18 -4 -43 Q-4 -28 8 -36 Q24 -11 10 0 Z", "#ee8b45"),
      D("M-4 -2 Q-10 -16 2 -25 Q13 -9 4 -2 Z", "#ffe4a3"),
    ],
    ["carry"],
  );
  add(
    "flashlight",
    "Flashlight",
    "Tools",
    [
      R(-8, -18, 16, 45, dark),
      D("M-8 -18 L-15 -36 L15 -36 L8 -18 Z", "#71899b"),
      E(0, -36, 15, 5, "#f9df8f"),
    ],
    ["reach"],
  );
  add(
    "shovel",
    "Shovel",
    "Tools",
    [
      D("M-10 -48 Q0 -66 10 -48 L7 -35 H-7 Z", "none", wood, 5),
      R(-3, -36, 6, 94, wood),
      D("M-15 55 H15 L13 83 Q0 104 -13 83 Z", metal),
    ],
    ["carry", "push"],
  );
  add(
    "pickaxe",
    "Pickaxe",
    "Tools",
    [R(-4, -26, 8, 115, wood), D("M-52 55 Q0 20 52 55 Q3 39 -52 55 Z", metal)],
    ["weapon-overhead"],
  );
  add(
    "wrench",
    "Wrench",
    "Tools",
    [
      R(-5, -15, 10, 56, metal),
      D("M-10 -10 Q-24 -34 -10 -44 L-10 -27 H10 V-44 Q24 -34 10 -10 Z", metal),
    ],
    ["reach"],
  );
  add(
    "tool-hammer",
    "Claw hammer",
    "Tools",
    [
      R(-4, -14, 8, 76, wood),
      D("M-22 44 H16 L29 59 L20 58 L12 53 H-22 Z", metal),
    ],
    ["weapon-overhead"],
  );
  add(
    "broom",
    "Broom",
    "Tools",
    [
      R(-3, -70, 6, 133, wood),
      D("M-11 48 H11 L27 93 H-27 Z", "#c9a259"),
      L(-6, 57, -15, 88, wood, 2),
      L(0, 57, 0, 88, wood, 2),
      L(6, 57, 15, 88, wood, 2),
    ],
    ["push"],
  );
  add(
    "umbrella",
    "Open umbrella",
    "Treasure and travel",
    [
      D(
        "M-60 -40 Q0 -115 60 -40 Q40 -52 20 -40 Q0 -52 -20 -40 Q-40 -52 -60 -40 Z",
        "#936aa5",
      ),
      L(0, -75, 0, 43, dark, 4),
      D("M0 43 Q0 63 17 49", "none", dark, 4),
    ],
    ["carry"],
  );
  add(
    "medical-kit",
    "Medical kit",
    "Tools",
    [
      R(-30, -20, 60, 47, "#e6eef0", 6),
      D("M-11 -20 V-31 H11 V-20", "none", dark, 4),
      R(-5, -8, 10, 25, "#cf6a6a"),
      R(-12, 0, 24, 9, "#cf6a6a"),
    ],
    ["carry", "heal"],
  );
  add(
    "toolbox",
    "Toolbox",
    "Tools",
    [
      R(-35, -18, 70, 43, "#bd7353", 5),
      R(-38, -21, 76, 10, dark),
      D("M-12 -22 V-34 H12 V-22", "none", dark, 4),
      R(-5, -13, 10, 16, gold),
    ],
    ["carry"],
  );
  add(
    "crate",
    "Wood crate",
    "Furniture and scenery",
    [
      R(-40, -40, 80, 80, wood),
      L(-34, -34, 34, 34, "#c29a70", 9),
      L(34, -34, -34, 34, "#c29a70", 9),
      L(-40, -17, 40, -17, dark, 2),
    ],
    ["carry", "push"],
    false,
  );
  add(
    "barrel",
    "Barrel",
    "Furniture and scenery",
    [
      D("M-27 -40 Q-42 0 -27 40 H27 Q42 0 27 -40 Z", wood),
      R(-33, -25, 66, 7, dark),
      R(-33, 18, 66, 7, dark),
      E(0, -40, 27, 7, "#b18b60"),
    ],
    ["push"],
    false,
  );
  add(
    "chair",
    "Chair",
    "Furniture and scenery",
    [
      R(-27, -80, 54, 52, "#9a7256"),
      R(-30, -28, 60, 10, wood),
      R(-25, -18, 7, 57, wood),
      R(18, -18, 7, 57, wood),
    ],
    ["sit"],
    false,
  );
  add(
    "table",
    "Small table",
    "Furniture and scenery",
    [
      R(-60, -40, 120, 12, wood),
      R(-50, -28, 8, 75, wood),
      R(42, -28, 8, 75, wood),
    ],
    ["sit"],
    false,
  );
  add(
    "treasure-chest",
    "Treasure chest",
    "Treasure and travel",
    [
      R(-43, -22, 86, 55, wood, 5),
      D("M-43 -22 Q-43 -58 0 -58 Q43 -58 43 -22 Z", "#b58a55"),
      R(-29, -41, 8, 73, gold),
      R(21, -41, 8, 73, gold),
      R(-7, -23, 14, 23, gold),
    ],
    ["carry"],
    false,
  );
  add(
    "signpost",
    "Blank signpost",
    "Furniture and scenery",
    [
      R(-5, -33, 10, 115, wood),
      D("M-48 -51 H38 L58 -32 L38 -13 H-48 Z", "#c4a16e"),
    ],
    [],
    false,
  );
  add(
    "rope-coil",
    "Coiled rope",
    "Treasure and travel",
    [
      E(0, 0, 28, 34, "none"),
      E(0, 0, 22, 28, "none"),
      E(0, 0, 16, 22, "none"),
      D("M22 18 Q40 24 34 49", "none", wood, 5),
    ],
    ["carry"],
  );
  add(
    "telescope",
    "Telescope",
    "Treasure and travel",
    [
      R(-7, -40, 14, 78, gold),
      R(-10, -45, 20, 12, dark),
      R(-10, 30, 20, 12, dark),
      L(-4, -22, -4, 23, "#f6d992", 3),
    ],
    ["point", "reach"],
  );
  add(
    "candle",
    "Candle",
    "Food and daily life",
    [
      R(-10, -20, 20, 44, "#eadbb1"),
      E(0, 25, 25, 6, gold),
      D("M0 -49 Q-16 -29 0 -24 Q16 -29 0 -49 Z", "#f5b253"),
    ],
    ["carry"],
  );
  add(
    "potion",
    "Potion flask",
    "Magic props",
    [
      D(
        "M-8 -35 H8 V-14 Q34 19 18 32 Q0 42 -18 32 Q-34 19 -8 -14 Z",
        "#a5d8dc",
      ),
      D("M-20 7 Q-30 31 0 34 Q30 31 20 7 Z", "#ac73dd"),
      R(-9, -41, 18, 10, wood),
    ],
    ["carry", "heal"],
  );
  add(
    "crystal-ball",
    "Crystal ball",
    "Magic props",
    [
      E(0, -8, 29, 29, "#9c88da"),
      E(-9, -18, 8, 7, "#d6d0f6"),
      D("M-23 15 L-31 33 H31 L23 15 Z", gold),
    ],
    ["channel-power"],
    false,
  );
  add(
    "soccer-ball",
    "Patterned ball",
    "Food and daily life",
    [
      E(0, 0, 28, 28, "#e9eff1"),
      D("M0 -13 L13 -4 L8 12 H-8 L-13 -4 Z", dark),
      L(0, -13, 0, -28, dark, 3),
      L(13, -4, 26, -9, dark, 3),
      L(8, 12, 17, 23, dark, 3),
      L(-8, 12, -17, 23, dark, 3),
    ],
    ["carry", "kick-front"],
  );
  add(
    "gift-box",
    "Gift box",
    "Food and daily life",
    [
      R(-28, -26, 56, 53, "#af7ebd"),
      R(-5, -26, 10, 53, gold),
      R(-28, -5, 56, 9, gold),
      E(-10, -31, 12, 7, "none"),
      E(10, -31, 12, 7, "none"),
    ],
    ["carry", "reach"],
  );
  add(
    "guitar",
    "Guitar",
    "Food and daily life",
    [
      E(0, 15, 23, 29, wood),
      E(0, -10, 17, 20, wood),
      R(-5, -76, 10, 66, dark),
      R(-7, -89, 14, 18, wood),
      E(0, -1, 8, 8, dark),
      L(-2, -80, -2, 32, metal, 1),
      L(2, -80, 2, 32, metal, 1),
    ],
    ["carry"],
    false,
  );
  function build(kind, id) {
    const d = defs.find((x) => x.id === kind);
    if (!d) throw Error("Unknown reusable prop");
    if (!/^[A-Za-z_][\w.-]*$/.test(id)) throw Error("Invalid prop ID");
    const node = {
      id,
      tag: "g",
      attrs: {},
      pose: { ...S.defaults },
      keys: [],
      children: d.shapes.map((s, i) => ({
        id: id + "_" + i,
        tag: s.tag,
        attrs: { ...s.attrs },
        pose: { ...S.defaults },
        keys: [],
        children: [],
      })),
      library: { role: "prop", kind, category: d.category },
      grip: { x: 0, y: 0, rotation: 0, handheld: d.grip },
    };
    return node;
  }
  const api = { items: defs.map(({ shapes, ...d }) => d), build };
  root.StudioSceneProps2D = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
