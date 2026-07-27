import { describe, it, expect } from "vitest";
import { regularizedOptimalLeafWeight, DEFAULT_REGULARIZEDOPTIMALLEAFWEIGHT_INPUT, generateRegularizedOptimalLeafWeightSteps } from "./regularizedOptimalLeafWeight";

describe("regularized-optimal-leaf-weight (XGBoost Regularized Optimal Leaf Weight)", () => {
  it("should have correct metadata", () => {
    expect(regularizedOptimalLeafWeight.id).toBe("regularized-optimal-leaf-weight");
    expect(regularizedOptimalLeafWeight.isMlInfra).toBe(true);
    expect(regularizedOptimalLeafWeight.mlInfraLevel).toBe(9);
    expect(regularizedOptimalLeafWeight.mlInfraCategory).toBe("ml_tree_ensembles");
    expect(regularizedOptimalLeafWeight.categories).toContain("ml_tree_ensembles");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateRegularizedOptimalLeafWeightSteps(DEFAULT_REGULARIZEDOPTIMALLEAFWEIGHT_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("XGBoost Regularized Optimal Leaf Weight");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
