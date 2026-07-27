import { describe, it, expect } from "vitest";
import {
  ncclTreeVsRingAllreduceSimulator,
  DEFAULT_NCCLTREEVSRINGALLREDUCESIMULATOR_INPUT,
  generateNcclTreeVsRingAllreduceSimulatorSteps,
} from "./ncclTreeVsRingAllreduceSimulator";

describe("nccl-tree-vs-ring-allreduce-simulator (NCCL Tree vs Ring-AllReduce Topology Simulator)", () => {
  it("should have correct metadata", () => {
    expect(ncclTreeVsRingAllreduceSimulator.id).toBe("nccl-tree-vs-ring-allreduce-simulator");
    expect(ncclTreeVsRingAllreduceSimulator.isMlInfra).toBe(true);
    expect(ncclTreeVsRingAllreduceSimulator.mlInfraLevel).toBe(11);
    expect(ncclTreeVsRingAllreduceSimulator.mlInfraCategory).toBe("ml_distributed_systems");
    expect(ncclTreeVsRingAllreduceSimulator.categories).toContain("ml_distributed_systems");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateNcclTreeVsRingAllreduceSimulatorSteps(
      DEFAULT_NCCLTREEVSRINGALLREDUCESIMULATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("NCCL Tree vs Ring-AllReduce Topology Simulator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
