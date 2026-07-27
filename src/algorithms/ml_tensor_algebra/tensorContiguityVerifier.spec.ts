import { describe, it, expect } from "vitest";
import {
  tensorContiguityVerifier,
  DEFAULT_TENSORCONTIGUITYVERIFIER_INPUT,
  generateTensorContiguityVerifierSteps,
} from "./tensorContiguityVerifier";

describe("tensor-contiguity-verifier (PyTorch-Style Tensor Contiguity Verifier)", () => {
  it("should have correct metadata", () => {
    expect(tensorContiguityVerifier.id).toBe("tensor-contiguity-verifier");
    expect(tensorContiguityVerifier.isMlInfra).toBe(true);
    expect(tensorContiguityVerifier.mlInfraLevel).toBe(1);
    expect(tensorContiguityVerifier.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(tensorContiguityVerifier.categories).toContain("ml_tensor_algebra");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTensorContiguityVerifierSteps(DEFAULT_TENSORCONTIGUITYVERIFIER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("PyTorch-Style Tensor Contiguity Verifier");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
