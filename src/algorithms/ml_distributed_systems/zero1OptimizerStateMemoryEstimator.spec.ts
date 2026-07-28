import { describe, it, expect } from "vitest";
import {
  zero1OptimizerStateMemoryEstimator,
  DEFAULT_ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_INPUT,
  generateZero1OptimizerStateMemoryEstimatorSteps,
} from "./zero1OptimizerStateMemoryEstimator";

describe("zero1-optimizer-state-memory-estimator", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(zero1OptimizerStateMemoryEstimator.id).toBe("zero1-optimizer-state-memory-estimator");
    expect(
      zero1OptimizerStateMemoryEstimator.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(zero1OptimizerStateMemoryEstimator.topicIds).toContain("ml_distributed_systems");
    expect(zero1OptimizerStateMemoryEstimator.topicIds).toContain("ml_distributed_systems");
    expect(zero1OptimizerStateMemoryEstimator.defaultInput).toEqual(
      DEFAULT_ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_INPUT,
    );

    const codeLines = zero1OptimizerStateMemoryEstimator.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      zero1OptimizerStateMemoryEstimator.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(zero1OptimizerStateMemoryEstimator.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate >= 20 algorithm steps", () => {
    const steps = generateZero1OptimizerStateMemoryEstimatorSteps(
      DEFAULT_ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Initialize");
    expect(steps[steps.length - 1].explanation.what).toContain("Return");
  });
});
