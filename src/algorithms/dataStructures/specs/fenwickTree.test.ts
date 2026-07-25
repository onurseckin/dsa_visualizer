import { describe, expect, it } from 'vitest';
import { fenwickTree, generateFenwickTreeSteps } from '../fenwickTree';

describe('fenwickTree algorithm', () => {
  it('should have correct algorithm metadata', () => {
    expect(fenwickTree.id).toBe('fenwick-tree');
    expect(fenwickTree.title).toContain('Fenwick Tree');
    expect(fenwickTree.category).toBe('data-structures');
    expect(fenwickTree.timeComplexity.average).toBe('O(log n)');
    expect(fenwickTree.spaceComplexity).toBe('O(n)');
  });

  it('should generate valid steps for default input', () => {
    const steps = generateFenwickTreeSteps(fenwickTree.defaultInput);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe('array');

    // Default input has query [1..5] on initial array [3, 2, -1, 6, 5, 4, -3, 37] -> sum is 15
    const rangeQuerySteps = steps.filter((s) => s.explanation.what.includes('Range Query [1..5] Result'));
    expect(rangeQuerySteps.length).toBe(2);
    expect(rangeQuerySteps[0].variables.rangeSum).toBe(15);
    // After updating index 3 by 5, sum becomes 20
    expect(rangeQuerySteps[1].variables.rangeSum).toBe(20);
  });

  it('should handle point update correctly', () => {
    const steps = generateFenwickTreeSteps({
      array: [1, 2, 3, 4],
      operations: [{ type: 'update', index: 2, delta: 10 }],
    });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain('complete');
  });

  it('should handle empty input array', () => {
    const steps = generateFenwickTreeSteps({ array: [] });
    expect(steps.length).toBeGreaterThan(0);
  });
});
