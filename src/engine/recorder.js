// WYSIWYG Synchronized MP4 Playthrough Recorder
// Composites the live 60fps game canvas + HUD + Action Bar + Banners + NPC Dialogue + Game Over
// together with Web Audio (SFX + Music + Web-Audio-routed NPC TTS) in exact A/V sync!

import { SPECIES_BY_ID } from '../data/species.js';
import { CLASS_BY_ID } from '../data/classes.js';
import { BONUS_SPELLS, MAX_POTIONS } from '../data/spells.js';

export class PlaythroughRecorder {
  constructor(canvas, audioEngine) {
    this.canvas = canvas;
    this.audioEngine = audioEngine;
    this.compCanvas = document.createElement('canvas');
    this.compCanvas.width = canvas.width || 1280;
    this.compCanvas.height = canvas.height || 720;
    this.compCtx = this.compCanvas.getContext('2d');

    this.recorder = null;
    this.captureStream = null;
    this.chunks = [];
    this.recording = false;
    this.startTime = 0;
    this.mimeType = 'video/mp4';
    this.extension = 'mp4';
    this.lastBlob = null;
    this.lastUrl = null;
  }

  static pickBestMimeType() {
    const candidates = [
      { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
      { mime: 'video/mp4;codecs=avc1.4D401E,mp4a.40.2', ext: 'mp4' },
      { mime: 'video/mp4;codecs=avc1,mp4a.40.2', ext: 'mp4' },
      { mime: 'video/mp4', ext: 'mp4' },
      { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
      { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
      { mime: 'video/webm', ext: 'webm' },
    ];
    if (typeof MediaRecorder === 'undefined') return null;
    for (const c of candidates) {
      if (MediaRecorder.isTypeSupported(c.mime)) return c;
    }
    return { mime: '', ext: 'mp4' };
  }

  start() {
    if (this.recording) return { started: false };
    const picked = PlaythroughRecorder.pickBestMimeType();
    if (!picked) {
      throw new Error('MediaRecorder is not supported in this browser.');
    }
    this.mimeType = picked.mime || 'video/mp4';
    this.extension = picked.ext;

    this.compCanvas.width = this.canvas.width || 1280;
    this.compCanvas.height = this.canvas.height || 720;

    // Seed first frame immediately so video stream has a valid frame at t=0
    this.compCtx.drawImage(this.canvas, 0, 0, this.compCanvas.width, this.compCanvas.height);

    const videoStream = this.compCanvas.captureStream(60);
    const tracks = [...videoStream.getVideoTracks()];
    const audioStream = this.audioEngine?.getRecordStream?.();
    if (audioStream) {
      tracks.push(...audioStream.getAudioTracks());
    }
    const combined = new MediaStream(tracks);
    this.captureStream = combined;

    this.chunks = [];
    const opts = picked.mime
      ? { mimeType: picked.mime, videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 192_000 }
      : { videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 192_000 };

    this.recorder = new MediaRecorder(combined, opts);
    this.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start(500);
    this.recording = true;
    this.startTime = performance.now();
    return { started: true };
  }

  captureFrame(game, uiState) {
    if (!this.recording) return;
    const ctx = this.compCtx;
    const W = this.compCanvas.width;
    const H = this.compCanvas.height;

    // 1. Base game viewport
    ctx.drawImage(this.canvas, 0, 0, W, H);

    // 2. Top HUD Overlay
    this._drawHud(ctx, game, W);

    // 3. Bottom Action Bar Overlay
    this._drawActionBar(ctx, game, W, H);

    // 4. Active Banner
    if (uiState.bannerText) {
      this._drawBanner(ctx, uiState.bannerText, W);
    }

    // 5. Active NPC Dialogue Box (shows speaker, wrapped text, and choices!)
    if (uiState.dialogue) {
      this._drawDialogueOverlay(ctx, uiState.dialogue, W, H);
    }

    // 6. Active Game Over Overlay
    if (uiState.gameOver) {
      this._drawGameOverOverlay(ctx, uiState.gameOver, W, H);
    }
  }

  _drawHud(ctx, game, W) {
    const ch = game.character;
    const p = game.player;
    if (!ch || !p) return;
    const sp = SPECIES_BY_ID[ch.speciesId];
    const cl = CLASS_BY_ID[ch.classId];

    ctx.save();
    ctx.fillStyle = 'rgba(14, 18, 32, 0.86)';
    ctx.fillRect(0, 0, W, 52);
    ctx.fillStyle = '#2c3552';
    ctx.fillRect(0, 51, W, 1);

    // Hero Name & Level
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fef08a';
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillText(ch.name, 16, 22);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 11px system-ui, sans-serif';
    ctx.fillText(`${sp?.name || ''} ${cl?.name || ''} · ${ch.title || ''}`, 16, 39);

    // HP Bar
    const bx = 250;
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillText('HP', bx, 20);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bx + 24, 10, 170, 11);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(bx + 24, 10, 170 * Math.max(0, Math.min(1, p.hp / p.maxHp)), 11);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`${Math.ceil(p.hp)}/${p.maxHp}`, bx + 202, 20);

    // MP Bar
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText('MP', bx, 39);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bx + 24, 29, 170, 11);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(bx + 24, 29, 170 * Math.max(0, Math.min(1, p.mana / p.maxMana)), 11);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`${Math.floor(p.mana)}/${p.maxMana}`, bx + 202, 39);

