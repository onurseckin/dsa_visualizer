import { describe, it, expect } from "vitest";
import { xgboostHistogramSplitSearch } from "./xgboostHistogramSplitSearch";

describe("xgboost-histogram-split-search", () => {
  it("should have valid metadata and comment-free python code", () => {
    expect(xgboostHistogramSplitSearch.id).toBe("xgboost-histogram-split-search");
    expect(xgboostHistogramSplitSearch.title).toBe("XGBoost Histogram-Based Split Search");
    expect(xgboostHistogramSplitSearch.code).toBeDefined();
    expect(xgboostHistogramSplitSearch.code).not.toContain("#");
    expect(xgboostHistogramSplitSearch.code).not.toContain('"""');
    expect(xgboostHistogramSplitSearch.code).not.toContain("'''");
    expect(xgboostHistogramSplitSearch.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps matching code line bounds and array visualization", () => {
    const steps = xgboostHistogramSplitSearch.generateSteps(
      xgboostHistogramSplitSearch.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);

    const codeLines = xgboostHistogramSplitSearch.code.split("\n").length;

    for (const step of steps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines);
      expect(step.explanation.what).toBeTruthy();
      expect(step.explanation.why).toBeTruthy();
      expect(step.primarySnapshot.kind).toBe("array");
    }

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.best_threshold).toBe(3.0);
    expect(lastStep.variables.best_bin).toBe(1);
    expect(lastStep.variables.best_gain).toBe(0.8808);
  });
});
