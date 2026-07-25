import { describe, expect, it } from 'vitest';
import { dijkstraShortestPath } from '../dijkstraShortestPath';

describe("dijkstraShortestPath logic spec", () => {
  it('should have correct algorithm metadata', () => {
    expect(dijkstraShortestPath.id).toBe('dijkstra-shortest-path');
    expect(dijkstraShortestPath.category).toBe('graph_shortest_paths');
    expect(dijkstraShortestPath.difficulty).toBe('Medium');
  });

  it('should compute shortest path distances correctly', () => {
    const input = {
      nodes: ['A', 'B', 'C'],
      edges: [
        { from: 'A', to: 'B', weight: 2 },
        { from: 'B', to: 'C', weight: 3 },
        { from: 'A', to: 'C', weight: 10 },
      ],
      startNode: 'A',
    };
    const steps = dijkstraShortestPath.generateSteps(input);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.distanceTable?.['C']).toBe(5);

    const snapshot = lastStep.primarySnapshot;
    if (snapshot.kind === 'graph') {
      expect(snapshot.kind).toBe('graph');
      expect(snapshot.nodes.length).toBe(3);
    }
  });
});
