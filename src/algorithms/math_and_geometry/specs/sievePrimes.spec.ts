import { describe, expect, it } from 'vitest';
import { sievePrimes, DEFAULT_SIEVE_INPUT, generateSieveSteps } from '../sievePrimes';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('sievePrimes spec logic', () => {
  it('has category math_and_geometry and valid metadata', () => {
    expect(sievePrimes.id).toBe('sieve-primes');
    expect(sievePrimes.category).toBe('math_and_geometry');
    expect(sievePrimes.defaultInput).toEqual(DEFAULT_SIEVE_INPUT);
  });

  it('generates steps for sieve of eratosthenes', () => {
    const steps = generateSieveSteps(DEFAULT_SIEVE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe('array');
    expect(lastStep.variables.primeCount).toBe(10);
  });
});
