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
