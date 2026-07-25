import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SEGMENT_TREE_LAZY_INPUT,
  generateSegmentTreeLazySteps,
  segmentTreeLazy,
} from '../segmentTreeLazy';
import type { TreeVisualSnapshot } from '../../../types/dsa';

describe('segmentTreeLazy algorithm spec', () => {
  it('should have correct algorithm metadata', () => {
    expect(segmentTreeLazy.id).toBe('segment-tree-lazy');
    expect(segmentTreeLazy.title).toBe('Segment Tree (Lazy Propagation)');
    expect(segmentTreeLazy.category).toBe('advanced_range_queries');
    expect(segmentTreeLazy.difficulty).toBe('Hard');
    expect(segmentTreeLazy.code).toContain('class SegmentTreeLazy');
    expect(segmentTreeLazy.timeComplexity.average).toBe('O(log n)');
    expect(segmentTreeLazy.spaceComplexity).toBe('O(n)');
  });

  it('should generate valid steps for default input', () => {
    const steps = generateSegmentTreeLazySteps(DEFAULT_SEGMENT_TREE_LAZY_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe('tree');

    const snapshot = firstStep.primarySnapshot as TreeVisualSnapshot;
    expect(snapshot.nodes).toBeDefined();

    const queryResultSteps = steps.filter((s) =>
      s.explanation.what.includes('Range query [1..3] equals')
    );
    expect(queryResultSteps.length).toBe(2);

    // Initial sum for range [1..3] in array [1, 2, 3, 4, 5] is 2 + 3 + 4 = 9
    expect(queryResultSteps[0].variables.totalSum).toBe(9);

    // After adding 5 to [1..3], array becomes [1, 7, 8, 9, 5]. Range [1..3] sum is 7 + 8 + 9 = 24
    expect(queryResultSteps[1].variables.totalSum).toBe(24);
  });

  it('should handle empty input array', () => {
    const steps = generateSegmentTreeLazySteps({ array: [] });
    expect(steps.length).toBe(1);
    expect(steps[0].variables.n).toBe(0);
  });
});
