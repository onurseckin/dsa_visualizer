import { describe, it, expect } from "vitest";
import { fullSpeculativeDecodingServingEngine, DEFAULT_FULLSPECULATIVEDECODINGSERVINGENGINE_INPUT, generateFullSpeculativeDecodingServingEngineSteps } from "./fullSpeculativeDecodingServingEngine";

describe("full-speculative-decoding-serving-engine (Full Speculative Decoding Production Serving Engine)", () => {
  it("should have correct metadata", () => {
    expect(fullSpeculativeDecodingServingEngine.id).toBe("full-speculative-decoding-serving-engine");
    expect(fullSpeculativeDecodingServingEngine.isMlInfra).toBe(true);
    expect(fullSpeculativeDecodingServingEngine.mlInfraLevel).toBe(12);
    expect(fullSpeculativeDecodingServingEngine.mlInfraCategory).toBe("ml_llm_serving");
    expect(fullSpeculativeDecodingServingEngine.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFullSpeculativeDecodingServingEngineSteps(DEFAULT_FULLSPECULATIVEDECODINGSERVINGENGINE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Full Speculative Decoding Production Serving Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
