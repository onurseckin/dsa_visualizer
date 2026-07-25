import { describe, it, expect } from 'vitest';
import {
  mergeIntervals,
  generateMergeIntervalsSteps,
  DEFAULT_MERGE_INTERVALS_INPUT,
} from './mergeIntervals';

describe('mergeIntervals logic spec', () => {
  it('generates valid steps for default input', () => {
    expect(mergeIntervals.id).toBe('merge-intervals');
    expect(mergeIntervals.category).toBe('intervals');
    const steps = generateMergeIntervalsSteps(DEFAULT_MERGE_INTERVALS_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.customState?.mergedResult).toBe(
      '[1, 6], [8, 10], [15, 18]'
    );
  });
});
