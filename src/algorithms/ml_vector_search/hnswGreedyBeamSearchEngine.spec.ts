import { describe, it, expect } from "vitest";
import { requireExampleInputs } from "../specs/assertions";
import {
  hnswGreedyBeamSearchEngine,
  type HnswGreedyBeamSearchEngineInput,
} from "./hnswGreedyBeamSearchEngine";

describe("hnsw-greedy-beam-search-engine", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(hnswGreedyBeamSearchEngine).toBeDefined();
    expect(hnswGreedyBeamSearchEngine.id).toBe("hnsw-greedy-beam-search-engine");
    expect(hnswGreedyBeamSearchEngine.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(hnswGreedyBeamSearchEngine.topicIds).toContain("ml_vector_search");
  });

  it("should contain clean Python code with no comments", () => {
    const code = hnswGreedyBeamSearchEngine.code;
    expect(code).not.toContain("#");
    expect(code).not.toContain('"""');
    expect(code).not.toContain("'''");
  });

  it("should generate steps successfully using graph visual snapshot kind", () => {
    const steps = hnswGreedyBeamSearchEngine.generateSteps(hnswGreedyBeamSearchEngine.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
    expect(steps[0].primarySnapshot.kind).toBe("graph");
  });

  it("should execute step generation for all problem examples without error", () => {
    const inputs = requireExampleInputs(
      hnswGreedyBeamSearchEngine,
      (input): input is HnswGreedyBeamSearchEngineInput => typeof input !== "string",
    );
    for (const input of inputs) {
      expect(hnswGreedyBeamSearchEngine.generateSteps(input).length).toBeGreaterThan(0);
    }
  });
});
