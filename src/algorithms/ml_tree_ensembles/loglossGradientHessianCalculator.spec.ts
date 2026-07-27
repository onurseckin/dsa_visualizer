import { describe, it, expect } from "vitest";
import { loglossGradientHessianCalculator } from "./loglossGradientHessianCalculator";

describe("loglossGradientHessianCalculator", () => {
  it("should have valid metadata", () => {
    expect(loglossGradientHessianCalculator.id).toBeDefined();
    expect(loglossGradientHessianCalculator.title).toBeDefined();
    expect(loglossGradientHessianCalculator.code).toBeDefined();
    expect(loglossGradientHessianCalculator.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = loglossGradientHessianCalculator.generateSteps(
      loglossGradientHessianCalculator.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
