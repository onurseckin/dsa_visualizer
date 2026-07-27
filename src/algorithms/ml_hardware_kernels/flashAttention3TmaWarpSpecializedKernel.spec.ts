import { describe, it, expect } from "vitest";
import { flashAttention3TmaWarpSpecializedKernel, DEFAULT_FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_INPUT, generateFlashAttention3TmaWarpSpecializedKernelSteps } from "./flashAttention3TmaWarpSpecializedKernel";

describe("flash-attention-3-tma-warp-specialized-kernel (FlashAttention-3 Hopper TMA & Warp-Specialized Kernel)", () => {
  it("should have correct metadata", () => {
    expect(flashAttention3TmaWarpSpecializedKernel.id).toBe("flash-attention-3-tma-warp-specialized-kernel");
    expect(flashAttention3TmaWarpSpecializedKernel.isMlInfra).toBe(true);
    expect(flashAttention3TmaWarpSpecializedKernel.mlInfraLevel).toBe(10);
    expect(flashAttention3TmaWarpSpecializedKernel.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(flashAttention3TmaWarpSpecializedKernel.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFlashAttention3TmaWarpSpecializedKernelSteps(DEFAULT_FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("FlashAttention-3 Hopper TMA & Warp-Specialized Kernel");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
