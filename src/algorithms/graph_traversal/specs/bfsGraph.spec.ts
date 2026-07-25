import { describe, expect, it } from 'vitest';
import { bfsGraph, DEFAULT_BFS_INPUT, generateBFSGraphSteps } from '../bfsGraph';

describe('bfsGraph spec logic', () => {
  it('has category graph_traversal and valid metadata', () => {
    expect(bfsGraph.id).toBe('bfs-graph');
    expect(bfsGraph.category).toBe('graph_traversal');
    expect(bfsGraph.defaultInput).toEqual(DEFAULT_BFS_INPUT);
  });

  it('generates non-empty steps for default input', () => {
    const steps = generateBFSGraphSteps(DEFAULT_BFS_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.primarySnapshot.kind).toBe('graph');
  });
});
