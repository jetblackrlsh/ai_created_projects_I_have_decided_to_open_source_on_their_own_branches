/* Browser-only real-time recorder. Offline deterministic CLI remains available. */
(function (root) {
  "use strict";
  function plan(p, first = 0, last = p.scenes.length - 1) {
    root.Studio.validate(p);
    if (
      !Number.isInteger(first) ||
      !Number.isInteger(last) ||
      first < 0 ||
      last < first ||
      last >= p.scenes.length
    )
      throw Error("Invalid movie scene range");
    const start = p.scenes.slice(0, first).reduce((n, s) => n + s.duration, 0),
      end = p.scenes.slice(0, last + 1).reduce((n, s) => n + s.duration, 0);
    return {
      start,
      end,
      duration: end - start,
      cues: p.audio
        .map((cue, index) => ({
          cue,
          index,
          from: Math.max(start, cue.start),
          to: Math.min(end, cue.start + cue.duration),
        }))
        .filter((x) => x.to > x.from),
    };
  }
  function controls(p, cue, from, to) {
    const out = [{ time: from, value: root.AudioModel.gainAt(p, cue, from) }];
    let j = Math.floor((from - cue.start) * 100) + 1;
    for (let t = cue.start + j / 100; t < to; t = cue.start + ++j / 100)
      out.push({ time: t, value: root.AudioModel.gainAt(p, cue, t) });
    out.push({
      time: to,
      value: root.AudioModel.gainAt(p, cue, Math.max(from, to - 1e-8)),
    });
    return out;
  }
  function bytes(uri) {
    const text = atob(uri.split(",")[1]),
      out = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i);
    return out.buffer;
  }
  async function record(p, opt = {}) {
    const source = root.Studio.clone(p),
      range = plan(
        source,
        opt.first ?? 0,
        opt.last ?? source.scenes.length - 1,
      );
    if (!root.MediaRecorder || !root.AudioContext)
      throw Error(
        "Browser recording requires MediaRecorder and Web Audio. Use the headless exporter when unavailable.",
      );
    const canvas = root.document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    if (!canvas.captureStream)
      throw Error("Canvas recording is unavailable in this browser");
    const ctx = canvas.getContext("2d"),
      audio = new root.AudioContext({ sampleRate: 48000 }),
      sources = [],
      streams = [],
      scheduled = [],
      decoded = new Map();
    let recorder = null,
      timer = null,
      onAbort = null,
      closed = false;
    function waitSafe(promise, label) {
      return new Promise((resolve, reject) => {
        let timer;
        const finish = (fn, value) => {
          if (timer) root.clearTimeout(timer);
          opt.signal?.removeEventListener("abort", abort);
          fn(value);
        };
        const abort = () =>
          finish(
            reject,
            Error("Recording cancelled; partial output discarded"),
          );
        if (opt.signal?.aborted) {
          reject(Error("Recording cancelled"));
          return;
        }
        timer = root.setTimeout(
          () => finish(reject, Error(label + " timed out; no movie was saved")),
          30000,
        );
        opt.signal?.addEventListener("abort", abort, { once: true });
        Promise.resolve(promise).then(
          (value) => finish(resolve, value),
          (error) => finish(reject, error),
        );
      });
    }
    const cleanup = async () => {
      if (closed) return;
      closed = true;
      if (timer !== null) root.cancelAnimationFrame(timer);
      for (const s of sources) {
        try {
          s.stop();
        } catch {}
        try {
          s.disconnect();
        } catch {}
      }
      for (const stream of streams)
        for (const track of stream.getTracks()) track.stop();
      if (onAbort) opt.signal?.removeEventListener("abort", onAbort);
      if (audio.state !== "closed") await audio.close();
    };
    try {
      if (opt.signal?.aborted) throw Error("Recording cancelled");
      if (root.document.hidden)
        throw Error("Keep this tab visible while recording");
      await waitSafe(audio.resume(), "Audio startup");
      await waitSafe(audio.suspend(), "Audio preparation");
      const dest = audio.createMediaStreamDestination();
      streams.push(dest.stream);
      for (const x of range.cues) {
        if (opt.signal?.aborted) throw Error("Recording cancelled");
        const uri = root.AudioModel.data(source, x.cue);
        let buffer = decoded.get(uri);
        if (!buffer) {
          buffer = await waitSafe(
            audio.decodeAudioData(bytes(uri)),
            "Audio decoding",
          );
          decoded.set(uri, buffer);
        }
        const node = audio.createBufferSource(),
          gain = audio.createGain();
        node.buffer = buffer;
        node.loop = !!x.cue.loop;
        node.connect(gain);
        gain.connect(dest);
        sources.push(node);
        scheduled.push({ ...x, node, gain, buffer });
      }
      async function draw(t) {
        const svg = root.Studio.render(source, Math.min(t, range.end - 1e-6)),
          im = new root.Image();
        im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        await waitSafe(im.decode(), "Frame decoding");
        ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
      }
      await draw(range.start);
      const video = canvas.captureStream(source.fps);
      streams.push(video);
      const combined = new root.MediaStream([
        ...video.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);
      streams.push(combined);
      const mime = [
        "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
        "video/mp4",
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ].find((m) => root.MediaRecorder.isTypeSupported(m));
      if (!mime)
        throw Error("No supported recording codec; use headless export");
      recorder = new root.MediaRecorder(combined, {
        mimeType: mime,
        videoBitsPerSecond: 8000000,
        audioBitsPerSecond: 192000,
      });
      const chunks = [];
      let failure = null;
      const finished = new Promise((resolve, reject) => {
        recorder.ondataavailable = (e) => {
          if (e.data.size) chunks.push(e.data);
        };
        recorder.onerror = (e) => {
          failure = e.error || Error("Recording failed");
          try {
            recorder.stop();
          } catch {
            reject(failure);
          }
        };
        recorder.onstop = () =>
          failure
            ? reject(failure)
            : resolve(new root.Blob(chunks, { type: mime }));
        onAbort = () => {
          failure = Error("Recording cancelled; partial output discarded");
          if (recorder.state !== "inactive") recorder.stop();
        };
        opt.signal?.addEventListener("abort", onAbort, { once: true });
      });
      if (opt.signal?.aborted) throw Error("Recording cancelled");
      finished.catch(() => {}); // Cancellation may reject while audio resume is pending.
      const epoch = audio.currentTime;
      for (const x of scheduled) {
        const at = epoch + x.from - range.start,
          offset = x.cue.offset + x.from - x.cue.start;
        const gainValues = controls(source, x.cue, x.from, x.to);
        x.gain.gain.setValueAtTime(gainValues[0].value, at);
        for (const point of gainValues.slice(1))
          x.gain.gain.linearRampToValueAtTime(
            point.value,
            epoch + point.time - range.start,
          );
        x.node.start(at, x.cue.loop ? offset % x.buffer.duration : offset);
        x.node.stop(epoch + x.to - range.start);
      }
      recorder.start(1000);
      await waitSafe(audio.resume(), "Audio startup");
      async function tick() {
        if (recorder.state === "inactive") return;
        try {
          if (root.document.hidden)
            throw Error(
              "Tab became hidden; partial recording discarded. Keep it visible or use headless export.",
            );
          const elapsed = Math.max(0, audio.currentTime - epoch);
          await draw(range.start + Math.min(elapsed, range.duration));
          opt.onProgress?.(Math.min(elapsed, range.duration), range.duration);
          if (elapsed >= range.duration) recorder.stop();
          else timer = root.requestAnimationFrame(tick);
        } catch (e) {
          failure = e;
          if (recorder.state !== "inactive") recorder.stop();
        }
      }
      timer = root.requestAnimationFrame(tick);
      const blob = await finished;
      if (!blob.size) throw Error("Recorder returned empty output");
      return {
        blob,
        extension: mime.includes("mp4") ? "mp4" : "webm",
        mime,
        duration: range.duration,
        mode: "real-time browser recording; timing depends on browser performance",
      };
    } finally {
      await cleanup();
    }
  }
  const api = { plan, controls, record };
  root.StudioRecorder2D = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
