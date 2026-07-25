import { describe, expect, it } from 'vitest';
import {
  DEFAULT_Z_ALGORITHM_INPUT,
  generateZAlgorithmSteps,
  zAlgorithm,
} from '../zAlgorithm';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('zAlgorithm unit spec', () => {
  it('should have correct algorithm metadata', () => {
    expect(zAlgorithm.id).toBe('z-algorithm');
    expect(zAlgorithm.title).toBe('Z-Algorithm String Matching');
    expect(zAlgorithm.category).toBe('tries');
    expect(zAlgorithm.difficulty).toBe('Hard');
    expect(zAlgorithm.code).toContain('def z_algorithm');
    expect(zAlgorithm.timeComplexity.average).toBe('O(n + m)');
    expect(zAlgorithm.spaceComplexity).toBe('O(n + m)');
  });

  it('should generate steps for pattern matching with default input', () => {
    const steps = generateZAlgorithmSteps(DEFAULT_Z_ALGORITHM_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.primarySnapshot.kind).toBe('array');

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.totalMatches).toBe(3);

    const snapshot = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements.length).toBe(12); // 'aba' (3) + '$' (1) + 'ababaaba' (8) = 12
  });

  it('should handle edge cases like empty string or pattern larger than text', () => {
    const invalidInput = { text: 'abc', pattern: 'abcdef' };
    const steps = generateZAlgorithmSteps(invalidInput);
    expect(steps.length).toBe(1);
    expect(steps[0].variables.matchesCount).toBe(0);
  });

  it('should accurately find single match', () => {
    const input = { text: 'hello world', pattern: 'world' };
    const steps = generateZAlgorithmSteps(input);
    const matchStep = steps.find((s) => s.explanation.what.includes('Pattern match found'));
    expect(matchStep).toBeDefined();
    expect(matchStep?.variables.textMatchIdx).toBe(6);
  });
});
