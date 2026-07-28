import { describe, it, expect } from "vitest";
import {
  ringAllreduceDataVolumeEstimator,
  DEFAULT_RINGALLREDUCEDATAVOLUMEESTIMATOR_INPUT,
  generateRingAllreduceDataVolumeEstimatorSteps,
} from "./ringAllreduceDataVolumeEstimator";

describe("ring-allreduce-data-volume-estimator (Ring-AllReduce Total Data Volume Estimator)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(ringAllreduceDataVolumeEstimator.id).toBe("ring-allreduce-data-volume-estimator");
    expect(
      ringAllreduceDataVolumeEstimator.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(ringAllreduceDataVolumeEstimator.topicIds).toContain("ml_distributed_systems");
    expect(ringAllreduceDataVolumeEstimator.topicIds).toContain("ml_distributed_systems");
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

  it("should teach each closed-form Ring-AllReduce calculation phase", () => {
    const steps = generateRingAllreduceDataVolumeEstimatorSteps(
      DEFAULT_RINGALLREDUCEDATAVOLUMEESTIMATOR_INPUT,
    );
    expect(steps).toHaveLength(9);
    expect(steps[0].explanation.what).toContain("Initialize");
    expect(steps.some((step) => step.explanation.what.includes("Scatter-Reduce"))).toBe(true);
    expect(steps.some((step) => step.explanation.what.includes("All-Gather"))).toBe(true);
    expect(steps[steps.length - 1].explanation.what).toContain("Return");
  });
});
