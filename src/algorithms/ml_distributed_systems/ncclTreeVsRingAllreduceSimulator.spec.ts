import { describe, it, expect } from "vitest";
import {
  ncclTreeVsRingAllreduceSimulator,
  NCCLTREEVSRINGALLREDUCESIMULATOR_CODE,
  DEFAULT_NCCLTREEVSRINGALLREDUCESIMULATOR_INPUT,
  generateNcclTreeVsRingAllreduceSimulatorSteps,
} from "./ncclTreeVsRingAllreduceSimulator";

describe("nccl-tree-vs-ring-allreduce-simulator (NCCL Tree vs Ring-AllReduce Topology Simulator)", () => {
  it("should have correct metadata", () => {
    expect(ncclTreeVsRingAllreduceSimulator.id).toBe("nccl-tree-vs-ring-allreduce-simulator");
    expect(
      ncclTreeVsRingAllreduceSimulator.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(ncclTreeVsRingAllreduceSimulator.topicIds).toContain("ml_distributed_systems");
    expect(ncclTreeVsRingAllreduceSimulator.topicIds).toContain("ml_distributed_systems");
  });

  it("should generate >= 20 algorithm steps", () => {
    const steps = generateNcclTreeVsRingAllreduceSimulatorSteps(
      DEFAULT_NCCLTREEVSRINGALLREDUCESIMULATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Import Math Module");
    expect(steps[steps.length - 1].explanation.what).toBe("Return Topology Evaluation Dictionary");
  });

  it("should have lineExplanations mapping every code line", () => {
    const codeLines = NCCLTREEVSRINGALLREDUCESIMULATOR_CODE.trimEnd().split("\n").length;
    const explanations = ncclTreeVsRingAllreduceSimulator.trivia?.lineExplanations || {};
    expect(Object.keys(explanations).length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(explanations[i]).toBeDefined();
    }
  });
});
