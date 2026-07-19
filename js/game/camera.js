function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export class Camera {
  constructor(bounds) {
    this.bounds = bounds;
    this.x = bounds.x;
    this.y = bounds.y;
    this.viewportWidth = 1920;
    this.viewportHeight = 1080;
  }

  setViewport(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.#clampToBounds();
  }

  follow(target, smoothing = 0.14) {
    const desiredX = target.x - this.viewportWidth / 2;
    const desiredY = target.y - this.viewportHeight / 2;
    this.x += (desiredX - this.x) * smoothing;
    this.y += (desiredY - this.y) * smoothing;
    this.#clampToBounds();
  }

  #clampToBounds() {
    const maxX = Math.max(this.bounds.x, this.bounds.x + this.bounds.width - this.viewportWidth);
    const maxY = Math.max(this.bounds.y, this.bounds.y + this.bounds.height - this.viewportHeight);
    this.x = clamp(this.x, this.bounds.x, maxX);
    this.y = clamp(this.y, this.bounds.y, maxY);
  }
}
