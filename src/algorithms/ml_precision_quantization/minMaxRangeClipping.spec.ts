import { describe, it, expect } from "vitest";
import {
  minMaxRangeClipping,
  generateMinMaxRangeClippingSteps,
  DEFAULT_MINMAXRANGECLIPPING_INPUT,
} from "./minMaxRangeClipping";

describe("Min Max Range Clipping", () => {
  it("should have correct metadata", () => {
    expect(minMaxRangeClipping.id).toBeDefined();
    expect(minMaxRangeClipping.title).toBe("Min Max Range Clipping");
    expect(minMaxRangeClipping.category).toBe("ml_precision_quantization");
  });

  it("should generate steps successfully", () => {
    const steps = generateMinMaxRangeClippingSteps(DEFAULT_MINMAXRANGECLIPPING_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("array");
    if (steps.length > 0) {
      expect(steps[steps.length - 1].variables).toBeDefined();
    }
  });

  it("should have exactly 3 examples", () => {
    expect(minMaxRangeClipping.examples?.length).toBe(3);
  });
});
