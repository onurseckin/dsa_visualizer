import { describe, it, expect } from "vitest";
import { tritonSramSwizzledGemmKernel, DEFAULT_TRITONSRAMSWIZZLEDGEMMKERNEL_INPUT, generateTritonSramSwizzledGemmKernelSteps } from "./tritonSramSwizzledGemmKernel";

describe("triton-sram-swizzled-gemm-kernel (Triton SRAM Swizzled Block GEMM Kernel)", () => {
  it("should have correct metadata", () => {
    expect(tritonSramSwizzledGemmKernel.id).toBe("triton-sram-swizzled-gemm-kernel");
    expect(tritonSramSwizzledGemmKernel.isMlInfra).toBe(true);
    expect(tritonSramSwizzledGemmKernel.mlInfraLevel).toBe(10);
    expect(tritonSramSwizzledGemmKernel.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(tritonSramSwizzledGemmKernel.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTritonSramSwizzledGemmKernelSteps(DEFAULT_TRITONSRAMSWIZZLEDGEMMKERNEL_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Triton SRAM Swizzled Block GEMM Kernel");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
