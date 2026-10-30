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
    out = path.join(root, "output/puppet-actions"),
    lib = JSON.parse(
      fs.readFileSync(
        path.join(root, "library/library.jet-audio-library.json"),
      ),
    ),
    all = S.blank();
  all.scenes = [];
  all.audio = [];
  all.audioAssets = {};
  let offset = 0;
  const parts = [];
  for (const cat of ["Combat", "Powers", "Emotions"]) {
    const file = path.join(out, cat + "-Presets-Demo.jet2d.json"),
      p = JSON.parse(fs.readFileSync(file));
    p.audio = [];
    p.audioAssets = {};
    const music = lib.assets.find(
      (x) =>
        x.name ===
        {
          Combat: "Determination",
          Powers: "Suspense",
          Emotions: "Playfulness",
        }[cat],
    );
    A.add(p, music, 0, S.duration(p)).gain = 0.12;
    let t = 0;
    for (const sc of p.scenes) {
      const action = P.expandedActions.find(
          (a) => P.actionInfo[a].label === sc.name,
        ),
        info = P.actionInfo[action];
      if (cat !== "Emotions") {
        const filename =
          cat === "Powers"
            ? "servo.wav"
            : action.startsWith("weapon") || action.startsWith("block")
              ? "blade-clang.wav"
              : "soft-impact.wav";
        const asset = lib.assets.find(
          (a) => a.file === filename || a.name === filename.replace(".wav", ""),
        );
        if (asset) {
          const cue = A.add(
            p,
            asset,
            t + sc.duration * info.peak,
            Math.min(asset.duration, 0.5),
          );
          cue.gain = 0.16;
        }
      }
      t += sc.duration;
    }
    S.validate(p);
    fs.writeFileSync(file, JSON.stringify(p, null, 2));
    parts.push({ p, offset });
    all.scenes.push(...p.scenes);
    all.audioAssets = { ...all.audioAssets, ...p.audioAssets };
    all.audio.push(...p.audio.map((a) => ({ ...a, start: a.start + offset })));
    offset += S.duration(p);
  }
  A.validate(all);
  const fps = 24,
    total = offset,
    c = native.createCanvas(960, 540),
    ctx = c.getContext("2d"),
    silent = path.join(out, "action-silent.mp4"),
    normal = path.join(out, "Action-Presets-Showcase.mp4"),
    fast = path.join(out, "Action-Presets-Showcase-2x.mp4");
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
    ctx.fillStyle = "#24334d";
    ctx.font = "bold 27px sans-serif";
    ctx.fillText(row.scene.name, 30, 42);
    ctx.font = "18px sans-serif";
    ctx.fillText(
      "38 new actions · editable SVG puppets · same motion, restyled and mirrored",
      30,
      74,
    );
    ctx.font = "16px sans-serif";
    ctx.fillText("Blank base", 225, 490);
    ctx.fillText("Restyled + mirrored", 610, 490);
    ctx.fillText(
      "Front-view FK · optional props/effects · no IK, hit detection or automatic lip sync",
      30,
      522,
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
