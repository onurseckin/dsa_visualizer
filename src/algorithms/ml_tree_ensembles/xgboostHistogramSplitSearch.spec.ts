import { describe, it, expect } from "vitest";
import { xgboostHistogramSplitSearch, DEFAULT_XGBOOSTHISTOGRAMSPLITSEARCH_INPUT, generateXgboostHistogramSplitSearchSteps } from "./xgboostHistogramSplitSearch";

describe("xgboost-histogram-split-search (XGBoost Histogram-Based Fast Split Search O(n d))", () => {
  it("should have correct metadata", () => {
    expect(xgboostHistogramSplitSearch.id).toBe("xgboost-histogram-split-search");
    expect(xgboostHistogramSplitSearch.isMlInfra).toBe(true);
    expect(xgboostHistogramSplitSearch.mlInfraLevel).toBe(9);
    expect(xgboostHistogramSplitSearch.mlInfraCategory).toBe("ml_tree_ensembles");
    expect(xgboostHistogramSplitSearch.categories).toContain("ml_tree_ensembles");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateXgboostHistogramSplitSearchSteps(DEFAULT_XGBOOSTHISTOGRAMSPLITSEARCH_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("XGBoost Histogram-Based Fast Split Search O(n d)");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
