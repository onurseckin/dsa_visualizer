import { describe, it, expect } from "vitest";
import { weightedQuantileSketchHistogram } from "./weightedQuantileSketchHistogram";

describe("weightedQuantileSketchHistogram", () => {
  it("should have valid metadata", () => {
    expect(weightedQuantileSketchHistogram.id).toBeDefined();
    expect(weightedQuantileSketchHistogram.title).toBeDefined();
    expect(weightedQuantileSketchHistogram.code).toBeDefined();
    expect(weightedQuantileSketchHistogram.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = weightedQuantileSketchHistogram.generateSteps(
      weightedQuantileSketchHistogram.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
