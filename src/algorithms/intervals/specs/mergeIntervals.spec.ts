import { describe, it, expect } from 'vitest';
import {
  mergeIntervals,
  generateMergeIntervalsSteps,
  DEFAULT_MERGE_INTERVALS_INPUT,
} from '../mergeIntervals';

describe('mergeIntervals logic spec', () => {
  it('generates valid steps for default input', () => {
    const steps = generateMergeIntervalsSteps(DEFAULT_MERGE_INTERVALS_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.primarySnapshot.kind).toBe('array');

    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.customState?.mergedResult).toBe(
      '[1, 6], [8, 10], [15, 18]'
    );
  });

  it('handles overlapping boundary case [[1,4],[4,5]]', () => {
    const steps = generateMergeIntervalsSteps({
      intervals: [
        { start: 1, end: 4 },
        { start: 4, end: 5 },
      ],
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.customState?.mergedResult).toBe('[1, 5]');
  });

  it('handles empty intervals array gracefully', () => {
    const steps = generateMergeIntervalsSteps({ intervals: [] });
    expect(steps.length).toBe(1);
    expect(steps[0].auxiliaryState.customState?.merged).toBe('[]');
  });

  it('verifies algorithm definition metadata', () => {
    expect(mergeIntervals.id).toBe('merge-intervals');
    expect(mergeIntervals.category).toBe('intervals');
    expect(mergeIntervals.difficulty).toBe('Medium');
  });
});
