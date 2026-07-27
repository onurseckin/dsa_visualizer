import { describe, it, expect } from "vitest";
import {
  zeroCopyIm2colStrideUnroller,
  DEFAULT_ZEROCOPYIM2COLSTRIDEUNROLLER_INPUT,
  generateZeroCopyIm2colStrideUnrollerSteps,
} from "./zeroCopyIm2colStrideUnroller";

describe("zero-copy-im2col-stride-unroller (Zero-Copy im2col Stride Receptive Field Unroller)", () => {
  it("should have correct metadata", () => {
    expect(zeroCopyIm2colStrideUnroller.id).toBe("zero-copy-im2col-stride-unroller");
    expect(zeroCopyIm2colStrideUnroller.isMlInfra).toBe(true);
    expect(zeroCopyIm2colStrideUnroller.mlInfraLevel).toBe(1);
    expect(zeroCopyIm2colStrideUnroller.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(zeroCopyIm2colStrideUnroller.categories).toContain("ml_tensor_algebra");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateZeroCopyIm2colStrideUnrollerSteps(
      DEFAULT_ZEROCOPYIM2COLSTRIDEUNROLLER_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Zero-Copy im2col Stride Receptive Field Unroller");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
