import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PREFIX_SUM_INPUT,
  generatePrefixSumSteps,
  prefixSum,
} from '../prefixSum';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('prefixSum algorithm spec', () => {
  it('should have valid metadata', () => {
    expect(prefixSum.id).toBe('prefix-sum');
    expect(prefixSum.title).toBe('Prefix Sum');
    expect(prefixSum.category).toBe('arrays_and_hashing');
    expect(prefixSum.difficulty).toBe('Easy');
    expect(prefixSum.defaultInput).toEqual(DEFAULT_PREFIX_SUM_INPUT);
  });

  it('should generate steps for default input correctly', () => {
    const steps = generatePrefixSumSteps(DEFAULT_PREFIX_SUM_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.codeLine).toBe(1);
    expect(firstStep.explanation.what).toContain('Initialize Prefix Sum');

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(5);
    expect(lastStep.variables.result).toBe('0, 2, 6, 7, 10, 15');
    expect(lastStep.auxiliaryState.visited).toEqual([0, 2, 6, 7, 10, 15]);
  });

  it('should handle single element input array', () => {
    const input = { nums: [7] };
    const steps = generatePrefixSumSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe('0, 7');
    expect(lastStep.auxiliaryState.visited).toEqual([0, 7]);
  });

  it('should handle negative numbers correctly', () => {
    const input = { nums: [3, -2, 5, -1] };
    const steps = generatePrefixSumSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe('0, 3, 1, 6, 5');
    expect(lastStep.auxiliaryState.visited).toEqual([0, 3, 1, 6, 5]);

    const snapshot = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements).toHaveLength(4);
  });
});