    // Gold & Potions
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.fillText(`Gold: ${ch.gold}`, 540, 31);
    ctx.fillStyle = '#86efac';
    ctx.fillText(`Potions: ${ch.potions}/${MAX_POTIONS}`, 640, 31);

    // Level Name (top-right)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText(game.level?.name || '', W - 18, 30);
    ctx.restore();
  }

  _drawActionBar(ctx, game, W, H) {
    const ch = game.character;
    const p = game.player;
    if (!ch || !p) return;
    const sp = SPECIES_BY_ID[ch.speciesId];
    const cl = CLASS_BY_ID[ch.classId];
    const bonusId = ch.bonusSpells?.length ? ch.bonusSpells[game.equippedBonusIdx % ch.bonusSpells.length] : null;
    const bonusSpell = bonusId ? BONUS_SPELLS[bonusId] : null;

    const slots = [
      { key: 'X / LMB', name: cl?.melee?.name || 'Melee', cd: p.cooldowns.classMelee > 0, accent: '#2563eb' },
      { key: 'Y / RMB', name: sp?.melee?.name || 'Racial', cd: p.cooldowns.racialMelee > 0, accent: '#ca8a04' },
      { key: 'B / Q', name: cl?.spell?.name || 'Spell', cd: p.cooldowns.classSpell > 0, accent: '#dc2626' },
      { key: 'RB / E', name: sp?.spell?.name || 'R.Spell', cd: p.cooldowns.racialSpell > 0, accent: '#475569' },
      { key: 'RT / R', name: bonusSpell ? bonusSpell.name : 'No Pact', cd: p.cooldowns.bonusSpell > 0 || !bonusSpell, accent: '#eab308' },
      { key: 'A / F', name: 'Talk / Dash', cd: false, accent: '#16a34a' },
      { key: 'LT / H', name: 'Potion', cd: ch.potions <= 0, accent: '#475569' },
    ];

    const slotW = 112;
    const gap = 8;
    const totalW = slots.length * slotW + (slots.length - 1) * gap;
    const startX = (W - totalW) / 2;
    const y = H - 58;

    ctx.save();
    ctx.fillStyle = 'rgba(13, 16, 28, 0.86)';
    ctx.strokeStyle = '#2c3552';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(startX - 10, y - 6, totalW + 20, 52, 10);
    ctx.fill();
    ctx.stroke();

    slots.forEach((s, i) => {
      const sx = startX + i * (slotW + gap);
      ctx.globalAlpha = s.cd ? 0.45 : 1;
      ctx.fillStyle = 'rgba(30, 38, 62, 0.9)';
      ctx.strokeStyle = s.accent;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(sx, y, slotW, 40, 7);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 10px system-ui, sans-serif';
      ctx.fillText(s.key, sx + slotW / 2, y + 14);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 11px system-ui, sans-serif';
      const label = s.name.length > 15 ? s.name.slice(0, 14) + '…' : s.name;
      ctx.fillText(label, sx + slotW / 2, y + 31);
    });
    ctx.restore();
  }

  _drawBanner(ctx, text, W) {
    ctx.save();
    ctx.font = '700 14px system-ui, sans-serif';
    const tw = Math.min(W - 80, ctx.measureText(text).width + 40);
    const bx = (W - tw) / 2;
    const by = 64;
    ctx.fillStyle = 'rgba(13, 17, 30, 0.92)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(bx, by, tw, 36, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, by + 23, tw - 24);
    ctx.restore();
  }

  _drawDialogueOverlay(ctx, dlg, W, H) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 7, 14, 0.62)';
    ctx.fillRect(0, 0, W, H);

    const bw = Math.min(640, W - 80);
    const lines = this._wrapText(ctx, dlg.text, bw - 48, '500 15px system-ui, sans-serif');
    const choicesH = (dlg.choices?.length || 0) * 44;
    const bh = 96 + lines.length * 22 + choicesH;
    const bx = (W - bw) / 2;
    const by = Math.max(66, (H - bh) / 2);

    ctx.fillStyle = '#141826';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 14);
    ctx.fill();
    ctx.stroke();

    // Speaker title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fef08a';
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.fillText(dlg.speaker || 'NPC', bx + 24, by + 34);

    ctx.fillStyle = '#2c3552';
    ctx.fillRect(bx + 20, by + 46, bw - 40, 1);

    // Dialogue body
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 15px system-ui, sans-serif';
    let cy = by + 72;
    for (const line of lines) {
      ctx.fillText(line, bx + 24, cy);
      cy += 22;
    }

    // Choice buttons
    cy += 12;
    (dlg.choices || []).forEach((c, i) => {
      const selected = i === dlg.selectedIdx;
      ctx.fillStyle = c.primary ? '#eab308' : '#1c2235';
      ctx.strokeStyle = selected ? '#fef08a' : '#2c3552';
      ctx.lineWidth = selected ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.roundRect(bx + 24, cy, bw - 48, 36, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = c.primary ? '#0f172a' : '#f1f5f9';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.fillText(c.label, bx + 38, cy + 23, bw - 76);
      cy += 44;
    });

    ctx.restore();
  }

  _drawGameOverOverlay(ctx, go, W, H) {
    ctx.save();
    ctx.fillStyle = 'rgba(20, 5, 8, 0.72)';
    ctx.fillRect(0, 0, W, H);
    const bw = 560;
    const bh = 210;
    const bx = (W - bw) / 2;
    const by = (H - bh) / 2;
    ctx.fillStyle = '#141826';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f87171';
    ctx.font = '800 22px system-ui, sans-serif';
    ctx.fillText('GAME OVER — YOU HAVE FALLEN', W / 2, by + 48);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 15px system-ui, sans-serif';
    ctx.fillText(go.cause || '', W / 2, by + 92, bw - 40);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 13px system-ui, sans-serif';
    ctx.fillText(go.stats || '', W / 2, by + 124, bw - 40);
    ctx.fillStyle = '#fecaca';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText('Restarting from the beginning of the level...', W / 2, by + 166);
    ctx.restore();
  }

  _wrapText(ctx, text, maxWidth, font) {
    ctx.save();
    ctx.font = font;
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let current = '';
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    ctx.restore();
    return lines;
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.recording || !this.recorder) {
        resolve(null);
        return;
      }
      this.recorder.onstop = () => {
        this.recording = false;
        const blob = new Blob(this.chunks, { type: this.mimeType || 'video/mp4' });
        if (this.lastUrl) URL.revokeObjectURL(this.lastUrl);
        this.lastBlob = blob;
        this.lastUrl = URL.createObjectURL(blob);
        resolve({
          blob,
          url: this.lastUrl,
          extension: this.extension,
          mimeType: this.mimeType,
          durationSec: Math.max(1, Math.round((performance.now() - this.startTime) / 1000)),
        });
      };
      this.recorder.stop();
    });
  }

  getElapsedString() {
    if (!this.recording) return '00:00';
    const sec = Math.floor((performance.now() - this.startTime) / 1000);
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  download(filenameBase = 'aetherbound-playthrough') {
    if (!this.lastBlob || !this.lastUrl) return;
    const a = document.createElement('a');
    a.href = this.lastUrl;
    a.download = `${filenameBase}.${this.extension}`;
    a.click();
  }

  async share(title = 'My Aetherbound RPG Playthrough') {
    if (!this.lastBlob) return { shared: false, reason: 'No recording available.' };
    const file = new File([this.lastBlob], `aetherbound-playthrough.${this.extension}`, {
      type: this.lastBlob.type || 'video/mp4',
    });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text: 'Watch my playthrough of Aetherbound: Chronicles of the Fourfold Temple!',
        files: [file],
      });
      return { shared: true };
    }
    this.download('aetherbound-playthrough');
    return { shared: false, reason: 'Downloaded MP4 directly (native share sheet unavailable in this browser).' };
  }
}
