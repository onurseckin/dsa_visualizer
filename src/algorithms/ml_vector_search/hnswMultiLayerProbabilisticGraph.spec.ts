import { describe, it, expect } from "vitest";
import { hnswMultiLayerProbabilisticGraph } from "./hnswMultiLayerProbabilisticGraph";

describe("hnswMultiLayerProbabilisticGraph", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(hnswMultiLayerProbabilisticGraph).toBeDefined();
    expect(hnswMultiLayerProbabilisticGraph.id).toBe("hnswMultiLayerProbabilisticGraph");
    expect(hnswMultiLayerProbabilisticGraph.isMlInfra).toBe(true);
    expect(hnswMultiLayerProbabilisticGraph.mlInfraLevel).toBe(5);
    expect(hnswMultiLayerProbabilisticGraph.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = hnswMultiLayerProbabilisticGraph.generateSteps(
      hnswMultiLayerProbabilisticGraph.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
