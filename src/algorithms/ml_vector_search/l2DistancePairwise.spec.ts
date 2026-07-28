import { describe, it, expect } from "vitest";
import { l2DistancePairwise } from "./l2DistancePairwise";
import { requireExampleInputs } from "../specs/assertions";

describe("l2-distance-pairwise", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(l2DistancePairwise).toBeDefined();
    expect(l2DistancePairwise.id).toBe("l2-distance-pairwise");
    expect(l2DistancePairwise.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(l2DistancePairwise.topicIds).toContain("ml_vector_search");
  });

  it("should contain clean python code with no comments", () => {
    const code = l2DistancePairwise.code;
    expect(code).not.toContain("#");
    expect(code).not.toContain('"""');
    expect(code).not.toContain("'''");
  });

  it("should generate steps successfully using vector visual snapshot kind", () => {
    const steps = l2DistancePairwise.generateSteps(l2DistancePairwise.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);

    for (const step of steps) {
      expect(step.primarySnapshot.kind).toBe("vector");
    }
  });

  it("should execute generateSteps for all examples without runtime errors", () => {
    for (const input of requireExampleInputs(
      l2DistancePairwise,
      (value): value is typeof l2DistancePairwise.defaultInput =>
        typeof value === "object" && value !== null,
    )) {
      const steps = l2DistancePairwise.generateSteps(input);
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
