import { describe, it, expect } from "vitest";
import { flashAttention2SequenceParallelForward, DEFAULT_FLASHATTENTION2SEQUENCEPARALLELFORWARD_INPUT, generateFlashAttention2SequenceParallelForwardSteps } from "./flashAttention2SequenceParallelForward";

describe("flash-attention-2-sequence-parallel-forward (FlashAttention-2 Outer-KV Loop Sequence Parallel Kernel)", () => {
  it("should have correct metadata", () => {
    expect(flashAttention2SequenceParallelForward.id).toBe("flash-attention-2-sequence-parallel-forward");
    expect(flashAttention2SequenceParallelForward.isMlInfra).toBe(true);
    expect(flashAttention2SequenceParallelForward.mlInfraLevel).toBe(10);
    expect(flashAttention2SequenceParallelForward.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(flashAttention2SequenceParallelForward.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFlashAttention2SequenceParallelForwardSteps(DEFAULT_FLASHATTENTION2SEQUENCEPARALLELFORWARD_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("FlashAttention-2 Outer-KV Loop Sequence Parallel Kernel");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
