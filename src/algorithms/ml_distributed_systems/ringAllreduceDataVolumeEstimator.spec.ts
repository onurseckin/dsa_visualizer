import { describe, it, expect } from "vitest";
import { ringAllreduceDataVolumeEstimator, DEFAULT_RINGALLREDUCEDATAVOLUMEESTIMATOR_INPUT, generateRingAllreduceDataVolumeEstimatorSteps } from "./ringAllreduceDataVolumeEstimator";

describe("ring-allreduce-data-volume-estimator (Ring-AllReduce Total Data Volume Estimator)", () => {
  it("should have correct metadata", () => {
    expect(ringAllreduceDataVolumeEstimator.id).toBe("ring-allreduce-data-volume-estimator");
    expect(ringAllreduceDataVolumeEstimator.isMlInfra).toBe(true);
    expect(ringAllreduceDataVolumeEstimator.mlInfraLevel).toBe(11);
    expect(ringAllreduceDataVolumeEstimator.mlInfraCategory).toBe("ml_distributed_systems");
    expect(ringAllreduceDataVolumeEstimator.categories).toContain("ml_distributed_systems");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateRingAllreduceDataVolumeEstimatorSteps(DEFAULT_RINGALLREDUCEDATAVOLUMEESTIMATOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Ring-AllReduce Total Data Volume Estimator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
