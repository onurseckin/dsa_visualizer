import { describe, expect, it } from 'vitest';
import { ALGORITHM_REGISTRY, getAlgorithm, getAllAlgorithms } from './registry';

describe('ALGORITHM_REGISTRY', () => {
  it('should contain all required algorithm definitions', () => {
    expect(ALGORITHM_REGISTRY['bubble-sort']).toBeDefined();
    expect(ALGORITHM_REGISTRY['quick-sort']).toBeDefined();
    expect(ALGORITHM_REGISTRY['bfs-graph']).toBeDefined();
    expect(ALGORITHM_REGISTRY['two-sum']).toBeDefined();
  });

  it('should retrieve algorithm by id via getAlgorithm', () => {
    const algo = getAlgorithm('bubble-sort');
    expect(algo).toBeDefined();
    expect(algo?.id).toBe('bubble-sort');

    const invalid = getAlgorithm('non-existent');
    expect(invalid).toBeUndefined();
  });

  it('should list all registered algorithms via getAllAlgorithms', () => {
    const algos = getAllAlgorithms();
    expect(algos.length).toBe(4);
    const ids = algos.map((a) => a.id);
    expect(ids).toContain('bubble-sort');
    expect(ids).toContain('quick-sort');
    expect(ids).toContain('bfs-graph');
    expect(ids).toContain('two-sum');
  });
});
