import { describe, it, expect } from 'vitest';
import { dijkstraShortestPath } from './dijkstraShortestPath';

describe("Dijkstra's Shortest Path", () => {
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
  });
});
