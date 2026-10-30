const assert = require("assert/strict"),
  fs = require("fs"),
  path = require("path");
global.Studio = require("../app/core.js");
global.AudioModel = require("../app/audio.js");
const R = require("../app/recorder.js");
(async () => {
  const p = Studio.blank();
  p.scenes[0].duration = 2;
  p.scenes.push({ ...Studio.clone(p.scenes[0]), id: "scene2" });
  const data = "data:audio/wav;base64,AAAA";
  p.audio = [
    {
      kind: "narration",
      name: "voice",
      data,
      start: 1,
      offset: 0,
      duration: 1,
      gain: 0.9,
    },
    {
      kind: "music",
      name: "music",
      data,
      start: 0,
      offset: 0,
      duration: 4,
      gain: 0.2,
      duck: 0.5,
      fadeIn: 0.2,
      fadeOut: 0.2,
    },
  ];
  const range = R.plan(p, 1, 1);
  assert.deepEqual([range.start, range.end, range.duration], [2, 4, 2]);
  assert.equal(range.cues.length, 1);
  assert.throws(() => R.plan(p, 1, 0), /range/);
  const curve = R.controls(p, p.audio[1], 0.253, 3.913);
  for (const point of curve.slice(0, -1))
    assert.equal(point.value, AudioModel.gainAt(p, p.audio[1], point.time));
  assert.equal(curve[0].time, 0.253);
  assert.equal(curve.at(-1).time, 3.913);
  let stopped = 0,
    closed = 0,
    started = 0,
    failedImage = false,
    context;
  class Stream {
    constructor(tracks) {
      this.tracks = tracks || [
        {
          kind: "video",
          stop() {
            stopped++;
          },
        },
      ];
    }
    getTracks() {
      return this.tracks;
    }
    getVideoTracks() {
      return this.tracks.filter((t) => t.kind === "video");
    }
    getAudioTracks() {
      return this.tracks.filter((t) => t.kind === "audio");
    }
  }
  global.document = {
    hidden: false,
    createElement() {
      return {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage() {} }),
        captureStream: () => new Stream(),
      };
    },
  };
  global.Image = class {
    async decode() {
      if (failedImage) throw Error("bad image");
    }
  };
  global.MediaStream = Stream;
  global.requestAnimationFrame = (fn) => setImmediate(fn);
  global.cancelAnimationFrame = clearImmediate;
  global.AudioContext = class {
    constructor() {
      this.t = 0;
      this.state = "running";
      context = this;
    }
    get currentTime() {
      return this.state === "running" ? (this.t += 0.4) : this.t;
    }
    async resume() {
      this.state = "running";
    }
    async suspend() {
      this.state = "suspended";
    }
    async close() {
      this.state = "closed";
      closed++;
    }
    createMediaStreamDestination() {
      return {
        stream: new Stream([
          {
            kind: "audio",
            stop() {
              stopped++;
            },
          },
        ]),
      };
    }
    async decodeAudioData() {
      return { duration: 10 };
    }
    createBufferSource() {
      return {
        connect() {},
        disconnect() {},
        start() {
          started++;
        },
        stop() {
          stopped++;
        },
      };
    }
    createGain() {
      return {
        connect() {},
        gain: { setValueAtTime() {}, linearRampToValueAtTime() {} },
      };
    }
  };
  global.MediaRecorder = class {
    static isTypeSupported(m) {
      return m === "video/webm";
    }
    constructor() {
      this.state = "inactive";
    }
    start() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      this.ondataavailable?.({ data: new Blob(["movie"]) });
      this.onstop?.();
    }
  };
  const original = JSON.stringify(p);
  const result = await R.record(p);
  assert.ok(result.blob.size);
  assert.equal(result.extension, "webm");
  assert.equal(closed, 1);
  assert.equal(JSON.stringify(p), original);
  assert.equal(started, 2);
  const cancel = new AbortController();
  await assert.rejects(
    () =>
      R.record(p, { signal: cancel.signal, onProgress: () => cancel.abort() }),
    /cancelled/,
  );
  assert.equal(closed, 2);
  document.hidden = true;
  await assert.rejects(() => R.record(p), /visible/);
  assert.equal(closed, 3);
  document.hidden = false;
  failedImage = true;
  await assert.rejects(() => R.record(p), /bad image/);
  assert.equal(closed, 4);
  delete global.MediaRecorder;
  await assert.rejects(() => R.record(p), /requires MediaRecorder/);
  assert.equal(closed, 4);
  const report = {
    tests: [
      "scene range and intersecting cue plan",
      "100Hz control points match shared gain model",
      "MP4-to-WebM feature fallback",
      "original movie remains immutable",
      "record success closes tracks/context",
      "cancel discards output and cleans resources",
      "hidden tab and image failure reject and clean resources",
      "missing APIs reject explicitly",
    ],
    scope:
      "Pure model and mocked browser lifecycle tests. Not actual MediaRecorder/browser download verification.",
  };
  fs.mkdirSync(path.join(__dirname, "../output/recorder"), { recursive: true });
  fs.writeFileSync(
    path.join(__dirname, "../output/recorder/verification.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(
    "PASS",
    report.tests.length,
    "recorder checks; mock media APIs only",
  );
})().catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
