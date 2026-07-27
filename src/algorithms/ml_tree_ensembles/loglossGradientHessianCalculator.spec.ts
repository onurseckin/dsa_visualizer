import { describe, it, expect } from "vitest";
import { loglossGradientHessianCalculator, DEFAULT_LOGLOSSGRADIENTHESSIANCALCULATOR_INPUT, generateLoglossGradientHessianCalculatorSteps } from "./loglossGradientHessianCalculator";

describe("logloss-gradient-hessian-calculator (LogLoss 1st & 2nd Order Gradient Calculator)", () => {
  it("should have correct metadata", () => {
    expect(loglossGradientHessianCalculator.id).toBe("logloss-gradient-hessian-calculator");
    expect(loglossGradientHessianCalculator.isMlInfra).toBe(true);
    expect(loglossGradientHessianCalculator.mlInfraLevel).toBe(9);
    expect(loglossGradientHessianCalculator.mlInfraCategory).toBe("ml_tree_ensembles");
    expect(loglossGradientHessianCalculator.categories).toContain("ml_tree_ensembles");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateLoglossGradientHessianCalculatorSteps(DEFAULT_LOGLOSSGRADIENTHESSIANCALCULATOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("LogLoss 1st & 2nd Order Gradient Calculator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
