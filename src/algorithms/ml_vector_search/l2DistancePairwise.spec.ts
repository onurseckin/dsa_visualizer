import { describe, it, expect } from "vitest";
import { l2DistancePairwise } from "./l2DistancePairwise";

describe("l2DistancePairwise", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(l2DistancePairwise).toBeDefined();
    expect(l2DistancePairwise.id).toBe("l2DistancePairwise");
    expect(l2DistancePairwise.isMlInfra).toBe(true);
    expect(l2DistancePairwise.mlInfraLevel).toBe(5);
    expect(l2DistancePairwise.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = l2DistancePairwise.generateSteps(l2DistancePairwise.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
