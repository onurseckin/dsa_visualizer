import { describe, it, expect } from "vitest";
import {
  kvCacheSequenceMemoryEstimator,
  DEFAULT_KVCACHESEQUENCEMEMORYESTIMATOR_INPUT,
  generateKvCacheSequenceMemoryEstimatorSteps,
} from "./kvCacheSequenceMemoryEstimator";

describe("kv-cache-sequence-memory-estimator (KV-Cache Sequence Memory Footprint Calculator)", () => {
  it("should have correct metadata", () => {
    expect(kvCacheSequenceMemoryEstimator.id).toBe("kv-cache-sequence-memory-estimator");
    expect(kvCacheSequenceMemoryEstimator.isMlInfra).toBe(true);
    expect(kvCacheSequenceMemoryEstimator.mlInfraLevel).toBe(12);
    expect(kvCacheSequenceMemoryEstimator.mlInfraCategory).toBe("ml_llm_serving");
    expect(kvCacheSequenceMemoryEstimator.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateKvCacheSequenceMemoryEstimatorSteps(
      DEFAULT_KVCACHESEQUENCEMEMORYESTIMATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("KV-Cache Sequence Memory Footprint Calculator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
