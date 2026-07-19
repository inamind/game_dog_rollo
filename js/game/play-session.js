import { AUDIO_PATHS, COMBAT, PERFORMANCE, SPRITE_PATHS } from '../config.js';
import { BgmPlayer } from '../audio/bgm-player.js';
import { SfxPlayer } from '../audio/sfx-player.js';
import { GameLoop } from '../core/game-loop.js';
import { PerformanceMonitor } from '../core/performance-monitor.js';
import { getObjectDefinitions } from '../data/objects.js';
import { Camera } from './camera.js';
import { InputHandler } from './input-handler.js';
import { Navigation } from './navigation.js';
import { ObjectManager } from './object-manager.js';
import { PlayerController } from './player-controller.js';
import { Renderer } from './renderer.js';

export class PlaySession {
  constructor({ canvas, playerName, location, assets, onEnd }) {
    this.location = location;
    this.assets = assets;
    this.onEnd = onEnd;
    this.renderer = new Renderer(canvas);
    this.sfx = new SfxPlayer({
      onCue: (cue) => { this.renderer.canvas.dataset.lastSound = cue; },
    });
    this.bgm = new BgmPlayer(AUDIO_PATHS.gameBgm);
    this.camera = new Camera(location.cameraBounds);
    this.player = new PlayerController({
      name: playerName,
      spawn: location.spawn,
      navigation: new Navigation(location.id),
    });
    this.objects = new ObjectManager(getObjectDefinitions(location.id));
    this.remainingSeconds = location.durationSeconds;
    this.biteCooldown = 0;
    this.specialExplosions = [];
    this.pendingSpecialClear = false;
    this.destroyedExp = 0;
    this.finished = false;
    this.toastTimeout = 0;
    this.metricsElapsed = 0;
    this.monitor = new PerformanceMonitor({ longFrameMs: PERFORMANCE.longFrameMs });
    this.loop = new GameLoop({
      targetFps: PERFORMANCE.targetFps,
      update: (delta) => this.update(delta),
      render: () => this.render(),
      onFrame: (sample) => this.monitor.record(sample),
    });
    this.handleResize = () => this.resize();
    this.handleVisibility = () => this.onVisibilityChange();
    this.handleAudioUnlock = () => {
      this.sfx.unlock();
      this.bgm.play();
    };
    this.input = new InputHandler({
      canvas,
      toWorld: (x, y) => this.renderer.screenToWorld(x, y, this.camera),
      onHorizontal: (direction) => this.player.moveHorizontal(direction),
      onFloor: (direction) => this.player.moveFloor(direction),
      onObjectTouch: (x, y) => {
        if (this.objects.canTouchSmash(this.player, x, y)) this.smash();
      },
      onSmash: () => this.smash(),
      onBite: () => this.bite(),
    });
    this.handleSmashButton = () => this.smash();
    this.handleBiteButton = () => this.bite();
    this.handleExitRequest = () => document.querySelector('#exit-dialog').showModal();
    this.handleConfirmExit = () => this.finish(false, 'exit');
  }

  start() {
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('visibilitychange', this.handleVisibility);
    document.addEventListener('pointerdown', this.handleAudioUnlock, { passive: true });
    document.addEventListener('keydown', this.handleAudioUnlock);
    document.querySelector('#smash-button').addEventListener('click', this.handleSmashButton);
    document.querySelector('#bite-button').addEventListener('click', this.handleBiteButton);
    document.querySelector('#exit-button').addEventListener('click', this.handleExitRequest);
    document.querySelector('#back-button').addEventListener('click', this.handleExitRequest);
    document.querySelector('#confirm-exit-button').addEventListener('click', this.handleConfirmExit);
    this.resize();
    this.monitor.reset();
    this.bgm.play();
    this.loop.start();
    window.rolloPerformance = () => this.monitor.snapshot();
  }

  stop() {
    this.loop.stop();
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    document.removeEventListener('pointerdown', this.handleAudioUnlock);
    document.removeEventListener('keydown', this.handleAudioUnlock);
    document.querySelector('#smash-button').removeEventListener('click', this.handleSmashButton);
    document.querySelector('#bite-button').removeEventListener('click', this.handleBiteButton);
    document.querySelector('#exit-button').removeEventListener('click', this.handleExitRequest);
    document.querySelector('#back-button').removeEventListener('click', this.handleExitRequest);
    document.querySelector('#confirm-exit-button').removeEventListener('click', this.handleConfirmExit);
    this.input.destroy();
    this.sfx.dispose();
    this.bgm.dispose();
  }

  resize() {
    this.renderer.resize();
    this.camera.setViewport(this.renderer.viewportWidth, this.renderer.viewportHeight);
  }

  onVisibilityChange() {
    if (document.hidden) {
      this.loop.stop();
      this.sfx.suspend();
      this.bgm.pause();
    }
    else {
      this.sfx.resume();
      this.bgm.resume();
      this.loop.resetClock();
      this.monitor.reset();
      this.loop.start();
    }
  }

  update(delta) {
    this.player.update(delta);
    this.remainingSeconds = Math.max(0, this.remainingSeconds - delta);
    this.biteCooldown = Math.max(0, this.biteCooldown - delta);
    this.updateSpecialExplosions(delta);

    const attackType = this.player.consumeAttackHit();
    if (attackType) this.resolveAttack(attackType);

    if (this.pendingSpecialClear && this.specialExplosions.length === 0) {
      this.finish(true, 'clear');
      return;
    }
    if (this.remainingSeconds <= 0 && !this.finished && !this.pendingSpecialClear) {
      this.finish(false, 'timeout');
      return;
    }
    this.camera.follow(this.player);
    this.updateHud();
    this.metricsElapsed += delta;
    if (this.metricsElapsed >= 1) {
      this.metricsElapsed = 0;
      const metrics = this.monitor.snapshot();
      this.renderer.canvas.dataset.fps = String(metrics.fps);
      this.renderer.canvas.dataset.longFrames = String(metrics.longFrames);
      this.renderer.canvas.dataset.maxFrameMs = String(metrics.maxFrameMs);
      this.renderer.canvas.dataset.maxRenderMs = String(metrics.maxRenderMs);
      this.renderer.canvas.dataset.playerX = String(Math.round(this.player.x));
      this.renderer.canvas.dataset.playerY = String(Math.round(this.player.y));
      this.renderer.canvas.dataset.playerFloor = String(this.player.floor);
      this.renderer.canvas.dataset.playerAction = this.player.action;
    }
  }

