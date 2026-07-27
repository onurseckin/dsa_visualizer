import { describe, it, expect } from "vitest";
import {
  naive3LoopMatmul,
  DEFAULT_NAIVE3LOOPMATMUL_INPUT,
  generateNaive3LoopMatmulSteps,
  NAIVE3LOOPMATMUL_CODE,
} from "./naive3LoopMatmul";

describe("naive-3-loop-matmul (Naive Triply-Nested Loop GEMM O(N^3))", () => {
  it("should have correct metadata", () => {
    expect(naive3LoopMatmul.id).toBe("naive-3-loop-matmul");
    expect(naive3LoopMatmul.isMlInfra).toBe(true);
    expect(naive3LoopMatmul.mlInfraLevel).toBe(2);
    expect(naive3LoopMatmul.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(naive3LoopMatmul.categories).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 algorithm steps with matrix snapshots", () => {
    const steps = generateNaive3LoopMatmulSteps(DEFAULT_NAIVE3LOOPMATMUL_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Naive Triply-Nested Loop GEMM");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Execution Complete");
  });

  it("should map every line of code in lineExplanations", () => {
    const codeLines = NAIVE3LOOPMATMUL_CODE.split("\n");
    const lineExplanations = naive3LoopMatmul.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();
    if (!lineExplanations) return;

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(typeof lineExplanations[i]).toBe("string");
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
