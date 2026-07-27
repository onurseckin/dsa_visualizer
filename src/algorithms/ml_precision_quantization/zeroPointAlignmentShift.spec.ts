import { describe, it, expect } from "vitest";
import { zeroPointAlignmentShift, DEFAULT_ZEROPOINTALIGNMENTSHIFT_INPUT, generateZeroPointAlignmentShiftSteps } from "./zeroPointAlignmentShift";

describe("zero-point-alignment-shift (Asymmetric Quantization Zero-Point Alignment)", () => {
  it("should have correct metadata", () => {
    expect(zeroPointAlignmentShift.id).toBe("zero-point-alignment-shift");
    expect(zeroPointAlignmentShift.isMlInfra).toBe(true);
    expect(zeroPointAlignmentShift.mlInfraLevel).toBe(4);
    expect(zeroPointAlignmentShift.mlInfraCategory).toBe("ml_precision_quantization");
    expect(zeroPointAlignmentShift.categories).toContain("ml_precision_quantization");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateZeroPointAlignmentShiftSteps(DEFAULT_ZEROPOINTALIGNMENTSHIFT_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Asymmetric Quantization Zero-Point Alignment");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
