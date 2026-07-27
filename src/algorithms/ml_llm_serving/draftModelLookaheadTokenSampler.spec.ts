import { describe, it, expect } from "vitest";
import {
  draftModelLookaheadTokenSampler,
  DEFAULT_DRAFTMODELLOOKAHEADTOKENSAMPLER_INPUT,
  generateDraftModelLookaheadTokenSamplerSteps,
} from "./draftModelLookaheadTokenSampler";

describe("draft-model-lookahead-token-sampler (Speculative Decoding Draft Token Sampler)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(draftModelLookaheadTokenSampler.id).toBe("draft-model-lookahead-token-sampler");
    expect(draftModelLookaheadTokenSampler.isMlInfra).toBe(true);
    expect(draftModelLookaheadTokenSampler.mlInfraLevel).toBe(12);
    expect(draftModelLookaheadTokenSampler.mlInfraCategory).toBe("ml_llm_serving");
    expect(draftModelLookaheadTokenSampler.categories).toContain("ml_llm_serving");
    expect(draftModelLookaheadTokenSampler.defaultInput).toEqual(
      DEFAULT_DRAFTMODELLOOKAHEADTOKENSAMPLER_INPUT,
    );

    const codeLines = draftModelLookaheadTokenSampler.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      draftModelLookaheadTokenSampler.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(draftModelLookaheadTokenSampler.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate valid algorithm steps and produce >= 20 steps", () => {
    const steps = generateDraftModelLookaheadTokenSamplerSteps(
      DEFAULT_DRAFTMODELLOOKAHEADTOKENSAMPLER_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].codeLine).toBe(3);
    expect(steps[steps.length - 1].codeLine).toBe(30);
  });
});
