import { describe, it, expect } from "vitest";
import {
  virtualMatrixAdditionZeroStride,
  DEFAULT_VIRTUALMATRIXADDITIONZEROSTRIDE_INPUT,
  generateVirtualMatrixAdditionZeroStrideSteps,
} from "./virtualMatrixAdditionZeroStride";

describe("virtual-matrix-addition-zero-stride (Zero-Stride Broadcasting Matrix Addition)", () => {
  it("should have correct metadata", () => {
    expect(virtualMatrixAdditionZeroStride.id).toBe("virtual-matrix-addition-zero-stride");
    expect(virtualMatrixAdditionZeroStride.isMlInfra).toBe(true);
    expect(virtualMatrixAdditionZeroStride.mlInfraLevel).toBe(1);
    expect(virtualMatrixAdditionZeroStride.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(virtualMatrixAdditionZeroStride.categories).toContain("ml_tensor_algebra");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateVirtualMatrixAdditionZeroStrideSteps(
      DEFAULT_VIRTUALMATRIXADDITIONZEROSTRIDE_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Zero-Stride Broadcasting Matrix Addition");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
