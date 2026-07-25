declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private lastPlayTime: number = 0;
  private minToneIntervalMs: number = 80; // Minimum interval between tone triggers to prevent sound overlap/echo

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
    durationMs: number = 90,
    type: OscillatorType = 'sine',
    startGain: number = 0.08
  ): void {
    if (this.shouldThrottle()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const safeFreq = Math.max(freq, 40);
      const safeStartGain = Math.max(startGain, 0.001);
      const durationSec = durationMs / 1000;
      const startTime = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(safeFreq, startTime);

      // Smooth linear envelope (no exponential echo/pitch dives)
      gain.gain.setValueAtTime(safeStartGain, startTime);
      gain.gain.linearRampToValueAtTime(0.0001, startTime + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Safe catch for disconnect
        }
      };

      osc.start(startTime);
      osc.stop(startTime + durationSec);
    } catch {
      // Ignore audio synthesis errors gracefully
    }
  }

  public playCompare(val?: number, maxVal: number = 100): void {
    if (this.muted) return;
    const safeMax = maxVal > 0 ? maxVal : 100;
    const freq =
      val !== undefined
        ? 220 + (Math.min(Math.max(val, 0), safeMax) / safeMax) * 500
        : 440;
    this.playTone(freq, 75, 'sine', 0.06);
  }

  public playSwap(val1?: number, _val2?: number): void {
    if (this.muted) return;
    const f1 = val1 !== undefined ? 300 + (Math.abs(val1) % 400) : 480;
    this.playTone(f1, 90, 'triangle', 0.08);
  }

  public playPush(): void {
    if (this.muted) return;
    this.playTone(520, 80, 'sine', 0.07);
  }

  public playPop(): void {
    if (this.muted) return;
    this.playTone(320, 80, 'sine', 0.07);
  }

  public playComplete(): void {
    if (this.muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.muted) {
          const ctx = this.getAudioContext();
          if (!ctx) return;
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.onended = () => {
              try {
                osc.disconnect();
                gain.disconnect();
              } catch {
                // Ignore
              }
            };
            osc.start();
            osc.stop(ctx.currentTime + 0.18);
          } catch {
            // Ignore
          }
        }
      }, idx * 75);
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
