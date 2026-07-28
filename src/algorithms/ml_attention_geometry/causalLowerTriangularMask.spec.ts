import { describe, it, expect } from "vitest";
import {
  causalLowerTriangularMask,
  DEFAULT_CAUSALLOWERTRIANGULARMASK_INPUT,
  generateCausalLowerTriangularMaskSteps,
  CAUSALLOWERTRIANGULARMASK_CODE,
} from "./causalLowerTriangularMask";

describe("causal-lower-triangular-mask (Causal Lower-Triangular Mask Generator)", () => {
  it("should have correct metadata", () => {
    expect(causalLowerTriangularMask.id).toBe("causal-lower-triangular-mask");
    expect(causalLowerTriangularMask.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(causalLowerTriangularMask.topicIds).toContain("ml_attention_geometry");
    expect(causalLowerTriangularMask.topicIds).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps with matrix visual snapshots", () => {
    const steps = generateCausalLowerTriangularMaskSteps(DEFAULT_CAUSALLOWERTRIANGULARMASK_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Causal Lower-Triangular Mask Generator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");

    // Verify matrix snapshot
    steps.forEach((step) => {
      expect(step.primarySnapshot.kind).toBe("matrix");
    });
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = CAUSALLOWERTRIANGULARMASK_CODE.trim().split("\n");
    const lineExplanations = causalLowerTriangularMask.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
