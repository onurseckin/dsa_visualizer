import { describe, it, expect } from "vitest";
import {
  fullRingAllreduceCollectiveSimulator,
  FULLRINGALLREDUCECOLLECTIVESIMULATOR_CODE,
  DEFAULT_FULLRINGALLREDUCECOLLECTIVESIMULATOR_INPUT,
  generateFullRingAllreduceCollectiveSimulatorSteps,
} from "./fullRingAllreduceCollectiveSimulator";

describe("full-ring-allreduce-collective-simulator (Full Ring-AllReduce Collective Communication Simulator)", () => {
  it("should have correct metadata", () => {
    expect(fullRingAllreduceCollectiveSimulator.id).toBe(
      "full-ring-allreduce-collective-simulator",
    );
    expect(
      fullRingAllreduceCollectiveSimulator.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(fullRingAllreduceCollectiveSimulator.topicIds).toContain("ml_distributed_systems");
    expect(fullRingAllreduceCollectiveSimulator.topicIds).toContain("ml_distributed_systems");
  });

  it("should generate >= 20 algorithm steps", () => {
    const steps = generateFullRingAllreduceCollectiveSimulatorSteps(
      DEFAULT_FULLRINGALLREDUCECOLLECTIVESIMULATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Enter full_ring_allreduce_collective_simulator");
    expect(steps[steps.length - 1].explanation.what).toBe(
      "Return Fully Reduced & Synchronized Shard Buffers",
    );
  });

  it("should have lineExplanations mapping every code line", () => {
    const codeLines = FULLRINGALLREDUCECOLLECTIVESIMULATOR_CODE.trimEnd().split("\n").length;
    const explanations = fullRingAllreduceCollectiveSimulator.trivia?.lineExplanations || {};
    expect(Object.keys(explanations).length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(explanations[i]).toBeDefined();
    }
  });
});
