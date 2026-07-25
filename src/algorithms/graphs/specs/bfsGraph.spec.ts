import { describe, expect, it } from 'vitest';
import { bfsGraph, DEFAULT_BFS_INPUT, generateBFSGraphSteps } from '../bfsGraph';
import type { GraphVisualSnapshot } from '../../../types/dsa';

describe('bfsGraph spec logic', () => {
  it('has category graphs and valid metadata', () => {
    expect(bfsGraph.id).toBe('bfs-graph');
    expect(bfsGraph.category).toBe('graphs');
    expect(bfsGraph.defaultInput).toEqual(DEFAULT_BFS_INPUT);
  });

  it('generates non-empty steps for default input', () => {
    const steps = generateBFSGraphSteps(DEFAULT_BFS_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    const snap = lastStep.primarySnapshot as GraphVisualSnapshot;
    expect(snap.kind).toBe('graph');
  });
});
