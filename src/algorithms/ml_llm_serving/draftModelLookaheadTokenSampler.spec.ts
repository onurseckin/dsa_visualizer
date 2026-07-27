import { describe, it, expect } from "vitest";
import {
  draftModelLookaheadTokenSampler,
  DEFAULT_DRAFTMODELLOOKAHEADTOKENSAMPLER_INPUT,
  generateDraftModelLookaheadTokenSamplerSteps,
} from "./draftModelLookaheadTokenSampler";

describe("draft-model-lookahead-token-sampler (Speculative Decoding Draft Token Sampler)", () => {
  it("should have correct metadata", () => {
    expect(draftModelLookaheadTokenSampler.id).toBe("draft-model-lookahead-token-sampler");
    expect(draftModelLookaheadTokenSampler.isMlInfra).toBe(true);
    expect(draftModelLookaheadTokenSampler.mlInfraLevel).toBe(12);
    expect(draftModelLookaheadTokenSampler.mlInfraCategory).toBe("ml_llm_serving");
    expect(draftModelLookaheadTokenSampler.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateDraftModelLookaheadTokenSamplerSteps(
      DEFAULT_DRAFTMODELLOOKAHEADTOKENSAMPLER_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Speculative Decoding Draft Token Sampler");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
