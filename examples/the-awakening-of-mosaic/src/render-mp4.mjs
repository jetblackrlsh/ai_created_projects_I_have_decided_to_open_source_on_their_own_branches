#!/usr/bin/env node
/**
 * Deterministic 1920x1080 Hybrid Shader + 2D Canvas Renderer & H.264/AAC MP4 Encoder
 *
 * 1. Saves full-resolution 1920x1080 PNG keyframes across key dramatic beats for visual inspection.
 * 2. Streams 1920x1080 frames at 12 fps directly into FFmpeg with `audio/master.wav` to produce
 *    `animation.mp4` (`libx264`, `yuv420p`, `aac` 192 kbps, `48 kHz`).
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import { renderScene2D } from "./scene-renderer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 24;

function computeRingAngle(t, scenes) {
  let angle = 0.4;
  for (const sc of scenes) {
    if (t <= sc.start) break;
    const dt = Math.min(t, sc.end) - sc.start;
    angle += dt * (sc.ring_speed ?? 0.45);
  }
  return angle;
}

function rgbStr(arr, alpha = 1.0) {
  const r = Math.round(Math.max(0, Math.min(1, arr[0])) * 255);
  const g = Math.round(Math.max(0, Math.min(1, arr[1])) * 255);
  const b = Math.round(Math.max(0, Math.min(1, arr[2])) * 255);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Software execution of the WebGL GLSL shader field (FBM volumetric atmosphere,
 * SDF Ancient Ring megastructure with rotating rune segments, Extradimensional Second Moon,
 * Subterranean Hex Lattice, and Intrusion Firewall Shockwaves)
 */
