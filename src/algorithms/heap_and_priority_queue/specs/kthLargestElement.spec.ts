import { describe, it, expect } from 'vitest';
import {
  kthLargestElement,
  generateKthLargestSteps,
  DEFAULT_KTH_LARGEST_INPUT,
} from '../kthLargestElement';

describe('kthLargestElement logic spec', () => {
  it('generates valid steps for default input', () => {
    const steps = generateKthLargestSteps(DEFAULT_KTH_LARGEST_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.primarySnapshot.kind).toBe('array');
    if (firstStep.primarySnapshot.kind === 'array') {
      expect(firstStep.primarySnapshot.elements).toBeDefined();
    }

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe(5);
  });

  it('correctly calculates 4th largest in custom array with duplicates', () => {
    const input = {
      nums: [3, 2, 3, 1, 2, 4, 5, 5, 6],
      k: 4,
    };
    const steps = generateKthLargestSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe(4);
  });

  it('handles empty input gracefully', () => {
    const steps = generateKthLargestSteps({ nums: [], k: 1 });
    expect(steps.length).toBe(1);
    expect(steps[0].variables.result).toBe(-1);
  });

  it('ensures step generator function is pure and deterministic', () => {
    const input = { nums: [3, 2, 1, 5, 6, 4], k: 2 };
    const originalNums = [...input.nums];

    const steps1 = generateKthLargestSteps(input);
    const steps2 = generateKthLargestSteps(input);

    expect(input.nums).toEqual(originalNums);
    expect(steps1).toEqual(steps2);
  });

  it('verifies algorithm definition metadata', () => {
    expect(kthLargestElement.id).toBe('kth-largest-element');
    expect(kthLargestElement.category).toBe('heap_and_priority_queue');
    expect(kthLargestElement.difficulty).toBe('Medium');
  });
});
