export class InputHandler {
  constructor({ canvas, toWorld, onHorizontal, onFloor, onObjectTouch, onSmash, onBite }) {
    this.canvas = canvas;
    this.toWorld = toWorld;
    this.onHorizontal = onHorizontal;
    this.onFloor = onFloor;
    this.onObjectTouch = onObjectTouch;
    this.onSmash = onSmash;
    this.onBite = onBite;
    this.pressedKeys = new Set();
    this.virtualBindings = [];

    this.handlePointerDown = (event) => {
      if (event.pointerType !== 'mouse') {
        event.preventDefault();
        const point = this.toWorld(event.clientX, event.clientY);
        this.onObjectTouch(point.x, point.y);
        return;
      }
      if (event.button === 0) this.onSmash();
      else if (event.button === 2) this.onBite();
    };
    this.handleContextMenu = (event) => event.preventDefault();
    this.handleKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyQ', 'KeyW'].includes(event.code)) return;
      event.preventDefault();
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        this.pressedKeys.add(event.code);
        this.#emitHorizontal();
      } else if (event.code === 'ArrowUp') this.onFloor(1);
      else if (event.code === 'ArrowDown') this.onFloor(-1);
      else if (!event.repeat && event.code === 'KeyQ') this.onSmash();
      else if (!event.repeat && event.code === 'KeyW') this.onBite();
    };
    this.handleKeyUp = (event) => {
      if (event.code !== 'ArrowLeft' && event.code !== 'ArrowRight') return;
      event.preventDefault();
      this.pressedKeys.delete(event.code);
      this.#emitHorizontal();
    };

    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('contextmenu', this.handleContextMenu);
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    this.#bindVirtualControls();
  }

  destroy() {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    for (const binding of this.virtualBindings) {
      binding.button.removeEventListener('pointerdown', binding.down);
      binding.button.removeEventListener('pointerup', binding.up);
      binding.button.removeEventListener('pointercancel', binding.up);
      binding.button.removeEventListener('pointerleave', binding.up);
    }
  }

  #emitHorizontal() {
    const left = this.pressedKeys.has('ArrowLeft');
    const right = this.pressedKeys.has('ArrowRight');
    this.onHorizontal(left === right ? 0 : left ? -1 : 1);
  }

  #bindVirtualControls() {
    for (const button of document.querySelectorAll('[data-move]')) {
      const direction = button.dataset.move;
      let holdTimer = 0;
      const down = (event) => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        if (direction === 'left' || direction === 'right') {
          this.onHorizontal(direction === 'left' ? -1 : 1);
        } else {
          const floorDirection = direction === 'up' ? 1 : -1;
          this.onFloor(floorDirection);
          window.clearInterval(holdTimer);
          holdTimer = window.setInterval(() => this.onFloor(floorDirection), 90);
        }
      };
      const up = (event) => {
        event.preventDefault();
        if (direction === 'left' || direction === 'right') this.onHorizontal(0);
        window.clearInterval(holdTimer);
        holdTimer = 0;
      };
      button.addEventListener('pointerdown', down);
      button.addEventListener('pointerup', up);
      button.addEventListener('pointercancel', up);
      button.addEventListener('pointerleave', up);
      this.virtualBindings.push({ button, down, up });
    }
  }
}
