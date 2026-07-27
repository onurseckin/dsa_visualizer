import { describe, it, expect } from "vitest";
import { singleFeatureThresholdSplit } from "./singleFeatureThresholdSplit";

describe("singleFeatureThresholdSplit", () => {
  it("should have valid metadata", () => {
    expect(singleFeatureThresholdSplit.id).toBeDefined();
    expect(singleFeatureThresholdSplit.title).toBeDefined();
    expect(singleFeatureThresholdSplit.code).toBeDefined();
    expect(singleFeatureThresholdSplit.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = singleFeatureThresholdSplit.generateSteps(
      singleFeatureThresholdSplit.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
