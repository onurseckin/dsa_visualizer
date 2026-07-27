import { describe, it, expect } from "vitest";
import { hnswHeuristicSpatialPruning } from "./hnswHeuristicSpatialPruning";

describe("hnswHeuristicSpatialPruning", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(hnswHeuristicSpatialPruning).toBeDefined();
    expect(hnswHeuristicSpatialPruning.id).toBe("hnswHeuristicSpatialPruning");
    expect(hnswHeuristicSpatialPruning.isMlInfra).toBe(true);
    expect(hnswHeuristicSpatialPruning.mlInfraLevel).toBe(5);
    expect(hnswHeuristicSpatialPruning.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = hnswHeuristicSpatialPruning.generateSteps(
      hnswHeuristicSpatialPruning.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
