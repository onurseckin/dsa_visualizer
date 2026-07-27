import { describe, it, expect } from "vitest";
import {
  twoElementMaxSubtractionShift,
  generateTwoElementMaxSubtractionShiftSteps,
  DEFAULT_TWOELEMENTMAXSUBTRACTIONSHIFT_INPUT,
} from "./twoElementMaxSubtractionShift";

describe("Two Element Max Subtraction Shift", () => {
  it("should have correct metadata", () => {
    expect(twoElementMaxSubtractionShift.id).toBeDefined();
    expect(twoElementMaxSubtractionShift.title).toBe("Two Element Max Subtraction Shift");
    expect(twoElementMaxSubtractionShift.category).toBe("ml_precision_quantization");
  });

  it("should generate steps successfully", () => {
    const steps = generateTwoElementMaxSubtractionShiftSteps(
      DEFAULT_TWOELEMENTMAXSUBTRACTIONSHIFT_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("array");
    if (steps.length > 0) {
      expect(steps[steps.length - 1].variables).toBeDefined();
    }
  });

  it("should have exactly 3 examples", () => {
    expect(twoElementMaxSubtractionShift.examples?.length).toBe(3);
  });
});
