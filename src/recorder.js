/**
 * Composite Replay Video Recorder: captures full UI + 3D scene + in-game Web Audio SFX.
 * Uses manual frame pushing (captureStream(0) + requestFrame) when available so
 * video frames stay tightly synchronized with the Web Audio stream clock.
 */
export class ReplayRecorder {
  constructor() {
    this.recCanvas = document.createElement('canvas');
    this.recCanvas.width = 1280;
    this.recCanvas.height = 720;
    this.recCtx = this.recCanvas.getContext('2d');
    this.recorder = null;
    this.videoTrack = null;
    this.chunks = [];
    this.recording = false;
    this.lastCaptureTime = 0;
    this.supported = typeof MediaRecorder !== 'undefined' && typeof this.recCanvas.captureStream === 'function';
  }

  start(audioStream = null) {
    if (!this.supported) return false;
    this.stop();
    this.chunks = [];
    this.lastCaptureTime = performance.now();
    try {
      // Prefer captureStream(0) + requestFrame() for deterministic frame timing
      const videoStream = this.recCanvas.captureStream(0);
      const vTrack = videoStream.getVideoTracks()[0];
      if (!vTrack || typeof vTrack.requestFrame !== 'function') {
        // Fallback to 30fps auto-capture
        const fallbackStream = this.recCanvas.captureStream(30);
        this.videoTrack = null;
        return this._beginMediaRecorder(fallbackStream, audioStream);
      }
      this.videoTrack = vTrack;
      return this._beginMediaRecorder(videoStream, audioStream);
    } catch {
      this.recording = false;
      return false;
    }
  }

  _beginMediaRecorder(videoStream, audioStream) {
    const tracks = [...videoStream.getVideoTracks()];
    if (audioStream) {
      tracks.push(...audioStream.getAudioTracks());
    }
    const combined = new MediaStream(tracks);
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    const mimeType = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';
    this.recorder = mimeType
      ? new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 3000000 })
      : new MediaRecorder(combined);
    this.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.chunks.push(e.data);
        if (this.chunks.length > 14400) {
          this.chunks.shift();
        }
      }
    };
    this.recorder.start(250);
    this.recording = true;
    return true;
  }

  captureFrame(drawFn) {
    if (!this.recording) return;
    const now = performance.now();
    const interval = 1000 / 30;
    if (now - this.lastCaptureTime < interval) return;
    // Advance by exact step (clamped to avoid burst catch-up after tab switch)
    this.lastCaptureTime = (now - this.lastCaptureTime > interval * 3) ? now : this.lastCaptureTime + interval;
    drawFn(this.recCtx, this.recCanvas.width, this.recCanvas.height);
    if (this.videoTrack && typeof this.videoTrack.requestFrame === 'function') {
      this.videoTrack.requestFrame();
    }
  }

  stop() {
    if (this.recorder && this.recording) {
      try {
        if (this.recorder.state !== 'inactive') {
          this.recorder.stop();
        }
      } catch {
        // ignore
      }
    }
    this.videoTrack = null;
    this.recording = false;
  }

  hasRecording() {
    return this.chunks.length > 0;
  }

  download(seed) {
    if (!this.chunks.length) return false;
    const blob = new Blob(this.chunks, { type: this.recorder?.mimeType || 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ironbound-wilds-seed-${seed}-replay.webm`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  }
}
