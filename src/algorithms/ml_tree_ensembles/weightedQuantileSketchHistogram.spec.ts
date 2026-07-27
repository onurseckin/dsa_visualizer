import { describe, it, expect } from "vitest";
import { weightedQuantileSketchHistogram, DEFAULT_WEIGHTEDQUANTILESKETCHHISTOGRAM_INPUT, generateWeightedQuantileSketchHistogramSteps } from "./weightedQuantileSketchHistogram";

describe("weighted-quantile-sketch-histogram (Weighted Quantile Sketch Feature Binning)", () => {
  it("should have correct metadata", () => {
    expect(weightedQuantileSketchHistogram.id).toBe("weighted-quantile-sketch-histogram");
    expect(weightedQuantileSketchHistogram.isMlInfra).toBe(true);
    expect(weightedQuantileSketchHistogram.mlInfraLevel).toBe(9);
    expect(weightedQuantileSketchHistogram.mlInfraCategory).toBe("ml_tree_ensembles");
    expect(weightedQuantileSketchHistogram.categories).toContain("ml_tree_ensembles");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateWeightedQuantileSketchHistogramSteps(DEFAULT_WEIGHTEDQUANTILESKETCHHISTOGRAM_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Weighted Quantile Sketch Feature Binning");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
