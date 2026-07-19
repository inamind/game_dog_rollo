const AudioContextClass = () => globalThis.AudioContext ?? globalThis.webkitAudioContext;

export class SfxPlayer {
  constructor({ volume = 0.42, onCue = () => {} } = {}) {
    this.volume = volume;
    this.onCue = onCue;
    this.context = null;
    this.master = null;
    this.noiseBuffer = null;
    this.disposed = false;
  }

  unlock() {
    const context = this.#ensureContext();
    if (context?.state === 'suspended') context.resume().catch(() => {});
  }

  playAttack(type) {
    if (type === 'biting') {
      this.#cue('bite');
      this.#noise(0.15, 0.18, 520);
      this.#tone(145, 72, 0.18, 0.22, 'sawtooth');
      return;
    }
    this.#cue('smash');
    this.#noise(0.09, 0.11, 900);
    this.#tone(240, 125, 0.1, 0.14, 'triangle');
  }

  playHit(strong = false) {
    this.#cue(strong ? 'heavy-hit' : 'hit');
    this.#noise(strong ? 0.18 : 0.11, strong ? 0.34 : 0.22, strong ? 1050 : 1450);
    this.#tone(strong ? 105 : 155, strong ? 52 : 78, strong ? 0.2 : 0.13, strong ? 0.3 : 0.22, 'square');
  }

  playBlocked() {
    this.#cue('blocked');
    this.#tone(165, 128, 0.13, 0.12, 'square');
  }

  playDestroy() {
    this.#cue('destroy');
    this.#noise(0.3, 0.42, 700);
    this.#tone(128, 45, 0.34, 0.32, 'sawtooth');
    this.#tone(82, 38, 0.26, 0.22, 'square', 0.06);
  }

  playLevelUp() {
    this.#cue('level-up');
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      this.#tone(frequency, frequency * 1.015, 0.34, 0.15, 'sine', index * 0.115);
    });
    [1318.5, 1568, 2093].forEach((frequency, index) => {
      this.#tone(frequency, frequency * 0.99, 0.25, 0.055, 'sine', 0.38 + index * 0.075);
    });
  }

  suspend() {
    if (this.context?.state === 'running') this.context.suspend().catch(() => {});
  }

  resume() {
    if (this.context?.state === 'suspended') this.context.resume().catch(() => {});
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const context = this.context;
    if (!context || context.state === 'closed') return;
    // 파괴·레벨업의 잔향이 결과 화면에서도 끝까지 들리도록 잠시 뒤 닫는다.
    globalThis.setTimeout(() => context.close().catch(() => {}), 1600);
  }

  #cue(name) {
    this.onCue(name);
    this.unlock();
  }

  #ensureContext() {
    if (this.disposed) return null;
    if (this.context) return this.context;
    const Context = AudioContextClass();
    if (!Context) return null;
    this.context = new Context({ latencyHint: 'interactive' });
    this.master = this.context.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.context.destination);
    return this.context;
  }

  #tone(startFrequency, endFrequency, duration, gain, type, delay = 0) {
    const context = this.#ensureContext();
    if (!context) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.018, duration * 0.2));
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope).connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  #noise(duration, gain, cutoff, delay = 0) {
    const context = this.#ensureContext();
    if (!context) return;
    if (!this.noiseBuffer) {
      const length = Math.ceil(context.sampleRate * 0.5);
      this.noiseBuffer = context.createBuffer(1, length, context.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
    }
    const start = context.currentTime + delay;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, start);
    envelope.gain.setValueAtTime(gain, start);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(envelope).connect(this.master);
    source.start(start);
    source.stop(start + duration + 0.02);
  }
}
