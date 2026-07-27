import { describe, it, expect } from "vitest";
import {
  rejectionSamplingAcceptanceThreshold,
  DEFAULT_REJECTIONSAMPLINGACCEPTANCETHRESHOLD_INPUT,
  generateRejectionSamplingAcceptanceThresholdSteps,
} from "./rejectionSamplingAcceptanceThreshold";

describe("rejection-sampling-acceptance-threshold (Modified Rejection Sampling Acceptance Verifier)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(rejectionSamplingAcceptanceThreshold.id).toBe("rejection-sampling-acceptance-threshold");
    expect(rejectionSamplingAcceptanceThreshold.isMlInfra).toBe(true);
    expect(rejectionSamplingAcceptanceThreshold.mlInfraLevel).toBe(12);
    expect(rejectionSamplingAcceptanceThreshold.mlInfraCategory).toBe("ml_llm_serving");
    expect(rejectionSamplingAcceptanceThreshold.categories).toContain("ml_llm_serving");
    expect(rejectionSamplingAcceptanceThreshold.defaultInput).toEqual(
      DEFAULT_REJECTIONSAMPLINGACCEPTANCETHRESHOLD_INPUT,
    );

    const codeLines = rejectionSamplingAcceptanceThreshold.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      rejectionSamplingAcceptanceThreshold.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(rejectionSamplingAcceptanceThreshold.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate valid algorithm steps and produce >= 20 steps", () => {
    const steps = generateRejectionSamplingAcceptanceThresholdSteps(
      DEFAULT_REJECTIONSAMPLINGACCEPTANCETHRESHOLD_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].codeLine).toBe(1);
    expect(steps[steps.length - 1].codeLine).toBe(13);
  });
});
