import {
  LEVEL_COLORS,
  OBJECT_SPRITE_PATHS,
  PERFORMANCE,
  PLAYER_RENDER,
  WORLD,
} from '../config.js';

const VIRTUAL_WIDTH = 1920;
const VIRTUAL_HEIGHT = 1080;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    // 태블릿에서는 desynchronized Canvas가 한 프레임의 일부를 먼저 표시해
    // 투명 PNG 물건이 번쩍일 수 있으므로 브라우저의 기본 합성 버퍼를 사용한다.
    this.context = canvas.getContext('2d', { alpha: false });
    this.cssWidth = 0;
    this.cssHeight = 0;
    this.dpr = 1;
    this.scale = 1;
    this.viewportWidth = VIRTUAL_WIDTH;
    this.viewportHeight = VIRTUAL_HEIGHT;
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.cssWidth = Math.max(1, Math.round(rect.width));
    this.cssHeight = Math.max(1, Math.round(rect.height));
    this.dpr = Math.min(window.devicePixelRatio || 1, PERFORMANCE.maxDpr);
    this.scale = Math.min(this.cssWidth / VIRTUAL_WIDTH, this.cssHeight / VIRTUAL_HEIGHT);
    this.viewportWidth = this.cssWidth / this.scale;
    this.viewportHeight = this.cssHeight / this.scale;

    const targetWidth = Math.round(this.cssWidth * this.dpr);
    const targetHeight = Math.round(this.cssHeight * this.dpr);
    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
    }
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
  }

  beginFrame(camera) {
    const ctx = this.context;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const transformScale = this.dpr * this.scale;
    ctx.setTransform(transformScale, 0, 0, transformScale, 0, 0);
    ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
  }

  screenToWorld(clientX, clientY, camera) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: camera.x + (clientX - rect.left) / this.scale,
      y: camera.y + (clientY - rect.top) / this.scale,
    };
  }

  drawBackground(camera, location, assets) {
    for (const path of location.tilePaths) {
      const match = path.match(/tile_r(\d)_c(\d)\.png$/);
      if (!match) continue;
      const row = Number(match[1]);
      const column = Number(match[2]);
      const x = (column - 1) * WORLD.tileWidth;
      const y = (row - 1) * WORLD.tileHeight;
      if (!this.#isVisible(x, y, WORLD.tileWidth, WORLD.tileHeight, camera)) continue;
      const image = assets.get(path);
      if (image) this.context.drawImage(image, Math.round(x), Math.round(y));
    }
  }

  drawPlayer(player, image) {
    const width = player.renderWidth ?? player.width;
    const height = player.renderHeight ?? player.height;
    const x = Math.round(player.x - width / 2);
    const renderScale = player.renderScale ?? 1;
    const y = Math.round(player.y - height + PLAYER_RENDER.groundOffsetY * renderScale);
    const ctx = this.context;

    ctx.save();
    if (player.facing < 0) {
      ctx.translate(Math.round(player.x * 2), 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(image, x, y, width, height);
    ctx.restore();

    const labelY = y - 16;
    this.#drawLevelLabel(player.name, player.level, Math.round(player.x), labelY, 28, 6);
  }

  drawExplosion(effect, image, camera) {
    const size = effect.size * (effect.frameIndex === 0 ? 0.9 : 1.08);
    const x = effect.x - size / 2;
    const y = effect.y - size / 2;
    if (!this.#isVisible(x, y, size, size, camera)) return;
    this.context.drawImage(
      image,
      Math.round(x),
      Math.round(y),
      Math.round(size),
      Math.round(size),
    );
  }

  drawObjects(objectManager, assets, camera) {
    const ctx = this.context;
    for (const item of objectManager.objects) {
      const box = item.hitbox;
      const spritePath = OBJECT_SPRITE_PATHS[item.id]?.[item.state - 1];
      const sprite = spritePath ? assets.get(spritePath) : null;
      const drawWidth = sprite ? item.width * 2 : box.width;
      const drawHeight = sprite ? drawWidth * (sprite.height / sprite.width) : box.height;
      const drawX = sprite ? item.x - drawWidth / 2 : box.x;
      const drawY = sprite ? item.y - drawHeight : box.y;
      if (!this.#isVisible(drawX - 12, drawY - 64, drawWidth + 24, drawHeight + 76, camera)) {
        continue;
      }
      ctx.save();
      if (sprite) {
        ctx.drawImage(
          sprite,
          Math.round(drawX),
          Math.round(drawY),
          Math.round(drawWidth),
          Math.round(drawHeight),
        );
        if (item.destroyed) {
          ctx.restore();
          continue;
        }
      } else if (item.destroyed) {
        ctx.fillStyle = 'rgba(90,72,55,.55)';
        ctx.fillRect(Math.round(box.x), Math.round(item.y - 20), Math.round(box.width), 20);
        ctx.restore();
        continue;
      } else {
        const colors = ['#77b5d9', '#e2b94f', '#e47f45'];
        ctx.fillStyle = colors[item.state - 1];
        ctx.strokeStyle = '#4a3b2c';
        ctx.lineWidth = 5;
        ctx.fillRect(Math.round(box.x), Math.round(box.y), Math.round(box.width), Math.round(box.height));
        ctx.strokeRect(Math.round(box.x), Math.round(box.y), Math.round(box.width), Math.round(box.height));
      }

      this.#drawLevelLabel(item.name, item.requiredLevel, item.x, box.y - 30, 23, 5);

      const hpWidth = item.width;
      ctx.fillStyle = 'rgba(44,62,80,.65)';
      ctx.fillRect(box.x, box.y - 20, hpWidth, 10);
      ctx.fillStyle = '#e94f4f';
      ctx.fillRect(box.x, box.y - 20, hpWidth * (item.hp / item.maxHp), 10);
      ctx.restore();
    }
  }

  #drawLevelLabel(name, level, centerX, y, fontSize, lineWidth) {
    const ctx = this.context;
    const nameText = `${name} · `;
    const levelText = `Lv.${level}`;
    const levelColor = LEVEL_COLORS[level - 1] ?? LEVEL_COLORS[LEVEL_COLORS.length - 1];
    ctx.save();
    ctx.font = `800 ${fontSize}px "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = 'rgba(28,36,46,.96)';
    const nameWidth = ctx.measureText(nameText).width;
    const levelWidth = ctx.measureText(levelText).width;
    const startX = centerX - (nameWidth + levelWidth) / 2;

    ctx.strokeText(nameText, startX, y);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(nameText, startX, y);
    ctx.strokeText(levelText, startX + nameWidth, y);
    ctx.fillStyle = levelColor;
    ctx.fillText(levelText, startX + nameWidth, y);
    ctx.restore();
  }

  #isVisible(x, y, width, height, camera) {
    return x + width > camera.x && x < camera.x + camera.viewportWidth
      && y + height > camera.y && y < camera.y + camera.viewportHeight;
  }
}
