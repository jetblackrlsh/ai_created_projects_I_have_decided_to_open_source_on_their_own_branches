#!/usr/bin/env node
/**
 * Offline 1080p@24fps Painterly Anime MP4 Renderer & Keyframe Exporter
 * for "Echoes in the Static: Dream Journal 11/03/2026"
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { renderStoryFrame } from './scene-renderer.js';

globalThis.__createCanvas = createCanvas;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 24;

function loadTimeline() {
  const timelinePath = path.join(PROJECT_ROOT, 'audio', 'timeline.json');
  return JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
}

async function renderKeyframes(timeline) {
  const keyframesDir = path.join(PROJECT_ROOT, 'keyframes');
  fs.mkdirSync(keyframesDir, { recursive: true });

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  for (const scene of timeline.scenes) {
    const sid = scene.id || scene.scene_id;
    const sStart = scene.start ?? scene.start_sec ?? 0;
    const sDur = scene.duration ?? scene.duration_sec ?? 45;
    const midTime = sStart + sDur * 0.45;
    renderStoryFrame(ctx, WIDTH, HEIGHT, midTime, timeline, { showSubtitles: true, showHud: true });
    const outPath = path.join(keyframesDir, `scene_${sid}.png`);
    fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
    console.log(`[Keyframe] Wrote ${outPath} (t=${midTime.toFixed(2)}s)`);
  }

  // Hero shots for S01, S02, S04, S06
  const heroShots = [
    { name: 'shot_storyverse_nova.png', sceneId: 'S01', frac: 0.55 },
    { name: 'shot_muppet_lodge_static.png', sceneId: 'S02', frac: 0.92 },
    { name: 'shot_popup_grimoire.png', sceneId: 'S04', frac: 0.72 },
    { name: 'shot_cheesecake_ranch_banquet.png', sceneId: 'S06', frac: 0.78 },
  ];

  for (const hs of heroShots) {
    const sc = timeline.scenes.find((s) => (s.id || s.scene_id) === hs.sceneId) || timeline.scenes[0];
    const sStart = sc.start ?? sc.start_sec ?? 0;
    const sDur = sc.duration ?? sc.duration_sec ?? 45;
    const t = sStart + sDur * hs.frac;
    renderStoryFrame(ctx, WIDTH, HEIGHT, t, timeline, { showSubtitles: false, showHud: false });
    const p = path.join(keyframesDir, hs.name);
    fs.writeFileSync(p, canvas.toBuffer('image/png'));
    console.log(`[HeroShot] Wrote ${p} (t=${t.toFixed(2)}s)`);
  }

  // Also save poster_glade.jpg at project root for web player poster attribute
  const s01 = timeline.scenes[0];
  const s01Start = s01.start ?? s01.start_sec ?? 0;
  const s01Dur = s01.duration ?? s01.duration_sec ?? 45;
  renderStoryFrame(ctx, WIDTH, HEIGHT, s01Start + s01Dur * 0.5, timeline, {
    showSubtitles: false,
    showHud: false,
  });
  const posterPath = path.join(PROJECT_ROOT, 'poster_glade.jpg');
  fs.writeFileSync(posterPath, canvas.toBuffer('image/jpeg', 90));
  console.log(`[Poster] Wrote ${posterPath}`);
}

async function renderMp4(timeline) {
  const durationSec = timeline.total_duration ?? timeline.total_duration_sec;
  const totalFrames = Math.ceil(durationSec * FPS);
  const masterWav = path.join(PROJECT_ROOT, 'audio', 'master.wav');
  const outMp4 = path.join(PROJECT_ROOT, 'animation.mp4');

  console.log(
    `[MP4] Rendering ${totalFrames} frames (${durationSec.toFixed(2)}s @ ${FPS}fps, ${WIDTH}x${HEIGHT}) -> ${outMp4}`
  );

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  const ffmpegArgs = [
    '-y',
    '-f',
    'rawvideo',
    '-pix_fmt',
    'rgba',
    '-s',
    `${WIDTH}x${HEIGHT}`,
    '-r',
    String(FPS),
    '-i',
    'pipe:0',
    '-i',
    masterWav,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-shortest',
    '-movflags',
    '+faststart',
    outMp4,
  ];

  const ff = spawn('ffmpeg', ffmpegArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
  let stderrTail = '';
  ff.stderr.on('data', (chunk) => {
    stderrTail = (stderrTail + chunk.toString()).slice(-1200);
  });

  const startTime = Date.now();
  for (let frame = 0; frame < totalFrames; frame++) {
    const t = frame / FPS;
    renderStoryFrame(ctx, WIDTH, HEIGHT, t, timeline, { showSubtitles: true, showHud: false });
    const rawRgba = canvas.data();
    const ok = ff.stdin.write(rawRgba);
    if (!ok) {
      await new Promise((resolve) => ff.stdin.once('drain', resolve));
    }
    if (frame % 240 === 0 || frame === totalFrames - 1) {
      const elapsed = (Date.now() - startTime) / 1000;
      const fpsRate = (frame + 1) / Math.max(0.1, elapsed);
      console.log(
        `  Frame ${frame + 1}/${totalFrames} (${(((frame + 1) / totalFrames) * 100).toFixed(1)}%) — ${fpsRate.toFixed(1)} fps`
      );
    }
  }

  ff.stdin.end();
  const code = await new Promise((resolve) => ff.on('close', resolve));
  if (code !== 0) {
    throw new Error(`ffmpeg exited with code ${code}: ${stderrTail}`);
  }
  console.log(`[MP4] Completed ${outMp4}`);
}

const args = process.argv.slice(2);
const timeline = loadTimeline();
await renderKeyframes(timeline);
if (!args.includes('--keyframes-only')) {
  await renderMp4(timeline);
}
