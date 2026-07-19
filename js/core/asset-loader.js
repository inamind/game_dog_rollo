export class AssetLoader {
  #cache = new Map();
  #concurrency;

  constructor({ concurrency = 3 } = {}) {
    this.#concurrency = Math.max(1, Math.floor(concurrency));
  }

  get(path) {
    return this.#cache.get(path);
  }

  has(path) {
    return this.#cache.has(path);
  }

  async load(paths, onProgress = () => {}) {
    const uniquePaths = [...new Set(paths)];
    const pending = uniquePaths.filter((path) => !this.#cache.has(path));
    let completed = uniquePaths.length - pending.length;
    onProgress(completed, uniquePaths.length);

    let cursor = 0;
    const worker = async () => {
      while (cursor < pending.length) {
        const path = pending[cursor];
        cursor += 1;
        const image = await this.#decodeImage(path);
        this.#cache.set(path, image);
        completed += 1;
        onProgress(completed, uniquePaths.length);
      }
    };

    const workerCount = Math.min(this.#concurrency, pending.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return uniquePaths.map((path) => this.#cache.get(path));
  }

  async #decodeImage(path) {
    const image = new Image();
    image.decoding = 'async';
    image.src = path;

    if (typeof image.decode === 'function') {
      await image.decode();
      return image;
    }

    await new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', () => reject(new Error(`이미지를 불러오지 못했습니다: ${path}`)), { once: true });
    });
    return image;
  }
}
