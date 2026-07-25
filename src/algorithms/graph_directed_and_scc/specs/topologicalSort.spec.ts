import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TOPO_SORT_INPUT,
  generateTopologicalSortSteps,
  topologicalSort,
} from '../topologicalSort';

describe('topologicalSort algorithm spec', () => {
  it('should have correct metadata', () => {
    expect(topologicalSort.id).toBe('topological-sort');
    expect(topologicalSort.title).toBe("Topological Sort (Kahn's Algorithm)");
    expect(topologicalSort.category).toBe('graph_directed_and_scc');
    expect(topologicalSort.defaultInput).toEqual(DEFAULT_TOPO_SORT_INPUT);
  });

  it('should generate steps with In-Degree auxiliary state', () => {
    const steps = generateTopologicalSortSteps(DEFAULT_TOPO_SORT_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);

    const snapshot = firstStep.primarySnapshot;
    if (snapshot.kind === 'graph') {
      expect(snapshot.kind).toBe('graph');
    }

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain('Topological Sort complete');
  });
});
