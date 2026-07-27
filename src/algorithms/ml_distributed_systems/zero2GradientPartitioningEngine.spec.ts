import { describe, it, expect } from "vitest";
import { zero2GradientPartitioningEngine, DEFAULT_ZERO2GRADIENTPARTITIONINGENGINE_INPUT, generateZero2GradientPartitioningEngineSteps } from "./zero2GradientPartitioningEngine";

describe("zero2-gradient-partitioning-engine (DeepSpeed ZeRO-2 Gradient Partitioning Engine)", () => {
  it("should have correct metadata", () => {
    expect(zero2GradientPartitioningEngine.id).toBe("zero2-gradient-partitioning-engine");
    expect(zero2GradientPartitioningEngine.isMlInfra).toBe(true);
    expect(zero2GradientPartitioningEngine.mlInfraLevel).toBe(11);
    expect(zero2GradientPartitioningEngine.mlInfraCategory).toBe("ml_distributed_systems");
    expect(zero2GradientPartitioningEngine.categories).toContain("ml_distributed_systems");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateZero2GradientPartitioningEngineSteps(DEFAULT_ZERO2GRADIENTPARTITIONINGENGINE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("DeepSpeed ZeRO-2 Gradient Partitioning Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
