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
    expect(playground.generateSteps({})).toHaveLength(4);
  });
});
