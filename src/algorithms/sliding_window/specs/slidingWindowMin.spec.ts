import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SLIDING_WINDOW_MIN_INPUT,
  generateSlidingWindowMinSteps,
  slidingWindowMin,
} from '../slidingWindowMin';

describe('slidingWindowMin algorithm spec', () => {
  it('should have valid metadata', () => {
    expect(slidingWindowMin.id).toBe('sliding-window-min');
    expect(slidingWindowMin.title).toBe('Sliding Window Minimum');
    expect(slidingWindowMin.category).toBe('sliding_window');
    expect(slidingWindowMin.difficulty).toBe('Hard');
    expect(slidingWindowMin.defaultInput).toEqual(DEFAULT_SLIDING_WINDOW_MIN_INPUT);
  });

  it('should compute sliding window minimums correctly for default input', () => {
    const steps = generateSlidingWindowMinSteps(DEFAULT_SLIDING_WINDOW_MIN_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(14);
    expect(lastStep.variables.result).toBe('2, 2, 5, 5, 3, 3');
    expect(lastStep.auxiliaryState.visited).toEqual([2, 2, 5, 5, 3, 3]);
  });

  it('should handle window size equal to array length', () => {
    const input = { nums: [5, 1, 4, 2], k: 4 };
    const steps = generateSlidingWindowMinSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe('1');
  });

  it('should handle window size of 1', () => {
    const input = { nums: [3, 1, 4], k: 1 };
    const steps = generateSlidingWindowMinSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe('3, 1, 4');
  });
});
