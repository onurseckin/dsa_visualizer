import { describe, expect, it } from 'vitest';
import { generateSegmentTreeSteps, segmentTree } from '../segmentTree';

describe('segmentTree algorithm', () => {
  it('should have correct algorithm metadata', () => {
    expect(segmentTree.id).toBe('segment-tree');
    expect(segmentTree.title).toContain('Segment Tree');
    expect(segmentTree.category).toBe('data-structures');
    expect(segmentTree.timeComplexity.average).toBe('O(log n)');
    expect(segmentTree.spaceComplexity).toBe('O(n)');
  });

  it('should generate valid steps for default input', () => {
    const steps = generateSegmentTreeSteps(segmentTree.defaultInput);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe('tree');

    // Default input array: [1, 3, 5, 7, 9, 11]
    // 1st operation: query [1..3] (indices 1, 2, 3: 3+5+7 = 15)
    // 2nd operation: update index 2 to value 6 (array becomes [1, 3, 6, 7, 9, 11])
    // 3rd operation: query [1..3] (indices 1, 2, 3: 3+6+7 = 16)
    const resultSteps = steps.filter((s) =>
      s.explanation.what.includes('Range Query [1..3] Result')
    );
    expect(resultSteps.length).toBe(2);
    expect(resultSteps[0].variables.totalSum).toBe(15);
    expect(resultSteps[1].variables.totalSum).toBe(16);
  });

  it('should handle point update operation correctly', () => {
    const steps = generateSegmentTreeSteps({
      array: [10, 20, 30],
      operations: [{ type: 'update', index: 0, value: 50 }],
    });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.rootSum).toBe(100);
  });

  it('should handle empty input array', () => {
    const steps = generateSegmentTreeSteps({ array: [] });
    expect(steps.length).toBe(1);
    expect(steps[0].primarySnapshot.kind).toBe('tree');
  });
});
