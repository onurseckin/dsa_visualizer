import { describe, it, expect } from "vitest";
import {
  cudnnImplicitGemmOnTheFlyKernel,
  DEFAULT_CUDNNIMPLICITGEMMONTHEFLYKERNEL_INPUT,
  generateCudnnImplicitGemmOnTheFlyKernelSteps,
} from "./cudnnImplicitGemmOnTheFlyKernel";

describe("cudnnImplicitGemmOnTheFlyKernel (cuDNN Implicit GEMM On-The-Fly Kernel)", () => {
  it("should have correct metadata", () => {
    expect(cudnnImplicitGemmOnTheFlyKernel.id).toBe("cudnnImplicitGemmOnTheFlyKernel");
    expect(cudnnImplicitGemmOnTheFlyKernel.isMlInfra).toBe(true);
    expect(cudnnImplicitGemmOnTheFlyKernel.mlInfraLevel).toBe(8);
    expect(cudnnImplicitGemmOnTheFlyKernel.mlInfraCategory).toBe("ml_convolutions");
    expect(cudnnImplicitGemmOnTheFlyKernel.categories).toContain("ml_convolutions");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateCudnnImplicitGemmOnTheFlyKernelSteps(
      DEFAULT_CUDNNIMPLICITGEMMONTHEFLYKERNEL_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("cuDNN Implicit GEMM On-The-Fly Kernel");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
