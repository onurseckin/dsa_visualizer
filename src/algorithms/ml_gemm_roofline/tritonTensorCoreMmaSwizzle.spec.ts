import { describe, it, expect } from "vitest";
import { tritonTensorCoreMmaSwizzle, DEFAULT_TRITONTENSORCOREMMASWIZZLE_INPUT, generateTritonTensorCoreMmaSwizzleSteps } from "./tritonTensorCoreMmaSwizzle";

describe("triton-tensor-core-mma-swizzle (Triton Tensor Core MMA Layout Swizzler)", () => {
  it("should have correct metadata", () => {
    expect(tritonTensorCoreMmaSwizzle.id).toBe("triton-tensor-core-mma-swizzle");
    expect(tritonTensorCoreMmaSwizzle.isMlInfra).toBe(true);
    expect(tritonTensorCoreMmaSwizzle.mlInfraLevel).toBe(2);
    expect(tritonTensorCoreMmaSwizzle.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(tritonTensorCoreMmaSwizzle.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTritonTensorCoreMmaSwizzleSteps(DEFAULT_TRITONTENSORCOREMMASWIZZLE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Triton Tensor Core MMA Layout Swizzler");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
