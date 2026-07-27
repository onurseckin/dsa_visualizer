import { describe, it, expect } from "vitest";
import {
  col2imGradAccumulator,
  DEFAULT_COL2IMGRADACCUMULATOR_INPUT,
  generateCol2imGradAccumulatorSteps,
} from "./col2imGradAccumulator";

describe("col2imGradAccumulator (col2im Gradient Accumulator)", () => {
  it("should have correct metadata", () => {
    expect(col2imGradAccumulator.id).toBe("col2imGradAccumulator");
    expect(col2imGradAccumulator.isMlInfra).toBe(true);
    expect(col2imGradAccumulator.mlInfraLevel).toBe(8);
    expect(col2imGradAccumulator.mlInfraCategory).toBe("ml_convolutions");
    expect(col2imGradAccumulator.categories).toContain("ml_convolutions");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateCol2imGradAccumulatorSteps(DEFAULT_COL2IMGRADACCUMULATOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("col2im Gradient Accumulator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
