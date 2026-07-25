import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  SoundEngine,
  soundEngine,
  cueFrequency,
  EventCueKind,
  playCompare,
  playSwap,
  playPush,
  playPop,
  playComplete,
  playCue,
  setMuted,
  isMuted,
  toggleMute,
} from '../soundEngine';
import { SoundCue } from '../stepSound';

const EVENT_CUE_KINDS: EventCueKind[] = [
  'advance',
  'compare',
  'swap',
  'push',
  'pop',
  'visit',
  'enqueue',
  'dequeue',
  'relax',
  'match',
];

const cue = (kind: SoundCue['kind'], pitch = 0.5): SoundCue => ({ kind, pitch });

class MockAudioParam {
  value = 1;
  setValueAtTime = vi.fn((_value: number, _when: number): void => {});
  linearRampToValueAtTime = vi.fn((_value: number, _when: number): void => {});
}

class MockOscillatorNode {
  type: OscillatorType = 'sine';
  frequency = new MockAudioParam();
  onended: (() => void) | null = null;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn((_when?: number): void => {});
  stop = vi.fn((_when?: number): void => {});
}

class MockGainNode {
  gain = new MockAudioParam();
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockAudioContext {
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = { name: 'destination' };
  oscillators: MockOscillatorNode[] = [];
  gains: MockGainNode[] = [];

  createOscillator = vi.fn((): MockOscillatorNode => {
    const osc = new MockOscillatorNode();
    this.oscillators.push(osc);
    return osc;
  });

  createGain = vi.fn((): MockGainNode => {
    const gain = new MockGainNode();
    this.gains.push(gain);
    return gain;
  });

  resume = vi.fn((): Promise<void> => {
    this.state = 'running';
    return Promise.resolve();
  });

  suspend = vi.fn((): Promise<void> => {
    this.state = 'suspended';
    return Promise.resolve();
  });
}

const flushMicrotasks = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('SoundEngine', () => {
  let mockCtx: MockAudioContext;
  let engine: SoundEngine;
  let nowMs: number;

  beforeEach(() => {
    mockCtx = new MockAudioContext();
    // Mock constructors returning an object make `new` yield that object.
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function AudioContextStub(): MockAudioContext {
        return mockCtx;
      })
    );
    nowMs = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => nowMs);
    engine = new SoundEngine();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('suspended context', () => {
    it('creates no oscillator while the context is suspended', () => {
      mockCtx.state = 'suspended';
      engine.playCompare(50, 100);
      engine.playSwap(10, 20);
      engine.playComplete();
      expect(mockCtx.createOscillator).not.toHaveBeenCalled();
    });

    it('installs an unlock listener that resumes the context on pointerdown', async () => {
      mockCtx.state = 'suspended';
      engine.playPush();
      expect(mockCtx.resume).not.toHaveBeenCalled();

      window.dispatchEvent(new Event('pointerdown'));
      expect(mockCtx.resume).toHaveBeenCalledTimes(1);

      await flushMicrotasks();
      expect(mockCtx.state).toBe('running');

      // Listener removed once running: further gestures do not call resume again.
      window.dispatchEvent(new Event('pointerdown'));
      window.dispatchEvent(new Event('keydown'));
      expect(mockCtx.resume).toHaveBeenCalledTimes(1);
    });

    it('resumes via keydown as well', async () => {
      mockCtx.state = 'suspended';
      engine.playPop();
      window.dispatchEvent(new Event('keydown'));
      expect(mockCtx.resume).toHaveBeenCalledTimes(1);
      await flushMicrotasks();
      expect(mockCtx.state).toBe('running');
    });

    it('plays normally after the context is unlocked', async () => {
      mockCtx.state = 'suspended';
      engine.playPush();
      expect(mockCtx.createOscillator).not.toHaveBeenCalled();

      window.dispatchEvent(new Event('pointerdown'));
      await flushMicrotasks();

      nowMs = 500;
      engine.playPush();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockCtx.oscillators[0].start).toHaveBeenCalled();
    });
  });

  describe('running context', () => {
    it('schedules a tone through the master gain bus', () => {
      engine.playCompare(50, 100);
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
      // First gain node is the master bus wired to the destination.
      expect(mockCtx.gains[0].connect).toHaveBeenCalledWith(mockCtx.destination);
      // The voice gain connects to the master bus, not the destination.
      expect(mockCtx.gains[1].connect).toHaveBeenCalledWith(mockCtx.gains[0]);
      expect(mockCtx.oscillators[0].start).toHaveBeenCalled();
      expect(mockCtx.oscillators[0].stop).toHaveBeenCalled();
    });

    it('throttles tones fired within the minimum interval', () => {
      engine.playPush();
      nowMs = 20;
      engine.playPush();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
    });

    it('does not advance the throttle clock for skipped tones', () => {
      engine.playPush(); // plays at t=0
      nowMs = 20;
      engine.playPush(); // throttled; must not mark t=20
      nowMs = 35;
      engine.playPush(); // 35ms since last actual play — must fire
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
    });

    it('lets consecutive steps through at the 50ms playback floor', () => {
      for (let i = 0; i < 6; i++) {
        nowMs = i * 50;
        engine.playCue(cue('advance', i / 5));
      }
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(6);
    });
  });

