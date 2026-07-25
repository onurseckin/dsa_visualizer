import { SoundCue, SoundCueKind } from './stepSound';

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

/* The step interval bottoms out at 50ms, so the throttle has to sit well below
   that or legitimate consecutive steps get swallowed; the voice ceiling then has
   to hold every short cue that can overlap at that rate. */
const MAX_ACTIVE_VOICES = 14;
const MIN_TONE_INTERVAL_MS = 30;
const COMPLETE_COOLDOWN_MS = 400;
const ARPEGGIO_NOTE_SPACING_SEC = 0.075;
const ARPEGGIO_NOTE_DURATION_SEC = 0.18;

/** Every cue kind except 'complete', which is the arpeggio rather than one tone. */
export type EventCueKind = Exclude<SoundCueKind, 'complete'>;

interface CueTimbre {
  type: OscillatorType;
  /** Kept <= 120ms so fast playback stays crisp instead of muddy. */
  durationMs: number;
  peakGain: number;
  /** Register shift in scale degrees — what makes push read above pop. */
  degreeOffset: number;
}

const CUE_SCALE_ROOT_HZ = 220;
/* Major pentatonic: quantizing pitch to a scale makes a run sound intentional
   instead of like a random sweep. Degree 10 lands on 880Hz, the top of the band. */
const CUE_SCALE_SEMITONES: readonly number[] = [0, 2, 4, 7, 9];
const CUE_SCALE_DEGREES = 11;

/* Advance is deliberately the quietest and shortest voice: it fires on every
   otherwise-uneventful step, so it must read as a tick under the event cues
   rather than compete with them. */
const CUE_TIMBRES: Record<EventCueKind, CueTimbre> = {
  advance: { type: 'sine', durationMs: 28, peakGain: 0.016, degreeOffset: 0 },
  compare: { type: 'sine', durationMs: 60, peakGain: 0.05, degreeOffset: 0 },
  swap: { type: 'triangle', durationMs: 95, peakGain: 0.075, degreeOffset: -2 },
  push: { type: 'square', durationMs: 55, peakGain: 0.032, degreeOffset: 3 },
  pop: { type: 'square', durationMs: 55, peakGain: 0.032, degreeOffset: -3 },
  visit: { type: 'triangle', durationMs: 55, peakGain: 0.045, degreeOffset: 1 },
  enqueue: { type: 'sawtooth', durationMs: 50, peakGain: 0.028, degreeOffset: 2 },
  dequeue: { type: 'sawtooth', durationMs: 50, peakGain: 0.028, degreeOffset: -2 },
  relax: { type: 'triangle', durationMs: 70, peakGain: 0.05, degreeOffset: 4 },
  match: { type: 'triangle', durationMs: 115, peakGain: 0.07, degreeOffset: 6 },
};

function clampDegree(degree: number): number {
  if (!Number.isFinite(degree)) return 0;
  return Math.min(CUE_SCALE_DEGREES - 1, Math.max(0, degree));
}

/** Maps a 0..1 cue pitch onto the quantized 220-880Hz cue range. */
export function cueFrequency(kind: EventCueKind, pitch: number): number {
  const safePitch = Number.isFinite(pitch) ? Math.min(1, Math.max(0, pitch)) : 0;
  const degree = clampDegree(
    Math.round(safePitch * (CUE_SCALE_DEGREES - 1)) + CUE_TIMBRES[kind].degreeOffset
  );
  const octave = Math.floor(degree / CUE_SCALE_SEMITONES.length);
  const semitones = octave * 12 + CUE_SCALE_SEMITONES[degree % CUE_SCALE_SEMITONES.length];
  return CUE_SCALE_ROOT_HZ * Math.pow(2, semitones / 12);
}

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

  /** Plays the cue a step earned; 'complete' delegates to the arpeggio. */
  public playCue(cue: SoundCue): void {
    if (cue.kind === 'complete') {
      this.playComplete();
      return;
    }

    const timbre = CUE_TIMBRES[cue.kind];
    this.playTone(
      cueFrequency(cue.kind, cue.pitch),
      timbre.durationMs,
      timbre.type,
      timbre.peakGain
    );
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
export const playCue = (cue: SoundCue): void => soundEngine.playCue(cue);

export const setMuted = (muted: boolean): void => soundEngine.setMuted(muted);
export const isMuted = (): boolean => soundEngine.isMuted();
export const toggleMute = (): boolean => soundEngine.toggleMute();

export default soundEngine;
