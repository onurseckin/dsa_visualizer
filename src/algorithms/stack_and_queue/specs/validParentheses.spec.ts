import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VALID_PARENTHESES_INPUT,
  generateValidParenthesesSteps,
  validParentheses,
} from '../validParentheses';

describe('validParentheses algorithm spec', () => {
  it('should have valid metadata', () => {
    expect(validParentheses.id).toBe('valid-parentheses');
    expect(validParentheses.title).toBe('Valid Parentheses');
    expect(validParentheses.category).toBe('stack_and_queue');
    expect(validParentheses.difficulty).toBe('Easy');
    expect(validParentheses.defaultInput).toEqual(DEFAULT_VALID_PARENTHESES_INPUT);
  });

  it('should validate matching balanced brackets correctly', () => {
    const steps = generateValidParenthesesSteps(DEFAULT_VALID_PARENTHESES_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.primarySnapshot.kind).toBe('array');
    if (firstStep.primarySnapshot.kind === 'array') {
      expect(firstStep.primarySnapshot.elements.length).toBeGreaterThan(0);
    }

    const hasStackState = steps.some(
      (s) => s.auxiliaryState.stack !== undefined && s.auxiliaryState.stack.length > 0
    );
    expect(hasStackState).toBe(true);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(11);
    expect(lastStep.variables.isValid).toBe(true);
    expect(lastStep.variables.remainingStackSize).toBe(0);
  });

  it('should detect mismatch closing bracket', () => {
    const input = { s: '(]' };
    const steps = generateValidParenthesesSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(9);
    expect(lastStep.variables.isValid).toBe(false);
  });

  it('should detect unclosed open bracket at end of string', () => {
    const input = { s: '(((' };
    const steps = generateValidParenthesesSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(11);
    expect(lastStep.variables.isValid).toBe(false);
    expect(lastStep.variables.remainingStackSize).toBe(3);
  });
});

