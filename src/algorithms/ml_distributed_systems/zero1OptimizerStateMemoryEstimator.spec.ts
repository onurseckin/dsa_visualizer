import { describe, it, expect } from "vitest";
import { zero1OptimizerStateMemoryEstimator, DEFAULT_ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_INPUT, generateZero1OptimizerStateMemoryEstimatorSteps } from "./zero1OptimizerStateMemoryEstimator";

describe("zero1-optimizer-state-memory-estimator (DeepSpeed ZeRO-1 Optimizer State Sharding Estimator)", () => {
  it("should have correct metadata", () => {
    expect(zero1OptimizerStateMemoryEstimator.id).toBe("zero1-optimizer-state-memory-estimator");
    expect(zero1OptimizerStateMemoryEstimator.isMlInfra).toBe(true);
    expect(zero1OptimizerStateMemoryEstimator.mlInfraLevel).toBe(11);
    expect(zero1OptimizerStateMemoryEstimator.mlInfraCategory).toBe("ml_distributed_systems");
    expect(zero1OptimizerStateMemoryEstimator.categories).toContain("ml_distributed_systems");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateZero1OptimizerStateMemoryEstimatorSteps(DEFAULT_ZERO1OPTIMIZERSTATEMEMORYESTIMATOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("DeepSpeed ZeRO-1 Optimizer State Sharding Estimator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
