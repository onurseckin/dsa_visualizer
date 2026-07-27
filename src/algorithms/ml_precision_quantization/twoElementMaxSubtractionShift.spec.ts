import { describe, it, expect } from "vitest";
import { twoElementMaxSubtractionShift, DEFAULT_TWOELEMENTMAXSUBTRACTIONSHIFT_INPUT, generateTwoElementMaxSubtractionShiftSteps } from "./twoElementMaxSubtractionShift";

describe("two-element-max-subtraction-shift (Shift-Invariant Log-Sum-Exp Normalization)", () => {
  it("should have correct metadata", () => {
    expect(twoElementMaxSubtractionShift.id).toBe("two-element-max-subtraction-shift");
    expect(twoElementMaxSubtractionShift.isMlInfra).toBe(true);
    expect(twoElementMaxSubtractionShift.mlInfraLevel).toBe(4);
    expect(twoElementMaxSubtractionShift.mlInfraCategory).toBe("ml_precision_quantization");
    expect(twoElementMaxSubtractionShift.categories).toContain("ml_precision_quantization");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTwoElementMaxSubtractionShiftSteps(DEFAULT_TWOELEMENTMAXSUBTRACTIONSHIFT_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Shift-Invariant Log-Sum-Exp Normalization");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
