import { describe, expect, it } from 'vitest';
import { ALGORITHM_REGISTRY, getAlgorithm, getAllAlgorithms } from '../registry';

describe('ALGORITHM_REGISTRY', () => {
  it('should contain all 19 NeetCode topic algorithm definitions', () => {
    expect(ALGORITHM_REGISTRY['prefix-sum']).toBeDefined();
    expect(ALGORITHM_REGISTRY['two-sum']).toBeDefined();
    expect(ALGORITHM_REGISTRY['kadane-max-subarray']).toBeDefined();
    expect(ALGORITHM_REGISTRY['bubble-sort']).toBeDefined();
    expect(ALGORITHM_REGISTRY['two-sum-sorted']).toBeDefined();
    expect(ALGORITHM_REGISTRY['two-pointers']).toBeDefined();
    expect(ALGORITHM_REGISTRY['quick-sort']).toBeDefined();
    expect(ALGORITHM_REGISTRY['valid-parentheses']).toBeDefined();
    expect(ALGORITHM_REGISTRY['binary-search-matrix']).toBeDefined();
    expect(ALGORITHM_REGISTRY['sliding-window-min']).toBeDefined();
    expect(ALGORITHM_REGISTRY['binary-tree-lca']).toBeDefined();
    expect(ALGORITHM_REGISTRY['trie-prefix-tree']).toBeDefined();
    expect(ALGORITHM_REGISTRY['n-queens']).toBeDefined();
    expect(ALGORITHM_REGISTRY['bfs-graph']).toBeDefined();
    expect(ALGORITHM_REGISTRY['number-of-islands']).toBeDefined();
    expect(ALGORITHM_REGISTRY['coin-change-dp']).toBeDefined();
    expect(ALGORITHM_REGISTRY['edit-distance']).toBeDefined();
    expect(ALGORITHM_REGISTRY['dijkstra-shortest-path']).toBeDefined();
    expect(ALGORITHM_REGISTRY['topological-sort']).toBeDefined();
    expect(ALGORITHM_REGISTRY['kruskal-mst']).toBeDefined();
    expect(ALGORITHM_REGISTRY['fenwick-tree']).toBeDefined();
    expect(ALGORITHM_REGISTRY['segment-tree']).toBeDefined();
    expect(ALGORITHM_REGISTRY['kmp-string-match']).toBeDefined();
    expect(ALGORITHM_REGISTRY['sieve-primes']).toBeDefined();
    expect(ALGORITHM_REGISTRY['nim-game']).toBeDefined();
    expect(ALGORITHM_REGISTRY['convex-hull']).toBeDefined();

    expect(getAllAlgorithms().length).toBeGreaterThan(20);
    expect(getAlgorithm('dijkstra-shortest-path')?.category).toBe('advanced_graphs');
    expect(getAlgorithm('kruskal-mst')?.category).toBe('advanced_graphs');
    expect(getAlgorithm('segment-tree')?.category).toBe('advanced_range_and_cp');
  });
});
