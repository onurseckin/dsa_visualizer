import { describe, it, expect } from 'vitest';
import {
  countingBits,
  generateCountingBitsSteps,
  DEFAULT_COUNTING_BITS_INPUT,
} from '../countingBits';

describe('countingBits logic spec', () => {
  it('has correct algorithm metadata', () => {
    expect(countingBits.id).toBe('counting-bits');
    expect(countingBits.title).toBe('Counting Bits');
    expect(countingBits.category).toBe('bit_manipulation');
    expect(countingBits.difficulty).toBe('Easy');
    expect(countingBits.code).toContain('def countBits(n):');
  });

  it('generates valid steps for default input (n = 5)', () => {
    const steps = generateCountingBitsSteps(DEFAULT_COUNTING_BITS_INPUT);
    expect(steps.length).toBe(7); // 1 init + 5 loop + 1 finish
    expect(steps[0].stepIndex).toBe(0);
    
    // Verify sequential step indices
    steps.forEach((step, idx) => {
      expect(step.stepIndex).toBe(idx);
      expect(step.explanation.what).toBeTruthy();
      expect(step.explanation.why).toBeTruthy();
      expect(step.primarySnapshot.kind).toBe('array');
    });

    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.customState?.result).toBe('[0, 1, 1, 2, 1, 2]');
  });

  it('handles edge case n = 0', () => {
    const steps = generateCountingBitsSteps({ n: 0 });
    expect(steps.length).toBe(2); // init + finish
    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.customState?.result).toBe('[0]');
  });

  it('handles edge case n = 1', () => {
    const steps = generateCountingBitsSteps({ n: 1 });
    expect(steps.length).toBe(3); // init + i=1 + finish
    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.customState?.result).toBe('[0, 1]');
  });

  it('handles negative n by clamping to 0', () => {
    const steps = generateCountingBitsSteps({ n: -5 });
    expect(steps.length).toBe(2);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.customState?.result).toBe('[0]');
  });

  it('ensures step generator is pure and deterministic', () => {
    const steps1 = generateCountingBitsSteps(DEFAULT_COUNTING_BITS_INPUT);
    const steps2 = generateCountingBitsSteps(DEFAULT_COUNTING_BITS_INPUT);
    expect(steps1).toEqual(steps2);
  });
});

