import { GAME_FLOW, PLAYER_RENDER, SPRITE_PATHS } from '../config.js';

const ACTIONS = {
  idle: { frames: [SPRITE_PATHS.running[0]], frameSeconds: 0.1, loop: false },
  running: { frames: SPRITE_PATHS.running, frameSeconds: 0.1, loop: true },
  jumping: { frames: SPRITE_PATHS.jumping, frameSeconds: 0.14, loop: true },
  smashing: { frames: SPRITE_PATHS.smashing, frameSeconds: 0.12, loop: false },
  biting: { frames: SPRITE_PATHS.biting, frameSeconds: 0.15, loop: false },
  levelup: { frames: SPRITE_PATHS.levelup, frameSeconds: 0.5, loop: false },
  victory: { frames: SPRITE_PATHS.victory, frameSeconds: GAME_FLOW.victoryFrameSeconds, loop: true },
};

export class PlayerController {
  constructor({ name, spawn, navigation }) {
    this.name = name;
    this.level = 1;
    this.exp = 0;
    this.x = spawn.x;
    this.y = spawn.y;
    this.width = PLAYER_RENDER.baseSize;
    this.height = PLAYER_RENDER.baseSize;
    this.facing = 1;
    this.floor = 0;
    this.navigation = navigation;
    this.route = [];
    this.routeMode = null;
    this.action = 'idle';
    this.frameIndex = 0;
    this.frameElapsed = 0;
    this.attackHitPending = false;
    this.speed = 520;
  }

  get spritePath() {
    return ACTIONS[this.action].frames[this.frameIndex];
  }

  get renderScale() {
    return PLAYER_RENDER.scaleByLevel[this.level - 1]
      ?? PLAYER_RENDER.scaleByLevel[PLAYER_RENDER.scaleByLevel.length - 1];
  }

  get renderWidth() {
    return this.width * this.renderScale;
  }

  get renderHeight() {
    return this.height * this.renderScale;
  }

  moveHorizontal(direction) {
    if (this.isAnimationLocked()) return;
    if (direction === 0) {
      if (this.routeMode === 'horizontal') {
        this.route = [];
        this.routeMode = null;
      }
      return;
    }
    if (this.navigation.isOnStairs(this)) return;
    this.route = this.navigation.buildHorizontalRoute(this, direction);
    this.routeMode = 'horizontal';
  }

  moveFloor(direction) {
    if (this.isAnimationLocked()) return;
    if (this.routeMode === 'stairs' && this.route.length > 0) return;
    const route = this.navigation.buildStairStep(this, direction);
    if (route.length === 0) return;
    this.route = route;
    this.routeMode = 'stairs';
  }

  attack(type) {
    if (this.isAnimationLocked()) return false;
    this.route = [];
    this.routeMode = null;
    this.#setAction(type);
    this.attackHitPending = true;
    return true;
  }

  isAttacking() {
    return this.action === 'smashing' || this.action === 'biting';
  }

  isAnimationLocked() {
    return this.isAttacking() || this.action === 'levelup' || this.action === 'victory';
  }

  consumeAttackHit() {
    if (!this.attackHitPending || this.frameIndex < 1) return null;
    this.attackHitPending = false;
    return this.action;
  }

  setLevel(level) {
    if (level <= this.level) return;
    this.level = level;
    this.route = [];
    this.routeMode = null;
    this.#setAction('levelup');
  }

  setVictory() {
    this.route = [];
    this.routeMode = null;
    this.#setAction('victory');
  }

  update(delta) {
    if (!this.isAnimationLocked()) this.#updateMovement(delta);
    this.#updateAnimation(delta);
  }

  #updateMovement(delta) {
    const target = this.route[0];
    if (!target) {
      this.routeMode = null;
      if (this.action !== 'idle') this.#setAction('idle');
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy);
    const travel = this.speed * delta;
    if (Math.abs(dx) > 1) this.facing = dx < 0 ? -1 : 1;

    if (distance <= travel || distance < 2) {
      this.x = target.x;
      this.y = target.y;
      if (Number.isInteger(target.floor)) this.floor = target.floor;
      this.route.shift();
    } else {
      this.x += (dx / distance) * travel;
      this.y += (dy / distance) * travel;
    }

    const nextAction = target.action ?? 'running';
    if (this.action !== nextAction) this.#setAction(nextAction);
  }

  #updateAnimation(delta) {
    const definition = ACTIONS[this.action];
    this.frameElapsed += delta;
    if (this.frameElapsed < definition.frameSeconds) return;
    this.frameElapsed -= definition.frameSeconds;

    if (this.frameIndex < definition.frames.length - 1) {
      this.frameIndex += 1;
      return;
    }

    if (definition.loop) this.frameIndex = 0;
    else if (this.action !== 'idle') this.#setAction('idle');
  }

  #setAction(action) {
    this.action = action;
    this.frameIndex = 0;
    this.frameElapsed = 0;
  }
}
