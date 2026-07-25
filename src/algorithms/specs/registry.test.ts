import { describe, expect, it } from 'vitest';
import { ALGORITHM_REGISTRY, getAlgorithm, getAllAlgorithms } from '../registry';

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
    expect(ALGORITHM_REGISTRY['binary-search-matrix']).toBeDefined();
    expect(ALGORITHM_REGISTRY['binary-tree-lca']).toBeDefined();
    expect(ALGORITHM_REGISTRY['trie-prefix-tree']).toBeDefined();
    expect(ALGORITHM_REGISTRY['n-queens']).toBeDefined();

    const ids = Object.keys(ALGORITHM_REGISTRY);
    expect(ids).toContain('binary-search-matrix');
    expect(ids).toContain('binary-tree-lca');
    expect(ids).toContain('trie-prefix-tree');
    expect(ids).toContain('n-queens');

    expect(getAllAlgorithms().length).toBeGreaterThan(0);
    expect(getAlgorithm('bubble-sort')).toBeDefined();
  });
});
