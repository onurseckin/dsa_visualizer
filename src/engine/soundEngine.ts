declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const MAX_ACTIVE_VOICES = 8;
const MIN_TONE_INTERVAL_MS = 80;
const COMPLETE_COOLDOWN_MS = 400;
const ARPEGGIO_NOTE_SPACING_SEC = 0.075;
const ARPEGGIO_NOTE_DURATION_SEC = 0.18;

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted: boolean = false;
  private lastPlayTime: number = -Infinity;
  private lastCompleteTime: number = -Infinity;
  private activeVoices: number = 0;
  private unlockHandler: (() => void) | null = null;

  private now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      try {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtxClass) return null;
        this.ctx = new AudioCtxClass();
        // Single master bus: muting sets this gain to 0 instantly without
        // suspending the context (suspend freezes currentTime and corrupts scheduling).
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : 1;
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.installUnlockListener();
    }

    return this.ctx;
  }

  // Browsers create AudioContexts suspended until a user gesture; scheduling into a
  // suspended context makes every queued tone fire at once on resume. Instead we skip
  // tones while suspended and resume on the first gesture.
  private installUnlockListener(): void {
    if (this.unlockHandler || typeof window === 'undefined') return;

    const handler = (): void => {
      const ctx = this.ctx;
      if (!ctx || ctx.state === 'running') {
        this.removeUnlockListener();
        return;
      }
      ctx
        .resume()
        .then(() => {
          if (ctx.state === 'running') {
            this.removeUnlockListener();
          }
        })
        .catch(() => {
          // Autoplay policy still blocking; the next gesture retries.
        });
    };

    this.unlockHandler = handler;
    window.addEventListener('pointerdown', handler, true);
    window.addEventListener('keydown', handler, true);
  }

  private removeUnlockListener(): void {
    if (!this.unlockHandler || typeof window === 'undefined') return;
    window.removeEventListener('pointerdown', this.unlockHandler, true);
    window.removeEventListener('keydown', this.unlockHandler, true);
    this.unlockHandler = null;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 1;
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // Returns true only when a voice was actually scheduled, so callers can avoid
  // advancing throttle clocks for skipped tones.
  private scheduleVoice(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    durationSec: number,
    type: OscillatorType,
    peakGain: number
  ): boolean {
    if (this.activeVoices >= MAX_ACTIVE_VOICES) return false;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(freq, 40), startTime);

      gain.gain.setValueAtTime(Math.max(peakGain, 0.001), startTime);
      gain.gain.linearRampToValueAtTime(0.0001, startTime + durationSec);

      osc.connect(gain);
      gain.connect(this.masterGain ?? ctx.destination);

      osc.onended = (): void => {
        this.activeVoices = Math.max(0, this.activeVoices - 1);
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Nodes may already be disconnected.
        }
      };

      osc.start(startTime);
      osc.stop(startTime + durationSec);
      this.activeVoices += 1;
      return true;
    } catch {
      return false;
    }
  }

  private playTone(
    freq: number,
    durationMs: number = 90,
    type: OscillatorType = 'sine',
    peakGain: number = 0.08
  ): void {
    if (this.muted) return;

    const ctx = this.getAudioContext();
    // Never schedule into a non-running context: currentTime is frozen while
    // suspended, so queued oscillators would all burst simultaneously on resume.
    if (!ctx || ctx.state !== 'running') return;

    const now = this.now();
    if (now - this.lastPlayTime < MIN_TONE_INTERVAL_MS) return;

    const scheduled = this.scheduleVoice(
      ctx,
      freq,
      ctx.currentTime,
      durationMs / 1000,
      type,
      peakGain
    );
    if (scheduled) {
      this.lastPlayTime = now;
    }
  }

  public playCompare(val?: number, maxVal: number = 100): void {
    const safeMax = maxVal > 0 ? maxVal : 100;
    const freq =
      val !== undefined
        ? 220 + (Math.min(Math.max(val, 0), safeMax) / safeMax) * 500
        : 440;
    this.playTone(freq, 75, 'sine', 0.06);
  }

  public playSwap(val1?: number, _val2?: number): void {
    const f1 = val1 !== undefined ? 300 + (Math.abs(val1) % 400) : 480;
    this.playTone(f1, 90, 'triangle', 0.08);
  }

  public playPush(): void {
    this.playTone(520, 80, 'sine', 0.07);
  }

  public playPop(): void {
    this.playTone(320, 80, 'sine', 0.07);
  }

  public playComplete(): void {
    if (this.muted) return;

    const ctx = this.getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    const now = this.now();
    // Re-triggering mid-arpeggio (e.g. rapid replay clicks) would layer overlapping runs.
    if (now - this.lastCompleteTime < COMPLETE_COOLDOWN_MS) return;

    // Whole arpeggio scheduled in one pass on the AudioContext clock — setTimeout
    // chains drift and overlap when re-triggered.
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const base = ctx.currentTime;
    let scheduledAny = false;
    notes.forEach((freq, i) => {
      const started = this.scheduleVoice(
        ctx,
        freq,
        base + i * ARPEGGIO_NOTE_SPACING_SEC,
        ARPEGGIO_NOTE_DURATION_SEC,
        'triangle',
        0.08
      );
      if (started) scheduledAny = true;
    });

    if (scheduledAny) {
      this.lastCompleteTime = now;
    }
  }
}

export const soundEngine = new SoundEngine();

export const playCompare = (val?: number, maxVal?: number): void => soundEngine.playCompare(val, maxVal);
export const playSwap = (val1?: number, val2?: number): void => soundEngine.playSwap(val1, val2);
export const playPush = (): void => soundEngine.playPush();
export const playPop = (): void => soundEngine.playPop();
export const playComplete = (): void => soundEngine.playComplete();

export const setMuted = (muted: boolean): void => soundEngine.setMuted(muted);
export const isMuted = (): boolean => soundEngine.isMuted();
export const toggleMute = (): boolean => soundEngine.toggleMute();

export default soundEngine;
