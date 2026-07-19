export class BgmPlayer {
  constructor(path, { volume = 0.24 } = {}) {
    this.path = path;
    this.volume = volume;
    this.audio = null;
    this.started = false;
    this.disposed = false;
  }

  play() {
    if (this.disposed || typeof Audio === 'undefined') return Promise.resolve(false);
    if (!this.audio) {
      this.audio = new Audio(this.path);
      this.audio.loop = true;
      this.audio.preload = 'auto';
      this.audio.volume = this.volume;
    }
    this.started = true;
    return this.audio.play().then(() => true).catch(() => false);
  }

  pause() {
    this.audio?.pause();
  }

  resume() {
    if (this.started) this.play();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.src = '';
    this.audio.load();
  }
}
