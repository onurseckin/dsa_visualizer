import { describe, expect, it } from 'vitest';
import {
  fordFulkerson,
  DEFAULT_FORD_FULKERSON_INPUT,
  generateFordFulkersonSteps,
} from '../fordFulkerson';
import type { GraphVisualSnapshot } from '../../../types/dsa';

describe('fordFulkerson algorithm logic spec', () => {
  it('should have correct algorithm definition metadata', () => {
    expect(fordFulkerson.id).toBe('ford-fulkerson');
    expect(fordFulkerson.title).toBe('Ford-Fulkerson Maximum Flow');
    expect(fordFulkerson.category).toBe('advanced_graphs');
    expect(fordFulkerson.difficulty).toBe('Hard');
    expect(fordFulkerson.defaultInput).toEqual(DEFAULT_FORD_FULKERSON_INPUT);
    expect(fordFulkerson.code).toContain('def ford_fulkerson');
  });

  it('should generate valid steps and compute max flow for default input', () => {
    const steps = generateFordFulkersonSteps(DEFAULT_FORD_FULKERSON_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(2);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain('Maximum Flow algorithm complete');
    expect(lastStep.variables.maxFlow).toBe(20);

    const snapshot = lastStep.primarySnapshot as GraphVisualSnapshot;
    expect(snapshot.kind).toBe('graph');
    expect(snapshot.nodes.length).toBe(4);
    expect(snapshot.edges.length).toBe(5);
  });

  it('should handle graph with zero capacity or no path from source to sink', () => {
    const noPathInput = {
      nodes: ['S', 'A', 'T'],
      edges: [
        { from: 'S', to: 'A', capacity: 10 },
        { from: 'T', to: 'A', capacity: 10 }, // No edge into T
      ],
      source: 'S',
      sink: 'T',
    };

    const steps = generateFordFulkersonSteps(noPathInput);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.maxFlow).toBe(0);
    expect(lastStep.explanation.what).toContain('No more augmenting paths');
  });

  it('should handle empty input graph', () => {
    const emptyInput = { nodes: [], edges: [], source: '', sink: '' };
    const steps = generateFordFulkersonSteps(emptyInput);
    expect(steps.length).toBe(1);
    expect(steps[0].explanation.what).toContain('Initialize');
  });
});
