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

    const rangeQuerySteps = steps.filter((s) => s.explanation.what.includes('Range query [1..5] equals'));
    expect(rangeQuerySteps.length).toBe(2);
    expect(rangeQuerySteps[0].variables.rangeSum).toBe(15);
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
    expect(steps.length).toBe(1);
    expect(steps[0].variables.n).toBe(0);
  });

  it('should teach the topic through a topicGuide', () => {
    const guide = fenwickTree.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.split('. ').length).toBeGreaterThanOrEqual(3);
      expect(section.body).not.toMatch(/[*#`_]|^- /);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(' ');
    expect(allText).toContain('lowbit');
    expect(allText).toContain('prefix');

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
    expect(guide.keyTerms?.map((t) => t.term)).toContain('Lowbit (i & -i)');
  });
});
