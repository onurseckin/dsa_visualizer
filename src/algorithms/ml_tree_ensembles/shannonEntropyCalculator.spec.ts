import { describe, it, expect } from "vitest";
import { shannonEntropyCalculator } from "./shannonEntropyCalculator";

describe("shannonEntropyCalculator", () => {
  it("should have valid metadata", () => {
    expect(shannonEntropyCalculator.id).toBeDefined();
    expect(shannonEntropyCalculator.title).toBeDefined();
    expect(shannonEntropyCalculator.code).toBeDefined();
    expect(shannonEntropyCalculator.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = shannonEntropyCalculator.generateSteps(shannonEntropyCalculator.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
