import { describe, expect, it } from 'vitest';
import {
  euclidGcd,
  DEFAULT_EUCLID_GCD_INPUT,
  generateEuclidGcdSteps,
  PYTHON_EUCLID_GCD_CODE,
} from '../euclidGcd';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('euclidGcd spec logic', () => {
  it('has category math_and_geometry and valid metadata', () => {
    expect(euclidGcd.id).toBe('euclid-gcd');
    expect(euclidGcd.category).toBe('math_and_geometry');
    expect(euclidGcd.defaultInput).toEqual(DEFAULT_EUCLID_GCD_INPUT);
    expect(euclidGcd.code).toBe(PYTHON_EUCLID_GCD_CODE);
  });

  it('generates correct steps for Euclidean GCD', () => {
    const steps = generateEuclidGcdSteps(DEFAULT_EUCLID_GCD_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe('array');
    expect(lastStep.variables.gcd).toBe(6);
  });

  it('handles coprime numbers correctly', () => {
    const steps = generateEuclidGcdSteps({ a: 17, b: 13 });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.gcd).toBe(1);
  });
});
