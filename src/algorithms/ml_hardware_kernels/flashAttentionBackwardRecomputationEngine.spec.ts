import { describe, it, expect } from "vitest";
import { flashAttentionBackwardRecomputationEngine, DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT, generateFlashAttentionBackwardRecomputationEngineSteps } from "./flashAttentionBackwardRecomputationEngine";

describe("flash-attention-backward-recomputation-engine (FlashAttention Backward Pass Recomputation Engine)", () => {
  it("should have correct metadata", () => {
    expect(flashAttentionBackwardRecomputationEngine.id).toBe("flash-attention-backward-recomputation-engine");
    expect(flashAttentionBackwardRecomputationEngine.isMlInfra).toBe(true);
    expect(flashAttentionBackwardRecomputationEngine.mlInfraLevel).toBe(10);
    expect(flashAttentionBackwardRecomputationEngine.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(flashAttentionBackwardRecomputationEngine.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFlashAttentionBackwardRecomputationEngineSteps(DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("FlashAttention Backward Pass Recomputation Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
