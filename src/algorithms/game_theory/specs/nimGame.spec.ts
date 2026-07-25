import { describe, expect, it } from 'vitest';
import { nimGame, DEFAULT_NIM_INPUT, generateNimGameSteps } from '../nimGame';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('nimGame spec logic', () => {
  it('has category game_theory and valid metadata', () => {
    expect(nimGame.id).toBe('nim-game');
    expect(nimGame.category).toBe('game_theory');
    expect(nimGame.defaultInput).toEqual(DEFAULT_NIM_INPUT);
  });

  it('generates steps for nim game', () => {
    const steps = generateNimGameSteps(DEFAULT_NIM_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    const snap = lastStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snap.kind).toBe('array');
    expect(lastStep.variables.winner).toBe('First Player');
  });
});
