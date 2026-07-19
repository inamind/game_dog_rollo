import { COMBAT, PLAYER_RENDER } from '../config.js';

function intersects(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x
    && a.y < b.y + b.height && a.y + a.height > b.y;
}

function containsPoint(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function attackRange(player) {
  const visualWidth = player.renderWidth ?? player.width;
  const visualHeight = player.renderHeight ?? player.height;
  const rangeWidth = Math.max(visualWidth * 0.45, COMBAT.minimumAttackReach);
  const rangeHeight = visualHeight * 0.75;
  const bodyFront = visualWidth * 0.5;
  return {
    x: player.facing > 0 ? player.x + bodyFront : player.x - bodyFront - rangeWidth,
    y: player.y - rangeHeight,
    width: rangeWidth,
    height: rangeHeight,
  };
}

class DestructibleObject {
  constructor(definition) {
    Object.assign(this, definition);
    const requiredScale = PLAYER_RENDER.scaleByLevel[this.requiredLevel - 1]
      ?? PLAYER_RENDER.scaleByLevel[PLAYER_RENDER.scaleByLevel.length - 1];
    const requiredDogHeight = PLAYER_RENDER.baseSize * requiredScale;
    const maximumMountHeight = requiredDogHeight * COMBAT.maximumMountHeightRatio;
    this.floorY = definition.floorY ?? definition.y;
    this.y = Math.max(definition.y, this.floorY - maximumMountHeight);
    this.maxHp = COMBAT.objectHpByLevel[this.requiredLevel - 1];
    this.hp = this.maxHp;
    this.destroyed = false;
  }

  get hitbox() {
    return { x: this.x - this.width / 2, y: this.y - this.height, width: this.width, height: this.height };
  }

  get touchHitbox() {
    return {
      x: this.x - this.width,
      y: this.y - this.height * 2,
      width: this.width * 2,
      height: this.height * 2,
    };
  }

  get state() {
    if (this.hp <= 0) return 4;
    const ratio = this.hp / this.maxHp;
    if (ratio <= 0.4) return 3;
    if (ratio <= 0.7) return 2;
    return 1;
  }

  damage(amount) {
    if (this.destroyed) return false;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0) this.destroyed = true;
    return this.destroyed;
  }
}

export class ObjectManager {
  constructor(definitions) {
    this.objects = definitions.map((definition) => new DestructibleObject(definition));
  }

  get destroyedCount() {
    return this.objects.filter((item) => item.destroyed).length;
  }

  get allDestroyed() {
    return this.destroyedCount === this.objects.length;
  }

  canTouchSmash(player, worldX, worldY) {
    const range = attackRange(player);
    return this.objects.some((item) => (
      !item.destroyed
      && containsPoint(item.touchHitbox, worldX, worldY)
      && intersects(range, item.hitbox)
    ));
  }

  attack(player, attackType) {
    const damageBase = COMBAT.smashDamageByLevel[player.level - 1];
    const isSpecial = attackType === 'biting';
    const range = attackRange(player);
    const result = { hit: 0, blocked: [], damaged: [], destroyed: [], range };

    for (const item of this.objects) {
      if (item.destroyed || !intersects(range, item.hitbox)) continue;
      if (player.level < item.requiredLevel) {
        result.blocked.push(item);
        continue;
      }
      result.hit += 1;
      const wasDestroyed = item.damage(isSpecial ? item.hp : damageBase);
      result.damaged.push(item);
      if (wasDestroyed) result.destroyed.push(item);
    }
    return result;
  }
}
