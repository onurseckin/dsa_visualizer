import { describe, expect, it } from 'vitest';
import { ALGORITHM_REGISTRY, getAlgorithm, getAllAlgorithms } from './registry';

describe('ALGORITHM_REGISTRY', () => {
  it('should contain all required algorithm definitions', () => {
    expect(ALGORITHM_REGISTRY['bubble-sort']).toBeDefined();
    expect(ALGORITHM_REGISTRY['quick-sort']).toBeDefined();
    expect(ALGORITHM_REGISTRY['coin-change-dp']).toBeDefined();
    expect(ALGORITHM_REGISTRY['bfs-graph']).toBeDefined();
    expect(ALGORITHM_REGISTRY['dijkstra-shortest-path']).toBeDefined();
    expect(ALGORITHM_REGISTRY['topological-sort']).toBeDefined();
    expect(ALGORITHM_REGISTRY['kruskal-mst']).toBeDefined();
    expect(ALGORITHM_REGISTRY['kmp-string-match']).toBeDefined();
    expect(ALGORITHM_REGISTRY['sieve-primes']).toBeDefined();
    expect(ALGORITHM_REGISTRY['nim-game']).toBeDefined();
    expect(ALGORITHM_REGISTRY['kadane-max-subarray']).toBeDefined();
    expect(ALGORITHM_REGISTRY['two-pointers']).toBeDefined();
    expect(ALGORITHM_REGISTRY['fenwick-tree']).toBeDefined();
    expect(ALGORITHM_REGISTRY['segment-tree']).toBeDefined();
    expect(ALGORITHM_REGISTRY['two-sum']).toBeDefined();
  });

  it('should retrieve algorithm by id via getAlgorithm', () => {
    const algo = getAlgorithm('segment-tree');
    expect(algo).toBeDefined();
    expect(algo?.id).toBe('segment-tree');

    const invalid = getAlgorithm('non-existent');
    expect(invalid).toBeUndefined();
  });

  it('should list all registered algorithms via getAllAlgorithms', () => {
    const algos = getAllAlgorithms();
    expect(algos.length).toBeGreaterThanOrEqual(14);
    const ids = algos.map((a) => a.id);
    expect(ids).toContain('kadane-max-subarray');
    expect(ids).toContain('two-pointers');
    expect(ids).toContain('fenwick-tree');
    expect(ids).toContain('segment-tree');
  });
});
