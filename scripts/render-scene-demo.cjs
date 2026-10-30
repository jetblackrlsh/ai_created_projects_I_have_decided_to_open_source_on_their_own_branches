/* Native SVG/canvas render. These are motion presets, not collision or combat simulation. */
const fs = require("node:fs"),
  path = require("node:path"),
  { spawn, spawnSync } = require("node:child_process"),
  { once } = require("node:events"),
  native = require("@napi-rs/canvas"),
  S = require("../app/core.js"),
  A = require("../app/audio.js"),
  P = require("../app/puppet-actions.js"),
  { renderStem } = require("./audio-export.cjs");
(async () => {
  const root = path.resolve(__dirname, ".."),
    out = path.join(root, "output/scene-library"),
    lib = JSON.parse(
      fs.readFileSync(
        path.join(root, "library/library.jet-audio-library.json"),
      ),
    ),
    all = S.blank();
  all.scenes = [];
  all.audio = [];
  all.audioAssets = {};
  const L = require("../app/scene-library.js");
  const p = JSON.parse(
    fs.readFileSync(path.join(out, "Scene-Library-Showcase.jet2d.json")),
  );
  // An individual scene for each overlay makes timing and transparency inspectable.
  for (const [i, fx] of L.effects.entries()) {
    const sc = {
      id: "overlay" + i,
      name: fx.label,
      duration: 2.5,
      background: "#26364e",
      nodes: [],
    };
    sc.nodes.push(
      L.background(i % 2 ? "city-night" : "meadow", "fxbg" + i, 960, 540),
    );
    sc.nodes.push(
      L.effect(fx.id, "overlayFx" + i, 0.15, 2.2, 480, 285, {
        width: 960,
        height: 540,
        intensity: 1,
      }),
    );
    p.scenes.push(sc);
  }
  p.audio = [];
  p.audioAssets = {};
  const music = lib.assets.find((x) => x.name === "Playfulness");
  A.add(p, music, 0, S.duration(p)).gain = 0.2;
  let t = 0;
  for (const sc of p.scenes) {
    const asset = lib.assets.find(
      (a) =>
        a.file ===
        (sc.name.includes("fire") || sc.name.includes("burst")
          ? "soft-impact.wav"
          : "servo.wav"),
    );
    if (asset) {
      const cue = A.add(p, asset, t + 0.4, Math.min(asset.duration, 0.5));
      cue.gain = 0.2;
    }
    t += sc.duration;
  }
  S.validate(p);
  A.validate(p);
  fs.writeFileSync(
    path.join(out, "Scene-Library-Showcase.jet2d.json"),
    JSON.stringify(p, null, 2),
  );
  const offset = S.duration(p),
    parts = [{ p, offset: 0 }];
  Object.assign(all, p);
  A.validate(all);
  const fps = 24,
    total = offset,
    c = native.createCanvas(960, 540),
    ctx = c.getContext("2d"),
    silent = path.join(out, "action-silent.mp4"),
    normal = path.join(out, "Scene-Library-Showcase.mp4"),
    fast = path.join(out, "Scene-Library-Showcase-2x.mp4");
  const ff = spawn(
    "ffmpeg",
    [
      "-v",
      "error",
      "-y",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgba",
      "-s",
      "960x540",
      "-r",
      String(fps),
      "-i",
      "pipe:0",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      silent,
    ],
    { stdio: ["pipe", "ignore", "pipe"] },
  );
  let err = "";
  ff.stderr.on("data", (b) => (err += b));
  ff.stdin.on("error", () => {});
  for (let i = 0; i < total * fps; i++) {
    const t = i / fps,
      part = parts.findLast((v) => v.offset <= t),
      local = t - part.offset,
      row = S.locate(part.p, local);
    ctx.drawImage(
      await native.loadImage(Buffer.from(S.render(part.p, local))),
      0,
      0,
    );
    ctx.fillStyle = "rgba(15,28,46,.85)";
    ctx.fillRect(0, 0, 960, 75);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 25px sans-serif";
    ctx.fillText(row.scene.name, 24, 31);
    ctx.font = "17px sans-serif";
    ctx.fillText(
      "Reusable SVG library · editable layers, grips and visual effects",
      24,
      58,
    );
    if (!ff.stdin.write(c.data())) await once(ff.stdin, "drain");
    if (i % 240 === 0) console.log("FRAME", i, "/", total * fps);
  }
  ff.stdin.end();
  if ((await once(ff, "close"))[0]) throw Error(err);
  const wav = path.join(out, "showcase-audio.wav");
  renderStem(all, wav, null);
  function run(args) {
    const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], {
      encoding: "utf8",
      maxBuffer: 20e6,
    });
    if (r.status) throw Error(r.stderr);
  }
  run([
    "-i",
    silent,
    "-i",
    wav,
    "-map",
    "0:v",
    "-map",
    "1:a",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-t",
    String(total),
    "-movflags",
    "+faststart",
    normal,
  ]);
  run([
    "-i",
    normal,
    "-filter_complex",
    "[0:v]setpts=PTS/2[v];[0:a]atempo=2[a]",
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-r",
    "48",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "20",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    fast,
  ]);
  for (const f of [normal, fast]) run(["-i", f, "-f", "null", "-"]);
  const report = {
    normal,
    fast,
    duration: total,
    frames: total * fps,
    musicCues: all.audio.filter((x) => x.kind === "music").length,
    sfxCues: all.audio.filter((x) => x.kind === "sfx").length,
    fullDecode: true,
    projects: parts.length,
  };
  fs.writeFileSync(
    path.join(out, "render-verification.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
