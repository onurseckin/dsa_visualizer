import { describe, it, expect } from "vitest";
import { requireExampleInputs } from "../specs/assertions";
import {
  hnswHeuristicSpatialPruning,
  type HnswHeuristicSpatialPruningInput,
} from "./hnswHeuristicSpatialPruning";

describe("hnsw-heuristic-spatial-pruning", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(hnswHeuristicSpatialPruning).toBeDefined();
    expect(hnswHeuristicSpatialPruning.id).toBe("hnsw-heuristic-spatial-pruning");
    expect(hnswHeuristicSpatialPruning.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(hnswHeuristicSpatialPruning.topicIds).toContain("ml_vector_search");
  });

  it("should contain clean python code with no comments", () => {
    const code = hnswHeuristicSpatialPruning.code;
    expect(code).not.toContain("#");
    expect(code).not.toContain('"""');
    expect(code).not.toContain("'''");
  });

  it("should generate steps successfully using vector visual snapshot kind", () => {
    const steps = hnswHeuristicSpatialPruning.generateSteps(
      hnswHeuristicSpatialPruning.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);

    const codeLines = hnswHeuristicSpatialPruning.code.split("\n");
    for (const step of steps) {
      expect(step.primarySnapshot.kind).toBe("vector");
      expect(step.codeLine).toBeGreaterThan(0);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
      expect(step.explanation.what).toBeTruthy();
      expect(step.explanation.why).toBeTruthy();
    }
  });

  it("should execute generateSteps for all examples without runtime errors", () => {
    const inputs = requireExampleInputs(
      hnswHeuristicSpatialPruning,
      (input): input is HnswHeuristicSpatialPruningInput => typeof input !== "string",
    );
    for (const input of inputs) {
      expect(hnswHeuristicSpatialPruning.generateSteps(input).length).toBeGreaterThan(0);
    }
  });
});
