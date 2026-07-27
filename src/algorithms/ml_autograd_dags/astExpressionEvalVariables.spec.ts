import { describe, it, expect } from "vitest";
import {
  astExpressionEvalVariables,
  DEFAULT_ASTEXPRESSIONEVALVARIABLES_INPUT,
  generateAstExpressionEvalVariablesSteps,
} from "./astExpressionEvalVariables";

describe("ast-expression-eval-variables (AST Expression Evaluation with Variables)", () => {
  it("should have correct metadata", () => {
    expect(astExpressionEvalVariables.id).toBe("ast-expression-eval-variables");
    expect(astExpressionEvalVariables.isMlInfra).toBe(true);
    expect(astExpressionEvalVariables.mlInfraLevel).toBe(3);
    expect(astExpressionEvalVariables.mlInfraCategory).toBe("ml_autograd_dags");
    expect(astExpressionEvalVariables.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateAstExpressionEvalVariablesSteps(DEFAULT_ASTEXPRESSIONEVALVARIABLES_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("AST Expression Evaluator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = astExpressionEvalVariables.code.trim().split("\n").length;
    expect(astExpressionEvalVariables.trivia).toBeDefined();
    expect(astExpressionEvalVariables.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = astExpressionEvalVariables.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = astExpressionEvalVariables.code.trim().split("\n").length;
    const steps = generateAstExpressionEvalVariablesSteps(DEFAULT_ASTEXPRESSIONEVALVARIABLES_INPUT);
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
