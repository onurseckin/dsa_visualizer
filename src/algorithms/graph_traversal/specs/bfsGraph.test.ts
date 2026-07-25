import { describe, expect, it } from 'vitest';
import { bfsGraph, DEFAULT_BFS_INPUT, generateBFSGraphSteps } from '../bfsGraph';

describe('bfsGraph algorithm', () => {
  it('should have correct metadata', () => {
    expect(bfsGraph.id).toBe('bfs-graph');
    expect(bfsGraph.title).toBe('BFS Graph Traversal');
    expect(bfsGraph.category).toBe('graph_traversal');
    expect(bfsGraph.defaultInput).toEqual(DEFAULT_BFS_INPUT);
  });

  it('should generate steps with queue and visited auxiliary state', () => {
    const steps = generateBFSGraphSteps(DEFAULT_BFS_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const hasQueueState = steps.some(
      (step) => step.auxiliaryState.queue !== undefined
    );
    expect(hasQueueState).toBe(true);

    const hasVisitedState = steps.some(
      (step) => step.auxiliaryState.visited !== undefined
    );
    expect(hasVisitedState).toBe(true);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain('complete');

    const snap = lastStep.primarySnapshot;
    if (snap.kind === 'graph') {
      const visitedNodes = snap.nodes.filter((n) => n.state === 'visited');
      expect(visitedNodes.length).toBe(6);
    }
  });

  it('should handle disconnected graph components', () => {
    const customInput = {
      startNodeId: 'A',
      nodes: [
        { id: 'A', label: 'A', state: 'default' as const },
        { id: 'B', label: 'B', state: 'default' as const },
        { id: 'C', label: 'C', state: 'default' as const }, // disconnected
      ],
      edges: [{ from: 'A', to: 'B' }],
    };

    const steps = generateBFSGraphSteps(customInput);
    const lastStep = steps[steps.length - 1];
    const snap = lastStep.primarySnapshot;

    if (snap.kind === 'graph') {
      const visitedIds = snap.nodes
        .filter((n) => n.state === 'visited')
        .map((n) => n.id);
      expect(visitedIds).toContain('A');
      expect(visitedIds).toContain('B');
      expect(visitedIds).not.toContain('C');
    }
  });

  it('should handle non-existent start node', () => {
    const customInput = {
      startNodeId: 'Z',
      nodes: [{ id: 'A', label: 'A', state: 'default' as const }],
      edges: [],
    };

    const steps = generateBFSGraphSteps(customInput);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain('complete');
  });
});