  render() {
    this.renderer.beginFrame(this.camera);
    this.renderer.drawBackground(this.camera, this.location, this.assets);
    this.renderer.drawObjects(this.objects, this.assets, this.camera);
    const image = this.assets.get(this.player.spritePath ?? SPRITE_PATHS.running[0]);
    if (image) this.renderer.drawPlayer(this.player, image);
    for (const effect of this.specialExplosions) {
      const explosion = this.assets.get(SPRITE_PATHS.explosion[effect.frameIndex]);
      if (explosion) this.renderer.drawExplosion(effect, explosion, this.camera);
    }
  }

  smash() {
    if (this.player.attack('smashing')) this.sfx.playAttack('smashing');
  }

  bite() {
    if (this.biteCooldown > 0) {
      this.showToast(`필살기 준비 중 · ${Math.ceil(this.biteCooldown)}초`);
      return;
    }
    if (this.player.attack('biting')) {
      this.biteCooldown = COMBAT.biteCooldownSeconds;
      this.sfx.playAttack('biting');
    }
  }

  resolveAttack(attackType) {
    this.renderer.canvas.dataset.lastAttack = attackType;
    this.renderer.canvas.dataset.attackCount = String(
      Number(this.renderer.canvas.dataset.attackCount || 0) + 1,
    );
    const result = this.objects.attack(this.player, attackType);
    if (attackType === 'biting' && result.destroyed.length > 0) {
      this.specialExplosions = result.destroyed.map((item) => ({
        x: item.x,
        y: item.y - item.height * 0.52,
        size: Math.max(item.width, item.height) * 2.1,
        elapsed: 0,
        frameIndex: 0,
      }));
    }
    if (result.blocked.length > 0) {
      this.sfx.playBlocked();
      const required = Math.min(...result.blocked.map((item) => item.requiredLevel));
      this.showToast(`아직 레벨이 부족해요! Lv.${required} 필요`);
    }
    if (result.destroyed.length > 0) this.sfx.playDestroy();
    else if (result.hit > 0) {
      const reachedHeavyDamage = result.damaged.some((item) => item.state >= 3);
      this.sfx.playHit(attackType === 'biting' || reachedHeavyDamage);
    }
    if (result.destroyed.length === 0) return;

    for (const item of result.destroyed) this.destroyedExp += item.exp;
    let nextLevel = 1;
    this.location.expThresholds.forEach((threshold, index) => {
      if (this.destroyedExp >= threshold) nextLevel = index + 1;
    });
    if (nextLevel > this.player.level) {
      this.player.setLevel(nextLevel);
      this.sfx.playLevelUp();
      this.showToast(`레벨 업! Lv.${nextLevel}`);
    }
    if (this.objects.allDestroyed) {
      if (attackType === 'biting' && this.specialExplosions.length > 0) this.pendingSpecialClear = true;
      else this.finish(true, 'clear');
    }
  }

  updateSpecialExplosions(delta) {
    const frameSeconds = COMBAT.specialExplosionFrameSeconds;
    const duration = frameSeconds * SPRITE_PATHS.explosion.length;
    for (const effect of this.specialExplosions) {
      effect.elapsed += delta;
      effect.frameIndex = Math.min(
        SPRITE_PATHS.explosion.length - 1,
        Math.floor(effect.elapsed / frameSeconds),
      );
    }
    this.specialExplosions = this.specialExplosions.filter((effect) => effect.elapsed < duration);
  }

  updateHud() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = Math.floor(this.remainingSeconds % 60);
    document.querySelector('#timer-display').textContent = `남은 시간 ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.querySelector('#level-display').textContent = `Lv.${this.player.level}`;
    const nextThreshold = this.location.expThresholds[this.player.level] ?? 'MAX';
    document.querySelector('#exp-display').textContent = `EXP ${this.destroyedExp} / ${nextThreshold}`;
    document.querySelector('#destroyed-display').textContent = `부순 개수 ${this.objects.destroyedCount}`;
    const biteButton = document.querySelector('#bite-button');
    biteButton.disabled = this.biteCooldown > 0;
    document.querySelector('#bite-button-text').textContent = this.biteCooldown > 0
      ? `🔥 ${Math.ceil(this.biteCooldown)}초`
      : '🔥 필살기';
  }

  showToast(message) {
    const toast = document.querySelector('#toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 1300);
  }

  finish(cleared, reason) {
    if (this.finished) return;
    this.finished = true;
    const remainingSeconds = Math.floor(this.remainingSeconds);
    const bonusExp = cleared ? remainingSeconds : 0;
    const record = {
      playerName: this.player.name,
      locationId: this.location.id,
      locationLabel: this.location.label,
      destroyedCount: this.objects.destroyedCount,
      totalObjects: this.objects.objects.length,
      level: this.player.level,
      destroyedExp: this.destroyedExp,
      remainingSeconds,
      bonusExp,
      score: this.destroyedExp + bonusExp,
      cleared,
      reason,
      savedAt: Date.now(),
    };
    this.stop();
    this.onEnd(record);
  }
}
