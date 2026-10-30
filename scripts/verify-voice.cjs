const fs = require("fs"),
  path = require("path"),
  assert = require("assert/strict"),
  { JSDOM } = require("jsdom"),
  { spawnSync } = require("child_process");
(async () => {
  const root = path.resolve(__dirname, ".."),
    dom = new JSDOM("<!doctype html>", { runScripts: "outside-only" }),
    w = dom.window,
    out = path.join(root, "output/voice");
  fs.mkdirSync(out, { recursive: true });
  for (const f of ["vendor/voice/voice.bundle.js", "app/voice-tools.js"])
    w.eval(fs.readFileSync(path.join(root, f), "utf8"));
  const results = [];
  for (const preset of Object.keys(w.StudioVoice.presets)) {
    const r = w.VoiceTools2D.generate(
      "Every world begins with an idea.",
      preset,
    );
    assert.ok(r.info.duration > 0.5 && r.info.duration < 10);
    const file = path.join(out, preset + ".wav");
    fs.writeFileSync(file, r.bytes);
    const ff = spawnSync(
      "ffmpeg",
      ["-v", "error", "-i", file, "-f", "null", "-"],
      { encoding: "utf8" },
    );
    assert.equal(ff.status, 0, ff.stderr);
    results.push({
      preset,
      duration: r.info.duration,
      bytes: r.bytes.length,
      fullDecode: true,
    });
  }
  assert.throws(() => w.VoiceTools2D.generate("", "narrator"), /Enter/);
  assert.throws(() => w.VoiceTools2D.generate("hello", "missing"), /Unknown/);
  assert.throws(() => w.VoiceTools2D.wavInfo(new w.Uint8Array(20)), /Invalid/);
  fs.writeFileSync(
    path.join(out, "verification.json"),
    JSON.stringify(
      {
        results,
        scope:
          "Actual bundled synthesis executed in jsdom, every WAV fully decoded by FFmpeg. Not physical browser playback or listening review.",
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results));
  dom.window.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
