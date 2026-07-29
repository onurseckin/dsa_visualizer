import { describe, expect, it } from "vitest";
import { batchMlPlatformCapstone } from "../batchMlPlatformCapstone";

describe("batch-ml-platform-capstone", () => {
  it("authors a batch lifecycle rubric and executable sizing evidence", () => {
    expect(batchMlPlatformCapstone).toMatchObject({
      id: "batch-ml-platform-capstone",
      kind: "capstone",
      topicIds: ["ml_platform_capstone"],
      difficultyLabel: "Systems Design",
      difficulty: "Hard",
      assessment: { kind: "capstone", renderer: "capstone-assessment" },
    });
    expect(batchMlPlatformCapstone.rubric.criteria.some((criterion) => criterion.critical)).toBe(
      true,
    );
    const playground = batchMlPlatformCapstone.playground;
    expect(playground).toBeDefined();
    if (!playground) throw new Error("Expected the batch capstone to have a playground");
    expect(playground.execution.cases).toHaveLength(3);
    expect(playground.generateSteps({})).toHaveLength(5);
  });
});