function renderShaderPass(ctx, width, height, u) {
  const {
    time,
    sceneIndex,
    ringRotation,
    energyLevel,
    intrusionAlert,
    primaryColor,
    secondaryColor,
  } = u;

  // 1. Atmospheric Sky / Subterranean Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (sceneIndex <= 2) {
    skyGrad.addColorStop(0, "#0b2447");
    skyGrad.addColorStop(0.55, "#19376d");
    skyGrad.addColorStop(1, "#0f172a");
  } else {
    skyGrad.addColorStop(0, "#040814");
    skyGrad.addColorStop(0.5, rgbStr(primaryColor.map((c) => c * 0.22), 1));
    skyGrad.addColorStop(1, "#020617");
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Volumetric Nebula / Plasma Bands
  for (let i = 0; i < 4; i++) {
    const cx = width * (0.2 + 0.22 * i + 0.04 * Math.sin(time * 0.4 + i));
    const cy = height * (0.32 + 0.08 * Math.cos(time * 0.3 + i * 1.7));
    const rad = 360 + i * 70;
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, rad);
    const col = i % 2 === 0 ? primaryColor : secondaryColor;
    g.addColorStop(0, rgbStr(col, 0.20 + energyLevel * 0.12));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Subterranean Hexagonal AI Lattice & Firewall Glitch Waves (Scenes 4-11)
  if (sceneIndex >= 3) {
    ctx.save();
    ctx.strokeStyle = rgbStr(primaryColor, 0.18 + energyLevel * 0.12);
    ctx.lineWidth = 1.5;
    const step = 96;
    const offset = (time * 18) % step;
    for (let x = -step; x < width + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      ctx.lineTo(x - offset, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (intrusionAlert > 0.05) {
      ctx.fillStyle = `rgba(244, 63, 94, ${0.12 * intrusionAlert})`;
      for (let b = 0; b < 5; b++) {
        const gy = ((time * 160 + b * 210) % height);
        ctx.fillRect(0, gy, width, 14);
      }
    }
    ctx.restore();
  }

  // 4. Extradimensional Second Moon (Scenes 1-3)
  if (sceneIndex <= 2) {
    const mx = sceneIndex === 1 ? width * 0.68 : width * 0.21;
    const my = height * 0.22;
    const mRad = 88;

    const aura = ctx.createRadialGradient(mx, my, mRad * 0.4, mx, my, mRad * 2.3);
    aura.addColorStop(0, "rgba(192, 132, 252, 0.75)");
    aura.addColorStop(0.5, "rgba(147, 51, 234, 0.25)");
    aura.addColorStop(1, "rgba(147, 51, 234, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(mx, my, mRad * 2.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#a855f7";
    ctx.beginPath();
    ctx.arc(mx, my, mRad, 0, Math.PI * 2);
    ctx.fill();

    // Lensing rings around Second Moon
    ctx.strokeStyle = "rgba(233, 213, 255, 0.65)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(mx, my, mRad * 1.45, mRad * 0.42, 0.35 + Math.sin(time) * 0.05, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 5. SDF Ancient Ring Megastructure (Surface skyline in S01-S03; Sub-ring projection in S08-S11)
  if (sceneIndex <= 2 || sceneIndex >= 7) {
    const rx = sceneIndex === 2 ? width * 0.52 : (sceneIndex <= 2 ? width * 0.66 : width * 0.50);
    const ry = sceneIndex <= 2 ? height * 0.42 : height * 0.34;
    const rOuter = sceneIndex === 2 ? 350 : 295;
    const rInner = rOuter * 0.78;
    const isHalted = sceneIndex === 10;

    ctx.save();
    ctx.translate(rx, ry);

    // Portal vortex glow
    const portal = ctx.createRadialGradient(0, 0, 10, 0, 0, rOuter * 1.15);
    portal.addColorStop(0, isHalted ? "rgba(244, 114, 182, 0.42)" : rgbStr(secondaryColor, 0.38));
    portal.addColorStop(0.7, rgbStr(primaryColor, 0.22));
    portal.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = portal;
    ctx.beginPath();
    ctx.arc(0, 0, rOuter * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Rotating gear teeth & ancient rune spokes
    ctx.rotate(ringRotation);
    ctx.strokeStyle = isHalted ? "#38bdf8" : "#eab308";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = rgbStr(primaryColor, 0.9);
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, rInner, 0, Math.PI * 2);
    ctx.stroke();

    const numSpokes = 24;
    for (let s = 0; s < numSpokes; s++) {
      const a = (s * Math.PI * 2) / numSpokes;
      ctx.strokeStyle = s % 2 === 0 ? "#fde047" : rgbStr(secondaryColor, 0.85);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rInner, Math.sin(a) * rInner);
      ctx.lineTo(Math.cos(a) * (rOuter + 14), Math.sin(a) * (rOuter + 14));
      ctx.stroke();
    }
    ctx.restore();
  }
}

function renderCompositeFrame(ctx, t, timeline) {
  const scene = timeline.scenes.find((s) => t >= s.start && t <= s.end) || timeline.scenes[timeline.scenes.length - 1];
  const sceneIndex = scene ? scene.index : 0;
  const sceneProgress = scene ? Math.max(0, Math.min(1, (t - scene.start) / Math.max(0.01, scene.duration))) : 0;

  const activeLine = timeline.lines.find((l) => t >= l.start && t <= l.end) || null;
  const activeSfx = (timeline.sfx_events || []).find((ev) => t >= ev.start && t <= ev.end) || null;

  let talkEnergy = 0.0;
  if (activeLine && activeLine.envelope_20hz) {
    const idx = Math.floor((t - activeLine.start) * 20);
    talkEnergy = activeLine.envelope_20hz[Math.min(activeLine.envelope_20hz.length - 1, Math.max(0, idx))] || 0.25;
  }

  const ringRotation = computeRingAngle(t, timeline.scenes);
  const energyLevel = Math.min(1.0, talkEnergy * 0.7 + (activeSfx ? 0.45 : 0.0));

  renderShaderPass(ctx, WIDTH, HEIGHT, {
    time: t,
    sceneIndex,
    sceneProgress,
    ringRotation,
    ringSpeed: scene.ring_speed ?? 0.45,
    energyLevel,
    intrusionAlert: scene.alert_level ?? 0.0,
    primaryColor: scene.primary_color || [0.2, 0.7, 0.95],
    secondaryColor: scene.secondary_color || [0.75, 0.4, 0.95],
  });

  renderScene2D(ctx, WIDTH, HEIGHT, {
    time: t,
    scene,
    sceneIndex,
    sceneProgress,
    activeLine,
    activeSfx,
    talkEnergy,
    showCaptions: true,
    clearCanvas: false,
  });
}

async function main() {
  const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, "audio", "timeline.json"), "utf8"));
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // 1. Export inspection keyframes at midpoints of key scenes
  const kfDir = path.join(ROOT, "keyframes");
  fs.mkdirSync(kfDir, { recursive: true });
  for (const sc of timeline.scenes) {
    const midT = sc.start + sc.duration * 0.5;
    renderCompositeFrame(ctx, midT, timeline);
    const pngBuf = canvas.toBuffer("image/png");
    const outPath = path.join(kfDir, `scene_${sc.id}.png`);
    fs.writeFileSync(outPath, pngBuf);
    console.log(`[KEYFRAME] Saved ${outPath} (t=${midT.toFixed(2)}s)`);
  }

  // 2. Encode full 1920x1080 H.264 + AAC 48kHz MP4 via raw RGBA pipe
  const totalDuration = timeline.total_duration;
  const totalFrames = Math.round(totalDuration * FPS);
  const mp4Path = path.join(ROOT, "animation.mp4");
  const wavCandidate = path.join(ROOT, "audio", "master.wav");
  const masterWav = fs.existsSync(wavCandidate) ? wavCandidate : path.join(ROOT, "audio", "master.m4a");

  console.log(`[MP4 RENDER] Encoding ${totalFrames} frames (${totalDuration.toFixed(2)}s @ ${FPS} fps) -> ${mp4Path}`);

  const ff = spawn("ffmpeg", [
    "-y",
    "-v", "error",
    "-f", "rawvideo",
    "-pix_fmt", "rgba",
    "-s", `${WIDTH}x${HEIGHT}`,
    "-r", String(FPS),
    "-i", "-",
    "-i", masterWav,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "23",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-ar", "48000",
    "-movflags", "+faststart",
    "-shortest",
    mp4Path,
  ]);

  ff.stderr.on("data", (d) => process.stderr.write(d));

  for (let f = 0; f < totalFrames; f++) {
    const t = f / FPS;
    renderCompositeFrame(ctx, t, timeline);
    const raw = canvas.data();
    const ok = ff.stdin.write(raw);
    if (!ok) {
      await new Promise((resolve) => ff.stdin.once("drain", resolve));
    }
    if (f % (FPS * 30) === 0) {
      console.log(`[MP4 PROGRESS] Frame ${f}/${totalFrames} (${((f / totalFrames) * 100).toFixed(1)}%)`);
    }
  }

  ff.stdin.end();
  await new Promise((resolve, reject) => {
    ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`))));
  });

  console.log(`[MP4 DONE] Successfully encoded ${mp4Path}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
