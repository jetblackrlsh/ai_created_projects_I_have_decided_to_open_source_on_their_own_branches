/* User-run local diagnostics. No network, uploads, or project mutations. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let report = null,
    recording = null,
    pdf = null,
    controller = null;
  const status = (t) => ($("selfTestStatus2D").textContent = t);
  function assert(ok, msg) {
    if (!ok) throw Error(msg);
  }
  function download(name, data, type) {
    const b = data instanceof Blob ? data : new Blob([data], { type }),
      u = URL.createObjectURL(b),
      a = document.createElement("a");
    a.href = u;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 3000);
  }
  function bytes(uri) {
    const t = atob(uri.split(",")[1]),
      a = new Uint8Array(t.length);
    for (let i = 0; i < t.length; i++) a[i] = t.charCodeAt(i);
    return a.buffer;
  }
  async function canvasBytes(c) {
    return new Uint8Array(
      await (await new Promise((r) => c.toBlob(r, "image/png"))).arrayBuffer(),
    );
  }
  async function hash(a) {
    return [...new Uint8Array(await crypto.subtle.digest("SHA-256", a))]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
  }
  $("selfTestRun2D").onclick = async () => {
    if (controller) return;
    controller = new AbortController();
    $("selfTestRun2D").disabled = true;
    report = {
      version: "1.2.0-rc1",
      started: new Date().toISOString(),
      userAgent: navigator.userAgent,
      tests: [],
      limits: [
        "No subjective listening review.",
        "Does not automate OS save dialogs or user file-picker choices.",
        "Recorded diagnostic needs external codec/audio inspection for full final-mix certification.",
      ],
    };
    const original = JSON.stringify(Editor.getProject());
    let audio;
    async function test(name, fn) {
      if (controller.signal.aborted) throw Error("Self-test cancelled");
      status(name);
      try {
        const detail = await fn();
        report.tests.push({ name, status: "passed", detail: detail ?? null });
      } catch (e) {
        report.tests.push({ name, status: "failed", error: e.message });
      }
    }
    try {
      if (window.AudioContext) {
        audio = new AudioContext();
        await audio.resume();
      }
      const p = Studio.blank();
      p.width = 640;
      p.height = 360;
      p.scenes[0].duration = 4;
      p.scenes[0].nodes = [
        StudioCatalog2D.environment("street", "bg", 640, 360),
        StudioCatalog2D.character("jet", "hero", 320, 310),
      ];
      StudioCatalog2D.animate(p.scenes[0].nodes[1], "walk", 0, 4);
      let narration;
      await test("SVG model, editable keys and input immutability", async () => {
        const before = JSON.stringify(p),
          a = Studio.render(p, 0.3);
        assert(a === Studio.render(p, 0.3), "Same-time SVG changed");
        assert(a !== Studio.render(p, 0.8), "Action did not change frame");
        assert(JSON.stringify(p) === before, "Renderer mutated project");
        assert(
          JSON.stringify(Studio.validate(JSON.parse(before))) === before,
          "JSON round trip changed project",
        );
      });
      await test("Safe SVG import and embedded bitmap", async () => {
        for (const src of [
          '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
          '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://invalid.example/x.png"/></svg>',
        ]) {
          let rejected = false;
          try {
            Studio.importSVG(src);
          } catch {
            rejected = true;
          }
          assert(rejected, "Unsafe SVG accepted");
        }
        const canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;
        canvas.getContext("2d").fillRect(0, 0, 16, 16);
        const imp = Studio.importSVG(
          '<svg xmlns="http://www.w3.org/2000/svg"><image id="safe" href="' +
            canvas.toDataURL("image/png") +
            '" width="16" height="16"/></svg>',
        );
        assert(imp.nodes[0].tag === "image", "Bitmap missing");
      });
      await test("Fresh still PNG, independent editing and deterministic pixels", async () => {
        const shot = StudioPrint2D.capture(p, 0.3);
        shot.project.scenes[0].background = "#302044";
        const a = await StudioPrint2D.still(shot, { width: 800, height: 450 }),
          b = await StudioPrint2D.still(shot, { width: 800, height: 450 });
        assert(
          (await hash(await canvasBytes(a))) ===
            (await hash(await canvasBytes(b))),
          "Repeated PNG differs",
        );
        assert(
          p.scenes[0].background !== "#302044",
          "Still edit affected movie",
        );
        return { width: a.width, height: a.height };
      });
      await test("All comic layouts, balloons and complete PDF", async () => {
        const shot = StudioPrint2D.capture(p, 0.3),
          c = StudioPrint2D.createComic(shot);
        c.pages = Object.keys(StudioPrint2D.layouts).map((layout) => ({
          layout,
          title: layout,
          panels: [
            {
              snapshot: Studio.clone(shot),
              caption: "Independent frame",
              balloons: [],
            },
          ],
        }));
        c.pages[0].panels[0].balloons = [
          {
            kind: "speech",
            text: "Offline comic test.",
            x: 0.05,
            y: 0.05,
            w: 0.7,
            h: 0.25,
            fontSize: 22,
          },
        ];
        pdf = await StudioPrint2D.pdf(c, { width: 637, height: 825 });
        const doc = await PDFLib.PDFDocument.load(pdf);
        assert(doc.getPageCount() === 8, "Missing PDF pages");
        assert(
          JSON.stringify(
            StudioPrint2D.validateComic(JSON.parse(JSON.stringify(c))),
          ) === JSON.stringify(c),
          "Comic round trip differs",
        );
        return { pages: 8, bytes: pdf.length };
      });
      await test("All six bundled offline voices produce decodable audio", async () => {
        assert(audio, "Web Audio unavailable");
        const result = [];
        for (const preset of Object.keys(StudioVoice.presets)) {
          const g = VoiceTools2D.generate(
              "Every world begins with an idea.",
              preset,
            ),
            buffer = await audio.decodeAudioData(
              g.bytes.buffer.slice(
                g.bytes.byteOffset,
                g.bytes.byteOffset + g.bytes.byteLength,
              ),
            );
          assert(buffer.duration > 0.5, "Empty voice");
          assert(
            buffer.getChannelData(0).some((v) => Math.abs(v) > 1e-6),
            "Silent voice",
          );
          result.push({ preset, duration: buffer.duration });
          if (preset === "narrator") narration = g;
        }
        return result;
      });
      await test("Four music and seven SFX recordings decode locally", async () => {
        assert(audio, "Web Audio unavailable");
        const lib = Editor.getLibrary(),
          result = [];
        for (const a of lib.assets.filter((a) => a.available !== false)) {
          const buffer = await audio.decodeAudioData(bytes(a.data));
          assert(
            buffer.getChannelData(0).some((v) => Math.abs(v) > 1e-6),
            "Silent " + a.name,
          );
          result.push({ id: a.id, duration: buffer.duration });
        }
        assert(
          lib.assets.filter((a) => a.kind === "music").length >= 4,
          "Music library missing",
        );
        assert(
          lib.assets.filter((a) => a.kind === "sfx").length >= 7,
          "SFX library missing",
        );
        return result;
      });
      await test("Actual browser movie recording with three audio roles", async () => {
        assert(narration, "Narration test failed");
        let bin = "";
        for (let i = 0; i < narration.bytes.length; i += 32768)
          bin += String.fromCharCode(...narration.bytes.subarray(i, i + 32768));
        p.audio = [
          {
            name: "Test narration",
            kind: "narration",
            data: "data:audio/wav;base64," + btoa(bin),
            start: 0,
            offset: 0,
            duration: narration.info.duration,
            gain: 0.7,
          },
        ];
        const lib = Editor.getLibrary();
        AudioModel.add(
          p,
          lib.assets.find((a) => a.id === "music/Tranquility"),
          0,
          4,
        );
        AudioModel.add(
          p,
          lib.assets.find((a) => a.id === "sfx/blade-clang"),
          0.7,
          0.8,
        );
        recording = await StudioRecorder2D.record(p, {
          signal: controller.signal,
          onProgress: (n, t) =>
            status(`Actual browser recording ${n.toFixed(1)}/${t.toFixed(1)}s`),
        });
        assert(recording.blob.size > 1000, "Recording too small");
        return {
          mime: recording.mime,
          bytes: recording.blob.size,
          roles: ["narration", "music", "sfx"],
        };
      });
      assert(
        JSON.stringify(Editor.getProject()) === original,
        "Open project changed during the checks; confirm no edits were made while testing",
      );
      report.finished = new Date().toISOString();
      report.passed = report.tests.every((t) => t.status === "passed");
      status(
        `${report.tests.filter((t) => t.status === "passed").length}/${report.tests.length} local checks passed. Save the report; diagnostic movie/PDF samples are available. Your project was not changed.`,
      );
    } catch (e) {
      report.error = e.message;
      report.passed = false;
      status(e.message);
    } finally {
      if (audio && audio.state !== "closed") await audio.close();
      controller = null;
      $("selfTestRun2D").disabled = false;
      $("selfTestResult2D").textContent = JSON.stringify(report, null, 2);
    }
  };
  $("selfTestCancel2D").onclick = () => controller?.abort();
  $("selfTestSave2D").onclick = () => {
    if (!report) return status("Run the checks first");
    download(
      "2D-Studio-Browser-Test-Report.json",
      JSON.stringify(report, null, 2),
      "application/json",
    );
  };
  $("selfTestMovie2D").onclick = () => {
    if (!recording) return status("No diagnostic movie yet");
    download(
      "2D-Studio-Diagnostic." + recording.extension,
      recording.blob,
      recording.mime,
    );
  };
  $("selfTestPdf2D").onclick = () => {
    if (!pdf) return status("No diagnostic PDF yet");
    download("2D-Studio-Diagnostic.pdf", pdf, "application/pdf");
  };
})();
