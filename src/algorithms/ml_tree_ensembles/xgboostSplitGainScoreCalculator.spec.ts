import { describe, it, expect } from "vitest";
import { xgboostSplitGainScoreCalculator, DEFAULT_XGBOOSTSPLITGAINSCORECALCULATOR_INPUT, generateXgboostSplitGainScoreCalculatorSteps } from "./xgboostSplitGainScoreCalculator";

describe("xgboost-split-gain-score-calculator (XGBoost 2nd-Order Split Gain Score Calculator)", () => {
  it("should have correct metadata", () => {
    expect(xgboostSplitGainScoreCalculator.id).toBe("xgboost-split-gain-score-calculator");
    expect(xgboostSplitGainScoreCalculator.isMlInfra).toBe(true);
    expect(xgboostSplitGainScoreCalculator.mlInfraLevel).toBe(9);
    expect(xgboostSplitGainScoreCalculator.mlInfraCategory).toBe("ml_tree_ensembles");
    expect(xgboostSplitGainScoreCalculator.categories).toContain("ml_tree_ensembles");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateXgboostSplitGainScoreCalculatorSteps(DEFAULT_XGBOOSTSPLITGAINSCORECALCULATOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("XGBoost 2nd-Order Split Gain Score Calculator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
