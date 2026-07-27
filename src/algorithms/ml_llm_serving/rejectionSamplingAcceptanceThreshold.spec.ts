import { describe, it, expect } from "vitest";
import { rejectionSamplingAcceptanceThreshold, DEFAULT_REJECTIONSAMPLINGACCEPTANCETHRESHOLD_INPUT, generateRejectionSamplingAcceptanceThresholdSteps } from "./rejectionSamplingAcceptanceThreshold";

describe("rejection-sampling-acceptance-threshold (Modified Rejection Sampling Acceptance Verifier)", () => {
  it("should have correct metadata", () => {
    expect(rejectionSamplingAcceptanceThreshold.id).toBe("rejection-sampling-acceptance-threshold");
    expect(rejectionSamplingAcceptanceThreshold.isMlInfra).toBe(true);
    expect(rejectionSamplingAcceptanceThreshold.mlInfraLevel).toBe(12);
    expect(rejectionSamplingAcceptanceThreshold.mlInfraCategory).toBe("ml_llm_serving");
    expect(rejectionSamplingAcceptanceThreshold.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateRejectionSamplingAcceptanceThresholdSteps(DEFAULT_REJECTIONSAMPLINGACCEPTANCETHRESHOLD_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Modified Rejection Sampling Acceptance Verifier");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
