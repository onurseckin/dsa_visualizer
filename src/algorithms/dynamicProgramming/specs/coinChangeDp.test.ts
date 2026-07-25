import { describe, it, expect } from 'vitest';
import { coinChangeDp } from '../coinChangeDp';

describe('Coin Change DP', () => {
  it('should calculate min coins correctly', () => {
    const input = { coins: [1, 3, 4], amount: 6 };
    const steps = coinChangeDp.generateSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe(2);
  });
});
