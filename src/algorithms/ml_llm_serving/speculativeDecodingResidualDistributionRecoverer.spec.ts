import { describe, it, expect } from "vitest";
import {
  speculativeDecodingResidualDistributionRecoverer,
  DEFAULT_SPECULATIVEDECODINGRESIDUALDISTRIBUTIONRECOVERER_INPUT,
  generateSpeculativeDecodingResidualDistributionRecovererSteps,
} from "./speculativeDecodingResidualDistributionRecoverer";

describe("speculative-decoding-residual-distribution-recoverer (Speculative Decoding Residual Distribution Recovery Engine)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(speculativeDecodingResidualDistributionRecoverer.id).toBe(
      "speculative-decoding-residual-distribution-recoverer",
    );
    expect(speculativeDecodingResidualDistributionRecoverer.isMlInfra).toBe(true);
    expect(speculativeDecodingResidualDistributionRecoverer.mlInfraLevel).toBe(12);
    expect(speculativeDecodingResidualDistributionRecoverer.mlInfraCategory).toBe("ml_llm_serving");
    expect(speculativeDecodingResidualDistributionRecoverer.categories).toContain("ml_llm_serving");
    expect(speculativeDecodingResidualDistributionRecoverer.defaultInput).toEqual(
      DEFAULT_SPECULATIVEDECODINGRESIDUALDISTRIBUTIONRECOVERER_INPUT,
    );

    const codeLines = speculativeDecodingResidualDistributionRecoverer.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      speculativeDecodingResidualDistributionRecoverer.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(
        speculativeDecodingResidualDistributionRecoverer.trivia?.lineExplanations?.[i],
      ).toBeDefined();
    }
  });

  it("should generate valid algorithm steps and produce >= 20 steps", () => {
    const steps = generateSpeculativeDecodingResidualDistributionRecovererSteps(
      DEFAULT_SPECULATIVEDECODINGRESIDUALDISTRIBUTIONRECOVERER_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].codeLine).toBe(1);
    expect(steps[steps.length - 1].codeLine).toBe(15);
  });
});
