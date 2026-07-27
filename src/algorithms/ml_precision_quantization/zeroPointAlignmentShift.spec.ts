import { describe, it, expect } from "vitest";
import {
  zeroPointAlignmentShift,
  generateZeroPointAlignmentShiftSteps,
  DEFAULT_ZEROPOINTALIGNMENTSHIFT_INPUT,
} from "./zeroPointAlignmentShift";

describe("Zero Point Alignment Shift", () => {
  it("should have correct metadata", () => {
    expect(zeroPointAlignmentShift.id).toBeDefined();
    expect(zeroPointAlignmentShift.title).toBe("Zero Point Alignment Shift");
    expect(zeroPointAlignmentShift.category).toBe("ml_precision_quantization");
  });

  it("should generate steps successfully", () => {
    const steps = generateZeroPointAlignmentShiftSteps(DEFAULT_ZEROPOINTALIGNMENTSHIFT_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("array");
    if (steps.length > 0) {
      expect(steps[steps.length - 1].variables).toBeDefined();
    }
  });

  it("should have exactly 3 examples", () => {
    expect(zeroPointAlignmentShift.examples?.length).toBe(3);
  });
});
