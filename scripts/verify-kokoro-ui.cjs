/* Explicit DOM/native-canvas harness. Not a real-browser test. */
const fs = require("fs"),
  path = require("path"),
  assert = require("assert/strict"),
  { JSDOM } = require("jsdom"),
  native = require("@napi-rs/canvas");
(async () => {
  const root = path.resolve(__dirname, ".."),
    dom = new JSDOM(fs.readFileSync(path.join(root, "START.html"), "utf8"), {
      runScripts: "outside-only",
      url: "https://offline.invalid/",
    }),
    w = dom.window,
    canvases = new WeakMap();
  function canvas(el) {
    let c = canvases.get(el);
    if (!c || c.width !== el.width || c.height !== el.height) {
      c = native.createCanvas(el.width || 1, el.height || 1);
      canvases.set(el, c);
    }
    return c;
  }
  w.HTMLCanvasElement.prototype.getContext = function () {
    const ctx = canvas(this).getContext("2d");
    return new Proxy(ctx, {
      get(t, k) {
        if (k === "drawImage")
          return (im, ...a) =>
            t.drawImage(
              im instanceof w.HTMLCanvasElement ? canvas(im) : im,
              ...a,
            );
        const x = t[k];
        return typeof x === "function" ? x.bind(t) : x;
      },
      set(t, k, v) {
        t[k] = v;
        return true;
      },
    });
  };
  w.HTMLCanvasElement.prototype.toDataURL = function () {
    return canvas(this).toDataURL("image/png");
  };
  w.HTMLCanvasElement.prototype.toBlob = function (cb) {
    cb(new w.Blob([canvas(this).toBuffer("image/png")], { type: "image/png" }));
  };
  w.Image = class extends native.Image {
    set src(v) {
      super.src =
        typeof v === "string" && v.startsWith("data:")
          ? Buffer.from(v.split(",")[1], "base64")
          : v;
    }
    get src() {
      return super.src;
    }
  };
  w.Audio = class {
    constructor() {
      this.paused = true;
      this.currentTime = 0;
      this.duration = 1;
      this.volume = 1;
    }
    pause() {
      this.paused = true;
    }
    play() {
      this.paused = false;
      return Promise.resolve();
    }
    load() {
      this.onloadedmetadata?.();
    }
  };
  w.requestAnimationFrame = () => 0;
  const downloads = [];
  w.URL.createObjectURL = (b) => {
    downloads.push(b);
    return "blob:test";
  };
  w.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = function () {};
  w.setTimeout = setTimeout;
  for (const f of [
    "app/audio.js",
    "app/library.js",
    "app/core.js",
    "app/demo.js",
    "app/timeline.js",
    "app/editor.js",
    "vendor/pdf-lib/pdf-lib.min.js",
    "app/print.js",
    "app/print-ui.js",
    "vendor/voice/voice.bundle.js",
    "app/voice-tools.js",
    "app/voice-ui.js",
    "app/recorder.js",
    "app/recorder-ui.js",
    "app/character-palettes.js",
    "app/catalog.js",
    "app/catalog-ui.js",
    "app/bitmap-ui.js",
    "app/browser-self-test.js",
    "app/puppet.js", "app/puppet-actions.js", "app/stagecraft.js",
  ])
    w.eval(fs.readFileSync(path.join(root, f), "utf8"));
  const $=id=>w.document.getElementById(id);
  assert.equal($("voiceProvider2D").value,"bundled");
  const legacy=JSON.stringify(w.Editor.getProject());$("voiceProvider2D").value="kokoro";$("voiceProvider2D").onchange();
  assert.equal($("voiceGenerate2D").disabled,true);assert.equal(JSON.stringify(w.Editor.getProject()),legacy);
  w.Editor.load(w.Studio.blank());assert.equal($("voiceProvider2D").value,"kokoro");
  $("voiceProvider2D").value="bundled";$("voiceProvider2D").onchange();$("voiceText2D").value="A test line.";
  await $("voiceGenerate2D").onclick();assert.ok(w.VoiceEditor2D.getGenerated().duration>0);
  const bytes=w.VoiceTools2D.generate("A test line.","narrator").bytes;
  $("voiceProvider2D").value="kokoro";$("voiceProvider2D").onchange();$("voiceSpeaker2D").value="hero";
  const c={provider:"kokoro",voice:"af_heart",speed:1,lang:"en-us"},meta={...c,text:"A test line.",durationSeconds:w.VoiceTools2D.wavInfo(bytes).duration};
  Object.defineProperty($("voiceImport2D"),"files",{configurable:true,value:[{name:"fixture.wav",size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)},{name:"fixture.wav.json",size:200,text:async()=>JSON.stringify(meta)}]});
  await $("voiceImport2D").onchange();assert.match($("voiceStatus2D").textContent,/Imported/);
  await $("voiceDialogue2D").onclick();assert.match($("voiceStatus2D").textContent,/Speaker clip/);
  const p=w.Editor.getProject();assert.equal(p.voiceCast.hero.provider,"kokoro");assert.equal(p.audio[0].speakerId,"hero");assert.ok(p.audio[0].data.length>1000);
  w.Editor.load(JSON.parse(JSON.stringify(p)));assert.equal(w.Editor.getProject().audio[0].data,p.audio[0].data);
  $("voiceText2D").value="Changed line";await $("voiceDialogue2D").onclick();assert.match($("voiceStatus2D").textContent,/changed/);assert.equal(w.Editor.getProject().audio.length,1);
  $("voiceSpeaker2D").value="hero";$("voiceKokoro2D").value="am_michael";await $("voiceLock2D").onclick();assert.match($("voiceStatus2D").textContent,/already locked/);
  console.log("PASS DOM/native canvas: provider preference/legacy preservation, bundled generation, actual file input import, cast, speaker cue, roundtrip, stale clip and locked-cast rejection. Test uses bundled fixture, not Kokoro model execution.");
  dom.window.close();
})().catch(e=>{console.error(e);process.exit(1)});
