import { describe, it, expect } from "vitest";
import { flashAttention1ForwardTiling, DEFAULT_FLASHATTENTION1FORWARDTILING_INPUT, generateFlashAttention1ForwardTilingSteps } from "./flashAttention1ForwardTiling";

describe("flash-attention-1-forward-tiling (FlashAttention-1 SRAM Tiled Forward Kernel)", () => {
  it("should have correct metadata", () => {
    expect(flashAttention1ForwardTiling.id).toBe("flash-attention-1-forward-tiling");
    expect(flashAttention1ForwardTiling.isMlInfra).toBe(true);
    expect(flashAttention1ForwardTiling.mlInfraLevel).toBe(10);
    expect(flashAttention1ForwardTiling.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(flashAttention1ForwardTiling.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFlashAttention1ForwardTilingSteps(DEFAULT_FLASHATTENTION1FORWARDTILING_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("FlashAttention-1 SRAM Tiled Forward Kernel");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
