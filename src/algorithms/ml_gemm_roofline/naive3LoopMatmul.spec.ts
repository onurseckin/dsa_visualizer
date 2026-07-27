import { describe, it, expect } from "vitest";
import { naive3LoopMatmul, DEFAULT_NAIVE3LOOPMATMUL_INPUT, generateNaive3LoopMatmulSteps } from "./naive3LoopMatmul";

describe("naive-3-loop-matmul (Naive Triply-Nested Loop GEMM O(N^3))", () => {
  it("should have correct metadata", () => {
    expect(naive3LoopMatmul.id).toBe("naive-3-loop-matmul");
    expect(naive3LoopMatmul.isMlInfra).toBe(true);
    expect(naive3LoopMatmul.mlInfraLevel).toBe(2);
    expect(naive3LoopMatmul.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(naive3LoopMatmul.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateNaive3LoopMatmulSteps(DEFAULT_NAIVE3LOOPMATMUL_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Naive Triply-Nested Loop GEMM O(N^3)");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
