/* Global audio cue edits corresponding to scene operations. */
(function (root) {
  "use strict";
  const A =
      root.AudioModel ||
      (typeof require === "function" ? require("./audio.js") : null),
    clone = (x) => JSON.parse(JSON.stringify(x));
  function slice(p, a, from, to, start) {
    if (!(to > from)) return null;
    const elapsed = from - a.start,
      out = clone(a),
      sd = A.sourceDuration(p, a);
    out.start = start;
    out.duration = to - from;
    out.offset = a.offset + elapsed;
    if (a.loop && sd) out.offset %= sd;
    if (from > a.start + 1e-8) out.fadeIn = Math.min(0.01, out.duration / 3);
    else out.fadeIn = Math.min(out.fadeIn || 0, out.duration);
    if (to < a.start + a.duration - 1e-8)
      out.fadeOut = Math.min(0.01, out.duration / 3);
    else out.fadeOut = Math.min(out.fadeOut || 0, out.duration);
    return out;
  }
  function range(p, index) {
    if (!Number.isInteger(index) || index < 0 || index >= p.scenes.length)
      throw Error("Invalid scene index");
    const start = p.scenes.slice(0, index).reduce((n, s) => n + s.duration, 0);
    return {
      start,
      end: start + p.scenes[index].duration,
      duration: p.scenes[index].duration,
    };
  }
  function resize(p, index, duration) {
    const r = range(p, index);
    if (!Number.isFinite(duration) || duration < 0.05 || duration > 3600)
      throw Error("Invalid scene duration");
    const delta = duration - r.duration,
      newEnd = r.start + duration;
    const next = clone(p.audio);
    for (const a of next) {
      const end = a.start + a.duration;
      if (
        delta < 0 &&
        a.start >= newEnd - 1e-8 &&
        a.start < r.end &&
        a.start >= r.start
      )
        throw Error(
          "Shortening would remove a scene audio cue start; edit that cue explicitly first.",
        );
      if (a.start >= r.end - 1e-8) a.start += delta;
      else if (a.start < r.end && end > r.end + 1e-8) {
        if (a.kind === "narration")
          throw Error(
            "Narration crosses this scene boundary. Edit its cue explicitly before resizing.",
          );
        a.duration += delta;
        if (a.duration <= 0)
          throw Error(
            "Resizing would remove an overlapping audio cue; edit it explicitly.",
          );
      } else if (delta < 0 && a.start >= r.start && end > newEnd + 1e-8)
        throw Error(
          "Shortening would cut a scene audio cue. Trim or move that cue explicitly first.",
        );
    }
    const candidate = { ...p, audio: next };
    A.validate(candidate);
    p.audio = next;
    p.scenes[index].duration = duration;
    return p;
  }
  function duplicateAudio(p, index) {
    const r = range(p, index),
      next = [],
      original = clone(p.audio);
    for (const a of original) {
      const end = a.start + a.duration;
      if (a.start >= r.end - 1e-8) {
        next.push({ ...a, start: a.start + r.duration });
      } else if (end <= r.end + 1e-8) next.push(a);
      else {
        next.push(slice(p, a, a.start, r.end, a.start));
        next.push(slice(p, a, r.end, end, r.end + r.duration));
      }
      const from = Math.max(a.start, r.start),
        to = Math.min(end, r.end);
      if (to > from) {
        const copied = slice(p, a, from, to, r.end + from - r.start);
        copied.name = (a.name || a.kind || "Audio") + " copy";
        next.push(copied);
      }
    }
    p.audio = next.filter(Boolean).sort((a, b) => a.start - b.start);
    return p;
  }
  function deleteAudio(p, index) {
    const r = range(p, index),
      next = [];
    for (const a of p.audio) {
      const end = a.start + a.duration;
      if (end <= r.start + 1e-8) next.push(clone(a));
      else if (a.start >= r.end - 1e-8)
        next.push({ ...clone(a), start: a.start - r.duration });
      else {
        const left = slice(p, a, a.start, Math.min(end, r.start), a.start);
        if (left) next.push(left);
        const right = slice(
          p,
          a,
          Math.max(a.start, r.end),
          end,
          Math.max(a.start, r.end) - r.duration,
        );
        if (right) next.push(right);
      }
    }
    p.audio = next.sort((a, b) => a.start - b.start);
    return p;
  }
  const api = { slice, range, resize, duplicateAudio, deleteAudio };
  root.StudioTimeline2D = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
