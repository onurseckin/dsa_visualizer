import { describe, it, expect } from "vitest";
import { fusedFfnGemmOnlineSoftmax, DEFAULT_FUSEDFFNGEMMONLINESOFTMAX_INPUT, generateFusedFfnGemmOnlineSoftmaxSteps } from "./fusedFfnGemmOnlineSoftmax";

describe("fused-ffn-gemm-online-softmax (Fused FFN GEMM & Online Softmax Kernel)", () => {
  it("should have correct metadata", () => {
    expect(fusedFfnGemmOnlineSoftmax.id).toBe("fused-ffn-gemm-online-softmax");
    expect(fusedFfnGemmOnlineSoftmax.isMlInfra).toBe(true);
    expect(fusedFfnGemmOnlineSoftmax.mlInfraLevel).toBe(2);
    expect(fusedFfnGemmOnlineSoftmax.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(fusedFfnGemmOnlineSoftmax.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFusedFfnGemmOnlineSoftmaxSteps(DEFAULT_FUSEDFFNGEMMONLINESOFTMAX_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Fused FFN GEMM & Online Softmax Kernel");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
