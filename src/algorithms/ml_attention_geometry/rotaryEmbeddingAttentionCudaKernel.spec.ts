import { describe, it, expect } from "vitest";
import {
  rotaryEmbeddingAttentionCudaKernel,
  DEFAULT_ROTARYEMBEDDINGATTENTIONCUDAKERNEL_INPUT,
  generateRotaryEmbeddingAttentionCudaKernelSteps,
} from "./rotaryEmbeddingAttentionCudaKernel";

describe("rotary-embedding-attention-cuda-kernel (Fused RoPE & Attention CUDA Kernel Simulator)", () => {
  it("should have correct metadata", () => {
    expect(rotaryEmbeddingAttentionCudaKernel.id).toBe("rotary-embedding-attention-cuda-kernel");
    expect(rotaryEmbeddingAttentionCudaKernel.isMlInfra).toBe(true);
    expect(rotaryEmbeddingAttentionCudaKernel.mlInfraLevel).toBe(7);
    expect(rotaryEmbeddingAttentionCudaKernel.mlInfraCategory).toBe("ml_attention_geometry");
    expect(rotaryEmbeddingAttentionCudaKernel.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateRotaryEmbeddingAttentionCudaKernelSteps(
      DEFAULT_ROTARYEMBEDDINGATTENTIONCUDAKERNEL_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Fused RoPE & Attention CUDA Kernel Simulator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
