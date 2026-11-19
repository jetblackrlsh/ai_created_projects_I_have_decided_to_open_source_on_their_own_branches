// Zero-dependency Node.js static + local macOS TTS server for Aetherbound RPG
// Serves static files and /api/tts (WAV audio routed through Web Audio so NPC voices are recorded in MP4s!)

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4173;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
};

const ROLE_VOICES = {
  priest: { voice: 'Daniel', rate: '175' },
  elemental_fire: { voice: 'Ralph', rate: '185' },
  elemental_water: { voice: 'Moira', rate: '168' },
  elemental_earth: { voice: 'Ralph', rate: '155' },
  elemental_air: { voice: 'Karen', rate: '205' },
  villager: { voice: 'Reed', rate: '182' },
};

const ttsCache = new Map();
const MAX_TARGET_BYTES = Math.floor(9.4 * 1024 * 1024); // Strictly under 10 MB

async function probeDurationSec(filePath, fallbackSec = 30) {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    const parsed = parseFloat(stdout.trim());
    if (Number.isFinite(parsed) && parsed > 0.5) return parsed;
  } catch {}
  return Math.max(1, fallbackSec);
}

async function compressToUnder10MB(inputBuf, durationHintSec = 30) {
  const id = crypto.randomUUID();
  const inFile = path.join(os.tmpdir(), `aetherbound-in-${id}.bin`);
  const outFile = path.join(os.tmpdir(), `aetherbound-out-${id}.mp4`);
  try {
    await fs.writeFile(inFile, inputBuf);
    const dur = await probeDurationSec(inFile, durationHintSec);

    const runPass = async (targetMB) => {
      const targetBits = targetMB * 1024 * 1024 * 8;
      const audioKbps = dur > 180 ? 48 : dur > 90 ? 64 : 96;
      const totalKbps = Math.floor(targetBits / dur / 1000);
      const videoKbps = Math.max(96, Math.min(1400, totalKbps - audioKbps));
      const scaleFilter = dur > 240 ? 'scale=640:-2' : dur > 90 ? 'scale=854:-2' : 'scale=960:-2';

      await execFileAsync('ffmpeg', [
        '-y',
        '-i', inFile,
        '-vf', scaleFilter,
        '-r', '30',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-pix_fmt', 'yuv420p',
        '-b:v', `${videoKbps}k`,
        '-maxrate', `${Math.round(videoKbps * 1.15)}k`,
        '-bufsize', `${Math.round(videoKbps * 1.8)}k`,
        '-c:a', 'aac',
        '-b:a', `${audioKbps}k`,
        '-ac', '2',
        '-movflags', '+faststart',
        outFile,
      ]);
      return fs.readFile(outFile);
    };

    let outBuf = await runPass(8.8);
    if (outBuf.length > MAX_TARGET_BYTES) {
      outBuf = await runPass(7.2);
    }
    return outBuf;
  } finally {
    fs.unlink(inFile).catch(() => {});
    fs.unlink(outFile).catch(() => {});
  }
}

async function synthesizeWav(text, role, speaker) {
  const cleanText = String(text || '').trim().slice(0, 600);
  if (!cleanText) return null;

  const lowerSpeaker = String(speaker || '').toLowerCase();
  const isFemale =
    lowerSpeaker.includes('sister') ||
    lowerSpeaker.includes('elara') ||
    lowerSpeaker.includes('lady') ||
    lowerSpeaker.includes('queen');

  let cfg = ROLE_VOICES[role] || ROLE_VOICES.villager;
  if (role === 'villager' && isFemale) {
    cfg = { voice: 'Karen', rate: '180' };
  }

  const cacheKey = `${cfg.voice}:${cfg.rate}:${cleanText}`;
  if (ttsCache.has(cacheKey)) return ttsCache.get(cacheKey);

  const tmpFile = path.join(os.tmpdir(), `aetherbound-tts-${crypto.randomUUID()}.wav`);
  try {
    await execFileAsync('say', [
      '-v', cfg.voice,
      '-r', cfg.rate,
      '-o', tmpFile,
      '--data-format=LEI16@22050',
      cleanText,
    ]);
    const buf = await fs.readFile(tmpFile);
    if (ttsCache.size > 80) {
      const firstKey = ttsCache.keys().next().value;
      ttsCache.delete(firstKey);
    }
    ttsCache.set(cacheKey, buf);
    return buf;
  } finally {
    fs.unlink(tmpFile).catch(() => {});
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);

    if (url.pathname === '/api/compress-mp4' && req.method === 'POST') {
      const durationHint = Number(url.searchParams.get('duration')) || 30;
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const rawBuf = Buffer.concat(chunks);
      if (!rawBuf.length) {
        res.writeHead(400);
        res.end('Empty video payload');
        return;
      }
      try {
        const compressed = await compressToUnder10MB(rawBuf, durationHint);
        res.writeHead(200, {
          'Content-Type': 'video/mp4',
          'Content-Length': String(compressed.length),
          'Cache-Control': 'no-store',
        });
        res.end(compressed);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Compression error: ${err.message}`);
      }
      return;
    }

    if (url.pathname === '/api/tts') {
      const text = url.searchParams.get('text') || '';
      const role = url.searchParams.get('role') || 'villager';
      const speaker = url.searchParams.get('speaker') || '';
      try {
        const wav = await synthesizeWav(text, role, speaker);
        if (!wav) {
          res.writeHead(400);
          res.end('Empty text');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'audio/wav',
          'Cache-Control': 'public, max-age=3600',
        });
        res.end(wav);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`TTS error: ${err.message}`);
      }
      return;
    }

    // Static file serving
    let relPath = decodeURIComponent(url.pathname);
    if (relPath === '/') relPath = '/index.html';
    const fullPath = path.resolve(__dirname, '.' + relPath);
    if (!fullPath.startsWith(__dirname)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    const data = await fs.readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain' });
    res.end(err.code === 'ENOENT' ? 'Not Found' : 'Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Aetherbound RPG server running at http://localhost:${PORT} (with /api/tts Web Audio TTS)`);
});
