import { describe, it, expect } from "vitest";
import { minMaxRangeClipping, DEFAULT_MINMAXRANGECLIPPING_INPUT, generateMinMaxRangeClippingSteps } from "./minMaxRangeClipping";

describe("min-max-range-clipping (Min-Max Saturated Value Clipping)", () => {
  it("should have correct metadata", () => {
    expect(minMaxRangeClipping.id).toBe("min-max-range-clipping");
    expect(minMaxRangeClipping.isMlInfra).toBe(true);
    expect(minMaxRangeClipping.mlInfraLevel).toBe(4);
    expect(minMaxRangeClipping.mlInfraCategory).toBe("ml_precision_quantization");
    expect(minMaxRangeClipping.categories).toContain("ml_precision_quantization");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateMinMaxRangeClippingSteps(DEFAULT_MINMAXRANGECLIPPING_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Min-Max Saturated Value Clipping");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
