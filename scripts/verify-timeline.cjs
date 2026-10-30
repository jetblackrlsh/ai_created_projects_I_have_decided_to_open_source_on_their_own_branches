const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  S = require("../app/core.js"),
  T = require("../app/timeline.js");
function fixture() {
  const p = S.blank();
  p.scenes = [0, 1, 2].map((i) => ({
    ...S.clone(p.scenes[0]),
    id: "s" + i,
    name: "Scene " + i,
  }));
  const cue = (name, kind, start, duration, sourceDuration = 20) => ({
    name,
    kind,
    data: "data:audio/wav;base64,AAAA",
    start,
    duration,
    offset: 0,
    sourceDuration,
    gain: 0.5,
  });
  p.audio = [
    cue("music", "music", 0, 18),
    cue("first", "narration", 1, 3),
    cue("effect", "sfx", 8, 0.5),
    cue("last", "narration", 13, 3),
  ];
  return p;
}
let p = fixture();
T.resize(p, 0, 8);
S.validate(p);
assert.equal(p.audio.find((a) => a.name === "music").duration, 20);
assert.equal(p.audio.find((a) => a.name === "last").start, 15);
assert.equal(p.audio.find((a) => a.name === "effect").start, 10);
assert.equal(p.audio.find((a) => a.name === "first").start, 1);
p = fixture();
const original = JSON.stringify(p);
assert.throws(() => T.resize(p, 0, 10), /source duration/);
assert.equal(JSON.stringify(p), original);
assert.throws(() => T.resize(p, 0, 2), /cut|remove/);
assert.equal(JSON.stringify(p), original);
p = fixture();
T.duplicateAudio(p, 1);
p.scenes.splice(2, 0, { ...S.clone(p.scenes[1]), id: "copy" });
S.validate(p);
assert.equal(p.audio.find((a) => a.name === "last").start, 19);
assert.equal(p.audio.find((a) => a.name === "effect copy").start, 14);
assert.deepEqual(
  p.audio
    .filter((a) => a.kind === "music")
    .map((a) => [a.start, a.duration, a.offset]),
  [
    [0, 12, 0],
    [12, 6, 6],
    [18, 6, 12],
  ],
);
p = fixture();
T.deleteAudio(p, 1);
p.scenes.splice(1, 1);
S.validate(p);
assert.equal(p.audio.find((a) => a.name === "last").start, 7);
assert.ok(!p.audio.some((a) => a.name === "effect"));
assert.deepEqual(
  p.audio
    .filter((a) => a.kind === "music")
    .map((a) => [a.start, a.duration, a.offset]),
  [
    [0, 6, 0],
    [6, 6, 12],
  ],
);
p = fixture();
p.audio[1].duration = 8;
assert.throws(() => T.resize(p, 0, 8), /crosses/);
p = fixture();
p.audio[0].loop = true;
p.audio[0].sourceDuration = 5;
T.duplicateAudio(p, 1);
assert.ok(p.audio.filter((a) => a.kind === "music").every((a) => a.offset < 5));
const report = {
  tests: [
    "resize ripples later cues and extends crossing music without moving earlier narration",
    "unsafe shortening and source overrun reject atomically",
    "duplicate copies only source-interval audio and shifts following cues",
    "split source offsets preserve remaining audio after duplicate",
    "delete removes interval audio and ripples later cues",
    "cross-boundary narration requires explicit editing",
    "loop offsets wrap after splitting",
  ],
  scope: "Pure timeline transforms; UI uses its normal rollback/undo path.",
};
fs.mkdirSync(path.join(__dirname, "../output/timeline"), { recursive: true });
fs.writeFileSync(
  path.join(__dirname, "../output/timeline/verification.json"),
  JSON.stringify(report, null, 2),
);
console.log("PASS", report.tests.length, "scene/audio timeline checks");
