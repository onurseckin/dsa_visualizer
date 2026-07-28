import { describe, it, expect } from "vitest";
import {
  tritonTensorCoreMmaSwizzle,
  DEFAULT_TRITONTENSORCOREMMASWIZZLE_INPUT,
  generateTritonTensorCoreMmaSwizzleSteps,
  TRITONTENSORCOREMMASWIZZLE_CODE,
} from "./tritonTensorCoreMmaSwizzle";

describe("triton-tensor-core-mma-swizzle (Triton Tensor Core MMA Layout Swizzler)", () => {
  it("should have correct metadata", () => {
    expect(tritonTensorCoreMmaSwizzle.id).toBe("triton-tensor-core-mma-swizzle");
    expect(tritonTensorCoreMmaSwizzle.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(tritonTensorCoreMmaSwizzle.topicIds).toContain("ml_gemm_roofline");
    expect(tritonTensorCoreMmaSwizzle.topicIds).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = generateTritonTensorCoreMmaSwizzleSteps(DEFAULT_TRITONTENSORCOREMMASWIZZLE_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Triton Tensor Core MMA Layout Swizzler");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain(
      "Triton Tensor Core MMA Layout Swizzle Complete",
    );
  });

  it("should map every line of CODE in trivia.lineExplanations", () => {
    const codeLines = TRITONTENSORCOREMMASWIZZLE_CODE.split("\n");
    const totalLines = codeLines.length;

    expect(tritonTensorCoreMmaSwizzle.trivia).toBeDefined();
    if (tritonTensorCoreMmaSwizzle.trivia?.lineExplanations) {
      for (let line = 1; line <= totalLines; line++) {
        expect(tritonTensorCoreMmaSwizzle.trivia.lineExplanations[line]).toBeDefined();
        expect(typeof tritonTensorCoreMmaSwizzle.trivia.lineExplanations[line]).toBe("string");
        expect(tritonTensorCoreMmaSwizzle.trivia.lineExplanations[line].length).toBeGreaterThan(0);
      }
    }
  });

  it("should correctly swizzle pid_1d = 5 into (1, 2) for group_size = 2 and num_pid_n = 4", () => {
    const steps = generateTritonTensorCoreMmaSwizzleSteps(DEFAULT_TRITONTENSORCOREMMASWIZZLE_INPUT);
    const targetStep = steps.find(
      (s) =>
        s.variables.pid_1d === 5 &&
        s.variables.pid_m !== undefined &&
        s.variables.pid_n !== undefined,
    );
    expect(targetStep).toBeDefined();
    expect(targetStep?.variables.pid_m).toBe(1);
    expect(targetStep?.variables.pid_n).toBe(2);
  });
});
