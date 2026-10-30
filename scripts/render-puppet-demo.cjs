/* Native rendering of the rig demonstration; not a browser-recording test. */
const fs = require("node:fs"),
  path = require("node:path"),
  { spawn, spawnSync } = require("node:child_process"),
  { once } = require("node:events"),
  native = require("@napi-rs/canvas"),
  S = require("../app/core.js");
(async () => {
  const root = path.resolve(__dirname, ".."),
    out = path.join(root, "output/puppet"),
    p = JSON.parse(
      fs.readFileSync(path.join(out, "Articulated-Puppet-Demo.jet2d.json")),
    ),
    fps = 24,
    total = S.duration(p),
    canvas = native.createCanvas(960, 540),
    ctx = canvas.getContext("2d");
  S.validate(p);
  const silent = path.join(out, "motion-silent.mp4"),
    normal = path.join(out, "Articulated-Puppet-Demo.mp4"),
    fast = path.join(out, "Articulated-Puppet-Demo-2x.mp4");
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
  let errors = "";
  ff.stderr.on("data", (b) => (errors += b));
  ff.stdin.on("error", () => {});
  for (let i = 0; i < total * fps; i++) {
    const t = i / fps,
      row = S.locate(p, t),
      im = await native.loadImage(Buffer.from(S.render(p, t)));
    ctx.drawImage(im, 0, 0);
    ctx.fillStyle = "#24334d";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Articulated blank person · " + row.scene.name, 35, 50);
    ctx.font = "17px sans-serif";
    ctx.fillText(
      "17 skeletal controls · reusable motion · restylable SVG parts",
      35,
      83,
    );
    ctx.fillText(
      "Front-view motion study · no automatic foot planting or lip sync",
      35,
      515,
    );
    if (!ff.stdin.write(canvas.data())) await once(ff.stdin, "drain");
    if (i % 120 === 0) console.log("FRAME", i, "/", total * fps);
  }
  ff.stdin.end();
  const [code] = await once(ff, "close");
  if (code) throw Error(errors);
  let r = spawnSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-y",
      "-i",
      silent,
      "-stream_loop",
      "-1",
      "-i",
      path.join(root, "library/Tranquility.wav"),
      "-filter_complex",
      `[1:a]volume=0.12,afade=t=in:d=1,afade=t=out:st=${total - 1}:d=1[a]`,
      "-map",
      "0:v",
      "-map",
      "[a]",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-t",
      String(total),
      "-movflags",
      "+faststart",
      normal,
    ],
    { encoding: "utf8" },
  );
  if (r.status) throw Error(r.stderr);
  r = spawnSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-y",
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
    ],
    { encoding: "utf8" },
  );
  if (r.status) throw Error(r.stderr);
  for (const f of [normal, fast]) {
    r = spawnSync("ffmpeg", ["-v", "error", "-i", f, "-f", "null", "-"], {
      encoding: "utf8",
    });
    if (r.status) throw Error(r.stderr);
  }
  console.log(
    JSON.stringify({
      normal,
      fast,
      duration: total,
      frames: total * fps,
      music: "Tranquility",
      fullDecode: true,
    }),
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
