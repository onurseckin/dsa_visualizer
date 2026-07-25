import { describe, it, expect } from 'vitest';
import {
  editDistance,
  generateEditDistanceSteps,
  DEFAULT_EDIT_DISTANCE_INPUT,
} from '../editDistance';
import type { AlgorithmStep } from '../../../types/dsa';

describe('editDistance algorithm logic spec', () => {
  it('computes correct edit distance for default input ("horse" -> "ros")', () => {
    const steps = generateEditDistanceSteps(DEFAULT_EDIT_DISTANCE_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.minDistance).toBe(3);
  });

  it('returns 0 for identical strings', () => {
    const steps = generateEditDistanceSteps({ word1: 'abc', word2: 'abc' });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.minDistance).toBe(0);
  });

  it('handles empty strings correctly', () => {
    const steps1 = generateEditDistanceSteps({ word1: '', word2: 'hello' });
    expect(steps1[steps1.length - 1].variables.minDistance).toBe(5);

    const steps2 = generateEditDistanceSteps({ word1: 'world', word2: '' });
    expect(steps2[steps2.length - 1].variables.minDistance).toBe(5);
  });

  it('handles single character replacements and insertions', () => {
    const steps1 = generateEditDistanceSteps({ word1: 'a', word2: 'b' });
    expect(steps1[steps1.length - 1].variables.minDistance).toBe(1);
  });

  it('generates grid visual snapshots', () => {
    const steps = generateEditDistanceSteps(DEFAULT_EDIT_DISTANCE_INPUT);
    steps.forEach((step: AlgorithmStep) => {
      expect(step.primarySnapshot.kind).toBe('grid');
    });
  });

  it('validates algorithm metadata', () => {
    expect(editDistance.id).toBe('edit-distance');
    expect(editDistance.category).toBe('dp_2d');
    expect(editDistance.difficulty).toBe('Hard');
  });
});
