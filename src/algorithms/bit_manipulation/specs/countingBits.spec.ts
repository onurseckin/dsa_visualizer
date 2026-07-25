import { describe, it, expect } from 'vitest';
import {
  countingBits,
  generateCountingBitsSteps,
  DEFAULT_COUNTING_BITS_INPUT,
} from '../countingBits';

describe('countingBits logic spec (category root)', () => {
  it('generates valid steps and metadata for default input', () => {
    expect(countingBits.id).toBe('counting-bits');
    expect(countingBits.category).toBe('bit_manipulation');
    const steps = generateCountingBitsSteps(DEFAULT_COUNTING_BITS_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.customState?.result).toBe('[0, 1, 1, 2, 1, 2]');
  });
});
