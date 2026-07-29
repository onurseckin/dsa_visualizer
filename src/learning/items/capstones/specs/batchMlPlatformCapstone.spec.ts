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
    const firstCaseSteps = playground.generateSteps(playground.execution.cases[0]!.input);
    const secondCaseSteps = playground.generateSteps(playground.execution.cases[1]!.input);
    expect(firstCaseSteps[0]!.primarySnapshot).not.toEqual(secondCaseSteps[0]!.primarySnapshot);
    expect(JSON.stringify(firstCaseSteps[0]!.primarySnapshot)).toContain("Frame · 86400/day");
    const firstCaseVisuals = JSON.stringify(firstCaseSteps);
    expect(firstCaseVisuals).toContain("24 rps");
    expect(firstCaseVisuals).toContain("2 workers");
    expect(firstCaseVisuals).toContain("120960000 bytes");
    expect(JSON.stringify(secondCaseSteps)).toContain("Operate · backfill 0d");
    expect(firstCaseSteps).not.toEqual(secondCaseSteps);
    expect(batchMlPlatformCapstone.rubric.criteria).toContainEqual(
      expect.objectContaining({ id: "tradeoff-reasoning" }),
    );
  });
});
