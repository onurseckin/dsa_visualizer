import { describe, it, expect } from "vitest";
import { tritonFusedAddSoftmaxDropoutKernel, DEFAULT_TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_INPUT, generateTritonFusedAddSoftmaxDropoutKernelSteps } from "./tritonFusedAddSoftmaxDropoutKernel";

describe("triton-fused-add-softmax-dropout-kernel (Triton Fused Add + Softmax + Dropout Kernel)", () => {
  it("should have correct metadata", () => {
    expect(tritonFusedAddSoftmaxDropoutKernel.id).toBe("triton-fused-add-softmax-dropout-kernel");
    expect(tritonFusedAddSoftmaxDropoutKernel.isMlInfra).toBe(true);
    expect(tritonFusedAddSoftmaxDropoutKernel.mlInfraLevel).toBe(10);
    expect(tritonFusedAddSoftmaxDropoutKernel.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(tritonFusedAddSoftmaxDropoutKernel.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTritonFusedAddSoftmaxDropoutKernelSteps(DEFAULT_TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Triton Fused Add + Softmax + Dropout Kernel");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
