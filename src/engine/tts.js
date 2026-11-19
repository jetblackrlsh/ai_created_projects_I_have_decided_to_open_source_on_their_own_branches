// Synchronized Web Audio TTS Engine (routes real spoken NPC voices through AudioEngine -> speakers AND MP4 recorder!)
// Falls back cleanly to window.speechSynthesis if /api/tts is unavailable.

const ROLE_PLAYBACK = {
  priest: { playbackRate: 0.96, gain: 1.55 },
  elemental_fire: { playbackRate: 0.86, gain: 1.65 },
  elemental_water: { playbackRate: 0.93, gain: 1.55 },
  elemental_earth: { playbackRate: 0.78, gain: 1.7 },
  elemental_air: { playbackRate: 1.08, gain: 1.55 },
  villager: { playbackRate: 1.0, gain: 1.5 },
  bard: { playbackRate: 1.04, gain: 1.55 },
  alien_commander: { playbackRate: 0.92, gain: 1.6 },
  alien_queen: { playbackRate: 0.94, gain: 1.6 },
  alien_drummer: { playbackRate: 0.82, gain: 1.7 },
};

export class DialogueTTS {
  constructor(audioEngine) {
    this.audio = audioEngine;
    this.enabled = true;
    this.muted = false;
    this.lastUtteranceArgs = null;
    this.activeSource = null;
    this.speakSeq = 0;
    this.bufferCache = new Map();
    this.serverAvailable = true;
  }

  setEnabled(flag) {
    this.enabled = Boolean(flag);
    if (!this.enabled) this.stop();
  }

  setMuted(flag) {
    this.muted = Boolean(flag);
    if (this.muted) this.stop();
  }

  async speak(text, { speaker = '', role = 'villager', force = false } = {}) {
    this.lastUtteranceArgs = { text, speaker, role };
    if (!text) return false;
    if (!force && (!this.enabled || this.muted)) return false;

    this.stop();
    const mySeq = ++this.speakSeq;

    // Primary: Fetch WAV from local /api/tts and play through Web Audio API (recorded in MP4 in exact sync!)
    if (this.serverAvailable && this.audio) {
      try {
        const ctx = this.audio.ensureContext();
        if (ctx) {
          const key = `${role}|${speaker}|${text}`;
          let audioBuffer = this.bufferCache.get(key);
          if (!audioBuffer) {
            const params = new URLSearchParams({ text, role, speaker });
            const resp = await fetch(`/api/tts?${params.toString()}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const arr = await resp.arrayBuffer();
            audioBuffer = await ctx.decodeAudioData(arr);
            this.bufferCache.set(key, audioBuffer);
          }

          if (mySeq !== this.speakSeq || (!force && (!this.enabled || this.muted))) {
            return false;
          }

          const src = ctx.createBufferSource();
          src.buffer = audioBuffer;
          const profile = ROLE_PLAYBACK[role] || ROLE_PLAYBACK.villager;
          src.playbackRate.value = profile.playbackRate;

          const voiceGain = ctx.createGain();
          voiceGain.gain.value = profile.gain;
          src.connect(voiceGain);
          voiceGain.connect(this.audio.master);

          this.activeSource = src;
          src.onended = () => {
            if (this.activeSource === src) this.activeSource = null;
          };
          src.start(0);
          return true;
        }
      } catch {
        this.serverAvailable = false;
      }
    }

    // Fallback: Browser Web Speech API
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.98;
      utter.volume = 0.95;
      window.speechSynthesis.speak(utter);
      return true;
    }
    return false;
  }

  replay() {
    if (!this.lastUtteranceArgs) return false;
    return this.speak(this.lastUtteranceArgs.text, {
      speaker: this.lastUtteranceArgs.speaker,
      role: this.lastUtteranceArgs.role,
      force: true,
    });
  }

  stop() {
    this.speakSeq++;
    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch {}
      this.activeSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
