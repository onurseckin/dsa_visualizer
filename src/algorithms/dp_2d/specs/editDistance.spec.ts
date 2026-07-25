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
    const steps = generateEditDistanceSteps({ word1: '', word2: 'hello' });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.minDistance).toBe(5);
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
