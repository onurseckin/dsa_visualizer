import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  soundEngine,
  playCompare,
  playSwap,
  playPush,
  playPop,
  playComplete,
} from '../soundEngine';

describe('SoundEngine Logic Spec', () => {
  beforeEach(() => {
    soundEngine.setMuted(false);
  });

  it('should manage mute state correctly', () => {
    expect(soundEngine.isMuted()).toBe(false);

    soundEngine.setMuted(true);
    expect(soundEngine.isMuted()).toBe(true);

    const toggled = soundEngine.toggleMute();
    expect(toggled).toBe(false);
    expect(soundEngine.isMuted()).toBe(false);
  });

  it('should execute tone functions without throwing errors when audio context is unavailable', () => {
    expect(() => soundEngine.playCompare(50, 100)).not.toThrow();
    expect(() => soundEngine.playCompare()).not.toThrow();
    expect(() => soundEngine.playSwap(10, 20)).not.toThrow();
    expect(() => soundEngine.playPush()).not.toThrow();
    expect(() => soundEngine.playPop()).not.toThrow();
    expect(() => soundEngine.playComplete()).not.toThrow();
  });

  it('should execute convenience helper functions without throwing', () => {
    expect(() => playCompare(10, 50)).not.toThrow();
    expect(() => playSwap(5, 15)).not.toThrow();
    expect(() => playPush()).not.toThrow();
    expect(() => playPop()).not.toThrow();
    expect(() => playComplete()).not.toThrow();
  });

  it('should remain silent when muted', () => {
    soundEngine.setMuted(true);
    expect(() => soundEngine.playCompare(80, 100)).not.toThrow();
    expect(() => soundEngine.playSwap(100, 200)).not.toThrow();
  });

  it('should handle boundary conditions safely in playCompare and playSwap', () => {
    expect(() => soundEngine.playCompare(-50, 0)).not.toThrow();
    expect(() => soundEngine.playCompare(500, 100)).not.toThrow();
    expect(() => soundEngine.playSwap(-100, -200)).not.toThrow();
  });

  it('should play complete sequence via timeouts', () => {
    vi.useFakeTimers();
    expect(() => playComplete()).not.toThrow();
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
  });
});
