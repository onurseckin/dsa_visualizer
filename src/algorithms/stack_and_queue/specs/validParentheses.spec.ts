import { describe, expect, it } from "vitest";
import {
  DEFAULT_VALID_PARENTHESES_INPUT,
  generateValidParenthesesSteps,
  validParentheses,
} from "../validParentheses";

describe("validParentheses algorithm spec", () => {
  it("should have valid metadata", () => {
    expect(validParentheses.id).toBe("valid-parentheses");
    expect(validParentheses.title).toBe("Valid Parentheses");
    expect(validParentheses.topicIds).toContain("stack_and_queue");
    expect(validParentheses.difficulty).toBe("Easy");
    expect(validParentheses.defaultInput).toEqual(DEFAULT_VALID_PARENTHESES_INPUT);
  });

  it("should produce >= 20 steps for default input", () => {
    const steps = generateValidParenthesesSteps(DEFAULT_VALID_PARENTHESES_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.primarySnapshot.kind).toBe("array");
    if (firstStep.primarySnapshot.kind === "array") {
      expect(firstStep.primarySnapshot.elements.length).toBeGreaterThan(0);
    }

    const hasStackState = steps.some(
      (s) => s.auxiliaryState.stack !== undefined && s.auxiliaryState.stack.length > 0,
    );
    expect(hasStackState).toBe(true);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(11);
    expect(lastStep.variables.isValid).toBe(true);
    expect(lastStep.variables.remainingStackSize).toBe(0);
  });

  it("should map every non-blank code line in lineExplanations", () => {
    const codeLines = validParentheses.code.split("\n");
    const lineExplanations = validParentheses.trivia?.lineExplanations || {};
    const skipLines = validParentheses.trivia?.skipLines || [];

    codeLines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const isBlank = lineText.trim() === "";
      if (!isBlank && !skipLines.includes(lineNum)) {
        expect(lineExplanations[lineNum]).toBeDefined();
        expect(lineExplanations[lineNum].length).toBeGreaterThan(10);
      }
    });
  });

  it("should detect mismatch closing bracket", () => {
    const input = { s: "(]" };
    const steps = generateValidParenthesesSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(9);
    expect(lastStep.variables.isValid).toBe(false);
  });

  it("should detect unclosed open bracket at end of string", () => {
    const input = { s: "(((" };
    const steps = generateValidParenthesesSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(11);
    expect(lastStep.variables.isValid).toBe(false);
    expect(lastStep.variables.remainingStackSize).toBe(3);
  });

  it("should handle closer arriving when stack is empty", () => {
    const input = { s: ")" };
    const steps = generateValidParenthesesSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(9);
    expect(lastStep.variables.isValid).toBe(false);
  });

  it("should handle unexpected character with empty expectedOpen mapping", () => {
    const input = { s: "X" };
    const steps = generateValidParenthesesSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(9);
    expect(lastStep.variables.isValid).toBe(false);
  });
});
