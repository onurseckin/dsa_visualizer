import { describe, expect, it } from 'vitest';
import { generateTwoPointersSteps, twoPointers } from './twoPointers';

describe('twoPointers algorithm', () => {
  it('should have correct algorithm metadata', () => {
    expect(twoPointers.id).toBe('two-pointers');
    expect(twoPointers.title).toContain('Two Pointers');
    expect(twoPointers.category).toBe('data-structures');
    expect(twoPointers.timeComplexity.average).toBe('O(n)');
    expect(twoPointers.spaceComplexity).toBe('O(1)');
  });

  it('should generate valid steps and find target for default input', () => {
    const steps = generateTwoPointersSteps(twoPointers.defaultInput);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.currentSum).toBe(12);
    expect(lastStep.variables.left).toBe(1);
    expect(lastStep.variables.right).toBe(3);
  });

  it('should handle empty input array', () => {
    const steps = generateTwoPointersSteps({ array: [], target: 5 });
    expect(steps.length).toBe(2);
    expect(steps[1].variables.left).toBe(-1);
  });

  it('should return [-1, -1] when target is not found', () => {
    const steps = generateTwoPointersSteps({ array: [1, 2, 3], target: 100 });
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.left).toBe(-1);
    expect(lastStep.variables.right).toBe(-1);
  });

  it('should handle single element matching target', () => {
    const steps = generateTwoPointersSteps({ array: [5], target: 5 });
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.left).toBe(0);
    expect(lastStep.variables.right).toBe(0);
  });
});
