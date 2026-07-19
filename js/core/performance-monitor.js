export class PerformanceMonitor {
  #longFrameMs;
  #sampleStarted = performance.now();
  #frames = 0;
  #longFrames = 0;
  #maxFrameMs = 0;
  #maxRenderMs = 0;
  #fps = 0;

  constructor({ longFrameMs = 50 } = {}) {
    this.#longFrameMs = longFrameMs;
  }

  reset() {
    this.#sampleStarted = performance.now();
    this.#frames = 0;
    this.#longFrames = 0;
    this.#maxFrameMs = 0;
    this.#maxRenderMs = 0;
    this.#fps = 0;
  }

  record({ frameDelta, renderDuration }) {
    this.#frames += 1;
    this.#maxFrameMs = Math.max(this.#maxFrameMs, frameDelta);
    this.#maxRenderMs = Math.max(this.#maxRenderMs, renderDuration);
    if (frameDelta >= this.#longFrameMs) this.#longFrames += 1;

    const elapsed = performance.now() - this.#sampleStarted;
    if (elapsed >= 1000) {
      this.#fps = Math.round((this.#frames * 1000) / elapsed);
      this.#frames = 0;
      this.#sampleStarted = performance.now();
    }
  }

  snapshot() {
    return {
      fps: this.#fps,
      longFrames: this.#longFrames,
      maxFrameMs: Math.round(this.#maxFrameMs * 10) / 10,
      maxRenderMs: Math.round(this.#maxRenderMs * 10) / 10,
    };
  }
}
