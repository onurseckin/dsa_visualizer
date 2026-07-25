import { describe, expect, it } from 'vitest';
import { fenwickTree, generateFenwickTreeSteps } from '../fenwickTree';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('fenwickTree algorithm spec', () => {
  it('should have correct algorithm metadata', () => {
    expect(fenwickTree.id).toBe('fenwick-tree');
    expect(fenwickTree.title).toContain('Fenwick Tree');
    expect(fenwickTree.category).toBe('advanced_range_queries');
    expect(fenwickTree.timeComplexity.average).toBe('O(log n)');
    expect(fenwickTree.spaceComplexity).toBe('O(n)');
  });

  it('should generate valid steps for default input', () => {
    const steps = generateFenwickTreeSteps(fenwickTree.defaultInput);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe('array');

    const snapshot = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements).toBeDefined();

    const rangeQuerySteps = steps.filter((s) => s.explanation.what.includes('Range Query [1..5] Result'));
    expect(rangeQuerySteps.length).toBe(2);
    expect(rangeQuerySteps[0].variables.rangeSum).toBe(15);
    expect(rangeQuerySteps[1].variables.rangeSum).toBe(20);
  });
});
