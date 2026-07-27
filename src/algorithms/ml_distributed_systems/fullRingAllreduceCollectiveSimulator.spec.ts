import { describe, it, expect } from "vitest";
import {
  fullRingAllreduceCollectiveSimulator,
  DEFAULT_FULLRINGALLREDUCECOLLECTIVESIMULATOR_INPUT,
  generateFullRingAllreduceCollectiveSimulatorSteps,
} from "./fullRingAllreduceCollectiveSimulator";

describe("full-ring-allreduce-collective-simulator (Full Ring-AllReduce Collective Communication Simulator)", () => {
  it("should have correct metadata", () => {
    expect(fullRingAllreduceCollectiveSimulator.id).toBe(
      "full-ring-allreduce-collective-simulator",
    );
    expect(fullRingAllreduceCollectiveSimulator.isMlInfra).toBe(true);
    expect(fullRingAllreduceCollectiveSimulator.mlInfraLevel).toBe(11);
    expect(fullRingAllreduceCollectiveSimulator.mlInfraCategory).toBe("ml_distributed_systems");
    expect(fullRingAllreduceCollectiveSimulator.categories).toContain("ml_distributed_systems");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFullRingAllreduceCollectiveSimulatorSteps(
      DEFAULT_FULLRINGALLREDUCECOLLECTIVESIMULATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain(
      "Full Ring-AllReduce Collective Communication Simulator",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
