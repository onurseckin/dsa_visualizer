import { describe, expect, it } from "vitest";
import { realtimeMlPlatformCapstone } from "../realtimeMlPlatformCapstone";

describe("realtime-ml-platform-capstone", () => {
  it("keeps capacity evidence separate from the qualitative system design", () => {
    expect(realtimeMlPlatformCapstone).toMatchObject({
      id: "realtime-ml-platform-capstone",
      kind: "capstone",
      topicIds: ["ml_platform_capstone"],
      assessment: { triviaEligible: false },
    });
    expect(realtimeMlPlatformCapstone).not.toHaveProperty("code");
    const playground = realtimeMlPlatformCapstone.playground;
    expect(playground).toBeDefined();
    if (!playground) throw new Error("Expected the real-time capstone to have a playground");
    expect(playground.code).toContain("def plan_realtime_capacity");
    expect(playground.execution.outputContract).toContain("p99 latency headroom");
    const steps = playground.generateSteps({});
    expect(steps).toHaveLength(5);
    expect(steps[2]?.primarySnapshot).toMatchObject({
      nodes: expect.arrayContaining([
        expect.objectContaining({ id: "data", state: "sorted" }),
        expect.objectContaining({ id: "train", state: "active" }),
      ]),
      edges: expect.arrayContaining([{ from: "data", to: "train", isTraversed: true }]),
    });
    const firstCaseSteps = playground.generateSteps(playground.execution.cases[0]!.input);
    const secondCaseSteps = playground.generateSteps(playground.execution.cases[1]!.input);
    expect(firstCaseSteps[0]!.primarySnapshot).not.toEqual(secondCaseSteps[0]!.primarySnapshot);
    expect(JSON.stringify(firstCaseSteps[0]!.primarySnapshot)).toContain("Frame · 500 rps");
    expect(JSON.stringify(secondCaseSteps[0]!.primarySnapshot)).toContain("Frame · 1 rps");
    const firstCaseVisuals = JSON.stringify(firstCaseSteps);
    expect(firstCaseVisuals).toContain("7 replicas");
    expect(firstCaseVisuals).toContain("700 rps provisioned");
    expect(firstCaseVisuals).toContain("0.7143 utilization");
    expect(firstCaseVisuals).toContain("70 ms headroom");
    expect(firstCaseSteps).not.toEqual(secondCaseSteps);
    expect(realtimeMlPlatformCapstone.rubric.criteria).toContainEqual(
      expect.objectContaining({ id: "governance-security-cost", critical: true }),
    );
    expect(realtimeMlPlatformCapstone.rubric.criteria).toContainEqual(
      expect.objectContaining({ id: "tradeoff-reasoning" }),
    );
  });
});
