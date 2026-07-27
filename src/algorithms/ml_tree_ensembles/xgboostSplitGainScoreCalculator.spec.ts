import { describe, it, expect } from "vitest";
import { xgboostSplitGainScoreCalculator } from "./xgboostSplitGainScoreCalculator";

describe("xgboostSplitGainScoreCalculator", () => {
  it("should have valid metadata", () => {
    expect(xgboostSplitGainScoreCalculator.id).toBeDefined();
    expect(xgboostSplitGainScoreCalculator.title).toBeDefined();
    expect(xgboostSplitGainScoreCalculator.code).toBeDefined();
    expect(xgboostSplitGainScoreCalculator.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = xgboostSplitGainScoreCalculator.generateSteps(
      xgboostSplitGainScoreCalculator.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
