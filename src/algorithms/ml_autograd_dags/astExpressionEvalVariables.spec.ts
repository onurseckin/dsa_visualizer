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
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("AST Expression Evaluation with Variables");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
