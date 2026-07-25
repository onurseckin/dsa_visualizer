import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  SoundEngine,
  soundEngine,
  playCompare,
  playSwap,
  playPush,
  playPop,
  playComplete,
  setMuted,
  isMuted,
  toggleMute,
} from '../soundEngine';

class MockAudioParam {
  value = 1;
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
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
      nowMs = 50;
      engine.playPush();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
    });

    it('does not advance the throttle clock for skipped tones', () => {
      engine.playPush(); // plays at t=0
      nowMs = 50;
      engine.playPush(); // throttled; must not mark t=50
      nowMs = 90;
      engine.playPush(); // 90ms since last actual play — must fire
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
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
    it('skips new voices once 8 are active and frees slots via onended', () => {
      for (let i = 0; i < 8; i++) {
        nowMs = i * 100;
        engine.playPush();
      }
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(8);

      nowMs = 900;
      engine.playPush();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(8);

      const firstVoice = mockCtx.oscillators[0];
      firstVoice.onended?.();
      expect(firstVoice.disconnect).toHaveBeenCalled();

      nowMs = 1000;
      engine.playPush();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(9);
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
