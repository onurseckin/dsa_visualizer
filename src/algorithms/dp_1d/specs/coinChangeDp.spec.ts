import { describe, expect, it } from 'vitest';
import { coinChangeDp } from '../coinChangeDp';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('coinChangeDp spec logic', () => {
  it('has category dp_1d and valid metadata', () => {
    expect(coinChangeDp.id).toBe('coin-change-dp');
    expect(coinChangeDp.category).toBe('dp_1d');
    expect(coinChangeDp.difficulty).toBe('Medium');
  });

  it('generates non-empty steps for default input', () => {
    const steps = coinChangeDp.generateSteps(coinChangeDp.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe('array');
    expect(lastStep.variables.result).toBe(2);
  });
});
