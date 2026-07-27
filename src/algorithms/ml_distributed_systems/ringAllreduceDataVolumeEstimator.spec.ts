import { describe, it, expect } from "vitest";
import {
  ringAllreduceDataVolumeEstimator,
  DEFAULT_RINGALLREDUCEDATAVOLUMEESTIMATOR_INPUT,
  generateRingAllreduceDataVolumeEstimatorSteps,
} from "./ringAllreduceDataVolumeEstimator";

describe("ring-allreduce-data-volume-estimator (Ring-AllReduce Total Data Volume Estimator)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(ringAllreduceDataVolumeEstimator.id).toBe("ring-allreduce-data-volume-estimator");
    expect(ringAllreduceDataVolumeEstimator.isMlInfra).toBe(true);
    expect(ringAllreduceDataVolumeEstimator.mlInfraLevel).toBe(11);
    expect(ringAllreduceDataVolumeEstimator.mlInfraCategory).toBe("ml_distributed_systems");
    expect(ringAllreduceDataVolumeEstimator.categories).toContain("ml_distributed_systems");
    expect(ringAllreduceDataVolumeEstimator.defaultInput).toEqual(
      DEFAULT_RINGALLREDUCEDATAVOLUMEESTIMATOR_INPUT,
    );

    const codeLines = ringAllreduceDataVolumeEstimator.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      ringAllreduceDataVolumeEstimator.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(ringAllreduceDataVolumeEstimator.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate >= 20 algorithm steps", () => {
    const steps = generateRingAllreduceDataVolumeEstimatorSteps(
      DEFAULT_RINGALLREDUCEDATAVOLUMEESTIMATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Initialize");
    expect(steps[steps.length - 1].explanation.what).toContain("Return");
  });
});
