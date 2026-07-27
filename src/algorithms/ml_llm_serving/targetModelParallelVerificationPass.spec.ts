import { describe, it, expect } from "vitest";
import { targetModelParallelVerificationPass, DEFAULT_TARGETMODELPARALLELVERIFICATIONPASS_INPUT, generateTargetModelParallelVerificationPassSteps } from "./targetModelParallelVerificationPass";

describe("target-model-parallel-verification-pass (Speculative Decoding Target Model Parallel Verification Pass)", () => {
  it("should have correct metadata", () => {
    expect(targetModelParallelVerificationPass.id).toBe("target-model-parallel-verification-pass");
    expect(targetModelParallelVerificationPass.isMlInfra).toBe(true);
    expect(targetModelParallelVerificationPass.mlInfraLevel).toBe(12);
    expect(targetModelParallelVerificationPass.mlInfraCategory).toBe("ml_llm_serving");
    expect(targetModelParallelVerificationPass.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTargetModelParallelVerificationPassSteps(DEFAULT_TARGETMODELPARALLELVERIFICATIONPASS_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Speculative Decoding Target Model Parallel Verification Pass");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
