import { describe, it, expect } from "vitest";
import {
  zero2GradientPartitioningEngine,
  DEFAULT_ZERO2GRADIENTPARTITIONINGENGINE_INPUT,
  generateZero2GradientPartitioningEngineSteps,
} from "./zero2GradientPartitioningEngine";

describe("zero2-gradient-partitioning-engine (DeepSpeed ZeRO-2 Gradient Partitioning Engine)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(zero2GradientPartitioningEngine.id).toBe("zero2-gradient-partitioning-engine");
    expect(zero2GradientPartitioningEngine.isMlInfra).toBe(true);
    expect(zero2GradientPartitioningEngine.mlInfraLevel).toBe(11);
    expect(zero2GradientPartitioningEngine.mlInfraCategory).toBe("ml_distributed_systems");
    expect(zero2GradientPartitioningEngine.categories).toContain("ml_distributed_systems");
    expect(zero2GradientPartitioningEngine.defaultInput).toEqual(
      DEFAULT_ZERO2GRADIENTPARTITIONINGENGINE_INPUT,
    );

    const codeLines = zero2GradientPartitioningEngine.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      zero2GradientPartitioningEngine.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(zero2GradientPartitioningEngine.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate >= 20 algorithm steps", () => {
    const steps = generateZero2GradientPartitioningEngineSteps(
      DEFAULT_ZERO2GRADIENTPARTITIONINGENGINE_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Initialize");
    expect(steps[steps.length - 1].explanation.what).toContain("Return");
  });
});
