import { describe, it, expect } from "vitest";
import {
  evalReversePolishNotation,
  DEFAULT_EVALREVERSEPOLISHNOTATION_INPUT,
  generateEvalReversePolishNotationSteps,
} from "./evalReversePolishNotation";

describe("eval-reverse-polish-notation (Evaluate Reverse Polish Notation)", () => {
  it("should have correct metadata", () => {
    expect(evalReversePolishNotation.id).toBe("eval-reverse-polish-notation");
    expect(evalReversePolishNotation.isMlInfra).toBe(true);
    expect(evalReversePolishNotation.mlInfraLevel).toBe(3);
    expect(evalReversePolishNotation.mlInfraCategory).toBe("ml_autograd_dags");
    expect(evalReversePolishNotation.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateEvalReversePolishNotationSteps(DEFAULT_EVALREVERSEPOLISHNOTATION_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Reverse Polish Notation");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = evalReversePolishNotation.code.trim().split("\n").length;
    expect(evalReversePolishNotation.trivia).toBeDefined();
    expect(evalReversePolishNotation.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = evalReversePolishNotation.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = evalReversePolishNotation.code.trim().split("\n").length;
    const steps = generateEvalReversePolishNotationSteps(DEFAULT_EVALREVERSEPOLISHNOTATION_INPUT);
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
