import { describe, it, expect } from "vitest";
import {
  vllmPagedAttentionKernelExecutor,
  DEFAULT_VLLMPAGEDATTENTIONKERNELEXECUTOR_INPUT,
  generateVllmPagedAttentionKernelExecutorSteps,
} from "./vllmPagedAttentionKernelExecutor";

describe("vllm-paged-attention-kernel-executor (vLLM PagedAttention GPU Kernel Execution Simulator)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(vllmPagedAttentionKernelExecutor.id).toBe("vllm-paged-attention-kernel-executor");
    expect(
      vllmPagedAttentionKernelExecutor.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(vllmPagedAttentionKernelExecutor.topicIds).toContain("ml_llm_serving");
    expect(vllmPagedAttentionKernelExecutor.topicIds).toContain("ml_llm_serving");
    expect(vllmPagedAttentionKernelExecutor.defaultInput).toEqual(
      DEFAULT_VLLMPAGEDATTENTIONKERNELEXECUTOR_INPUT,
    );

    const codeLines = vllmPagedAttentionKernelExecutor.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      vllmPagedAttentionKernelExecutor.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(vllmPagedAttentionKernelExecutor.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate valid algorithm steps and produce >= 20 steps", () => {
    const steps = generateVllmPagedAttentionKernelExecutorSteps(
      DEFAULT_VLLMPAGEDATTENTIONKERNELEXECUTOR_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].codeLine).toBe(1);
    expect(steps[steps.length - 1].codeLine).toBe(11);
  });
});
