/* Original generic layered SVG sets. No story-specific names or images. */
(function (root) {
  "use strict";
  const S =
    root.Studio ||
    (typeof require === "function" ? require("./core.js") : null);
  const groups = {
    Nature: [
      "meadow",
      "deciduous-forest",
      "pine-forest",
      "rainforest",
      "swamp",
      "desert-dunes",
      "red-canyon",
      "snowy-forest",
      "tundra",
      "alpine-mountains",
      "tropical-beach",
      "open-ocean",
      "underwater-reef",
      "volcano",
      "crystal-cavern",
      "moonlit-forest",
    ],
    Fantasy: [
      "farmstead",
      "medieval-village",
      "castle-courtyard",
      "tavern-interior",
      "stone-dungeon",
      "ancient-temple",
      "misty-graveyard",
    ],
    Modern: [
      "western-town",
      "city-day",
      "city-night",
      "urban-alley",
      "city-park",
      "subway-platform",
      "office",
      "classroom",
      "hospital-room",
      "kitchen",
      "bedroom",
      "living-room",
      "warehouse",
    ],
    ScienceFiction: [
      "starship-bridge",
      "station-corridor",
      "alien-planet",
      "cyberpunk-street",
      "wasteland",
      "moon-base",
    ],
  };
  const items = Object.entries(groups).flatMap(([category, ids]) =>
    ids.map((id) => ({
      id,
      category,
      label: id
        .split("-")
        .map((x) => x[0].toUpperCase() + x.slice(1))
        .join(" "),
    })),
  );
  function build(kind, id, w = 960, h = 540) {
    if (!items.some((x) => x.id === kind))
      throw Error("Unknown reusable background");
    if (
      !/^[A-Za-z_][\w.-]*$/.test(id) ||
      ![w, h].every((x) => Number.isFinite(x) && x > 0 && x <= 10000)
    )
      throw Error("Invalid background bounds or ID");
    let serial = 0;
    const node = (tag, attrs = {}, children = []) => ({
      id: id + "_" + serial++,
      tag,
      attrs,
      pose: { ...S.defaults },
      keys: [],
      children,
    });
    const layers = [];
    let current;
    function layer(name) {
      current = node("g", {}, []);
      current.name = name;
      layers.push(current);
    }
    function add(tag, a) {
      if (/^#[0-9a-f]{8}$/i.test(a.fill || ""))
        a = {
          ...a,
          "fill-opacity": parseInt(a.fill.slice(7), 16) / 255,
          fill: a.fill.slice(0, 7),
        };
      const n = node(tag, a);
      current.children.push(n);
      return n;
    }
    const rect = (x, y, width, height, fill, rx = 0) =>
        add("rect", { x, y, width, height, fill, rx }),
      ell = (cx, cy, rx, ry, fill) => add("ellipse", { cx, cy, rx, ry, fill }),
      line = (x1, y1, x2, y2, stroke, width = 3) =>
        add("line", { x1, y1, x2, y2, stroke, "stroke-width": width }),
      path = (d, fill, stroke = "none", width = 1) =>
        add("path", { d, fill, stroke, "stroke-width": width });
    function tree(x, y, scale = 1, pine = false, snow = false) {
      rect(x - 8 * scale, y - 120 * scale, 16 * scale, 120 * scale, "#72533e");
      if (pine) {
        for (let k = 0; k < 3; k++)
          path(
            `M${x - 55 * scale + k * 9 * scale} ${y - (40 + k * 35) * scale} L${x} ${y - (150 + k * 20) * scale} L${x + 55 * scale - k * 9 * scale} ${y - (40 + k * 35) * scale} Z`,
            snow ? "#d7e8eb" : ["#397775", "#2f6765", "#285958"][k],
          );
      } else {
        ell(
          x,
          y - 135 * scale,
          58 * scale,
          44 * scale,
          snow ? "#d8e9eb" : "#4b8a68",
        );
        ell(
          x - 30 * scale,
          y - 115 * scale,
          40 * scale,
          36 * scale,
          snow ? "#e9f3f2" : "#3b7859",
        );
      }
    }
    function mountain(x, y, width, height, color) {
      path(
        `M${x - width / 2} ${y} L${x} ${y - height} L${x + width / 2} ${y} Z`,
        color,
      );
      path(
        `M${x - width * 0.13} ${y - height * 0.74} L${x} ${y - height} L${x + width * 0.15} ${y - height * 0.7} L${x + width * 0.03} ${y - height * 0.78} Z`,
        "#e5ece7",
      );
    }
    function house(
      x,
      y,
      width = 140,
      height = 100,
      wall = "#d9b98b",
      roof = "#9e6260",
    ) {
      rect(x, y - height, width, height, wall);
      path(
        `M${x - 12} ${y - height} L${x + width * 0.5} ${y - height - 60} L${x + width + 12} ${y - height} Z`,
        roof,
      );
      rect(x + width * 0.43, y - 55, width * 0.18, 55, "#6b5142");
      rect(x + 15, y - height + 20, 25, 30, "#80b7ca");
      rect(x + width - 42, y - height + 20, 25, 30, "#80b7ca");
    }
    function window(x, y, width = 150, height = 120, night = false) {
      rect(x - 6, y - 6, width + 12, height + 12, "#455b70");
      rect(x, y, width, height, night ? "#152b4c" : "#91c7dc");
      line(x + width / 2, y, x + width / 2, y + height, "#e0e4df", 6);
      line(x, y + height / 2, x + width, y + height / 2, "#e0e4df", 6);
    }
    function floor(color = "#ad9275") {
      rect(0, 365, 960, 175, color);
      for (let y = 390; y < 540; y += 40) line(0, y, 960, y, "#89715d", 1);
      for (let x = 0; x < 1100; x += 120) line(480, 365, x, 540, "#89715d", 1);
    }
    function shelf(x, y, width = 180, height = 220) {
      rect(x, y, width, height, "#715344");
      for (let k = 0; k < 4; k++) {
        rect(x + 8, y + 14 + k * 51, width - 16, 35, "#493c38");
        for (let j = 0; j < 7; j++)
          rect(
            x + 14 + (j * (width - 24)) / 7,
            y + 17 + k * 51,
            12 + (j % 2) * 3,
            31,
            ["#799a9f", "#c99572", "#9d82ac"][j % 3],
          );
      }
    }
    const night = /night|moonlit|cyberpunk|graveyard/.test(kind),
      interior =
        /interior|dungeon|temple|office|classroom|hospital|kitchen|bedroom|living-room|warehouse|bridge|corridor|platform/.test(
          kind,
        );
    layer("sky-or-wall");
    rect(0, 0, 960, 540, night ? "#18283f" : interior ? "#d7d8d3" : "#8bc5dc");
    if (!interior) {
      ell(
        770,
        85,
        night ? 30 : 42,
        night ? 30 : 42,
        night ? "#eee8c7" : "#f5df9d",
      );
      if (night)
        for (let i = 0; i < 35; i++)
          ell((i * 137) % 960, 30 + ((i * 67) % 220), 1.8, 1.8, "#dfe9ec");
      else
        for (let x of [100, 380, 620]) {
          ell(x, 85, 66, 15, "#d4e8eb");
          ell(x + 30, 71, 38, 20, "#d4e8eb");
        }
    }
    layer("distant-set");
    if (
      [
        "meadow",
        "deciduous-forest",
        "pine-forest",
        "rainforest",
        "swamp",
        "snowy-forest",
        "tundra",
        "alpine-mountains",
        "moonlit-forest",
        "farmstead",
      ].includes(kind)
    ) {
      const snow = /snow|tundra|alpine/.test(kind),
        marsh = kind === "swamp";
      for (let j = 0; j < 5; j++)
        mountain(
          j * 240 - 20,
          320,
          400,
          kind === "tundra"
            ? 45 + (j % 2) * 20
            : kind === "alpine-mountains"
              ? 240 + (j % 2) * 65
              : 140 + (j % 2) * 75,
          night ? "#314657" : snow ? "#96aebc" : "#6a9b91",
        );
      layer("middle-ground");
      path(
        "M0 310 Q200 270 420 325 T960 300 V540 H0 Z",
        snow ? "#dbe8e6" : marsh ? "#648b80" : night ? "#315b54" : "#80ad72",
      );
      if (!["meadow", "tundra", "alpine-mountains", "farmstead"].includes(kind))
        for (let j = 0; j < 9; j++)
          tree(
            j * 130 - 20,
            370 + (j % 2) * 20,
            kind === "rainforest" ? 1.45 : 1,
            /pine|snow/.test(kind),
            snow,
          );
      if (kind === "farmstead") {
        house(110, 355, 180, 100, "#b76456", "#714f4b");
        rect(630, 260, 65, 95, "#d3cfb6");
        ell(662, 260, 33, 17, "#858b8b");
        for (let j = 0; j < 6; j++) {
          line(480 + j * 70, 400, 480 + j * 70, 450, "#d3bf8f", 6);
          line(480, 416, 920, 416, "#d3bf8f", 5);
        }
      }
      if (marsh) {
        ell(510, 425, 320, 70, "#497776");
        for (let j = 0; j < 13; j++)
          ell(280 + j * 40, 410 + (j % 3) * 13, 14, 6, "#8fab70");
      } else if (!snow)
        path("M430 350 Q410 410 240 540 H620 Q500 420 520 350 Z", "#c9bb8e");
      if (kind === "rainforest")
        for (let x of [70, 890])
          path(`M${x} 0 Q${x + 50} 130 ${x} 260`, "none", "#365e4e", 8);
      layer("foreground");
      if (kind === "alpine-mountains") {
        path("M0 540 V460 L70 420 L160 480 L220 540 Z", "#738b99");
        path("M960 540 V410 L870 390 L780 540 Z", "#849aa4");
      }
      if (kind === "tundra")
        for (let j = 0; j < 16; j++) {
          const x = j * 67;
          ell(x, 460 + (j % 3) * 23, 18, 7, "#a4afa3");
        }
      if (kind === "meadow")
        for (let j = 0; j < 24; j++) {
          const x = (j * 83) % 960;
          line(x, 485, x, 470, "#477550", 2);
          ell(x, 468, 4, 4, ["#e9b5b7", "#f1dc91"][j % 2]);
        }
      if (!marsh && !["tundra", "alpine-mountains"].includes(kind))
        for (let x of [20, 920])
          tree(x, 550, 0.8, /pine|snow/.test(kind), snow);
    } else if (["desert-dunes", "red-canyon", "wasteland"].includes(kind)) {
      const canyon = kind === "red-canyon",
        waste = kind === "wasteland";
      rect(0, 250, 960, 290, waste ? "#a7a18a" : "#d7af76");
      for (let j = 0; j < 4; j++)
        path(
          `M${j * 300 - 200} 390 Q${j * 300 + 80} ${250 - j * 8} ${j * 300 + 350} 390 V540 H${j * 300 - 200} Z`,
          waste ? "#87897a" : ["#bc8e5e", "#c99a67"][j % 2],
        );
      if (canyon)
        for (let x of [0, 720]) {
          path(
            `M${x} 120 L${x + 160} 90 L${x + 240} 400 L${x - 50} 400 Z`,
            "#af6954",
          );
          for (let y of [170, 230, 300]) line(x, y, x + 170, y, "#d69069", 8);
        }
      layer("foreground");
      if (waste) {
        for (let x of [60, 800]) {
          rect(x, 270, 65, 140, "#676e69");
          path(
            `M${x} 270 L${x + 14} 240 L${x + 30} 270 L${x + 52} 231 L${x + 65} 270 Z`,
            "#676e69",
          );
        }
        rect(680, 422, 180, 25, "#62675e");
      } else {
        for (let x of [90, 840]) {
          line(x, 460, x, 355, "#57826c", 13);
          path(
            `M${x} 403 H${x - 28} V375 M${x} 418 H${x + 28} V382`,
            "none",
            "#57826c",
            10,
          );
        }
      }
    } else if (
      ["tropical-beach", "open-ocean", "underwater-reef"].includes(kind)
    ) {
      const under = kind === "underwater-reef";
      rect(0, under ? 0 : 235, 960, 540, under ? "#287f9d" : "#4298b1");
      for (let j = 0; j < 10; j++)
        path(
          `M0 ${250 + j * 22} Q120 ${242 + j * 22} 240 ${250 + j * 22} T480 ${250 + j * 22} T720 ${250 + j * 22} T960 ${250 + j * 22}`,
          "none",
          "#8ccbd0",
          2,
        );
      if (kind !== "open-ocean") {
        layer("middle-ground");
        path(
          "M0 420 Q340 340 960 435 V540 H0 Z",
          under ? "#b8c69e" : "#ead5a6",
        );
      }
      if (kind === "tropical-beach")
        for (let x of [60, 850]) {
          path(`M${x} 480 Q${x + 38} 320 ${x + 10} 205`, "none", "#94734f", 18);
          for (let dx of [-90, -40, 60, 105])
            path(
              `M${x + 10} 205 Q${x + dx} 148 ${x + dx} 265 Q${x + dx * 0.4} 212 ${x + 10} 205 Z`,
              "#397c63",
            );
        }
      if (under) {
        layer("foreground");
        for (let j = 0; j < 12; j++) {
          const x = j * 90;
          path(
            `M${x} 540 Q${x - 30} 470 ${x} 430 Q${x + 25} 470 ${x + 10} 540 Z`,
            j % 2 ? "#56a99a" : "#b58cab",
          );
        }
        for (let j = 0; j < 7; j++) {
          const x = 100 + j * 120,
            y = 100 + (j % 3) * 75;
          ell(x, y, 18, 8, j % 2 ? "#e5bb76" : "#9ad6d3");
          path(`M${x + 15} ${y} L${x + 29} ${y - 10} V${y + 10} Z`, "#e5bb76");
        }
      }
    } else if (["volcano", "crystal-cavern"].includes(kind)) {
      rect(0, 0, 960, 540, kind === "volcano" ? "#4e3c4b" : "#283651");
      layer("middle-ground");
      if (kind === "volcano") {
        path("M140 440 L370 160 L470 160 L710 440 Z", "#69505a");
        path(
          "M370 160 L397 192 L425 166 L448 198 L470 160 L520 370 L462 310 L435 400 L394 275 Z",
          "#ef9560",
        );
        path("M0 480 Q420 400 960 475 V540 H0 Z", "#d26a51");
      } else {
        for (let j = 0; j < 10; j++) {
          const x = j * 115 - 40;
          path(
            `M${x} 0 L${x + 40} ${130 + (j % 3) * 55} L${x + 100} 0 Z`,
            "#465c78",
          );
        }
        for (let x of [50, 150, 750, 850])
          path(
            `M${x} 490 L${x - 20} 350 L${x + 10} 285 L${x + 40} 370 L${x + 27} 490 Z`,
            "#9f8bd2",
            "#d4c9f0",
            2,
          );
        rect(220, 420, 500, 120, "#465371");
      }
    } else if (
      [
        "medieval-village",
        "castle-courtyard",
        "western-town",
        "city-day",
        "city-night",
        "urban-alley",
        "city-park",
        "cyberpunk-street",
      ].includes(kind)
    ) {
      const city = /city|alley|cyberpunk/.test(kind);
      if (city) {
        for (let j = 0; j < 9; j++) {
          const x = j * 122 - 35,
            y = 140 + (j % 3) * 35;
          rect(x, y, 110, 280, night ? "#33465d" : "#6c8795");
          for (let row = 0; row < 5; row++)
            for (let col = 0; col < 3; col++)
              rect(
                x + 14 + col * 28,
                y + 17 + row * 43,
                14,
                22,
                night ? "#eacb80" : "#bdd6db",
              );
        }
      } else if (kind === "castle-courtyard") {
        rect(0, 170, 960, 245, "#9aa8ab");
        for (let x of [70, 780]) {
          rect(x, 90, 110, 325, "#b2bcb8");
          for (let z = 0; z < 4; z++) rect(x + z * 30, 72, 20, 25, "#b2bcb8");
        }
        path("M390 415 V240 Q480 140 570 240 V415 Z", "#445568");
      } else if (kind === "western-town") {
        for (let j = 0; j < 4; j++) {
          let x = 40 + j * 240;
          rect(x, 200 + (j % 2) * 25, 190, 210, "#bb9470");
          rect(x - 8, 185 + (j % 2) * 25, 206, 35, "#8b6555");
          for (let k = 0; k < 2; k++) window(x + 15 + k * 100, 240, 65, 60);
          rect(x + 77, 330, 40, 80, "#674e40");
        }
      } else {
        house(40, 410, 200, 150);
        house(340, 410, 180, 120, "#d5c395", "#627d7c");
        house(660, 410, 220, 170, "#c5ad91", "#85637c");
      }
      layer("middle-ground");
      rect(
        0,
        410,
        960,
        130,
        kind === "city-park" ? "#77a174" : city ? "#66747d" : "#c7b28c",
      );
      if (city && kind !== "city-park") {
        rect(0, 448, 960, 92, "#43515f");
        for (let x = 0; x < 960; x += 180) rect(x, 492, 100, 6, "#d8d6b5");
      }
      if (kind === "urban-alley") {
        rect(0, 80, 210, 460, "#796c73");
        rect(780, 40, 180, 500, "#586b78");
        rect(30, 410, 110, 85, "#4b7064");
        line(120, 90, 120, 400, "#a5a2a0", 9);
      }
      if (kind === "city-park") {
        for (let x of [100, 820]) tree(x, 440, 1.4);
        rect(350, 410, 220, 14, "#896c52");
        rect(360, 360, 200, 35, "#896c52");
        line(370, 420, 370, 460, "#3b4d55", 6);
        line(550, 420, 550, 460, "#3b4d55", 6);
      }
      if (kind === "cyberpunk-street") {
        for (let x of [55, 775]) {
          rect(x, 230, 115, 40, "#b45d9c");
          line(x + 12, 245, x + 100, 245, "#b9edeb", 5);
        }
        line(0, 446, 960, 446, "#69c6cb", 5);
      }
    } else if (
      [
        "tavern-interior",
        "stone-dungeon",
        "ancient-temple",
        "misty-graveyard",
      ].includes(kind)
    ) {
      const grave = kind === "misty-graveyard";
      if (!grave) {
        rect(
          0,
          0,
          960,
          365,
          kind === "tavern-interior" ? "#a07c61" : "#788991",
        );
        for (let y = 35; y < 365; y += 60) line(0, y, 960, y, "#5a686e", 2);
        for (let y = 0; y < 360; y += 60)
          for (let x = 40 + (y % 120 ? 70 : 0); x < 960; x += 140)
            line(x, y, x, y + 60, "#5a686e", 2);
        floor(kind === "tavern-interior" ? "#a98b68" : "#89958f");
      } else {
        rect(0, 335, 960, 205, "#475c58");
        for (let x of [30, 850]) tree(x, 380, 1.2);
      }
      if (kind === "tavern-interior") {
        shelf(60, 100, 230, 190);
        rect(20, 300, 350, 85, "#705545");
        window(660, 80, 180, 160);
        rect(650, 365, 230, 12, "#6e5240");
        rect(670, 377, 12, 80, "#6e5240");
        rect(850, 377, 12, 80, "#6e5240");
      } else if (kind === "stone-dungeon") {
        path("M360 365 V160 Q480 50 600 160 V365 Z", "#273944");
        for (let x = 390; x < 600; x += 35) line(x, 140, x, 365, "#9babb0", 9);
        line(360, 235, 600, 235, "#9babb0", 8);
      } else if (kind === "ancient-temple") {
        for (let x of [90, 275, 675, 860]) {
          rect(x - 24, 75, 48, 290, "#bdc6bb");
          rect(x - 38, 65, 76, 20, "#d5d7c7");
          rect(x - 38, 350, 76, 20, "#d5d7c7");
        }
        rect(395, 310, 170, 55, "#bac1ad");
        ell(480, 235, 42, 55, "#c3aa6d");
      } else {
        for (let j = 0; j < 8; j++) {
          const x = 60 + j * 120,
            y = 375 + (j % 2) * 65;
          rect(x, y - 55, 40, 70, "#a7afaa", 16);
          line(x + 20, y - 37, x + 20, y - 5, "#687a79", 3);
          line(x + 10, y - 25, x + 30, y - 25, "#687a79", 3);
        }
        ell(480, 435, 450, 24, "#9fb2b280");
      }
    } else if (
      [
        "starship-bridge",
        "station-corridor",
        "alien-planet",
        "moon-base",
      ].includes(kind)
    ) {
      rect(0, 0, 960, 540, "#172c48");
      if (kind === "alien-planet" || kind === "moon-base") {
        ell(250, 110, 85, 85, "#9a83c0");
        ell(290, 87, 22, 22, "#b7a3d6");
        path(
          "M0 350 Q180 270 420 360 T960 330 V540 H0 Z",
          kind === "moon-base" ? "#929ea8" : "#a598b5",
        );
        layer("middle-ground");
        if (kind === "moon-base") {
          ell(450, 360, 180, 90, "#c1cbd0");
          rect(270, 360, 360, 75, "#c1cbd0");
          rect(430, 340, 55, 95, "#465f79");
          for (let x of [320, 550]) rect(x, 330, 70, 35, "#6ca8bd");
          line(780, 400, 780, 190, "#c9c9c3", 5);
          path("M780 190 L850 210 L780 230 Z", "#d9ac70");
        } else {
          for (let x of [60, 800]) {
            path(`M${x} 440 Q${x + 60} 300 ${x} 200`, "none", "#5b8e9c", 18);
            ell(x, 200, 60, 25, "#80b9b6");
          }
          for (let j = 0; j < 7; j++)
            ell(j * 140, 450 + (j % 2) * 20, 35, 12, "#6b6890");
        }
      } else {
        floor("#687d91");
        if (kind === "starship-bridge") {
          path("M100 60 H860 L790 280 H170 Z", "#0c1b35", "#8da7b5", 12);
          for (let j = 0; j < 30; j++)
            ell(
              150 + ((j * 123) % 660),
              80 + ((j * 47) % 170),
              2,
              2,
              "#dbe9eb",
            );
          for (let x of [60, 650]) {
            path(
              `M${x} 330 L${x + 210} 330 L${x + 250} 430 L${x - 20} 430 Z`,
              "#445f76",
            );
            rect(x + 20, 345, 140, 36, "#79bcc7");
          }
        } else {
          for (let j = 0; j < 5; j++) {
            const v = j * 62;
            path(
              `M${v} 0 L${300 + v * 0.3} 300 H${660 - v * 0.3} L${960 - v} 0`,
              "none",
              "#7e9ba9",
              8,
            );
          }
          rect(390, 200, 180, 165, "#85aebd");
          rect(420, 235, 120, 130, "#29455c");
          line(0, 415, 390, 365, "#8fe1df", 5);
          line(960, 415, 570, 365, "#8fe1df", 5);
        }
      }
    } else {
      // Distinct commonplace interior furnishings with a clear foreground acting area.
      rect(
        0,
        0,
        960,
        365,
        kind === "hospital-room"
          ? "#c7dedc"
          : kind === "subway-platform"
            ? "#8ca3ae"
            : "#d4cfc3",
      );
      floor(kind === "subway-platform" ? "#829497" : "#ad947c");
      if (kind === "office") {
        window(60, 70, 270, 160);
        for (let x of [400, 700]) {
          rect(x, 290, 200, 12, "#8c6f55");
          rect(x + 10, 302, 10, 95, "#59676d");
          rect(x + 180, 302, 10, 95, "#59676d");
          rect(x + 55, 210, 90, 65, "#3f566a");
          rect(x + 95, 275, 10, 16, "#3f566a");
        }
      } else if (kind === "classroom") {
        rect(170, 60, 620, 210, "#4b7168");
        rect(160, 270, 640, 8, "#c0ab82");
        for (let x of [70, 700]) {
          rect(x, 330, 190, 12, "#a78a65");
          rect(x + 15, 342, 9, 60, "#5b6872");
          rect(x + 165, 342, 9, 60, "#5b6872");
        }
      } else if (kind === "hospital-room") {
        window(70, 65, 220, 160);
        rect(380, 300, 350, 85, "#8aa7aa");
        rect(390, 275, 330, 50, "#e7efea", 12);
        rect(405, 265, 90, 35, "#c0d3cf", 8);
        rect(770, 110, 110, 90, "#50697a");
        path(
          "M780 160 H805 L816 135 L827 174 L840 151 H868",
          "none",
          "#83d5b7",
          3,
        );
        line(315, 130, 315, 390, "#788b91", 5);
        rect(300, 140, 30, 65, "#b9d9dd", 6);
      } else if (kind === "kitchen") {
        for (let x = 30; x < 960; x += 180) {
          rect(x, 65, 155, 100, "#b3916d");
          rect(x, 285, 155, 90, "#b3916d");
          rect(x - 4, 275, 163, 12, "#d6dcd2");
        }
        rect(740, 160, 180, 215, "#dce0d9");
        line(740, 245, 920, 245, "#99a6a3", 3);
        rect(800, 260, 12, 50, "#879b9c");
        ell(290, 275, 53, 12, "#628392");
      } else if (kind === "bedroom") {
        window(65, 65, 180, 150);
        rect(350, 270, 400, 115, "#8e7197", 12);
        rect(350, 250, 400, 58, "#ba9fc0", 8);
        rect(380, 235, 110, 35, "#e6d7dc", 8);
        rect(800, 295, 100, 85, "#997956");
        rect(830, 220, 12, 75, "#657484");
        path("M800 225 L815 165 H860 L875 225 Z", "#e7c786");
      } else if (kind === "living-room") {
        window(65, 65, 190, 155);
        rect(340, 230, 360, 135, "#73938e", 25);
        rect(320, 270, 35, 105, "#527775", 12);
        rect(685, 270, 35, 105, "#527775", 12);
        rect(795, 110, 130, 90, "#455a70");
        rect(770, 245, 165, 120, "#9e7a59");
      } else if (kind === "warehouse") {
        for (let x of [50, 650]) {
          rect(x, 80, 250, 290, "#627884");
          for (let y of [130, 240, 350]) line(x, y, x + 250, y, "#b7c1bd", 8);
          for (let j = 0; j < 6; j++)
            rect(
              x + 15 + (j % 3) * 80,
              145 + Math.floor(j / 3) * 110,
              65,
              85,
              ["#aa865d", "#bf9c73"][j % 2],
            );
        }
      } else if (kind === "subway-platform") {
        rect(0, 150, 960, 190, "#d5d8d3");
        for (let x = 25; x < 960; x += 185) {
          rect(x, 170, 115, 90, "#436479", 7);
          line(x + 140, 150, x + 140, 340, "#758a96", 3);
        }
        rect(0, 340, 960, 28, "#394e62");
        line(0, 390, 960, 390, "#e5c368", 12);
        for (let x of [60, 830]) rect(x, 35, 25, 350, "#647c88");
      } else {
        window(100, 70);
        shelf(650, 90);
      }
    }
    const rootNode = {
      id,
      tag: "g",
      attrs: {},
      pose: { ...S.defaults, scaleX: w / 960, scaleY: h / 540 },
      keys: [],
      children: layers,
      library: {
        role: "background",
        kind,
        category: items.find((x) => x.id === kind).category,
      },
    };
    return rootNode;
  }
  const api = { items, build };
  root.StudioSceneBackgrounds2D = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
