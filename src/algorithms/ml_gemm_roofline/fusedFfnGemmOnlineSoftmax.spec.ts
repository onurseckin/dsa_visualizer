import { describe, it, expect } from "vitest";
import {
  fusedFfnGemmOnlineSoftmax,
  DEFAULT_FUSEDFFNGEMMONLINESOFTMAX_INPUT,
  generateFusedFfnGemmOnlineSoftmaxSteps,
  FUSEDFFNGEMMONLINESOFTMAX_CODE,
} from "./fusedFfnGemmOnlineSoftmax";
import { requireLineExplanations } from "../specs/assertions";

describe("fused-ffn-gemm-online-softmax (Fused FFN GEMM & Online Softmax Kernel)", () => {
  it("should have correct metadata", () => {
    expect(fusedFfnGemmOnlineSoftmax.id).toBe("fused-ffn-gemm-online-softmax");
    expect(fusedFfnGemmOnlineSoftmax.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(fusedFfnGemmOnlineSoftmax.topicIds).toContain("ml_gemm_roofline");
    expect(fusedFfnGemmOnlineSoftmax.topicIds).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 algorithm steps with matrix snapshots", () => {
    const steps = generateFusedFfnGemmOnlineSoftmaxSteps(DEFAULT_FUSEDFFNGEMMONLINESOFTMAX_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Fused FFN GEMM & Online Softmax Kernel");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toBe(
      "Execution Complete: Return Softmax Output",
    );
  });

  it("should map every line of code in lineExplanations", () => {
    const codeLines = FUSEDFFNGEMMONLINESOFTMAX_CODE.split("\n");
    const explanations = requireLineExplanations(fusedFfnGemmOnlineSoftmax);

    for (let i = 1; i <= codeLines.length; i++) {
      expect(explanations[i]).toBeDefined();
      expect(typeof explanations[i]).toBe("string");
      expect(explanations[i].length).toBeGreaterThan(0);
    }
  });
});