  describe('mute', () => {
    it('gates scheduling and zeroes the master gain', () => {
      engine.playPush();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);

      engine.setMuted(true);
      expect(mockCtx.gains[0].gain.value).toBe(0);
      expect(mockCtx.suspend).not.toHaveBeenCalled();

      nowMs = 500;
      engine.playPush();
      engine.playComplete();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);

      engine.setMuted(false);
      expect(mockCtx.gains[0].gain.value).toBe(1);
      engine.playPush();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
    });

    it('tracks mute state via setMuted/isMuted/toggleMute', () => {
      expect(engine.isMuted()).toBe(false);
      engine.setMuted(true);
      expect(engine.isMuted()).toBe(true);
      expect(engine.toggleMute()).toBe(false);
      expect(engine.isMuted()).toBe(false);
    });
  });

  describe('voice cap', () => {
    it('skips new voices once 14 are active and frees slots via onended', () => {
      for (let i = 0; i < 14; i++) {
        nowMs = i * 100;
        engine.playPush();
      }
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(14);

      nowMs = 1500;
      engine.playPush();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(14);

      const firstVoice = mockCtx.oscillators[0];
      firstVoice.onended?.();
      expect(firstVoice.disconnect).toHaveBeenCalled();

      nowMs = 1600;
      engine.playPush();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(15);
    });
  });

  describe('playComplete arpeggio', () => {
    it('schedules all four notes in one pass on the AudioContext clock', () => {
      mockCtx.currentTime = 2;
      engine.playComplete();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4);
      mockCtx.oscillators.forEach((osc, i) => {
        const startArg = osc.start.mock.calls[0][0];
        expect(startArg).toBeCloseTo(2 + i * 0.075, 5);
      });
    });

    it('ignores a second call within the cooldown window', () => {
      engine.playComplete();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4);

      nowMs = 200;
      engine.playComplete();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4);

      nowMs = 500;
      engine.playComplete();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(8);
    });

    it('does nothing while suspended or muted', () => {
      mockCtx.state = 'suspended';
      engine.playComplete();
      mockCtx.state = 'running';
      engine.setMuted(true);
      engine.playComplete();
      expect(mockCtx.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe('playCue', () => {
    interface RenderedVoice {
      type: OscillatorType;
      durationSec: number;
      peakGain: number;
      freq: number;
    }

    // Reads back what a single playCue call actually scheduled on the mock graph.
    const renderCue = (kind: EventCueKind, pitch: number, atMs: number): RenderedVoice => {
      nowMs = atMs;
      const before = mockCtx.oscillators.length;
      engine.playCue({ kind, pitch });
      expect(mockCtx.oscillators.length).toBe(before + 1);

      const osc = mockCtx.oscillators[before];
      const voiceGain = mockCtx.gains[mockCtx.gains.length - 1];
      return {
        type: osc.type,
        durationSec:
          Number(osc.stop.mock.calls[0][0]) - Number(osc.start.mock.calls[0][0]),
        peakGain: Number(voiceGain.gain.setValueAtTime.mock.calls[0][0]),
        freq: Number(osc.frequency.setValueAtTime.mock.calls[0][0]),
      };
    };

    it('gives every event cue kind a distinct short voice in the cue range', () => {
      const rendered = EVENT_CUE_KINDS.map((kind, i) => renderCue(kind, 0.5, i * 60));

      rendered.forEach((voice) => {
        expect(voice.durationSec).toBeGreaterThan(0);
        expect(voice.durationSec).toBeLessThanOrEqual(0.12);
        expect(voice.freq).toBeGreaterThanOrEqual(220);
        expect(voice.freq).toBeLessThanOrEqual(900);
      });

      const signatures = new Set(
        rendered.map((v) => `${v.type}|${v.durationSec}|${v.peakGain}|${v.freq}`)
      );
      expect(signatures.size).toBe(EVENT_CUE_KINDS.length);
    });

    it('keeps the advance tick quieter and shorter than every event cue', () => {
      const advance = renderCue('advance', 0.5, 0);
      EVENT_CUE_KINDS.filter((kind) => kind !== 'advance').forEach((kind, i) => {
        const other = renderCue(kind, 0.5, (i + 1) * 60);
        expect(advance.peakGain).toBeLessThan(other.peakGain);
        expect(advance.durationSec).toBeLessThan(other.durationSec);
      });
    });

    it('raises pitch with the cue pitch value', () => {
      const low = renderCue('compare', 0, 0);
      const high = renderCue('compare', 1, 60);
      expect(high.freq).toBeGreaterThan(low.freq);
    });

    it('clamps out-of-band pitches into the cue range', () => {
      [-5, 0.5, 42, Number.NaN].forEach((pitch, i) => {
        const voice = renderCue('relax', pitch, i * 60);
        expect(voice.freq).toBeGreaterThanOrEqual(220);
        expect(voice.freq).toBeLessThanOrEqual(900);
      });
    });

    it('delegates the complete cue to the arpeggio', () => {
      engine.playCue(cue('complete'));
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4);
    });

    it('schedules nothing while muted', () => {
      engine.setMuted(true);
      EVENT_CUE_KINDS.forEach((kind, i) => {
        nowMs = i * 60;
        engine.playCue({ kind, pitch: 0.5 });
      });
      engine.playCue(cue('complete'));
      expect(mockCtx.createOscillator).not.toHaveBeenCalled();
    });

    it('schedules nothing while the context is suspended', () => {
      mockCtx.state = 'suspended';
      engine.playCue(cue('swap'));
      expect(mockCtx.createOscillator).not.toHaveBeenCalled();
    });

    it('honours the 30ms throttle between cues', () => {
      engine.playCue(cue('compare'));
      nowMs = 29;
      engine.playCue(cue('compare'));
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);

      nowMs = 30;
      engine.playCue(cue('compare'));
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
    });

    it('stops scheduling once the voice ceiling is reached', () => {
      for (let i = 0; i < 20; i++) {
        nowMs = i * 40;
        engine.playCue(cue('visit', i / 20));
      }
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(14);
    });
  });

  describe('cueFrequency', () => {
    it('keeps every kind inside the 220-900Hz musical band', () => {
      EVENT_CUE_KINDS.forEach((kind) => {
        for (let i = 0; i <= 10; i++) {
          const freq = cueFrequency(kind, i / 10);
          expect(freq).toBeGreaterThanOrEqual(220);
          expect(freq).toBeLessThanOrEqual(900);
        }
      });
    });

    it('rises monotonically with pitch', () => {
      let previous = 0;
      for (let i = 0; i <= 20; i++) {
        const freq = cueFrequency('compare', i / 20);
        expect(freq).toBeGreaterThanOrEqual(previous);
        previous = freq;
      }
      expect(previous).toBeGreaterThan(cueFrequency('compare', 0));
    });

    it('quantizes to a scale rather than sweeping continuously', () => {
      const distinct = new Set<number>();
      for (let i = 0; i <= 100; i++) {
        distinct.add(Math.round(cueFrequency('compare', i / 100)));
      }
      expect(distinct.size).toBeGreaterThan(3);
      expect(distinct.size).toBeLessThanOrEqual(11);
    });

    it('separates the registers of paired cues', () => {
      expect(cueFrequency('pop', 0.5)).toBeLessThan(cueFrequency('push', 0.5));
      expect(cueFrequency('dequeue', 0.5)).toBeLessThan(cueFrequency('enqueue', 0.5));
    });

    it('falls back to the root note for non-finite pitches', () => {
      expect(cueFrequency('advance', Number.NaN)).toBe(220);
      expect(cueFrequency('advance', Number.POSITIVE_INFINITY)).toBe(220);
    });
  });

  describe('environments without AudioContext', () => {
    beforeEach(() => {
      vi.stubGlobal('AudioContext', undefined);
    });

    it('no-ops cleanly for every public method', () => {
      expect(() => engine.playCompare(50, 100)).not.toThrow();
      expect(() => engine.playCompare()).not.toThrow();
      expect(() => engine.playSwap(10, 20)).not.toThrow();
      expect(() => engine.playSwap(-100, -200)).not.toThrow();
      expect(() => engine.playPush()).not.toThrow();
      expect(() => engine.playPop()).not.toThrow();
      expect(() => engine.playComplete()).not.toThrow();
      expect(() => engine.playCue(cue('advance'))).not.toThrow();
      expect(() => engine.playCue(cue('complete'))).not.toThrow();
      expect(() => engine.setMuted(true)).not.toThrow();
      expect(engine.toggleMute()).toBe(false);
    });
  });

  describe('module-level API', () => {
    it('exposes the singleton helpers without throwing', () => {
      setMuted(false);
      expect(isMuted()).toBe(false);
      expect(() => playCompare(10, 50)).not.toThrow();
      expect(() => playSwap(5, 15)).not.toThrow();
      expect(() => playPush()).not.toThrow();
      expect(() => playPop()).not.toThrow();
      expect(() => playComplete()).not.toThrow();
      expect(() => playCue(cue('advance'))).not.toThrow();
      expect(toggleMute()).toBe(true);
      expect(soundEngine.isMuted()).toBe(true);
      setMuted(false);
    });

    it('handles boundary values safely', () => {
      expect(() => soundEngine.playCompare(-50, 0)).not.toThrow();
      expect(() => soundEngine.playCompare(500, 100)).not.toThrow();
    });
  });
});
