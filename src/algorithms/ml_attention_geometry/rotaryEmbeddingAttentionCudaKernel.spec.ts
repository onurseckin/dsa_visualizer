import { describe, it, expect } from "vitest";
import {
  rotaryEmbeddingAttentionCudaKernel,
  DEFAULT_ROTARYEMBEDDINGATTENTIONCUDAKERNEL_INPUT,
  generateRotaryEmbeddingAttentionCudaKernelSteps,
  ROTARYEMBEDDINGATTENTIONCUDAKERNEL_CODE,
} from "./rotaryEmbeddingAttentionCudaKernel";

describe("rotary-embedding-attention-cuda-kernel (Fused RoPE & Attention CUDA Kernel Simulator)", () => {
  it("should have correct metadata", () => {
    expect(rotaryEmbeddingAttentionCudaKernel.id).toBe("rotary-embedding-attention-cuda-kernel");
    expect(
      rotaryEmbeddingAttentionCudaKernel.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(rotaryEmbeddingAttentionCudaKernel.topicIds).toContain("ml_attention_geometry");
    expect(rotaryEmbeddingAttentionCudaKernel.topicIds).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps with matrix visual snapshots", () => {
    const steps = generateRotaryEmbeddingAttentionCudaKernelSteps(
      DEFAULT_ROTARYEMBEDDINGATTENTIONCUDAKERNEL_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain(
      "Initialize Fused RoPE & Attention CUDA Kernel Simulator",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");

    steps.forEach((step) => {
      expect(step.primarySnapshot.kind).toBe("matrix");
    });
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = ROTARYEMBEDDINGATTENTIONCUDAKERNEL_CODE.trim().split("\n");
    const lineExplanations = rotaryEmbeddingAttentionCudaKernel.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
