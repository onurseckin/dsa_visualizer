import { describe, it, expect } from "vitest";
import {
  kvCacheSequenceMemoryEstimator,
  DEFAULT_KVCACHESEQUENCEMEMORYESTIMATOR_INPUT,
  generateKvCacheSequenceMemoryEstimatorSteps,
} from "./kvCacheSequenceMemoryEstimator";

describe("kv-cache-sequence-memory-estimator (KV-Cache Sequence Memory Footprint Calculator)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(kvCacheSequenceMemoryEstimator.id).toBe("kv-cache-sequence-memory-estimator");
    expect(
      kvCacheSequenceMemoryEstimator.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(kvCacheSequenceMemoryEstimator.topicIds).toContain("ml_llm_serving");
    expect(kvCacheSequenceMemoryEstimator.topicIds).toContain("ml_llm_serving");
    expect(kvCacheSequenceMemoryEstimator.defaultInput).toEqual(
      DEFAULT_KVCACHESEQUENCEMEMORYESTIMATOR_INPUT,
    );

    const codeLines = kvCacheSequenceMemoryEstimator.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      kvCacheSequenceMemoryEstimator.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(kvCacheSequenceMemoryEstimator.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate valid algorithm steps and produce >= 20 steps", () => {
    const steps = generateKvCacheSequenceMemoryEstimatorSteps(
      DEFAULT_KVCACHESEQUENCEMEMORYESTIMATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].codeLine).toBe(1);
    expect(steps[steps.length - 1].explanation.what).toBe("Return completed estimation dictionary");
  });
});
