import { describe, it, expect } from "vitest";
import { vllmPagedAttentionKernelExecutor, DEFAULT_VLLMPAGEDATTENTIONKERNELEXECUTOR_INPUT, generateVllmPagedAttentionKernelExecutorSteps } from "./vllmPagedAttentionKernelExecutor";

describe("vllm-paged-attention-kernel-executor (vLLM PagedAttention GPU Kernel Execution Simulator)", () => {
  it("should have correct metadata", () => {
    expect(vllmPagedAttentionKernelExecutor.id).toBe("vllm-paged-attention-kernel-executor");
    expect(vllmPagedAttentionKernelExecutor.isMlInfra).toBe(true);
    expect(vllmPagedAttentionKernelExecutor.mlInfraLevel).toBe(12);
    expect(vllmPagedAttentionKernelExecutor.mlInfraCategory).toBe("ml_llm_serving");
    expect(vllmPagedAttentionKernelExecutor.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateVllmPagedAttentionKernelExecutorSteps(DEFAULT_VLLMPAGEDATTENTIONKERNELEXECUTOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("vLLM PagedAttention GPU Kernel Execution Simulator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
