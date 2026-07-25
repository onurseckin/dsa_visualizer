import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KMP_INPUT,
  generateKmpSteps,
  kmpStringMatch,
} from '../kmpStringMatch';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('kmpStringMatch algorithm', () => {
  it('should have correct algorithm metadata', () => {
    expect(kmpStringMatch.id).toBe('kmp-string-match');
    expect(kmpStringMatch.title).toBe('KMP String Matching');
    expect(kmpStringMatch.category).toBe('advanced');
    expect(kmpStringMatch.difficulty).toBe('Hard');
    expect(kmpStringMatch.defaultInput).toEqual(DEFAULT_KMP_INPUT);
  });

  it('should generate valid steps and find matches for default input', () => {
    const steps = generateKmpSteps(DEFAULT_KMP_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(1);
    expect(firstStep.explanation.what).toContain('Initialize KMP');

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain('KMP Search complete');
    expect(lastStep.variables.matchesCount).toBe(1);

    // Verify AuxiliaryState has LPS / Prefix table
    const lpsStep = steps.find((s) => s.explanation.what.includes('LPS / Prefix Table complete'));
    expect(lpsStep).toBeDefined();
    expect(lpsStep?.auxiliaryState.hashMap).toBeDefined();
    expect(lpsStep?.auxiliaryState.customState?.lps).toBeDefined();
  });

  it('should handle multiple matches in text', () => {
    const steps = generateKmpSteps({ text: 'AAAAA', pattern: 'AA' });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.matchesCount).toBe(4);
  });

  it('should handle no match scenario', () => {
    const steps = generateKmpSteps({ text: 'ABCDEF', pattern: 'XYZ' });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.matchesCount).toBe(0);
    expect(lastStep.explanation.what).toContain('complete');
  });

  it('should handle edge case with empty text or pattern', () => {
    const steps = generateKmpSteps({ text: '', pattern: 'A' });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.matchesCount).toBe(0);
  });

  it('should produce correct snapshot element values matching text ASCII codes', () => {
    const text = 'TEST';
    const steps = generateKmpSteps({ text, pattern: 'ES' });
    const snapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;
    expect(snapshot.elements.map((el) => el.value)).toEqual([
      'T'.charCodeAt(0),
      'E'.charCodeAt(0),
      'S'.charCodeAt(0),
      'T'.charCodeAt(0),
    ]);
  });
});
