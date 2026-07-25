import { describe, expect, it } from 'vitest';
import { generateKadaneMaxSubarraySteps, kadaneMaxSubarray } from '../kadaneMaxSubarray';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('kadaneMaxSubarray algorithm spec', () => {
  it('should have correct algorithm metadata', () => {
    expect(kadaneMaxSubarray.id).toBe('kadane-max-subarray');
    expect(kadaneMaxSubarray.title).toContain("Kadane's Algorithm");
    expect(kadaneMaxSubarray.category).toBe('arrays_and_hashing');
    expect(kadaneMaxSubarray.timeComplexity.average).toBe('O(n)');
    expect(kadaneMaxSubarray.spaceComplexity).toBe('O(1)');
  });

  it('should generate valid steps for default input', () => {
    const steps = generateKadaneMaxSubarraySteps(kadaneMaxSubarray.defaultInput);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    const snap = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe('array');

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.globalMax).toBe(6);
    expect(lastStep.variables.start).toBe(3);
    expect(lastStep.variables.end).toBe(6);
  });

  it('should handle empty input array', () => {
    const steps = generateKadaneMaxSubarraySteps([]);
    expect(steps.length).toBe(1);
    expect(steps[0].variables.globalMax).toBe(0);
  });

  it('should handle single element input array', () => {
    const steps = generateKadaneMaxSubarraySteps([5]);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.globalMax).toBe(5);
    expect(lastStep.variables.start).toBe(0);
    expect(lastStep.variables.end).toBe(0);
  });

  it('should handle all negative numbers correctly', () => {
    const steps = generateKadaneMaxSubarraySteps([-5, -2, -8, -1]);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.globalMax).toBe(-1);
    expect(lastStep.variables.start).toBe(3);
    expect(lastStep.variables.end).toBe(3);
  });
});
