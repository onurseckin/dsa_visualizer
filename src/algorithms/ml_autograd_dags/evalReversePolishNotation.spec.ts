import { describe, it, expect } from "vitest";
import { evalReversePolishNotation, DEFAULT_EVALREVERSEPOLISHNOTATION_INPUT, generateEvalReversePolishNotationSteps } from "./evalReversePolishNotation";

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
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Evaluate Reverse Polish Notation");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
