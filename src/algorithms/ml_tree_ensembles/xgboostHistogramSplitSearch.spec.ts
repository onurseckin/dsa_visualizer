import { describe, it, expect } from "vitest";
import { xgboostHistogramSplitSearch } from "./xgboostHistogramSplitSearch";

describe("xgboostHistogramSplitSearch", () => {
  it("should have valid metadata", () => {
    expect(xgboostHistogramSplitSearch.id).toBeDefined();
    expect(xgboostHistogramSplitSearch.title).toBeDefined();
    expect(xgboostHistogramSplitSearch.code).toBeDefined();
    expect(xgboostHistogramSplitSearch.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = xgboostHistogramSplitSearch.generateSteps(
      xgboostHistogramSplitSearch.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
