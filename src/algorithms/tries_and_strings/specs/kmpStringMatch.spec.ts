import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KMP_INPUT,
  generateKmpSteps,
  kmpStringMatch,
} from '../kmpStringMatch';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('kmpStringMatch algorithm spec', () => {
  it('should have correct algorithm metadata', () => {
    expect(kmpStringMatch.id).toBe('kmp-string-match');
    expect(kmpStringMatch.title).toBe('KMP String Matching');
    expect(kmpStringMatch.category).toBe('advanced_range_and_cp');
    expect(kmpStringMatch.difficulty).toBe('Hard');
    expect(kmpStringMatch.defaultInput).toEqual(DEFAULT_KMP_INPUT);
  });

  it('should generate valid steps and find matches for default input', () => {
    const steps = generateKmpSteps(DEFAULT_KMP_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(1);

    const snapshot = firstStep.primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.kind).toBe('array');

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain('KMP Search complete');
    expect(lastStep.variables.matchesCount).toBe(1);
  });
});
