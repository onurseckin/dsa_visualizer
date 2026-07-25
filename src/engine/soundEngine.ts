class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Safe catch for autoplay restrictions
      });
    }

    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private playTone(
    freq: number,
    durationMs: number = 100,
    type: OscillatorType = 'sine',
    startGain: number = 0.1,
    endGain: number = 0.001
  ): void {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(startGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(endGain, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Ignore audio synthesis errors gracefully
    }
  }

  public playCompare(val?: number, maxVal: number = 100): void {
    if (this.muted) return;
    const freq = val !== undefined ? 200 + (Math.min(Math.max(val, 0), maxVal) / maxVal) * 600 : 440;
    this.playTone(freq, 80, 'sine', 0.08);
  }

  public playSwap(val1?: number, val2?: number): void {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const f1 = val1 !== undefined ? 250 + (val1 % 500) : 300;
      const f2 = val2 !== undefined ? 350 + (val2 % 500) : 600;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f1, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Ignore audio errors
    }
  }

  public playPush(): void {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.09);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Ignore audio errors
    }
  }

  public playPop(): void {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.09);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Ignore audio errors
    }
  }

  public playComplete(): void {
    if (this.muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 220, 'triangle', 0.1);
      }, idx * 60);
    });
  }
}

export const soundEngine = new SoundEngine();

export const playCompare = (val?: number, maxVal?: number) => soundEngine.playCompare(val, maxVal);
export const playSwap = (val1?: number, val2?: number) => soundEngine.playSwap(val1, val2);
export const playPush = () => soundEngine.playPush();
export const playPop = () => soundEngine.playPop();
export const playComplete = () => soundEngine.playComplete();

export default soundEngine;
