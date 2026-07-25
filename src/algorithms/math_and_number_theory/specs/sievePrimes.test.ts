import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SIEVE_INPUT,
  generateSieveSteps,
  sievePrimes,
} from '../sievePrimes';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('sievePrimes algorithm', () => {
  it('should have correct algorithm metadata', () => {
    expect(sievePrimes.id).toBe('sieve-primes');
    expect(sievePrimes.title).toBe('Sieve of Eratosthenes');
    expect(sievePrimes.category).toBe('math_and_number_theory');
    expect(sievePrimes.difficulty).toBe('Easy');
    expect(sievePrimes.defaultInput).toEqual(DEFAULT_SIEVE_INPUT);
  });

  it('should generate valid steps and identify primes up to default limit 30', () => {
    const steps = generateSieveSteps(DEFAULT_SIEVE_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain('complete');
    expect(lastStep.variables.primeCount).toBe(10); // 2, 3, 5, 7, 11, 13, 17, 19, 23, 29

    // Check boolean array snapshot in auxiliary state
    expect(lastStep.auxiliaryState.hashMap).toBeDefined();
    expect(lastStep.auxiliaryState.hashMap?.['isPrime[2]']).toBe('true');
    expect(lastStep.auxiliaryState.hashMap?.['isPrime[4]']).toBe('false');
    expect(lastStep.auxiliaryState.hashMap?.['isPrime[29]']).toBe('true');
  });

  it('should handle small limits like 10', () => {
    const steps = generateSieveSteps({ limit: 10 });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.primeCount).toBe(4); // 2, 3, 5, 7

    const snapshot = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements.length).toBe(11);
    expect(snapshot.elements.find((el) => el.value === 7)?.state).toBe('sorted');
    expect(snapshot.elements.find((el) => el.value === 8)?.state).toBe('visited');
  });

  it('should handle limit < 2 cleanly', () => {
    const steps = generateSieveSteps({ limit: 1 });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.primeCount).toBe(0);
  });

  it('should snapshot array elements correctly', () => {
    const steps = generateSieveSteps({ limit: 5 });
    const firstSnapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;
    expect(firstSnapshot.elements.map((el) => el.value)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
