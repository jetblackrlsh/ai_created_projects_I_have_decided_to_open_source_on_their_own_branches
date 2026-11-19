// Procedural Web Audio API sound & ambient synth with recording stream output

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.recordDest = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicMode = 'dungeon'; // dungeon | boss | victory
  }

  ensureContext() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.32;
      this.master.connect(this.ctx.destination);
      if (this.ctx.createMediaStreamDestination) {
        this.recordDest = this.ctx.createMediaStreamDestination();
        this.master.connect(this.recordDest);
        // Continuous silent clock signal prevents MediaRecorder A/V sync drift during quiet moments
        const keepAlive = this.ctx.createConstantSource();
        const silentGain = this.ctx.createGain();
        silentGain.gain.value = 0.0;
        keepAlive.connect(silentGain);
        silentGain.connect(this.recordDest);
        keepAlive.start();
      }
      this.startAmbientLoop();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  getRecordStream() {
    this.ensureContext();
    return this.recordDest ? this.recordDest.stream : null;
  }

  setMuted(flag) {
    this.muted = flag;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(flag ? 0 : 0.32, this.ctx.currentTime, 0.05);
    }
  }

  setMusicMode(mode) {
    this.musicMode = mode;
  }

  startAmbientLoop() {
    if (this.musicTimer) return;
    const scales = {
      dungeon: [146.83, 174.61, 220.0, 261.63, 293.66, 220.0, 196.0, 164.81],
      boss: [130.81, 155.56, 196.0, 207.65, 261.63, 196.0, 155.56, 146.83],
      victory: [261.63, 329.63, 392.0, 523.25, 440.0, 392.0, 329.63, 293.66],
    };
    this.musicTimer = setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running' || this.muted) return;
      const notes = scales[this.musicMode] || scales.dungeon;
      const freq = notes[this.musicStep % notes.length];
      this.musicStep++;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = this.musicMode === 'boss' ? 'sawtooth' : 'triangle';
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = this.musicMode === 'boss' ? 680 : 520;
      osc.frequency.setValueAtTime(freq * 0.5, now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.09, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
      osc.connect(filter);
      filter.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.65);
    }, 520);
  }

  playTone(freq, endFreq, duration, type = 'sine', volume = 0.28) {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playMelee(heavy = false) {
    this.playTone(heavy ? 180 : 340, heavy ? 55 : 110, heavy ? 0.22 : 0.13, heavy ? 'sawtooth' : 'triangle', 0.28);
  }

  playSpell(pitch = 520) {
    this.playTone(pitch, pitch * 1.45, 0.22, 'sine', 0.24);
    setTimeout(() => this.playTone(pitch * 1.2, pitch * 0.6, 0.24, 'triangle', 0.18), 55);
  }

  playHit(crit = false) {
    this.playTone(crit ? 420 : 210, 65, 0.14, 'square', crit ? 0.26 : 0.18);
  }

  playPlayerHurt() {
    this.playTone(150, 58, 0.24, 'sawtooth', 0.3);
  }

  playHeal() {
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      setTimeout(() => this.playTone(f, f * 1.02, 0.22, 'sine', 0.18), i * 65);
    });
  }

  playChest() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => this.playTone(f, f, 0.24, 'triangle', 0.24), i * 70);
    });
  }

  playFanfare() {
    [293.66, 369.99, 440, 587.33, 739.99, 880].forEach((f, i) => {
      setTimeout(() => this.playTone(f, f * 1.01, 0.38, 'triangle', 0.24), i * 90);
    });
  }

  playDash() {
    this.playTone(260, 540, 0.12, 'sine', 0.16);
  }

  playGameOver() {
    [220, 196, 174.61, 130.81].forEach((f, i) => {
      setTimeout(() => this.playTone(f, f * 0.94, 0.42, 'sawtooth', 0.22), i * 160);
    });
  }
}
