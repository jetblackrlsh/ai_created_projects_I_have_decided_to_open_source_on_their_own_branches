// LUCID DUEL: SPELLGAUNTLET — Web Audio Procedural SFX Engine
// Never auto-plays; activates cleanly on user gesture and supports mute toggle.

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(freq, duration = 0.14, type = 'sine', volume = 0.12, slideTo = null) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), now + duration);
    }
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  cardPlay() {
    this.playTone(320, 0.12, 'triangle', 0.11, 580);
  }

  attackHit(big = false) {
    if (big) {
      this.playTone(180, 0.32, 'sawtooth', 0.16, 48);
      setTimeout(() => this.playTone(420, 0.22, 'square', 0.1, 110), 60);
    } else {
      this.playTone(220, 0.18, 'sawtooth', 0.12, 75);
    }
  }

  shieldUp() {
    this.playTone(440, 0.18, 'sine', 0.1, 660);
    setTimeout(() => this.playTone(660, 0.22, 'triangle', 0.08, 880), 80);
  }

  diceRoll() {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playTone(500 + Math.random() * 450, 0.05, 'triangle', 0.07);
      }, i * 55);
    }
  }

  fusion() {
    this.playTone(220, 0.45, 'sawtooth', 0.12, 880);
    setTimeout(() => this.playTone(330, 0.45, 'triangle', 0.12, 1320), 90);
    setTimeout(() => this.playTone(660, 0.5, 'sine', 0.14, 1760), 180);
  }

  lightning() {
    this.playTone(980, 0.12, 'sawtooth', 0.14, 180);
    setTimeout(() => this.playTone(1320, 0.25, 'square', 0.12, 95), 70);
  }

  gachaReveal(rarity = 'common') {
    const notes =
      rarity === 'divine' ? [523, 659, 784, 1046, 1318] :
      rarity === 'epic'   ? [440, 554, 659, 880] :
      rarity === 'rare'   ? [392, 494, 587] : [330, 392];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, 0.22, 'triangle', 0.12), idx * 95);
    });
  }

  victory() {
    [523, 659, 784, 1046].forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.26, 'triangle', 0.13), i * 110);
    });
  }

  defeat() {
    [330, 294, 247, 196].forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.28, 'sawtooth', 0.1), i * 140);
    });
  }
}

export const sfx = new SoundEngine();
