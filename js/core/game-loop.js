export class GameLoop {
  #update;
  #render;
  #onFrame;
  #running = false;
  #frameHandle = 0;
  #lastTime = 0;
  #lastRenderTime = 0;
  #accumulator = 0;
  #stepMs;

  constructor({ update, render, targetFps = 60, onFrame = () => {} }) {
    this.#update = update;
    this.#render = render;
    this.#onFrame = onFrame;
    this.#stepMs = 1000 / targetFps;
  }

  start() {
    if (this.#running) return;
    this.#running = true;
    this.#lastTime = performance.now();
    this.#lastRenderTime = this.#lastTime - this.#stepMs;
    this.#frameHandle = requestAnimationFrame(this.#tick);
  }

  stop() {
    this.#running = false;
    cancelAnimationFrame(this.#frameHandle);
  }

  resetClock() {
    this.#lastTime = performance.now();
    this.#lastRenderTime = this.#lastTime - this.#stepMs;
    this.#accumulator = 0;
  }

  #tick = (now) => {
    if (!this.#running) return;

    const rawDelta = now - this.#lastTime;
    const delta = Math.min(rawDelta, 100);
    this.#lastTime = now;
    this.#accumulator += delta;

    while (this.#accumulator >= this.#stepMs) {
      this.#update(this.#stepMs / 1000);
      this.#accumulator -= this.#stepMs;
    }

    // 60Hz의 15~17ms 지터는 매 프레임 렌더하고, 120Hz의 약 8ms 콜백은 한 번 건너뜁니다.
    if (now - this.#lastRenderTime >= this.#stepMs * 0.8) {
      const renderStart = performance.now();
      this.#render(this.#accumulator / this.#stepMs);
      const renderDuration = performance.now() - renderStart;
      this.#onFrame({ frameDelta: rawDelta, renderDuration });
      this.#lastRenderTime = now;
    }

    this.#frameHandle = requestAnimationFrame(this.#tick);
  };
}
