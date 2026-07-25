import { describe, expect, it } from 'vitest';
import { generateSegmentTreeSteps, segmentTree } from '../segmentTree';
import type { TreeVisualSnapshot } from '../../../types/dsa';

describe('segmentTree algorithm spec', () => {
  it('should have correct algorithm metadata', () => {
    expect(segmentTree.id).toBe('segment-tree');
    expect(segmentTree.title).toContain('Segment Tree');
    expect(segmentTree.category).toBe('advanced_range_and_cp');
    expect(segmentTree.timeComplexity.average).toBe('O(log n)');
    expect(segmentTree.spaceComplexity).toBe('O(n)');
  });

  it('should generate valid steps for default input', () => {
    const steps = generateSegmentTreeSteps(segmentTree.defaultInput);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe('tree');

    const snapshot = firstStep.primarySnapshot as TreeVisualSnapshot;
    expect(snapshot.nodes).toBeDefined();

    const resultSteps = steps.filter((s) =>
      s.explanation.what.includes('Range Query [1..3] Result')
    );
    expect(resultSteps.length).toBe(2);
    expect(resultSteps[0].variables.totalSum).toBe(15);
    expect(resultSteps[1].variables.totalSum).toBe(16);
  });
});
