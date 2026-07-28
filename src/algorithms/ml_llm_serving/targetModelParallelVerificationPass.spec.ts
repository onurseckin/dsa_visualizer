import { describe, it, expect } from "vitest";
import {
  targetModelParallelVerificationPass,
  DEFAULT_TARGETMODELPARALLELVERIFICATIONPASS_INPUT,
  generateTargetModelParallelVerificationPassSteps,
} from "./targetModelParallelVerificationPass";

describe("target-model-parallel-verification-pass (Speculative Decoding Target Model Parallel Verification Pass)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(targetModelParallelVerificationPass.id).toBe("target-model-parallel-verification-pass");
    expect(
      targetModelParallelVerificationPass.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(targetModelParallelVerificationPass.topicIds).toContain("ml_llm_serving");
    expect(targetModelParallelVerificationPass.topicIds).toContain("ml_llm_serving");
    expect(targetModelParallelVerificationPass.defaultInput).toEqual(
      DEFAULT_TARGETMODELPARALLELVERIFICATIONPASS_INPUT,
    );

    const codeLines = targetModelParallelVerificationPass.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      targetModelParallelVerificationPass.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(targetModelParallelVerificationPass.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate valid algorithm steps and produce >= 20 steps", () => {
    const steps = generateTargetModelParallelVerificationPassSteps(
      DEFAULT_TARGETMODELPARALLELVERIFICATIONPASS_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].codeLine).toBe(1);
    expect(steps[steps.length - 1].codeLine).toBe(12);
  });
});
