import { describe, it, expect } from "vitest";
import { varianceReductionSplit, DEFAULT_VARIANCEREDUCTIONSPLIT_INPUT, generateVarianceReductionSplitSteps } from "./varianceReductionSplit";

describe("variance-reduction-split (Regression Variance Reduction Splitter)", () => {
  it("should have correct metadata", () => {
    expect(varianceReductionSplit.id).toBe("variance-reduction-split");
    expect(varianceReductionSplit.isMlInfra).toBe(true);
    expect(varianceReductionSplit.mlInfraLevel).toBe(9);
    expect(varianceReductionSplit.mlInfraCategory).toBe("ml_tree_ensembles");
    expect(varianceReductionSplit.categories).toContain("ml_tree_ensembles");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateVarianceReductionSplitSteps(DEFAULT_VARIANCEREDUCTIONSPLIT_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Regression Variance Reduction Splitter");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
