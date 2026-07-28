import { describe, it, expect } from "vitest";
import { weightedQuantileSketchHistogram } from "./weightedQuantileSketchHistogram";

describe("weighted-quantile-sketch-histogram", () => {
  it("should have valid metadata", () => {
    expect(weightedQuantileSketchHistogram.id).toBeDefined();
    expect(weightedQuantileSketchHistogram.title).toBeDefined();
    expect(weightedQuantileSketchHistogram.code).toBeDefined();
    expect(weightedQuantileSketchHistogram.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps matching code line bounds", () => {
    const codeLines = weightedQuantileSketchHistogram.code.split("\n").length;
    const steps = weightedQuantileSketchHistogram.generateSteps(
      weightedQuantileSketchHistogram.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);

    for (const step of steps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines);
      expect(step.primarySnapshot.kind).toBe("array");
      expect(step.explanation.what).toBeTruthy();
      expect(step.explanation.why).toBeTruthy();
    }
  });

  it("should handle edge case input cleanly without runtime errors", () => {
    const invalidInputSteps = weightedQuantileSketchHistogram.generateSteps({
      featureValues: [],
      weights: [],
      eps: 0.25,
    });
    expect(invalidInputSteps.length).toBeGreaterThan(0);
    expect(invalidInputSteps[invalidInputSteps.length - 1].variables.return).toEqual([]);

    const zeroWeightSteps = weightedQuantileSketchHistogram.generateSteps({
      featureValues: [1.0, 2.0],
      weights: [0.0, 0.0],
      eps: 0.25,
    });
    expect(zeroWeightSteps.length).toBeGreaterThan(0);
  });
});
