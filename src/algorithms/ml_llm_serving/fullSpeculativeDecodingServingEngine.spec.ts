import { describe, it, expect } from "vitest";
import {
  fullSpeculativeDecodingServingEngine,
  DEFAULT_FULLSPECULATIVEDECODINGSERVINGENGINE_INPUT,
  generateFullSpeculativeDecodingServingEngineSteps,
} from "./fullSpeculativeDecodingServingEngine";

describe("full-speculative-decoding-serving-engine (Full Speculative Decoding Production Serving Engine)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(fullSpeculativeDecodingServingEngine.id).toBe(
      "full-speculative-decoding-serving-engine",
    );
    expect(
      fullSpeculativeDecodingServingEngine.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(fullSpeculativeDecodingServingEngine.topicIds).toContain("ml_llm_serving");
    expect(fullSpeculativeDecodingServingEngine.topicIds).toContain("ml_llm_serving");
    expect(fullSpeculativeDecodingServingEngine.defaultInput).toEqual(
      DEFAULT_FULLSPECULATIVEDECODINGSERVINGENGINE_INPUT,
    );

    const codeLines = fullSpeculativeDecodingServingEngine.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      fullSpeculativeDecodingServingEngine.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(fullSpeculativeDecodingServingEngine.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate valid algorithm steps and produce >= 20 steps", () => {
    const steps = generateFullSpeculativeDecodingServingEngineSteps(
      DEFAULT_FULLSPECULATIVEDECODINGSERVINGENGINE_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].codeLine).toBe(1);
    expect(steps[steps.length - 1].codeLine).toBe(14);
  });
});
