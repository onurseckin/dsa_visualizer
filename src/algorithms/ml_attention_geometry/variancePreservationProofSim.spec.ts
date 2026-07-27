import { describe, it, expect } from "vitest";
import {
  variancePreservationProofSim,
  DEFAULT_VARIANCEPRESERVATIONPROOFSIM_INPUT,
  generateVariancePreservationProofSimSteps,
} from "./variancePreservationProofSim";

describe("variance-preservation-proof-sim (Attention Variance Preservation Simulator)", () => {
  it("should have correct metadata", () => {
    expect(variancePreservationProofSim.id).toBe("variance-preservation-proof-sim");
    expect(variancePreservationProofSim.isMlInfra).toBe(true);
    expect(variancePreservationProofSim.mlInfraLevel).toBe(7);
    expect(variancePreservationProofSim.mlInfraCategory).toBe("ml_attention_geometry");
    expect(variancePreservationProofSim.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateVariancePreservationProofSimSteps(
      DEFAULT_VARIANCEPRESERVATIONPROOFSIM_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Attention Variance Preservation Simulator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
