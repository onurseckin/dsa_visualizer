import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KRUSKAL_INPUT,
  generateKruskalSteps,
  kruskalMst,
} from '../kruskalMst';

describe('kruskalMst algorithm spec', () => {
  it('should have correct metadata', () => {
    expect(kruskalMst.id).toBe('kruskal-mst');
    expect(kruskalMst.title).toBe("Kruskal's Minimum Spanning Tree");
    expect(kruskalMst.category).toBe('graph_spanning_trees');
    expect(kruskalMst.defaultInput).toEqual(DEFAULT_KRUSKAL_INPUT);
  });

  it('should generate steps with DSU parent array auxiliary state', () => {
    const steps = generateKruskalSteps(DEFAULT_KRUSKAL_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const hasDsuParentHashMap = steps.some(
      (s) => s.auxiliaryState.hashMap !== undefined && Object.keys(s.auxiliaryState.hashMap).length > 0
    );
    expect(hasDsuParentHashMap).toBe(true);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("Kruskal's MST complete");

    const snap = lastStep.primarySnapshot;
    if (snap.kind === 'graph') {
      const pathEdges = snap.edges.filter((e) => e.isPath);

      // Default graph has 4 nodes (A, B, C, D) -> MST must have 3 edges (V-1)
      expect(pathEdges.length).toBe(3);
    }

    // Minimum weight calculation for default input:
    // A-B(1), B-C(2), C-D(3) -> total weight 6
    expect(lastStep.variables.totalMstWeight).toBe(6);
  });

  it('should skip cycle-forming edges', () => {
    const steps = generateKruskalSteps(DEFAULT_KRUSKAL_INPUT);
    const hasSkippedStep = steps.some(
      (s) => s.explanation.what.includes('Union rejected') || s.variables.skipped === true
    );
    expect(hasSkippedStep).toBe(true);
  });

  it('should handle graph with no edges', () => {
    const input = {
      nodes: [{ id: 'A', label: 'A', state: 'default' as const }],
      edges: [],
    };
    const steps = generateKruskalSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.totalMstWeight).toBe(0);
  });
});
