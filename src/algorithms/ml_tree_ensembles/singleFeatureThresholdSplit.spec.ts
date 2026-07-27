import { describe, it, expect } from "vitest";
import { singleFeatureThresholdSplit, DEFAULT_SINGLEFEATURETHRESHOLDSPLIT_INPUT, generateSingleFeatureThresholdSplitSteps } from "./singleFeatureThresholdSplit";

describe("single-feature-threshold-split (Single Feature Continuous Threshold Partition)", () => {
  it("should have correct metadata", () => {
    expect(singleFeatureThresholdSplit.id).toBe("single-feature-threshold-split");
    expect(singleFeatureThresholdSplit.isMlInfra).toBe(true);
    expect(singleFeatureThresholdSplit.mlInfraLevel).toBe(9);
    expect(singleFeatureThresholdSplit.mlInfraCategory).toBe("ml_tree_ensembles");
    expect(singleFeatureThresholdSplit.categories).toContain("ml_tree_ensembles");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateSingleFeatureThresholdSplitSteps(DEFAULT_SINGLEFEATURETHRESHOLDSPLIT_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Single Feature Continuous Threshold Partition");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
