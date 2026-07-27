import { describe, it, expect } from "vitest";
import {
  asStridedZeroCopyIm2colView,
  DEFAULT_ASSTRIDEDZEROCOPYIM2COLVIEW_INPUT,
  generateAsStridedZeroCopyIm2colViewSteps,
} from "./asStridedZeroCopyIm2colView";

describe("asStridedZeroCopyIm2colView (Zero-Copy `as_strided` im2col View Engine)", () => {
  it("should have correct metadata", () => {
    expect(asStridedZeroCopyIm2colView.id).toBe("asStridedZeroCopyIm2colView");
    expect(asStridedZeroCopyIm2colView.isMlInfra).toBe(true);
    expect(asStridedZeroCopyIm2colView.mlInfraLevel).toBe(8);
    expect(asStridedZeroCopyIm2colView.mlInfraCategory).toBe("ml_convolutions");
    expect(asStridedZeroCopyIm2colView.categories).toContain("ml_convolutions");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateAsStridedZeroCopyIm2colViewSteps(
      DEFAULT_ASSTRIDEDZEROCOPYIM2COLVIEW_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Zero-Copy `as_strided` im2col View Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
