import { describe, it, expect } from "vitest";
import {
  tensorContiguityVerifier,
  DEFAULT_TENSORCONTIGUITYVERIFIER_INPUT,
  generateTensorContiguityVerifierSteps,
  TENSORCONTIGUITYVERIFIER_CODE,
} from "./tensorContiguityVerifier";

describe("tensor-contiguity-verifier (PyTorch-Style Tensor Contiguity Verifier)", () => {
  it("should have correct metadata", () => {
    expect(tensorContiguityVerifier.id).toBe("tensor-contiguity-verifier");
    expect(tensorContiguityVerifier.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(tensorContiguityVerifier.topicIds).toContain("ml_tensor_algebra");
    expect(tensorContiguityVerifier.topicIds).toContain("ml_tensor_algebra");
  });

  it("should generate at least 20 steps with matrix primarySnapshot for default input", () => {
    const steps = generateTensorContiguityVerifierSteps(DEFAULT_TENSORCONTIGUITYVERIFIER_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("tensor_contiguity_verifier");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Return");
  });

  it("should map every line of code in lineExplanations", () => {
    const codeLines = TENSORCONTIGUITYVERIFIER_CODE.trim().split("\n");
    const totalLines = codeLines.length;
    expect(totalLines).toBe(13);

    const lineExplanations = tensorContiguityVerifier.trivia?.lineExplanations || {};
    for (let lineNum = 1; lineNum <= totalLines; lineNum++) {
      expect(lineExplanations[lineNum]).toBeDefined();
      expect(typeof lineExplanations[lineNum]).toBe("string");
      expect(lineExplanations[lineNum].length).toBeGreaterThan(0);
    }
  });
});
