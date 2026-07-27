import { describe, it, expect } from "vitest";
import {
  variancePreservationProofSim,
  DEFAULT_VARIANCEPRESERVATIONPROOFSIM_INPUT,
  generateVariancePreservationProofSimSteps,
  VARIANCEPRESERVATIONPROOFSIM_CODE,
} from "./variancePreservationProofSim";

describe("variance-preservation-proof-sim (Attention Variance Preservation Simulator)", () => {
  it("should have correct metadata", () => {
    expect(variancePreservationProofSim.id).toBe("variance-preservation-proof-sim");
    expect(variancePreservationProofSim.isMlInfra).toBe(true);
    expect(variancePreservationProofSim.mlInfraLevel).toBe(7);
    expect(variancePreservationProofSim.mlInfraCategory).toBe("ml_attention_geometry");
    expect(variancePreservationProofSim.categories).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps with matrix visual snapshots", () => {
    const steps = generateVariancePreservationProofSimSteps(
      DEFAULT_VARIANCEPRESERVATIONPROOFSIM_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain(
      "Initialize Attention Variance Preservation Simulator",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");

    steps.forEach((step) => {
      expect(step.primarySnapshot.kind).toBe("matrix");
    });
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = VARIANCEPRESERVATIONPROOFSIM_CODE.trim().split("\n");
    const lineExplanations = variancePreservationProofSim.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
