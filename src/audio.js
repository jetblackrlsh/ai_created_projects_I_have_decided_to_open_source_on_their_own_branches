/**
 * Procedural Web Audio synthesizer for combat, mining, crafting, and UI feedback.
 * Routes audio to both speakers and a MediaStreamDestination for replay recording,
 * with a silent keep-alive node so the audio track clock stays 1:1 synced with video.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.streamDest = null;
    this.keepAliveNode = null;
    this.enabled = true;
    this._readyCallbacks = [];
  }

  onReady(cb) {
    if (this.ctx && this.ctx.state === 'running') {
      cb(this.getAudioStream());
    } else {
      this._readyCallbacks.push(cb);
    }
  }

  _startKeepAlive() {
    if (!this.ctx || !this.streamDest || this.keepAliveNode) return;
    if (typeof this.ctx.createConstantSource === 'function') {
      const src = this.ctx.createConstantSource();
      src.offset.value = 0;
      src.connect(this.streamDest);
      src.start();
      this.keepAliveNode = src;
    }
  }

  _notifyReady() {
    if (this.ctx && this.ctx.state === 'running') {
      this._startKeepAlive();
      const stream = this.streamDest ? this.streamDest.stream : null;
      while (this._readyCallbacks.length > 0) {
        const cb = this._readyCallbacks.shift();
        cb(stream);
      }
    }
  }

  ensureCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.enabled ? 1 : 0;
        this.masterGain.connect(this.ctx.destination);
        if (typeof this.ctx.createMediaStreamDestination === 'function') {
          this.streamDest = this.ctx.createMediaStreamDestination();
          this.masterGain.connect(this.streamDest);
        }
        this.ctx.addEventListener('statechange', () => this._notifyReady());
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => this._notifyReady()).catch(() => {});
    } else {
      this._notifyReady();
    }
    if (this.masterGain) {
      this.masterGain.gain.value = this.enabled ? 1 : 0;
    }
    return this.enabled ? this.ctx : null;
  }

  setEnabled(val) {
    this.enabled = val;
    if (this.masterGain) {
      this.masterGain.gain.value = val ? 1 : 0;
    }
  }

  getAudioStream() {
    if (!this.ctx) {
      const prev = this.enabled;
      this.enabled = true;
      this.ensureCtx();
      this.enabled = prev;
      if (this.masterGain) this.masterGain.gain.value = prev ? 1 : 0;
    }
    return this.streamDest ? this.streamDest.stream : null;
  }

  playTone(freq, endFreq, duration, type = 'sine', gainVal = 0.16) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  playNoise(duration, filterFreq = 900, gainVal = 0.14) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.value = gainVal;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();
  }

  slash() {
    this.playNoise(0.14, 1400, 0.16);
    this.playTone(280, 95, 0.12, 'triangle', 0.12);
  }

  wandCast() {
    this.playTone(540, 1180, 0.18, 'sine', 0.12);
    this.playTone(880, 420, 0.22, 'triangle', 0.08);
  }

  hitEnemy() {
    this.playTone(180, 55, 0.11, 'sawtooth', 0.15);
    this.playNoise(0.08, 600, 0.12);
  }

  playerHurt() {
    this.playTone(140, 45, 0.2, 'sawtooth', 0.2);
  }

  guardBlock() {
    this.playTone(620, 320, 0.12, 'square', 0.1);
  }

  mineStrike() {
    this.playTone(980, 520, 0.09, 'triangle', 0.15);
    this.playNoise(0.07, 2200, 0.12);
  }

  gearBreak() {
    this.playNoise(0.32, 1800, 0.25);
    this.playTone(300, 50, 0.35, 'sawtooth', 0.22);
  }

  craftSuccess() {
    this.playTone(440, 660, 0.14, 'triangle', 0.14);
    setTimeout(() => this.playTone(660, 880, 0.2, 'sine', 0.15), 90);
  }

  campRest() {
    this.playTone(330, 440, 0.28, 'sine', 0.12);
    setTimeout(() => this.playTone(440, 554, 0.32, 'sine', 0.12), 140);
    setTimeout(() => this.playTone(554, 659, 0.42, 'sine', 0.12), 280);
  }

  dayTransition() {
    this.playTone(293.66, 440, 0.45, 'sine', 0.12);
    setTimeout(() => this.playTone(440, 587.33, 0.55, 'triangle', 0.1), 180);
  }

  gameOver() {
    this.playTone(220, 110, 0.35, 'sawtooth', 0.18);
    setTimeout(() => this.playTone(165, 65, 0.55, 'sawtooth', 0.18), 260);
  }
}

export const sound = new SoundEngine();
