declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private lastPlayTime: number = 0;
  private minToneIntervalMs: number = 35; // Minimum interval between tone triggers to prevent audio lag & queue backlog

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      try {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) {
          this.ctx = new AudioCtxClass();
        }
      } catch {
        return null;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Safe catch for browser autoplay restrictions
      });
    }

    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted && this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {
        // Safe catch for suspend
      });
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private shouldThrottle(): boolean {
    if (this.muted) return true;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this.lastPlayTime < this.minToneIntervalMs) {
      return true;
    }
    this.lastPlayTime = now;
    return false;
  }

  private playTone(
    freq: number,
    durationMs: number = 100,
    type: OscillatorType = 'sine',
    startGain: number = 0.1,
    endGain: number = 0.001
  ): void {
    if (this.shouldThrottle()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const safeFreq = Math.max(freq, 20);
      const safeStartGain = Math.max(startGain, 0.0001);
      const safeEndGain = Math.max(endGain, 0.0001);
      const durationSec = durationMs / 1000;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(safeFreq, ctx.currentTime);

      gain.gain.setValueAtTime(safeStartGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(safeEndGain, ctx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Clean up audio nodes on completion to prevent memory leaks
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Ignore disconnect errors
        }
      };

      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch {
      // Ignore audio synthesis errors gracefully
    }
  }

  public playCompare(val?: number, maxVal: number = 100): void {
    if (this.muted) return;
    const safeMax = maxVal > 0 ? maxVal : 100;
    const freq =
      val !== undefined
        ? 200 + (Math.min(Math.max(val, 0), safeMax) / safeMax) * 600
        : 440;
    this.playTone(freq, 80, 'sine', 0.08);
  }

  public playSwap(val1?: number, val2?: number): void {
    if (this.shouldThrottle()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const f1 = val1 !== undefined ? 250 + (Math.abs(val1) % 500) : 300;
      const f2 = val2 !== undefined ? 350 + (Math.abs(val2) % 500) : 600;

      const safeF1 = Math.max(f1, 20);
      const safeF2 = Math.max(f2, 20);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(safeF1, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(safeF2, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Ignore disconnect errors
        }
      };

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Ignore audio errors
    }
  }

  public playPush(): void {
    if (this.shouldThrottle()) return;
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

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Ignore disconnect errors
        }
      };

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Ignore audio errors
    }
  }

  public playPop(): void {
    if (this.shouldThrottle()) return;
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

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Ignore disconnect errors
        }
      };

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Ignore audio errors
    }
  }

  public playComplete(): void {
    if (this.muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 220, 'triangle', 0.1);
      }, idx * 60);
    });
  }
}

export const soundEngine = new SoundEngine();

export const playCompare = (val?: number, maxVal?: number): void => soundEngine.playCompare(val, maxVal);
export const playSwap = (val1?: number, val2?: number): void => soundEngine.playSwap(val1, val2);
export const playPush = (): void => soundEngine.playPush();
export const playPop = (): void => soundEngine.playPop();
export const playComplete = (): void => soundEngine.playComplete();

export default soundEngine;
