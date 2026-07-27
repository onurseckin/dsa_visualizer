import { describe, it, expect } from "vitest";
import { hnswGreedyBeamSearchEngine } from "./hnswGreedyBeamSearchEngine";

describe("hnswGreedyBeamSearchEngine", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(hnswGreedyBeamSearchEngine).toBeDefined();
    expect(hnswGreedyBeamSearchEngine.id).toBe("hnswGreedyBeamSearchEngine");
    expect(hnswGreedyBeamSearchEngine.isMlInfra).toBe(true);
    expect(hnswGreedyBeamSearchEngine.mlInfraLevel).toBe(5);
    expect(hnswGreedyBeamSearchEngine.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = hnswGreedyBeamSearchEngine.generateSteps(hnswGreedyBeamSearchEngine.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
