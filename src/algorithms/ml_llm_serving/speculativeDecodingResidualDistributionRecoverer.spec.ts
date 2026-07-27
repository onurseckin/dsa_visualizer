import { describe, it, expect } from "vitest";
import {
  speculativeDecodingResidualDistributionRecoverer,
  DEFAULT_SPECULATIVEDECODINGRESIDUALDISTRIBUTIONRECOVERER_INPUT,
  generateSpeculativeDecodingResidualDistributionRecovererSteps,
} from "./speculativeDecodingResidualDistributionRecoverer";

describe("speculative-decoding-residual-distribution-recoverer (Speculative Decoding Residual Distribution Recovery Engine)", () => {
  it("should have correct metadata", () => {
    expect(speculativeDecodingResidualDistributionRecoverer.id).toBe(
      "speculative-decoding-residual-distribution-recoverer",
    );
    expect(speculativeDecodingResidualDistributionRecoverer.isMlInfra).toBe(true);
    expect(speculativeDecodingResidualDistributionRecoverer.mlInfraLevel).toBe(12);
    expect(speculativeDecodingResidualDistributionRecoverer.mlInfraCategory).toBe("ml_llm_serving");
    expect(speculativeDecodingResidualDistributionRecoverer.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateSpeculativeDecodingResidualDistributionRecovererSteps(
      DEFAULT_SPECULATIVEDECODINGRESIDUALDISTRIBUTIONRECOVERER_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain(
      "Speculative Decoding Residual Distribution Recovery Engine",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
